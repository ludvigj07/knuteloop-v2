import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let knutesjefTokenA: string // Loke @ A — can read AND write
let studentTokenA: string // Frida @ A — read only
let knutesjefTokenB: string // Tor @ B — for cross-tenant tests

type KnuteRow = {
  id: string
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
  isGold: boolean
  isActive: boolean
  createdAt: string
}
type ListResponse = { knuter: KnuteRow[] }
type CreateResponse = { knute: KnuteRow & { schoolId: string } }
type ErrorResponse = { error: { message: string; issues?: unknown; requestId?: string } }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const insertedSchools = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = insertedSchools[0]!.id
  schoolBId = insertedSchools[1]!.id

  const insertedUsers = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'knutesjef' },
    ])
    .returning()
  const loke = insertedUsers[0]!
  const frida = insertedUsers[1]!
  const tor = insertedUsers[2]!

  await h.superDb.insert(knuter).values([
    { schoolId: schoolAId, title: 'A: Spis frokost under pulten', points: 10, difficulty: 'Lett' },
    { schoolId: schoolAId, title: 'A: Klassebilde med solbriller', points: 25, difficulty: 'Medium' },
    { schoolId: schoolAId, title: 'A: Retired', points: 0, difficulty: 'Lett', isActive: false },
    { schoolId: schoolBId, title: 'B: Helt annerledes', points: 50, difficulty: 'Hard' },
  ])

  knutesjefTokenA = await signDevToken({ sub: loke.id, school_id: schoolAId, role: 'knutesjef' })
  studentTokenA = await signDevToken({ sub: frida.id, school_id: schoolAId, role: 'student' })
  knutesjefTokenB = await signDevToken({ sub: tor.id, school_id: schoolBId, role: 'knutesjef' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/knuter', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/knuter')
    expect(res.status).toBe(401)
  })

  it('returns 401 with garbage Bearer token', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: 'Bearer not-a-real-token' },
    })
    expect(res.status).toBe(401)
  })

  it('happy path — school A knutesjef sees its own active knuter', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as ListResponse

    expect(body.knuter).toHaveLength(2)
    expect(body.knuter.every((k) => k.isActive)).toBe(true)
    const titles = body.knuter.map((k) => k.title).sort()
    expect(titles).toEqual([
      'A: Klassebilde med solbriller',
      'A: Spis frokost under pulten',
    ])
  })

  it('students can read too (role does not gate GET)', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as ListResponse
    expect(body.knuter).toHaveLength(2)
  })

  it('cross-tenant: school B does NOT see school A knuter', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as ListResponse

    expect(body.knuter).toHaveLength(1)
    expect(body.knuter[0]?.title).toBe('B: Helt annerledes')
  })

  it('?all=1 includes inactive knuter (for knutesjef-panel)', async () => {
    const res = await app.request('/api/knuter?all=1', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as ListResponse

    // Default returns 2 (active only); ?all=1 returns 3 (incl. "A: Retired")
    expect(body.knuter).toHaveLength(3)
    const retired = body.knuter.find((k) => k.title === 'A: Retired')
    expect(retired).toBeDefined()
    expect(retired?.isActive).toBe(false)
  })
})

