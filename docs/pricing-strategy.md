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

## 2027 — mål og posisjon (les dette først)

2027 er **ikke** et maksimer-inntekt-år. Målet er å (a) tjene nok til å holde bedriften i live og
finansiere videre bygging, og (b) **sette opp fremtiden**. Dette er ikke et get-rich-quick-prosjekt —
og det endrer hvordan du leser alle tallene under.

**Aktivumet du bygger i 2027 er ikke omsetning — det er installert base + kulturell posisjon + bevis:**

- **Underprisér skolebetalingen med vilje.** Trinn-modellen skal holde lyset på, ikke gi profitt —
  jobben dens i 2027 er *adopsjon*: flest mulig skoler inn i feed/handoff-funnelen. Hver skole er
  fremtidig sponsor-inventar.
- **Gjør 1–3 fyrtårn-sponsorater, ikke 20 desperate.** Én knallgod, over-levert og dokumentert
  case-study (Hekkan-typen) er verdt mer enn ti middels logoer — det er salgsressursen for 2028.
- **Sett listeprisen høyt selv om du rabatterer hardt.** «Stavanger eksklusiv = 45k list» i år én gjør
  at 2028 forhandles fra 45k, ikke fra din founding-rabatt. Du anker fremtiden.
- **Fler-årige founding-avtaler = vollgrav.** «Founding partner: 3 år til founding-pris, låser din
  eksklusive kategori» sikrer kontinuitet OG blokkerer konkurrenter fra å ta den kulturelle plassen
  før de finnes.

**2027-suksess = overlevelse + reinvestering + et par referanse-avtaler + voksende installert base.**
Ikke kroner på bunnlinjen. Tallene under er et *gulv for å holde liv i bedriften*, ikke målet.

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
| **Regional** ← 2027-fokus | Hekkan Burger i Nord-Norge | Hele den sosiale regionen | **skalerer med rekkevidde** (se under) |
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

### Regional pris skalerer med rekkevidde (ikke flat)

Flat «15–20k» er feil — det er *gulvet for en liten region*. Prisen må følge **hvor mange russ
regionen faktisk når**, fordi det er umulig å nå alle russ i et miljø billigere noe annet sted:

> **Regional sponsorpris ≈ russ i regionen × sats (kr/russ)**

- **Sats-anker:** å nå ~alle russ i Stor-Stavanger er verdt **godt over 20k** → gulvet er ~7 kr/russ,
  og med garantert, sosialt forsterket handling er reell verdi nærmere **~10–15 kr/russ**.
- **Oslo tar premium på toppen, ikke bare flere hoder** — å «eie» Oslo-miljøet er verdt mer *per russ*
  (størst scene, kjøpekraft, prestisje) enn en mindre by.

**Illustrerende stige (russ-tall = placeholder, Ludvig bekrefter):**

| Region | ~Russ | ~Pris/sponsor (10–15 kr/russ) |
|---|---|---|
| Liten by (Bodø/Ålesund) | ~1 200 | ~15–25k ← her passer gamle «15–20k» |
| Stor-Stavanger | ~3 000 | ~30–45k |
| Bergen / Trondheim | ~4 000 | ~40–60k |
| Oslo (+ Akershus) | ~15 000 | ~150–225k+ (premium) |

### Slik priser du eksklusivitet (uten sammenlignbare tall)

Du *beregner* ikke prisen på en immateriell kulturell posisjon — du *anker* den grovt og *oppdager*
den via første avtale. Tre verktøy:

1. **Gulvet (bevis-matte nedenfra):** kunder knuten skaper × verdi per kunde. Stavanger: ~750 fullført
   + ~250 WOM ≈ 1 000 unge kunder × ~35 kr = **~35k** (ignorerer gjenkjøp + WOM-glorie).
2. **Ankeret (nest-beste alternativ):** hva ville sponsoren ellers betalt for å nå samme russ?
   ~2–3 influencer-poster + en sampling-stunt = 35–55k for noe dårligere/ikke-eksklusivt → **~40–50k.**
3. **Oppdag (founding partner):** sett ambisiøs listepris, gi sponsor #1 stor founding-rabatt *mot*
   case-study + uttalelse + publiseringsrett. Første JA = din pris-referanse + ditt manglende datapunkt.

**Regler:** rabattér *prisen*, aldri *eksklusiviteten* (knappheten ER verdien). Anker høyt først, tre
nivåer så de velger midten. Som solo-gründer er failure mode å prise for lavt av nerver — bias høyt;
verste utfall av høy pris er at de forhandler (du lærer), verste av lav er at du forærer bort posisjonen.

**Start-rate-card — eksklusiv kategori-posisjon** (premium over reach-stigen over; russ-tall =
placeholder; founding partner betaler ~60 % av listepris år 1 mot case-study):

| Region | ~Russ | Listepris (eksklusiv/kategori) | Founding år 1 |
|---|---|---|---|
| Liten by (Bodø/Ålesund) | ~1 200 | ~18k | ~11k |
| Stor-Stavanger | ~3 000 | ~45k | ~27k |
| Bergen / Trondheim | ~4 000 | ~55k | ~33k |
| Oslo (+ Akershus) | ~15 000 | ~200k+ | forhandles |

