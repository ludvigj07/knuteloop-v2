import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { ConflictError, NotFoundError, ValidationError } from '../lib/errors.js'
import { newSubmissionImageKey, requestOrigin, uploadUrlForKey } from '../lib/storage.js'
import { submissionReviewRoutes } from './submissions-review.js'
import type { db } from '../db/client.js'

// The student submit flow of /api/submissions. The knutesjef review side
// (pending queue, count, approve, reject) lives in submissions-review.ts and
// is composed in at the bottom — AFTER the auth + tenant .use() lines, which
// therefore cover it too.

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

  // Knutesjef review routes (pending/count/approve/reject) — see the header
  // comment in submissions-review.ts for why they carry no own auth/tenant.
  .route('/', submissionReviewRoutes)

