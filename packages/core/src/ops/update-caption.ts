import { OpError, type UpdateCaptionTextOp } from './types.js';
import { findClipById, isCaption, loadDoc } from './dom.js';

// update_caption_text(captionId, text): replace the inner text of a caption
// clip. Refuses if the target element is not actually a caption (class
// must contain "caption") — surfacing this as an error helps the agent
// avoid corrupting non-caption divs.

export function applyUpdateCaptionText(html: string, op: UpdateCaptionTextOp): string {
  const doc = loadDoc(html);
  const clip = findClipById(doc.root, op.captionId);
  if (!clip) {
    throw new OpError(`update_caption_text refused: clip "${op.captionId}" not found`);
  }
  if (!isCaption(clip)) {
    throw new OpError(
      `update_caption_text refused: clip "${op.captionId}" is not a caption ` +
        `(class="${clip.getAttribute('class') ?? ''}")`,
    );
  }
  // node-html-parser exposes set_content for raw HTML and a plain string
  // assignment for text content. We use textContent semantics; the renderer
  // (Hyperframes) treats caption content as plain text.
  clip.set_content(escapeHtml(op.text));
  return doc.serialize();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
