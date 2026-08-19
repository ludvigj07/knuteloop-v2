# ADR-0025: Fjern vanskelighetsgrad fra produktet

**Status:** Accepted
**Date:** 2026-08-14
**Deciders:** Ludvig (+ Claude as advisor)

## Context

Every knute has carried a `difficulty` field (`Lett | Medium | Hard | Valgfri`) since v1,
shown as a colored chip in the catalog, the library, the submit flow and the admin editor.
In practice it never carried information of its own: the seed derived it mechanically from
points (`< 20 = Lett`, `20–45 = Medium`, `> 45 = Hard`), the library source (the Stavanger
knutebok) never had it, and no query, sort or game rule ever read it. Points already say
how hard a knute is — that is what points ARE.

Two fields claiming to express the same thing means they can disagree (a 5-point "Hard",
a 50-point "Lett"), and every extra chip competes for space on the small knute rows.

## Decision

Remove `difficulty` entirely: the `knuter.difficulty` and `library_knuter.difficulty`
columns (migration 0022), the API input/output fields, the mobile UI (chips, the
"Vanskelighet" meta cell, the picker in the knute editor) and the seed derivation.
Points are the single difficulty signal.

## Alternatives considered

- **Keep it but hide it in the UI.** Dead schema that every new endpoint/test/seed must
  keep satisfying. Rejected — carrying a column nobody reads is pure cost.
- **Make it real (curated per knute, decoupled from points).** Nobody asked for it, and
  the knutesjef already tunes challenge via points. Rejected as speculative work.
- **Derive it at read time for display only.** Still two vocabularies for one concept.
  Rejected — if a label is ever wanted later, it can be computed client-side from points.

## Consequences

### Good
- One source of truth for "how hard": points.
- Smaller knute rows (one chip less), simpler admin form (one field less).
- Less fixture noise in every test that inserts knuter.

### Bad / trade-offs accepted
- Irreversible: the stored values are dropped. Acceptable — they were derived from
  points to begin with, so nothing is lost that cannot be recomputed.
- If a future feature wants difficulty as an independent axis, it must re-add the
  column via a new ADR.

### Neutral
- ADR-0014's field list ("import copies title/points/difficulty/…") is reduced
  accordingly; the import=copy model itself is unchanged.
