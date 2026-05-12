import { ArrowUpRight, ChevronDown, Folder, Share, Sparkle2 } from '../icons';
import { formatTimecode } from '../data/demoProject';
import { useProjectStore } from '../store/project';

// 48px-tall top bar. Reads the active project from the Zustand store so the
// timecode / resolution / fps strip stays in sync with what the parser loaded.

export function TopBar(): JSX.Element {
  const status = useProjectStore((s) => s.status);

  const name = status.kind === 'ready' ? status.project.meta.name : projectLabel(status);
  const meta =
    status.kind === 'ready'
      ? metaStrip(status.project)
      : statusLabel(status);

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
        <span>{name}</span>
        <ChevronDown size={11} style={{ color: 'var(--fg-4)' }} />
      </button>

      <div className="topbar__meta mono">{meta}</div>

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

function projectLabel(status: ReturnType<typeof useProjectStore.getState>['status']): string {
  if (status.kind === 'loading' || status.kind === 'error') {
    const last = status.path.split(/[\\/]/).filter(Boolean).pop();
    return last ?? 'project';
  }
  return 'no project';
}

function statusLabel(status: ReturnType<typeof useProjectStore.getState>['status']): string {
  switch (status.kind) {
    case 'idle':
      return 'open a project to begin';
    case 'loading':
      return 'loading…';
    case 'error':
      return `failed · ${status.error.slice(0, 80)}`;
    case 'ready':
      return '';
  }
}

function metaStrip(project: { composition: { duration: number; width: number; height: number; fps: number } }): string {
  const { duration, width, height, fps } = project.composition;
  return `${formatTimecode(duration)} · ${width}×${height} · ${fps}fps`;
}
