# ADR-0004: Drizzle over Prisma for the ORM

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

We need a database access layer. Constraints:

- TypeScript-first with strong type inference from schema
- Generates migration SQL we can READ and audit
- Supports Postgres-specific features: RLS, partial indexes, array types, JSON
- Compatible with connection pooling (PgBouncer transaction-mode at Aiven)
- Doesn't have surprising production behavior (Prisma's query engine has had issues)

## Decision

Use **Drizzle ORM** with `postgres-js` as the underlying client, configured with `prepare: false` for Aiven PgBouncer compatibility.

## Alternatives considered

- **Prisma.** Most popular, great DX. Rejected:
  1. Prisma's binary query engine adds a layer between your code and Postgres, with its own resource footprint and occasional bugs.
  2. Prisma's migration model (`prisma migrate dev`) generates SQL but the workflow blurs the line between "schema change" and "migration" in ways that have bitten teams.
  3. Prisma's support for Postgres-specific features (partial indexes, RLS policies, custom types) has historically lagged.
  4. Prisma's preview features get adopted, then change incompatibly.

- **Kysely.** Pure SQL builder, no ORM. Excellent type inference. Rejected: more boilerplate than Drizzle for common cases. We may pull it in alongside Drizzle if we need very custom queries — they coexist fine.

- **TypeORM.** The OG. Rejected: decorator-heavy, slow-moving project, complaints about reliability across multiple major releases.

- **Raw SQL with `postgres-js`.** Minimal abstraction. Rejected: gives up too much type safety. We'd want to wrap it in a thin layer anyway — at which point we're reimplementing Drizzle.

- **Sequelize.** Rejected: actively de-recommended for greenfield TypeScript projects.

## Consequences

### Good
- Schema definitions are TypeScript files we control — no separate DSL. Types flow from schema to query builder to handler.
- Generated migration SQL is human-readable. We can review it before applying.
- Drizzle supports `pgPolicy`, `enableRLS`, partial indexes, all the Postgres features we need.
- `drizzle-zod` generates Zod schemas from Drizzle schemas — single source of truth for types and runtime validation.
- Active development; Drizzle team is responsive on GitHub/Discord.

### Bad / trade-offs accepted
- Drizzle does NOT generate `FORCE ROW LEVEL SECURITY` — we must add it manually. (See ADR-0002 and `.claude/rules/database.md`.)
- `drizzle-kit push` is dangerous (bypasses migrations); we BAN it on non-local DATABASE_URL via hook.
- Drizzle is newer than Prisma; some patterns aren't well-documented. We may need to read source occasionally.
- Drizzle's relational query API (`db.query.users.findMany({ with: ... })`) is the recommended way for fetching joined data, but the query builder (`db.select().from(users).leftJoin(...)`) is more familiar to people coming from SQL. We need to standardize on one for consistency — see backend rules: prefer relational queries when fetching nested data.

### Neutral
- We need to learn Drizzle conventions. Documentation is decent; community Discord is helpful.

## Open questions

- If Drizzle's development slows or stops, what's the migration path? Likely Kysely + raw SQL — Drizzle's query builder maps 1:1 to SQL, so the mental model transfers.
