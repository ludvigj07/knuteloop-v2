# Backend context — apps/api

You are working in the **backend** (Hono + Drizzle + PostgreSQL). Claude Code loads this file automatically when editing anything under `apps/api/`.

## Read these now (full rules)

@../../.claude/rules/backend.md
@../../.claude/rules/database.md
@../../.claude/rules/security.md

## The behavioural contract

When implementing any feature that existed in v1, the exact rules — scoring, streak tiers, rank titles, badge thresholds, validation clamps, the knute catalog — are specified in:

@../../docs/v1-spec.md

Do NOT invent these numbers. They are in the spec. Examples: streak bonus tiers (0/5/10/15/20%), rank titles (rank 1 = "O' Store Knutemester" through ">220 = Knutekatastrofen"), note clamps (100 words / 700 chars), `GOLD_KNOT_POINTS = 30`, `STREAK_DAILY_BONUS_CAP = 6`.

## The five rules I most often get wrong here — burn them in

1. **Every tenant table needs `.enableRLS()` AND a `FORCE ROW LEVEL SECURITY` migration.** Drizzle generates ENABLE but NOT FORCE. Without FORCE, the app role bypasses RLS silently. Run `/check-rls <table>` after creating any table.

2. **`tenantContext()` middleware on every tenant-scoped route** — opens a transaction and runs `SET LOCAL app.school_id`. Without it, RLS has no school to filter on.

3. **No `console.log`.** Use the Pino logger. russenavn, email, full name are PII — they go in the redact list, never in a log line.

4. **No `sql.raw()` with interpolated user input.** Drizzle typed builders or parameterized `sql\`...\`` only.

5. **Every endpoint: Zod validation, then auth, then tenant, then handler.** No endpoint accepts unvalidated input.

## What v1 got wrong that v2 must NOT repeat (from spec §12 + Appendix A)

- **No monolithic JSON DB.** v1 was one 3700-line file + one JSON blob. v2 is modular Drizzle tables. No file over 500 lines.
- **No two parallel user records joined by lowercased email.** One `users` table, one id space (UUID).
- **`submission.points` is NOT stored.** Compute it from `basePoints + streakBonusPoints` (generated column or read-time). v1's "knot points changed → rewrite every submission" hack is banned.
- **Ratings are their own table**, not a JSON map keyed by user id.
- **Daily-knot day-key uses Europe/Oslo**, not host local time (v1 bug).
- **Badge keyword matching uses whole words**, not substring (`'ol'` matched `protokoll` in v1 — bug).
- **Reports: separate `submission_reports` and `comment_reports` tables**, not one table with a nullable `commentId`.

## Things that DON'T exist in v1 (don't assume them)

- **No duel / knute-off in production.** It lives only in unmerged worktrees. If v2 builds it, build from scratch using spec §7 as the sketch. Get an ADR first.
- **No gender leaderboard.** v1 has total + class + knute-category. A gender split needs a new field AND a privacy decision (small cohort = re-identification risk). Don't add it without an ADR.

## Workflow reminder

- New endpoint → see `docs/workflows.md` §1
- New table → see `docs/workflows.md` §2 + `/check-rls`
- Migration → `/migration-plan` BEFORE applying
- Done → `/backend-review`, then brother reviews the PR
