import { ArrowUpRight, ChevronDown, Folder, Share, Sparkle2 } from '../icons';
import { DEMO_PROJECT, formatTimecode } from '../data/demoProject';

// 48px-tall top bar. Ports hs-app.jsx <TopBar> to TSX, using the live theme
// tokens (Moss accent by default) rather than the prototype's hardcoded
// orange. Status pill + interactive controls land in later phases.

export function TopBar(): JSX.Element {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="topbar__mark" aria-hidden>
          <Sparkle2 size={14} stroke={2} style={{ color: '#fff' }} />
        </div>
        <span className="topbar__wordmark">HyperframeUI</span>
      </div>

      <div className="topbar__divider" aria-hidden />

      <button type="button" className="topbar__project" title="Switch project">
        <Folder size={12} style={{ color: 'var(--fg-3)' }} />
        <span>{DEMO_PROJECT.name}</span>
        <ChevronDown size={11} style={{ color: 'var(--fg-4)' }} />
      </button>

      <div className="topbar__meta mono">
        {formatTimecode(DEMO_PROJECT.duration)} · {DEMO_PROJECT.resolution} · {DEMO_PROJECT.fps}fps
      </div>

      <div className="topbar__spacer" />

      <button type="button" className="btn btn--ghost">
        <Share size={12} />
        Share
      </button>
      <button type="button" className="btn btn--primary">
        <ArrowUpRight size={12} />
        Render
      </button>
    </header>
  );
}
