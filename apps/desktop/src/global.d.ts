// Types injected by the Electron preload script (see electron/preload.ts).
// Keep this in sync with `HsBridge` exported there.

interface HsBridge {
  readonly platform: NodeJS.Platform;
  readonly versions: {
    readonly electron: string;
    readonly node: string;
    readonly chrome: string;
  };
}

interface Window {
  hs?: HsBridge;
}
