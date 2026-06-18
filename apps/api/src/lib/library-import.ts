import { and, eq } from 'drizzle-orm'
import type { db } from '../db/client.js'
import {
  knuter,
  knuteFolders,
  knuteFolderMemberships,
  libraryKnuter,
  libraryPacks,
  libraryPackMemberships,
  schoolLibraryImports,
} from '../db/schema/index.js'
import { ConflictError, NotFoundError } from './errors.js'

// Import = COPY (ADR-0014). Importing a library knute snapshots it into the school's
// own `knuter` (so the school then edits freely; library updates do NOT propagate),
// files it under a school folder named after its suggested_folder (created on demand),
// and records the import for dedupe + the per-school "imported" badge.
//
// All functions take the request's `tx` (opened by tenantContext, with app.school_id
// set) so every write goes through RLS WITH CHECK and the whole import is one
// transaction — a partial import can never be committed.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type ImportCtx = { schoolId: string; userId: string }

// Import ONE library knute. Throws NotFoundError if the source is missing/inactive,
// ConflictError if this school already imported it.
export async function importLibraryKnute(tx: Tx, libraryKnuteId: string, { schoolId, userId }: ImportCtx) {
  const [src] = await tx
    .select()
    .from(libraryKnuter)
    .where(and(eq(libraryKnuter.id, libraryKnuteId), eq(libraryKnuter.isActive, true)))
    .limit(1)
  if (!src) throw new NotFoundError('Library knute')

  // Dedupe (the unique(school_id, library_knute_id) constraint is the backstop).
  const [dup] = await tx
    .select({ id: schoolLibraryImports.id })
    .from(schoolLibraryImports)
    .where(
      and(
        eq(schoolLibraryImports.schoolId, schoolId),
        eq(schoolLibraryImports.libraryKnuteId, libraryKnuteId),
      ),
    )
    .limit(1)
  if (dup) throw new ConflictError('Knuten er allerede importert')

  // Snapshot copy. evidence_type + min_age are copied and stay unrelaxable by the
  // school (the knuter PATCH endpoint exposes neither). is_gold/is_active default.
  const [created] = await tx
    .insert(knuter)
    .values({
      schoolId,
      title: src.title,
      description: src.description,
      points: src.points,
      difficulty: src.difficulty,
      evidenceType: src.evidenceType,
      minAge: src.minAge,
      sourceLibraryKnuteId: src.id,
    })
    .returning()
  const knute = created!

  const existingFolderCount = (
    await tx.select({ id: knuteFolders.id }).from(knuteFolders).where(eq(knuteFolders.schoolId, schoolId))
  ).length
  const folderId = await findOrCreateFolder(tx, schoolId, src.suggestedFolder, existingFolderCount)
  await tx.insert(knuteFolderMemberships).values({ schoolId, knuteId: knute.id, folderId })

  await tx.insert(schoolLibraryImports).values({
    schoolId,
    libraryKnuteId: src.id,
    knuteId: knute.id,
    importedByUserId: userId,
  })

  return { knute, folder: { id: folderId, name: src.suggestedFolder } }
}

// Import a whole pack: every ACTIVE member not already imported by this school.
// Bulk inserts (no per-row round-trips) — this is the "instant onboarding" flow
// (import the starter pack → ~165 organized knuter in one call). Returns a summary.
export async function importLibraryPack(tx: Tx, packId: string, { schoolId, userId }: ImportCtx) {
  const [pack] = await tx
    .select({ id: libraryPacks.id })
    .from(libraryPacks)
    .where(and(eq(libraryPacks.id, packId), eq(libraryPacks.isActive, true)))
    .limit(1)
  if (!pack) throw new NotFoundError('Pack')

  const members = await tx
    .select({
      id: libraryKnuter.id,
      title: libraryKnuter.title,
      description: libraryKnuter.description,
      points: libraryKnuter.points,
      difficulty: libraryKnuter.difficulty,
      evidenceType: libraryKnuter.evidenceType,
      minAge: libraryKnuter.minAge,
      suggestedFolder: libraryKnuter.suggestedFolder,
    })
    .from(libraryPackMemberships)
    .innerJoin(libraryKnuter, eq(libraryKnuter.id, libraryPackMemberships.libraryKnuteId))
    .where(and(eq(libraryPackMemberships.packId, packId), eq(libraryKnuter.isActive, true)))

  const already = await tx
    .select({ libraryKnuteId: schoolLibraryImports.libraryKnuteId })
    .from(schoolLibraryImports)
    .where(eq(schoolLibraryImports.schoolId, schoolId))
  const importedSet = new Set(already.map((r) => r.libraryKnuteId))
  const toImport = members.filter((m) => !importedSet.has(m.id))

  if (toImport.length === 0) {
    return { imported: 0, skipped: members.length, folders: [] as string[] }
  }

  // Resolve every needed folder up front (existing + bulk-create the missing ones).
  const existingFolders = await tx
    .select({ id: knuteFolders.id, name: knuteFolders.name })
    .from(knuteFolders)
    .where(eq(knuteFolders.schoolId, schoolId))
  const folderIdByName = new Map(existingFolders.map((f) => [f.name, f.id]))
  const neededNames = [...new Set(toImport.map((m) => m.suggestedFolder))]
  const newNames = neededNames.filter((n) => !folderIdByName.has(n))
  if (newNames.length > 0) {
    const base = existingFolders.length
    const createdFolders = await tx
      .insert(knuteFolders)
      .values(newNames.map((name, i) => ({ schoolId, name, sortOrder: base + i })))
      .returning({ id: knuteFolders.id, name: knuteFolders.name })
    createdFolders.forEach((f) => folderIdByName.set(f.name, f.id))
  }

  // Bulk-copy the knuter, keeping source linkage in the returning so we can map each
  // new copy back to its folder + import row WITHOUT relying on insert/return ordering.
  const inserted = await tx
    .insert(knuter)
    .values(
      toImport.map((m) => ({
        schoolId,
        title: m.title,
        description: m.description,
        points: m.points,
        difficulty: m.difficulty,
        evidenceType: m.evidenceType,
        minAge: m.minAge,
        sourceLibraryKnuteId: m.id,
      })),
    )
    .returning({ id: knuter.id, sourceLibraryKnuteId: knuter.sourceLibraryKnuteId })
  const folderNameByLibId = new Map(toImport.map((m) => [m.id, m.suggestedFolder]))

  await tx.insert(knuteFolderMemberships).values(
    inserted.map((k) => ({
      schoolId,
      knuteId: k.id,
      folderId: folderIdByName.get(folderNameByLibId.get(k.sourceLibraryKnuteId!)!)!,
    })),
  )
  await tx.insert(schoolLibraryImports).values(
    inserted.map((k) => ({
      schoolId,
      libraryKnuteId: k.sourceLibraryKnuteId!,
      knuteId: k.id,
      importedByUserId: userId,
    })),
  )

  return { imported: toImport.length, skipped: members.length - toImport.length, folders: neededNames }
}

// Return an existing school folder's id by name, or create it with the given sort order.
async function findOrCreateFolder(
  tx: Tx,
  schoolId: string,
  name: string,
  nextSortOrder: number,
): Promise<string> {
  const [existing] = await tx
    .select({ id: knuteFolders.id })
    .from(knuteFolders)
    .where(and(eq(knuteFolders.schoolId, schoolId), eq(knuteFolders.name, name)))
    .limit(1)
  if (existing) return existing.id
  const [created] = await tx
    .insert(knuteFolders)
    .values({ schoolId, name, sortOrder: nextSortOrder })
    .returning({ id: knuteFolders.id })
  return created!.id
}
