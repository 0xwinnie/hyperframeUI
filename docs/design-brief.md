# Hyperstudio — UI Design Brief

> 这份文档给 Claude Design 用，目标是产出 UI 高保真稿 + 组件 spec。
> 域名：**hyperstudio.dev** · 仓库：待建（GitHub 开源 MIT）

---

## 1. 项目背景

Hyperstudio 是 [Hyperframes](https://github.com/heygen-com/hyperframes)（开源 HTML 视频渲染框架）的本地桌面前端，目标是让"人类 + AI agent"协作剪辑视频时更顺滑。

Hyperframes 的核心是：视频用 HTML 写，`npm run dev` 出实时预览，`npm run render` 出 mp4。它当前只有一个 Studio 预览页（localhost:3002），缺一个工作台。我们要造的就是这个工作台。

## 2. 产品定位

| 是什么 | 不是什么 |
|---|---|
| Hyperframes 的前端工作台 | 另一个剪辑器（不和 Premiere/DaVinci/CapCut 竞争）|
| 人类 ↔ AI agent 的协作界面 | 一个聊天机器人套壳 |
| 本地工具（视频不离开电脑） | SaaS / 云端工具 |
| 自动化优先，UI 减少摩擦 | "鼠标重度依赖"的传统 NLE |

## 3. 目标用户

- 个人 vlogger / 内容创作者，会用 Claude Code 之类的 AI 工具
- 不愿意学 Premiere，但需要比 CapCut 更可控的输出
- 看重"对 AI 说一句话就能改剪辑"的工作流

## 4. 布局结构（核心）

整体借鉴 CapCut（剪映）布局逻辑，**深色主题**：

```
┌─────────────────────────────────────────────────────────────┐
│  Top Bar: 项目名 / 渲染按钮 / 状态指示                       │
├──────────┬──────────────────────────┬─────────────────────┤
│          │                          │                      │
│  AGENT   │      VIDEO PLAYER        │    ASSETS PANEL      │
│  CHAT    │                          │                      │
│          │   (Hyperframes preview   │   - Asset library    │
│  (Claude │    embedded as iframe    │   - Drag to import   │
│   conv.) │    or direct render)     │   - Delete asset     │
│          │                          │   - Thumbnails       │
│  ~280px  │      flexible            │      ~320px          │
│          │                          │                      │
├──────────┴──────────────────────────┴─────────────────────┤
│                                                             │
│   TIMELINE (multi-track, drag/cut/move, scrubber)          │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│   A-Roll:  ▒▒▒▒▒░░▒▒▒▒▒▒░░▒▒▒░░▒▒▒▒▒▒▒▒▒▒                 │
│   B-Roll:  ░░░░░░░░░░▒▒▒▒░░░░░░░░░▒▒▒▒░░░░                 │
│   Captions: ▓▓ ▓▓▓ ▓ ▓▓▓▓ ▓▓ ▓▓ ▓▓▓▓▓▓ ▓▓ ▓                │
│   BGM:     ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                 │
│                                                             │
│   ~30% 高                                                   │
└─────────────────────────────────────────────────────────────┘
```

## 5. 三个上排面板细节

### 5.1 Left: Agent Chat（~280px 宽）

- Claude 对话流（自上而下）
- 用户输入框（多行，`Cmd+Enter` 发送）
- Claude 的 tool call 用 collapsible 卡片展示（默认折叠，点开看参数）
- 每条 Claude 回复下方有「采纳」「撤回」按钮（可选）
- 顶部一个"清除上下文"按钮

### 5.2 Center: Video Player

- 大区域，主视觉
- 9:16 / 16:9 / 1:1 三种画幅自适应居中
- 下方：播放/暂停、当前时间 / 总时长、音量、全屏、画幅切换
- 渲染时显示进度环（占据整个 player 区）

### 5.3 Right: Assets Panel（~320px 宽）

- Tab 切换：素材 / 字幕 / 片头片尾 / 项目设置
- 素材 Tab：
  - 拖拽区（drop zone）顶部
  - 缩略图网格（视频 = 第一帧 + 时长徽章；音频 = 波形）
  - 右键菜单：重命名 / 删除 / 复制路径
- 字幕 Tab：
  - SRT 风格列表，可点击跳转、双击编辑文字
  - 每条字幕状态徽章：✓ 同步 / ⚠ 出错 / 🆕 新增

## 6. 时间线（下方）

CapCut 风格，但是简化：

- 最多 4 个 track：A-Roll / B-Roll / Captions / BGM
- 每个 clip 是一个带缩略图（视频）或波形（音频）的色块
- 操作：
  - **拖动 clip** → 移到不同位置 / 不同 track
  - **拖动 clip 两端** → 修剪 in/out
  - **右键 clip** → 切分 / 删除 / 复制 / 速度
  - **scrubber**（红色竖线）跟随播放头
  - **缩放滑块** 控制时间线缩放（5s 全屏 ↔ 整片全览）
- 当 Claude 在改时间线，对应 clip 短暂高亮发光

## 7. 5 个核心 user story

### Story 1: 通过对话剪辑

> 用户：「把 30 秒处那段晃动的删掉」
> Claude（左侧）：分析中... 调用 `cut_segment(30.2, 32.1)` ✓
> 视频面板：自动 reload，跳到 28s 给用户预览新接缝
> 时间线：A-Roll 上对应段落消失，旁边段自动接拢

### Story 2: 直接拖拽剪辑

> 用户：在时间线拖 A-Roll 一段 clip 的右端，缩短 0.5s
> 系统：实时显示新时间，松手后触发 Hyperframes 重渲 proxy
> 视频面板：~1s 后更新

### Story 3: 删字幕同步删段

> 用户：右键字幕"也有可能是可以 AI"→ 删除并同步删视频段
> 系统：弹确认框 "也会删除 0:00-0:02 段视频，确认？"
> 确认后：字幕 + A-Roll 对应段同时删除

### Story 4: AI 给优化建议

> 用户：点工具栏「让 AI 看一遍」按钮
> Claude：扫描完成，在 chat 里列出 5 条建议（带时间戳跳转）
>   - "30-35s 你举杯特写，建议加 B-roll 切到食物"
>   - "47s 那句'我让他少了糖'语气重，建议加文字动画强调"
>   - ...
> 用户点某条 → 时间线跳到那个位置 → 一键采纳

### Story 5: 素材管理

> 用户：把一个新 mp4 拖进右侧 Assets 面板
> 系统：自动复制到 `project/assets/` + 生成缩略图 + 探测元数据
> 用户：在 chat 里说"把这个加在 25 秒处当 B-roll"
> Claude：调 `add_clip(asset, track="b-roll", time=25)`，时间线出现新 clip

## 8. 视觉参考 / 美学方向

**主参考**：CapCut（剪映）桌面版 — 深色背景、卡片化、紧凑、信息密度高

**色调**：

- 背景 `#0e0f12` → `#1a1b1f`
- 卡片 `#232428`
- 主文字 `#f0f0f2`
- 次要文字 `#8d8e92`
- 强调色 / 高亮 `#ffd166`（暖黄，避免常见蓝紫）
- 危险操作 `#e85d4d`

**字体**：

- UI：Inter / SF Pro
- 中文：PingFang SC / Hiragino Sans GB
- 时间码 / 代码：JetBrains Mono

**视觉气质要点**：

- 大量留白和呼吸感（不像 Premiere 那种"按钮地狱"）
- 暖色高亮替代蓝色 → 拉开和"传统 dev tool"的距离
- Claude 的 tool call 视觉用"Loom 那种工艺感卡片"，不是终端 console

## 9. 关键交互细节（容易做错的地方）

⚠️ 别做：

- Claude chat 用全屏 modal（破坏并行工作流）
- 时间线不可缩放（短视频里 0.1s 调整很常见）
- 拖拽必须等渲染完成（卡顿感重）

✓ 一定要做：

- Claude 正在调用工具时，被影响的 UI 元素（clip / caption）给个 pulse 高亮
- 撤销 / 重做（`Cmd+Z`）覆盖**所有**修改，包括 Claude 改的
- 大文件导入时显示后台进度（不阻塞 UI）
- 离线状态下，UI 不崩，仅 Claude chat 灰掉 + 提示"未联网"

## 10. 你需要交付的内容

1. **主界面高保真**（默认状态：项目已打开，有视频和字幕）
2. **空状态**（项目刚创建，只有 chat 引导）
3. **渲染中**（player 区被进度环占据）
4. **Claude 正在工作**（tool call 卡片展开 + 时间线 pulse）
5. **关键弹窗**：删除确认、设置面板、渲染参数
6. **Light mode**（可选，深色为主）
7. 一份组件 spec：颜色、间距、字号、圆角、阴影、动效时长

文件格式：Figma 链接最佳，或 PNG + 简单 `spec.md`。
