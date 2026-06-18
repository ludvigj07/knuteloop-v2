import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import {
  schools,
  users,
  knuter,
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
let knutesjefTokenA: string
let studentTokenA: string
let knutesjefTokenB: string
let authA: Record<string, string>
let authB: Record<string, string>
let adminAuth: Record<string, string>
let starterPackId: string
let bikkjaId: string // a library knute school A will have "imported"

type LibKnute = {
  id: string
  title: string
  suggestedFolder: string
  region: string | null
  evidenceType: string
  minAge: number
  imported: boolean
}
type KnuterResponse = { knuter: LibKnute[] }
type PacksResponse = { packs: { id: string; name: string; knuteCount: number }[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [a, b] = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = a!.id
  schoolBId = b!.id

  const [loke, frida, tor, adminA] = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'AdminA', role: 'admin' },
    ])
    .returning()

  // The shared library catalog — seeded as superuser (the app role is read-only).
  // Covers all axes the browse endpoint filters on: folder, region, evidence, age.
  const lib = await h.superDb
    .insert(libraryKnuter)
    .values([
      { title: 'Bikkjå', points: 10, suggestedFolder: 'Generelle', region: null },
      { title: 'Badenymfen', points: 22, suggestedFolder: 'Generelle', region: 'Stavanger' },
      { title: 'Bronsetråd', points: 25, suggestedFolder: 'Dobbel', region: null },
      { title: 'Ny Dag', points: 12, suggestedFolder: 'Alkohol', region: null },
      { title: 'Sølibat', points: 0, suggestedFolder: 'Sex', evidenceType: 'text', minAge: 18 },
      { title: 'Konsultasjon', points: 35, suggestedFolder: 'Sex', evidenceType: 'text', minAge: 18 },
      // Retired catalog entry — must be excluded from browse + not counted in packs.
      { title: 'Inaktiv', points: 5, suggestedFolder: 'Generelle', isActive: false },
    ])
    .returning()
  bikkjaId = lib.find((k) => k.title === 'Bikkjå')!.id

  // "Anbefalt starter" = non-Sex knuter (incl. the inactive 'Inaktiv', so we can prove
  // knuteCount/browse count only ACTIVE members). Plus an inactive pack that must be hidden.
  const insertedPacks = await h.superDb
    .insert(libraryPacks)
    .values([
      { name: 'Anbefalt starter', sortOrder: 0 },
      { name: 'Gammel pakke', sortOrder: 1, isActive: false },
    ])
    .returning()
  starterPackId = insertedPacks.find((p) => p.name === 'Anbefalt starter')!.id
  await h.superDb.insert(libraryPackMemberships).values(
    lib
      .filter((k) => k.suggestedFolder !== 'Sex')
      .map((k) => ({ packId: starterPackId, libraryKnuteId: k.id })),
  )

  // School A imports Bikkjå: a copy in `knuter` + the import record (drives the
  // per-school "imported" badge). School B imports nothing.
  const [copy] = await h.superDb
    .insert(knuter)
    .values({
      schoolId: schoolAId,
      title: 'Bikkjå',
      points: 10,
      difficulty: 'Lett',
      sourceLibraryKnuteId: bikkjaId,
    })
    .returning()
  await h.superDb.insert(schoolLibraryImports).values({
    schoolId: schoolAId,
    libraryKnuteId: bikkjaId,
    knuteId: copy!.id,
    importedByUserId: loke!.id,
  })

  knutesjefTokenA = await signDevToken({ sub: loke!.id, school_id: schoolAId, role: 'knutesjef' })
  studentTokenA = await signDevToken({ sub: frida!.id, school_id: schoolAId, role: 'student' })
  knutesjefTokenB = await signDevToken({ sub: tor!.id, school_id: schoolBId, role: 'knutesjef' })
  const adminTokenA = await signDevToken({ sub: adminA!.id, school_id: schoolAId, role: 'admin' })
  authA = { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' }
  authB = { Authorization: `Bearer ${knutesjefTokenB}`, 'content-type': 'application/json' }
  adminAuth = { Authorization: `Bearer ${adminTokenA}`, 'content-type': 'application/json' }
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/library/knuter', () => {
  it('401 without auth', async () => {
    expect((await app.request('/api/library/knuter')).status).toBe(401)
  })

  it('403 for a student (library is a knutesjef/admin curation tool)', async () => {
    const res = await app.request('/api/library/knuter', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
  })

  it('knutesjef sees the whole shared catalog incl. 18+ entries (no age gate in the library)', async () => {
    const res = await app.request('/api/library/knuter', { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter).toHaveLength(6)
    // 18+ Sex knuter ARE visible to the curating knutesjef.
    expect(body.knuter.some((k) => k.title === 'Sølibat' && k.minAge === 18)).toBe(true)
  })

  it('?folder=Sex narrows to the Sex folder (text-only, 18+)', async () => {
    const res = await app.request('/api/library/knuter?folder=Sex', { headers: authA })
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter.map((k) => k.title).sort()).toEqual(['Konsultasjon', 'Sølibat'])
    expect(body.knuter.every((k) => k.evidenceType === 'text' && k.minAge === 18)).toBe(true)
  })

  it('?region=Stavanger and ?region=nasjonalt split on the geography axis', async () => {
    const sta = (await (await app.request('/api/library/knuter?region=Stavanger', { headers: authA })).json()) as KnuterResponse
    expect(sta.knuter.map((k) => k.title)).toEqual(['Badenymfen'])
    const nasj = (await (await app.request('/api/library/knuter?region=nasjonalt', { headers: authA })).json()) as KnuterResponse
    expect(nasj.knuter.some((k) => k.title === 'Badenymfen')).toBe(false)
    expect(nasj.knuter.length).toBe(5)
  })

  it('?q= does a case-insensitive title/description search', async () => {
    const res = await app.request('/api/library/knuter?q=BIKK', { headers: authA })
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter.map((k) => k.title)).toEqual(['Bikkjå'])
  })

  it('?packId= narrows to the pack contents', async () => {
    const res = await app.request(`/api/library/knuter?packId=${starterPackId}`, { headers: authA })
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter).toHaveLength(4)
    expect(body.knuter.some((k) => k.suggestedFolder === 'Sex')).toBe(false)
  })

  it('imported flag is per-school: A sees Bikkjå as imported, B does not', async () => {
    const a = (await (await app.request('/api/library/knuter', { headers: authA })).json()) as KnuterResponse
    expect(a.knuter.find((k) => k.title === 'Bikkjå')?.imported).toBe(true)
    expect(a.knuter.filter((k) => k.imported)).toHaveLength(1)

    const b = (await (await app.request('/api/library/knuter', { headers: authB })).json()) as KnuterResponse
    // B sees the same shared catalog but has imported nothing.
    expect(b.knuter).toHaveLength(6)
    expect(b.knuter.every((k) => !k.imported)).toBe(true)
  })

  it('combined filters intersect (folder + region)', async () => {
    const res = await app.request('/api/library/knuter?folder=Generelle&region=Stavanger', { headers: authA })
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter.map((k) => k.title)).toEqual(['Badenymfen'])
  })

  it('inactive library knuter are excluded from browse', async () => {
    const res = await app.request('/api/library/knuter', { headers: authA })
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter.some((k) => k.title === 'Inaktiv')).toBe(false)
  })

  it('?packId for an empty/nonexistent pack returns an empty list', async () => {
    const res = await app.request('/api/library/knuter?packId=00000000-0000-0000-0000-000000000000', { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as KnuterResponse
    expect(body.knuter).toEqual([])
  })

  it('admin role may browse', async () => {
    expect((await app.request('/api/library/knuter', { headers: adminAuth })).status).toBe(200)
  })
})

