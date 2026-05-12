// Op union — every mutation that can flow through applyOp().
//
// Each variant is shaped so a Claude tool call and a UI gesture (drag, click)
// can produce the same value. The reducer (in reducer.ts) routes by `type`.

export type Op =
  | TrimClipOp
  | DeleteClipOp
  | UpdateCaptionTextOp
  | MoveClipOp;

export interface TrimClipOp {
  type: 'trim_clip';
  clipId: string;
  start: number;
  duration: number;
}

export interface DeleteClipOp {
  type: 'delete_clip';
  clipId: string;
}

export interface UpdateCaptionTextOp {
  type: 'update_caption_text';
  captionId: string;
  text: string;
}

export interface MoveClipOp {
  type: 'move_clip';
  clipId: string;
  toTrackIndex: number;
  toStart: number;
}

/** Outcome surface for op application. */
export interface OpResult {
  ok: boolean;
  /** Files whose content changed, keyed by project-relative path. */
  mutatedFiles: string[];
  /** Ids of clips touched by this op (used for the UI pulse highlight). */
  affectedClipIds: string[];
  /** Present only when ok === false. */
  error?: string;
}

export class OpError extends Error {
  override readonly name = 'OpError';
}
