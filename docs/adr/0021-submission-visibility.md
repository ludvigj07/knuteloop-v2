# ADR-0021: Per-submission visibility (delt / privat) + submission-flow rules

**Status:** Accepted
**Date:** 2026-07-22
**Deciders:** Ludvig (+ Claude as advisor)

## Context

v2 currently auto-publishes every approved submission to the school feed AND the
public profile grid. Two independent signals said this is wrong:

1. **Ludvig's product feedback (2026-07-09 handoff):** auto-publishing ALL
   approved knuter on the public profile felt wrong. Three models were sketched
   (A curated opt-in / B all-with-opt-out / C automatic selection) — decision
   was parked.
2. **v1 behaviour:** v1 had three submission modes — `review` (knutesjef only),
   `feed`, and `anonymous-feed` — implemented as two toggle pills. The default
   was review-only. Users actively used the private mode for embarrassing
   knuter. v1 ALSO let the owner hide a post from their profile afterwards
   (`PATCH /submissions/:id/visibility`).

The v1 UI caused confusion: two checkbox-like pills ("Del som bruker" / "Del
som anonym") + one submit button, and both pills landed in the same feed.

Some users are 17. GDPR Art. 25 (data protection by design and by default)
applies with extra Datatilsynet scrutiny for minors — publishing a photo of a
minor to an entire school should be an active, informed choice, not a default.

## Decision

**One visibility flag per submission, chosen at submit time by which button you
press, editable afterwards by the owner.**

1. **`submissions.visibility`: `'shared' | 'private'`.** DB default `'private'`
   (privacy by default — any client that omits the field gets the safe value).
2. **The submit screen has TWO action buttons** — «Del i feeden» (shared) and
   «Send inn» (private). The button IS the choice: no checkboxes, no
   preselected state to forget. This is an active per-publication choice,
   which is exactly the privacy-by-default posture the DPIA needs.
3. **Private = owner + knutesjef only.** The review queue is unaffected —
   knutesjef sees and approves everything the same way.
4. **Feed and public profile grid show only `visibility = 'shared'` AND
   `status = 'approved'`.** The profile question is thereby resolved: the grid
   is exactly what you chose to share (model A/B hybrid via one flag).
5. **Points, leaderboard, streak, and (future) badges count regardless of
   visibility.** The achievement is public (aggregate numbers were already
   public on the leaderboard); only the evidence is private.
6. **Owner can flip visibility both ways at any time**
   (`PATCH /api/submissions/:id/visibility`). Non-owner in the same school →
   403; other school → 404 (no existence leak).
7. **Feed position = share time, not submit time.** `submissions.shared_at` is
   set when the submission first becomes shared (at insert for shared
   submissions, at first flip for late shares). The feed orders by
   `shared_at DESC`, so sharing an old private post surfaces it at the top —
   not buried at its original date. `shared_at` is set once (first share
   wins): re-sharing after a hide returns the post to its original feed
   position rather than bumping it (removes the re-share-to-stay-on-top
   abuse).
8. **No anonymous feed mode in v2.** v1's `anonymous-feed` is dropped:
   v2 has no reports/bans/moderation tooling yet, knutesjef is a peer (not a
   moderator) across 100+ schools, and anonymity raises App Store UGC and
   legal questions. Revisit only after moderation tooling exists AND legal
   advice is taken. Adding it later is easy; removing it later is not.

**Submission-flow rules decided in the same session (implemented separately):**

9. **A pending submission is editable** («Oppdater innsending», as in v1):
   the owner can replace the photo, edit the caption, and change the
   visibility choice until the knutesjef reviews it.
10. **Evidence is optional on media knuter** (v1 rule): caption OR photo —
    at least one. Text-only knuter (`evidence_type = 'text'`, ADR-0019) are
    unchanged: caption required, photo not accepted (that is a content-safety
    gate, not a preference).

## Alternatives considered

- **Model B for profiles only (all shared, per-post opt-out), feed untouched.**
  Solves the profile complaint but keeps forced feed publishing; the July
  feedback and v1 usage both show people want some knuter never published.
  Rejected.
- **A "share to feed" toggle + one submit button.** One toggle is less
  confusing than v1's two, but it still has a default state (defaults publish
  minors' photos, or defaults to private and the feed starves silently) and a
  state to forget. Two explicit buttons have no default and no hidden state.
  Rejected.
- **Keep v1's anonymous mode.** Engagement upside is real (lower threshold for
  embarrassing knuter — and that content is feed gold). Rejected for v2:
  moderation infrastructure doesn't exist yet, and the risk profile with
  minors at 100+ unmoderated schools is unacceptable. Reconsider post-launch
  with reports/bans + legal review.
- **Feed position = original `created_at` for late shares.** Simpler (no
  `shared_at` column), but a late-shared post lands buried days deep — user
  shares, sees nothing happen, concludes the feature is broken. Rejected.

## Consequences

### Good
- Lower threshold for completing embarrassing knuter → more submissions,
  points still flow, streaks still build.
- Privacy by default + active per-publication choice = clean DPIA story for
  minors (GDPR Art. 25).
- The parked profile A/B/C decision is resolved with one mechanism instead of
  a separate profile-curation feature.
- v1 parity on the feature users actually used, minus the checkbox confusion.

### Bad / trade-offs accepted
- The feed loses some volume vs. auto-publish-everything. Accepted: forced
  content is worse than less content.
- Two primary-looking buttons on the submit screen is an unusual pattern and
  needs care in the design round (visual parity, no dark pattern nudging
  minors toward publishing).
- `shared_at` is denormalized state with a code-enforced invariant
  (`visibility = 'shared'` ⇒ `shared_at IS NOT NULL`) — set at insert and at
  first flip; nothing enforces it at the DB level.
- Aggregate counts (points, "fullført: N" on the public profile header)
  include private submissions, so the grid can show fewer items than the
  count says. Consistent with rule 5, but worth a UX glance later.

### Neutral
- Feed cursor pagination changes its sort key from `created_at` to
  `shared_at`. The cursor is opaque to the client (an ISO string round-trip),
  so no mobile change is needed for pagination itself.
- Existing rows (dev/test only — no production data exists) become `private`
  by the column default; the dev seed marks its rows `shared`.
- The old `submissions_feed_approved_idx` (created_at) no longer serves the
  feed query; a new partial index on `(school_id, shared_at DESC)` does.
  The old index is left in place in this ADR's PR (no drive-by removals) and
  can be dropped in a later cleanup migration.

## Open questions

- Bulk control ("del alt jeg fremover sender inn" preference)? Not now —
  per-submission choice only, revisit if users ask.
- Should the knutesjef see the visibility choice in the review queue (e.g. a
  small «privat»-badge)? Leaning yes (context for approval), decided in PR C's
  design round.
- Anonymous mode post-launch: requires reports + bans + legal advice first
  (see rule 8).
