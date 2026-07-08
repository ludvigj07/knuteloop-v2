import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, schoolClasses, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let fridaId: string
let odinId: string
let kariId: string
let deletedId: string
let schoolBUserId: string
let fridaToken: string // non-adult viewer
let kariToken: string // adult viewer

const DAY = 24 * 60 * 60 * 1000

type ProfileResponse = {
  user: {
    id: string
    russenavn: string
    role: string
    russType: string
    quote: string | null
    points: number
    className: string | null
    rank: number
    rankTitle: string
    completedCount: number
    goldCount: number
  }
}
type GridItem = {
  id: string
  imageUrl: string | null
  caption: string | null
  createdAt: string
  knuteTitle: string
  knutePoints: number
  evidenceType: 'media' | 'text'
  isGold: boolean
}
type GridResponse = { submissions: GridItem[]; nextCursor: string | null }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const insertedSchools = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = insertedSchools[0]!.id
  schoolBId = insertedSchools[1]!.id

  const [klasse] = await h.superDb
    .insert(schoolClasses)
    .values({ schoolId: schoolAId, name: '3STA' })
    .returning()

  // Points ladder: Odin 60 → rank 1. Frida & Kari both 40 → tiebreak on
  // russenavn asc ('Frida' < 'Kari') → Frida rank 2, Kari rank 3. The deleted
  // user has the MOST points but must not count in anyone's rank.
  const insertedUsers = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'Frida', russType: 'red', quote: 'Heia', points: 40, classId: klasse!.id },
      { schoolId: schoolAId, russenavn: 'Odin', points: 60 },
      { schoolId: schoolAId, russenavn: 'Kari', points: 40, isAdult: true },
      { schoolId: schoolAId, russenavn: 'Slettet', points: 999, deletedAt: new Date() },
      { schoolId: schoolBId, russenavn: 'BKid', points: 10 },
    ])
    .returning()
  fridaId = insertedUsers[0]!.id
  odinId = insertedUsers[1]!.id
  kariId = insertedUsers[2]!.id
  deletedId = insertedUsers[3]!.id
  schoolBUserId = insertedUsers[4]!.id

  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'Frokost', points: 10, difficulty: 'Lett', category: 'Generelle' },
      { schoolId: schoolAId, title: 'Gullkongla', points: 15, difficulty: 'Hard', category: 'Generelle', isGold: true },
      { schoolId: schoolAId, title: 'Tinder', points: 25, difficulty: 'Medium', category: 'Sexknuter' },
      { schoolId: schoolAId, title: 'Voksenknute', points: 30, difficulty: 'Hard', category: 'Alkoholknuter', minAge: 18 },
    ])
    .returning()
  const frokost = insertedKnuter[0]!
  const gull = insertedKnuter[1]!
  const tinder = insertedKnuter[2]!
  const voksen = insertedKnuter[3]!

  const now = Date.now()
  await h.superDb.insert(submissions).values([
    // Frida: THREE approved (distinct knuter, one gold) at distinct times for
    // pagination, plus a pending that must never appear in the grid. The
    // pending sits on a FOURTH knute — the partial unique index allows only
    // one ACTIVE (pending|approved) submission per (user, knute).
    { schoolId: schoolAId, userId: fridaId, knuteId: frokost.id, imageKey: 'bunny/f/1.webp', status: 'approved', createdAt: new Date(now - 2 * DAY) },
    { schoolId: schoolAId, userId: fridaId, knuteId: gull.id, imageKey: 'bunny/f/2.webp', status: 'approved', createdAt: new Date(now - DAY) },
    { schoolId: schoolAId, userId: fridaId, knuteId: tinder.id, imageKey: 'bunny/f/3.webp', status: 'approved', createdAt: new Date(now) },
    { schoolId: schoolAId, userId: fridaId, knuteId: voksen.id, imageKey: 'bunny/f/4.webp', status: 'pending', createdAt: new Date(now) },
    // Odin: one normal + one 18+ approved (viewer age-gate case).
    { schoolId: schoolAId, userId: odinId, knuteId: frokost.id, imageKey: 'bunny/o/1.webp', status: 'approved', createdAt: new Date(now - DAY) },
    { schoolId: schoolAId, userId: odinId, knuteId: voksen.id, imageKey: 'bunny/o/2.webp', status: 'approved', createdAt: new Date(now) },
  ])

  fridaToken = await signDevToken({ sub: fridaId, school_id: schoolAId, role: 'student' })
  kariToken = await signDevToken({ sub: kariId, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

function get(path: string, token: string) {
  return app.request(path, { headers: { Authorization: `Bearer ${token}` } })
}

describe('GET /api/users/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request(`/api/users/${fridaId}`)
    expect(res.status).toBe(401)
  })

  it('rejects a non-uuid id (400)', async () => {
    const res = await get('/api/users/not-a-uuid', fridaToken)
    expect(res.status).toBe(400)
  })

  it('returns identity + stats; no category aggregates in the payload', async () => {
    const res = await get(`/api/users/${fridaId}`, kariToken)
    expect(res.status).toBe(200)
    const body = (await res.json()) as ProfileResponse
    expect(body.user.russenavn).toBe('Frida')
    expect(body.user.russType).toBe('red')
    expect(body.user.quote).toBe('Heia')
    expect(body.user.className).toBe('3STA')
    expect(body.user.completedCount).toBe(3)
    expect(body.user.goldCount).toBe(1)
    // The privacy rule: public profiles NEVER carry per-category breakdowns.
    expect(body.user).not.toHaveProperty('categories')
    expect(body).not.toHaveProperty('categories')
  })

  it('rank matches leaderboard ordering incl. russenavn tiebreak; deleted users excluded', async () => {
    const odin = (await (await get(`/api/users/${odinId}`, fridaToken)).json()) as ProfileResponse
    const frida = (await (await get(`/api/users/${fridaId}`, kariToken)).json()) as ProfileResponse
    const kari = (await (await get(`/api/users/${kariId}`, fridaToken)).json()) as ProfileResponse
    // Slettet has 999p but is soft-deleted → Odin is rank 1, not 2.
    expect(odin.user.rank).toBe(1)
    expect(frida.user.rank).toBe(2) // 40p, 'Frida' < 'Kari'
    expect(kari.user.rank).toBe(3)
    expect(odin.user.rankTitle).toBe("O' Store Knutemester")
  })

  it('another school\'s user → 404 (no existence leak)', async () => {
    const res = await get(`/api/users/${schoolBUserId}`, fridaToken)
    expect(res.status).toBe(404)
  })

  it('soft-deleted user → 404', async () => {
    const res = await get(`/api/users/${deletedId}`, fridaToken)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/users/:id/submissions', () => {
  it('returns only APPROVED submissions, newest first', async () => {
    const res = await get(`/api/users/${fridaId}/submissions`, kariToken)
    expect(res.status).toBe(200)
    const body = (await res.json()) as GridResponse
    expect(body.submissions).toHaveLength(3) // pending excluded
    expect(body.submissions.map((s) => s.knuteTitle)).toEqual(['Tinder', 'Gullkongla', 'Frokost'])
    expect(body.submissions[1]!.isGold).toBe(true)
  })

  it('paginates with the feed cursor contract', async () => {
    const page1 = (await (
      await get(`/api/users/${fridaId}/submissions?limit=2`, kariToken)
    ).json()) as GridResponse
    expect(page1.submissions).toHaveLength(2)
    expect(page1.nextCursor).not.toBeNull()

    const page2 = (await (
      await get(
        `/api/users/${fridaId}/submissions?limit=2&cursor=${encodeURIComponent(page1.nextCursor!)}`,
        kariToken,
      )
    ).json()) as GridResponse
    expect(page2.submissions).toHaveLength(1)
    expect(page2.submissions[0]!.knuteTitle).toBe('Frokost')
    expect(page2.nextCursor).toBeNull()
  })

  it('age-gates the grid for the VIEWER: non-adult never sees 18+ posts', async () => {
    const asMinor = (await (
      await get(`/api/users/${odinId}/submissions`, fridaToken)
    ).json()) as GridResponse
    expect(asMinor.submissions.map((s) => s.knuteTitle)).toEqual(['Frokost'])

    const asAdult = (await (
      await get(`/api/users/${odinId}/submissions`, kariToken)
    ).json()) as GridResponse
    expect(asAdult.submissions.map((s) => s.knuteTitle)).toEqual(['Voksenknute', 'Frokost'])
  })

  it('another school\'s user → 404 for the grid too', async () => {
    const res = await get(`/api/users/${schoolBUserId}/submissions`, fridaToken)
    expect(res.status).toBe(404)
  })
})
