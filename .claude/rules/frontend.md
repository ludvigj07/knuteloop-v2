<!--
LOADING: Pulled in by apps/mobile/CLAUDE.md via @-import (Claude Code auto-loads that when
you work under apps/mobile/). The "globs" frontmatter is intent-documentation only — Claude
Code does not auto-load by glob; it's here for Cursor compatibility.
-->
---
description: Frontend rules for Expo + React Native + TypeScript. Knuteloop's brand is polish and inclusion.
globs:
  - apps/mobile/**
  - packages/shared/**
---

# Frontend Rules — Knuteloop v2

Knuteloop's competitive moat against existing russ-products is **polish and inclusion**. A laggy or generic-looking app fails the brand. Every interaction should feel intentional, snappy, and Norwegian.

This file covers Expo + React Native architecture, animation, accessibility, design system, performance, and the patterns that make the difference between "AI-generated app" and "shipped product."

---

## 1. The mental model

Knuteloop's mobile app is:

- **A feed app first** — most time spent looking at submissions, leaderboard, profile
- **A camera app second** — submitting a knute is the second-most-used flow
- **An identity app third** — russenavn, badges, points, rank are personal expression

Patterns that fail this app:
- Web-app aesthetics (boxy buttons, default fonts, no animation)
- Generic Material/iOS stock components without custom polish
- Loading spinners (use skeletons)
- Modals that block flow (use bottom sheets)
- Hard transitions (use shared-element where possible)

---

## 2. Project structure

```
apps/mobile/
├── app/                            # Expo Router file-based routes
│   ├── _layout.tsx                 # Root layout (auth provider, theme, query client)
│   ├── (auth)/
│   │   ├── _layout.tsx             # Unauthed stack (login screens)
│   │   ├── welcome.tsx
│   │   ├── select-school.tsx
│   │   ├── login.tsx
│   │   └── claim-russenavn.tsx
│   ├── (app)/
│   │   ├── _layout.tsx             # Authed tabs
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── home.tsx            # Feed
│   │   │   ├── knuter.tsx          # Catalog
│   │   │   ├── submit.tsx          # Camera/submit flow
│   │   │   ├── leaderboard.tsx
│   │   │   └── profile.tsx
│   │   ├── knute/[id].tsx
│   │   ├── user/[id].tsx
│   │   └── settings/...
│   └── (admin)/                    # Knutesjef tools
│       └── ...
├── components/
│   ├── primitives/                 # Building blocks: Button, Text, Stack, Pressable+
│   ├── feed/                       # FeedItem, FeedHeader, etc.
│   ├── knute/
│   ├── leaderboard/
│   ├── profile/
│   └── celebrations/               # Confetti, badge-unlock, rank-up
├── hooks/                          # useXxx
├── lib/
│   ├── api.ts                      # Typed fetch wrapper
│   ├── auth.ts                     # SecureStore token mgmt
│   ├── theme.ts                    # Design tokens
│   ├── animations.ts               # Shared animation primitives
│   ├── haptics.ts                  # Wrapper around expo-haptics
│   ├── analytics.ts                # Plausible event wrappers (aggregate only)
│   └── format.ts                   # Date/number formatting in Norwegian
├── assets/
│   ├── fonts/
│   ├── icons/
│   └── images/
├── app.config.ts                   # Expo config
└── eas.json                        # Build profiles
```

**Rules:**
- ONE screen per route file. If a screen exceeds 200 lines, extract child components.
- `components/primitives/` contains design-system building blocks. NEVER use raw `View`/`Text`/`TouchableOpacity` outside of primitives — always use the project's `Stack`, `Text`, `Pressable`, `Button`.
- `lib/theme.ts` is the only file that contains color/spacing/typography values. NEVER hardcode `'#1a1a1a'` or `margin: 16` anywhere else.

---

## 3. Design tokens — the only file with raw values

> **Source of truth = `apps/mobile/lib/theme.ts` + the `/knuteloop-design` skill (ADR-0017).**
> Knuteloop uses the warm neo-brutalist **"sticker"** identity: cream paper, **royal-blue**
> primary, **golden-yellow** accent, deep-navy ink; **Bricolage Grotesque** display / **Inter**
> body / **JetBrains Mono** numerals; a 2px ink border + a **hard offset shadow** as the
> signature. Russ-red is reserved for the **app icon / splash only**, not general UI.
> These live in the **`sticker` namespace** of `theme.ts` (+ the `fontFamily` map, loaded via
> `expo-font` in `app/_layout.tsx`). The block below is the older base layer, kept for the
> pre-sticker screens (feed / leaderboard / profile) until they migrate. Never hardcode raw
> values — always import from `theme.ts`.

```ts
// apps/mobile/lib/theme.ts (excerpt — see the file + the `sticker` namespace for the full set)
export const colors = {
  // Brand
  brand: {
    primary: '#C8102E',           // Russ red
    primaryDark: '#8B0918',
    accent: '#1A1A2E',            // Deep night
  },
  // Surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  // Text
  text: {
    primary: '#0A0A0A',
    secondary: '#525252',
    muted: '#A3A3A3',
    inverse: '#FFFFFF',
  },
  // Semantic
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
  // Borders
  border: '#E5E5E5',
  borderStrong: '#D4D4D4',
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const

export const typography = {
  // Body = Inter, display = Bricolage Grotesque, numerals = JetBrains Mono.
  // (In the real theme these are the `fontFamily` map — single-weight family names
  //  like 'Inter_400Regular' / 'BricolageGrotesque_800ExtraBold'.)
  fontFamily: {
    sans: 'Inter',
    display: 'BricolageGrotesque',
    mono: 'JetBrainsMono',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.7,
  },
} as const

export const animation = {
  // Durations
  fast: 150,
  base: 250,
  slow: 400,
  // Easings (use Reanimated's)
  spring: { damping: 18, stiffness: 200 },
  springGentle: { damping: 25, stiffness: 150 },
  springBouncy: { damping: 12, stiffness: 200 },
} as const

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const
```

**The dyslexia consideration:**
- Default body line-height is `1.5` (loose for prose, tight for UI labels).
- Default font weight for body is `regular` (400), but headings step up to `semibold` (600) — bold (700) is reserved for emphasis only.
- Font scale respects iOS Dynamic Type / Android font scale by default. Test at 1.3× scale before shipping any screen.
- Avoid all-caps (harder to read) — the single exception is the one golden `accent` hero CTA per screen. Use the display font (**Bricolage Grotesque**, via `<Text font="display">`) for visual hierarchy instead.

---

## 4. Primitive components

The project has a small set of typed primitives. NEVER import raw `View`, `Text`, `TouchableOpacity`. Use:

```tsx
// apps/mobile/components/primitives/Stack.tsx
type StackProps = {
  direction?: 'row' | 'column'
  gap?: keyof typeof spacing
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  padding?: keyof typeof spacing
  paddingX?: keyof typeof spacing
  paddingY?: keyof typeof spacing
  children: React.ReactNode
}
// Implements with View under the hood, but standardized API
```

```tsx
// apps/mobile/components/primitives/Text.tsx
type TextProps = {
  size?: keyof typeof typography.size
  weight?: keyof typeof typography.weight
  color?: 'primary' | 'secondary' | 'muted' | 'inverse' | string
  align?: 'left' | 'center' | 'right'
  display?: boolean   // Use display font
  children: React.ReactNode
}
```

```tsx
// apps/mobile/components/primitives/Pressable.tsx
// Wraps RN's Pressable with:
// - Built-in haptic feedback (light for tap, medium for important actions, heavy for celebrations)
// - Scale-down animation on press (0.96, springs back)
// - Disabled state styling
// - accessibilityRole, accessibilityHint props required
type PressableProps = {
  onPress: () => void
  haptic?: 'light' | 'medium' | 'heavy' | 'none'
  scale?: boolean             // default true
  accessibilityLabel: string  // REQUIRED
  accessibilityHint?: string
  accessibilityRole?: 'button' | 'link'
  children: React.ReactNode
}
```

```tsx
// apps/mobile/components/primitives/Button.tsx
type ButtonProps = {
  onPress: () => void
  label: string  // bokmål
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'base' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  accessibilityHint?: string
}
```

**Sticker design-system primitives** (ADR-0017), all exported from `components/primitives`:
- `StickerCard` — the signature surface (2px ink border + cross-platform hard offset shadow; optional `onPress` presses it flat). `tone`: surface/soft/media/primary/accent/danger.
- `StickerButton` — sticker-styled button (`variant`: primary/accent/secondary/destructive/ghost). The flat `Button` stays for pre-sticker screens.
- `Chip` (points/difficulty/folder pills), `Badge` (18+/Tekst tags), `StatTile` (stat cards), `Eyebrow` (kicker), `Toast`/`useToast` (transient feedback — replaces `Alert.alert` for non-destructive messages), `KnoteIcon` (custom knot/category glyphs).
- `Text` gained a `font` prop: `'sans' | 'display' | 'mono'`.

Every primitive must:
- Accept design tokens, never raw values
- Support dark mode (read from `useColorScheme()` and the theme)
- Include accessibility props
- Animate state transitions where it makes sense (press, focus, loading)

---

## 5. State management — the hierarchy

Use the lightest tool that solves the problem. The order:

1. **`useState`** — component-local UI state (modal open, input value, toggle).
2. **`useReducer`** — when local state has multiple related fields with transitions (form steps).
3. **TanStack Query (`@tanstack/react-query`)** — ALL server state. Lists of submissions, profile data, leaderboard. NEVER use `useEffect` + `fetch` + `useState` for server state.
4. **React Context** — app-wide UI state (current theme, current school context, auth status). KEEP IT THIN.
5. **`expo-secure-store`** — tokens.
6. **`expo-sqlite` or `MMKV`** — offline cache (rare, for explicit offline features).

**NEVER reach for Zustand/Redux/Jotai/Recoil without an ADR.** They are global state libraries; you almost certainly don't need them. Context + TanStack Query covers ~95% of needs.

**TanStack Query example:**

```tsx
// apps/mobile/hooks/useFeed.ts
export function useFeed() {
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => api.fetchFeed({ cursor: pageParam, token }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30_000, // 30 seconds
  })
}
```

Mutations always invalidate relevant queries:

```tsx
export function useApproveSubmission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.approveSubmission,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['submissions'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}
```

---

## 6. Navigation — Expo Router conventions

- File-based routing. Path is URL.
- `(group)` folders for grouping without affecting URL.
- `_layout.tsx` defines the navigator (stack, tabs).
- Use `<Link href="..." />` from `expo-router`, not `navigation.navigate()`.
- For programmatic navigation: `useRouter()` hook.

**Auth gating:**

```tsx
// apps/mobile/app/_layout.tsx
export default function RootLayout() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Slot />
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  )
}

// apps/mobile/app/(app)/_layout.tsx
export default function AppLayout() {
  const { user } = useAuth()
  if (!user) return <Redirect href="/(auth)/welcome" />
  return <Tabs>...</Tabs>
}
```

---

## 7. Animations — the polish layer

Use **React Native Reanimated v4** for performance (runs on UI thread). **Moti** is acceptable for declarative simple cases but Reanimated is the workhorse.

**Mandatory animations** (Knuteloop without these feels generic):

- **Press feedback:** every Pressable scales to 0.96 on press, springs back. Built into the Pressable primitive.
- **Tab switches:** subtle fade + tiny slide. Built into the tab navigator config.
- **Modal/sheet entry:** use `@gorhom/bottom-sheet` with spring physics, NOT default modals.
- **List item appearance:** when a new feed item appears (refresh), it fades + slides in subtly.
- **Number changes:** points, leaderboard ranks animate using `react-native-redash` interpolation (smooth count-up).
- **Success states:** submission approved → confetti (use `react-native-confetti-cannon`), haptic medium, sound (optional).
- **Rank-up:** if user passes someone on leaderboard → toast with their previous rank and new rank, animated.
- **Badge unlock:** when achievement crosses tier → modal with badge zoom-in, haptic heavy.

**Animation primitives:**

```ts
// apps/mobile/lib/animations.ts
import Animated, { withSpring, withTiming, Easing } from 'react-native-reanimated'
import { animation } from './theme'

export const springs = {
  gentle: animation.springGentle,
  base: animation.spring,
  bouncy: animation.springBouncy,
}

export const timings = {
  fast: { duration: animation.fast, easing: Easing.out(Easing.cubic) },
  base: { duration: animation.base, easing: Easing.out(Easing.cubic) },
  slow: { duration: animation.slow, easing: Easing.out(Easing.cubic) },
}
```

**Animation rules:**
- Spring for positional changes (entering, scaling, layout).
- Timing for opacity, color.
- Duration < 500ms unless intentional (celebrations are exceptions).
- Stagger lists with `entering={FadeInDown.delay(index * 50)}`.
- Respect `prefers-reduced-motion`: read with `useReducedMotion()` and use timings instead of springs, durations shorter.

---

## 8. Haptics — every important touch has feel

Use `expo-haptics`. The wrapper:

```ts
// apps/mobile/lib/haptics.ts
import * as Haptics from 'expo-haptics'

export const haptics = {
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  selection: () => Haptics.selectionAsync(),
}
```

**When to use:**
- `light` — any button press (built into Pressable primitive)
- `medium` — confirming an action (submit, approve, save)
- `heavy` — celebration (badge unlock, rank-up)
- `success` — submission approved by knutesjef
- `warning` — confirmation dialog open
- `error` — form validation failed
- `selection` — toggling, picker scroll

---

## 9. Accessibility — non-negotiable

Knuteloop's brand is inclusion. Accessibility is part of the product, not a checklist item.

**Every interactive element MUST have:**
- `accessibilityLabel` (what is this — required, in bokmål)
- `accessibilityRole` (`button`, `link`, `image`, etc.)
- `accessibilityHint` if action is non-obvious (e.g. "Holder du for å like, dobbeltrykk for å se detaljer")
- `accessibilityState` for toggles/checked items

**Color contrast:**
- Body text: WCAG AA minimum (4.5:1 against background)
- Large text/headings: AA (3:1)
- Interactive states (focus, pressed): visible contrast change, not just color shift
- Never communicate solely via color (e.g. don't use red/green alone — pair with icon/text)

**Font scale:**
- Test every screen at 1.3× and 1.5× system font scale
- Layouts must not break, scroll if needed
- NEVER set `allowFontScaling={false}` without a documented reason

**Screen reader testing:**
- Run VoiceOver (iOS) and TalkBack (Android) on every new flow
- Tab order makes sense (top to bottom, left to right)
- Modal/sheet correctly traps focus

**Reduced motion:**
- Read `useReducedMotion()` from Reanimated
- When enabled: skip non-essential animations, use shorter timings, no parallax

---

## 10. Performance

**Lists:**
- Use `FlashList` from Shopify, NOT `FlatList`. Significant perf gain on long lists.
- Provide `estimatedItemSize`.
- Memoize list item components with `React.memo` if rendering complex UI.

**Images:**
- Use `expo-image`, NOT React Native's `Image`. Caches better, faster decode.
- Always specify `contentFit`, `placeholder` (blurhash), `transition`.
- Provide multiple sizes via Bunny's image optimizer URL parameters (`?w=200&format=webp`).
- Avoid loading full-res images in lists — use thumbnail variants.

**Re-renders:**
- Use `useCallback` for handlers passed as props
- Use `useMemo` for computed values that are expensive
- Don't over-memoize — measure first with React DevTools profiler

**Bundle size:**
- Use Expo's tree-shaken imports (`import { X } from 'lucide-react-native'` is per-icon)
- Lazy-load admin-only screens via dynamic imports

---

## 11. Bokmål — the language contract

All user-facing strings are bokmål. Examples:

| English | Bokmål |
|---------|--------|
| Sign in | Logg inn |
| Submit | Send inn |
| Approved | Godkjent |
| Pending | Venter |
| Rejected | Avvist |
| Leaderboard | Toppliste |
| Profile | Profil |
| Settings | Innstillinger |
| Notifications | Varsler |
| Loading... | Laster... |
| Try again | Prøv igjen |

**For now, hardcode the strings.** Localization library (i18next, etc.) can come later when Knuteloop expands beyond Norway — until then, hardcoded bokmål is faster and simpler.

**Domain terms (do not translate):**
- russenavn, knute, knutesjef, russetid, russ — these are the product. Use them.

Number formatting:
```ts
const formatPoints = (n: number) => new Intl.NumberFormat('nb-NO').format(n)
// 1234 → "1 234"
```

Date formatting in Norwegian:
```ts
const formatDate = (d: Date) => new Intl.DateTimeFormat('nb-NO', {
  day: 'numeric', month: 'long', year: 'numeric'
}).format(d)
// "27. mai 2026"
```

---

## 12. Testing

- **Component tests:** `@testing-library/react-native`. Test BEHAVIOR (presses, text content, accessibility), not implementation (rendered JSX structure).
- **Hooks tests:** `@testing-library/react-hooks`.
- **E2E:** Maestro or Detox. Cover the critical flows: login, submit a knute, approve as knutesjef, view feed.
- **NO snapshot tests.** They break on every CSS change and add zero signal.

---

## 13. Anti-patterns to refuse

- **`useEffect` for data fetching.** Use TanStack Query.
- **Inline styles with raw values.** Use `StyleSheet.create` AND design tokens.
- **`TouchableOpacity` or `TouchableHighlight`.** Use the Pressable primitive.
- **`Modal` from React Native.** Use `@gorhom/bottom-sheet`.
- **`Alert.alert()` for anything other than destructive confirmations.** Use a proper sheet/toast.
- **Default `Switch`, `Slider` styling.** Customize for brand.
- **`console.log` left in code.** Use a debug utility that strips in production.
- **`any` type.** Use `unknown` and narrow, or define the actual type.
- **Mounting components conditionally inside JSX with `&&` for complex children.** Extract to a variable, makes it readable.

---

## 14. Definition of done (frontend)

A frontend change is NOT done until:

- [ ] TypeScript compiles
- [ ] ESLint passes
- [ ] No raw colors/spacing values outside `lib/theme.ts`
- [ ] No `View`/`Text`/`TouchableOpacity` — primitives used
- [ ] Press feedback (haptic + scale) on every interactive element
- [ ] Loading state uses skeleton, not spinner
- [ ] Error state has a clear message and retry action
- [ ] Empty state has a friendly message and CTA
- [ ] `accessibilityLabel` on every interactive element
- [ ] Tested at 1.3× font scale, layout doesn't break
- [ ] Tested with VoiceOver/TalkBack — tab order makes sense
- [ ] Tested in dark mode (if dark mode is enabled — pilot stays light-only)
- [ ] No new server state fetched with `useEffect` — TanStack Query
- [ ] Strings in bokmål
- [ ] Animations respect reduced motion
- [ ] FlashList for any list with > 20 items
- [ ] `expo-image` for any image
