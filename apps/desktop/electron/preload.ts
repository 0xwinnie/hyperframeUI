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

export type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

export interface AgentChunk {
  role: AgentRole;
  text: string;
}

export type AgentSendResult =
  | { ok: true; messageCount: number }
  | { ok: false; error: string };

// We route streamed chunks through a per-request callback table inside the
// preload context so the renderer can subscribe via the contextBridge without
// having to pass IpcRenderer event handlers across the isolation boundary.
const chunkListeners = new Map<string, (chunk: AgentChunk) => void>();

ipcRenderer.on('hfui:agent:chunk', (_event, requestId: string, chunk: AgentChunk) => {
  chunkListeners.get(requestId)?.(chunk);
});

let nextRequestId = 1;
const newRequestId = (): string => `req-${nextRequestId++}-${Date.now()}`;

const bridge = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
  env: {
    /** Phase 0 demo project path, pulled from main via IPC. */
    getDemoProjectPath: (): Promise<string | null> =>
      ipcRenderer.invoke('hfui:env:demoProjectPath'),
  },
  preview: {
    start: (payload: PreviewStartPayload): Promise<PreviewStartResult> =>
      ipcRenderer.invoke('hfui:preview:start', payload),
    stop: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:preview:stop'),
  },
  agent: {
    send: (prompt: string, onChunk: (chunk: AgentChunk) => void): Promise<AgentSendResult> => {
      const requestId = newRequestId();
      chunkListeners.set(requestId, onChunk);
      return ipcRenderer.invoke('hfui:agent:send', prompt, requestId).finally(() => {
        chunkListeners.delete(requestId);
      });
    },
  },
} as const;

contextBridge.exposeInMainWorld('hs', bridge);

export type HsBridge = typeof bridge;
