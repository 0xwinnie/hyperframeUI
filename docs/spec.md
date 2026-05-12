# Hyperstudio — Spec (v1)

> 在 [design-brief.md](./design-brief.md) 和 [pre-spec.md](./pre-spec.md) 基础上收口的最终 spec，
> 含技术栈/数据模型决策、Tool schemas、仓库结构、Phase 0/1/2 实施清单。
> 设计语言以 [`../design_handoff_hyperstudio/README.md`](../design_handoff_hyperstudio/README.md) 为准（默认 Moss 主题）。

- 域名：**hyperstudio.dev**
- License：**MIT**
- 目标：让"人 + Claude agent"协作剪辑 Hyperframes 视频项目，本地工具，视频不离开电脑

---

## 1. 总览

```
┌─────────────────────────────────────────────────────────────┐
│           Hyperstudio (Electron app, Node-only)             │
│                                                              │
│  Renderer (React + Vite + TS + Tailwind)                    │
│    ├── chat panel ─────┐                                    │
│    ├── player iframe ←─┼── postMessage to hyperframes dev   │
│    ├── timeline (DOM)  │                                    │
│    └── libraries       │                                    │
│                        │                                    │
│  Main process (Node)   │                                    │
│    ├── @anthropic-ai/claude-agent-sdk (uses ~/.claude OAuth)│
│    ├── tools/* — operate on project files                   │
│    ├── child_process: `npx hyperframes <cmd>`               │
│    └── chokidar file watcher                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
    ~/.claude/auth.json          project dir (Hyperframes)
                                  ├── index.html   ← truth source
                                  ├── compositions/
                                  ├── assets/
                                  ├── transcript.json
                                  ├── hyperframes.json
                                  └── .hyperstudio/    ← our sidecar
```

**两个不变量**：
1. **Hyperframes 文件是真理源**，Hyperstudio 不引入 `project.json`。
2. **所有 mutation 走单一 reducer `applyOp(op)`** —— UI 拖拽和 Claude tool call 同一路径，`⌘Z` 统一回滚。

---

## 2. 技术栈决策

### 2.1 桌面壳 → **Electron**

| 选项 | 优 | 劣 | 适用度 |
|---|---|---|---|
| **Electron** ✅ | 与 `hyperframes` CLI 和 `claude-agent-sdk` 同 Node 运行时；可直接 `child_process.spawn npx hyperframes`；生态成熟（chokidar、native menus、auto-updater） | 包体 ~100MB；内存常驻较大 | 高 |
| Tauri | 包体 ~10MB；性能更好 | Rust ↔ Node 互调要起 sidecar 子进程，等于多一个 IPC 层；社区比 Electron 小，OSS 贡献者更少；Claude Agent SDK 还得跑在 sidecar | 中（包体优势抵不过工程复杂度） |
| 纯 Web | 零安装 | 无法稳定读 `~/.claude/auth.json`；本地大视频文件没有 native 文件选择；用户得自起 dev server | 低 |

**理由**：Hyperframes 已经是 Node 工程，Claude Agent SDK 也是 Node。Electron 让"app + 工具链 + agent"都在一个 V8 里，调试和打包都最简单，也最适合社区贡献。

### 2.2 前端框架 → **React 18 + Vite + TypeScript**

设计稿（`design_handoff_hyperstudio/*.jsx`）就是 React；切 Vue/Svelte 等于重画。React 贡献者基数最大，TypeScript 是后续 `@hyperstudio/core` 对外发布的必要条件。

### 2.3 状态管理 → **Zustand + 单一 `applyOp(op)` reducer**

- Zustand：handoff README 推荐，体积小、API 平、SSR/Electron 都行
- 所有"会改 project 状态"的事件都包装成 `Op`，经 `applyOp` 走一次 reducer：
  - 写入 in-memory store（乐观更新）
  - 写 HTML/asset 文件
  - 推入 undo 栈
- 纯 UI 状态（zoom、selection、tab）单独切片，**不进**undo 栈

Redux Toolkit 太重；纯文件订阅缺乏 UI 内态。

### 2.4 时间线 UI → **DOM（绝对定位 div）+ SVG ruler + Canvas 波形缓存**

