import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestDb, type TestHandles } from '../helpers/test-db.js'

// ============================================================================
// The RLS meta-test.
//
// Instead of trusting that every migration remembered the database.md §1
// checklist, this suite asks Postgres itself: "find every table that carries
// a school_id column — does each one have the full tenant-isolation setup?"
//
// The point: a FUTURE table added months from now is covered automatically.
// Nobody has to remember to add a test for it. If a migration ships a tenant
// table without FORCE RLS (the classic silent failure — see database.md §3),
// this file fails CI.
//
// A new table must either:
//   (a) carry school_id → every check below applies to it automatically, or
//   (b) be deliberately shared → added to SHARED_TABLES with a reason,
//       which makes the decision visible in the PR diff.
// ============================================================================

// Tables intentionally WITHOUT school_id. Key = table name, value = why.
const SHARED_TABLES: Record<string, string> = {
  schools: 'the tenant boundary itself — cannot be scoped to itself',
  library_knuter: 'central curated catalog shared across all schools (ADR-0014)',
  library_packs: 'library bundles, shared (ADR-0014)',
  library_pack_memberships: 'library pack M2M, shared (ADR-0014)',
}

// Shared tables that must be READ-ONLY for app_role (migration 0014 / ADR-0014).
// NOTE: `schools` is currently writable by app_role — database.md §1 says shared
// tables should be read-only, but revoking is a grants migration, tracked as
// follow-up work. This test pins the invariant we HAVE, not the one we want.
const READ_ONLY_FOR_APP_ROLE = ['library_knuter', 'library_packs', 'library_pack_memberships']

type TableInfo = {
  table_name: string
  rls_enabled: boolean
  rls_forced: boolean
  has_school_id: boolean
}

type PolicyInfo = {
  tablename: string
  policyname: string
  roles: string[]
  cmd: string
  qual: string | null
  with_check: string | null
}

let h: TestHandles
let allTables: TableInfo[]
let tenantTables: TableInfo[]
let policies: PolicyInfo[]

beforeAll(async () => {
  h = await setupTestDb()

  // Every ordinary table in `public`, with its RLS flags and whether it
  // carries a school_id column. pg_class is the source of truth Postgres
  // itself enforces from — not the Drizzle schema files.
  allTables = await h.superSql<TableInfo[]>`
    SELECT c.relname AS table_name,
           c.relrowsecurity AS rls_enabled,
           c.relforcerowsecurity AS rls_forced,
           EXISTS (
             SELECT 1 FROM pg_attribute a
             WHERE a.attrelid = c.oid AND a.attname = 'school_id' AND NOT a.attisdropped
           ) AS has_school_id
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname`

  tenantTables = allTables.filter((t) => t.has_school_id)

  policies = await h.superSql<PolicyInfo[]>`
    SELECT tablename, policyname, roles::text[] AS roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'`
})

afterAll(async () => {
  await h?.cleanup()
})

