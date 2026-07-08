import { and, eq, inArray, sql } from 'drizzle-orm'
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
import type { SchoolId, UserId } from './ids.js'

// Import = COPY (ADR-0014). Importing a library knute snapshots it into the school's
// own `knuter` (so the school then edits freely; library updates do NOT propagate),
// and records the import for dedupe + the per-school "imported" badge.
//
// Two flows, two folder behaviours ("Spotify for knuter"):
//   • Single import (importLibraryKnute) = "add to playlist". The knutesjef picks which
//     of their own folders the knute lands in (folderIds, possibly none). No auto-theme
//     archiving. Re-importing is IDEMPOTENT: the existing copy is reused and the call
//     just adds it to the newly-chosen folders (so "+" with new folders always works).
//   • Pack import (importLibraryPack) = onboarding. Bulk-imports a bundle and AUTO-CREATES
//     a theme folder per suggested_folder. Left untouched.
//
// All functions take the request's `tx` (opened by tenantContext, with app.school_id
// set) so every write goes through RLS WITH CHECK and the whole import is one transaction.
//
// CONCURRENCY: each import takes a per-school, transaction-scoped advisory lock FIRST
// (lockSchoolForImport), so concurrent imports within a school are serialized and the
// check-then-insert dedupe below is authoritative — a racing import sees the committed
// row and reuses it (idempotent) BEFORE any duplicate copy is written. This removes the
// duplicate-insert race that, under CI timing, let a raw Postgres 23505 escape as a 500.
//
// LOAD-BEARING ORDERING (still upheld): every `throw` happens BEFORE the first write,
// because tenantContext currently COMMITs the transaction even when a handler throws an
// HTTPException (it only rolls back on a raw DB error that aborts the PG transaction). So
// a NotFound thrown after a write would commit a partial import — validate the source AND
// the target folders before writing, until the tenant-context rollback hardening lands
// (tracked follow-up). The post-insert 23505 catch below is an unreachable backstop (the
// lock prevents the race); it stays as defense in depth.

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]
type ImportCtx = { schoolId: SchoolId; userId: UserId }

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

// Serialize concurrent imports within one school (transaction-scoped advisory lock,
// auto-released on commit/rollback). Two int4 keys: a fixed namespace + the school hash,
// so it never collides with advisory locks taken elsewhere. See the CONCURRENCY note above.
async function lockSchoolForImport(tx: Tx, schoolId: SchoolId) {
  await tx.execute(
    sql`SELECT pg_advisory_xact_lock(hashtext('knuteloop:library-import'), hashtext(${schoolId}))`,
  )
}

