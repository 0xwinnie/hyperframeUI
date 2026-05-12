import { create } from 'zustand';

// Timeline view state. Distinct from playback (cursor + duration) and from
// the project store (the canonical clip data). Holds purely visual concerns
// plus the in-progress drag state so React renders the optimistic clip
// position while the user is mid-gesture.

export type DragKind = 'move' | 'trim-left' | 'trim-right';

export interface ActiveDrag {
  clipId: string;
  kind: DragKind;
  /** Original values captured at mousedown; deltas apply against these. */
  originalStart: number;
  originalDuration: number;
  /** Live deltas, in seconds. Updated on mousemove. */
  deltaSeconds: number;
}

interface TimelineStore {
  /** px per second; clamped at render time. */
  pxPerSecond: number;
  selection: Set<string>;
  drag: ActiveDrag | null;
  setPxPerSecond(value: number): void;
  setSelection(ids: string[]): void;
  toggleSelected(id: string, additive: boolean): void;
  clearSelection(): void;
  beginDrag(input: Omit<ActiveDrag, 'deltaSeconds'>): void;
  updateDrag(deltaSeconds: number): void;
  endDrag(): ActiveDrag | null;
  cancelDrag(): void;
}

const DEFAULT_PX_PER_SECOND = 32;

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  pxPerSecond: DEFAULT_PX_PER_SECOND,
  selection: new Set(),
  drag: null,

  setPxPerSecond(value) {
    set({ pxPerSecond: Math.max(4, Math.min(value, 240)) });
  },
  setSelection(ids) {
    set({ selection: new Set(ids) });
  },
  toggleSelected(id, additive) {
    const current = get().selection;
    if (additive) {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      set({ selection: next });
    } else {
      set({ selection: new Set([id]) });
    }
  },
  clearSelection() {
    set({ selection: new Set() });
  },

  beginDrag(input) {
    set({ drag: { ...input, deltaSeconds: 0 } });
  },
  updateDrag(deltaSeconds) {
    const current = get().drag;
    if (!current) return;
    set({ drag: { ...current, deltaSeconds } });
  },
  endDrag() {
    const drag = get().drag;
    set({ drag: null });
    return drag;
  },
  cancelDrag() {
    set({ drag: null });
  },
}));

/**
 * Given a clip's canonical (start, duration) and the current drag (if it
 * belongs to that clip), return the optimistic (start, duration) the
 * renderer should display.
 */
export function applyDragVisual(
  clipId: string,
  start: number,
  duration: number,
  drag: ActiveDrag | null,
): { start: number; duration: number } {
  if (!drag || drag.clipId !== clipId) return { start, duration };
  if (drag.kind === 'move') {
    return { start: Math.max(0, drag.originalStart + drag.deltaSeconds), duration };
  }
  if (drag.kind === 'trim-left') {
    const newStart = Math.max(0, drag.originalStart + drag.deltaSeconds);
    const consumed = newStart - drag.originalStart;
    const newDuration = Math.max(0.05, drag.originalDuration - consumed);
    return { start: newStart, duration: newDuration };
  }
  // trim-right
  return {
    start,
    duration: Math.max(0.05, drag.originalDuration + drag.deltaSeconds),
  };
}