### Modelleringsnyanse (ikke dobbelt-tell)

«5–7 sponsorer per skole-knuteliste» betyr *ikke* pris × sponsorer × skoler. En regional sponsor
**deles på alle skolene i regionen** — betalt én gang per region, fyller en slot på hver skole:

> **Regional sponsorinntekt ≈ (antall sosiale regioner) × (sponsorer per region) × pris**

Lokale enkeltskole-sponsorer (5k) kommer på toppen som ren upside — og den delen egner seg for
**revenue-share med russestyret** (de kjenner lokale bedrifter; gi dem en andel → selvskalerende salg).

---

## Del C — Inntekt og margin (30 / 50 / 100 skoler)

**Antakelser:** sosial region ≈ 10 skoler (forenkling — Oslo er større, flere er mindre; **dette er
den viktigste variabelen å kalibrere**). 5–7 regionale sponsorer per region. Trinn-snitt ~900 kr/skole
(base). Kost = infra + sesong-Vipps fra `cost-model.md`.

> ⚠️ **Tabellene under bruker fortsatt flat 15–20k per sponsor og undervurderer derfor store regioner
> grovt.** Reach-basert (10–15 kr/russ) er den riktige modellen — Oslo alene kan overgå hele
> sponsor-kolonnen. Regnes om når russ-per-region er satt (Del F). Tallene under er altså et
> *konservativt gulv*, ikke et tak.

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

## Del D2 — Rollout-plan 2027 (utførelse)

Prinsipp: **tetthet slår spredning.** En sponsor kjøper en *region*, ikke skoler — du kan ikke selge
«Stavanger eksklusiv» hvis du har 3 skoler i Stavanger og resten spredt utover. Én region du *eier*
er verdt mer enn 50 skoler sprinklet rundt. Så 2027 går i dybden, ikke bredden.

**Selg bredt, lever tett** — skill de to verbene:
- **Pitche** koster nesten ingenting og lærer deg pris + innvendinger + hvilke kategorier biter. Det
  ER «oppdag»-metoden i praksis. Pitch så mange regionale sponsorer du vil.
- **Signere/levere** krever at du faktisk dekker regionen. Selg ikke en region du ikke kan levere —
  en dårlig case-study er verre enn ingen.

**De fire stegene:**
1. **Vinn hjemmebanen helt først (Stor-Stavanger).** Der har du sosial kapital + en pilot-skole som
   elsker appen. Få flest mulig av Stavanger-skolene inn. Ikke rør andre regioner ennå.
2. **La funnelen gjøre spredningen gratis** — feed + handoff drar de neste skolene inn innad i
   regionen. (Denne delen kan gå mens du er i militæret.)
3. **Land 1–3 fyrtårn-sponsorer i regionen** — én per kategori (burger, gym, klær, mobil…), alle
   eksklusive. Founding-vilkår. Over-lever og dokumentér *alt* (fullførte, sitater, WOM).
4. **Gjør avtalen(e) om til 2028-maskinen** — case-study-en selger neste region og lar deg heve prisen.

**Tre vakter (der «å prøve gjør 0 skade» ikke helt stemmer):**
- Kategori-eksklusivitet er en engangsressurs per region — ikke brenn «Stavanger-burgeren» på et
  svakt/billig ja bare for å *ha* en sponsor.
- Ikke signér en region du ikke kan dekke ennå.
- Ikke desperat-rabattér overalt → da setter du et lavt anker overalt. Én velpriset founding slår fem billige.

Din knappe ressurs pre-militæret er **tiden din, ikke antall forsøk.** Founding-salget krever *deg*
personlig — gjør det i vinduet før tjenesten (28. juli) eller på perm. Alt annet skal være selvgående.

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
- [ ] **Russ per sosial region** — driver reach-basert pris direkte. Ludvig bekrefter (Stor-Stavanger,
      Oslo, Bergen, Trondheim, …).
- [ ] **Sats per russ (kr/russ)** — anker ~10–15 kr fra Stavanger-signalet; Oslo-premium på toppen.
- [ ] **Regional attach-rate** — hvor mange regionale sponsorer lukkes faktisk per region? (Salg,
      Ludvigs domene.)
- [ ] **Første regionale sponsor = ekte datapunkt.** Ett lukket salg slår hele denne tabellen.
- [ ] Lokal revenue-share med russestyret: prosent-splitt? (50/50 foreslått.)
- [ ] Trinn-fordelingen (konservativ/base/optimistisk) verifiseres mot flere skoler enn piloten.
- [ ] Nasjonalt nivå: hvilke bevis/flaks kreves før det er realistisk?

---

*Utkast 2026-07-07. Parkjøring Ludvig + Claude. Tall merket antatt skal ikke i bindende tilbud uten
ekte datapunkt. Kostnadssiden: `docs/cost-model.md`. Skala: ADR-0011. Inntektsmodell (trinn + sponsor): ADR-0020.*
