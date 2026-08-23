# Knuteloop V1 — Detaljspesifikasjon (følelsen)

> **`v1-spec.md` er kontrakten for REGLENE. Denne er kontrakten for FØLELSEN.**
>
> V1 føltes gjennomført. Det var ikke tilfeldig — det var ~40 små avgjørelser
> med tall som ble tunet mot ekte russ gjennom en hel sesong. Tallene her er
> **hentet direkte fra V1-kildekoden**, ikke gjettet.
>
> Kilde: `ludvigj07/knuteloop.no` — `frontend/App.css` (14 538 linjer),
> `styles/mobile-polish.css`, `pages/FeedPageV2.jsx` (2 547 linjer),
> `pages/KnotsPage.jsx`, `components/SwipeTabsShell.jsx`,
> `components/PhotoZoomViewer.jsx`, `App.jsx`, `data/appHelpers.js`.
>
> Uttrukket **2026-08-23**.
>
> **Når du bygger en V2-skjerm: les denne først.** Et tall herfra slår et tall
> du finner på, fordi dette er allerede testet på 200 russ.

---

## 0. Hvordan lese dette

- **✅ Lån direkte** — tallet/regelen overføres som den er.
- **🔁 Lån, men tilpass** — ideen holder, implementasjonen må endres for React Native.
- **⚠️ Lån, men fiks først** — bryter en V2-ADR i sin nåværende form.
- **❌ Ikke lån** — forbudt i V2.

---

## 1. Sveip mellom faner

**Kilde:** `components/SwipeTabsShell.jsx`

Ikke «sveip», men seks separate avgjørelser som til sammen gir følelsen.

| Konstant | Verdi | Hvorfor |
|---|---|---|
| `SETTLE_TRANSITION` | `transform 280ms cubic-bezier(0.22, 1, 0.36, 1)` | V1-kommentaren: *«easeOutQuint — snappy start, soft landing (Insta/TikTok feel)»* |
| `VELOCITY_WINDOW_MS` | **80** | Farten er et snitt over siste 80ms, ikke siste målepunkt. V1-kommentaren: *«much less noisy ... så flicks registrerer pålitelig»* |
| `SWIPE_THRESHOLD_RATIO` | **0.13** | 13 % av bredden er nok til å bytte side |
| `SWIPE_VELOCITY_THRESHOLD` | **0.3** px/ms | Alternativ vei: dra kort, men fort |
| `EDGE_RESISTANCE` | **0.32** | Gummistrikk forbi første/siste fane. Du *føler* at det er slutt |
| `MOBILE_BREAKPOINT` | **900** px | Over dette: ingen sveip, vanlig navigasjon |

**Haptikk gradert etter utfall** (`navigator.vibrate` i V1):

| Handling | ms |
|---|---|
| Trykk på fanen du allerede står på | **8** |
| Bytt fane ved trykk | **10** |
| Bytt fane ved sveip | **12** |

Ingen legger bevisst merke til forskjellen. Alle merker at det stemmer.

**Tre implementasjonsregler som gjorde det jevnt:**

1. **Ingen React-render under draget.** Transform skrives rett til DOM:
   `track.style.transform = translate3d(...)`. V1-kommentar: *«zero React
   re-renders during drag»*.
2. **`touch-action: pan-y`** på viewporten → nettleseren håndterer vertikal
   scroll på compositor-tråden uten å vente på JS. Fjerner hakking.
3. **Animer FØR state oppdateres**, også ved vanlig fane-trykk. V1-kommentar:
   *«keeps tab clicks feeling smooth instead of snapping instantly»*.

> 🔁 **V2:** `react-native-pager-view` gir mekanikken. Tallene over er det som
> er verdt å kopiere — de finnes ikke i noe bibliotek.
> Haptikk via `expo-haptics`: 8/10/12ms ≈ `selection` / `light` / `medium`.

---

## 2. Trykk-feedback

**Kilde:** `App.css` «Universal button ripple» + `mobile-polish.css` §6, §12