- 每个 clip = 绝对定位 `<div>`，2 个 `:pseudo-element` 作为左右 4px trim 把手
- ruler 用 SVG（vector 缩放清晰），刻度由 zoom 推导
- 音频波形：mount 时 Canvas 一次性绘制为 dataURL，缓存到 `.hyperstudio/cache/waveforms/` （与 my-video 里的 `.waveform-cache/` 对齐）
- 拖拽：`@dnd-kit/core`（无依赖、键盘可达、SSR 友好；优于 `react-dnd`）
- clip > 200 时启用 `react-window` 风格虚拟化

不选 Canvas-only：丢失 a11y、tab focus、CSS 调试能力。不选第三方时间线库：和 Moss 设计语言冲突，且我们的 op 模型要嵌得很深。

### 2.5 视频预览 → **iframe 嵌 `hyperframes preview`（Phase 0/1）→ 渲染 proxy mp4（Phase 2 可选）**

- Phase 0/1：iframe 加载 `http://127.0.0.1:<port>/`，通过 `postMessage` 双向同步：
  - app → iframe：`{type:'seek', t}`、`{type:'play'}`、`{type:'pause'}`、`{type:'reload'}`
  - iframe → app：`{type:'time', t}`、`{type:'ready'}`、`{type:'error', msg}`
- Phase 2 可选：渲染 540p H.264 proxy 段，在重项目里切换"光滑预览"模式（player sub-header 已有 `proxy · 540p` 这一标识，handoff 已设计这条路）

**需要与 HeyGen 协调**：确认 `hyperframes preview` 是否暴露上述 postMessage 协议。若不暴露，第一步在我们端做 polyfill（注入小 client.js 到 preview 页面），同时给 HeyGen 提 PR。

### 2.6 跨进程通信 → **Electron contextBridge（preload 暴露白名单 IPC）**

不允许 renderer 直接 `require('fs')`。所有 IO/spawn 走 main 进程 IPC：`hs.fs.*`, `hs.proc.*`, `hs.project.*`, `hs.agent.*`。

---

## 3. 数据模型 → **选项 A**

**真理源 = Hyperframes 项目文件本身**：`index.html` / `compositions/*.html` / `assets/*` / `transcript.json` / `hyperframes.json`。

### 3.1 内存视图

```ts
// packages/core/src/types.ts
type ProjectState = {
  root: string;                      // 项目目录绝对路径
  meta: { id: string; name: string; createdAt: string };  // meta.json
  composition: {
    width: number;
    height: number;
    duration: number;
    fps: number;
  };
  tracks: Track[];                   // 由 data-track-index 聚合而来
  assets: Asset[];                   // 扫 assets/ + 解析 index.html 中引用
  transcript?: TranscriptWord[];     // transcript.json
  hyperstudio: HyperstudioSidecar;   // .hyperstudio/project.json（仅 UI 元数据）
};

type Track = {
  index: number;                     // data-track-index
  kind: 'a-roll' | 'b-roll' | 'caption' | 'music' | 'sfx' | 'overlay';
  label: string;                     // 显示名（来自 sidecar）
  color: 'accent' | 'violet' | 'green' | 'amber';
  visible: boolean;
  locked: boolean;
  clips: Clip[];
};

type Clip = {
  id: string;                        // DOM id
  domSelector: string;               // 精确定位用 (file + xpath)
  start: number;                     // data-start (s)
  duration: number;                  // data-duration (s)
  src?: string;                      // 视频/音频 clip 才有
  text?: string;                     // caption clip
  thumbnailUrl?: string;             // 缓存路径
};
```

**Sidecar (`.hyperstudio/project.json`)** 只装"不该污染 Hyperframes 输出"的 UI 元数据：track 命名/颜色、最近播放头、theme、最后一次 zoom 等。**完全可删，删了 Hyperframes 项目仍然能用**。CLI 用户不需要这个文件。

### 3.2 读取流程

1. 打开项目 → 用 `node-html-parser` 解析 `index.html` 和所有 `compositions/*.html`
2. 收集所有 `[data-start]` 元素 → `Clip[]`
3. 按 `data-track-index` 分组 → `Track[]`
4. 合并 sidecar 的 track kind/label/color
5. 兜底：`npx hyperframes inspect --json` 给出权威的 composition 元信息（fps、duration）

### 3.3 写入流程（`applyOp`）

