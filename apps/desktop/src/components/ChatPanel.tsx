import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ChevronDown, ChevronRight } from '../icons';
import { useChatStore, type ChatItem } from '../store/chat';
import { useProjectStore } from '../store/project';

// ChatPanel is a stateless renderer over useChatStore. Mount/unmount as
// the user navigates rail tabs no longer wipes the transcript.

const SUBTITLE_DEFAULT = 'sonnet · local session';
const PLACEHOLDER = 'Ask Claude to edit, analyze, or describe…';

export function ChatPanel(): JSX.Element {
  const projectStatus = useProjectStore((s) => s.status);
  const projectRoot = projectStatus.kind === 'ready' ? projectStatus.project.root : null;
  const subtitle = projectRoot ? `sonnet · cwd=${shortPath(projectRoot)}` : SUBTITLE_DEFAULT;

  const messages = useChatStore((s) => s.messages);
  const busy = useChatStore((s) => s.busy);
  const send = useChatStore((s) => s.send);

  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = async (): Promise<void> => {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    setDraft('');
    await send(prompt, projectRoot);
  };

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
      <button type="button" className="tool-card__head" onClick={() => setOpen((v) => !v)}>
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
          <pre className="tool-card__pre mono">{JSON.stringify(item.input, null, 2)}</pre>
          {item.output !== null && (
            <pre className={`tool-card__pre mono${item.isError ? ' is-error' : ''}`}>{item.output}</pre>
          )}
        </div>
      )}
    </div>
  );
}

function summariseToolInput(toolName: string, input: unknown): string {
  if (!input || typeof input !== 'object') return '';
  const obj = input as Record<string, unknown>;
  if (toolName === 'Bash' && typeof obj['command'] === 'string') return obj['command'] as string;
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
