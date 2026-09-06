# Superadmin-panelet — spesifikasjon

> **Status:** utkast 2026-09-04, godkjent som plan av Ludvig samme dag. Skrevet på bokmål
> med vilje — Ludvig, Brage og Linus skal kunne lese den og mene noe om den.
>
> Dette er produktspesifikasjonen for Knuteloop-ansatt-rollen i
> [ADR-0027](./adr/0027-knuteloop-ansatt-plattformrolle.md), bygget på
> [ADR-0026](./adr/0026-moderering-rapport-og-utestenging.md) og
> [moderering-spec.md](./moderering-spec.md). Den klikkbare mocken
> ([`design/admin-superadmin-mock.html`](./design/admin-superadmin-mock.html)) er
> UI-skissen; denne fila er reglene bak den. **Ingenting her bygges før ADR-0026 og
> ADR-0027 er Accepted.** Byggerekkefølge i §14.
>
> Rammen: tre personer (Ludvig `owner`, Brage `operator`, Linus `moderator`), ~5 uker
> russetid, 100+ skoler. Knutesjefene eier poeng, juks og godkjenning — panelet rører aldri det.

---

## 0. Ordliste

| Ord | Betyr |
|---|---|
| **Sak** | Den eneste døra inn til kryss-skole-data. Ingen sak, ingen skjerm. Har ID (`S-1234`), type, bane, skole. |
| **Bane** | RØD / GUL / GRØNN — hvor fort saken må tas. |
| **Claim** | «Jeg tar denne.» Én ansatt eier en sak om gangen. |
| **Bryter** | Skru av/på noe i hele appen uten app-oppdatering (kill switch). |
| **Karantene** | «Fjern» skjuler og låser innholdet i 30 dager før det slettes. Kan gjenopprettes. |
| **Frys** | Legal hold: innholdet låses mot sletting fordi det kan bli bevis. |
| **Fire øyne** | En annen ansatt må bekrefte fra sin telefon før handlingen skjer. |
| **Steg-opp** | Logg inn på nytt + tofaktor rett før en farlig handling. |
| **Vakt** | Hvem som eier ukjente saker i dag. |
| **Din status** | Siden i russ-appen som viser alt panelet har gjort mot deg, med klage. |

## 1. Prinsipper (arver ADR-0027, gjentas fordi de styrer alt under)

1. **Kø, ikke dashboard.** Målet er skjermen som sier «ingenting trenger deg».
2. **Hvorfor ser jeg dette?** Alt kryss-skole-innhold på en skjerm kan spores til en sak-ID.
3. **Begrunnelser er valg, ikke fritekst.** Lista genererer beskjeden til den som rammes.
4. **Serveren avgjør alt.** Skjult knapp i appen er bekvemmelighet, ikke sikkerhet.
5. **Alt logges — også lesing.** Hver kryss-skole-lesing er en rad i loggen.
6. **Reversibelt før permanent.** Karantene før sletting, klage før endelig.
7. **Ingen nedlasting av nakenhet/mindreårig. Aldri.** Det er straffbart i seg selv.
8. **Tre nivåer, fire øyne på det permanente.** Ingen enkeltperson kan gjøre noe uopprettelig alene.

## 2. Hvem kommer inn, og hvordan

**Konto.** Ansatte logger inn med egne ansattkontoer (ADR-0027 pkt 5) — ikke Vipps-som-russ.
Kontoen er en vanlig `users`-rad på en intern «skole» (`Knuteloop`), og plattformstatus er en
rad i `platform_staff`. Fjernes raden, er tilgangen borte på neste forespørsel.

**Knappen.** Appen kaller `GET /api/platform/me`. `200 {level}` → «Knuteloop»-knappen vises
ved siden av knutesjef-knappen. `404` → ingen knapp (aldri 403 — ingen skal se at endepunktet
finnes). Skjermene under `apps/mobile/app/platform/*` lastes separat, som `app/admin/*`.

**Nivåer.**

| Nivå | Kan | 2027 |
|---|---|---|
| `moderator` | saker og handlinger unntatt permanent/frys, støttesak («Se som») | Linus |
| `operator` | + brytere, knutesjefer, skoler, data, eksporter | Brage |
| `owner` | + ansatte, permanent utestenging, frys, politiforespørsler, lesemodus, logg-eksport | Ludvig |

