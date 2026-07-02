# ADR-0019: Per-knute evidence type — text / photo / video, restricted for sensitive knuter

**Status:** Accepted
**Date:** 2026-07-02
**Deciders:** Ludvig (+ Claude as advisor)
**Supersedes:** [ADR-0009](./0009-no-video-photos-only.md) (photos-only), and consolidates the
still-Proposed [ADR-0012](./0012-video-submissions-with-bandwidth-cap.md) (video with a bandwidth cap)

## Context

Three earlier decisions touch what evidence a knute submission may contain, and they no longer
line up:

- **[ADR-0009](./0009-no-video-photos-only.md) (Accepted):** v2 is *photos only, no video*. A
  founder-level reversal now overrides this: normal knuter should support **both photo and video**.
- **[ADR-0012](./0012-video-submissions-with-bandwidth-cap.md) (Proposed):** re-introduced video via
  Bunny Stream with hard length/resolution/bandwidth caps. It was never moved to Accepted, so the
  repo has *two* ADRs superseding 0009 — one Accepted (photos-only), one Proposed (video). That
  ambiguity is what this ADR resolves.
- **[ADR-0014](./0014-knute-library-and-folders.md) (Accepted)** + **[ADR-0015](./0015-age-verification-and-content-gating.md) (Accepted):**
  introduced `evidence_type` as a two-value flag `'media' | 'text'`, where `'text'` is the
  legal-safety restriction for sensitive knuter (e.g. sex-knuter) — set by the library, unrelaxable
  by schools. `min_age` is a separate, orthogonal axis.

The `'media'` value is now too coarse: once video exists, "media" silently means "photo **or**
video", with no way to say "photo but **not** video". Some alcohol/high-risk knuter should allow a
photo but not a video; some sensitive knuter should stay text-only. We need a value per allowed
evidence level, not a single media/text toggle.

**This ADR is a decision + docs correction only.** The video upload/compression/transcode pipeline
and the schema migration are **not** built here — Ludvig is mid-way through the
Knutebibliotek/Knuteboka/folders epic, and this ADR exists so that future work does not fight a
stale "photos only" rule. See "Data model — proposed, not yet applied" below.

## Decision

### 1. Media policy

- **Normal knute submissions support both photo and video.** ADR-0009's blanket "no video" is retired.
- **Video, when built, is governed by ADR-0012's cost constraints** (Bunny Stream EU, ≤30s / ≤720p
  caps, delete non-feed evidence after review, adaptive bitrate, a monitored bandwidth alarm). Those
  constraints are folded into this decision — 0012 does not need a separate acceptance.
- **Sensitive knuter are restricted to less than full media**, as a legal/minor-safety control (see §3).

### 2. `evidence_type` becomes a three-value enum

Replace the two-value `'media' | 'text'` with an explicit **allow-ladder**, lowest → highest:

| Value | Meaning | Submit screen |
|---|---|---|
| `text_only` | No media upload — only a written explanation/caption. | Camera/gallery hidden; text caption only. Renders as a text card in the feed (ADR-0014). |
| `photo_only` | Photo allowed; **video not** allowed. | Photo capture/pick only; no video capture. |
| `photo_or_video` | Normal media submission — photo or video. | Photo + video capture. |

The ladder is ordered on purpose: a school may never move a knute **up** the ladder past the value
the library assigned (see §3). Naming is chosen to be self-documenting (the value says exactly what
is allowed) and to avoid the ambiguous word "media".

`min_age` (ADR-0015) stays **orthogonal**: any evidence type can be paired with any `min_age`. A knute
can be `text_only` **and** 18+ (most sex-knuter), or `photo_or_video` **and** all-ages (most fun
knuter). Evidence type answers *what proof is allowed*; `min_age` answers *who may see/do it*.

### 3. The restriction is a one-way legal floor (unchanged in spirit from ADR-0014)

- **Library knuter carry a fixed `evidence_type`.** Knuteloop's curator sets sensitive ones to
  `text_only` (or `photo_only` where a photo is fine but a video is not). Imported copies inherit it.
- **Schools cannot relax it** — they may not move a knute to a *more permissive* rung than the
  library set (`text_only` → can't become `photo_only`/`photo_or_video`; `photo_only` → can't become
  `photo_or_video`). They may make it *stricter* if a future UI allows it.
