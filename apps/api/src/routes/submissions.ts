import { Hono } from 'hono'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

// imageKey is the Bunny storage key. For now we accept any non-empty string;
// when Bunny ships, the handler will additionally HEAD-check the object exists.
const createSubmissionSchema = z.object({
  knuteId: z.string().uuid(),
  imageKey: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(500).optional(),
})

export const submissionRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // POST /api/submissions — student submits proof that a knute is complete.
  // Any authenticated user can submit; userId + schoolId come from the JWT.
  // The knute must exist within this school — RLS would block via FK
  // validation anyway, but we explicit-check first for a clean 404 response.
  .post(
    '/',
    zValidator('json', createSubmissionSchema, (result, c) => {
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
      const userId = c.get('userId')
      const schoolId = c.get('schoolId')
      const input = c.req.valid('json')

      // Verify the knute exists AND belongs to this school. RLS filters the
      // SELECT to current school automatically, so a cross-tenant knute_id
      // yields zero rows → 404. The same constraint is enforced again by
      // the FK + RLS on insert (defense in depth).
      const existing = await tx
        .select({ id: knuter.id })
        .from(knuter)
        .where(eq(knuter.id, input.knuteId))
        .limit(1)
      if (existing.length === 0) {
        throw new NotFoundError('Knute')
      }

      // Block re-submission if there's already an active pending or approved
      // submission for this (user, knute). Rejected submissions are allowed
      // to re-submit (lets students fix bad evidence). The 24h cooldown
      // pattern from v1 spec §8 / scoring rules is a future iteration.
      const prior = await tx
        .select({ status: submissions.status })
        .from(submissions)
        .where(
          and(
            eq(submissions.userId, userId),
            eq(submissions.knuteId, input.knuteId),
            inArray(submissions.status, ['pending', 'approved']),
          ),
        )
        .limit(1)
      if (prior.length > 0) {
        throw new ConflictError(
          prior[0]!.status === 'pending'
            ? 'Du har allerede sendt inn denne — venter på godkjenning'
            : 'Du har allerede fått godkjent denne knuten',
        )
      }

      const inserted = await tx
        .insert(submissions)
        .values({
          schoolId,
          userId,
          knuteId: input.knuteId,
          imageKey: input.imageKey,
          caption: input.caption ?? null,
        })
        .returning()
      const created = inserted[0]!

      return c.json({ submission: created }, 201)
    },
  )

  // GET /api/submissions/pending — knutesjef sees the school's pending queue.
  // Joins russenavn + knute title/points for one-shot display (no N+1).
  .get('/pending', requireRole('knutesjef', 'admin'), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')

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
      })
      .from(submissions)
      .innerJoin(users, eq(users.id, submissions.userId))
      .innerJoin(knuter, eq(knuter.id, submissions.knuteId))
      .where(
        and(
          eq(submissions.schoolId, schoolId),
          eq(submissions.status, 'pending'),
        ),
      )
      .orderBy(desc(submissions.createdAt))

    return c.json({ submissions: rows })
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

      const [updated] = await tx
        .update(submissions)
        .set({
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .returning()

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
