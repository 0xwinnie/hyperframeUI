// Media library + Audio library panels.

function LibraryHeader({ title, count, importLabel = 'Import' }) {
  return (
    <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--line-1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{title}</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>{count}</span>
        <div style={{ flex: 1 }} />
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 5,
          background: 'var(--bg-2)', border: '1px solid var(--line-2)',
          color: 'var(--fg-1)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
        }}>
          <Ic.Plus size={12} />{importLabel}
        </button>
      </div>
      <div style={{
        marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bg-2)', border: '1px solid var(--line-2)',
        borderRadius: 6, padding: '6px 8px',
      }}>
        <Ic.Search size={12} style={{ color: 'var(--fg-4)' }} />
        <span style={{ fontSize: 12, color: 'var(--fg-4)' }}>Search…</span>
      </div>
    </div>
  );
}

function FilterRow({ filters, active = filters[0] }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '8px 10px 6px', borderBottom: '1px solid var(--line-1)', overflowX: 'auto' }}>
      {filters.map((f) => (
        <button key={f} style={{
          padding: '4px 9px', borderRadius: 999,
          background: f === active ? 'var(--accent-soft)' : 'transparent',
          border: `1px solid ${f === active ? 'var(--accent-line)' : 'var(--line-1)'}`,
          color: f === active ? 'var(--accent-ink)' : 'var(--fg-3)',
          fontSize: 11, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize',
          whiteSpace: 'nowrap',
        }}>{f}</button>
      ))}
    </div>
  );
}

function ThumbBg({ kind, seed = 0 }) {
  // Faux video thumbnail — gradient + a couple of subtle elements so each card looks distinct.
  const palettes = [
    ['#3b2418', '#7c4324'], // brown
    ['#1f2937', '#374151'], // slate
    ['#312e1a', '#736033'], // ochre
    ['#1a2e2a', '#2d5848'], // mossy
    ['#1f1a2e', '#3d2d5e'], // plum
    ['#2a1f1a', '#5e3d2d'], // copper
    ['#1a2530', '#2d4f6e'], // teal
    ['#2e261a', '#5a4d2d'], // hay
  ];
  const [a, b] = palettes[seed % palettes.length];
  if (kind === 'image') {
    return (
      <div style={{
        width: '100%', height: '100%',
        background: `repeating-linear-gradient(45deg, ${a} 0 6px, ${b} 6px 12px)`,
      }} />
    );
  }
  return (
    <div style={{
      width: '100%', height: '100%',
      background: `radial-gradient(120% 80% at 30% 30%, ${b}, ${a})`,
      position: 'relative',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.4))' }} />
    </div>
  );
}

function MediaCard({ asset, index }) {
  return (
    <div style={{
      background: 'var(--bg-2)', border: '1px solid var(--line-1)',
      borderRadius: 'var(--r-md)', overflow: 'hidden', cursor: 'grab',
      transition: 'transform var(--t-fast), border-color var(--t-fast)',
    }}>
      <div style={{ position: 'relative', aspectRatio: '16/10' }}>
        <ThumbBg kind={asset.kind === 'image' ? 'image' : 'video'} seed={index} />
        {asset.kind === 'b-roll' && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            padding: '2px 6px', borderRadius: 4,
            background: 'var(--violet-soft)', border: '1px solid rgba(167,139,250,0.5)',
            color: 'var(--violet)', fontSize: 9, fontWeight: 600, letterSpacing: 0.4,
          }}>B-ROLL</span>
        )}
        {asset.kind === 'image' && (
          <span style={{
            position: 'absolute', top: 6, left: 6,
            padding: '2px 6px', borderRadius: 4,
            background: 'rgba(0,0,0,0.5)', color: 'var(--fg-2)',
            fontSize: 9, fontWeight: 600, letterSpacing: 0.4,
          }}>IMG</span>
        )}
        {asset.used && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            width: 6, height: 6, borderRadius: 999, background: 'var(--green)',
            boxShadow: '0 0 0 3px rgba(74,222,128,0.18)',
          }} />
        )}
        {asset.dur !== '–' && (
          <span className="mono" style={{
            position: 'absolute', bottom: 6, right: 6,
            padding: '1px 5px', borderRadius: 3,
            background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: 10,
          }}>{asset.dur}</span>
        )}
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        <div className="truncate" style={{ fontSize: 12, color: 'var(--fg-1)', fontWeight: 500 }}>{asset.name}</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginTop: 2 }}>
          {asset.resolution} · {asset.size}
        </div>
      </div>
    </div>
  );
}

