import '@hyperframes/player';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from '../icons';
import { usePlaybackStore } from '../store/playback';
import { useProjectStore } from '../store/project';
import { TransportBar } from './TransportBar';

// Player stage. Embeds @hyperframes/player (sandboxed iframe with the
// composition srcdoc) and registers an imperative controller on the
// playback store so TransportBar / Timeline / agent tools can drive
// play/pause/seek through a stable interface.

type PreviewState =
  | { kind: 'idle' }
  | { kind: 'starting'; projectPath: string }
  | { kind: 'serving'; url: string; projectPath: string; compositionHtml: string | null }
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
  const setReady = usePlaybackStore((s) => s.setReady);
  const setPaused = usePlaybackStore((s) => s.setPaused);
  const setCurrentTime = usePlaybackStore((s) => s.setCurrentTime);
  const setController = usePlaybackStore((s) => s.setController);
  const resetPlayback = usePlaybackStore((s) => s.reset);

  const [preview, setPreview] = useState<PreviewState>({ kind: 'idle' });
  const playerRef = useRef<PlayerElement | null>(null);

  // (Re)start the static project server whenever the active project changes.
  const activePath = projectStatus.kind === 'ready' ? projectStatus.project.root : null;
  useEffect(() => {
    if (!activePath) {
      setPreview({ kind: 'idle' });
      resetPlayback();
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
        setPreview({
          kind: 'serving',
          url: result.url,
          projectPath: result.projectPath,
          compositionHtml: result.compositionHtml,
        });
      } else {
        setPreview({ kind: 'error', message: result.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePath, resetPlayback]);

  const compositionHtml = preview.kind === 'serving' ? preview.compositionHtml : null;

  useEffect(() => {
    resetPlayback();
  }, [compositionHtml, resetPlayback]);

  // Register the imperative controller on the playback store + wire the
  // player's events into store mutations.
  useEffect(() => {
    const el = playerRef.current;
    if (!el || !compositionHtml) return;

    setController({
      play: () => el.play(),
      pause: () => el.pause(),
      seek: (s) => el.seek(s),
    });

    const onReady = (event: Event): void => {
      const detail = (event as ReadyEvent).detail;
      setReady(true, detail.duration ?? 0);
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
      console.error('[player] error event:', JSON.stringify(detail));
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
      setController(null);
    };
  }, [compositionHtml, setController, setReady, setPaused, setCurrentTime]);

  const compositionDims =
    projectStatus.kind === 'ready'
      ? { width: projectStatus.project.composition.width, height: projectStatus.project.composition.height }
      : null;

  // React 18 does not auto-mirror `width` / `height` JSX props onto custom
  // elements as DOM attributes. The player's observedAttributes path only
  // fires on attribute mutation, so we set them imperatively whenever the
  // loaded composition's dimensions change.
  useEffect(() => {
    const el = playerRef.current;
    if (!el || !compositionDims) return;
    el.setAttribute('width', String(compositionDims.width));
    el.setAttribute('height', String(compositionDims.height));
  }, [compositionDims?.width, compositionDims?.height, compositionHtml]);

  return (
    <main className="player">
      <header className="player__header">
        <span className="player__title">Preview</span>
        <span className="player__caption mono">{captionFor(preview, projectStatus.kind)}</span>
      </header>

      <div className="player__stage">
        {compositionHtml && compositionDims ? (
          <hyperframes-player
            ref={playerRef as unknown as React.RefObject<HTMLElement>}
            srcdoc={compositionHtml}
            className="player__component"
            style={{
              aspectRatio: `${compositionDims.width} / ${compositionDims.height}`,
            }}
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

      {compositionHtml && <TransportBar />}
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
      return preview.compositionHtml === null
        ? 'empty project · waiting for clips'
        : preview.url.replace(/^https?:\/\//, '');
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

  if (
    projectStatus.kind === 'ready' &&
    preview.kind === 'serving' &&
    preview.compositionHtml === null
  ) {
    return <EmptyProjectGuide projectRoot={projectStatus.project.root} />;
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

function EmptyProjectGuide({ projectRoot }: { projectRoot: string }): JSX.Element {
  return (
    <div className="player__guide">
      <div className="player__guide-icon" aria-hidden>
        <Plus size={20} />
      </div>
      <h2 className="player__guide-title">Drop your raw clips into this project</h2>
      <p className="player__guide-path mono">{projectRoot}</p>
      <ol className="player__guide-steps">
        <li>
          <span className="player__guide-step-num mono">1</span>
          Add the videos you want to edit — either drag them into the folder above (Finder), or use
          the <strong>Media</strong> tab on the left to import / remove files from inside HyperframeUI.
        </li>
        <li>
          <span className="player__guide-step-num mono">2</span>
          Switch to the <strong>Claude</strong> tab and describe what you want — e.g.
          <span className="player__guide-quote">"Make a rough cut from these clips with captions."</span>
        </li>
        <li>
          <span className="player__guide-step-num mono">3</span>
          Claude calls Hyperframes (transcribe, build, render) and the preview appears here as soon
          as the composition is ready.
        </li>
      </ol>
    </div>
  );
}
