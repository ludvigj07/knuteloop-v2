# ADR-0002: Multi-tenancy via Postgres Row-Level Security

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Knuteloop is multi-tenant: each school is a tenant. Students at school A must NEVER see data from school B. A leak would be:

1. A regulatory incident (Datatilsynet, GDPR for minors).
2. A brand-fatal event — russetid is intensely social and reputational; a leak between rival schools would be catastrophic.
3. Hard to detect after the fact — there's no obvious "leak" signal in logs.

We need an isolation strategy that is:
- Hard to bypass even by an inattentive developer (Ludvig solo, intermittent availability).
- Verifiable in tests.
- Scales to 250+ tenants without operational explosion.

## Decision

Single shared Postgres database, multi-tenant via **Postgres Row-Level Security (RLS)**. Every tenant-scoped table has a policy that filters rows by `school_id = current_setting('app.school_id', true)::uuid`. The API middleware sets `app.school_id` per request via `SET LOCAL` inside a transaction.

**Defense in depth:** application code MUST ALSO include explicit `WHERE school_id = ...` filters. RLS is the safety net, not the only barrier.

**FORCE row level security** is mandatory — without FORCE, the table owner (our app connection role) bypasses policies silently. This is the single most important configuration detail in the whole system.

## Alternatives considered

- **Database-per-tenant.** Strongest isolation possible. Rejected: 250 schools = 250 Aiven services would cost €13,000+/month minimum. Backup/migration/monitoring for that many services is unmanageable for a solo founder.

- **Schema-per-tenant.** One database, one schema per school. Decent isolation. Rejected: migrations must be applied to every schema, JOIN across schemas is awkward for shared catalog data, and you still need an additional layer to route connections to the right schema.

- **Application-only isolation (no RLS).** Just include `school_id` in every WHERE clause. Rejected: ONE forgotten filter = leak. With Claude writing code (and Ludvig unable to catch mistakes), the probability of an oversight over 12 months is ~100%.

- **MongoDB / NoSQL with per-tenant collections.** Rejected: we'd lose ACID guarantees and SQL ergonomics, and we still wouldn't have a DB-enforced safety net.

## Consequences

### Good
- DB-enforced safety net — if app code "forgets" to filter, RLS catches it.
- One backup, one connection pool, one migration target. Operationally trivial.
- Easy to scale vertically and then horizontally with read replicas.
- The integration test suite can prove cross-tenant isolation works (real Postgres in testcontainer).

### Bad / trade-offs accepted
- RLS policies add a small CPU cost per query (microseconds — negligible at our scale).
- Drizzle does NOT generate `FORCE ROW LEVEL SECURITY` automatically — we must add it by hand in a follow-up migration for every new tenant-scoped table.
- Every query path that needs to bypass RLS (admin sponsor reports, cross-tenant aggregations) needs an explicit admin role connection — adds complexity.
- Connection pooling caveat: Aiven uses PgBouncer in transaction mode by default. Session-level `SET` doesn't persist across queries. We MUST use `SET LOCAL` inside transactions, with `prepare: false` on the postgres.js client.

### Neutral
- We must educate any future contributor (or ourselves on a tired Sunday) about the FORCE requirement and the transaction wrapping. The `/check-rls` skill exists for this.

## Open questions

- At what scale (if ever) would we move to schema-per-tenant or db-per-tenant? Likely never within Norway's market size, but worth re-evaluating if we ever expand internationally and need geographic data residency per tenant.
