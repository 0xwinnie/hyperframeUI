import type { HyperframeUISidecar, TrackColor, TrackKind } from '../types.js';

// Default Hyperframes track-index → semantic mapping. These match the
// conventions used in heygen-com/hyperframes example projects (e.g.
// my-video). The sidecar can override any of them per-project.
export const DEFAULT_TRACK_MAP: HyperframeUISidecar['trackMap'] = {
  0: { kind: 'a-roll', label: 'A-Roll', color: 'accent' },
  1: { kind: 'music', label: 'Audio', color: 'green' },
  2: { kind: 'b-roll', label: 'B-Roll', color: 'violet' },
  5: { kind: 'overlay', label: 'Intro', color: 'accent' },
  6: { kind: 'overlay', label: 'Outro', color: 'accent' },
  10: { kind: 'caption', label: 'Captions', color: 'amber' },
  20: { kind: 'music', label: 'Music', color: 'green' },
  21: { kind: 'sfx', label: 'SFX', color: 'green' },
};

export function makeDefaultSidecar(): HyperframeUISidecar {
  return {
    schemaVersion: 1,
    trackMap: { ...DEFAULT_TRACK_MAP },
  };
}

export function trackDefaults(index: number): { kind: TrackKind; label: string; color: TrackColor } {
  const mapped = DEFAULT_TRACK_MAP[index];
  if (mapped) return mapped;
  return {
    kind: 'overlay',
    label: `Track ${index}`,
    color: 'accent',
  };
}
