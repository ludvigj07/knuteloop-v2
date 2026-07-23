import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { and, count, eq, sql } from 'drizzle-orm'
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

// Insert a fresh school-A knute on demand. Each test that submits should use
// its own to avoid colliding with the (user, knute) pending/approved dedupe.
async function freshKnuteA(label: string) {
  const [row] = await h.superDb
    .insert(knuter)
    .values({
      schoolId: schoolAId,
      title: `A: ${label}`,
      points: 10,
      difficulty: 'Lett',
    })
    .returning()
  return row!.id
}

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
    const knuteId = await freshKnuteA('happy path')
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        knuteId,
        imageKey: 'bunny/school-a/abc123.webp',
        caption: 'Klarte det med solbriller på',
      }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.knuteId).toBe(knuteId)
    expect(body.submission.schoolId).toBe(schoolAId)
    expect(body.submission.status).toBe('pending')
    expect(body.submission.caption).toBe('Klarte det med solbriller på')
    expect(body.submission.imageKey).toBe('bunny/school-a/abc123.webp')
  })

  it('caption is optional (201 without it)', async () => {
    const knuteId = await freshKnuteA('caption optional')
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/no-caption.webp' }),
    })
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.caption).toBeNull()
  })

  it('blocks re-submission when a pending submission already exists (409)', async () => {
    const knuteId = await freshKnuteA('pending dup')
    const first = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/dup-pending-1.webp' }),
    })
    expect(first.status).toBe(201)

    const second = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/dup-pending-2.webp' }),
    })
    expect(second.status).toBe(409)
    const body = (await second.json()) as ErrorResponse
    expect(body.error.message).toMatch(/venter på godkjenning/i)
  })

  it('blocks re-submission when an approved submission already exists (409)', async () => {
    const knuteId = await freshKnuteA('approved dup')
    // Seed an approved submission directly so we don't need to drive the
    // approval endpoint through HTTP.
    await h.superDb.insert(submissions).values({
      schoolId: schoolAId,
      userId: studentAId,
      knuteId,
      imageKey: 'bunny/dup-approved-seed.webp',
      status: 'approved',
      reviewedAt: new Date(),
    })

    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/dup-approved-retry.webp' }),
    })
    expect(res.status).toBe(409)
    const body = (await res.json()) as ErrorResponse
    expect(body.error.message).toMatch(/godkjent/i)
  })

  it('ALLOWS re-submission when only a rejected submission exists', async () => {
    const knuteId = await freshKnuteA('rejected retry')
    await h.superDb.insert(submissions).values({
      schoolId: schoolAId,
      userId: studentAId,
      knuteId,
      imageKey: 'bunny/dup-rejected-first.webp',
      status: 'rejected',
      reviewedAt: new Date(),
    })

    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/dup-rejected-retry.webp' }),
    })
    expect(res.status).toBe(201)
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
    const knuteId = await freshKnuteA('pending queue')
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        knuteId,
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
    expect(matching?.knuteTitle).toBe('A: pending queue')
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

  it('paginates with cursor — walks all pages without duplicates or gaps', async () => {
    // Three staggered pending rows far in the past, so their cursor order is
    // deterministic (API-created rows from other tests all sit at "now" and
    // therefore come first in the DESC walk).
    const base = Date.parse('2026-05-01T12:00:00.000Z')
    const knuteIds = [
      await freshKnuteA('page walk 0'),
      await freshKnuteA('page walk 1'),
      await freshKnuteA('page walk 2'),
    ]
    const inserted = await h.superDb
      .insert(submissions)
      .values(
        knuteIds.map((knuteId, i) => ({
          schoolId: schoolAId,
          userId: studentAId,
          knuteId,
          imageKey: `placeholder/page-walk-${i}.jpg`,
          status: 'pending' as const,
          createdAt: new Date(base + i * 60_000),
        })),
      )
      .returning()
    const freshIds = inserted.map((r) => r.id)

    type PendingPage = { submissions: { id: string }[]; nextCursor: string | null }
    const seen: string[] = []
    let cursor: string | null = null
    for (let guard = 0; guard < 20; guard++) {
      const qs: string = cursor ? `?limit=2&cursor=${encodeURIComponent(cursor)}` : '?limit=2'
      const res = await app.request(`/api/submissions/pending${qs}`, {
        headers: { Authorization: `Bearer ${knutesjefTokenA}` },
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as PendingPage
      expect(body.submissions.length).toBeLessThanOrEqual(2)
      seen.push(...body.submissions.map((s) => s.id))
      if (!body.nextCursor) break
      cursor = body.nextCursor
    }

    expect(new Set(seen).size).toBe(seen.length) // no duplicates across pages
    for (const id of freshIds) expect(seen).toContain(id) // nothing skipped
  })

  it('returns 400 for a malformed cursor', async () => {
    const res = await app.request('/api/submissions/pending?cursor=ikke-en-dato', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for limit above max', async () => {
    const res = await app.request('/api/submissions/pending?limit=999', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(res.status).toBe(400)
  })
})

describe('GET /api/submissions/pending/count', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/submissions/pending/count')
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is a student', async () => {
    const res = await app.request('/api/submissions/pending/count', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(403)
  })

  it('matches each school\'s own pending rows — cross-tenant isolated', async () => {
    // Ground truth straight from the DB (superDb bypasses RLS), so the test is
    // robust to however many pending rows earlier tests have created.
    const [expectedA] = await h.superDb
      .select({ n: count() })
      .from(submissions)
      .where(and(eq(submissions.schoolId, schoolAId), eq(submissions.status, 'pending')))
    const [expectedB] = await h.superDb
      .select({ n: count() })
      .from(submissions)
      .where(and(eq(submissions.schoolId, schoolBId), eq(submissions.status, 'pending')))

    const resA = await app.request('/api/submissions/pending/count', {
      headers: { Authorization: `Bearer ${knutesjefTokenA}` },
    })
    expect(resA.status).toBe(200)
    expect(((await resA.json()) as { count: number }).count).toBe(expectedA!.n)
    // The pending tests above guarantee school A has a non-empty queue — so a
    // count that ignored the tenant filter could not pass both assertions.
    expect(expectedA!.n).toBeGreaterThan(0)

    const resB = await app.request('/api/submissions/pending/count', {
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    expect(resB.status).toBe(200)
    expect(((await resB.json()) as { count: number }).count).toBe(expectedB!.n)
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
    const knuteId = await freshKnuteA('approve happy')
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/approve-test.webp' }),
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
    const knuteId = await freshKnuteA('approve cross-tenant')
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/cross-tenant.webp' }),
    })
    const submission = ((await post.json()) as CreateResponse).submission

    const res = await app.request(`/api/submissions/${submission.id}/approve`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${knutesjefTokenB}` },
    })
    expect(res.status).toBe(404)
  })

  it('returns 404 when approving an already-approved submission', async () => {
    const knuteId = await freshKnuteA('double-approve')
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/double-approve.webp' }),
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
    const knuteId = await freshKnuteA('reject happy')
    const post = await app.request('/api/submissions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentTokenA}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ knuteId, imageKey: 'bunny/reject-test.webp' }),
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

describe('POST /api/submissions — age gate (ADR-0015)', () => {
  let adultTokenA: string
  let age18KnuteId: string

  beforeAll(async () => {
    const [adult] = await h.superDb
      .insert(users)
      .values({ schoolId: schoolAId, russenavn: 'VoksenSub', role: 'student', isAdult: true })
      .returning()
    adultTokenA = await signDevToken({ sub: adult!.id, school_id: schoolAId, role: 'student' })
    const [k] = await h.superDb
      .insert(knuter)
      .values({ schoolId: schoolAId, title: 'A: 18+ submit', points: 40, difficulty: 'Hard', minAge: 18 })
      .returning()
    age18KnuteId = k!.id
  })

  it('a minor cannot submit an 18+ knute (404, not 403 — no info leak)', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId: age18KnuteId, imageKey: 'bunny/age/x.webp' }),
    })
    expect(res.status).toBe(404)
  })

  it('a verified adult can submit an 18+ knute', async () => {
    const res = await app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adultTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ knuteId: age18KnuteId, imageKey: 'bunny/age/ok.webp' }),
    })
    expect(res.status).toBe(201)
  })
})

describe('POST /api/submissions — text-only knuter (ADR-0014)', () => {
  async function freshTextKnute(label: string) {
    const [row] = await h.superDb
      .insert(knuter)
      .values({
        schoolId: schoolAId,
        title: `A: tekst ${label}`,
        points: 20,
        difficulty: 'Medium',
        evidenceType: 'text',
      })
      .returning()
    return row!.id
  }

  const post = (body: object) =>
    app.request('/api/submissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('accepts a text knute with a caption and no image (imageKey stored null)', async () => {
    const knuteId = await freshTextKnute('happy')
    const res = await post({ knuteId, caption: 'Gjorde det, med samtykke.' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { submission: { imageKey: string | null; caption: string | null } }
    expect(body.submission.imageKey).toBeNull()
    expect(body.submission.caption).toBe('Gjorde det, med samtykke.')
  })

  it('rejects a text knute without a caption (400 — the caption is the evidence)', async () => {
    const knuteId = await freshTextKnute('no-caption')
    const res = await post({ knuteId })
    expect(res.status).toBe(400)
  })

  it('ignores a stray imageKey on a text knute (still stored null)', async () => {
    const knuteId = await freshTextKnute('stray-image')
    const res = await post({ knuteId, caption: 'tekst', imageKey: 'bunny/should-be-ignored.webp' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { submission: { imageKey: string | null } }
    expect(body.submission.imageKey).toBeNull()
  })

  it('accepts a media knute with caption only — v1-loose validity (ADR-0021 rule 10)', async () => {
    const knuteId = await freshKnuteA('media-caption-only')
    const res = await post({ knuteId, caption: 'glemte bildet, men gjorde den!' })
    expect(res.status).toBe(201)
    const body = (await res.json()) as { submission: { imageKey: string | null } }
    expect(body.submission.imageKey).toBeNull()
  })

  it('rejects a media knute with neither caption nor image (400)', async () => {
    const knuteId = await freshKnuteA('media-empty')
    const res = await post({ knuteId })
    expect(res.status).toBe(400)
  })
})
