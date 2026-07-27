# Produktideer fra demo-eksperimentet (juli 2026)

Ludvig ga to modeller (Fable 5 + Opus) den samme åpne oppgaven: «lag en
fungerende Knuteloop-demo, ta egne produkt- og designvalg». Begge leverte mye
bra og mange små ideer vi ikke hadde tenkt på. Dette dokumentet **høster ideene
(ikke utseendet)** og legger dem fram som **valg Brage + Ludvig skal ta stilling
til**. Ingenting her er besluttet.

**Flagg:** ✅ passer rolig app · ⚠️ spenning, må avgjøres · ⛔ bryter linja / krever ADR

---

## 0. Kalibrering først — så vi ikke stjeler feil ting

- ⛔ **INGEN nedtelling til 17. mai.** Russefeiringen er flyttet — 17.mai-ankeret
  er utdatert. (Påvirker også «usage peaks in May» i `architecture.md` og
  eksamensro-notatet — Ludvig oppdaterer season-framingen når han er tilbake.)
- **Begge demoene er mørk neon-/TikTok-estetikk.** Vår identitet er «sticker»
  (varm krem, royalblå, gull — ADR-0017). Vi høster *interaksjoner og
  informasjonsarkitektur*, aldri skinnet.
- **Begge lener på feiringslaget** (konfetti, streak-flamme, «celebration»-
  overlay). ADR-0023 sier nei. Streaken vurderes separat i ADR-0024
  (metningskurve) — men flamme/burst-innpakningen er ute uansett.
- Fable ga ideene i en vanlig Claude-chat uten repo-tilgang, så den gjettet på
  navn/konvensjoner (kalte Brage «Konrad»). Ideene er gode; konteksten er vår.

---

## 1. Designprinsippet Ludvig likte — allerede skrevet inn

**«Ark for å se, side for å gjøre»** (peek-mønsteret) er nå et prinsipp i
`.claude/rules/frontend.md` §6. Kort: navigasjon er en forpliktelse, et ark oppå
er bare et blikk — du mister aldri stedet du sto, så nysgjerrighet blir gratis.

**Anvendelsespunkter å ta stilling til** (hvilke skal bli ark?):
- ✅ Topplisterad → ark: poeng + siste knuter
- ✅ Klasse på topplista → ark: medlemmene
- ✅ Sponset knute → ark: sponsorinfo før man åpner hele siden
- ✅ Varsler → ark over feeden i stedet for egen skjerm
- ⛔ «Utfordre»-knapp i topplista-arket = duell/PvP — finnes **ikke** i v2 og
  krever egen ADR (se `apps/api/CLAUDE.md`). Ikke bygg uten beslutning.

---

## 2. Ideer å ta stilling til

### Anbefaler å prototype (passer rolig app, lav risiko)

- ✅ **Tips per knute** *(Opus)* — hver knute har et lite, praktisk fullførings-
  hint («Start 05.15, turen tar 55 min opp»; «Baristaer er milde på tirsdager»).
  Lavmælt, inkluderende hjelp — treffer merkevaren perfekt. Ny idé, ikke i noen ADR.
- ✅ **«X har fullført» på hver knute** *(begge)* — rolig sosialt signal som
  hjelper deg velge neste knute, uten konkurransepress. Fin discovery-hjelp.
- ✅ **Vanskelighetsgrad synlig** *(Opus, prikker 1–3)* — vi har allerede feltet
  (`difficulty`: Lett/Medium/Hard/Valgfri). Dette er bare å *vise* det som prikker.
- ✅ **Knutesjef-kunngjøring festet i feeden** *(Opus `.pinned`)* — en kanal der
  knutesjefen kan si noe til hele kullet («nye knuter er lagt til», «husk fristen»).
  Enkel, nyttig, rolig.
- ✅ **Synlighetsbryter i innsending med klar forklaring** *(Opus)* — direkte
  nyttig referanse for issue #121 (del/privat). Toggle + én linje som forklarer
  hva «delt» betyr. ADR-0021/0022.