每个 op 实现两件事：
- `compute(state, op) → Patch`：纯函数，产出"对哪个文件做什么 AST 修改"的描述
- `apply(patch)`：原子写入（先写 `<file>.tmp` 再 rename），写完触发 chokidar 自洗

**外部编辑（CLI 用户改了 `index.html`）**：chokidar 检测到外部修改 → 重新解析 → diff 内存 store → 通知 UI（toast: "Project files changed on disk"）。Undo 栈不跨"外部修改"边界。

### 3.4 Undo

Phase 0：每个 op 落地前做 *full file snapshot*（同项目通常 < 1MB HTML，廉价）。压栈结构 `{op, before: {path: content}, after}`。`⌘Z` = 反向 apply `before`。

Phase 1：迁移到 *event sourcing* —— 仅压 op，redo 时重做。`before` 留作崩溃恢复 checkpoint，每 N 条做一次完整 snapshot。

### 3.5 Track 索引映射

Hyperframes 的 `data-track-index` 是裸数字。Hyperstudio 维护一份**约定表**（写入 sidecar，可被项目覆盖）：

| Default index | Kind     | Color   |
|---------------|----------|---------|
| 0             | a-roll   | accent  |
| 1             | b-roll   | violet  |
| 5             | overlay  | accent  |
| 10            | caption  | amber   |
| 20            | music    | green   |
| 21            | sfx      | green   |

新项目用这个 default；现有项目（如 my-video）首次打开时让用户确认/调整一次。

---

## 4. 仓库结构（OSS 友好）

推荐 **pnpm monorepo**，理由：把"纯逻辑"和"Electron 壳"分开，社区可以基于 `@hyperstudio/core` 做 CLI/Web 变体；TypeScript 类型可单独发布；issue 也好按 scope 打标签。

```
hyperstudio/
├── apps/
│   └── desktop/                  # Electron app（可执行产物）
│       ├── electron/
│       │   ├── main.ts           # Electron 主进程入口
│       │   ├── preload.ts        # contextBridge → 白名单 IPC
│       │   └── ipc/              # 各 IPC handler 拆分
│       ├── src/                  # renderer (React)
│       │   ├── components/       # 对照 hs-*.jsx 重写为 TSX
│       │   ├── store/            # Zustand slices
│       │   ├── theme/            # Moss + 其它 6 主题
│       │   ├── hooks/
│       │   └── main.tsx
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── electron-builder.yml
│       └── package.json
│
├── packages/
│   ├── core/                     # 纯 TS：parser、ops、reducer、types
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── parser/           # html ↔ in-memory
│   │   │   ├── ops/              # 每个 tool 对应一个 op
│   │   │   ├── reducer.ts
│   │   │   ├── undo.ts
│   │   │   └── index.ts
│   │   ├── tests/                # vitest，含 golden HTML diff
│   │   └── package.json
│   ├── agent/                    # Claude Agent SDK + tool 注册
│   │   ├── src/
│   │   │   ├── tools/            # 1 file/tool，schema + handler
│   │   │   ├── prompts/system.md
│   │   │   └── index.ts
│   │   └── package.json
│   └── hyperframes-client/       # 包 `npx hyperframes` 的 typed wrapper
│       ├── src/
│       │   ├── cli.ts            # spawn + JSON parse
│       │   ├── preview.ts        # postMessage 协议
│       │   └── types.ts
│       └── package.json
│
├── docs/
│   ├── design-brief.md
│   ├── pre-spec.md
│   ├── spec.md                   # ← this
│   ├── ARCHITECTURE.md           # 后补
│   └── CONTRIBUTING.md
│
├── design_handoff_hyperstudio/   # 现有，作为视觉真理源
│
├── examples/
│   └── morning-coffee-vlog/      # 跑通用的 fixture 项目（可软链 my-video）
│
├── .github/
│   └── workflows/
│       ├── ci.yml                # lint + typecheck + vitest
│       └── release.yml           # electron-builder → dmg/exe/AppImage
│
├── pnpm-workspace.yaml
├── package.json                  # root: scripts 委托给 workspaces
├── tsconfig.base.json
├── .editorconfig
├── LICENSE                       # MIT
└── README.md
```

