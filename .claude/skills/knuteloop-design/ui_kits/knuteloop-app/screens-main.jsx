// Knuteloop UI kit — main tab screens: Hjem (feed), Knuter, Toppliste, Profil.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const { Button, Chip, StickerCard, Avatar, StatTile, ProgressBar, KnoteIcon, KnoteLogo, KnuteCard, LeaderRow, BadgeMedallion } = DS;
  const Icon = window.KNL_Icon;
  const D = window.KNL_DATA;
  const { useState } = React;

  // Rank title ladder (lowercase exports aren't on the DS namespace, so keep a local copy).
  function getLeaderboardTitle(rank) {
    if (rank === 1) return "O' Store Knutemester";
    if (rank <= 3) return 'Knutemester';
    if (rank <= 10) return 'Knutebaron';
    if (rank <= 20) return 'Knuteridder';
    if (rank <= 35) return 'Knutesersjant';
    if (rank <= 55) return 'Knuteknekt';
    if (rank <= 80) return 'Knutelærling';
    if (rank <= 110) return 'Knuteamatør';
    if (rank <= 145) return 'Knuteprøvling';
    if (rank <= 185) return 'Knutetabbe';
    if (rank <= 220) return 'Knutenybegynner';
    return 'Knutekatastrofen';
  }

  const ScreenHead = ({ title, sub, right }) => (
    React.createElement('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '6px 4px 14px' } },
      React.createElement('div', null,
        sub && React.createElement('div', { className: 'eyebrow', style: { marginBottom: 2 } }, sub),
        React.createElement('h2', { style: { fontSize: '1.7rem', lineHeight: 1 } }, title)),
      right));

  const IconBtn = ({ name, onClick, badge }) => (
    React.createElement('button', { onClick, className: 'sticker', style: {
      width: 42, height: 42, borderRadius: 'var(--radius-full)', background: 'var(--card)',
      display: 'grid', placeItems: 'center', color: 'var(--foreground)', cursor: 'pointer', position: 'relative' } },
      React.createElement(Icon, { name, size: 20 }),
      badge ? React.createElement('span', { style: { position: 'absolute', top: -3, right: -3, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 999, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', border: '2px solid var(--card)' } }, badge) : null));

  // PHOTO placeholder block (no real photos in the kit)
  const Photo = ({ label, h = 200, glyph = 'image' }) => (
    React.createElement('div', { style: {
      height: h, borderRadius: 'var(--radius-md)', border: '2px dashed var(--line-strong)',
      background: 'repeating-linear-gradient(45deg, var(--surface-soft), var(--surface-soft) 10px, var(--surface-media) 10px, var(--surface-media) 20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-muted)' } },
      React.createElement(Icon, { name: glyph, size: 26 }),
      React.createElement('span', { style: { fontSize: '0.72rem', fontWeight: 700 } }, label)));

  // ---------------- HJEM (FEED) ----------------
  function FeedScreen({ variant = 'rich', onOpenKnuter }) {
    return React.createElement('div', { style: { padding: '0 16px 16px' } },
      React.createElement('div', { style: { position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)', paddingTop: 8 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 12px' } },
          React.createElement(KnoteLogo, { size: 24 }),
          React.createElement('div', { style: { display: 'flex', gap: 8 } },
            React.createElement('span', { className: 'sticker', style: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0 12px', height: 42, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-foreground)', fontWeight: 800, fontFamily: 'var(--font-mono)' } },
              React.createElement('img', { src: '../../assets/icons/streak-flame.svg', width: 18, alt: '' }), '7'),
            React.createElement(IconBtn, { name: 'bell', badge: 3 })))),
      // Dagens knute
      React.createElement(StickerCard, { tone: 'primary', radius: 'lg', style: { marginBottom: 14, position: 'relative', overflow: 'hidden' } },
        React.createElement('div', { className: 'eyebrow', style: { color: 'var(--accent)' } }, 'Dagens knute'),
        React.createElement('h3', { style: { color: '#fff', margin: '4px 0 8px', fontSize: '1.25rem' } }, 'Spis lunsj utendørs med russebuksa på'),
        React.createElement('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
          React.createElement(Chip, { tone: 'accent' }, '+20 poeng'),
          React.createElement('span', { style: { flex: 1 } }),
          React.createElement(Button, { variant: 'accent', size: 'sm' }, 'Gjør den'))),
      // Feed
      D.feed.map((p) => React.createElement(StickerCard, { key: p.id, padding: 'md', style: { marginBottom: 14 } },
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } },
          React.createElement(Avatar, { name: p.name, ring: p.russType, size: 40 }),
          React.createElement('div', { style: { flex: 1, minWidth: 0 } },
            React.createElement('div', { style: { fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: '0.98rem', color: 'var(--text-strong)' } }, p.name),
            React.createElement('div', { style: { fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 } }, p.group + ' · ' + p.time)),
          React.createElement(Chip, { tone: 'success', size: 'sm' }, 'Godkjent')),
        variant === 'rich' ? React.createElement(Photo, { label: 'Bildebevis', h: 190 }) : null,
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0' } },
          React.createElement(Chip, { tone: 'primary', size: 'sm', icon: React.createElement(KnoteIcon, { name: 'knute', size: 12 }) }, p.knute),
          React.createElement(Chip, { tone: 'accent', size: 'sm' }, '+' + p.points)),
        p.caption ? React.createElement('p', { style: { fontSize: '0.9rem', color: 'var(--text)', margin: '2px 0 10px' } }, p.caption) : null,
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 16, color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.82rem' } },
          React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } }, React.createElement(Icon, { name: 'heart', size: 18 }), p.likes),
          React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5 } }, React.createElement(Icon, { name: 'message', size: 18 }), p.comments),
          React.createElement('span', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--accent-strong)' } }, React.createElement(Icon, { name: 'star', size: 18 }), p.rating),
          React.createElement('span', { style: { flex: 1 } }),
          React.createElement(Icon, { name: 'share', size: 18 })))));
  }

  // ---------------- KNUTER (CATALOG) ----------------
  function KnuterScreen() {
    const [folder, setFolder] = useState('Alle');
    const list = folder === 'Alle' ? D.knuter : D.knuter.filter((k) => k.category === folder);
    return React.createElement('div', { style: { padding: '8px 16px 16px' } },
      React.createElement(ScreenHead, { sub: D.me.school, title: 'Knuter',
        right: React.createElement(IconBtn, { name: 'search' }) }),
      React.createElement('div', { style: { display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, margin: '0 -16px', padding: '0 16px 12px' } },
        [{ id: 'Alle', label: 'Alle', glyph: 'knute', count: D.knuter.length }, ...D.folders].map((f) =>
          React.createElement('button', { key: f.id, onClick: () => setFolder(f.id), className: 'sticker', style: {
            flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
            background: folder === f.id ? 'var(--primary)' : 'var(--card)', color: folder === f.id ? '#fff' : 'var(--foreground)', fontWeight: 700, fontSize: '0.85rem' } },
            React.createElement(KnoteIcon, { name: f.glyph, size: 16 }), f.label,
            React.createElement('span', { style: { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', opacity: 0.7 } }, f.count)))),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
        list.map((k) => React.createElement(KnuteCard, { key: k.id, title: k.title, description: k.description, category: k.category, difficulty: k.difficulty, points: k.points, status: k.status, gold: k.gold, onPress: () => {} }))));
  }

  // ---------------- TOPPLISTE ----------------
  function LeaderboardScreen() {
    const [scope, setScope] = useState('Skolen');
    return React.createElement('div', { style: { padding: '8px 16px 16px' } },
      React.createElement(ScreenHead, { sub: D.me.school, title: 'Toppliste' }),
      React.createElement('div', { style: { display: 'flex', gap: 6, padding: 4, background: 'var(--surface-soft)', border: 'var(--border-sticker)', borderRadius: 999, marginBottom: 16 } },
        ['Skolen', 'Klassen'].map((s) => React.createElement('button', { key: s, onClick: () => setScope(s), style: {
          flex: 1, padding: '9px', borderRadius: 999, border: 0, cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem',
          background: scope === s ? 'var(--primary)' : 'transparent', color: scope === s ? '#fff' : 'var(--text-soft)' } }, s))),
      React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 } },
        (scope === 'Klassen' ? D.leaders.filter((l) => l.group === D.me.className || l.me) : D.leaders).map((l) =>
          React.createElement(LeaderRow, { key: l.rank, rank: l.rank, name: l.name, group: l.group, points: l.points, russType: l.russType, highlight: l.me }))),
      React.createElement(StickerCard, { tone: 'accent', padding: 'md', style: { display: 'flex', alignItems: 'center', gap: 12 } },
        React.createElement('div', { style: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.6rem' } }, '#3'),
        React.createElement('div', { style: { flex: 1 } },
          React.createElement('div', { style: { fontWeight: 800, fontFamily: 'var(--font-display)' } }, getLeaderboardTitle(3)),
          React.createElement('div', { style: { fontSize: '0.78rem', opacity: 0.75, fontWeight: 600 } }, 'Du mangler 15 poeng til 2. plass')),
        React.createElement('img', { src: '../../assets/icons/streak-flame.svg', width: 30, alt: '' })));
  }

  // ---------------- PROFIL ----------------
  function ProfileScreen({ onAdmin }) {
    const m = D.me;
    return React.createElement('div', { style: { padding: '8px 16px 16px' } },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 8 } },
        React.createElement(IconBtn, { name: 'shield', onClick: onAdmin }),
        React.createElement(IconBtn, { name: 'settings' })),
      React.createElement(StickerCard, { tone: 'primary', radius: 'xl', style: { marginBottom: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 } },
        React.createElement(Avatar, { name: m.russName, ring: 'accent', size: 84 }),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 } },
          React.createElement('div', { style: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: '#fff', lineHeight: 1.15, whiteSpace: 'nowrap' } }, m.russName),
          React.createElement('div', { style: { color: 'var(--accent)', fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.1 } }, getLeaderboardTitle(m.rank))),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement(Chip, { tone: 'accent', size: 'sm' }, 'Rødruss'),
          React.createElement(Chip, { tone: 'neutral', size: 'sm', style: { background: 'rgba(255,255,255,0.16)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' } }, m.className))),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 16 } },
        React.createElement(StatTile, { value: m.points, label: 'Poeng', align: 'center', style: { minWidth: 0, padding: '12px 6px' } }),
        React.createElement(StatTile, { value: m.completed, label: 'Knuter', align: 'center', style: { minWidth: 0, padding: '12px 6px' } }),
        React.createElement(StatTile, { value: '#' + m.rank, label: 'Rang', align: 'center', style: { minWidth: 0, padding: '12px 6px' } }),
        React.createElement(StatTile, { value: m.streak, label: 'Streak', align: 'center', tone: 'accent', style: { minWidth: 0, padding: '12px 6px' } })),
      React.createElement('div', { className: 'eyebrow', style: { margin: '4px 4px 10px' } }, 'Merker'),
      React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 16 } },
        D.badges.map((b) => React.createElement('div', { key: b.key, style: { display: 'flex', justifyContent: 'center' } },
          React.createElement(BadgeMedallion, { icon: React.createElement(KnoteIcon, { name: b.glyph, size: 22 }), name: b.name, tier: b.tier, caption: b.locked ? null : b.value + '/' + b.max, locked: b.locked, size: 60 })))),
      React.createElement(StickerCard, { padding: 'md' },
        React.createElement('div', { className: 'eyebrow', style: { marginBottom: 6 } }, 'Kjent for'),
        React.createElement('p', { style: { color: 'var(--text)', fontSize: '0.92rem', margin: 0 } }, m.bio)));
  }

  window.KNL_SCREENS = Object.assign(window.KNL_SCREENS || {}, { FeedScreen, KnuterScreen, LeaderboardScreen, ProfileScreen, Photo, ScreenHead, IconBtn });
})();
