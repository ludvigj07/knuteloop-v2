/* Knutebibliotek — katalog-seed (utdrag fra Stavanger-russens knutebok + et par
   tematiske mapper). Ekte navn/poeng fra docs/library-seed-source.md.
   Modell: hver knute har ÉN hjemmemappe. "Alle knuter" er virtuell (driver søk).
   Eksponeres som window.KB. */
(function () {
  // Mappene i biblioteket (TYPE/tema). "Alle" er virtuell og finnes alltid.
  // g = glyf: {t:'brand'} bruker KnoteIcon, {t:'lucide'} bruker inline-ikon.
  const FOLDERS = [
    { key: 'Generelle',  label: 'Generelle',  g: { t: 'brand',  n: 'generelle' } },
    { key: 'Dobbel',     label: 'Dobbel',     g: { t: 'brand',  n: 'dobbel' }, note: 'Teller som 2 mot tråd-knutene' },
    { key: 'Rampestrek', label: 'Rampestrek', g: { t: 'brand',  n: 'fordervett' } },
    { key: 'Sport',      label: 'Sport',      g: { t: 'lucide', n: 'Dumbbell' } },
    { key: 'Mat',        label: 'Mat',        g: { t: 'lucide', n: 'Utensils' } },
    { key: 'Alkohol',    label: 'Alkohol',    g: { t: 'brand',  n: 'alkohol' }, sensitive: true },
    { key: 'Sex',        label: 'Sex',        g: { t: 'brand',  n: 'sex' }, sensitive: true },
  ];
  const ALLE = { key: 'Alle', label: 'Alle knuter', g: { t: 'lucide', n: 'LibraryBig' }, virtual: true };

  function diff(points) {
    if (points <= 0) return 'Valgfri';
    if (points < 20) return 'Lett';
    if (points <= 45) return 'Medium';
    return 'Hard';
  }

  // id, name, points, desc, folder, evidence('media'|'text'), age(17|18),
  // schools(bruk), pack(Anbefalt starter), added(i knuteboka), addedBy(medknutesjef|null)
  const RAW = [
    // ---- Generelle ----
    ['bi', 'BI', 28, 'Vipps økonomisjefen i russestyret 10 kr.', 'Generelle', 'media', 17, 124, true, true, null],
    ['romeo', 'Romeo', 10, 'Skriv et romantisk dikt til loveboss og les det opp.', 'Generelle', 'media', 17, 98, true, true, null],
    ['bikkja', 'Bikkjå', 10, 'Bjeff høyt minst 10 ganger i løpet av én skoletime.', 'Generelle', 'media', 17, 110, true, true, null],
    ['lattis', 'Lættis Alarm', 12, 'Få en knutesjef til å le høyt.', 'Generelle', 'media', 17, 87, true, false, null],
    ['jafs', 'Jafs', 13, 'Spis en hel cheeseburger i én jafs.', 'Generelle', 'media', 17, 76, true, false, null],
    ['klam', 'Klam', 15, 'Gjennomfør en hel kroppsøvingstime iført russedress.', 'Generelle', 'media', 17, 64, true, false, null],
    ['rim', 'Rim', 45, 'Hold en hel presentasjon på rim.', 'Generelle', 'media', 17, 52, false, false, null],
    ['mukbang', 'Mukbang', 83, 'Spis 54 nuggets i løpet av én studietime.', 'Generelle', 'media', 17, 19, false, false, null],

    // ---- Dobbel ----
    ['bronsetrad', 'Bronsetråd', 25, 'Gjennomfør 5 knuter innen 24 timer.', 'Dobbel', 'media', 17, 90, true, true, 'Turbo-Jonas'],
    ['skuespill', 'Skuespill', 25, 'Fremfør et skuespill i kantina i minst 5 minutter.', 'Dobbel', 'media', 17, 58, true, true, 'Turbo-Jonas'],
    ['singalong', 'Sing a Long', 25, 'Start allsang i kantina.', 'Dobbel', 'media', 17, 71, true, false, null],
    ['komikeren', 'Komikeren', 40, 'Hold standup i kantina og få minst 5 latere.', 'Dobbel', 'media', 17, 44, false, false, null],
    ['solvtrad', 'Sølvtråd', 45, 'Gjennomfør 15 knuter innen 24 timer.', 'Dobbel', 'media', 17, 49, false, false, null],
    ['flyplass', 'Flyplass', 65, 'Bruk en koffert som skolesekk en hel uke.', 'Dobbel', 'media', 17, 28, false, false, null],
    ['gulltrad', 'Gulltråd', 80, 'Gjennomfør 40 knuter innen 24 timer.', 'Dobbel', 'media', 17, 22, false, false, null, true],

    // ---- Rampestrek ----
    ['unoreverse', 'Uno Reverse', 10, 'Få et russekort av en unge, i stedet for å gi bort ditt.', 'Rampestrek', 'media', 17, 95, true, true, null],
    ['plukkopp', 'Plukk opp!', 12, 'Rydd i kantina, eller hjelp til etter russedåpen.', 'Rampestrek', 'media', 17, 80, true, true, null],
    ['baka', 'Baka', 15, 'Rop «baka» for full hals i kantina.', 'Rampestrek', 'media', 17, 67, true, false, null],
    ['vrangen', 'Vrangen', 22, 'Gå med alle klærne på vrangen en hel skoledag.', 'Rampestrek', 'media', 17, 54, false, false, null],
    ['diktatoren', 'Diktatoren', 25, 'Stå køvakt i kantina iført refleksvest og briller.', 'Rampestrek', 'media', 17, 48, false, false, null],
    ['footlong', 'Footlong', 25, 'Bruk brød som sko en hel skoledag.', 'Rampestrek', 'media', 17, 39, false, false, null],
    ['ikea', 'Ikea', 45, 'Lek «hjemmeleken» på IKEA med minst 10 personer.', 'Rampestrek', 'media', 17, 31, false, false, null],
    ['olsenbanden', 'Olsenbanden', 50, 'Finn på en rampestrek og vis den til en knutesjef.', 'Rampestrek', 'media', 17, 26, false, false, null],

    // ---- Sport (tematisk eksempel-mappe) ----
    ['planken', 'Planken', 15, 'Hold planken i 3 minutter midt i kantina.', 'Sport', 'media', 17, 40, false, false, null],
    ['stigeroret', 'Stigerøret', 20, 'Ta 50 push-ups på rad uten pause.', 'Sport', 'media', 17, 33, false, false, null],
    ['maraton', 'Maraton', 45, 'Løp 10 km i full russedress.', 'Sport', 'media', 17, 17, false, false, null],
    ['svommetur', 'Svømmetur', 22, 'Ta en kald morgendukkert før skolen.', 'Sport', 'media', 17, 28, false, false, null],

    // ---- Mat (tematisk eksempel-mappe) ----
    ['pizzakongen', 'Pizzakongen', 18, 'Spis en hel pizza alene på 15 minutter.', 'Mat', 'media', 17, 38, false, false, null],
    ['sterk', 'Sterk', 22, 'Spis en hel chili uten å drikke noe etterpå.', 'Mat', 'media', 17, 30, false, false, null],
    ['frokostmester', 'Frokostmester', 12, 'Lag og server frokost til hele slepet.', 'Mat', 'media', 17, 24, false, false, null],

    // ---- Alkohol (sensitivt) ----
    ['beerpong', 'Beerpong', 25, 'Arranger en beerpong-turnering i et friminutt eller en matpause.', 'Alkohol', 'media', 17, 36, false, true, null],
    ['nydag', 'Ny Dag', 12, 'Start dagen med en enhet i frokostblandingen.', 'Alkohol', 'media', 17, 18, false, false, null],
    ['skal', 'Skål', 67, 'Tilby en i russestyret en enhet i skoletiden.', 'Alkohol', 'media', 17, 12, false, false, null],

    // ---- Sex (18+, tekst-bevis) ----
    ['solibat', 'Sølibat', 0, 'Ikke ha sex gjennom hele russetiden.', 'Sex', 'text', 18, 30, false, false, null],
    ['festival', 'Festival', 55, 'Ha frivillig sex på Vaulen, med samtykke.', 'Sex', 'text', 18, 11, false, false, null],
    ['firstlady', 'FirstLady', 55, 'Ha frivillig sex med russepresidenten, med samtykke.', 'Sex', 'text', 18, 8, false, false, null],
    ['kongla', 'Konglå', 70, 'Ha frivillig sex utendørs, med samtykke.', 'Sex', 'text', 18, 7, false, false, null],
  ];

  const FMETA = {};
  FOLDERS.forEach(f => { FMETA[f.key] = f; });

  const KNUTER = RAW.map(function (r) {
    const folder = r[4];
    const meta = FMETA[folder] || {};
    return {
      id: r[0], name: r[1], points: r[2], desc: r[3], folder: folder,
      evidence: r[5], age: r[6], schools: r[7],
      pack: r[8], added: r[9], addedBy: r[10] || null, gold: r[11] || false,
      difficulty: diff(r[2]),
      sensitive: !!meta.sensitive,
      custom: false,
    };
  });

  window.KB = {
    FOLDERS, ALLE, FMETA,
    KNUTER,
    diff,
    SCHOOL: { name: 'St. Olav VGS', russenavn: 'Emma', co: 'Turbo-Jonas' },
    PACK: { name: 'Anbefalt starter', desc: 'Ludvig sin standardpakke — trygge knuter å åpne kullet med.' },
  };
})();
