# Workflows — common engineering tasks, step by step

These are the playbooks for tasks Ludvig (or Claude) will do repeatedly. If you find yourself improvising one of these, you're probably doing extra work — come back here first.

---

## 1. Add a new API endpoint

> **Claude:** use the `/new-endpoint` skill — it is the maintained, codebase-accurate
> version of this playbook (templates match the real route files). The steps below are
> the human-readable overview; where they disagree, the skill wins.

For tenant-scoped endpoints (most of them):

1. **Decide the resource.** Where does this fit — `submissions`, `knuter`, `feed`, `me`? Endpoints live one-per-resource in `apps/api/src/routes/<resource>.ts`. If the resource doesn't exist yet, create the file.

2. **Define the Zod schema** for input. Put it at the top of the route file (or in a `schemas/` neighbor if reused).

3. **Add the route handler:**
   ```ts
   .post('/',
     zValidator('json', schema),
     async (c) => {
       const userId = c.get('userId')
       const schoolId = c.get('schoolId')
       const input = c.req.valid('json')
       // ... handler logic
       return c.json({ ... }, 201)
     }
   )
   ```

4. **Ensure the route group has auth + tenant middleware** at the top: `.use('*', auth()).use('*', tenantContext())`. If it's a knutesjef-only endpoint, add `.use('*', requireRole('knutesjef', 'admin'))`.

5. **Add rate limit** if not inherited from the group.

6. **Mount the route** in `apps/api/src/index.ts` (`app.route('/api/<resource>', <resource>Routes)`).

7. **Write tests** in `apps/api/src/test/integration/<resource>.test.ts`:
   - Happy path
   - Unauthenticated → 401
   - Cross-tenant → 404 (if applicable)
   - Validation rejection → 400

8. **Update `packages/shared/types.ts`** if the response shape is consumed by mobile. Mobile imports from `@knuteloop/shared`.

9. **Run `/backend-review` on the diff.** Address everything it flags before moving on.

10. **Commit** with a message like `feat(api): add POST /api/submissions/:id/approve`.

11. **Open PR with descriptive title and body.** PR description template (`.github/PULL_REQUEST_TEMPLATE.md`):
    ```
    ## What
    <One sentence: what does this PR add/change>

    ## Why
    <Link to the issue, ADR, or business reason>

    ## How
    <Bullet list of the key implementation choices>

    ## Tested
    - [ ] Happy path
    - [ ] Auth required
    - [ ] Cross-tenant denial
    - [ ] Validation rejection

    ## Notes for reviewer
    <Anything unusual, tradeoffs, things to look at extra closely>
    ```

12. **Request review from brother.** For backend PRs (anything touching `apps/api/`), GitHub branch protection requires his approval before merge. Aim to have PRs ready before his scheduled review window so he can batch them.

**Definition of done:** see backend rules §14, AND brother's approval on the PR.

---

## 2. Add a new table (tenant-scoped)

> **Claude:** use the `/new-table` skill — maintained and codebase-accurate (covers the
> RLS meta-test and shared-table path too). Where the steps below disagree, the skill wins.

