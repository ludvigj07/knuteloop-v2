# ADR-0027: Knuteloop-ansatt — plattformrolle med kryss-skole-tilgang

**Status:** Proposed
**Dato:** 2026-08-31
**Deciders:** Ludvig (+ Konrad som ingeniør-review, Claude som rådgiver)

> **Dette er den farligste avgjørelsen i kodebasen.** Den lager med vilje et hull i det
> eneste som hindrer at skoler ser hverandres data. Les hele før du sier ja.
>
> Forutsetter [ADR-0026](./0026-moderering-rapport-og-utestenging.md) (moderering).

## Kontekst

CLAUDE.md §9 sier det rett ut: *«Knuteloops trusselmodell er ikke ondsinnede hackere — det
er å lekke data mellom skoler ved uhell.»* Hele arkitekturen er bygget rundt at ingen
forespørsel kan se utenfor sin egen skole.

Men moderering (ADR-0026) trenger noen som kan handle **når knutesjefen ikke kan**:

- knutesjefen er selv den som er rapportert
- skolen har ingen aktiv knutesjef (ferie, verv ikke overlevert)
- saken er for alvorlig til at en medelev skal håndtere den (nakenhet, en mindreårig i fare)
- Apple forventer at **utvikleren** handler på rapporter — ikke at ansvaret er delegert
  til en 18-åring på skolen

Det finnes altså et reelt behov for en konto som ser på tvers av skoler.

### Fella som må unngås

Appen har allerede en rolle som heter `admin`
(`users.role: 'student' | 'knutesjef' | 'admin'`). Den **er ikke** en plattformrolle: i alle
ruter brukes den som `requireRole('knutesjef', 'admin')`, og den går gjennom
`tenantContext()` som alle andre. Det er en oppgradert knutesjef på **én** skole.

Hvis noen tar snarveien og lar `admin` hoppe over `tenantContext()`, blir **hver skoles
oppgraderte bruker** til en konto som ser alle skoler. Det er nøyaktig katastrofen
CLAUDE.md er skrevet for å hindre.

### Det som allerede finnes

Migrasjon `0000_roles_setup.sql` oppretter `admin_role NOLOGIN BYPASSRLS` og brukeren
`admin_user`. Mekanismen er altså planlagt fra dag én — den er bare aldri tatt i bruk fra
appen. `database.md` §8 beskriver den som «support / sponsor-report queries».

## Beslutning

### 1. Et nytt, atskilt begrep — ikke en utvidelse av `admin`

Plattformstatus lagres i en egen tabell `platform_staff` (`user_id`, `level`, `created_by`,
tidsstempler), **ikke** som en ny verdi i `users.role`-enumen.

Begrunnelse: `role` bæres i JWT-en og er skole-scopet av natur. Legger vi
`'knuteloop_staff'` inn der, inviterer vi til `requireRole('admin', 'knuteloop_staff')`
strødd rundt i vanlige ruter — og da er hullet laget ved et uhell. En egen tabell tvinger
fram et eksplisitt oppslag.

### 2. Eget rutetre som aldri bruker `tenantContext()`

Alt plattformarbeid ligger under `/api/platform/*`. Det rutetreet monterer **aldri**
`tenantContext()`, fordi det middleware-et krever en `schoolId` og setter `app.school_id`.

I stedet et nytt middleware `platformStaff()` som:

1. verifiserer plattform-claimet i tokenet,
2. **slår opp i `platform_staff` på nytt i databasen** — tokenet alene er ikke nok,
   så en fjernet ansatt mister tilgang med én gang, ikke når tokenet utløper,
3. bruker en **egen databaseklient** som kobler til som `admin_user` (`admin_role`,
   BYPASSRLS) — den vanlige `db`-klienten kobler som `app_user` og skal fortsette med det.

Punkt 3 er en konkret arkitekturkonsekvens: kodebasen får to databaseklienter, og den
privilegerte må være umulig å importere fra en vanlig rute. Det finnes allerede en
lint-vakt for et beslektet problem (`lint-guardrails.test.ts` hindrer at ruter importerer
`db/client` direkte) — samme mønster utvides hit.

### 3. Tilgangen er **rapport-scopet**, ikke gudemodus

Dette er den viktigste begrensningen. En Knuteloop-ansatt kan:

- se modereringskøen på tvers av skoler
- åpne **den ene innsendingen en rapport peker på**
- fjerne den, og utestenge brukeren

