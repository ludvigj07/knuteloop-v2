import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql, eq } from 'drizzle-orm'
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
let knutesjefAId: string
let studentTokenA: string
let knutesjefTokenA: string
let knutesjefTokenB: string
let knuteAId: string // a knute belonging to school A (10 points)
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
      { schoolId: schoolAId, russenavn: 'KnutesjefA', role: 'knutesjef' },
      { schoolId: schoolBId, russenavn: 'KnutesjefB', role: 'knutesjef' },
    ])
    .returning()
  studentAId = insertedUsers[0]!.id
  studentBId = insertedUsers[1]!.id
  knutesjefAId = insertedUsers[2]!.id
  const knutesjefBId = insertedUsers[3]!.id

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
  knutesjefTokenA = await signDevToken({
    sub: knutesjefAId,
    school_id: schoolAId,
    role: 'knutesjef',
  })
  knutesjefTokenB = await signDevToken({
    sub: knutesjefBId,
    school_id: schoolBId,
    role: 'knutesjef',
  })
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

describe('GET /api/submissions/pending', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/submissions/pending')
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is a student', async () => {
    const res = await app.request('/api/submissions/pending', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
  })

  it('happy path — knutesjef sees their school pending queue with russenavn + knute', async () => {
    // Seed one pending submission for school A via the public POST.
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        knuteId: knuteAId,
        imageKey: 'bunny/q/pending-1.webp',
        caption: 'For knutesjef',
      }),
    })
    expect(post.status).toBe(201)

    const res = await app.request('/api/submissions/pending', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      submissions: {
        id: string
        russenavn: string
        knuteTitle: string
        knutePoints: number
        caption: string | null
      }[]
    }

    expect(body.submissions.length).toBeGreaterThanOrEqual(1)
    const matching = body.submissions.find((s) => s.caption === 'For knutesjef')
    expect(matching).toBeDefined()
    expect(matching?.russenavn).toBe('StudentA')
    expect(matching?.knuteTitle).toBe('A: Spis frokost under pulten')
    expect(matching?.knutePoints).toBe(10)
  })

  it('cross-tenant: school B knutesjef does NOT see school A pending', async () => {
    const res = await app.request('/api/submissions/pending', {
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { submissions: { russenavn: string }[] }
    expect(body.submissions.every((s) => s.russenavn !== 'StudentA')).toBe(true)
  })
})

describe('PATCH /api/submissions/:id/approve', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/submissions/00000000-0000-0000-0000-000000000000/approve', {
      method: 'PATCH',
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is a student', async () => {
    const someId = '00000000-0000-0000-0000-000000000001'
    const res = await app.request(`/api/submissions/${someId}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
  })

  it('happy path — approving sets status, records reviewer, awards points', async () => {
    // Seed a pending submission via POST endpoint
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/approve-test.webp' }),
    })
    const submission = ((await post.json()) as CreateResponse).submission

    // Snapshot StudentA points before
    const [before] = await h.superDb.select({ points: users.points }).from(users).where(eq(users.id, studentAId))

    const res = await app.request(`/api/submissions/${submission.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.status).toBe('approved')
    expect(body.submission.id).toBe(submission.id)

    // Points should have gone up by the knute's points (10).
    const [after] = await h.superDb.select({ points: users.points }).from(users).where(eq(users.id, studentAId))
    expect(after!.points).toBe(before!.points + 10)
  })

  it('cross-tenant: school B knutesjef cannot approve school A submission (404)', async () => {
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/cross-tenant.webp' }),
    })
    const submission = ((await post.json()) as CreateResponse).submission

    const res = await app.request(`/api/submissions/${submission.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    expect(res.status).toBe(404)
  })

  it('returns 404 when approving an already-approved submission', async () => {
    // Create + approve once
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/double-approve.webp' }),
    })
    const submission = ((await post.json()) as CreateResponse).submission

    await app.request(`/api/submissions/${submission.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })

    // Approve again — should fail with 404
    const second = await app.request(`/api/submissions/${submission.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(second.status).toBe(404)
  })
})

describe('PATCH /api/submissions/:id/reject', () => {
  it('happy path — rejecting sets status, no points awarded', async () => {
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId: knuteAId, imageKey: 'bunny/reject-test.webp' }),
    })
    const submission = ((await post.json()) as CreateResponse).submission

    const [before] = await h.superDb.select({ points: users.points }).from(users).where(eq(users.id, studentAId))

    const res = await app.request(`/api/submissions/${submission.id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.status).toBe('rejected')

    // Points unchanged
    const [after] = await h.superDb.select({ points: users.points }).from(users).where(eq(users.id, studentAId))
    expect(after!.points).toBe(before!.points)
  })

  it('returns 403 when caller is a student', async () => {
    const someId = '00000000-0000-0000-0000-000000000002'
    const res = await app.request(`/api/submissions/${someId}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
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
