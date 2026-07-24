# Knutebibliotek — seed-kilde (PR-3)

> **Dette er sannhetskilden for bibliotek-seeden.** Ludvig leverte innholdet 2026-06-18.
> Seed-skriptet i `apps/api/scripts/` koder denne lista inn i `library_knuter` + pakker.
> Hold denne fila og seeden i synk. Hyper-lokale referanser (Breiavatnet, Gunnar,
> Preikestolen …) er Stavanger-spesifikke — perfekt for pilot/demo, generaliseres når
> det nasjonale biblioteket kurateres.
>
> **App Store-innholdsvask 2026-07-24 (godkjent av Ludvig):** 75 knuter fjernet fra
> seeden og denne lista — hele Sex- og Alkohol-mappene, pluss enkeltknuter i gruppene
> tobakk/snus/narkotika, vold/tyveri mot mindreårige, naken/intim-foto,
> kroppsmodifikasjon og 50/50-gruppa. Full liste + begrunnelse:
> `docs/app-store-content-review.md`. **186 → 111 knuter.** Mapping-reglene under om
> Sex-/Alkohol-mappa står som historikk.

## Mapping-regler (avtalt med Ludvig)

- **Format:** `Navn – Xp – beskrivelse [flagg]` (ekte tankestrek `–`).
- **`[ingen media]`** → `evidence_type = 'text'` (innsending uten bilde/video). Alt annet → `'media'`.
- **Aldersgate:** **kun Sex-mappa** settes til `min_age = 18`. Alt annet beholder default `min_age = 17`.
  (Ludvig håndterer alkohol-knutene selv — de kan gjøres alkoholfritt, så de gates ikke som 18+.)
- **`suggested_folder`** = mappe-headeren under (Generelle / Dobbel / Rampestrek / Alkohol / Sex).
  Dette er knutens hjemmemappe (TYPE-aksen) og hva den auto-arkiveres i ved import.
- **`region`** (ny, valgfri tekst; `null` = "Nasjonalt" / funker overalt) = geografisk opphav
  (Stavanger / Oslo / Bergen …) — en GEOGRAFI-akse for bla/filtrering i biblioteket. Region er en
  *discovery*-akse på bibliotek-siden; den propagerer **ikke** til skole-mapper ved import (knuten
  arkiveres fortsatt i sin type-mappe). Denne batchen er Stavanger-russens knutebok → lokasjonslåste
  knuter tagges `'Stavanger'`, resten `null` (Nasjonalt). **Stavanger-tagget:** Badenymfen
  (Breiavatnet), Turisten (Preikestolen), Kjeft (Kielland-statuen), Fulltidsalkoholiker (Beverly),
  Festival (Vaulen). **Skole-/person-spesifikke** (Gunnar, IB-toalettet/IB-linja, referanser til
  «russepresidenten») flagges for generalisering ved nasjonal kurering — ikke en region, men innhold
  som må omskrives før et bibliotek på tvers av skoler.
- **`difficulty`** finnes ikke i kilden → utledes fra poeng: `< 20 = Lett`, `20–45 = Medium`, `> 45 = Hard`.
  Sølibat (0p, meta) = `Valgfri`. Juster fritt i seeden.
- **Dobbeltnavn** ("Stjerneelev / Presis") lagres som hele tittel-strengen.
- **Tråd-tier-knuter** (Bronsetråd/Sølvtråd/Gulltråd) seedes som vanlige navngitte knuter (v1-spec §5).
- **Utelatt:** Treddis (mindreårige) + Karsk-løp (lages på nytt). A-laget krever at begge er 18+.

## Pakke-/visningsstruktur (avtalt med Ludvig)

- **"Alle knuter"** — implisitt visning av alt aktivt i biblioteket (ingen lagret rad).
- **"Anbefalt starter"** — en kuratert `library_pack` Ludvig setter sammen selv (de "standard" knutene).
- **Mapper per type** — Generelle / Dobbel / Rampestrek / Alkohol / Sex (fra `suggested_folder`).
- En knute kan ligge **flere steder** (sin mappe + starter-pakka + alltid "Alle knuter"). M2M via
  `library_pack_memberships`. "Valgt"-status er per (skole, library-knute), så når én knutesjef
  importerer en knute ser den **valgt ut overalt den vises** — og medknutesjefer (ofte 2+ per skole)
  ser det samme. Det er gratis med denne nøklingen; ingen ekstra jobb nå.

---

