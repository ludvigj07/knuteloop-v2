# Disaster Recovery — runbooks for "it's broken right now"

Read this when something is on fire. The structure is: scenario → first 60 seconds → diagnosis → fix → postmortem.

This document is more important than it looks. The first hour of an incident is where the worst decisions are made (data deletions, panic deploys). Having a script reduces the cost of a bad night.

---

## 1. Production API is down (5xx everywhere)

### First 60 seconds
1. Verify it's actually down. Hit `https://api.knuteloop.no/healthz` from your phone.
2. Check Sentry for a flood of errors. Note the timestamp of the first failure.
3. Check Hetzner status (status.hetzner.com) for regional issues.
4. Check Aiven status (status.aiven.io) for DB issues.

### Diagnosis path
- **Hetzner outage:** wait. Communicate via Knuteloop's Instagram/Discord that we're aware.
- **Aiven outage:** wait. Same comms.
- **App-level error in Sentry:** continue to "Fix."
- **Healthz returns 503:** likely DB connection failure. SSH to the box: `ssh hetzner.knuteloop.no`, check `systemctl status knuteloop-api`, `journalctl -u knuteloop-api -n 100`.

### Fix
- **Recent deploy is suspect:** roll back via Coolify (or `systemctl restart knuteloop-api` after `git checkout <prev-tag>`).
- **DB connection issue:** check Aiven console for max-connection saturation. If saturated, restart the API to drop pooled connections; longer term, raise the connection pool ceiling.
- **OOM:** check `dmesg` and `journalctl -u knuteloop-api`. If true OOM, restart, then investigate memory leak in the deploy.

### Postmortem
File `docs/incidents/YYYY-MM-DD-api-down.md` with timeline, root cause, fix, follow-up actions. Add to next session's priorities.

---

## 2. Database is slow (>1s response times)

### First 60 seconds
1. Sentry — are slow requests showing up as timeouts or errors?
2. Aiven console — CPU utilization, IOPS, connection count.

### Diagnosis
- **CPU saturated:** likely a slow query. Aiven console → "Slow queries" tab. Identify the offender.
- **IOPS saturated:** missing index. Same slow-queries tab. Look at the query plan.
- **Connections saturated:** API isn't releasing connections. Check `pg_stat_activity` for stuck queries:
  ```sql
  SELECT pid, state, query_start, query FROM pg_stat_activity ORDER BY query_start;
  ```

### Fix
- **Slow query without index:** add the index via a migration. Apply with `CREATE INDEX CONCURRENTLY` so it doesn't lock.
- **Stuck transactions:** kill via `SELECT pg_cancel_backend(pid)` (gentle) or `pg_terminate_backend(pid)` (forceful). Investigate why they got stuck.
- **Bigger problem:** scale Aiven plan up one tier temporarily. Takes ~5 minutes.

### Long-term action
If the query is one of the leaderboard or feed endpoints, consider:
- Adding a materialized view refreshed every 60s.
- Adding Valkey caching for the heavy queries.
- Use a read replica (Aiven Business plan and up).

---

## 3. Suspected cross-tenant data leak

**This is the worst-case scenario. Treat it with urgency.**

### First 60 seconds
1. Take the API offline IMMEDIATELY. SSH and `systemctl stop knuteloop-api`. Mobile clients will fail; that's acceptable. **Confirmed leaks compounding is worse than downtime.**
2. Note the timestamp. Don't deploy anything. Don't modify the DB.
3. Snapshot the DB via Aiven console — preserves forensic state.

### Diagnosis
- How was the leak discovered? User report, log anomaly, security researcher? Get the specifics.
- Look at the audit log for cross-tenant access patterns:
  ```sql
  SELECT * FROM audit_log
  WHERE actor_id IN (SELECT id FROM users WHERE school_id = '<school A>')
    AND target_id IN (SELECT id FROM submissions WHERE school_id = '<school B>')
  LIMIT 100;
  ```
- Check Sentry / Pino logs for unusual queries.
- Run `/check-rls` against every tenant-scoped table. Anything missing FORCE?

### Fix
1. Identify the failing policy or missing filter. Patch it.
2. Bring API back online ONLY after the fix is verified.
3. Run the full RLS integration suite — must pass.

### Notify
- **GDPR Article 33:** if confirmed personal data was disclosed, notification to Datatilsynet within 72 hours is required.
- **Affected schools:** as soon as scope is confirmed.
- **Sponsors:** if their data was affected.

### Postmortem
Mandatory. `docs/incidents/YYYY-MM-DD-cross-tenant-leak.md`. Include:
- Discovery timeline
- Root cause
- Scope (how many records, how many users)
- Fix
- Process changes (e.g., new test, new hook)
- Communications log

---

## 4. Lost migration / migration applied wrong

### Symptoms
- Production schema doesn't match what the code expects.
- Errors like "column X does not exist" or "relation Y does not exist."

