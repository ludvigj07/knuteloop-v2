import { Hono } from 'hono'
import { and, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { auth, type AuthVariables } from '../middleware/auth.js'
import { tenantContext } from '../middleware/tenant-context.js'
import { requireRole } from '../middleware/require-role.js'
import {
  knuter,
  libraryKnuter,
  libraryPacks,
  libraryPackMemberships,
  schoolLibraryImports,
} from '../db/schema/index.js'
import { importLibraryKnute, importLibraryPack } from '../lib/library-import.js'
import { NotFoundError } from '../lib/errors.js'
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
// Import = copy (POST /imports + POST /packs/:id/import) snapshots library knuter into
// the school's own `knuter`; the business logic lives in lib/library-import.ts.
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
        // "Imported" = the school has an ACTIVE copy. An archived copy («Fjern
        // fra knuteboka») shows as NOT added, so + re-imports and reactivates.
        // Defense in depth: explicit school_id filters on both joins AND RLS.
        imported: sql<boolean>`${knuter.id} is not null`,
        // The school's own ACTIVE copy (null until imported / after removal) —
        // lets the ✓ open the manage-sheet without a second lookup.
        importedKnuteId: knuter.id,
      })
      .from(libraryKnuter)
      .leftJoin(
        schoolLibraryImports,
        and(
          eq(schoolLibraryImports.libraryKnuteId, libraryKnuter.id),
          eq(schoolLibraryImports.schoolId, schoolId),
        ),
      )
      .leftJoin(
        knuter,
        and(
          eq(knuter.id, schoolLibraryImports.knuteId),
          eq(knuter.schoolId, schoolId),
          eq(knuter.isActive, true),
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

  // GET /api/library/packs/:id — the pack's CONTENTS with a per-school imported
  // flag per member. Powers the see-before-you-add pack sheet: the knutesjef
  // previews all members, sees what is already in the book, and the CTA counts
  // only the new ones ("Legg til N nye").
  .get('/packs/:id', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const tx = c.get('tx')
    const schoolId = c.get('schoolId')
    const { id } = c.req.valid('param')

    const [pack] = await tx
      .select({ id: libraryPacks.id, name: libraryPacks.name, description: libraryPacks.description })
      .from(libraryPacks)
      .where(and(eq(libraryPacks.id, id), eq(libraryPacks.isActive, true)))
      .limit(1)
    if (!pack) throw new NotFoundError('Pack')

    const members = await tx
      .select({
        id: libraryKnuter.id,
        title: libraryKnuter.title,
        points: libraryKnuter.points,
        suggestedFolder: libraryKnuter.suggestedFolder,
        evidenceType: libraryKnuter.evidenceType,
        minAge: libraryKnuter.minAge,
        // "Imported" = an ACTIVE copy exists (archived = counts as new again,
        // and pack import reactivates it). Explicit school_id filters + RLS.
        imported: sql<boolean>`${knuter.id} is not null`,
      })
      .from(libraryPackMemberships)
      .innerJoin(
        libraryKnuter,
        and(
          eq(libraryKnuter.id, libraryPackMemberships.libraryKnuteId),
          eq(libraryKnuter.isActive, true),
        ),
      )
      .leftJoin(
        schoolLibraryImports,
        and(
          eq(schoolLibraryImports.libraryKnuteId, libraryKnuter.id),
          eq(schoolLibraryImports.schoolId, schoolId),
        ),
      )
      .leftJoin(
        knuter,
        and(
          eq(knuter.id, schoolLibraryImports.knuteId),
          eq(knuter.schoolId, schoolId),
          eq(knuter.isActive, true),
        ),
      )
      .where(eq(libraryPackMemberships.packId, id))
      .orderBy(libraryPackMemberships.sortOrder, libraryKnuter.title)

    return c.json({ pack, knuter: members })
  })

  // POST /api/library/imports — import ONE library knute into this school and file it in
  // the chosen folder(s) ("add to playlist"). 404 if the knute is missing/inactive or a
  // folderId is not this school's. Idempotent: re-importing reuses the existing copy and
  // just adds the new folder memberships (201 + alreadyImported: true), never 409.
  .post(
    '/imports',
    zValidator(
      'json',
      z.object({
        libraryKnuteId: z.string().uuid(),
        // The folders to file the copy into. Omit/[] = import into the catalog only.
        folderIds: z.array(z.string().uuid()).max(50).optional(),
      }),
      (result, c) => {
        if (!result.success) {
          return c.json({ error: { message: 'Invalid input', issues: result.error.flatten() } }, 400)
        }
        return undefined
      },
    ),
    async (c) => {
      const tx = c.get('tx')
      const { libraryKnuteId, folderIds } = c.req.valid('json')
      const result = await importLibraryKnute(
        tx,
        libraryKnuteId,
        { schoolId: c.get('schoolId'), userId: c.get('userId') },
        folderIds ?? [],
      )
      return c.json(result, 201)
    },
  )

  // POST /api/library/packs/:id/import — import a whole pack (skips already-imported).
  // The "instant onboarding" flow: import the starter pack → organized folders in one call.
  .post('/packs/:id/import', zValidator('param', z.object({ id: z.string().uuid() })), async (c) => {
    const tx = c.get('tx')
    const result = await importLibraryPack(tx, c.req.valid('param').id, {
      schoolId: c.get('schoolId'),
      userId: c.get('userId'),
    })
    return c.json(result, 201)
  })
