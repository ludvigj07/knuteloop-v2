import { Hono } from 'hono'
import { and, eq, sql } from 'drizzle-orm'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { knuter } from '../db/schema/index.js'
import { pickDagensKnute } from '../lib/dagens-knute.js'
import { knuteAgeGate } from '../lib/knute-age-gate.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

// GET /api/knuter/dagens — the deterministic daily pick (v1-spec §3 with the
// Oslo fix): sort the pool by (id, title nb) and take daySeed % length, where
// daySeed = YYYYMMDD of the CURRENT Europe/Oslo day — computed in SQL, never
// from the host clock (that was a v1 bug). The pool matches the caller's
// student catalog (active + age gate, ADR-0015), so a minor is never shown an
// 18+ pick; the pick is deterministic per (school, Oslo day, age pool).
// Calm surface (ADR-0023): a quiet suggestion — no countdown, no pressure.
//
// Own file (split out of routes/knuter.ts at the 300-line mark, backend.md §2).
// Mounted on /api/knuter BEFORE knuterRoutes so a future GET /:id there can
// never swallow /dagens.
export const knuterDagensRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())

  .get('/dagens', async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const userId = c.get('userId')

    const conditions = [eq(knuter.schoolId, schoolId), eq(knuter.isActive, true)]
    const ageGate = await knuteAgeGate(tx, schoolId, userId)
    if (ageGate) conditions.push(ageGate)

    const pool = await tx
      .select({
        id: knuter.id,
        title: knuter.title,
        description: knuter.description,
        points: knuter.points,
      })
      .from(knuter)
      .where(and(...conditions))

    const seedResult = await tx.execute(
      sql`SELECT to_char(now() AT TIME ZONE 'Europe/Oslo', 'YYYYMMDD')::int AS seed`,
    )
    const daySeed = (seedResult as unknown as Array<{ seed: number }>)[0]?.seed ?? null
    return c.json({ dagens: daySeed === null ? null : pickDagensKnute(pool, daySeed) })
  })
