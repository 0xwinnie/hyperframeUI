import { create } from 'zustand';

// Chat store. Persists conversation across tab switches (Media/Audio/Chat)
// and across project switches. ChatPanel's local state was previously
// destroyed whenever the user navigated to another rail tab — moving it
// here keeps the transcript alive for as long as the app window.

export type ChatItem =
  | {
      id: string;
      kind: 'text';
      role: 'user' | 'assistant' | 'system' | 'error';
      text: string;
      /** Streaming text bubbles tag themselves with the agent's blockId so
       *  text_delta chunks can find them. Plain user / system / error
       *  messages omit this. */
      blockId?: string;
    }
  | {
      id: string;
      kind: 'thinking';
      blockId: string;
      text: string;
    }
  | {
      id: string;
      kind: 'tool';
      toolName: string;
      toolUseId: string;
      input: unknown;
      output: string | null;
      isError: boolean;
    };

interface ChatStore {
  messages: ChatItem[];
  busy: boolean;
  /** Project root the last "Project opened" notice was emitted for. Used
   *  to detect changes from the App-level effect without re-emitting on
   *  every render. */
  lastProjectRoot: string | null;
  send(prompt: string, projectRoot: string | null): Promise<void>;
  noticeProjectChange(projectRoot: string | null): Promise<void>;
  reset(): void;
  /** Append-only helpers used by `send` so internal logic stays terse. */
  pushText(role: 'user' | 'assistant' | 'system' | 'error', text: string): void;
  applyChunk(chunk: AgentChunk): void;
}

let nextId = 1;
const newId = (): string => `m${nextId++}`;

const BOOT_MESSAGE: ChatItem = {
  id: 'boot',
  kind: 'text',
  role: 'system',
  text: 'Connected to local Claude session.',
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [BOOT_MESSAGE],
  busy: false,
  lastProjectRoot: null,

  pushText(role, text) {
    set((state) => ({
      messages: [...state.messages, { id: newId(), kind: 'text', role, text }],
    }));
  },

  applyChunk(chunk) {
    set((state) => ({ messages: reduceChunk(state.messages, chunk) }));
  },

  async send(prompt, projectRoot) {
    if (get().busy) return;
    if (!window.hs?.agent) {
      get().pushText('error', 'Agent bridge not available');
      return;
    }
    set({ busy: true });
    get().pushText('user', prompt);
    try {
      const result = await window.hs.agent.send(prompt, projectRoot, (chunk) => {
        get().applyChunk(chunk);
      });
      if (!result.ok) {
        get().pushText('error', result.error);
      }
    } catch (err) {
      get().pushText('error', err instanceof Error ? err.message : String(err));
    } finally {
      set({ busy: false });
    }
  },

  async noticeProjectChange(projectRoot) {
    // Skip if we already announced this exact project (e.g. on every render
    // App.tsx might re-trigger the effect during HMR).
    if (get().lastProjectRoot === projectRoot) return;
    set({ lastProjectRoot: projectRoot });
    await window.hs?.agent.reset();
    get().pushText(
      'system',
      projectRoot
        ? `Project opened: ${shortPath(projectRoot)}. I can read, write, and run commands here.`
        : 'No project open.',
    );
  },

  reset() {
    set({ messages: [BOOT_MESSAGE], busy: false, lastProjectRoot: null });
    void window.hs?.agent.reset();
  },
}));

function reduceChunk(current: ChatItem[], chunk: AgentChunk): ChatItem[] {
  switch (chunk.kind) {
    case 'session_init':
    case 'result':
      return current;
    case 'system':
      return [
        ...current,
        { id: newId(), kind: 'text', role: 'system', text: chunk.text },
      ];
    case 'text_start':
      return [
        ...current,
        { id: newId(), kind: 'text', role: 'assistant', text: '', blockId: chunk.blockId },
      ];
    case 'text_delta':
      return current.map((item) =>
        item.kind === 'text' && item.blockId === chunk.blockId
          ? { ...item, text: item.text + chunk.text }
          : item,
      );
    case 'thinking_start':
      return [
        ...current,
        { id: newId(), kind: 'thinking', blockId: chunk.blockId, text: '' },
      ];
    case 'thinking_delta':
      return current.map((item) =>
        item.kind === 'thinking' && item.blockId === chunk.blockId
          ? { ...item, text: item.text + chunk.text }
          : item,
      );
    case 'tool_use':
      return [
        ...current,
        {
          id: newId(),
          kind: 'tool',
          toolName: chunk.toolName,
          toolUseId: chunk.toolUseId,
          input: chunk.input,
          output: null,
          isError: false,
        },
      ];
    case 'tool_result':
      return current.map((item) =>
        item.kind === 'tool' && item.toolUseId === chunk.toolUseId
          ? { ...item, output: chunk.output, isError: chunk.isError }
          : item,
      );
    case 'error':
      return [
        ...current,
        { id: newId(), kind: 'text', role: 'error', text: chunk.message },
      ];
  }
}

function shortPath(absPath: string): string {
  const parts = absPath.split('/');
  if (parts.length <= 3) return absPath;
  return '…/' + parts.slice(-2).join('/');
}
