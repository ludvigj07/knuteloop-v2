# Knuteloop v2 — Architecture

This document is the **30-second flyover** of the entire system. If you're returning after weeks away, reread this first — it grounds everything else.

## 1. What we're building

A native iOS+Android app for Norwegian russ that:

1. Lists challenges ("knuter") — each school's knutesjef curates their own list: custom knuter they create, plus copies imported from the central curated knute library (browse → import = copy, ADR-0014), organized into per-school folders (knutemapper).
2. Lets a russ submit a photo as proof of completing a knute.
3. Sends the submission to the school's knutesjef for one-tap approval.
4. Updates the russ's score, leaderboard position, and badges in real time.
5. Shows a social feed of the school's approved submissions.

Plus: sponsor-funded knuter (the revenue model), and an admin panel for knutesjef to manage the list of registered russ.

## 2. The big architecture diagram

```
┌────────────────────────────────────────────────────────────────────┐
│                       MOBILE APP (Expo / RN)                       │
│                                                                    │
│  Expo Router → screens                                             │
│  TanStack Query → API state                                        │
│  expo-secure-store → access + refresh tokens                       │
│  expo-image-picker / expo-camera → submit flow                     │
│  expo-haptics, Reanimated v4 → polish                              │
└──────────────────────────────┬─────────────────────────────────────┘
                               │ HTTPS, Bearer JWT
                               ▼
┌────────────────────────────────────────────────────────────────────┐
│                  API (Hono on Node 22, Hetzner Helsinki)           │
│                                                                    │
│  Middleware chain (per request):                                   │
│    requestId → logger → secureHeaders → cors → bodyLimit →         │
│    timeout → [auth → tenantContext → rateLimit] → handler          │
│                                                                    │
│  Routes (one file per resource):                                   │
│    /api/knuter      the school's own knuter — list, create, edit   │
│    /api/library     central knute library: browse, import (=copy)  │
│    /api/folders     per-school knutemapper, knute ↔ folder M2M     │
│    /api/submissions submit, list mine, review queue (knutesjef)    │
│    /api/feed        social feed, paginated                         │
│    /api/leaderboard school ranking + rank titles                   │
│    /api/me          profile, stats, streak                         │
│    /healthz         liveness (DB ping)                             │
│                                                                    │
│  Planned: /api/auth (real login — today a dev-only stub identity), │
│  /api/sponsors, /api/admin/*, GDPR export/delete on /api/me        │
└─────────────┬───────────────────────────────┬──────────────────────┘
              │ postgres-js, prepare:false   │ HTTPS, signed URL
              ▼                              ▼
┌──────────────────────────────────┐  ┌──────────────────────────────┐
│   Postgres 17 (Aiven Helsinki)   │  │  Bunny Storage + CDN (EU)    │
│                                  │  │                              │
│  • Multi-tenant via RLS          │  │  • Submission photos         │
│  • app_role (RLS enforced)       │  │  • Sponsor logos             │
│  • admin_role (BYPASSRLS)        │  │  • User avatars              │
│  • Daily backup + PITR           │  │  • Signed upload URLs        │
└──────────────────────────────────┘  └──────────────────────────────┘
              │
              │ (admin queries, manual support work)
              ▼
┌──────────────────────────────────┐
│  Sentry EU       │  Plausible EU │   (Observability)
│  (errors, PII    │  (aggregate   │
│   scrubbed)      │   analytics)  │
└──────────────────────────────────┘
```

## 3. Request flow (the canonical happy path)

A russ taps "Submit" on a knute:

