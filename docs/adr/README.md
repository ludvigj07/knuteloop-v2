# Architecture Decision Records (ADRs)

This directory contains the **why** behind every major technical choice. ADRs are immutable once accepted — if you disagree, write a new ADR that supersedes the old one. Never edit an Accepted ADR.

## How to read an ADR

Each ADR has the same shape:
- **Status:** Proposed / Accepted / Superseded / Rejected
- **Date:** When decided
- **Context:** What problem we faced
- **Decision:** What we chose
- **Alternatives considered:** Other paths and why we didn't take them
- **Consequences:** Trade-offs we're accepting

## Why ADRs matter for this project

Ludvig is solo, on intermittent military leave, building over ~10 months. ADRs are the way his future self remembers the reasoning behind decisions he made in May. They're also how Claude — across many sessions, across model upgrades — stays consistent with the project's design philosophy.

**Rule:** if a decision affects how the code will be organized, what services we depend on, or how data flows — write an ADR. If it's just "we use `Stack` instead of `View`" — that goes in a rule file, not an ADR.

## How to write a new ADR

1. Copy the template below into a new file `docs/adr/00NN-kebab-case-title.md`.
2. Number sequentially (next available).
3. Status starts as **Proposed**.
4. Discuss with Claude — get the alternatives and consequences right.
5. When ready to commit to it, change status to **Accepted**.
6. Once Accepted, the file is immutable. Use `/supersede-adr` to retire it later.

## Template

```markdown
# ADR-00NN: <Title>

**Status:** Proposed
**Date:** YYYY-MM-DD
**Deciders:** Ludvig (+ Claude as advisor)

## Context

What problem are we solving? What constraints apply? What did we learn from v1
or research that brought us here?

## Decision

What we are choosing. Be specific — name versions, libraries, vendors.

## Alternatives considered

- **Option A:** <name>. <2-3 sentence summary>. Rejected because <reason>.
- **Option B:** <name>. <2-3 sentence summary>. Rejected because <reason>.
- **Option C:** <name>. <2-3 sentence summary>. Rejected because <reason>.

## Consequences

### Good
- <positive consequence>
- <positive consequence>

### Bad / trade-offs accepted
- <known downside>
- <constraint we accept>

### Neutral
- <change in approach this implies>

## Open questions

- <Anything we still need to figure out>
```

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [0001](./0001-eu-data-residency.md) | EU-only data residency | Accepted | 2026-05-28 |
| [0002](./0002-postgres-rls-multitenancy.md) | Multi-tenancy via Postgres RLS | Accepted | 2026-05-28 |
| [0003](./0003-hono-over-express.md) | Hono over Express for the API framework | Accepted | 2026-05-28 |
| [0004](./0004-drizzle-over-prisma.md) | Drizzle over Prisma for the ORM | Accepted | 2026-05-28 |
| [0005](./0005-aiven-helsinki.md) | Aiven Helsinki for Postgres | Accepted | 2026-05-28 |
| [0006](./0006-entra-id-russenavn-allowlist.md) | Microsoft Entra ID + russenavn allowlist auth | Accepted | 2026-05-28 |
| [0007](./0007-expo-over-bare-rn.md) | Expo (managed) over bare React Native | Accepted | 2026-05-28 |
| [0008](./0008-bunny-over-cloudflare.md) | Bunny.net over Cloudflare R2 for storage | Accepted | 2026-05-28 |
| [0009](./0009-no-video-photos-only.md) | Photos only, no video uploads in v2 | Accepted | 2026-05-28 |
| [0010](./0010-feide-deferred-2028.md) | Feide auth deferred to 2028 (or later) | Accepted | 2026-05-28 |
| [0011](./0011-scale-target-100-schools-2027.md) | Scale target revised to 100+ schools for 2027 | Proposed | 2026-06-13 |
| [0012](./0012-video-submissions-with-bandwidth-cap.md) | Video in v2 (supersedes 0009), with bandwidth cap | Proposed | 2026-06-13 |
| [0013](./0013-knute-category-and-profile-status.md) | Knute category enum + reconstructed profile/status rules | Proposed | 2026-06-14 |
