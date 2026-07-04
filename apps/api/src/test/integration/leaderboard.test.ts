import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schoolClasses, schools, users } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let user1AId: string
let user2AId: string
let tokenUser1A: string
let tokenSchoolB: string

type LeaderboardEntry = {
  userId: string
  russenavn: string
  points: number
  className: string | null
  rank: number
  rankTitle: string
  isCurrentUser: boolean
}
type Response = { leaderboard: LeaderboardEntry[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const insertedSchools = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = insertedSchools[0]!.id
  schoolBId = insertedSchools[1]!.id

  // A class per school. Same NAME on purpose: unique is per school, and the
  // cross-tenant join test below must show that school A never resolves school
  // B's class row even when a class_id points across the tenant boundary.
  const insertedClasses = await h.superDb
    .insert(schoolClasses)
    .values([
      { schoolId: schoolAId, name: '3STA' },
      { schoolId: schoolBId, name: '3STA' },
    ])
    .returning()
  const classAId = insertedClasses[0]!.id
  const classBId = insertedClasses[1]!.id

  const insertedUsers = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'Alpha', role: 'student', points: 100, classId: classAId },
      { schoolId: schoolAId, russenavn: 'Beta', role: 'student', points: 250, classId: classAId },
      // Charlie's class_id points at SCHOOL B's class — a state only a bug or a
      // malicious write could produce (no endpoint sets class yet). RLS on
      // school_classes must hide the row from school A's join → className null.
      { schoolId: schoolAId, russenavn: 'Charlie', role: 'student', points: 50, classId: classBId },
      // Soft-deleted — should NOT appear on the board.
      {
        schoolId: schoolAId,
        russenavn: 'Ghost',
        role: 'student',
        points: 999,
        deletedAt: new Date(),
      },
      // School B users — should never appear on School A's board.
      { schoolId: schoolBId, russenavn: 'SchoolBStudent', role: 'student', points: 500 },
    ])
    .returning()
  user1AId = insertedUsers[0]!.id // Alpha (100 points)
  user2AId = insertedUsers[1]!.id // Beta (250 points — top)
  const userBId = insertedUsers[4]!.id

  tokenUser1A = await signDevToken({ sub: user1AId, school_id: schoolAId, role: 'student' })
  tokenSchoolB = await signDevToken({ sub: userBId, school_id: schoolBId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/leaderboard', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/leaderboard')
    expect(res.status).toBe(401)
  })

  it('happy path — sorted by points desc, rank assigned, deleted excluded', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Response

    // 3 active users (Ghost is soft-deleted, school B excluded by RLS)
    expect(body.leaderboard).toHaveLength(3)
    expect(body.leaderboard.map((e) => e.russenavn)).toEqual(['Beta', 'Alpha', 'Charlie'])
    expect(body.leaderboard.map((e) => e.points)).toEqual([250, 100, 50])
    expect(body.leaderboard.map((e) => e.rank)).toEqual([1, 2, 3])
    // No Ghost (deletedAt set)
    expect(body.leaderboard.some((e) => e.russenavn === 'Ghost')).toBe(false)
    // No school B users
    expect(body.leaderboard.some((e) => e.russenavn === 'SchoolBStudent')).toBe(false)
  })

  it('rankTitle follows the rank (v1-spec §6)', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    const body = (await res.json()) as Response
    // Beta=rank 1, Alpha=rank 2, Charlie=rank 3.
    expect(body.leaderboard.map((e) => e.rankTitle)).toEqual([
      "O' Store Knutemester",
      'Knutemester',
      'Knutemester',
    ])
  })

  it('isCurrentUser flag highlights the requester', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    const body = (await res.json()) as Response
    const me = body.leaderboard.find((e) => e.isCurrentUser)
    expect(me?.russenavn).toBe('Alpha')
    expect(me?.userId).toBe(user1AId)
  })

  it('cross-tenant: school B does not see school A users', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenSchoolB}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as Response
    expect(body.leaderboard).toHaveLength(1)
    expect(body.leaderboard[0]?.russenavn).toBe('SchoolBStudent')
    expect(body.leaderboard.some((e) => e.russenavn === 'Beta')).toBe(false)
  })

  it('Beta appears as rank 1 — the highest-points user is top', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    const body = (await res.json()) as Response
    expect(body.leaderboard[0]?.userId).toBe(user2AId)
    expect(body.leaderboard[0]?.rank).toBe(1)
  })

  it('className rides along; class-less users get null', async () => {
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    const body = (await res.json()) as Response
    const byName = new Map(body.leaderboard.map((e) => [e.russenavn, e.className]))
    expect(byName.get('Alpha')).toBe('3STA')
    expect(byName.get('Beta')).toBe('3STA')
  })

  it('cross-tenant: a class_id pointing at another school\'s class resolves to null, never the foreign name', async () => {
    // Charlie (school A) has class_id → school B's «3STA» row. RLS on
    // school_classes hides that row from school A's join — the leaderboard
    // must show null, not school B's class name.
    const res = await app.request('/api/leaderboard', {
      headers: { Authorization: `Bearer ${tokenUser1A}` },
    })
    const body = (await res.json()) as Response
    const charlie = body.leaderboard.find((e) => e.russenavn === 'Charlie')
    expect(charlie).toBeDefined()
    expect(charlie?.className).toBeNull()
  })
})
