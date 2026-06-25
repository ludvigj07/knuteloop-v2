# Knuteloop Design System

A mobile-first design system for **Knuteloop** — an app that digitizes the Norwegian *russ* graduation tradition of **knuter** (challenges/dares). Vg3 students complete a knute, upload a photo as proof, and a **knutesjef** (challenge chief) approves it with one tap. Points, streaks, badges, a leaderboard (toppliste) and a social feed turn russetid into a friendly competition.

This system captures the brand as realized in the live v1 pilot and projects it onto the production **v2** app (native iOS + Android, EU-hosted, App Store bound).

> **Brand in one line:** warm, bold, unmistakably Norwegian — die-cut **stickers** on cream paper, royal blue + golden yellow, set in Bricolage Grotesque. Playful but legible (dyslexia-aware), inclusive, and snappy.

---

## Sources

This system was built by reading two repositories the founder provided. Explore them for deeper context — the v2 repo in particular contains detailed specs for features not yet built.

- **`github.com/ludvigj07/knuteloop.no`** — the live **v1 pilot** (Vite + React PWA). Source of the realized visual language: `frontend/index.css` (tokens), `frontend/App.css`, components, and `backend/src/data/*` (knuter, badges, folders, leaderboard rules, prototype seed data). The pilot validated the product: 100% activation, 1917 submissions, 68% W/W retention at one school.
- **`github.com/ludvigj07/knuteloop-v2`** — the **v2 production rebuild** (Expo / React Native monorepo + Hono/Postgres backend). Currently a documentation + spec system, not yet built UI. Key references used here:
  - `.claude/rules/frontend.md` — the aspirational v2 design-token spec, animation/haptics/a11y rules.
  - `docs/glossary.md` — russ vocabulary (russ, russenavn, knute, knutesjef, toppliste…).
  - `docs/v1-spec.md` — the behavioural contract: scoring, streak bonuses, rank titles, badges, knute folders.

**Direction note:** v2's `frontend.md` proposed a russ-red + Instrument Serif look written *before* any UI existed. Per the founder's decision, this system instead **evolves the live v1 "sticker" identity** (cream / royal blue / golden yellow, Bricolage Grotesque, hard offset shadows). Russ-red + Norwegian navy are kept for the **app icon and splash only**.

---

## Content fundamentals

**Language:** All user-facing copy is **Norwegian Bokmål**. Domain terms are never translated — *russ, russenavn, knute, knutesjef, knutemappe, toppliste, russetid, gullknute*. Code/identifiers stay English; UI strings stay Bokmål.

**Voice:** Direct, warm, a little cheeky — like a friend hyping you up, never a corporate app. Short sentences. Action-first.

**Person:** Address the user as **du / deg** ("Send inn", "Gjør den", "Du mangler 15 poeng til 2. plass"). The app speaks *to* the russ.

**Casing:** Sentence case for body and most headings. Display headlines use Bricolage and may be set tight and large. The loud hero CTA button (`accent`) is the **one** place ALL-CAPS appears — sparingly. Avoid all-caps in running text (dyslexia consideration).

**Tone examples (from the product):**
- Buttons: "Send inn knute", "Kom i gang", "Godkjenn", "Gjør den", "Inn i appen"
- Status: "Godkjent" · "Venter" · "Avvist" · "Tilgjengelig"
- Hype copy: "Full fart, full oversikt, aldri lav energi.", "Russetid på loop"
- Rank titles ladder by leaderboard position: *O' Store Knutemester → Knutemester → Knutebaron → … → Knutekatastrofen* (see `LeaderRow.getLeaderboardTitle`).

**Numbers & dates:** Norwegian formatting — `Intl.NumberFormat('nb-NO')` → `1 245` (space thousands); dates `27. mai 2026`. Numerals are set in JetBrains Mono.

**Emoji:** Minimal / avoided in v2. Use the **custom knot glyphs** + a clean Lucide-style line-icon set instead. (v1 used a few emoji as profile/category icons; v2 moves away from them.)

---

## Visual foundations

**Palette** — warm and high-contrast (see the Colors cards):
- **Paper** `hsl(48 60% 96%)` — the cream background. The app is never on pure white at the page level; cards are white *on* cream.
- **Ink** `hsl(220 50% 12%)` — deep navy, used for text **and** the 2px sticker borders.
- **Primary** royal blue `hsl(222 75% 28%)` — structure, primary CTAs, active states, key panels.
- **Accent** golden yellow `hsl(46 100% 58%)` — the hero CTA, highlights, streaks, "you" markers. Loud; use once or twice per screen.
- **Status:** success/Godkjent green, warning/Venter amber, danger/Avvist red. Never communicate by color alone — always pair with a label or icon.
- **Brand mark only:** russ-red `#C8102E` + navy `#1A1A2E` (icon, splash, celebration backdrop). Not for general UI.
- **Tier metals:** bronze / sølv / gull / diamant gradients for achievement badges.

**Typography:**
- **Display / headings — Bricolage Grotesque** (700/800), tracking `-0.03em`, leading ~`0.98`. Big, condensed personality.
- **Body / UI — Inter** (400/500/600), leading `1.5` for readability.
- **Numerals — JetBrains Mono** (points, streaks, ranks, times).
- Fluid `clamp()` scale, `--text-xs … --text-4xl`. Mobile minimum body 16px. Headings step to semibold; bold reserved for emphasis (dyslexia-aware).

