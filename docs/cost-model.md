# Knuteloop — Kostmodell (ferske tall, juli 2026)

> **Formål:** gi prismodellen mot russestyrene et faktagrunnlag av *dagens* leverandørpriser,
> ikke mai-estimatene i `architecture.md` §5–6 (som er utdaterte — se «Avvik fra mai-planen»).
> Alle tall er hentet fra offisielle kilder 2026-07-03 av fire parallelle research-agenter,
> med kilde-URL og verifisert/uverifisert-flagg. Regnestykkene er kalibrert mot ekte v1-bruk
> (1 917 innsendinger på ~164 brukere ≈ **12 innsendinger per russ per sesong**).
>
> **Valutaantakelser (IKKE verifisert — oppdater ved bruk):** 1 EUR ≈ 11,7 NOK · 1 USD ≈ 10,5 NOK.
> Leverandørpriser er ekskl. mva; norsk mva/reverse charge kommer i tillegg der det gjelder.

---

## TL;DR

| | I dag (dev-auth, kun bilder) | Med Vipps Standard | Med Vipps Premium (18+-sjekk) |
|---|---|---|---|
| **Pilot, 1 skole (~250 russ)** | ~1 150 NOK/mnd | ~1 450 NOK/mnd | ~2 200–2 700 NOK/mnd |
| **10 skoler (~2 000 russ)** | ~2 000 NOK/mnd | ~2 800 NOK/mnd | ukjent (Premium-pris må innhentes) |
| **50 skoler (~10 000 russ)** | ~4 500 NOK/mnd | ~7 500 NOK/mnd | ukjent |

- **Per bruker:** ~4,6 NOK/mnd på pilot → ~0,75 NOK/mnd ved 50 skoler. Faller kraftig med skala (kostnadene er mest faste).
- **SLUTTPRODUKTET MED VIDEO (ADR-0019):** legg til ~150 NOK/mnd (pilot) → ~2 300 NOK/mnd i toppmåned (50 skoler). En video koster **~10 øre** å levere mot < 1 øre for et bilde (10–20×), men medie-kostnaden forblir en liten andel av totalen — **Vipps er fortsatt største post ved skala, ikke video.** Full utregning i §3.
- **Per innsending (marginal):** **under 1 øre for bilde, ~10 øre for video** (lagring + visninger). Knute-trinnene i prismodellen er altså ren margin — de skal prises på verdi, ikke kost.
- **Marginal kost per NY skole:** < ~50 NOK/sesong i infra. Gratis-bunnen (første 500 knuter) koster i praksis ingenting.
- **Største enkeltpost ved skala er Vipps Login** (3 000 NOK/mnd ved 10–50k brukere) — ikke serveren.
- **Skjult funn:** aldersverifisering (ADR-0015) via Vipps krever `birthDate`-scopet, som IKKE er i Standard-pakken → tvinger Premium (~1 000+ NOK/mnd, indikativt). Må avklares med Vipps salg FØR prismodellen låses.

---

## 1. Verifiserte leverandørpriser (juli 2026)

### Hetzner Cloud (API-server, Helsinki)

⚠️ **Hetzner økte prisene to ganger i 2026** (1. april og 15. juni) og døpte om planene:
CPX21/31/41 → **CPX22/32/42** i Tyskland/Finland. Nye priser gjelder nye bestillinger.

| Plan | Spec | Pris/mnd (ekskl. mva) | Status |
|---|---|---|---|
| CPX22 (pilot) | 3 vCPU, 4 GB | **€19,49** (før: €7,99) | verifisert |
| CPX32 (10 skoler) | 4 vCPU, 8 GB | **€35,49** (før: €13,99) | verifisert |
| CPX42 (50+ skoler) | 8 vCPU, 16 GB | **€69,49** (før: €25,49) | verifisert |
| LB11 load balancer | 5 tjenester | €7,49 | verifisert (sekundærkilder) |
| IPv4-adresse | | ~€0,50–0,71/mnd | delvis (timepris verifisert, månedstak spriker) |
| Inkludert trafikk | 20 TB/server | €1,00/TB over | verifisert |

Kilder: [docs.hetzner.com prisjustering](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), Northflank, Better Stack, costgoat.

### Aiven for PostgreSQL (database, Helsinki)

⚠️ **Aiven har lagt om plan-strukturen.** «Startup-2» (mai-planens ~€55/mnd) finnes ikke lenger.
Ny stige: Free → Developer → Hobbyist → Startup / Business / Premium.

| Plan | Pris/mnd | PITR-backup | Maks tilkoblinger | Status |
|---|---|---|---|---|
| Free | $0 | — (kan skrus av ved inaktivitet) | 20 | verifisert |
| Developer | fra $5 | — | — | verifisert |
| Hobbyist | ~$19 | **ingen** | 25 | delvis (tier verifisert, pris tredjepart) |
| **Startup (minste prod)** | **fra $75** | **2 dager** | 100 | verifisert |
| Business (HA) | fra $180 | 14 dager | 100–200 | verifisert |

