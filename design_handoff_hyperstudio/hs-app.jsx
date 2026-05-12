// Hyperstudio — main app shell.

const { useState, useEffect } = React;

// Live-tweakable defaults (editable via the Tweaks panel + persisted to source).
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "moss",
  "density": "comfortable",
  "showInspector": false,
  "state": "default"
}/*EDITMODE-END*/;

// Each theme is a full palette — soft, low-contrast, minimal.
const THEMES = {
  // Light · warm off-white, muted clay accent
  paper: {
    mode: 'light',
    '--bg-0': '#efeae1', '--bg-1': '#faf6ee', '--bg-2': '#f1ebde', '--bg-3': '#e6dec9', '--bg-player': '#1a1611',
    '--fg-1': '#2a241c', '--fg-2': '#5a5042', '--fg-3': '#897e6b', '--fg-4': '#aea38b', '--fg-5': '#c8bda3',
    '--line-1': 'rgba(42,36,28,0.06)', '--line-2': 'rgba(42,36,28,0.10)', '--line-3': 'rgba(42,36,28,0.18)',
    '--accent': '#b87b58', '--accent-2': '#c89070', '--accent-soft': 'rgba(184,123,88,0.12)', '--accent-line': 'rgba(184,123,88,0.32)', '--accent-ink': '#7a4b30',
    '--violet': '#9788c7', '--violet-soft': 'rgba(151,136,199,0.12)',
    '--green':  '#7aa589', '--green-soft':  'rgba(122,165,137,0.14)',
    '--amber':  '#c89548', '--amber-soft':  'rgba(200,149,72,0.14)',
  },
  // Light · cool sage on linen
  linen: {
    mode: 'light',
    '--bg-0': '#e9ebe5', '--bg-1': '#f7f8f3', '--bg-2': '#eceee6', '--bg-3': '#dee1d6', '--bg-player': '#161a17',
    '--fg-1': '#1f231f', '--fg-2': '#4e544e', '--fg-3': '#7a807a', '--fg-4': '#a3a8a1', '--fg-5': '#c2c6bf',
    '--line-1': 'rgba(31,35,31,0.06)', '--line-2': 'rgba(31,35,31,0.10)', '--line-3': 'rgba(31,35,31,0.18)',
    '--accent': '#7a9b7a', '--accent-2': '#92b092', '--accent-soft': 'rgba(122,155,122,0.14)', '--accent-line': 'rgba(122,155,122,0.36)', '--accent-ink': '#3f5d3f',
    '--violet': '#8e8aae', '--violet-soft': 'rgba(142,138,174,0.12)',
    '--green':  '#6c9e88', '--green-soft':  'rgba(108,158,136,0.14)',
    '--amber':  '#bd944c', '--amber-soft':  'rgba(189,148,76,0.14)',
  },
  // Light · dusty blush on cloud
  cloud: {
    mode: 'light',
    '--bg-0': '#e7eaef', '--bg-1': '#f6f8fa', '--bg-2': '#ebeef2', '--bg-3': '#dde1e8', '--bg-player': '#13161b',
    '--fg-1': '#1b1f25', '--fg-2': '#4a4f57', '--fg-3': '#777d87', '--fg-4': '#a3a9b3', '--fg-5': '#c4c9d1',
    '--line-1': 'rgba(27,31,37,0.06)', '--line-2': 'rgba(27,31,37,0.10)', '--line-3': 'rgba(27,31,37,0.18)',
    '--accent': '#c47a82', '--accent-2': '#d4949a', '--accent-soft': 'rgba(196,122,130,0.13)', '--accent-line': 'rgba(196,122,130,0.34)', '--accent-ink': '#7d3b43',
    '--violet': '#8c91b8', '--violet-soft': 'rgba(140,145,184,0.13)',
    '--green':  '#79a394', '--green-soft':  'rgba(121,163,148,0.14)',
    '--amber':  '#c19256', '--amber-soft':  'rgba(193,146,86,0.14)',
  },
  // Dark · soft warm-gray + dusty blue accent
  tide: {
    mode: 'dark',
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#7a9bc4', '--accent-2': '#92b0d6', '--accent-soft': 'rgba(122,155,196,0.13)', '--accent-line': 'rgba(122,155,196,0.36)', '--accent-ink': '#c4dcf0',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green':  '#86b59a', '--green-soft':  'rgba(134,181,154,0.14)',
    '--amber':  '#d9b366', '--amber-soft':  'rgba(217,179,102,0.14)',
  },
  // Dark · soft warm-gray + sage green accent
  moss: {
    mode: 'dark',
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#7aa589', '--accent-2': '#94bba2', '--accent-soft': 'rgba(122,165,137,0.13)', '--accent-line': 'rgba(122,165,137,0.36)', '--accent-ink': '#c8e0d2',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green':  '#86b59a', '--green-soft':  'rgba(134,181,154,0.14)',
    '--amber':  '#d9b366', '--amber-soft':  'rgba(217,179,102,0.14)',
  },
  // Dark · soft slate + deeper teal accent
  abyss: {
    mode: 'dark',
    '--bg-0': '#1a1e25', '--bg-1': '#222730', '--bg-2': '#2b313c', '--bg-3': '#363d4b', '--bg-player': '#0c0f14',
    '--fg-1': '#eaecf0', '--fg-2': '#bac0cb', '--fg-3': '#8a91a0', '--fg-4': '#646a78', '--fg-5': '#484e5a',
    '--line-1': 'rgba(220,228,240,0.06)', '--line-2': 'rgba(220,228,240,0.10)', '--line-3': 'rgba(220,228,240,0.18)',
    '--accent': '#5e9aa8', '--accent-2': '#7ab1be', '--accent-soft': 'rgba(94,154,168,0.14)', '--accent-line': 'rgba(94,154,168,0.36)', '--accent-ink': '#bce0e8',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green':  '#86b59a', '--green-soft':  'rgba(134,181,154,0.14)',
    '--amber':  '#d9b366', '--amber-soft':  'rgba(217,179,102,0.14)',
  },
  // Dark · soft warm-gray, muted clay accent (original)
  mist: {
    mode: 'dark',
    '--bg-0': '#1c1d22', '--bg-1': '#24262c', '--bg-2': '#2d2f37', '--bg-3': '#383b45', '--bg-player': '#0e0f12',
    '--fg-1': '#ebecee', '--fg-2': '#bcbfc5', '--fg-3': '#8c919a', '--fg-4': '#666b75', '--fg-5': '#4a4e58',
    '--line-1': 'rgba(220,225,235,0.06)', '--line-2': 'rgba(220,225,235,0.10)', '--line-3': 'rgba(220,225,235,0.18)',
    '--accent': '#c48a6a', '--accent-2': '#d6a387', '--accent-soft': 'rgba(196,138,106,0.13)', '--accent-line': 'rgba(196,138,106,0.35)', '--accent-ink': '#f0d4be',
    '--violet': '#a89dd1', '--violet-soft': 'rgba(168,157,209,0.13)',
    '--green':  '#86b59a', '--green-soft':  'rgba(134,181,154,0.14)',
    '--amber':  '#d9b366', '--amber-soft':  'rgba(217,179,102,0.14)',
  },
};

