# Manus — Video 1: «Selve appen»

> Hero-videoen til nettsida. Del av salgsvideo-serien (se `docs/idebok.md` → Vekst & utad).
> Visuelt storyboard i sticker-stil: Claude-artifacten «Knuteloop — Manus: Video 1»
> (be Claude åpne/oppdatere den ved endringer — endres det ene, oppdater det andre).
>
> **Format:** 9:16 · 1080×1920 · ~52 sek · tekst-overlays + musikk · INGEN voiceover
> **Publikum:** russestyret (og alle russ de deler den med)
> **Skrevet:** 2026-08-15

## Regler for klippen

- Maks 2–3 sek per klipp; høyt tempo, men **teksten står helt i ro** mens den vises (lesbarhet).
- Ett ord per scene får gul-highlight (som `headingHighlight` i appen). Aldri flere.
- Musikk med tydelig beat; scene-bytter treffer beaten. Hard kutt + 0,5 sek stillhet på slutten.
- Alt på bokmål. Domeneord (knute, knutesjef, toppliste) oversettes aldri.

## Scenene

| # | Tid | Type | Tekst-overlay (gul-ord i **fet**) | Hva som vises |
|---|---|---|---|---|
| 1 | 0:00–0:03 | Grafikk | Knuteboka. **I lomma.** | Logo-løkka «slappes» på cream bakgrunn — zoom-inn + hardt stopp på beat |
| 2 | 0:03–0:10 | Opptak | Alle knutene til kullet ditt. **Poeng** på alt. | Katalogen: rolig scroll, tapp én mappe-chip så lista filtrerer |
| 3 | 0:10–0:17 | Opptak | Tatt en? Knips. **Send inn.** | Send inn-flyten: åpne knute → velg bilde → gul knapp. Tre klipp |
| 4 | 0:17–0:24 | Opptak | Knutesjefen godkjenner med **ett trykk.** | Godkjenn-køen: trykk Godkjenn → «Godkjent»-chippen lander (gi den et beat alene) |
| 5 | 0:24–0:31 | Opptak | Hele kullet ser det. **Med en gang.** | Feeden: scroll gjennom 3–4 godkjente innsendinger med seed-bilder |
| 6 | 0:31–0:38 | Opptak | Og topplista? Den skriver **seg selv.** | Topplista: land så CountUp teller opp; dvel på rangtitlene |
| 7 | 0:38–0:46 | Grafikk | Testet en hel russetid. **2 400** innsendinger. Én skole. | Statkort i sticker-stil: 2 400 innsendinger · 100 % aktivering. Tall teller opp |
| 8 | 0:46–0:52 | Grafikk | Knuteloop. **Russetid på loop.** + knuteloop.no | Logo + slagord + URL. Musikk kutter hardt, 0,5 sek stillhet |

## Pusslista — det kamera ser (poleres FØR opptak, i denne rekkefølgen)

1. **Katalogen** (`app/knuter.tsx`) — mappe-chips + kort-radene (mest synlig flate)
2. **Send inn-flyten** (`app/knute/[id]`) — bildevisning + den gule knappen
3. **Godkjenn-køen** — knappene + Godkjent-tilstanden
4. **Feeden** — kortene med bilder
5. **Topplista** (`app/leaderboard.tsx`) — radene + rangtitlene

Resten av design-bunken i idéboka venter til videoene som viser de flatene.

## Slik tas opptaket

1. **Rigg demo-data:** legg egne bilder i `apps/api/scripts/seed-media/` (se `docs/video/fotoliste.md`),
   så `pnpm dev:setup` + `pnpm dev:seed-feed` — appen skal se levende ut med EKTE bilder, ikke plassholdere.
   Grafikk-scenene (1/7/8) lages med `docs/video/claude-design-prompt.md`.
2. **Mobilvisning:** nettleser mot `localhost:8081`, DevTools-mobilmodus 390×844 (eller ekte telefon senere).
3. **Ta opp rått:** ett klipp per scene, 2–3 forsøk hver, navngitt `scene-02.mp4` osv. Brage/Linus klipper mot dette manuset.

## Neste i serien

1. ~~Selve appen~~ (dette manuset)
2. Knutesjef-verktøyene — «dette blir enkelt for deg»
3. Personvern — svarer foreldre/skolers GDPR-innvending før den kommer
4. Kom-i-gang (+ evt. 1–2 småting)
