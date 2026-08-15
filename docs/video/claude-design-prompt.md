# Lim-inn-prompt: grafikk-scenene til Video 1

> Kopier ALT under streken og lim inn i en Claude-økt (Claude Code i dette
> repoet, eller claude.ai). Prompten er selvforsynt: har Claude repo-tilgang
> leser den kildene selv; har den ikke det, står essensen inline.
> Oppdater manus-referansene hvis manuset endres.

---

Du er designer for **Knuteloop** — appen som digitaliserer norske russeknuter.
Jeg lager salgsvideo 1 («Selve appen», 9:16, 52 sek) og trenger de tre
GRAFIKK-scenene som ferdige, skjermopptaks-klare HTML-frames.

## Hvis du har tilgang til repoet (knuteloop-v2), les FØRST:

1. `.claude/skills/knuteloop-design/README.md` — hele design-systemet (bruk
   skillen `/knuteloop-design` hvis den finnes i økta)
2. `.claude/skills/knuteloop-design/styles.css` + `tokens/` — de ekte tokene
3. `docs/video/manus-01-selve-appen.md` — manuset (scene 1, 7, 8 er dine)
4. `docs/glossary.md` — ordbruk (aldri oversett: russ, knute, knutesjef, toppliste)

## Hvis du IKKE har repo-tilgang — essensen:

- **Sticker-identiteten:** cream papir `hsl(48 60% 96%)`, ink (dyp navy)
  `hsl(220 50% 12%)`, royal blue `hsl(222 75% 28%)`, gull-accent
  `hsl(46 100% 58%)`. Kort = hvite flater med **2px ink-border + hard
  offset-skygge** `4px 4px 0` (ingen blur). Runde hjørner 14–26px.
- **Typografi:** display = Bricolage Grotesque 800 (tett, `-0.03em`),
  brødtekst = Inter, ALLE tall = JetBrains Mono. Norsk tallformat: `2 400`
  (mellomrom som tusenskille).
- **Stemme:** bokmål, direkte og varm, aldri corporate. Ingen emoji.
- **Logo-løkka:** en ∞-formet knute-loop (enkel path med to buer), strek 6–8px.

## Lag disse tre framene (hver som egen HTML-fil, nøyaktig 1080×1920):

**Scene 1 — hook (0:00–0:03):** Logo-løkka i royal blue sentrert på cream.
Tekst under, display-font, stor: «Knuteboka.» og på ny linje «I lomma.» med
gul highlight bak «I lomma.» (som en markørtusj, `padding 0 0.14em`).
CSS-animasjon: løkka + teksten zoomer inn 1.15→1.0 med hardt stopp (200ms,
ease-out), forsinket 300ms — jeg skjermfilmer animasjonen.

**Scene 7 — proof (0:38–0:46):** To statkort i sticker-stil stablet vertikalt:
«2 400» (mono, enorm) med «innsendinger» under, og «100 %» med «aktivering»
under. Overlay-tekst nederst: «Testet en hel russetid. 2 400 innsendinger.
Én skole.» — gul highlight KUN på «2 400». CSS-animasjon: tallene teller opp
fra 0 (1,2 sek, ease-out) — bruk JS-countup, respekter prefers-reduced-motion.

**Scene 8 — outro (0:46–0:52):** Logo-løkka i GULL denne gangen, tekst:
«Knuteloop.» + «Russetid på loop.» (gul highlight på «Russetid på loop.»),
og «knuteloop.no» i mono under. Rolig — ingen animasjon utover en enkel
fade-inn.

## Kvalitetskrav

- Én HTML-fil per scene, alt inline (ingen CDN-er). Fonter: bruk
  systemfallbacks hvis webfonts ikke er tilgjengelig — display-fonten skal
  uansett være TUNG (800) og TETT.
- Nøyaktig 1080×1920 px flate (jeg tar opptak/skjermdump i 100 % zoom).
- Vis meg resultatet, så justerer jeg med korte beskjeder («større tall»,
  «mer luft») — iterér til det sitter.
