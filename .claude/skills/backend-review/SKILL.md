---
name: backend-review
description: Review the current git diff for backend changes against all backend, database, and security rules. Outputs a numbered list of violations or "clean". Run before declaring any backend PR done.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash(git diff:*)
  - Bash(git status:*)
  - Bash(git log:*)
---

# /backend-review

You are conducting a thorough backend code review for Knuteloop v2. Ludvig cannot evaluate backend code himself — you are the senior engineer here. Be opinionated and explicit.

## Procedure

1. **Get the diff.** Run `git diff --stat` to see what changed, then `git diff` (or `git diff main...HEAD` if reviewing a feature branch) to get the full diff.

2. **Identify the scope.** List the categories of changes:
   - New routes / endpoints
   - Database schema changes
   - Auth / security changes
   - New middleware
   - Configuration changes
   - Tests
   - Refactors

3. **For each changed file, apply the relevant rules.** Read these in order:
   - `.claude/rules/backend.md` — Hono, validation, errors, logging, structure
   - `.claude/rules/database.md` — RLS, indexes, migrations, queries
   - `.claude/rules/security.md` — auth, JWT, PII, GDPR

4. **Run the systematic checklist** below. For each item, mark ✅ pass, ❌ violation, or N/A.

## The Backend Review Checklist

### Validation & Input
- [ ] Every new endpoint validates input with `zValidator('json'|'query'|'param'|'header', schema)`
- [ ] No endpoint accepts unvalidated `c.req.json()` directly
- [ ] Schemas are appropriately strict (e.g., `z.string().uuid()` not `z.string()` for IDs)
- [ ] Max lengths set on all string inputs (prevent oversize attacks)

### Auth & Authorization
- [ ] Every protected endpoint uses `.use('*', auth())` middleware
- [ ] Role-gated endpoints use `requireRole(...)` after `auth`
- [ ] No JWT secrets in code; uses `jose` + JWKS for verification
- [ ] No custom crypto — only `jose`, `bcrypt`, `crypto` standard
- [ ] `token_version` is checked in auth middleware (logout-everywhere works)

### Tenancy & RLS
- [ ] Every tenant-scoped route uses `tenantContext()` middleware
- [ ] Every query against a tenant table includes explicit `eq(table.schoolId, schoolId)` in WHERE (defense in depth)
- [ ] Any new tenant table has `.enableRLS()` AND a `tenant_isolation` policy
- [ ] Any new tenant table has a corresponding `FORCE ROW LEVEL SECURITY` migration
- [ ] Any new tenant table has a composite index leading on `school_id`
- [ ] `/check-rls <table>` returns clean for any new tables

### Errors & Logging
- [ ] No `console.log/info/warn/error` in server code (use Pino logger)
- [ ] No `c.json({error: ...}, status)` for errors — always `throw new <Typed>Error()`
- [ ] All logged objects passed as structured fields, not formatted strings
- [ ] No PII fields logged (russenavn, email, fullName, tokens, etc.)
- [ ] Redact paths in `apps/api/src/lib/logger.ts` cover any new PII fields

### Database
- [ ] No `sql.raw()` with template interpolation of user input
- [ ] All multi-statement state changes wrapped in `db.transaction()`
- [ ] No `for ... await` loops with DB calls inside (N+1 risk)
- [ ] List endpoints paginate (cursor-based for feed/leaderboard)
- [ ] New indexes added for any new query patterns
- [ ] `prepare: false` setting still in place for Aiven pgbouncer

### Migrations
- [ ] Generated SQL was reviewed via `/migration-plan`
- [ ] Classified as SAFE (or REVIEW/DANGEROUS with explicit confirmation)
- [ ] No `DROP COLUMN`/`RENAME`/`ALTER TYPE` without three-step migration plan
- [ ] `CREATE INDEX` uses `CONCURRENTLY`
- [ ] Migration file committed alongside schema change

### Testing
- [ ] New endpoints have happy-path test
- [ ] New endpoints have auth-required test (401 without token)
- [ ] New tenant-scoped endpoints have cross-tenant denial test in `rls.test.ts`
- [ ] Mutation endpoints have validation-rejection test
- [ ] Sponsor-related changes have aggregate-only test (no per-user PII leak)
- [ ] Full test suite passes (`pnpm test`)

### Configuration & Secrets
- [ ] No `process.env.X` outside `apps/api/src/config.ts`
- [ ] New env vars added to `.env.example` AND to Zod schema
- [ ] No secrets, keys, tokens, or PII committed
- [ ] `.env*` still in `.gitignore`

### Performance & Limits
- [ ] New endpoints have rate limit configured
- [ ] Body size limits respected (`bodyLimit` middleware)
- [ ] Timeout middleware applies
- [ ] No unbounded queries (`limit()` on all `findMany`)

### EU & Compliance
- [ ] No US-hosted services added (Supabase, Vercel, Cloudflare, AWS, GCP, Azure, etc.)
- [ ] Any new external service is EU-eid (Aiven, Bunny.net, Sentry EU, Plausible EU)
- [ ] Account-deletion paths preserve only what GDPR allows (soft-delete + anonymize)

### Code Quality
- [ ] No file exceeds 500 lines (split if needed)
- [ ] One resource per route file
- [ ] Routes are thin — business logic in `lib/<resource>-service.ts` if non-trivial
- [ ] TypeScript strict; no `any` without inline justification
- [ ] No commented-out code (delete or extract)
- [ ] No TODO comments without a linked GitHub issue

## Output format

```
# Backend Review — <branch name or "current diff">

**Files reviewed:** N files (X added, Y modified, Z deleted)

## ✅ Passes
- [list of passed checklist items]

## ❌ Violations
1. <File:Line> — <Issue> — <Rule reference> — <How to fix>
2. ...

## 🟧 Notes / Style
- <Non-blocking but worth addressing>

## Summary
<2-3 sentence verdict. If violations exist, say "NOT READY TO MERGE — fix violations above first.">
```

If the diff is empty or has no backend changes, say so and exit without running the checklist.

## When in doubt

If a check would require running tests, propose running them and wait for Ludvig's OK — `/backend-review` should be fast (~30 seconds). Tests are a separate concern.

If you find a violation that's borderline (e.g., the change is in a test file where some rules are relaxed), explain the borderline call and let Ludvig decide.