describe('RLS meta-test — every tenant table has the full isolation setup', () => {
  it('sanity: introspection finds the known tenant tables', () => {
    // Guards against the whole suite passing vacuously because the discovery
    // query broke (e.g. schema rename) and returned zero tables.
    const names = tenantTables.map((t) => t.table_name)
    expect(names).toContain('users')
    expect(names).toContain('submissions')
    expect(names.length).toBeGreaterThanOrEqual(6)
  })

  it('every table is either tenant-scoped (school_id) or explicitly allowlisted as shared', () => {
    const unaccounted = allTables
      .filter((t) => !t.has_school_id && !(t.table_name in SHARED_TABLES))
      .map((t) => t.table_name)
    // A table showing up here means someone created it without school_id and
    // without making the "this is deliberately shared" decision visible.
    // Either add school_id (+ RLS per database.md §1) or add it to
    // SHARED_TABLES above with a reason.
    expect(unaccounted).toEqual([])

    const stale = Object.keys(SHARED_TABLES).filter(
      (name) => !allTables.some((t) => t.table_name === name),
    )
    expect(stale, 'SHARED_TABLES entries that no longer exist in the schema').toEqual([])
  })

  it('ENABLE ROW LEVEL SECURITY is set on every tenant table', () => {
    const missing = tenantTables.filter((t) => !t.rls_enabled).map((t) => t.table_name)
    expect(missing).toEqual([])
  })

  it('FORCE ROW LEVEL SECURITY is set on every tenant table', () => {
    // Drizzle's .enableRLS() does NOT generate FORCE — it needs a hand-written
    // migration. Without FORCE the table owner bypasses RLS silently.
    const missing = tenantTables.filter((t) => !t.rls_forced).map((t) => t.table_name)
    expect(missing).toEqual([])
  })

  it('every tenant table has an app_role policy filtering on app.school_id (USING + WITH CHECK)', () => {
    const violations: string[] = []
    for (const t of tenantTables) {
      const tablePolicies = policies.filter(
        (p) => p.tablename === t.table_name && p.roles.includes('app_role'),
      )
      if (tablePolicies.length === 0) {
        violations.push(`${t.table_name}: no policy for app_role`)
        continue
      }
      // Read side: some app_role policy must filter rows on app.school_id.
      const readsFiltered = tablePolicies.some((p) => p.qual?.includes('app.school_id'))
      if (!readsFiltered) {
        violations.push(`${t.table_name}: no app_role policy USING app.school_id`)
      }
      // Write side: WITH CHECK must also pin school_id. For a FOR ALL policy
      // with no explicit WITH CHECK, Postgres reuses USING — so accept either.
      const writesChecked = tablePolicies.some((p) =>
        (p.with_check ?? p.qual)?.includes('app.school_id'),
      )
      if (!writesChecked) {
        violations.push(`${t.table_name}: no app_role policy WITH CHECK on app.school_id`)
      }
    }
    expect(violations).toEqual([])
  })

  it('school_id is NOT NULL on every tenant table', async () => {
    const rows = await h.superSql<{ table_name: string; not_null: boolean }[]>`
      SELECT c.relname AS table_name, a.attnotnull AS not_null
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'school_id' AND NOT a.attisdropped
      WHERE n.nspname = 'public' AND c.relkind = 'r'`
    const nullable = rows.filter((r) => !r.not_null).map((r) => r.table_name)
    // A NULL school_id row is invisible to every tenant (policy compares
    // against NULL → false) but still exists — an orphan no one can manage.
    expect(nullable).toEqual([])
  })

  it('school_id has a FK to schools(id) with ON DELETE CASCADE on every tenant table', async () => {
    // confdeltype 'c' = CASCADE. Single-column FKs only (conkey[1]).
    const rows = await h.superSql<{ table_name: string; on_delete: string }[]>`
      SELECT t.relname AS table_name, con.confdeltype AS on_delete
      FROM pg_constraint con
      JOIN pg_class t ON t.oid = con.conrelid
      JOIN pg_class ft ON ft.oid = con.confrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
      WHERE n.nspname = 'public'
        AND con.contype = 'f'
        AND ft.relname = 'schools'
        AND a.attname = 'school_id'
        AND array_length(con.conkey, 1) = 1`
    const violations: string[] = []
    for (const t of tenantTables) {
      const fk = rows.find((r) => r.table_name === t.table_name)
      if (!fk) {
        violations.push(`${t.table_name}: school_id has no FK to schools(id)`)
      } else if (fk.on_delete !== 'c') {
        // GDPR: deleting a school must cascade — no tenant data may survive it.
        violations.push(`${t.table_name}: school_id FK is not ON DELETE CASCADE`)
      }
    }
    expect(violations).toEqual([])
  })

  it('every tenant table has an index with school_id as the FIRST column', async () => {
    // RLS adds `school_id = ...` to effectively every query — without a
    // leading school_id index that becomes a seq scan as schools multiply.
    const rows = await h.superSql<{ table_name: string; first_col: string | null }[]>`
      SELECT t.relname AS table_name, a.attname AS first_col
      FROM pg_index ix
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_class t ON t.oid = ix.indrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      LEFT JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ix.indkey[0]
      WHERE n.nspname = 'public'`
    const missing = tenantTables
      .filter((t) => !rows.some((r) => r.table_name === t.table_name && r.first_col === 'school_id'))
      .map((t) => t.table_name)
    expect(missing).toEqual([])
  })

  it('shared library tables are read-only for app_role', async () => {
    const violations: string[] = []
    for (const table of READ_ONLY_FOR_APP_ROLE) {
      for (const priv of ['INSERT', 'UPDATE', 'DELETE']) {
        const [row] = await h.superSql<{ allowed: boolean }[]>`
          SELECT has_table_privilege('app_role', ${'public.' + table}, ${priv}) AS allowed`
        if (row?.allowed) violations.push(`${table}: app_role has ${priv}`)
      }
    }
    expect(violations).toEqual([])
  })
})
