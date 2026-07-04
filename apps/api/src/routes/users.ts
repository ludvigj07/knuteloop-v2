import { Hono } from 'hono'
import { and, desc, eq, gt, isNull, lt, lte, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter, schoolClasses, submissions, users } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import { getRankTitle } from '../lib/rank-titles.js'
import {
  PROFILE_GRID_VARIANT,
  isValidImageKey,
  publicUrlForKey,
  requestOrigin,
} from '../lib/storage.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

// Public profiles WITHIN a school — «stalke»-flyten: tap a russ on the
// leaderboard/feed and see who they are. Two endpoints so the client can
// useQuery the header and useInfiniteQuery the grid independently.
//
// Privacy rules (locked with Ludvig 2026-07-05):
//   - NO per-category aggregates (sensitive folders — sex-ringer etc. — are
//     never exposed on someone else's profile; own-profile only).
//   - The grid shows exactly what the feed already shows: APPROVED submissions,
//     age-gated for the VIEWER. Nothing becomes visible here that wasn't
//     already visible in the feed — this is a re-grouping, not a new exposure.
//   - Tenant-scoped everywhere: another school's user id → 404, never 403
//     (no existence leak).

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 50

const paramSchema = z.object({ id: z.string().uuid() })

// Same cursor contract as the feed: createdAt ISO timestamp of the last item.
const gridQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export const usersRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/users/:id — the profile header: identity + headline stats.
  .get('/:id', zValidator('param', paramSchema), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const { id } = c.req.valid('param')

    // Soft-deleted users are gone from the product surface → 404.
    const [target] = await tx
      .select({
        id: users.id,
        russenavn: users.russenavn,
        role: users.role,
        russType: users.russType,
        quote: users.quote,
        points: users.points,
        className: schoolClasses.name,
      })
      .from(users)
      .leftJoin(schoolClasses, eq(schoolClasses.id, users.classId))
      .where(and(eq(users.id, id), eq(users.schoolId, schoolId), isNull(users.deletedAt)))
      .limit(1)

    if (!target) throw new NotFoundError('User')

    // Rank without loading the whole leaderboard: 1 + how many active users
    // sort ahead of the target. MUST mirror routes/leaderboard.ts ordering
    // exactly (points DESC, russenavn ASC tiebreak) or the two surfaces would
    // show different ranks for the same russ.
    const [ahead] = await tx
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(users)
      .where(
        and(
          eq(users.schoolId, schoolId),
          isNull(users.deletedAt),
          or(
            gt(users.points, target.points),
            and(eq(users.points, target.points), lt(users.russenavn, target.russenavn)),
          ),
        ),
      )
    const rank = (ahead?.count ?? 0) + 1

    // Same distinct-knute aggregates as /api/me (flag-based gold, all-time).
    const [agg] = await tx
      .select({
        completed: sql<number>`cast(count(distinct ${submissions.knuteId}) as int)`,
        gold: sql<number>`cast(count(distinct ${submissions.knuteId}) filter (where ${knuter.isGold}) as int)`,
      })
      .from(submissions)
      .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
      .where(
        and(
          eq(submissions.schoolId, schoolId),
          eq(submissions.userId, id),
          eq(submissions.status, 'approved'),
        ),
      )

    return c.json({
      user: {
        ...target,
        rank,
        rankTitle: getRankTitle(rank),
        completedCount: agg?.completed ?? 0,
        goldCount: agg?.gold ?? 0,
      },
    })
  })

  // GET /api/users/:id/submissions — the profile grid: the user's APPROVED
  // submissions, newest first, cursor-paginated (feed contract). Age-gated for
  // the VIEWER exactly like the feed (ADR-0015): a non-adult never sees 18+
  // knuter here either.
  .get(
    '/:id/submissions',
    zValidator('param', paramSchema),
    zValidator('query', gridQuerySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          { error: { message: 'Invalid input', issues: result.error.flatten() } },
          400,
        )
      }
      return undefined
    }),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const viewerId = c.get('userId')
      const { id } = c.req.valid('param')
      const { cursor, limit } = c.req.valid('query')

      // Same existence rules as the header: wrong tenant or deleted → 404,
      // so the grid can never be probed for users the header denies.
      const [target] = await tx
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.id, id), eq(users.schoolId, schoolId), isNull(users.deletedAt)))
        .limit(1)
      if (!target) throw new NotFoundError('User')

      const conditions = [
        eq(submissions.schoolId, schoolId),
        eq(submissions.userId, id),
        eq(submissions.status, 'approved'),
      ]
      if (cursor) conditions.push(lt(submissions.createdAt, new Date(cursor)))

      // Viewer age gate — mirrors routes/feed.ts. Fail-safe: missing viewer
      // row is treated as non-adult.
      const [viewer] = await tx
        .select({ isAdult: users.isAdult })
        .from(users)
        .where(and(eq(users.id, viewerId), eq(users.schoolId, schoolId)))
        .limit(1)
      if (!viewer?.isAdult) conditions.push(lte(knuter.minAge, 17))

      // One extra row to know whether another page exists.
      const rows = await tx
        .select({
          id: submissions.id,
          imageKey: submissions.imageKey,
          caption: submissions.caption,
          createdAt: submissions.createdAt,
          knuteTitle: knuter.title,
          knutePoints: knuter.points,
          evidenceType: knuter.evidenceType,
          isGold: knuter.isGold,
        })
        .from(submissions)
        .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
        .where(and(...conditions))
        .orderBy(desc(submissions.createdAt))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null

      const origin = requestOrigin(c.req.url)
      const items = page.map((r) => ({
        ...r,
        imageUrl:
          r.imageKey && isValidImageKey(r.imageKey)
            ? publicUrlForKey(r.imageKey, origin, PROFILE_GRID_VARIANT)
            : null,
      }))

      return c.json({ submissions: items, nextCursor })
    },
  )
