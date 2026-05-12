import { parse, type HTMLElement } from 'node-html-parser';

// Helpers shared by every op that mutates a Hyperframes HTML file.
//
// node-html-parser is forgiving: it preserves text nodes and indentation,
// re-emits attributes in their original order, and won't auto-close tags it
// didn't see. That's enough fidelity for Phase 1 — when we need byte-level
// precision (e.g. for clip-precise diff hunks) we can swap in a true CST.

export interface ParsedDoc {
  root: HTMLElement;
  serialize: () => string;
}

export function loadDoc(html: string): ParsedDoc {
  const root = parse(html, { lowerCaseTagName: true, comment: false });
  return {
    root,
    serialize: () => root.toString(),
  };
}

export function findClipById(root: HTMLElement, clipId: string): HTMLElement | null {
  // Prefer id-based lookup. We do not yet support clips without ids — those
  // will land alongside split/insert ops which assign synthetic ids first.
  if (CSS_SAFE_ID.test(clipId)) {
    const hit = root.querySelector(`#${clipId}`);
    if (hit) return hit;
  }
  const escaped = clipId.replace(/"/g, '\\"');
  return root.querySelector(`[id="${escaped}"]`);
}

const CSS_SAFE_ID = /^[A-Za-z][\w-]*$/;

export function isCaption(el: HTMLElement): boolean {
  return /\bcaption\b/.test(el.getAttribute('class') ?? '');
}

export function readNumberAttr(el: HTMLElement, name: string): number {
  const raw = el.getAttribute(name);
  const value = raw === undefined || raw === null ? NaN : Number.parseFloat(raw);
  if (!Number.isFinite(value)) {
    throw new Error(`Element ${describe(el)} is missing or has invalid ${name}`);
  }
  return value;
}

export function describe(el: HTMLElement): string {
  const id = el.getAttribute('id');
  return id ? `#${id}` : `<${el.tagName.toLowerCase()}>`;
}

/**
 * Format a time attribute back to its original on-disk style. Hyperframes
 * captions use 3-decimal floats (e.g. `0.000`); media tags use whatever the
 * authoring tool wrote. We sniff the existing attribute when present so
 * trims don't churn unrelated formatting.
 */
export function formatTimeAttr(reference: string | null | undefined, value: number): string {
  if (reference && /\./.test(reference)) {
    const decimals = reference.split('.')[1]?.length ?? 2;
    return value.toFixed(decimals);
  }
  if (reference && /^\d+$/.test(reference)) {
    return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
  }
  return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);
}

