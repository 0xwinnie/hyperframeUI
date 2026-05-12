// Claude chat panel + tool-call cards.

const { useState: useStateChat } = React;

function Avatar({ kind }) {
  if (kind === 'user') {
    return (
      <div style={{
        width: 26, height: 26, borderRadius: 999,
        background: 'var(--bg-3)',
        border: '1px solid var(--line-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--fg-2)', fontSize: 11, fontWeight: 600, flexShrink: 0,
      }}>J</div>
    );
  }
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 999,
      background: 'linear-gradient(135deg, var(--accent), #c2410c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, boxShadow: '0 2px 6px rgba(249,115,22,0.35)',
    }}>
      <Ic.Sparkle2 size={14} stroke={1.8} style={{ color: '#fff' }} />
    </div>
  );
}

function SystemNotice({ text }) {
  return (
    <div style={{
      padding: '8px 12px', margin: '4px 0',
      borderRadius: 'var(--r-md)', background: 'var(--bg-2)',
      border: '1px dashed var(--line-2)',
      color: 'var(--fg-3)', fontSize: 11, lineHeight: 1.5,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: 999, background: 'var(--green)' }} />
      <span className="mono" style={{ flex: 1 }}>{text}</span>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
      <div style={{
        background: 'var(--bg-3)',
        border: '1px solid var(--line-2)',
        padding: '10px 12px', borderRadius: '12px 12px 4px 12px',
        maxWidth: '78%', color: 'var(--fg-1)', fontSize: 13, lineHeight: 1.5,
      }}>{text}</div>
      <Avatar kind="user" />
    </div>
  );
}

function AssistantBubble({ text, typing = false }) {
  // very light markdown: backticks for inline code
  const renderText = (t) => {
    const parts = t.split(/(`[^`]+`)/g);
    return parts.map((p, i) => p.startsWith('`')
      ? <code key={i} className="mono" style={{ background: 'var(--bg-3)', padding: '1px 5px', borderRadius: 4, fontSize: 12, color: 'var(--accent-2)' }}>{p.slice(1, -1)}</code>
      : <span key={i}>{p}</span>);
  };
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Avatar kind="ai" />
      <div style={{ maxWidth: '82%', color: 'var(--fg-1)', fontSize: 13, lineHeight: 1.55 }}>
        {typing ? (
          <div style={{ display: 'flex', gap: 4, padding: '8px 4px' }}>
            <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fg-3)', animationDelay: '0ms' }} />
            <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fg-3)', animationDelay: '160ms' }} />
            <span className="typing-dot" style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--fg-3)', animationDelay: '320ms' }} />
          </div>
        ) : renderText(text)}
      </div>
    </div>
  );
}

function ToolPreview({ name, args, affected }) {
  // miniature timeline showing what's affected
  if (name === 'cut_segment') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 6 }}>
        <div style={{ flex: 1.2, height: 18, borderRadius: 3, background: 'linear-gradient(90deg, var(--accent) 40%, rgba(249,115,22,0.4))', border: '1px solid var(--accent-line)' }} />
        <div style={{ width: 28, height: 12, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, var(--accent) 0 3px, transparent 3px 6px)' }} />
        </div>
        <div style={{ flex: 1.6, height: 18, borderRadius: 3, background: 'linear-gradient(90deg, rgba(249,115,22,0.4), var(--accent))', border: '1px solid var(--accent-line)' }} />
        <span className="mono" style={{ fontSize: 10, color: 'var(--fg-3)', marginLeft: 6 }}>
          {args.from.toFixed(1)}s → {args.to.toFixed(1)}s
        </span>
      </div>
    );
  }
  if (name === 'analyze_timeline') {
    return (
      <div style={{ display: 'flex', gap: 3, padding: '8px 10px', background: 'var(--bg-1)', borderRadius: 6, alignItems: 'flex-end', height: 36 }}>
        {Array.from({ length: 28 }).map((_, i) => {
          const h = 6 + Math.abs(Math.sin(i * 0.9)) * 18;
          const isHit = i === 9 || i === 14 || i === 21;
          return <div key={i} style={{
            flex: 1, height: h,
            background: isHit ? 'var(--accent)' : 'var(--line-3)',
            borderRadius: 1.5,
            opacity: isHit ? 1 : 0.6,
          }} />;
        })}
      </div>
    );
  }
  return null;
}

