import { Hono } from 'hono'
import { and, eq, inArray, lte } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuter, knuteFolderMemberships, submissions, users } from '../db/schema/index.js'
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
  // Knutesjef marks special knuter as gold. Explicit flag, not a points rule.
  isGold: z.boolean().default(false),
})

const updateKnuteSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    points: z.number().int().min(0).max(1000).optional(),
    difficulty: z.enum(['Lett', 'Medium', 'Hard', 'Valgfri']).optional(),
    isGold: z.boolean().optional(),
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
    zValidator('query', z.object({ all: z.string().optional(), folderId: z.string().uuid().optional() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const userId = c.get('userId')
      const role = c.get('role')
      const { all, folderId } = c.req.valid('query')
      // The ?all=1 management view (inactive included, no age filter) is for
      // knutesjef/admin only — a student passing all=1 still gets the gated catalog.
      const isManager = role === 'knutesjef' || role === 'admin'
      const includeInactive = isManager && (all === '1' || all === 'true')

      const conditions = [eq(knuter.schoolId, schoolId)]
      if (!includeInactive) conditions.push(eq(knuter.isActive, true))

      // ?folderId — narrow to the knuter in that folder (ADR-0014). "Alle knuter"
      // is just the absence of this filter.
      if (folderId) {
        const members = await tx
          .select({ knuteId: knuteFolderMemberships.knuteId })
          .from(knuteFolderMemberships)
          .where(
            and(
              eq(knuteFolderMemberships.schoolId, schoolId),
              eq(knuteFolderMemberships.folderId, folderId),
            ),
          )
        const ids = members.map((m) => m.knuteId)
        if (ids.length === 0) return c.json({ knuter: [] })
        conditions.push(inArray(knuter.id, ids))
      }

      // Age gate (ADR-0015): in the student catalog, non-adults see only all-ages
      // knuter (min_age <= 17). The manager view is unfiltered (they curate 18+).
      if (!includeInactive) {
        const [me] = await tx
          .select({ isAdult: users.isAdult })
          .from(users)
          .where(and(eq(users.id, userId), eq(users.schoolId, schoolId)))
          .limit(1)
        if (!me?.isAdult) conditions.push(lte(knuter.minAge, 17))
      }

      // myStatus = the CALLER's active submission for each knute ('pending' |
      // 'approved' | null). Drives the tatt/ikke-tatt marking in the student
      // catalog. The partial unique index (school, user, knute) WHERE status IN
      // ('pending','approved') guarantees at most ONE such row per knute, so
      // this LEFT JOIN can never fan out. Rejected does not count as taken —
      // the student can retry, so the knute reads as available again.
      const rows = await tx
        .select({
          id: knuter.id,
          title: knuter.title,
          description: knuter.description,
          points: knuter.points,
          difficulty: knuter.difficulty,
          evidenceType: knuter.evidenceType,
          minAge: knuter.minAge,
          isGold: knuter.isGold,
          isActive: knuter.isActive,
          createdAt: knuter.createdAt,
          myStatus: submissions.status,
        })
        .from(knuter)
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

      // folderIds per knute (which knutemapper it sits in) — one batched query
      // + an in-memory group, NOT a per-row lookup. Powers the folder chips in
      // the Alle-view and the manage-sheet's pre-checked state.
      const knuteIds = rows.map((r) => r.id)
      const memberships = knuteIds.length
        ? await tx
            .select({
              knuteId: knuteFolderMemberships.knuteId,
              folderId: knuteFolderMemberships.folderId,
            })
            .from(knuteFolderMemberships)
            .where(
              and(
                eq(knuteFolderMemberships.schoolId, schoolId),
                inArray(knuteFolderMemberships.knuteId, knuteIds),
              ),
            )
        : []
      const foldersByKnute = new Map<string, string[]>()
      for (const m of memberships) {
        const list = foldersByKnute.get(m.knuteId)
        if (list) list.push(m.folderId)
        else foldersByKnute.set(m.knuteId, [m.folderId])
      }

      return c.json({
        knuter: rows.map((r) => ({ ...r, folderIds: foldersByKnute.get(r.id) ?? [] })),
      })
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
          isGold: input.isGold,
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
        isGold?: boolean
        isActive?: boolean
        updatedAt: Date
      } = { updatedAt: new Date() }
      if (input.title !== undefined) patch.title = input.title
      if (input.description !== undefined) patch.description = input.description
      if (input.points !== undefined) patch.points = input.points
      if (input.difficulty !== undefined) patch.difficulty = input.difficulty
      if (input.isGold !== undefined) patch.isGold = input.isGold
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
