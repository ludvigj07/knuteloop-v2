# Knuteloop V1 — Behavioural Specification

> **This is the contract.** It was extracted by reading the live V1 source
> (`ludvigj07/knuteloop.no`, locally at `C:\development\repo\knuteloop.no`:
> `index.mjs` + `backend/src/data/*` + `backend/data/app-db.json` + `frontend/`).
> When building V2 backend, implement against THIS, not against memory or guesswork.
> Where V1 has a bug or a single-school assumption, it is flagged inline as **[V1 BUG]**.
>
> Numbers, thresholds, and rules here are authoritative. Where V2 deliberately
> **supersedes** V1, it is flagged **[V2 SUPERSEDES]** with a pointer to the ADR.
>
> Extracted 2026-06-14 from the V1 source.

---

## 1. Scoring

- A knute has a configured `points` value (the **base points**).
- On submission, V1 stores `basePoints = max(0, points)` and computes
  `points = basePoints + streakBonusPoints` on the submission row.
- **`submission.points` IS stored** (base + streak bonus), recomputed by a startup
  migration when base points or streak data change.
  - **[V2 SUPERSEDES]** V2 does **not** store `submission.points`. Compute it from
    `basePoints + streakBonusPoints` at read-time or via a generated column — V1's
    "knot points changed → rewrite every submission" hack is banned (see `apps/api/CLAUDE.md`).

## 2. Streak + daily bonus

Source: `index.mjs` (constants ~L167–181, bonus calc ~L1155–1166, streak calc ~L1369–1381).

- **Timezone:** `STREAK_TIME_ZONE = 'Europe/Oslo'`. Day-key = Oslo date `YYYY-MM-DD`.
- **Daily bonus cap:** `STREAK_DAILY_BONUS_CAP = 6` points max bonus per submission.
- **Bonus tiers** (by current streak length in consecutive qualified days):

  | Streak days | Bonus % of base points |
  |---|---|
  | 1–2 | 0% |
  | 3–4 | 5% |
  | 5–7 | 10% |
  | 8–13 | 15% |
  | 14+ | 20% |

- **Bonus formula:** `bonus = min(6, max(0, floor(basePoints * percent)))`.
- **Streak reset:** the current streak is the run of consecutive qualified day-keys
  ending today; a skipped day resets it. A day "qualifies" when the user has an
  approved submission that Oslo day.

## 3. Daily knute ("dagens knute")

Source: `backend/src/data/appHelpers.js` (`buildDailyKnot`, `buildDaySeed`).

- Deterministic pick: sort knuter by `id` then `title` (nb collation), then
  `index = daySeed % knuter.length`, where `daySeed = Number("YYYYMMDD")`.
- **[V1 BUG]** `buildDaySeed` uses the **host/browser local date**, not Oslo. V2 must
  compute the day-key in **Europe/Oslo** (consistent with the streak day-key).

## 4. Gold knute (gullknute)

Source: `backend/src/data/badgeSystem.js` (`GOLD_KNOT_POINTS = 30`, `isGoldKnot`).

- **V1 rule:** `isGoldKnot(knot) = (knot.points ?? 0) >= 30`. A **points threshold**, not a flag.
- **[V2 SUPERSEDES]** V2 models a gullknute as an explicit **`knuter.is_gold` flag the
  knutesjef sets** (see ADR-0013). This is a deliberate improvement over the V1 points
  threshold. The gold count on the profile counts distinct approved knuter where `is_gold`.

## 5. Thread tiers (russelue-dusk: bronse / sølv / gull tråd)

Source: `frontend/components/WrappedStory.jsx` (~L279–342).

- **Separate concept from gold knuter.** A thread tier is earned by completing a
  **specifically named knute** whose title contains `bronsetråd`, `sølvtråd`, or `gulltråd`.
- Hierarchy: only the highest earned tier is shown (gull > sølv > bronse). Medals 🥇🥈🥉.
- Surfaced in Knuteloop Wrapped as a celebratory slide.
- **[NOT YET IN V2]** V2 does not model thread tiers. If added, they are special named
  knuter (or a `thread_tier` enum on knuter) — decide via an ADR.

## 6. Rank titles (leaderboard position → title)

Source: `backend/src/data/appHelpers.js` (`getLeaderboardTitle(rank)`).

| Rank | Title |
|---|---|
| 1 | O' Store Knutemester |
| 2–3 | Knutemester |
| 4–10 | Knutebaron |
| 11–20 | Knuteridder |
| 21–35 | Knutesersjant |
| 36–55 | Knuteknekt |
| 56–80 | Knutelærling |
| 81–110 | Knuteamatør |
| 111–145 | Knuteprøvling |
| 146–185 | Knutetabbe |
| 186–220 | Knutenybegynner |
| > 220 (or invalid) | Knutekatastrofen |

## 7. Badges / achievements

Source: `backend/src/data/badgeSystem.js`. **7 achievements, each with 4 tiers**
(bronze/sølv/gull/diamant). Tier metadata tones: amber / slate / gold / sky.