En Knuteloop-ansatt kan **ikke** bla i feeden til en skole, lese innsendinger uten en
tilknyttet rapport, se topplister, eller eksportere skoledata.

Vi bygger altså ikke et adminpanel som ser alt. Vi bygger «handle på denne rapporten»,
og den henter nøyaktig den ene raden det gjelder. Blast-radiusen ved en feil blir da
én innsending, ikke en hel skole.

### 4. Alt logges

Ny tabell `audit_log` — **ikke** skole-scopet (den spenner på tvers per definisjon),
append-only, skrivbar kun for `admin_role`.

Kolonner: `actor_user_id`, `action`, `target_type`, `target_id`, `school_id` (hvilken skole
ble berørt), `metadata` (jsonb), `request_id`, `created_at`.

**Hvert eneste kryss-skole-oppslag skriver en rad.** Ikke bare skrivinger — også lesinger.
Uten det har vi ingen måte å svare på «hvem så på hva» hvis noen spør, og det spørsmålet
kommer fra Datatilsynet, ikke fra oss.

### 5. Egen innloggingsvei

Ansatte logger ikke inn via Vipps-som-russ (ADR-0016). Kontoene opprettes manuelt, og
plattformtilgang gis manuelt av Ludvig. Ingen selvbetjening.

### 6. Verktøyene bor i appen som finnes — ikke i en egen nettside

**Ludvig avgjorde 2026-09-02.** Ansatt-verktøyene ligger som en skjult del av Knuteloop,
synlig kun for kontoer med plattformstatus. Ingen egen `admin.knuteloop.no`.

Begrunnelse: antall ansatte i 2027 er to–tre personer. En egen nettside med egen
innlogging, eget bygg og egen utrulling er mye maskineri for så få brukere, og
vedlikeholdet faller på et team som allerede er tynt.

**Prisen vi betaler:** koden for ansatt-verktøyene ligger på hver installerte telefon.
En egen nettside ville holdt den unna enheter helt. Vi aksepterer det fordi tiltakene
under gjør den skjulte skjermen verdiløs for en angriper.

**Den skjulte skjermen er IKKE sikkerheten.** Den er bekvemmelighet. Uten dette skillet
arver vi ulempen ved å ligge i appen uten å få fordelen ved en egen nettside. Konkret:

- **Serveren avgjør alt.** At appen skjuler en skjerm betyr ingenting. Hvert
  plattform-endepunkt verifiserer selvstendig, ved hver forespørsel, mot
  `platform_staff` i databasen (punkt 2). En som pakker opp appen og låser opp skjermen
  får 403 på alt.
- **Ingen kryss-skole-data når appen** uten at serveren allerede har bestemt å sende den.
  Klienten kan ikke be om mer enn rollen tillater.
- **Steg opp før farlige handlinger.** Fordelen en egen nettside ville gitt — strengere
  innlogging for ansatte uten å plage elevene — hentes delvis inn ved å kreve
  reautentisering før kryss-skole-handlinger.
- **Lastes separat.** Ansatt-skjermene lastes dynamisk, ikke i hovedbunten
  (`frontend.md` §10 beskriver allerede mønsteret for admin-skjermer).

**Revurderes hvis** antallet ansatte vokser vesentlig (f.eks. en moderator per region),
eller hvis en sikkerhetsgjennomgang finner at klientflaten er vanskelig å gjerde inn.
Da er en egen nettside riktig, og denne ADR-en superseders.

### 7. Formen er en kø, ikke et dashboard

Ansattflaten viser **saker som venter på deg**, aldri fritt søk i skoler, brukere eller
innsendinger. Måltilstanden er at den oftest sier «ingenting trenger deg».

Dette er en sikkerhetsavgjørelse forkledd som en designavgjørelse. En flate der man kan
bla fritt har et lekkasjepunkt på hver skjerm. En kø har det ikke, fordi ingenting vises
uten at en konkret sak dro det inn — noe som gjør den rapport-scopede tilgangen i punkt 3
til en egenskap ved formen, ikke noe som må håndheves med disiplin.

To regler som følger av det:

- **«Hvorfor ser eg dette?»** Alt kryss-skole-innhold på skjermen må kunne spores til en
  sak-ID. Finnes ingen sak, finnes ingen skjerm som viser det.
- **Begrunnelser er valg, ikke fritekst.** Hver handling plukker fra en fast liste, og
  lista genererer beskjeden til den som rammes. Krever vi prosa hver gang, blir det ikke
  gjort — og da faller den juridiske dokumentasjonen sammen.

