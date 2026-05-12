import { useEffect, useRef, useState } from 'react';

// Player stage. In Phase 0 we just verify we can boot
// `npx hyperframes preview` and load the resulting URL in an <iframe>.
// The playback-control bridge (postMessage / webFrameMain.executeJavaScript)
// arrives with the timeline in P1.

type Status =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'ready'; url: string; projectPath: string }
  | { kind: 'no-project' }
  | { kind: 'error'; message: string };

export function PlayerStage(): JSX.Element {
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    console.log('[player] mount effect, bridge present:', !!window.hs);
    const bridge = window.hs;
    if (!bridge) {
      setStatus({ kind: 'error', message: 'Preload bridge not available' });
      return;
    }

    setStatus({ kind: 'starting' });
    void (async () => {
      try {
        const projectPath = await bridge.env.getDemoProjectPath();
        if (!projectPath) {
          setStatus({ kind: 'no-project' });
          return;
        }
        const result = await bridge.preview.start({ projectPath });
        if (result.ok) {
          setStatus({
            kind: 'ready',
            url: result.url,
            projectPath: result.projectPath,
          });
        } else {
          setStatus({ kind: 'error', message: result.error });
        }
      } catch (err) {
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    })();
  }, []);

  return (
    <main className="player">
      <header className="player__header">
        <span className="player__title">Preview</span>
        <span className="player__caption mono">{captionFor(status)}</span>
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
          <div className="player__placeholder mono">{placeholderFor(status)}</div>
        )}
      </div>
    </main>
  );
}

function captionFor(s: Status): string {
  switch (s.kind) {
    case 'idle':
      return 'waiting';
    case 'starting':
      return 'starting hyperframes preview…';
    case 'ready':
      return s.url.replace(/^https?:\/\//, '');
    case 'no-project':
      return 'no project loaded';
    case 'error':
      return 'preview error';
  }
}

function placeholderFor(s: Status): string {
  switch (s.kind) {
    case 'idle':
    case 'starting':
      return 'Booting Hyperframes preview…';
    case 'no-project':
      return 'Set HFUI_DEMO_PROJECT to a Hyperframes project path and relaunch.';
    case 'error':
      return s.message;
    case 'ready':
      return '';
  }
}
