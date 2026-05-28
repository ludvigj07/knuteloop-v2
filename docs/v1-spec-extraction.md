# V1 → V2 Spec Extraction — Day 1 Task

This is the **first thing you run** when building Knuteloop v2. Before writing any v2 code, you extract everything v1 already figured out into a clean specification. v2 then gets built against this spec, not by guessing.

## How to use this

1. Open Claude Code **in the v1 repo** (`knuteloop.no/`), NOT the v2 repo.
2. Paste the prompt below.
3. Claude reads the v1 source and produces `V1-SPEC.md`.
4. Review it with your brother — he can sanity-check the technical extraction.
5. Copy `V1-SPEC.md` into the v2 repo under `docs/v1-spec.md`.
6. From then on, v2 backend is implemented against this spec.

**Important:** This task only READS v1. It must not modify anything. v1 is live production — don't touch it.

---

## The prompt (copy everything below into Claude Code)

```
You are extracting the complete business logic and data model from Knuteloop v1
into a clean, implementation-independent specification. This spec will be the
source of truth when we rebuild the backend for v2 (Hono + PostgreSQL + Drizzle).

CONSTRAINTS:
- READ ONLY. Do not modify, delete, or write any file in this v1 repo except the
  single output file V1-SPEC.md in the repo root.
- Do not run the app, do not touch backend/data/ (that's live production state).
- Extract LOGIC and CONSTANTS as specification, not code. I want to know WHAT the
  rules are, expressed clearly enough that someone could reimplement them in any
  language, not the v1 implementation details.

FILES TO READ (in this order):
1. backend/src/data/prototypeData.js   — seed data, the St. Olav knute list
2. backend/src/data/knotFolders.js     — folder/category definitions
3. backend/src/data/appHelpers.js      — leaderboard, achievements, duel logic
4. backend/src/data/badgeSystem.js     — badge/achievement tiers
5. index.mjs                           — the main server: find all business rules,
                                          constants, scoring, streak logic, API shapes
6. backend/src/auth/*.mjs              — auth flow (for reference; v2 replaces this)

PRODUCE a single file V1-SPEC.md with these sections:

## 1. Data Model
For each entity (knute, submission, user/profile, duel, report, ban, comment,
knotFeedbackMessage), list every field, its type, allowed values, and what it means.
Note which fields are required vs optional. Note relationships between entities.

## 2. Knute Catalog
- The folder/category structure (exact names).
- For each of the ~37 St. Olav knuter + the knot-1..6: title, points, difficulty,
  category, safety level. Present as a table so it can be imported directly.

## 3. Scoring Rules
- How base points work.
- How submission approval affects points.
- How duel results adjust points (challenger-wins, opponent-wins, split, no-completion).
- The exact streak bonus tiers and the daily bonus cap.
- Any other point modifiers.

## 4. Leaderboard
- Sort order (primary, secondary keys).
- The EXACT rank-title thresholds (rank 1 = "O' Store Knutemester", etc. — list all).
- The three leaderboard views (total, class, gender) and how each is computed.
- Class token normalization rules (STA..STH, IBA..IBD, aliases).

## 5. Achievements / Badges
- Each badge: name, what it measures, the 4 tier thresholds (bronze/silver/gold/diamond).

## 6. Submissions Flow
- The three submission modes (review, feed, anonymous-feed) and what each does.
- Status lifecycle (Venter → Godkjent / Avslått).
- Media constraints (image dims, video limits — note we DROP video in v2).
- Note word limits and any other validation.

## 7. Duel (Knute-off) Rules
- All constants (stake, range, window, daily limit).
- Resolution logic for each outcome.
- Any edge cases handled in v1.

## 8. Daily Knot + Streak
- How the daily knot is selected.
- The exact streak qualification rules and timezone handling.

## 9. Moderation
- Report reasons, report statuses.
- Ban types and durations.
- Visibility/hide mechanics.

## 10. All Configuration Constants
A single table of every magic number / config constant found anywhere, with its
value and what it controls. (PORT, MAX_VIDEO_BYTES, GOLD_KNOT_POINTS, all of them.)

## 11. API Surface (for reference)
List every endpoint v1 exposed, its method, what it does, and its rough
request/response shape. Mark which ones v2 will need vs which were v1-specific.

## 12. Things to CHANGE in v2 (your recommendations)
Where v1 made a choice that doesn't fit v2's multi-tenant, EU-hosted, Postgres
architecture, flag it. Examples: anything assuming a single school, anything
assuming local file storage, the monolithic app-db.json, the invite-code auth.

FORMAT:
- Use tables wherever data is tabular (knute list, constants, badge tiers).
- Be exhaustive on numbers and thresholds — those are the things that are painful
  to rediscover later.
- Where v1 logic is unclear or seems buggy, note it explicitly rather than papering
  over it.
- Norwegian domain terms stay in Norwegian (russenavn, knutesjef, etc.).

When done, show me a summary of what you found and any surprises or ambiguities.
```

---

## After Claude produces V1-SPEC.md

**Review checklist (do this with your brother):**

- [ ] The knute list is complete (~37 + 6) and points match what's live
- [ ] All scoring constants are captured (cross-check a few against the app)
- [ ] Leaderboard titles are all there (rank 1 through >220)
- [ ] Badge tiers are correct
- [ ] Streak bonus percentages match (0/5/10/15/20%)
- [ ] Section 12 (things to change) makes sense — discuss each flag

**Then:**
1. Copy `V1-SPEC.md` → v2 repo as `docs/v1-spec.md`
2. Add a line to v2's `CLAUDE.md` imports: `@docs/v1-spec.md`
3. Now when you build v2 backend, Claude implements against a known spec

This single document will save you the weeks it took to figure all this out the
first time. v1's real value isn't its code — it's everything you learned building it,
and this captures that.
