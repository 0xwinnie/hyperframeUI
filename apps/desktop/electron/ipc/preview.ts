import { ipcMain } from 'electron';
import { startProjectServer, stopActive, type ProjectServer } from '../project-server';

let active: ProjectServer | null = null;

export type PreviewStartPayload = {
  projectPath: string;
};

export type PreviewStartResult =
  | { ok: true; url: string; projectPath: string }
  | { ok: false; error: string };

// IPC: hfui:preview:start
//   Spawns a per-project static file server scoped to the project root and
//   returns its base URL. @hyperframes/player loads `${url}/index.html` from
//   inside its shadow-DOM iframe, with assets resolving via relative paths
//   against the same origin.
export function registerPreviewIpc(): void {
  ipcMain.handle(
    'hfui:preview:start',
    async (_event, payload: PreviewStartPayload): Promise<PreviewStartResult> => {
      console.log('[hfui] preview:start', payload);
      try {
        // If the user opened a different project, replace the running server.
        if (active && active.root !== payload.projectPath) {
          await active.close();
          active = null;
        }
        if (!active) {
          active = await startProjectServer(payload.projectPath);
        }
        return { ok: true, url: active.url, projectPath: active.root };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[hfui] preview:start failed:', message);
        return { ok: false, error: message };
      }
    },
  );

  ipcMain.handle('hfui:preview:stop', async () => {
    await stopActive();
    active = null;
    return { ok: true };
  });
}

export async function stopActivePreview(): Promise<void> {
  await stopActive();
  active = null;
}
