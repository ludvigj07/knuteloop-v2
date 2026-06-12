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
    ])
    .returning()
  const frida = insertedUsers[0]!
  const tor = insertedUsers[1]!

  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A: Feed-knute', points: 10, difficulty: 'Lett' },
      { schoolId: schoolBId, title: 'B: Annen skole', points: 50, difficulty: 'Hard' },
    ])
    .returning()
  const knuteA = insertedKnuter[0]!
  const knuteB = insertedKnuter[1]!

  // School A: 5 approved (staggered createdAt so ordering/cursor is deterministic),
  // 1 pending, 1 rejected. School B: 1 approved (must never leak into A's feed).
  const base = Date.parse('2026-06-01T12:00:00.000Z')
  const approvedRows = [0, 1, 2, 3, 4].map((i) => ({
    schoolId: schoolAId,
    userId: frida.id,
    knuteId: knuteA.id,
    imageKey: `placeholder/approved-${i}.jpg`,
    caption: `Godkjent nr ${i}`,
    status: 'approved' as const,
    createdAt: new Date(base + i * 60_000),
  }))
  await h.superDb.insert(submissions).values([
    ...approvedRows,
    {
      schoolId: schoolAId,
      userId: frida.id,
      knuteId: knuteA.id,
      imageKey: 'placeholder/pending.jpg',
      status: 'pending' as const,
      createdAt: new Date(base + 10 * 60_000),
    },
    {
      schoolId: schoolAId,
      userId: frida.id,
      knuteId: knuteA.id,
      imageKey: 'placeholder/rejected.jpg',
      status: 'rejected' as const,
      createdAt: new Date(base + 11 * 60_000),
    },
    {
      schoolId: schoolBId,
      userId: tor.id,
      knuteId: knuteB.id,
      imageKey: 'placeholder/school-b.jpg',
      status: 'approved' as const,
      createdAt: new Date(base + 12 * 60_000),
    },
  ])

  studentTokenA = await signDevToken({ sub: frida.id, school_id: schoolAId, role: 'student' })
  studentTokenB = await signDevToken({ sub: tor.id, school_id: schoolBId, role: 'student' })
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
    expect(first.knuteTitle).toBe('A: Feed-knute')
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
