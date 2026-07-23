---
name: check-rls
description: Verify that a database table has correct multi-tenant Row-Level Security configuration. Pass the table name as argument. Checks ENABLE, FORCE, policy, index. Run after creating any tenant-scoped table.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(psql:*)
---

# /check-rls <table_name>

Verify the multi-tenant Row-Level Security configuration for a specific table. This is the single most important security check in the entire codebase — Ludvig cannot evaluate RLS himself.

## Arguments

The user invokes this with a table name, e.g. `/check-rls submissions`. If no table name is provided, ask which table to check.

## Procedure

### 1. Schema-level checks (read code)

Locate the schema file under `apps/api/src/db/schema/` that defines this table. Verify:

- [ ] **Has `school_id` column** of type `uuid not null` with `references(() => schools.id, { onDelete: 'cascade' })`
- [ ] **`.enableRLS()`** is called on the table
- [ ] **Has a `pgPolicy()`** named `<table>_tenant_isolation` (or similar) with:
  - `as: 'permissive'`
  - `for: 'all'`
  - `to: 'app_role'`
  - `using: sql\`school_id = current_setting('app.school_id', true)::uuid\``
  - `withCheck: sql\`school_id = current_setting('app.school_id', true)::uuid\``
- [ ] **Has a composite index** leading on `school_id`, e.g. `index('xxx_school_created_idx').on(table.schoolId, table.createdAt.desc())`

### 2. Migration-level check (read SQL)

Search `apps/api/src/db/migrations/` for the migration that created this table. Verify:

- [ ] `ENABLE ROW LEVEL SECURITY` is present (Drizzle generates this)
- [ ] **`FORCE ROW LEVEL SECURITY` is present** — this is the critical one Drizzle does NOT generate by default. Must be added by hand.
- [ ] The policy SQL is present
- [ ] The composite index is present

If `FORCE ROW LEVEL SECURITY` is missing, REPORT IT AS A CRITICAL VIOLATION. Without FORCE, the table owner bypasses RLS silently in production.

### 3. Live database check (only if user confirms — runs psql)

Ask Ludvig: "Want me to verify against the live local DB? Will run psql in read-only mode."

If yes, run (in read-only mode):

```sql
-- Check RLS is enabled AND forced
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = '<table_name>';
-- Expected: both true.

-- Check policies exist
SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) as using_expr
FROM pg_policy
WHERE polrelid = '<table_name>'::regclass;
-- Expected: at least one policy with 'app_role' in polroles.

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = '<table_name>';
-- Expected: index that starts with (school_id, ...)

-- Verify the policy actually filters (no superuser bypass)
-- This requires connecting as app_role and trying a cross-tenant query.
```

### 4. Test-level check (read test code)

Search `apps/api/src/test/integration/rls.test.ts` for tests covering this table. Verify there are tests for:

- [ ] Cross-tenant list denial (school A cannot list school B's rows)
- [ ] Cross-tenant fetch-by-ID denial (school A gets 404, not 403)
- [ ] Cross-tenant write denial (school A cannot insert with school B's school_id)
- [ ] Cross-tenant update denial (school A cannot update school B's row)
- [ ] Admin bypass works (admin role can query across schools for reports)

If any of these are missing, generate stubs for them and add to the test file (with Ludvig's confirmation).

## Output format

```
# RLS Check — <table_name>

## Schema (apps/api/src/db/schema/<file>.ts)
✅ school_id column with FK to schools(id) on delete cascade
✅ .enableRLS() called
✅ pgPolicy('<table>_tenant_isolation', ...) present and correct
✅ Composite index on (school_id, created_at desc)

## Migration (apps/api/src/db/migrations/<file>.sql)
✅ ENABLE ROW LEVEL SECURITY present
❌ FORCE ROW LEVEL SECURITY MISSING — CRITICAL
   Add this migration immediately:
   ```sql
   ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;
   ```

## Tests (apps/api/src/test/integration/rls.test.ts)
✅ Cross-tenant list denial test
✅ Cross-tenant fetch denial test
❌ Cross-tenant write denial test MISSING
❌ Cross-tenant update denial test MISSING
✅ Admin bypass test

## Live DB (skipped — user did not confirm)

## Verdict
🟥 NOT SAFE FOR PRODUCTION. Fix the FORCE migration and missing tests before merging.
```

## When to refuse

If the table is NOT supposed to be tenant-scoped (e.g., `schools` table itself, `knute_folders` shared catalog), say so and explain why RLS does not apply. Then check that ONLY the admin role can write to it.
