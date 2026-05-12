# Handoff: Hyperstudio — Hi-Fi Workbench

> Front-end workbench for [Hyperframes](https://github.com/heygen-com/hyperframes) — the open-source HTML-based video rendering framework. Hyperstudio is the local desktop UI where a human and a Claude agent collaborate on edits in real time.

---

## About the design files

The files in this folder are **design references** authored in HTML/React + inline Babel. They demonstrate intended layout, behaviour, motion, and visual language — **they are not production code to ship**. Recreate them in the project's chosen environment (Electron + React/Vite, Tauri, etc.) using its own component library, state store, styling system, and IPC layer.

If no environment exists yet, the recommended stack for this product is:

- **Electron + Vite + React 18 + TypeScript** (local-first, file-system access)
- **Zustand** or **Jotai** for state (the agent + UI both mutate the same timeline doc — atomic store is critical)
- **Tailwind CSS** with the design tokens below mapped to CSS variables
- **react-dnd** or **dnd-kit** for timeline / asset drag-and-drop
- A small WebSocket bridge to the Hyperframes dev server for `npm run dev` proxies + re-renders

## Fidelity

**High-fidelity.** Colours, type ramp, spacing, radii, motion, and layout are final. Recreate pixel-perfectly except where the host codebase's primitives dictate otherwise (e.g. use the platform-native window chrome instead of the custom top bar if you prefer).

---

## Screens / Views

The prototype is a single window with five regions. Open `Hyperstudio.html` to see them in situ. Default theme is **Moss** (soft dark + sage accent).

### 1 · Top bar (48 px)

- **Left:** product mark (24×24 rounded square, accent gradient) + wordmark "Hyperstudio" (Inter 14 / 600).
- **Project switcher:** outline button with folder icon, project name (`morning-coffee-vlog`), chevron-down. Opens a dropdown of recent projects.
- **Metadata strip:** mono, 11 px, fg-4 — `01:24:00 · 1920×1080 · 30fps`.
- **Right cluster:**
  - **Status pills** (3-px gap dot, 11 px text, 999 px radius):
    - `proxy ready` — green tint (`--green-soft` bg, `--green` dot)
    - `Claude working` — accent tint, spinning dot
  - **Share** — secondary ghost button.
  - **Render** — primary filled accent button with arrow-up-right icon.

### 2 · Left rail (72 px)

Vertical icon+label tabs. 56×60 buttons, 4 px gap. Items: Claude (badge "1"), Media (count), Audio (count). Footer: Settings cog (44×44 ghost).

- **Selected state:** `--accent-soft` background, `--accent-line` border, 2-px accent indicator on the inside-left edge.
- **Unselected:** transparent + `--fg-3` icon and label.

### 3 · Side panel (320 px compact / 360 px comfortable)

Shows the content of the active rail tab.

#### 3a · Claude chat

Header (54 px): AI avatar + "Claude" / `sonnet-4.5 · 12 tools available` mono caption + small "Review video" CTA chip on the right.

**Message list** (scrollable, 12 px gaps):

- **System notice** — dashed border card, mono 11 px, used for boot / file-open notes.
- **User bubble** — right-aligned, `--bg-3` fill, `12 12 4 12` radius, 78% max-width, with 26 px circular "J" avatar to its right.
- **Assistant bubble** — left, no fill, 26 px gradient-accent avatar with sparkle icon. Inline `code` is `--accent-2` on `--bg-3` 4-px pill.
- **Tool call card** — `--bg-2` panel, accent border + soft glow when `status: 'running'`. Collapses to a one-line summary; expand toggles a chevron and reveals a mini preview (see "Tool previews" below) plus actions: *Jump to seam*, *Undo*, *View diff*.
- **Typing indicator** — three dots, 1.4 s staggered fade.

Footer composer:

- Textarea-styled `--bg-2` block. Placeholder: "Ask Claude to edit, analyze, or describe…"
- Below the input: `@` mention button, mic button, `⌘↩ to send` mono hint, accent **Send** button.
- Below the composer: 3 context chips — "Add B-roll at 0:55", "Caption pass", "Trim silence". Tap inserts as a prompt seed.

##### Tool previews (inside the expandable card)

| Tool                | Preview render                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| `cut_segment`       | Two accent rectangles with a hatched gap between them; mono caption with from→to seconds. |
| `analyze_timeline`  | 28 thin bars (random envelope), 3 highlighted in accent at "hit" positions.   |
| (others / future)   | Default: JSON args in mono.                                                    |

#### 3b · Media library

- Header (12 px padding): "Media" title, count, **+ Import** button, search field below.
- Filter chips row: `all`, `a-roll`, `b-roll`, `image` — radio behaviour, accent fill on active.
- Folder breadcrumb (mono 10 px): `~/Footage/coffee-shoot-2026-05/`.
- 2-column grid (8 px gap) of cards. Each card:
  - 16:10 thumbnail (procedural radial gradient stand-in).
  - Top-left badge for kind (`B-ROLL` violet pill, `IMG` neutral pill).
  - Top-right green dot if asset is on the timeline.
  - Bottom-right black duration pill (mono).
  - Footer: file name (12 px, truncate) + `resolution · size` (mono 10 px, fg-4).
- Dashed drop-zone at the bottom: "Drop files here or paste from clipboard".

#### 3c · Audio library

- Same header / filter row pattern (`all / music / sfx / vo / ambience`).
- Vertical list of cards (8 px gap):
  - 28-px circular play button on the left.
  - File name + `duration · mood` mono caption.
  - Kind tag (right) — colour-coded per kind.
  - Procedural waveform (36 bars, sage green, 22 px tall) underneath.

### 4 · Player (centre, flex)

Sub-header strip (32 px) with: "Preview" label, `proxy · 540p` mono caption, green `live` pill, right-aligned ghost buttons for `Captions`, `Safe area`, and `Inspector ›`.

Stage (`--bg-player`): a centred 16:9 frame with:

- Radial-warm video stand-in (replace with a real `<video>` showing the proxy mp4 from Hyperframes).
- Overlay corner badges: top-left `REC` (accent dot + label) and a `1080p · 30fps` chip; top-right mono timecode.
- Caption layer (current line) bottom-centre — pill of `rgba(10,14,26,0.7)` + 8 px blur.
- 4 safe-area corner brackets (1.5 px white at 0.4 alpha).

Transport bar (48 px, `--bg-1`):

- Skip-back, step-back, **play** (34×34 round, fg-1 on bg-0), step-forward, skip-forward.
- Current timecode (mono 12 px, fg-1) `/` total (mono 11 px, fg-4).
- Right cluster: volume icon + 80-px slider; vertical divider; maximise icon; `16:9 ⌄` aspect-ratio selector.

### 5 · Timeline (260 px, full-width footer)

Toolbar (40 px, `--bg-1`):

- Left group: **+ Track**, divider, **Split**, **Delete**, divider, **Undo**, **Redo** — ghost buttons.
- Right group: **Snap** (active = accent), 110-px zoom slider between zoom-out / zoom-in icons.

Layout: 110-px left column of track headers + scrollable clip area.

**Track header** (each track, 62 px tall): 4-px colour bar (accent / violet / green / amber) · track label · clip count · visibility eye · lock icon.

**Ruler** (22 px, sticky top): vertical ticks every second; major ticks every 5 s with mono `0:NN` labels.

**Clips** — absolutely positioned, 5-px radius, 4-px trim handles on both edges.

| Track     | Clip fill                                                       | Notes                          |
| --------- | --------------------------------------------------------------- | ------------------------------ |
| A-Roll    | `linear-gradient(180deg, var(--accent-2), var(--accent))`       | thumbs strip overlay; pulse-highlight when Claude is touching it. |
| B-Roll    | `linear-gradient(180deg, #7d72a3, #5d5384)`                     | muted violet so it never dominates. |
| Music     | `rgba(134,181,154,0.12)` fill + green waveform bars (~70 % α).  | bars generated from a 3-harmonic sine. |
| Captions  | `linear-gradient(180deg, #c79b53, #9a7332)` w/ cream text       | text is the caption line itself, truncated. |

**Playhead:** 2-px accent line spanning all tracks, with a 16×14 px accent flag at the top.

**Empty footer track row:** dashed "+ Track" button at the bottom of the header column.

---

## States to implement

All five states below are demonstrated live in the prototype — toggle **Tweaks → State** (bottom-right panel) between `default / ai-editing / rendering / delete / offline` to see each one in situ. They all share the same chrome; only the affected region(s) change.

| State          | Tweak value   | What changes                                                                                                                                                                                                                              |
| -------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Default        | `default`     | The screen as shown. Status pill = `Claude working` (accent dot, spinning).                                                                                                                                                              |
| AI editing     | `ai-editing`  | Status pill = `Claude editing · cut_segment` (same colour, more specific copy). Live tool-call card in chat gets accent border + soft glow. Clips listed in `claude.affectedClipIds[]` pulse via `@keyframes pulse-clip` (1.6 s ease-in-out infinite). |
| Rendering      | `rendering`   | The player stage is replaced by `<RenderingStage progress={…}>` — 140-px progress ring (accent stroke), `0:24 / 1:24 · h.264 · 1080p · ETA 0:42` mono caption, *Cancel* + *Render in background* buttons, and a 24-frame thumbstrip overlay at the bottom showing the live frame being rendered. Player sub-header changes to "Preview — locked during render". Top bar pill flips to `Rendering · 28%` (amber). |
| Delete cascade | `delete`      | Centred 460-px modal over a blurred (`backdrop-filter: blur(4px)`) backdrop. Title: "Delete caption and matching video?". Body explains both deletions. Preview rows show the A-Roll segment (`− 4.0s`) and caption (`− 1 line`) that will be removed. Footer: *Don't ask again for this project* checkbox, *Keep video* (ghost) and *Delete both* (`#dc2626` filled). |
| Offline        | `offline`     | Inline banner across the top of the workspace: red dot + "You're offline. Claude is unreachable — local editing, undo, and rendering still work." with a *Retry* button. Chat panel dims to 55 % opacity and is `pointer-events: none`. Status pill flips red to `Offline · Claude unreachable`. Timeline + player stay fully interactive. |
| Empty project  | (not in Tweaks) | Chat only ("Drop files in the Media tab, or describe what you want to make"), placeholder player, "Drag material here" timeline. *(Match the hi-fi visual language.)* |

Implementations live in `hs-states.jsx`:

- `<StatePill kind={state} />` — drop-in replacement for the top-bar status pill.
- `<RenderingStage progress={0..1} />` — full player-area takeover.
- `<DeleteCascadeModal onClose={…} />` — modal overlay; render at the root of `<App>` so the backdrop covers everything.
- `<OfflineBanner />` — render between `<TopBar />` and the main row.

---

## Interactions

- **Cmd+Z / Cmd+Shift+Z** — undo/redo every mutation, including the agent's tool calls. Use a single linear history; tool calls are atomic ops.
- **Drag clip edge** — live trim; release fires `trim_clip(id, start, end)` which the host proxies to Hyperframes. Optimistic UI; rollback on failure.
- **Drag asset from library → timeline** — creates a new clip at the drop position on the dropped track. Snap to nearest 0.1 s when **Snap** is on.
- **Right-click caption clip** — context menu: *Edit text*, *Re-time*, *Delete caption + video* (cascade confirm).
- **Click "Review video" in chat header** — Claude scans the timeline and posts a numbered list with timestamp links; clicking a link scrubs the playhead.
- **Click tool-call card body** — expand/collapse preview.
- **`⌘↩` in composer** — send.

### Motion

- Generic UI transitions — `120ms cubic-bezier(.2,.7,.3,1)` (`--t-fast`).
- Panel switches / accent-card glow — `240ms cubic-bezier(.2,.7,.3,1)` (`--t-med`).
- `pulse-clip` — `1.6 s ease-in-out infinite` (defined in `Hyperstudio.html` `<style>` block).
- Typing dots — `1.4 s` per cycle, 160-ms stagger.

---

## State management

Minimum store slices:

```ts
type Store = {
  project: { name: string; path: string; duration: number; fps: number; resolution: string };
  tracks: Track[];                 // see hs-data.jsx for shape
  playhead: number;                // seconds
  selection: { clipIds: string[]; trackId?: string };
  zoom: number;                    // px per second
  snap: boolean;
  chat: ChatMessage[];             // user / assistant / tool / system
  claude: { running: boolean; activeToolCall?: ToolCall; affectedClipIds: string[] };
  proxy: { ready: boolean; rendering?: { progress: number; etaSeconds: number } };
  online: boolean;
  ui: { tab: 'chat'|'media'|'audio'; theme: ThemeName; density: 'compact'|'comfortable'; showInspector: boolean };
};
```

All edits (UI + agent) go through one `applyOp(op)` reducer so undo is uniform.

---

## Design tokens

### Themes

7 palettes live in `hs-app.jsx → THEMES`. **Default = Moss.** All themes share the same semantic variable names — pages reference `var(--bg-1)` etc, never raw hexes.

| Theme    | Mode  | Accent          | Notes                                |
| -------- | ----- | --------------- | ------------------------------------ |
| **moss** (default) | dark | `#7aa589` sage | warm-grey bg, low-saturation |
| tide     | dark  | `#7a9bc4` blue  | same bg as moss/mist                 |
| abyss    | dark  | `#5e9aa8` teal  | slightly cooler bg                   |
| mist     | dark  | `#c48a6a` clay  | original                             |
| paper    | light | `#b87b58` clay  | warm off-white                       |
| linen    | light | `#7a9b7a` sage  | cool linen                           |
| cloud    | light | `#c47a82` blush | dusty rose on cloud                  |

### Token reference (Moss values)

```css
/* surfaces */
--bg-0:   #1c1d22;   /* outermost / letterbox */
--bg-1:   #24262c;   /* primary panel */
--bg-2:   #2d2f37;   /* card / hover */
--bg-3:   #383b45;   /* nested card / clip */
--bg-player: #0e0f12;

/* text */
--fg-1:   #ebecee;   /* primary */
--fg-2:   #bcbfc5;   /* secondary */
--fg-3:   #8c919a;   /* tertiary / labels */
--fg-4:   #666b75;   /* hint / mono captions */
--fg-5:   #4a4e58;   /* disabled */

/* lines */
--line-1: rgba(220,225,235,0.06);   /* hairline */
--line-2: rgba(220,225,235,0.10);   /* default */
--line-3: rgba(220,225,235,0.18);   /* emphasised */

/* accent (Moss = sage) */
--accent:      #7aa589;
--accent-2:    #94bba2;
--accent-soft: rgba(122,165,137,0.13);
--accent-line: rgba(122,165,137,0.36);
--accent-ink:  #c8e0d2;   /* readable text-on-soft */

/* semantic (track colour-coding) */
--violet: #a89dd1;  --violet-soft: rgba(168,157,209,0.13);
--green:  #86b59a;  --green-soft:  rgba(134,181,154,0.14);
--amber:  #d9b366;  --amber-soft:  rgba(217,179,102,0.14);
```

### Spacing scale

`4 · 8 · 12 · 16 · 24 · 32` (`--sp-1 … --sp-6`).

### Radii

`6 · 8 · 12 · 16` (`--r-sm / --r-md / --r-lg / --r-xl`). Buttons use 5–6 px; cards 8 px; panels 12 px; modals 16 px.

### Shadows

```css
--shadow-1: 0 1px 2px rgba(0,0,0,.30), 0 1px 1px rgba(0,0,0,.20);
--shadow-2: 0 4px 12px rgba(0,0,0,.35), 0 2px 4px rgba(0,0,0,.25);
--shadow-3: 0 18px 40px rgba(0,0,0,.50), 0 4px 12px rgba(0,0,0,.30);   /* modals */
```

### Typography

- **UI:** Inter — 400 / 500 / 600 / 700.
- **CJK:** PingFang SC / Hiragino Sans GB (system).
- **Mono:** JetBrains Mono — used for every timecode, file path, byte count, and tool-name token.

Type ramp:

| Use            | Size | Weight | Line  |
| -------------- | ---- | ------ | ----- |
| Display / H1   | 18   | 600    | 1.3   |
| Section title  | 14   | 600    | 1.35  |
| Body           | 13   | 400    | 1.45  |
| Secondary body | 12   | 400    | 1.45  |
| Caption        | 11   | 500    | 1.4   |
| Micro / mono   | 10   | 500    | 1.4   |

### Iconography

Single-line stroke set in `hs-icons.jsx` (24-px viewBox, 1.6 px stroke, round caps/joins). Replace with **Lucide** in the production build — every icon used has a direct Lucide equivalent (sparkles, film, music, settings, play, pause, scissors, etc.). Keep the 1.6 stroke / round-join aesthetic.

---

## Tweaks panel (optional in production)

Floating control panel (bottom-right) for users to switch theme/density. Useful while QA'ing. The protocol described in `tweaks-panel.jsx` is mock-only — in the real app, persist theme to the local project settings file under `~/Library/Application Support/Hyperstudio/preferences.json`.

---

## Files in this bundle

| File                          | Contains                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| `Hyperstudio.html`            | App shell — base CSS variables, font loading, root mount.         |
| `hs-app.jsx`                  | `<App>`, top bar, left rail, theme map, tweaks wiring.            |
| `hs-chat.jsx`                 | Claude chat panel, message types, tool-call card.                 |
| `hs-libraries.jsx`            | Media + Audio library panels.                                     |
| `hs-player-timeline.jsx`      | Player stage, transport bar, timeline (ruler, tracks, playhead).  |
| `hs-icons.jsx`                | Inline SVG icon set used everywhere.                              |
| `hs-states.jsx`               | State overlays: `StatePill`, `RenderingStage`, `DeleteCascadeModal`, `OfflineBanner`. |
| `hs-data.jsx`                 | Demo project data (tracks, clips, assets, chat history).          |
| `tweaks-panel.jsx`            | Tweaks panel (theme/density switcher — mock host protocol).       |

---

## Hyperframes integration notes

The proxy preview, the file-watcher, and the render pipeline come from **Hyperframes** (https://github.com/heygen-com/hyperframes). The agent's tools are thin wrappers around mutations on `project/scenes/*.html`:

```ts
// minimum tool surface
cut_segment(track: TrackId, from: number, to: number): Op
trim_clip(clipId: ClipId, start: number, end: number): Op
add_clip(asset: AssetId, track: TrackId, time: number): Op
delete_clip(clipId: ClipId, cascadeCaption?: boolean): Op
edit_caption(captionId: CaptionId, text: string): Op
analyze_timeline(scope: 'full' | { from: number; to: number }, goal: string): Suggestion[]
list_assets(kind?: AssetKind): Asset[]
```

Every tool returns an `Op` that the reducer applies + appends to the undo stack — same path UI mutations take, so `⌘Z` works uniformly.

---

## Implementation order (suggested)

1. Window chrome + theme tokens + Moss palette.
2. Three-pane shell (rail + side panel + player) with empty placeholders.
3. Timeline w/ static demo data — render, scroll, zoom, playhead.
4. Live video preview hooked to Hyperframes dev server.
5. Drag-to-trim + drag-from-library; reducer + undo.
6. Chat panel — wire to Claude via your model bridge; render assistant + tool messages.
7. Tool-call card expand + pulse highlight on `affectedClipIds`.
8. Render flow (state 3) + offline detection.
9. Polish: motion, focus rings, keyboard shortcuts.
