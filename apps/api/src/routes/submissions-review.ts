import { Hono } from 'hono'
import { and, count, desc, eq, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import type { AuthVariables } from '../middleware/auth.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
import {
  isValidImageKey,
  PENDING_CARD_VARIANT,
  publicUrlForKey,
  requestOrigin,
} from '../lib/storage.js'
import type { db } from '../db/client.js'

// The knutesjef review side of /api/submissions: the pending queue, its badge
// count, approve and reject. Split out of submissions.ts (which kept the
// student submit flow) when that file hit the 300-line route ceiling.
//
// NO auth()/tenantContext() here ON PURPOSE: this router is composed into
// submissionRoutes (routes/submissions.ts) BELOW its auth + tenant .use()
// lines, so every route here already runs behind them. Do not mount this
// router anywhere else. requireRole stays per-route — a router-level .use()
// would also run for fall-through requests to the student routes and 403 them.

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

// Cursor = createdAt ISO of the last item on the previous page — the same
// contract as /api/feed. A timestamp-only cursor can skip an item on an
// exact-microsecond tie; acceptable for a review queue (pull-to-refresh
// reconciles, and nothing is lost — the row stays pending).
const pendingQuerySchema = z.object({
  cursor: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export const submissionReviewRoutes = new Hono<{ Variables: Variables }>()

  // GET /api/submissions/pending — knutesjef sees the school's pending queue,
  // newest first, cursor-paginated (default 20, max 50 — same contract as
  // /api/feed). Joins russenavn + knute title/points for one-shot display
  // (no N+1). Served by the partial index submissions_pending_idx
  // (school_id, created_at DESC) WHERE status = 'pending'.
  .get(
    '/pending',
    requireRole('knutesjef', 'admin'),
    zValidator('query', pendingQuerySchema, (result, c) => {
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
      const { cursor, limit } = c.req.valid('query')

      const conditions = [
        eq(submissions.schoolId, schoolId),
        eq(submissions.status, 'pending'),
      ]
      if (cursor) {
        conditions.push(lt(submissions.createdAt, new Date(cursor)))
      }

      // Fetch one extra row to know whether another page exists.
      const rows = await tx
        .select({
          id: submissions.id,
          userId: submissions.userId,
          knuteId: submissions.knuteId,
          imageKey: submissions.imageKey,
          caption: submissions.caption,
          createdAt: submissions.createdAt,
          russenavn: users.russenavn,
          knuteTitle: knuter.title,
          knutePoints: knuter.points,
          evidenceType: knuter.evidenceType,
        })
        .from(submissions)
        .innerJoin(users, eq(users.id, submissions.userId))
        .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
        .where(and(...conditions))
        .orderBy(desc(submissions.createdAt))
        .limit(limit + 1)

      const hasMore = rows.length > limit
      const page = hasMore ? rows.slice(0, limit) : rows
      const nextCursor = hasMore ? page[page.length - 1]!.createdAt.toISOString() : null

      // Resolve each stored key to a loadable URL (null for legacy placeholder keys
      // that aren't real uploads — the client shows a placeholder for those). The
      // queue shows card-sized photos, so ask for the card variant — a no-op until
      // the Bunny Optimizer add-on is enabled.
      const origin = requestOrigin(c.req.url)
      const withUrls = page.map((r) => ({
        ...r,
        imageUrl:
          r.imageKey && isValidImageKey(r.imageKey)
            ? publicUrlForKey(r.imageKey, origin, PENDING_CARD_VARIANT)
            : null,
      }))

      return c.json({ submissions: withUrls, nextCursor })
    },
  )

  // GET /api/submissions/pending/count — the queue badge (tab bar + knutesjef
  // panel). The list endpoint is paginated, so badges use this count(*) instead
  // of downloading the whole queue to measure its length. Same partial index.
  .get('/pending/count', requireRole('knutesjef', 'admin'), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')

    const [row] = await tx
      .select({ count: count() })
      .from(submissions)
      .where(and(eq(submissions.schoolId, schoolId), eq(submissions.status, 'pending')))

    return c.json({ count: row?.count ?? 0 })
  })

  // PATCH /api/submissions/:id/approve — knutesjef approves a pending submission.
  // Multi-table transaction: flip status + record reviewer + award points to user.
  .patch(
    '/:id/approve',
    requireRole('knutesjef', 'admin'),
    zValidator('param', z.object({ id: z.string().uuid() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const reviewerId = c.get('userId')
      const { id } = c.req.valid('param')

      // Load the submission + the knute's points in one query. RLS scopes
      // to this school; an id from another school yields zero rows → 404.
      const found = await tx
        .select({
          submissionUserId: submissions.userId,
          submissionStatus: submissions.status,
          knutePoints: knuter.points,
        })
        .from(submissions)
        .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .limit(1)
      if (found.length === 0) throw new NotFoundError('Submission')
      const row = found[0]!

      if (row.submissionStatus !== 'pending') {
        // Idempotency-ish — already reviewed. Treat as 404 to avoid leaking
        // the prior state to the client.
        throw new NotFoundError('Submission')
      }

      // Atomic guard against a double-approval race (S0-7): two knutesjefer can
      // both read 'pending' above, but only ONE UPDATE will match status='pending'
      // and flip the row. The other returns zero rows → we must NOT award points
      // again. Points are awarded only when this UPDATE actually transitioned a row.
      const updatedRows = await tx
        .update(submissions)
        .set({
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(submissions.id, id),
            eq(submissions.schoolId, schoolId),
            eq(submissions.status, 'pending'),
          ),
        )
        .returning()
      if (updatedRows.length === 0) {
        // Another reviewer approved/rejected it between our read and this write.
        throw new NotFoundError('Submission')
      }
      const updated = updatedRows[0]!

      await tx
        .update(users)
        .set({ points: sql`${users.points} + ${row.knutePoints}` })
        .where(and(eq(users.id, row.submissionUserId), eq(users.schoolId, schoolId)))

      return c.json({ submission: updated })
    },
  )

  // PATCH /api/submissions/:id/reject — knutesjef rejects. No points awarded.
  .patch(
    '/:id/reject',
    requireRole('knutesjef', 'admin'),
    zValidator('param', z.object({ id: z.string().uuid() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const reviewerId = c.get('userId')
      const { id } = c.req.valid('param')

      const found = await tx
        .select({ status: submissions.status })
        .from(submissions)
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .limit(1)
      if (found.length === 0 || found[0]!.status !== 'pending') {
        throw new NotFoundError('Submission')
      }

      const [updated] = await tx
        .update(submissions)
        .set({
          status: 'rejected',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .returning()

      return c.json({ submission: updated })
    },
  )
