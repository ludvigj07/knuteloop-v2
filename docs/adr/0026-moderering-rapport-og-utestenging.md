# ADR-0026: Moderering — rapportering og utestenging

**Status:** Proposed
**Dato:** 2026-08-31
**Deciders:** Ludvig (+ Konrad som ingeniør-review, Claude som rådgiver)

> Skrevet på norsk med vilje: Ludvig må kunne lese og mene noe om den selv.
> Henger sammen med [ADR-0027](./0027-knuteloop-ansatt-plattformrolle.md) (eskaleringsveien),
> men er bevisst skilt fra den — se «Hvorfor to ADR-er» nederst.

## Kontekst

Knuteloop er en bildefeed laget av 17–19-åringer. I dag finnes **ingen** moderering:
ingen rapportknapp, ingen måte å fjerne en innsending fra feeden, ingen måte å stoppe
en bruker som fortsetter. Det er ingen `submission_reports`-, ban- eller `audit_log`-tabell
i skjemaet i det hele tatt.

Tre ting gjør dette til en lanseringsblokker, ikke en «burde»:

1. **App Store.** Apples regler for brukergenerert innhold krever at appen har en måte å
   rapportere støtende innhold, en måte å blokkere brukere som misbruker tjenesten, filtrering
   av upassende innhold, og at utvikleren faktisk handler på rapporter. Uten dette kommer
   Knuteloop ikke gjennom review.
2. **Mindreårige.** CLAUDE.md regel 12 sier at alle brukere skal behandles som potensielt
   mindreårige. Bilder av tenåringer uten en fjerningsvei er et Datatilsynet-problem, ikke
   bare et produktproblem.
3. **v1-erfaring.** v1 hadde både rapporter og utestenging (`v1-spec.md` §12). De ble bygget
   fordi de trengtes.

`v1-spec.md` §13 flagger også v1s feil her: rapporter lå i **én** tabell med en nullable
`commentId`. v2 skal ha atskilte tabeller.

## Beslutning

### 1. `submission_reports` — en vanlig skole-scopet tabell

Full standardbehandling etter `database.md` §2: `school_id`, `.enableRLS()`, policy,
`FORCE ROW LEVEL SECURITY`-migrasjon, og sammensatt indeks som starter på `school_id`.

Kolonner: `submission_id`, `reporter_user_id`, `reason`, `note` (valgfri fritekst),
`status` (`open` / `resolved` / `dismissed`), `resolved_by`, `resolved_at`, tidsstempler.

`reason` er en enum i kode (engelsk, bokmål i UI per CLAUDE.md §6):
`inappropriate`, `nudity`, `harassment`, `safety_risk`, `other`.

**Kun innsendinger nå.** v2 har ingen kommentarer, så `comment_reports` bygges ikke —
den lages den dagen kommentarer finnes. Å bygge den nå er å bygge for en funksjon som
ikke eksisterer.

### 2. Én rapport per (innsending, rapportør)

Unik constraint. Uten den blir antall rapporter et mål på hvor mange venner du har,
ikke på hvor ille innholdet er.

### 3. Rapportering skjuler **ingenting** automatisk

Dette er den viktigste designavgjørelsen her, og den er spesifikk for dette produktet.

I en vanlig sosial app er auto-skjuling ved N rapporter fornuftig. På en skole der alle
kjenner alle, er det et **våpen**: fem klassekamerater kan fjerne innsendingen til noen de
ikke liker, på sekunder. Det er mobbing med appen som verktøy.

Derfor: en rapport legger innsendingen i en **kø**, den skjuler den ikke. Rapporterte
innsendinger går først i køen.

**Unntak:** `nudity` og `safety_risk` varsler Knuteloop-ansatte umiddelbart (se ADR-0027).
Der er risikoen ved å vente større enn risikoen for misbruk.

### 4. `user_restrictions` — utestenging som egen tabell

Skole-scopet, samme standardbehandling. To typer, som i v1:
`feed_ban` (kan ikke dele til feeden) og `submission_ban` (kan ikke sende inn i det hele tatt).

Felter: `user_id`, `type`, `expires_at`, `reason`, `issued_by`, tidsstempler.
Varigheter fra v1: 24 timer / 3 dager / 1 uke.

**Egen tabell, ikke en kolonne på `users`.** Historikk betyr noe — en gjentakende
utestenging skal være synlig, ikke overskrevet.

### 5. Hvem modererer

Knutesjefen for sin egen skole. Knuteloop-ansatte for eskalering — se ADR-0027.

