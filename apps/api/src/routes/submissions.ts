import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter, submissions } from '../db/schema/index.js'
import { NotFoundError } from '../lib/errors.js'
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
