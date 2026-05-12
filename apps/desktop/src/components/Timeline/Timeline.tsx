import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { Clip, Track, TrackKind } from '@hyperframeui/core';
import { Eye, Lock, ZoomIn, ZoomOut } from '../../icons';
import { usePlaybackStore } from '../../store/playback';
import { useProjectStore } from '../../store/project';
import { useTimelineStore } from '../../store/timeline';
import { TimelineRuler } from './Ruler';
import { TimelineClip } from './Clip';
import { CaptionEditDialog, ClipContextMenu } from './ContextMenu';

const TRACK_ROW_HEIGHT = 56;
const TIMELINE_PADDING_END = 320; // px of empty space past the last clip

export function Timeline(): JSX.Element {
  const status = useProjectStore((s) => s.status);
  const project = status.kind === 'ready' ? status.project : null;
  const tracks = project?.tracks ?? [];
  const duration = project?.composition.duration ?? 0;

  const pxPerSecond = useTimelineStore((s) => s.pxPerSecond);
  const setPxPerSecond = useTimelineStore((s) => s.setPxPerSecond);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenu] = useState<
    { clip: Clip; trackKind: TrackKind; x: number; y: number } | null
  >(null);
  const [captionEdit, setCaptionEdit] = useState<Clip | null>(null);

  if (!project) {
    return <TimelineEmpty />;
  }

  if (duration === 0 || tracks.length === 0) {
    return <TimelineEmptyProject />;
  }

  const openContextMenu = (event: ReactMouseEvent<HTMLElement>, clip: Clip, trackKind: TrackKind): void => {
    setContextMenu({ clip, trackKind, x: event.clientX, y: event.clientY });
  };

  return (
    <section className="timeline">
      <TimelineToolbar pxPerSecond={pxPerSecond} onZoomChange={setPxPerSecond} />
      <TimelineScroller
        ref={scrollerRef}
        tracks={tracks}
        duration={duration}
        pxPerSecond={pxPerSecond}
        onClipContextMenu={openContextMenu}
      />
      {contextMenu && (
        <ClipContextMenu
          clip={contextMenu.clip}
          trackKind={contextMenu.trackKind}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          onEditCaption={(clip) => {
            setCaptionEdit(clip);
          }}
        />
      )}
      {captionEdit && (
        <CaptionEditDialog clip={captionEdit} onClose={() => setCaptionEdit(null)} />
      )}
    </section>
  );
}

interface TimelineScrollerProps {
  tracks: Track[];
  duration: number;
  pxPerSecond: number;
  onClipContextMenu: (event: ReactMouseEvent<HTMLElement>, clip: Clip, trackKind: TrackKind) => void;
}

const TimelineScroller = ({
  ref,
  tracks,
  duration,
  pxPerSecond,
  onClipContextMenu,
}: TimelineScrollerProps & { ref: React.Ref<HTMLDivElement> }): JSX.Element => {
  // Memoised dims drive the ruler + the playhead's left offset.
  const widthPx = useMemo(
    () => Math.max(0, duration) * pxPerSecond + TIMELINE_PADDING_END,
    [duration, pxPerSecond],
  );

  return (
    <div className="timeline__scroller" ref={ref}>
      <div className="timeline__inner" style={{ width: widthPx }}>
        <TimelineRuler durationSeconds={duration} pxPerSecond={pxPerSecond} />
        <div className="timeline__tracks">
          {tracks.map((track) => (
            <TimelineTrack
              key={track.index}
              track={track}
              pxPerSecond={pxPerSecond}
              onClipContextMenu={onClipContextMenu}
            />
          ))}
        </div>
        <TimelinePlayhead pxPerSecond={pxPerSecond} totalHeight={tracks.length * TRACK_ROW_HEIGHT} />
      </div>
    </div>
  );
};

