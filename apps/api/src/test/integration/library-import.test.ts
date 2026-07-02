import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { and, eq } from 'drizzle-orm'
import {
  schools,
  users,
  knuter,
  knuteFolders,
  knuteFolderMemberships,
  libraryKnuter,
  libraryPacks,
  libraryPackMemberships,
  schoolLibraryImports,
} from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let schoolCId: string
let authA: Record<string, string> // knutesjef, school A — does the single-import tests
let authB: Record<string, string> // knutesjef, school B — does the pack-import tests
let authC: Record<string, string> // knutesjef, school C — partial-overlap test
let studentTokenA: string
let bikkjaId: string
let romeoId: string
let bronsetradId: string
let solibatId: string
let inaktivId: string
let tvillingId: string
let starterPackId: string
let sportFolderAId: string
let festFolderAId: string
let folderCId: string // a folder owned by school C — used to test cross-tenant folder rejection

type ImportResponse = {
  knuteId: string
  alreadyImported: boolean
  folderIds: string[]
}
type PackImportResponse = { imported: number; skipped: number; folders: string[] }
type BrowseResponse = { knuter: { id: string; title: string; imported: boolean }[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [a, b, cSchool] = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }, { name: 'School C' }])
    .returning()
  schoolAId = a!.id
  schoolBId = b!.id
  schoolCId = cSchool!.id

  const [loke, frida, tor, kjellC] = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'knutesjef' },
      { schoolId: schoolCId, russenavn: 'KjellC', role: 'knutesjef' },
    ])
    .returning()

  const lib = await h.superDb
    .insert(libraryKnuter)
    .values([
      { title: 'Bikkjå', points: 10, suggestedFolder: 'Generelle' },
      { title: 'Romeo', points: 10, suggestedFolder: 'Generelle' },
      { title: 'Bronsetråd', points: 25, suggestedFolder: 'Dobbel' },
      { title: 'Ny Dag', points: 12, suggestedFolder: 'Alkohol' },
      { title: 'Sølibat', points: 0, suggestedFolder: 'Sex', evidenceType: 'text', minAge: 18 },
      { title: 'Tvilling', points: 14, suggestedFolder: 'Generelle' },
      { title: 'Inaktiv', points: 5, suggestedFolder: 'Generelle', isActive: false },
    ])
    .returning()
  const id = (t: string) => lib.find((k) => k.title === t)!.id
  bikkjaId = id('Bikkjå')
  romeoId = id('Romeo')
  bronsetradId = id('Bronsetråd')
  solibatId = id('Sølibat')
  inaktivId = id('Inaktiv')
  tvillingId = id('Tvilling')

  // Pre-seed folders: two for school A (the "add to playlist" targets) and one for
  // school C (to prove a cross-tenant folderId is rejected before any write). School B
  // gets none — its pack-import tests assert an exact auto-created folder count.
  const [sportA, festA, folderC] = await h.superDb
    .insert(knuteFolders)
    .values([
      { schoolId: schoolAId, name: 'Sport', sortOrder: 0 },
      { schoolId: schoolAId, name: 'Fest', sortOrder: 1 },
      { schoolId: schoolCId, name: 'C-mappe', sortOrder: 0 },
    ])
    .returning()
  sportFolderAId = sportA!.id
  festFolderAId = festA!.id
  folderCId = folderC!.id

  // Starter pack = the non-Sex knuter (mirrors the real seed) PLUS the inactive one,
  // so we can prove pack import skips inactive members.
  const [starter] = await h.superDb.insert(libraryPacks).values({ name: 'Starter' }).returning()
  starterPackId = starter!.id
  // Pack = the non-Sex active knuter (mirrors the real seed) + the inactive one (to prove
  // it is skipped). Tvilling is deliberately NOT in the pack (used by the concurrency test).
  await h.superDb.insert(libraryPackMemberships).values(
    lib
      .filter((k) => k.title !== 'Sølibat' && k.title !== 'Tvilling')
      .map((k) => ({ packId: starterPackId, libraryKnuteId: k.id })),
  )

  const knutesjefTokenA = await signDevToken({ sub: loke!.id, school_id: schoolAId, role: 'knutesjef' })
  studentTokenA = await signDevToken({ sub: frida!.id, school_id: schoolAId, role: 'student' })
  const knutesjefTokenB = await signDevToken({ sub: tor!.id, school_id: schoolBId, role: 'knutesjef' })
  const knutesjefTokenC = await signDevToken({ sub: kjellC!.id, school_id: schoolCId, role: 'knutesjef' })
  authA = { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' }
  authB = { Authorization: `Bearer ${knutesjefTokenB}`, 'content-type': 'application/json' }
  authC = { Authorization: `Bearer ${knutesjefTokenC}`, 'content-type': 'application/json' }
})

