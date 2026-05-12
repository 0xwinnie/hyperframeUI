import { contextBridge, ipcRenderer } from 'electron';
import type { Op, OpResult, ProjectState } from '@hyperframeui/core';

// Phase 0/1: minimal preload. The renderer can't touch Node APIs directly —
// every privileged action must go through a whitelisted bridge method here.

export interface PreviewStartPayload {
  projectPath: string;
  forceNew?: boolean;
}

export type PreviewStartResult =
  | { ok: true; url: string; projectPath: string }
  | { ok: false; error: string };

export type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

export type AgentChunk =
  | { kind: 'session_init'; sessionId: string }
  | { kind: 'text_start'; blockId: string }
  | { kind: 'text_delta'; blockId: string; text: string }
  | { kind: 'thinking_start'; blockId: string }
  | { kind: 'thinking_delta'; blockId: string; text: string }
  | { kind: 'tool_use'; toolName: string; input: unknown; toolUseId: string }
  | { kind: 'tool_result'; toolUseId: string; output: string; isError: boolean }
  | { kind: 'system'; text: string }
  | { kind: 'result'; text?: string; sessionId: string }
  | { kind: 'error'; message: string };

export type AgentSendResult =
  | { ok: true; chunkCount: number }
  | { ok: false; error: string };

export type ProjectLoadResult =
  | { ok: true; project: ProjectState }
  | { ok: false; error: string };

export type ProjectCreateResult =
  | { ok: true; path: string }
  | { ok: false; error: string }
  | { ok: false; cancelled: true };

// We route streamed chunks through a per-request callback table inside the
// preload context so the renderer can subscribe via the contextBridge without
// having to pass IpcRenderer event handlers across the isolation boundary.
const chunkListeners = new Map<string, (chunk: AgentChunk) => void>();

ipcRenderer.on('hfui:agent:chunk', (_event, requestId: string, chunk: AgentChunk) => {
  chunkListeners.get(requestId)?.(chunk);
});

const mediaListeners = new Set<(payload: { files: MediaFile[] }) => void>();

ipcRenderer.on('hfui:media:changed', (_event, payload: { files: MediaFile[] }) => {
  for (const fn of mediaListeners) fn(payload);
});

const compositionListeners = new Set<() => void>();

ipcRenderer.on('hfui:project:compositionChanged', () => {
  for (const fn of compositionListeners) fn();
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
  project: {
    load: (rootPath: string): Promise<ProjectLoadResult> =>
      ipcRenderer.invoke('hfui:project:load', rootPath),
    pick: (): Promise<string | null> => ipcRenderer.invoke('hfui:project:pick'),
    create: (): Promise<ProjectCreateResult> => ipcRenderer.invoke('hfui:project:create'),
    watch: (rootPath: string): Promise<{ ok: true }> =>
      ipcRenderer.invoke('hfui:project:watch', rootPath),
    unwatch: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:project:unwatch'),
    onCompositionChanged(listener: () => void): () => void {
      compositionListeners.add(listener);
      return () => {
        compositionListeners.delete(listener);
      };
    },
  },
  ops: {
    apply: (rootPath: string, op: Op): Promise<OpResult> =>
      ipcRenderer.invoke('hfui:ops:apply', rootPath, op),
  },
  preview: {
    start: (payload: PreviewStartPayload): Promise<PreviewStartResult> =>
      ipcRenderer.invoke('hfui:preview:start', payload),
    stop: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:preview:stop'),
  },
  media: {
    list: (rootPath: string): Promise<MediaListResult> =>
      ipcRenderer.invoke('hfui:media:list', rootPath),
    watch: (rootPath: string): Promise<{ ok: true }> =>
      ipcRenderer.invoke('hfui:media:watch', rootPath),
    unwatch: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:media:unwatch'),
    import: (rootPath: string): Promise<MediaImportResult> =>
      ipcRenderer.invoke('hfui:media:import', rootPath),
    remove: (rootPath: string, relativePath: string): Promise<MediaRemoveResult> =>
      ipcRenderer.invoke('hfui:media:remove', rootPath, relativePath),
    onChanged(listener: (payload: { files: MediaFile[] }) => void): () => void {
      mediaListeners.add(listener);
      return () => {
        mediaListeners.delete(listener);
      };
    },
  },
  agent: {
    send: (
      prompt: string,
      projectRoot: string | null,
      onChunk: (chunk: AgentChunk) => void,
    ): Promise<AgentSendResult> => {
      const requestId = newRequestId();
      chunkListeners.set(requestId, onChunk);
      return ipcRenderer
        .invoke('hfui:agent:send', prompt, requestId, projectRoot)
        .finally(() => {
          chunkListeners.delete(requestId);
        });
    },
    reset: (): Promise<{ ok: true }> => ipcRenderer.invoke('hfui:agent:reset'),
  },
} as const;

contextBridge.exposeInMainWorld('hs', bridge);

export type HsBridge = typeof bridge;
