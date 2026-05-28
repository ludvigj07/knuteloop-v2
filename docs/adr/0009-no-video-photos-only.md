# ADR-0009: Photos only — no video uploads in v2

**Status:** Accepted
**Date:** 2026-05-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

v1 was photo-only and the pilot showed that's sufficient — 1917 submissions in 14 days, no significant request for video. Some users informally asked, but it's not a top complaint.

Video would add:
- Significant storage costs (10-100× per submission)
- CDN egress costs (videos auto-play in feeds → big bandwidth)
- Encoding pipeline (need to transcode for mobile playback — adds AWS Elemental / Mux dependency, both US-owned)
- Larger upload sizes → worse experience on weak school WiFi
- Content moderation surface (video is harder to scan than photos)
- Battery / data concerns for users on metered plans

## Decision

**v2 supports photo uploads only.** No video.

If a user requests a "video knute" we politely decline. If sponsors request video, we propose photo + caption alternatives.

## Alternatives considered

- **Photos + short video clips (≤5s, no audio).** Mid-ground. Rejected for v2: even short clips add the encoding pipeline complexity and EU-compatible vendor list narrows (no Mux EU, no AWS Elemental). Re-evaluate for v3.

- **Photos + GIF/Live Photos.** Live Photos are iOS-only and don't fit Android well. GIF would still need an encoder. Rejected.

- **Photos with the option to embed YouTube/TikTok links.** Off-platform content = no control over privacy, takedowns, or availability. Rejected.

## Consequences

### Good
- Storage and bandwidth costs stay manageable at growth scale.
- Upload flow stays fast even on poor school WiFi.
- No need for video encoding pipeline = simpler architecture.
- Content moderation is tractable (photos are scannable; videos are not).
- Aligns with Knuteloop's identity: "quick, snappy, in-the-moment."

### Bad / trade-offs accepted
- Some users will want video, especially for "best" knuter (the loud, performative ones). We're saying no.
- Competitors may add video and use it as a marketing point.
- If video becomes a clear retention driver (which the pilot data does NOT show), we'd revisit. For now, the data says it's not needed.

### Neutral
- The mobile app's submit flow is built around `expo-image-picker` / `expo-camera` for still photos only. Video API surface is not used.

## Open questions

- If a future ADR proposes adding video, what's the data threshold to justify it? Probably: ≥30% of users in a survey explicitly request it AND we have data infrastructure budget headroom.
