# ADR-0023: Calm app — no sound, no confetti, no streak

**Status:** Accepted
**Date:** 2026-07-24
**Deciders:** Ludvig (+ Claude as advisor)

## Context

V1 had a "game show" layer: confetti cannon on approval, a streak with daily bonus
points, rank-up toasts, badge-unlock modals, and (planned) sound effects. The v2
frontend rules made this mandatory (`frontend.md` §7 "mandatory animations"), and a
streak display was already built (`apps/api/src/lib/streak.ts` + the profile screen).

Since then the brand has sharpened: the sticker design system (ADR-0017) and the
"Spotify for knuter" direction (ADR-0018) point toward a calm, editorial, grown-up
product — not Duolingo. A streak is also a pressure mechanic ("don't lose your
day!") aimed at users who are partly 17 years old, which sits badly with the
inclusion brand and the general Datatilsynet-mindedness of the product.

Ludvig decided this explicitly in chat on 2026-07-24.

## Decision

1. **No sound** in v2. Ever.
2. **No confetti** or particle/explosion effects. `react-native-confetti-cannon`
   never enters the dependency tree.
3. **Streak is removed entirely**: the existing code (`apps/api/src/lib/streak.ts`,
   the profile display) is deleted, and the v1-spec §2 bonus-points mechanic is
   never built. (The Europe/Oslo day-key helper is kept — moved to a neutral
   module — because "dagens knute" needs it.)
4. **No unlock shows**: no rank-up toasts, no badge modal with zoom. Achievements
   and titles render as calm, stationary content users discover.
5. **Badges are redesigned before being built** — in a dedicated working session
   with Ludvig, "quite different from v1". Do not build them autonomously.
6. **Kept:** haptics, press scale (0.96), skeletons, smooth transitions, list
   stagger — the quiet polish. Rank titles and dagens knute stay, as calm elements.

## Alternatives considered

- **Keep the v1 layer:** it shipped with v1's validated season (68% WoW retention).
  Rejected: the retention can't be attributed to confetti/streak specifically, the
  expression reads childish against the current brand, and streak pressure on
  minors is the wrong signal.
- **Drop only sound:** smallest cut. Rejected: confetti, streak and unlock shows
  are the same category — keeping the rest still yields the game-show feel.
- **A/B-test the celebration layer:** Rejected: solo founder, no capacity, and
  user-identifying experiment analytics are ruled out anyway (privacy contract).

## Consequences

### Good
- Simpler codebase: streak logic and celebration components go away; one fewer
  dependency that never gets added.
- Consistent, grown-up product expression in line with ADR-0017/0018.
- Less engagement pressure on (partly minor) users.

### Bad / trade-offs accepted
- We give up whatever (unmeasured) retention effect streaks/celebrations had.
- Approval feels less "festive" — now carried by a success haptic + calm
  confirmation state.

### Neutral
- `frontend.md` §7, `apps/mobile/CLAUDE.md` and `docs/architecture.md` are updated
  in the same PR as this ADR.
- `docs/v1-spec.md` §2/§12 get **[V2 SUPERSEDES → ADR-0023]** flags.

## Open questions

- The badge redesign (the joint session): form, content, presentation.
