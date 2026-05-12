import type { ProjectState } from '@hyperframeui/core';
import { create } from 'zustand';

// Project store. Holds the currently-loaded ProjectState plus a tiny load
// state machine so the UI can show "Loading…" / "Failed: …" without
// threading callbacks through props.

export type ProjectStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; path: string }
  | { kind: 'ready'; project: ProjectState }
  | { kind: 'error'; path: string; error: string };

interface ProjectStore {
  status: ProjectStatus;
  load(path: string): Promise<void>;
  reset(): void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  status: { kind: 'idle' },
  async load(path: string) {
    if (!window.hs?.project) {
      set({ status: { kind: 'error', path, error: 'Project bridge not available' } });
      return;
    }
    set({ status: { kind: 'loading', path } });
    const result = await window.hs.project.load(path);
    if (result.ok) {
      set({ status: { kind: 'ready', project: result.project } });
    } else {
      set({ status: { kind: 'error', path, error: result.error } });
    }
  },
  reset() {
    set({ status: { kind: 'idle' } });
  },
}));
