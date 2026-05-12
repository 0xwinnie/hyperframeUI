import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { query, type Options, type SDKMessage } from '@anthropic-ai/claude-agent-sdk';

// Fine-grained chunk types streamed to the chat UI.
//   - text / thinking blocks arrive as start + delta pairs so the renderer
//     can show Claude's response building up word-by-word.
//   - tool_use is emitted once from the final assistant message (we already
//     have the complete input by then; streaming partial JSON deltas adds
//     noise without UX value).
//   - tool_result + error + system + session_init/result round it out.
export type AgentChunk =
  | { kind: 'session_init'; sessionId: string }
  | { kind: 'text_start'; blockId: string }
  | { kind: 'text_delta'; blockId: string; text: string }
  | { kind: 'thinking_start'; blockId: string }
  | { kind: 'thinking_delta'; blockId: string; text: string }
  | { kind: 'tool_use'; toolName: string; input: unknown; toolUseId: string }
  | { kind: 'tool_result'; toolUseId: string; output: string; isError: boolean }
  | { kind: 'system'; text: string }
  | { kind: 'result'; text?: string; sessionId: string }
  | { kind: 'error'; message: string };

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
}

export interface AgentSession {
  send(prompt: string): AsyncIterable<AgentChunk>;
  reset(): void;
}

