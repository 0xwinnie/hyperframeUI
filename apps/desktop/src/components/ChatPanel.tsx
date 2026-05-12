import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

// Phase 0 chat panel. Wires the textarea composer to the Agent SDK via the
// preload bridge and streams the assistant's reply into the message list.
// Tool-call cards, context chips, and the "Review video" CTA in the design
// handoff arrive once the tool surface lands in P1.

interface ChatMessage {
  id: string;
  role: AgentRole | 'error';
  text: string;
}

const SUBTITLE = 'sonnet · local session';
const PLACEHOLDER = 'Ask Claude to edit, analyze, or describe…';

let nextId = 1;

export function ChatPanel(): JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'boot', role: 'system', text: 'Connected to local Claude session.' },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = useCallback(async () => {
    const prompt = draft.trim();
    if (!prompt || busy) return;
    if (!window.hs?.agent) {
      setMessages((m) => [
        ...m,
        { id: `err-${nextId++}`, role: 'error', text: 'Agent bridge not available' },
      ]);
      return;
    }

    const userMsg: ChatMessage = { id: `u-${nextId++}`, role: 'user', text: prompt };
    const pendingId = `a-${nextId++}`;
    setMessages((m) => [...m, userMsg, { id: pendingId, role: 'assistant', text: '' }]);
    setDraft('');
    setBusy(true);

    try {
      const result = await window.hs.agent.send(prompt, (chunk) => {
        setMessages((current) =>
          current.map((m) =>
            m.id === pendingId
              ? {
                  ...m,
                  role: chunk.role,
                  text: m.text + (m.text ? '\n' : '') + chunk.text,
                }
              : m,
          ),
        );
      });
      if (!result.ok) {
        setMessages((m) => [
          ...m,
          { id: `err-${nextId++}`, role: 'error', text: result.error },
        ]);
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `err-${nextId++}`,
          role: 'error',
          text: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, [draft, busy]);

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
          <div className="chat__subtitle mono">{SUBTITLE}</div>
        </div>
      </header>

      <div className="chat__list" ref={listRef}>
        {messages.map((m) => (
          <Message key={m.id} message={m} />
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

function Message({ message }: { message: ChatMessage }): JSX.Element {
  const className = `chat__msg chat__msg--${message.role}`;
  return (
    <div className={className}>
      <div className="chat__msg-body">{message.text || (message.role === 'assistant' ? '…' : '')}</div>
    </div>
  );
}
