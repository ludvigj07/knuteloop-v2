# ADR-0005: Aiven Helsinki for managed Postgres

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

We need managed Postgres in the EU (see ADR-0001). Constraints:

- EU-domiciled vendor (CLOUD Act-safe)
- Daily backups + PITR (point-in-time recovery)
- Reasonable monthly cost at pilot scale (~€50-100/month)
- Predictable performance at growth (10 → 250 schools)
- Postgres 17 available
- Easy to fork/restore for testing recovery
- Provides Valkey (Redis-compatible) on the same infrastructure (we'll need it eventually for rate limits and caching)

## Decision

Use **Aiven for PostgreSQL** in the **Helsinki** region, starting on **Startup-2** plan (~€55/month).

## Alternatives considered

- **Self-hosted Postgres on Hetzner.** Ultimate control. Rejected: ops burden too high for a solo founder with intermittent availability. Backup verification, point-in-time recovery, security patching, replication setup — all on us. The savings (~€40/month) aren't worth the risk.

- **Neon.** Serverless Postgres with branching. Excellent DX. Rejected: US-owned (Neon Inc., Delaware). Their EU region runs on AWS Frankfurt internally.

- **Supabase Postgres.** Rejected: US-owned, see ADR-0001.

- **DigitalOcean Managed Postgres.** EU regions available, decent pricing. Rejected: DigitalOcean is US-owned and uses AWS-style hosting in some regions.

- **Scaleway Managed Database.** French/EU-owned, viable on data residency. Rejected vs. Aiven: smaller managed DB feature set, less mature backup tooling, less established at our scale tier. Reconsidered if Aiven costs become prohibitive later.

- **OVHcloud.** French/EU-owned, large. Rejected: their managed Postgres offering is less developer-friendly than Aiven (rougher console, less polished CLI).

## Consequences

### Good
- Aiven is Finnish, EU-domiciled, EU data centers. CLOUD Act-safe.
- Excellent backup and PITR (point-in-time recovery) — restore to any second in the last 7 days on Startup-2.
- Service forks: spin up a copy from a backup with one click for testing or recovery drills.
- Same console manages Postgres + Valkey + Kafka if we need them later — single vendor for data infrastructure.
- Aiven has been around since 2016, profitable, not a "will it exist in 3 years" risk.

### Bad / trade-offs accepted
- More expensive per GB than self-hosted (~€55/month for 1× shared-CPU Startup-2 vs. ~€15/month for a Hetzner CX22 we run ourselves). Worth it for the ops savings.
- Aiven defaults to PgBouncer in transaction-pool mode → must use `SET LOCAL` inside transactions (not session-level `SET`), and `prepare: false` on the postgres-js client. This is a real foot-gun if forgotten — captured in `.claude/rules/database.md` and tested in the RLS integration suite.
- Aiven's private networking (VPC peering, project private endpoints) costs extra. At pilot scale, public internet + SSL is fine.

### Neutral
- We commit to monitoring Aiven status (status.aiven.io). Subscribe via email.

## Open questions

- When do we upgrade to Business-4 (€150/month, more connections, more storage)? Likely around 5000 active users — we'll know when connection counts start saturating.
- When do we add a read replica? Probably at the 10-school mark for leaderboard/feed reads. ADR at that point.
