import { create } from 'zustand';

// Timeline view state. Distinct from playback (cursor + duration) and from
// the project store (the canonical clip data). Holds purely visual concerns:
// horizontal zoom, current clip selection.

interface TimelineStore {
  /** px per second; clamped at render time. */
  pxPerSecond: number;
  selection: Set<string>;
  setPxPerSecond(value: number): void;
  setSelection(ids: string[]): void;
  toggleSelected(id: string, additive: boolean): void;
  clearSelection(): void;
}

const DEFAULT_PX_PER_SECOND = 32;

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  pxPerSecond: DEFAULT_PX_PER_SECOND,
  selection: new Set(),
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
}));
