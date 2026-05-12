import type { Op, OpResult, ProjectState } from '@hyperframeui/core';
import { create } from 'zustand';

// Project store. Holds the currently-loaded ProjectState plus a tiny load
// state machine so the UI can show "Loading…" / "Failed: …" without
// threading callbacks through props. Revision counter bumps on every
// successful (re-)load so listeners (player, timeline) can re-fetch
// derived data such as composition HTML.

export type ProjectStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; path: string }
  | { kind: 'ready'; project: ProjectState; revision: number }
  | { kind: 'error'; path: string; error: string };

interface ProjectStore {
  status: ProjectStatus;
  /** Removed when the active project changes / closes. */
  unsubscribeCompositionChanges: (() => void) | null;
  load(path: string): Promise<void>;
  pickAndLoad(): Promise<void>;
  createAndLoad(): Promise<void>;
  /** Apply an Op to the current project. Optimistically does nothing — the
   *  reducer writes the file and the chokidar watcher refreshes the store
   *  shortly after. */
  applyOp(op: Op): Promise<OpResult>;
  reset(): void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  status: { kind: 'idle' },
  unsubscribeCompositionChanges: null,

  async load(path) {
    if (!window.hs?.project) {
      set({ status: { kind: 'error', path, error: 'Project bridge not available' } });
      return;
    }
    set({ status: { kind: 'loading', path } });
    const result = await window.hs.project.load(path);
    if (result.ok) {
      const previousRevision =
        get().status.kind === 'ready' && get().status.kind === 'ready'
          ? (get().status as { revision: number }).revision
          : 0;
      set({
        status: { kind: 'ready', project: result.project, revision: previousRevision + 1 },
      });
      // (Re-)subscribe to composition changes for this project.
      get().unsubscribeCompositionChanges?.();
      const off = window.hs.project.onCompositionChanged(() => {
        // Re-fetch the project state when a composition file changes on
        // disk. The watcher already coalesced events.
        void get().load(path);
      });
      set({ unsubscribeCompositionChanges: off });
      void window.hs.project.watch(path);
    } else {
      set({ status: { kind: 'error', path, error: result.error } });
    }
  },

  async pickAndLoad() {
    const picked = await window.hs?.project.pick();
    if (!picked) return;
    await get().load(picked);
  },

  async createAndLoad() {
    const result = await window.hs?.project.create();
    if (!result || !result.ok) {
      if (result && !('cancelled' in result) && 'error' in result) {
        set({ status: { kind: 'error', path: '(new project)', error: result.error } });
      }
      return;
    }
    await get().load(result.path);
  },

  async applyOp(op) {
    const status = get().status;
    if (status.kind !== 'ready') {
      return {
        ok: false,
        mutatedFiles: [],
        affectedClipIds: [],
        error: 'No project loaded',
      };
    }
    if (!window.hs?.ops) {
      return {
        ok: false,
        mutatedFiles: [],
        affectedClipIds: [],
        error: 'Ops bridge not available',
      };
    }
    const result = await window.hs.ops.apply(status.project.root, op);
    // The composition watcher will refresh state shortly after the write.
    // Callers that need immediate consistency can still await this promise
    // and then await another load(), but for drag UX we rely on optimistic
    // local state until the watcher catches up.
    return result;
  },

  reset() {
    get().unsubscribeCompositionChanges?.();
    void window.hs?.project.unwatch();
    set({ status: { kind: 'idle' }, unsubscribeCompositionChanges: null });
  },
}));
