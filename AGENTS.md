# AGENTS.md — Rules for AI tools other than Claude Code

This file governs AI coding tools (Codex etc.) working in this repo. Scope:
**frontend work in the mobile app** (`apps/mobile/**`). Backend, auth, and
data-layer work happens exclusively in Claude Code with its hook system and
review pipeline — do not cross that line.

If anything here conflicts with `CLAUDE.md` or `.claude/rules/*.md`, those win.
Full frontend detail: `.claude/rules/frontend.md`. Past decisions:
`docs/adr/README.md` — read the relevant ADR before changing what it covers.
Domain vocabulary: `docs/glossary.md`.

New contributor? Machine setup lives in `docs/onboarding.md`; the working
methods we expect are in `docs/ai-arbeidsmetoder.md`. Note: a human setting up
their own local dev environment (installing Postgres, creating their local
`apps/api/.env` from `.env.example`) is always fine — the hard boundaries below
restrict what AI tools may edit in the repo, not what humans do on their own
machines.

## ⏳ TEMPORARY (28 July – ~18 Aug 2026): work on `dev`, not `main`

Ludvig is away (military). `dev` is the working trunk in the meantime — it IS
the default branch now, so everything targets it automatically. Rules while
this banner is up:

- **Branch from `dev`. Open PRs into `dev`. Merge your own PR once CI is green**
  — you never wait for a human to merge. (`gh pr create` defaults to `dev`; if
  you ever pass `--base`, use `--base dev`.)
- **Never target `main`.** It is frozen for Ludvig's review; he merges
  `dev → main` when he's back.
- Everything else below (frontend-only scope, primitives, tokens, bokmål,
  tests-in-PR, calm-app) is unchanged.
- Unwind guide (for when Ludvig returns) lives in
  `docs/dev-arbeidsflyt-away.md`. Delete this banner then.

## Hard boundaries — files you may NEVER touch

- `apps/api/**` — backend (multi-tenant security lives here)
- `packages/shared/**` — shared types consumed by backend
- `apps/mobile/lib/auth*` — auth client
- `.env*` anywhere — secrets (the repo is public; never commit one)
- `.claude/**`, `CLAUDE.md`, `AGENTS.md` — agent configuration
- `docs/adr/**` — accepted architecture decisions (immutable)
- Any `package.json` / lockfile — **no new dependencies, ever.** If a feature
  needs a library, STOP and write a note for the maintainer instead.
- Git config / CI workflows

`apps/mobile/lib/api.ts` (the typed API client): additions for new screens are
OK **after the endpoint already exists in the backend**; follow the existing
fetch-wrapper patterns exactly. Never invent endpoints, never change auth or
header logic.

If a task seems to require crossing any of these lines: stop, explain why, and
wait for the maintainer.

## What you MAY do

Frontend work inside `apps/mobile/`: screens, components, hooks, styling,
layout, animation polish, copy, and component tests. Wiring new screens to
existing endpoints with TanStack Query is fine.

## Frontend rules (non-negotiable)

1. **All raw values live in `apps/mobile/lib/theme.ts`** — colors, spacing,
   radii, font sizes/weights. A hex code or pixel number anywhere else is a
   bug. The `sticker` namespace is the current design system (ADR-0017).
2. **Use the project primitives** from `components/primitives/` — `Stack`,
   `Text`, `Pressable`, `Button`, `StickerCard`, `StickerButton`, `Chip`,
   `Badge`, `StatTile`, `Toast`. Never raw `View`/`Text`/`TouchableOpacity`
   in screens. `StyleSheet.create` for styles — no inline raw values.
3. **TypeScript strict.** No `any`. `pnpm typecheck && pnpm lint && pnpm test`
   must pass from the repo root before every PR.
4. **Server state = TanStack Query.** Never `useEffect` + `fetch`. Mutations
   invalidate their queries. Don't add state libraries (no Zustand/Redux).
5. **Calm app (ADR-0023):** no sound, no confetti, no streaks, no celebration
   shows anywhere. Animation itself is welcome — the app should feel alive —
   but decorative attention effects (glints, nudges, highlights) run a
   *bounded* number of times (on appear/refresh/state change), never as
   infinite idle loops (`withRepeat(..., -1)`). Skeleton shimmer is the one
   exempt idle loop. "Alive on arrival, settled afterwards."
6. **Lists > 20 items use FlashList** (not FlatList). **Images use expo-image.**
   Loading states are skeletons (not spinners); error states get a retry
   action; empty states get a friendly bokmål message.
7. **Tests in the same PR** as the feature — `@testing-library/react-native`,
   behavior not snapshots.
8. One screen per route file; extract components past ~200 lines. No file
   over 500 lines.

## Language — Bokmål contract

- ALL user-facing strings are Norwegian bokmål. No English, no mixing.
- Domain terms stay Norwegian and untranslated: **russ, knute, knuter,
  knutesjef, russenavn, russetid, toppliste**.
- Code and comments are English.
- Numbers: `Intl.NumberFormat('nb-NO')` (1 234, not 1,234).
  Dates: `Intl.DateTimeFormat('nb-NO')` (27. mai 2026).

## Accessibility — App Store quality bar (users include 17-year-olds; the
brand IS inclusion)

- Every interactive element: `accessibilityLabel` (in bokmål) +
  `accessibilityRole`. `accessibilityHint` when the action isn't obvious.
- Text contrast: WCAG AA minimum (4.5:1 body, 3:1 large text). Never
  communicate state by color alone — pair with icon or text.
- Layouts must survive 1.3× system font scale without breaking. Never set
  `allowFontScaling={false}`.
- Respect safe areas (`useSafeAreaInsets`) on every screen edge you style.
- No all-caps headings (the founder is dyslexic; readability is a feature).
- Animations respect reduced-motion settings; durations under 500ms.

## Privacy — absolute

- NO third-party SDKs, analytics, fonts-from-CDN, or trackers. Users are
  minors; this is a legal constraint (GDPR/Datatilsynet), not a preference.
- No external network calls added to the app, full stop.

## Workflow

0. **Session start:** if the user hasn't named a task yet, offer to check the
   repo's open GitHub issues — the maintainers keep a curated queue of scoped
   tasks there (`gh issue list --state open`, or the Issues tab). Don't nag;
   one natural offer is enough.
1. Branch from `main` (`feat/<short-name>` or `design/<short-name>`).
   **Never commit to or push `main` directly.** All changes land via
   PR → CI green → squash merge.
2. Keep diffs small and single-purpose — one screen or one concern per PR.
3. Before opening a PR, run from the repo root and ensure all pass:
   `pnpm typecheck && pnpm lint && pnpm test`
4. Commit messages: conventional commits; Norwegian summaries are fine
   (e.g. `feat(mobile): dagens knute-kort på hjem`).
5. In the PR description, summarize what changed in plain language and list
   which screens to look at — review starts visually.

## Quick reference — where things live

- Design tokens: `apps/mobile/lib/theme.ts` (the ONLY file with raw values)
- Primitives: `apps/mobile/components/primitives/`
- Screens: `apps/mobile/app/*.tsx` (Expo Router, one screen per file)
- Feature components: `apps/mobile/components/<area>/` (e.g. `home/`, `knute/`)
- API client: `apps/mobile/lib/api.ts` (see boundary note above)
- Norwegian formatting helpers: use `Intl` APIs directly
- The fullscreen feed: `apps/mobile/app/feed.tsx` (dark backdrop, tokens under
  `colors.feed.*`)
