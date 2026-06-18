import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { and, eq } from 'drizzle-orm'
import {
  schools,
  users,
  knuter,
  knuteFolders,
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
let authA: Record<string, string> // knutesjef, school A — does the single-import tests
let authB: Record<string, string> // knutesjef, school B — does the pack-import tests
let studentTokenA: string
let bikkjaId: string
let romeoId: string
let solibatId: string
let inaktivId: string
let starterPackId: string

type ImportResponse = {
  knute: {
    id: string
    title: string
    sourceLibraryKnuteId: string | null
    minAge: number
    evidenceType: string
  }
  folder: { id: string; name: string }
}
type PackImportResponse = { imported: number; skipped: number; folders: string[] }
type BrowseResponse = { knuter: { id: string; title: string; imported: boolean }[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [a, b] = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = a!.id
  schoolBId = b!.id

  const [loke, frida, tor] = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'knutesjef' },
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
      { title: 'Inaktiv', points: 5, suggestedFolder: 'Generelle', isActive: false },
    ])
    .returning()
  const id = (t: string) => lib.find((k) => k.title === t)!.id
  bikkjaId = id('Bikkjå')
  romeoId = id('Romeo')
  solibatId = id('Sølibat')
  inaktivId = id('Inaktiv')

  // Starter pack = the non-Sex knuter (mirrors the real seed) PLUS the inactive one,
  // so we can prove pack import skips inactive members.
  const [starter] = await h.superDb.insert(libraryPacks).values({ name: 'Starter' }).returning()
  starterPackId = starter!.id
  await h.superDb.insert(libraryPackMemberships).values(
    lib
      .filter((k) => k.title !== 'Sølibat')
      .map((k) => ({ packId: starterPackId, libraryKnuteId: k.id })),
  )

  const knutesjefTokenA = await signDevToken({ sub: loke!.id, school_id: schoolAId, role: 'knutesjef' })
  studentTokenA = await signDevToken({ sub: frida!.id, school_id: schoolAId, role: 'student' })
  const knutesjefTokenB = await signDevToken({ sub: tor!.id, school_id: schoolBId, role: 'knutesjef' })
  authA = { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' }
  authB = { Authorization: `Bearer ${knutesjefTokenB}`, 'content-type': 'application/json' }
})

afterAll(async () => {
  await h?.cleanup()
})

const postImport = (headers: Record<string, string>, libraryKnuteId: string) =>
  app.request('/api/library/imports', { method: 'POST', headers, body: JSON.stringify({ libraryKnuteId }) })

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

  it('imports a copy, files it in its folder, and records the import', async () => {
    const res = await postImport(authA, bikkjaId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    expect(body.knute.title).toBe('Bikkjå')
    expect(body.knute.sourceLibraryKnuteId).toBe(bikkjaId)
    expect(body.folder.name).toBe('Generelle')

    // The copy + folder + membership + import row all exist for school A.
    const copies = await h.superDb
      .select()
      .from(knuter)
      .where(and(eq(knuter.schoolId, schoolAId), eq(knuter.sourceLibraryKnuteId, bikkjaId)))
    expect(copies).toHaveLength(1)
    const imports = await h.superDb
      .select()
      .from(schoolLibraryImports)
      .where(
        and(eq(schoolLibraryImports.schoolId, schoolAId), eq(schoolLibraryImports.libraryKnuteId, bikkjaId)),
      )
    expect(imports).toHaveLength(1)
  })

  it('409 on re-import (dedupe)', async () => {
    const res = await postImport(authA, bikkjaId)
    expect(res.status).toBe(409)
  })

  it('404 for a nonexistent library knute', async () => {
    const res = await postImport(authA, '00000000-0000-0000-0000-000000000000')
    expect(res.status).toBe(404)
  })

  it('404 for an inactive library knute', async () => {
    const res = await postImport(authA, inaktivId)
    expect(res.status).toBe(404)
  })

  it('copies the unrelaxable 18+ / text-only flags', async () => {
    const res = await postImport(authA, solibatId)
    expect(res.status).toBe(201)
    const body = (await res.json()) as ImportResponse
    expect(body.knute.minAge).toBe(18)
    expect(body.knute.evidenceType).toBe('text')
  })

  it('reuses an existing folder for a second knute in the same suggested_folder', async () => {
    const res = await postImport(authA, romeoId) // also Generelle
    expect(res.status).toBe(201)
    const generelle = await h.superDb
      .select()
      .from(knuteFolders)
      .where(and(eq(knuteFolders.schoolId, schoolAId), eq(knuteFolders.name, 'Generelle')))
    expect(generelle).toHaveLength(1) // not duplicated
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
    const aCount = (await h.superDb.select().from(knuter).where(eq(knuter.schoolId, schoolAId))).length
    const bCount = (await h.superDb.select().from(knuter).where(eq(knuter.schoolId, schoolBId))).length
    expect(aCount).toBe(3) // Bikkjå, Sølibat, Romeo
    expect(bCount).toBe(4) // the pack
  })
})
