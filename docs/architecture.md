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

**The library model (ADR-0014): import = copy.** Importing snapshots the library fields into the school's own `knuter` row (provenance in `source_library_knute_id`), records the import in `school_library_imports`, and files the copy under a folder derived from `suggested_folder`. Copies are independent — schools edit them freely; library updates do NOT propagate. `evidence_type='text'` (legally sensitive knuter) and `min_age=18` are set by the library and cannot be relaxed by schools. The "Alle knuter" view is implicit (the unfiltered knute list), never a stored folder.

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
Hetzner Cloud Helsinki (CPX31, ~€18/mo)
   │  • systemd service running the Hono API
   │  • Caddy reverse proxy with auto-HTTPS
   │  • Connects to Aiven Postgres via private endpoint
   ▼
Aiven Postgres Startup-2 Helsinki (~€55/mo)
   │  • Daily backup + 7-day PITR
   │  • Maintenance window: Sundays 02:00 CET

Bunny Storage Frankfurt + Bunny CDN (€10-30/mo @ pilot scale)
```

Mobile builds go through EAS:
- `eas build --profile preview` → internal TestFlight / Play Internal
- `eas build --profile production` → App Store / Play Store

## 6. Scale ramp — what changes at each step

**1 school, ~250 users (pilot, validated):**
- 1× CPX21 Hetzner, single Aiven Startup-2, single Bunny zone.
- Cost: ~€100/month.
- No caching layer — all queries hit Postgres.

**10 schools, ~2000 users (target 2027):**
- Upgrade to CPX31 (4 vCPU, 8GB).
- Stay on Aiven Startup-2 (sufficient).
- Add Aiven Valkey (Redis) for rate-limit store + leaderboard cache.
- Bunny still flat-rate at this volume.
- Cost: ~€180/month.

**50 schools, ~10k users (2028):**
- 2× CPX31 behind a load balancer.
- Aiven Business-4 (more connections, more storage).
- Materialized view for leaderboard, refreshed every 60s.
- Cost: ~€400/month.

**250 schools, ~50k users (national, 2029):**
- 4× CPX41, autoscaling on CPU.
- Aiven Business-8 with read replica.
- Read replica handles feed/leaderboard reads; primary handles writes.
- Bunny CDN bandwidth tier upgrade.
- Cost: ~€1000-1500/month.

**The architecture supports all of this WITHOUT a rewrite.** That's the design goal.

## 7. What we explicitly chose NOT to do

- **No microservices.** One Hono app, scaled vertically and then horizontally behind a load balancer. Microservices are a tax we don't need to pay.
- **No GraphQL.** REST + JSON is simpler, every tool understands it.
- **No NoSQL.** Postgres covers all our access patterns. Adding a second data store would mean dual writes and consistency bugs.
- **No serverless / edge functions.** Stateful connection pooling matters; cold starts matter; EU compliance matters. Long-running Node on Hetzner is simpler and cheaper at our scale.
- **No real-time websockets** (yet). The feed refreshes on pull or on TanStack Query invalidation. If real-time becomes a clear need, add Server-Sent Events from the same Hono app — no new infrastructure.
- **No video.** Photos only. See ADR-0009.
- **No US infrastructure.** Period. See ADR-0001.

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