### First 60 seconds
1. Check `apps/api/src/db/migrations/meta/_journal.json` for the migration list.
2. Connect to production as admin: `psql ...` (read-only mode).
3. Check actual state:
   ```sql
   SELECT * FROM drizzle.__drizzle_migrations ORDER BY id;
   ```

### Diagnosis
- **Migration didn't run on prod:** the deploy pipeline skipped it, or `drizzle-kit migrate` errored silently.
- **Migration ran but partially:** a multi-statement migration failed midway.
- **Wrong migration ran:** branch divergence (someone applied a different migration than what's in main).

### Fix
- **Just didn't run:** trigger the deploy pipeline again, or run `pnpm drizzle-kit migrate` against production with EXTREME caution (`/migration-plan` first).
- **Partial:** if reversible, rollback the partial state by hand, then re-run cleanly. If not reversible, recover from backup (PITR).
- **Branch divergence:** identify what's actually in prod. Generate a new migration that reconciles the difference. Commit + deploy.

### Prevention
- Never apply migrations by hand. Always through `drizzle-kit migrate` via CI.
- The deploy pipeline should fail loudly if migrations error.

---

## 5. Lost data — accidental delete, broken update

### First 60 seconds
1. STOP. Do not run any more writes.
2. Aiven console → service → backups. Note the latest backup timestamp.
3. Note exactly what you tried to do, what happened.

### Recovery via PITR
- Aiven console → service → "Fork from backup" — choose a timestamp just BEFORE the bad write.
- This creates a new Aiven service forked from the chosen moment.
- Connect to the fork. Extract the lost rows. Apply them to production.

### Recovery via daily backup
- If PITR is unavailable (older than 7 days, edge case), use the daily backup. Same fork process.
- More data loss (everything since the last daily backup), so prefer PITR if available.

### Prevention
- Hooks block `TRUNCATE`, `DELETE without WHERE`.
- `/migration-plan` flags DANGEROUS migrations.
- `admin_user` connection is used sparingly — only for support work, audited.

---

## 6. Mobile app crashes on launch after release

### First 60 seconds
1. Sentry for mobile — check the crash rate. Is it 100% or limited to some users/devices?
2. Check the recently shipped version's release notes — what changed?
3. Confirm by trying to launch the production build on your phone.

### Fix (if confirmed broken)
1. **If JS-only fix possible:** `eas update --branch production` ships the fix instantly.
2. **If native fix required:** bump version, rebuild, resubmit. Apple/Google review usually 24-48h, but expedited review for genuine crashes can be ~6h.
3. In the meantime, communicate via Instagram/Discord: "Vi vet om problemet. Fix er på vei."

### Prevention
- Always test the production build in TestFlight Internal / Play Internal for ≥24 hours before submitting.
- Catch crashes in development with Sentry's local SDK.

---

## 7. Sponsor wants data they shouldn't have

A sponsor calls and wants per-user data ("which Vg3 students completed our knute, with names").

### Response
- Politely decline. Reference the sponsor agreement (per-user data is NEVER shared).
- Offer the aggregate data we have: completion count, school distribution, time-of-day distribution.
- If they push, escalate to a written email so there's a record. Reference GDPR for minors as the legal basis for refusal.

This isn't a technical incident, but it's an incident category — write it up in `docs/incidents/` so future Ludvig has the precedent and language.

---

## 8. Aiven account compromised / suspicious admin access

### First 60 seconds
1. Aiven console → audit log. What was accessed/changed in the last 24h?
2. Rotate the Aiven master password.
3. Revoke all API tokens.
4. Re-issue API token for the deploy pipeline.

### Diagnosis
- 2FA: was it on? (It should be.) If not, this is the lesson.
- Was anything actually changed in the DB? Check via PITR fork against 24h ago.

### Recovery
- If DB was modified: restore via PITR.
- If credentials only: rotate everything (DB password, API tokens, app secrets).

---

## Monthly backup verification (cron — runs first of each month)

```bash
# 1. Aiven console — fork production from the latest backup
# 2. Connect to the fork:
psql "postgres://...fork..."

# 3. Verify known invariants:
SELECT count(*) FROM submissions;     # Should be close to production count
SELECT count(*) FROM users;           # Should match
SELECT count(*) FROM schools;         # Exact match
SELECT max(created_at) FROM submissions;  # Should be recent

# 4. Tear down the fork (Aiven console)

# 5. Note success in this document or a journal entry.
```

If the verification fails, file an incident — backup is the foundation of disaster recovery, and a non-functional backup is itself a disaster.

---

## The single most important principle

**It's almost always better to take production offline than to keep serving broken data.**

A 30-minute downtime is recoverable. A cross-tenant leak that runs for 30 minutes is not. When in doubt, `systemctl stop knuteloop-api` and diagnose with the load off.