**Steg-opp.** Før hver handling som skriver kryss-skole (fjern, utesteng, bryter, suspender):
re-autentisering + tofaktor, gyldig i 10 minutter. Metode (TOTP eller passkey) avgjøres i
auth-arbeidet — kravet er uavhengig av metoden.

**Fire øyne.** Handlingen legges som «venter på bekreftelse», push går til de andre som har
nivå nok, den første som bekrefter fra sin telefon utløser den. Utløper etter 60 min. Gjelder:
permanent utestenging · frys · pause hel skole · lesemodus · suspendere eneste knutesjef ·
logg-eksport · frigi frosset bevis.

## 3. Skjermene

Navigasjon (samme rekkefølge som mocken): **Oversikt · Saker · Skoler · Knutesjefer ·
Brytere · Data · Logg**, pluss knappen **Ny sak** som er tilgjengelig overalt.

| Skjerm | Viser | Handlinger | Viser aldri |
|---|---|---|---|
| **Oversikt** | tre tall (RØD+GUL saker, venter i nasjonal feed, skoler uten moderering), «ingenting haster»-banner, vakt i dag, de to andre + siste handling, aktive brytere | trykk → skjermen | innhold fra noen skole |
| **Saker** | køen sortert RØD → GUL → GRØNN, så eldst først; chip for bane, claim, brigading; «Ferdig i dag» under | åpne, ta saken, handlinger (§5) | saker uten sak-ID (finnes ikke) |
| **Sak (detalj)** | media uskarpt + gråtoner til «Vis», knute, innsender (russenavn + navn), skole, meldt av (aldri identitet til rapportør utover «russ / annen / knutesjef»), hva som ble meldt, knutesjefens status, tidslinje | §5 | andre innsendinger fra samme person (det er en ny sak) |
| **Skoler** | sortert på tid siden siste moderering; russ, knutesjefer, kø, sist, 7 dager, kontakt | Ny støttesak, Knutesjefer | feeden, topplista, brukerlister |
| **Knutesjefer** | per skole: russenavn, navn, sist inne, godkjent/avvist, snitt sek per sak, varsler | Ny knutesjef, Suspender, Gi tilgang | innsendinger |
| **Brytere** | funksjon / kategori / enkeltknute / skole / drift, med «slik ser russen det» | skru av/på (grunn + utløp) | — |
| **Data** | Aktivitet (aggregert), Fakturagrunnlag, Sponsor (når tabellene finnes) | eksport | per-bruker-tall |
| **Logg** | søk på ansatt, skole, sak, handling, tidsrom; siste 8 som standard | eksport (owner, fire øyne) | — |
| **Ny sak** | skole → type → mål (eksakt russenavn eller innsendings-ID fra knutesjef) | opprett | søk/liste over brukere |

Alle lister er FlashList; alle handlinger går gjennom `ConfirmSheet`; media bruker
`expo-image` med `blurRadius` + gråtone-overlay til «Vis» trykkes (én gang per sak, logges).

## 4. Saken

**Kilder (`source`):** `report` (rapport fra russ, eskalert av knutesjef eller automatisk for
`nudity`/`safety_risk`, ADR-0026 pkt 3) · `knutesjef` (knutesjef trykker «Send til
Knuteloop») · `manual` (Ny sak) · `system` (skole uten knutesjef ≥ 4 d, hash-kjede brutt,
klage) · `national_feed` (når den finnes).

**Typer og baner.**