function applyTheme(name) {
  const t = THEMES[name] || THEMES.paper;
  const r = document.documentElement.style;
  Object.entries(t).forEach(([k, v]) => { if (k.startsWith('--')) r.setProperty(k, v); });
  document.documentElement.dataset.themeMode = t.mode;
}

// ── Top bar ──────────────────────────────────────────────────────
function TopBar({ stateKind = 'default' }) {
  return (
    <div data-screen-label="00 Top bar" style={{
      height: 48, flexShrink: 0,
      padding: '0 16px',
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--line-2)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'linear-gradient(135deg, var(--accent), #c2410c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
        }}>
          <Ic.Sparkle2 size={14} style={{ color: '#fff' }} stroke={2} />
        </div>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--fg-1)', letterSpacing: -0.1 }}>Hyperstudio</span>
      </div>

      <div style={{ width: 1, height: 18, background: 'var(--line-2)' }} />

      {/* project */}
      <button style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 9px', borderRadius: 5,
        background: 'transparent', border: '1px solid var(--line-1)',
        color: 'var(--fg-1)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
      }}>
        <Ic.Folder size={12} style={{ color: 'var(--fg-3)' }} />
        {PROJECT.name}
        <Ic.ChevronDown size={11} style={{ color: 'var(--fg-4)' }} />
      </button>

      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
        {fmt(PROJECT.duration)} · {PROJECT.resolution} · {PROJECT.fps}fps
      </div>

      <div style={{ flex: 1 }} />

      <StatePill kind={stateKind} />

      <button style={{
        padding: '4px 9px', borderRadius: 5,
        background: 'transparent', border: '1px solid var(--line-2)',
        color: 'var(--fg-2)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}><Ic.Share size={12} />Share</button>
      <button style={{
        padding: '5px 12px', borderRadius: 6,
        background: 'var(--accent)', border: 0, color: '#fff',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        boxShadow: '0 1px 3px rgba(249,115,22,0.4)',
      }}>
        <Ic.ArrowUpRight size={12} />Render
      </button>
    </div>
  );
}

