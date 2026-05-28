import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter } from '../db/schema/index.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const createKnuteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  points: z.number().int().min(0).max(1000),
  difficulty: z.enum(['Lett', 'Medium', 'Hard', 'Valgfri']).default('Medium'),
})

export const knuterRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/knuter — list this school's active knuter.
  // RLS enforces school_id isolation; explicit schoolId filter is defense in depth.
  .get('/', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')

    const rows = await tx
      .select({
        id: knuter.id,
        title: knuter.title,
        description: knuter.description,
        points: knuter.points,
        difficulty: knuter.difficulty,
        isActive: knuter.isActive,
        createdAt: knuter.createdAt,
      })
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolId), eq(knuter.isActive, true)))

    return c.json({ knuter: rows })
  })

  // POST /api/knuter — create a new knute for this school.
  // Only knutesjef + admin may create. schoolId comes from the JWT, NEVER
  // from the request body — even if the body included one, we ignore it.
  // RLS WITH CHECK additionally rejects any insert whose school_id doesn't
  // match the active GUC, so a misbehaving handler can't cross-tenant leak.
  .post(
    '/',
    requireRole('knutesjef', 'admin'),
    zValidator('json', createKnuteSchema, (result, c) => {
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
      const input = c.req.valid('json')

      const inserted = await tx
        .insert(knuter)
        .values({
          schoolId,
          title: input.title,
          description: input.description ?? null,
          points: input.points,
          difficulty: input.difficulty,
        })
        .returning()
      const created = inserted[0]!

      return c.json({ knute: created }, 201)
    },
  )
