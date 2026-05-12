# Hyperstudio — Pre-Spec Outline

> 这份文档给 Claude AI 完善成完整 spec，最终交给 Claude Code 实现。
> 域名：**hyperstudio.dev** · License：MIT

---

## 1. 项目定位

参见 [design-brief.md](./design-brief.md) 第 1-2 节。简言之：

**Hyperstudio 是 Hyperframes 的本地前端，让 Claude 和人类共同剪辑同一份视频项目。**

## 2. 架构概览（已确定）

### 应用层

- Electron 或 Tauri（待选，见 §3.1）
- 内置 Claude chat 面板（用 `@anthropic-ai/claude-agent-sdk`）
- 内置 Hyperframes Studio 作为预览（iframe 或直接嵌渲染层）

### 后端层（本机）

- Python FastAPI（或 Node Express）暴露 tool API
- 包装现有 Hyperframes CLI + 我们写的 build scripts
- 监听文件变化驱动 UI 刷新

### 数据层

- 项目即一个文件夹（兼容 Hyperframes 现有项目结构）
- 单一真理源：选项见 §4

### 认证层

- Claude 调用走 `claude-agent-sdk`
- 复用本机 `~/.claude/` OAuth 凭据（用户需先 `claude login`）
- 应用本身**不**持有 Anthropic API key

## 3. 技术栈待决定

请评估并给出推荐 + 理由：

### 3.1 桌面壳

- [ ] **Tauri**（Rust 后端、~10MB 包、性能好、生态较新）
- [ ] **Electron**（Node 后端、~100MB 包、生态成熟）
- [ ] **纯 Web app**（localhost:port，要求用户开浏览器）

### 3.2 前端框架

- [ ] React + Vite
- [ ] Vue 3 + Vite
- [ ] Svelte

### 3.3 状态管理

- [ ] Zustand（轻）
- [ ] Redux Toolkit（重但完整）
- [ ] 直接订阅文件变化（无中央 store）

### 3.4 时间线 UI

- [ ] 自己用 SVG + drag handlers 画
- [ ] 复用 OSS 库（如 react-timeline-editor、vidstack、timeline.js）
- [ ] Canvas 重新实现（性能最好）

### 3.5 视频预览

- [ ] iframe 嵌 Hyperframes Studio（最快）
- [ ] 自己实现 multi-track HTML5 video 合成（最准）
- [ ] 调用 Hyperframes 不断生成 low-res proxy（折中）

## 4. 数据模型（关键决策）

### 选项 A: 复用 Hyperframes 现有文件

- 真理源 = `index.html` + `keep_ranges_final.txt` + `captions.srt` + `assets/`
- 前端解析这些文件得到 UI 状态
- ✅ 优点：跟 Hyperframes 100% 兼容，CLI 用户也能编辑
- ❌ 缺点：把 HTML 当数据库，解析容易出错

### 选项 B: 新增 project.json 作为真理源

```json
{
  "version": 1,
  "source_files": ["..."],
  "tracks": {
    "a_roll": [
      { "id": "c1", "src": "...", "in": 0, "out": 4.65, "at": 0 }
    ],
    "b_roll": [],
    "captions": [
      { "id": "cap0", "text": "...", "start": 0, "end": 1.98 }
    ],
    "bgm": []
  },
  "intro": { "title": "奶茶日记", "date": "2026·05·12" },
  "outro": { "text": "End", "fade_duration": 1.4 },
  "render": {
    "fps": 30,
    "quality": "standard",
    "resolution": "1080x1080"
  }
}
```

- 编辑 → 改 `project.json` → 工具生成对应 Hyperframes 文件 → render
- ✅ 优点：清晰结构、好序列化、好做 undo
- ❌ 缺点：需要 `project.json` ↔ Hyperframes 文件的双向同步

**请评估后推荐选 A 还是 B。**

## 5. Tool Surface（Claude 能调用的函数）

### 最小集（Phase 1）

| Tool | 参数 | 返回 |
|---|---|---|
| `read_project_state` | - | 整份项目状态 JSON |
| `cut_segment` | `start, end, track` | 新状态 |
| `move_clip` | `clip_id, new_track, new_at` | 新状态 |
| `trim_clip` | `clip_id, in, out` | 新状态 |
| `add_clip` | `asset_path, track, at, duration?` | 新状态 + clip_id |
| `delete_clip` | `clip_id, cascade_caption?: bool` | 新状态 |
| `update_caption_text` | `caption_id, new_text` | 新状态 |
| `delete_caption` | `caption_id, cascade_video?: bool` | 新状态 |
| `add_caption` | `text, start, end` | 新状态 + caption_id |
| `rebuild_captions_from_srt` | - | 新状态（已有脚本）|
| `regenerate_rough_cut` | - | 新状态（已有脚本）|
| `transcribe_audio` | `audio_path?, language?` | SRT 路径 |
| `get_thumbnails` | `times: float[]` | base64 PNG 数组 |
| `render` | `output_path?, quality?` | mp4 路径 |
| `lint` | - | 错误列表 |

