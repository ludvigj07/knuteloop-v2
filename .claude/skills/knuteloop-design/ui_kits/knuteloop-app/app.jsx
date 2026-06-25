// Knuteloop UI kit — phone shell, tab bar, router & flow state.
(function () {
  const DS = window.KnuteloopDesignSystem_89dd9e;
  const Icon = window.KNL_Icon;
  const S = window.KNL_SCREENS;
  const { useState } = React;

  const TABS = [
    { id: 'feed', label: 'Hjem', icon: 'home' },
    { id: 'knuter', label: 'Knuter', icon: 'grid' },
    { id: 'toppliste', label: 'Topp', icon: 'trophy' },
    { id: 'profil', label: 'Profil', icon: 'user' },
  ];

  function StatusBar({ dark }) {
    const c = dark ? '#fff' : 'var(--foreground)';
    return React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px 4px', color: c, fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-mono)', flexShrink: 0 } },
      React.createElement('span', null, '9:41'),
      React.createElement('span', { style: { display: 'inline-flex', gap: 6, alignItems: 'center' } },
        React.createElement('span', { style: { width: 17, height: 11, border: '1.5px solid ' + c, borderRadius: 3, display: 'inline-block', position: 'relative' } },
          React.createElement('span', { style: { position: 'absolute', inset: 1.5, background: c, borderRadius: 1 } }))));
  }

  function App() {
    const [phase, setPhase] = useState('onboarding');
    const [tab, setTab] = useState('feed');
    const [overlay, setOverlay] = useState(null); // 'submit' | 'admin'
    const [celebrate, setCelebrate] = useState(false);
    const [feedVariant, setFeedVariant] = useState('rich');

    // expose a tiny control for the demo toolbar (feed variation tweak)
    window.__knlSetFeedVariant = setFeedVariant;
    window.__knlGetFeedVariant = () => feedVariant;

    const onboarding = phase === 'onboarding';

    let content;
    if (onboarding) {
      content = React.createElement(S.OnboardingScreen, { onDone: () => setPhase('app') });
    } else if (tab === 'feed') content = React.createElement(S.FeedScreen, { variant: feedVariant });
    else if (tab === 'knuter') content = React.createElement(S.KnuterScreen);
    else if (tab === 'toppliste') content = React.createElement(S.LeaderboardScreen);
    else if (tab === 'profil') content = React.createElement(S.ProfileScreen, { onAdmin: () => setOverlay('admin') });

    return React.createElement('div', { className: 'knl-phone' },
      React.createElement(StatusBar, { dark: onboarding && true && (false) }),
      React.createElement('div', { className: 'knl-viewport', key: phase + tab },
        content,
        overlay === 'submit' ? React.createElement('div', { className: 'knl-sheet' }, React.createElement(S.SubmitScreen, { onClose: () => setOverlay(null), onSubmitted: () => { setOverlay(null); setCelebrate(true); } })) : null,
        overlay === 'admin' ? React.createElement('div', { className: 'knl-sheet' }, React.createElement(S.AdminScreen, { onBack: () => setOverlay(null) })) : null,
        celebrate ? React.createElement(S.Celebration, { onClose: () => setCelebrate(false) }) : null),
      !onboarding ? React.createElement(TabBar, { tab, setTab, onSubmit: () => setOverlay('submit') }) : null);
  }

  function TabBar({ tab, setTab, onSubmit }) {
    return React.createElement('div', { className: 'knl-tabbar' },
      TABS.slice(0, 2).map((t) => React.createElement(TabBtn, { key: t.id, t, active: tab === t.id, onClick: () => setTab(t.id) })),
      React.createElement('button', { onClick: onSubmit, 'aria-label': 'Send inn', className: 'sticker', style: {
        width: 56, height: 56, borderRadius: 999, background: 'var(--accent)', color: 'var(--accent-foreground)',
        display: 'grid', placeItems: 'center', cursor: 'pointer', marginTop: -22, flexShrink: 0 } },
        React.createElement(Icon, { name: 'plus', size: 28, strokeWidth: 2.6 })),
      TABS.slice(2).map((t) => React.createElement(TabBtn, { key: t.id, t, active: tab === t.id, onClick: () => setTab(t.id) })));
  }

  function TabBtn({ t, active, onClick }) {
    return React.createElement('button', { onClick, style: {
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 0, background: 'transparent', cursor: 'pointer',
      color: active ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 700, fontSize: 11 } },
      React.createElement(Icon, { name: t.icon, size: 23, strokeWidth: active ? 2.4 : 2 }),
      t.label);
  }

  ReactDOM.createRoot(document.getElementById('app')).render(React.createElement(App));
})();