describe('GET /api/library/packs', () => {
  it('401 without auth', async () => {
    expect((await app.request('/api/library/packs')).status).toBe(401)
  })

  it('403 for a student', async () => {
    const res = await app.request('/api/library/packs', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
  })

  it('lists active packs; knuteCount counts only ACTIVE members; inactive packs hidden', async () => {
    const res = await app.request('/api/library/packs', { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as PacksResponse
    const starter = body.packs.find((p) => p.name === 'Anbefalt starter')
    // 4 active non-Sex members — the inactive 'Inaktiv' member is in the pack but NOT counted.
    expect(starter?.knuteCount).toBe(4)
    expect(body.packs.some((p) => p.name === 'Gammel pakke')).toBe(false)
  })

  it('admin role may list packs', async () => {
    expect((await app.request('/api/library/packs', { headers: adminAuth })).status).toBe(200)
  })
})

describe('library catalog is read-only for the app role', () => {
  // These also prove app_role does NOT own the tables — an owner would bypass the
  // REVOKE since library_* have no RLS (the deployment invariant in migration 0014).
  it('app_role cannot INSERT into library_knuter (REVOKE in migration 0014)', async () => {
    await expect(
      h.appDb.insert(libraryKnuter).values({ title: 'illegal', points: 1, suggestedFolder: 'Generelle' }),
    ).rejects.toThrow()
  })

  it('app_role cannot UPDATE or DELETE library_knuter', async () => {
    await expect(
      h.appDb.update(libraryKnuter).set({ points: 999 }).where(eq(libraryKnuter.id, bikkjaId)),
    ).rejects.toThrow()
    await expect(h.appDb.delete(libraryKnuter).where(eq(libraryKnuter.id, bikkjaId))).rejects.toThrow()
  })

  it('app_role cannot write library_packs or library_pack_memberships', async () => {
    await expect(h.appDb.insert(libraryPacks).values({ name: 'rogue' })).rejects.toThrow()
    await expect(
      h.appDb.insert(libraryPackMemberships).values({ packId: starterPackId, libraryKnuteId: bikkjaId }),
    ).rejects.toThrow()
  })
})

describe('RLS: FORCE on school_library_imports', () => {
  it('FORCE row security is live', async () => {
    const rows = await h.superSql<{ relforcerowsecurity: boolean }[]>`
      SELECT relforcerowsecurity FROM pg_class WHERE relname = 'school_library_imports'`
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