**The sticker principle (the signature):** Surfaces are die-cut stickers — a **2px ink border** + a **hard, solid offset shadow** (`4px 4px 0`, no blur) on warm paper. The `.sticker` utility (and `interactive` components) **lift toward the cursor on hover** (`translate(-2px,-2px)`, shadow grows to `6px 6px`) and **press flat on active** (`translate(2px,2px)`, shadow collapses to 0). This tactile feel *is* the brand. Soft blurred shadows are used only rarely (sheets/popovers over photos).

**Shape & layout:** Generous rounded corners (`--radius-sm` ~14px → `--radius-xl` ~26px; pills at `--radius-full`). 4px spacing scale. Mobile-first: 44–52px touch targets, bottom tab bar, full-bleed scrolling content, sticky headers. Photos are presented in bordered rounded frames; in this kit they're hatched placeholders (no real user photos).

**Backgrounds:** Flat cream, occasionally with very soft radial accent washes behind hero/onboarding. No heavy gradients in-app (gradients live on the icon/splash and tier metals). No textures beyond the sticker shadow language.

**Motion (restrained):** Snappy, purposeful — `--dur-fast/base/slow` (120/180/300ms) with an ease-out curve; springy `--ease-spring` for the few celebratory moments. The sticker hover/press is the workhorse micro-interaction. Sheets slide up. Celebrations (badge unlock, rank-up, approval) get confetti + a zoom-in medallion — used sparingly. All motion respects `prefers-reduced-motion`.

**States:** Hover = lift; press = flatten + slight scale; focus = 2px yellow outline (offset). Disabled = 50% opacity, no shadow. Selected = accent-tinted fill + ink border.

---

## Iconography

Two layers, no emoji:

1. **Custom knot glyphs** — `KnoteIcon` renders Knuteloop's own hand-drawn line glyphs (lifted from the v1 source): `knute` (the brand infinity-loop knot), and one per challenge folder — `generelle`, `dobbel`, `alkohol`, `sex`, `fordervett`. Stroke `currentColor`. These represent knuter and categories throughout the app. The brand loop also stands alone as `assets/knot-mark.svg` and inside `KnoteLogo`.
2. **Clean UI icon set** — a self-contained **Lucide-style** line set (`ui_kits/knuteloop-app/icons.jsx`, `window.KNL_Icon`): home, grid, camera, trophy, user, check, x, bell, plus, search, chevrons, settings, share, heart, message, star, mapPin, shield, image, arrows, etc. 24×24, 2px round stroke — matches Bricolage/Inter's friendly weight. For production RN, use `lucide-react-native` with the same names.

Other assets: `assets/app-icon.png` (the russelue + flag + loop mark), `assets/icons/streak-flame.svg` (the gradient streak flame, used for streak counts).

> **Substitution flag:** Fonts load from **Google Fonts** (Bricolage Grotesque, Inter, JetBrains Mono) per the founder's OK — no licensed font files are bundled. The UI icon set substitutes **Lucide-equivalent** glyphs (MIT) rather than a project icon font (v1 had none). Swap in real licensed fonts / `lucide-react-native` for production.

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link. `@import`s the token + base files below.
- `readme.md` — this guide. `SKILL.md` — Agent-Skills wrapper.

**`tokens/`** — `fonts.css` (Google Fonts), `colors.css`, `typography.css`, `spacing.css` (spacing/radius/shadow/motion), `base.css` (element defaults + `.sticker`, `.eyebrow`, `.font-display`).

**`components/`** — reusable React primitives (each `Name.jsx` + `Name.d.ts` + `Name.prompt.md`; mounted from `window.KnuteloopDesignSystem_89dd9e`):
- `brand/` — **KnoteIcon** (knot/category glyphs), **KnoteLogo** (lockup).
- `core/` — **Button**, **Chip**, **StickerCard**, **Avatar**, **StatTile**, **ProgressBar**.
- `knuter/` — **KnuteCard** (challenge card), **LeaderRow** (+ `getLeaderboardTitle`), **BadgeMedallion** (tiered achievement).

**`guidelines/`** — foundation specimen cards shown in the Design System tab (Colors, Type, Spacing, Brand).

**`ui_kits/knuteloop-app/`** — the interactive mobile-app recreation: `index.html` (phone shell + tab bar + flow), `data.js` (Bokmål mock data), `icons.jsx` (UI icon set), `screens-main.jsx` (Hjem feed, Knuter, Toppliste, Profil), `screens-flow.jsx` (Onboarding/Vipps/russenavn, Send inn, Knutesjef-kø, Celebration), `app.jsx` (shell). Demonstrates the full flow: onboarding → feed → submit → approval → celebration, with a feed-layout variant toggle.

**`assets/`** — `app-icon.png`, `knot-mark.svg`, `icons/streak-flame.svg`.

---

## Using this system

- Link `styles.css` and use the CSS custom properties — never hardcode hex/spacing.
- Mount components via the namespace: `const { Button, KnuteCard } = window.KnuteloopDesignSystem_89dd9e`.
- Keep copy in Bokmål; keep the sticker hover/press feel on anything tappable; reserve the yellow `accent` for one hero action per screen.
- For deeper feature behaviour (scoring, streak bonuses, badge triggers, folders), read `docs/v1-spec.md` in the v2 repo.
