// Domain types for HyperframeUI. The project state on disk is canonical
// (see /docs/spec.md §3); these types describe the in-memory view derived
// from parsing Hyperframes files.

export type TrackKind = 'a-roll' | 'b-roll' | 'caption' | 'music' | 'sfx' | 'overlay';

export type TrackColor = 'accent' | 'violet' | 'green' | 'amber';

export interface Clip {
  id: string;
  /** Absolute path to the file containing the clip element, relative to project root. */
  sourceFile: string;
  /** CSS selector that resolves to the clip within `sourceFile`. */
  selector: string;
  /** Seconds from project start. Mirrors `data-start`. */
  start: number;
  /** Seconds. Mirrors `data-duration`. */
  duration: number;
  /** For media clips: relative asset path. */
  src?: string;
  /** For caption clips: rendered text. */
  text?: string;
  /** Cached path under `.hyperframeui/cache/thumbnails/`. */
  thumbnailPath?: string;
}

export interface Track {
  /** Numeric `data-track-index` shared with Hyperframes. */
  index: number;
  kind: TrackKind;
  label: string;
  color: TrackColor;
  visible: boolean;
  locked: boolean;
  clips: Clip[];
}

export type AssetKind = 'video' | 'audio' | 'image';

export interface Asset {
  id: string;
  path: string;
  kind: AssetKind;
  durationSeconds?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  thumbnailPath?: string;
  /** True if any clip currently references this asset. */
  onTimeline: boolean;
}

export interface TranscriptWord {
  text: string;
  start: number;
  end: number;
}

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
}

export interface CompositionMeta {
  width: number;
  height: number;
  duration: number;
  fps: number;
}

export interface HyperframeUISidecar {
  schemaVersion: 1;
  /** Track index → semantic label/color overrides. */
  trackMap: Record<number, { kind: TrackKind; label: string; color: TrackColor }>;
  lastPlayhead?: number;
  lastZoom?: number;
  theme?: string;
}

export interface ProjectState {
  /** Absolute path to the project directory. */
  root: string;
  meta: ProjectMeta;
  composition: CompositionMeta;
  tracks: Track[];
  assets: Asset[];
  transcript?: TranscriptWord[];
  sidecar: HyperframeUISidecar;
}
