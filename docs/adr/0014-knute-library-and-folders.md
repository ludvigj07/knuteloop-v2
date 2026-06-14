# ADR-0014: Knute library + per-school folders + evidence type

**Status:** Accepted
**Date:** 2026-06-14
**Deciders:** Ludvig (+ Claude as advisor)

## Context

v2 currently models knuter as **per-school only** with a **fixed 5-value `category` enum**
(ADR-0013). That was a v1-derived stopgap. The real product — a key selling point to russestyret
("brukervennlighet") — is a **curated knute library** that works like Spotify:

- A central, curated catalog of ~500 real russ-knuter (sourced + formatted from schools'
  Instagram accounts; Ludvig supplies the data: title, task/description, folder, points).
- A knutesjef **browses** the library and clicks **＋ to import** a knute into their school's list.
- Imports are **copies** — the school then **edits** them freely and can **create their own**.
- Each school organizes its knuter into **its own folders** (5–10, not a fixed 5), and always has a
  system **"Alle knuter"** view containing everything. A knute can sit in **several** folders.
- **Legal risk for minors:** some knuter (e.g. sex-knuter) must be **text-only** — no photo/video
  evidence — to mitigate liability. This is a fixed property of the knute that schools cannot relax.

This supersedes the **category-enum part of ADR-0013** (the fixed 5 folders).

## Decision

### 1. Library side — central, curated, shared (no tenant RLS)

- **`library_knuter`** — the catalog. Fields: `title`, `description` (the task), `points`,
  `difficulty`, `evidence_type` (`'media' | 'text'`), `suggested_folder` (text — the theme it
  belongs to, e.g. "Alkohol"), `is_active`. Curated by a Knuteloop super-admin.
- **`library_packs`** + membership — named bundles (e.g. "Klassiske russeknuter"). A **starter pack
  (~100 knuter)** ships with `suggested_folder` filled so importing it gives a school a ready-made
  folder structure. Students never see the word "pakke" — they just see normal folders.
- Library browse-categories are derived from `suggested_folder`.

### 2. School side — per-school, RLS (defence in depth, as always)

- **`knuter`** (existing, RLS): **drop** the fixed `category` enum. **Add** `evidence_type`
  (`'media' | 'text'`, not null) and `source_library_knute_id` (nullable — provenance for imports).
- **`knute_folders`** (new, RLS): `id`, `school_id`, `name`, `sort_order`. School-defined.
- **`knute_folder_memberships`** (new, RLS): `knute_id × folder_id` — many-to-many, so a knute can
  live in multiple folders. **"Alle knuter" is implicit** (the unfiltered list) — not a stored row,
  so we never duplicate every knute into it.
- **`school_library_imports`** (new, RLS): records which `library_knute` a school imported (dedupe +
  "added" state in the browse UI).

### 3. Import = copy

Importing a library knute (or a whole pack) **inserts a snapshot** into the school's `knuter`
(title/description/points/difficulty/evidence_type), records it in `school_library_imports`, and
**auto-creates/assigns folders** from `suggested_folder` (esp. for the starter pack). The school
then owns its copies and edits them freely. Library updates do **not** propagate (copies are
independent; an "update available" prompt can come later).

### 4. Evidence type (legal)

- **Library knuter carry a fixed `evidence_type`.** Knuteloop sets sensitive ones (sex-knuter) to
  `'text'`. Imported copies inherit it, and **schools cannot change it.**
- **Custom (school-created) knuter default to `evidence_type='text'`**, and a **Knuteloop super-admin
  reviews** them and may upgrade to `'media'`. → the knute works immediately (as text-only), no
  blocking queue, and a school can never self-publish a photo/video sex-knute. (Ludvig's rule:
  custom knuter are reviewed centrally so schools can't create sex-knuter with photo submission.)
- **Submit screen:** `'text'` knuter hide camera/gallery and accept only a text caption.
- **Feed:** text-only submissions render as **text cards** (the feed already handles photo posts;
  it gains a text-card variant), so they still appear socially without an image.

### 5. "Alle knuter"

Every school always has the implicit **"Alle knuter"** view (all their knuter, no folder filter).
Custom folders are optional groupings layered on top.

## Alternatives considered

- **Reference (not copy) library knuter.** Rejected — schools must edit (points, wording), and the
  architecture docs already say "adopt them into their own knuter table." Copy = ownership.
- **Single folder per knute.** Rejected — a knute is always in "Alle knuter" + optionally custom
  folders, so membership is inherently many-to-many.
- **Keep the fixed 5-category enum (ADR-0013).** Rejected/superseded — schools need their own
  arbitrary folders (5–10).
- **Block custom knuter until reviewed.** Rejected in favour of *default text-only → upgrade on
  review* — same legal safety, zero onboarding friction.

## Consequences

### Good
- Instant onboarding: import the starter pack → ~100 organized knuter in seconds. Strong
  "see how easy" demo for russestyret.
- Schools self-organize (their folders) + customize (edit copies) + extend (custom knuter).
- Legal risk contained: sensitive knuter are text-only and unrelaxable; custom knuter are safe-by-
  default + centrally reviewed.

### Bad / trade-offs accepted
- More tables (library + folders + memberships + imports) and a **central moderation surface**
  (a Knuteloop super-admin tool to manage the library + review custom knuter) — new work.
- The profile **category rings** (built for a fixed 5) must be redesigned for dynamic folders
  (bounded 5–10, so still feasible — likely top folders or a different progress viz).
- A migration: drop `knuter.category`, add `evidence_type` + `source_library_knute_id`, add the
  three new tables (each with FORCE RLS + cross-tenant tests).

### Neutral
- Supersedes the category-enum decision in ADR-0013 (the profile/status fields there stand).
- Interacts with ADR-0012 (video): `evidence_type='media'` is photo today; video, if accepted,
  is a sub-case of media gated by the same flag.

## Open questions

- The Knuteloop super-admin library/moderation tool — separate web surface or part of the app?
  (Build after the data model + import flow.)
- Exact import UX: per-knute ＋, whole-pack import, and the browse/search of ~500 — design pass.
- Profile rings redesign for dynamic folders.
- Do we ever push library updates to imported copies? (Default: no.)
