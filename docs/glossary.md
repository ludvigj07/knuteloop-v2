# Glossary — Russ vocabulary and Knuteloop domain terms

Claude needs this to write correct code (e.g., to know that "russenavn" is a stable identifier that shouldn't be lowercased or normalized). Future Ludvig needs this to recall conventions at 2 AM after a leave.

All glosses are short — for cultural depth, this is not the right document.

---

## Russetid (the season)

| Term | Gloss | Role in the product |
|---|---|---|
| **russ** | A Norwegian student in their final year of upper secondary school (Vg3), participating in the russ celebration. | The primary user. We say "user" in code; "russ" only in UI strings. |
| **russetid** | The russ celebration period — typically from late April or early May until 17 May (Norwegian Constitution Day). | The active season. Knuteloop's usage spikes during this ~3 week window. |
| **Vg3** | Tredje år på videregående skole — the third (final) year of upper secondary school. | The eligibility class. Only Vg3 students are on the russenavn allowlist for a given russ year. |
| **rødruss / blåruss** | Red russ (most students) / blue russ (economics/business track). | Modeled as `russType` (`'blue'` / `'red'`) on the profile — v1 stores it and v2 keeps it. Shown on profile cards. Anything other than red coerces to blue. |
| **russedåp** | A symbolic "baptism" marking the start of the celebration. | Not modeled in product. |
| **slep** | A "convoy" or group — a bus crew that decorates together, travels together, and parties together. | Could be modeled as group affiliations in a future ADR. For now, not modeled. |
| **17. mai** | 17 May, Norwegian Constitution Day. | The traditional end-day of russetid. |

## Identity

| Term | Gloss | Role in the product |
|---|---|---|
| **russenavn** | A russ's russ-name — an assigned nickname for the russetid period, typically humorous, often crude, sometimes earned. NOT chosen by the student themselves. | The unique display identifier within a school. Stored exactly as written, case-sensitive, no normalization. PII — must be in Pino redact paths. |
| **knutesjef** | "Knot chief" — the student who manages and approves knuter at a school. The community lead. | A role in the system: `'knutesjef'`. Can approve/reject submissions, manage the russenavn allowlist. |
| **knuteansvarlig** | Sometimes used interchangeably with knutesjef; in some schools refers to an assistant. | We use only `knutesjef` in code. If a school distinguishes, they can both have the same role. |
| **vitne** | Witness — a fellow russ who confirms a knute was completed. | In v1, every submission required a vitne. v2 may relax this — see open product question. For now, modeled as an optional `witness_user_id` field. |

## Knuter

| Term | Gloss | Role in the product |
|---|---|---|
| **knute** | "Knot" — a challenge/dare that earns the russ a real knot tied into the tassel of their russelue (russ cap). The product's central activity. | Modeled as the `knuter` table. Sponsored knuter are a row with `is_sponsored = true`. |
| **knutebok** | "Knot book" — the traditional booklet listing all challenges available. Each school has variations. | Approximately = our `knuter` table + the school's subscribed folders + their `custom_knuter`. |
| **russelue** | The traditional cap russ wear during russetid — typically red, with a tassel into which the knots are tied. | Not modeled. Cultural context only. |
| **dusk** | The tassel on the russelue, where knots are tied. | Not modeled. Cultural context only. |
| **knutemappe** | "Knote folder" — a thematic grouping of knuter (e.g., "Drikkeknuter", "Akademisk", "Sex"). | Modeled as `knute_folders`. Schools subscribe to folders via `school_folder_subscriptions`. |
| **innsending** | "Submission" — the photo + caption a russ sends to prove they completed a knute. | Modeled as the `submissions` table. |
| **godkjenning** | "Approval" — the knutesjef confirming a submission counts. | Modeled as `submissions.status = 'approved'` + `reviewed_by` + `reviewed_at`. |
| **avvist** | "Rejected" — the knutesjef rejecting a submission (didn't actually complete the knute). | `submissions.status = 'rejected'`. |
| **poeng** | Points earned per knute. | The `knuter.points` column. Custom knuter have their own. |
| **toppliste** | Leaderboard — ranks russ by total points within their school. | The leaderboard endpoint, school-scoped. |

## Sponsorship

| Term | Gloss | Role in the product |
|---|---|---|
| **sponsorknute** | A knute funded by a sponsor (e.g., a local restaurant). Completing it typically involves the sponsor's product or location. | `knuter.is_sponsored = true` + sponsor fields. |
| **sponsorrapport** | A report we provide to sponsors showing aggregate completion counts and reach (NEVER per-user PII). | The sponsor-reports endpoint, admin role only. |

## Domain conventions in code

- **Norwegian terms** like russ, knute, knutesjef, russenavn, russetid: KEEP in code. Don't translate. They are the product. Use them in identifiers, comments, UI.
- **Other Norwegian terms** (vitne, slep, dusk, etc.): NOT used in code identifiers — translate to English (`witness`, `crew`, `tassel`) if ever needed.
- **`russenavn` is a stable identifier within a school but NOT globally unique.** Two schools can each have a russenavn "Loke". Always scope by `(school_id, russenavn)`.
- **Names are user-visible PII.** Pino redact paths cover `russenavn`, `email`, `fullName`. Never log them in plain.
- **Number formatting:** Norwegian uses space as thousand separator (`1 234`), comma as decimal (`12,5`). Use `Intl.NumberFormat('nb-NO')`.
- **Date formatting:** Norwegian uses `27. mai 2026`, not `May 27, 2026`. Use `Intl.DateTimeFormat('nb-NO')`.

## Things we explicitly do NOT model in v2

- Specific tassel knot types (bronze/silver/gold tråd): not modeled. Tier is implicit in completed-knute counts.
- Sleps as groups with own leaderboard: not modeled. Could be added if data shows demand.
- Inter-school competition: not modeled. Each school's leaderboard is its own.
- Vitne as a hard requirement: optional in v2.
- Russetid date ranges per school: implicit. The app is just usable year-round; usage naturally peaks in May.