| Type | Bane | Utløses av |
|---|---|---|
| `nudity_minor` | RØD | rapportgrunn `nudity` (ADR-0026) — automatisk |
| `safety_risk` | RØD | rapportgrunn `safety_risk` — automatisk |
| `possible_crime` | RØD | knutesjef eskalerer med «mulig lovbrudd» |
| `knutesjef_accused` | GUL | rapport mot en bruker med rolle knutesjef |
| `school_without_knutesjef` | GUL | system: ingen aktiv knutesjef, eller ingen moderering på 4 dager |
| `right_to_own_image` | GUL | manuell (forelder, elev, rektor) eller rapportgrunn `other` + valg |
| `ban_appeal` | GUL | russ trykker «Klag» i Din status |
| `reporter_abuse` | GUL | ansatt oppretter fra en sak der rapportene var falske |
| `report_escalated` | GUL | knutesjef sender en vanlig rapport videre |
| `support_view` | GRØNN | Ny støttesak på en skole (gir «Se som») |
| `dsar_access` / `dsar_erasure` | GUL | innsyn/sletting via `personvern@` — 30-dagers frist vises |
| `law_enforcement` | GUL (RØD hvis nød) | politiforespørsel (§9) |
| `national_feed_report` | GRØNN | rapport på nasjonalt innhold |
| `audit_chain_broken` | RØD | nattlig verifisering feiler |

**Varsling.** RØD: push til alle tre + e-post, umiddelbart. GUL: push til vakten. GRØNN:
ingen. Ingen SMS-leverandør nå (alle kandidatene er utenfor EU eller uavklart); revurderes
hvis push viser seg å ikke nå fram om natta.

**Claim.** `claimed_by` + `claimed_at`. Slippes automatisk etter 30 min uten aktivitet.
Vakten eier RØD/GUL-saker som ikke er tatt etter 15 min.

**Mål for tid til første handling.** RØD < 1 t døgnet rundt. GUL < 24 t. GRØNN neste vakt.
`first_action_at` settes på første handling (også «ta saken»). Det er tallet Apple og Google
spør etter.

**Brigading-signal.** Vises som chip når ≥ 3 rapporter på samme innsending kommer fra samme
klasse innen 15 min, eller fra brukere som har rapportert samme person før. Bare et signal —
ADR-0026 pkt 3 står: rapporter skjuler aldri noe automatisk.

**Livssyklus.** `open` → `claimed` → `resolved` | `dismissed` | `sent_back` (til knutesjef).
Klage åpner en ny `ban_appeal`-sak koblet til den gamle, og **kan ikke tas av den som fattet
vedtaket**.

## 5. Handlinger og begrunnelse

| Handling | Skriver | Fire øyne | Nivå |
|---|---|---|---|
| Ta saken | `claimed_by` | nei | moderator |
| La stå | sak `dismissed`, rapportør får utfall | nei | moderator |
| Fjern | `submissions.status = 'removed'`, media → karantene, poeng for innsendingen trekkes, begrunnelse, Din status | nei | moderator |
| Fjern + utesteng | som over + `user_restrictions` (`feed_ban` / `submission_ban`, 24 t / 3 d / 7 d), `token_version`++ | nei | moderator |
| Utesteng permanent | `user_restrictions` uten `expires_at` (sesongen ut) | **ja** | operator |
| Frys | `legal_holds`-rad, `no_export` = true for `nudity_minor`, retensjon hopper over | **ja** | owner |
| Eskaler til politi | sjekkliste lagres på saken (§9), kan ikke lukkes uten «varslet kl.» | nei | moderator |
| Send tilbake til knutesjef | sak `sent_back`, rapporten går til skolens kø med notat | nei | moderator |
| Gjenopprett | `status` tilbake, media ut av karantene, poeng tilbake, Din status oppdateres | nei | moderator (annen enn den som fjernet) |
| Frigi frosset bevis | `released_at` | **ja** | owner |

**Grunner (fast liste, bokmål i UI, engelsk enum i kode).**

| Enum | Tekst til den som rammes | Grunnlag |
|---|---|---|
| `harassment` | trakassering eller mobbing | retningslinjene |
| `sexual_content` | nakenhet eller seksuelt innhold | retningslinjene (+ strl. § 267a der det passer) |
| `image_without_consent` | bilde av en person uten samtykke | åvl. § 104 |
| `danger` | fare for liv eller helse | retningslinjene |
| `illegal_act` | ulovlig handling | «annet lovgrunnlag» (velges fra kort liste) |
| `repeat_violation` | gjentatte brudd | retningslinjene |
| `other` | annet — **eneste sted med fritekst**, maks 200 tegn, som tillegg | retningslinjene |

**Begrunnelsen** (DSA art. 17 i fem felt, sendes i appen og vises i Din status):