export interface StartAgentSessionOptions {
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

Guidelines:
- Always work inside the current project directory (your cwd). Read the project's CLAUDE.md first if you have not already; it documents the Hyperframes conventions for this project.
- **Make your work visible.** When a request requires looking at files (composition structure, available media, transcripts), call Read / Glob / Bash up front rather than guessing — the user sees a card for each tool call and benefits from following along.
- For composing or modifying video: prefer the Hyperframes CLI via Bash ('npx hyperframes <command>' — init, transcribe, lint, validate, render, etc.) over hand-rolling scripts.
- For timeline edits to an existing composition: use the Edit tool on the relevant HTML file (index.html or compositions/*.html). Each clip's timing is encoded in data-start / data-duration / data-track-index attributes. Captions also carry their visible text as innerHTML.
- After a successful change, briefly mention what you did — the player + timeline + media panel re-parse automatically.
- Keep responses concise. The user is watching the chat panel; don't write a long preamble before each tool call.`;

export function startAgentSession(opts: StartAgentSessionOptions = { projectRoot: null }): AgentSession {
  const claudeBinary = resolveLocalClaudeBinary();
  let resumeSessionId: string | null = null;

  return {
    async *send(prompt: string) {
      const options: Options = {
        allowedTools: ALLOWED_TOOLS,
        permissionMode: 'acceptEdits',
        systemPrompt: { type: 'preset', preset: 'claude_code', append: HFUI_SYSTEM_PROMPT },
        includePartialMessages: true,
      };
      if (claudeBinary) options.pathToClaudeCodeExecutable = claudeBinary;
      if (opts.projectRoot) options.cwd = opts.projectRoot;
      if (resumeSessionId) options.resume = resumeSessionId;

      // Tracks which (message uuid, block index) pairs we've already
      // streamed via partials so we don't re-emit text/thinking from the
      // final SDKAssistantMessage.
      const streamedBlocks = new Set<string>();

      try {
        for await (const message of query({ prompt, options })) {
          for (const chunk of translateMessage(message, streamedBlocks)) {
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

function translateMessage(message: SDKMessage, streamedBlocks: Set<string>): AgentChunk[] {
  if (message.type === 'system' && message.subtype === 'init') {
    return [{ kind: 'session_init', sessionId: message.session_id }];
  }

  if (message.type === 'stream_event') {
    return translateStreamEvent(message, streamedBlocks);
  }

  if (message.type === 'assistant') {
    return translateAssistantMessage(message, streamedBlocks);
  }

  if (message.type === 'user') {
    return translateUserMessage(message);
  }

  if (message.type === 'result') {
    const m = message as {
      result?: string;
      session_id: string;
      is_error?: boolean;
      subtype?: string;
    };
    if (m.is_error || m.subtype === 'error_max_turns' || m.subtype === 'error_during_execution') {
      return [
        {
          kind: 'error',
          message: m.result ?? `Agent run ended with error (${m.subtype ?? 'unknown'})`,
        },
      ];
    }
    return [{ kind: 'result', sessionId: m.session_id, text: m.result }];
  }

  return [];
}

interface StreamEventEnvelope {
  type: 'stream_event';
  uuid: string;
  event: {
    type?: string;
    index?: number;
    content_block?: { type?: string };
    delta?: { type?: string; text?: string; thinking?: string };
  };
}

function translateStreamEvent(
  message: SDKMessage,
  streamedBlocks: Set<string>,
): AgentChunk[] {
  const m = message as unknown as StreamEventEnvelope;
  const event = m.event;
  if (!event) return [];
  const index = event.index ?? 0;
  const blockId = `${m.uuid}:${index}`;

  if (event.type === 'content_block_start' && event.content_block) {
    const blockType = event.content_block.type;
    if (blockType === 'text') {
      streamedBlocks.add(blockId);
      return [{ kind: 'text_start', blockId }];
    }
    if (blockType === 'thinking') {
      streamedBlocks.add(blockId);
      return [{ kind: 'thinking_start', blockId }];
    }
    // tool_use blocks: skip the partial start — we'll emit the complete
    // version once SDKAssistantMessage arrives.
    return [];
  }

  if (event.type === 'content_block_delta' && event.delta) {
    const delta = event.delta;
    if (delta.type === 'text_delta' && typeof delta.text === 'string') {
      return [{ kind: 'text_delta', blockId, text: delta.text }];
    }
    if (delta.type === 'thinking_delta' && typeof delta.thinking === 'string') {
      return [{ kind: 'thinking_delta', blockId, text: delta.thinking }];
    }
    // input_json_delta etc. — ignore; the assembled tool_use comes through
    // translateAssistantMessage below.
    return [];
  }

  return [];
}

function translateAssistantMessage(message: SDKMessage, streamedBlocks: Set<string>): AgentChunk[] {
  const msg = message as {
    type: 'assistant';
    message: { id?: string; content?: unknown };
    error?: string;
  };
  const out: AgentChunk[] = [];
  const content = msg.message.content;
  if (Array.isArray(content)) {
    content.forEach((block, index) => {
      const b = block as {
        type?: string;
        id?: string;
        name?: string;
        input?: unknown;
      };
      // We can't reliably map this assistant-message index to the partial
      // events' blockId (different uuids), so we de-dupe text/thinking by
      // simply skipping them — partials already streamed everything we
      // care about for display.
      if (b.type === 'text' || b.type === 'thinking') {
        // If partials never fired (e.g. includePartialMessages was off or
        // a transport hiccup), fall back to surfacing the final text.
        if (streamedBlocks.size === 0 && b.type === 'text' && typeof (b as { text?: string }).text === 'string') {
          const blockId = `final:${index}`;
          out.push({ kind: 'text_start', blockId });
          out.push({ kind: 'text_delta', blockId, text: (b as { text: string }).text });
        }
        return;
      }
      if (b.type === 'tool_use' && typeof b.id === 'string' && typeof b.name === 'string') {
        out.push({
          kind: 'tool_use',
          toolUseId: b.id,
          toolName: b.name,
          input: b.input ?? {},
        });
      }
    });
  }
  if (msg.error) {
    out.push({ kind: 'error', message: `Agent error: ${msg.error}` });
  }
  return out;
}

function translateUserMessage(message: SDKMessage): AgentChunk[] {
  const msg = message as { type: 'user'; message: { content?: unknown } };
  const out: AgentChunk[] = [];
  const content = msg.message.content;
  if (Array.isArray(content)) {
    for (const block of content) {
      const b = block as {
        type?: string;
        tool_use_id?: string;
        content?: unknown;
        is_error?: boolean;
      };
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