```
1. Mobile: capture photo (expo-camera) → compress to ~1MB JPEG (expo-image-manipulator)
2. Mobile: POST /api/submissions/upload-url { knuteId, contentType, contentLength }
3. API: auth middleware verifies JWT (jose, JWKS cache)
4. API: tenantContext middleware sets app.school_id on DB session
5. API: rate-limit (100/min for mutations)
6. API: handler validates input (Zod), generates signed Bunny URL (15min TTL)
7. API: returns { uploadUrl, imageKey }
8. Mobile: PUTs the binary to Bunny directly (not through our backend)
9. Mobile: POST /api/submissions { knuteId, imageKey, caption? }
10. API: same auth+tenant+ratelimit chain
11. API: validates image actually exists in Bunny (HEAD request)
12. API: INSERT into submissions (RLS enforces school_id matches)
13. API: notifies knutesjef devices via push (Expo Push)
14. Knutesjef opens app, sees pending submission
15. Knutesjef taps approve → POST /api/submissions/:id/approve
16. API: requireRole('knutesjef') middleware
17. API: transaction { UPDATE submission, UPDATE user.points, INSERT auditLog }
18. API: TanStack Query on submitter's device invalidates → UI refreshes
19. Submitter sees confetti + haptic
```

Every step has at least one rule attached to it in `.claude/rules/`.

## 4. Data model in one screen

```
schools  (uuid id, name)                          ← the tenant boundary itself
   │
   ├──< users     (school_id, russenavn, email, role, russ_type, quote, points,
   │      │        is_adult, token_version, deleted_at)
   │      │
   │      └──< submissions  (school_id, user_id, knute_id, image_key — NULL for
   │                         text-only evidence, caption, status, reviewed_by/at)
   │
   ├──< knuter    (school_id, title, points, difficulty, is_gold, evidence_type,
   │               min_age, source_library_knute_id, is_active,
   │               category — legacy, removal planned per ADR-0014)
   │
   ├──< knute_folders            (school_id, name, icon, sort_order)
   ├──< knute_folder_memberships (school_id, knute_id, folder_id)   knute ↔ folder M2M
   │
   └──< school_library_imports   (school_id, library_knute_id, knute_id, imported_by)

Shared across ALL schools — no school_id, no RLS, READ-ONLY for app_role (ADR-0014):

library_knuter   (title, points, difficulty, evidence_type, min_age,
                  suggested_folder = theme axis, region = discovery filter)
library_packs ──< library_pack_memberships >── library_knuter

Planned, not yet modeled: russenavn_allowlist, refresh_tokens, audit_log (auth epic);
sponsor tables (sponsor epic).
```

**The library model (ADR-0014): import = copy.** Importing snapshots the library fields into the school's own `knuter` row (provenance in `source_library_knute_id`), records the import in `school_library_imports`, and files the copy under a folder derived from `suggested_folder`. Copies are independent — schools edit them freely; library updates do NOT propagate. `evidence_type` (legally sensitive knuter, e.g. `text`) and `min_age=18` are set by the library and cannot be relaxed by schools. The "Alle knuter" view is implicit (the unfiltered knute list), never a stored folder.

> **Evidence type is moving to a three-value ladder** — `text_only` / `photo_only` / `photo_or_video` — per ADR-0019, so a knute can allow a photo but not a video. The current schema still uses the two-value `'media' | 'text'` enum; the migration is future work (not yet applied). The "library-set, unrelaxable for sensitive knuter" rule is unchanged.

Every table with `school_id` has:
- `enableRLS()`
- `pgPolicy(... using current_setting('app.school_id'))`
- `FORCE ROW LEVEL SECURITY` migration
- Composite index leading on `school_id`

See `.claude/rules/database.md` for the canonical example.

## 5. Deployment topology

```
GitHub (private monorepo)
   │ push to main
   ▼
GitHub Actions
   │  • pnpm install + cache
   │  • pnpm typecheck / lint / test (incl. RLS integration suite)
   │  • build apps/api as Docker image
   │  • build apps/mobile via EAS (preview channel)
   ▼
Hetzner Cloud Helsinki (CPX32)
   │  • systemd service running the Hono API
   │  • Caddy reverse proxy with auto-HTTPS
   │  • Connects to Aiven Postgres via private endpoint
   ▼
Aiven Postgres Helsinki (managed)
   │  • Daily backup + PITR
   │  • Maintenance window: Sundays 02:00 CET

Bunny Storage Frankfurt + Bunny CDN
```

> **No prices in this diagram on purpose.** Hetzner and Aiven both renamed and repriced
> their tiers during 2026 (CPX31 → CPX32, Startup-2 discontinued), which rotted the old
> numbers here. `docs/cost-model.md` (July 2026, verified) is the single source of truth
> for costs; ADR-0011 for the launch topology.

