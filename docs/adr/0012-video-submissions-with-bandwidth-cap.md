# ADR-0012: Video submissions in v2, with a bandwidth budget as a hard design constraint

**Status:** Superseded by [ADR-0019](./0019-per-knute-evidence-type.md)
**Date:** 2026-06-13
**Deciders:** Ludvig (+ Claude as advisor)
**Supersedes:** [ADR-0009](./0009-no-video-photos-only.md)

> **Superseded 2026-07-02.** This ADR was never moved past Proposed. Its decision (video via Bunny
> Stream) and its **hard bandwidth/length/resolution caps are folded into the now-Accepted
> [ADR-0019](./0019-per-knute-evidence-type.md)**, which is the single source of truth for the media
> policy. Those caps still govern the video pipeline when it is built — read them here, decision-wise
> read 0019.

## Context

[ADR-0009](./0009-no-video-photos-only.md) chose photos-only for v2, with an explicit reversal threshold: *"≥30% of users explicitly request it AND we have data infrastructure budget headroom."*

Two things changed:
1. **Budget headroom now exists** — improved funding plus the new revenue model where schools + sponsors pay (see [ADR-0011](./0011-scale-target-100-schools-2027.md)).
2. **Product direction** — the team wants video as a retention feature for the TikTok-style fullscreen feed already built.

Cost modeling — the reason this ADR exists — shows video is affordable **only if bandwidth is controlled**. Video is the single largest and most volatile cost line: **5–50× the photos-only baseline**, dominated by CDN delivery of feed videos, and driven by *viewing* engagement (videos watched/user/day), not upload volume.

Cost levers found during modeling:
- Only **~2/5 of submissions reach the feed**; the other ~60% are approval evidence and can be deleted after review → removed from the expensive served path.
- **Bunny Stream** (EU) includes **free transcoding + adaptive bitrate** delivery — the primary bandwidth lever.
- Capping length and resolution bounds per-view bytes directly.

Modeled bandwidth (dramatic scenario: 20,000 users, 7 videos each, 5-week season, 2/5 to feed): **~$1,300 (low engagement) to ~$17,000 (TikTok-level engagement) per season.** Photos for the same feed: ~$50–100. Video is ~100× the per-view delivery cost of photos.

## Decision

**v2 supports both photo and video submissions.** Video is delivered through **Bunny Stream** (not raw file CDN) for free transcoding + adaptive bitrate.

**Hard design constraints — the cost cap (non-negotiable, part of this decision):**
- Cap video **length (≤30s)** and **resolution (≤720p)** at capture/upload.
- **Non-feed submissions are deleted** after approval + a short buffer — never retained or served at scale (only ~2/5 reach the feed).
- **Adaptive bitrate on by default**; limit feed **preload** (do not prefetch many videos ahead in the scroll).
- A **monitored bandwidth budget + alarm** so a runaway-engagement season is caught early.

## Alternatives considered

- **Stay photos-only (keep ADR-0009).** Rejected: funding + product direction now clear the ADR-0009 threshold; competitors differentiate on video.
- **Video via a US-owned pipeline (Mux, AWS Elemental).** Rejected: violates [ADR-0001](./0001-eu-data-residency.md) (EU residency). Bunny Stream is the EU-compatible path that did not exist cleanly in the ADR-0009 analysis.
- **Short clips only (≤5s, no audio), as ADR-0009 floated.** Folded in as a softer length cap rather than a separate rule — we cap at ~30s and allow audio.
- **Unbounded video (no caps).** Rejected: engagement-driven bandwidth could reach 40–46% of revenue, or exceed an outlier school's flat payment, without caps.

## Consequences

### Good
- Video is a retention/feed feature aligned with the TikTok-style feed already shipped.
- Bunny Stream's included transcoding + adaptive bitrate keeps the dominant cost controllable and stays EU-compliant.
- The 2/5-feed + delete-evidence rule makes storage trivial (~€20–50/season) and removes ~60% of content from the expensive served path.

### Bad / trade-offs accepted
- Video CDN bandwidth becomes the largest, most volatile cost (~$1,300–17,000/season). Requires active monitoring + the caps above.
- Moderation surface grows — video is harder to scan than photos. Accept and plan for knutesjef review.
- Larger uploads on weak school WiFi — mitigated by length/resolution caps + client-side compression.
- The mobile submit flow must add video capture (expo-camera video) + Bunny Stream upload, superseding ADR-0009's photo-only "Neutral" note.

### Neutral
- Per-school engagement variance: a hyper-engaged school could exceed its flat 3500 kr in pure bandwidth; the caps + cross-school averaging keep this bounded (see [ADR-0011](./0011-scale-target-100-schools-2027.md)).
- On acceptance: CLAUDE.md **Critical Rule 11 ("No video")**, architecture.md §7, and the frontend rules' no-video stance must be updated. ADR-0009 flips to **Superseded**.

## Open questions

- The headline cost swings ~10× on **viewing engagement** (videos watched/user/day) — a behavior the 2026 test did not measure. Is there any feed-view / watch-time data to pin it?
- Exact length/resolution caps (30s / 720p is a starting proposal — validate against UX).
- Bunny Stream delivery pricing at our volume tier (verified ~$0.005–0.01/GB; confirm the volume tier).
- Content moderation approach for video — knutesjef manual review only, or an automated scan step?
