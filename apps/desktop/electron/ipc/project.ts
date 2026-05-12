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
    const result = await (owner
      ? dialog.showOpenDialog(owner, {
          title: 'Open a Hyperframes project',
          properties: ['openDirectory', 'createDirectory'],
          buttonLabel: 'Open project',
        })
      : dialog.showOpenDialog({
          title: 'Open a Hyperframes project',
          properties: ['openDirectory', 'createDirectory'],
          buttonLabel: 'Open project',
        }));
    if (result.canceled) return null;
    return result.filePaths[0] ?? null;
  });
}