### 6. Den rapporterte får aldri vite hvem som rapporterte

Selvsagt på en skole. Alt annet gjør rapportknappen ubrukelig.

## Alternativer vurdert

- **Auto-skjuling ved N rapporter.** Avvist — brigading-våpen i en lukket skolekontekst,
  se punkt 3. Vi tar heller kø-forsinkelsen.
- **Én `reports`-tabell med nullable `submission_id` / `comment_id`.** Avvist eksplisitt
  av `v1-spec.md` §13 — det var v1s feil, og det gir constraints man ikke kan uttrykke.
- **Kun sletting, ingen utestenging.** Avvist: Apple krever eksplisitt at man kan stoppe
  brukere som misbruker tjenesten, ikke bare fjerne enkeltinnhold.
- **Ekstern modereringstjeneste (automatisk bildeklassifisering).** Avvist for nå:
  alle kandidatene er amerikanske (ADR-0001, CLOUD Act), og det ville sende bilder av
  mindreårige ut av EU. Kan revurderes med en EU-leverandør.

## Konsekvenser

### Bra
- Fjerner en hard App Store-blokker.
- Knutesjefen får et ekte verktøy i stedet for å måtte ringe Ludvig.
- Historikken i `user_restrictions` gjør gjentakelse synlig.

### Vondt / avveininger vi tar
- **Manuell moderering skalerer med antall skoler.** 100 skoler betyr 100 knutesjefer
  som må gjøre jobben, med varierende iver. Eskaleringsveien i ADR-0027 er sikkerhetsnettet,
  men det er Knuteloop-ansatte som betaler i tid.
- Kø-modellen betyr at et ille bilde kan ligge synlig noen timer. Vi aksepterer det for alt
  unntatt nakenhet og fare.
- To nye skole-scopede tabeller = to nye kryss-skole-tester i `rls.test.ts`.

### Nøytralt
- Utestenging må virke sammen med `token_version` (security.md §3) — en utestengt bruker
  skal ikke kunne fortsette på et gyldig token. Det kobler denne ADR-en til auth-arbeidet.

## Åpne spørsmål

Avklart 2026-09-04 i arbeidet med [`docs/superadmin-spec.md`](../superadmin-spec.md)
(§4–§5 og §8). Svarene står her; begrunnelsen står der.

- ~~**Ankemulighet?**~~ **Ja.** En utestengt russ trykker «Klag» på siden «Din status» i
  appen (som viser alt som er gjort mot deg, med begrunnelse). Klagen blir en sak hos
  Knuteloop-ansatt (ADR-0027) og behandles alltid av en *annen* person enn den som fattet
  vedtaket — også når vedtaket var knutesjefens. VSCO omgjorde 45 % av slike klager i 2025;
  det er grunnen til at klage er obligatorisk, ikke valgfritt.
- ~~**Får rapportøren beskjed?**~~ **Ja, om utfallet — aldri om sanksjonen.** «Takk for at
  du sa ifra. Vi har sett på innlegget og lar det stå / har fjernet det.» Ikke hvem som
  gjorde hva, ikke om noen ble utestengt (punkt 6 gjelder begge veier). DSA art. 16(5)
  krever at den som varsler får vite avgjørelsen.
- ~~**Automatisk utløp?**~~ **`expires_at` sjekkes ved lesing.** Ingen jobb. Utestenging
  virker sammen med `token_version` (bumpes ved utestenging), så et gyldig token ikke
  fortsetter.
- ~~**Godkjent innsending som fjernes — trekkes poengene?**~~ **Ja, for akkurat den
  innsendingen.** Fjerning setter `submissions.status = 'removed'`, legger media i karantene
  i 30 dager (kan gjenopprettes ved klage) og trekker knutens poeng. Alt annet står.
  Begrunnelsen sier det rett ut: «Poengene for denne knuten er trukket; resten er trygge.»
  Uten dette er «post noe upassende, få poeng, bli fjernet» en jukse-vei.

## Hvorfor to ADR-er

Rapportering og utestenging er ganske alminnelig funksjonalitet: skole-scopede tabeller
med vanlig RLS, ingenting arkitektonisk farlig.

Kryss-skole-tilgangen for Knuteloop-ansatte er derimot det ene stedet vi med vilje bryter
skoleisolasjonen — den farligste avgjørelsen i kodebasen. Blandet inn her ville den fått
mindre oppmerksomhet enn den fortjener. Derfor står den i [ADR-0027](./0027-knuteloop-ansatt-plattformrolle.md).
