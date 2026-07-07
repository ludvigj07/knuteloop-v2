# Knuteloop — Prisstrategi (utkast, juli 2026)

> **Formål:** samle prismodellen mot russestyrene (skolebetaling) OG mot sponsorer på ett sted,
> med inntekt/margin-scenarier ved 30 / 50 / 100 skoler. Kostnadsgrunnlaget ligger i
> `docs/cost-model.md` (leverandørpriser + infra per skala) — dette dokumentet er *inntektssiden*.
>
> **Status:** levende utkast. Trinn-modellen er låst. Sponsor-modellen har form men hviler på
> anslag — bare to tall er ekte data (se «Datagrunnlag»). Juster fritt.
>
> **Datagrunnlag (hva som er ekte vs. antatt):**
> - ✅ **Ekte:** piloten validerte skolebetaling (engangstall 3 500 kr dekket kost + innsats), og
>   nådde **2 400 innsendinger / ~164 russ ≈ 15 per russ**, 99,4 % godkjent.
> - ✅ **Ekte proxy for sponsorverdi:** v1-knuter som oppfordret til kjøp konverterte — «spis 2 is
>   i timen» fikk **65+ elever** til å kjøpe is (~30 % av skolen) fra én knute.
> - ⚠️ **Antatt:** all sponsor-prising, attach-rate, region-størrelse, og trinn-fordeling. Ingen
>   betalte sponsorer i v1. Tallene under er planleggingsestimater, ikke bindende tilbud.

---

## TL;DR

- **To inntektskilder:** (1) skolebetaling via **trinnvis modell 0–1 500 kr/sesong**, (2) **sponsorer**.
- **Skolebetalingen er i praksis et adopsjons-verktøy** — sponsor (spesielt regional) ER forretningen.
- **Marginalkost per innsending er ~0** (under 1 øre bilde), så både høyere trinn og hver sponsorkrone
  er tilnærmet ren margin.
- **Margin forbedres med skala** og ligger ~95 % når sponsor er med, fordi infra-gulvet deles på flere.
- **Fokus 2027 = regionale sponsorer.** Nasjonalt krever mer bevis + flaks → utsatt.

---

## Del A — Skolebetaling: den trinnvise modellen

Russestyret betaler etter **hvor mye skolen faktisk bruker appen**, målt i innsendinger per sesong.
Ikke flat pris (forkastet — se ADR-0011s 3 500 var et engangs kost-dekningstall, ikke go-forward).

**Fakturér på innsendinger, ikke bare godkjente:** på piloten ble 99,4 % godkjent, så forskjellen er
< 1 % og ikke verdt kompleksiteten.

| Trinn | Innsendinger/sesong | Pris | ≈ antall russ som har levert |
|---|---|---|---|
| **Gratis** | 0–500 | 0 kr | ~35 russ |
| **Trinn 1** | 501–1 500 | 500 kr | ~100 russ |
| **Trinn 2** | 1 501–3 000 | 1 000 kr | ~200 russ |
| **Trinn 3 (tak)** | 3 000+ | 1 500 kr | hele storskolen aktiv |

**Hvorfor bruddpunktene ligger her:**
- Gratis-taket (500) tømmes på under en uke av russetid — nok til at skolen ser verdien i feeden,
  langt fra en gratis sesong. Kroken, ikke gaven.
- Piloten (2 400 innsendinger, best-case engasjert skole) lander midt i **Trinn 2 → 1 000 kr**. En
  skole som lykkes like godt betaler mellomtrinnet, ikke taket. Riktig sted for best-case å lande.
- Hvert trinn utløses *etter* at verdien er levert — skolen vokser inn i nivået fordi den lykkes.

**Driftsregel:** aldri hard-stopp midt i russetid. Passerer en gratis-skole 500, fortsetter appen —
trinnet avregnes, det stenges ikke. En stopp midt i sesongen dreper feed-funnelen og goodwill.

---

## Del B — Sponsorer

### Hva sponsoren kjøper

Ikke visninger — **handling**. Russ møter fysisk opp / bruker produktet / poster det. Det er
performance-markedsføring mot en gruppe som er nesten umulig å nå ellers, og som bruker mye penger.

**Beviset (is-knuten):** én knute → 65+ kjøp. Det er salgsargumentet. Ingen flyer eller Insta-post
kommer i nærheten av garantert, sosialt forsterket handling.

**Rapportering:** sponsoren får en **aggregert sponsorrapport** (antall fullført + rekkevidde).
**Aldri per-bruker-data** — DPIA-kontrakt + hardt kodet (RLS + admin-endpoint). Se `security.md` §9.

### De tre nivåene (regional i fokus for 2027)

| Nivå | Eksempel | Rekkevidde | Pris/sesong |
|---|---|---|---|
| Lokal enkeltskole | Kebaben på hjørnet | 1 skole | ~5 000 kr |
| **Regional** ← 2027-fokus | Hekkan Burger i Nord-Norge | Hele den sosiale regionen | **~15 000–20 000 kr** |
| Nasjonal | Merkevare | Alle skoler | Større — utsatt (krever bevis + flaks) |

### «Region» = sosialt nedslagsfelt, ikke geografi

En region er **der russen faktisk henger sammen og drar på byen sammen** — ikke fylkesgrenser, ikke
et fast antall skoler. Dette er avgjørende for sponsorverdien:

