# ADR-0022: Sharing requires media — the feed is a visual surface

**Status:** Accepted
**Date:** 2026-07-23
**Deciders:** Ludvig (+ Claude as advisor)

## Context

ADR-0021 introduced per-submission visibility (delt/privat) and, in the same
session, restored v1's loose evidence rule: on a media knute, a caption OR a
photo makes the submission valid (rule 10 — implementation pending when this
ADR was written).

Those two decisions together create a trap: once evidence is optional, the
feed fills with caption-only posts («gjorde det ✅») — no photo, nothing to
look at. v1 tolerated this because ratings and comments carried text posts;
v2's feed is a visual surface (frontend.md §1: «a feed app first») and has
neither yet. Ludvig proposed the fix (2026-07-23): require media for the feed.

## Decision

**A submission can only be `shared` if it carries media (photo now; video when
the pipeline ships — this season, per ADR-0019 with ADR-0012's bandwidth
caps).** This splits evidence into two independent axes:

| Axis | Rule |
|---|---|
| **Valid (points/streak/badges)** | caption OR photo — low threshold, everything counts (ADR-0021 rule 10) |
| **Shareable (feed + public profile grid)** | photo/video required — the public surfaces are visual |

In short: *everything counts; only pictures get shared.*

1. **Enforcement in the API** (not just UI): `POST /api/submissions` with
   `visibility: 'shared'` and no `image_key` → 400. `PATCH
   /api/submissions/:id/visibility` to `shared` on a row with `image_key IS
   NULL` → 400. Invariant: `visibility = 'shared'` ⇒ `image_key IS NOT NULL`.
2. **Text-only knuter (`evidence_type = 'text'`, ADR-0019) can never be
   shared.** They are photo-less by design (legal/minor-safety floor), so by
   construction the sensitive content (sex-knuter, high-risk alcohol) never
   reaches the feed or public profiles. This is a deliberate, load-bearing
   property — an App Store / Datatilsynet story, not a side effect.
3. **UI:** on a media knute without a photo, «Del i feeden» is visible but
   disabled with the hint «Legg ved bilde for å dele i feeden» (teaches the
   rule without nagging). On a text knute the share button is not rendered at
   all — only «Send inn».
4. **Points are untouched** — a caption-only submission earns exactly the same
   as a shared photo (ADR-0021 rule 5).

## Alternatives considered

- **Allow text posts in the feed (v1 behaviour).** v1's feed had ratings +
  comments to make text posts engaging; v2 has neither (yet). A feed of empty
  text cards is a boring feed, and the feed is the product's front page.
  Rejected.
- **Silently coerce shared→private when media is missing.** No 400, no error.
  Rejected: the user pressed «Del i feeden» and the post silently not
  appearing reads as a bug. Explicit beats silent.
- **UI-only enforcement (no API check).** Rejected: any client bug or direct
  API call could put text posts in the feed; public-surface rules are enforced
  server-side, always.

## Consequences

### Good
- The feed and profile grids are guaranteed visual — better product, and the
  TikTok-style profile grid needs images anyway.
- Sensitive text-only knuter are structurally excluded from all public
  surfaces. The DPIA can state this as an invariant.
- Resolves the ADR-0021-rule-10 trap before it ships: loose evidence for
  validity never dilutes the feed.

### Bad / trade-offs accepted
- Somewhat less feed volume: caption-only completions never appear. Accepted —
  that content had little feed value.
- A russ who wrote a caption-only submission and later wants to share it must
  first attach a photo — which today means the update-pending flow (ADR-0021
  rule 9, also pending) or a new submission after rejection. Small friction,
  acceptable.

### Neutral
- When video ships, `image_key` generalizes to a media key; the rule text
  («bilde/video») already covers it. No re-decision needed.
- The feed's shared_at ordering and cursor (ADR-0021 rule 7) are unaffected.

## Open questions

- None blocking. Revisit only if feed ratings/comments (v1 parity backlog)
  ever make text posts engaging enough to reconsider — that would be a new
  ADR.
