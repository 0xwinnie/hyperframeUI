import { OpError, type TrimClipOp } from './types.js';
import { findClipById, formatTimeAttr, loadDoc } from './dom.js';

// trim_clip(clipId, start, duration): rewrite the clip element's data-start
// and data-duration in place. Adjacent clips are not touched — slide
// behavior is the caller's responsibility (see future cut_segment op).

export function applyTrimClip(html: string, op: TrimClipOp): string {
  if (op.duration <= 0) {
    throw new OpError(`trim_clip refused: duration must be > 0 (got ${op.duration})`);
  }
  if (op.start < 0) {
    throw new OpError(`trim_clip refused: start must be >= 0 (got ${op.start})`);
  }

  const doc = loadDoc(html);
  const clip = findClipById(doc.root, op.clipId);
  if (!clip) {
    throw new OpError(`trim_clip refused: clip "${op.clipId}" not found`);
  }

  const startRef = clip.getAttribute('data-start');
  const durationRef = clip.getAttribute('data-duration');
  clip.setAttribute('data-start', formatTimeAttr(startRef, op.start));
  clip.setAttribute('data-duration', formatTimeAttr(durationRef, op.duration));

  return doc.serialize();
}