- **Stor-Stavanger** = Stavanger + Sandnes + Nord-Jæren → én region (samme miljø, venner).
- **Oslo**, **Bergen**, **Trondheim** → hver sin egen.
- Oslo-russ og Stavanger-russ er *ikke* i samme krets → en regional sponsor kjøper **ett miljø**.

Fordi regionen = et vennenettverk, sprer is-knute-effekten seg gjennom venner. Sponsoren kjøper
**sosialt bevis i en hel krets**, ikke spredte visninger — derfor er 15–20k lett å forsvare.

> **Grove sosiale regioner i Norge (skoleantall må Ludvig fylle inn):** Oslo (+ Akershus-beltet),
> Bergen, Trondheim, Stor-Stavanger (Nord-Jæren), Kristiansand, Tromsø, Bodø, Ålesund, Drammen,
> Nedre Glomma (Fredrikstad/Sarpsborg). Oslo er stort; de fleste andre er mindre.

### Modelleringsnyanse (ikke dobbelt-tell)

«5–7 sponsorer per skole-knuteliste» betyr *ikke* pris × sponsorer × skoler. En regional sponsor
**deles på alle skolene i regionen** — betalt én gang per region, fyller en slot på hver skole:

> **Regional sponsorinntekt ≈ (antall sosiale regioner) × (sponsorer per region) × pris**

Lokale enkeltskole-sponsorer (5k) kommer på toppen som ren upside — og den delen egner seg for
**revenue-share med russestyret** (de kjenner lokale bedrifter; gi dem en andel → selvskalerende salg).

---

## Del C — Inntekt og margin (30 / 50 / 100 skoler)

**Antakelser:** sosial region ≈ 10 skoler (forenkling — Oslo er større, flere er mindre; **dette er
den viktigste variabelen å kalibrere**). 5–7 regionale sponsorer per region à 15–20k. Trinn-snitt
~900 kr/skole (base). Kost = infra + sesong-Vipps fra `cost-model.md`.

### Skolebetaling (base-fordeling, snitt ~900 kr/skole)

| Skoler | Inntekt |
|---|---|
| 30 | ~27 000 |
| 50 | ~45 000 |
| 100 | ~90 000 |

### Regional sponsor

| Skoler | Regioner | Konservativ (5×15k) | Base (6×17k) | Optimistisk (7×20k) |
|---|---|---|---|---|
| 30 | 3 | 225 000 | **~306 000** | 420 000 |
| 50 | 5 | 375 000 | **~510 000** | 700 000 |
| 100 | 10 | 750 000 | **~1 020 000** | 1 400 000 |

### Totalbilde (skole + regional sponsor base − kost)

| Skoler | Skole | Sponsor | Total inntekt | Kost | **Margin** |
|---|---|---|---|---|---|
| 30 | 27k | 306k | ~333k | ~16k | **~317k (95 %)** |
| 50 | 45k | 510k | ~555k | ~25k | **~530k (95 %)** |
| 100 | 90k | 1 020k | ~1,1M | ~34k | **~1,08M (96 %)** |

**Lokale enkeltskole-sponsorer (5k) er ikke med** — ren upside oppå dette.

---

## Del D — Forretningsmodellen i én setning

**Skolebetalingen (0–1 500) driver adopsjon → feeden + handoff-fila samler et engasjert publikum
billig → sponsorene (regionale) er de du selger den sosiale rekkevidden til, aggregert og etisk.**

Infra er aldri flaskehalsen (< 5 % av inntekt). Den reelle veksten er antall sosiale regioner du
lander, og hvor mange regionale sponsorer du lukker per region.

---

## Del E — Guardrails (ikke valgfritt)

- Brukere kan være 17. **Ingen alkohol-, tobakk-, snus- eller gambling-sponsorer.** Apple-regler +
  DPIA («no sponsors beyond aggregate analytics») setter gulvet. Sponsorkategorier whitelistes.
- **Aldri per-bruker-data til sponsor.** Kun aggregat. Kontraktsfestet + kodet.
- Sponsorknuter må fortsatt følge evidence/alder-reglene (ADR-0015/0019) som alle andre knuter.

---

## Del F — Åpne punkter (kalibrer før strategien låses)

- [ ] **Skoler per sosial region** — den viktigste variabelen. Ludvig fyller inn realistiske tall
      per region (Oslo vs. de mindre).
- [ ] **Regional attach-rate** — hvor mange regionale sponsorer lukkes faktisk per region? (Salg,
      Ludvigs domene.)
- [ ] **Første regionale sponsor = ekte datapunkt.** Ett lukket salg slår hele denne tabellen.
- [ ] Lokal revenue-share med russestyret: prosent-splitt? (50/50 foreslått.)
- [ ] Trinn-fordelingen (konservativ/base/optimistisk) verifiseres mot flere skoler enn piloten.
- [ ] Nasjonalt nivå: hvilke bevis/flaks kreves før det er realistisk?

---

*Utkast 2026-07-07. Parkjøring Ludvig + Claude. Tall merket antatt skal ikke i bindende tilbud uten
ekte datapunkt. Kostnadssiden: `docs/cost-model.md`. Skala/inntektslogikk: ADR-0011.*