| Detalj | Verdi |
|---|---|
| Skalering ved trykk | `scale(0.97)` |
| Ripple-ring | `::after`, 6px sirkel, `border: 2px solid currentColor`, vokser ut ved `:active` |
| Opt-out | `.no-ripple`-klasse — for knappene der det ble feil |
| Touch-fallback | `@media (hover: none) { button:active { opacity: 0.85 } }` |

**Og den viktigste:** hover slås AV på touch-enheter.

```css
@media (hover: none) {
  .sticker:hover, .nav-button:hover, .action-button:hover {
    transform: none !important;
  }
}
```

Uten denne henger knappen igjen i hover-tilstand etter et trykk på mobil.
Klassisk feil, sjelden fikset.

> ✅ **V2:** `Pressable`-primitiven har skaleringen. Ripple-ringen og
> hover-avslåingen mangler. (RN har ikke `:hover` på touch, men Expo **web**
> har det — og Ludvig tester på web.)

---

## 3. Trykkflater og mobil-lesbarhet

**Kilde:** `styles/mobile-polish.css` — en egen fil på 12 punkter, skrevet
**kun** for 360–414px viewports.

| Regel | Verdi | Hvorfor |
|---|---|---|
| Minimum trykkflate | **44×44px** | Apple HIG |
| Usynlig hit-area for små ikoner | `::after { inset: -16.5px }` | Ser liten ut, treffer stort |
| Input-fontstørrelse | `max(16px, 1rem)` | **Under 16px zoomer iOS automatisk inn** når feltet får fokus, og etterlater skjermen skjev |
| Kort-containere | `min-width: 0` | Ellers sprenger én lang URL i en kommentar hele layouten |
| Body-tekst < 414px | `max(0.92rem, 14px)`, `line-height: 1.5` | Aldri mindre enn 14px |
| Modal-høyde | `calc(100dvh - 16px)` | `dvh`, ikke `vh` — nettleser-chrome |
| Modal-scroll | `overscroll-behavior: contain` | Innholdet scroller, ikke siden bak |
| Toast-plassering | `calc(96px + env(safe-area-inset-bottom))` | Aldri over bunn-navigasjonen |

**Safe-area-fella.** V1-kommentar: *«avoid stacking multiple bottom paddings»* —
tre wrappere la hver på `env(safe-area-inset-bottom)` og resultatet ble ~90px
død luft nederst. Løsningen: **én** wrapper eier bunn-paddingen, resten settes
til 0.

**iOS-zoom-resett.** Før et ark lukkes: blur det fokuserte inputfeltet, *«så
iOS resetter den zoomede viewporten»*. Ellers står du igjen på en skjev skjerm.

> ✅ **V2:** Den mest direkte overførbare fila i hele V1-repoet. 44px, 16px,
> `min-width: 0` og safe-area-regelen gjelder uendret.

---

## 4. Feeden

**Kilde:** `pages/FeedPageV2.jsx`

### 4.1 Vindusrendering

| Konstant | Verdi |
|---|---|
| `MOBILE_HYDRATION_RADIUS` | **2** |
| `MOBILE_VIDEO_RADIUS` | **1** |
| `DESKTOP_FEED_BATCH_SIZE` | **10** |

Kort innenfor ±2 fra det aktive rendres fullt. Resten er **tomme skall med
samme høyde**. Video monteres kun innenfor ±1.

> V1-kommentar: *«Et montert videoelement med autoplay begynner å laste ned
> videodata umiddelbart — uten denne gaten lastet samtlige videoer i feeden
> samtidig.»*

**Skallet må alltid finnes i DOM** — scroll-snap-geometrien,
`IntersectionObserver`-en og `getNearestCardIndex` avhenger av at hvert kort
eksisterer med fast høyde.

### 4.2 Den skarpeste detaljen i hele V1

> *«Feeden er levende: bakgrunns-refreshen legger nye innlegg øverst, slik at
> indeksen til kortet brukeren ser på forskyves. Siden hydrerings- og
> videovinduet er indeksbasert, må `activeMobileIndex` remappes til samme
> `submissionId` i samme render — ellers kan kortet brukeren ser på falle ut av
> vinduet og få videoen sin avmontert midt i avspillingen.»*

