import { ipcMain } from 'electron';
import { applyOp, type Op, type OpResult } from '@hyperframeui/core';

// IPC: hfui:ops:apply
//   args:  (projectRoot: string, op: Op)
//   resolves: OpResult — { ok, mutatedFiles, affectedClipIds, error? }.
// Mirrors core's applyOp() so the renderer can dispatch typed mutations
// without bundling fs / chokidar logic into the React tree.

export function registerOpsIpc(): void {
  ipcMain.handle(
    'hfui:ops:apply',
    async (_event, projectRoot: string, op: Op): Promise<OpResult> => {
      console.log('[hfui] ops:apply', op.type, op);
      const result = await applyOp(projectRoot, op);
      if (!result.ok) {
        console.error('[hfui] ops:apply error:', result.error);
      }
      return result;
    },
  );
}
