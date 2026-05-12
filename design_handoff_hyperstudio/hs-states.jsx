// State overlays — AI editing, rendering, delete cascade, offline.

function StatePill({ kind }) {
  // replaces the "Claude working" pill in the top bar based on state
  const map = {
    'ai-editing': { dot: 'var(--accent)', bg: 'var(--accent-soft)', bd: 'var(--accent-line)', fg: 'var(--accent-ink)', label: 'Claude editing · cut_segment' },
    'rendering':  { dot: '#f5c247', bg: 'rgba(245,194,71,0.10)', bd: 'rgba(245,194,71,0.4)', fg: '#fde68a', label: 'Rendering · 28%' },
    'offline':    { dot: '#ef4444', bg: 'rgba(239,68,68,0.10)', bd: 'rgba(239,68,68,0.36)', fg: '#fca5a5', label: 'Offline · Claude unreachable' },
    'default':    { dot: 'var(--accent)', bg: 'var(--accent-soft)', bd: 'var(--accent-line)', fg: 'var(--accent-ink)', label: 'Claude working' },
  };
  const v = map[kind] || map.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: v.bg, border: `1px solid ${v.bd}`,
      color: v.fg, fontSize: 11, fontWeight: 500,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: v.dot }} className={kind === 'default' || kind === 'ai-editing' ? 'spin' : ''} />
      {v.label}
    </span>
  );
}

// ── Rendering overlay (replaces player stage) ────────────────────
function RenderingStage({ progress = 0.28 }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div style={{
      flex: 1, position: 'relative', background: 'var(--bg-player)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 22,
    }}>
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line-2)" strokeWidth="6" />
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--accent)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <div className="mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--fg-1)', letterSpacing: -0.5 }}>{Math.round(progress * 100)}<span style={{ fontSize: 16, color: 'var(--fg-3)' }}>%</span></div>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)', marginBottom: 4 }}>Rendering final cut</div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--fg-3)' }}>0:24 / 1:24 · h.264 · 1080p · ETA 0:42</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{
          padding: '6px 14px', borderRadius: 6,
          background: 'transparent', border: '1px solid var(--line-2)',
          color: 'var(--fg-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>Cancel</button>
        <button style={{
          padding: '6px 14px', borderRadius: 6,
          background: 'var(--bg-2)', border: '1px solid var(--line-2)',
          color: 'var(--fg-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
        }}>Render in background</button>
      </div>
      {/* live preview thumbstrip */}
      <div style={{
        position: 'absolute', bottom: 24, left: 24, right: 24,
        background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 10,
        border: '1px solid var(--line-2)',
      }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)', marginBottom: 6 }}>LIVE PREVIEW · frame 720 / 2520</div>
        <div style={{ display: 'flex', gap: 3, height: 38 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 2,
              background: `radial-gradient(120% 90% at ${15 + i * 3}% 30%, #7c4324, #2a1a12 75%)`,
              opacity: i < 7 ? 1 : 0.25,
              border: i === 6 ? '1px solid var(--accent)' : 'none',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Delete-cascade modal ─────────────────────────────────────────
function DeleteCascadeModal({ onClose }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 460, background: 'var(--bg-1)',
        border: '1px solid var(--line-2)', borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-3)', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.36)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fca5a5',
            }}><Ic.Trash size={15} /></div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--fg-1)' }}>Delete caption and matching video?</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, marginBottom: 14 }}>
            You're deleting caption <code className="mono" style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 4, color: 'var(--accent-2)' }}>"AI might replace baristas"</code>. Hyperstudio can also remove the matching <strong>A-Roll segment 0:39–0:43</strong> so the video stays in sync.
          </div>
          {/* preview row */}
          <div style={{
            background: 'var(--bg-2)', borderRadius: 6, padding: 10,
            display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 14, borderRadius: 2, background: 'var(--accent)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 56 }}>A-Roll</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', flex: 1 }}>IMG_0421.mp4 · 0:39–0:43</span>
              <span className="mono" style={{ fontSize: 10, color: '#fca5a5' }}>− 4.0s</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 4, height: 14, borderRadius: 2, background: 'var(--amber)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', width: 56 }}>Caption</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-1)', flex: 1 }}>"AI might replace baristas"</span>
              <span className="mono" style={{ fontSize: 10, color: '#fca5a5' }}>− 1 line</span>
            </div>
          </div>
        </div>
        <div style={{
          padding: '12px 22px', background: 'var(--bg-2)',
          borderTop: '1px solid var(--line-1)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--fg-3)', cursor: 'pointer' }}>
            <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--bg-3)', border: '1px solid var(--line-3)' }} />
            Don't ask again for this project
          </label>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            padding: '6px 12px', borderRadius: 5,
            background: 'transparent', border: '1px solid var(--line-2)',
            color: 'var(--fg-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>Keep video</button>
          <button onClick={onClose} style={{
            padding: '6px 12px', borderRadius: 5,
            background: '#dc2626', border: 0, color: '#fff',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Delete both</button>
        </div>
      </div>
    </div>
  );
}

// ── Offline banner ───────────────────────────────────────────────
function OfflineBanner() {
  return (
    <div style={{
      padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(239,68,68,0.08)',
      borderBottom: '1px solid rgba(239,68,68,0.28)',
      color: '#fecaca', fontSize: 12,
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: '#ef4444' }} />
      <strong style={{ color: '#fca5a5' }}>You're offline.</strong>
      <span style={{ color: 'var(--fg-3)' }}>Claude is unreachable — local editing, undo, and rendering still work.</span>
      <div style={{ flex: 1 }} />
      <button style={{
        padding: '3px 9px', borderRadius: 5,
        background: 'transparent', border: '1px solid rgba(239,68,68,0.35)',
        color: '#fca5a5', fontSize: 11, fontWeight: 500, cursor: 'pointer',
      }}>Retry</button>
    </div>
  );
}

Object.assign(window, { StatePill, RenderingStage, DeleteCascadeModal, OfflineBanner });
