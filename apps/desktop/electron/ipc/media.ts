import { promises as fs } from 'node:fs';
import path from 'node:path';
import { BrowserWindow, dialog, ipcMain, shell, type WebContents } from 'electron';
import chokidar, { type FSWatcher } from 'chokidar';
import { scanProjectMedia, type MediaFile } from '../media-scanner';

interface ActiveWatcher {
  root: string;
  watcher: FSWatcher;
  // We coalesce filesystem events: every change schedules a single rescan
  // on the next tick rather than spamming the renderer per byte.
  rescanTimer: NodeJS.Timeout | null;
}

let activeWatcher: ActiveWatcher | null = null;
let listenerWebContents: WebContents | null = null;

export interface MediaListResult {
  files: MediaFile[];
  baseUrl: string | null;
}

export type MediaImportResult =
  | { ok: true; imported: string[] }
  | { ok: false; error: string }
  | { ok: false; cancelled: true };

export type MediaRemoveResult = { ok: true } | { ok: false; error: string };

export function registerMediaIpc(getServerUrl: () => string | null): void {
  ipcMain.handle('hfui:media:list', async (_event, rootPath: string): Promise<MediaListResult> => {
    const files = await scanProjectMedia(rootPath);
    return { files, baseUrl: getServerUrl() };
  });

  ipcMain.handle('hfui:media:watch', async (event, rootPath: string) => {
    listenerWebContents = event.sender;
    await ensureWatcher(rootPath);
    return { ok: true };
  });

  ipcMain.handle('hfui:media:unwatch', async () => {
    await stopWatcher();
    return { ok: true };
  });

  ipcMain.handle(
    'hfui:media:import',
    async (event, rootPath: string): Promise<MediaImportResult> => {
      const owner = BrowserWindow.fromWebContents(event.sender);
      const options: Electron.OpenDialogOptions = {
        title: 'Import media into project',
        properties: ['openFile', 'multiSelections'],
        buttonLabel: 'Import',
        filters: [
          { name: 'Media', extensions: ['mp4', 'mov', 'webm', 'mkv', 'm4v', 'avi', 'mp3', 'm4a', 'wav', 'aac', 'ogg', 'opus', 'flac', 'jpg', 'jpeg', 'png', 'webp', 'gif'] },
        ],
      };
      const result = await (owner
        ? dialog.showOpenDialog(owner, options)
        : dialog.showOpenDialog(options));
      if (result.canceled || result.filePaths.length === 0) {
        return { ok: false, cancelled: true };
      }
      try {
        const imported: string[] = [];
        for (const src of result.filePaths) {
          const dst = path.join(rootPath, path.basename(src));
          await copyWithCollisionResolution(src, dst);
          imported.push(path.basename(dst));
        }
        return { ok: true, imported };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle(
    'hfui:media:remove',
    async (_event, rootPath: string, relativePath: string): Promise<MediaRemoveResult> => {
      const safeRoot = path.resolve(rootPath);
      const target = path.resolve(safeRoot, relativePath);
      if (!target.startsWith(safeRoot + path.sep)) {
        return { ok: false, error: 'Refused: target is outside the project root' };
      }
      try {
        await shell.trashItem(target);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: (err as Error).message };
      }
    },
  );
}

export async function stopMediaWatcher(): Promise<void> {
  await stopWatcher();
}

async function ensureWatcher(rootPath: string): Promise<void> {
  if (activeWatcher && activeWatcher.root === rootPath) return;
  await stopWatcher();

  const watcher = chokidar.watch(rootPath, {
    ignored: [
      /(^|[\\/])\../, // hidden files & dirs
      /(^|[\\/])(renders|compositions|analysis|models|node_modules)([\\/]|$)/,
    ],
    ignoreInitial: true,
    persistent: true,
    depth: 4,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  });

  const state: ActiveWatcher = { root: rootPath, watcher, rescanTimer: null };
  activeWatcher = state;

  const onAnyChange = (): void => {
    if (state.rescanTimer) return;
    state.rescanTimer = setTimeout(() => {
      state.rescanTimer = null;
      void scanProjectMedia(state.root).then((files) => {
        if (listenerWebContents && !listenerWebContents.isDestroyed()) {
          listenerWebContents.send('hfui:media:changed', { files });
        }
      });
    }, 120);
  };

  watcher.on('add', onAnyChange);
  watcher.on('unlink', onAnyChange);
  watcher.on('change', onAnyChange);
  watcher.on('addDir', onAnyChange);
  watcher.on('unlinkDir', onAnyChange);
}

async function stopWatcher(): Promise<void> {
  if (!activeWatcher) return;
  const { watcher, rescanTimer } = activeWatcher;
  activeWatcher = null;
  if (rescanTimer) clearTimeout(rescanTimer);
  await watcher.close();
}

/**
 * Copy a source file into the project, appending " (2)", " (3)", … to the
 * basename if a file with the same name already exists. We never silently
 * overwrite — the user's existing clips are sacred.
 */
async function copyWithCollisionResolution(src: string, dst: string): Promise<void> {
  let target = dst;
  const ext = path.extname(dst);
  const stem = dst.slice(0, dst.length - ext.length);
  let i = 2;
  while (await fileExists(target)) {
    target = `${stem} (${i})${ext}`;
    i++;
    if (i > 999) {
      throw new Error('Too many naming collisions when importing media');
    }
  }
  await fs.copyFile(src, target);
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}
