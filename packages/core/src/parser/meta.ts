import type { ProjectMeta } from '../types.js';

// `meta.json` is a tiny file written by Hyperframes when a project is
// scaffolded. It carries the canonical project id and display name.

export function parseProjectMeta(json: string | null | undefined, fallbackName: string): ProjectMeta {
  if (!json) return synthesise(fallbackName);

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return synthesise(fallbackName);
  }

  if (!parsed || typeof parsed !== 'object') return synthesise(fallbackName);
  const obj = parsed as Record<string, unknown>;

  return {
    id: typeof obj['id'] === 'string' ? obj['id'] : fallbackName,
    name: typeof obj['name'] === 'string' ? obj['name'] : fallbackName,
    createdAt: typeof obj['createdAt'] === 'string' ? obj['createdAt'] : new Date().toISOString(),
  };
}

function synthesise(fallbackName: string): ProjectMeta {
  return {
    id: fallbackName,
    name: fallbackName,
    createdAt: new Date().toISOString(),
  };
}