1. **Hva:** fjernet / kan ikke dele i feeden til {dato} / kan ikke sende inn til {dato} / utestengt sesongen ut.
2. **Grunn:** teksten fra lista over.
3. **Grunnlag:** «Knuteloops retningslinjer» eller lovhenvisning.
4. **Kom det fra et varsel:** ja/nei. Aldri hvem (ADR-0026 pkt 6).
5. **Klage:** «Du kan klage innen 30 dager» → knapp → `ban_appeal`.

Mal, fjerning: *«Innlegget ditt for «{knute}» er fjernet fra Knuteloop. Grunn: {grunn}.
Poengene for denne knuten er trukket; resten er trygge. Du kan klage innen 30 dager.»*

Mal, utestenging: *«Du kan ikke {dele i feeden | sende inn} før {dato}. Grunn: {grunn}.
Poengene dine er trygge. Du kan klage innen 30 dager.»*

Til rapportøren (DSA art. 16(5)): *«Takk for at du sa ifra. Vi har sett på innlegget og
{lar det stå | har fjernet det}.»* Aldri hvilken sanksjon personen fikk.

## 6. Brytere

| Omfang | Nøkkel (eksempel) | Standard hvis appen ikke får svar |
|---|---|---|
| `feature` | `national_feed`, `video_upload`, `nomination`, `knutesjef_create_knute` | feed og video **av**, resten på |
| `category` (nasjonalt) | `Alkohol`, `Sex` | **av** |
| `knute` (nasjonalt) | `library_knute_id` — treffer alle kopier via `source_library_knute_id`; egne knuter med samme tittel listes som «mulig treff» og velges manuelt | på |
| `school` | `school_id` → pause; russen ser «Knuteloop er pauset for skolen din. Poengene er trygge.» | på |
| `ops` | `read_only` (alle skrivinger 503 med melding), `banner` (driftsmelding med tekst fra liste) | på / ingen banner |

Regler: grunn fra liste + valgfri utløpstid · `school` og `ops.read_only` krever fire øyne ·
appen henter `GET /api/switches` (offentlig, cachet 60 s, ETag) og beholder siste kjente ·
standardene over testes i CI · hver endring er en logg-rad med gammel og ny verdi.

## 7. Loggen

`audit_log` er append-only og **ikke** skole-scopet. Skrives kun av `admin_role` (app_role
har ikke INSERT). Kolonner: `id`, `seq` (bigint, tett), `actor_user_id`, `actor_level`,
`action`, `target_type`, `target_id`, `school_id` (berørt skole), `case_id`, `metadata`
(jsonb — aldri russenavn/e-post), `request_id`, `created_at`, `prev_hash`, `hash`.

`hash = sha256(prev_hash || seq || actor || action || target || school || case || metadata || created_at)`.
Genesis-rad har `prev_hash = '0' × 64`. En nattlig jobb regner kjeden fra genesis; første brudd
→ `audit_chain_broken`-sak (RØD). Oppbevaring: 3 år (forslag — jurist bekrefter mot DPIA §1).

Hva som logges: alle handlinger i §5, alle bryterendringer, hver kryss-skole-lesing (åpne
sak, «Vis» media, støttesak-visning), hver eksport, hver innlogging til panelet, hver fire
øyne-bekreftelse. Eksport = CSV via signert Bunny-lenke (15 min), owner + fire øyne.

## 8. Karantene og frys

**Fjern.** `submissions.status → 'removed'`, `removed_reason`, `removed_by`, `removed_at`.
`lib/storage.ts` får `quarantine(key)` (flytt til `quarantine/<key>` — ikke servert av CDN),
`restore(key)` og `delete(key)`, for både `local` og `bunny`. Poeng: `users.points -=
knute.points` for akkurat denne innsendingen. Etter 30 dager sletter retensjonsjobben
karantenen — **med mindre** det finnes en `legal_holds`-rad.

**Frys.** Låser innsending + media + saken + logg-radene mot retensjon og mot brukerens egen
sletting (GDPR art. 17(3)(e); dokumentert i `legal_holds.reason`). Innholdet forblir skjult
for alle. To modi:

- `no_export = true` (alltid for `nudity_minor`): ingen nedlasting, ingen bevispakke. Politiet
  får tilgang via formell forespørsel (§9); vi peker på tips.kripos.no.
