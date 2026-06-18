# Knute-scoring — rubrikk v1

> **Formål:** et regelbasert verktøy for å score hvilken som helst knute **0–100**, konsistent.
> Ikke maskinlæring — eksplisitte regler du kan lese og endre. Utledet fra de 51 kalibrerte
> knutene i `docs/library-seed-source.md`, så den er forankra i Ludvigs egne tall.
>
> **Bruk:** når Ludvig limer inn en stor bunke nye knuter uten poeng, bruk denne rubrikken til å
> foreslå poeng konsistent. Kjøres **offline ved kurering** (Ludvig / Claude) — det er ingen LLM
> eller scoring-tjeneste i selve appen, så ingen data-residency-implikasjon (ADR-0001).
> Lagret som referanse 2026-06-18 på Ludvigs forespørsel.

---

## Skala (0–100)
- **0** — bevisst null-vits (f.eks. Sølibat)
- **10–20** — trivielt, kjapt, lav innsats
- **20–45** — reell innsats/tid, en del klein, eller ett notabelt grep
- **45–65** — stort: høy klein m/ publikum, fysisk krevende, vanskelig å få til, ukeslangt
- **65–85** — ekstremt: alvorlig fysisk pine, hele-RT-forpliktelse, legendarisk offentlig stunt
- **85–100** — legendarisk: permanent, det villeste, det absurd-sjeldne

## Fremgangsmåte (score en knute)
1. **Finn hovedfaktoren.** Hva er den ENE tingen som gjør knuten stor — fysisk pine? klein foran folk? varighet? vanskelig/flaks? sjokk? Hovedfaktoren setter båndet, *ikke* gjennomsnittet. (Dette fikser det gamle problemet: en tatovering er stor *bare* pga. permanens, selv om alt annet er lavt.)
2. **Plasser i bånd** ut fra hovedfaktoren — bruk ankrene under.
3. **Finjuster** for sekundærfaktorer (de andre dimensjonene gir små dytt opp/ned).
4. **Modifikatorer** (kan overstyre båndet):
   - Permanens → 90–100
   - Hele russetiden (forpliktelse/avhold) → stort løft
   - Skaper russefølelse / bra feed-innhold → dytt opp (disse *vil* vi ha)
   - Meta-vits → overstyr til vitseverdien (korrupsjon høyt, sølibat 0)
5. **Gulv:** under 10 → løft over 10. Unntak: bevisste null-vitser.
6. **Flagg:** sex → `[ingen media]` · mindreårige → ut · reell fare/ulovlig → flagg, ikke bonus.

## Dimensjoner (hva som driver poeng)
- **Fysisk pine & innsats** — ubehag, spy, utholdenhet, grovhet. *Tungt vektet.*
- **Klein & eksponering** — flauhet × publikum × varig sosial konsekvens. Foran kantine/kinosal = mye. *Tungt vektet.*
- **Varighet** — øyeblikk → time → dag → uke → hele RT.
- **Vanskelighet & flaks** — ferdighet, lav suksessrate («ikke alle klarer den»), avhenger av andre / et øyeblikk / flaks.
- **Sjokk & gæren-faktor** — sjokkhumor, antisosialt, «orker du virkelig». Belønnes, ikke straffes.

## Ankre (referanse per bånd)
- **0:** Sølibat *(meta)*
- **10:** Bikkjå · **18:** Bunnjeger
- **25:** Bronsetråd · **32:** Narkis · **37:** Sekstisex
- **50:** Årets Ørekreft / Pisseren · **55:** Tørsteslukkeren
- **65:** Flyplass · **70:** Kong Lættis / Konglå
- **80:** Tissetrengt · **82:** Edru Russ · **83:** Mukbang
- **100:** Prime (tatovering) / Føderen
- *Meta:* Skål 67 (korrupsjon)

## Når du er usikker → flagg for menneske-vurdering
Reglene treffer de fleste knuter tett. To ting de *ikke* fanger helt:
- **Meta-vitser** (styre-humor — korrupsjon, sølibat). Marker som kandidat, la et menneske sette tallet.
- **Ren stemning / lokal kontekst** som ikke passer en dimensjon. Flagg heller enn å gjette.

## Eksempel (Mukbang → 83)
1. **Hovedfaktor:** fysisk pine (alle spydde) → høyt bånd (65–85).
2. **Bånd:** ~75.
3. **Finjuster:** koster ~500 kr + utholdenhet → opp.
4. **Modifikator:** skaper feed-innhold → liten dytt.
5. **Gulv:** n/a.  6. **Flagg:** ingen.
→ **83**.
