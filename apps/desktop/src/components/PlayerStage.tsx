import { useEffect, useState } from 'react';
import { useProjectStore } from '../store/project';

// Player stage. The Hyperframes preview server is spawned whenever the
// active project changes — i.e. when the user opens a project via the
// TopBar or the "Open project" CTA below. The playback-control bridge
// (postMessage / webFrameMain.executeJavaScript) arrives with the
// timeline in P1.7.

type Status =
  | { kind: 'idle' }
  | { kind: 'starting'; projectPath: string }
  | { kind: 'ready'; url: string; projectPath: string }
  | { kind: 'error'; message: string };

export function PlayerStage(): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);
  const pickAndLoad = useProjectStore((s) => s.pickAndLoad);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // (Re)start the preview server whenever the active project's path changes.
  const activePath = projectStatus.kind === 'ready' ? projectStatus.project.root : null;
  useEffect(() => {
    if (!activePath) {
      setStatus({ kind: 'idle' });
      return;
    }
    const bridge = window.hs;
    if (!bridge) {
      setStatus({ kind: 'error', message: 'Preload bridge not available' });
      return;
    }
    let cancelled = false;
    setStatus({ kind: 'starting', projectPath: activePath });
    void (async () => {
      const result = await bridge.preview.start({ projectPath: activePath });
      if (cancelled) return;
      if (result.ok) {
        setStatus({ kind: 'ready', url: result.url, projectPath: result.projectPath });
      } else {
        setStatus({ kind: 'error', message: result.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePath]);

  return (
    <main className="player">
      <header className="player__header">
        <span className="player__title">Preview</span>
        <span className="player__caption mono">{captionFor(status, projectStatus.kind)}</span>
      </header>
      <div className="player__stage">
        {status.kind === 'ready' && (
          <iframe
            key={status.url}
            className="player__iframe"
            src={status.url}
            title="Hyperframes preview"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
        {status.kind !== 'ready' && (
          <Placeholder
            status={status}
            onPick={() => {
              void pickAndLoad();
            }}
          />
        )}
      </div>
    </main>
  );
}

function captionFor(s: Status, projectKind: ReturnType<typeof useProjectStore.getState>['status']['kind']): string {
  if (projectKind === 'idle') return 'no project loaded';
  if (projectKind === 'loading') return 'loading project…';
  if (projectKind === 'error') return 'project failed to load';
  switch (s.kind) {
    case 'idle':
      return 'waiting';
    case 'starting':
      return 'starting hyperframes preview…';
    case 'ready':
      return s.url.replace(/^https?:\/\//, '');
    case 'error':
      return 'preview error';
  }
}

function Placeholder({
  status,
  onPick,
}: {
  status: Status;
  onPick: () => void;
}): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);

  if (projectStatus.kind === 'error') {
    return (
      <div className="player__placeholder">
        <p className="mono">Couldn't open this folder as a Hyperframes project</p>
        <p className="player__placeholder-detail mono">{projectStatus.error}</p>
        <p className="player__placeholder-hint mono">
          Tip: pick the folder that contains <code>index.html</code> — that's the project root.
        </p>
        <button type="button" className="btn btn--primary" onClick={onPick}>
          Open another folder…
        </button>
      </div>
    );
  }

  if (projectStatus.kind === 'idle') {
    return (
      <div className="player__placeholder">
        <p className="mono">No project open</p>
        <button type="button" className="btn btn--primary" onClick={onPick}>
          Open project…
        </button>
      </div>
    );
  }

  if (projectStatus.kind === 'loading') {
    return <div className="player__placeholder mono">Parsing project…</div>;
  }

  if (status.kind === 'error') {
    return (
      <div className="player__placeholder">
        <p className="mono">Hyperframes preview failed</p>
        <p className="player__placeholder-detail mono">{status.message}</p>
      </div>
    );
  }

  return <div className="player__placeholder mono">Booting Hyperframes preview…</div>;
}
