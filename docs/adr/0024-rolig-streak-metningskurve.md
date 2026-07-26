# ADR-0024: Rolig streak med metningskurve

**Status:** Proposed
**Date:** 2026-07-26
**Deciders:** Ludvig (+ Brage som medtenker, Claude som rådgiver)

## Context

ADR-0023 fjernet streaken helt som del av «rolig app»-retningen — v1-streaken
(daglige bonuspoeng i trappetrinn, hard reset ved én tapt dag) hørte til
celebration-laget vi ikke ville ha.

26. juli, etter å ha analysert v1-sesongdataene (tre topper, eksamensro med
laveste dag 2, comeback-rush 8. juni — se `docs/produktnotat-eksamensro.md`),
konkluderte Ludvig og Brage med at en *daglig grunn til å åpne appen* har reell
retention-verdi vi ga fra oss — men at v1-mekanikken var feil UTFORMET, ikke
feil IDÉ. Problemet med klassiske streaks er at de vokser lineært/uendelig
(blir OP, presser folk) og straffer pauser hardt (skam, tap-aversjon).

Ludvigs innsikt: bruk **naturlige vekstfunksjoner** (R1-matte: logistisk vekst,
befolkningsmodeller) — bonusen vokser raskt i starten og **flater ut mot et
tak**. Tidlige dager gir mest marginal verdi (kroken), senere dager gir
identitet, ikke makt.

## Decision (foreslått)

Gjeninnfør streaken i redesignet form, på disse premissene:

1. **Metningskurve, ikke trapp/lineær vekst.** Dagsbonusen følger en bundet
   kurve, f.eks. `bonus(d) = round(CAP × (1 − e^(−d/τ)))` der `d` = antall
   sammenhengende kvalifiserte dager. Eksakt kurve og konstanter (CAP, τ)
   bestemmes i designøkta — prinsippet er at kurven er *flat på toppen*:
   dag 30 er knapt bedre enn dag 14. Aldri OP.
2. **Ingen skam-mekanikk.** Ingen «streaken din ryker!»-varsler, ingen
   flammeikoner som slukner dramatisk, ingen push. Brudd omtales aldri som tap
   i UI-et. (ADR-0023s forbud mot celebration-show og press står ved lag.)
3. **Eksamensro-vennlig.** Mekanikken må samspille med eksamensmodus fra
   produktnotatet — en streak som presser folk til å logge inn under muntlig
   eksamen er nøyaktig anti-mønsteret vi har lovet bort. (Åpent spørsmål under.)
4. **Stille visning.** Et lite tall/kurvemerke på profilen eller hjem — ikke
   et hero-element. Rolig identitet, ikke scoreboard.

Dette **supersederer ADR-0023 delvis** (kun streak-punktet — «no sound, no
confetti, no celebration shows» står urørt). Ved aksept oppdateres ADR-0023s
status til «Delvis superseded av 0024», v1-spec §2-flagget og
`.claude/rules/frontend.md`.

## Alternatives considered

- **Beholde ADR-0023s null-linje.** Enklest og roligst. Avvist (foreslått)
  fordi sesongdataene viser at daglig-verdi-mekanismen bar reell retention i
  v1, og den nye kurven fjerner skadepotensialet som motiverte fjerningen.
- **v1-streaken tilbake som den var** (trappetrinn 0/5/10/15/20 %, cap 6,
  hard reset). Avvist: lineær eskalering + hard reset er presist det som gjør
  streaks usunne; taket på 6 poeng var et plaster på feil kurve.
- **Dagens knute som eneste daglig-mekanikk** (ingen streak). Allerede bygget
  og rolig — men gir ingen kontinuitetsfølelse over tid. Kan leve SAMMEN med
  streaken; ikke et enten-eller.

## Consequences

### Good
- Daglig grunn til å åpne appen → retention, spesielt i hovedperioden.
- Metningen gjør mekanikken selvbegrensende — ingen poenginflasjon, ingen
  «grinde streak»-meta på topplista.
- Gjenbruker v1s velprøvde dag-kvalifisering (godkjent innsending per
  Oslo-dag, v1-spec §2) — bare bonuskurven er ny.

### Bad / trade-offs accepted
- Reell risiko for at *enhver* streak drar mot press — kravene 2 og 3 er
  harde betingelser, ikke pynt. Reviewer skal avvise implementasjoner som
  bryter dem.
- Mer scoring-kompleksitet i backend (bonusberegning ved les, per ADR-linjen
  om at `submission.points` aldri lagres).
- ADR-0023 får sin første ripe — vi må være ærlige på at retningen justeres.

### Neutral
- Badges er fortsatt parkert (ADR-0023) — dette gjenåpner IKKE badge-diskusjonen.

## Open questions (avgjøres i designøkta etter militærperioden)

- **Reset eller forfall?** Hard reset ved tapt dag (v1) vs. mykt forfall
  (kurven siger tilbake over 2–3 dager). Forfall er roligere; reset er
  enklere å forstå.
- **Eksamensmodus-samspill:** fryses streaken (dager teller ikke), eller
  senkes kvalifiseringskravet (én lesepause-knute holder)?
- **Eksakte tall:** CAP (maks dagsbonus) og τ (hvor fort kurven metter).
  Trenger lekegrind med v1-poengdata.
- **Visning:** profil, hjem, eller begge? Hva er den roligste formen?
- **Navnet:** «streak» har bagasje. Norsk begrep? («rekke»? «løype»?)
