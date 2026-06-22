# Knuteloop v2 — Execution Roadmap

> **Status:** living plan · **Date:** 2026-06-19 · Built from a survey of current v2 state + v1 parity
> (`docs/v1-spec.md`) + all 16 ADRs + the App Store audit + the content triage.
> Re-generate when scope shifts. Decisions live in `docs/adr/`; this file is the *sequencing*.

## 1. State of the app, in one line

**The core loop works end-to-end on dev-tokens:** a russ can browse knuter, submit a photo/text, the knutesjef approves it, points flow to the leaderboard, and it shows up in the feed and profile — but there is **no real login, no moderation, no production deploy, and the library has no real content yet**, so it can't go to TestFlight as-is.

---

## 2. Phases (in order)

Legend: 🟢 Claude autonomous (review-after) · 🟡 needs Ludvig's eye (mostly frontend; moves to 🟢 once the incoming design lands) · 🔴 needs a decision / money / external account / lawyer

---

### Phase 0 — Before 28 July (the big autonomous block)

This is the window where Ludvig is fully available to review. Pack it with high-leverage 🟢 backend work and the things that **unblock** Phases 1-3. Goal: when military service starts, the hard architecture is done and only small steady PRs remain.

| Item | Area | Tag | Depends on | Size |
|---|---|---|---|---|
| Fix tenant-context txn-per-request throughput (stop holding a DB txn across the whole request) | Backend perf | 🟢 | — | M |
| UGC moderation suite — backend: `submission_reports` + `comment_reports`, `bans` (feed/submission, 24h/3d/1w), block list, moderation queue endpoint, appeal field | Backend | 🟢 | — | L |
| Rate limiting (in-memory store now, Valkey-ready interface) on auth + all mutating endpoints | Backend | 🟢 | — | M |
| Production storage: wire Bunny presign + CDN URLs, magic-bytes MIME validation on submit, reject failed uploads | Backend | 🟢→🔴 | 🔴 Bunny account/key | M |
| GDPR features: account deletion (soft-delete + token revoke), `GET /api/me/export`, retention job skeleton, audit log table | Backend | 🟢 | — | M |
| Auth scaffolding (vendor-agnostic): `russenavn_allowlist` + roster import endpoint, `refresh_tokens` + rotation + reuse-detection, `token_version` revoke check, RS256 signing + JWKS endpoint | Backend | 🟢 | — | L |
| Rank titles (read-time function, all 11 thresholds known) | Backend | 🟢 | — | S |
| Streak bonus points (read-time, tiers 0/5/10/15/20%, 6pt cap, Oslo tz — all known) | Backend | 🟢 | — | S |
| Daily knute endpoint (deterministic pick, **Oslo tz** — fixes v1 bug) | Backend | 🟢 | — | S |
| Public profile endpoint `GET /api/users/:id` (same-school gated) + profile fields (className, bio, quote, signatureKnot, favoriteCategory…) + `PATCH /api/me` | Backend | 🟢 | — | M |
| Class leaderboard + hot-movers (needs `className` on users — known v1 rules) | Backend | 🟢 | className field | M |
| Badges/achievements (7 types × 4 tiers, **whole-word** keyword match, fixes v1 substring bug) | Backend | 🟢 | — | M |
| RLS cross-tenant denial tests for every new table | Backend/test | 🟢 | each new table | M |
| Expo SDK 52→56 upgrade | Mobile infra | 🟢 | — | M |
| Folders UI wired into catalog (backend done) | Mobile | 🟡 | incoming design | S |

> Phase 0 is intentionally ambitious. Every item has **known rules or a clear spec** — that's why it's 🟢. The auth *scaffolding* is 🟢 because the table shapes + JWT mechanics are vendor-neutral; only the Vipps/Apple *integration* (Phase 1) is gated.

---

### Phase 1 — Auth & identity (ADR-0016 path)

Mostly 🔴 — gated on accounts, money, and a lawyer. The scaffolding (tables, refresh, JWKS) is done in Phase 0, so this phase is just the external integrations.