function TimelineTrack({
  track,
  pxPerSecond,
  onClipContextMenu,
}: {
  track: Track;
  pxPerSecond: number;
  onClipContextMenu: (event: ReactMouseEvent<HTMLElement>, clip: Clip, trackKind: TrackKind) => void;
}): JSX.Element {
  return (
    <div className="tl-track">
      <div className={`tl-track__header tl-track__header--${track.color}`}>
        <div className="tl-track__color" aria-hidden />
        <div className="tl-track__label">
          <div className="tl-track__name">{track.label}</div>
          <div className="tl-track__count mono">{track.clips.length} clip{track.clips.length === 1 ? '' : 's'}</div>
        </div>
        <button type="button" className="tl-track__icon" title="Toggle visibility" disabled>
          <Eye size={12} />
        </button>
        <button type="button" className="tl-track__icon" title="Lock track" disabled>
          <Lock size={12} />
        </button>
      </div>
      <div className="tl-track__lane">
        {track.clips.map((clip) => (
          <TimelineClip
            key={clip.id}
            clip={clip}
            trackIndex={track.index}
            trackColor={track.color}
            trackKind={track.kind}
            pxPerSecond={pxPerSecond}
            onContextMenu={onClipContextMenu}
          />
        ))}
      </div>
    </div>
  );
}

function TimelinePlayhead({
  pxPerSecond,
  totalHeight,
}: {
  pxPerSecond: number;
  totalHeight: number;
}): JSX.Element {
  const currentTime = usePlaybackStore((s) => s.currentTime);
  const seek = usePlaybackStore((s) => s.seek);
  const [dragging, setDragging] = useState(false);

  // Drag from the flag head to scrub. Listening on window so the mouse
  // can leave the playhead horizontally without releasing.
  useEffect(() => {
    if (!dragging) return;
    const onMove = (event: MouseEvent): void => {
      const inner = (event.target as HTMLElement | null)?.closest('.timeline__inner')
        ?? document.querySelector('.timeline__inner');
      if (!inner) return;
      const rect = inner.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      seek(Math.max(0, offsetX / pxPerSecond));
    };
    const onUp = (): void => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, pxPerSecond, seek]);

  const left = currentTime * pxPerSecond;

  return (
    <div
      className="tl-playhead"
      style={{ left, height: totalHeight + 22 }}
      aria-label="Playhead"
    >
      <div
        className="tl-playhead__flag"
        onMouseDown={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
      />
      <div className="tl-playhead__line" />
    </div>
  );
}

function TimelineToolbar({
  pxPerSecond,
  onZoomChange,
}: {
  pxPerSecond: number;
  onZoomChange: (value: number) => void;
}): JSX.Element {
  return (
    <div className="tl-toolbar">
      <span className="tl-toolbar__label mono">timeline</span>
      <div className="tl-toolbar__zoom">
        <button
          type="button"
          className="tl-toolbar__zoom-btn"
          title="Zoom out"
          onClick={() => onZoomChange(pxPerSecond / 1.4)}
        >
          <ZoomOut size={12} />
        </button>
        <input
          type="range"
          min={4}
          max={120}
          step={1}
          value={pxPerSecond}
          onChange={(e) => onZoomChange(Number.parseInt(e.target.value, 10))}
          className="tl-toolbar__zoom-range"
          aria-label="Zoom"
        />
        <button
          type="button"
          className="tl-toolbar__zoom-btn"
          title="Zoom in"
          onClick={() => onZoomChange(pxPerSecond * 1.4)}
        >
          <ZoomIn size={12} />
        </button>
        <span className="tl-toolbar__zoom-value mono">{pxPerSecond}px/s</span>
      </div>
    </div>
  );
}

function TimelineEmpty(): JSX.Element {
  return (
    <section className="timeline timeline--empty">
      <div className="timeline__empty mono">No project open.</div>
    </section>
  );
}

function TimelineEmptyProject(): JSX.Element {
  return (
    <section className="timeline timeline--empty">
      <div className="timeline__empty mono">
        Drag material here, or ask Claude to build a rough cut.
      </div>
    </section>
  );
}