Vinduet må følge **innholdet**, ikke posisjonen. En bug de fleste aldri finner.

### 4.3 Pull-to-refresh

- Terskel: **80px** dra ned.
- Aktiveres **kun** når `scrollTop === 0`.
- **Retning låses ved første merkbare bevegelse.** Er draget horisontalt,
  gis det videre til sveipen — ingen konflikt mellom de to gestene.
- **Rubber-band:** draget blir tyngre etter terskelen.
- Feiler refreshen: gi en kort respons likevel, *«så det føles som det skjer noe»*.

### 4.4 Langtrykk for reaksjon

| Konstant | Verdi |
|---|---|
| `LONG_PRESS_MS` | **500** |
| `LONG_PRESS_MOVE_THRESHOLD_PX` | **10** (beveger du deg mer, avbrytes det) |
| Reaksjonsvelger auto-lukk | **3000ms** |
| Emoji flyr opp i | **1200ms** |

Med `data-no-long-press="true"` som opt-out, og et eksplisitt hopp over
`button, a, input, textarea, select` — *«to avoid hijacking buttons»*.

### 4.5 Bilde-fallback som ikke går i løkke

Thumb-URL-en utledes på serveren uten å sjekke at fila finnes. Feiler den,
faller den tilbake til originalbildet — **men bare én gang**, så et bilde som
mangler helt ikke gir en evig feil-løkke.

### 4.6 Andre tall

| Konstant | Verdi |
|---|---|
| `DELETE_FADE_OUT_MS` | **200** |
| `DELETE_TOAST_MS` | **2800** (angre-vindu) |
| `COMMENT_SWIPE_THRESHOLD_PX` | **44** |
| `COMMENT_SWIPE_CLOSE_OFFSET_PX` | **220** |

> 🔁 **V2:** FlashList håndterer vindusrendering, men **ikke** medie-gaten
> (§4.1) eller index-remappingen (§4.2). Begge må bygges eksplisitt når
> videopipelinen kommer (ADR-0019).

---

## 5. Bildevisning

**Kilde:** `components/PhotoZoomViewer.jsx`

| Konstant | Verdi |
|---|---|
| `DOUBLE_TAP_MS` | **280** |
| `ZOOM_LEVEL` | **2×** |
| `CLOSE_DRAG_THRESHOLD_PX` | **100** |
| `CLOSE_VELOCITY_THRESHOLD` | **0.6** |
| Lukke-animasjon | **180ms** |

**Gest-regelen som gjør det riktig:** én finger betyr **lukk** når du er
utzoomet, og **panorer** når `scale > 1`. Samme gest, riktig svar begge ganger.
To pekere = pinch, og et aktivt sveip-til-lukk avbrytes umiddelbart.

`Escape` lukker. `setPointerCapture` på pointerdown så draget ikke mistes.

> 🔁 **V2:** Ikke bygget ennå. Tallene overføres; gest-håndteringen blir
> `react-native-gesture-handler`.

---

## 6. Venting, tomhet og bekreftelse

### Skeletons — aldri spinnere

```css
.skeleton { background: rgba(0,0,0,0.06); border-radius: 12px; }
.skeleton::before {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
}
```

**1.4s** shimmer. Egne varianter for feed-kort og knute-rad. Dark mode senker
gjennomskinneligheten til `0.08`.

> Dette er **den ene tillatte evige løkka** (frontend.md §7).

### Tom-tilstander med ansikt

`.empty-state`: emoji på **2.4rem** med `drop-shadow`, padding `36px 20px`,
**8px** gap, sentrert, dempet farge. Aldri en blank skjerm.

### Toast

| Detalj | Verdi |
|---|---|
| Synlig | **3200ms** |
| Så fjernes fra DOM etter | **+240ms** (utfading) |
| Inn-animasjon | `translateY(20px) → 0`, **220ms** |
| Plassering | `bottom: calc(96px + env(safe-area-inset-bottom))` |
| Tilgjengelighet | `role="status"` + `aria-live="polite"` |
| Ikon | `✓` success · `!` error · `•` info |

