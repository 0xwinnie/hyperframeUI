import '@hyperframes/player';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../store/project';
import { TransportBar } from './TransportBar';

// Player stage. Embeds @hyperframes/player as a web component (loads the
// composition HTML in its own sandboxed iframe) and renders our own
// transport bar on top. The Hyperframes preview server still runs in the
// background so assets referenced by the composition resolve cleanly over
// HTTP — we just don't load the Studio UI from it.

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'starting'; projectPath: string }
  | { kind: 'serving'; url: string; projectPath: string }
  | { kind: 'error'; message: string };

interface PlayerElement extends HTMLElement {
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  currentTime: number;
  duration: number;
  paused: boolean;
  ready: boolean;
}

interface ReadyEvent extends CustomEvent<{ duration: number }> {}
interface TimeUpdateEvent extends CustomEvent<{ currentTime: number }> {}

export function PlayerStage(): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);
  const pickAndLoad = useProjectStore((s) => s.pickAndLoad);

  const [preview, setPreview] = useState<PreviewState>({ kind: 'idle' });
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<PlayerElement | null>(null);

  // (Re)spawn the Hyperframes preview server whenever the active project
  // changes. We do not embed its Studio UI — the player loads index.html
  // directly through the same server URL.
  const activePath = projectStatus.kind === 'ready' ? projectStatus.project.root : null;
  useEffect(() => {
    if (!activePath) {
      setPreview({ kind: 'idle' });
      return;
    }
    const bridge = window.hs;
    if (!bridge) {
      setPreview({ kind: 'error', message: 'Preload bridge not available' });
      return;
    }
    let cancelled = false;
    setPreview({ kind: 'starting', projectPath: activePath });
    void (async () => {
      const result = await bridge.preview.start({ projectPath: activePath });
      if (cancelled) return;
      if (result.ok) {
        setPreview({ kind: 'serving', url: result.url, projectPath: result.projectPath });
      } else {
        setPreview({ kind: 'error', message: result.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePath]);

  // Reset playback state whenever the loaded composition changes.
  const compositionSrc = preview.kind === 'serving' ? `${preview.url}/index.html` : null;
  useEffect(() => {
    setReady(false);
    setPaused(true);
    setCurrentTime(0);
    setDuration(0);
  }, [compositionSrc]);

  // Hook into player events. We treat the element as the source of truth and
  // mirror only what the UI needs into React state.
  useEffect(() => {
    const el = playerRef.current;
    if (!el || !compositionSrc) return;

    const onReady = (event: Event): void => {
      const detail = (event as ReadyEvent).detail;
      setReady(true);
      setDuration(detail.duration ?? 0);
    };
    const onPlay = (): void => setPaused(false);
    const onPause = (): void => setPaused(true);
    const onTimeUpdate = (event: Event): void => {
      const detail = (event as TimeUpdateEvent).detail;
      setCurrentTime(detail.currentTime ?? 0);
    };
    const onEnded = (): void => setPaused(true);
    const onError = (event: Event): void => {
      const detail = (event as CustomEvent<{ message: string }>).detail;
      setPreview({ kind: 'error', message: detail?.message ?? 'player error' });
    };

    el.addEventListener('ready', onReady);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('ready', onReady);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [compositionSrc]);

  const onPlayPause = useCallback(() => {
    const el = playerRef.current;
    if (!el || !ready) return;
    if (el.paused) el.play();
    else el.pause();
  }, [ready]);

  const onSeek = useCallback(
    (seconds: number): void => {
      const el = playerRef.current;
      if (!el || !ready) return;
      el.seek(Math.max(0, Math.min(seconds, duration)));
    },
    [ready, duration],
  );

  const onStep = useCallback(
    (delta: number): void => {
      const el = playerRef.current;
      if (!el || !ready) return;
      el.seek(Math.max(0, Math.min(el.currentTime + delta, duration)));
    },
    [ready, duration],
  );

  return (
    <main className="player">
      <header className="player__header">
        <span className="player__title">Preview</span>
        <span className="player__caption mono">{captionFor(preview, projectStatus.kind)}</span>
      </header>

      <div className="player__stage">
        {compositionSrc ? (
          <hyperframes-player
            ref={playerRef as unknown as React.RefObject<HTMLElement>}
            src={compositionSrc}
            className="player__component"
          />
        ) : (
          <Placeholder
            preview={preview}
            onPick={() => {
              void pickAndLoad();
            }}
          />
        )}
      </div>

      {compositionSrc && (
        <TransportBar
          ready={ready}
          paused={paused}
          currentTime={currentTime}
          duration={duration}
          onPlayPause={onPlayPause}
          onSeek={onSeek}
          onStep={onStep}
        />
      )}
    </main>
  );
}

function captionFor(
  preview: PreviewState,
  projectKind: ReturnType<typeof useProjectStore.getState>['status']['kind'],
): string {
  if (projectKind === 'idle') return 'no project loaded';
  if (projectKind === 'loading') return 'loading project…';
  if (projectKind === 'error') return 'project failed to load';
  switch (preview.kind) {
    case 'idle':
      return 'waiting';
    case 'starting':
      return 'starting preview server…';
    case 'serving':
      return preview.url.replace(/^https?:\/\//, '');
    case 'error':
      return 'preview error';
  }
}

function Placeholder({
  preview,
  onPick,
}: {
  preview: PreviewState;
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

  if (preview.kind === 'error') {
    return (
      <div className="player__placeholder">
        <p className="mono">Hyperframes preview failed</p>
        <p className="player__placeholder-detail mono">{preview.message}</p>
      </div>
    );
  }

  return <div className="player__placeholder mono">Booting preview server…</div>;
}
