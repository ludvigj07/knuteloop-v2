# Idébok — Ludvigs fangst-liste

> **Dette er en hukommelse, ikke en forpliktelsesliste.** Ludvig dumper ideer
> (ofte rått, fra mobil eller ved øktstart), Claude strukturerer dem her.
> Ingen av punktene har deadline. Plukk ÉN ting når det er overskudd — resten
> ligger trygt. Når et punkt faktisk skal bygges: scope det til en GitHub-issue
> eller PR, og stryk det her.
>
> Sist oppdatert: **2026-08-15** (perm-helg).

---

## 🎨 Design & følelse — den røde tråden

Ludvigs retning, med hans egne ord: **«en generell less is more-vibe samtidig
som me adde mer design-greier — mer cleen feel»**. Mindre støy, mer identitet.

- **Hele hjem-skjermen** fikses/poleres.
  _Status: dagens knute-kort ligger klart i PR [#131](https://github.com/ludvigj07/knuteloop-v2/pull/131) og venter visuell QA._
- **Mindre hvit og «corporate»** — varmere, mer sticker-identitet (ADR-0017) i flatene.
- **Farger og plassering** gjennomgås på tvers av skjermene.
- **Fjerne unødvendig støy** — mindre tekst i UI-et, og skrive om tekstene som består.
- **Flere ikoner til mapper** (KnoteIcon-glyfer — i dag finnes bare de fem tema-glyfene).
- **Optimalisere avskjæring/utsnitt for mobil** — layout og bildeutsnitt skal sitte på små skjermer.
- **Toppliste-skjermen** poleres.
- **Profiler** poleres.
  _Status: offentlige profiler + innsendings-rutenett finnes delvis (#86, #100)._

## 📹 Media-pipeline

- **Video** — opplasting/komprimering er ikke bygget (ADR-0019 gjelder:
  per-knute bevisnivå + ADR-0012s båndbreddetak; krever eksplisitt OK før bygging).
- **Bilde** — ekte opplastingsflyt (i dag stubbet), **lagring** (Bunny-nøkler/CDN-varianter)
  og **hastighet** (thumbnails, caching, opplevd raskhet i feeden).

## 🛠️ Knutesjef & bibliotek

- **Knutebiblioteket og alle knutesjef-verktøyene** fikses/poleres som helhet.
  _Se [[knutesjef-operating-vision]]-minnet / handoffs — handlingsgrafen er låst («alt fra alt»)._
- **Knute-kategorier** ses på.
  _Kontekst: legacy `category`-enumen er allerede planlagt fjernet (ADR-0014);
  mapper (knutemapper) er den ekte aksen. Avklar hva Ludvig vil her før arbeid._

## 🌍 Vekst & utad

- **Nettside** — så folk kan søke opp Knuteloop (markedsside; skoler/foreldre/sponsorer
  som googler oss skal finne noe ordentlig).
- **Global feed + algoritme** — den kuraterte offentlige utstillingen på tvers av skoler.
  _Stor greie: trenger egen ADR (RLS-unntaket må designes som lift-out, aldri cross-tenant)._

---

## Ferdig herfra (flyttes hit når punkter fullføres)

- _(tomt ennå)_
