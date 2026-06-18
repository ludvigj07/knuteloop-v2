import { Hono } from 'hono'
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import {
  libraryKnuter,
  libraryPacks,
  libraryPackMemberships,
  schoolLibraryImports,
} from '../db/schema/index.js'
import type { db } from '../db/client.js'

type Variables = AuthVariables & {
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0]
}

const browseQuerySchema = z.object({
  // TYPE axis: Generelle / Dobbel / Rampestrek / Alkohol / Sex.
  folder: z.string().trim().min(1).max(100).optional(),
  // GEOGRAPHY axis. Pass a region name, or "nasjonalt" for the region-less (national) ones.
  region: z.string().trim().min(1).max(100).optional(),
  // Free-text search over title + description.
  q: z.string().trim().min(1).max(100).optional(),
  // Narrow to one pack's contents (e.g. "Anbefalt starter").
  packId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
})

// The CENTRAL knute library — browse + import tool for a knutesjef (ADR-0014).
// The catalog itself is shared (no RLS); the "imported" flag is per-school, so
// every endpoint needs the tenant context. Gated to knutesjef/admin: they curate
// + import (and so they see 18+ entries, like the ?all=1 management catalog).
// The import=copy mutation lands in PR-3b; this PR is read-only browse.
export const libraryRoutes = new Hono<{ Variables: Variables }>()
  .use('*', auth())
  .use('*', tenantContext())
  .use('*', requireRole('knutesjef', 'admin'))

  // GET /api/library/knuter — browse the catalog, filterable by type/region/search/pack.
  // Each row carries `imported`: whether THIS school already imported it (drives the
  // "added" badge — shown everywhere the knute appears, for either knutesjef).
  .get('/knuter', zValidator('query', browseQuerySchema), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const { folder, region, q, packId, limit, offset } = c.req.valid('query')

    const conditions = [eq(libraryKnuter.isActive, true)]
    if (folder) conditions.push(eq(libraryKnuter.suggestedFolder, folder))
    if (region) {
      conditions.push(
        region.toLowerCase() === 'nasjonalt'
          ? isNull(libraryKnuter.region)
          : eq(libraryKnuter.region, region),
      )
    }
    if (q) {
      const pattern = `%${q}%`
      conditions.push(
        or(ilike(libraryKnuter.title, pattern), ilike(libraryKnuter.description, pattern))!,
      )
    }
    if (packId) {
      const members = await tx
        .select({ libraryKnuteId: libraryPackMemberships.libraryKnuteId })
        .from(libraryPackMemberships)
        .where(eq(libraryPackMemberships.packId, packId))
      const ids = members.map((m) => m.libraryKnuteId)
      if (ids.length === 0) return c.json({ knuter: [] })
      conditions.push(inArray(libraryKnuter.id, ids))
    }

    const rows = await tx
      .select({
        id: libraryKnuter.id,
        title: libraryKnuter.title,
        description: libraryKnuter.description,
        points: libraryKnuter.points,
        difficulty: libraryKnuter.difficulty,
        evidenceType: libraryKnuter.evidenceType,
        minAge: libraryKnuter.minAge,
        suggestedFolder: libraryKnuter.suggestedFolder,
        region: libraryKnuter.region,
        // Defense in depth: explicit school_id filter on the join AND RLS on the
        // imports table both scope "imported" to the caller's own school.
        imported: sql<boolean>`${schoolLibraryImports.id} is not null`,
      })
      .from(libraryKnuter)
      .leftJoin(
        schoolLibraryImports,
        and(
          eq(schoolLibraryImports.libraryKnuteId, libraryKnuter.id),
          eq(schoolLibraryImports.schoolId, schoolId),
        ),
      )
      .where(and(...conditions))
      // id is the final tiebreaker so offset/limit pagination is deterministic
      // when folder+points+title collide.
      .orderBy(libraryKnuter.suggestedFolder, desc(libraryKnuter.points), libraryKnuter.title, libraryKnuter.id)
      .limit(limit ?? 50)
      .offset(offset ?? 0)

    return c.json({ knuter: rows })
  })

  // GET /api/library/packs — the importable bundles, each with its knute count.
  .get('/packs', async (c) => {
    const tx = c.get('tx')

    // knuteCount counts only ACTIVE members (join filters is_active), so it matches
    // what ?packId= browse — which also filters is_active — actually returns.
    const rows = await tx
      .select({
        id: libraryPacks.id,
        name: libraryPacks.name,
        description: libraryPacks.description,
        sortOrder: libraryPacks.sortOrder,
        knuteCount: sql<number>`cast(count(${libraryKnuter.id}) as int)`,
      })
      .from(libraryPacks)
      .leftJoin(libraryPackMemberships, eq(libraryPackMemberships.packId, libraryPacks.id))
      .leftJoin(
        libraryKnuter,
        and(
          eq(libraryKnuter.id, libraryPackMemberships.libraryKnuteId),
          eq(libraryKnuter.isActive, true),
        ),
      )
      .where(eq(libraryPacks.isActive, true))
      .groupBy(libraryPacks.id)
      .orderBy(libraryPacks.sortOrder, libraryPacks.name)

    return c.json({ packs: rows })
  })
