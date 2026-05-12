// Types injected by the Electron preload script (see electron/preload.ts).
// Keep this in sync with `HsBridge` exported there.
//
// The `import type` line makes this a module, so every type must live inside
// `declare global` to stay ambient. Renderer code can use these names without
// importing them.

import type { ProjectState } from '@hyperframeui/core';

declare global {
  interface PreviewStartPayload {
    projectPath: string;
    forceNew?: boolean;
  }

  type PreviewStartResult =
    | { ok: true; url: string; projectPath: string }
    | { ok: false; error: string };

  type AgentRole = 'user' | 'assistant' | 'system' | 'tool';

  interface AgentChunk {
    role: AgentRole;
    text: string;
  }

  type AgentSendResult =
    | { ok: true; messageCount: number }
    | { ok: false; error: string };

  type ProjectLoadResult =
    | { ok: true; project: ProjectState }
    | { ok: false; error: string };

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
    };
    readonly preview: {
      start(payload: PreviewStartPayload): Promise<PreviewStartResult>;
      stop(): Promise<{ ok: true }>;
    };
    readonly agent: {
      send(prompt: string, onChunk: (chunk: AgentChunk) => void): Promise<AgentSendResult>;
    };
  }

  interface Window {
    hs?: HsBridge;
  }
}