每个 tool 必须：

- 验证参数
- 返回 mutation 描述（用于 undo）
- 写入 `project.json` + 触发 Hyperframes preview reload

### Phase 2 工具（AI 建议相关，待补全）

请补全，至少包含：

- `analyze_video_pacing` — 找节奏问题
- `suggest_b_roll_moments` — 建议 B-roll 切入点
- `suggest_text_emphasis` — 建议文字强调位置
- ...

## 6. 认证流程

```
应用启动
  ↓
检查 ~/.claude/auth.json 是否存在
  ↓ 存在
  初始化 claude-agent-sdk，启用 chat 面板
  ↓ 不存在
  显示引导：「请先在终端运行 `claude login`」
  完成后点"重试"按钮
```

应用本身：

- 不持有 API key
- 不发送 telemetry（除非用户开）
- 不上传任何视频文件到云端

## 7. 项目文件结构（建议）

```
~/Documents/Hyperstudio/
└── projects/
    └── 我的Vlog/
        ├── project.json          # 真理源
        ├── index.html            # Hyperframes 入口
        ├── assets/
        │   ├── source/           # 原始素材
        │   ├── proxy/            # 自动生成的 H.264 8-bit proxy
        │   └── audio/            # 抽出的音频
        ├── captions.srt
        ├── analysis/             # 检测中间数据
        └── renders/              # 输出
```

## 8. 跨平台 / 路径处理

- macOS-first，但代码层面避免 macOS 特定 API
- 路径用 `path.join`，不硬编码 `/`
- ffmpeg / whisper-cli 用 `which` 找，找不到给出安装提示
- 中文路径必须能用（用户已有 `日常Vlog-练习视频` 这类路径）

## 9. 性能预算

- 项目打开 < 2s
- 拖拽 clip 响应 < 50ms（视觉反馈）
- proxy 重渲（5s 段）< 1s
- 完整 render 78s 视频 < 90s（参考当前 Hyperframes 性能）
- Claude 首响应 < 3s

## 10. 待决策技术问题（请逐项给推荐）

1. **桌面壳**：Tauri vs Electron vs Web app
2. **数据模型**：选项 A vs B
3. **时间线实现**：SVG vs Canvas vs OSS 库
4. **多 track 预览实现**：iframe vs 自渲 vs proxy
5. **撤销实现**：事件溯源 vs 状态快照 vs CRDT
6. **与上游 Hyperframes 的耦合**：pin 版本 vs 多版本兼容 vs fork
7. **自动 proxy 生成**：保存就生成 vs 编辑时按需生成
8. **缓存策略**：缩略图、proxy、转录结果存哪、怎么失效
9. **错误处理**：tool 失败时 Claude 如何看到、如何重试
10. **测试策略**：unit / e2e / golden file（视频 diff）

## 11. 开源 / 协议

- License: **MIT**（与 Hyperframes 兼容性最好）
- 仓库结构：单仓 monorepo（前后端一起）or 拆 frontend/backend
- CI：GitHub Actions + 平台 build matrix
- Release: 先 macOS `.dmg`，跨平台逐步加

## 12. Phase 划分（建议）

- **Phase 0**: PoC web app，1 项目 1 视频，chat + iframe preview + 基础 cut
- **Phase 1**: 完整 3+1 panel UI，所有 Phase 1 工具，单机可用
- **Phase 2**: AI 建议
- **Phase 3**: 多项目管理、模板系统
- **Phase 4**: 跨平台打包、自动更新、社区分享模板 （low 优先级）

---

## 给 Claude AI 的请求

请基于这份 outline 输出完整 spec，重点：

1. 补全 §3.1-3.5、§4、§10 的决策和理由（每个选项的优劣 + 最终推荐）
2. 产出第一个版本的接口定义（OpenAPI 风格或 TypeScript 类型）的 tool schemas
3. 给出 Phase 0/1/2 的具体实施清单（哪些文件、哪些函数、按什么顺序写）
4. 标注哪些部分需要联系 Hyperframes 维护方（HeyGen）协调
