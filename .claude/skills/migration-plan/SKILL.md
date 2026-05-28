---
name: migration-plan
description: Analyze pending Drizzle migrations and classify them as SAFE, REVIEW, or DANGEROUS. Required before applying any migration with `drizzle-kit migrate`.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(ls:*)
  - Bash(cat:*)
---

# /migration-plan

Analyze the latest unapplied Drizzle migration and produce a deployment plan. Required before running `drizzle-kit migrate` on any environment.

## Procedure

### 1. Locate the pending migration

Look in `apps/api/src/db/migrations/`. Find the latest `.sql` file that's not yet been applied (compare to the journal in `apps/api/src/db/migrations/meta/_journal.json` if available).

If multiple migrations are pending, analyze each one separately.

### 2. Parse each SQL statement

For each statement in the migration, classify it according to the table below.

### 3. Classification system

**🟢 SAFE — apply during business hours, no special handling**
- `CREATE TABLE` (new tables don't lock anything)
- `ADD COLUMN ... NOT NULL DEFAULT <value>` — Postgres 11+ does this without rewriting the table
- `ADD COLUMN <nullable>` — fast metadata change
- `CREATE INDEX CONCURRENTLY` — does not lock writes
- `ALTER TABLE ... ADD FOREIGN KEY ... NOT VALID` (then `VALIDATE CONSTRAINT` separately)
- New policies (`CREATE POLICY`)
- New functions, types, sequences
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (does not affect existing connections)

**🟡 REVIEW — Ludvig must understand and approve the plan**
- `ADD COLUMN ... NOT NULL` WITHOUT default — needs three-step migration:
  1. Add nullable
  2. Backfill data
  3. Add NOT NULL constraint
- `ALTER COLUMN ... TYPE` — depends on conversion; some rewrite the table (slow + locking)
- `DROP COLUMN` — IRREVERSIBLE data loss
- `RENAME COLUMN` or `RENAME TABLE` — breaks any in-flight code referencing old name
- Adding a `UNIQUE` constraint to an existing column with data — may fail if duplicates exist
- `CHECK` constraint added to existing column — validates all rows (slow on large tables)
- Anything expected to run more than a few seconds

**🟥 DANGEROUS — refuse without explicit "yes, I confirm" from Ludvig**
- `DROP TABLE`
- `TRUNCATE`
- `DELETE` without `WHERE`
- `UPDATE` without `WHERE`
- `CREATE INDEX` without `CONCURRENTLY` — locks the table against writes during creation
- `ALTER TABLE ... ADD FOREIGN KEY` (without NOT VALID) — locks the referenced table during validation
- Any migration touching `users`, `schools`, `refresh_tokens`, or `russenavn_allowlist` in a destructive way
- Migrations on production without first verified on staging
- Migrations that touch more than 3 tables at once (split into smaller migrations)

### 4. Specific things to check

**For every ALTER TABLE statement:**
- Will it acquire `ACCESS EXCLUSIVE` lock? (DROP COLUMN, ALTER TYPE often do.) If yes, REVIEW.
- Will it scan the whole table? (Adding NOT NULL without default does.) If yes, REVIEW.
- Is the table small enough that locking it for a second is acceptable? If yes, may downgrade to SAFE.

**For every CREATE INDEX:**
- Has `CONCURRENTLY` keyword? If no, DANGEROUS.
- Does the index match an existing query pattern? If not, it's dead weight — ask Ludvig if it's needed.

**For RLS-related migrations:**
- New tenant-scoped table? Must have BOTH `ENABLE` AND `FORCE ROW LEVEL SECURITY`. If only ENABLE, REVIEW.
- New policy? Verify it filters on `current_setting('app.school_id', true)::uuid`.

**For DROP statements:**
- Any DROP COLUMN — REVIEW. Always.
- Any DROP TABLE — DANGEROUS. Always.

### 5. Recommended rollout strategy

For SAFE migrations, recommend:
- Apply locally → run tests → commit → CI applies to staging → deploy to production

For REVIEW migrations:
- Show the three-step plan if applicable
- Recommend running on staging first
- Recommend a maintenance window if any step is expected to lock for >1 second
- For DROP COLUMN: recommend "deprecate first (stop writing to it), then drop after one deploy cycle"

For DANGEROUS migrations:
- DO NOT apply without explicit "yes, I confirm" from Ludvig
- For DROP TABLE: recommend a backup first via Aiven console
- For CREATE INDEX without CONCURRENTLY: recommend rewriting to CONCURRENTLY (it's almost always what you want)

## Output format

```
# Migration Plan — <migration filename>

## SQL Summary
- N CREATE TABLE statements
- N ALTER TABLE statements
- N CREATE INDEX statements
- ...

## Statement-by-statement analysis

### 1. CREATE TABLE submissions (... )
🟢 SAFE — new table creation, no locking.

### 2. ALTER TABLE submissions ENABLE ROW LEVEL SECURITY
🟢 SAFE — metadata change, no locking.

### 3. CREATE POLICY submissions_tenant_isolation ON submissions ...
🟢 SAFE — new policy, no impact on existing rows until next query.

### 4. <ANY DROP/RENAME>
🟥 DANGEROUS — <reason> — <how to mitigate>

## Missing pieces
- ⚠️ No `FORCE ROW LEVEL SECURITY` for `submissions`. Add a follow-up migration:
  ```sql
  ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
  ```

## Verdict
🟢 SAFE — proceed with `pnpm drizzle-kit migrate` locally, then commit.
   OR
🟡 REVIEW — discuss the three-step plan with Ludvig before applying.
   OR
🟥 DANGEROUS — do not apply without explicit confirmation. Specific concerns: ...

## Recommended next steps
1. ...
2. ...
```

## When to refuse

If a migration is classified DANGEROUS and Ludvig has not explicitly said "yes, I confirm with full understanding" — REFUSE to apply it. Even if Ludvig asked you to apply migrations in general.
