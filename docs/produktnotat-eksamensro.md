# Produktnotat — Eksamensroen og sesongkurven

**Dato:** 2026-07-26
**Status:** Bekreftet retning, ikke påbegynt. Blir ADR når bygging nærmer seg.
**Kilder:** v1-sesongdata (dashboard, én skole, mai–juni 2026) + Ludvigs rådgiver og
Claude, som **uavhengig av hverandre** landet på samme konklusjon 26. juli.

## Dataene (v1, russetiden 2026)

- Tre topper: launch-uka 19. mai (**393**), uke to 22. mai (**400**),
  comeback-rush 8. juni (**115**) da muntlig eksamen var ferdig.
- Mellom toppene: eksamensro i uke 3 — men **laveste dag var 2, aldri 0**.
  Appen døde ikke, den hvilte.
- Uke 4 var bedre enn grafen viser — helga (100+ knuter) manglet i tallene.
- Forbehold: n=1 (én skole, én sesong).

## Konklusjonen

**Eksamensroen er ikke fienden — den skal eies, ikke bekjempes.**

Brukerne er 17–19 og midt i eksamen. En app som maser da, blir appen foreldre og
rektorer hater — og v2 selger til 100+ skoler i 2027 delvis på tillit.
«Appen som respekterte eksamen» er et salgsargument. Comebacket 8. juni kom helt
av seg selv i v1; jobben er å *lade* det, ikke å tvinge aktivitet i rolla.
Alt under ligger innenfor rolig app-linja (ADR-0023): forventning er lov,
press er bannlyst.

## Grepene (prioritert rekkefølge ikke avgjort)

1. **Eksamensmodus** — knutesjefen flagger eksamensuker for sin skole.
   Hjem-skjermen bytter tone («Lykke til på muntlig — knutene venter»).
   Ingen skyld, ingen tellere. Appen sier høyt at det er greit å være borte —
   det er det som gjør at de kommer tilbake uten dårlig samvittighet.
   MÅ være per-skole (eksamensdatoer varierer mellom skoler/regioner) —
   aldri en global kalender.
2. **Lesepause-knuter** — egen mappe med rolige, eksamenskompatible knuter
   (tur med en medruss, høre en venn i pensum, lesestund-bilde). De som gjorde
   2–30 om dagen i rolla finnes; gi dem innhold som passer livet deres da.
3. **Finale-pakke** — knutesjefen slipper en bibliotek-pakke (mekanismen
   finnes, ADR-0014) når eksamen er ferdig: ferske knuter, sluttspurt.
   Forsterker det organiske comebacket. Sponsor-knuter i finalen treffer
   maksimal aktivitet — relevant for ADR-0020-inntektsmodellen.
4. **Mappe-bevisst dagens knute** — dagens knute (bygget juli 2026) trekker
   fra lesepause-mappa i eksamensuker. Én rolig ting om dagen holder pulsen
   uten å kreve noe.

## Det vi IKKE gjør

- Streak-skyld eller tapte-dager-mekanikk (streak er fjernet, ADR-0023).
- Push-varsler som maser i eksamensperioden.
- FOMO-timere, nedtellinger med press, «du går glipp av»-formuleringer.

Psykologien vi bruker er forventning, ferskt innhold i riktige øyeblikk og
autonomi — aldri press. Brukerne er potensielt mindreårige; manipulerende
mønstre er både off-brand og et regulatorisk minefelt.
