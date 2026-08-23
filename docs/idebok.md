# Idébok — Ludvigs fangst-liste

> **Dette er en hukommelse, ikke en forpliktelsesliste.** Ludvig dumper ideer
> (ofte rått, fra mobil eller ved øktstart), Claude strukturerer dem her.
> Ingen av punktene har deadline. Plukk ÉN ting når det er overskudd — resten
> ligger trygt. Når et punkt faktisk skal bygges: scope det til en GitHub-issue
> eller PR, og stryk det her.
>
> Sist oppdatert: **2026-08-23**.

---

## 🎨 Design & følelse — den røde tråden

Ludvigs retning, med hans egne ord: **«en generell less is more-vibe samtidig
som me adde mer design-greier — mer cleen feel»**. Mindre støy, mer identitet.

> 📐 **Detaljene fra V1 er nå skrevet ned:** [`docs/v1-detaljer.md`](./v1-detaljer.md).
> ~40 småting som gjorde at V1 føltes gjennomført — sveip-kurven, haptikk-nivåene,
> 44px-regelen, skeletons, «rivaler», ordene — med de **ekte tallene** fra kilden.
> Les den før du polerer en skjerm. `v1-spec.md` er reglene; denne er følelsen.

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
  som googler oss skal finne noe ordentlig). _Høstens viktigste punkt: salg til
  russestyrene starter når styrene dannes (tidlig høst 2026) — appen selges på
  v1-tallene + demo, ikke på ferdigstillelse. Lansering er fortsatt russetid 2027._
- **Video-serie for salg** (Ludvig, 15. aug — «lowkey overkommelig»): mange SMÅ
  videoer (30–60 sek) i stedet for én lang. Lista:
  1. **Selve appen** — innsending, feed, toppliste, godkjenning (hero på nettsida)
  2. **Knutesjef-verktøyene** — «dette blir enkelt for deg»
  3. **Personvern** — svarer foreldre/skolers GDPR-innvending før den kommer
  4. + 1–2 småting (f.eks. kom-i-gang)

  _Arbeidsdeling: Claude skriver manus + shot-liste + rigger demo-seed; Ludvig tar
  skjermopptak; Brage/Linus klipper. Én video per perm-økt er tempoet._
  _Bonus: videoene styrer design-poleringa — vi pusser kun skjermene kamera ser,
  i den rekkefølgen videoene lages._
- **Global feed + algoritme** — den kuraterte offentlige utstillingen på tvers av skoler.
  _Stor greie: trenger egen ADR (RLS-unntaket må designes som lift-out, aldri cross-tenant)._

---

## Ferdig herfra (flyttes hit når punkter fullføres)

- _(tomt ennå)_