// Import ONE library knute into the chosen folders ("add to playlist"). Throws
// NotFoundError if the source is missing/inactive or any target folder is not this
// school's. Idempotent: re-importing reuses the existing copy and just adds it to the
// newly-chosen folders (alreadyImported: true) instead of 409-ing.
export async function importLibraryKnute(
  tx: Tx,
  libraryKnuteId: string,
  { schoolId, userId }: ImportCtx,
  folderIds: string[] = [],
) {
  await lockSchoolForImport(tx, schoolId)

  // Dedupe the requested folders so the existence check + membership insert are clean.
  const wantedFolderIds = [...new Set(folderIds)]

  const [src] = await tx
    .select()
    .from(libraryKnuter)
    .where(and(eq(libraryKnuter.id, libraryKnuteId), eq(libraryKnuter.isActive, true)))
    .limit(1)
  if (!src) throw new NotFoundError('Library knute')

  // LOAD-BEARING: validate every target folder belongs to this school BEFORE any write.
  // RLS already scopes the read to app.school_id; the explicit school_id filter is
  // defense in depth. A folder from another school (or a stale id) → 404, no partial write.
  if (wantedFolderIds.length > 0) {
    const found = await tx
      .select({ id: knuteFolders.id })
      .from(knuteFolders)
      .where(and(eq(knuteFolders.schoolId, schoolId), inArray(knuteFolders.id, wantedFolderIds)))
    if (found.length !== wantedFolderIds.length) throw new NotFoundError('Folder')
  }

  // Idempotent dedupe: if this school already imported this library knute, reuse the
  // existing copy (no second snapshot). The unique(school_id, library_knute_id)
  // constraint is the backstop for the check-then-insert race below.
  const [existing] = await tx
    .select({ knuteId: schoolLibraryImports.knuteId })
    .from(schoolLibraryImports)
    .where(
      and(
        eq(schoolLibraryImports.schoolId, schoolId),
        eq(schoolLibraryImports.libraryKnuteId, libraryKnuteId),
      ),
    )
    .limit(1)

  let knuteId: string
  let alreadyImported: boolean

  if (existing) {
    knuteId = existing.knuteId
    alreadyImported = true
    // «Fjern fra knuteboka» archives the copy (is_active=false) so it vanishes
    // from the student catalog but submissions stay intact. Re-importing must
    // therefore WAKE the copy — otherwise + would silently add folders to an
    // invisible knute.
    await tx
      .update(knuter)
      .set({ isActive: true, updatedAt: new Date() })
      .where(
        and(eq(knuter.id, knuteId), eq(knuter.schoolId, schoolId), eq(knuter.isActive, false)),
      )
  } else {
    // Snapshot copy. evidence_type + min_age are copied and stay unrelaxable by the
    // school (the knuter PATCH endpoint exposes neither). category is carried from
    // suggested_folder for the legacy profile rings / badges. is_gold/is_active default.
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
      .returning({ id: knuter.id })
    knuteId = created!.id
    alreadyImported = false

    // Race backstop: if a concurrent import won, the unique constraint fires 23505 here,
    // aborting the PG transaction. The lock makes this unreachable; kept as defense in
    // depth — the aborted tx rolls back the copy above (the later COMMIT degrades to ROLLBACK).
    try {
      await tx.insert(schoolLibraryImports).values({
        schoolId,
        libraryKnuteId: src.id,
        knuteId,
        importedByUserId: userId,
      })
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Knuten er allerede importert')
      throw err
    }
  }

  // Add the knute to the chosen folders. onConflictDoNothing makes re-adding to a folder
  // it is already in a silent no-op, so "+" twice never errors.
  if (wantedFolderIds.length > 0) {
    await tx
      .insert(knuteFolderMemberships)
      .values(wantedFolderIds.map((folderId) => ({ schoolId, knuteId, folderId })))
      .onConflictDoNothing({
        target: [knuteFolderMemberships.knuteId, knuteFolderMemberships.folderId],
      })
  }

  return { knuteId, alreadyImported, folderIds: wantedFolderIds }
}

// Import a whole pack: every ACTIVE member not already imported by this school. Bulk
// inserts (no per-row round-trips). Returns a summary. The "instant onboarding" flow.
export async function importLibraryPack(tx: Tx, packId: string, { schoolId, userId }: ImportCtx) {
  await lockSchoolForImport(tx, schoolId)

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

  // Wake archived copies of pack members («Fjern fra knuteboka» → pack import
  // counts and revives them; old folder memberships are kept). Counted as
  // imported in the summary since they become visible to students again.
  const memberIds = members.map((m) => m.id)
  const revived = memberIds.length
    ? await tx
        .update(knuter)
        .set({ isActive: true, updatedAt: new Date() })
        .where(
          and(
            eq(knuter.schoolId, schoolId),
            eq(knuter.isActive, false),
            inArray(knuter.sourceLibraryKnuteId, memberIds),
          ),
        )
        .returning({ id: knuter.id })
    : []

  if (toImport.length === 0) {
    return {
      imported: revived.length,
      skipped: members.length - revived.length,
      folders: [] as string[],
    }
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

  return {
    imported: toImport.length + revived.length,
    skipped: members.length - toImport.length - revived.length,
    folders: neededNames,
  }
}
