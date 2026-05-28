import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { schools, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let studentAId: string
let studentBId: string
let studentTokenA: string
let knuteAId: string // a knute belonging to school A
let knuteBId: string // a knute belonging to school B

type SubmissionRow = {
  id: string
  schoolId: string
  userId: string
  knuteId: string
  imageKey: string
  caption: string | null
  status: 'pending' | 'approved' | 'rejected'
}
type CreateResponse = { submission: SubmissionRow }
type ErrorResponse = { error: { message: string } }

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
      { schoolId: schoolAId, russenavn: 'StudentA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'StudentB', role: 'student' },
    ])
    .returning()
  studentAId = insertedUsers[0]!.id
  studentBId = insertedUsers[1]!.id

  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A: Spis frokost under pulten', points: 10, difficulty: 'Lett' },
      { schoolId: schoolBId, title: 'B: Helt annerledes knute', points: 50, difficulty: 'Hard' },
    ])
    .returning()
  knuteAId = insertedKnuter[0]!.id
  knuteBId = insertedKnuter[1]!.id

  studentTokenA = await signDevToken({ sub: studentAId, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('POST /api/submissions', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/test.webp' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 with invalid knuteId (not a UUID)', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: 'not-a-uuid', imageKey: 'bunny/test.webp' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 with missing imageKey', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 with oversized caption', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        knuteId: knuteAId,
        imageKey: 'bunny/test.webp',
        caption: 'x'.repeat(501),
      }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 404 when knuteId belongs to ANOTHER school (no info leak)', async () => {
    // School A student tries to submit referencing school B's knute. RLS
    // hides B's knuter from A, so the explicit existence check fails → 404.
    // We assert 404 (not 403) to avoid leaking "this id exists but you can't see it".
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteBId, imageKey: 'bunny/test.webp' }),
    })
    expect(res.status).toBe(404)
    const body = (await res.json()) as ErrorResponse
    expect(body.error.message).toMatch(/knute/i)
  })

  it('happy path — student creates a submission, status defaults to pending', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        knuteId: knuteAId,
        imageKey: 'bunny/school-a/abc123.webp',
        caption: 'Klarte det med solbriller på',
      }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.knuteId).toBe(knuteAId)
    expect(body.submission.schoolId).toBe(schoolAId)
    expect(body.submission.status).toBe('pending')
    expect(body.submission.caption).toBe('Klarte det med solbriller på')
    expect(body.submission.imageKey).toBe('bunny/school-a/abc123.webp')
  })

  it('caption is optional (201 without it)', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/no-caption.webp' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.caption).toBeNull()
  })
})

describe('RLS on submissions table', () => {
  it('cross-tenant: school B submission NOT visible to school A app_user', async () => {
    // Seed a submission for school B (as superuser, bypasses RLS for the seed).
    const seeded = await h.superDb
      .insert(submissions)
      .values({
        schoolId: schoolBId,
        userId: studentBId,
        knuteId: knuteBId,
        imageKey: 'bunny/secret-b.webp',
      })
      .returning()
    const submissionBId = seeded[0]!.id

    // As app_user with school_id=A, RLS should hide the school B row entirely.
    const rows = await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      return tx.select().from(submissions)
    })

    expect(rows.find((r) => r.id === submissionBId)).toBeUndefined()
    expect(rows.every((r) => r.schoolId === schoolAId)).toBe(true)
  })

  it('FORCE RLS for submissions — verified live', async () => {
    const rows = await h.superSql<
      { relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'submissions'`
    expect(rows[0]?.relrowsecurity).toBe(true)
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
