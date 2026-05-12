import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown, ChevronRight } from '../icons';
import { useProjectStore } from '../store/project';

// Phase-1.6a chat panel. Wires the textarea to the Agent SDK (built-in
// tools enabled, cwd = project root) and renders a richer message stream:
// user / assistant text bubbles plus collapsible tool-use cards that
// fill in their output when the corresponding tool_result arrives.

type ChatItem =
  | { id: string; kind: 'text'; role: 'user' | 'assistant' | 'system' | 'error'; text: string }
  | {
      id: string;
      kind: 'tool';
      toolName: string;
      toolUseId: string;
      input: unknown;
      output: string | null;
      isError: boolean;
    };

const SUBTITLE_DEFAULT = 'sonnet · local session';
const PLACEHOLDER = 'Ask Claude to edit, analyze, or describe…';

let nextId = 1;
const newId = (): string => `m${nextId++}`;

export function ChatPanel(): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);
  const projectRoot = projectStatus.kind === 'ready' ? projectStatus.project.root : null;
  const subtitle = projectRoot
    ? `sonnet · cwd=${shortPath(projectRoot)}`
    : SUBTITLE_DEFAULT;

  const [messages, setMessages] = useState<ChatItem[]>(() => [
    { id: 'boot', kind: 'text', role: 'system', text: 'Connected to local Claude session.' },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Reset session whenever the active project changes — the agent's cwd
  // and CLAUDE.md depend on the project, so it would be unsafe to keep
  // the previous turn's resume id.
  useEffect(() => {
    void window.hs?.agent.reset();
    setMessages((current) => [
      ...current,
      {
        id: newId(),
        kind: 'text',
        role: 'system',
        text: projectRoot
          ? `Project opened: ${shortPath(projectRoot)}. I can read, write, and run commands here.`
          : 'No project open.',
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectRoot]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = useCallback(async () => {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    if (!window.hs?.agent) {
      setMessages((m) => [
        ...m,
        { id: newId(), kind: 'text', role: 'error', text: 'Agent bridge not available' },
      ]);
      return;
    }

    const userMsg: ChatItem = { id: newId(), kind: 'text', role: 'user', text: prompt };
    setMessages((m) => [...m, userMsg]);
    setDraft('');
    setBusy(true);

    try {
      const result = await window.hs.agent.send(prompt, projectRoot, (chunk) => {
        setMessages((current) => applyChunk(current, chunk));
      });
      if (!result.ok) {
        setMessages((m) => [
          ...m,
          { id: newId(), kind: 'text', role: 'error', text: result.error },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          kind: 'text',
          role: 'error',
          text: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, [draft, busy, projectRoot]);

  const onSubmit = (e: FormEvent): void => {
    e.preventDefault();
    void submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="chat">
      <header className="chat__header">
        <div className="chat__avatar" aria-hidden />
        <div className="chat__heading">
          <div className="chat__name">Claude</div>
          <div className="chat__subtitle mono">{subtitle}</div>
        </div>
      </header>

      <div className="chat__list" ref={listRef}>
        {messages.map((m) => (
          <Item key={m.id} item={m} />
        ))}
        {busy && (
          <div className="chat__typing" aria-label="Claude is thinking">
            <span className="chat__dot" />
            <span className="chat__dot" />
            <span className="chat__dot" />
          </div>
        )}
      </div>

      <form className="chat__composer" onSubmit={onSubmit}>
        <textarea
          className="chat__textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={PLACEHOLDER}
          rows={3}
          disabled={busy}
        />
        <div className="chat__composer-row">
          <span className="chat__hint mono">⌘↩ to send</span>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={busy || !draft.trim()}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function applyChunk(current: ChatItem[], chunk: AgentChunk): ChatItem[] {
  switch (chunk.kind) {
    case 'session_init':
    case 'result':
      // Session bookkeeping doesn't render directly; the IPC layer captures
      // the id for resume.
      return current;
    case 'text':
      if (chunk.role === 'system') {
        return [...current, { id: newId(), kind: 'text', role: 'system', text: chunk.text }];
      }
      // Append assistant text as its own bubble; future polish could
      // merge consecutive text chunks into one bubble.
      return [
        ...current,
        { id: newId(), kind: 'text', role: chunk.role === 'assistant' ? 'assistant' : 'system', text: chunk.text },
      ];
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

function Item({ item }: { item: ChatItem }): JSX.Element {
  if (item.kind === 'text') {
    const cls = `chat__msg chat__msg--${item.role}`;
    return (
      <div className={cls}>
        <div className="chat__msg-body">{item.text || (item.role === 'assistant' ? '…' : '')}</div>
      </div>
    );
  }
  return <ToolCard item={item} />;
}

function ToolCard({
  item,
}: {
  item: Extract<ChatItem, { kind: 'tool' }>;
}): JSX.Element {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => summariseToolInput(item.toolName, item.input), [item.toolName, item.input]);

  return (
    <div className={`tool-card${item.isError ? ' tool-card--error' : ''}`}>
      <button
        type="button"
        className="tool-card__head"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <span className="tool-card__name mono">{item.toolName}</span>
        <span className="tool-card__summary mono truncate">{summary}</span>
        {item.output === null && <span className="tool-card__pending mono">running…</span>}
        {item.output !== null && (
          <span className={`tool-card__status mono${item.isError ? ' is-error' : ''}`}>
            {item.isError ? 'error' : 'done'}
          </span>
        )}
      </button>
      {open && (
        <div className="tool-card__body">
          <pre className="tool-card__pre mono">
{JSON.stringify(item.input, null, 2)}
          </pre>
          {item.output !== null && (
            <pre className={`tool-card__pre mono${item.isError ? ' is-error' : ''}`}>
{item.output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function summariseToolInput(toolName: string, input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const obj = input as Record<string, unknown>;
  if (toolName === 'Bash' && typeof obj['command'] === 'string') {
    return obj['command'] as string;
  }
  if (toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') {
    if (typeof obj['file_path'] === 'string') return obj['file_path'] as string;
  }
  if (toolName === 'Glob' && typeof obj['pattern'] === 'string') return obj['pattern'] as string;
  if (toolName === 'Grep' && typeof obj['pattern'] === 'string') return obj['pattern'] as string;
  return JSON.stringify(obj);
}

function shortPath(absPath: string): string {
  const parts = absPath.split('/');
  if (parts.length <= 3) return absPath;
  return '…/' + parts.slice(-2).join('/');
}
