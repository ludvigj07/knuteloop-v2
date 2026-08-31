# Moderering i Knuteloop — spesifikasjon

> Skrevet 2026-08-31, fra repoet og opp. Alle påstander om dagens tilstand er
> verifisert mot `main` (commit `e1e9659`), ikke antatt.
>
> Erstatter en ekstern research-rapport som aldri leste repoet. Det den hadde rett i
> er tatt vare på her; det den bommet på står forklart i §7, så ingen henter det inn igjen.
>
> Hører sammen med [ADR-0026](./adr/0026-moderering-rapport-og-utestenging.md) (rapport +
> utestenging) og [ADR-0027](./adr/0027-knuteloop-ansatt-plattformrolle.md) (kryss-skole-tilgang).
> Begge er Proposed. Ingenting her bygges før de er Accepted.

---

## 1. Den viktigste innsikten: halve jobben er allerede gjort

**Knuteloop har allerede forhåndsgodkjenning, og det er hele sikkerhetsmodellen.**

Verifisert i `routes/feed.ts`: feeden henter kun innsendinger med `status = 'approved'`.
En innsending starter som `pending` og er usynlig for alle andre til knutesjefen har
godkjent den.

Konsekvensen er stor og lett å undervurdere:

- Det finnes **ingen** vei for upassende innhold ut i feeden uten at et menneske har
  sett på det først.
- Apples krav om å handle på rapporter innen 24 timer gjelder innhold som allerede er
  publisert. Hos oss er effektiv responstid i praksis null, fordi ingenting publiseres
  uten godkjenning.
- Automatisk skjuling, hastekøer og sanntidsvarsling — som en generisk moderasjonsplan
  bruker mest plass på — er derfor **mye mindre kritisk** her enn i en app der brukere
  publiserer direkte.

Det som mangler er ikke et forsvarsverk. Det er **de manglende brikkene rundt** en
modell som allerede er riktig.

## 2. Hva som faktisk mangler

Verifisert fravær på `main`:

| Mangler | Verifisert hvordan |
|---|---|
| Rapportknapp / rapport-tabell | Ingen treff på `report` i `db/schema/` |
| Utestenging | Ingen treff på `ban` i `db/schema/` |
| Revisjonslogg | `audit_log` finnes ikke |
| Begrunnelse til den som rammes | Ingen tabell, ingen felt |
| Knuteloop-ansatt-rolle | `users.role` er `student`/`knutesjef`/`admin` — alle skole-scopet |
| Ekte innlogging | Ingen `routes/auth.ts`; auth er en dev-stub |

Ni skjema-filer finnes: `schools`, `users`, `knuter`, `submissions`, `knute-folders`,
`school-classes`, `school-library-imports`, `library`, `index`. Ingen av dem rører moderering.

## 3. Hva som faktisk kreves av oss

Tre kilder, og de krever ikke det samme.

**Apple, retningslinje 1.2 (brukergenerert innhold).** Krever en rapporteringsmekanisme
i appen, mulighet til å blokkere brukere, filtrering av upassende innhold, publisert
kontaktinfo, og at utvikleren handler på rapporter. Dette er en **innsendingsblokker** —
appen blir avvist uten.

**Apple 1.4.3 og 1.4.5 — den underkjente risikoen.** 1.4.3 forbyr å oppmuntre til mye
alkohol, tobakk og narkotika. 1.4.5 forbyr apper som oppfordrer til aktiviteter
(«bets, challenges») som kan gi fysisk skade.

Knuteloop er bokstavelig talt en challenge-app. **Dette er trolig en større
App Store-risiko enn selve moderasjonsapparatet**, og den løses i innholdet, ikke i kode.
Ryddejobben 2026-07-24 gjorde allerede mye av den: 75 knuter fjernet (21 Sex, 23 Alkohol,
~10 tobakk/snus/narkotika, resten vold/mobbing/nakenbilder av mulige mindreårige).
Se [app-store-content-review.md](./app-store-content-review.md).

**Norsk rett.** Ehandelsloven §§ 16–18 gir ansvarsfrihet så lenge ulovlig innhold fjernes
uten ugrunnet opphold etter at vi får kunnskap om det. Forhåndsgodkjenning oppfyller
dette med god margin. DSA er ikke gjennomført i norsk rett ennå, men grunnpliktene
(kontaktpunkt, rapportbehandling, begrunnelse til den som rammes) er billige å bygge inn
nå og dyre å ettermontere.

> **Forbehold:** de juridiske referansene her stammer fra en ekstern rapport og er ikke
> uavhengig verifisert mot Lovdata i denne runden. Behandle dem som retning, ikke som
> juridisk råd. Den formelle vurderingen er advokatens.

## 4. Hva som skal bygges, rangert

**Blokkerer innsending til App Store:**

1. **Rapportknapp i appen** med et lite sett grunner, og en rapport-tabell bak.
2. **Blokkér bruker** — utestenging fra feed eller innsending, med varighet.
3. **Begrunnelse til den som rammes.** Når noe avvises eller noen utestenges, skal
   personen få vite hva og hvorfor. Ett sett felter, lagret sammen med handlingen.
4. **Publisert kontaktinfo** i appen.

**Blokkerer ikke, men bør komme tidlig:**

5. Eskaleringsvei til Knuteloop-ansatt (ADR-0027) — for når knutesjefen selv er
   problemet, er borte, eller saken er for alvorlig for en medelev.
6. Revisjonslogg for kryss-skole-oppslag.

**Ikke nå:**

