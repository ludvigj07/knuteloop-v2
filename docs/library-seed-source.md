# Knutebibliotek — seed-kilde (PR-3)

> **Dette er sannhetskilden for bibliotek-seeden.** Ludvig leverte innholdet 2026-06-18.
> Seed-skriptet i `apps/api/scripts/` koder denne lista inn i `library_knuter` + pakker.
> Hold denne fila og seeden i synk. Hyper-lokale referanser (Breiavatnet, Beverly, IB-linja,
> Preikestolen, Gunnar …) er Stavanger-spesifikke — perfekt for pilot/demo, generaliseres når
> det nasjonale biblioteket kurateres.

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
- Bunnjeger – 18 – Popp (plukk opp og putt i munnen) en snus du finner på bakken.
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
- Instagram Logo – 28 – Skriv body count i Instagram-bioen din i minst 24 timer.
- Dobbeldekker – 28 – Ha 4 snus i leppen samtidig i minst 5 minutter.
- Russelue – 30 – Gjennomfør russedåp sammen med en medruss.
- Narkis – 32 – Røyk en sneip (brukt sigarett) du finner på bakken.
- Kvalmen – 35 – Ha 10 snus i munnen samtidig i minst 5 minutter.
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
- Prime – 100 – Tatover «RT2026» på kroppen.

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
- Schni – 12 – Bom en snus av noen i russestyret.
- Siggen – 12 – Bom en sigarett av en lærer.
- Schnibrother – 12 – Spør en lærer om å få bomme snus eller røyk.
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
- Den siste snev – 18 – Bom en sigarett, knekk den, si «røyking dreper», og prøv så å røyke den samme sigaretten.
- Ave Maria – 18 – Fortell en synd til en av prestene.
- Lappslapp – 18 – «Slapp en lappe» (gi en lett dask) i fjeset til en 08/09 (førstis).
- Jeremy Fragrance – 20 – «Ta en linje» (av f.eks. melis) i timen og rop «POWER». Kokain er strengt ulovlig.
- Overpult – 20 – Sitt oppå pulten din en hel skoletime.
- Gjensitting – 20 – Rop «hold kjeft» til en lærer.
- Vrangen – 22 – Gå med alle klærne på vrangen en hel skoledag.
- Dehydrert – 22 – Stå ved vannkranen og nekt andre å fylle vann et helt friminutt.
- Slalåmbakken – 22 – Ak ned trappene i kantina.
- Horndog – 22 – Kjøp kondomer i butikken kun ved hjelp av kroppsspråk.
- Brage Spesial – 25 – Ring 1881 og spør om «benløs bæsjepizza». Samtalen må filmes.
- Parasitt – 25 – Sov hjemme hos en medruss uten at de vet det, og vekk dem med frokost.
- Diktatoren – 25 – Stå køvakt i kantina iført refleksvest og briller.
- Tyven / Robbery – 25 – Stjel pulten til en 08/09 (førstis) midt i undervisningen.
- Nokas – 18 – Ta lunsjen til en Vg1- eller Vg2-elev.
- Footlong – 25 – Bruk brød som sko en hel skoledag.
- Sexed – 25 – Hold «seksualundervisning» i kantina.
- Kannibalen / Akillis – 25 – Bit en Vg1-elev i ankelen.
- Pedotaxi – 25 – Kjør 4 førstiser hjem fra skolen og forlang betaling.
- Gullschni – 25 – Bom en hel boks snus av noen i russestyret.
- Shimmamonsteret – 28 – Gaffateip en tannkost til hostens familie på fest.
- Nei – 28 – Si nei til alt en hel dag.
- Truse – 28 – Sitt en hel skoletime kun i undertøy.
- Kjeft – 28 – Kjeft på statuen av Alexander Kielland i 1 minutt.
- L – 28 – Sett en «L»-lapp (øvelseskjøring) på en politibil.
- Propellen – 30 – Spring gjennom skolegården til en barneskole i et friminutt, uten å dele ut russekort.
- Gave – 30 – Surr inn bilen til en lærer med dorull.
- Sigma – 30 – Gå med russesleik gjennom hele russetiden.
- Kommando (under dressen) – 30 – Gå naken under russedressen en hel dag.
- Penis – 32 – Tegn peniser på tavla i 10 forskjellige klasserom.
- Jim Carrey – 32 – Si ja til alt en hel dag.
- Dørhåndtakstesten – 32 – Slikk dørhåndtaket på do.
- Smiskeren – 35 – Få et kyss på kinnet av en lærer.
- Gulvtesten – 35 – Slikk gulvet på toalettet til McDonald's.
- Driteren – 35 – Gjør fra deg på skoletoalettet uten å trekke ned.
- Autografen – 35 – Få en i russestyret til å signere på rumpa di.
- Ikea – 45 – Lek «hjemmeleken» på IKEA med minst 10 personer.
- FTP – 45 – Kyss en politibetjent.
- Kommando (naken ute) / Nudisten – 45 – Gå eller løp naken utendørs sammen med medruss, med samtykke.
- Supermann – 45 – Gå en hel dag med undertøyet utenpå russedressen.
- Olsenbanden – 50 – Finn på en rampestrek og vis den til en knutesjef for godkjenning.
- Vågen – 50 – Lat som du er hund inne i en butikk og bjeff på en ansatt.
- Pisseren – 50 – Tiss på området til en annen skole i løpet av russetiden.
- Piercing – 60 – Ta en nippel-piercing i løpet av russetiden.
- Ice Spice – 30 – Gi eller få en lapdance i kantina (motsatt kjønn). [ingen media]
- Magic Mike – 35 – Gi et styremedlem en lapdance på minst 30 sekunder. [ingen media]
- Golden spice – 40 – Gi russepresidenten en lapdance. [ingen media]
- Sjarmøren – 25 – Flørt åpenlyst med en lærer gjennom en hel time.

