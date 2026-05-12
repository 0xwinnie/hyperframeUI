import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import { type WebContents } from 'electron';

// Watches the project's composition files (index.html + compositions/*.html)
// and pushes coalesced change notifications to the renderer. The renderer
// reacts by re-running the project loader, which updates the parsed
// ProjectState + bumps the revision counter so dependent surfaces
// (player, timeline) re-fetch.

interface ActiveWatcher {
  root: string;
  watcher: FSWatcher;
  rescanTimer: NodeJS.Timeout | null;
}

let active: ActiveWatcher | null = null;
let listener: WebContents | null = null;

export function setCompositionListener(target: WebContents | null): void {
  listener = target;
}

export async function startCompositionWatcher(root: string): Promise<void> {
  if (active && active.root === root) return;
  await stopCompositionWatcher();

  const indexPath = path.join(root, 'index.html');
  const compositionsDir = path.join(root, 'compositions');

  const watcher = chokidar.watch([indexPath, compositionsDir], {
    ignoreInitial: true,
    persistent: true,
    depth: 4,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 80,
    },
  });

  const state: ActiveWatcher = { root, watcher, rescanTimer: null };
  active = state;

  const trigger = (): void => {
    if (state.rescanTimer) return;
    state.rescanTimer = setTimeout(() => {
      state.rescanTimer = null;
      if (listener && !listener.isDestroyed()) {
        listener.send('hfui:project:compositionChanged');
      }
    }, 120);
  };

  watcher.on('add', trigger);
  watcher.on('change', trigger);
  watcher.on('unlink', trigger);
  watcher.on('addDir', trigger);
  watcher.on('unlinkDir', trigger);
}

export async function stopCompositionWatcher(): Promise<void> {
  if (!active) return;
  const { watcher, rescanTimer } = active;
  active = null;
  if (rescanTimer) clearTimeout(rescanTimer);
  await watcher.close();
}
