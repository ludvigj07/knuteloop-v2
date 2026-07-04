import { Hono } from 'hono'
import { and, count, desc, eq, inArray, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js'
import {
  isValidImageKey,
  newSubmissionImageKey,
  PENDING_CARD_VARIANT,
  publicUrlForKey,
  requestOrigin,
  uploadUrlForKey,
} from '../lib/storage.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

// imageKey is the Bunny storage key. For now we accept any non-empty string;
// when Bunny ships, the handler will additionally HEAD-check the object exists.
const createSubmissionSchema = z.object({
  knuteId: z.string().uuid(),
  // Required for 'media' knuter, omitted for 'text' knuter. Which one applies is
  // validated against the knute's evidence_type in the handler (a DB lookup).
  imageKey: z.string().trim().min(1).max(500).optional(),
  caption: z.string().trim().max(500).optional(),
})

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

export const submissionRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // POST /api/submissions/upload-url — issue a one-time image key + the URL the
  // client PUTs the (compressed) photo to, BEFORE creating the submission. The
  // mobile flow is: upload-url → PUT bytes → POST /submissions { imageKey }.
  // The key is a random UUID; in dev the upload URL points back at this API
  // (routes/uploads.ts), in prod it's a Bunny presigned URL.
  .post('/upload-url', (c) => {
    const imageKey = newSubmissionImageKey()
    const uploadUrl = uploadUrlForKey(imageKey, requestOrigin(c.req.url))
    return c.json({ uploadUrl, imageKey })
  })

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
      const [existing] = await tx
        .select({ minAge: knuter.minAge, evidenceType: knuter.evidenceType })
        .from(knuter)
        .where(and(eq(knuter.id, input.knuteId), eq(knuter.schoolId, schoolId)))
        .limit(1)
      if (!existing) {
        throw new NotFoundError('Knute')
      }

      // Age gate (ADR-0015): a minor may not submit an 18+ knute even with the id.
      // 404 (not 403) so we don't reveal that an adult-only knute exists.
      if (existing.minAge >= 18) {
        const [me] = await tx
          .select({ isAdult: users.isAdult })
          .from(users)
          .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
          .limit(1)
        if (!me?.isAdult) throw new NotFoundError('Knute')
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

      // Evidence rule (ADR-0014): a text-only knute takes a written caption as proof
      // (no photo possible/allowed); a media knute requires an uploaded image. Enforced
      // here because it depends on the knute's evidence_type, not just the request shape.
      let imageKey: string | null
      if (existing.evidenceType === 'text') {
        if (!input.caption) {
          throw new ValidationError('Denne knuten krever en beskrivelse i stedet for bilde')
        }
        imageKey = null
      } else {
        if (!input.imageKey) {
          throw new ValidationError('Denne knuten krever et bilde')
        }
        imageKey = input.imageKey
      }

      const inserted = await tx
        .insert(submissions)
        .values({
          schoolId,
          userId,
          knuteId: input.knuteId,
          imageKey,
          caption: input.caption ?? null,
        })
        .returning()
        .catch((err: unknown) => {
          // Duplicate-submission race (S0-8): a concurrent POST inserted the active
          // submission between our read-check above and this insert. The partial
          // unique index (submissions_one_active_per_user_knute_idx) rejects it with
          // Postgres unique_violation (23505) → return the same clean 409.
          if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code?: string }).code === '23505'
          ) {
            throw new ConflictError('Du har allerede sendt inn denne — venter på godkjenning')
          }
          throw err
        })
      const created = inserted[0]!

      return c.json({ submission: created }, 201)
    },
  )

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
