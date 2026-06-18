import { and, eq, inArray } from 'drizzle-orm'
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
import { ConflictError, NotFoundError, isUniqueViolation } from './errors.js'

// Import = COPY (ADR-0014). Importing a library knute snapshots it into the school's
// own `knuter` (so the school then edits freely; library updates do NOT propagate),
// files it under a school folder named after its suggested_folder (created on demand),
// and records the import for dedupe + the per-school "imported" badge.
//
// All functions take the request's `tx` (opened by tenantContext, with app.school_id
// set) so every write goes through RLS WITH CHECK and the whole import is one transaction.
//
// LOAD-BEARING ORDERING: every `throw` here happens BEFORE the first write. That matters
// because tenantContext currently COMMITs the transaction even when a handler throws an
// HTTPException (it only rolls back on a raw DB error, which aborts the PG transaction).
// So a NotFound/Conflict thrown after a write would commit a partial import. Keep throws
// before writes until the tenant-context rollback hardening lands (tracked follow-up).
// The one after-write throw below (the 23505 -> ConflictError on the import row) is safe
// precisely because the 23505 has already aborted the PG transaction, so the later COMMIT
// degrades to ROLLBACK.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type ImportCtx = { schoolId: string; userId: string }

// Map the new folder/theme axis (suggested_folder) onto the legacy knuter.category enum,
// which a few features (e.g. the profile category rings in routes/me.ts) still read. The
// enum's value names differ from the folder names, so a straight copy would violate it.
// category is slated for removal in ADR-0014; until then, preserve the theme.
const CATEGORY_BY_FOLDER: Record<
  string,
  'Generelle' | 'Dobbelknuter' | 'Alkoholknuter' | 'Sexknuter' | 'Fordervett-knuter'
> = {
  Generelle: 'Generelle',
  Dobbel: 'Dobbelknuter',
  Rampestrek: 'Fordervett-knuter',
  Alkohol: 'Alkoholknuter',
  Sex: 'Sexknuter',
}
const categoryForFolder = (folder: string) => CATEGORY_BY_FOLDER[folder] ?? 'Generelle'

// Import ONE library knute. Throws NotFoundError if the source is missing/inactive,
// ConflictError if this school already imported it (fast path + race backstop).
export async function importLibraryKnute(tx: Tx, libraryKnuteId: string, { schoolId, userId }: ImportCtx) {
  const [src] = await tx
    .select()
    .from(libraryKnuter)
    .where(and(eq(libraryKnuter.id, libraryKnuteId), eq(libraryKnuter.isActive, true)))
    .limit(1)
  if (!src) throw new NotFoundError('Library knute')

  // Fast-path dedupe (clean 409 for the common case). The unique(school_id,
  // library_knute_id) constraint is the backstop for the check-then-insert race below.
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

  // Snapshot copy. evidence_type + min_age are copied and stay unrelaxable by the school
  // (the knuter PATCH endpoint exposes neither). is_gold/is_active default.
  const [created] = await tx
    .insert(knuter)
    .values({
      schoolId,
      title: src.title,
      description: src.description,
      points: src.points,
      difficulty: src.difficulty,
      category: categoryForFolder(src.suggestedFolder),
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

  // Race backstop: if a concurrent import won, the unique constraint fires 23505 here,
  // aborting the PG transaction. Translate it to a clean 409; the aborted tx then rolls
  // back the copy + membership above (the later COMMIT degrades to ROLLBACK).
  try {
    await tx.insert(schoolLibraryImports).values({
      schoolId,
      libraryKnuteId: src.id,
      knuteId: knute.id,
      importedByUserId: userId,
    })
  } catch (err) {
    if (isUniqueViolation(err)) throw new ConflictError('Knuten er allerede importert')
    throw err
  }

  return { knute, folder: { id: folderId, name: src.suggestedFolder } }
}

// Import a whole pack: every ACTIVE member not already imported by this school. Bulk
// inserts (no per-row round-trips). Returns a summary. The "instant onboarding" flow.
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

  // Resolve every needed folder up front (existing + create the missing ones). Folder
  // creation is idempotent (ON CONFLICT DO NOTHING + re-read) so a concurrent import
  // creating the same folder is a silent reuse, not a 23505 -> 500.
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
      .onConflictDoNothing({ target: [knuteFolders.schoolId, knuteFolders.name] })
      .returning({ id: knuteFolders.id, name: knuteFolders.name })
    createdFolders.forEach((f) => folderIdByName.set(f.name, f.id))
    const stillMissing = newNames.filter((n) => !folderIdByName.has(n))
    if (stillMissing.length > 0) {
      const refetched = await tx
        .select({ id: knuteFolders.id, name: knuteFolders.name })
        .from(knuteFolders)
        .where(and(eq(knuteFolders.schoolId, schoolId), inArray(knuteFolders.name, stillMissing)))
      refetched.forEach((f) => folderIdByName.set(f.name, f.id))
    }
  }

  // Bulk-copy the knuter, keeping source linkage in the returning so each new copy maps
  // back to its folder + import row WITHOUT relying on insert/return ordering.
  const inserted = await tx
    .insert(knuter)
    .values(
      toImport.map((m) => ({
        schoolId,
        title: m.title,
        description: m.description,
        points: m.points,
        difficulty: m.difficulty,
        category: categoryForFolder(m.suggestedFolder),
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

// Return an existing school folder's id by name, or create it. Idempotent against the
// unique(school_id, name) constraint so a concurrent create is a silent reuse, not a 500.
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
    .onConflictDoNothing({ target: [knuteFolders.schoolId, knuteFolders.name] })
    .returning({ id: knuteFolders.id })
  if (created) return created.id
  // Lost a concurrent create race — the other transaction made it (no 23505 was raised,
  // so this transaction is still alive); read it back.
  const [now] = await tx
    .select({ id: knuteFolders.id })
    .from(knuteFolders)
    .where(and(eq(knuteFolders.schoolId, schoolId), eq(knuteFolders.name, name)))
    .limit(1)
  return now!.id
}