- `no_export = false` (andre lovbrudd, f.eks. tukling med politibil): «Last ned bevispakke»
  gir zip (media + metadata + logg-utdrag) med SHA-256-sum, via signert lenke, og logges.

Frigivelse krever owner + fire øyne. Retensjonsjobben viser «N saker frosset» før sesongslutt.

## 9. Beredskap — runbooks

Kort versjon. Fullstendig tabell (17 scenarier) i planen; de som trenger *steg* står her.

**Nakenbilde av (mulig) mindreårig.** Ikke last ned, ikke videresend, ikke ta skjermbilde.
Åpne saken → Frys (owner) → Fjern → «Eskaler til politi» → tips.kripos.no → fyll «varslet kl.».
Poeng trekkes. Begrunnelse sendes med `sexual_content`. Vurder `submission_ban`.

**Fare for liv (selvmord, vold).** Ring **112** hvis det skjer nå, **02800** ellers — før du
gjør noe i panelet. Så: Eskaler til politi → «varslet kl.» (DSA art. 18). Ikke lukk saken
før knutesjef/russestyret er kontaktet.

**Politiet tar kontakt.** Be om skriftlig forespørsel fra offisielt politidomene. Opprett
`law_enforcement`-sak. Nød (fare for liv nå) → owner kan gi ut det som trengs, logg det.
Ikke nød → bevar (frys, 90 dager, kan forlenges 90), utlever kun mot formell forespørsel med
hjemmel. Bruker varsles som hovedregel — ikke ved nød eller mindreårig-sak.

**Forelder/elev: «ta ned bildet av barnet mitt».** Ny sak → `right_to_own_image` → mål via
knutesjefens innsendings-ID eller russenavn → Fjern med `image_without_consent` (åvl. § 104).
Rapportøren trenger ikke være russ.

**Knutesjefen er anklaget.** Suspender (fire øyne hvis eneste) → ring russestyret (kontakt
på Skoler) → «Ny knutesjef». Panelet godkjenner ikke køen selv.

**Mistenkt kryss-skole-lekkasje.** `ops.read_only` PÅ (fire øyne) → `disaster-recovery.md`
§3 → logg-søk «hvem så hva» → 72 t til Datatilsynet hvis bekreftet (art. 33).

**Ansattkonto på avveie.** Owner sletter `platform_staff`-raden + `token_version`++. Virker på
neste forespørsel.

**Vi tok feil.** Gjenopprett (annen ansatt enn den som fjernet). Klage besvares innen 24 t —
VSCO omgjorde 45 % av klager på utestenging i 2025; regn med at det skjer hos oss også.

## 10. Tall

| Tall | Definisjon | Hvor |
|---|---|---|
| Tid til første handling | `first_action_at − created_at`, median + maks per bane, 24 t / 7 d | Oversikt, bevispakke |
| Saker åpne > 24 t | `status in (open, claimed)` og alder > 24 t | Oversikt |
| Skoler med kø-alder > 2 d | eldste `pending` per skole | Skoler |
| Klager og omgjøring | `ban_appeal` totalt / gjenopprettet | Data, bevispakke |
| Aktive brytere | `on = true` og ikke utløpt | Oversikt, Brytere |
| Handlinger per ansatt per dag | logg-rader per `actor` | Data (for vaktplan, ikke prestasjon) |

Bevispakke (App Store / Google): CSV med rapporter mottatt, tid til første handling, andel
fjernet, klager/omgjort, per uke — ingen russenavn. Fakturagrunnlag (ADR-0020): innsendinger
per skole per sesong → trinn.

## 11. Datamodell

Alle plattform-tabeller er **ikke** skole-scopet (de spenner på tvers per definisjon), har
ingen RLS-policy, og **`app_role` har ingen rettigheter** på dem (REVOKE i migrasjonen, som
`0014_library_force_rls_and_grants.sql`). Kun `admin_role` leser og skriver.

