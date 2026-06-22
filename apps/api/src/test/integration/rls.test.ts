import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { schools, users, knuter, submissions, libraryKnuter, schoolLibraryImports } from '../../db/schema/index.js'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'

let h: TestHandles
let schoolAId: string
let schoolBId: string
let lib2Id: string
let bCopyId: string

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

  const insertedUsers = await h.superDb
    .insert(users)
    .values([
      { schoolId: schoolAId, russenavn: 'LokeA', role: 'student' },
      { schoolId: schoolBId, russenavn: 'TorB', role: 'student' },
    ])
    .returning()
  const lokeA = insertedUsers[0]!
  const torB = insertedUsers[1]!

  // One knute + one approved submission per school, so the submissions⋈knuter
  // JOIN that the /api/me aggregates rely on can be checked for cross-tenant leak.
  const insertedKnuter = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A-knute', points: 30, difficulty: 'Hard', category: 'Generelle' },
      { schoolId: schoolBId, title: 'B-knute', points: 30, difficulty: 'Hard', category: 'Generelle' },
    ])
    .returning()
  await h.superDb.insert(submissions).values([
    { schoolId: schoolAId, userId: lokeA.id, knuteId: insertedKnuter[0]!.id, imageKey: 'a.webp', status: 'approved', reviewedAt: new Date() },
    { schoolId: schoolBId, userId: torB.id, knuteId: insertedKnuter[1]!.id, imageKey: 'b.webp', status: 'approved', reviewedAt: new Date() },
  ])

  // school_library_imports is a NEW tenant-scoped table (ADR-0014) → it gets the same
  // direct-RLS cross-tenant denial proof as users/submissions. Seed a shared library
  // knute imported by BOTH schools (so A must see only its own import row), plus a
  // second, un-imported library knute used to attempt a cross-tenant INSERT.
  const libs = await h.superDb
    .insert(libraryKnuter)
    .values([
      { title: 'Lib-knute', points: 10, suggestedFolder: 'Generelle' },
      { title: 'Lib-knute-2', points: 12, suggestedFolder: 'Generelle' },
    ])
    .returning()
  const libK = libs[0]!
  lib2Id = libs[1]!.id
  const copies = await h.superDb
    .insert(knuter)
    .values([
      { schoolId: schoolAId, title: 'A-copy', points: 10, difficulty: 'Lett', category: 'Generelle', sourceLibraryKnuteId: libK.id },
      { schoolId: schoolBId, title: 'B-copy', points: 10, difficulty: 'Lett', category: 'Generelle', sourceLibraryKnuteId: libK.id },
    ])
    .returning()
  bCopyId = copies[1]!.id
  await h.superDb.insert(schoolLibraryImports).values([
    { schoolId: schoolAId, libraryKnuteId: libK.id, knuteId: copies[0]!.id },
    { schoolId: schoolBId, libraryKnuteId: libK.id, knuteId: copies[1]!.id },
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

  it('submissions⋈knuter aggregate is tenant-isolated even with no explicit WHERE', async () => {
    // The /api/me category + gold aggregates JOIN submissions to knuter. Prove
    // that join sees only the current tenant under RLS, even if app code forgot
    // a school_id filter. Under school A context the count must be 1 (only A's).
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      const result = await tx.execute(
        sql`SELECT count(*)::int AS n FROM submissions s JOIN knuter k ON k.id = s.knute_id WHERE s.status = 'approved'`,
      )
      expect((result[0] as { n: number }).n).toBe(1)
    })
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolBId}, true)`)
      const result = await tx.execute(
        sql`SELECT count(*)::int AS n FROM submissions s JOIN knuter k ON k.id = s.knute_id WHERE s.status = 'approved'`,
      )
      expect((result[0] as { n: number }).n).toBe(1)
    })
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

describe('RLS cross-tenant isolation — school_library_imports', () => {
  it('app_user school A sees ONLY its own import rows (raw SELECT, no WHERE)', async () => {
    // Both schools imported the same library knute. Under school A context, the
    // unfiltered select must return ONLY A's row — proving RLS isolates this table
    // independent of any application-layer school_id filter (the route's join filter).
    await h.appDb.transaction(async (tx) => {
      await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
      const result = await tx.execute(sql`SELECT school_id FROM school_library_imports`)
      expect(result).toHaveLength(1)
      expect((result[0] as { school_id: string }).school_id).toBe(schoolAId)
    })
  })

  it('cross-tenant INSERT is blocked by WITH CHECK', async () => {
    // School A context attempting to write a school B import row (a fresh, non-duplicate
    // library knute, so this fails on the RLS policy, not the unique constraint).
    await expect(
      h.appDb.transaction(async (tx) => {
        await tx.execute(sql`SELECT set_config('app.school_id', ${schoolAId}, true)`)
        await tx.insert(schoolLibraryImports).values({
          schoolId: schoolBId,
          libraryKnuteId: lib2Id,
          knuteId: bCopyId,
        })
      }),
    ).rejects.toThrow(/row-level security|new row violates row-level security/i)
  })

  it('FORCE RLS is verified live (relforcerowsecurity = true)', async () => {
    const rows = await h.superSql<{ relforcerowsecurity: boolean }[]>`
      SELECT relforcerowsecurity FROM pg_class WHERE relname = 'school_library_imports'`
    expect(rows[0]?.relforcerowsecurity).toBe(true)
  })
})
