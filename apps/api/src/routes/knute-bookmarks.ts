import { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuteBookmarks, knuter, submissions } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import { knuteAgeGate } from '../lib/knute-age-gate.js'
import type { SchoolId, UserId } from '../lib/ids.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

type Tx = Variables['tx']

const knuteParamSchema = z.object({ id: z.string().uuid() })

// Whether the caller may see this knute at all: it must belong to their school,
// be active, and — for a non-adult — be all-ages (ADR-0015). Bookmarking must
// not become a side door around the age gate: a minor who guesses an 18+
// knute's id gets the same 404 the catalog gives them.
async function findVisibleKnute(tx: Tx, schoolId: SchoolId, userId: UserId, knuteId: string) {
  const conditions = [
    eq(knuter.id, knuteId),
    eq(knuter.schoolId, schoolId),
    eq(knuter.isActive, true),
  ]
  const ageGate = await knuteAgeGate(tx, schoolId, userId)
  if (ageGate) conditions.push(ageGate)

  const [row] = await tx
    .select({ id: knuter.id })
    .from(knuter)
    .where(and(...conditions))
    .limit(1)

  return row ?? null
}

// Bookmarks: a student saving a knute they want to do later, so one spotted in
// the feed is not lost in the catalog afterwards. Private to the owner — no
// counts, nothing published (ADR-0023: no public reaction mechanics).
//
// Mounted on /api/knuter alongside knuterRoutes, which is already near the
// 300-line split threshold (backend.md §2). Mount this router FIRST so
// GET /api/knuter/bookmarks is never swallowed by a future GET /:id.
export const knuteBookmarkRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/knuter/bookmarks — the caller's own bookmarked knuter, newest
  // bookmark first. Filtered the same way the catalog is (active + age gate),
  // so a knute the knutesjef retires quietly drops out of the list rather than
  // becoming an un-openable row.
  .get('/bookmarks', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const userId = c.get('userId')

    const conditions = [
      eq(knuteBookmarks.schoolId, schoolId),
      eq(knuteBookmarks.userId, userId),
      eq(knuter.isActive, true),
    ]
    const ageGate = await knuteAgeGate(tx, schoolId, userId)
    if (ageGate) conditions.push(ageGate)

    // myStatus = the caller's active submission for each knute, so the list can
    // mark what is already taken — same meaning as in the catalog. The partial
    // unique index (school, user, knute) WHERE status IN ('pending','approved')
    // guarantees at most one such row, so this LEFT JOIN cannot fan out.
    const rows = await tx
      .select({
        id: knuter.id,
        title: knuter.title,
        description: knuter.description,
        points: knuter.points,
        evidenceType: knuter.evidenceType,
        minAge: knuter.minAge,
        isGold: knuter.isGold,
        isActive: knuter.isActive,
        createdAt: knuter.createdAt,
        myStatus: submissions.status,
      })
      .from(knuteBookmarks)
      .innerJoin(knuter, eq(knuter.id, knuteBookmarks.knuteId))
      .leftJoin(
        submissions,
        and(
          eq(submissions.knuteId, knuter.id),
          eq(submissions.schoolId, schoolId),
          eq(submissions.userId, userId),
          inArray(submissions.status, ['pending', 'approved']),
        ),
      )
      .where(and(...conditions))
      .orderBy(desc(knuteBookmarks.createdAt))

    return c.json({ knuter: rows.map((r) => ({ ...r, isBookmarked: true })) })
  })

  // PUT /api/knuter/:id/bookmark — bookmark a knute. Idempotent: bookmarking
  // twice is a no-op, enforced by the (user_id, knute_id) unique constraint
  // rather than a read-then-write race.
  .put('/:id/bookmark', zValidator('param', knuteParamSchema), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const userId = c.get('userId')
    const { id } = c.req.valid('param')

    const knute = await findVisibleKnute(tx, schoolId, userId, id)
    if (!knute) throw new NotFoundError('Knute')

    await tx
      .insert(knuteBookmarks)
      .values({ schoolId, userId, knuteId: id })
      .onConflictDoNothing({ target: [knuteBookmarks.userId, knuteBookmarks.knuteId] })

    return c.body(null, 204)
  })

  // DELETE /api/knuter/:id/bookmark — remove the bookmark. Also idempotent:
  // removing one that is not there succeeds. The client toggles a button; it
  // should never have to care whether its view of the state was stale.
  .delete('/:id/bookmark', zValidator('param', knuteParamSchema), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const userId = c.get('userId')
    const { id } = c.req.valid('param')

    await tx
      .delete(knuteBookmarks)
      .where(
        and(
          eq(knuteBookmarks.schoolId, schoolId),
          eq(knuteBookmarks.userId, userId),
          eq(knuteBookmarks.knuteId, id),
        ),
      )

    return c.body(null, 204)
  })
