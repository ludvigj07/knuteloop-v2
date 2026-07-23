import { Hono } from 'hono'
import { and, desc, eq, lt, lte } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { isValidImageKey, publicUrlForKey, requestOrigin } from '../lib/storage.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

// Cursor is the sharedAt ISO timestamp of the last item on the previous page
// (the feed's sort key since ADR-0021 — share time, not submit time). Opaque
// to the client: it round-trips whatever nextCursor it received. Timestamp-only
// cursors can skip an item if two submissions share the exact same
// microsecond — acceptable for a social feed (not a ledger).
const feedQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export const feedRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/feed — the school's social feed: approved AND shared submissions
  // (ADR-0021 — private ones are owner+knutesjef only), newest share first,
  // cursor-paginated. Joins russenavn + knute title/points so the client
  // renders each card in one shot (no N+1). Served by the partial index
  // submissions_feed_shared_idx (school_id, shared_at DESC WHERE approved+shared).
  .get(
    '/',
    zValidator('query', feedQuerySchema, (result, c) => {
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
      const userId = c.get('userId')
      const { cursor, limit } = c.req.valid('query')

      const conditions = [
        eq(submissions.schoolId, schoolId),
        eq(submissions.status, 'approved'),
        eq(submissions.visibility, 'shared'),
      ]
      if (cursor) {
        conditions.push(lt(submissions.sharedAt, new Date(cursor)))
      }

      // Age gate (ADR-0015, S0-3): a non-adult viewer must never be served 18+
      // knuter in the feed, even from their own school. Mirrors the student
      // catalog gate in routes/knuter.ts and the submit gate in submissions.ts.
      // Fail-safe: if the viewer row is missing, treat as non-adult.
      const [viewer] = await tx
        .select({ isAdult: users.isAdult })
        .from(users)
        .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
        .limit(1)
      if (!viewer?.isAdult) conditions.push(lte(knuter.minAge, 17))

      // Fetch one extra row to know whether another page exists. sharedAt is
      // selected only to build nextCursor — every row here has it non-null
      // (the WHERE visibility = 'shared' filter + the ADR-0021 invariant).
      const rows = await tx
        .select({
          id: submissions.id,
          userId: submissions.userId,
          imageKey: submissions.imageKey,
          caption: submissions.caption,
          createdAt: submissions.createdAt,
          sharedAt: submissions.sharedAt,
          russenavn: users.russenavn,
          knuteTitle: knuter.title,
          knutePoints: knuter.points,
          evidenceType: knuter.evidenceType,
        })
        .from(submissions)
        .innerJoin(users, eq(users.id, submissions.userId))
        .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
        .where(and(...conditions))
        .orderBy(desc(submissions.sharedAt))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore
        ? (page[page.length - 1]!.sharedAt?.toISOString() ?? null)
        : null

      // Resolve each stored key to a loadable URL (null for legacy placeholder
      // keys — the client shows a placeholder for those).
      const origin = requestOrigin(c.req.url)
      const feed = page.map((r) => ({
        ...r,
        imageUrl:
          r.imageKey && isValidImageKey(r.imageKey) ? publicUrlForKey(r.imageKey, origin) : null,
      }))

      return c.json({ feed, nextCursor })
    },
  )