// ── Left rail ────────────────────────────────────────────────────
function LeftRail({ active, onChange }) {
  const items = [
    { id: 'chat',  icon: <Ic.Sparkle size={18} />, label: 'Claude', badge: 1 },
    { id: 'media', icon: <Ic.Film size={18} />,    label: 'Media',  count: MEDIA_ASSETS.length },
    { id: 'audio', icon: <Ic.Music size={18} />,   label: 'Audio',  count: AUDIO_ASSETS.length },
  ];
  return (
    <div style={{
      width: 72, flexShrink: 0,
      background: 'var(--bg-1)', borderRight: '1px solid var(--line-2)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 0', gap: 4,
    }}>
      {items.map(it => {
        const on = it.id === active;
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            style={{
              width: 56, height: 60, borderRadius: 'var(--r-md)',
              background: on ? 'var(--accent-soft)' : 'transparent',
              border: on ? '1px solid var(--accent-line)' : '1px solid transparent',
              color: on ? 'var(--accent-2)' : 'var(--fg-3)',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 4, position: 'relative',
              transition: 'background var(--t-fast), color var(--t-fast)',
            }}>
            {it.icon}
            <span style={{ fontSize: 10, fontWeight: 500, color: on ? 'var(--accent-ink)' : 'var(--fg-3)' }}>{it.label}</span>
            {it.badge && (
              <span style={{
                position: 'absolute', top: 8, right: 10,
                minWidth: 14, height: 14, padding: '0 4px', borderRadius: 999,
                background: 'var(--accent)', color: '#fff', fontSize: 9, fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{it.badge}</span>
            )}
            {on && <div style={{
              position: 'absolute', left: -1, top: 12, bottom: 12, width: 2,
              background: 'var(--accent)', borderRadius: 1,
            }} />}
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <button style={{
        width: 44, height: 44, borderRadius: 'var(--r-md)',
        background: 'transparent', border: 0,
        color: 'var(--fg-4)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }} title="Settings">
        <Ic.Settings size={16} />
      </button>
    </div>
  );
}

// ── Tweaks ───────────────────────────────────────────────────────
function HyperstudioTweaks({ tweaks, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <TweakRadio label="Palette" value={tweaks.theme}
          options={['tide', 'moss', 'abyss', 'mist', 'paper', 'linen', 'cloud']}
          onChange={v => setTweak('theme', v)} />
        <TweakRadio label="Density" value={tweaks.density}
          options={['comfortable', 'compact']}
          onChange={v => setTweak('density', v)} />
      </TweakSection>
      <TweakSection label="State">
        <TweakRadio label="Show" value={tweaks.state}
          options={['default', 'ai-editing', 'rendering', 'delete', 'offline']}
          onChange={v => setTweak('state', v)} />
      </TweakSection>
      <TweakSection label="Layout">
        <TweakToggle label="Inspector panel" value={tweaks.showInspector}
          onChange={v => setTweak('showInspector', v)} />
      </TweakSection>
    </TweaksPanel>
  );
}

// ── Inspector (right-side, off by default) ───────────────────────
function Inspector() {
  return (
    <div data-screen-label="Inspector" style={{
      width: 280, flexShrink: 0,
      background: 'var(--bg-1)', borderLeft: '1px solid var(--line-2)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-1)' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>Inspector</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>IMG_0418.mp4 · A-Roll</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { name: 'Transform', fields: [['Position', '0, 0'], ['Scale', '100%'], ['Rotation', '0°']] },
          { name: 'Color', fields: [['Exposure', '+0.2'], ['Contrast', '+8'], ['Saturation', '–4']] },
          { name: 'Audio', fields: [['Volume', '–3 dB'], ['Mute', 'No']] },
        ].map(group => (
          <div key={group.name}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg-3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
              {group.name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.fields.map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--fg-3)', width: 70 }}>{k}</span>
                  <span className="mono" style={{ flex: 1, padding: '4px 8px', background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 5, color: 'var(--fg-1)', fontSize: 11 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────
function App() {
  const [tab, setTab] = useState('chat');
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => { applyTheme(t.theme); }, [t.theme]);

  const state = t.state || 'default';
  const offline = state === 'offline';
  const rendering = state === 'rendering';
  const showDelete = state === 'delete';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <TopBar stateKind={state} />
      {offline && <OfflineBanner />}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <LeftRail active={tab} onChange={setTab} />
        <div data-screen-label={tab === 'chat' ? '01 Chat' : tab === 'media' ? '02 Media' : '03 Audio'}
          style={{
            width: t.density === 'compact' ? 320 : 360,
            flexShrink: 0,
            background: 'var(--bg-1)', borderRight: '1px solid var(--line-2)',
            display: 'flex', flexDirection: 'column', minHeight: 0,
            opacity: offline ? 0.55 : 1, pointerEvents: offline ? 'none' : 'auto',
            transition: 'opacity 240ms',
          }}>
          {tab === 'chat' && <ClaudeChat />}
          {tab === 'media' && <MediaLibrary />}
          {tab === 'audio' && <AudioLibrary />}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {rendering ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-0)' }}>
              <div style={{
                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
                borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Preview</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>locked during render</span>
                <div style={{ flex: 1 }} />
              </div>
              <RenderingStage progress={0.28} />
            </div>
          ) : <PlayerColumn />}
        </div>
        {t.showInspector && <Inspector />}
      </div>
      <div data-screen-label="04 Timeline" style={{ height: 280, flexShrink: 0 }}>
        <Timeline />
      </div>
      {showDelete && <DeleteCascadeModal onClose={() => setTweak('state', 'default')} />}
      <HyperstudioTweaks tweaks={t} setTweak={setTweak} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