| Key | Name | Trigger | Tier thresholds (bronze→diamond) |
|---|---|---|---|
| total-knots | Knutesamler | total approved knuter | 3 / 8 / 15 / 25 |
| point-club | Poengjager | total points | 100 / 200 / 350 / 500 |
| food-run | Matmodus | knuter matching food keywords* | 1 / 3 / 5 / 8 |
| social-run | Sosial motor | category sosial/gruppe/event OR keywords (klasse, venn, gjengen, medruss) | 2 / 4 / 7 / 10 |
| school-run | Skolekaos | category skole OR keywords (skole, time, klasserom, lærer, presentasjon) | 1 / 3 / 6 / 9 |
| party-run | Festpuls | keywords (fest, alkohol, ol, shot, drikk, bar, edru, rt, snus, royk/røyk) | 1 / 2 / 4 / 6 |
| gold-run | Gullknute-jeger | gold knuter (see §4) | 1 / 2 / 4 / 6 |

\* food keywords: spis, mat, frokost, lunsj, middag, banan, nuggets, sandwich, club, baka, is, pizza, burger.

- **[V1 BUG]** V1 matches keywords by **case-insensitive substring** (e.g. `ol` matches
  `protokoll`). V2 must use **whole-word** matching (see `apps/api/CLAUDE.md`).

## 8. Knute categories (knutemapper / folders)

Source: `backend/src/data/knotFolders.js` (`KNOT_FOLDERS`, `KNOT_FOLDER_BY_ID`).

Five folders (canonical order; matches V2's `knuter.category` enum):

1. **Generelle** — "Vanlige knuter som passer for de fleste og gir en ryddig start."
2. **Dobbelknuter** — "Knuter som ofte krever en venn, en gruppe eller en annen person."
3. **Alkoholknuter** — "Knuter som er knyttet til drikking, edruvalg eller alkoholtema."
4. **Sexknuter** — "Knuter med florting, kropp eller dating som tema."
5. **Fordervett-knuter** — "Knuter som trenger ekstra vurdering og litt mer dommekraft."

Assignment: a `KNOT_FOLDER_BY_ID` map; unknown → defaults to `Generelle`.

## 9. Profile fields

Source: `index.mjs` seed (~L398–410), `prototypeData.js` (`socialProfileDetails`).
All user-editable via PATCH.

| Field | Notes |
|---|---|
| `russName` (russenavn) | display identifier; gated behind dåp reveal (see §10) |
| `realName` | legal name; PII |
| `className` | e.g. 3STA, 3MKA |
| `russType` | `red` (rødruss) / `blue` (blåruss). Default `blue` |
| `bio`, `quote`, `knownFor` | free text |
| `signatureKnot` | a knute title |
| `favoriteCategory` | one of the 5 folders |
| `icon`, `photoUrl` | avatar |

## 10. Russenavn dåp reveal

- V1 stores `russnamesRevealedAt` (timestamp, nullable). Before it is set, non-admin
  users see only `realName`; after the knutesjef flips the reveal, `russName` is shown.
  Reversible (admin can hide again). Super-admin always sees russName.
- **[NOT YET IN V2]** V2 should model a per-school reveal flag/timestamp + gate russenavn
  visibility in the API and UI.

## 11. Auth (V1)

- Invite-code signup (admin generates code) → user sets password → email/password login →
  bearer session tokens (in-memory `sessions` + a SQLite auth DB of hashed passwords).
  Super-admin identified by email (`ingve@kampsporthuset.no`), hidden from public views.
- **[V2 SUPERSEDES]** V2 plans **Vipps** login + russenavn allowlist (ADR superseding 0006
  pending). Do not copy V1's password/invite model.

## 12. Feature inventory (V1) — for V2 roadmap parity

Built in V1, status in V2 noted:

- **Submissions + knutesjef approval** ✅ V2
- **Social feed** (approved submissions, anonymous-feed option w/ joker/mask/wolf avatars) ✅ V2 (no anon yet)
- **Feed ratings** (1–5 stars, avg + count) ❌ V2
- **Feed comments** (threaded, likes, soft-delete) ❌ V2
- **Reports** (submission + comment, reasons, moderation queue) ❌ V2
- **Bans** (feed-ban / submission-ban, 24h/3d/1w durations) ❌ V2
- **Leaderboard** — school-wide ✅ V2; **class ("Klasse kamp")** ❌ V2; hot-movers ❌ V2
- **Rank titles** (§6) ❌ V2
- **Badges** (§7) ❌ V2
- **Streak + daily bonus** (§2) — streak display ✅ V2; bonus points ❌ V2
- **Daily knute** (§3) ❌ V2
- **Profiles** (§9, public profile cards, profile history) ⚠️ partial V2 (own profile only)
- **Dåp reveal gate** (§10) ❌ V2
- **Knuteloop Wrapped** (Spotify-style recap: persona+roast, thread slides, gallery, best day,
  night-owl, loop top-5, deterministic per-user variants) ❌ V2
- **Admin tools** (bulk knute import, user mgmt, invite codes, feedback templates, super-admin
  hiding) ⚠️ partial V2 (knute create/edit only)
- **Sponsor knuter + aggregate reports** ❌ V2 (revenue model)
- **Media** (image + video, auto-resize, HEIC→JPEG, MP4 transcode) ❌ V2 (photo upload stubbed)

## 13. V1 mistakes V2 must NOT repeat (from `apps/api/CLAUDE.md` + this extract)

- Monolithic 3700-line file + one JSON blob → modular Drizzle tables, no file > 500 lines.
- Two parallel user records joined by lowercased email → one `users` table, UUID ids.
- `submission.points` stored → compute it (§1).
- Ratings as a JSON map keyed by user id → a dedicated ratings table.
- Daily-knote day-key in host local time → Europe/Oslo (§3).
- Badge keyword matching by substring → whole-word (§7).
- Reports in one table with a nullable `commentId` → separate `submission_reports` /
  `comment_reports` tables.