function MediaLibrary() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <LibraryHeader title="Media" count={MEDIA_ASSETS.length} />
      <FilterRow filters={['all', 'a-roll', 'b-roll', 'image']} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', padding: '4px 4px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ic.Folder size={11} />
          ~/Footage/coffee-shoot-2026-05/
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {MEDIA_ASSETS.map((a, i) => <MediaCard key={a.id} asset={a} index={i} />)}
        </div>
        <div style={{
          marginTop: 12, padding: '14px 12px', borderRadius: 'var(--r-md)',
          border: '1px dashed var(--line-2)', background: 'var(--bg-2)',
          color: 'var(--fg-3)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Ic.Upload size={14} style={{ color: 'var(--fg-3)' }} />
          Drop files here or paste from clipboard
        </div>
      </div>
    </div>
  );
}

function Waveform({ mood = 'neutral', height = 22 }) {
  // procedurally-faked stationary waveform
  const bars = 36;
  const arr = Array.from({ length: bars }).map((_, i) => {
    const t = i / bars;
    const env = Math.sin(t * Math.PI);
    const noise = Math.sin(i * 1.7) * 0.4 + Math.sin(i * 0.6) * 0.6;
    return Math.max(0.18, Math.abs(env * 0.85 + noise * 0.3));
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height }}>
      {arr.map((v, i) => (
        <div key={i} style={{
          flex: 1, height: `${v * 100}%`, background: 'var(--green)',
          opacity: 0.7, borderRadius: 1,
        }} />
      ))}
    </div>
  );
}

function AudioRow({ asset }) {
  const tagColor = {
    music: { bg: 'rgba(74,222,128,0.10)', bd: 'rgba(74,222,128,0.4)', fg: '#86efac' },
    sfx:   { bg: 'rgba(245,194,71,0.10)', bd: 'rgba(245,194,71,0.4)', fg: '#fde68a' },
    vo:    { bg: 'rgba(249,115,22,0.10)', bd: 'rgba(249,115,22,0.4)', fg: 'var(--accent-ink)' },
    ambience: { bg: 'rgba(167,139,250,0.10)', bd: 'rgba(167,139,250,0.4)', fg: '#c4b5fd' },
  }[asset.kind] || { bg: 'var(--bg-3)', bd: 'var(--line-2)', fg: 'var(--fg-2)' };
  return (
    <div style={{
      padding: 10, borderRadius: 'var(--r-md)',
      background: 'var(--bg-2)', border: '1px solid var(--line-1)',
      display: 'flex', flexDirection: 'column', gap: 6, cursor: 'grab',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{
          width: 28, height: 28, borderRadius: 999, background: 'var(--bg-3)',
          border: '1px solid var(--line-2)', color: 'var(--fg-1)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}><Ic.Play size={11} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="truncate" style={{ fontSize: 12, color: 'var(--fg-1)', fontWeight: 500 }}>{asset.name}</div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>{asset.dur} · {asset.mood}</div>
        </div>
        <span style={{
          padding: '2px 6px', borderRadius: 4,
          background: tagColor.bg, border: `1px solid ${tagColor.bd}`,
          color: tagColor.fg, fontSize: 9, fontWeight: 600, letterSpacing: 0.4,
        }}>{asset.kind.toUpperCase()}</span>
      </div>
      <Waveform />
    </div>
  );
}

function AudioLibrary() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <LibraryHeader title="Audio" count={AUDIO_ASSETS.length} />
      <FilterRow filters={['all', 'music', 'sfx', 'vo', 'ambience']} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {AUDIO_ASSETS.map(a => <AudioRow key={a.id} asset={a} />)}
      </div>
    </div>
  );
}

Object.assign(window, { MediaLibrary, AudioLibrary });
