import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyOp, atomicWrite } from '../src/reducer.js';

// Integration tests for the file-system-touching half of the reducer. The
// pure transforms are covered by ops.test.ts; here we focus on:
//   - atomic tmp+rename writes,
//   - the OpResult contract (ok flag, mutated files, affected clip ids),
//   - error containment (no partial writes when an op throws).

const FIXTURE_HTML = `<!doctype html>
<html><body>
  <div id="cap-00" class="caption clip" data-start="0.000" data-duration="1.980" data-track-index="10">hello</div>
  <div id="cap-01" class="caption clip" data-start="2.000" data-duration="3.000" data-track-index="10">world</div>
</body></html>
`;

describe('applyOp() file effects', () => {
  let projectRoot = '';

  beforeEach(async () => {
    projectRoot = await mkdtemp(path.join(tmpdir(), 'hfui-reducer-'));
    await writeFile(path.join(projectRoot, 'index.html'), FIXTURE_HTML, 'utf8');
  });

  afterEach(async () => {
    await rm(projectRoot, { recursive: true, force: true });
  });

  it('writes the mutated file and reports the right paths + clip ids', async () => {
    const result = await applyOp(projectRoot, {
      type: 'trim_clip',
      clipId: 'cap-00',
      start: 0.0,
      duration: 1.0,
    });
    expect(result.ok).toBe(true);
    expect(result.mutatedFiles).toEqual(['index.html']);
    expect(result.affectedClipIds).toEqual(['cap-00']);

    const updated = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
    expect(updated).toMatch(/id="cap-00"[^>]*data-duration="1\.000"/);
  });

  it('skips file write when the op is a no-op transform', async () => {
    // update_caption_text with the existing text reproduces the same bytes.
    const result = await applyOp(projectRoot, {
      type: 'update_caption_text',
      captionId: 'cap-00',
      text: 'hello',
    });
    expect(result.ok).toBe(true);
    expect(result.mutatedFiles).toEqual([]);
  });

  it('returns ok:false with the underlying error when the op throws', async () => {
    const result = await applyOp(projectRoot, {
      type: 'trim_clip',
      clipId: 'ghost',
      start: 0,
      duration: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/not found/);
    const file = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
    expect(file).toBe(FIXTURE_HTML);
  });

  it('leaves no .tmp shrapnel behind on success', async () => {
    await applyOp(projectRoot, {
      type: 'delete_clip',
      clipId: 'cap-01',
    });
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(projectRoot);
    expect(entries.filter((e) => e.endsWith('.tmp'))).toEqual([]);
  });
});

describe('atomicWrite', () => {
  let dir = '';
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'hfui-atomic-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('replaces an existing file', async () => {
    const target = path.join(dir, 'a.txt');
    await writeFile(target, 'old', 'utf8');
    await atomicWrite(target, 'new');
    expect(await readFile(target, 'utf8')).toBe('new');
  });

  it('creates a new file when the target does not exist', async () => {
    const target = path.join(dir, 'created.txt');
    await atomicWrite(target, 'hello');
    expect(await readFile(target, 'utf8')).toBe('hello');
  });
});
