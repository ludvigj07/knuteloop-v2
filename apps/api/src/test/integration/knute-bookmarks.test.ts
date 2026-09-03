import type { SchoolId } from '../../lib/ids.js'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, sql } from 'drizzle-orm'
import { schools, users, knuter, knuteBookmarks, submissions } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: SchoolId
let schoolBId: SchoolId
let fridaId: string // school A, student, minor
let voksenId: string // school A, student, verified adult
let torId: string // school B, student
let authFrida: Record<string, string>
let authVoksen: Record<string, string>
let authTor: Record<string, string>
let knuteA1Id: string
let knuteA2Id: string
let knuteA18Id: string
let knuteARetiredId: string
let knuteBId: string

type BookmarkRow = { id: string; title: string; isBookmarked: boolean; bookmarkedAt: string }
type ListResponse = { knuter: BookmarkRow[] }
type CatalogResponse = { knuter: { id: string; isBookmarked: boolean }[] }
type FeedResponse = { feed: { id: string; knuteId: string; isBookmarked: boolean }[] }

const bookmarkUrl = (knuteId: string) => `/api/knuter/${knuteId}/bookmark`

async function listFor(auth: Record<string, string>): Promise<BookmarkRow[]> {
  const res = await app.request('/api/knuter/bookmarks', { headers: auth })
  expect(res.status).toBe(200)
  return ((await res.json()) as ListResponse).knuter
}

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [a, b] = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = a!.id
  schoolBId = b!.id

  const [frida, voksen, tor] = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolAId, russenavn: 'VoksenA', role: 'student', isAdult: true },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'student' },
    ])
    .returning()
  fridaId = frida!.id
  voksenId = voksen!.id
  torId = tor!.id

  const [kA1, kA2, kA18, kARetired] = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A: knute 1', points: 10 },
      { schoolId: schoolAId, title: 'A: knute 2', points: 15 },
      { schoolId: schoolAId, title: 'A: 18+ knute', points: 40, minAge: 18 },
      { schoolId: schoolAId, title: 'A: pensjonert', points: 5, isActive: false },
    ])
    .returning()
  knuteA1Id = kA1!.id
  knuteA2Id = kA2!.id
  knuteA18Id = kA18!.id
  knuteARetiredId = kARetired!.id

  const [kB] = await h.superDb
    .insert(knuter)
    .values({ schoolId: schoolBId, title: 'B: knute', points: 10 })
    .returning()
  knuteBId = kB!.id

  // One shared, approved submission in school A so the feed has an item whose
  // knute can be bookmarked (the feed is where bookmarks are usually made).
  await h.superDb.insert(submissions).values({
    schoolId: schoolAId,
    userId: voksenId,
    knuteId: knuteA1Id,
    status: 'approved',
    visibility: 'shared',
    sharedAt: new Date(),
    imageKey: null,
  })

  const [tFrida, tVoksen, tTor] = await Promise.all([
    signDevToken({ sub: fridaId, school_id: schoolAId, role: 'student' }),
    signDevToken({ sub: voksenId, school_id: schoolAId, role: 'student' }),
    signDevToken({ sub: torId, school_id: schoolBId, role: 'student' }),
  ])
  authFrida = { Authorization: `Bearer ${tFrida}` }
  authVoksen = { Authorization: `Bearer ${tVoksen}` }
  authTor = { Authorization: `Bearer ${tTor}` }
})

afterAll(async () => {
  await h?.cleanup()
})

describe('auth', () => {
  it('401 without a token on every bookmark endpoint', async () => {
    expect((await app.request('/api/knuter/bookmarks')).status).toBe(401)
    expect((await app.request(bookmarkUrl(knuteA1Id), { method: 'PUT' })).status).toBe(401)
    expect((await app.request(bookmarkUrl(knuteA1Id), { method: 'DELETE' })).status).toBe(401)
  })

  it('400 on a malformed knute id', async () => {
    const res = await app.request(bookmarkUrl('not-a-uuid'), { method: 'PUT', headers: authFrida })
    expect(res.status).toBe(400)
  })
})

