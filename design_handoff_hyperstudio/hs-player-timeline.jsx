// Player area + Timeline.

const TIMELINE_DURATION = 84;
const fmt = (s) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  const ss = Math.floor(r);
  const ff = Math.round((r - ss) * 30);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}:${String(ff).padStart(2, '0')}`;
};

// ── Player ───────────────────────────────────────────────────────
function PlayerStage() {
  return (
    <div style={{
      flex: 1, position: 'relative', background: 'var(--bg-player)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* faux video frame — a cozy kitchen scene */}
      <div style={{
        position: 'relative', width: '88%', maxWidth: 920, aspectRatio: '16/9',
        borderRadius: 'var(--r-md)', overflow: 'hidden',
        background: 'radial-gradient(120% 90% at 30% 35%, #5e3d2d, #2a1a12 60%, #0a0604)',
        boxShadow: '0 30px 60px rgba(0,0,0,0.55)',
      }}>
        {/* sun/window light */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '120%',
          background: 'radial-gradient(closest-side, rgba(253,186,116,0.35), transparent 70%)' }} />
        {/* "steam" */}
        <div style={{ position: 'absolute', left: '38%', top: '32%', width: '22%', height: '34%',
          background: 'radial-gradient(closest-side, rgba(255,255,255,0.18), transparent 75%)',
          filter: 'blur(8px)' }} />
        {/* mug silhouette (rect + ellipse) */}
        <div style={{ position: 'absolute', left: '40%', bottom: '14%', width: '22%', height: '38%' }}>
          <div style={{ position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #3a2418, #1a0e08)',
            borderRadius: '12% 12% 22% 22% / 8% 8% 14% 14%',
            boxShadow: 'inset -10px -10px 20px rgba(0,0,0,0.5), inset 8px 8px 20px rgba(253,186,116,0.18)',
          }} />
          <div style={{ position: 'absolute', top: '8%', left: '12%', right: '12%', height: '12%',
            background: 'radial-gradient(closest-side, rgba(60,30,16,1), rgba(20,10,4,0.8))',
            borderRadius: '50%',
          }} />
        </div>
        {/* counter line */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '14%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(253,186,116,0.4), transparent)' }} />
        {/* caption — current line per playhead 28.4 */}
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: '8%', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block', padding: '6px 14px',
            background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(8px)',
            borderRadius: 'var(--r-sm)',
            color: '#fff', fontSize: 16, fontWeight: 500, letterSpacing: 0.2,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>I grind about 18 grams</span>
        </div>
        {/* corner overlays */}
        <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 6 }}>
          <Badge color="var(--accent)">REC</Badge>
          <Badge color="rgba(255,255,255,0.7)">1080p · 30fps</Badge>
        </div>
        <div className="mono" style={{ position: 'absolute', top: 12, right: 14, color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
          {fmt(PLAYHEAD)} / {fmt(TIMELINE_DURATION)}
        </div>
        {/* safe-area corners */}
        {[[6,6,'tl'],[6,6,'tr'],[6,6,'bl'],[6,6,'br']].map(([_,__,p], i) => {
          const t = p.includes('t');
          const l = p.includes('l');
          return (
            <div key={i} style={{
              position: 'absolute',
              top: t ? '6%' : 'auto', bottom: !t ? '6%' : 'auto',
              left: l ? '4%' : 'auto', right: !l ? '4%' : 'auto',
              width: 22, height: 22,
              borderTop: t ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
              borderBottom: !t ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
              borderLeft: l ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
              borderRight: !l ? '1.5px solid rgba(255,255,255,0.4)' : 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px', borderRadius: 4,
      background: 'rgba(0,0,0,0.55)', color,
      fontSize: 10, fontWeight: 600, letterSpacing: 0.4,
    }}>
      {children === 'REC' && <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} />}
      {children}
    </span>
  );
}

function TransportBar() {
  return (
    <div style={{
      padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
      borderTop: '1px solid var(--line-1)', background: 'var(--bg-1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <TransportBtn><Ic.SkipBack size={13} /></TransportBtn>
        <TransportBtn><Ic.StepBack size={13} /></TransportBtn>
        <button style={{
          width: 34, height: 34, borderRadius: 999,
          background: 'var(--fg-1)', border: 0, color: 'var(--bg-0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}><Ic.Play size={14} /></button>
        <TransportBtn><Ic.StepFwd size={13} /></TransportBtn>
        <TransportBtn><Ic.SkipFwd size={13} /></TransportBtn>
      </div>
      <div className="mono" style={{ fontSize: 12, color: 'var(--fg-1)', minWidth: 78 }}>
        {fmt(PLAYHEAD)}
      </div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>/ {fmt(TIMELINE_DURATION)}</div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--fg-3)' }}>
        <Ic.Volume size={13} />
        <div style={{ width: 80, height: 3, background: 'var(--bg-3)', borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '65%', background: 'var(--fg-2)', borderRadius: 2 }} />
        </div>
      </div>
      <div style={{ width: 1, height: 18, background: 'var(--line-2)' }} />
      <TransportBtn><Ic.Maximize size={13} /></TransportBtn>
      <button style={{
        padding: '5px 9px', borderRadius: 5,
        background: 'var(--bg-2)', border: '1px solid var(--line-2)',
        color: 'var(--fg-2)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>16:9 <Ic.ChevronDown size={10} /></button>
    </div>
  );
}

function TransportBtn({ children }) {
  return (
    <button style={{
      width: 28, height: 28, borderRadius: 5,
      background: 'transparent', border: 0, color: 'var(--fg-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    }}>{children}</button>
  );
}

function PlayerColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg-0)' }}>
      <div style={{
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-1)' }}>Preview</span>
        <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>proxy · 540p</span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px', borderRadius: 999,
          background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.4)',
          color: '#86efac', fontSize: 10, fontWeight: 500,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--green)' }} />
          live
        </span>
        <div style={{ flex: 1 }} />
        <button style={iconChipBtn}><Ic.Eye size={12} />Captions</button>
        <button style={iconChipBtn}><Ic.Lock size={12} />Safe area</button>
        <button style={iconChipBtn}>Inspector <Ic.ChevronRight size={11} /></button>
      </div>
      <PlayerStage />
      <TransportBar />
    </div>
  );
}

const iconChipBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '4px 8px', borderRadius: 5,
  background: 'transparent', border: '1px solid var(--line-1)',
  color: 'var(--fg-3)', fontSize: 11, cursor: 'pointer',
};

// ── Timeline ─────────────────────────────────────────────────────

function TimelineToolbar() {
  return (
    <div style={{
      padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6,
      borderBottom: '1px solid var(--line-1)', background: 'var(--bg-1)', flexShrink: 0,
    }}>
      <TLBtn icon={<Ic.Plus size={13} />}>Track</TLBtn>
      <div style={{ width: 1, height: 16, background: 'var(--line-2)', margin: '0 4px' }} />
      <TLBtn icon={<Ic.Scissors size={13} />}>Split</TLBtn>
      <TLBtn icon={<Ic.Trash size={13} />}>Delete</TLBtn>
      <div style={{ width: 1, height: 16, background: 'var(--line-2)', margin: '0 4px' }} />
      <TLBtn icon={<Ic.Undo size={13} />}>Undo</TLBtn>
      <TLBtn icon={<Ic.Redo size={13} />}>Redo</TLBtn>
      <div style={{ flex: 1 }} />
      <TLBtn icon={<Ic.Magnet size={13} />} active>Snap</TLBtn>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
        <Ic.ZoomOut size={12} style={{ color: 'var(--fg-4)' }} />
        <div style={{ width: 110, height: 3, background: 'var(--bg-3)', borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '40%', background: 'var(--fg-3)', borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '40%', top: -3, width: 9, height: 9, borderRadius: 999, background: 'var(--fg-1)', transform: 'translateX(-4.5px)' }} />
        </div>
        <Ic.ZoomIn size={12} style={{ color: 'var(--fg-4)' }} />
      </div>
    </div>
  );
}

function TLBtn({ icon, children, active }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 5,
      background: active ? 'var(--accent-soft)' : 'transparent',
      border: `1px solid ${active ? 'var(--accent-line)' : 'var(--line-1)'}`,
      color: active ? 'var(--accent-ink)' : 'var(--fg-2)',
      fontSize: 11, fontWeight: 500, cursor: 'pointer',
    }}>{icon}{children}</button>
  );
}

function Ruler({ pxPerSec, scrollLeft = 0 }) {
  const ticks = [];
  for (let s = 0; s <= TIMELINE_DURATION; s += 1) {
    const major = s % 5 === 0;
    ticks.push(
      <div key={s} style={{
        position: 'absolute', left: s * pxPerSec, top: 0, bottom: 0,
        width: 1, background: major ? 'var(--line-2)' : 'var(--line-1)',
      }}>
        {major && (
          <span className="mono" style={{
            position: 'absolute', top: 4, left: 4, fontSize: 9, color: 'var(--fg-4)',
            whiteSpace: 'nowrap',
          }}>0:{String(s).padStart(2, '0')}</span>
        )}
      </div>
    );
  }
  return (
    <div style={{
      position: 'relative', height: 22,
      background: 'var(--bg-1)',
      borderBottom: '1px solid var(--line-2)',
    }}>{ticks}</div>
  );
}

function ClipBlock({ clip, track, pxPerSec }) {
  const left = clip.start * pxPerSec;
  const width = (clip.end - clip.start) * pxPerSec;
  const isVideo = track.kind === 'video';
  const isCaption = track.kind === 'caption';
  const isAudio = track.kind === 'audio';

  const styles = isVideo ? videoClip(track.color, clip) :
                 isCaption ? captionClip() :
                 audioClip();

  return (
    <div
      className={clip.pulse ? 'pulse-clip' : ''}
      style={{
        position: 'absolute', left, width, top: 2, bottom: 2,
        borderRadius: 5, overflow: 'hidden',
        cursor: 'pointer',
        ...styles.outer,
      }}
    >
      {isVideo && (
        <>
          {/* faux thumb strip */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', gap: 1, padding: 1,
          }}>
            {Array.from({ length: Math.max(3, Math.floor(width / 36)) }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: '100%',
                background: `radial-gradient(120% 90% at ${20 + i * 7}% 30%, ${styles.thumbB || '#7c4324'}, ${styles.thumbA || '#3b2418'} 75%)`,
                opacity: 0.92,
              }} />
            ))}
          </div>
          {/* label */}
          <div style={{
            position: 'absolute', left: 6, top: 4, right: 6,
            display: 'flex', alignItems: 'center', gap: 4,
            color: '#fff', fontSize: 10, fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}>
            <span className="truncate">{clip.name}</span>
          </div>
          {/* trim handles */}
          <ClipHandle side="l" />
          <ClipHandle side="r" />
        </>
      )}
      {isCaption && (
        <div style={{
          padding: '4px 8px', height: '100%',
          display: 'flex', alignItems: 'center',
          color: clip.emphasis ? '#fff4dc' : '#fbeacf',
          fontSize: 10, fontWeight: clip.emphasis ? 700 : 500,
          textShadow: '0 1px 1px rgba(60,40,10,0.35)',
        }}>
          <span className="truncate" style={{ width: '100%' }}>"{clip.text}"</span>
        </div>
      )}
      {isAudio && (
        <div style={{
          padding: '3px 6px', height: '100%',
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          {Array.from({ length: Math.max(20, Math.floor(width / 4)) }).map((_, i) => {
            const t = i / 50;
            const v = (Math.sin(t * 7.3) * 0.5 + Math.sin(t * 2.1) * 0.5 + Math.sin(t * 13) * 0.3 + 1) / 2;
            return <div key={i} style={{
              flex: 1, height: `${20 + v * 75}%`,
              background: '#86b59a', opacity: 0.7, borderRadius: 0.5,
              minWidth: 1,
            }} />;
          })}
        </div>
      )}
    </div>
  );
}

function ClipHandle({ side }) {
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      [side === 'l' ? 'left' : 'right']: 0,
      width: 5,
      background: 'rgba(255,255,255,0.18)',
      cursor: 'ew-resize',
      borderLeft: side === 'l' ? 'none' : '1px solid rgba(255,255,255,0.35)',
      borderRight: side === 'r' ? 'none' : '1px solid rgba(255,255,255,0.35)',
    }} />
  );
}

function videoClip(color, clip) {
  const map = {
    orange: {
      bg: 'linear-gradient(180deg, var(--accent-2), var(--accent))',
      border: 'var(--accent-line)',
      thumbA: '#2e2a22', thumbB: '#544a3a',
    },
    violet: {
      bg: 'linear-gradient(180deg, #7d72a3, #5d5384)',
      border: 'rgba(168,157,209,0.35)',
      thumbA: '#2c2638', thumbB: '#4a4263',
    },
  };
  const m = map[color] || map.orange;
  return {
    outer: {
      background: m.bg,
      border: `1px solid ${m.border}`,
      boxShadow: clip.pulse ? undefined : '0 1px 2px rgba(0,0,0,0.25)',
    },
    thumbA: m.thumbA, thumbB: m.thumbB,
  };
}

function captionClip() {
  return {
    outer: {
      background: 'linear-gradient(180deg, #c79b53, #9a7332)',
      border: '1px solid rgba(200,149,72,0.4)',
    },
  };
}

function audioClip() {
  return {
    outer: {
      background: 'rgba(134,181,154,0.12)',
      border: '1px solid rgba(134,181,154,0.32)',
    },
  };
}

function TrackHeader({ track }) {
  const colorMap = {
    orange: 'var(--accent)',
    violet: 'var(--violet)',
    green: 'var(--green)',
    amber: 'var(--amber)',
  };
  return (
    <div style={{
      width: 110, height: track.height + 6, flexShrink: 0,
      padding: '0 10px',
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'var(--bg-1)', borderBottom: '1px solid var(--line-1)', borderRight: '1px solid var(--line-2)',
    }}>
      <div style={{ width: 4, height: 22, borderRadius: 2, background: colorMap[track.color] }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="truncate" style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-1)' }}>{track.label}</div>
        <div className="mono" style={{ fontSize: 9, color: 'var(--fg-4)' }}>{track.clips.length} clip{track.clips.length !== 1 ? 's' : ''}</div>
      </div>
      <button style={trackBtn} title="visibility"><Ic.Eye size={11} /></button>
      <button style={trackBtn} title="lock"><Ic.Lock size={11} /></button>
    </div>
  );
}

const trackBtn = {
  width: 18, height: 18, borderRadius: 3,
  background: 'transparent', border: 0, color: 'var(--fg-4)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Timeline() {
  const pxPerSec = 14;
  const trackAreaWidth = TIMELINE_DURATION * pxPerSec;
  const playheadX = PLAYHEAD * pxPerSec;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%',
      background: 'var(--bg-0)', borderTop: '1px solid var(--line-2)',
    }}>
      <TimelineToolbar />
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* track headers column */}
        <div style={{ width: 110, flexShrink: 0, background: 'var(--bg-1)', borderRight: '1px solid var(--line-2)' }}>
          <div style={{ height: 22, borderBottom: '1px solid var(--line-2)' }} />
          {TRACKS.map(t => <TrackHeader key={t.id} track={t} />)}
          <div style={{ padding: 8 }}>
            <button style={{
              width: '100%', padding: '6px 8px', borderRadius: 5,
              background: 'transparent', border: '1px dashed var(--line-2)',
              color: 'var(--fg-3)', fontSize: 11, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}><Ic.Plus size={11} />Track</button>
          </div>
        </div>
        {/* clip area */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', position: 'relative' }}>
          <div style={{ position: 'relative', width: trackAreaWidth, minWidth: '100%' }}>
            <Ruler pxPerSec={pxPerSec} />
            {TRACKS.map((t, i) => (
              <div key={t.id} style={{
                position: 'relative', height: t.height + 6,
                background: i % 2 === 0 ? 'transparent' : 'rgba(148,163,184,0.025)',
                borderBottom: '1px solid var(--line-1)',
              }}>
                {t.clips.map(c => (
                  <ClipBlock key={c.id} clip={c} track={t} pxPerSec={pxPerSec} />
                ))}
              </div>
            ))}
            {/* playhead — spans full timeline height */}
            <div style={{
              position: 'absolute', left: playheadX, top: 0, bottom: 0,
              width: 2, background: 'var(--accent)',
              boxShadow: '0 0 0 1px rgba(249,115,22,0.3)',
              pointerEvents: 'none', zIndex: 5,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: -7, width: 16, height: 14,
                background: 'var(--accent)',
                clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)',
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PlayerColumn, Timeline, fmt });
