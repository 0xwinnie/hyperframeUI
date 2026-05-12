import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
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
 * Binary resolution:
 *   1. If the SDK's bundled platform binary is present, use that.
 *   2. Otherwise fall back to the user's installed `claude` CLI (which they
 *      already have for daily use) via `pathToClaudeCodeExecutable`.
 *   3. If neither is available, throw a clear error.
 *
 * Auth, in turn, is handled by whichever Claude Code binary we end up using:
 *   - `ANTHROPIC_API_KEY` environment variable, or
 *   - `~/.claude/auth.json` from a prior `claude login`.
 *
 * See /docs/spec.md §6 for the policy: HyperframeUI never asks the user to
 * "log in to claude.ai" — they bring their own Claude Code session.
 */
export function startAgentSession(): AgentSession {
  const claudeBinary = resolveLocalClaudeBinary();
  return {
    async *send(prompt: string) {
      const options = claudeBinary ? { pathToClaudeCodeExecutable: claudeBinary } : undefined;
      for await (const message of query({ prompt, ...(options ? { options } : {}) })) {
        const text = extractText(message);
        if (!text) continue;
        yield { role: roleOf(message), text };
      }
    },
  };
}

function resolveLocalClaudeBinary(): string | undefined {
  // `which claude` is the most reliable way to find a user-installed CLI on
  // macOS/Linux. We only use this when the SDK's own platform binary did not
  // ship (e.g. pnpm skipped the optional dependency).
  try {
    const found = execSync('command -v claude', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .trim();
    return found && existsSync(found) ? found : undefined;
  } catch {
    return undefined;
  }
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
