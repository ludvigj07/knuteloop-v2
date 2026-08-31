import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

// GET /api/knuter/dagens — deterministic daily pick (v1-spec §3, Oslo day).
// Own fixture file: the pools are crafted so assertions are date-independent
// (a minor's pool at School A has exactly ONE knute → the pick is exact).

let h: TestHandles
let app: ReturnType<typeof buildApp>

let minorTokenA: string
let adultTokenA: string
let tokenB: string
let tokenC: string // school C has zero knuter

let allAgesTitleA: string
let adultTitleA: string
let titleB: string

type DagensResponse = {
  dagens: { id: string; title: string; points: number } | null
}

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const insertedSchools = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }, { name: 'School C (tom)' }])
    .returning()
  const schoolAId = insertedSchools[0]!.id
  const schoolBId = insertedSchools[1]!.id
  const schoolCId = insertedSchools[2]!.id

  const insertedUsers = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'MindreårigA', role: 'student' }, // isAdult default false
      { schoolId: schoolAId, russenavn: 'VoksenA', role: 'student', isAdult: true },
      { schoolId: schoolBId, russenavn: 'EleveB', role: 'student' },
      { schoolId: schoolCId, russenavn: 'EleveC', role: 'student' },
    ])
    .returning()

  // School A: one all-ages active knute, one 18+ active knute, one inactive.
  // → a minor's pool is exactly [allAges]; an adult's pool is both actives.
  allAgesTitleA = 'A: For alle'
  adultTitleA = 'A: Kun voksne'
  await h.superDb.insert(knuter).values([
    { schoolId: schoolAId, title: allAgesTitleA, points: 10 },
    { schoolId: schoolAId, title: adultTitleA, points: 20, minAge: 18 },
    { schoolId: schoolAId, title: 'A: Pensjonert', points: 30, isActive: false },
  ])

  titleB = 'B: Sin egen'
  await h.superDb.insert(knuter).values([
    { schoolId: schoolBId, title: titleB, points: 15 },
  ])

  minorTokenA = await signDevToken({
    sub: insertedUsers[0]!.id,
    school_id: schoolAId,
    role: 'student',
  })
  adultTokenA = await signDevToken({
    sub: insertedUsers[1]!.id,
    school_id: schoolAId,
    role: 'student',
  })
  tokenB = await signDevToken({ sub: insertedUsers[2]!.id, school_id: schoolBId, role: 'student' })
  tokenC = await signDevToken({ sub: insertedUsers[3]!.id, school_id: schoolCId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/knuter/dagens', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/knuter/dagens')
    expect(res.status).toBe(401)
  })

  it('minor: picks the single eligible knute — never the 18+ or inactive one', async () => {
    const res = await app.request('/api/knuter/dagens', {
      headers: { Authorization: `Bearer ${minorTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as DagensResponse
    // Pool for a minor = exactly one knute, so the pick is exact regardless of date.
    expect(body.dagens?.title).toBe(allAgesTitleA)
  })

  it('adult: picks from the full active pool, deterministically within the day', async () => {
    const first = (await (
      await app.request('/api/knuter/dagens', {
        headers: { Authorization: `Bearer ${adultTokenA}` },
      })
    ).json()) as DagensResponse
    const second = (await (
      await app.request('/api/knuter/dagens', {
        headers: { Authorization: `Bearer ${adultTokenA}` },
      })
    ).json()) as DagensResponse

    expect([allAgesTitleA, adultTitleA]).toContain(first.dagens?.title)
    expect(second.dagens?.id).toBe(first.dagens?.id) // same day → same pick
  })

  it('cross-tenant: school B gets its own knute, never school A data', async () => {
    const res = await app.request('/api/knuter/dagens', {
      headers: { Authorization: `Bearer ${tokenB}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as DagensResponse
    expect(body.dagens?.title).toBe(titleB)
  })

  it('a school with zero knuter gets null (200, not an error)', async () => {
    const res = await app.request('/api/knuter/dagens', {
      headers: { Authorization: `Bearer ${tokenC}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as DagensResponse
    expect(body.dagens).toBeNull()
  })
})
