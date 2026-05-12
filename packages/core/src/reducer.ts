import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import {
  applyDeleteClip,
  applyMoveClip,
  applyTrimClip,
  applyUpdateCaptionText,
  OpError,
  type Op,
  type OpResult,
} from './ops/index.js';

// applyOp() runs the supplied Op against a Hyperframes project on disk:
//   1. Read the affected file(s)
//   2. Run the pure transformation
//   3. Atomically replace the file via tmp + rename
//   4. Return mutated paths + clip ids for the UI + undo log
//
// For Phase 1 every Op currently in scope mutates index.html only. cut_segment
// and add_clip (which may touch compositions/*.html) will extend transformOp
// with multi-file support.

const INDEX_HTML = 'index.html';

export async function applyOp(projectRoot: string, op: Op): Promise<OpResult> {
  try {
    const filePath = path.join(projectRoot, INDEX_HTML);
    const before = await fs.readFile(filePath, 'utf8');
    const after = transformOp(before, op);
    if (before === after) {
      return { ok: true, mutatedFiles: [], affectedClipIds: affectedClipIds(op) };
    }
    await atomicWrite(filePath, after);
    return {
      ok: true,
      mutatedFiles: [INDEX_HTML],
      affectedClipIds: affectedClipIds(op),
    };
  } catch (err) {
    return {
      ok: false,
      mutatedFiles: [],
      affectedClipIds: affectedClipIds(op),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function transformOp(html: string, op: Op): string {
  switch (op.type) {
    case 'trim_clip':
      return applyTrimClip(html, op);
    case 'delete_clip':
      return applyDeleteClip(html, op);
    case 'update_caption_text':
      return applyUpdateCaptionText(html, op);
    case 'move_clip':
      return applyMoveClip(html, op);
    default: {
      const exhaustive: never = op;
      throw new OpError(`Unknown op: ${JSON.stringify(exhaustive)}`);
    }
  }
}

function affectedClipIds(op: Op): string[] {
  switch (op.type) {
    case 'trim_clip':
    case 'delete_clip':
    case 'move_clip':
      return [op.clipId];
    case 'update_caption_text':
      return [op.captionId];
  }
}

/**
 * Write `content` to `target` atomically: stage to `<target>.<rand>.tmp`,
 * fsync, then rename onto the target. A crash mid-write leaves the original
 * intact; a successful rename is durable on every POSIX-compatible FS we
 * support.
 */
export async function atomicWrite(target: string, content: string): Promise<void> {
  const dir = path.dirname(target);
  const base = path.basename(target);
  const tmp = path.join(dir, `.${base}.${randomBytes(6).toString('hex')}.tmp`);

  const handle = await fs.open(tmp, 'w');
  try {
    await handle.writeFile(content, 'utf8');
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, target);
}
