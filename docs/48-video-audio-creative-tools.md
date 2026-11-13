# 48 — 影音／創作 AI 工具評估（7 個 GitHub repo）

> **2026-11-12 核實**。用戶提供 7 個 GitHub repo 連結，逐個用 **GitHub API（2026-11-12 快照）**查 metadata（stars／license／language／description），並按「我哋 SCOUT SYSTEM 棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）」評估啱唔啱用。
> 收錄方式同 [34](34-ai-workflow-tools.md)／[35](35-viral-ai-tools.md) 一致：保留上游連結、授權、限制，唔搬成套 repo 入本倉；**本頁唔新增規則 ID，亦唔代表已安裝或試跑任何外部工具**。
> VoiceStudio／MoneyPrinterTurbo 已喺 [35 §5](35-viral-ai-tools.md#5-暫不採用原因乜時候先得) 錄落「暫不採用」，本頁只更新星數快照＋交叉引用。

## 0. 核實總表（2026-11-12 GitHub API 快照，唔係永久數字）

| # | Repo | ★ | 授權 | 語言 | 係乜 | 核實結果 |
|---|---|---|---|---|---|---|
| 1 | [`jub0t/Concat`](https://github.com/jub0t/Concat) | 17,024 | AGPL-3.0 | Rust | 免費開源本地影片編輯器（macOS／Windows／Linux／Android）；auto-captions、TTS、background removal、MCP server、JSON-RPC API | Beta 階段；有 Paid Sponsors；**AGPL-3.0 強 copyleft** |
| 2 | [`storytold/filmcraft`](https://github.com/storytold/filmcraft) | 18,114 | MIT OR Apache-2.0 | Rust | 開源非線性影片編輯器（純 Rust）；macOS／Windows／Linux＋browser（WebAssembly） | ArtCraft team 出品；** young and moving fast** |
| 3 | [`debpalash/VoiceStudio`](https://github.com/debpalash/VoiceStudio) | 108,807 | AGPL-3.0 | Python | 完全本地 ElevenLabs 替代（克隆／配音／有聲書，646 語言） | **已喺 [35](35-viral-ai-tools.md#5-暫不採用原因乜時候先得) 錄落暫不採用**；星數 102,114→108,807 |
| 4 | [`zhouxiaoka/autoclip`](https://github.com/zhouxiaoka/autoclip) | 10,349 | MIT | Python | 開源 AI 影片剪輯桌面工具；貼連結 → 出短片＋封面＋發布文案，適配抖音／小红书／TikTok／Reels／Shorts | 軟件免費，雲端模型按量計費；有 MCP |
| 5 | [`leemysw/yovoice`](https://github.com/leemysw/yovoice) | 2,172 | Apache-2.0 | TypeScript | 開源本地 AI 音訊工作室（macOS／Windows）；TTS、聲音克隆、带詞歌曲、多軌編曲 | **100% offline，零 API 費** |
| 6 | [`storytold/artcraft`](https://github.com/storytold/artcraft) | 40,768 | MIT OR Apache-2.0 | Rust | "The IDE for artists"——互動式 AI 圖像／影片創作；2D 合成、3D staging、角色 pose、場景構建 | ArtCraft team 出品；** desktop IDE，唔係 web library** |
| 7 | [`harry0703/MoneyPrinterTurbo`](https://github.com/harry0703/MoneyPrinterTurbo) | 142,767 | MIT | Python | AI 短片生成（主題／關鍵字 → 高清短片） | **已喺 [35](35-viral-ai-tools.md#5-暫不採用原因乜時候先得) 錄落暫不採用**；星數 139,887→142,767 |

## 1. 逐個評估

### 1.1 Concat（AGPL-3.0，17,024★）— 唔啱我哋用

- **定位**：本地影片編輯器，auto-captions／TTS／去背／keyframe／4K export；內置 MCP server（`concat --mcp`）同 JSON-RPC API。
- **對我哋**：我哋冇「做影片編輯器」呢個需求；AGPL-3.0 強 copyleft 同 VoiceStudio 同一問題（如果要整合入產品）。MCP server 係亮點，但我哋未有「AI agent 剪片」嘅場景。
- **唔採用原因**：AGPL copyleft + 冇使用場景。**有「AI agent 操控剪片」需求先重估。**

### 1.2 FilmCraft（MIT OR Apache-2.0，18,114★）— 唔啱我哋用

- **定位**：純 Rust 非線性影片編輯器；ArtCraft team 出品；支援 macOS／Windows／Linux＋browser（WASM）。
- **對我哋**：同 Concat 一樣，我哋冇做影片編輯器嘅需求。授權比 Concat 寛鬆（MIT OR Apache-2.0），但用途唔啱。
- **唔採用原因**：冇使用場景。**如果要喺瀏覽器入面做影片編輯先重估**（WASM 路線有技術興趣，但唔係我哋嘅產品方向）。

### 1.3 VoiceStudio（AGPL-3.0，108,807★）— 維持原判

- 已喺 [35 §4](35-viral-ai-tools.md#4-維持原判本輪只更新星數快照) 錄落「暫不採用」。
- **星數更新**：102,114→108,807（2026-11-06→2026-11-12）。
- **維持原判**：AGPL copyleft＋聲音克隆同意問題（PDPO／[A12](03-security.md)）；粵語聲音繼續用 [34 §5](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件) VoxCPM2。

### 1.4 AutoClip（MIT，10,349★）— 唔啱我哋用

- **定位**：貼連結 → 選平台 → 自動剪短片＋字幕＋封面＋發布文案；適配抖音／小红书／TikTok／Reels／Shorts／B 站／YouTube；軟件免費，**雲端模型按量計費**；有 MCP。
- **對我哋**：我哋嘅產品係 Scout 工具（遊戲／徽章／追蹤），唔係 short-video content creation。雲端模型按量計費＝成本不可控（同 S1 瘦身精神有少少衝突）。
- **唔採用原因**：冇使用場景 + 雲端模型按量計費。**如果將來要出「Scout 活動回顧短片」可以先試**（MIT 授權冇問題）。

### 1.5 yovoice（Apache-2.0，2,172★）— 唔啱我哋用

- **定位**：開源本地 AI 音訊工作室（macOS／Windows）；TTS、聲音克隆、带詞歌曲、多軌編曲；**100% offline，零 API 費**。
- **對我哋**：我哋已有 VoxCPM2 做粵語 TTS（[34 §5](34-ai-workflow-tools.md)）。yovoice 係 macOS／Windows **桌面 app**，唔係可以整合入 web app 嘅 library。星數偏低（2,172★）。
- **唔採用原因**：已有 TTS 方案（VoxCPM2）+ 桌面 app 唔係 web 依賴。**如果將來要「離線音訊工作室」類產品先重估**（Apache-2.0 授權冇問題）。

### 1.6 ArtCraft（MIT OR Apache-2.0，40,768★）— 可試（唔係產品依賴，係內容製作工具）

- **定位**：「The IDE for artists」——互動式 AI 圖像／影片創作；2D 合成、3D staging、角色 pose、場景構建、image-to-video；可選不同模型。
- **對我哋**：我哋有 [docs/16](16-canvas-case-scout-comic.md) 童軍漫畫生成器（Gemini Canvas 路線）。ArtCraft 可以做更複雜嘅視覺合成（3D 場景、角色一致性），但佢係 **desktop IDE**，唔係可以整合入我哋 web app 嘅 library。MIT OR Apache-2.0 授權冇問題。
- **可試原因**：如果將來要做「Scout 宣傳片」「活動海報」「漫畫分鏡」呢類需要 3D／角色一致性嘅視覺內容，可以試 ArtCraft 出素材，再用我哋 Gemini Canvas 路線做最終產物。**未實測**。
- **同族**：同一個 ArtCraft 家族嘅 [`storytold/effectcraft`](https://github.com/storytold/effectcraft)（動態圖形／合成，8,698★）已喺 [49 §2.4](49-design-skills-studio-dotfiles-effectcraft.md) 評審，判「有場景先試」；本頁唔重複。

### 1.7 MoneyPrinterTurbo（MIT，142,767★）— 維持原判

- 已喺 [35 §5](35-viral-ai-tools.md#5-暫不採用原因乜時候先得) 錄落「暫不採用」。
- **星數更新**：139,887→142,767（2026-11-06→2026-11-12）。
- **維持原判**：自動匹配素材＋BGM → 幾乎必撞 [W](12-copyright-scout-system.md) 版權（庫存片／音樂來源唔明）；寧願揀 [35 §3.1](35-viral-ai-tools.md#3-有場景先試試完記錄唔好裝為裝) HyperFrames 路線。

## 2. 總結

| 工具 | ★ | 授權 | 判決 |
|---|---|---|---|
| Concat | 17,024 | AGPL-3.0 | 唔啱我哋用 |
| FilmCraft | 18,114 | MIT OR Apache-2.0 | 唔啱我哋用 |
| VoiceStudio | 108,807 | AGPL-3.0 | 維持原判（唔啱） |
| AutoClip | 10,349 | MIT | 唔啱我哋用 |
| yovoice | 2,172 | Apache-2.0 | 唔啱我哋用 |
| ArtCraft | 40,768 | MIT OR Apache-2.0 | **可試**（唔係產品依賴，係內容製作工具；未實測） |
| MoneyPrinterTurbo | 142,767 | MIT | 維持原判（唔啱） |

**一句結論**：7 個入面，5 個唔啱我哋用（冇使用場景或授權問題），1 個維持原判（VoiceStudio），1 個維持原判（MoneyPrinterTurbo），1 個（ArtCraft）有興趣但未實測——唔係產品依賴，係內容製作工具，有具體場景先試。

## 3. 查證限制／維護

- **已做**（2026-11-12）：GitHub API 逐個查 7 個 repo 嘅 metadata（stars／forks／license／language／description／archived／fork）；讀 Concat／FilmCraft／AutoClip／yovoice／ArtCraft README（至少各 30–60 行）；核實 FilmCraft／ArtCraft 為 MIT OR Apache-2.0 雙授權（LICENSE-MIT＋LICENSE-APACHE 兩檔）。
- **未做**：未安裝、未執行任何工具；未開 ArtCraft 嘅 getartcraft.com 官網；未核實 AutoClip 嘅雲端模型計費細節；未對照 yovoice 同 VoxCPM2 嘅功能差異；未喺任何 app repo 實裝。
- **星數會變**：引用前重查；跨 repo 對比星數唔代表品質（MoneyPrinterTurbo 142k★ 但版權唔啱我哋，yovoice 2k★ 但方向啱）。
- **更新時機**：真正採用前、上游大改版後、引用星數前；更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。
- **單一入口**：PPT／語音／Reverse API／`grill-me` 去 [34](34-ai-workflow-tools.md)；爆紅清單核實去 [35](35-viral-ai-tools.md)；本頁只放「影音／創作 AI 工具評估」，唔複製其他功能表。
