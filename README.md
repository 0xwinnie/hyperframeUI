# HyperframeUI

> Local desktop workbench for [Hyperframes](https://github.com/heygen-com/hyperframes) — the open-source HTML video rendering framework. Human + Claude agent co-edit the same project in real time.

**Status:** Phase 0 — early development. Not yet usable.

## What this is

Hyperframes turns HTML into video: write a composition in `index.html`, run `npm run dev` for a live preview, run `npm run render` for an MP4. HyperframeUI is the editor that wraps it — a three-pane workbench (chat, player, timeline) where you can drag clips, trim with your mouse, or just tell Claude what to change.

- **Local-first.** Video files never leave your machine.
- **No API key required.** Reuses your local Claude Code login (`claude login`) via `@anthropic-ai/claude-agent-sdk`. An `ANTHROPIC_API_KEY` env var also works.
- **Hyperframes-compatible by design.** The `index.html` is the source of truth — CLI users and HyperframeUI users edit the same file.

## Architecture

- Electron + Vite + React 18 + TypeScript
- Zustand for state; all mutations flow through a single `applyOp(op)` reducer (`⌘Z` covers UI and agent edits uniformly)
- Tailwind v4 (themes mapped to CSS variables; Moss is default)
- `@anthropic-ai/claude-agent-sdk` runs in Electron's main process
- pnpm workspaces; see [`docs/spec.md`](./docs/spec.md) for full architecture

## Repository layout

```
apps/
  desktop/                  # Electron app (main + renderer)
packages/
  core/                     # Pure TS: parser, ops, reducer, types
  agent/                    # Claude Agent SDK glue + tool registrations
  hyperframes-client/       # Typed wrapper around `npx hyperframes`
docs/
  design-brief.md           # Original UI brief
  pre-spec.md               # Pre-spec outline
  spec.md                   # Final spec — read this first
design_handoff_hyperstudio/ # High-fidelity design reference (React + inline Babel)
```

## Development

Requires Node 20+ and pnpm 9+.

```bash
pnpm install
pnpm dev        # starts the Electron app
pnpm test       # runs unit tests across all packages
pnpm typecheck  # type-checks every workspace
```

## License

MIT. See [LICENSE](./LICENSE).

## Relationship to Hyperframes

HyperframeUI is an independent open-source project that depends on [Hyperframes](https://github.com/heygen-com/hyperframes) (maintained by HeyGen). We track the latest Hyperframes minor version. Issues that turn out to live in Hyperframes itself will be filed upstream.