- ✅ **Kohort-identitet** *(Opus: «143 russ · 6 klasser», knutesjefens navn)* —
  liten «du hører til her»-følelse. Kan bo på hjem eller profil.

### Krever en beslutning (spenning mot linja, eller ny mekanikk)

- ⚠️ **Kryss-klasse-knuter** *(Opus: «minst to ulike klasser»)* — knuter som
  krever folk fra flere klasser. Fin for miljøet, men ny mekanikk (verifisering?).
  Produktvalg + evt. liten backend-utvidelse.
- ⚠️ **Dobbel-knuter der «begge må sende inn»** *(Fable)* — koordinert to-personers
  innsending. Vi har `dobbel`-mappa, men ikke «begge-må-levere»-logikken. Kul, men
  krever kobling mellom to innsendinger (backend).
- ⚠️ **Rangerings-delta (▲▼)** *(Opus)* — «du gikk opp 2 plasser». Motiverende,
  men grenser mot press/konkurransefokus. Ludvigs kall (calm app).
- ⚠️ **Sponsor «kvittering synlig» som verifisering** *(begge)* — konkret
  bevis-mekanikk for sponsor-knuter. Relevant for ADR-0020-inntektsmodellen;
  må sees i sammenheng med den (ikke bygg løsrevet).

### Passer ADR-0015 (aldersgating) — mønster verdt å huske

- ✅ **Låste kategorier vist som *låst*, ikke skjult** *(begge: «Alkohol/Sex —
  krever 18 år, låses opp av knutesjef, vises aldri i offentlig feed»)*. Vi vasket
  disse ut av biblioteket for App Store nå, men *mønsteret* — vise at noe finnes
  bak lås med tydelig begrunnelse — er en ren UX-løsning for aldersgating når/hvis
  de kommer tilbake.

### Unngå (bryter rolig app / feil retning)

- ⛔ Konfetti, «celebration»-fullskjerm, hjerte-eksplosjon, streak-flamme — ADR-0023.
- ⛔ Nedtelling til 17. mai — russefeiringen er flyttet.
- ⛔ Mørk neon-identitet — vi er «sticker» (ADR-0017).
- ⛔ Duell/«utfordre» — krever egen ADR før noe bygges.

---

## 3. Interaksjons-/IA-grep verdt å merke seg (ikke egne beslutninger)

- **Senter-FAB for «send inn»** *(Fable)* — gjør kamera-/innsendingsflyten til
  det mest fremtredende i tabbaren. «Kamera-app nummer to» (frontend.md §1).
- **Flerstegs innsending** *(Opus: velg knute → last opp → tekst → synlighet)* —
  rolig, tydelig steglinje. Referanse for submit-flyten.
- **Knute-detalj som «krav-sjekkliste + hvem har fullført (avatar-stack) +
  bevistype + tips»** *(begge)* — en rik, men rolig detaljside. Bra mønster for
  når dagens knute-kortet (#114) leder inn til detalj.
- **Responsiv desktop-layout med venstre-rail + høyre sidepanel** *(Opus)* — mest
  relevant om vi noen gang lager web; native mobil er fortsatt hovedsaken.

---

## 4. Hva Brage gjør med dette

Dette er **ikke** byggeoppgaver ennå — det er en meny. Se tracking-issuen
(«Produktideer fra demo-eksperimentet — ta stilling»): kommentér hvilke du synes
er verdt å prototype, og hvilke du er uenig i. De ✅-flaggede kan bli ekte issues
senere; ⚠️/⛔ venter på Ludvig (calm app, ADR-er, backend). Kvalitet og
sammenheng foran å presse inn flest features.

> Kilder: Fable 5-demo + Opus-demo (juli 2026-eksperimentet) + Fables chat-notat
> om peek-mønsteret. Begge demo-filene ble kuttet ved ~50k tegn da de ble limt
> inn — om Ludvig gir filstiene kan Claude lese den nederste halvdelen og utvide
> lista.
