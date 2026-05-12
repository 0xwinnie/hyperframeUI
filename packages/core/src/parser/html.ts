import { parse, type HTMLElement } from 'node-html-parser';
import type { Clip, CompositionMeta } from '../types.js';

// Pure HTML parsing. Inputs and outputs are plain values — no fs, no I/O —
// so this module is trivially testable and reusable in non-Electron hosts.

export interface ParsedHtml {
  composition: CompositionMeta;
  clips: ParsedClip[];
}

export interface ParsedClip extends Clip {
  /** data-track-index parsed off the element. */
  trackIndex: number;
}

const DEFAULT_FPS = 30;

/**
 * Parse a Hyperframes composition file (typically `index.html`) into the
 * pieces HyperframeUI needs: canvas dimensions, total duration, and the list
 * of timed clip elements grouped later by `data-track-index`.
 *
 * `sourceFile` is the path-relative-to-project label we stamp on each Clip so
 * downstream ops can locate them again on disk.
 */
export function parseIndexHtml(html: string, sourceFile = 'index.html'): ParsedHtml {
  const root = parse(html, {
    lowerCaseTagName: true,
    comment: false,
  });

  const composition = extractComposition(root);
  const clips = extractClips(root, sourceFile);

  return { composition, clips };
}

function extractComposition(root: HTMLElement): CompositionMeta {
  const viewport = root.querySelector('meta[name="viewport"]');
  const { width, height } = parseViewport(viewport?.getAttribute('content') ?? '');

  // The Hyperframes root timeline element carries the project-wide
  // data-duration. We pick the largest data-duration we see among elements
  // that DON'T have a track index (i.e. the project root) so we are robust
  // to multi-stage container nesting.
  const duration = inferDuration(root);

  return {
    width: width ?? 1080,
    height: height ?? 1080,
    duration,
    fps: DEFAULT_FPS,
  };
}

function parseViewport(content: string): { width?: number; height?: number } {
  const out: { width?: number; height?: number } = {};
  for (const part of content.split(/[,;]\s*/)) {
    const [rawKey, rawValue] = part.split('=');
    if (!rawKey || !rawValue) continue;
    const key = rawKey.trim();
    const value = Number.parseFloat(rawValue.trim());
    if (!Number.isFinite(value)) continue;
    if (key === 'width') out.width = value;
    else if (key === 'height') out.height = value;
  }
  return out;
}

function inferDuration(root: HTMLElement): number {
  let best = 0;
  for (const el of root.querySelectorAll('[data-duration]')) {
    if (el.hasAttribute('data-track-index')) continue;
    const value = readNumberAttr(el, 'data-duration');
    if (value !== null && value > best) best = value;
  }
  if (best > 0) return best;

  // Fallback: max end-time across timed clips.
  for (const el of root.querySelectorAll('[data-start][data-duration]')) {
    const start = readNumberAttr(el, 'data-start') ?? 0;
    const duration = readNumberAttr(el, 'data-duration') ?? 0;
    const end = start + duration;
    if (end > best) best = end;
  }
  return best;
}

function extractClips(root: HTMLElement, sourceFile: string): ParsedClip[] {
  const clips: ParsedClip[] = [];

  // Every element that carries a track index is a clip. The "clip" class is a
  // visual convention in Hyperframes, but media tags (video, audio) often
  // omit it.
  const nodes = root.querySelectorAll('[data-track-index]');

  let anonymousCounter = 0;
  for (const el of nodes) {
    const trackIndex = readNumberAttr(el, 'data-track-index');
    const start = readNumberAttr(el, 'data-start');
    const duration = readNumberAttr(el, 'data-duration');
    if (trackIndex === null || start === null || duration === null) continue;

    const id = el.getAttribute('id') ?? `clip-${anonymousCounter++}`;
    const src = el.getAttribute('src') ?? el.getAttribute('data-src') ?? undefined;
    const text = isCaption(el) ? el.text.trim() : undefined;

    clips.push({
      id,
      sourceFile,
      selector: selectorFor(el, id),
      trackIndex,
      start,
      duration,
      ...(src ? { src } : {}),
      ...(text ? { text } : {}),
    });
  }

  return clips;
}

function isCaption(el: HTMLElement): boolean {
  const cls = el.getAttribute('class') ?? '';
  return /\bcaption\b/.test(cls);
}

function selectorFor(el: HTMLElement, id: string): string {
  if (el.hasAttribute('id')) return `#${id}`;
  // Fallback: tag + nth-of-type is fragile but good enough as a placeholder
  // until ops adopt a proper byte-offset/AST handle.
  return `${el.tagName.toLowerCase()}[data-track-index="${el.getAttribute('data-track-index')}"][data-start="${el.getAttribute('data-start')}"]`;
}

function readNumberAttr(el: HTMLElement, name: string): number | null {
  const raw = el.getAttribute(name);
  if (raw === undefined || raw === null) return null;
  const value = Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}
