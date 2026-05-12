import path from 'node:path';
import { promises as fs, readdirSync } from 'node:fs';
import { BrowserWindow, app, dialog, ipcMain } from 'electron';
import { loadProject } from '@hyperframeui/core';
import type { ProjectState } from '@hyperframeui/core';
import { startProjectServer } from '../project-server';

export type ProjectLoadResult =
  | { ok: true; project: ProjectState }
  | { ok: false; error: string };

export type ProjectCreateResult =
  | { ok: true; path: string }
  | { ok: false; error: string }
  | { ok: false; cancelled: true };

// IPC: hfui:project:load — read + parse a project from disk.
// IPC: hfui:project:pick — open a native folder picker and return the path.
export function registerProjectIpc(): void {
  ipcMain.handle(
    'hfui:project:load',
    async (_event, rootPath: string): Promise<ProjectLoadResult> => {
      console.log('[hfui] project:load', rootPath);
      try {
        const project = await loadProject(rootPath);
        // Start the static project server eagerly so the Media tab + any
        // other consumer can produce asset URLs without waiting for the
        // player to mount. Idempotent — preview:start later will reuse it.
        await startProjectServer(rootPath);
        console.log(
          `[hfui] project loaded: ${project.tracks.length} track(s), ` +
            `${project.tracks.reduce((n, t) => n + t.clips.length, 0)} clip(s), ` +
            `duration ${project.composition.duration}s`,
        );
        return { ok: true, project };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[hfui] project:load failed:', message);
        return { ok: false, error: message };
      }
    },
  );

  ipcMain.handle('hfui:project:create', async (event): Promise<ProjectCreateResult> => {
    const owner = BrowserWindow.fromWebContents(event.sender);
    const defaultParent = path.join(app.getPath('documents'), 'HyperframeUI');
    try {
      await fs.mkdir(defaultParent, { recursive: true });
    } catch {
      // If we can't create the default parent (e.g. permission), fall back
      // to the user's home directory — they will see it in the dialog.
    }
    const defaultName = nextUntitledName(defaultParent);
    const options: Electron.SaveDialogOptions = {
      title: 'Create a new HyperframeUI project',
      defaultPath: path.join(defaultParent, defaultName),
      buttonLabel: 'Create project',
      properties: ['createDirectory', 'showOverwriteConfirmation'],
    };
    const result = await (owner
      ? dialog.showSaveDialog(owner, options)
      : dialog.showSaveDialog(options));
    if (result.canceled || !result.filePath) {
      return { ok: false, cancelled: true };
    }
    const target = result.filePath;
    try {
      await fs.mkdir(target, { recursive: true });
    } catch (err) {
      return {
        ok: false,
        error: `Failed to create project folder: ${(err as Error).message}`,
      };
    }
    return { ok: true, path: target };
  });

  ipcMain.handle('hfui:project:pick', async (event): Promise<string | null> => {
    const owner = BrowserWindow.fromWebContents(event.sender);
    // Accept either the project folder OR its index.html. macOS supports
    // mixing openFile + openDirectory in one dialog; on other platforms
    // Electron picks whichever the user can usefully target.
    const options: Electron.OpenDialogOptions = {
      title: 'Open a Hyperframes project',
      properties: ['openFile', 'openDirectory', 'createDirectory'],
      filters: [{ name: 'Hyperframes project', extensions: ['html'] }],
      buttonLabel: 'Open project',
    };
    const result = await (owner
      ? dialog.showOpenDialog(owner, options)
      : dialog.showOpenDialog(options));
    if (result.canceled) return null;
    const picked = result.filePaths[0];
    if (!picked) return null;
    return await resolveProjectRoot(picked);
  });
}

/** Suggest a fresh folder name under the default parent dir, avoiding
 *  collisions with existing projects. */
function nextUntitledName(parentDir: string): string {
  const base = 'Untitled';
  try {
    const entries = new Set(readdirSync(parentDir));
    if (!entries.has(base)) return base;
    for (let i = 2; i < 1000; i++) {
      const candidate = `${base} ${i}`;
      if (!entries.has(candidate)) return candidate;
    }
  } catch {
    // Parent dir might not exist yet — fall through to default.
  }
  return base;
}

// Allow the user to point at either a project root (a directory) or the
// `index.html` inside one — both should land us on the project root.
async function resolveProjectRoot(picked: string): Promise<string> {
  try {
    const stat = await fs.stat(picked);
    if (stat.isFile()) return path.dirname(picked);
  } catch {
    // Fall through — loadProject will surface a clearer error.
  }
  return picked;
}
