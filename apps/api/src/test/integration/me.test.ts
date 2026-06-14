import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let fridaId: string
let fridaTokenA: string

const DAY = 24 * 60 * 60 * 1000

type CategoryRing = { category: string; total: number; completed: number }
type MeResponse = {
  user: { id: string; russenavn: string; role: string; russType: string; quote: string | null; points: number }
  submissions: { id: string; status: 'pending' | 'approved' | 'rejected'; knuteTitle: string; knutePoints: number }[]
  counts: { approved: number; pending: number; rejected: number }
  completedCount: number
  goldCount: number
  streak: number
  categories: CategoryRing[]
}

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
      { schoolId: schoolAId, russenavn: 'Frida', role: 'student', russType: 'red', quote: 'Heia russ', points: 40 },
      { schoolId: schoolBId, russenavn: 'OtherSchoolKid', role: 'student' },
    ])
    .returning()
  fridaId = insertedUsers[0]!.id
  const otherSchoolUserId = insertedUsers[1]!.id

  // School A knuter: two Generelle (one is a gullknute — note it's only 15p, so
  // the gold count must come from the is_gold FLAG, not a points threshold), one
  // Sexknuter, plus a RETIRED Alkoholknuter (is_active false) to prove inactive
  // knuter are excluded from category totals.
  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'Spis frokost under pulten', points: 10, difficulty: 'Lett', category: 'Generelle' },
      { schoolId: schoolAId, title: 'Gullkongla', points: 15, difficulty: 'Hard', category: 'Generelle', isGold: true },
      { schoolId: schoolAId, title: 'Lag tinderprofil', points: 25, difficulty: 'Medium', category: 'Sexknuter' },
      { schoolId: schoolAId, title: 'Retired drikkeknute', points: 20, difficulty: 'Lett', category: 'Alkoholknuter', isActive: false },
      { schoolId: schoolBId, title: 'B: noe annet', points: 50, difficulty: 'Hard', category: 'Generelle' },
    ])
    .returning()
  const frokost = insertedKnuter[0]! // 10p Generelle, not gold
  const gull = insertedKnuter[1]! // 15p Generelle, is_gold = true
  const tinder = insertedKnuter[2]! // 25p Sexknuter
  const knuteSchoolB = insertedKnuter[4]!

  const now = Date.now()
  // Frida: approved frokost YESTERDAY + approved gull TODAY → 2-day streak.
  // Plus one pending and one rejected (all-time counts must include these).
  await h.superDb.insert(submissions).values([
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: frokost.id,
      imageKey: 'bunny/frida/frokost.webp',
      status: 'approved',
      reviewedAt: new Date(now - DAY),
      createdAt: new Date(now - DAY),
    },
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: gull.id,
      imageKey: 'bunny/frida/gull.webp',
      status: 'approved',
      reviewedAt: new Date(now),
      createdAt: new Date(now),
    },
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: tinder.id,
      imageKey: 'bunny/frida/tinder.webp',
      status: 'pending',
      createdAt: new Date(now),
    },
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: frokost.id,
      imageKey: 'bunny/frida/frokost2.webp',
      status: 'rejected',
      reviewedAt: new Date(now),
      createdAt: new Date(now),
    },
  ])

  // School B has its own data — must NEVER appear in Frida's /me.
  await h.superDb.insert(submissions).values({
    schoolId: schoolBId,
    userId: otherSchoolUserId,
    knuteId: knuteSchoolB.id,
    imageKey: 'bunny/other/1.webp',
    status: 'approved',
    reviewedAt: new Date(now),
  })

  fridaTokenA = await signDevToken({ sub: fridaId, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

function findRing(body: MeResponse, category: string): CategoryRing {
  const ring = body.categories.find((c) => c.category === category)
  if (!ring) throw new Error(`category ${category} missing from response`)
  return ring
}

describe('GET /api/me', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
  })

  it('returns own profile incl. russType + quote', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    expect(res.status).toBe(200)
    const body = (await res.json()) as MeResponse
    expect(body.user.russenavn).toBe('Frida')
    expect(body.user.russType).toBe('red')
    expect(body.user.quote).toBe('Heia russ')
    expect(body.user.id).toBe(fridaId)
  })

  it('counts are all-time (not derived from the last-20 slice)', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    const body = (await res.json()) as MeResponse
    expect(body.counts).toEqual({ approved: 2, pending: 1, rejected: 1 })
  })

  it('completedCount + goldCount are distinct-knute, all-time; gold is flag-based', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    const body = (await res.json()) as MeResponse
    expect(body.completedCount).toBe(2) // frokost + gull (distinct)
    expect(body.goldCount).toBe(1) // the is_gold knute — counted despite being only 15p
  })

  it('streak counts consecutive Oslo days of approved submissions', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    const body = (await res.json()) as MeResponse
    expect(body.streak).toBe(2) // yesterday + today
  })

  it('category rings: totals exclude inactive knuter; completed is a subset of total', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    const body = (await res.json()) as MeResponse

    // All five folders are always present.
    expect(body.categories).toHaveLength(5)

    const generelle = findRing(body, 'Generelle')
    expect(generelle).toEqual({ category: 'Generelle', total: 2, completed: 2 }) // frokost + gull, both Generelle + approved

    const sex = findRing(body, 'Sexknuter')
    expect(sex).toEqual({ category: 'Sexknuter', total: 1, completed: 0 }) // tinder active but only pending → completed < total

    // The retired Alkoholknute is excluded → total 0.
    expect(findRing(body, 'Alkoholknuter').total).toBe(0)
  })

  it('does not leak school B submissions', async () => {
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${fridaTokenA}` } })
    const body = (await res.json()) as MeResponse
    expect(body.submissions.every((s) => s.knuteTitle !== 'B: noe annet')).toBe(true)
  })

  it('returns 404 if the token user no longer exists', async () => {
    const ghostToken = await signDevToken({
      sub: '00000000-0000-0000-0000-000000000000',
      school_id: schoolAId,
      role: 'student',
    })
    const res = await app.request('/api/me', { headers: { Authorization: `Bearer ${ghostToken}` } })
    expect(res.status).toBe(404)
  })
})