Mobile builds go through EAS:
- `eas build --profile preview` → internal TestFlight / Play Internal
- `eas build --profile production` → App Store / Play Store

## 6. Scale ramp — what changes at each step

> Rewritten 2026-07-09 per ADR-0011 (Accepted). **There is no pilot phase — v1 (2026)
> was the pilot**, validated with a full season at one school. v2 launches multi-school
> at russetid 2027 with a **100+ schools (~20,000 users)** target. Knuteloop's load is
> extremely seasonal (~5 weeks around russetid), so the ramp below is about the season
> peak, not a year-round topology. Prices live in `docs/cost-model.md` — not here.

**Development (now → launch):**
- 1× Hetzner box, 1× Aiven Postgres, dev-stub auth, no cache. Fine for building.

**Launch — russetid 2027, 100+ schools (~20k users), the ~5-week peak:**
- 2× CPX32 behind a Hetzner LB11 load balancer (stateless Hono — add nodes, no code change).
- Aiven Business-tier Postgres; add the read replica for feed/leaderboard reads when needed.
- Aiven Valkey for the rate-limit store + hot-read cache (leaderboard).
- Bunny CDN for all media, within the ADR-0019 bandwidth caps.
- Hard 2027 requirements from ADR-0011 that must land first: stop holding a DB
  transaction across the whole request, rate limiting, the caching layer, real auth,
  real observability.
- If sales land at 30–50 schools the first season, cost and revenue scale down
  together — nothing here is all-or-nothing.

**Off-season (the other ~47 weeks):**
- Scale down to a lean baseline: 1× box, smaller DB tier, no load balancer. Infra
  spend follows the seasonal curve (ADR-0011) — that is what keeps the annual total
  small (~€2–3k/yr excl. video).

**National full scale (2028+, ~250 schools / ~50k users):**
- More/bigger API nodes (CPX42), bigger Business tier + read replica, materialized
  leaderboard view refreshed every 60s. Same architecture, bigger dials.

**The architecture supports all of this WITHOUT a rewrite.** That's the design goal.

## 7. What we explicitly chose NOT to do

- **No microservices.** One Hono app, scaled vertically and then horizontally behind a load balancer. Microservices are a tax we don't need to pay.
- **No GraphQL.** REST + JSON is simpler, every tool understands it.
- **No NoSQL.** Postgres covers all our access patterns. Adding a second data store would mean dual writes and consistency bugs.
- **No serverless / edge functions.** Stateful connection pooling matters; cold starts matter; EU compliance matters. Long-running Node on Hetzner is simpler and cheaper at our scale.
- **No real-time websockets** (yet). The feed refreshes on pull or on TanStack Query invalidation. If real-time becomes a clear need, add Server-Sent Events from the same Hono app — no new infrastructure.
- **No US infrastructure.** Period. See ADR-0001.

(Removed: the old "no video / photos only" line. v2 now supports photo **and** video for normal
knuter, with media restricted per-knute for sensitive content — see ADR-0019, which supersedes
ADR-0009 and folds in ADR-0012's bandwidth caps. The video pipeline itself is not built yet.)

## 8. Where to look when something specific changes

| You want to change... | Read first |
|---|---|
| A backend endpoint | `.claude/rules/backend.md` |
| A database table | `.claude/rules/database.md` |
| Auth or session handling | `.claude/rules/security.md` |
| Mobile UI / animations | `.claude/rules/frontend.md` |
| A core architectural choice | `docs/adr/README.md` |
| Workflow steps (add endpoint, migrate prod) | `docs/workflows.md` |
| What a russetid term means | `docs/glossary.md` |
| What's broken / fix-when-on-call | `docs/disaster-recovery.md` |

## 9. The one thing to remember

**Knuteloop's threat model isn't malicious hackers — it's accidentally leaking data across schools.** RLS is the linchpin. If you find yourself writing a query without `school_id` in the WHERE clause, stop. If you find yourself adding a table without `.enableRLS()`, stop.

Cross-tenant leaks would be a regulatory incident (Datatilsynet, GDPR for minors) AND would destroy the brand overnight. Everything else is recoverable.
