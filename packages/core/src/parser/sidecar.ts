import type { HyperframeUISidecar } from '../types.js';
import { makeDefaultSidecar } from './defaults.js';

// HyperframeUI keeps non-Hyperframes UI metadata (track names + colors,
// playhead, zoom, theme) in a sidecar JSON file under the project root at
// `.hyperframeui/project.json`. The file is optional and disposable — a
// fresh project gets a default sidecar synthesised at load time.

export function parseSidecar(json: string | null | undefined): HyperframeUISidecar {
  const defaults = makeDefaultSidecar();
  if (!json) return defaults;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return defaults;
  }

  if (!parsed || typeof parsed !== 'object') return defaults;
  const obj = parsed as Record<string, unknown>;

  const schemaVersion = obj['schemaVersion'] === 1 ? 1 : 1;
  const trackMap =
    typeof obj['trackMap'] === 'object' && obj['trackMap'] !== null
      ? mergeTrackMap(defaults.trackMap, obj['trackMap'] as Record<string, unknown>)
      : defaults.trackMap;

  const sidecar: HyperframeUISidecar = {
    schemaVersion,
    trackMap,
  };

  if (typeof obj['lastPlayhead'] === 'number') sidecar.lastPlayhead = obj['lastPlayhead'];
  if (typeof obj['lastZoom'] === 'number') sidecar.lastZoom = obj['lastZoom'];
  if (typeof obj['theme'] === 'string') sidecar.theme = obj['theme'];

  return sidecar;
}

export function serializeSidecar(sidecar: HyperframeUISidecar): string {
  return `${JSON.stringify(sidecar, null, 2)}\n`;
}

function mergeTrackMap(
  base: HyperframeUISidecar['trackMap'],
  override: Record<string, unknown>,
): HyperframeUISidecar['trackMap'] {
  const out: HyperframeUISidecar['trackMap'] = { ...base };
  for (const [keyStr, valueRaw] of Object.entries(override)) {
    const key = Number.parseInt(keyStr, 10);
    if (!Number.isFinite(key)) continue;
    if (!valueRaw || typeof valueRaw !== 'object') continue;
    const value = valueRaw as Record<string, unknown>;
    if (
      typeof value['kind'] !== 'string' ||
      typeof value['label'] !== 'string' ||
      typeof value['color'] !== 'string'
    ) {
      continue;
    }
    out[key] = {
      kind: value['kind'] as HyperframeUISidecar['trackMap'][number]['kind'],
      label: value['label'],
      color: value['color'] as HyperframeUISidecar['trackMap'][number]['color'],
    };
  }
  return out;
}
