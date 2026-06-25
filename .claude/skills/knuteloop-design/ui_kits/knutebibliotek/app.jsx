/* Knutebibliotek — klikkbar mobil-prototype for knutesjefer.
   "Spotify for knutesjefer": bla i biblioteket, importer knuter til skolens mapper,
   lag egne mapper og egne knuter. Hver knute har ÉN hjemmemappe + virtuell "Alle knuter". */
const { useState, useEffect, useMemo, useRef } = React;
const DS = window.KnuteloopDesignSystem_89dd9e;
const { Button, Chip, StickerCard, KnoteIcon, Avatar, StatTile, ProgressBar } = DS;
const { FOLDERS, ALLE, FMETA, KNUTER, diff, SCHOOL, PACK } = window.KB;

const DIFF_TONE = { Lett: 'success', Medium: 'warning', Hard: 'danger', Valgfri: 'neutral' };
const fmt = n => new Intl.NumberFormat('nb-NO').format(n);
const slug = s => 'cf_' + s.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 12) + '_' + Math.random().toString(36).slice(2, 6);

/* ---------- Icons (generic UI glyphs; brand glyphs come from KnoteIcon) ---------- */
const ICONS = {
  Search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  X: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  Plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  Trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  ListPlus: '<path d="M11 12H3"/><path d="M16 6H3"/><path d="M16 18H3"/><path d="M18 9v6"/><path d="M21 12h-6"/>',
  TrendingUp: '<path d="M16 7h6v6"/><path d="m22 7-8.5 8.5-5-5L2 17"/>',
  ShieldAlert: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  SlidersHorizontal: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  Home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  Activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  LibraryBig: '<rect width="8" height="18" x="3" y="3" rx="1"/><path d="M7 3v18"/><path d="M20.4 18.9c.2.5-.1 1.1-.6 1.3l-1.9.7c-.5.2-1.1-.1-1.3-.6L11.1 5.1c-.2-.5.1-1.1.6-1.3l1.9-.7c.5-.2 1.1.1 1.3.6z"/>',
  User: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  Signal: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  Wifi: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
  BatteryFull: '<rect width="16" height="10" x="2" y="7" rx="2"/><line x1="22" x2="22" y1="11" y2="13"/><line x1="6" x2="6" y1="11" y2="13"/><line x1="10" x2="10" y1="11" y2="13"/><line x1="14" x2="14" y1="11" y2="13"/>',
  ChevronRight: '<path d="m9 18 6-6-6-6"/>',
  ArrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  FolderPlus: '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  Folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  PenLine: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  Dumbbell: '<path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/><path d="m21.5 21.5-1.4-1.4"/><path d="M3.9 3.9 2.5 2.5"/><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>',
  Utensils: '<path d="M3 2v7c0 1.1.9 2 2 2a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  Music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  Star: '<path d="M11.5 2.3a.5.5 0 0 1 1 0l2.3 4.7 5.2.7a.5.5 0 0 1 .3.9l-3.8 3.6.9 5.2a.5.5 0 0 1-.8.5L12 16.3 7.4 18.7a.5.5 0 0 1-.8-.5l.9-5.2-3.8-3.6a.5.5 0 0 1 .3-.9l5.2-.7z"/>',
  Heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  Trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  Camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
};
function Lc({ name, size = 22, sw = 1.8, style }) {
  const d = ICONS[name];
  if (!d) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}
    dangerouslySetInnerHTML={{ __html: d }} />;
}
/* Folder glyph — brand (KnoteIcon) or lucide, from a folder meta */
function Glyph({ meta, size = 22 }) {
  if (!meta || !meta.g) return <Lc name="Folder" size={size} />;
  return meta.g.t === 'brand' ? <KnoteIcon name={meta.g.n} size={size} /> : <Lc name={meta.g.n} size={size} />;
}

