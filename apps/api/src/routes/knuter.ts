import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter } from '../db/schema/index.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

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
