import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject } from '../src/parser/project.js';

// Integration test against the real Hyperframes fixture in
// ~/Projects/my-video. If the fixture is unavailable (CI, fresh checkout),
// the test self-skips so the suite stays green.

const MY_VIDEO = '/Users/jia.wen/Projects/my-video';
const fixtureAvailable = existsSync(path.join(MY_VIDEO, 'index.html'));
const maybeIt = fixtureAvailable ? it : it.skip;

describe('loadProject — my-video integration', () => {
  maybeIt('parses composition meta from the real index.html', async () => {
    const project = await loadProject(MY_VIDEO);
    expect(project.composition.width).toBe(1080);
    expect(project.composition.height).toBe(1080);
    expect(project.composition.duration).toBeCloseTo(78.21, 1);
  });

  maybeIt('discovers all five expected tracks', async () => {
    const project = await loadProject(MY_VIDEO);
    const indices = project.tracks.map((t) => t.index).sort((a, b) => a - b);
    expect(indices).toEqual([0, 1, 5, 6, 10]);
  });

  maybeIt('classifies the caption track and finds 25 caption clips', async () => {
    const project = await loadProject(MY_VIDEO);
    const captions = project.tracks.find((t) => t.index === 10);
    expect(captions?.kind).toBe('caption');
    expect(captions?.clips).toHaveLength(25);
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