describe('PUT / DELETE /api/knuter/:id/bookmark', () => {
  it('bookmarks a knute, lists it newest first, and is idempotent', async () => {
    expect((await listFor(authFrida)).length).toBe(0)

    const first = await app.request(bookmarkUrl(knuteA1Id), { method: 'PUT', headers: authFrida })
    expect(first.status).toBe(204)
    const second = await app.request(bookmarkUrl(knuteA2Id), { method: 'PUT', headers: authFrida })
    expect(second.status).toBe(204)

    // Bookmarking the same knute again is a no-op, not a 409.
    const again = await app.request(bookmarkUrl(knuteA1Id), { method: 'PUT', headers: authFrida })
    expect(again.status).toBe(204)

    const list = await listFor(authFrida)
    expect(list.map((k) => k.id)).toEqual([knuteA2Id, knuteA1Id])
    expect(list.every((k) => k.isBookmarked)).toBe(true)
    expect(list[0]?.bookmarkedAt).toBeTruthy()
  })

  it('removes a bookmark, and removing a missing one still succeeds', async () => {
    const res = await app.request(bookmarkUrl(knuteA2Id), { method: 'DELETE', headers: authFrida })
    expect(res.status).toBe(204)
    expect((await listFor(authFrida)).map((k) => k.id)).toEqual([knuteA1Id])

    const again = await app.request(bookmarkUrl(knuteA2Id), { method: 'DELETE', headers: authFrida })
    expect(again.status).toBe(204)
  })

  it("is private: one student's bookmarks never show in another's list", async () => {
    const res = await app.request(bookmarkUrl(knuteA2Id), { method: 'PUT', headers: authVoksen })
    expect(res.status).toBe(204)

    expect((await listFor(authVoksen)).map((k) => k.id)).toEqual([knuteA2Id])
    expect((await listFor(authFrida)).map((k) => k.id)).toEqual([knuteA1Id])
  })

  it("wrong tenant: bookmarking another school's knute is 404 (no existence leak)", async () => {
    const res = await app.request(bookmarkUrl(knuteBId), { method: 'PUT', headers: authFrida })
    expect(res.status).toBe(404)

    // And the reverse — school B's student cannot see or touch A's knuter.
    const rev = await app.request(bookmarkUrl(knuteA1Id), { method: 'PUT', headers: authTor })
    expect(rev.status).toBe(404)
    expect((await listFor(authTor)).length).toBe(0)
  })

  it('age gate: a minor cannot bookmark an 18+ knute; a verified adult can', async () => {
    const minor = await app.request(bookmarkUrl(knuteA18Id), { method: 'PUT', headers: authFrida })
    expect(minor.status).toBe(404)

    const adult = await app.request(bookmarkUrl(knuteA18Id), { method: 'PUT', headers: authVoksen })
    expect(adult.status).toBe(204)
    expect((await listFor(authVoksen)).map((k) => k.id)).toContain(knuteA18Id)
  })

  it('a retired (inactive) knute cannot be bookmarked', async () => {
    const res = await app.request(bookmarkUrl(knuteARetiredId), {
      method: 'PUT',
      headers: authFrida,
    })
    expect(res.status).toBe(404)
  })

  it('a bookmarked knute the knutesjef later retires drops out of the list', async () => {
    await app.request(bookmarkUrl(knuteA2Id), { method: 'PUT', headers: authFrida })
    expect((await listFor(authFrida)).map((k) => k.id)).toContain(knuteA2Id)

    await h.superDb.update(knuter).set({ isActive: false }).where(eq(knuter.id, knuteA2Id))
    expect((await listFor(authFrida)).map((k) => k.id)).not.toContain(knuteA2Id)

    // Restore for the tests below.
    await h.superDb.update(knuter).set({ isActive: true }).where(eq(knuter.id, knuteA2Id))
  })
})

describe('isBookmarked on the catalog and the feed', () => {
  it("GET /api/knuter marks exactly the caller's bookmarks", async () => {
    // State at this point: Frida has A1 + A2; Voksen has A2 + A18.
    const fridaRes = await app.request('/api/knuter', { headers: authFrida })
    expect(fridaRes.status).toBe(200)
    const fridaById = new Map(
      ((await fridaRes.json()) as CatalogResponse).knuter.map((k) => [k.id, k.isBookmarked]),
    )
    expect(fridaById.get(knuteA1Id)).toBe(true)
    expect(fridaById.get(knuteA2Id)).toBe(true)

    const voksenRes = await app.request('/api/knuter', { headers: authVoksen })
    const voksenById = new Map(
      ((await voksenRes.json()) as CatalogResponse).knuter.map((k) => [k.id, k.isBookmarked]),
    )
    // A1 is Frida's bookmark only — must NOT leak into Voksen's view.
    expect(voksenById.get(knuteA1Id)).toBe(false)
    expect(voksenById.get(knuteA2Id)).toBe(true)
    expect(voksenById.get(knuteA18Id)).toBe(true)
  })

  it('GET /api/feed carries knuteId + isBookmarked for the viewer', async () => {
    const res = await app.request('/api/feed', { headers: authFrida })
    expect(res.status).toBe(200)
    const body = (await res.json()) as FeedResponse
    expect(body.feed).toHaveLength(1)
    expect(body.feed[0]?.knuteId).toBe(knuteA1Id)
    expect(body.feed[0]?.isBookmarked).toBe(true)

    const other = await app.request('/api/feed', { headers: authVoksen })
    const otherBody = (await other.json()) as FeedResponse
    expect(otherBody.feed[0]?.isBookmarked).toBe(false)
  })
})

describe('RLS cross-tenant isolation — knute_bookmarks', () => {
  it('app_user in school A context sees ONLY A rows (raw SELECT, no WHERE)', async () => {
    // Give school B a bookmark row too, so an RLS hole would be visible.
    await h.superDb.insert(knuteBookmarks).values({
      schoolId: schoolBId,
      userId: torId,
      knuteId: knuteBId,
    })

    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      const result = await tx.execute(sql`SELECT school_id FROM knute_bookmarks`)
      expect(result.length).toBeGreaterThan(0)
      for (const row of result) {
        expect((row as { school_id: string }).school_id).toBe(schoolAId)
      }
    })
  })

  it('cross-tenant INSERT is blocked by WITH CHECK', async () => {
    await expect(
      h.appDb.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
        await tx.insert(knuteBookmarks).values({
          schoolId: schoolBId,
          userId: torId,
          knuteId: knuteBId,
        })
      }),
    ).rejects.toThrow(/row-level security/i)
  })

  it('FORCE RLS is verified live (relforcerowsecurity = true)', async () => {
    const rows = await h.superSql<{ relforcerowsecurity: boolean }[]>`
      SELECT relforcerowsecurity FROM pg_class WHERE relname = 'knute_bookmarks'`
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
