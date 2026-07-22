import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let studentTokenA: string
let studentTokenB: string
let adultTokenA: string

type FeedItem = {
  id: string
  userId: string
  imageKey: string
  caption: string | null
  createdAt: string
  russenavn: string
  knuteTitle: string
  knutePoints: number
}
type FeedResponse = { feed: FeedItem[]; nextCursor: string | null }

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
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'student' },
      // School A adult — used to prove the feed age gate (S0-3). FridaA is a minor
      // (isAdult defaults to false), so she must NOT see 18+ submissions.
      { schoolId: schoolAId, russenavn: 'VossAdult', role: 'student', isAdult: true },
    ])
    .returning()
  const frida = insertedUsers[0]!
  const tor = insertedUsers[1]!
  const voss = insertedUsers[2]!

  // One active (pending/approved) submission per (user, knute) — S0-8 unique
  // index. So FridaA's 5 approved + 1 pending feed rows each need their OWN
  // knute (realistic: a russ completes 5 distinct knuter, not the same one 5×).
  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A: Feed-knute 0', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: Feed-knute 1', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: Feed-knute 2', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: Feed-knute 3', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: Feed-knute 4', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: Pending-knute', points: 10, difficulty: 'Lett' },
      { schoolId: schoolBId, title: 'B: Annen skole', points: 50, difficulty: 'Hard' },
      { schoolId: schoolAId, title: 'A: 18+ knute', points: 20, difficulty: 'Medium', minAge: 18 },
      { schoolId: schoolAId, title: 'A: Privat-knute', points: 15, difficulty: 'Lett' },
    ])
    .returning()
  const knuterA = insertedKnuter.slice(0, 5)
  const knutePending = insertedKnuter[5]!
  const knuteB = insertedKnuter[6]!
  const knuteAdult = insertedKnuter[7]!
  const knutePrivate = insertedKnuter[8]!

  // School A: 5 approved (staggered timestamps so ordering/cursor is
  // deterministic), 1 pending, 1 rejected. School B: 1 approved (must never
  // leak into A's feed). Everything meant to be feed-visible is 'shared' with
  // sharedAt = createdAt (ADR-0021) — the pending/rejected rows are ALSO
  // shared so their exclusion tests keep proving the STATUS filter, not the
  // visibility filter. The private row proves the visibility filter alone.
  const base = Date.parse('2026-06-01T12:00:00.000Z')
  const approvedRows = [0, 1, 2, 3, 4].map((i) => ({
    schoolId: schoolAId,
    userId: frida.id,
    knuteId: knuterA[i]!.id,
    imageKey: `placeholder/approved-${i}.jpg`,
    caption: `Godkjent nr ${i}`,
    status: 'approved' as const,
    visibility: 'shared' as const,
    sharedAt: new Date(base + i * 60_000),
    createdAt: new Date(base + i * 60_000),
  }))
  await h.superDb.insert(submissions).values([
    ...approvedRows,
    {
      schoolId: schoolAId,
      userId: frida.id,
      knuteId: knutePending.id,
      imageKey: 'placeholder/pending.jpg',
      status: 'pending' as const,
      visibility: 'shared' as const,
      sharedAt: new Date(base + 10 * 60_000),
      createdAt: new Date(base + 10 * 60_000),
    },
    {
      // Rejected rows are excluded from the unique index, so this can reuse a
      // knute FridaA already has an approved row on.
      schoolId: schoolAId,
      userId: frida.id,
      knuteId: knuterA[0]!.id,
      imageKey: 'placeholder/rejected.jpg',
      status: 'rejected' as const,
      visibility: 'shared' as const,
      sharedAt: new Date(base + 11 * 60_000),
      createdAt: new Date(base + 11 * 60_000),
    },
    {
      schoolId: schoolBId,
      userId: tor.id,
      knuteId: knuteB.id,
      imageKey: 'placeholder/school-b.jpg',
      status: 'approved' as const,
      visibility: 'shared' as const,
      sharedAt: new Date(base + 12 * 60_000),
      createdAt: new Date(base + 12 * 60_000),
    },
    // School A, an APPROVED submission on an 18+ knute. Newest of A's shared
    // rows, so it would be feed[0] for anyone allowed to see it — a minor must not.
    {
      schoolId: schoolAId,
      userId: voss.id,
      knuteId: knuteAdult.id,
      imageKey: 'placeholder/adult-only.jpg',
      caption: '18+ innhold',
      status: 'approved' as const,
      visibility: 'shared' as const,
      sharedAt: new Date(base + 6 * 60_000),
      createdAt: new Date(base + 6 * 60_000),
    },
    // School A, APPROVED but PRIVATE (ADR-0021): owner chose «Send inn», not
    // «Del i feeden». Newest timestamp of all — if the visibility filter were
    // missing it would be feed[0] for every A viewer.
    {
      schoolId: schoolAId,
      userId: voss.id,
      knuteId: knutePrivate.id,
      imageKey: 'placeholder/private.jpg',
      caption: 'Privat — bare knutesjef',
      status: 'approved' as const,
      visibility: 'private' as const,
      createdAt: new Date(base + 13 * 60_000),
    },
  ])

  studentTokenA = await signDevToken({ sub: frida.id, school_id: schoolAId, role: 'student' })
  studentTokenB = await signDevToken({ sub: tor.id, school_id: schoolBId, role: 'student' })
  adultTokenA = await signDevToken({ sub: voss.id, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/feed', () => {
  it('returns 401 without Authorization header', async () => {
    const res = await app.request('/api/feed')
    expect(res.status).toBe(401)
  })

  it('happy path — only approved submissions, newest first, with joined fields', async () => {
    const res = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as FeedResponse

    expect(body.feed).toHaveLength(5)
    expect(body.nextCursor).toBeNull()
    expect(body.feed[0]!.caption).toBe('Godkjent nr 4')
    expect(body.feed[4]!.caption).toBe('Godkjent nr 0')

    const first = body.feed[0]!
    expect(first.russenavn).toBe('FridaA')
    expect(first.knuteTitle).toBe('A: Feed-knute 4')
    expect(first.knutePoints).toBe(10)
    expect(first.imageKey).toBe('placeholder/approved-4.jpg')
  })

  it('pending and rejected submissions never appear', async () => {
    const res = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    const body = (await res.json()) as FeedResponse
    const keys = body.feed.map((f) => f.imageKey)
    expect(keys).not.toContain('placeholder/pending.jpg')
    expect(keys).not.toContain('placeholder/rejected.jpg')
  })

  it('cross-tenant: school A feed never contains school B submissions (and vice versa)', async () => {
    const resA = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    const bodyA = (await resA.json()) as FeedResponse
    expect(bodyA.feed.map((f) => f.imageKey)).not.toContain('placeholder/school-b.jpg')

    const resB = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${studentTokenB}` },
    })
    const bodyB = (await resB.json()) as FeedResponse
    expect(bodyB.feed).toHaveLength(1)
    expect(bodyB.feed[0]!.imageKey).toBe('placeholder/school-b.jpg')
  })

  it('age gate (S0-3): a minor viewer never sees 18+ submissions in the feed', async () => {
    const res = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as FeedResponse
    expect(body.feed.map((f) => f.imageKey)).not.toContain('placeholder/adult-only.jpg')
    expect(body.feed).toHaveLength(5)
  })

  it('age gate (S0-3): an adult viewer does see 18+ submissions in the feed', async () => {
    const res = await app.request('/api/feed', {
      headers: { Authorization: `Bearer ${adultTokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as FeedResponse
    const keys = body.feed.map((f) => f.imageKey)
    expect(keys).toContain('placeholder/adult-only.jpg')
    expect(body.feed).toHaveLength(6)
    expect(body.feed[0]!.imageKey).toBe('placeholder/adult-only.jpg')
  })

  it('visibility (ADR-0021): a private approved submission never appears — for anyone', async () => {
    // The private row has the newest timestamp of the whole fixture set; if the
    // visibility filter were missing it would be feed[0]. Checked for both a
    // regular viewer and the OWNER (adult token) — the feed is a public
    // surface, own private posts belong on the profile/me side, not here.
    for (const token of [studentTokenA, adultTokenA]) {
      const res = await app.request('/api/feed', {
        headers: { Authorization: `Bearer ${token}` },
      })
      expect(res.status).toBe(200)
      const body = (await res.json()) as FeedResponse
      expect(body.feed.map((f) => f.imageKey)).not.toContain('placeholder/private.jpg')
    }
  })

  it('paginates with cursor — walks all pages without overlap or gaps', async () => {
    const page1 = await app.request('/api/feed?limit=2', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    const body1 = (await page1.json()) as FeedResponse
    expect(body1.feed).toHaveLength(2)
    expect(body1.nextCursor).not.toBeNull()

    const page2 = await app.request(`/api/feed?limit=2&cursor=${encodeURIComponent(body1.nextCursor!)}`, {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    const body2 = (await page2.json()) as FeedResponse
    expect(body2.feed).toHaveLength(2)
    expect(body2.nextCursor).not.toBeNull()

    const page3 = await app.request(`/api/feed?limit=2&cursor=${encodeURIComponent(body2.nextCursor!)}`, {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    const body3 = (await page3.json()) as FeedResponse
    expect(body3.feed).toHaveLength(1)
    expect(body3.nextCursor).toBeNull()

    const allIds = [...body1.feed, ...body2.feed, ...body3.feed].map((f) => f.id)
    expect(new Set(allIds).size).toBe(5)
  })

  it('returns 400 for a malformed cursor', async () => {
    const res = await app.request('/api/feed?cursor=ikke-en-dato', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 for limit above max', async () => {
    const res = await app.request('/api/feed?limit=999', {
      headers: { Authorization: `Bearer ${studentTokenA}` },
    })
    expect(res.status).toBe(400)
  })
})
