import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { Clip, TrackColor, TrackKind } from '@hyperframeui/core';
import { useProjectStore } from '../../store/project';
import {
  applyDragVisual,
  useTimelineStore,
  type ActiveDrag,
  type DragKind,
} from '../../store/timeline';

interface TimelineClipProps {
  clip: Clip;
  /** Track index the clip currently lives on (needed for move_clip ops). */
  trackIndex: number;
  trackColor: TrackColor;
  trackKind: TrackKind;
  pxPerSecond: number;
  /** Show a context menu at viewport coords. Owned by Timeline component. */
  onContextMenu: (event: MouseEvent<HTMLElement>, clip: Clip, trackKind: TrackKind) => void;
}

// A clip rectangle on the timeline. Supports:
//   - Drag the body to change data-start (move_clip op on mouseup)
//   - Drag a left handle to push the in-point right (trim_clip op)
//   - Drag a right handle to pull the out-point (trim_clip op)
//   - Right-click for delete / caption-text edit
// During drag we render an optimistic position from useTimelineStore.drag;
// the chokidar watcher refreshes the real state once the op writes to disk.

export function TimelineClip({
  clip,
  trackIndex,
  trackColor,
  trackKind,
  pxPerSecond,
  onContextMenu,
}: TimelineClipProps): JSX.Element {
  const selection = useTimelineStore((s) => s.selection);
  const drag = useTimelineStore((s) => s.drag);
  const toggleSelected = useTimelineStore((s) => s.toggleSelected);
  const beginDrag = useTimelineStore((s) => s.beginDrag);
  const updateDrag = useTimelineStore((s) => s.updateDrag);
  const endDrag = useTimelineStore((s) => s.endDrag);
  const cancelDrag = useTimelineStore((s) => s.cancelDrag);
  const applyOp = useProjectStore((s) => s.applyOp);

  const isSelected = selection.has(clip.id);
  const dragForThisClip = drag && drag.clipId === clip.id ? drag : null;
  const { start, duration } = applyDragVisual(clip.id, clip.start, clip.duration, drag);

  const left = start * pxPerSecond;
  const width = Math.max(2, duration * pxPerSecond);
  const label = clip.text ?? clip.src?.split('/').pop() ?? clip.id;

  // Window listeners while a drag involving this clip is active. We register
  // them once on mount and read the live drag/pxPerSecond from refs so the
  // listener never goes stale.
  const dragInfoRef = useRef<{ startX: number; pxPerSecond: number; kind: DragKind } | null>(null);

  const onMouseMove = useCallback(
    (event: globalThis.MouseEvent) => {
      const info = dragInfoRef.current;
      if (!info) return;
      const deltaPx = event.clientX - info.startX;
      const deltaSeconds = deltaPx / info.pxPerSecond;
      updateDrag(deltaSeconds);
    },
    [updateDrag],
  );

  const onMouseUp = useCallback(() => {
    const final = endDrag();
    dragInfoRef.current = null;
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
    if (!final) return;
    void commitDrag(final);
    async function commitDrag(d: ActiveDrag): Promise<void> {
      if (d.kind === 'move') {
        const newStart = Math.max(0, d.originalStart + d.deltaSeconds);
        if (Math.abs(newStart - d.originalStart) < 0.01) return;
        await applyOp({
          type: 'move_clip',
          clipId: d.clipId,
          toTrackIndex: trackIndex,
          toStart: round(newStart),
        });
      } else if (d.kind === 'trim-left') {
        const newStart = Math.max(0, d.originalStart + d.deltaSeconds);
        const consumed = newStart - d.originalStart;
        const newDuration = Math.max(0.05, d.originalDuration - consumed);
        if (Math.abs(newDuration - d.originalDuration) < 0.01) return;
        await applyOp({
          type: 'trim_clip',
          clipId: d.clipId,
          start: round(newStart),
          duration: round(newDuration),
        });
      } else {
        const newDuration = Math.max(0.05, d.originalDuration + d.deltaSeconds);
        if (Math.abs(newDuration - d.originalDuration) < 0.01) return;
        await applyOp({
          type: 'trim_clip',
          clipId: d.clipId,
          start: round(d.originalStart),
          duration: round(newDuration),
        });
      }
    }
  }, [endDrag, onMouseMove, applyOp, trackIndex]);

  const startDrag = (event: ReactMouse, kind: DragKind): void => {
    event.preventDefault();
    event.stopPropagation();
    dragInfoRef.current = {
      startX: event.clientX,
      pxPerSecond,
      kind,
    };
    beginDrag({
      clipId: clip.id,
      kind,
      originalStart: clip.start,
      originalDuration: clip.duration,
    });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ESC cancels an in-flight drag.
  useEffect(() => {
    if (!dragForThisClip) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        cancelDrag();
        dragInfoRef.current = null;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dragForThisClip, cancelDrag, onMouseMove, onMouseUp]);

  return (
    <div
      className={`tl-clip tl-clip--${trackKind} tl-clip--${trackColor}${
        isSelected ? ' is-selected' : ''
      }${dragForThisClip ? ' is-dragging' : ''}`}
      style={{ left, width }}
      onMouseDown={(event: ReactMouse) => {
        if (event.button !== 0) return;
        toggleSelected(clip.id, event.shiftKey || event.metaKey || event.ctrlKey);
        startDrag(event, 'move');
      }}
      onContextMenu={(event: ReactMouse) => {
        event.preventDefault();
        onContextMenu(event, clip, trackKind);
      }}
      title={`${clip.id} · ${clip.start.toFixed(2)}s + ${clip.duration.toFixed(2)}s`}
    >
      <ClipHandle side="left" onPointerDown={(event: ReactMouse) => startDrag(event, 'trim-left')} />
      <span className="tl-clip__label truncate">{label}</span>
      <ClipHandle side="right" onPointerDown={(event: ReactMouse) => startDrag(event, 'trim-right')} />
    </div>
  );
}

type ReactMouse = MouseEvent<HTMLElement>;

function ClipHandle({
  side,
  onPointerDown,
}: {
  side: 'left' | 'right';
  onPointerDown: (event: ReactMouse) => void;
}): ReactNode {
  return (
    <span
      className={`tl-clip__handle tl-clip__handle--${side}`}
      onMouseDown={(event: ReactMouse) => {
        if (event.button !== 0) return;
        onPointerDown(event);
      }}
      aria-hidden
    />
  );
}

function round(value: number): number {
  // 3 decimals match the precision Hyperframes compositions use for caption
  // timing (e.g. data-start="0.000"). Plenty for human-driven dragging.
  return Math.round(value * 1000) / 1000;
}
