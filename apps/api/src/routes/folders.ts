import { Hono } from 'hono'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { FOLDER_ICON_KEYS } from '@knuteloop/shared'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import { knuteFolders, knuteFolderMemberships, knuter } from '../db/schema/index.js'
import { ConflictError, NotFoundError } from '../lib/errors.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const idParam = z.object({ id: z.string().uuid() })
const iconSchema = z.enum(FOLDER_ICON_KEYS)
const createFolderSchema = z.object({
  name: z.string().trim().min(1).max(100),
  icon: iconSchema.optional(),
})
const updateFolderSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    icon: iconSchema.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Minst ett felt må oppgis' })

// Per-school folders (ADR-0014). Knutesjef/admin manage them; any member reads.
// "Alle knuter" is implicit (the unfiltered catalog), so it is NOT a folder here.
export const folderRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  // GET /api/folders — the school's folders, each with its knute count.
  .get('/', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')

    const rows = await tx
      .select({
        id: knuteFolders.id,
        name: knuteFolders.name,
        icon: knuteFolders.icon,
        sortOrder: knuteFolders.sortOrder,
        knuteCount: sql<number>`cast(count(${knuteFolderMemberships.id}) as int)`,
      })
      .from(knuteFolders)
      .leftJoin(knuteFolderMemberships, eq(knuteFolderMemberships.folderId, knuteFolders.id))
      .where(eq(knuteFolders.schoolId, schoolId))
      .groupBy(knuteFolders.id)
      .orderBy(knuteFolders.sortOrder, knuteFolders.name)

    return c.json({ folders: rows })
  })

  // POST /api/folders — create a folder.
  .post(
    '/',
    requireRole('knutesjef', 'admin'),
    zValidator('json', createFolderSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Invalid input', issues: result.error.flatten() } }, 400)
      }
      return undefined
    }),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const { name, icon } = c.req.valid('json')
      const [dupe] = await tx
        .select({ id: knuteFolders.id })
        .from(knuteFolders)
        .where(and(eq(knuteFolders.schoolId, schoolId), eq(knuteFolders.name, name)))
        .limit(1)
      if (dupe) throw new ConflictError('En mappe med dette navnet finnes allerede')

      const [created] = await tx
        .insert(knuteFolders)
        .values({ schoolId, name, icon: icon ?? null })
        .returning()
      return c.json({ folder: created }, 201)
    },
  )

  // PATCH /api/folders/:id — rename and/or reorder.
  .patch(
    '/:id',
    requireRole('knutesjef', 'admin'),
    zValidator('param', idParam),
    zValidator('json', updateFolderSchema, (result, c) => {
      if (!result.success) {
        return c.json({ error: { message: 'Invalid input', issues: result.error.flatten() } }, 400)
      }
      return undefined
    }),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const { id } = c.req.valid('param')
      const input = c.req.valid('json')

      const patch: { name?: string; sortOrder?: number; icon?: string; updatedAt: Date } = {
        updatedAt: new Date(),
      }
      if (input.name !== undefined) patch.name = input.name
      if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder
      if (input.icon !== undefined) patch.icon = input.icon

      if (input.name !== undefined) {
        const [dupe] = await tx
          .select({ id: knuteFolders.id })
          .from(knuteFolders)
          .where(
            and(
              eq(knuteFolders.schoolId, schoolId),
              eq(knuteFolders.name, input.name),
              ne(knuteFolders.id, id),
            ),
          )
          .limit(1)
        if (dupe) throw new ConflictError('En mappe med dette navnet finnes allerede')
      }

      const updated = await tx
        .update(knuteFolders)
        .set(patch)
        .where(and(eq(knuteFolders.id, id), eq(knuteFolders.schoolId, schoolId)))
        .returning()
      if (updated.length === 0) throw new NotFoundError('Folder')
      return c.json({ folder: updated[0]! })
    },
  )

  // DELETE /api/folders/:id — remove the folder. Its memberships cascade away;
  // the knuter themselves stay (still in the implicit "Alle knuter" view).
  .delete('/:id', requireRole('knutesjef', 'admin'), zValidator('param', idParam), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const { id } = c.req.valid('param')

    const deleted = await tx
      .delete(knuteFolders)
      .where(and(eq(knuteFolders.id, id), eq(knuteFolders.schoolId, schoolId)))
      .returning({ id: knuteFolders.id })
    if (deleted.length === 0) throw new NotFoundError('Folder')
    return c.json({ deleted: id })
  })

  // POST /api/folders/:id/knuter — add a knute to the folder.
  .post(
    '/:id/knuter',
    requireRole('knutesjef', 'admin'),
    zValidator('param', idParam),
    zValidator('json', z.object({ knuteId: z.string().uuid() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const { id: folderId } = c.req.valid('param')
      const { knuteId } = c.req.valid('json')

      // Folder + knute must both exist in this school (RLS + explicit filter).
      const [folder] = await tx
        .select({ id: knuteFolders.id })
        .from(knuteFolders)
        .where(and(eq(knuteFolders.id, folderId), eq(knuteFolders.schoolId, schoolId)))
        .limit(1)
      if (!folder) throw new NotFoundError('Folder')
      const [k] = await tx
        .select({ id: knuter.id })
        .from(knuter)
        .where(and(eq(knuter.id, knuteId), eq(knuter.schoolId, schoolId)))
        .limit(1)
      if (!k) throw new NotFoundError('Knute')

      const [existingMember] = await tx
        .select({ id: knuteFolderMemberships.id })
        .from(knuteFolderMemberships)
        .where(
          and(
            eq(knuteFolderMemberships.schoolId, schoolId),
            eq(knuteFolderMemberships.folderId, folderId),
            eq(knuteFolderMemberships.knuteId, knuteId),
          ),
        )
        .limit(1)
      if (existingMember) throw new ConflictError('Knuten ligger allerede i mappa')

      const [created] = await tx
        .insert(knuteFolderMemberships)
        .values({ schoolId, folderId, knuteId })
        .returning()
      return c.json({ membership: created }, 201)
    },
  )

  // DELETE /api/folders/:id/knuter/:knuteId — remove a knute from the folder.
  .delete(
    '/:id/knuter/:knuteId',
    requireRole('knutesjef', 'admin'),
    zValidator('param', z.object({ id: z.string().uuid(), knuteId: z.string().uuid() })),
    async (c) => {
      const tx = c.get('tx')
      const schoolId = c.get('schoolId')
      const { id: folderId, knuteId } = c.req.valid('param')

      const deleted = await tx
        .delete(knuteFolderMemberships)
        .where(
          and(
            eq(knuteFolderMemberships.folderId, folderId),
            eq(knuteFolderMemberships.knuteId, knuteId),
            eq(knuteFolderMemberships.schoolId, schoolId),
          ),
        )
        .returning({ id: knuteFolderMemberships.id })
      if (deleted.length === 0) throw new NotFoundError('Membership')
      return c.json({ removed: knuteId })
    },
  )
