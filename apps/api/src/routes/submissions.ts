import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter, submissions, users } from '../db/schema/index.js'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js'
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
  // ADR-0021: which submit button was pressed — «Del i feeden» (shared) or
  // «Send inn» (private). Optional so pre-visibility clients keep working;
  // omitted → 'private' (privacy by default — never publish by accident).
  visibility: z.enum(['shared', 'private']).optional(),
})

const visibilityPatchSchema = z.object({
  visibility: z.enum(['shared', 'private']),
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
            // schoolId is redundant with RLS + the fact that userId is a global
            // PK — but critical rule 2 is BOTH layers on every tenant query, no
            // exceptions (defense in depth; caught in review 2026-07-24).
            eq(submissions.schoolId, schoolId),
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

      // Two independent evidence axes (ADR-0021 rule 10 + ADR-0022):
      //   VALID (points):    text knute → caption required, photo never accepted
      //                      (content-safety floor, ADR-0019); media knute →
      //                      caption OR image, at least one (v1's low threshold).
      //   SHAREABLE (feed):  media required. Text knuter can never be shared —
      //                      by construction the sensitive content stays off
      //                      every public surface. Enforced HERE, not just in
      //                      the UI: public-surface rules are server-side.
      const visibility = input.visibility ?? 'private'
      let imageKey: string | null
      if (existing.evidenceType === 'text') {
        if (!input.caption) {
          throw new ValidationError('Denne knuten krever en beskrivelse i stedet for bilde')
        }
        if (visibility === 'shared') {
          throw new ValidationError(
            'Denne knuten kan ikke deles i feeden — den sendes bare til knutesjefen',
          )
        }
        imageKey = null
      } else {
        if (!input.imageKey && !input.caption) {
          throw new ValidationError('Legg ved et bilde eller skriv en beskrivelse')
        }
        if (visibility === 'shared' && !input.imageKey) {
          throw new ValidationError('Du må legge ved et bilde for å dele i feeden')
        }
        imageKey = input.imageKey ?? null
      }

      // ADR-0021: born-shared rows get shared_at = now so the feed (which
      // orders by share time) can serve them; private rows get it on first
      // flip in PATCH /:id/visibility below.
      const inserted = await tx
        .insert(submissions)
        .values({
          schoolId,
          userId,
          knuteId: input.knuteId,
          imageKey,
          caption: input.caption ?? null,
          visibility,
          sharedAt: visibility === 'shared' ? new Date() : null,
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

  // PATCH /api/submissions/:id/visibility — the owner changes who may see the
  // evidence, both directions, any status (ADR-0021 rule 6). Sharing a pending
  // submission just means it will appear in the feed once approved.
  //
  // shared_at is first-share-wins: set on the first flip to 'shared', kept on
  // hide/re-share — so re-sharing returns a post to its original feed position
  // instead of bumping it to the top (ADR-0021 rule 7).
  .patch(
    '/:id/visibility',
    zValidator('param', z.object({ id: z.string().uuid() })),
    zValidator('json', visibilityPatchSchema, (result, c) => {
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
      const { id } = c.req.valid('param')
      const { visibility } = c.req.valid('json')

      // Tenant-scoped lookup: another school's submission → zero rows → 404
      // (no existence leak). A same-school non-owner gets an honest 403 —
      // shared posts are already visible in the feed, so existence is public.
      const [row] = await tx
        .select({
          userId: submissions.userId,
          sharedAt: submissions.sharedAt,
          imageKey: submissions.imageKey,
        })
        .from(submissions)
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))
        .limit(1)
      if (!row) throw new NotFoundError('Innsending')
      if (row.userId !== userId) {
        throw new ForbiddenError('Du kan bare endre synlighet på egne innsendinger')
      }

      // ADR-0022: the feed is a visual surface — a submission without media can
      // never become shared (covers both text knuter and caption-only media
      // submissions). Keeps the invariant shared ⇒ image_key IS NOT NULL.
      if (visibility === 'shared' && row.imageKey === null) {
        throw new ValidationError('Innsendinger uten bilde kan ikke deles i feeden')
      }

      const sharedAt = visibility === 'shared' ? (row.sharedAt ?? new Date()) : row.sharedAt
      await tx
        .update(submissions)
        .set({ visibility, sharedAt, updatedAt: new Date() })
        .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))

      return c.json({ id, visibility })
    },
  )

  // Knutesjef review routes (pending/count/approve/reject) — see the header
  // comment in submissions-review.ts for why they carry no own auth/tenant.
  .route('/', submissionReviewRoutes)