| Item | Area | Tag | Depends on | Size |
|---|---|---|---|---|
| **Decision: accept ADR-0016** (still *Proposed*) | Decision | 🔴 | — | S |
| Vipps merchant onboarding (org #, contract, cost, timeline, confirm scopes) | External | 🔴 | ADR-0016 | M |
| Lawyer sign-off: Folkeregisteret data handling for minors | Legal | 🔴 | — | M |
| Vipps Login OIDC integration (verify token, age/birthdate; scopes openid+name+birthDate only) | Backend | 🟢 | Vipps onboarding | M |
| Apple Sign In integration (App Store 4.8, must be an **equal peer**, not a fallback) | Backend+Mobile | 🟡 | — | M |
| Roster-match UX + manual-review queue (allowlist lookup → claim or review) | Backend+Mobile | 🟡 | allowlist table (P0) | M |
| Swap dev-tokens out / gate dev-login behind an explicit dev flag | Backend | 🟢 | Vipps+Apple live | S |

---

### Phase 2 — App Store readiness

| Item | Area | Tag | Depends on | Size |
|---|---|---|---|---|
| **Content cull**: triage doc + lawyer review of ~36 gråsone knuter, rename problematic names, cut alcohol/sex/tobacco per Apple 1.4.3/1.4.5/1.1.4 | Content/Legal | 🔴 | lawyer | L |
| Library curation: source ~500 real knuter (Ludvig, from Instagram), format + tag, run through triage filter | Content | 🔴 | content cull | L |
| Library seeding into `library_knuter`/`packs` once curated set exists | Backend | 🟢 | curated set | S |
| Moderation suite — mobile UI: report, block, ban display, appeal, knutesjef moderation queue (Apple 5.1.1(v)) | Mobile | 🟡 | moderation backend (P0) | M |
| Comments + ratings (UGC — Apple wants moderation here too; known v1 rules) | Backend+Mobile | 🟢→🟡 | moderation suite | L |
| Privacy notice (plain Norwegian, first-login) + DPIA (`docs/dpia.md`) | Legal/Mobile | 🔴 | lawyer | M |
| Two Ludvig-only checks: GitHub repo private? + `pnpm audit` clean | Ops | 🔴 | — | S |

---

### Phase 3 — Production & TestFlight

| Item | Area | Tag | Depends on | Size |
|---|---|---|---|---|
| Production DB (Aiven prod instance, app_role/admin_role, FORCE-RLS verified) | Infra | 🔴 | Aiven cost quote | M |
| Deploy pipeline (Hetzner + Caddy + systemd, CI → image) | Infra | 🔴 | prod DB | M |
| Observability: Sentry EU (PII scrub verified), Pino shipping, `/healthz` | Backend | 🟢→🔴 | Sentry EU acct | M |
| Bandwidth/cost monitoring + alarms (esp. for future video, ADR-0012) | Infra | 🔴 | deploy | M |
| EAS production build profile + TestFlight + Play Internal | Mobile/Ops | 🔴 | auth + content done | M |
| Real-student TestFlight round | Ops | 🔴 | everything above | — |

---

### Phase 4 — v1 parity / nice-to-haves

Build in Phase 0 if there's time (most are 🟢 with **known rules**); otherwise these are the small-PR work during military service.

| Item | Tag | Rules | Size |
|---|---|---|---|
| Rank titles | 🟢 | known (11 thresholds) | S |
| Streak bonus points | 🟢 | known (tiers + cap) | S |
| Daily knute | 🟢 | known (Oslo tz fix) | S |
| Badges (7×4) | 🟢 | known (whole-word fix) | M |
| Class leaderboard + hot-movers | 🟢 | known | M |
| Comments + ratings | 🟢/🟡 | known (separate tables) | L |
| Public profiles + profile history | 🟢/🟡 | known | M |
| Dåp reveal gate | 🟢 | known (per-school flag) | S |
| Knuteloop Wrapped | 🟡 | known but design-heavy | L |
| Thread tiers (bronse/sølv/gull tråd) | 🔴 | reconstructed — needs ADR | M |
| Sponsor knuter + reports | 🔴 | needs ADR + revenue design | L |
| Duel / knute-off | 🔴 | sketch only — needs ADR | L |
| Video submissions | 🔴 | ADR-0012 Proposed + cost gate | L |

---

## 3. The critical path to a real-student TestFlight build

Shortest dependency chain — everything else is parallel or deferrable:

```
ADR-0016 accept (🔴 you)
   ↓
Vipps onboarding (🔴) ──┐         Content cull + lawyer (🔴) ──┐
Lawyer minor-data (🔴) ─┤                                      │
   ↓                    │                                      │
Vipps + Apple wired ────┘                                      │
(auth scaffolding already done in P0)                          │
   ↓                                                           ↓
Moderation suite (P0 backend 🟢 + P2 mobile 🟡)        Library curation + seed
   ↓                                                           ↓
        ──────────────── both feed into ────────────────
                              ↓
   Production storage (Bunny 🔴) + deploy + prod DB (🔴) + observability
                              ↓
                  EAS production build → TestFlight
```

**The two slowest links are external — start them NOW in parallel:** Vipps onboarding and the content-cull lawyer review. Both burn weeks of calendar time without blocking coding. Everything Claude can build (auth scaffolding, moderation backend, storage, GDPR, rate limiting) happens in Phase 0 while those clear.

---

## 4. What Claude can start RIGHT NOW (top 5 🟢)

Safe to do autonomously and self-verifiable (typecheck + lint + RLS/integration tests prove correctness without Ludvig's judgment):

1. **UGC moderation backend** — `submission_reports`, `comment_reports`, `bans`, block list, moderation-queue endpoint. *Safe:* known v1 rules, new tenant-scoped tables with RLS + full cross-tenant tests. Hard launch-blocker (Apple 5.1.1(v)), pure backend.
2. **Auth scaffolding (vendor-agnostic)** — `russenavn_allowlist`, `refresh_tokens` + rotation + reuse-detection, `token_version` check, RS256 signing + JWKS. *Safe:* shapes + JWT mechanics fully specced in security.md; no Vipps decision needed yet. Unblocks all of Phase 1.
3. **GDPR features** — account deletion, data export, retention job, audit log. *Safe:* explicit in security.md §9; testable; launch-blocker.
4. **Rate limiting** — auth + mutating endpoints, store interface that swaps in-memory → Valkey later. *Safe:* defaults specced in backend.md §10; launch-blocker; isolated.
5. **The cheap parity wins** — rank titles + streak bonus + daily knute (Oslo-tz). *Safe:* every threshold/formula in v1-spec; small, pure, read-time; high user-visible value for near-zero risk.

(Also queueable: the **Expo SDK 52→56 upgrade** — mechanical, self-verifying via build, launch-blocker.)

---

## 5. Decisions blocking Ludvig (🔴 — only you)

1. **Accept ADR-0016** (Vipps + Apple) — still *Proposed*; no auth integration ships until you lock it.
2. **Start Vipps merchant onboarding** — needs your org number + a contract; confirms the real cost/timeline (the long pole).
3. **Engage the lawyer now on two fronts** — Folkeregisteret/minor-data handling AND the content cull (gråsone review + renames); both gate App Store.
4. **Confirm the reconstructed v1 rules** (ADR-0013: gold-as-flag, streak definition, category rings) so parity work isn't built on guesses. *(Note: the scoring/streak/rank/badge numbers in `v1-spec.md` were extracted from real v1 source and are trustworthy; ADR-0013's category-mapping + a few profile rules are the reconstructed bits.)*
5. **Approve the money items** — Bunny production account/key, Aiven production instance + cost quote, Sentry EU account, EAS production builds.
6. **Run the two checks only you can** — is the GitHub repo private, and is `pnpm audit` clean.
7. **Source the ~500 real knuter** from schools' Instagram (the library has no content without this — blocks Phase 2).

---

**Bottom line:** before 28 July, have Claude build the entire backend launch-blocker set (moderation, auth scaffolding, GDPR, rate limiting, storage) plus the cheap parity wins, while you run the two slow external tracks (Vipps + lawyer) in parallel. That sequencing makes a real-student TestFlight realistic and leaves only small, reviewable PRs for the military-service period.
