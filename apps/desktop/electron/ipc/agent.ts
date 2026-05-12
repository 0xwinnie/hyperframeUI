import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import { startAgentSession, type AgentMessage } from '@hyperframeui/agent';

export type AgentSendResult =
  | { ok: true; messageCount: number }
  | { ok: false; error: string };

// IPC: hfui:agent:send
//   args:  (prompt: string, requestId: string)
//   stream events: webContents.send('hfui:agent:chunk', requestId, message)
//   resolves: AgentSendResult once the agent completes.
export function registerAgentIpc(): void {
  ipcMain.handle(
    'hfui:agent:send',
    async (
      event: IpcMainInvokeEvent,
      prompt: string,
      requestId: string,
    ): Promise<AgentSendResult> => {
      console.log('[hfui] agent:send', { requestId, promptPreview: prompt.slice(0, 60) });
      try {
        const session = startAgentSession();
        let count = 0;
        for await (const message of session.send(prompt)) {
          count++;
          forward(event, requestId, message);
        }
        return { ok: true, messageCount: count };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[hfui] agent:send failed:', message);
        return { ok: false, error: message };
      }
    },
  );
}

function forward(
  event: IpcMainInvokeEvent,
  requestId: string,
  message: AgentMessage,
): void {
  if (event.sender.isDestroyed()) return;
  event.sender.send('hfui:agent:chunk', requestId, message);
}
