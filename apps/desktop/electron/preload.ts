import { contextBridge } from 'electron';

// Phase 0: minimal preload. The renderer can't touch Node APIs directly —
// every privileged action must go through a whitelisted bridge method here.
// As tools land in Phase 1, add them to a typed `hs.*` namespace.

const bridge = {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
} as const;

contextBridge.exposeInMainWorld('hs', bridge);

export type HsBridge = typeof bridge;
