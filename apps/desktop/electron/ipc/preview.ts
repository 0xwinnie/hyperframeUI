import { ipcMain } from 'electron';
import {
  startPreview,
  type PreviewHandle,
} from '@hyperframeui/hyperframes-client';

// Per-window preview handle. We only support one preview server per app
// session in Phase 0; multi-project tabs land in Phase 3.
let active: PreviewHandle | null = null;

export type PreviewStartPayload = {
  projectPath: string;
  forceNew?: boolean;
};

export type PreviewStartResult =
  | { ok: true; url: string; projectPath: string }
  | { ok: false; error: string };

export function registerPreviewIpc(): void {
  ipcMain.handle(
    'hfui:preview:start',
    async (_event, payload: PreviewStartPayload): Promise<PreviewStartResult> => {
      console.log('[hfui] preview:start invoked', payload);
      if (active) {
        return { ok: true, url: active.url, projectPath: active.projectPath };
      }
      try {
        active = await startPreview({
          projectPath: payload.projectPath,
          forceNew: payload.forceNew ?? false,
          onLog: (line) => {
            // Mirror the CLI output to our own stdout for debugging; in P1
            // we'll surface this through the chat panel as a system message.
            process.stdout.write(`[hyperframes] ${line}`);
          },
        });
        console.log('[hfui] preview started at', active.url);
        return { ok: true, url: active.url, projectPath: active.projectPath };
      } catch (err) {
        active = null;
        console.error('[hfui] preview:start failed:', (err as Error).message);
        return { ok: false, error: (err as Error).message };
      }
    },
  );

  ipcMain.handle('hfui:preview:stop', () => {
    active?.kill();
    active = null;
    return { ok: true };
  });
}

export function stopActivePreview(): void {
  active?.kill();
  active = null;
}