**不要**做的：
- 不要拆前后端两个 repo（增加 OSS 心智负担，没量级收益）
- 不要 monorepo + Turbo/Nx（pnpm + tsc 已足够，少一层抽象）
- 不要 alpha 阶段就发 npm（先内部用 workspace ref，稳定后再 publish）

---

## 5. Tool Surface

### 5.1 通用契约

所有 tool 走 `agent` package，注册到 Claude Agent SDK。返回结构统一：

```ts
type ToolResult<T = unknown> =
  | { ok: true; data: T; op?: Op; affectedClipIds?: string[] }
  | { ok: false; error: string; hint?: string; retryable: boolean };
```

- 成功结果若产生 mutation，必须返回 `op`，main 进程把它 push 到 undo 栈
- `affectedClipIds` 用于 UI pulse 高亮（对应 handoff README 的 `claude.affectedClipIds[]`）
- 失败 result：`error` 给人看，`hint` 给 Claude 看（可能含建议重试参数），`retryable` 控制是否允许重调

### 5.2 Phase 1 工具（v1 必交付）

下方为 TypeScript schema。每个 tool 既是 Claude tool schema 也是 main → renderer IPC 的契约。

```ts
// packages/agent/src/tools/index.ts
export type ToolDefs = {
  // ── 项目查询 ──────────────────────────────────────────
  read_project_state: {
    input: {};
    output: ProjectState;
  };
  get_thumbnails: {
    input: { times: number[]; size?: 'sm' | 'md' };
    output: { dataUrls: string[] };  // base64 PNG
  };
  lint: {
    input: {};
    output: { errors: LintFinding[]; warnings: LintFinding[] };
  };

  // ── 时间线编辑 ────────────────────────────────────────
  cut_segment: {
    // 在 [from, to] 范围内对指定 track 切除并接拢两侧 clip
    input: { trackIndex: number; from: number; to: number };
    output: { affectedClipIds: string[] };
  };
  trim_clip: {
    // 调整单个 clip 的 in/out（data-start / data-duration）
    input: { clipId: string; start: number; duration: number };
    output: { clip: Clip };
  };
  move_clip: {
    // 移到新 track / 新时间点
    input: { clipId: string; toTrackIndex: number; toStart: number };
    output: { clip: Clip };
  };
  split_clip: {
    input: { clipId: string; at: number };  // at: 绝对时间
    output: { newClipIds: [string, string] };
  };
  delete_clip: {
    input: { clipId: string; cascadeCaption?: boolean };
    output: { removed: string[] };
  };

  // ── 素材 ──────────────────────────────────────────────
  add_clip: {
    input: {
      assetPath: string;             // 相对 project root
      trackIndex: number;
      at: number;
      duration?: number;
    };
    output: { clipId: string };
  };
  list_assets: {
    input: { kind?: 'video' | 'audio' | 'image' };
    output: { assets: Asset[] };
  };
  import_asset: {
    input: { sourcePath: string; copy?: boolean };  // copy=true 默认
    output: { asset: Asset };
  };

  // ── 字幕 ──────────────────────────────────────────────
  add_caption: {
    input: { text: string; start: number; duration: number };
    output: { captionId: string };
  };
  update_caption_text: {
    input: { captionId: string; text: string };
    output: { caption: Clip };
  };
  delete_caption: {
    input: { captionId: string; cascadeVideo?: boolean };
    output: { removed: string[] };
  };
  rebuild_captions_from_srt: {
    input: { srtPath?: string };  // 默认 captions.srt
    output: { count: number };
  };

  // ── 媒体处理（封装现有 my-video skill） ──────────────
  transcribe_audio: {
    input: { audioPath?: string; language?: string };
    output: { transcriptPath: string };
  };

  // ── 输出 ──────────────────────────────────────────────
  render: {
    input: { outputPath?: string; quality?: 'draft' | 'standard' | 'high' };
    output: { mp4Path: string; durationMs: number };
  };
};
```

### 5.3 Phase 2 工具（AI 建议）