## Generelle
- BI – 28 – Vipps økonomisjefen i russestyret 10 kr.
- Romeo – 10 – Skriv et romantisk dikt til loveboss og les det opp.
- Bikkjå – 10 – Bjeff høyt minst 10 ganger i løpet av én skoletime.
- Lættis Alarm – 12 – Få en knutesjef til å le høyt.
- Walk of Shame – 12 – Møt på skolen rett fra rulling, uten å dra hjem først.
- Fritzel – 12 – Ikke bli «cheatet på» (lurt) av noen gjennom hele russetiden.
- Veldedighet – 12 – Vipps et valgfritt beløp til Kreftforeningen.
- Jævla geek – 13 – Les en hel bok i løpet av russetiden.
- Jafs – 13 – Spis en hel cheeseburger i én jafs.
- Legesjekken – 12 – Få russelegen til å ta en full helsesjekk av deg.
- Klam – 15 – Gjennomfør en hel kroppsøvingstime iført russedress.
- Teams – 15 – Ring læreren på Teams midt i timen og spør om du kan delta digitalt.
- Ville vesten – 15 – Kjøp en rosa russelue av en annen russ.
- Hosten – 15 – Host fram et «vors» eller «narsj» høyt.
- Konduktør – 18 – Delta i russetoget.
- Up Syndrom – 18 – Kjøp og spis to is i løpet av én skoletime.
- Company – 18 – Sitt sammen med en Vg1- eller Vg2-elev en hel lunsjpause.
- Tixern – 18 – Syng «Sjeiken» høyt i kantina.
- Morgenstund – 18 – Ta et morgenbad (bad i sjø/vann tidlig på dagen).
- Bomullsklump – 20 – Ta vaksinen mot hjernehinnebetennelse.
- Vinter OL – 20 – Dra til Vinmonopolet på rulleski, skøyter eller ski.
- Bursdagen – 20 – Feir bursdagen til en lærer som ikke har bursdag.
- Badenymfen – 22 – Bad i Breiavatnet.
- Karl Johan – 22 – Spør 20 tilfeldige på gata om «kiss or slap».
- Vikaren – 22 – Delta aktivt i undervisningen til en førsteklasse, som om du går der.
- Testen – 25 – Test deg for kjønnssykdommer.
- Wing Man – 25 – Gi nummeret til en medruss sin mor til knutesjefene.
- Godt Å Blandet – 25 – Gå på date med noen fra innføringsklassen.
- Your final challenge – 25 – La noen andre gå fritt gjennom telefonen din.
- Linselus – 25 – Ta minst 20 selfier på telefonen til en lærer.
- Tvillingen – 25 – Knytt deg fysisk sammen med en medelev og hold sammen en hel skoledag.
- Bøsså – 25 – Vær bøssebærer for en innsamlingsaksjon.
- Russelue – 30 – Gjennomfør russedåp sammen med en medruss.
- Daten – 35 – «Kidnapp» russepresidenten og ta hen med på en overraskelsesmiddag.
- Nørd – 35 – Få karakteren 6 på minst to vurderinger i løpet av russetiden.
- Barfot fredag – 35 – Gå barfot hver fredag gjennom hele russetiden (obligatorisk).
- Vaske Instruksen – 38 – Gå hele russetiden uten å vaske russedressen.
- Handcuff – 40 – Lenk deg fast til noen en hel skoledag.
- Rim – 45 – Hold en hel presentasjon på rim.
- Turisten – 45 – Gå til Preikestolen iført russedress.
- Trofast – 45 – Vær trofast mot partneren din gjennom hele russetiden.
- Gullungen – 48 – Ikke ta narkotika gjennom hele russetiden.
- Årets Ørekreft – 50 – Fremfør årets hjemmesnekk (russelåt) i kantina.
- Mukbang – 83 – Spis 54 nuggets i løpet av én studietime.

## Dobbel
- Bronsetråd – 25 – Gjennomfør 5 knuter innen 24 timer.
- Skuespill – 25 – Fremfør et skuespill i kantina i minst 5 minutter.
- Stjerne – 25 – Ha en Just Dance-økt i kantina.
- Michelin – 25 – Spis et varmt måltid med tallerken og bestikk, i finklær, på skolen.
- Sing a Long – 25 – Start allsang i kantina.
- Boomboxen – 28 – Gjem en høyttaler i sekken til en medelev og spill av musikk i undervisningen.
- Counting or not counting – 30 – Vinn en debatt mot Gunnar.
- Travis Scott – 30 – Hold en rapbattle i skolegården.
- Foodnite – 30 – Start en matkrig i kantina.
- Livstiden – 30 – Start en vannkrig i kantina.
- Sommerkroppen – 35 – Fullfør en treningsøkt i kantina på minst 15 minutter.
- St. Monsen – 35 – Overnatt i hagen til en lærer.
- Earlybird – 35 – Overnatt på skolens område.
- Komikeren – 40 – Hold standup i kantina og få minst 5 latere.
- Rævsleiker – 42 – Få signaturen til alle lærerne dine på russedressen.
- Stjerneelev / Presis – 45 – Ha null fravær gjennom hele russetiden.
- Sølvtråd – 45 – Gjennomfør 15 knuter innen 24 timer.
- Māthi hiyi ahh haircut – 50 – Bli skamklipt på skolen i løpet av russetiden.
- Flyplass – 65 – Bruk en koffert som skolesekk en hel uke.
- Kong Lættis – 70 – Hold standup i en kinosal de siste 5 minuttene før filmen starter.
- Edru Russ – 82 – Vær edru gjennom hele russetiden.
- Gulltråd – 80 – Gjennomfør 40 knuter innen 24 timer.
- Føderen – 100 – Fød under russetiden.

