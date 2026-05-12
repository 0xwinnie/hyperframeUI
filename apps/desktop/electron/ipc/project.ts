import { ipcMain } from 'electron';
import { loadProject } from '@hyperframeui/core';
import type { ProjectState } from '@hyperframeui/core';

export type ProjectLoadResult =
  | { ok: true; project: ProjectState }
  | { ok: false; error: string };

// IPC: hfui:project:load
//   args:  (rootPath: string)
//   resolves: ProjectLoadResult — a full ProjectState on success.
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
}
