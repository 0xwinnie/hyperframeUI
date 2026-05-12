// Public surface for @hyperframeui/agent. Phase 0 ships only an empty boot
// helper; tool registrations land in Phase 1 (see /docs/spec.md §5).

export { startAgentSession } from './session.js';
export type { AgentSession, AgentMessage } from './session.js';