- **Custom (school-created) knuter default to `text_only`** and are reviewed centrally before a
  curator may raise them — so a school can never self-publish a photo/video sex-knute. (Same rule as
  ADR-0014 §4, now expressed on the three-value ladder.)

This preserves the ADR-0014 / ADR-0015 minor-safety guarantee verbatim; it only makes the "how much
media" axis more precise.

## Data model — proposed, NOT yet applied

**No migration is run as part of this ADR.** This is the sketch future work implements once the media
pipeline is scheduled. It must go through `/migration-plan` and Ludvig's explicit OK first.

Current code (do not change yet): `knuter.evidence_type` and `library_knuter.evidence_type` are
`text('evidence_type', { enum: ['media', 'text'] }).notNull().default('media')`
(`apps/api/src/db/schema/knuter.ts`, `.../library.ts`).

Proposed change, when built:

- New enum values `text_only | photo_only | photo_or_video`.
- **Value mapping** for the backfill:
  - existing `'text'` → `text_only`
  - existing `'media'` → `photo_or_video` (normal media knuter now also allow video)
  - curator afterwards downgrades the specific alcohol/high-risk knuter that should be
    `photo_only` — a data/curation step, not a schema step.
- Default flips from `'media'` to **`text_only`** for custom knuter, matching the safe-by-default
  review rule (ADR-0014 §4). Library rows get their value explicitly from the curator/seed.
- `submissions.image_key` stays nullable (NULL for `text_only`). A future `media_type`
  (`photo | video`) column on `submissions` distinguishes photo vs video once video ships — not now.

Because Postgres enum-value renames and CHECK changes are a REVIEW-class migration (and the existing
enum is currently `text`-typed via Drizzle's `text(..., { enum })`, so it's a value-set change, not a
real PG enum), the migration is a three-step: add the new allowed values / widen the CHECK → backfill
→ tighten. That is future work, gated by `/migration-plan`.

## Alternatives considered

- **Keep `'media' | 'text'` and add a separate `allow_video boolean`.** Rejected — two columns to
  express one ladder invites illegal combinations (`text` + `allow_video=true`) and a second
  unrelaxable-flag to enforce. One ordered enum is simpler and self-validating.
- **Leave ADR-0012 Proposed and just un-retire video informally.** Rejected — the whole point is to
  remove the "two ADRs supersede 0009, one says no-video" ambiguity. One Accepted ADR is the fix.
- **Three-value names `text` / `photo` / `video`.** Rejected — `video` reads as "video only", which
  isn't the intent (video knuter also accept a photo). `photo_or_video` is unambiguous.
- **Implement the pipeline now.** Rejected — out of scope; Ludvig is on the library/folders epic and
  explicitly wants a decision-only change so future media work isn't blocked by a stale rule.

## Consequences

### Good
- One Accepted source of truth for the media policy; ADR-0009 and the dangling Proposed ADR-0012 are
  both resolved.
- The evidence axis can now express "photo but not video", which the alcohol/high-risk knuter need.
- The minor-safety guarantee (sensitive = restricted, library-set, unrelaxable) is preserved and made
  more precise.
- Future media-pipeline work starts from a correct rule instead of fighting "photos only".

### Bad / trade-offs accepted
- A future REVIEW-class migration (enum value change + backfill + default flip) is now owed. Tracked,
  not done here.
- Until that migration lands, the code still uses `'media' | 'text'`; this ADR is ahead of the schema
  on purpose. Anyone reading the schema should follow the comment pointer to this ADR.
- Video's cost/moderation surface (ADR-0012's open questions — watch-time-driven bandwidth, exact
  caps, moderation approach) is inherited and still unresolved; it must be settled before video ships.

### Neutral
- Extends ADR-0014 and ADR-0015 rather than replacing them: the library/folder model and the
  `min_age` age-gate stand unchanged; this only refines the evidence axis they introduced.
- CLAUDE.md Critical Rule 11 and architecture.md §7 are updated by this change to drop "no video" and
  state the per-knute restriction instead.

## Open questions

- When is the media pipeline scheduled? (After the library/folders epic, per Ludvig.) The migration
  and the video upload/transcode work happen then, not now.
- Do any sensitive knuter need `photo_only` specifically (vs `text_only`)? A curation call for the
  lawyer/GDPR review that already owns ADR-0015's content decisions.
- Inherited from ADR-0012: exact length/resolution caps, Bunny Stream volume-tier pricing, and the
  video content-moderation approach (knutesjef manual review vs an automated scan step).
