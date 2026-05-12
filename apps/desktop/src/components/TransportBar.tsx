import { useCallback, type ChangeEvent } from 'react';
import {
  ChevronDown,
  Maximize,
  Pause,
  Play,
  SkipBack,
  SkipFwd,
  StepBack,
  StepFwd,
  Volume,
} from '../icons';
import { usePlaybackStore } from '../store/playback';

// Self-rendered transport bar. Reads playback state from the store and
// dispatches actions; no longer takes props.

export function TransportBar(): JSX.Element {
  const ready = usePlaybackStore((s) => s.ready);
  const paused = usePlaybackStore((s) => s.paused);
  const currentTime = usePlaybackStore((s) => s.currentTime);
  const duration = usePlaybackStore((s) => s.duration);
  const toggle = usePlaybackStore((s) => s.toggle);
  const seek = usePlaybackStore((s) => s.seek);
  const step = usePlaybackStore((s) => s.step);

  const onScrub = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const fraction = Number.parseFloat(event.target.value);
      if (!Number.isFinite(fraction)) return;
      seek(fraction * duration);
    },
    [duration, seek],
  );

  const fraction = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="transport">
      <div className="transport__cluster">
        <button
          type="button"
          className="transport__icon-btn"
          title="Skip back 10s"
          onClick={() => step(-10)}
          disabled={!ready}
        >
          <SkipBack size={14} />
        </button>
        <button
          type="button"
          className="transport__icon-btn"
          title="Step back 1 frame"
          onClick={() => step(-1 / 30)}
          disabled={!ready}
        >
          <StepBack size={14} />
        </button>
        <button
          type="button"
          className="transport__play"
          onClick={toggle}
          title={paused ? 'Play' : 'Pause'}
          disabled={!ready}
        >
          {paused ? <Play size={16} /> : <Pause size={16} />}
        </button>
        <button
          type="button"
          className="transport__icon-btn"
          title="Step forward 1 frame"
          onClick={() => step(1 / 30)}
          disabled={!ready}
        >
          <StepFwd size={14} />
        </button>
        <button
          type="button"
          className="transport__icon-btn"
          title="Skip forward 10s"
          onClick={() => step(10)}
          disabled={!ready}
        >
          <SkipFwd size={14} />
        </button>
      </div>

      <div className="transport__time mono">
        <span className="transport__time-current">{formatTime(currentTime)}</span>
        <span className="transport__time-sep">/</span>
        <span className="transport__time-total">{formatTime(duration)}</span>
      </div>

      <input
        type="range"
        min={0}
        max={1}
        step={0.001}
        value={fraction}
        onChange={onScrub}
        className="transport__scrub"
        aria-label="Seek"
        disabled={!ready}
      />

      <div className="transport__cluster transport__cluster--right">
        <button
          type="button"
          className="transport__icon-btn"
          title="Volume"
          disabled={!ready}
        >
          <Volume size={14} />
        </button>
        <button
          type="button"
          className="transport__icon-btn"
          title="Maximize"
          disabled={!ready}
        >
          <Maximize size={14} />
        </button>
        <button type="button" className="transport__aspect mono" disabled={!ready}>
          16:9
          <ChevronDown size={10} />
        </button>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