```ts
export type Phase2Tools = {
  analyze_timeline: {
    // 对应 handoff README 中的 analyze_timeline tool preview
    input: { scope: 'full' | { from: number; to: number }; goal?: string };
    output: { suggestions: Suggestion[] };
  };
  suggest_b_roll_moments: {
    input: { goal?: 'energy' | 'context' | 'cover-cut' };
    output: { moments: { at: number; reason: string }[] };
  };
  suggest_text_emphasis: {
    input: {};
    output: { spans: { captionId: string; word: string; style: string }[] };
  };
  detect_silences: {
    input: { minDuration?: number };
    output: { ranges: [number, number][] };
  };
  detect_shaky_segments: {
    input: { threshold?: number };
    output: { ranges: [number, number][] };
  };
};
```

### 5.4 工具实现规则

1. 所有 tool **先验证参数**（zod schema），输入非法直接返回 `ok:false`
2. 副作用顺序：**写文件 → push undo → 触发 chokidar 重读 → renderer 收到 state 更新**
3. 失败时回滚（写文件前的 tmp + rename 保证原子性）
4. tool 内部禁止调用其他 tool —— 通过 `applyOp` 复用 op 即可

---

## 6. 认证

```
启动
  ├─ fs.existsSync(~/.claude/auth.json)
  │    ├─ 存在 → 初始化 ClaudeAgentSDK({useLocalAuth: true})
  │    └─ 不存在 → 显示 onboarding：「在终端运行 `claude login`」+ 重试按钮
  └─ 不持有 API key，不出现"填 key"输入框
```

- 设置面板里**不**提供 API key 输入选项（避免诱导新手做错决策）
- 如果未来需要支持 API key 用户：作为 CLI 启动 flag `--api-key-env=ANTHROPIC_API_KEY`，不暴露 UI

---

## 7. 文件结构（项目运行时）

```
~/Documents/Hyperstudio/projects/morning-coffee-vlog/   # 用户自选位置
├── index.html                       # ← 真理源（Hyperframes 主合成）
├── compositions/
├── assets/
│   ├── source/                       # 原始素材
│   ├── proxy/                        # 540p H.264 proxy（按需生成）
│   └── audio/
├── hyperframes.json                  # Hyperframes 配置
├── meta.json
├── package.json                      # 包含 hyperframes 版本
├── transcript.json                   # whisper 转录（可选）
├── renders/                          # mp4 输出
├── .thumbnails/                      # ← Hyperframes 既有约定
├── .waveform-cache/                  # ← Hyperframes 既有约定
└── .hyperstudio/                     # ← 我们的 sidecar，可删
    ├── project.json                  # track 命名/颜色/最近 zoom
    ├── undo.log                      # 崩溃恢复
    └── cache/                        # 我们的额外缓存
```

**别动**已有的 `.thumbnails/` 和 `.waveform-cache/` 命名约定（my-video 已经在用）。Hyperstudio 自己的缓存放到 `.hyperstudio/cache/`。

---

## 8. 性能预算

| 指标 | 目标 | 实现策略 |
|---|---|---|
| 项目打开 | < 2s | 并行：parse HTML + 扫 assets + 加载 sidecar |
| 拖拽 clip 视觉响应 | < 50ms | DOM transform，乐观更新，preview 后写文件 |
| proxy 重渲（5s 段） | < 1s | Hyperframes 增量 render；Phase 2 才上 |
| 完整 render 78s | < 90s | 与 Hyperframes 当前性能持平 |
| Claude 首响应 | < 3s | streaming，tool result 早返 |
| 内存常驻 | < 600MB | iframe 共享一个 Chromium 渲染上下文 |

---

## 9. 其余决策（pre-spec §10）

| # | 题目 | 决策 | 理由 |
|---|---|---|---|
| 1 | 桌面壳 | Electron | §2.1 |
| 2 | 数据模型 | A | §3 |
| 3 | 时间线 | DOM + SVG | §2.4 |
| 4 | 预览 | iframe → proxy 可选 | §2.5 |
| 5 | Undo | 快照 → event sourcing | §3.4 |
| 6 | Hyperframes 耦合 | **pin minor**（`hyperframes@~0.5.7`）| 现有 my-video 即此版本；不锁死 patch 让 bugfix 自动进来；major bump 走 Hyperstudio 兼容性测试 |
| 7 | 自动 proxy | **按需**（trim 边界后台生成；不在导入即生成） | 大文件用户不愿等；Phase 2 用户可在设置里开"导入即生成" |
| 8 | 缓存 | 缩略图/波形/proxy 放各自既有目录；mtime + 文件 sha 双校验失效 | 与 Hyperframes 约定保持兼容 |
| 9 | 错误处理 | `ToolResult.ok=false` + `hint`；Claude 看到 `error+hint` 自行决定重试；UI 起 toast；3 次失败禁用 retry | 见 §5.1 |
| 10 | 测试 | unit (vitest, core) + golden HTML diff (ops) + Playwright e2e (renderer) + 视频帧对比放到 nightly 单独 job | 视频 diff 在 PR 跑慢，放 nightly |