function ToolCallCard({ msg }) {
  const { name, args, summary, durationMs, status, affected } = msg;
  const [open, setOpen] = useStateChat(status === 'running');
  const running = status === 'running';
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <Avatar kind="ai" />
      <div style={{
        flex: 1, background: 'var(--bg-2)',
        border: `1px solid ${running ? 'var(--accent-line)' : 'var(--line-2)'}`,
        borderRadius: 'var(--r-md)',
        boxShadow: running ? '0 0 0 3px var(--accent-soft)' : 'var(--shadow-1)',
        overflow: 'hidden',
        transition: 'border-color var(--t-med), box-shadow var(--t-med)',
      }}>
        <button onClick={() => setOpen(o => !o)} style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%',
          padding: '10px 12px', background: 'transparent', border: 0,
          color: 'inherit', cursor: 'pointer', textAlign: 'left',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 'var(--r-sm)',
            background: running ? 'var(--accent-soft)' : 'var(--bg-3)',
            border: `1px solid ${running ? 'var(--accent-line)' : 'var(--line-2)'}`,
            color: running ? 'var(--accent-2)' : 'var(--fg-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {running
              ? <Ic.Loader size={14} className="spin" />
              : (name === 'cut_segment' ? <Ic.Scissors size={13} /> : <Ic.Wand size={13} />)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono" style={{ fontSize: 12, color: 'var(--fg-1)', fontWeight: 500 }}>{name}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--fg-4)' }}>
                ({Object.entries(args).map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed?.(1) ?? v : `"${v}"`}`).join(', ')})
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{summary}</div>
          </div>
          {running
            ? <span className="mono" style={{ fontSize: 11, color: 'var(--accent-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--accent)' }} className="spin" />running
              </span>
            : <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Ic.Check size={12} style={{ color: 'var(--green)' }} />{durationMs}ms
              </span>}
          <Ic.ChevronDown size={14} style={{ color: 'var(--fg-4)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }} />
        </button>
        {open && (
          <div style={{ padding: '0 12px 12px', borderTop: '1px solid var(--line-1)' }}>
            <div style={{ paddingTop: 10 }}>
              <ToolPreview name={name} args={args} affected={affected} />
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              {!running && <SmallBtn icon={<Ic.ArrowUpRight size={11} />}>Jump to seam</SmallBtn>}
              {!running && <SmallBtn icon={<Ic.Undo size={11} />}>Undo</SmallBtn>}
              {!running && <SmallBtn>View diff</SmallBtn>}
              {running && <span className="mono" style={{ fontSize: 11, color: 'var(--fg-3)' }}>Affecting {affected?.length || 0} clip(s) · highlighted in timeline</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SmallBtn({ children, icon, primary }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 9px', borderRadius: 5,
      background: primary ? 'var(--accent-soft)' : 'transparent',
      border: `1px solid ${primary ? 'var(--accent-line)' : 'var(--line-2)'}`,
      color: primary ? 'var(--accent-ink)' : 'var(--fg-2)',
      fontSize: 11, fontWeight: 500, cursor: 'pointer',
      transition: 'background var(--t-fast), border-color var(--t-fast)',
    }}>
      {icon}{children}
    </button>
  );
}

function ChatHeader() {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: '1px solid var(--line-1)',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <Avatar kind="ai" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg-1)' }}>Claude</div>
        <div className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>sonnet-4.5 · 12 tools available</div>
      </div>
      <button style={{
        padding: '4px 8px', borderRadius: 5,
        background: 'var(--accent-soft)', border: '1px solid var(--accent-line)',
        color: 'var(--accent-ink)', fontSize: 11, fontWeight: 500, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 4,
      }}>
        <Ic.Eye size={11} />Review video
      </button>
    </div>
  );
}

function ChatComposer() {
  return (
    <div style={{ padding: 12, borderTop: '1px solid var(--line-1)' }}>
      <div style={{
        background: 'var(--bg-2)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--line-2)', padding: 10,
        transition: 'border-color var(--t-fast)',
      }}>
        <div style={{ color: 'var(--fg-3)', fontSize: 13, minHeight: 38, lineHeight: 1.45 }}>
          Ask Claude to edit, analyze, or describe…
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <button style={iconBtn}><Ic.AtSign size={13} /></button>
          <button style={iconBtn}><Ic.Mic size={13} /></button>
          <div style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--fg-4)' }}>⌘↩ to send</span>
          <button style={{
            padding: '5px 10px', borderRadius: 6,
            background: 'var(--accent)', border: 0, color: '#fff',
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}>
            <Ic.Send size={12} />Send
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        <ContextChip>Add B-roll at 0:55</ContextChip>
        <ContextChip>Caption pass</ContextChip>
        <ContextChip>Trim silence</ContextChip>
      </div>
    </div>
  );
}

const iconBtn = {
  width: 26, height: 26, borderRadius: 5,
  background: 'transparent', border: 0,
  color: 'var(--fg-3)', cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
};

function ContextChip({ children }) {
  return (
    <button style={{
      padding: '4px 9px', borderRadius: 999,
      background: 'var(--bg-2)', border: '1px solid var(--line-2)',
      color: 'var(--fg-2)', fontSize: 11, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <Ic.Sparkle2 size={10} style={{ color: 'var(--accent-2)' }} />
      {children}
    </button>
  );
}

function ClaudeChat() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <ChatHeader />
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CHAT_HISTORY.map((msg, i) => {
          if (msg.role === 'system') return <SystemNotice key={i} text={msg.text} />;
          if (msg.role === 'user') return <UserBubble key={i} text={msg.text} />;
          if (msg.role === 'assistant') return <AssistantBubble key={i} text={msg.text} />;
          if (msg.role === 'tool') return <ToolCallCard key={i} msg={msg} />;
          return null;
        })}
        <AssistantBubble typing />
      </div>
      <ChatComposer />
    </div>
  );
}

Object.assign(window, { ClaudeChat });
