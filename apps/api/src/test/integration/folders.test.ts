import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { schools, users, knuter, knuteFolders, knuteFolderMemberships } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'
import { signDevToken } from '../../lib/auth-dev.js'
import { buildApp } from '../../app.js'

let h: TestHandles
let app: ReturnType<typeof buildApp>
let schoolAId: string
let schoolBId: string
let knutesjefTokenA: string
let studentTokenA: string
let knutesjefTokenB: string
let folderAId: string
let knuteAId: string
let knuteBId: string
let authA: Record<string, string>
let authB: Record<string, string>

type FolderRow = { id: string; name: string; sortOrder: number; knuteCount: number }
type ListResponse = { folders: FolderRow[] }

beforeAll(async () => {
  h = await setupTestDb()
  app = buildApp()

  const [a, b] = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  schoolAId = a!.id
  schoolBId = b!.id

  const [loke, frida, tor] = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'knutesjef' },
      { schoolId: schoolAId, russenavn: 'FridaA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'knutesjef' },
    ])
    .returning()

  const [kA, kA2] = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A: knute 1', points: 10, difficulty: 'Lett' },
      { schoolId: schoolAId, title: 'A: knute 2', points: 15, difficulty: 'Lett' },
    ])
    .returning()
  knuteAId = kA!.id

  const [kB] = await h.superDb
    .insert(knuter)
    .values({ schoolId: schoolBId, title: 'B: knute', points: 10, difficulty: 'Lett' })
    .returning()
  knuteBId = kB!.id

  const [folderA] = await h.superDb
    .insert(knuteFolders)
    .values({ schoolId: schoolAId, name: 'Eksisterende', sortOrder: 0 })
    .returning()
  folderAId = folderA!.id
  await h.superDb
    .insert(knuteFolderMemberships)
    .values({ schoolId: schoolAId, folderId: folderAId, knuteId: kA2!.id })

  knutesjefTokenA = await signDevToken({ sub: loke!.id, school_id: schoolAId, role: 'knutesjef' })
  studentTokenA = await signDevToken({ sub: frida!.id, school_id: schoolAId, role: 'student' })
  knutesjefTokenB = await signDevToken({ sub: tor!.id, school_id: schoolBId, role: 'knutesjef' })

  authA = { Authorization: `Bearer ${knutesjefTokenA}`, 'content-type': 'application/json' }
  authB = { Authorization: `Bearer ${knutesjefTokenB}`, 'content-type': 'application/json' }
})

afterAll(async () => {
  await h?.cleanup()
})