---

## 10. 与 HeyGen / Hyperframes 协调清单

需要在动手前 / 早期对接的事项：

1. **`hyperframes preview` 的 postMessage 协议** —— 是否暴露 `seek/play/pause/time` 消息？若无，先在 Hyperstudio 端注入 client.js polyfill，并提 PR 上游
2. **`hyperframes inspect --json` 的 schema 稳定性** —— 我们解析它得到 fps/duration/asset 引用；建议加入 hyperframes JSON schema 文档化
3. **CLI 增量 build 钩子** —— Hyperstudio 改 index.html 后，preview 是否能局部 hot-reload 而不重新挂载？影响"拖拽响应 < 50ms"目标
4. **缓存目录约定** —— 让 Hyperframes 在 docs 里正式声明 `.thumbnails/` 和 `.waveform-cache/` 是 framework-owned，避免我们后续误清理
5. **Track index 语义** —— 询问是否有计划把"a-roll/b-roll/caption"这种语义加入框架本身（如 `data-track-kind`），避免每个工具各搞一套映射
6. **MIT 协议兼容** —— Hyperframes 已 MIT，确认 skills（`heygen-com/hyperframes/skills/*`）也是 MIT 或兼容
7. **logo / 品牌** —— `hyperstudio.dev` 这个名字是否需要和 HeyGen 知会（Hyperframes 是他们的开源项目）

> **暂不阻塞**：1、3 在 Phase 0 就需要明确；其余可并行推进。

---

## 11. Phase 划分与实施清单

### Phase 0 — PoC 骨架（目标：1 周）

**能力**：能打开一个 Hyperframes 项目；3-pane 静态 UI + iframe 预览；Claude chat 能跑（无 tool）；`Cmd+Q` 不崩。

| # | 文件/任务 | 说明 |
|---|---|---|
| 0.1 | `pnpm-workspace.yaml` + 各包 `package.json` | 起 monorepo |
| 0.2 | `apps/desktop/electron/main.ts` | 单窗口；加载 dev server / dist |
| 0.3 | `apps/desktop/electron/preload.ts` | `hs.fs.openProject(path)` 一条 IPC |
| 0.4 | `apps/desktop/src/main.tsx` + `App.tsx` | Moss 主题 CSS 变量先打通 |
| 0.5 | `apps/desktop/src/components/TopBar.tsx` | 对照 hs-app.jsx |
| 0.6 | `apps/desktop/src/components/LeftRail.tsx` | 三个 tab，先静态 |
| 0.7 | `apps/desktop/src/components/PlayerStage.tsx` | iframe → `npx hyperframes preview` 的 URL |
| 0.8 | `packages/hyperframes-client/src/cli.ts` | `spawn('npx', ['hyperframes', 'preview'])`；探测 stdout 拿 port |
| 0.9 | `packages/agent/src/index.ts` | 初始化 Claude Agent SDK，本地 OAuth；无 tool 注册 |
| 0.10 | `apps/desktop/src/components/ChatPanel.tsx` | message list + composer；UI 跑通，content 走 IPC |

**完成判据**：打开 `Projects/my-video` 能看到 player 跑起来，能和 Claude 对话（无副作用）。

### Phase 1 — 完整工作台（目标：3 周）

**能力**：Phase 1 全部 tools 可用；时间线可拖拽/修剪/切分；undo 完整；render 走通。

