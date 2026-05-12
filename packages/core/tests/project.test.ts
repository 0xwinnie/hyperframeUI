import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject } from '../src/parser/project.js';

// Integration test against the real Hyperframes fixture in
// ~/Projects/my-video. The fixture is mutable (Claude or the user may
// edit it from inside HFUI), so these tests check structural invariants
// rather than exact numeric values. Self-skips when the fixture is
// unavailable.

const MY_VIDEO = '/Users/jia.wen/Projects/my-video';
const fixtureAvailable = existsSync(path.join(MY_VIDEO, 'index.html'));
const maybeIt = fixtureAvailable ? it : it.skip;

describe('loadProject — my-video integration', () => {
  maybeIt('parses composition meta from the real index.html', async () => {
    const project = await loadProject(MY_VIDEO);
    expect(project.composition.width).toBe(1080);
    expect(project.composition.height).toBe(1080);
    expect(project.composition.duration).toBeGreaterThan(60);
  });

  maybeIt('discovers the canonical Hyperframes tracks', async () => {
    const project = await loadProject(MY_VIDEO);
    const indices = new Set(project.tracks.map((t) => t.index));
    // The fixture may sprout new tracks as the user edits, but the
    // canonical Hyperframes layout always includes these.
    for (const expected of [0, 1, 10]) {
      expect(indices.has(expected)).toBe(true);
    }
  });

  maybeIt('classifies the caption track and finds caption clips with text', async () => {
    const project = await loadProject(MY_VIDEO);
    const captions = project.tracks.find((t) => t.index === 10);
    expect(captions?.kind).toBe('caption');
    expect(captions?.clips.length ?? 0).toBeGreaterThan(0);
    expect(captions?.clips[0]?.text).toBeTruthy();
  });

  maybeIt('reads meta.json for the canonical project id/name', async () => {
    const project = await loadProject(MY_VIDEO);
    expect(project.meta.id).toBe('my-video');
    expect(project.meta.name).toBe('my-video');
  });

  maybeIt('synthesises a default sidecar when none exists on disk', async () => {
    const project = await loadProject(MY_VIDEO);
    expect(project.sidecar.schemaVersion).toBe(1);
    expect(project.sidecar.trackMap[10]?.kind).toBe('caption');
  });
});