/* ---------- persistence ---------- */
const LS = {
  get(k, f) { try { const v = localStorage.getItem(k); return v == null ? f : JSON.parse(v); } catch (e) { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};
const ADDED_BY = KNUTER.reduce((m, k) => { if (k.addedBy) m[k.id] = k.addedBy; return m; }, {});

/* ============================== ROOT ============================== */
function App() {
  const [tab, setTab] = useState(() => LS.get('kb.tab.v2', 'utforsk'));
  const [added, setAdded] = useState(() => LS.get('kb.added.v2', KNUTER.filter(k => k.added).map(k => k.id)));
  const [addedBy, setAddedBy] = useState(() => LS.get('kb.addedby.v2', ADDED_BY));
  const [customKnuter, setCustomKnuter] = useState(() => LS.get('kb.cknuter.v2', []));
  const [customFolders, setCustomFolders] = useState(() => LS.get('kb.cfolders.v2', []));
  const [browseFolder, setBrowseFolder] = useState('Alle');
  const [openFolder, setOpenFolder] = useState(null);
  const [sheet, setSheet] = useState(null);     // knute object
  const [confirm, setConfirm] = useState(null);  // knute pending sensitive add
  const [createFolder, setCreateFolder] = useState(false);
  const [createKnute, setCreateKnute] = useState(null); // {presetFolder} | null
  const [toast, setToast] = useState(null);
  const [tweaks, setTweaks] = useState(() => LS.get('kb.tweaks.v2', { frictionGated: true, density: 'komfortabel', social: true }));
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => LS.set('kb.added.v2', added), [added]);
  useEffect(() => LS.set('kb.addedby.v2', addedBy), [addedBy]);
  useEffect(() => LS.set('kb.cknuter.v2', customKnuter), [customKnuter]);
  useEffect(() => LS.set('kb.cfolders.v2', customFolders), [customFolders]);
  useEffect(() => LS.set('kb.tab.v2', tab), [tab]);
  useEffect(() => LS.set('kb.tweaks.v2', tweaks), [tweaks]);

  const allKnuter = useMemo(() => KNUTER.concat(customKnuter), [customKnuter]);
  const allFolders = useMemo(() => FOLDERS.concat(customFolders), [customFolders]);
  const addedSet = useMemo(() => new Set(added), [added]);
  const getFolder = key => FMETA[key] || customFolders.find(f => f.key === key) || ALLE;

  function showToast(msg, tone) {
    setToast({ msg, tone: tone || 'success' });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }
  function doAdd(k) {
    setAdded(a => a.includes(k.id) ? a : [...a, k.id]);
    setAddedBy(m => ({ ...m, [k.id]: null }));
    showToast(`Lagt til i ${getFolder(k.folder).label} ✓`, 'success');
  }
  function toggle(k) {
    if (addedSet.has(k.id)) {
      setAdded(a => a.filter(id => id !== k.id));
      showToast('Fjernet fra knuteboka', 'neutral');
      return;
    }
    if (tweaks.frictionGated && k.sensitive) { setConfirm(k); return; }
    doAdd(k);
  }
  function addPack() {
    const ids = KNUTER.filter(k => k.pack && !addedSet.has(k.id)).map(k => k.id);
    if (!ids.length) { showToast('Alle starter-knuter er allerede lagt til', 'neutral'); return; }
    setAdded(a => [...a, ...ids]);
    showToast(ids.length + ' knuter lagt til ✓', 'success');
  }
  function addFolderAll(folderKey) {
    const ids = KNUTER.filter(k => k.folder === folderKey && !addedSet.has(k.id)).map(k => k.id);
    if (!ids.length) { showToast('Alt i denne mappa er lagt til', 'neutral'); return; }
    setAdded(a => [...a, ...ids]);
    showToast(ids.length + ' knuter lagt til ✓', 'success');
  }
  function onCreateFolder({ label, iconName }) {
    const f = { key: slug(label), label, g: { t: 'lucide', n: iconName }, custom: true };
    setCustomFolders(cf => [...cf, f]);
    setCreateFolder(false);
    showToast('Mappe «' + label + '» opprettet ✓', 'success');
    return f.key;
  }
  function onCreateKnute(data) {
    const k = {
      id: 'ck_' + Math.random().toString(36).slice(2, 8), name: data.name, points: Number(data.points) || 0,
      desc: data.desc, folder: data.folder, evidence: data.evidence, age: data.evidence === 'text' ? 18 : 17,
      schools: 1, pack: false, added: true, addedBy: null, gold: false,
      difficulty: diff(Number(data.points) || 0), sensitive: !!getFolder(data.folder).sensitive, custom: true,
    };
    setCustomKnuter(c => [...c, k]);
    setAdded(a => [...a, k.id]);
    setAddedBy(m => ({ ...m, [k.id]: null }));
    setCreateKnute(null);
    showToast('Egen knute «' + data.name + '» lagt til ✓', 'success');
  }
  function goBrowseFolder(folderKey) {
    setBrowseFolder(folderKey); setOpenFolder(null); setTab('utforsk');
  }

  return (
    <div style={st.stage}>
      <div style={st.phone} className="kb-phone">
        <StatusBar />
        <div style={st.screen} className="knuteloop-canvas kb-scroll">
          {tab === 'utforsk' && (
            <Utforsk allKnuter={allKnuter} addedSet={addedSet} addedBy={addedBy} tweaks={tweaks} getFolder={getFolder}
              folder={browseFolder} setFolder={setBrowseFolder} onToggle={toggle} onOpen={setSheet} onAddPack={addPack} onAddFolder={addFolderAll} />
          )}
          {tab === 'knuteboka' && !openFolder && (
            <Knuteboka allKnuter={allKnuter} allFolders={allFolders} addedSet={addedSet} getFolder={getFolder}
              onOpenFolder={setOpenFolder} goBrowse={() => setTab('utforsk')}
              onNewFolder={() => setCreateFolder(true)} onNewKnute={() => setCreateKnute({})} />
          )}
          {tab === 'knuteboka' && openFolder && (
            <FolderView folderKey={openFolder} meta={getFolder(openFolder)} allKnuter={allKnuter} addedSet={addedSet}
              addedBy={addedBy} tweaks={tweaks} getFolder={getFolder} onBack={() => setOpenFolder(null)}
              onToggle={toggle} onOpen={setSheet} goBrowse={goBrowseFolder} onNewKnute={k => setCreateKnute({ presetFolder: k })} />
          )}
        </div>
        <BottomNav tab={tab} setTab={t => { setTab(t); setOpenFolder(null); }} count={added.length} />

        {sheet && <DetailSheet k={sheet} added={addedSet.has(sheet.id)} addedBy={addedBy[sheet.id]} tweaks={tweaks}
          meta={getFolder(sheet.folder)} onClose={() => setSheet(null)} onToggle={() => toggle(sheet)} />}
        {confirm && <ConfirmSheet k={confirm} meta={getFolder(confirm.folder)} onCancel={() => setConfirm(null)}
          onConfirm={() => { doAdd(confirm); setConfirm(null); }} />}
        {createFolder && <CreateFolderSheet onClose={() => setCreateFolder(false)} onCreate={onCreateFolder} />}
        {createKnute && <CreateKnuteSheet allFolders={allFolders} preset={createKnute.presetFolder} onClose={() => setCreateKnute(null)} onCreate={onCreateKnute} />}
        {toast && <Toast {...toast} />}

        <button style={st.tweakFab} className="sticker" onClick={() => setTweaksOpen(o => !o)} title="Tweaks"><Lc name="SlidersHorizontal" size={20} /></button>
        {tweaksOpen && <Tweaks tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} />}
      </div>
    </div>
  );
}

