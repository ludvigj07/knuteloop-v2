import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { schools, users } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'

let h: TestHandles
let schoolAId: string
let schoolBId: string

beforeAll(async () => {
  h = await setupTestDb()

  // Seed as superuser. Superuser bypasses RLS — that's what we want for setup.
  const insertedSchools = await h.superDb
    .insert(schools)
    .values([{ name: 'School A' }, { name: 'School B' }])
    .returning()
  const [a, b] = insertedSchools
  if (!a || !b) throw new Error('Failed to seed schools')
  schoolAId = a.id
  schoolBId = b.id

  await h.superDb.insert(users).values([
    { schoolId: schoolAId, russenavn: 'LokeA', role: 'student' },
    { schoolId: schoolBId, russenavn: 'TorB', role: 'student' },
  ])
})

afterAll(async () => {
  await h?.cleanup()
})

describe('RLS cross-tenant isolation — users table', () => {
  it('app_user with school_id = A sees ONLY school A users', async () => {
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      const rows = await tx.select().from(users)
      expect(rows).toHaveLength(1)
      expect(rows[0]?.russenavn).toBe('LokeA')
      expect(rows[0]?.schoolId).toBe(schoolAId)
    })
  })

  it('app_user with school_id = B sees ONLY school B users', async () => {
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolBId}, true)`)
      const rows = await tx.select().from(users)
      expect(rows).toHaveLength(1)
      expect(rows[0]?.russenavn).toBe('TorB')
      expect(rows[0]?.schoolId).toBe(schoolBId)
    })
  })

  it('app_user without app.school_id set sees ZERO users (fail-safe)', async () => {
    await h.appDb.transaction(async (tx) => {
      // No set_config call — current_setting('app.school_id', true) returns NULL.
      // Policy: school_id = NULL::uuid → always FALSE → zero rows.
      const rows = await tx.select().from(users)
      expect(rows).toHaveLength(0)
    })
  })

  it('RLS catches forgotten WHERE — even unfiltered SELECT returns only own tenant', async () => {
    // Even if app code FORGETS to add `WHERE school_id = X`, RLS still filters.
    // This is the core defense in depth from database.md §1.
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      // Raw SELECT * with no WHERE — should still return ONLY school A.
      const result = await tx.execute(sql`SELECT id, school_id, russenavn FROM users`)
      expect(result).toHaveLength(1)
      expect((result[0] as { russenavn: string }).russenavn).toBe('LokeA')
    })
  })

  it('cross-tenant INSERT is blocked by WITH CHECK', async () => {
    await expect(
      h.appDb.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
        // Try inserting a user for school B while context is school A.
        await tx.insert(users).values({
          schoolId: schoolBId,
          russenavn: 'EvilCrossTenant',
          role: 'student',
        })
      }),
    ).rejects.toThrow(/row-level security|new row violates row-level security/i)
  })

  it('FORCE RLS is verified live (relforcerowsecurity = true)', async () => {
    // The skill's live-DB check, baked into the test so it can't drift.
    const rows = await h.superSql<
      { relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'users'`
    expect(rows[0]?.relrowsecurity).toBe(true)
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
