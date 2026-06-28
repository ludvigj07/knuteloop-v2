# ADR-0018: Folders as the primary browse axis ("Spotify for knuter")

**Status:** Accepted
**Date:** 2026-06-28
**Deciders:** Ludvig (+ Claude as advisor)

## Context

ADR-0014 introduced per-school folders (`knute_folders`) + the import-as-copy library, and
*planned* (§2) to drop the fixed 5-value `knuter.category` enum from ADR-0013. In practice we
**kept** `category` — the profile "category rings" (`routes/me.ts`) and the badge engine still
read it — and the library **single-import auto-filed** each copy into a folder named after its
`suggested_folder`.

Two questions were still unresolved in the built product:

1. What axis do people actually browse by — the fixed 5 categories, or the school's own folders?
2. What does the library **＋** do — auto-archive by theme, or let the knutesjef choose?

The product vision is **"Spotify for knuter"**: the library is the catalog, the school's folders
are the playlists, and **＋ is "add to playlist."**

## Decision

1. **Folders (`knute_folders`) are THE primary browse axis** — for the knutesjef (Knuteboka) and
   for students (the "Knuter" tab now leads with folder chips: "Alle" + the school's folders).
   There is **no fixed-category menu** on the student side.

2. **`knuter.category` is retained behind the scenes, not dropped** (refines ADR-0014 §2). It is
   populated on import (mapped from `suggested_folder`) and read **only** by the legacy profile
   category rings (`routes/me.ts`) + the badge engine. It is never surfaced as a student-facing
   filter. Deleting it is deferred until the profile rings are redesigned for dynamic folders
   (ADR-0014 open question).

3. **Library ＋ = "add to playlist."** Single import (`POST /api/library/imports`) takes
   `folderIds[]` — the knutesjef picks which of their own folders the copy lands in (or none →
   catalog-only). It **no longer auto-files** by `suggested_folder`. Re-importing is **idempotent**:
   the existing copy is reused and the call just adds the newly-chosen folder memberships (never a
   409). This refines ADR-0014 §3 **for single import**.

4. **Pack import (onboarding) is unchanged.** `importLibraryPack` still bulk-imports and
   auto-creates a theme folder per `suggested_folder`, so "import the starter pack → organized
   folders in seconds" still holds (ADR-0014 §3).

## Alternatives considered

- **Keep auto-theme archiving on single import.** Rejected — it imposes the library's themes on the
  school instead of the school's own organization; "add to playlist" is the product metaphor.
- **Drop `knuter.category` now (as ADR-0014 §2 planned).** Rejected for now — the profile rings +
  badges still read it, and redesigning those is separate work. Keep it invisible; delete later.
- **Surface the 5 categories to students alongside folders.** Rejected — two competing browse axes
  is confusing. Folders win; categories go invisible.

## Consequences

### Good
- One coherent mental model end to end: catalog → folders (playlists) → ＋.
- Schools fully own their organization; the library never imposes its themes on single imports.
- Idempotent import means ＋ is safe to tap repeatedly and can add a knute to more folders later.

### Bad / trade-offs accepted
- `knuter.category` lingers as a behind-the-scenes field with no UI — known debt until the profile
  rings are redesigned (tracked in ADR-0014 open questions).
- Two import code paths with different folder behaviour (single = chosen, pack = auto) — documented
  at the top of `apps/api/src/lib/library-import.ts`.

### Neutral
- **Refines (does not supersede)** ADR-0013 (category enum) and ADR-0014 (library + folders). Both
  stand; this clarifies the browse axis + the import UX.

## Open questions

- When the profile rings move to dynamic folders, `knuter.category` can finally be dropped
  (the ADR-0014 migration).
- Whether already-imported knuter should get an entry point to "add to more folders" from the
  bibliotek (the backend is idempotent and ready; the UI currently opens the picker only for
  not-yet-imported knuter).
