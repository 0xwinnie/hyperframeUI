// Types injected by the Electron preload script (see electron/preload.ts).
// Keep this in sync with `HsBridge` exported there.
//
// The `import type` line makes this a module, so every type must live inside
// `declare global` to stay ambient. Renderer code can use these names without
// importing them.

import type { Op, OpResult, ProjectState } from '@hyperframeui/core';

declare global {
  // Custom element types for `<hyperframes-player>` so JSX accepts the tag.
  // The web component is imported for side effects in PlayerStage; the import
  // also registers HyperframesPlayer on customElements.
  namespace JSX {
    interface IntrinsicElements {
      'hyperframes-player': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          srcdoc?: string;
          controls?: boolean | '';
          autoplay?: boolean | '';
          muted?: boolean | '';
          loop?: boolean | '';
          width?: number | string;
          height?: number | string;
          poster?: string;
          'playback-rate'?: number | string;
        },
        HTMLElement
      >;
    }
  }

  interface PreviewStartPayload {
    projectPath: string;
    forceNew?: boolean;
  }

  type PreviewStartResult =
    | { ok: true; url: string; projectPath: string; compositionHtml: string | null }
    | { ok: false; error: string };

  type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

  type AgentChunk =
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

  type AgentSendResult =
    | { ok: true; chunkCount: number }
    | { ok: false; error: string };

  type ProjectLoadResult =
    | { ok: true; project: ProjectState }
    | { ok: false; error: string };

  type ProjectCreateResult =
    | { ok: true; path: string }
    | { ok: false; error: string }
    | { ok: false; cancelled: true };

  type MediaKind = 'video' | 'audio' | 'image';

  interface MediaFile {
    id: string;
    kind: MediaKind;
    relativePath: string;
    name: string;
    sizeBytes: number;
    modifiedMs: number;
  }

  interface MediaListResult {
    files: MediaFile[];
    baseUrl: string | null;
  }

  type MediaImportResult =
    | { ok: true; imported: string[] }
    | { ok: false; error: string }
    | { ok: false; cancelled: true };

  type MediaRemoveResult = { ok: true } | { ok: false; error: string };

  interface HsBridge {
    readonly platform: NodeJS.Platform;
    readonly versions: {
      readonly electron: string;
      readonly node: string;
      readonly chrome: string;
    };
    readonly env: {
      getDemoProjectPath(): Promise<string | null>;
    };
    readonly project: {
      load(rootPath: string): Promise<ProjectLoadResult>;
      pick(): Promise<string | null>;
      create(): Promise<ProjectCreateResult>;
      watch(rootPath: string): Promise<{ ok: true }>;
      unwatch(): Promise<{ ok: true }>;
      onCompositionChanged(listener: () => void): () => void;
    };
    readonly ops: {
      apply(rootPath: string, op: Op): Promise<OpResult>;
    };
    readonly preview: {
      start(payload: PreviewStartPayload): Promise<PreviewStartResult>;
      stop(): Promise<{ ok: true }>;
    };
    readonly media: {
      list(rootPath: string): Promise<MediaListResult>;
      watch(rootPath: string): Promise<{ ok: true }>;
      unwatch(): Promise<{ ok: true }>;
      import(rootPath: string): Promise<MediaImportResult>;
      remove(rootPath: string, relativePath: string): Promise<MediaRemoveResult>;
      onChanged(listener: (payload: { files: MediaFile[] }) => void): () => void;
    };
    readonly agent: {
      send(
        prompt: string,
        projectRoot: string | null,
        onChunk: (chunk: AgentChunk) => void,
      ): Promise<AgentSendResult>;
      reset(): Promise<{ ok: true }>;
    };
  }

  interface Window {
    hs?: HsBridge;
  }
}