> ✅ **V2:** `Toast`/`useToast` finnes allerede (ADR-0017). Sjekk at 3200ms og
> `aria-live` stemmer.

---

## 7. Orientering — hvor er jeg, hva er nytt

### Farget venstrekant etter status

```css
.knot-row[data-status="available"] { border-left: 3px solid var(--text-muted); }
.knot-row[data-status="pending"]   { border-left: 3px solid var(--warning); }
.knot-row[data-status="approved"]  { border-left: 3px solid var(--success); }
.knot-row[data-status="rejected"]  { border-left: 3px solid var(--danger); }
```

**3px.** Du skanner hele knutelista på ett blikk uten å lese et eneste ord.
(V2 må pare fargen med ikon/tekst — frontend.md §9 forbyr farge alene.)

### Rød prikk på fanen

**9px** sirkel, `#ef4444`, med en **2px ring i bakgrunnsfargen** rundt seg så
den leses mot et hvilket som helst ikon. Plassert `top: -3px; right: -6px`.

Styrt av `lastVisitedFeedAt`, som oppdateres **mens du står på fanen** — så
prikken ikke dukker opp igjen i det sekundet du bytter bort.

> ⚠️ V1 pulserer den med `animation: tab-badge-pulse 1.8s infinite`.
> **Det bryter ADR-0023/#120.** Behold prikken, dropp den evige pulsen.

### Tilbake til toppen

Vises etter **800px** scroll. **52px** sirkel, glir inn med
`translateY(12px) scale(0.85) → 0/1` på **180ms**. Har `tabIndex={-1}` når den
er skjult, så skjermleseren hopper over den.

### «Last flere»

En **usynlig sentinel** nederst + `IntersectionObserver`. Ikke en knapp, ikke
en scroll-lytter.

---

## 8. Ordene — personlighet uten bevegelse

Her er V1 på sitt beste, og alt her er **100 % forenlig med ADR-0023**
(rolig app). Tre detaljer, null piksler bevegelse, hele appen får stemme.

### 8.1 Tilfeldig knute-forslag

**Kilde:** `KnotsPage.jsx` — `RANDOM_KNOT_MESSAGES`, 8 varianter med `{name}`:

> «Her har du en skreddersydd knute, søtnos 💛»
> «Universet sier: ta denne, {name} 🌙»
> «Slumpen sier: denne, {name}! 🎲»
> «Plukket spesielt til {name} 🎁»
> «Tilfeldig — men passer perfekt 💫»

Faller tilbake til «du» hvis navnet mangler.

### 8.2 Innsendings-kvittering, valgt etter kontekst

**Kilde:** `index.mjs` — `DEFAULT_KNOT_FEEDBACK_MESSAGES`

Seks kontekster, hver med flere varianter som velges tilfeldig:

| Kontekst | Eksempel |
|---|---|
| `standard` | «Boom. Knuten er sendt.» · «Ryddig levert.» |
| `resubmission` | «Ny runde, ny levering. Denne er inne igjen.» |
| `feed` | «Feed aktiv. Innsendingen er registrert.» |
| `anonymousFeed` | «Sendt anonymt. Jobben taler for seg selv.» |
| `streak` | *(fjernet i V2 — ADR-0023)* |
| `rare` | En lang, rar easter-egg-tekst |

**Og knutesjefen kunne redigere alle sammen** (`PATCH /api/admin/knot-feedback-messages`).
Hver skole får sin egen tone.

### 8.3 Sosial proof på knute-raden

«X har fullført» — antall unike brukere per knute. Står allerede i
`docs/produktideer-demo-eksperiment.md` som en «ny» idé; V1 hadde den.

### 8.4 «Rivaler» — motivasjon uten skam

**Kilde:** `data/appHelpers.js`

De nærmeste over og under deg på topplista, sortert på **absolutt rank-avstand**.
Og `nextRank` regner ut det konkrete tallet:

```js
pointsNeeded = Math.max(rivalOver.points - dinePoeng + 1, 1)
```