| Tabell | Kolonner (utover id/created_at/updated_at) |
|---|---|
| `platform_staff` | `user_id` (unik), `level` (`moderator`/`operator`/`owner`), `created_by`, `revoked_at` |
| `platform_cases` | `type`, `severity` (`red`/`yellow`/`green`), `source`, `status`, `school_id`, `submission_id?`, `user_id?`, `report_id?`, `parent_case_id?` (klage), `claimed_by?`, `claimed_at?`, `first_action_at?`, `resolved_by?`, `resolved_at?`, `resolution?`, `reason?`, `reason_note?`, `legal_ground?`, `statement_sent_at?`, `police_notified_at?`, `police_reference?` |
| `platform_case_events` | `case_id`, `actor_user_id`, `event`, `metadata` — tidslinja på saken |
| `platform_switches` | `scope`, `key`, `on`, `reason`, `expires_at?`, `set_by`; unik (`scope`,`key`) |
| `platform_approvals` | `action`, `payload` (jsonb), `requested_by`, `approved_by?`, `expires_at`, `executed_at?` — fire øyne |
| `legal_holds` | `case_id`, `submission_id`, `reason`, `no_export`, `created_by`, `released_by?`, `released_at?` |
| `school_contacts` | `school_id`, `role` (`russepresident`/`knutesjef`/`annet`), `name`, `phone`, `email` — minimum, kun voksne/17+ som selv har gitt det |
| `platform_duty` | `date`, `user_id` |
| `audit_log` | se §7 |

Endringer i eksisterende: `submissions.status` får `removed` (+ `removed_reason`,
`removed_by`, `removed_at`); `users.knutesjef_terms_accepted_at`; ADR-0026-tabellene
`submission_reports` og `user_restrictions` bygges som spesifisert der (tenant-scopet,
full RLS). Plattformrutene leser dem gjennom `admin_role`.

**To databaseklienter.** `db/client.ts` (app_user) er uendret. Ny `db/admin-client.ts`
(admin_user, egen `DATABASE_ADMIN_URL`) kan bare importeres fra `routes/platform/**` og
`jobs/**` — håndhevet i `lint-guardrails.test.ts`. Kort transaksjon per spørring, aldri
per forespørsel (den flaskehalsen i `tenantContext()` skal ikke arves).

**Åpent for Konrad:** BYPASSRLS-klient (ADR-0027 pkt 2) vs. policy-gren på `app.admin_read`
(moderering-spec §6). Spesifikasjonen fungerer med begge.

## 12. API-skisse (`/api/platform/*`, aldri `tenantContext()`)

| Metode og sti | Hvem | Gjør |
|---|---|---|
| `GET /me` | alle innloggede | 200 `{level}` eller 404 |
| `GET /cases?lane=&status=&cursor=` | moderator+ | køen, paginert |
| `GET /cases/:id` | moderator+ | detalj — logger lesing |
| `POST /cases` | moderator+ | Ny sak (manuell) |
| `POST /cases/:id/claim` | moderator+ | ta saken |
| `POST /cases/:id/actions` | per §5 | `{action, reason, reason_note?, legal_ground?, duration?}` — steg-opp-token i header |
| `GET /cases/:id/media` | moderator+ | signert lenke, logger «Vis» |
| `POST /cases/:id/support-token` | moderator+ | 30-min lese-token for «Se som» (kun `support_view`) |
| `GET /approvals`, `POST /approvals/:id/approve` | per handling | fire øyne |
| `GET/PUT /switches` | operator+ | brytere (PUT krever grunn) |
| `GET /schools`, `GET /schools/:id` | operator+ | tabellen, kontakt, kø-alder — aldri innhold |
| `GET/POST/DELETE /schools/:id/knutesjefer` | operator+ | gi/suspender |
| `GET/PUT /duty` | operator+ | vaktplan |
| `GET /exports/:kind` | operator+ (logg: owner) | starter jobb → signert lenke |
| `GET /audit?q=&from=&to=` | operator+ | søk |
| `GET /api/switches` (utenfor platform) | offentlig | det appen henter, cachet |

Alle med Zod på input, `platformStaff()`-middleware (token + DB-oppslag + nivå), rate
limit 30/min, og tester: happy path, 401, 404 for ikke-ansatt, 403 for lavt nivå, og
**at `app_role` ikke kan lese plattform-tabellene**.