1. **Create the schema file** `apps/api/src/db/schema/<table>.ts`:
   ```ts
   export const myTable = pgTable('my_table', {
     id: uuid('id').primaryKey().defaultRandom(),
     schoolId: uuid('school_id').notNull().references(() => schools.id, { onDelete: 'cascade' }),
     // ... other columns
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

2. **Export from the schema barrel** `apps/api/src/db/schema/index.ts`.

3. **Generate the migration:** `pnpm drizzle-kit generate`. Read the generated SQL.

4. **Add a FORCE migration by hand.** Drizzle doesn't do this. Create a new migration file:
   ```sql
   -- apps/api/src/db/migrations/NNNN_force_rls_on_my_table.sql
   ALTER TABLE my_table FORCE ROW LEVEL SECURITY;
   ```
   Update `meta/_journal.json` accordingly (or generate a new migration and append to it).

5. **Run `/migration-plan`** to classify it. Should be SAFE.

6. **Apply locally:** `pnpm drizzle-kit migrate`.

7. **Run `/check-rls my_table`** — must come back clean (ENABLE + FORCE + policy + index all green).

8. **Add cross-tenant test** in `apps/api/src/test/integration/rls.test.ts`.

9. **Commit** with schema + migration together: `feat(db): add my_table with RLS`.

---

## 3. Onboard a new school

A pre-pilot conversation has already happened with the knutesjef. Now we add them to the system:

1. **Get the school's Entra tenant ID** from their school administration. Looks like a UUID, e.g. `4ad9b3f8-...`.

2. **Insert the school record:**
   ```sql
   INSERT INTO schools (name, slug, entra_tenant_id, region, contact_knutesjef_email)
   VALUES ('St. Olav VGS', 'st-olav', '4ad9b3f8-...', 'Rogaland', 'knutesjef@...');
   ```
   Use the admin connection (`admin_user`), not the app connection.

3. **Get the russenavn list from the knutesjef.** They paste it in a CSV / spreadsheet format. Each row needs: `russenavn`, `email` (school email matching Entra account), optionally `full_name`.

4. **Import to the allowlist:** there's a script `apps/api/scripts/import-allowlist.ts` that takes a CSV and inserts rows for a school. Validates each email and warns on duplicates.

5. **Subscribe the school to knute folders.** Default subscription: "Generelle", "Drikkeknuter", "Sex" (these are the most-completed in the pilot). The knutesjef can adjust via the admin UI later.

6. **Send the knutesjef the invitation flow.** Knutesjef logs into the admin panel and confirms the russenavn list. The app is now ready for russ to log in.

7. **Communicate the launch date.** Push the school live in the app's school picker on the agreed date.

8. **Monitor first 48 hours.** Watch Sentry for unusual errors. Check Plausible for activation rate. Reach out to the knutesjef on day 2 to confirm things feel right.

---

## 4. Apply a migration to production

This is one of the higher-risk routine operations. Follow precisely.

1. **Confirm the migration was generated, reviewed via `/migration-plan`, and classified as SAFE** (or you've explicitly accepted the risk of REVIEW).

2. **Confirm tests pass locally** with the migration applied: `pnpm test`.

3. **Confirm it's been deployed to staging** (we have a staging Aiven service). Run smoke tests against staging.

4. **Take a manual Aiven backup** of production just before the deploy:
   - Aiven console → service → Backups → "Take backup now."
   - Wait for it to complete (usually <2 minutes).
   - Note the backup name for rollback reference.

5. **Apply the migration to production:** the CI/CD pipeline applies migrations on deploy. Trigger a deploy of the new code via the normal flow (merge to `main` → CI builds + deploys).

6. **Watch Sentry for 10 minutes.** Any spike in errors, any new error types?

7. **Smoke test the affected endpoint manually** from your phone.

8. **If anything looks wrong:**
   - Rollback the deploy (Hetzner / Coolify → previous revision).
   - For schema rollback: restore from the backup taken in step 4 (Aiven fork → re-point app DATABASE_URL).
   - File a postmortem entry in `docs/incidents/YYYY-MM-DD.md`.

---

## 5. Rotate a secret

For Aiven password, Entra app secret, JWT private key, Bunny API key, Sentry DSN:

1. **Generate the new value** at the source (Aiven console, Entra portal, etc.).

2. **Add the new value alongside the old one** if the secret supports key rotation (JWT has `kid` for this — see security rules §2). Otherwise, plan for brief downtime.

3. **Update the env var** in Hetzner/Coolify production environment.

4. **Restart the API service.** Verify it starts cleanly.

5. **Verify auth/operations work** for ~10 minutes.

6. **Revoke the old secret** at the source.

7. **Update `.env.example`** if the format changed (e.g., new env var name).

8. **Note the rotation in a handoff or commit message.**

---

## 6. Set up a fresh dev machine

After a clean OS install / new laptop:

1. Install Node 22 LTS via `nvm` or `mise`.
2. Install pnpm globally: `npm install -g pnpm@9`.
3. Install PostgreSQL 17 locally (or Docker container). Suggest `brew install postgresql@17` on macOS.
4. Clone the monorepo: `gh repo clone <org>/knuteloop`.
5. `cd knuteloop && pnpm install`.
6. Copy `.env.example` to `.env` in both `apps/api` and `apps/mobile`. Get actual values from Ludvig's 1Password.
7. Create local DB: `createdb knuteloop_dev`.
8. Apply migrations: `pnpm --filter @knuteloop/api drizzle-kit migrate`.
9. Seed dev data: `pnpm --filter @knuteloop/api seed`.
10. Start API: `pnpm --filter @knuteloop/api dev`.
11. Start mobile: `pnpm --filter @knuteloop/mobile start`. Scan QR with Expo Go.
12. Verify the auth flow works in Expo Go.

---

## 7. Ship a mobile release (App Store + Play Store)

1. **Bump version** in `apps/mobile/app.config.ts` (semver + build number).
2. **Verify CHANGELOG.md** has entries for what's shipping.
3. **Run all tests:** `pnpm test`.
4. **Build production:** `pnpm --filter @knuteloop/mobile build:prod` (wraps `eas build --profile production`).
5. **Test the production build** in TestFlight Internal / Play Internal Testing for at least 24 hours.
6. **Submit to App Store / Play Store:** `eas submit --profile production`. Hook will warn — that's correct, this is the moment of truth.
7. **Fill in App Store / Play Store metadata** if it's a major release (release notes, screenshots).
8. **Monitor Sentry** for the next 48 hours after release.

If something is broken in the released build:
- For JS-only fixes: `eas update --branch production` ships the fix instantly (Over-the-Air).
- For native code fixes: bump version, build, resubmit. Apple/Google review usually 24-48 hours.
