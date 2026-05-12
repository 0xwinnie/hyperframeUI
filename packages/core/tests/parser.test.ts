import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRACK_MAP,
  makeDefaultSidecar,
  parseIndexHtml,
  parseProjectMeta,
  parseSidecar,
  serializeSidecar,
} from '../src/parser/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string): string =>
  readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

describe('parseIndexHtml — minimal fixture', () => {
  const html = fixture('minimal.html');
  const parsed = parseIndexHtml(html);

  it('extracts composition width/height from viewport', () => {
    expect(parsed.composition.width).toBe(1920);
    expect(parsed.composition.height).toBe(1080);
  });

  it('uses the root container duration', () => {
    expect(parsed.composition.duration).toBe(12.5);
  });

  it('defaults fps to 30 when not specified anywhere', () => {
    expect(parsed.composition.fps).toBe(30);
  });

  it('extracts every clip that has a data-track-index', () => {
    expect(parsed.clips).toHaveLength(5);
  });

  it('captures src for media tags', () => {
    const video = parsed.clips.find((c) => c.trackIndex === 0);
    const audio = parsed.clips.find((c) => c.trackIndex === 1);
    expect(video?.src).toBe('assets/a.mp4');
    expect(audio?.src).toBe('assets/audio.m4a');
  });

  it('extracts trimmed text from caption clips only', () => {
    const captions = parsed.clips.filter((c) => c.trackIndex === 10);
    expect(captions.map((c) => c.text)).toEqual(['first line', 'second line']);
  });

  it('does not extract text from non-caption div clips', () => {
    const intro = parsed.clips.find((c) => c.id === 'intro');
    expect(intro?.text).toBeUndefined();
  });

  it('emits a stable id-based selector when an id is present', () => {
    const intro = parsed.clips.find((c) => c.id === 'intro');
    expect(intro?.selector).toBe('#intro');
  });

  it('synthesises an id for anonymous clips', () => {
    // Both <video> and <audio> in this fixture lack an explicit id.
    const anon = parsed.clips.filter((c) => c.id.startsWith('clip-'));
    expect(anon.length).toBeGreaterThan(0);
  });
});

describe('parseIndexHtml — empty / malformed input', () => {
  it('returns no clips for an empty document', () => {
    const parsed = parseIndexHtml('<!doctype html><html><head></head><body></body></html>');
    expect(parsed.clips).toEqual([]);
    expect(parsed.composition.duration).toBe(0);
  });

  it('falls back to clip end-times when there is no root data-duration', () => {
    const html = `
      <div data-start="0" data-duration="2" data-track-index="0"></div>
      <div data-start="3" data-duration="4" data-track-index="0"></div>
    `;
    const parsed = parseIndexHtml(html);
    expect(parsed.composition.duration).toBe(7);
  });

  it('skips clips that are missing required attributes', () => {
    const html = `
      <div data-start="0" data-duration="1" data-track-index="0"></div>
      <div data-start="2" data-track-index="0"></div>
      <div data-duration="3" data-track-index="0"></div>
    `;
    const parsed = parseIndexHtml(html);
    expect(parsed.clips).toHaveLength(1);
  });
});

describe('parseSidecar', () => {
  it('returns full defaults when nothing is supplied', () => {
    expect(parseSidecar(null)).toEqual(makeDefaultSidecar());
    expect(parseSidecar(undefined)).toEqual(makeDefaultSidecar());
  });

  it('returns defaults on malformed JSON', () => {
    expect(parseSidecar('not json')).toEqual(makeDefaultSidecar());
  });

  it('keeps default track mappings the user has not overridden', () => {
    const sidecar = parseSidecar(JSON.stringify({ schemaVersion: 1, trackMap: {} }));
    expect(sidecar.trackMap[10]).toEqual(DEFAULT_TRACK_MAP[10]);
  });

  it('honours user overrides on top of defaults', () => {
    const sidecar = parseSidecar(
      JSON.stringify({
        schemaVersion: 1,
        trackMap: {
          5: { kind: 'b-roll', label: 'My B-roll', color: 'violet' },
        },
      }),
    );
    expect(sidecar.trackMap[5]).toEqual({
      kind: 'b-roll',
      label: 'My B-roll',
      color: 'violet',
    });
    // unrelated tracks stay default
    expect(sidecar.trackMap[10]).toEqual(DEFAULT_TRACK_MAP[10]);
  });

  it('round-trips through serializeSidecar', () => {
    const sidecar = makeDefaultSidecar();
    sidecar.lastPlayhead = 4.5;
    sidecar.theme = 'moss';
    const json = serializeSidecar(sidecar);
    const reparsed = parseSidecar(json);
    expect(reparsed).toEqual(sidecar);
  });
});

describe('parseProjectMeta', () => {
  it('uses the directory name when meta.json is missing', () => {
    const meta = parseProjectMeta(null, 'my-video');
    expect(meta.id).toBe('my-video');
    expect(meta.name).toBe('my-video');
    expect(meta.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('reads id/name/createdAt from valid JSON', () => {
    const json = JSON.stringify({
      id: 'demo',
      name: 'Demo project',
      createdAt: '2026-05-12T04:12:19.594Z',
    });
    const meta = parseProjectMeta(json, 'fallback');
    expect(meta).toEqual({
      id: 'demo',
      name: 'Demo project',
      createdAt: '2026-05-12T04:12:19.594Z',
    });
  });

  it('falls back when JSON is malformed', () => {
    const meta = parseProjectMeta('{not json', 'fallback');
    expect(meta.id).toBe('fallback');
  });
});
