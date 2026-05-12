import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ProjectState, Track } from '../types.js';
import { trackDefaults } from './defaults.js';
import { parseIndexHtml, type ParsedClip } from './html.js';
import { parseProjectMeta } from './meta.js';
import { parseSidecar } from './sidecar.js';

// Top-level project loader. Reads the canonical Hyperframes files (and our
// optional sidecar) and produces a ProjectState the rest of HyperframeUI can
// consume. All file I/O lives in this module so html/sidecar/meta stay pure.

export class ProjectLoadError extends Error {
  override readonly name = 'ProjectLoadError';
}

export async function loadProject(root: string): Promise<ProjectState> {
  const absRoot = path.resolve(root);

  // index.html is the canonical composition file but a fresh project — one
  // the user just created via "New" before any Claude tool has scaffolded
  // it — won't have one yet. We treat that as a valid empty project and
  // return a ProjectState with default composition + no tracks.
  const indexPath = path.join(absRoot, 'index.html');
  const indexHtml = await readFileOrNull(indexPath);
  const parsed = indexHtml ? parseIndexHtml(indexHtml, 'index.html') : null;

  const metaJson = await readFileOrNull(path.join(absRoot, 'meta.json'));
  const meta = parseProjectMeta(metaJson, path.basename(absRoot));

  const sidecarJson = await readFileOrNull(
    path.join(absRoot, '.hyperframeui', 'project.json'),
  );
  const sidecar = parseSidecar(sidecarJson);

  const tracks = parsed ? groupIntoTracks(parsed.clips, sidecar.trackMap) : [];

  return {
    root: absRoot,
    meta,
    composition: parsed?.composition ?? {
      width: 1080,
      height: 1080,
      duration: 0,
      fps: 30,
    },
    tracks,
    assets: [],
    sidecar,
  };
}


async function readFileOrNull(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function groupIntoTracks(
  clips: ParsedClip[],
  trackMap: ProjectState['sidecar']['trackMap'],
): Track[] {
  const byIndex = new Map<number, ParsedClip[]>();
  for (const clip of clips) {
    const list = byIndex.get(clip.trackIndex) ?? [];
    list.push(clip);
    byIndex.set(clip.trackIndex, list);
  }

  return [...byIndex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([index, group]) => {
      const overrides = trackMap[index] ?? trackDefaults(index);
      return {
        index,
        kind: overrides.kind,
        label: overrides.label,
        color: overrides.color,
        visible: true,
        locked: false,
        clips: group
          .sort((a, b) => a.start - b.start)
          .map(({ trackIndex: _trackIndex, ...rest }) => rest),
      };
    });
}
