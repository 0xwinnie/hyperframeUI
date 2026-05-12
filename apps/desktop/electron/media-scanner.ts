import { promises as fs } from 'node:fs';
import path from 'node:path';

// Scans a project directory for media files the user might want to edit.
// Hidden / framework-owned directories (`.git`, `.hyperframeui`, `renders/`,
// `compositions/`, `analysis/`, `models/`, `node_modules`) are skipped so the
// panel reflects the user's intent ("clips I dropped in") rather than every
// byte in the tree.

const SKIP_DIRS = new Set([
  '.git',
  '.hyperframeui',
  '.thumbnails',
  '.waveform-cache',
  'renders',
  'compositions',
  'analysis',
  'models',
  'node_modules',
]);

export type MediaKind = 'video' | 'audio' | 'image';

const EXT_TO_KIND: Record<string, MediaKind> = {
  '.mp4': 'video',
  '.mov': 'video',
  '.webm': 'video',
  '.mkv': 'video',
  '.m4v': 'video',
  '.avi': 'video',
  '.mp3': 'audio',
  '.m4a': 'audio',
  '.wav': 'audio',
  '.aac': 'audio',
  '.ogg': 'audio',
  '.opus': 'audio',
  '.flac': 'audio',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.gif': 'image',
};

export interface MediaFile {
  /** Stable id derived from the absolute path. */
  id: string;
  kind: MediaKind;
  /** Project-relative path (POSIX separators), e.g. `assets/vlog.mp4`. */
  relativePath: string;
  /** Just the basename for display. */
  name: string;
  sizeBytes: number;
  modifiedMs: number;
}

const MAX_DEPTH = 4;

/**
 * Walk the project root and return every recognised media file. Depth is
 * capped to keep large source trees responsive; cap is generous enough for
 * sensible Hyperframes projects (assets/source/<file>.mp4 is depth 3).
 */
export async function scanProjectMedia(root: string): Promise<MediaFile[]> {
  const abs = path.resolve(root);
  const out: MediaFile[] = [];
  await walk(abs, abs, 0, out);
  // Stable, predictable order: videos first, then audio, then images,
  // alphabetical within each kind.
  const order: Record<MediaKind, number> = { video: 0, audio: 1, image: 2 };
  return out.sort((a, b) => {
    if (a.kind !== b.kind) return order[a.kind] - order[b.kind];
    return a.relativePath.localeCompare(b.relativePath);
  });
}

async function walk(root: string, dir: string, depth: number, out: MediaFile[]): Promise<void> {
  if (depth > MAX_DEPTH) return;
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && depth > 0) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(root, full, depth + 1, out);
      continue;
    }
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name).toLowerCase();
    const kind = EXT_TO_KIND[ext];
    if (!kind) continue;
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    const relativePath = path.relative(root, full).split(path.sep).join('/');
    out.push({
      id: relativePath,
      kind,
      relativePath,
      name: entry.name,
      sizeBytes: stat.size,
      modifiedMs: stat.mtimeMs,
    });
  }
}