describe('POST /api/knuter', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'X', points: 10 }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is a student (not knutesjef/admin)', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Student-laget knute', points: 10 }),
    })
    expect(res.status).toBe(403)
    const body = (await res.json()) as ErrorResponse
    expect(body.error.message).toMatch(/knutesjef|admin/i)
  })

  it('returns 400 with empty title', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${knutesjefTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: '   ', points: 10 }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 with missing points', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${knutesjefTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Mangler poeng' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 with difficulty outside the enum', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${knutesjefTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Bad difficulty', points: 5, difficulty: 'Ekstrem' }),
    })
    expect(res.status).toBe(400)
  })

  it('happy path — knutesjef creates a knute and it appears in subsequent GET', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${knutesjefTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: 'A: Ny knute fra knutesjef',
        description: 'Lagt til via API',
        points: 42,
        difficulty: 'Hard',
      }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.knute.title).toBe('A: Ny knute fra knutesjef')
    expect(body.knute.points).toBe(42)
    expect(body.knute.difficulty).toBe('Hard')
    expect(body.knute.schoolId).toBe(schoolAId)

    // Verify it shows up in the school's list
    const listRes = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    const listBody = (await listRes.json()) as ListResponse
    expect(listBody.knuter.some((k) => k.title === 'A: Ny knute fra knutesjef')).toBe(true)

    // And NOT in school B's list (cross-tenant isolation on freshly inserted row)
    const otherSchoolList = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    const otherBody = (await otherSchoolList.json()) as ListResponse
    expect(otherBody.knuter.some((k) => k.title === 'A: Ny knute fra knutesjef')).toBe(false)
  })

  it('defaults difficulty to Medium when omitted', async () => {
    const res = await app.request('/api/knuter', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${knutesjefTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'A: No difficulty given', points: 7 }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.knute.difficulty).toBe('Medium')
  })

  it('defaults isGold to false, and accepts isGold: true', async () => {
    const plain = await app.request('/api/knuter', {
      method: 'POST',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'A: Vanlig knute', points: 5 }),
    })
    expect(((await plain.json()) as CreateResponse).knute.isGold).toBe(false)

    const gold = await app.request('/api/knuter', {
      method: 'POST',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'A: Gullkongla', points: 5, isGold: true }),
    })
    expect(gold.status).toBe(201)
    expect(((await gold.json()) as CreateResponse).knute.isGold).toBe(true)
  })
})

describe('PATCH /api/knuter/:id', () => {
  // Helper: insert a fresh knute we can mutate without disturbing other tests.
  async function freshKnute(title: string, overrides: Partial<typeof knuter.$inferInsert> = {}) {
    const [row] = await h.superDb
      .insert(knuter)
      .values({
        schoolId: schoolAId,
        title,
        points: 10,
        difficulty: 'Lett',
        ...overrides,
      })
      .returning()
    return row!
  }

  it('returns 401 without auth', async () => {
    const k = await freshKnute('A: PATCH 401')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'changed' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is a student', async () => {
    const k = await freshKnute('A: PATCH 403')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'student-edit' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 with an empty body (no fields)', async () => {
    const k = await freshKnute('A: PATCH 400 empty')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 with points out of range', async () => {
    const k = await freshKnute('A: PATCH 400 bad points')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ points: 99999 }),
    })
    expect(res.status).toBe(400)
  })

  it('happy path — knutesjef updates title, points, difficulty', async () => {
    const k = await freshKnute('A: PATCH happy')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Endret tittel', points: 42, difficulty: 'Hard' }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as CreateResponse
    expect(body.knute.title).toBe('Endret tittel')
    expect(body.knute.points).toBe(42)
    expect(body.knute.difficulty).toBe('Hard')
  })

  it('soft-retire via isActive=false hides it from default GET', async () => {
    const k = await freshKnute('A: To be retired')

    const patch = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    })
    expect(patch.status).toBe(200)
    expect(((await patch.json()) as CreateResponse).knute.isActive).toBe(false)

    // Default GET no longer includes it
    const list = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    const body = (await list.json()) as ListResponse
    expect(body.knuter.some((row) => row.id === k.id)).toBe(false)

    // But ?all=1 does
    const all = await app.request('/api/knuter?all=1', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    const allBody = (await all.json()) as ListResponse
    expect(allBody.knuter.some((row) => row.id === k.id)).toBe(true)
  })

  it('can toggle isGold on an existing knute', async () => {
    const k = await freshKnute('A: PATCH gold toggle')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ isGold: true }),
    })
    expect(res.status).toBe(200)
    expect(((await res.json()) as CreateResponse).knute.isGold).toBe(true)
  })

  it('cross-tenant: school B knutesjef cannot edit school A knute (404)', async () => {
    const k = await freshKnute('A: cross-tenant')
    const res = await app.request(`/api/knuter/${k.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenB}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'evil' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 404 for a uuid that does not exist anywhere', async () => {
    const res = await app.request('/api/knuter/00000000-0000-0000-0000-000000000000', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'phantom' }),
    })
    expect(res.status).toBe(404)
  })
})

describe('RLS: FORCE on knuter table', () => {
  it('FORCE RLS for knuter — verified live', async () => {
    const rows = await h.superSql<
      { relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'knuter'`
    expect(rows[0]?.relrowsecurity).toBe(true)
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