→ *«du trenger 7 poeng for å passere Sokkelos»*. Er du **nr. 1** flipper den til
`mode: 'lead'` og viser hvem som jakter deg i stedet.

Konkret, nært, og aldri «du er nr. 47 av 200». Ligger tett på ADR-0024s
tenkning om ro uten press.

---

## 9. Utviklerverktøy verdt å stjele

### Testpanel i Innstillinger

**Kilde:** `App.jsx` L195

> V1-kommentar: *«Testpanel — trigges fra Innstillinger så Ludvig kan se alle de
> små animasjonene/celebrasjonene uten å måtte fremprovosere dem naturlig.»*

Ludvig bygde en knapp for å QA-e polish. **Det er trolig derfor polishen ble
bra** — han kunne faktisk se den uten å spille seg gjennom appen.

> ✅ **V2:** Bygg tilsvarende bak et dev-flagg. Uten den blir mikroanimasjoner
> aldri kvalitetssikret.

### `304 Not Modified` på bakgrunns-refresh

`fetchBootstrap` returnerer `null` ved 304 → behold eksisterende data, ingen
re-render. Gratis polling.

> 🔁 **V2:** TanStack Query gjør caching, men ETag på feed/toppliste ville gitt
> samme gevinst på nettverkssiden.

---

## 10. ⚠️ Detaljer som må fikses før de lånes

### Idle-wobble på knute-ikonet

**Kilde:** `lib/useIdleAnimation.js` + `App.css` L13909

Etter **30 sekunder** uten input vrikker knute-ikonet i bunn-navigasjonen:
`1.2s`, `cubic-bezier(0.34, 1.56, 0.64, 1)`, `rotate ±8°`, `scale → 1.15`.
Pauser når fanen ikke er synlig. Respekterer `prefers-reduced-motion`.

Fint laget. **Men den planlegger seg selv på nytt i det uendelige** — nøyaktig
den evige oppmerksomhets-effekten frontend.md §7 / PR #120 forbyr.

> **Fiks før lån:** la den fyre maks 1–2 ganger per økt, så gi seg.

### Rød prikk som pulserer `infinite`

Se §7. **Fiks:** behold prikken, dropp pulsen — eller la den pulse et par
ganger ved ankomst og så stå stille.

---

## 11. ❌ Ikke lån

| Fil i V1 | Hvorfor |
|---|---|
| `ConfettiBurst.jsx` | ADR-0023 — ingen konfetti |
| `AchievementCelebration.jsx` | ADR-0023 — ingen unlock-show |
| `RankUpToast.jsx` | ADR-0023 — ingen rank-up-feiring |
| `lib/sounds.js` | ADR-0023 — ingen lyd |
| «Streak flame celebration» (App.css) | Streak fjernet i V2 |

Se også `v1-spec.md` §13 for de arkitektoniske V1-feilene.

---

## 12. Sjekkliste når du bygger en V2-skjerm

- [ ] Trykkflater minst **44×44px** (usynlig hit-area der ikonet er mindre)
- [ ] Inputs minst **16px** fontstørrelse
- [ ] Kort har `min-width: 0` / tilsvarende, så lang tekst ikke sprenger layout
- [ ] Kun **én** wrapper eier bunn-safe-area-paddingen
- [ ] Lasting = **skeleton**, aldri spinner
- [ ] Tom-tilstand har ikon + vennlig tekst + en vei videre
- [ ] Status kommuniseres med **farge + ikon/tekst**, aldri farge alene
- [ ] Trykk gir haptikk + skalering
- [ ] Bevegelse er **bounded** — ingen `withRepeat(..., -1)` utenom skeleton
- [ ] Bekreftelse er en **toast**, ikke en `Alert`

---

**Sist oppdatert:** 2026-08-23 (uttrukket fra V1-kilden).
**Relatert:** `v1-spec.md` (reglene) · `.claude/rules/frontend.md` (V2-reglene) ·
ADR-0017 (sticker) · ADR-0023 (rolig app) · `docs/idebok.md`.
