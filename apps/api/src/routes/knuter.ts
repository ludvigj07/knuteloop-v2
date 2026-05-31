import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter } from '../db/schema/index.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'
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

const updateKnuteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    points: z.number().int().min(0).max(1000).optional(),
    difficulty: z.enum(['Lett', 'Medium', 'Hard', 'Valgfri']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Minst ett felt må oppgis',
  })

export const knuterRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/knuter — list this school's knuter.
  // Default: active only (what students see in the catalog).
  // ?all=1: include inactive too — used by knutesjef-panel to manage retired knuter.
  .get(
    '/',
    zValidator('query', z.object({ all: z.string().optional() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const { all } = c.req.valid('query')
      const includeInactive = all === '1' || all === 'true'

      const conditions = includeInactive
        ? [eq(knuter.schoolId, schoolId)]
        : [eq(knuter.schoolId, schoolId), eq(knuter.isActive, true)]

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
        .where(and(...conditions))

      return c.json({ knuter: rows })
    },
  )

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

  // PATCH /api/knuter/:id — knutesjef updates a knute's fields.
  // Send only the fields that should change. isActive=false soft-retires
  // a knute so it no longer appears in the student catalog but existing
  // submissions still resolve their title/points via the FK.
  .patch(
    '/:id',
    requireRole('knutesjef', 'admin'),
    zValidator('param', z.object({ id: z.string().uuid() })),
    zValidator('json', updateKnuteSchema, (result, c) => {
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
      const { id } = c.req.valid('param')
      const input = c.req.valid('json')

      const patch: {
        title?: string
        description?: string | null
        points?: number
        difficulty?: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
        isActive?: boolean
        updatedAt: Date
      } = { updatedAt: new Date() }
      if (input.title !== undefined) patch.title = input.title
      if (input.description !== undefined) patch.description = input.description
      if (input.points !== undefined) patch.points = input.points
      if (input.difficulty !== undefined) patch.difficulty = input.difficulty
      if (input.isActive !== undefined) patch.isActive = input.isActive

      if (Object.keys(patch).length === 1) {
        // Only updatedAt — no real changes. Should be caught by Zod refine
        // already, but guard belt-and-suspenders for clarity.
        throw new ValidationError('Minst ett felt må oppgis')
      }

      const updated = await tx
        .update(knuter)
        .set(patch)
        .where(and(eq(knuter.id, id), eq(knuter.schoolId, schoolId)))
        .returning()

      if (updated.length === 0) throw new NotFoundError('Knute')

      return c.json({ knute: updated[0]! })
    },
  )