7. Automatisk bildeklassifisering, tekstmoderering, duplikatdeteksjon. Med
   forhåndsgodkjenning ser et menneske uansett alt før publisering, så gevinsten er
   prioritering av kø — ikke sikkerhet. Vurder når køen faktisk gjør vondt.
8. Eget admin-webpanel som egen app. Vurder når knutesjefene sier at dagens flate ikke
   holder, ikke før.

## 5. Datamodell

Konvensjoner hentet fra repoet, ikke oppfunnet:

- Tenant-nøkkelen er **`app.school_id`**, ikke `app.current_school_id`. Policy-formen som
  brukes overalt er `school_id = NULLIF(current_setting('app.school_id', true), '')::uuid`.
- DB-rollene som finnes er `app_role`/`app_user` og `admin_role`/`admin_user`
  (migrasjon `0000_roles_setup.sql`). `admin_role` har allerede `BYPASSRLS`.
  Det finnes ingen `app_migrator`.
- Alle skole-tabeller: `school_id`, `.enableRLS()`, policy, egen
  `FORCE ROW LEVEL SECURITY`-migrasjon, og sammensatt indeks som starter på `school_id`.

Tabellene er spesifisert i ADR-0026 og ADR-0027 og gjentas ikke her.

To detaljer verdt å merke seg fra dagens skjema:

- `submissions.imageKey` er **nullable** — tekst-bevis har ingen media (ADR-0019).
- `submissions` har allerede `visibility` (`shared`/`private`) og `sharedAt`
  (ADR-0021/0022). **Å skjule noe fra feeden trenger derfor ikke et nytt felt** —
  mekanismen finnes.

## 6. Én åpen uenighet, ærlig notert

ADR-0027 (mitt utkast) foreslår at plattformruter kobler til databasen som `admin_role`,
altså med `BYPASSRLS`.

Den eksterne rapporten argumenterer for noe annet: behold `BYPASSRLS` kun for migrasjoner,
og gi i stedet admin-lesing gjennom en **policy-gren** på en sesjonsvariabel:

```sql
USING (
  school_id = NULLIF(current_setting('app.school_id', true), '')::uuid
  OR current_setting('app.admin_read', true) = 'true'
)
```

Begrunnelsen er god: `BYPASSRLS` er alt-eller-ingenting og gjør revisjon vanskeligere,
mens en policy-gren tvinger hver kryss-skole-lesing gjennom en eksplisitt bryter som kan
logges på ett sted.

**Eg vet ikke sikkert hvilken som er riktig.** Dette er en reell ingeniøravgjørelse med to
forsvarlige svar, og den bør tas av Konrad — ikke av meg, og ikke av Ludvig. Den er notert
som et åpent spørsmål i ADR-0027.

## 7. Hva som bevisst ikke er tatt med

Den eksterne rapporten foreslo følgende. Hvert punkt er avvist mot verifisert
repo-tilstand, så ingen henter dem inn igjen ved et uhell.

| Forslag | Hvorfor ikke |
|---|---|
| Sett appen til **18+** og krev BankID-18 først i onboarding | Kolliderer med **ADR-0015 (Accepted)**, som eksplisitt avviser «blanket 18+ app» fordi den utelukker 17-åringene. Modellen er alder **per knute** (`min_age` 17/18) mot `users.is_adult`. |
| Roller `public` / `russ` / `knutesjef` / `global_moderator` | Faktisk enum er `student`/`knutesjef`/`admin`. Ingen `public`. ADR-0027 argumenterer dessuten for at ansatt-status IKKE skal være en rolleverdi. |
| Hard-filter mot Alkohol/Sex i nasjonal feed; «Sex-kategori uten media» | Begge mappene ble slettet 2026-07-24. Verifisert: **0** slike knuter i seed-dataene. Enum-verdiene henger igjen i `knuter.category`, men er tomme, og kolonnen er slatet for fjerning (ADR-0014). |
| Nasjonal kuratert feed som premiss i tillatelsesmatrisen | Funksjonen finnes ikke og har ingen ADR. Å designe rettighetsmodellen rundt den nå er å bygge for noe uavklart. |
| `evidence_ladder`, `is_sensitive` | Finnes ikke. Faktisk felt er `evidence_type` (`media`/`text`). |
| `users.vipps_subject` | Finnes ikke. Det finnes ingen innlogging i det hele tatt ennå. |
| `submissions.media_ref` | Heter `imageKey`, og er nullable. |
| Video ≤ 30s / 720p via Bunny Stream | Video-pipelinen er ikke bygget, og CLAUDE.md regel 11 forbyr å bygge den uten eksplisitt OK. Bunny er fortsatt en TODO i `lib/storage.ts`; dev bruker lokal driver. |
| `app_migrator`-rolle | Finnes ikke. Se §5. |
| Selvhostede modeller (NSFW, NB-BERT, PDQ), hash-kjedet logg, passkeys, eget flagg-system | Ikke feil, men lett et halvår med arbeid. Teamet er én deltidsingeniør. Se §4 punkt 7–8. |

## 8. En ting rapporten ikke oppdaget

`tenantContext()` åpner en databasetransaksjon og holder den gjennom **hele**
forespørselen (`await next()` ligger inne i `db.transaction(...)`), mens `db/client.ts`
setter `max: 10`.

Taket er dermed ti samtidige innloggede forespørsler. Det er ikke et modereringsproblem,
men det er et lanseringsproblem, og enhver plan som legger flere ruter oppå dagens
middleware arver det. ADR-0011 lister det allerede som et hardt krav før 2027.
