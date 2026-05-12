import path from 'node:path';
import { promises as fs } from 'node:fs';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { loadProject } from '@hyperframeui/core';
import type { ProjectState } from '@hyperframeui/core';

export type ProjectLoadResult =
  | { ok: true; project: ProjectState }
  | { ok: false; error: string };

// IPC: hfui:project:load — read + parse a project from disk.
// IPC: hfui:project:pick — open a native folder picker and return the path.
export function registerProjectIpc(): void {
  ipcMain.handle(
    'hfui:project:load',
    async (_event, rootPath: string): Promise<ProjectLoadResult> => {
      console.log('[hfui] project:load', rootPath);
      try {
        const project = await loadProject(rootPath);
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