Det passer også hvordan Ludvig faktisk jobber: tjue minutter av gangen, ofte i tjeneste.
En kø kan tømmes på tjue minutter; et dashboard må utforskes, og blir derfor aldri gjort.

## Alternativer vurdert

- **Utvid `admin`-rollen.** Avvist — det er fella beskrevet over: hver skoles oppgraderte
  bruker ville blitt en kryss-skole-konto.
- **Egen admin-nettside (`admin.knuteloop.no`).** Foreslått av en ekstern research-rapport.
  Reelt bedre på ett punkt: ansatt-koden hadde aldri havnet på elevenes telefoner, og
  sterkere innlogging for ansatte hadde vært gratis. Avvist for v1 (punkt 6) fordi det er
  et eget bygg, egen utrulling og egen innlogging for to–tre brukere. Dette er den svakeste
  avvisningen i denne ADR-en — se punkt 6 for når den skal revurderes.
- **Fullt dashboard med fritt søk over skoler og brukere.** Avvist (punkt 7): hver
  bla-skjerm er et lekkasjepunkt, og en flate som må utforskes blir aldri brukt av noen
  med tjue minutter av gangen.
- **Gi ansatte medlemskap i hver skole.** Da beholdes RLS urørt. Avvist: skalerer ikke til
  100+ skoler, og det slår beina under hastesaker — man må være medlem *før* problemet
  oppstår, og problemet oppstår typisk på en skole man ikke tenkte på.
- **Ingen plattformrolle — la knutesjefen håndtere alt.** Avvist: knutesjefen kan selv være
  problemet, kan være borte, og Apple forventer at utvikleren handler.
- **Full BYPASSRLS-tilgang med et generelt adminpanel.** Avvist: for stor blast-radius.
  Rapport-scopet tilgang (punkt 3) gir samme evne til å løse saken, med brøkdelen av risikoen.
- **Skille ut moderering i en egen tjeneste.** Avvist: mikrotjenester er en skatt vi ikke
  betaler (`architecture.md` §7), og det flytter problemet uten å løse det.

## Konsekvenser

### Bra
- Moderering blir troverdig — det finnes faktisk noen som kan handle.
- Mekanismen (`admin_role`) finnes allerede; vi tar den i bruk bevisst i stedet for at noen
  improviserer den senere under tidspress.
- Revisjonsloggen gjør oss i stand til å svare Datatilsynet.
- Rapport-scopet tilgang gjør at et uhell koster én rad, ikke en skole.

### Vondt / avveininger vi tar
- **Det finnes nå en bevisst RLS-omgåelse i kodebasen.** RLS beskytter ikke lenger
  plattformrutene — applikasjonskoden er eneste vakt der. Det krever disiplin for alltid.
- Hver nye `/api/platform/*`-rute er en potensiell lekkasje og må reviewes deretter.
- To databaseklienter er mer å holde styr på.
- `audit_log` vokser, og trenger egen oppbevaringspolicy.

### Nøytralt
- Dette er samme sømmen som en framtidig global feed vil trenge (den kuraterte visningen
  på tvers av skoler). Bygges den her ordentlig, arves den — men global feed er en egen
  ADR og skal ikke gjenbruke denne uten en ny vurdering.

## Åpne spørsmål

- **Tofaktor for ansattkontoer?** (Anbefaling: ja, men det er en avhengighet til auth-arbeidet.)
- ~~**Hvor mange ansatte** skal ha dette i 2027?~~ **Avklart 2026-09-02: tre.**
  Det bekrefter premisset for punkt 6 — tre bærer valget om å la verktøyene bo i appen.
  Utløseren for å revurdere står fast: vokser tallet vesentlig (f.eks. en moderator per
  region), skal egen nettside opp igjen. Hvem de tre er, er en provisjoneringsdetalj og
  ingen designforutsetning; kontoene opprettes uansett manuelt (punkt 5).
- **Oppbevaringstid på `audit_log`** — hvor lenge, og hva sier GDPR-minimering her?
- **Trenger vi et «bryt glasset»-nivå** over det rapport-scopede (f.eks. politiforespørsel),
  eller håndteres det manuelt i databasen med `admin_user`?
- **Varsling:** hvordan får en ansatt beskjed om en `nudity`/`safety_risk`-rapport
  (ADR-0026 punkt 3) — e-post, push, eller bare kø?
