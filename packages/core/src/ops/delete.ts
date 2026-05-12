import { OpError, type DeleteClipOp } from './types.js';
import { findClipById, loadDoc } from './dom.js';

// delete_clip(clipId): remove the element from its parent. The clip's
// timeline slot vanishes; later clips on the same track do not shift left —
// that is cut_segment's job.

export function applyDeleteClip(html: string, op: DeleteClipOp): string {
  const doc = loadDoc(html);
  const clip = findClipById(doc.root, op.clipId);
  if (!clip) {
    throw new OpError(`delete_clip refused: clip "${op.clipId}" not found`);
  }
  clip.remove();
  return doc.serialize();
}
