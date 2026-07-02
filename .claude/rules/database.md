<!--
LOADING: Pulled in by apps/api/CLAUDE.md via @-import (Claude Code auto-loads that when
you work under apps/api/). The "globs" frontmatter is intent-documentation only — Claude
Code does not auto-load by glob; it's here for Cursor compatibility.
-->
---
description: Database rules for PostgreSQL + Drizzle + Aiven Helsinki. Multi-tenancy via RLS.
globs:
  - apps/api/src/db/**
  - apps/api/drizzle.config.ts
  - apps/api/src/test/integration/rls.test.ts
---

# Database Rules — Knuteloop v2

PostgreSQL 17 on Aiven Helsinki. Drizzle ORM. **Multi-tenant via Postgres Row-Level Security**. This is the file that prevents the most catastrophic class of bugs in the project: data leaks between schools.

---

## 1. The non-negotiable schema rules

Every tenant-scoped table MUST:

1. **Have a `school_id uuid not null references schools(id) on delete cascade`** column.
2. **Call `.enableRLS()`** in the Drizzle schema definition.
3. **Define a policy** that filters on `current_setting('app.school_id')::uuid`.
4. **Have `FORCE ROW LEVEL SECURITY`** applied via migration. Without FORCE, the table owner (your app role) bypasses RLS silently.
5. **Have a composite index** leading on `school_id`: `(school_id, created_at DESC)` for time-ordered lists, `(school_id, <other_col>)` for lookups.
6. **Have `created_at` and `updated_at timestamps with time zone`** with sensible defaults.
7. **Use `uuid` primary keys**, not `serial`. UUIDs let you generate IDs client-side, prevent enumeration attacks, and don't conflict across environments.

Tables that are NOT tenant-scoped (the shared knute-catalog, the schools table itself, sponsor catalog): no RLS, but those tables should be **read-only from the app role**. Only the admin role can modify them.

---

## 2. The canonical tenant-scoped table

```ts
// apps/api/src/db/schema/submissions.ts
import { pgTable, uuid, text, timestamp, index, pgPolicy } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { schools } from './schools'
import { users } from './users'
import { knuter } from './knuter'

export const submissions = pgTable('submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  knuteId: uuid('knute_id').notNull().references(() => knuter.id),
  imageKey: text('image_key').notNull(),
  caption: text('caption'),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).notNull().default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // Tenant isolation policy — required
  pgPolicy('submissions_tenant_isolation', {
    as: 'permissive',
    for: 'all',
    to: 'app_role',
    using: sql`school_id = current_setting('app.school_id', true)::uuid`,
    withCheck: sql`school_id = current_setting('app.school_id', true)::uuid`,
  }),
  // Required composite index
  index('submissions_school_created_idx').on(table.schoolId, table.createdAt.desc()),
  // Common access patterns
  index('submissions_user_idx').on(table.schoolId, table.userId, table.createdAt.desc()),
  index('submissions_status_idx').on(table.schoolId, table.status).where(sql`status = 'pending'`),
]).enableRLS()
```

**Notes:**
- `defaultRandom()` uses `gen_random_uuid()` from pgcrypto, which is standard in modern Postgres and works without extension setup on Aiven.
- The policy uses `to: 'app_role'`. This is critical — without specifying a role, the policy applies to ALL roles, which is too aggressive. The app connects as `app_role`; the admin role bypasses RLS for support queries.
- `current_setting('app.school_id', true)` — the `true` means "return NULL if not set" instead of erroring. The policy compares against NULL → no rows returned → fail-safe.
- The status-filtered partial index is a common pattern: most pending-submissions queries don't care about approved/rejected; a partial index keeps it small and fast.

---

## 3. The FORCE RLS migration

Drizzle's `.enableRLS()` generates `ENABLE ROW LEVEL SECURITY` but does NOT generate `FORCE ROW LEVEL SECURITY`. You MUST add a hand-written migration for every new tenant-scoped table:

```sql
-- apps/api/src/db/migrations/0002_force_rls_on_submissions.sql
ALTER TABLE submissions FORCE ROW LEVEL SECURITY;
```

Run `/check-rls submissions` after every new table to verify both ENABLE and FORCE are set.

**Why FORCE matters:** Without it, the role that owns the table (typically your app's connection role) silently bypasses all policies. You'd think RLS is on. The integration tests would pass with simple cases. Then in production, under a load you didn't test for, a query without `WHERE school_id = ...` returns ALL schools' data because RLS doesn't catch the owner. This has happened in production at multiple companies. `FORCE` makes the owner play by the same rules.

---

## 4. Migration discipline

Drizzle migrations are NOT free of risk. Many "obvious" migrations cause production outages.

**The classification system (implemented in `/migration-plan` skill):**

**SAFE** (apply during business hours):
- `CREATE TABLE`
- `ADD COLUMN` with default value OR nullable
- `CREATE INDEX CONCURRENTLY` (only this form is safe)
- `ALTER TABLE ... ADD FOREIGN KEY ... NOT VALID` (then validate separately)
- New policies, new functions, new types

**REVIEW** (Ludvig must approve plan):
- `ADD COLUMN NOT NULL` without default — needs three-step migration: add nullable → backfill → alter to NOT NULL
- `ALTER COLUMN TYPE` — depends on the conversion; some are instant, some rewrite the table
- `DROP COLUMN` — irreversible data loss; Ludvig must confirm
- `RENAME COLUMN` / `RENAME TABLE` — breaks any in-flight code that references the old name
- Adding a unique constraint to an existing column
- Anything that runs more than a few seconds

**DANGEROUS** (refuse without explicit confirmation):
- `DROP TABLE`
- `TRUNCATE`
- `DELETE` without `WHERE`
- `CREATE INDEX` without `CONCURRENTLY` (locks writes)
- Any migration generated from a schema change you didn't review
- Any migration on production without first verified on staging

**The standard workflow:**

```bash
# 1. Modify the schema file
# 2. Generate migration SQL
pnpm drizzle-kit generate

# 3. Open the generated SQL, READ IT
# 4. Run /migration-plan to classify

# 5. If SAFE: apply to local
pnpm drizzle-kit migrate

# 6. Run integration tests against local
pnpm test

# 7. Commit migration + schema together
# 8. CI runs migration against ephemeral DB + tests
# 9. After merge, deploy applies to production
```

`drizzle-kit push` is BANNED on non-local DATABASE_URL. A hook enforces this. Use `migrate`, never `push`, in any environment with real data.

---

## 5. Query patterns

### List queries (the common case)

```ts
// GOOD: paginated, indexed, tenant-filtered
const recentSubmissions = await db.query.submissions.findMany({
  where: (s, { eq, lt }) => and(
    eq(s.schoolId, schoolId),
    lt(s.createdAt, cursor)
  ),
  orderBy: (s, { desc }) => desc(s.createdAt),
  limit: 50,
  with: { user: true, knute: true },
})
```

- Always limit. Default 50 unless Ludvig specifies.
- Always cursor-based pagination for feed/leaderboard: pass `cursor` as ISO timestamp, use `lt`/`gt`. NOT offset-based — offsets get expensive at scale.
- Include related data via `with` — Drizzle generates a single SQL with JOIN, not N+1.

### N+1 prevention

```ts
// BAD: classic N+1 — one query per submission to fetch user
for (const submission of submissions) {
  const user = await db.select().from(users).where(eq(users.id, submission.userId))
  // ...
}

// GOOD: single query with relational join
const submissions = await db.query.submissions.findMany({
  where: (s, { eq }) => eq(s.schoolId, schoolId),
  with: { user: true },
})
```

If you find yourself writing a `for ... await` loop with a DB call inside, STOP. Refactor to a single query or batched query.

### Transactions

Use transactions when state changes cross multiple tables:

```ts
// Approving a submission: update submission, award points, log event
await db.transaction(async (tx) => {
  await tx.update(submissions)
    .set({ status: 'approved', reviewedBy: userId, reviewedAt: new Date() })
    .where(and(eq(submissions.id, id), eq(submissions.schoolId, schoolId)))

  await tx.update(users)
    .set({ points: sql`${users.points} + ${knute.points}` })
    .where(and(eq(users.id, submission.userId), eq(users.schoolId, schoolId)))

  await tx.insert(auditLog).values({
    schoolId,
    actorId: userId,
    action: 'submission.approve',
    targetType: 'submission',
    targetId: id,
  })
})
```

Single-row writes don't need transactions — Postgres makes each statement atomic.

### When you must write SQL

Use the `sql` template — it's parameterized:

```ts
// GOOD: parameterized
await db.execute(sql`UPDATE users SET points = points + ${pointsToAdd} WHERE id = ${userId}`)

// BAD: string interpolation — SQL injection risk
await db.execute(sql.raw(`UPDATE users SET points = points + ${pointsToAdd} WHERE id = '${userId}'`))
```

`sql.raw()` is only for true literals (table names, identifiers that come from your own code, never user input).

---

## 6. The Postgres connection — Aiven specifics

```ts
// apps/api/src/db/client.ts
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'
import { config } from '../config'

const client = postgres(config.DATABASE_URL, {
  // CRITICAL for Aiven PgBouncer transaction-pool mode
  prepare: false,
  // SSL must be verify-full in production with Aiven's CA pinned
  ssl: config.NODE_ENV === 'production' ? 'require' : false,
  // Reasonable defaults
  max: 10, // adjust based on Aiven plan; ~3-5x CPU cores
  idle_timeout: 30,
  connect_timeout: 5,
})

export const db = drizzle(client, { schema })
```

**Why `prepare: false`:** Aiven defaults to PgBouncer transaction-pool mode. Prepared statements live on a connection; if the next query routes to a different backend connection, the prepared statement isn't there → query fails. Disable prepares to be safe.

**Why `max: 10`:** Connection pooling guidance from Aiven docs is 3-5× CPU cores. Start at 10 for Developer/Startup-2; tune up as you scale. Higher max ≠ more throughput — at some point you're just queueing.

**SSL:** Always use SSL in production. Aiven enforces it. The Aiven control panel provides a CA certificate; pin it in `apps/api/src/lib/aiven-ca.pem` and reference it in the SSL config.

---

## 7. Knuter + the central library (ADR-0014)

Knuter live on TWO sides. The schema files (`apps/api/src/db/schema/*.ts`) are the source of truth for exact columns — this section describes the shape so you know where things belong.

**School side (tenant-scoped — full §2 treatment: RLS + FORCE + policy + composite index):**

- **`knuter`** — the school's own list: custom knuter the knutesjef creates PLUS copies imported from the library. Beyond the §2 basics it carries `is_gold` (explicit gullknute flag, ADR-0013), `evidence_type` (`'media' | 'text'` — text-only for legally sensitive knuter; set by the library, NOT relaxable by schools), `min_age` (17/18, gated against `users.is_adult`, ADR-0015) and `source_library_knute_id` (import provenance; NULL for custom knuter). The legacy `category` enum still exists because the profile category rings (`routes/me.ts`) read it — slated for removal per ADR-0014.
- **`knute_folders`** + **`knute_folder_memberships`** — per-school knutemapper, many-to-many (a knute can sit in several folders). "Alle knuter" is implicit (the unfiltered list), never a stored folder.
- **`school_library_imports`** — which library knuter this school imported (dedupe + the "added" badge). `knute_id` points at the school's copy; deleting the copy cascades the row so re-import works.

**Library side (shared across ALL schools — no `school_id`, no RLS):**

- **`library_knuter`** — the curated catalog: title, points, difficulty, `evidence_type`, `min_age`, `suggested_folder` (theme axis — becomes the school folder on import), `region` (discovery filter only).
- **`library_packs`** + **`library_pack_memberships`** — named bundles for one-tap bulk import.
- Per §1, shared tables are **read-only for `app_role`**: the write REVOKE lives in migration `0014_library_force_rls_and_grants.sql`, and `library.test.ts` proves app_role cannot write. Only a Knuteloop super-admin (admin_role) curates. Deployment invariant: migrations run as a privileged role, never app_role (see the header comment in `schema/library.ts`).

**Import = copy** (`lib/library-import.ts`): importing snapshots the library fields into the school's `knuter`, records it in `school_library_imports`, and auto-creates/assigns the folder named by `suggested_folder`. Copies are independent — library updates do NOT propagate. Concurrent imports within one school are serialized with a transaction-scoped advisory lock.

**Sponsor fields** (`is_sponsored`, `sponsor_name`, etc. shown in earlier drafts of this rule) move out of `knuter` and into a dedicated `sponsored_knuter` join table when the sponsor flow ships. Keep `knuter` small until then.

---

## 8. Roles and access control at DB level

```sql
-- Run once, in a one-off migration

-- The role the app connects as. Subject to RLS.
CREATE ROLE app_role NOLOGIN;
GRANT USAGE ON SCHEMA public TO app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_role;

-- The role for admin/support work. Bypasses RLS — handle with care.
CREATE ROLE admin_role NOLOGIN BYPASSRLS;
GRANT ALL ON SCHEMA public TO admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;

-- The login users (granted into the appropriate role)
CREATE USER app_user LOGIN PASSWORD '...' IN ROLE app_role;
CREATE USER admin_user LOGIN PASSWORD '...' IN ROLE admin_role;

-- Default privileges so new tables created by migrations grant to app_role
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_role;
```

The app connects as `app_user`. Admin scripts (sponsor reports, manual support actions) connect as `admin_user`. Different DATABASE_URLs in env vars.

---

## 9. The RLS integration test — the single most important test

```ts
// apps/api/src/test/integration/rls.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { buildTestApp } from '../helpers/test-app'

describe('Row-Level Security cross-tenant isolation', () => {
  let app: ReturnType<typeof buildTestApp>
  let tokenSchoolA: string
  let tokenSchoolB: string
  let submissionAId: string

  beforeAll(async () => {
    // 1. Start a real Postgres in Docker via testcontainer
    // 2. Run migrations
    // 3. Seed two schools, two users (one per school)
    // 4. Each user makes a submission
    // 5. Get auth tokens for each
    // (see test/helpers/test-db.ts for full setup)
  })

  it('user from school A cannot list school B submissions', async () => {
    const res = await app.request('/api/submissions', {
      headers: { Authorization: `Bearer ${tokenSchoolA}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    // Must contain only school A's submissions
    expect(body.submissions.every((s: any) => s.schoolId === SCHOOL_A_ID)).toBe(true)
  })

  it('user from school A cannot fetch a school B submission by ID (404, not 403, no info leak)', async () => {
    const res = await app.request(`/api/submissions/${submissionBId}`, {
      headers: { Authorization: `Bearer ${tokenSchoolA}` },
    })
    expect(res.status).toBe(404)
  })

  it('RLS catches forgotten application-layer filter', async () => {
    // Bypass the application layer — call a hypothetical "buggy" endpoint that
    // doesn't filter by school_id. Should still return zero rows because RLS.
    const res = await app.request('/test-only/submissions-without-filter', {
      headers: { Authorization: `Bearer ${tokenSchoolA}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.submissions).toHaveLength(1) // only school A's
  })

  it('admin role bypasses RLS (sponsor reports work across schools)', async () => {
    const adminToken = await getAdminToken()
    const res = await app.request('/api/admin/sponsor-reports/maxbo', {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    // Should aggregate across both schools
    expect(body.totalCompletions).toBeGreaterThan(0)
    expect(body.bySchool).toHaveLength(2)
  })
})
```

This test file is the contract. If it fails, the build fails. If you add a new tenant-scoped table, add a cross-tenant denial test for it in this file.

---

## 10. Backups and disaster recovery

Aiven handles automatic daily backups + PITR (Point-In-Time Recovery) on Startup-2 and above. **Verify monthly** that a backup actually restores:

```bash
# 1. From Aiven console: fork the production service from the latest backup
# 2. Connect to the fork
# 3. Run a known query that should return expected count:
#    SELECT count(*) FROM submissions; -- should match production
# 4. Spot-check a known submission by ID exists
# 5. Tear down the fork
```

A cron job documented in `docs/disaster-recovery.md` runs this monthly. If the verification fails, Ludvig gets a Sentry alert.

---

## 11. Definition of done (database)

A schema change is NOT done until:

- [ ] Drizzle schema file modified
- [ ] Migration generated via `drizzle-kit generate`
- [ ] Migration SQL reviewed by `/migration-plan` and classified
- [ ] If tenant-scoped: `enableRLS()` called, policy defined, `FORCE ROW LEVEL SECURITY` migration added by hand
- [ ] Composite index on `(school_id, ...)` added
- [ ] Cross-tenant denial test added to `rls.test.ts`
- [ ] Local migration applied + tests pass
- [ ] `/check-rls <table_name>` returns clean
- [ ] Schema + migration committed together (NEVER one without the other)
