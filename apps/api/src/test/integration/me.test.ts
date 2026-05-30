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
let knuteSchoolBId: string

type MeResponse = {
  user: { id: string; russenavn: string; role: string; points: number }
  submissions: {
    id: string
    status: 'pending' | 'approved' | 'rejected'
    knuteTitle: string
    knutePoints: number
  }[]
  counts: { approved: number; pending: number; rejected: number }
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
      { schoolId: schoolAId, russenavn: 'Frida', role: 'student', points: 35 },
      { schoolId: schoolBId, russenavn: 'OtherSchoolKid', role: 'student' },
    ])
    .returning()
  fridaId = insertedUsers[0]!.id
  const otherSchoolUserId = insertedUsers[1]!.id

  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'Spis frokost under pulten', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'Klassebilde med solbriller', points: 25, difficulty: 'Medium' },
      { schoolId: schoolBId, title: 'B: noe annet', points: 50, difficulty: 'Hard' },
    ])
    .returning()
  const knute1Id = insertedKnuter[0]!.id
  const knute2Id = insertedKnuter[1]!.id
  knuteSchoolBId = insertedKnuter[2]!.id

  // Frida history: 1 approved (10p), 1 pending, 1 rejected
  await h.superDb.insert(submissions).values([
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: knute1Id,
      imageKey: 'bunny/frida/1.webp',
      status: 'approved',
      reviewedAt: new Date(),
    },
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: knute2Id,
      imageKey: 'bunny/frida/2.webp',
      status: 'pending',
    },
    {
      schoolId: schoolAId,
      userId: fridaId,
      knuteId: knute1Id,
      imageKey: 'bunny/frida/3.webp',
      status: 'rejected',
      reviewedAt: new Date(),
    },
  ])

  // School B has a submission too — should NOT appear in Frida's /me.
  await h.superDb.insert(submissions).values({
    schoolId: schoolBId,
    userId: otherSchoolUserId,
    knuteId: knuteSchoolBId,
    imageKey: 'bunny/other/1.webp',
    status: 'pending',
  })

  fridaTokenA = await signDevToken({ sub: fridaId, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/me', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/me')
    expect(res.status).toBe(401)
  })

  it('returns own profile + own submissions + counts', async () => {
    const res = await app.request('/api/me', {
      headers: { Authorization: `Bearer ${fridaTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as MeResponse

    expect(body.user.russenavn).toBe('Frida')
    expect(body.user.role).toBe('student')
    expect(body.user.points).toBe(35)
    expect(body.user.id).toBe(fridaId)

    expect(body.submissions).toHaveLength(3)
    expect(body.counts).toEqual({ approved: 1, pending: 1, rejected: 1 })

    // None from school B
    expect(body.submissions.every((s) => s.knuteTitle !== 'B: noe annet')).toBe(true)
  })

  it('submissions are joined with knute title + points', async () => {
    const res = await app.request('/api/me', {
      headers: { Authorization: `Bearer ${fridaTokenA}` },
    })
    const body = (await res.json()) as MeResponse

    const approved = body.submissions.find((s) => s.status === 'approved')
    expect(approved?.knuteTitle).toBe('Spis frokost under pulten')
    expect(approved?.knutePoints).toBe(10)
  })

  it('returns 404 if the token user no longer exists', async () => {
    // Forge a token for a uuid that doesn't exist
    const ghostToken = await signDevToken({
      sub: '00000000-0000-0000-0000-000000000000',
      school_id: schoolAId,
      role: 'student',
    })
    const res = await app.request('/api/me', {
      headers: { Authorization: `Bearer ${ghostToken}` },
    })
    expect(res.status).toBe(404)
  })
})