describe('GET /api/folders', () => {
  it('401 without auth', async () => {
    expect((await app.request('/api/folders')).status).toBe(401)
  })

  it("lists the school's folders with knute count", async () => {
    const res = await app.request('/api/folders', { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as ListResponse
    const f = body.folders.find((x) => x.name === 'Eksisterende')
    expect(f?.knuteCount).toBe(1)
  })

  it('cross-tenant: school B does not see school A folders', async () => {
    const res = await app.request('/api/folders', { headers: authB })
    const body = (await res.json()) as ListResponse
    expect(body.folders.some((x) => x.name === 'Eksisterende')).toBe(false)
  })
})

describe('GET /api/knuter?folderId', () => {
  it('narrows the catalog to the folder (runs before membership mutations)', async () => {
    const res = await app.request(`/api/knuter?folderId=${folderAId}`, { headers: authA })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { knuter: { title: string }[] }
    // Seeded: folder 'Eksisterende' contains 'A: knute 2' only.
    expect(body.knuter.map((k) => k.title)).toEqual(['A: knute 2'])
  })
})

describe('POST /api/folders', () => {
  it('403 for a student', async () => {
    const res = await app.request('/api/folders', {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentTokenA}`, 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Student-mappe' }),
    })
    expect(res.status).toBe(403)
  })

  it('400 with empty name', async () => {
    const res = await app.request('/api/folders', { method: 'POST', headers: authA, body: JSON.stringify({ name: '  ' }) })
    expect(res.status).toBe(400)
  })

  it('knutesjef creates a folder, then 409 on duplicate name', async () => {
    const res = await app.request('/api/folders', { method: 'POST', headers: authA, body: JSON.stringify({ name: 'Mat' }) })
    expect(res.status).toBe(201)
    const dup = await app.request('/api/folders', { method: 'POST', headers: authA, body: JSON.stringify({ name: 'Mat' }) })
    expect(dup.status).toBe(409)
  })
})

describe('PATCH /api/folders/:id', () => {
  it('renames + reorders', async () => {
    const created = await app.request('/api/folders', { method: 'POST', headers: authA, body: JSON.stringify({ name: 'Til rename' }) })
    const { folder } = (await created.json()) as { folder: FolderRow }
    const res = await app.request(`/api/folders/${folder.id}`, {
      method: 'PATCH',
      headers: authA,
      body: JSON.stringify({ name: 'Omdøpt', sortOrder: 5 }),
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { folder: FolderRow }
    expect(body.folder.name).toBe('Omdøpt')
    expect(body.folder.sortOrder).toBe(5)
  })

  it('cross-tenant: school B cannot edit school A folder (404)', async () => {
    const res = await app.request(`/api/folders/${folderAId}`, { method: 'PATCH', headers: authB, body: JSON.stringify({ name: 'evil' }) })
    expect(res.status).toBe(404)
  })
})

describe('folder membership', () => {
  it('adds a knute to a folder, then 409 on duplicate', async () => {
    const res = await app.request(`/api/folders/${folderAId}/knuter`, { method: 'POST', headers: authA, body: JSON.stringify({ knuteId: knuteAId }) })
    expect(res.status).toBe(201)
    const dup = await app.request(`/api/folders/${folderAId}/knuter`, { method: 'POST', headers: authA, body: JSON.stringify({ knuteId: knuteAId }) })
    expect(dup.status).toBe(409)
  })

  it('404 adding a nonexistent knute', async () => {
    const res = await app.request(`/api/folders/${folderAId}/knuter`, {
      method: 'POST',
      headers: authA,
      body: JSON.stringify({ knuteId: '00000000-0000-0000-0000-000000000000' }),
    })
    expect(res.status).toBe(404)
  })

  it('cross-tenant: school B cannot add to school A folder (404)', async () => {
    const res = await app.request(`/api/folders/${folderAId}/knuter`, { method: 'POST', headers: authB, body: JSON.stringify({ knuteId: knuteAId }) })
    expect(res.status).toBe(404)
  })

  it("cross-tenant: school B cannot add its OWN knute to school A's folder (404)", async () => {
    const res = await app.request(`/api/folders/${folderAId}/knuter`, { method: 'POST', headers: authB, body: JSON.stringify({ knuteId: knuteBId }) })
    expect(res.status).toBe(404)
  })

  it('removes a knute from a folder', async () => {
    const res = await app.request(`/api/folders/${folderAId}/knuter/${knuteAId}`, { method: 'DELETE', headers: authA })
    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/folders/:id', () => {
  it('deletes the folder + cascades its memberships', async () => {
    const created = await app.request('/api/folders', { method: 'POST', headers: authA, body: JSON.stringify({ name: 'Slett meg' }) })
    const { folder } = (await created.json()) as { folder: FolderRow }
    await app.request(`/api/folders/${folder.id}/knuter`, { method: 'POST', headers: authA, body: JSON.stringify({ knuteId: knuteAId }) })

    const del = await app.request(`/api/folders/${folder.id}`, { method: 'DELETE', headers: authA })
    expect(del.status).toBe(200)

    // Membership cascaded away (verified via superuser, bypassing RLS).
    const left = await h.superSql<{ n: number }[]>`SELECT count(*)::int AS n FROM knute_folder_memberships WHERE folder_id = ${folder.id}`
    expect(left[0]?.n).toBe(0)
  })
})

describe('RLS: FORCE on folder tables', () => {
  it('FORCE RLS for knute_folders + knute_folder_memberships — verified live', async () => {
    const rows = await h.superSql<{ relname: string; relforcerowsecurity: boolean }[]>`
      SELECT relname, relforcerowsecurity FROM pg_class
      WHERE relname IN ('knute_folders', 'knute_folder_memberships')`
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.relforcerowsecurity)).toBe(true)
  })
})
