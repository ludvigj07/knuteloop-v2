# ADR-0017: The "sticker" design system (supersedes frontend.md §3 token proposal)

**Status:** Accepted
**Date:** 2026-06-27
**Deciders:** Ludvig (+ Claude as advisor)

## Context

`.claude/rules/frontend.md` §3 proposed a v2 visual language — **russ-red `#C8102E`
primary + Instrument Serif display + soft black drop shadows** — written *before any UI
existed*. As real screens shipped, `apps/mobile/lib/theme.ts` had already drifted away from
that proposal (navy ink, warm cream canvases, no Instrument Serif).

In June 2026 the founder imported a full design system as the `/knuteloop-design` skill
(commit `bffe7c9`, PR #24). It captures the **live v1 "sticker" identity** and projects it
onto v2. This created a three-way contradiction between (a) frontend.md §3, (b) the actual
`theme.ts`, and (c) the design skill. We needed one source of truth before rebuilding the
knutebibliotek and the rest of the knutesjef (admin) surface.

## Decision

Adopt the **"sticker" design system** as the brand for Knuteloop v2's UI, sourced from the
`/knuteloop-design` skill and implemented in `apps/mobile/lib/theme.ts` under a `sticker`
namespace (layered additively on top of the existing tokens):

- **Palette:** cream paper background, **royal-blue** primary, **golden-yellow** accent,
  deep-navy **ink** (text + borders). Russ-red + navy are reserved for the **app icon /
  splash only**, never general UI.
- **Type:** **Bricolage Grotesque** (display), **Inter** (body/UI), **JetBrains Mono**
  (numerals), loaded app-wide via `expo-font` in `app/_layout.tsx`.
- **Signature:** a 2px ink border + a **hard offset shadow** (solid ink, no blur) that
  presses flat on tap — implemented cross-platform by `StickerCard` (an offset ink backing
  View, since Android `elevation` can't render a directional hard shadow).
- **Primitives:** `StickerCard`, `StickerButton`, `Chip`, `Badge`, `StatTile`, `Eyebrow`,
  `Toast`, `KnoteIcon`, plus a `font` prop on `Text`.

**Rollout scope (per founder):** apply the sticker look to the **admin / knutesjef surface
first** (panel, knutebibliotek, Knuteboka + folders, create/edit knute). The pre-sticker
screens (feed, leaderboard, profile, tab bar) keep the older base tokens for now; promotion
to app-wide is a later token swap, not a rewrite. New deps: `expo-font`,
`@expo-google-fonts/*`, `@shopify/flash-list`, `@gorhom/bottom-sheet`, `react-native-svg`,
`lucide-react-native`.

This **supersedes the frontend.md §3 token proposal** (russ-red primary / Instrument Serif /
soft shadows). frontend.md §3–§4 were reconciled to point at `theme.ts` + this design system
as the source of truth.

## Alternatives considered

- **Keep the frontend.md §3 proposal (russ-red + Instrument Serif).** Rejected: it was
  speculative, never realized, and contradicts both the shipped `theme.ts` and the founder's
  decision to evolve the validated v1 sticker identity.
- **Migrate the whole app to sticker in one pass.** Rejected for now: large, visually
  breaking diff across every already-shipped screen, hard for the founder to verify in one
  review. Scoped-first contains the blast radius and is reversible; the design layers cleanly
  so app-wide promotion later is a token swap.
- **Custom icon font instead of `react-native-svg` glyphs + lucide.** Rejected: v1 had no
  icon font; SVG glyphs (KnoteIcon) + lucide-react-native are MIT, tree-shakeable, and match
  the friendly line weight.

## Consequences

### Good
- One source of truth (`theme.ts` + the skill); the stale, contradictory docs are fixed.
- The brand is unmistakably Knuteloop (validated v1 identity), not generic.
- Additive tokens + new primitives mean the rest of the app can adopt sticker incrementally.

### Bad / trade-offs accepted
- A temporary **two-look app**: cream-sticker admin vs the cool-flat base screens, until the
  rest migrates.
- Some token duplication (`sticker` namespace alongside the legacy `colors`/`radius`/`shadows`)
  until an app-wide migration.
- New native deps (fonts, FlashList, bottom-sheet, svg) require a fresh dev/EAS build to test
  on device.

### Neutral
- `font` is now an explicit prop on `Text`; headings use `font="display"`.

## Open questions

- When do the consumer-facing screens (feed/leaderboard/profile/tab bar) migrate to sticker,
  and does that warrant promoting the `sticker` namespace to the primary token set (folding the
  legacy layer in)?
