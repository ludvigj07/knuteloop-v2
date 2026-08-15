# Lim-inn-prompt: fiks Knuteloop-nettsida

> Kopier ALT under streken inn i Claude design-prosjektet (der «Knuteloop
> Nettside.dc.html» ligger). Prompten styrer arbeidet i små steg — du trenger
> bare svare «neste», «ok» eller kommentere det du ser.

---

Du skal REVIDERE den eksisterende sida «Knuteloop Nettside» — ikke bygge ny.
Strukturen og interaksjonene er gode og skal beholdes. Det som skal fikses er
faktafeil i teksten, app-demoen og noen merkevare-brudd.

## Arbeidsmåte (viktig — jeg er sliten og vil se små biter)

Jobb i SMÅ steg: én seksjon om gangen, i rekkefølgen under. Etter hver seksjon:
vis resultatet og VENT på at jeg sier «neste» eller kommenterer. Aldri skriv om
hele sida i én jafs. Aldri endre seksjoner jeg ikke har bedt om.

## Tre harde regler (gjelder alt du gjør)

1. **ALDRI gjenskap app-skjermer i HTML.** Den håndbygde telefon-demoen ser
   ikke ut som appen og skal ut. I telefon-ramma: legg en tydelig merket
   plassholder per skjerm — «[SKJERMBILDE: katalog]», «[SKJERMBILDE: send inn]»
   osv. (390×844-proporsjoner) — som byttes med EKTE skjermbilder senere.
   Behold scroll-/fane-byttinga mellom dem.
2. **Ingen konfetti, ingen feiringseffekter.** Appen er en «rolig app» (bevisst
   merkevarevalg). I «Prøv selv»: fjern konfettien — godkjenning vises med
   status-pill som bytter til «Godkjent» + poengene som teller rolig opp.
   Ferdig.
3. **Fjern «Medium»-pillen** i send inn-demoen — vanskelighetsgrad finnes ikke
   i produktet. Kun poeng.

Språk: bokmål, du-form, korte setninger. Gul highlight på maks ETT ord per
overskrift. Ingen emoji.

## Seksjonene, i rekkefølge — med korrigert innhold

### Steg 1 — Trygghet (størst faktafeil, ta først)

Bytt ut punktlista med disse seks (behold formen):
- Data lagres i EU — Helsinki.
- Hver skole er helt isolert. Ingenting krysser mellom skoler eller kull.
- Knutesjefen godkjenner hver innsending før den kan vises i feeden.
- Eleven velger selv om en godkjent knute deles i feeden eller holdes privat.
- Sensitive knuter er låst til kun tekst-bevis — kan aldri ha bilde eller
  video. Bestemt sentralt, kan ikke skrus av av skolen.
- Bare Vg3-elever på skolens egen liste kommer inn.

(«Bilder, ikke video»-punktet var FEIL — appen støtter både bilde og video for
vanlige knuter; det er de sensitive som er låst.) Behold DPIA-linja under.

### Steg 2 — Bevis

Tre statkort, ikke to: **2 400** innsendinger · **100 %** aktivering i kullet ·
**68 %** uke-til-uke retention. Behold tell-opp-animasjonen. Linja under:
«Pilot på én skole gjennom hele russetiden 2026. Ikke en prototype — en sesong.»

### Steg 3 — FAQ (bytt svarene, behold spørsmål og form)

- **Hvem kan se innsendingene?** Bare russ på din egen skole. Knutesjefen
  godkjenner først, og eleven velger selv om den deles i feeden eller holdes
  privat.
- **Må vi lage hele knuteboka selv?** Nei. Start med biblioteket — over hundre
  kuraterte knuter og en anbefalt starter-pakke, i gang på ti minutter. Alt
  dere henter blir deres egen kopi som dere endrer fritt, og egne knuter lager
  dere ved siden av.
- **Hva med knuter som ikke passer i et bilde?** Hver knute har sitt eget
  bevisnivå. Sensitive knuter er låst til kun tekst — det kan ikke endres av
  skolen.
- **Hva koster det?** Prisen avtaler vi direkte med russestyret. Ingen kjøp
  inne i appen, ingen reklame mot elevene.
- **Når kan vi bruke den?** Lansering russetid 2027. Tallene over er fra
  piloten som kjørte hele russetiden 2026.

### Steg 4 — Appen (telefon-demoen)

Regel 1 over: bytt de håndbygde skjermene med merkede plassholdere for
skjermbilder. Rekkefølge: katalog → send inn → godkjenn-kø → feed → toppliste.
Behold mekanikken (scroll/faner).

### Steg 5 — Prøv selv

Regel 2: konfetti ut, rolig godkjenning inn. Fjern også «Medium»-pillen
(regel 3) hvis den vises her. Alt annet beholdes — seksjonen er bra.

### Steg 6 — For russestyret

Legg til ett punkt øverst i kortet: «**Start med biblioteket.** Over hundre
kuraterte knuter og en starter-pakke — knuteboka er i gang på ti minutter.»
Behold de fire eksisterende punktene.

### Steg 7 — Meld på

Bytt «Du hører fra oss innen ett døgn» med «Vi tar kontakt og setter opp en
demo. Den tar ti minutter.» Resten beholdes.

### Steg 8 — Til slutt: produksjons-TODO-er som kommentarer i koden

Legg disse som `<!-- TODO -->`-kommentarer øverst i fila (ikke gjør noe mer
med dem nå):
- Fonter må self-hostes før publisering (ingen Google Fonts-kall — personvern).
- Hosting må være i EU (aldri Vercel/Netlify/Cloudflare).
- Skjemaet trenger et ekte mottak (endpoint → e-post) før publisering.
- Plassholderne i app-demoen byttes med ekte skjermbilder.

Start med steg 1 nå, og husk: vis meg, og vent.