afterAll(async () => {
  await h?.cleanup()
})

const postImport = (headers: Record<string, string>, libraryKnuteId: string, folderIds?: string[]) =>
  app.request('/api/library/imports', {
    method: 'POST',
    headers,
    body: JSON.stringify({ libraryKnuteId, folderIds }),
  })

const postPackImport = (headers: Record<string, string>, packId: string) =>
  app.request(`/api/library/packs/${packId}/import`, { method: 'POST', headers })

describe('POST /api/library/imports — single knute (school A)', () => {
  it('401 without auth', async () => {
    const res = await app.request('/api/library/imports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ libraryKnuteId: bikkjaId }),
    })
    expect(res.status).toBe(401)
  })

  it('403 for a student', async () => {
    const res = await postImport(
      { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      bikkjaId,
    )
    expect(res.status).toBe(403)
  })

  it('imports a copy into the chosen folders and records the import', async () => {
    const res = await postImport(authA, bikkjaId, [sportFolderAId, festFolderAId])
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    expect(body.alreadyImported).toBe(false)
    expect(body.knuteId).toBeTruthy()
    expect([...body.folderIds].sort()).toEqual([sportFolderAId, festFolderAId].sort())

    // The copy + import row exist, and the copy is filed in BOTH chosen folders.
    const copies = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, bikkjaId)))
    expect(copies).toHaveLength(1)
    expect(copies[0]!.id).toBe(body.knuteId)
    const memberships = await h.superDb
      .select()
      .from(knuteFolderMemberships)
      .where(and(eq(knuteFolderMemberships.schoolId, schoolAId), eq(knuteFolderMemberships.knuteId, body.knuteId)))
    expect(memberships.map((m) => m.folderId).sort()).toEqual([sportFolderAId, festFolderAId].sort())
    const imports = await h.superDb
      .select()
      .from(schoolLibraryImports)
      .where(
        and(eq(schoolLibraryImports.schoolId, schoolAId), eq(schoolLibraryImports.libraryKnuteId, bikkjaId)),
      )
    expect(imports).toHaveLength(1)
  })

  it('imports into the catalog only when no folders are given (no membership)', async () => {
    const res = await postImport(authA, romeoId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    expect(body.alreadyImported).toBe(false)
    expect(body.folderIds).toEqual([])

    const memberships = await h.superDb
      .select()
      .from(knuteFolderMemberships)
      .where(and(eq(knuteFolderMemberships.schoolId, schoolAId), eq(knuteFolderMemberships.knuteId, body.knuteId)))
    expect(memberships).toHaveLength(0)
  })

  it('the imported copy shows up in the school catalog (GET /api/knuter)', async () => {
    const res = await app.request('/api/knuter', { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { knuter: { title: string }[] }
    expect(body.knuter.some((k) => k.title === 'Bikkjå')).toBe(true)
  })

  it('re-import is idempotent: reuses the copy and adds the newly-chosen folders', async () => {
    // Romeo was imported above with no folders. Re-importing with a folder must reuse the
    // same copy (no second snapshot) and just add the membership.
    const firstCopy = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, romeoId)))
    expect(firstCopy).toHaveLength(1)

    const res = await postImport(authA, romeoId, [sportFolderAId])
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    expect(body.alreadyImported).toBe(true)
    expect(body.knuteId).toBe(firstCopy[0]!.id)
    expect(body.folderIds).toEqual([sportFolderAId])

    // Still exactly one copy + one import row; the new membership is present.
    const copies = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, romeoId)))
    expect(copies).toHaveLength(1)
    const imports = await h.superDb
      .select()
      .from(schoolLibraryImports)
      .where(
        and(eq(schoolLibraryImports.schoolId, schoolAId), eq(schoolLibraryImports.libraryKnuteId, romeoId)),
      )
    expect(imports).toHaveLength(1)
    const membership = await h.superDb
      .select()
      .from(knuteFolderMemberships)
      .where(
        and(
          eq(knuteFolderMemberships.schoolId, schoolAId),
          eq(knuteFolderMemberships.knuteId, body.knuteId),
          eq(knuteFolderMemberships.folderId, sportFolderAId),
        ),
      )
    expect(membership).toHaveLength(1)
  })

  it('404 for a nonexistent library knute', async () => {
    const res = await postImport(authA, '00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('404 for an inactive library knute', async () => {
    const res = await postImport(authA, inaktivId)
    expect(res.status).toBe(404)
  })

  it('404 when a folderId belongs to another school, with NO partial write', async () => {
    // School A tries to file Bronsetråd into school C's folder. RLS + the explicit
    // school_id filter reject it, and the throw happens BEFORE any copy is written.
    const res = await postImport(authA, bronsetradId, [folderCId])
    expect(res.status).toBe(404)

    const copies = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, bronsetradId)))
    expect(copies).toHaveLength(0)
    const imports = await h.superDb
      .select()
      .from(schoolLibraryImports)
      .where(
        and(
          eq(schoolLibraryImports.schoolId, schoolAId),
          eq(schoolLibraryImports.libraryKnuteId, bronsetradId),
        ),
      )
    expect(imports).toHaveLength(0)
  })

  it('copies the unrelaxable 18+ / text-only flags', async () => {
    const res = await postImport(authA, solibatId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    const [copy] = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.id, body.knuteId)))
    expect(copy!.minAge).toBe(18)
    expect(copy!.evidenceType).toBe('text')
  })

  it('400 for a malformed body (missing/invalid libraryKnuteId)', async () => {
    const res = await app.request('/api/library/imports', {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('400 for a non-uuid folderId', async () => {
    const res = await app.request('/api/library/imports', {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({ libraryKnuteId: bikkjaId, folderIds: ['not-a-uuid'] }),
    })
    expect(res.status).toBe(400)
  })
})

describe('POST /api/library/packs/:id/import — whole pack (school B)', () => {
  it('401 without auth', async () => {
    expect((await app.request(`/api/library/packs/${starterPackId}/import`, { method: 'POST' })).status).toBe(401)
  })

  it('403 for a student', async () => {
    const res = await postPackImport(
      { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      starterPackId,
    )
    expect(res.status).toBe(403)
  })

  it('404 for a nonexistent pack', async () => {
    const res = await postPackImport(authB, '00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('400 for a non-uuid pack id', async () => {
    expect((await postPackImport(authB, 'not-a-uuid')).status).toBe(400)
  })

  it('imports all active members, skipping the inactive one, into auto-created folders', async () => {
    const res = await postPackImport(authB, starterPackId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as PackImportResponse
    // 4 active non-Sex members (Bikkjå, Romeo, Bronsetråd, Ny Dag) — Inaktiv excluded.
    expect(body.imported).toBe(4)
    expect(body.skipped).toBe(0)
    expect([...body.folders].sort()).toEqual(['Alkohol', 'Dobbel', 'Generelle'])

    const bKnuter = await h.superDb.select().from(knuter).where(eq(knuter.schoolId, schoolBId))
    expect(bKnuter).toHaveLength(4)
    expect(bKnuter.some((k) => k.title === 'Inaktiv')).toBe(false)
    const bFolders = await h.superDb.select().from(knuteFolders).where(eq(knuteFolders.schoolId, schoolBId))
    expect(bFolders).toHaveLength(3)
  })

  it('files each copy in the folder + category matching its suggested_folder', async () => {
    const rows = await h.superDb
      .select({ title: knuter.title, category: knuter.category, folderName: knuteFolders.name })
      .from(knuter)
      .innerJoin(knuteFolderMemberships, eq(knuteFolderMemberships.knuteId, knuter.id))
      .innerJoin(knuteFolders, eq(knuteFolders.id, knuteFolderMemberships.folderId))
      .where(eq(knuter.schoolId, schoolBId))
    const byTitle = Object.fromEntries(rows.map((r) => [r.title, r]))
    expect(byTitle['Bronsetråd']?.folderName).toBe('Dobbel')
    expect(byTitle['Bronsetråd']?.category).toBe('Dobbelknuter')
    expect(byTitle['Ny Dag']?.folderName).toBe('Alkohol')
    expect(byTitle['Ny Dag']?.category).toBe('Alkoholknuter')
  })

  it('auto-created folders get distinct, contiguous sort_order from 0', async () => {
    const folders = await h.superDb.select().from(knuteFolders).where(eq(knuteFolders.schoolId, schoolBId))
    const orders = folders.map((f) => f.sortOrder).sort((x, y) => x - y)
    expect(orders).toEqual([0, 1, 2])
  })

  it('re-importing the pack skips everything already imported', async () => {
    const res = await postPackImport(authB, starterPackId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as PackImportResponse
    expect(body.imported).toBe(0)
    expect(body.skipped).toBe(4)
  })
})

describe('import isolation between schools', () => {
  it('the imported flag is per-school (A imported Sølibat individually; B did not via the pack)', async () => {
    const a = (await (await app.request('/api/library/knuter', { headers: authA })).json()) as BrowseResponse
    expect(a.knuter.find((k) => k.title === 'Sølibat')?.imported).toBe(true)

    const b = (await (await app.request('/api/library/knuter', { headers: authB })).json()) as BrowseResponse
    expect(b.knuter.find((k) => k.title === 'Sølibat')?.imported).toBe(false)
  })

  it('each school owns only its own copies', async () => {
    const aTitles = (await h.superDb.select().from(knuter).where(eq(knuter.schoolId, schoolAId))).map((k) => k.title)
    const bTitles = (await h.superDb.select().from(knuter).where(eq(knuter.schoolId, schoolBId))).map((k) => k.title)
    // A imported these individually (+ Tvilling via the concurrency test); B got the pack only.
    expect(aTitles).toEqual(expect.arrayContaining(['Bikkjå', 'Sølibat', 'Romeo']))
    expect(bTitles.slice().sort()).toEqual(['Bikkjå', 'Bronsetråd', 'Ny Dag', 'Romeo'])
    expect(bTitles).not.toContain('Sølibat')
  })
})

describe('concurrent single-import of the same knute (atomicity + idempotency)', () => {
  it('both succeed (201), exactly one creates the copy, and exactly one copy exists', async () => {
    const [r1, r2] = await Promise.all([postImport(authA, tvillingId), postImport(authA, tvillingId)])
    expect([r1.status, r2.status]).toEqual([201, 201])

    // The advisory lock serializes them: one creates the copy, the other reuses it.
    const [b1, b2] = (await Promise.all([r1.json(), r2.json()])) as [ImportResponse, ImportResponse]
    expect([b1.alreadyImported, b2.alreadyImported].sort()).toEqual([false, true])

    // Exactly one copy + one import row — the reuse path never wrote a second snapshot.
    const copies = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, tvillingId)))
    expect(copies).toHaveLength(1)
    const imports = await h.superDb
      .select()
      .from(schoolLibraryImports)
      .where(
        and(eq(schoolLibraryImports.schoolId, schoolAId), eq(schoolLibraryImports.libraryKnuteId, tvillingId)),
      )
    expect(imports).toHaveLength(1)
  })
})

describe('pack import with partial overlap (school C)', () => {
  it('imports only the members not already imported individually', async () => {
    expect((await postImport(authC, bikkjaId)).status).toBe(201) // C imports Bikkjå first
    const res = await postPackImport(authC, starterPackId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as PackImportResponse
    expect(body.imported).toBe(3) // Romeo, Bronsetråd, Ny Dag
    expect(body.skipped).toBe(1) // Bikkjå
  })
})

describe('GET /api/library/knuter — importedKnuteId (the school copy id)', () => {
  it('carries the copy id after import, null before — per school', async () => {
    // School A imported Sølibat earlier in this suite; School B did not.
    const resA = await app.request('/api/library/knuter?q=S%C3%B8libat', { headers: authA })
    const bodyA = (await resA.json()) as {
      knuter: { id: string; imported: boolean; importedKnuteId: string | null }[]
    }
    const rowA = bodyA.knuter.find((k) => k.id === solibatId)!
    expect(rowA.imported).toBe(true)
    expect(rowA.importedKnuteId).toBeTruthy()

    // The id points at school A's own copy in `knuter`.
    const [copy] = await h.superDb
      .select()
      .from(knuter)
      .where(eq(knuter.id, rowA.importedKnuteId!))
    expect(copy?.schoolId).toBe(schoolAId)
    expect(copy?.sourceLibraryKnuteId).toBe(solibatId)

    const resB = await app.request('/api/library/knuter?q=S%C3%B8libat', { headers: authB })
    const bodyB = (await resB.json()) as {
      knuter: { id: string; importedKnuteId: string | null }[]
    }
    expect(bodyB.knuter.find((k) => k.id === solibatId)?.importedKnuteId ?? null).toBeNull()
  })
})

describe('GET /api/library/packs/:id — pack contents with per-school imported flags', () => {
  it('401 without auth', async () => {
    const res = await app.request(`/api/library/packs/${starterPackId}`)
    expect(res.status).toBe(401)
  })

  it('lists active members with imported flags scoped to the caller school', async () => {
    // School B pack-imported earlier in this suite; school A only took Sølibat.
    const resA = await app.request(`/api/library/packs/${starterPackId}`, { headers: authA })
    expect(resA.status).toBe(200)
    const bodyA = (await resA.json()) as {
      pack: { id: string; name: string }
      knuter: { id: string; imported: boolean }[]
    }
    expect(bodyA.pack.id).toBe(starterPackId)
    // The inactive member never shows up.
    expect(bodyA.knuter.some((k) => k.id === inaktivId)).toBe(false)
    const solibatA = bodyA.knuter.find((k) => k.id === solibatId)
    if (solibatA) expect(solibatA.imported).toBe(true)
    // Every member carries a per-school boolean (never null/undefined).
    expect(bodyA.knuter.every((k) => typeof k.imported === 'boolean')).toBe(true)
  })

  it('404 for a nonexistent pack, 400 for a non-uuid id', async () => {
    const miss = await app.request('/api/library/packs/00000000-0000-4000-8000-000000000000', {
      headers: authA,
    })
    expect(miss.status).toBe(404)
    const bad = await app.request('/api/library/packs/ikke-uuid', { headers: authA })
    expect(bad.status).toBe(400)
  })
})
