import type { Clip, TrackColor, TrackKind } from '@hyperframeui/core';
import { useTimelineStore } from '../../store/timeline';

interface TimelineClipProps {
  clip: Clip;
  trackColor: TrackColor;
  trackKind: TrackKind;
  pxPerSecond: number;
}

// A clip rectangle on the timeline. Visual variants by track kind:
//   - a-roll: accent gradient, thumbs strip (Phase 2)
//   - b-roll: muted violet gradient
//   - music / sfx: green tint + waveform bars (Phase 2 → currently flat fill)
//   - caption: amber gradient with the caption text printed inside, truncated
//   - other / overlay: neutral surface with the clip id

export function TimelineClip({
  clip,
  trackColor,
  trackKind,
  pxPerSecond,
}: TimelineClipProps): JSX.Element {
  const selection = useTimelineStore((s) => s.selection);
  const toggleSelected = useTimelineStore((s) => s.toggleSelected);

  const isSelected = selection.has(clip.id);
  const left = clip.start * pxPerSecond;
  const width = Math.max(2, clip.duration * pxPerSecond);

  const label = clip.text ?? clip.src?.split('/').pop() ?? clip.id;

  return (
    <button
      type="button"
      className={`tl-clip tl-clip--${trackKind} tl-clip--${trackColor}${
        isSelected ? ' is-selected' : ''
      }`}
      style={{ left, width }}
      onClick={(event) => {
        toggleSelected(clip.id, event.shiftKey || event.metaKey || event.ctrlKey);
      }}
      title={`${clip.id} · ${clip.start.toFixed(2)}s + ${clip.duration.toFixed(2)}s`}
    >
      <span className="tl-clip__handle tl-clip__handle--left" aria-hidden />
      <span className="tl-clip__label truncate">{label}</span>
      <span className="tl-clip__handle tl-clip__handle--right" aria-hidden />
    </button>
  );
}