**«Se som»-tokenet** (ADR-0027 pkt 3 utvidet): eget JWT med `impersonated_school_id`,
`impersonator_user_id`, `read_only = true`, `case_id`, 30 min. Middleware avviser alle
skrivinger med 403 før forretningslogikk. Appen viser mørk ramme + «Støttesak S-1234 ·
kun lesing · 27 min igjen». Viser bare `approved` + `shared`.

## 13. Det som ikke er med — med vilje

Poengkrangel og juks · fritt søk i brukere/innsendinger · feed-bla uten sak · godkjenne på
vegne av en skole · per-bruker-data til sponsor · DM/chat · automatisk bildeklassifisering ·
sletting uten karantene · SMS-varsling (ingen EU-leverandør avklart) · egen nettside.

## 14. Byggerekkefølge (når ADR-0026 og ADR-0027 er Accepted; hver PR < 300 linjer)

1. `submission_reports` + `user_restrictions` + rapportknapp (ADR-0026).
2. `platform_staff` + `audit_log` + `platformStaff()` + admin-klient + lint-vakt + `GET /me`.
3. `platform_cases` + `platform_case_events` + køen + claim + handlingene + begrunnelse + karantene i `storage.ts`.
4. `platform_switches` + `GET /api/switches` + sikre standarder i appen.
5. Skoler + knutesjefer + `school_contacts` + system-saker (skole uten knutesjef).
6. «Knuteloop»-knappen + skjermene under `app/platform/*` + steg-opp (avhenger av auth).
7. Din status i russ-appen + klage.
8. `platform_approvals` (fire øyne) + `legal_holds` + frys.
9. Data, fakturagrunnlag, bevispakke, eksport-jobb.
10. Vaktplan, driftsmelding, nattlig kjedeverifisering.

## 15. Åpne punkter

- Tofaktor-metode for ansatte (TOTP vs. passkey) — auth-arbeidet.
- Hvordan ansattkontoer opprettes før ekte innlogging finnes (dev-stub i dag).
- Oppbevaring av `audit_log` (3 år foreslått) og `legal_holds` uten frigivelse — jurist.
- Nasjonal feed og sponsortabeller har egne ADR-er som ikke er skrevet; §3 og §6 har krokene.
- Konrads valg: BYPASSRLS-klient vs. policy-gren (§11).
- Bordøvelse med Brage og Linus på §9 før noe bygges — hull der er hull i panelet.

## Kilder (utvalg — full liste i planen 2026-09-04)

[Apple App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/) ·
[Google Play UGC](https://support.google.com/googleplay/android-developer/answer/9876937?hl=en) ·
DSA [art. 16](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_16.html),
[17](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_17.html),
[18](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_18.html),
[19](https://www.eu-digital-services-act.com/Digital_Services_Act_Article_19.html) ·
[Medietilsynet om DSA i Norge](https://www.medietilsynet.no/regelverk/internasjonale-reguleringer-for-digitale-tjenester/dsa/) ·
[VSCO Transparency Report 2025](https://www.vsco.co/safety/transparency-reports/2025) ·
[Snap — informasjon for politi](https://values.snap.com/safety/safety-enforcement) ·
[Supercell Safe and Fair Play](https://supercell.com/en/safe-and-fair-play/) ·
[Pigment — trygg impersonering](https://engineering.pigment.com/2026/04/08/safe-user-impersonation/) ·
[Cinder — køer for T&S](https://cinder.ai/resources/blog/queues-agility-customization-and-automated-triage-for-trust-safety-teams) ·
[Blur/gråtoner for moderatorer (AAAI)](https://cdn.aaai.org/ojs/7461/7461-64-10811-1-2-20200924.pdf) ·
[Kripos — ingen meldeplikt, men last aldri ned](https://norwegianscitechnews.com/2023/06/reporting-findings-of-online-abuse-material-not-required-by-law/) ·
[Rett til eget bilde, åvl. § 104](https://www.ung.no/nettvett/1956_Kan_man_legge_ut_bilder_av_andre_som_man_selv_har_tatt.html) ·
[Hash-kjedet logg i Postgres](https://appmaster.io/blog/tamper-evident-audit-trails-postgresql) ·
[SSB — celler under 3 skjules](https://www.ssb.no/en/omssb/personvern/personopplysninger-i-statistikken)
