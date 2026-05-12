import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';

// Public chunk types — keep stable; the renderer and IPC contract depend on
// these shape names.
export type AgentChunk =
  | { kind: 'session_init'; sessionId: string }
  | { kind: 'text'; role: 'assistant' | 'user' | 'system'; text: string }
  | { kind: 'tool_use'; toolName: string; input: unknown; toolUseId: string }
  | { kind: 'tool_result'; toolUseId: string; output: string; isError: boolean }
  | { kind: 'result'; text?: string; sessionId: string }
  | { kind: 'error'; message: string };

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
}

export interface AgentSession {
  /** Send a prompt; yields fine-grained chunks for the chat UI. */
  send(prompt: string): AsyncIterable<AgentChunk>;
  /** Drop the resume sessionId so the next send starts fresh. */
  reset(): void;
}

export interface StartAgentSessionOptions {
  /** Absolute path to the active project. Sets the agent's cwd so it sees
   *  the project's CLAUDE.md, skills, and runs Bash inside the project. */
  projectRoot: string | null;
}

const ALLOWED_TOOLS = [
  'Read',
  'Write',
  'Edit',
  'Bash',
  'Glob',
  'Grep',
  'AskUserQuestion',
];

const HFUI_SYSTEM_PROMPT = `\
You are running inside HyperframeUI, a desktop workbench for Hyperframes video projects. The user is editing this project in a graphical UI alongside you — they can see a player, a timeline of clips, and the media library while you work.

- Always work inside the current project directory (your cwd). Read the project's CLAUDE.md first if you have not already; it documents the Hyperframes conventions for this project.
- For composing or modifying video: prefer the Hyperframes CLI via Bash ('npx hyperframes <command>' — init, transcribe, lint, validate, render, etc.) over hand-rolling scripts.
- For timeline edits to an existing composition: use the Edit tool on the relevant HTML file (index.html or compositions/*.html). Each clip's timing is encoded in data-start / data-duration / data-track-index attributes. Captions also carry their visible text as innerHTML.
- The UI re-parses changed files automatically. After a successful edit, simply mention what you changed — the user will see the player + timeline update.
- Keep responses concise. The user is watching the chat panel; they don't need a long preamble before each tool call.`;

export function startAgentSession(opts: StartAgentSessionOptions = { projectRoot: null }): AgentSession {
  const claudeBinary = resolveLocalClaudeBinary();
  let resumeSessionId: string | null = null;

  return {
    async *send(prompt: string) {
      const options: Options = {
        allowedTools: ALLOWED_TOOLS,
        permissionMode: 'acceptEdits',
        systemPrompt: { type: 'preset', preset: 'claude_code', append: HFUI_SYSTEM_PROMPT },
      };
      if (claudeBinary) options.pathToClaudeCodeExecutable = claudeBinary;
      if (opts.projectRoot) options.cwd = opts.projectRoot;
      if (resumeSessionId) options.resume = resumeSessionId;

      try {
        for await (const message of query({ prompt, options })) {
          for (const chunk of translateMessage(message)) {
            if (chunk.kind === 'session_init') resumeSessionId = chunk.sessionId;
            if (chunk.kind === 'result') resumeSessionId = chunk.sessionId;
            yield chunk;
          }
        }
      } catch (err) {
        yield { kind: 'error', message: err instanceof Error ? err.message : String(err) };
      }
    },
    reset() {
      resumeSessionId = null;
    },
  };
}

/**
 * Translate a single SDK message into zero or more renderer-facing chunks.
 * We unfold the inner `content` array of assistant + user messages so each
 * text / tool_use / tool_result block becomes its own chunk for streaming
 * display.
 */
function translateMessage(message: SDKMessage): AgentChunk[] {
  if (message.type === 'system' && message.subtype === 'init') {
    return [{ kind: 'session_init', sessionId: message.session_id }];
  }

  if (message.type === 'assistant') {
    const out: AgentChunk[] = [];
    const content = (message.message as { content?: unknown }).content;
    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as { type?: string; text?: string; id?: string; name?: string; input?: unknown };
        if (b.type === 'text' && typeof b.text === 'string') {
          out.push({ kind: 'text', role: 'assistant', text: b.text });
        } else if (b.type === 'tool_use' && typeof b.id === 'string' && typeof b.name === 'string') {
          out.push({ kind: 'tool_use', toolUseId: b.id, toolName: b.name, input: b.input ?? {} });
        }
      }
    }
    if (message.error) {
      out.push({ kind: 'error', message: `Agent error: ${message.error}` });
    }
    return out;
  }

  if (message.type === 'user') {
    const out: AgentChunk[] = [];
    const content = (message.message as { content?: unknown }).content;
    if (Array.isArray(content)) {
      for (const block of content) {
        const b = block as { type?: string; tool_use_id?: string; content?: unknown; is_error?: boolean };
        if (b.type === 'tool_result' && typeof b.tool_use_id === 'string') {
          out.push({
            kind: 'tool_result',
            toolUseId: b.tool_use_id,
            output: stringifyToolOutput(b.content),
            isError: Boolean(b.is_error),
          });
        }
      }
    }
    return out;
  }

  if (message.type === 'result') {
    const m = message as { result?: string; session_id: string; is_error?: boolean; subtype?: string };
    if (m.is_error || m.subtype === 'error_max_turns' || m.subtype === 'error_during_execution') {
      return [{
        kind: 'error',
        message: m.result ?? `Agent run ended with error (${m.subtype ?? 'unknown'})`,
      }];
    }
    return [{ kind: 'result', sessionId: m.session_id, text: m.result }];
  }

  return [];
}

function stringifyToolOutput(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        const p = part as { type?: string; text?: string };
        if (p.type === 'text' && typeof p.text === 'string') return p.text;
        return JSON.stringify(part);
      })
      .join('\n');
  }
  if (content == null) return '';
  return JSON.stringify(content);
}

function resolveLocalClaudeBinary(): string | undefined {
  try {
    const found = execSync('command -v claude', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return found && existsSync(found) ? found : undefined;
  } catch {
    return undefined;
  }
}
