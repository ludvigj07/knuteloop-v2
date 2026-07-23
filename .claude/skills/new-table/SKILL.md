---
name: new-table
description: Recipe for adding a database table with full multi-tenant RLS setup — schema, FORCE migration, indexes, tests. Invoke with the table name and purpose, e.g. `/new-table submission_reports — reports against submissions`.
---

# /new-table <table_name — purpose>

Step-by-step recipe for a new table. Cross-tenant leaks are the project's worst-case
failure, so this recipe is strict. **Exemplar schema:
[apps/api/src/db/schema/submissions.ts].**

First decide — and say out loud — which kind of table this is:

- **Tenant-scoped** (has `school_id`): the normal case. Follow all steps below.
- **Deliberately shared** (no `school_id`, e.g. library catalog): rare, needs a reason.
  Skip to §6.

## 1. Schema file

`apps/api/src/db/schema/<table>.ts`, exported from the barrel `schema/index.ts`:

```ts
import { pgTable, uuid, timestamp, index, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { schools } from './schools.js'

export const myTable = pgTable('my_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  // ... domain columns, validated lengths in mind
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  pgPolicy('my_table_tenant_isolation', {
    as: 'permissive',
    for: 'all',
    to: 'app_role',
    using: sql`school_id = current_setting('app.school_id', true)::uuid`,
    withCheck: sql`school_id = current_setting('app.school_id', true)::uuid`,
  }),
  index('my_table_school_created_idx').on(table.schoolId, table.createdAt.desc()),
]).enableRLS()
```

Every piece above is load-bearing: `notNull` + FK-with-cascade on school_id, the
policy scoped `to: 'app_role'` with BOTH `using` and `withCheck`, a composite index
with **school_id first**, uuid PK, timestamptz audit columns.

## 2. Generate the migration

```bash
pnpm --filter @knuteloop/api db:generate
```

READ the generated SQL. It contains `ENABLE ROW LEVEL SECURITY` but **NOT** `FORCE`.

## 3. The FORCE migration (hand-written — Drizzle never generates it)

Without FORCE, the table owner silently bypasses RLS. Add a follow-up migration the
same way the existing ones were added — see `0019_force_rls_school_classes.sql` and
its entry in `migrations/meta/_journal.json`:

```sql
ALTER TABLE my_table FORCE ROW LEVEL SECURITY;
```

NEVER edit an already-committed migration — always a new file.

## 4. Classify, apply, verify

1. Run `/migration-plan` — a new table + FORCE should classify as SAFE.
2. Show Ludvig the SQL and **wait for OK** before `pnpm --filter @knuteloop/api db:migrate`
   (a hook blocks it otherwise). LOCAL DB only — production goes through CI.
3. Run `/check-rls <table_name>`.

## 5. Tests

- **The meta-test does the config check for you.** `rls-meta.test.ts` introspects
  pg_catalog and fails if ANY school_id table lacks ENABLE/FORCE/policy/NOT NULL/
  cascade-FK/leading index — your new table is covered automatically. Just run
  `pnpm --filter @knuteloop/api test` and see it pass.
- **Add BEHAVIOR tests yourself** in `rls.test.ts`: seed a row per school as
  superuser, then as `app_user` prove (a) unfiltered SELECT under school A context
  returns only A's row, (b) cross-tenant INSERT is rejected by WITH CHECK. Copy the
  `school_library_imports` block in that file.

## 6. If the table is deliberately SHARED (no school_id)

1. The meta-test will fail until you add the table to `SHARED_TABLES` in
   `rls-meta.test.ts` **with a reason** — that is by design; the decision must be
   visible in the PR diff.
2. Shared tables are read-only for `app_role`: add a REVOKE migration (pattern:
   `0014_library_force_rls_and_grants.sql`) and a can't-write test (pattern:
   `library.test.ts`).
3. Mention the choice explicitly in the PR body so brother reviews it.

## 7. Definition of done

- [ ] Schema + generated migration + FORCE migration committed **together**
- [ ] `/migration-plan` said SAFE (or Ludvig explicitly accepted REVIEW)
- [ ] `/check-rls <table>` clean
- [ ] `pnpm --filter @knuteloop/api test` green (meta-test + your behavior tests)
- [ ] docs/architecture.md §4 data model updated if the table is part of the core model
