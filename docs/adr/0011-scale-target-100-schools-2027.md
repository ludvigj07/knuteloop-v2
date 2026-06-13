# ADR-0011: Scale target revised to 100+ schools for 2027

**Status:** Proposed
**Date:** 2026-06-13
**Deciders:** Ludvig (+ Claude as advisor)

## Context

The original plan (architecture.md §6) set 2027 = ~10 schools / ~2000 users, and deferred the scale-up work — caching, materialized leaderboard, read replica, load balancing — to the 50-school (2028) and 250-school (2029) tiers.

The Knuteloop team has revised the **2027 target to 100+ schools (~20,000 users)**. This pulls roughly 1–2 years of scale-up work forward. The revenue model also changed: **schools (russestyrer) + sponsors pay**. Validated willingness-to-pay from the 2026 proof-of-concept: **3500 kr per russestyre (≈ 23 kr/user)**.

Knuteloop is highly seasonal — real production load occurs only during the ~5-week window around russetid. The rest of the year is near-idle.

A code review of the current build (June 2026) found it is pilot-grade: transaction-per-request holding a DB connection for the whole request with `max: 10` pool, no rate limiting, no caching layer, single points of failure (one Hetzner box, one Aiven primary), thin observability, and auth still a dev stub. These are now 2027 blockers, not 2028–2029 nice-to-haves.

## Decision

Target **100+ schools (~20,000 users) for the 2027 russetid**, with no re-architecture — the v2 design (Postgres RLS multi-tenancy, stateless Hono, Bunny CDN, cursor pagination) already supports this scale; we are bringing forward tiers that were always planned.

Specifically:
- Build the scaling foundation — load balancer + multiple API instances, Aiven Valkey for rate-limit + hot-read cache, a read replica for feed/leaderboard reads, real auth, proper observability — **before russetid 2027**, with the architecture-heavy parts ideally landed **before military service begins (28 July 2026)**.
- Fix the throughput bottleneck: stop holding a DB transaction across the whole request (especially across external I/O), and make read endpoints not pin a write connection.
- **Match infra spend to the seasonal curve:** scale up for the ~5-week window, run a lean baseline the rest of the year.

## Alternatives considered

- **Stay at 10 schools for 2027, ramp to 100 in 2028.** Rejected: the demand/funding exists now; delaying forfeits a season of revenue and market position.
- **Provision the full 250-school topology up front.** Rejected: over-provisioning. Cost should track actual school sign-ups, not a ceiling.
- **Keep infra always-on at full spec year-round.** Rejected: wasteful given the 5-week load profile. Seasonal scaling cuts annual cost materially.

## Consequences

### Good
- **Margin improves with scale.** Revenue per school is ~flat (3500 kr) while per-school infra cost falls (~€18/school/mo at 10 schools → ~€5 at 100 → ~€4.80 at 250), because the base infra (one DB, one LB, Valkey) is shared.
- **No liquidity risk.** Russestyret prepays; cost accrues only during the 5-week window afterward. You are never in the red.
- **Sponsor revenue is effectively pure profit** on top of school payments.
- Verified infra cost is a small fraction of revenue (below).

### Bad / trade-offs accepted
- ~1–2 years of scale-up engineering (LB, multi-instance, Valkey, read replica, observability, real auth) must land in a compressed window, much of it before availability drops after 28 July 2026.
- The current pilot-grade build's gaps become hard 2027 requirements. The connection-pool throughput pattern is the #1 item to fix.
- Per-school cost variance: cost is per-view but revenue is flat per school; bounded by the video bandwidth cap in [ADR-0012](./0012-video-submissions-with-bandwidth-cap.md).

### Cost (verified June 2026 list prices)
- Servers — Hetzner 2× CPX31 + LB11: **~€51/mo**
- Database — Aiven Business-4 (+ optional read replica): **~€185–415/mo** (the dominant, un-pinned line)
- Cache — Aiven Valkey Startup: **~€55/mo**
- Storage + photo CDN — Bunny: trivial (~€20–50/season)
- Video CDN bandwidth — the dominant variable; modeled in [ADR-0012](./0012-video-submissions-with-bandwidth-cap.md)
- **Seasonally scaled, all-in excluding video:** ~€2,000–3,000/yr (~25–35k kr)
- **Revenue at 20,000 × 23 kr ≈ 460,000 kr.** Infra (incl. video, per ADR-0012) lands at ~7–46% of revenue depending on engagement — covered in all but the most extreme case.

### Neutral
- architecture.md §6 scale ramp must be updated to reflect 100 schools @ 2027 once this ADR is Accepted.
- Budgeting requires the ADR-0012 bandwidth model, since cost depends on usage (especially video views).

## Open questions

- Exact Aiven Business-tier + read-replica quote for Helsinki — the dominant un-pinned cost line. Pull before committing the budget.
- Realistic sales ramp: 100 schools by russetid 2027, or land at 30–50 first? Cost and revenue scale down together — no all-or-nothing risk.
- Staging-environment budget line at production stage (~€50–80/mo)? Likely yes.
