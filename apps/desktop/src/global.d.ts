// Types injected by the Electron preload script (see electron/preload.ts).
// Keep this in sync with `HsBridge` exported there.

interface PreviewStartPayload {
  projectPath: string;
  forceNew?: boolean;
}

type PreviewStartResult =
  | { ok: true; url: string; projectPath: string }
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
  readonly preview: {
    start(payload: PreviewStartPayload): Promise<PreviewStartResult>;
    stop(): Promise<{ ok: true }>;
  };
}

interface Window {
  hs?: HsBridge;
}
