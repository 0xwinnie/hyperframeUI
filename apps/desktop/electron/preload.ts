import { contextBridge, ipcRenderer } from 'electron';

// Phase 0: minimal preload. The renderer can't touch Node APIs directly —
// every privileged action must go through a whitelisted bridge method here.
// As tools land in Phase 1, add them to a typed `hs.*` namespace.

export interface PreviewStartPayload {
  projectPath: string;
  forceNew?: boolean;
}

export type PreviewStartResult =
  | { ok: true; url: string; projectPath: string }
  | { ok: false; error: string };

const bridge = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
  env: {
    /** Phase 0 demo project path, pulled from main via IPC on first call. */
    getDemoProjectPath: (): Promise<string | null> =>
      ipcRenderer.invoke('hfui:env:demoProjectPath'),
  },
  preview: {
    start: (payload: PreviewStartPayload): Promise<PreviewStartResult> =>
      ipcRenderer.invoke('hfui:preview:start', payload),
    stop: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:preview:stop'),
  },
} as const;

contextBridge.exposeInMainWorld('hs', bridge);

export type HsBridge = typeof bridge;
