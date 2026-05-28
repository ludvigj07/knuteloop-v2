# Frontend context — apps/mobile

You are working in the **frontend** (Expo + React Native + TypeScript). Claude Code loads this file automatically when editing anything under `apps/mobile/`.

## Read this now (full rules)

@../../.claude/rules/frontend.md

## The behavioural contract

When building UI for a feature that existed in v1 (leaderboard, knute catalog, feed, profiles, badges, streak), the exact data shapes, rank titles, badge tiers, and category structure are in:

@../../docs/v1-spec.md

The five knute folders, for example, are exactly: Generelle, Dobbelknuter, Alkoholknuter, Sexknuter, Fordervett-knuter. The rank titles and badge tiers are fixed lists — pull them from the spec, don't invent.

## The five rules I most often get wrong here — burn them in

1. **No raw colors or spacing.** Everything comes from `lib/theme.ts` design tokens. A hex literal in a component file is a bug.

2. **No `View`/`Text`/`TouchableOpacity`.** Use the project primitives (`Stack`, `Text`, `Pressable`, `Button`). The `Pressable` primitive has built-in haptic + scale feedback — that's the brand.

3. **No `useEffect` + `fetch` for server data.** TanStack Query (`useQuery`/`useMutation`) for everything that comes from the API.

4. **Bokmål for every user-facing string.** No mixed Norwegian/English. Domain terms (russenavn, knute, knutesjef) stay Norwegian and are NOT translated.

5. **Accessibility props on every interactive element.** `accessibilityLabel` (bokmål) is required, not optional. Knuteloop's brand is inclusion — test at 1.3× font scale and with VoiceOver/TalkBack.

## Brand reminders

- **Polish is the moat.** Press feedback, list stagger, rank-up toast, badge-unlock modal, confetti on approval — these aren't extras, they're the product. See `frontend.md` §7.
- **Feed app first, camera second, identity third.** Optimize the feed scroll and the submit flow above all else.
- **Skeletons, not spinners. Bottom sheets, not modals. FlashList, not FlatList. expo-image, not Image.**

## Animation that's mandatory (not optional)

- Every Pressable: scale to 0.96 + haptic on press
- Submission approved: confetti + success haptic
- Leaderboard rank change: animated count-up + rank-up toast
- Badge tier unlock: zoom-in modal + heavy haptic
- All of it respects `useReducedMotion()`

## What v1 modeled that v2 keeps

- `russType`: blåruss (`blue`) / rødruss (`red`) — this IS modeled, it's a real identity field. Show it in profiles.
- Profile cards: russenavn (gated behind the "dåp" reveal), realName, bio, quote, knownFor, signatureKnot, favoriteCategory.
- The russenavn reveal gate: until the school's knutesjef flips the reveal, other students' russenavn are hidden. Build the UI to handle both states.

## Workflow reminder

- Frontend changes don't need brother's review (you can judge UI yourself) — but still run typecheck + lint.
- Definition of done: see `frontend.md` §14.
