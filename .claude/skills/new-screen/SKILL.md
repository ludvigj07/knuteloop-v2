---
name: new-screen
description: Recipe for adding a mobile screen the Knuteloop way — sticker design system, primitives, TanStack Query, FlashList, accessibility, bokmål. Invoke with the screen's purpose, e.g. `/new-screen innstillinger — brukerens egne innstillinger`.
---

# /new-screen <what the screen is>

Step-by-step recipe for a new Expo Router screen. **Exemplar:
[apps/mobile/app/leaderboard.tsx]** — a complete sticker-design screen with list,
skeletons, stagger, reduced-motion, a11y. When unsure, copy its shape.

Design questions (layout, tone, which components)? Load the `/knuteloop-design`
skill FIRST — it has the full sticker design system.

## 0. Before writing code

- The frontend rules load automatically when you touch `apps/mobile/**`. Honor them.
- **The route structure is FLAT:** screens live directly in `apps/mobile/app/`
  (`feed.tsx`, `leaderboard.tsx`, `profile.tsx`, dynamic: `knute/[id].tsx`) with
  knutesjef tools under `app/admin/`. The `(auth)/(app)/(tabs)` structure in older
  docs is aspirational — do NOT introduce it without asking.
- Tab screens render `<AppTabBar />` from `components/AppTabBar` themselves.
- New npm package, new design pattern outside the sticker system, or anything that
  needs a backend change → STOP and ask (backend → `/new-endpoint`).

## 1. The screen skeleton

```tsx
import { useCallback } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list'
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated'
import { useQuery } from '@tanstack/react-query'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { AppTabBar } from '../components/AppTabBar'
import { Skeleton, StickerButton, StickerCard, Text } from '../components/primitives'
import { fetchMyThing, type MyThing } from '../lib/api'
import { fontSize, size, spacing, sticker } from '../lib/theme'

export default function MyScreen() {
  const reducedMotion = useReducedMotion()
  const { data, isPending, isError, refetch, isRefetching } = useQuery({
    queryKey: ['my-thing'],
    queryFn: fetchMyThing,
  })
  // ...
}
```

**Non-negotiables:**

- **Server data via TanStack Query** (`useQuery`/`useInfiniteQuery`/`useMutation`) with
  the fetch function in `lib/api.ts`. NEVER `useEffect` + `fetch`. Mutations invalidate
  every affected queryKey.
- **Primitives, not raw RN:** `Text`/`Pressable`/`StickerCard`/`StickerButton`/`Chip`/
  `Badge`/`StatTile`/`Toast` from `components/primitives`. Raw `View` only as a plain
  layout box; NEVER raw RN `Text` or `TouchableOpacity`.
- **Tokens only:** every color/spacing/size from `lib/theme.ts` (`sticker` namespace
  for sticker screens). A hex literal or `margin: 16` in the screen file is a bug.
- **Lists:** `FlashList` with `estimatedItemSize` + memoized row component. Stagger
  only the first screenful (`FadeInDown.delay(...)`, capped — see the exemplar's
  `STAGGER_MAX_STEPS`) and skip animation when `useReducedMotion()` is true.
- **Images:** `expo-image` with `contentFit` + `transition`, never RN `Image`.

## 2. The three states every screen needs

1. **Loading:** `Skeleton` primitives mirroring the loaded layout — never a spinner.
2. **Error:** short bokmål message + `StickerButton` with «Prøv igjen» → `refetch()`.
3. **Empty:** friendly bokmål message + a CTA that leads somewhere useful.

Pull-to-refresh on scrollable screens: `RefreshControl` wired to `refetch`/`isRefetching`.

## 3. Language and formatting

- **Every user-facing string in bokmål.** Domain terms (knute, russenavn, knutesjef)
  stay Norwegian. No English leaks — check button labels, a11y labels, error texts.
- Numbers/dates via `lib/format.ts` (`nb-NO`: `1 234`, `27. mai 2026`).

## 4. Accessibility (the brand is inclusion)

- `accessibilityLabel` (bokmål) on EVERY interactive element; `accessibilityRole`;
  `accessibilityHint` where the action is non-obvious; `accessibilityState` on toggles.
- Never communicate by color alone — pair with icon/text (see the exemplar's medal
  comment).
- Test at 1.3× font scale: layout must wrap/scroll, not truncate. No
  `allowFontScaling={false}` without a documented reason.

## 5. Definition of done

- [ ] `pnpm --filter @knuteloop/mobile typecheck` + `lint` ✅
- [ ] Loading = skeleton, error = melding + «Prøv igjen», empty = melding + CTA
- [ ] Haptic + scale press feedback (built into the `Pressable`/button primitives)
- [ ] Stagger/animations respect `useReducedMotion()`
- [ ] All strings bokmål; a11y labels on everything interactive
- [ ] Checked at 1.3× font scale
- [ ] Screen file ≤ ~200 lines — extract child components when it grows
- [ ] Component tests for behavior (`@testing-library/react-native`) — no snapshots

Frontend changes don't need brother's review (Ludvig judges UI himself), but the PR
still needs green typecheck + lint, and Ludvig should SEE the screen (run the app or
screenshots) before merge.
