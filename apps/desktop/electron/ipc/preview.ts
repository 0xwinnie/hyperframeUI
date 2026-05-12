import { ipcMain } from 'electron';
import {
  readCompositionForEmbed,
  startProjectServer,
  stopActive,
  type ProjectServer,
} from '../project-server';

let active: ProjectServer | null = null;

/** Internal accessor used by other IPC modules (e.g. media) that want to
 *  produce asset URLs without bouncing through the renderer. */
export function getActiveServerUrl(): string | null {
  return active?.url ?? null;
}

export type PreviewStartPayload = {
  projectPath: string;
};

export type PreviewStartResult =
  | { ok: true; url: string; projectPath: string; compositionHtml: string | null }
  | { ok: false; error: string };

// IPC: hfui:preview:start
//   Spawns a per-project static file server scoped to the project root and
//   returns:
//     - url: base URL of the static server (assets resolve here)
//     - compositionHtml: index.html prepared for srcdoc embedding (base href
//       inserted so relative URLs resolve against `url`, runtime script
//       injected so @hyperframes/player's polling can talk to the timeline).
//       Null when the project has no index.html yet — the renderer shows
//       the empty-project onboarding panel instead of mounting the player.
export function registerPreviewIpc(): void {
  ipcMain.handle(
    'hfui:preview:start',
    async (_event, payload: PreviewStartPayload): Promise<PreviewStartResult> => {
      console.log('[hfui] preview:start', payload);
      try {
        if (active && active.root !== payload.projectPath) {
          await active.close();
          active = null;
        }
        if (!active) {
          active = await startProjectServer(payload.projectPath);
        }
        const composition = readCompositionForEmbed();
        return {
          ok: true,
          url: active.url,
          projectPath: active.root,
          compositionHtml: composition?.html ?? null,
        };
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
