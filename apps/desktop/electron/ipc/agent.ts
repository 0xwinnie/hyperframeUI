import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import {
  startAgentSession,
  type AgentChunk,
  type AgentSession,
} from '@hyperframeui/agent';

export type AgentSendResult =
  | { ok: true; chunkCount: number }
  | { ok: false; error: string };

// Per-app singleton agent session. We rebuild it whenever the active
// project changes so cwd, system prompt, and the resume session id reset
// cleanly. Future: per-window sessions if we ever support multiple
// windows / projects in parallel.
let session: AgentSession | null = null;
let sessionProjectRoot: string | null | undefined = undefined;

function ensureSession(projectRoot: string | null): AgentSession {
  if (session && sessionProjectRoot === projectRoot) return session;
  session = startAgentSession({ projectRoot });
  sessionProjectRoot = projectRoot;
  return session;
}

export function registerAgentIpc(): void {
  ipcMain.handle(
    'hfui:agent:send',
    async (
      event: IpcMainInvokeEvent,
      prompt: string,
      requestId: string,
      projectRoot: string | null,
    ): Promise<AgentSendResult> => {
      console.log('[hfui] agent:send', {
        requestId,
        promptPreview: prompt.slice(0, 80),
        projectRoot,
      });
      try {
        const active = ensureSession(projectRoot);
        let count = 0;
        for await (const chunk of active.send(prompt)) {
          count++;
          forwardChunk(event, requestId, chunk);
        }
        return { ok: true, chunkCount: count };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[hfui] agent:send failed:', message);
        return { ok: false, error: message };
      }
    },
  );

  ipcMain.handle('hfui:agent:reset', async () => {
    session?.reset();
    return { ok: true };
  });
}

function forwardChunk(event: IpcMainInvokeEvent, requestId: string, chunk: AgentChunk): void {
  if (event.sender.isDestroyed()) return;
  event.sender.send('hfui:agent:chunk', requestId, chunk);
}
