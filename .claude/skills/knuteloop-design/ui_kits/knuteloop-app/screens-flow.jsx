// Knuteloop UI kit — flow screens: Onboarding/Login, Send inn, Knutesjef, Celebration.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const { Button, Chip, StickerCard, Avatar, ProgressBar, KnoteIcon, KnoteLogo, KnuteCard } = DS;
  const Icon = window.KNL_Icon;
  const D = window.KNL_DATA;
  const { useState } = React;
  const Photo = () => window.KNL_SCREENS.Photo;

  // ---------------- ONBOARDING / LOGIN ----------------
  function OnboardingScreen({ onDone }) {
    const [step, setStep] = useState(0); // 0 welcome, 1 school, 2 vipps, 3 russenavn
    const [school, setSchool] = useState(null);
    const [claimed, setClaimed] = useState(null);
    const next = () => setStep((s) => s + 1);

    const Frame = ({ children, footer }) => React.createElement('div', { style: { minHeight: '100%', display: 'flex', flexDirection: 'column', padding: '24px 22px', background: step === 0 ? 'var(--primary)' : 'var(--bg)' } },
      step > 0 ? React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 } },
        React.createElement('button', { onClick: () => setStep((s) => s - 1), style: { border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', display: 'grid', placeItems: 'center' } }, React.createElement(Icon, { name: 'arrowLeft', size: 22 })),
        React.createElement(ProgressBar, { value: step, max: 3, tone: 'primary', style: { flex: 1 } })) : null,
      React.createElement('div', { style: { flex: 1 } }, children),
      footer);

    if (step === 0) return React.createElement(Frame, { footer: React.createElement(Button, { variant: 'accent', size: 'lg', fullWidth: true, onClick: next }, 'Kom i gang') },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 20, color: '#fff' } },
        React.createElement('div', { style: { color: '#fff' } }, React.createElement(KnoteIcon, { name: 'knute', size: 120 })),
        React.createElement('h1', { style: { color: '#fff', fontSize: '2.6rem', lineHeight: 0.95 } }, 'Russetid', React.createElement('br'), 'på loop'),
        React.createElement('p', { style: { color: 'rgba(255,255,255,0.85)', maxWidth: '26ch', fontSize: '1.02rem' } }, 'Fullfør knuter, last opp beviset, og klatre på topplista med klassen din.')));

    if (step === 1) return React.createElement(Frame, { footer: React.createElement(Button, { variant: 'primary', size: 'lg', fullWidth: true, disabled: !school, onClick: next }, 'Fortsett') },
      React.createElement('h2', { style: { fontSize: '1.8rem', marginBottom: 6 } }, 'Velg skolen din'),
      React.createElement('p', { style: { marginBottom: 18 } }, 'Topplista og knutene er knyttet til skolen din.'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        D.schools.map((s) => React.createElement('button', { key: s, onClick: () => setSchool(s), className: 'sticker', style: {
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
          background: school === s ? 'var(--accent-bg)' : 'var(--card)', color: 'var(--foreground)', fontWeight: 700, fontSize: '0.95rem' } },
          React.createElement(Icon, { name: 'mapPin', size: 18, style: { color: 'var(--primary)' } }), React.createElement('span', { style: { flex: 1 } }, s),
          school === s ? React.createElement(Icon, { name: 'check', size: 20, style: { color: 'var(--success)' } }) : null))));

    if (step === 2) return React.createElement(Frame, { footer: null },
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 20 } },
        React.createElement(Avatar, { name: 'Ny Russ', size: 76, ring: 'blue' }),
        React.createElement('h2', { style: { fontSize: '1.7rem' } }, 'Logg inn'),
        React.createElement('p', { style: { maxWidth: '26ch' } }, 'Vi bruker Vipps for å bekrefte at du er deg. Trygt og raskt.'),
        React.createElement('button', { onClick: next, className: 'sticker', style: { width: '100%', height: 56, borderRadius: 999, background: '#ff5b24', color: '#fff', border: 'var(--border-sticker)', fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } },
          React.createElement('span', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' } }, 'Vipps'), '· Logg inn'),
        React.createElement('button', { onClick: next, style: { border: 0, background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' } }, 'Logg inn med Apple')));

    // step 3 — claim russenavn
    const names = ['Sofie Sprint', 'Sofie Storm', 'Sprinter\'n'];
    return React.createElement(Frame, { footer: React.createElement(Button, { variant: 'accent', size: 'lg', fullWidth: true, disabled: !claimed, onClick: onDone }, 'Inn i appen') },
      React.createElement('h2', { style: { fontSize: '1.8rem', marginBottom: 6 } }, 'Ditt russenavn'),
      React.createElement('p', { style: { marginBottom: 18 } }, 'Knutesjefen har tildelt deg et russenavn. Bekreft det som er ditt.'),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
        names.map((n) => React.createElement('button', { key: n, onClick: () => setClaimed(n), className: 'sticker', style: {
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left',
          background: claimed === n ? 'var(--accent-bg)' : 'var(--card)', color: 'var(--foreground)', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.05rem' } },
          React.createElement(Avatar, { name: n, size: 36, ring: 'red' }), React.createElement('span', { style: { flex: 1 } }, n),
          claimed === n ? React.createElement(Icon, { name: 'check', size: 20, style: { color: 'var(--success)' } }) : null))));
  }

  // ---------------- SEND INN (SUBMIT) ----------------
  function SubmitScreen({ onClose, onSubmitted }) {
    const [knute, setKnute] = useState(D.knuter[3]);
    const [picked, setPicked] = useState(false);
    return React.createElement('div', { style: { padding: '8px 16px 16px', minHeight: '100%' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } },
        React.createElement('button', { onClick: onClose, style: { border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', display: 'grid', placeItems: 'center' } }, React.createElement(Icon, { name: 'x', size: 24 })),
        React.createElement('div', { style: { fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' } }, 'Send inn knute'),
        React.createElement('span', { style: { width: 24 } })),
      React.createElement('div', { className: 'eyebrow', style: { margin: '0 0 8px' } }, 'Valgt knute'),
      React.createElement(KnuteCard, { title: knute.title, description: knute.description, category: knute.category, difficulty: knute.difficulty, points: knute.points, status: 'Tilgjengelig', gold: knute.gold }),
      React.createElement('div', { className: 'eyebrow', style: { margin: '16px 0 8px' } }, 'Bevis'),
      picked
        ? React.createElement('div', { style: { position: 'relative' } },
            React.createElement('div', { style: { height: 220, borderRadius: 'var(--radius-md)', border: 'var(--border-sticker)', background: 'linear-gradient(135deg, #2b3a55, #11203a)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.9)' } }, React.createElement(Icon, { name: 'image', size: 40 })),
            React.createElement('button', { onClick: () => setPicked(false), style: { position: 'absolute', top: 10, right: 10, width: 34, height: 34, borderRadius: 999, border: 'var(--border-sticker)', background: 'var(--card)', cursor: 'pointer', display: 'grid', placeItems: 'center' } }, React.createElement(Icon, { name: 'x', size: 18 })))
        : React.createElement('button', { onClick: () => setPicked(true), className: 'sticker', style: { width: '100%', height: 220, borderRadius: 'var(--radius-md)', background: 'var(--surface-soft)', border: '2px dashed var(--line-strong)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--primary)' } },
            React.createElement(Icon, { name: 'camera', size: 40 }),
            React.createElement('span', { style: { fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--foreground)' } }, 'Ta eller velg bilde')),
      React.createElement('textarea', { placeholder: 'Skriv en kort tekst… (valgfritt)', rows: 3, style: { width: '100%', marginTop: 14, padding: '14px 16px', borderRadius: 'var(--radius-md)', border: 'var(--border-sticker)', background: 'var(--card)', fontFamily: 'var(--font-sans)', resize: 'none', boxShadow: 'var(--shadow-sticker-sm)' } }),
      React.createElement(Button, { variant: 'accent', size: 'lg', fullWidth: true, disabled: !picked, onClick: onSubmitted, style: { marginTop: 16 }, iconLeft: React.createElement(Icon, { name: 'check', size: 20 }) }, 'Send til godkjenning'));
  }

  // ---------------- KNUTESJEF (ADMIN QUEUE) ----------------
  function AdminScreen({ onBack }) {
    const [queue, setQueue] = useState(D.queue);
    const act = (id) => setQueue((q) => q.filter((x) => x.id !== id));
    return React.createElement('div', { style: { padding: '8px 16px 16px' } },
      React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } },
        React.createElement('button', { onClick: onBack, style: { border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--foreground)', display: 'grid', placeItems: 'center' } }, React.createElement(Icon, { name: 'arrowLeft', size: 22 })),
        React.createElement('div', null,
          React.createElement('div', { className: 'eyebrow' }, 'Knutesjef'),
          React.createElement('h2', { style: { fontSize: '1.6rem', lineHeight: 1 } }, 'Til godkjenning'))),
      React.createElement(StickerCard, { tone: 'soft', padding: 'md', style: { marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 } },
        React.createElement('span', { style: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--primary)' } }, queue.length),
        React.createElement('span', { style: { fontWeight: 700, color: 'var(--text-soft)' } }, queue.length === 1 ? 'innsending venter' : 'innsendinger venter')),
      queue.length === 0
        ? React.createElement(StickerCard, { style: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } },
            React.createElement(Icon, { name: 'check', size: 36, style: { color: 'var(--success)' } }),
            React.createElement('div', { style: { fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '1.1rem' } }, 'Alt er gjennomgått!'),
            React.createElement('p', { style: { fontSize: '0.88rem' } }, 'Ingen flere innsendinger akkurat nå.'))
        : React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
            queue.map((q) => React.createElement(StickerCard, { key: q.id, padding: 'md' },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } },
                React.createElement(Avatar, { name: q.name, ring: q.russType, size: 40 }),
                React.createElement('div', { style: { flex: 1, minWidth: 0 } },
                  React.createElement('div', { style: { fontWeight: 800, fontFamily: 'var(--font-display)' } }, q.name),
                  React.createElement('div', { style: { fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 } }, q.time)),
                React.createElement(Chip, { tone: 'accent', size: 'sm' }, '+' + q.points)),
              React.createElement('div', { style: { height: 150, borderRadius: 'var(--radius-md)', border: '2px dashed var(--line-strong)', background: 'var(--surface-media)', display: 'grid', placeItems: 'center', color: 'var(--text-muted)', marginBottom: 10 } }, React.createElement(Icon, { name: 'image', size: 28 })),
              React.createElement('div', { style: { fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginBottom: 12 } }, q.knute),
              React.createElement('div', { style: { display: 'flex', gap: 10 } },
                React.createElement(Button, { variant: 'destructive', size: 'sm', onClick: () => act(q.id), iconLeft: React.createElement(Icon, { name: 'x', size: 16 }) }, 'Avvis'),
                React.createElement(Button, { variant: 'primary', size: 'sm', fullWidth: true, onClick: () => act(q.id), iconLeft: React.createElement(Icon, { name: 'check', size: 16 }) }, 'Godkjenn'))))));
  }

  // ---------------- CELEBRATION OVERLAY ----------------
  function Celebration({ onClose }) {
    return React.createElement('div', { style: { position: 'absolute', inset: 0, zIndex: 50, background: 'color-mix(in srgb, var(--russ-navy) 78%, transparent)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', gap: 18 } },
      React.createElement('div', { style: { display: 'flex', gap: 6, marginBottom: -8 } },
        ['var(--accent)', 'var(--russ-red)', '#fff', 'var(--primary)'].map((c, i) => React.createElement('span', { key: i, style: { width: 10, height: 10, borderRadius: 3, background: c, animation: 'knlpop 0.5s ' + (i * 0.08) + 's both' } }))),
      React.createElement(DS.BadgeMedallion, { icon: React.createElement(KnoteIcon, { name: 'knute', size: 30 }), name: 'Knutesamler', tier: 'gull', caption: '15 knuter', size: 110 }),
      React.createElement('h2', { style: { color: '#fff', fontSize: '1.9rem', lineHeight: 1 } }, 'Godkjent!', React.createElement('br'), '+20 poeng'),
      React.createElement('p', { style: { color: 'rgba(255,255,255,0.82)', maxWidth: '24ch' } }, 'Du låste opp Knutesamler i gull og klatret forbi Nora på topplista.'),
      React.createElement(Button, { variant: 'accent', size: 'lg', onClick: onClose }, 'Fortsett'),
      React.createElement('style', null, '@keyframes knlpop{0%{transform:translateY(8px) scale(0);opacity:0}100%{transform:translateY(0) scale(1);opacity:1}}'));
  }

  window.KNL_SCREENS = Object.assign(window.KNL_SCREENS || {}, { OnboardingScreen, SubmitScreen, AdminScreen, Celebration });
})();
