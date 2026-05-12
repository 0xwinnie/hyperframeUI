import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseIndexHtml } from '../src/parser/index.js';
import { transformOp } from '../src/reducer.js';
import { OpError } from '../src/ops/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name: string): string =>
  readFileSync(path.join(__dirname, 'fixtures', name), 'utf8');

const HTML = fixture('minimal.html');

describe('trim_clip', () => {
  it('rewrites data-start and data-duration on the targeted clip', () => {
    const next = transformOp(HTML, {
      type: 'trim_clip',
      clipId: 'cap-00',
      start: 0.3,
      duration: 1.0,
    });
    const parsed = parseIndexHtml(next);
    const cap = parsed.clips.find((c) => c.id === 'cap-00');
    expect(cap?.start).toBe(0.3);
    expect(cap?.duration).toBe(1.0);
  });

  it('preserves the original decimal precision when present', () => {
    const next = transformOp(HTML, {
      type: 'trim_clip',
      clipId: 'cap-00',
      start: 0,
      duration: 1.5,
    });
    // The fixture uses one decimal place for cap-00 (`data-start="0.0"`,
    // `data-duration="1.5"`). After trim we should keep that style.
    expect(next).toMatch(/id="cap-00"[^>]*data-start="0\.0"/);
    expect(next).toMatch(/id="cap-00"[^>]*data-duration="1\.5"/);
  });

  it('refuses non-positive durations', () => {
    expect(() =>
      transformOp(HTML, { type: 'trim_clip', clipId: 'cap-00', start: 0, duration: 0 }),
    ).toThrow(OpError);
  });

  it('refuses negative starts', () => {
    expect(() =>
      transformOp(HTML, { type: 'trim_clip', clipId: 'cap-00', start: -1, duration: 1 }),
    ).toThrow(OpError);
  });

  it('throws when the clip id is missing', () => {
    expect(() =>
      transformOp(HTML, { type: 'trim_clip', clipId: 'ghost', start: 0, duration: 1 }),
    ).toThrow(/not found/);
  });

  it('leaves other clips untouched', () => {
    const next = transformOp(HTML, {
      type: 'trim_clip',
      clipId: 'cap-00',
      start: 0.5,
      duration: 1.0,
    });
    const parsed = parseIndexHtml(next);
    const cap1 = parsed.clips.find((c) => c.id === 'cap-01');
    expect(cap1?.start).toBe(2.0);
    expect(cap1?.duration).toBe(3.0);
  });
});

describe('delete_clip', () => {
  it('removes the element entirely', () => {
    const next = transformOp(HTML, { type: 'delete_clip', clipId: 'cap-00' });
    const parsed = parseIndexHtml(next);
    expect(parsed.clips.find((c) => c.id === 'cap-00')).toBeUndefined();
  });

  it('keeps siblings intact', () => {
    const before = parseIndexHtml(HTML);
    const next = transformOp(HTML, { type: 'delete_clip', clipId: 'cap-00' });
    const after = parseIndexHtml(next);
    expect(after.clips).toHaveLength(before.clips.length - 1);
    expect(after.clips.find((c) => c.id === 'cap-01')).toBeDefined();
  });

  it('throws when the clip is missing', () => {
    expect(() => transformOp(HTML, { type: 'delete_clip', clipId: 'ghost' })).toThrow(
      /not found/,
    );
  });
});

describe('update_caption_text', () => {
  it('replaces the inner text of a caption clip', () => {
    const next = transformOp(HTML, {
      type: 'update_caption_text',
      captionId: 'cap-00',
      text: 'updated text',
    });
    const parsed = parseIndexHtml(next);
    expect(parsed.clips.find((c) => c.id === 'cap-00')?.text).toBe('updated text');
  });

  it('escapes HTML special characters', () => {
    const next = transformOp(HTML, {
      type: 'update_caption_text',
      captionId: 'cap-00',
      text: '<script>alert(1)</script> & friends',
    });
    expect(next).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; friends');
    expect(next).not.toContain('<script>alert(1)</script>');
  });

  it('refuses to write text into a non-caption clip', () => {
    expect(() =>
      transformOp(HTML, {
        type: 'update_caption_text',
        captionId: 'intro',
        text: 'no go',
      }),
    ).toThrow(/not a caption/);
  });

  it('throws when the caption is missing', () => {
    expect(() =>
      transformOp(HTML, {
        type: 'update_caption_text',
        captionId: 'ghost',
        text: 'no go',
      }),
    ).toThrow(/not found/);
  });
});

describe('move_clip', () => {
  it('updates data-start and data-track-index', () => {
    const next = transformOp(HTML, {
      type: 'move_clip',
      clipId: 'cap-00',
      toTrackIndex: 5,
      toStart: 1.5,
    });
    const parsed = parseIndexHtml(next);
    const cap = parsed.clips.find((c) => c.id === 'cap-00');
    expect(cap?.start).toBe(1.5);
    expect(cap?.trackIndex).toBe(5);
  });

  it('refuses negative starts', () => {
    expect(() =>
      transformOp(HTML, {
        type: 'move_clip',
        clipId: 'cap-00',
        toTrackIndex: 5,
        toStart: -0.5,
      }),
    ).toThrow(OpError);
  });

  it('refuses non-integer track indices', () => {
    expect(() =>
      transformOp(HTML, {
        type: 'move_clip',
        clipId: 'cap-00',
        toTrackIndex: 2.5,
        toStart: 1,
      }),
    ).toThrow(OpError);
  });

  it('throws when the clip is missing', () => {
    expect(() =>
      transformOp(HTML, {
        type: 'move_clip',
        clipId: 'ghost',
        toTrackIndex: 5,
        toStart: 1,
      }),
    ).toThrow(/not found/);
  });
});

describe('reducer behaviour', () => {
  it('throws on unknown op types', () => {
    expect(() =>
      transformOp(HTML, { type: 'no_such_op' } as unknown as Parameters<typeof transformOp>[1]),
    ).toThrow(/Unknown op/);
  });
});
