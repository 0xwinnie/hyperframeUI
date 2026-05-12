import { query } from '@anthropic-ai/claude-agent-sdk';

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  text: string;
}

export interface AgentSession {
  send(prompt: string): AsyncIterable<AgentMessage>;
}

/**
 * Boot a Claude Agent SDK session. Phase 0: no custom tools — we only want to
 * confirm the SDK can authenticate via the user's local Claude Code install.
 *
 * Auth resolution order (handled by the bundled Claude Code binary, not us):
 *   1. `ANTHROPIC_API_KEY` environment variable
 *   2. `~/.claude/auth.json` from a prior `claude login`
 *
 * See /docs/spec.md §6 for the policy: HyperframeUI never asks the user to
 * "log in to claude.ai" — they bring their own Claude Code session.
 */
export function startAgentSession(): AgentSession {
  return {
    async *send(prompt: string) {
      for await (const message of query({ prompt })) {
        const text = extractText(message);
        if (!text) continue;
        yield { role: roleOf(message), text };
      }
    },
  };
}

function roleOf(message: unknown): AgentMessage['role'] {
  if (typeof message === 'object' && message !== null && 'type' in message) {
    const t = (message as { type: string }).type;
    if (t === 'user') return 'user';
    if (t === 'assistant') return 'assistant';
    if (t === 'system') return 'system';
    if (t === 'result') return 'assistant';
  }
  return 'assistant';
}

function extractText(message: unknown): string | null {
  if (typeof message !== 'object' || message === null) return null;
  if ('result' in message && typeof (message as { result: unknown }).result === 'string') {
    return (message as { result: string }).result;
  }
  if ('text' in message && typeof (message as { text: unknown }).text === 'string') {
    return (message as { text: string }).text;
  }
  return null;
}
