import { OpError, type MoveClipOp } from './types.js';
import { findClipById, formatTimeAttr, loadDoc } from './dom.js';

// move_clip(clipId, toTrackIndex, toStart): retarget the clip's track and
// start time. The clip stays in its DOM parent (Hyperframes' track system
// is attribute-driven, not DOM-position-driven), so no re-parenting is
// needed.

export function applyMoveClip(html: string, op: MoveClipOp): string {
  if (op.toStart < 0) {
    throw new OpError(`move_clip refused: start must be >= 0 (got ${op.toStart})`);
  }
  if (!Number.isInteger(op.toTrackIndex) || op.toTrackIndex < 0) {
    throw new OpError(
      `move_clip refused: track index must be a non-negative integer (got ${op.toTrackIndex})`,
    );
  }

  const doc = loadDoc(html);
  const clip = findClipById(doc.root, op.clipId);
  if (!clip) {
    throw new OpError(`move_clip refused: clip "${op.clipId}" not found`);
  }

  const startRef = clip.getAttribute('data-start');
  clip.setAttribute('data-start', formatTimeAttr(startRef, op.toStart));
  clip.setAttribute('data-track-index', String(op.toTrackIndex));

  return doc.serialize();
}
