import { useCallback, type MouseEvent } from 'react';
import { usePlaybackStore } from '../../store/playback';

// Ruler sits at the top of the timeline scroll area, sticky to the top so
// it remains visible during vertical scroll. Major ticks every 5s, minor
// ticks every second; labels on majors.
//
// We render ticks declaratively up to the composition duration. Click
// anywhere on the ruler to seek the playhead there.

const RULER_HEIGHT = 22;

interface RulerProps {
  durationSeconds: number;
  pxPerSecond: number;
}

export function TimelineRuler({ durationSeconds, pxPerSecond }: RulerProps): JSX.Element {
  const seek = usePlaybackStore((s) => s.seek);

  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      seek(Math.max(0, offsetX / pxPerSecond));
    },
    [pxPerSecond, seek],
  );

  // Build tick positions only as far as we have seconds to render.
  const ticks: { left: number; major: boolean; label: string | null }[] = [];
  const max = Math.ceil(durationSeconds) + 1;
  for (let s = 0; s <= max; s++) {
    const major = s % 5 === 0;
    ticks.push({
      left: s * pxPerSecond,
      major,
      label: major ? formatTickLabel(s) : null,
    });
  }

  return (
    <div className="tl-ruler" style={{ height: RULER_HEIGHT }} onClick={onClick}>
      {ticks.map((tick) => (
        <div
          key={tick.left}
          className={`tl-ruler__tick${tick.major ? ' is-major' : ''}`}
          style={{ left: tick.left }}
        >
          {tick.label && <span className="tl-ruler__label mono">{tick.label}</span>}
        </div>
      ))}
    </div>
  );
}

function formatTickLabel(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
