import { randomUUID } from 'node:crypto'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let tokenA: string

type UploadUrlResponse = { uploadUrl: string; imageKey: string }
type FeedResponse = { feed: { imageKey: string; imageUrl: string | null }[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [school] = await h.superDb.insert(schools).values({ name: 'School A' }).returning()
  schoolAId = school!.id
  const [user] = await h.superDb
    .insert(users)
    .values({ schoolId: schoolAId, russenavn: 'Frida', role: 'student' })
    .returning()

  // One approved submission with a REAL image key + one with a legacy placeholder.
  // They sit on DISTINCT knuter — only one active (pending/approved) submission is
  // allowed per (user, knute) by the S0-8 unique index.
  const realKey = `submissions/${randomUUID()}.jpg`
  const insertedK = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A-knute', points: 10, difficulty: 'Lett', category: 'Generelle' },
      { schoolId: schoolAId, title: 'A-knute 2', points: 10, difficulty: 'Lett', category: 'Generelle' },
    ])
    .returning()
  const k = insertedK[0]!
  const k2 = insertedK[1]!
  await h.superDb.insert(submissions).values([
    { schoolId: schoolAId, userId: user!.id, knuteId: k.id, imageKey: realKey, status: 'approved', reviewedAt: new Date() },
    { schoolId: schoolAId, userId: user!.id, knuteId: k2.id, imageKey: 'placeholder/old.webp', status: 'approved', reviewedAt: new Date(new Date().getTime() - 1000) },
  ])

  tokenA = await signDevToken({ sub: user!.id, school_id: schoolAId, role: 'student' })
})

afterAll(async () => {
  await h?.cleanup()
})

describe('POST /api/submissions/upload-url', () => {
  it('returns 401 without auth', async () => {
    const res = await app.request('/api/submissions/upload-url', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('issues a valid image key + a /uploads/ URL', async () => {
    const res = await app.request('/api/submissions/upload-url', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}` },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as UploadUrlResponse
    expect(body.imageKey).toMatch(/^submissions\/[0-9a-f-]{36}\.jpg$/)
    expect(body.uploadUrl).toContain(`/uploads/${body.imageKey}`)
  })
})

describe('local image store (dev driver)', () => {
  it('PUT then GET round-trips the bytes and serves the sniffed type', async () => {
    const key = `submissions/${randomUUID()}.jpg`
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]) // JPEG magic + data
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) // PNG magic

    const put = await app.request(`/uploads/${key}`, { method: 'PUT', body: jpeg })
    expect(put.status).toBe(204)

    const get = await app.request(`/uploads/${key}`)
    expect(get.status).toBe(200)
    expect(get.headers.get('content-type')).toBe('image/jpeg')
    expect(get.headers.get('cross-origin-resource-policy')).toBe('cross-origin')
    expect(new Uint8Array(await get.arrayBuffer())).toEqual(jpeg)

    // A PNG upload is served as image/png (manipulators can emit PNG even for .jpg).
    const pngKey = `submissions/${randomUUID()}.jpg`
    await app.request(`/uploads/${pngKey}`, { method: 'PUT', body: png })
    const pngGet = await app.request(`/uploads/${pngKey}`)
    expect(pngGet.headers.get('content-type')).toBe('image/png')
  })

  it('rejects an invalid key shape (defends the disk path)', async () => {
    // Reaches the handler but fails the strict key pattern → 400 (never touches disk).
    const put = await app.request('/uploads/submissions/evil.txt', {
      method: 'PUT',
      body: new Uint8Array([1]),
    })
    expect(put.status).toBe(400)
  })

  it('404s an unknown key', async () => {
    const res = await app.request(`/uploads/submissions/${randomUUID()}.jpg`)
    expect(res.status).toBe(404)
  })
})

describe('GET /api/feed resolves imageUrl', () => {
  it('real keys get a URL; legacy placeholder keys get null', async () => {
    const res = await app.request('/api/feed', { headers: { Authorization: `Bearer ${tokenA}` } })
    expect(res.status).toBe(200)
    const body = (await res.json()) as FeedResponse

    const real = body.feed.find((f) => f.imageKey.startsWith('submissions/'))
    const placeholder = body.feed.find((f) => f.imageKey === 'placeholder/old.webp')
    expect(real?.imageUrl).toContain(`/uploads/${real?.imageKey}`)
    expect(placeholder?.imageUrl).toBeNull()
  })
})
