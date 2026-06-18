# ADR-0015: Age verification + per-knute age gating

**Status:** Accepted
**Date:** 2026-06-14
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Knuteloop is used by russ who may be **17 (minors)** as well as 18–19. The knute library
(ADR-0014) contains content that is fine for everyone alongside content that is **only appropriate
for adults** (e.g. alcohol- and sex-themed knuter). A blanket "18+ app" gate would exclude the
17-year-old russ entirely — too blunt. Instead we **age-gate per knute**: minors see/do the
all-ages content, and the adult-only content unlocks for verified 18+.

The legal specifics (Norwegian law — which differs from US assumptions; e.g. age limits for
piercing etc.) are being handled by **a lawyer + a GDPR/personvern specialist** (Ludvig's contacts),
not guessed here. This ADR records the **technical/data model** for age gating, which those
specifics will plug into.

Two separate gatekeepers to keep distinct:
- **Norwegian law / Datatilsynet** — the lawyer + GDPR specialist own this.
- **Apple App Store / Google Play** — a separate, global gate. Legal-in-Norway ≠ approved by Apple.
  Their guidelines on gamified alcohol/sexual content apply regardless of local law, so the shipped
  content + age gating must be checked against the store guidelines separately.

## Decision

### 1. Verified age on the user — from Vipps, not self-declaration

- `users` gains **`is_adult boolean not null default false`**. It is set from **Vipps-verified age**
  when auth lands (Vipps/BankID gives a real, verified age — not "tick that you're 18"). Until then
  it defaults to **false (treated as a minor — the safe default)**. Dev seed sets it explicitly.
- Self-declared age is **not** acceptable for the adult gate — verification is what makes the gate
  defensible to a lawyer and to Apple.

### 2. Per-knute minimum age

- `knuter` (and `library_knuter`) gain **`min_age smallint not null default 17`** — the minimum age
  to see/submit that knute. All-ages content = `17` (everyone); adult-only = `18`.
- A user may see/submit a knute only if `min_age <= 17` OR `is_adult = true`. Adult-only knuter are
  hidden (and un-submittable) for non-verified-adults — both in the catalog and the feed.

### 3. Orthogonal to evidence type

`min_age` (who may see it) is independent of `evidence_type` (`'media' | 'text'`, ADR-0014). A knute
can be 18+ **and** text-only (most sex-knuter), or all-ages **and** media (most fun knuter), etc.

### 4. Library content carries both flags

`library_knuter` ships with `min_age` + `evidence_type` set by the Knuteloop curator. On import the
school's copy inherits both; schools cannot relax `evidence_type` (ADR-0014) and should not be able
to lower `min_age` below the library value (legal floor).

## Alternatives considered

- **Blanket 18+ app.** Rejected — excludes the 17-year-old russ, who are a real part of the user base.
- **Self-declared age.** Rejected — not verifiable, indefensible to a lawyer/Apple. Vipps gives a
  real verified age, so use it.
- **Rely only on App Store age rating (17+).** Rejected — even Apple's highest rating does not permit
  apps that *gamify* sexual content or excessive alcohol, so the rating alone doesn't solve it; the
  per-knute gate + curation does the real work.

## Consequences

### Good
- 17-year-olds keep the app for all-ages content; adult content unlocks only for verified adults.
- The gate is real (Vipps-verified), so it stands up legally and to store review.
- Clean, orthogonal flags (`min_age` + `evidence_type`) the lawyer/GDPR specialist can reason about.

### Bad / trade-offs accepted
- Depends on Vipps verified-age in the auth epic; until then `is_adult` is a safe-default stub.
- Content filtering must be applied consistently (catalog, feed, submit) — easy to miss a surface.
- Curation + the lawyer/store review still gate WHICH adult content ships at all (this ADR only
  governs HOW it's gated, not whether a given knute is allowed).

### Neutral
- Extends ADR-0014 (does not supersede it). The library/folder model there stands; this adds the
  age dimension.

## Open questions

- Exact Vipps age-verification integration (auth epic).
- Whether some content is excluded entirely (curation) vs merely 18+-gated — a product + legal call
  per the lawyer/GDPR review.