## Alkohol
- Ny Dag – 12 – Start dagen med øl eller cider i frokostblandingen.
- Barmhjertig Samaritan – 18 – Kjøp en enhet til en medruss du ikke kjenner.
- Alle gode ting er 3 – 20 – Shotgun en valgfri 0,33-enhet på 3 sekunder.
- Vaskebjørnen – 22 – Drikk en enhet ut av en sko.
- Vannpistol – 25 – Shotgun en 0,5-liters enhet.
- Beerpong – 25 – Arranger en beerpong-turnering i et friminutt eller en matpause.
- T-Rex – 28 – Drikk en hel enhet uten å bruke hendene.
- Dagsfylla – 30 – Shotgun en pils i heisen på vei opp til skolen.
- Et Glass Til – 30 – Ha 0,5 i promille en hel dag i russetiden. Du blir promilletestet på skolen av knutesjefene.
- Stoisk – 30 – Ta et shot helt uten reaksjon. Reagerer du, blir det et nytt shot.
- Krabbe – 32 – Gå inn i en butikk på alle fire og kjøp en enhet.
- Navlelo – 35 – Ta en bellyshot fra en i russestyret.
- Siamesiske Tvillinger – 40 – Drikk en hel kveld teipet fast til en medruss.
- Hydrert – 40 – Ha sprit i vannflaska og drikk av den gjennom hele skoledagen.
- Fulltidsalkoholiker – 40 – Vær på Beverly fra åpning til stenging.
- Upside Down – 45 – Drikk en hel enhet mens du står på hendene.
- Alkisen – 45 – Drikk et brett med øl i løpet av 24 timer (0,33 er lov).
- Vinfluensa – 50 – Drikk en vinflaske på 10 minutter.
- Tørsteslukkeren – 55 – Shotgun 3 pils på 1 minutt.
- Beermile – 66 – Løp 4 runder på en 400 m-bane og drikk en enhet per runde.
- Hundre på hundre – 78 – Ta 100 shots på 100 minutter (kan være alkoholfritt).
- Tissetrengt – 80 – Drikk en 6-pack uten å gå på do, innen 1 time.
- Skål – 67 – Tilby en i russestyret en enhet i skoletiden.

## Sex
> Hele mappa: `evidence_type = 'text'` ([ingen media]) **og** `min_age = 18`.
- Sølibat – 0 – Ikke ha sex gjennom hele russetiden. [ingen media]
- Konsultasjon – 35 – Vis puppene dine til en knutesjef. [ingen media]
- Sekstisex – 37 – Ha frivillig sex på ett minutt. [ingen media]
- Blomsten og B-en – 45 – Ha frivillig sex på IB-toalettet. [ingen media]
- Judas – 45 – Ha frivillig sex med en rødruss. [ingen media]
- Monica Milf – 50 – Ha frivillig sex med en som er over 30 år. [ingen media]
- A-laget – 50 – Ha frivillig sex med noen fra IB-linja. Begge må være 18+. [ingen media]
- Skarpskytter – 50 – Ha frivillig sex med samme person gjennom hele russetiden. [ingen media]
- Homiehopper – 55 – Ha frivillig sex med 3 fra samme gjeng i løpet av russetiden. [ingen media]
- FirstLady – 55 – Ha frivillig sex med russepresidenten, med samtykke. [ingen media]
- Festival – 55 – Ha frivillig sex på Vaulen, med samtykke. [ingen media]
- Støvsugeren – 55 – Gi visepresidenten et avsug, med samtykke. [ingen media]
- Thomas toget – 55 – Bli «raila» av togsjefen(e) i løpet av russetiden, med samtykke. [ingen media]
- Villedende hykleri / Pullout – 55 – Ha frivillig sex med prevensjonssjefen uten kondom, med samtykke. [ingen media]
- Bilett kontroll – 60 – Ha frivillig sex på et busstopp. Ekstra knute om bussen kjører forbi. [ingen media]
- Kirkinator – 60 – Bli «cumshottet» i halsen, med samtykke. [ingen media]
- Pythagoras – 60 – Ha frivillig sex med to samtidig (trekant), med samtykke. [ingen media]
- Perfekt Weekend – 60 – Ligg med en ny person hver dag i løpet av helgen. [ingen media]
- Konglå – 70 – Ha frivillig sex utendørs. [ingen media]
- Gullkonglå – 88 – Ha frivillig sex i et tre. [ingen media]
- Diamantkonglå – 97 – Ha frivillig sex i et tre på skolen. [ingen media]
