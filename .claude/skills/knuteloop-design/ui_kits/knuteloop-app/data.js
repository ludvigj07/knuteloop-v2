// Mock data for the Knuteloop app UI kit — bokmål, lifted from the v1 prototype seed.
window.KNL_DATA = (function () {
  const me = {
    russName: 'Sofie Sprint',
    realName: 'Sofie Lunde',
    className: '3STA',
    russType: 'red',
    points: 285,
    rank: 3,
    completed: 15,
    streak: 7,
    bio: 'Knutesjef med full kontroll, rask godkjenning og null ro i russechatten når noe skjer på skolen.',
    quote: 'Full fart, full oversikt, aldri lav energi.',
    school: 'St. Olav vgs',
  };

  const feed = [
    { id: 'f1', name: 'Emil Baka', russType: 'blue', group: '3PBA', time: '8 min', knute: 'Spis 100 nuggets i en studietime', category: 'Generelle', points: 20, caption: 'Klarte 100 på 38 min. Aldri mer nuggets.', likes: 24, comments: 5, rating: 4.6 },
    { id: 'f2', name: 'Nora Neon', russType: 'red', group: '3MKA', time: '32 min', knute: 'Lag en heiarop-video for klassen', category: 'Generelle', points: 35, caption: 'Hele 3MKA stilte opp 🔊', likes: 41, comments: 12, rating: 4.9 },
    { id: 'f3', name: 'Jonas Turbo', russType: 'blue', group: '3IDA', time: '1 t', knute: 'Superman: undertøy utenpå russedrakten', category: 'Fordervett-knuter', points: 20, caption: 'Gikk en hel dag sånn. Verdt det.', likes: 33, comments: 8, rating: 4.2 },
    { id: 'f4', name: 'Leah Lyd', russType: 'red', group: '3STB', time: '2 t', knute: 'Arranger miniquiz om russetiden', category: 'Generelle', points: 30, caption: 'Fem spørsmål, hele klassen med.', likes: 19, comments: 3, rating: 4.4 },
  ];

  const knuter = [
    { id: 'k1', title: 'Spis frokost under pulten', description: 'Start dagen kreativt og hold det low key i første time.', category: 'Generelle', difficulty: 'Lett', points: 10, status: 'Tilgjengelig' },
    { id: 'k2', title: 'Ta klassebilde med matchende solbriller', description: 'Samle gjengen og lever et koordinert bildebevis.', category: 'Dobbelknuter', difficulty: 'Medium', points: 25, status: 'Tilgjengelig' },
    { id: 'k3', title: 'Spis 100 nuggets i en studietime', description: 'Fra St. Olav-listen.', category: 'Generelle', difficulty: 'Medium', points: 20, status: 'Godkjent' },
    { id: 'k4', title: 'Gå edru hele russetiden', description: 'En av de tøffeste — gullknute.', category: 'Alkoholknuter', difficulty: 'Hard', points: 30, status: 'Tilgjengelig', gold: true },
    { id: 'k5', title: 'Lag tinderprofil for noen', description: 'Med samtykke, så klart.', category: 'Sexknuter', difficulty: 'Medium', points: 15, status: 'Tilgjengelig' },
    { id: 'k6', title: 'Frys skoen til noen på fest', description: 'Klassisk rampestrek.', category: 'Fordervett-knuter', difficulty: 'Lett', points: 10, status: 'Venter' },
    { id: 'k7', title: 'Handcuff deg til noen en hel skoledag', description: 'Velg partneren din med omhu.', category: 'Dobbelknuter', difficulty: 'Medium', points: 20, status: 'Tilgjengelig' },
    { id: 'k8', title: 'Hold standup show i kinosal', description: '5 min før filmen begynner.', category: 'Generelle', difficulty: 'Hard', points: 30, status: 'Tilgjengelig' },
  ];

  const folders = [
    { id: 'Generelle', label: 'Generelle', glyph: 'generelle', count: 34, desc: 'Vanlige knuter som passer for de fleste.' },
    { id: 'Dobbelknuter', label: 'Dobbelknuter', glyph: 'dobbel', count: 18, desc: 'Krever ofte en venn eller en gruppe.' },
    { id: 'Alkoholknuter', label: 'Alkoholknuter', glyph: 'alkohol', count: 12, desc: 'Knyttet til drikking eller edruvalg.' },
    { id: 'Sexknuter', label: 'Sexknuter', glyph: 'sex', count: 9, desc: 'Florting, kropp eller dating som tema.' },
    { id: 'Fordervett-knuter', label: 'Fordervett', glyph: 'fordervett', count: 7, desc: 'Trenger ekstra vurdering og dømmekraft.' },
  ];

  const leaders = [
    { rank: 1, name: 'Emil Baka', group: '3PBA', points: 315, russType: 'blue' },
    { rank: 2, name: 'Nora Neon', group: '3MKA', points: 300, russType: 'red' },
    { rank: 3, name: 'Sofie Sprint', group: '3STA', points: 285, russType: 'red', me: true },
    { rank: 4, name: 'Jonas Turbo', group: '3IDA', points: 275, russType: 'blue' },
    { rank: 5, name: 'Leah Lyd', group: '3STB', points: 260, russType: 'red' },
    { rank: 6, name: 'Mads Maks', group: '3PBA', points: 240, russType: 'blue' },
    { rank: 7, name: 'Ida Iskald', group: '3STA', points: 228, russType: 'red' },
  ];

  const queue = [
    { id: 'q1', name: 'Emil Baka', russType: 'blue', knute: 'Spis 100 nuggets i en studietime', points: 20, time: 'I dag 08:42' },
    { id: 'q2', name: 'Leah Lyd', russType: 'red', knute: 'Arranger miniquiz om russetiden', points: 30, time: 'I dag 09:15' },
    { id: 'q3', name: 'Mads Maks', russType: 'blue', knute: 'Frys skoen til noen på fest', points: 10, time: 'I går 22:03' },
  ];

  const badges = [
    { key: 'total', name: 'Knutesamler', glyph: 'knute', tier: 'gull', value: 15, max: 15 },
    { key: 'points', name: 'Poengjager', glyph: 'generelle', tier: 'sølv', value: 285, max: 350 },
    { key: 'social', name: 'Sosial motor', glyph: 'dobbel', tier: 'sølv', value: 7, max: 10 },
    { key: 'party', name: 'Festpuls', glyph: 'alkohol', tier: 'bronze', value: 2, max: 4 },
    { key: 'gold', name: 'Gullknute-jeger', glyph: 'sex', tier: 'bronze', value: 0, max: 1, locked: true },
    { key: 'school', name: 'Skolekaos', glyph: 'fordervett', tier: 'bronze', value: 1, max: 3 },
  ];

  const schools = ['St. Olav vgs', 'Kongsbakken vgs', 'Kannik skole', 'Tromsdalen vgs', 'Bergen Katedralskole'];

  return { me, feed, knuter, folders, leaders, queue, badges, schools };
})();
