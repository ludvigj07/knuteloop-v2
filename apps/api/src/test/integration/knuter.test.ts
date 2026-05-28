import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let tokenA: string
let tokenB: string

type KnuteRow = {
  id: string
  title: string
  description: string | null
  points: number
  difficulty: 'Lett' | 'Medium' | 'Hard' | 'Valgfri'
  isActive: boolean
  createdAt: string
}
type KnuterResponse = { knuter: KnuteRow[] }

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
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'student' },
    ])
    .returning()
  const userA = insertedUsers[0]!
  const userB = insertedUsers[1]!

  // Each school gets its own knuter. Superuser bypasses RLS so we can insert
  // for both tenants from a single connection.
  await h.superDb.insert(knuter).values([
    {
      schoolId: schoolAId,
      title: 'A: Spis frokost under pulten',
      points: 10,
      difficulty: 'Lett',
    },
    {
      schoolId: schoolAId,
      title: 'A: Klassebilde med solbriller',
      points: 25,
      difficulty: 'Medium',
    },
    {
      schoolId: schoolAId,
      title: 'A: Retired (inactive)',
      points: 0,
      difficulty: 'Lett',
      isActive: false,
    },
    {
      schoolId: schoolBId,
      title: 'B: Helt annerledes knute',
      points: 50,
      difficulty: 'Hard',
    },
  ])

  tokenA = await signDevToken({ sub: userA.id, school_id: schoolAId, role: 'student' })
  tokenB = await signDevToken({ sub: userB.id, school_id: schoolBId, role: 'student' })
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

  it('happy path — school A sees its own active knuter', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as KnuterResponse

    // 2 active for A (the third is isActive=false, filtered out)
    expect(body.knuter).toHaveLength(2)
    const titles = body.knuter.map((k) => k.title).sort()
    expect(titles).toEqual([
      'A: Klassebilde med solbriller',
      'A: Spis frokost under pulten',
    ])
    expect(body.knuter.every((k) => k.isActive)).toBe(true)
  })

  it('cross-tenant: school B does NOT see school A knuter', async () => {
    const res = await app.request('/api/knuter', {
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as KnuterResponse

    expect(body.knuter).toHaveLength(1)
    expect(body.knuter[0]?.title).toBe('B: Helt annerledes knute')
    expect(body.knuter.some((k) => k.title.startsWith('A:'))).toBe(false)
  })

  it('FORCE RLS for knuter — verified live', async () => {
    const rows = await h.superSql<
      { relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'knuter'`
    expect(rows[0]?.relrowsecurity).toBe(true)
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