## Rampestrek
- Uno Reverse – 10 – Få et russekort av en unge, i stedet for å gi bort ditt.
- Penis Leken – 12 – Ha «penis-leken» (si «penis» stadig høyere) gjennom en hel time.
- Bondeknøl – 12 – Gå uten russesleik en hel dag.
- Kverulanten – 12 – Prut på prisen på øl i butikken.
- Plukk opp! – 12 – Rydd i kantina, eller hjelp til med opprydding etter russedåpen.
- Jonnern – 15 – Overbevis en fremmed om at de kjenner deg.
- Dørvakten – 15 – Ta betalt for å åpne døra ut av butikken for folk.
- Baka – 15 – Rop «baka» for full hals i kantina.
- Kiss or Slap – 15 – Spør en knutesjef om «kiss or slap».
- Kjølevare – 15 – Frys skoen til noen på fest.
- Sladrehalsen – 15 – Sladre på en mindreårig som er på et utested.
- Spaneren – 18 – Oppfør deg mistenkelig like utenfor politistasjonen.
- Kødd – 18 – Vær «kødden» (tøysete på gøy) en hel dag.
- Lættis banan – 18 – Spis 3 bananer i løpet av en presentasjon.
- Dør ringeren – 18 – Ring på døra hos noen og bli stående uten å flytte deg før de lukker.
- Underpult – 18 – Sitt under pulten din en hel skoletime.
- LSSP – 18 – Stjel sokkene til noen i løpet av russetiden.
- Klagemuren – 18 – Be høyt til «Big Yahu» under en eksamen.
- Ave Maria – 18 – Fortell en synd til en av prestene.
- Overpult – 20 – Sitt oppå pulten din en hel skoletime.
- Gjensitting – 20 – Rop «hold kjeft» til en lærer.
- Vrangen – 22 – Gå med alle klærne på vrangen en hel skoledag.
- Dehydrert – 22 – Stå ved vannkranen og nekt andre å fylle vann et helt friminutt.
- Slalåmbakken – 22 – Ak ned trappene i kantina.
- Horndog – 22 – Kjøp kondomer i butikken kun ved hjelp av kroppsspråk.
- Brage Spesial – 25 – Ring 1881 og spør om «benløs bæsjepizza». Samtalen må filmes.
- Parasitt – 25 – Sov hjemme hos en medruss uten at de vet det, og vekk dem med frokost.
- Diktatoren – 25 – Stå køvakt i kantina iført refleksvest og briller.
- Footlong – 25 – Bruk brød som sko en hel skoledag.
- Sexed – 25 – Hold «seksualundervisning» i kantina.
- Shimmamonsteret – 28 – Gaffateip en tannkost til hostens familie på fest.
- Nei – 28 – Si nei til alt en hel dag.
- Kjeft – 28 – Kjeft på statuen av Alexander Kielland i 1 minutt.
- Propellen – 30 – Spring gjennom skolegården til en barneskole i et friminutt, uten å dele ut russekort.
- Gave – 30 – Surr inn bilen til en lærer med dorull.
- Sigma – 30 – Gå med russesleik gjennom hele russetiden.
- Penis – 32 – Tegn peniser på tavla i 10 forskjellige klasserom.
- Jim Carrey – 32 – Si ja til alt en hel dag.
- Smiskeren – 35 – Få et kyss på kinnet av en lærer.
- Ikea – 45 – Lek «hjemmeleken» på IKEA med minst 10 personer.
- Supermann – 45 – Gå en hel dag med undertøyet utenpå russedressen.
- Olsenbanden – 50 – Finn på en rampestrek og vis den til en knutesjef for godkjenning.
- Vågen – 50 – Lat som du er hund inne i en butikk og bjeff på en ansatt.
- Sjarmøren – 25 – Flørt åpenlyst med en lærer gjennom en hel time.

## Alkohol — FJERNET (App Store-vask 2026-07-24)

Hele mappa (23 knuter) fjernet fra seeden — oppfordring til mye alkohol (Apple 1.4.3).
Titlene står i `docs/app-store-content-review.md`. Kan eventuelt gjenskapes
alkoholfritt senere — egen jobb, egen godkjenning.

## Sex — FJERNET (App Store-vask 2026-07-24)

Hele mappa (21 knuter) fjernet fra seeden — eksplisitt seksuelt innhold (Apple 1.1.4)
og minor-safety-risiko. Titlene står i `docs/app-store-content-review.md`.