| # | 任务 | 输出 |
|---|---|---|
| 1.1 | `packages/core/src/parser/html.ts` | `parseProject(root) → ProjectState` |
| 1.2 | `packages/core/src/ops/*.ts` | 11 个 Phase 1 op，每个含 schema + compute + apply |
| 1.3 | `packages/core/src/reducer.ts` | `applyOp` + tmp/rename 原子写 |
| 1.4 | `packages/core/src/undo.ts` | snapshot 实现 |
| 1.5 | `packages/core/tests/*.test.ts` | 每个 op 至少 1 个 golden HTML test |
| 1.6 | `packages/agent/src/tools/*.ts` | 11 个 tool 注册到 Agent SDK |
| 1.7 | `apps/desktop/src/components/Timeline/*.tsx` | ruler + tracks + clips + playhead + zoom slider + dnd-kit 拖拽 |
| 1.8 | `apps/desktop/src/components/MediaLibrary.tsx` | 网格 + drop zone + import_asset 接入 |
| 1.9 | `apps/desktop/src/components/AudioLibrary.tsx` | 波形 + 播放 |
| 1.10 | `apps/desktop/src/store/*.ts` | Zustand slices：project / chat / claude / ui |
| 1.11 | `apps/desktop/src/state-overlays/` | StatePill / RenderingStage / DeleteCascadeModal / OfflineBanner 对照 hs-states.jsx |
| 1.12 | `apps/desktop/src/hooks/useChokidar.ts` | 外部修改 toast + 重读 |
| 1.13 | `packages/hyperframes-client/src/preview.ts` | postMessage 双向 + reconnect |
| 1.14 | `electron-builder.yml` | macOS arm64 + x64 dmg 出包 |

**完成判据**：把 my-video 项目里的"晃动镜头"通过 chat 删掉；拖动 trim 一个 clip；render 出新 mp4，与 `npm run render` 等价。

### Phase 2 — AI 建议层（目标：2 周）

| # | 任务 |
|---|---|
| 2.1 | `analyze_timeline` tool — 调 `hyperframes inspect --json` + 简单 heuristics |
| 2.2 | `suggest_b_roll_moments` / `suggest_text_emphasis` |
| 2.3 | `detect_silences` / `detect_shaky_segments`（ffmpeg + 简易光流） |
| 2.4 | Chat 中"Review video"按钮 + 时间戳跳转 |
| 2.5 | proxy mp4 增量生成 + player sub-header "proxy · 540p" 切换 |
| 2.6 | event-sourcing undo |

### Phase 3+

| 阶段 | 主题 |
|---|---|
| 3 | 多项目管理、模板库（社区可贡献模板） |
| 4 | Windows/Linux 打包；自动更新；社区分享模板 |

---

## 12. 风险与待解决问题

| 风险 | 影响 | 缓解 |
|---|---|---|
| `hyperframes preview` 缺 postMessage 协议 | iframe 同步靠 hack | Phase 0 先确认；缺则注入 client.js + 提 PR |
| 大项目（>500 clip）首屏解析慢 | "项目打开 < 2s" 不达标 | parse worker thread + 缓存 AST 到 `.hyperstudio/cache/parse.json`，mtime 失效 |
| 用户已用 CLI 改 HTML 时 Hyperstudio 在写 | 文件冲突 | mtime 检测 + 写前再读校验 + 冲突时弹"reload from disk vs keep memory" |
| chokidar 在 macOS 上对中文路径不稳 | 部分项目监听不到变化 | fallback 到轮询（fsevents 已涵盖，但留 escape） |
| Claude OAuth token 过期 | chat 突然失效 | 监听 SDK 错误，提示用户 `claude login` 续期 |
| Render 卡死或 OOM | 应用无响应 | render 走子进程；可 cancel；进度通过 stdout 行解析 |

---

## 13. 开发约定

- **格式**：Prettier + ESLint flat config，pre-commit 用 lint-staged
- **类型**：strict TS；`packages/core` 禁止依赖 React/Electron
- **测试**：`packages/core` 必须 ≥ 80% 覆盖；其他包不强制
- **提交**：Conventional Commits（`feat:`, `fix:`, `chore:` 等），release-please 自动生成 CHANGELOG
- **PR**：每个 PR 在 description 标 phase（`P1.7`）和 design-handoff 对应区域

---

## 14. 下一步

1. 你确认本 spec（或挑出要改的部分）
2. 我开 Phase 0 工单：`pnpm init` + monorepo 骨架 + 一个能跑起来的空 Electron 窗口
3. 同步给 HeyGen §10 第 1、3 项

如果整体 OK，我就开始 Phase 0.1–0.4 的搭骨架；如果你要先和 Claude Design / HeyGen 同步，告诉我等多久。
