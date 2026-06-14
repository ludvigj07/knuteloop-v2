# ADR-0013: Knute category as an enum column + reconstructed profile/status rules

**Status:** Proposed
**Date:** 2026-06-14
**Deciders:** Ludvig (+ Claude as advisor)

## Context

We are rebuilding the **profile screen** to match v1 (see `docs/v1-screenshots/`). v1's
profile + status screens show: a **streak**, **category rings** (per-folder completion),
a **gold-knute** count, **knuter fullført**, a profile **quote**, and **russType**
(rødruss/blåruss). v2's data model had none of these.

The authoritative source for the exact v1 rules — `docs/v1-spec.md` — is an **empty stub**
(only a header). So the rules below are **reconstructed** from the screenshots plus the inline
hints in `CLAUDE.md` / `.claude/rules/*`. CLAUDE.md says "do not invent numbers presented as
v1-fact"; this ADR is where every reconstructed rule is recorded **as an explicit assumption**
so a reviewer (Ludvig on product, his brother on backend) can confirm or correct each one
separately from the code.

The biggest modelling question is **how to represent the knute folder (category)**.

## Decision

### 1. Category as a text column on `knuter` (not a folders table — yet)

Add `category text not null default 'Generelle'` to `knuter`, with an **application-level enum**
of the five v1 folders:

`Generelle · Dobbelknuter · Alkoholknuter · Sexknuter · Fordervett-knuter`

(UI maps these to short display labels: Generelle / Dobbel / Alkohol / Sex / Rampestrek.)

Also add `is_gold boolean not null default false` to `knuter` — the knutesjef-controlled
gullknute flag (see the gold rule under §3). Gold knuter get a gold visual treatment in the UI.

Like the existing `role`, `difficulty`, and `status` columns, this is a **plain `text` column
with the enum enforced only in TypeScript/Zod** — there is no Postgres `CHECK` or `ENUM` type.
That is deliberate and consistent with the rest of the schema.

A richer per-school **`knute_folders` table** (schools subscribe to / customise folders, as the
glossary's *knutemappe* implies) is **deferred to the curated-library feature** — consistent with
`database.md`, which already defers the library and its tables until real curated content exists.

### 2. Profile fields on `users`

- `russType text not null default 'blue'` (enum `blue`/`red`; glossary: anything other than red
  coerces to blue).
- `quote text` (nullable).

### 3. Reconstructed status rules (ASSUMPTIONS — confirm each)

These live in code (`apps/api/src/routes/me.ts`, `apps/api/src/lib/streak.ts`) and are flagged
here because the v1 spec is empty:

- **Gold knute (gullknute)** = a **distinct** knute the user has an **approved** submission for,
  where the knute is flagged `is_gold = true`. Gold is an **explicit choice the knutesjef makes**
  per knute (usually traditional knuter that have always been gold), surfaced as a toggle in the
  create/edit-knute form — it is **NOT** a points threshold. (v1 mis-modelled this as
  `points >= N`; corrected here per Ludvig. Mnemonic: gullknuter are traditionally *named* with
  "gull" — gullkongla, gulltråd — but the source of truth is the flag, not the name or points.)
- **Streak** = consecutive calendar days (**Europe/Oslo**) up to **today or yesterday**, on which
  the user has ≥1 **approved** submission. Based on the submission's **`createdAt`** (the day the
  *student acted*), not `reviewedAt` (which tracks the knutesjef's review schedule). Computed
  read-time; no stored counter. The Oslo day-key is computed in SQL
  (`(created_at AT TIME ZONE 'Europe/Oslo')::date`) so it's DST-safe and host-timezone-independent
  (a v1 bug was using host local time). The "today **or** yesterday" grace keeps an active streak
  from collapsing before the user has posted today.
- **Category ring** = (distinct **active** knuter in the folder the user has completed) /
  (active knuter in the folder, school-scoped). Folders with 0 knuter still render.
- **Knuter fullført** (headline) = distinct knuter the user has completed **all-time**, including
  knuter later deactivated. It can therefore be slightly higher than the sum of the rings (which
  count active knuter only). This is intentional and commented in the code.
- The dev-seed category→knute mapping is **test data only** (keyword-based in `dev-setup.ts`);
  the real v1 mapping is unknown.

### 4. Migration safety

Migrations `0008_profile_and_category_fields` (russType, quote, category) and
`0009_add_is_gold_to_knuter` (is_gold) are all `ALTER TABLE ... ADD COLUMN` with a constant
default or nullable → **SAFE / metadata-only** on PG17, no table rewrite. Because only columns are
added to already-RLS'd tables, **no new `FORCE ROW LEVEL SECURITY` migration is needed**. Category
and gold values are assigned in the **seed**, never via a backfill `UPDATE` in the migration
(which would make it REVIEW).

## Alternatives considered

- **`knute_folders` table now.** A real per-school folders table with FK from `knuter`. Rejected
  for the pilot: it's a new tenant table (enableRLS + FORCE + policy + index + cross-tenant test)
  for flexibility we don't need until the curated library exists. The enum column is the smallest
  step that unblocks the rings and is trivially migratable to a folders table later.
- **Postgres native `ENUM` type / `CHECK` constraint** for `category`/`russType`. Rejected for
  consistency: every other categorical column in the schema is app-level text. Mixing styles adds
  migration complexity (enum-type alterations are awkward) for marginal safety.
- **Stored streak counter** on `users`, updated on approval. Rejected: it can drift from the source
  of truth, and read-time computation is cheap at pilot scale.

## Consequences

### Good
- Minimal, SAFE migration; rings/streak/gold ship without new tables or RLS surface.
- Every reconstructed rule is written down and individually confirmable.
- Clean upgrade path to a `knute_folders` table when the library feature arrives.

### Bad / trade-offs accepted
- No DB-level guarantee that `category`/`russType` hold only valid values (same as `role` today).
- Headline "fullført" can exceed the sum of category rings when a completed knute is later
  deactivated — a deliberate, documented mismatch.
- Reconstructed rules may not match the real v1 behaviour; they are assumptions pending Ludvig's
  confirmation.

### Neutral
- A future profile-edit endpoint (writing `quote`/`russType`) must add Zod length clamps
  (~700 chars for `quote`, per the v1 note-clamp hint) — out of scope here (read-only `/me`).
- A `knuter(school_id, category) WHERE is_active` partial index may help once a school exceeds a
  few hundred knuter; not needed at pilot scale, and would require `CREATE INDEX CONCURRENTLY`.

## Open questions

- Are the five folder names + the rødruss/blåruss default correct for v2?
- Is the streak definition (approved-only, createdAt-based, today-or-yesterday grace) the v1 rule?
- Confirmed: gold is a knutesjef-set flag (`is_gold`), not a points threshold. "fullført" is
  distinct-knute count.
