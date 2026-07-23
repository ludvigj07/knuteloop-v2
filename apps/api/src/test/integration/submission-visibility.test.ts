import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { schools, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

// ADR-0021: per-submission visibility (delt/privat). This file proves the
// contract end to end: POST stores the choice (default private), the feed
// serves only approved+shared ordered by share time, and the owner — and only
// the owner — can flip visibility both ways afterwards.

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let ownerId: string
let ownerToken: string // studentA — owns every submission created here
let otherTokenA: string // same school, NOT the owner
let submissionBId: string // a school-B submission (cross-tenant target)

type SubmissionRow = {
  id: string
  visibility: 'shared' | 'private'
  sharedAt: string | null
}
type CreateResponse = { submission: SubmissionRow }
type FeedResponse = { feed: { id: string; imageKey: string }[]; nextCursor: string | null }

async function freshKnuteA(label: string) {
  const [row] = await h.superDb
    .insert(knuter)
    .values({ schoolId: schoolAId, title: `A: ${label}`, points: 10, difficulty: 'Lett' })
    .returning()
  return row!.id
}

const post = (body: object, token: string) =>
  app.request('/api/submissions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const patchVisibility = (id: string, body: object, token: string) =>
  app.request(`/api/submissions/${id}/visibility`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const getFeed = async (token: string) => {
  const res = await app.request('/api/feed', {
    headers: { Authorization: `Bearer ${token}` },
  })
  expect(res.status).toBe(200)
  return (await res.json()) as FeedResponse
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
      { schoolId: schoolAId, russenavn: 'EierA', role: 'student' },
      { schoolId: schoolAId, russenavn: 'AndreA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'StudentB', role: 'student' },
    ])
    .returning()
  ownerId = insertedUsers[0]!.id
  const otherAId = insertedUsers[1]!.id
  const studentBId = insertedUsers[2]!.id

  ownerToken = await signDevToken({ sub: ownerId, school_id: schoolAId, role: 'student' })
  otherTokenA = await signDevToken({ sub: otherAId, school_id: schoolAId, role: 'student' })

  // A school-B submission for the cross-tenant PATCH denial.
  const [knuteB] = await h.superDb
    .insert(knuter)
    .values({ schoolId: schoolBId, title: 'B: Annen skole', points: 10, difficulty: 'Lett' })
    .returning()
  const seededB = await h.superDb
    .insert(submissions)
    .values({
      schoolId: schoolBId,
      userId: studentBId,
      knuteId: knuteB!.id,
      imageKey: 'placeholder/b.jpg',
    })
    .returning()
  submissionBId = seededB[0]!.id
})

afterAll(async () => {
  await h?.cleanup()
})

describe('POST /api/submissions — visibility (ADR-0021)', () => {
  it('stores shared + sharedAt when «Del i feeden» is pressed', async () => {
    const knuteId = await freshKnuteA('post-shared')
    const res = await post(
      { knuteId, imageKey: 'placeholder/shared.jpg', visibility: 'shared' },
      ownerToken,
    )
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.visibility).toBe('shared')
    expect(body.submission.sharedAt).not.toBeNull()
  })

  it('defaults to private with no sharedAt when visibility is omitted (privacy by default)', async () => {
    const knuteId = await freshKnuteA('post-default')
    const res = await post({ knuteId, imageKey: 'placeholder/default.jpg' }, ownerToken)
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse
    expect(body.submission.visibility).toBe('private')
    expect(body.submission.sharedAt).toBeNull()
  })

  it('rejects an unknown visibility value (400)', async () => {
    const knuteId = await freshKnuteA('post-invalid')
    const res = await post(
      { knuteId, imageKey: 'placeholder/x.jpg', visibility: 'hemmelig' },
      ownerToken,
    )
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/submissions/:id/visibility', () => {
  let sharedId: string // born-shared, approved
  let privateId: string // born-private, approved
  let originalSharedAt: string // privateId's sharedAt after its first share

  it('returns 401 without Authorization header', async () => {
    const res = await app.request(`/api/submissions/${submissionBId}/visibility`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibility: 'shared' }),
    })
    expect(res.status).toBe(401)
  })

  beforeAll(async () => {
    // One born-shared and one born-private submission, both approved directly
    // (the review flow is covered in submissions.test.ts — not what we test here).
    const resShared = await post(
      {
        knuteId: await freshKnuteA('flow-shared'),
        imageKey: 'placeholder/flow-shared.jpg',
        visibility: 'shared',
      },
      ownerToken,
    )
    sharedId = ((await resShared.json()) as CreateResponse).submission.id
    const resPrivate = await post(
      { knuteId: await freshKnuteA('flow-private'), imageKey: 'placeholder/flow-private.jpg' },
      ownerToken,
    )
    privateId = ((await resPrivate.json()) as CreateResponse).submission.id
    for (const id of [sharedId, privateId]) {
      await h.superDb
        .update(submissions)
        .set({ status: 'approved', reviewedAt: new Date() })
        .where(eq(submissions.id, id))
    }
  })

  it('the feed serves the shared one and hides the private one', async () => {
    const feed = await getFeed(ownerToken)
    const ids = feed.feed.map((f) => f.id)
    expect(ids).toContain(sharedId)
    expect(ids).not.toContain(privateId)
  })

  it('a late share surfaces the post at the TOP of the feed (share time, not submit time)', async () => {
    const res = await patchVisibility(privateId, { visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(200)

    const feed = await getFeed(ownerToken)
    const ids = feed.feed.map((f) => f.id)
    // privateId was submitted BEFORE sharedId was approved-feed-visible, but its
    // share happened last → it must rank first. This is the sharedAt ordering.
    expect(ids[0]).toBe(privateId)
    expect(ids).toContain(sharedId)

    const [row] = await h.superDb
      .select({ sharedAt: submissions.sharedAt })
      .from(submissions)
      .where(eq(submissions.id, privateId))
    expect(row!.sharedAt).not.toBeNull()
    originalSharedAt = row!.sharedAt!.toISOString()
  })

  it('flipping back to private removes it from the feed', async () => {
    const res = await patchVisibility(privateId, { visibility: 'private' }, ownerToken)
    expect(res.status).toBe(200)
    const feed = await getFeed(ownerToken)
    expect(feed.feed.map((f) => f.id)).not.toContain(privateId)
  })

  it('re-sharing keeps the ORIGINAL sharedAt (first share wins — no bump abuse)', async () => {
    const res = await patchVisibility(privateId, { visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(200)
    const [row] = await h.superDb
      .select({ sharedAt: submissions.sharedAt })
      .from(submissions)
      .where(eq(submissions.id, privateId))
    expect(row!.sharedAt!.toISOString()).toBe(originalSharedAt)
  })

  it('a same-school non-owner gets 403', async () => {
    const res = await patchVisibility(sharedId, { visibility: 'private' }, otherTokenA)
    expect(res.status).toBe(403)
  })

  it("another school's submission → 404 (no existence leak)", async () => {
    const res = await patchVisibility(submissionBId, { visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(404)
  })

  it('rejects an unknown visibility value (400)', async () => {
    const res = await patchVisibility(sharedId, { visibility: 'nesten-delt' }, ownerToken)
    expect(res.status).toBe(400)
  })
})

describe('sharing requires media (ADR-0022)', () => {
  async function freshTextKnuteA(label: string) {
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

  it('a caption-only media submission can be submitted private (201, imageKey null)', async () => {
    const knuteId = await freshKnuteA('adr22-caption-private')
    const res = await post({ knuteId, caption: 'uten bilde', visibility: 'private' }, ownerToken)
    expect(res.status).toBe(201)
    const body = (await res.json()) as CreateResponse & {
      submission: { imageKey: string | null }
    }
    expect(body.submission.imageKey).toBeNull()
    expect(body.submission.visibility).toBe('private')
  })

  it('a caption-only media submission cannot be born shared (400)', async () => {
    const knuteId = await freshKnuteA('adr22-caption-shared')
    const res = await post({ knuteId, caption: 'uten bilde', visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(400)
  })

  it('a text knute can never be shared — the sensitive content stays private (400)', async () => {
    const knuteId = await freshTextKnuteA('adr22-tekst-shared')
    const res = await post({ knuteId, caption: 'sensitivt', visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(400)
  })

  it('PATCH cannot flip a media-less submission to shared (400)', async () => {
    const knuteId = await freshKnuteA('adr22-patch-share')
    const created = await post({ knuteId, caption: 'kanskje senere' }, ownerToken)
    expect(created.status).toBe(201)
    const submissionId = ((await created.json()) as CreateResponse).submission.id

    const res = await patchVisibility(submissionId, { visibility: 'shared' }, ownerToken)
    expect(res.status).toBe(400)
  })
})