/* ============================== UTFORSK (bibliotek) ============================== */
function Utforsk({ allKnuter, addedSet, addedBy, tweaks, getFolder, folder, setFolder, onToggle, onOpen, onAddPack, onAddFolder }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return KNUTER.filter(k => {
      if (folder !== 'Alle' && k.folder !== folder) return false;
      if (term && !(k.name.toLowerCase().includes(term) || k.desc.toLowerCase().includes(term))) return false;
      return true;
    }).sort((a, b) => (FOLDERS.findIndex(f => f.key === a.folder) - FOLDERS.findIndex(f => f.key === b.folder)) || a.points - b.points);
  }, [q, folder]);

  const searching = q.trim().length > 0;
  const packAdded = KNUTER.filter(k => k.pack && addedSet.has(k.id)).length;
  const packTotal = KNUTER.filter(k => k.pack).length;
  const fmeta = folder !== 'Alle' ? getFolder(folder) : null;

  return (
    <div>
      <header style={st.head}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow">Knutesjef · {SCHOOL.name}</div>
            <h1 style={st.h1}>Biblioteket</h1>
          </div>
          <Avatar name={SCHOOL.russenavn} size={42} ring="blue" />
        </div>
        <p style={st.lede}>Bla gjennom alle knuter og legg dem i skolens mapper.</p>
      </header>

      <SearchBar value={q} onChange={setQ} />
      <FolderChips value={folder} onChange={setFolder} getFolder={getFolder} />

      {!searching && folder === 'Alle' && <PackHero added={packAdded} total={packTotal} onAddPack={onAddPack} />}

      <div style={{ ...st.sectionRow, marginTop: 18 }}>
        <span style={st.sectionLabel}>{searching ? `Treff på «${q.trim()}»` : (fmeta ? fmeta.label : 'Alle knuter')}</span>
        <span style={st.countPill}>{list.length}</span>
      </div>
      {fmeta && fmeta.note && <div style={st.folderNote}><Lc name="TrendingUp" size={14} sw={2.2} />{fmeta.note}</div>}
      {fmeta && !searching && list.some(k => !addedSet.has(k.id)) && (
        <button style={st.addAllBtn} className="sticker" onClick={() => onAddFolder(folder)}>
          <Lc name="ListPlus" size={17} />Legg til hele «{fmeta.label}»
        </button>
      )}

      {list.length === 0 ? <Empty /> :
        <CatalogCard list={list} addedSet={addedSet} addedBy={addedBy} tweaks={tweaks} getFolder={getFolder} onToggle={onToggle} onOpen={onOpen} />}
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ============================== KNUTEBOKA (Ditt bibliotek) ============================== */
function Knuteboka({ allKnuter, allFolders, addedSet, getFolder, onOpenFolder, goBrowse, onNewFolder, onNewKnute }) {
  const mine = allKnuter.filter(k => addedSet.has(k.id));
  const points = mine.reduce((s, k) => s + k.points, 0);
  const counts = {};
  mine.forEach(k => { counts[k.folder] = (counts[k.folder] || 0) + 1; });
  const folderRows = allFolders.filter(f => counts[f.key] || f.custom);

  return (
    <div>
      <header style={st.head}>
        <div className="eyebrow">{SCHOOL.name}</div>
        <h1 style={st.h1}>Knuteboka</h1>
        <p style={st.lede}>Skolens mapper. Forvaltes sammen med {SCHOOL.co}.</p>
      </header>

      <div style={st.statRow}>
        <StatTile value={mine.length} label="Knuter" tone="primary" align="center" icon={<KnoteIcon name="knute" size={20} />} />
        <StatTile value={fmt(points)} label="Poeng" tone="accent" align="center" icon={<span style={{ fontSize: 18 }}>⭐</span>} />
        <StatTile value={folderRows.length} label="Mapper" tone="card" align="center" icon={<Lc name="Folder" size={18} />} />
      </div>

      {/* Alle knuter — alltid øverst, virtuell */}
      <button style={{ ...st.alleCard }} className="sticker" onClick={() => onOpenFolder('Alle')}>
        <span style={st.alleGlyph}><Lc name="LibraryBig" size={24} /></span>
        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
          <div style={st.folderRowTitle}>Alle knuter</div>
          <div style={st.folderRowSub}>Hele knuteboka · driver søket</div>
        </div>
        <span style={st.folderCount}>{mine.length}</span>
        <Lc name="ChevronRight" size={20} style={{ color: 'var(--text-muted)' }} />
      </button>

      <div style={{ ...st.sectionRow, marginTop: 20 }}>
        <span style={st.sectionLabel}>Mappene dine</span>
        <span style={st.countPill}>{folderRows.length}</span>
      </div>
      <StickerCard padding="none" style={{ overflow: 'hidden', marginTop: 12 }}>
        {folderRows.map((f, i) => (
          <button key={f.key} className="kb-row" onClick={() => onOpenFolder(f.key)}
            style={{ ...st.folderRow, borderTop: i === 0 ? 'none' : '1.5px solid var(--line)' }}>
            <span style={{ ...st.folderRowGlyph, background: f.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)', color: f.sensitive ? 'var(--accent-strong)' : 'var(--primary)' }}>
              <Glyph meta={f} size={22} />
            </span>
            <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
              <div style={st.folderRowTitle}>{f.label}{f.custom && <span style={st.egenTag}>EGEN</span>}</div>
              <div style={st.folderRowSub}>{f.note ? f.note : (counts[f.key] ? counts[f.key] + ' knuter' : 'Tom mappe')}</div>
            </div>
            <span style={st.folderCount}>{counts[f.key] || 0}</span>
            <Lc name="ChevronRight" size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        ))}
      </StickerCard>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <Button variant="secondary" fullWidth onClick={onNewFolder} iconLeft={<Lc name="FolderPlus" size={18} />}>Ny mappe</Button>
        <Button variant="accent" fullWidth onClick={onNewKnute} iconLeft={<Lc name="PenLine" size={18} />}>Lag egen knute</Button>
      </div>
      <div style={{ marginTop: 12 }}>
        <Button variant="ghost" fullWidth onClick={goBrowse} iconLeft={<Lc name="Search" size={18} />}>Finn flere i biblioteket</Button>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ============================== FOLDER VIEW (drill-inn) ============================== */
function FolderView({ folderKey, meta, allKnuter, addedSet, addedBy, tweaks, getFolder, onBack, onToggle, onOpen, goBrowse, onNewKnute }) {
  const isAlle = folderKey === 'Alle';
  const items = allKnuter.filter(k => addedSet.has(k.id) && (isAlle || k.folder === folderKey))
    .sort((a, b) => a.points - b.points);

  return (
    <div>
      <button style={st.backBtn} className="kb-row" onClick={onBack}><Lc name="ArrowLeft" size={20} sw={2.2} />Knuteboka</button>
      <div style={st.folderHead}>
        <span style={{ ...st.folderHeadGlyph, background: meta.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)', color: meta.sensitive ? 'var(--accent-strong)' : 'var(--primary)' }}>
          <Glyph meta={meta} size={32} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ ...st.h1, fontSize: '1.8rem' }}>{meta.label}</h1>
          <div style={st.folderRowSub}>{items.length} knuter{meta.custom ? ' · egen mappe' : ''}</div>
        </div>
      </div>
      {meta.note && <div style={st.folderNote}><Lc name="TrendingUp" size={14} sw={2.2} />{meta.note}</div>}

      {items.length === 0 ? (
        <StickerCard style={{ marginTop: 16, textAlign: 'center' }} padding="xl">
          <div style={{ fontSize: 30 }}>📂</div>
          <h4 style={{ marginTop: 8 }}>Ingen knuter her ennå</h4>
          <p style={{ marginTop: 4 }}>{meta.custom ? 'Legg til knuter fra biblioteket eller lag en egen.' : 'Legg til knuter fra biblioteket.'}</p>
        </StickerCard>
      ) : (
        <CatalogCard list={items} addedSet={addedSet} addedBy={addedBy} tweaks={tweaks} getFolder={getFolder} onToggle={onToggle} onOpen={onOpen} inBook />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {!isAlle && <Button variant="secondary" fullWidth onClick={() => goBrowse(folderKey)} iconLeft={<Lc name="Plus" size={18} />}>Legg til flere fra biblioteket</Button>}
        {(meta.custom || isAlle) && <Button variant="accent" fullWidth onClick={() => onNewKnute(isAlle ? undefined : folderKey)} iconLeft={<Lc name="PenLine" size={18} />}>Lag egen knute{!isAlle ? ' her' : ''}</Button>}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ============================== CATALOG (tette rader) ============================== */
function CatalogCard({ list, addedSet, addedBy, tweaks, getFolder, onToggle, onOpen, inBook }) {
  return (
    <StickerCard padding="none" style={{ overflow: 'hidden', marginTop: 12 }}>
      {list.map((k, i) => (
        <KnuteRow key={k.id} k={k} added={addedSet.has(k.id)} addedBy={addedBy[k.id]} tweaks={tweaks} meta={getFolder(k.folder)}
          first={i === 0} onToggle={() => onToggle(k)} onOpen={() => onOpen(k)} inBook={inBook} />
      ))}
    </StickerCard>
  );
}
function KnuteRow({ k, added, addedBy, tweaks, meta, first, onToggle, onOpen, inBook }) {
  const compact = tweaks.density === 'kompakt';
  return (
    <div onClick={onOpen} style={{ ...st.row, borderTop: first ? 'none' : '1.5px solid var(--line)', padding: compact ? '12px 14px' : '15px 16px' }} className="kb-row">
      <span style={{ ...st.rowGlyph, background: k.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)', color: k.sensitive ? 'var(--accent-strong)' : 'var(--primary)' }}>
        <Glyph meta={meta} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={st.rowTitle}>{k.gold && <span style={{ color: '#d6a429' }}>★ </span>}{k.name}{k.custom && <span style={st.egenTag}>EGEN</span>}</div>
        {!compact && <div style={st.rowDesc}>{k.desc}</div>}
        <div style={st.rowMeta}>
          <Chip tone="accent" size="sm">{k.points} P</Chip>
          <Chip tone={DIFF_TONE[k.difficulty]} size="sm">{k.difficulty}</Chip>
          {k.age >= 18 && <Badge>18+</Badge>}
          {k.evidence === 'text' && <Badge>Tekst-bevis</Badge>}
          {tweaks.social && !compact && !k.custom && <span style={st.social}>· {fmt(k.schools)} skoler</span>}
          {inBook && addedBy && <span style={st.addedBy}>· {addedBy}</span>}
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="sticker kb-toggle" aria-label={added ? 'Fjern' : 'Legg til'}
        style={{ ...st.toggle, background: added ? 'var(--foreground)' : 'var(--card)', color: added ? 'var(--card)' : 'var(--primary)' }}>
        <Lc name={added ? (inBook ? 'Trash' : 'Check') : 'Plus'} size={inBook ? 18 : 20} sw={2.2} />
      </button>
    </div>
  );
}
function Badge({ children }) { return <span style={st.miniBadge}>{children}</span>; }

/* ============================== STARTER PACK ============================== */
function PackHero({ added, total, onAddPack }) {
  const done = added >= total;
  return (
    <StickerCard tone="primary" padding="lg" style={{ marginTop: 16, color: 'var(--text-inverse)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={st.packGlyph}><KnoteIcon name="knute" size={26} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}>Pakke · {total} knuter</div>
          <h3 style={{ color: 'var(--text-inverse)', fontSize: '1.25rem', marginTop: 2 }}>{PACK.name}</h3>
        </div>
      </div>
      <p style={{ color: 'var(--text-inverse)', opacity: 0.9, marginTop: 8, fontSize: 'var(--text-sm)' }}>{PACK.desc}</p>
      <div style={{ margin: '14px 0 12px' }}>
        <ProgressBar value={added} max={total} tone="accent" height={10} />
        <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, marginTop: 6 }}>{added} av {total} lagt til</div>
      </div>
      <Button variant="accent" fullWidth onClick={onAddPack} disabled={done} iconLeft={<Lc name={done ? 'Check' : 'ListPlus'} size={18} />}>
        {done ? 'Hele pakka er lagt til' : `Legg til alle ${total}`}
      </Button>
    </StickerCard>
  );
}

/* ============================== DETALJ-SHEET ============================== */
function DetailSheet({ k, added, addedBy, tweaks, meta, onClose, onToggle }) {
  return (
    <div style={st.scrim} onClick={onClose}>
      <div style={st.sheet} className="kb-sheet" onClick={e => e.stopPropagation()}>
        <div style={st.sheetGrab} />
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ ...st.sheetGlyph, background: k.sensitive ? 'var(--accent-bg)' : 'var(--primary-bg)', color: k.sensitive ? 'var(--accent-strong)' : 'var(--primary)' }}><Glyph meta={meta} size={30} /></span>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.6rem', lineHeight: 1.05 }}>{k.gold && <span style={{ color: '#d6a429' }}>★ </span>}{k.name}</h2>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
              <Chip tone="accent">{k.points} poeng</Chip>
              <Chip tone={DIFF_TONE[k.difficulty]}>{k.difficulty}</Chip>
              <Chip tone="primary" icon={<Glyph meta={meta} size={13} />}>{meta.label}</Chip>
            </div>
          </div>
          <button style={st.sheetX} onClick={onClose} aria-label="Lukk"><Lc name="X" size={20} sw={2.2} /></button>
        </div>
        <p style={{ marginTop: 16, fontSize: 'var(--text-base)', color: 'var(--text)', lineHeight: 1.55 }}>{k.desc}</p>
        {meta.note && <div style={st.folderNote}><Lc name="TrendingUp" size={14} sw={2.2} />{meta.note}</div>}
        <div style={st.metaGrid}>
          <Meta label="Hjemmemappe" value={meta.label} />
          <Meta label="Vanskelighet" value={k.difficulty} />
          <Meta label="Bevis" value={k.evidence === 'text' ? 'Tekst' : 'Bilde / video'} />
          <Meta label="Alder" value={k.age >= 18 ? '18+' : '17+'} />
        </div>
        {tweaks.social && !k.custom && (
          <div style={st.socialBox}><Lc name="TrendingUp" size={18} sw={2} style={{ color: 'var(--primary)' }} /><span><strong>{fmt(k.schools)} skoler</strong> har denne i knuteboka si</span></div>
        )}
        {added && <div style={st.addedNote}><Lc name="Check" size={16} sw={2.4} style={{ color: 'var(--success)' }} />I knuteboka{addedBy ? <> — lagt til av <strong>{addedBy}</strong></> : ' — lagt til av deg'}</div>}
        <div style={{ marginTop: 18 }}>
          <Button variant={added ? 'secondary' : 'accent'} fullWidth onClick={onToggle} iconLeft={<Lc name={added ? 'Trash' : 'Plus'} size={18} sw={2.2} />}>
            {added ? 'Fjern fra knuteboka' : 'Legg til i knuteboka'}
          </Button>
        </div>
      </div>
    </div>
  );
}
function Meta({ label, value }) {
  return <div style={st.metaCell}><div style={st.metaLabel}>{label}</div><div style={st.metaValue}>{value}</div></div>;
}

/* ============================== CONFIRM (friksjon på sensitivt) ============================== */
function ConfirmSheet({ k, meta, onCancel, onConfirm }) {
  const isSex = k.folder === 'Sex';
  return (
    <div style={st.scrim} onClick={onCancel}>
      <div style={{ ...st.sheet, paddingBottom: 22 }} className="kb-sheet" onClick={e => e.stopPropagation()}>
        <div style={st.sheetGrab} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ ...st.sheetGlyph, background: 'var(--accent-bg)', color: 'var(--accent-strong)' }}><Lc name="ShieldAlert" size={26} /></span>
          <div><h3 style={{ fontSize: '1.3rem' }}>Sensitiv knute</h3><div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{meta.label}-mappa</div></div>
        </div>
        <p style={{ marginTop: 14, lineHeight: 1.55 }}><strong>{k.name}</strong> ligger i {meta.label}-mappa{isSex ? ' (18+, kun tekst-bevis)' : ''}. Legg den til i knuteboka til {SCHOOL.name}?</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <Button variant="ghost" fullWidth onClick={onCancel}>Avbryt</Button>
          <Button variant="accent" fullWidth onClick={onConfirm}>Legg til</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================== LAG EGEN MAPPE ============================== */
const FOLDER_ICON_CHOICES = ['Folder', 'Dumbbell', 'Utensils', 'Music', 'Star', 'Heart', 'Trophy', 'Camera'];
function CreateFolderSheet({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Folder');
  const ok = name.trim().length > 1;
  return (
    <div style={st.scrim} onClick={onClose}>
      <div style={{ ...st.sheet, paddingBottom: 24 }} className="kb-sheet" onClick={e => e.stopPropagation()}>
        <div style={st.sheetGrab} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Ny mappe</h2>
          <button style={st.sheetX} onClick={onClose} aria-label="Lukk"><Lc name="X" size={20} sw={2.2} /></button>
        </div>
        <Field label="Navn på mappa">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="F.eks. Sosialt, Tradisjon …" style={st.input} autoFocus />
        </Field>
        <Field label="Ikon">
          <div style={st.iconGrid}>
            {FOLDER_ICON_CHOICES.map(ic => (
              <button key={ic} onClick={() => setIcon(ic)} className="sticker"
                style={{ ...st.iconChoice, background: icon === ic ? 'var(--foreground)' : 'var(--card)', color: icon === ic ? 'var(--card)' : 'var(--text)' }}>
                <Lc name={ic} size={22} />
              </button>
            ))}
          </div>
        </Field>
        <div style={{ marginTop: 20 }}>
          <Button variant="accent" fullWidth disabled={!ok} onClick={() => onCreate({ label: name.trim(), iconName: icon })} iconLeft={<Lc name="FolderPlus" size={18} />}>Opprett mappe</Button>
        </div>
      </div>
    </div>
  );
}

/* ============================== LAG EGEN KNUTE ============================== */
function CreateKnuteSheet({ allFolders, preset, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [points, setPoints] = useState('15');
  const [desc, setDesc] = useState('');
  const [folder, setFolder] = useState(preset || allFolders[0].key);
  const [evidence, setEvidence] = useState('media');
  const ok = name.trim().length > 1 && desc.trim().length > 2;
  return (
    <div style={st.scrim} onClick={onClose}>
      <div style={{ ...st.sheet, paddingBottom: 24 }} className="kb-sheet" onClick={e => e.stopPropagation()}>
        <div style={st.sheetGrab} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Lag egen knute</h2>
          <button style={st.sheetX} onClick={onClose} aria-label="Lukk"><Lc name="X" size={20} sw={2.2} /></button>
        </div>
        <Field label="Navn"><input value={name} onChange={e => setName(e.target.value)} placeholder="F.eks. Skolerevyen" style={st.input} autoFocus /></Field>
        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="Poeng" style={{ width: 110 }}><input value={points} onChange={e => setPoints(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" style={st.input} /></Field>
          <Field label="Mappe" style={{ flex: 1 }}>
            <select value={folder} onChange={e => setFolder(e.target.value)} style={st.input}>
              {allFolders.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Beskrivelse"><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Hva må russen gjøre?" rows={2} style={{ ...st.input, resize: 'none', lineHeight: 1.4 }} /></Field>
        <Field label="Bevis">
          <div style={st.segment}>
            {[['media', 'Bilde / video'], ['text', 'Kun tekst']].map(([v, l]) => (
              <button key={v} onClick={() => setEvidence(v)} style={{ ...st.segBtn, ...(evidence === v ? st.segOn : {}) }}>{l}</button>
            ))}
          </div>
        </Field>
        <div style={{ marginTop: 18 }}>
          <Button variant="accent" fullWidth disabled={!ok} onClick={() => onCreate({ name: name.trim(), points, desc: desc.trim(), folder, evidence })} iconLeft={<Lc name="PenLine" size={18} />}>Legg til i knuteboka</Button>
        </div>
      </div>
    </div>
  );
}
function Field({ label, children, style }) {
  return <label style={{ display: 'block', marginTop: 14, ...style }}><div style={st.fieldLabel}>{label}</div>{children}</label>;
}

/* ============================== CHROME ============================== */
function SearchBar({ value, onChange }) {
  return (
    <div style={st.search} className="sticker">
      <Lc name="Search" size={19} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder="Søk i biblioteket…" style={st.searchInput} />
      {value && <button onClick={() => onChange('')} style={st.searchClear} aria-label="Tøm"><Lc name="X" size={16} sw={2.2} /></button>}
    </div>
  );
}
function FolderChips({ value, onChange, getFolder }) {
  const chips = [{ key: 'Alle', label: 'Alle' }].concat(FOLDERS);
  return (
    <div style={st.chipScroll} className="kb-chips">
      {chips.map(f => {
        const on = value === f.key;
        return (
          <button key={f.key} onClick={() => onChange(f.key)} className="sticker"
            style={{ ...st.fchip, background: on ? 'var(--foreground)' : 'var(--card)', color: on ? 'var(--card)' : 'var(--text)', boxShadow: on ? 'var(--shadow-sticker-sm)' : 'none' }}>
            {f.g && <Glyph meta={f} size={15} />}{f.label}
          </button>
        );
      })}
    </div>
  );
}
function BottomNav({ tab, setTab, count }) {
  const items = [
    { key: 'hjem', label: 'Hjem', icon: <Lc name="Home" size={22} />, real: false },
    { key: 'feed', label: 'Feed', icon: <Lc name="Activity" size={22} />, real: false },
    { key: 'utforsk', label: 'Bibliotek', icon: <Lc name="LibraryBig" size={22} />, real: true },
    { key: 'knuteboka', label: 'Knuteboka', icon: <KnoteIcon name="knute" size={22} />, real: true, badge: count },
    { key: 'profil', label: 'Profil', icon: <Lc name="User" size={22} />, real: false },
  ];
  return (
    <nav style={st.nav} className="sticker">
      {items.map(it => {
        const on = it.key === tab;
        return (
          <button key={it.key} onClick={() => it.real && setTab(it.key)} style={{ ...st.navBtn, opacity: it.real ? 1 : 0.45 }}>
            <span style={{ ...st.navIcon, background: on ? 'var(--foreground)' : 'transparent', color: on ? 'var(--card)' : 'var(--text)' }}>
              {it.icon}{it.badge ? <span style={st.navBadge}>{it.badge}</span> : null}
            </span>
            <span style={{ ...st.navLabel, color: on ? 'var(--text-strong)' : 'var(--text-muted)' }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
function Toast({ msg, tone }) {
  return (
    <div style={st.toast} className="kb-toast sticker">
      {tone === 'success' && <Lc name="Check" size={18} sw={2.6} style={{ color: 'var(--accent)' }} />}<span>{msg}</span>
    </div>
  );
}
function Empty() {
  return (
    <StickerCard style={{ marginTop: 12, textAlign: 'center' }} padding="xl">
      <div style={{ fontSize: 30 }}>🔍</div><h4 style={{ marginTop: 8 }}>Ingen treff</h4><p style={{ marginTop: 4 }}>Prøv et annet søk eller en annen mappe.</p>
    </StickerCard>
  );
}
function StatusBar() {
  return (
    <div style={st.statusbar}>
      <span style={{ fontWeight: 700 }}>9:41</span>
      <div style={st.notch} />
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        <Lc name="Signal" size={15} sw={2.2} /><Lc name="Wifi" size={15} sw={2.2} /><Lc name="BatteryFull" size={17} sw={2} />
      </span>
    </div>
  );
}
function Tweaks({ tweaks, setTweaks, onClose }) {
  const set = (k, v) => setTweaks(t => ({ ...t, [k]: v }));
  return (
    <div style={st.tweakPanel} className="sticker">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>Tweaks</strong>
        <button style={st.sheetX} onClick={onClose} aria-label="Lukk"><Lc name="X" size={16} sw={2.2} /></button>
      </div>
      <TwRow label="Friksjon på 18+/sensitivt" hint="Bekreft før sensitive knuter legges til"><Switch on={tweaks.frictionGated} onClick={() => set('frictionGated', !tweaks.frictionGated)} /></TwRow>
      <TwRow label="Sosialt bevis" hint="«Brukt av N skoler»"><Switch on={tweaks.social} onClick={() => set('social', !tweaks.social)} /></TwRow>
      <TwRow label="Tetthet">
        <div style={st.miniSeg}>
          {['komfortabel', 'kompakt'].map(d => <button key={d} onClick={() => set('density', d)} style={{ ...st.miniSegBtn, ...(tweaks.density === d ? st.segOn : {}) }}>{d === 'komfortabel' ? 'Komf.' : 'Kompakt'}</button>)}
        </div>
      </TwRow>
    </div>
  );
}
function TwRow({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0', borderTop: '1.5px solid var(--line)' }}>
      <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div>{hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{hint}</div>}</div>{children}
    </div>
  );
}
function Switch({ on, onClick }) {
  return <button onClick={onClick} style={{ ...st.switch, background: on ? 'var(--primary)' : 'var(--surface-soft)', justifyContent: on ? 'flex-end' : 'flex-start' }} aria-pressed={on}><span style={st.switchKnob} /></button>;
}

/* ============================== STYLES ============================== */
const st = {
  stage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'radial-gradient(circle at 50% 0%, #e9eef7 0%, #dde3ee 60%, #d3d9e6 100%)' },
  phone: { width: 393, height: 852, background: 'var(--card)', borderRadius: 46, border: '2px solid var(--foreground)', boxShadow: '0 30px 60px -18px rgba(20,26,48,0.5)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  statusbar: { height: 50, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', fontSize: 14, color: 'var(--foreground)', position: 'relative', zIndex: 5 },
  notch: { position: 'absolute', left: '50%', top: 11, transform: 'translateX(-50%)', width: 116, height: 30, background: 'var(--foreground)', borderRadius: 16 },
  screen: { flex: 1, overflowY: 'auto', padding: '6px 16px 0' },
  head: { padding: '10px 2px 2px' },
  h1: { fontSize: '2rem', lineHeight: 0.98, marginTop: 2 },
  lede: { marginTop: 8, fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 320 },

  search: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', borderRadius: 'var(--radius-full)', padding: '11px 16px', marginTop: 14, border: 'var(--border-sticker)', boxShadow: 'var(--shadow-sticker-sm)' },
  searchInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--text)', fontFamily: 'var(--font-sans)' },
  searchClear: { border: 'none', background: 'var(--surface-soft)', borderRadius: '50%', width: 24, height: 24, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 },

  chipScroll: { display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 16px 4px', margin: '0 -16px' },
  fchip: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 'var(--radius-full)', border: 'var(--border-sticker)', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font-sans)' },

  segment: { display: 'flex', gap: 4, background: 'var(--surface-soft)', borderRadius: 'var(--radius-full)', padding: 4, border: '1.5px solid var(--line)' },
  segBtn: { flex: 1, border: 'none', background: 'transparent', borderRadius: 'var(--radius-full)', padding: '9px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' },
  segOn: { background: 'var(--card)', color: 'var(--text-strong)', boxShadow: 'var(--shadow-sticker-sm)' },

  sectionRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' },
  sectionLabel: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text-strong)' },
  countPill: { fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', background: 'var(--surface-soft)', borderRadius: 999, padding: '2px 9px', fontFamily: 'var(--font-mono)' },
  folderNote: { display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 10, padding: '7px 12px', background: 'var(--primary-bg)', border: '1.5px solid color-mix(in srgb, var(--primary) 22%, transparent)', borderRadius: 999, fontSize: 12.5, fontWeight: 700, color: 'var(--primary-strong)' },
  addAllBtn: { display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '9px 16px', background: 'var(--card)', border: 'var(--border-sticker)', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', color: 'var(--text)', boxShadow: 'var(--shadow-sticker-sm)', fontFamily: 'var(--font-sans)' },

  statRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 },

  alleCard: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', marginTop: 18, padding: '14px 16px', background: 'var(--card)', border: 'var(--border-sticker)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sticker)', cursor: 'pointer', textAlign: 'left' },
  alleGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, flexShrink: 0, borderRadius: 'var(--radius-md)', background: 'var(--accent)', color: 'var(--foreground)', border: '2px solid var(--foreground)' },

  folderRow: { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', background: 'var(--card)', border: 'none', cursor: 'pointer' },
  folderRowGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, flexShrink: 0, borderRadius: 'var(--radius-md)', border: '2px solid var(--foreground)' },
  folderRowTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  folderRowSub: { fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  folderCount: { fontSize: 13, fontWeight: 800, color: 'var(--text-soft)', fontFamily: 'var(--font-mono)', minWidth: 22, textAlign: 'right' },
  egenTag: { fontSize: 9.5, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--primary)', background: 'var(--primary-bg)', border: '1.5px solid color-mix(in srgb, var(--primary) 28%, transparent)', borderRadius: 999, padding: '1px 6px' },

  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '8px 14px 8px 10px', background: 'var(--card)', border: 'var(--border-sticker)', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', color: 'var(--text)', boxShadow: 'var(--shadow-sticker-sm)', fontFamily: 'var(--font-sans)' },
  folderHead: { display: 'flex', alignItems: 'center', gap: 14, marginTop: 16 },
  folderHeadGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 58, flexShrink: 0, borderRadius: 16, border: '2px solid var(--foreground)' },

  row: { display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', background: 'var(--card)' },
  rowGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 44, height: 44, flexShrink: 0, borderRadius: 'var(--radius-md)', border: '2px solid var(--foreground)' },
  rowTitle: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, lineHeight: 1.1, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 7 },
  rowDesc: { fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.35, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, flexWrap: 'wrap' },
  social: { fontSize: 11.5, color: 'var(--text-muted)', fontWeight: 600 },
  addedBy: { fontSize: 11.5, color: 'var(--primary)', fontWeight: 700 },
  miniBadge: { display: 'inline-flex', alignItems: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.02em', color: 'var(--text-muted)', border: '1.5px solid var(--line-strong)', borderRadius: 999, padding: '2px 7px', textTransform: 'uppercase' },
  toggle: { width: 40, height: 40, flexShrink: 0, borderRadius: '50%', border: '2px solid var(--foreground)', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sticker-sm)' },

  packGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 14, background: 'var(--accent)', color: 'var(--foreground)', border: '2px solid var(--foreground)', flexShrink: 0 },

  scrim: { position: 'absolute', inset: 0, background: 'rgba(20,26,48,0.42)', zIndex: 30, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(2px)' },
  sheet: { width: '100%', background: 'var(--card)', borderTopLeftRadius: 'var(--radius-xl)', borderTopRightRadius: 'var(--radius-xl)', borderTop: '2px solid var(--foreground)', padding: '12px 18px 26px', maxHeight: '90%', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(20,26,48,0.25)' },
  sheetGrab: { width: 42, height: 5, borderRadius: 999, background: 'var(--line-strong)', opacity: 0.3, margin: '0 auto 14px' },
  sheetGlyph: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 58, height: 58, borderRadius: 16, border: '2px solid var(--foreground)', flexShrink: 0 },
  sheetX: { border: '1.5px solid var(--line)', background: 'var(--surface-soft)', borderRadius: '50%', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 },
  metaCell: { border: '1.5px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '11px 13px', background: 'var(--surface-soft)' },
  metaLabel: { fontSize: 10.5, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  metaValue: { fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: 'var(--text-strong)', marginTop: 3 },
  socialBox: { display: 'flex', alignItems: 'center', gap: 9, marginTop: 14, padding: '11px 13px', background: 'var(--primary-bg)', border: '1.5px solid color-mix(in srgb, var(--primary) 22%, transparent)', borderRadius: 'var(--radius-md)', fontSize: 13.5, color: 'var(--text)' },
  addedNote: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 13, color: 'var(--text-soft)' },

  input: { width: '100%', boxSizing: 'border-box', border: 'var(--border-sticker)', borderRadius: 'var(--radius-md)', padding: '12px 14px', fontSize: 15, fontFamily: 'var(--font-sans)', color: 'var(--text)', background: 'var(--card)', outline: 'none' },
  fieldLabel: { fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 },
  iconGrid: { display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 7 },
  iconChoice: { aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 'var(--radius-md)', border: 'var(--border-sticker)', cursor: 'pointer' },

  nav: { position: 'absolute', left: 14, right: 14, bottom: 14, height: 66, background: 'color-mix(in srgb, var(--card) 88%, transparent)', backdropFilter: 'blur(12px)', borderRadius: 'var(--radius-full)', border: '2px solid var(--foreground)', boxShadow: 'var(--shadow-sticker)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px', zIndex: 20 },
  navBtn: { border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', padding: 0, width: 58 },
  navIcon: { position: 'relative', display: 'grid', placeItems: 'center', width: 40, height: 30, borderRadius: 999, transition: 'all 0.14s' },
  navBadge: { position: 'absolute', top: -4, right: 2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--accent)', color: 'var(--foreground)', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center', border: '1.5px solid var(--foreground)' },
  navLabel: { fontSize: 10, fontWeight: 700 },

  toast: { position: 'absolute', left: '50%', bottom: 92, transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 9, color: 'var(--card)', background: 'var(--foreground)', padding: '12px 18px', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 700, zIndex: 40, whiteSpace: 'nowrap', border: '2px solid var(--foreground)' },
  tweakFab: { position: 'absolute', right: 16, bottom: 92, width: 46, height: 46, borderRadius: '50%', background: 'var(--card)', border: '2px solid var(--foreground)', display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 25, color: 'var(--text)', boxShadow: 'var(--shadow-sticker)' },
  tweakPanel: { position: 'absolute', right: 16, bottom: 148, width: 268, background: 'var(--card)', border: '2px solid var(--foreground)', borderRadius: 'var(--radius-lg)', padding: 16, zIndex: 26, boxShadow: 'var(--shadow-sticker-lg)' },
  miniSeg: { display: 'flex', gap: 3, background: 'var(--surface-soft)', borderRadius: 999, padding: 3, border: '1.5px solid var(--line)' },
  miniSegBtn: { border: 'none', background: 'transparent', borderRadius: 999, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' },
  switch: { width: 46, height: 27, borderRadius: 999, border: '2px solid var(--foreground)', display: 'flex', alignItems: 'center', padding: 2, cursor: 'pointer', flexShrink: 0 },
  switchKnob: { width: 19, height: 19, borderRadius: '50%', background: 'var(--card)', border: '1.5px solid var(--foreground)' },
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
