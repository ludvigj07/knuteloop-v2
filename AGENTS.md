# AGENTS.md — Rules for AI tools other than Claude Code

This file governs AI coding tools (Codex etc.) working in this repo. Scope is
intentionally narrow: **visual design work in the mobile app only**. Backend,
auth, and data-layer work happens exclusively in Claude Code with its hook
system and human review pipeline — do not cross that line.

## Hard boundaries — files you may NEVER touch

- `apps/api/**` — backend (multi-tenant security lives here)
- `packages/shared/**` — shared types consumed by backend
- `apps/mobile/lib/api.ts` and `apps/mobile/lib/auth*` — API/auth client
- `.env*` anywhere — secrets
- `.claude/**`, `CLAUDE.md`, `AGENTS.md` — agent configuration
- `docs/adr/**` — accepted architecture decisions (immutable)
- Any `package.json` / lockfile — **no new dependencies, ever.** If a design
  needs a library, STOP and write a note for the maintainer instead.
- Git config / CI workflows

If a task seems to require touching any of these: stop, explain why, and wait.

## What you MAY do

Visual design inside `apps/mobile/`: colors, spacing, typography, layout,
component styling, screen composition, animation polish, copy tweaks.

## Design system rules (non-negotiable)

1. **All raw values live in `apps/mobile/lib/theme.ts`** — colors, spacing,
   radii, font sizes/weights. A hex code or pixel number anywhere else is a
   bug. To introduce a new color: add a named token to theme.ts, then use the
   token. Components import from theme, always.
2. **`StyleSheet.create` for styles** — no inline style objects with raw values.
3. **TypeScript strict.** No `any`. The project must pass
   `pnpm typecheck && pnpm lint` from the repo root after every change.
4. **State/data patterns are off-limits for design work:** don't convert
   TanStack Query usage to useEffect/fetch, don't add state libraries, don't
   restructure data flow. Style the components; leave the wiring alone.

## Language — Bokmål contract

- ALL user-facing strings are Norwegian bokmål. No English, no mixing.
- Domain terms stay Norwegian and untranslated: **russ, knute, knuter,
  knutesjef, russenavn, russetid, toppliste**.
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
- Animations respect reduced-motion settings; durations under 500ms except
  deliberate celebrations.

## Privacy — absolute

- NO third-party SDKs, analytics, fonts-from-CDN, or trackers. Users are
  minors; this is a legal constraint (GDPR/Datatilsynet), not a preference.
- No external network calls added to the app, full stop.

## Workflow

1. Work on a feature branch (`design/<short-name>`), never on `main`.
2. Keep diffs small and single-purpose — one screen or one concern per branch.
3. After changes, run from the repo root and ensure both pass:
   `pnpm typecheck && pnpm lint`
4. Summarize what changed and why in plain language in the final message —
   the maintainer reviews visually, so list which screens to look at.
5. Never commit directly to `main`; never push; leave commits for the
   maintainer to review and push.

## Quick reference — where things live

- Design tokens: `apps/mobile/lib/theme.ts` (the ONLY file with raw values)
- Screens: `apps/mobile/app/*.tsx` (Expo Router, one screen per file)
- Norwegian formatting helpers: use `Intl` APIs directly
- The fullscreen feed: `apps/mobile/app/feed.tsx` (dark backdrop, tokens under
  `colors.feed.*`)