- ⚠️ `architecture.md` sier «7-day PITR» — dagens Startup-tier gir bare **2 dager**.
- Hobbyist ($19) er OK for staging, **ikke** produksjon (ingen PITR).
- Benchmark: Scaleway Managed PG 2 vCPU/4 GB ≈ €31/mnd (billigere, men svakere tilbud rundt).

Kilder: [aiven.io/postgresql](https://aiven.io/postgresql), [pg-backups-doc](https://aiven.io/docs/products/postgresql/concepts/pg-backups), [connection-limits](https://aiven.io/docs/products/postgresql/reference/pg-connection-limits).

### Bunny.net (bildelagring + CDN) — UENDRET og billig ✅

| Post | Pris | Status |
|---|---|---|
| Lagring Standard (Frankfurt) | $0,01/GB/mnd | verifisert |
| CDN-båndbredde Europa (Standard) | $0,01/GB | verifisert |
| CDN Volume-nett (globalt) | $0,005/GB første 500 TB | verifisert |
| Minimum månedsbeløp | $1/mnd | verifisert |
| Bunny Stream (fremtidig video): lagring / levering | fra $0,01/GB/mnd / fra $0,005/GB (enkoding gratis) | verifisert |

Kilde: [bunny.net/pricing](https://bunny.net/pricing/).

### Vipps Login (fremtidig auth — parkert ~1 år, men prises her)

**Modell: fast månedspris i trinn etter aktive brukere (siste 12 mnd) — IKKE per innlogging.**
(Ble betaltjeneste 1. aug 2024.)

| Aktive brukere | Standard-pakke, NOK/mnd (ekskl. mva) | Status |
|---|---|---|
| 20 – 1 000 | **300** | verifisert |
| 1 001 – 10 000 | **750** | verifisert |
| 10 001 – 50 000 | **3 000** | verifisert |
| 50 001 – 100 000 | 6 375 | verifisert |

- Standard-pakken gir navn, telefon, e-post, adresse.
- 🚨 **`birthDate` (fødselsdato, verifisert mot Folkeregisteret) er IKKE med i Standard — krever Premium/Advanced.** Premium-pris er ikke publisert; 2024-indikasjon «fra 1 000 NOK/mnd» (Advanced «fra 6 000»). **Dette treffer ADR-0015 (aldersgating 18+) direkte → kontakt Vipps salg før prismodellen låses.**
- `nin`-scopet (fødselsnummer) er «Not available in Norway» via Login — ikke en vei rundt.
- Aldersgrense for Vipps Login er 15 år → OK for Vg3.

Kilder: [vippsmobilepay.com/nb-NO/login-pricing](https://vippsmobilepay.com/nb-NO/login-pricing), [Login API userinfo-docs](https://developer.vippsmobilepay.com/docs/APIs/login-api/api-guide/user-info/).

### Småposter

| Post | Pris | Status |
|---|---|---|
| Sentry (feilsporing) | **$0** (Developer-tier, 5k feil/mnd, EU-region gratis) | verifisert |
| Plausible (analyse, EU) | $9/mnd (10k sidevisn.) · ~$19/mnd (100k, uverifisert) | verifisert / delvis |
| Expo EAS (app-bygg) | $0 (15 bygg/plattform/mnd) · Starter $19/mnd ved behov | verifisert |
| Expo Push-varsler | **$0** (rate-limit ~600/s, ingen stykkpris) | verifisert |
| Apple Developer | $99/år | verifisert |
| Google Play | $25 engang | verifisert |
| .no-domene (Domeneshop) | 99 NOK år 1, 199 NOK/år videre | verifisert |

---

## 2. Scenario-regnestykker

Antakelser: 12 innsendinger/russ/sesong (v1-kalibrert), ~1 MB per bilde etter komprimering,
~250 visninger per bilde (skole-feed), miniatyrer ~200 KB via CDN. Kun bilder (video ikke bygget).

### Pilot — 1 skole, ~250 russ

| Post | NOK/mnd |
|---|---|
| Hetzner CPX22 + IPv4 | ~235 |
| Aiven Startup (minste prod, $75) | ~790 |
| Bunny (lagring + CDN, sesongsnitt) | ~25 |
| Plausible | ~95 |
| Sentry, EAS, push | 0 |
| **Sum uten Vipps** | **~1 150** |
| + Vipps Standard (≤1 000 brukere) | +300 → **~1 450** |
| + Vipps Premium i stedet (18+-sjekk, indikativt) | **~2 200–2 700** |

Årsposter i tillegg: Apple ~1 040 + domene 199 (+ Google 260 engang) ≈ **1 250 NOK/år**.

**Per bruker:** ~1 150 × 12 + 1 250 ≈ 15 050 NOK/år ÷ 250 ≈ **60 NOK/bruker/år** (~5 NOK/mnd).
*(Morsomt nok nesten identisk med mai-estimatet — Aiven ble dyrere, men resten billigere enn antatt.)*

### 10 skoler — ~2 000 russ

| Post | NOK/mnd |
|---|---|
| Hetzner CPX32 + IPv4 | ~420 |
| Aiven Startup ($75 — holder fortsatt: 100 tilkoblinger, DB-en lagrer nøkler, ikke bilder) | ~790 |
| Bunny (24k bilder/sesong ≈ 24 GB + ~2,4 TB CDN i toppmåned) | ~160 |
| Plausible (100k-tier) | ~200 |
| EAS Starter | ~200 |
| Sentry Team (ved behov) | ~275 |
| **Sum uten Vipps** | **~2 000** |
| + Vipps Standard (1 001–10 000) | +750 → **~2 800** |

**Per bruker: ~17 NOK/år** (~1,4 NOK/mnd). *(Valkey/Redis-cache fra mai-planen er ikke priset —
kan kjøres gratis på API-boksen ved denne skalaen; managed er et senere valg.)*

### 50 skoler — ~10 000 russ

| Post | NOK/mnd |
|---|---|
| Hetzner 2× CPX32 + LB11 + IPv4 | ~930 |
| Aiven Business (HA, fra $180) | ~1 890 |
| Bunny (120 GB lagring + ~12 TB CDN topp, Volume-nett) | ~500 |
| Plausible + EAS + Sentry (større tiers) | ~1 200 |
| **Sum uten Vipps** | **~4 500** |
| + Vipps Standard (10 001–50 000) | +3 000 → **~7 500** |

**Per bruker: ~9 NOK/år** (~0,75 NOK/mnd). **Merk: Vipps er nå største enkeltpost — større enn serveren.**

---

## 3. Video — sluttproduktet (ADR-0019)

Prismodellen mot styrene skal stå på **sluttproduktet**, der normale knuter kan sendes inn som
foto ELLER video. Regnet med Bunny Stream-prisene (verifisert §1): lagring fra $0,01/GB/mnd,
levering fra $0,005/GB, **enkoding gratis**. Video rører verken API-serveren (opplasting går
direkte til Bunny) eller databasen (lagrer bare nøkler) — det er en ren medie-kostnad.

**Forutsetninger (justerbare — dette er de usikre tallene, ikke prisene):**

| Antakelse | Verdi | Begrunnelse |
|---|---|---|
| Andel video av innsendinger | **40 %** | Russ elsker video; resten bilde/tekst |
| Størrelse per video (etter komprimering/cap) | **~15 MB** (15–30 s, ~720p) | ADR-0012s båndbredde-cap er designkravet |
| Lagret inkl. HLS-varianter | ~27 MB (×1,8) | Bunny Stream lager flere kvaliteter |
| Visninger per video (skole-feed) | ~250 | Samme som bilder |
| Levert per visning | ~8 MB | Blanding av delvise avspillinger + lavere kvalitet på mobil |

**Marginal per video-innsending: 250 visn. × 8 MB = 2 GB levert × $0,005 ≈ $0,01 ≈ 10 øre.**
(Bilde til sammenligning: < 1 øre. Video er altså 10–20× dyrere per innsending — men fortsatt øre.)

**Per sesong (12 innsendinger/russ, 40 % video):**

| Skala | Videoer/sesong | Levering/sesong | Lagring/mnd | Ekstra i TOPPMÅNED |
|---|---|---|---|---|
| Pilot (250 russ) | ~1 200 | ~2,4 TB ≈ 130 NOK | ~32 GB ≈ 3 NOK | **~+150 NOK/mnd** |
| 10 skoler (2 000) | ~9 600 | ~19 TB ≈ 1 000 NOK | ~260 GB ≈ 27 NOK | **~+500 NOK/mnd** |
| 50 skoler (10 000) | ~48 000 | ~96 TB ≈ 5 000 NOK | ~1,3 TB ≈ 140 NOK | **~+2 300 NOK/mnd** |

**Sluttprodukt-totaler (toppmåned, uten / med Vipps Standard):**

| Skala | Uten Vipps | Med Vipps Standard |
|---|---|---|
| Pilot | ~1 300 NOK/mnd | ~1 600 NOK/mnd |
| 10 skoler | ~2 500 NOK/mnd | ~3 300 NOK/mnd |
| 50 skoler | **~6 800 NOK/mnd** | **~9 800 NOK/mnd** |

**Per bruker endres nesten ikke:** video legger ~0,5 NOK/bruker/sesong på toppen (50 skoler:
5 000 NOK levering ÷ 10 000 russ). Sluttproduktet lander på **~10 NOK/bruker/år ved 50 skoler.**

**Følsomhet:** kostnaden er lineær i *visninger*. Ser en skole videoene 3× mer enn antatt,
tripler medie-posten (50 skoler: ~15 000 NOK/sesong — fortsatt håndterbart). Det er nøyaktig
derfor ADR-0012s cap (komprimering + maks lengde/størrelse) er et HARDT designkrav, ikke pynt.
Volume-nettet blir også billigere per GB ved høyt volum ($0,004 → $0,002).

---

## 4. Marginalkostnader (det prismodellen egentlig trenger)

| Hva | Marginal kost | Kommentar |
|---|---|---|
| **1 innsending (bilde)** | **< 1 øre** | ~1 MB lagring ($0,0001/år) + ~250 visninger à 200 KB CDN (~$0,0005) |
| **1 innsending (video)** | **~10 øre** | ~27 MB lagret + ~2 GB levert over 250 visninger (§3) |
| **500 innsendinger** (gratis-bunnen, 40 % video) | **< ~25 kr** | Gratis-tilbudet koster i praksis ingenting — også i sluttproduktet |
| **1 ny skole (200 russ, 2 400 innsendinger, 40 % video)** | **< ~150 NOK/sesong** | Bunny-andel + null Vipps-marginal (trinnpris) |
| **1 ny bruker** | **~0–4 NOK/år** | Til Vipps-trinnet bikker; da hopper det (f.eks. 750→3 000 ved bruker 10 001) |

**Implikasjon for prismodellen:** knute-trinnene (500–1000, 1000–1500 …) har ~null underliggende
kost — de er verdi-prising, som er poenget (suksessbasert prøveperiode). Det eneste kostnads-
*gulvet* per skole som betyr noe er andelen av faste kostnader + Vipps-trinnet. Selv konservativt
regnet dekker ~500–1 000 NOK/skole/sesong alt med god buffer ved 10+ skoler.

### Utenfor infra-modellen — andre reelle driftskostnader (Ludvigs liste, 2026-07-03)

Disse er ikke server-kostnader, men hører med i totalbildet før marginer regnes:

| Post | Grovt anslag | Kommentar |
|---|---|---|
| Claude-abonnement (utviklingsverktøy) | ~200–2 500 NOK/mnd | Avhengig av plan; reelt sett hoved-«utvikleren» |
| Juss (DPIA, brukervilkår, evt. advokattime) | engangs, ~0–30k | Kan gjøres billig; DPIA-mal finnes i docs/ |
| Vipps (Standard/Premium) | se §1 | Ludvig har dialog/kontroll på denne |
| Selskaps-admin (regnskap, AS, bank) | ~5–15k NOK/år | Ofte større enn serverne for småbedrifter |
| Moderering/support | tid, ikke penger | Vokser med skala; global feed er capped by design |

Selv med alt dette ligger totalkostnaden så lavt at sponsor-/styreinntekter gir svært gode
marginer — infra er aldri flaskehalsen i denne forretningsmodellen.

---

## 5. Avvik fra mai-planen (`architecture.md` §5–6) — det som var utdatert

1. **Hetzner:** to prisøkninger i 2026 + nye plan-navn. «CPX31 ~€18» er nå CPX32 **€35,49**.
2. **Aiven:** «Startup-2 ~€55 med 7-dagers PITR» finnes ikke. Minste prod-plan er **$75 med 2-dagers PITR**.
3. **Vipps:** var ikke priset i mai-planen i det hele tatt. Fast trinnpris (ikke per innlogging), og **aldersverifisering krever Premium** — en ukjent pris som må innhentes.
4. **Bunny + småposter:** mai-antakelsene holdt (Bunny uendret; Sentry/push gratis).

`architecture.md` §5–6 bør oppdateres ved neste anledning (egen PR — dette dokumentet er fasit inntil da).

---

## 6. Åpne punkter

- [ ] **Kontakt Vipps salg:** eksakt Premium-pris (birthDate-scope for 18+-gating, ADR-0015). Største ukjente i hele modellen. *(Ludvig: «har kontroll på Vipps».)*
- [ ] Verifiser valutakurser når prismodellen regnes om til endelige NOK-beløp.
- [ ] Aiven Helsinki-spesifikk pris («fra $75» er gulvpris; kalkulatoren er innloggingsgated).
- [ ] Video-antakelsene i §3 (andel video, størrelse, visninger) re-kalibreres mot ekte data når ADR-0019-pipelinen bygges. Prisene er verifiserte; antakelsene er estimater.
- [ ] Sentry månedspris (uten årsbinding) hvis månedlig ønskes.

---

*Generert 2026-07-03 fra fire parallelle research-agenter med kildeverifisering. Tall merket
«delvis/uverifisert» skal ikke brukes i bindende pristilbud uten ny sjekk.*
