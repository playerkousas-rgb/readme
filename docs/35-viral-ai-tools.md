# 35 — 2026-11 爆紅 AI 工具核實（動態／方法論／懶人包／Edge／廣東話填詞）

> 呢份管用戶提供嘅**第 2 份爆紅清單**（「AI動畫／網頁動態」「AI編程工作流／方法論」「GitHub爆紅AI工具懶人包」「Edge AI／本地大模型」「AI實用工具 — 音樂與辦公室」五類，共 14 個位）：逐項用 **GitHub API（2026-11-06 快照）**核實 repo／星數／授權，並按「我哋 SCOUT SYSTEM 棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）」評估邊個啱用。
> 收錄方式同 [34](34-ai-workflow-tools.md) 一致：保留上游連結、授權、限制，唔搬成套 repo 入本倉；**本頁唔新增規則 ID，亦唔代表已安裝或試跑任何外部工具**。配色／PPT／語音／Reverse API／`grill-me` 見 [34](34-ai-workflow-tools.md)；Skill 治理見 [29](29-reading-map.md)；設計資源見 [23](23-design-resources.md)。
>
> **2026-11-06 跟進採用（「啱嘅先用」）**：新增 promoted skill [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md)（GSAP＋scroll 術語＋Motion Prompt 編號嘅本地合成入口）同 external 原文 [`motion-prompt`](../templates/repo-starter/skills/external/motion-prompt/SKILL.md)（verbatim，commit `7819d38`，MIT，含 CLI script）。兩份已入起手包目錄＋`AGENTS.md` 開工順序；gsap-skills 不 vendor（87KB、8 份，上游官方 source 為準）。pstack 維持「讀，唔裝」。

## 0. 核實總表（2026-11-06 GitHub API 快照，唔係永久數字）

| 貼文位 | 項目 | Repo（入口） | ★ | 授權 | 核實結果 |
|---|---|---|---|---|---|
| #1 | Motion Prompt | [showheyohtaki/motion-prompt](https://github.com/showheyohtaki/motion-prompt) | 1,312 | MIT | **自帶 8 類 × 24 = 192 個編號**（001–192），原 repo 已有繁體中文 packs；貼文嘅 liunnn1994/motion-prompt 係 fork（55★），唔使另叉 |
| #2-1 | HyperFrames | [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | 79,674 | Apache-2.0 | 「Write HTML. Render video. Built for agents.」；Node ≥22；可 CLI／AI Skills／桌面 Studio |
| #2-2 | GSAP AI Skills | [greensock/gsap-skills](https://github.com/greensock/gsap-skills)（**GreenSock 官方**） | 17,959 | MIT | GSAP 100% 免費（Webflow 收購後所有換 plugins 免費商用，公開 npm 安裝） |
| #2-3 | Pixel2Motion | [nolangz/pixel2motion](https://github.com/nolangz/pixel2motion) | 2,594 | MIT | Logo／光柵圖 → SVG 動畫 → HTML demo＋GIF/MP4 |
| #2-4 | Remotion | [remotion-dev/remotion](https://github.com/remotion-dev/remotion) | 71,099 | **NOASSERTION（Remotion License）** | 唔係開源常見授權：免費額 = 個人／≤3 人公司／非牟利；較大 for-profit 要 Company License |
| #2-5 | Video Shotcraft | [Vincentwei1021/video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) | 17,309 | Apache-2.0 | Claude Code／Codex skill；網站截圖 → 電影感 promo（Remotion 路線） |
| #2-6 | story-to-handdrawn-video | [gnipbao/story-to-handdrawn-video](https://github.com/gnipbao/story-to-handdrawn-video) | 2,378 | MIT | 中文故事 → 手繪日記漫畫靜音 MP4（彩鉛／水墨／白板等風格，Remotion 路線） |
| #2-7 | LottieFiles | [LottieFiles/lottie-player](https://github.com/LottieFiles/lottie-player) 等 | 1,658+ | MIT | 只係 Lottie/dotLottie **播放器**生態；貼文「節奏時序」唔係單一工具 |
| #3-1 | Paperclip | [paperclipai/paperclip](https://github.com/paperclipai/paperclip) | 111,503 | MIT | 「The open-source app everyone uses to manage agents at work」：角色／預算／權限儀表板 |
| #3-2 | MoneyPrinterTurbo | [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 139,887 | MIT | 中文 README 有贊助位（Kimi／火山引擎）；素材自動匹配 → 版權風險 |
| #3-3 | VoiceStudio | [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) | 102,114 | **AGPL-3.0** | 完全本地「ElevenLabs 替代」；646 語言；AGPL copyleft＋聲音同意問題 |
| #3-4 | HyperFrames | 同 #2-1 | — | — | （重複項目，只列一次） |
| #3-5 | Univer | [dream-num/univer](https://github.com/dream-num/univer) | 22,903 | Apache-2.0 | 貼文寫「univerjs/univer」**唔存在**（404）；實為 dream-num/univer |
| #3-6 | Agent-Reach | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | 109,345 | MIT | 「AI 望到 X／Reddit／YouTube／小紅書」；零 API 費＝爬蟲＋ ToS／PDPO 風險 |
| #3-7 | Hindsight | [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) | 59,185 | MIT | agent 長期記憶（vectorize-io 出品；MIT；有 self-host 同雲端兩條路） |
| #4 | Edge0 | [Edge0-AI/Edge0](https://github.com/Edge0-AI/Edge0) | 9,099 | Apache-2.0 | 35B MoE ∼2.5GB RAM 跑（SSD 專家卸載＋Prerouter＋Recover-LoRA）；HF 權重約 23GB（35B）／8B∼4.2GB；Mac／iOS／Android／Windows |
| #5 | 6 個滾動術語 | 非 repo | — | — | Scroll-triggered／Scroll-linked／Parallax／Sticky／Scroll Snap／Horizontal Scroll——**直接可用嘅詞彙，唔使裝** |
| #6 | Cantolyrics AI | 非 GitHub（[cantolyrics.ai](https://cantolyrics.ai)） | — | — | 網站服務：0243 聲調＋主題 → 粵語填詞＋押韻庫；創辦人 song4song._（Jenny Wong） |
| #7 | KAREOKIE | 非 GitHub（[bizmark.hk](http://bizmark.hk)） | — | — | Windows 免費／閉源；AI 去人聲、升降 Key、歌詞對時、QR 排隊；HK 開發 |
| #8 | 自動套公司 PPT 模板 | 非 GitHub（marcorefusestocode） | — | — | 上傳 .pptx 模板＋大綱 → 幾秒出可編輯 PPT；**未核實其條款／私隱／價格** |
| #10 | Taste Skill | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | 110,817 | MIT | [29](29-reading-map.md) 已終評（借概念唔全裝）；本輪星數 107,744→110,817，授權／定位不變 |
| #4↔ | pstack（/pstack） | [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack)（官方路徑 `pstack`）；鏡像 [backnotprop/pstack](https://github.com/backnotprop/pstack) | 15,519（plugins repo）／3,693（鏡像） | MIT（plugin.json＋`pstack/LICENSE`） | Lauren Tan（@poteto，SpaceX AI 首席）；24 條 `principle-*` 原則 skill＋23 playbooks；`/poteto-mode` |

> 影片星數同「本輪核實星數」唔一致嘅（MoneyPrinterTurbo 127k→139,887；VoiceStudio 8.2萬→102,114；Taste Skill 90k→110,817；Hindsight 5.3萬→59,185 等）以本表為準；亦只代表 2026-11-06 當日。

## 1. 按「我哋而家要做乜」揀（先做呢個判斷，唔好裝為裝）

| 你而家要做乜 | 建議入口 | 點解 |
|---|---|---|
| 跟 AI 講清楚動態／鏡頭／網頁動效，唔想再講「有質感啲」 | §2.3 Motion Prompt 編號＋scroll 術語 | 零成本、共享語言；原 repo 自帶繁中 packs |
| 要 AI 幫手寫 GSAP 網頁動畫（單一 HTML／Canvas OK） | §2.2 gsap-skills（官方，MIT） | 官方校正 agent 寫法；GSAP 全免費 |
| 要 agent 直接出「HTML→MP4」介紹片／宣傳片 | §3.1 HyperFrames（候選） | HTML 寫畫面，唔使剪片軟件 |
| 童軍故事／漫畫想變影片（呼應童軍漫畫 v4.2.1） | §3.2 story-to-handdrawn-video（候選） | 中文 → 手繪日記漫畫風；先確認 Remotion 授權資格 |
| 產品截圖 → 電影感 promo | §3.2 Video Shotcraft（候選） | 同上 Remotion 路線 |
| Logo／Icon 想要動態 intro | §3.3 Pixel2Motion（可選） | 同 [33](33-icon-standard.md) 圖標標準配套 |
| 想 agent 施工更嚴謹（bug／refactor／review） | §2.1 pstack 原則（**讀，唔裝**） | 同 瘦身 S／`Subtract Before You Add` 同一信仰 |
| 聲音克隆（粵語） | 繼續用 [34 §5](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件) VoxCPM2 | VoiceStudio（AGPL）唔建議，見 §4 |
| 出 PPT（公司／Scout 模板） | 繼續用 [34 §2](34-ai-workflow-tools.md#2-ppt-master真正有價值係可繼續改唔係一鍵完美) PPT Master 路線 | #8 工具未核實，見 §4 |
| 管理多個 agent（角色／預算／審批） | §5 Paperclip（**暫不採用**） | 未到編制階段 |

**建議次序**：問清楚 → 查現有方案／官方資源 → 真係需要先試工具 → 人手驗收。呢份清單**冇任何一項**應該直接入現有 repo 嘅依賴。

## 2. 值得即時吸收嘅三樣（零安裝，當字典／方法論）

### 2.1 pstack — 同我哋「瘦身 S」係同一個信仰

- **來源**：[`cursor/plugins/tree/main/pstack`](https://github.com/cursor/plugins/tree/main/pstack)（Lauren Tan／@poteto；plugin.json `v0.15.36`；`pstack/LICENSE` 標 MIT）。[backnotprop/pstack](https://github.com/backnotprop/pstack) 係同步鏡像（MIT，3,693★），俾非 Cursor 環境 `npx skills add backnotprop/pstack`；**優先讀上游官方 path**。
- **內容**（上游 skills 目錄實測 2026-11-06）：24 條 `principle-*` 原則 skill——對我哋最有用：`principle-laziness-protocol`、`principle-subtract-before-you-add`、`principle-foundational-thinking`、`principle-fix-root-causes`、`principle-sequence-verifiable-units`、`principle-prove-it-works`、`principle-test-behavior-not-implementation`、`principle-outcome-oriented-execution`、`principle-guard-the-context-window`。23 個 playbooks（feature／bug-fix／refactoring／hillclimb／runtime-forensics…）；主入口 `/poteto-mode`；另有 `/Recall`、`/swarm` 等指令。
- **對我哋**：我哋嘅 瘦身 S、PREFLIGHT「exit 1 即停手」、`final_check` 六角度、F 防呆（fail closed）——同 pstack 嘅 `prove-it-works`／`sequence-verifiable-units`／`subtract-before-you-add` 係同一套工程紀律。**適合嘅姿勢係「讀完抄要義」**：有用嘅原則寫落 PLAYBOOK／AGENTS 嘅用語，維持「單一真理倉」，唔係裝成套 plugin。
- **唔好抄**：多 agent swarm／multi-model 編配（佢預設 grok＋opus 分工）係佢生態；我哋棧唔需要；亦唔係「裝咗就會月產千 PR」。
- **採用（2026-11-06）**：維持「讀，唔裝」；無新增 vendor 檔。24 條 `principle-*` 原文留上游，需要時逐份讀；同 29 讀 taste-skill 同一姿勢。
- **未實測**：本輪只讀 README／plugin.json／skills 目錄；未安裝、未跑 `/poteto-mode`、未對照 24 條原文逐條消化。

### 2.2 GSAP 官方 AI Skills — AI 寫動畫唔使鬥估

- **來源**：[`greensock/gsap-skills`](https://github.com/greensock/gsap-skills)（GreenSock 官方，MIT，17,959★）；Agent Skills 格式，可配 Cursor／Claude Code／Codex／Copilot（40+ agents）。
- **關鍵事實**（官方 README）：**GSAP 100% 免費**——Webflow 收購後所有 GSAP plugins（含 SplitText／MorphSVG 等曾屬 Club GSAP）全免費商用，由公開 npm `gsap` 安裝，唔使 Club membership／`.npmrc`／token。
- **對我哋**：單一 HTML／Gemini Canvas app 要加 UI 動效（卡片入場、ScrollTrigger 故事區塊、Flip 排序動畫），可以喺 prompt 入面指明用 GSAP＋餵此 skill，減少「AI 亂估舊版 API」。GSAP 經 CDN 引入，對 5MB 上限（C13-g）影響細。
- **採用（2026-11-06）**：唔 vendor；`web-motion` 施工要點已寫明「AI 寫 GSAP 先對 greensock/gsap-skills」。未喺任何 app repo 實跑；未對照 GSAP 版本；未量化「裝咗之後 AI 寫 GSAP 正確率」。

### 2.3 Motion Prompt — 跟 AI 講動態，用編號唔好用形容詞

- **來源**：[`showheyohtaki/motion-prompt`](https://github.com/showheyohtaki/motion-prompt)（MIT，1,312★，Shohei Ohtaki，建立 2026-10-14）。8 類 × 24 = **192 個編號名**（`motion` #001–024、`camera` #025–048、`ui` #049–072、`lp` #073–096、`photo` #097–120、`motion2` #121–144、`lp2` #145–168、`camera2` #169–192）。每個名有：**編號＋一句意思＋示例 prompt**；`packs/` 自帶英日西簡繁五語，**已包括繁體中文**（`packs/*/README.zh-Hant.md`）。
- 上游列咗三種用法：① `npx skills add showheyohtaki/motion-prompt` 裝 skill（Claude Code／Codex）② 直接攞編號落 prompt ③ 開 [gallery](https://showheyohtaki.github.io/motion-prompt/) 挑。
- **對我哋**：叫 AI 做網頁／Canvas UI／動效時直接講「motion2 #131 …」呢類精確詞；配合 §6 嘅 scroll 術語，取代「有質感啲／郁流暢啲」呢類無法驗收嘅講法。
- **唔好做**：唔好 fork 後自改編號（失去「共享語言」價值）；示例圖片要署名出處（W8）；粵語／繁體語境有需要可以自己補譯，但要寫入自己嘅 CREDITS。
- **採用（2026-11-06）**：`external/motion-prompt` 已 verbatim vendor 入起手包（commit `7819d38`；`SKILL.md`／`references/porting.md`／`scripts/motion-prompt.mjs`；sha256：`5029cb5d…`／`4c98715d…`／`1c422c72…`），CATALOG 已入目錄；施工指名用法寫入 promoted [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md)。CLI **未實跑**（要網絡）；gallery 喺出站限制下未開過；「144 個」係舊版宣傳，現行係 192。

## 3. 有場景先試（試完記錄，唔好裝為裝）

### 3.1 HyperFrames（[heygen-com/hyperframes](https://github.com/heygen-com/hyperframes)，79,674★，Apache-2.0）

- 定位：HTML＋CSS＋媒體＋可 seek 嘅動畫 → **確定性 MP4**；三個入口：本地 CLI／AI agent skills／託管 authoring；另有免費 Studio 桌面版（Mac／Windows／Linux）。Node ≥22。官方標語「Write HTML. Render video. Built for agents.」。
- **適合場景**：Scout 活動／app 介紹片——用 HTML 寫畫面，agent 出片，唔使碰剪片軟件；出片輸入輸出都可以落檔喺本機。
- **注意**：佢係**出片工具，唔係 app 依賴**，唔好 `npm install` 入任何 app；出片素材（圖／BGM／字體）版權同樣跟 W 鐵律；README 測試數字（RTF 等）本輪未實測。

### 3.2 story-to-handdrawn-video／Video Shotcraft（Remotion 路線）

- [`gnipbao/story-to-handdrawn-video`](https://github.com/gnipbao/story-to-handdrawn-video)（2,378★，MIT）：中文故事文案／圖片 → 3:4 手繪日記漫畫風**靜音** MP4（H.264 畫面軌，方便後期配音／BGM）；彩鉛日記預設＋水墨／兒童蜡筆／白板講解／Zine 拼貼 20 種風格；Remotion 渲染工程。
- [`Vincentwei1021/video-shotcraft`](https://github.com/Vincentwei1021/video-shotcraft)（17,309★，Apache-2.0）：Claude Code／Codex skill；網站截圖／產品畫面 → 電影感 promo（124+ 鏡頭配方卡、beat sync、Motion Workbench、剪映草稿匯出）。
- **對我哋**：童軍訓練故事片／Scout app 介紹片係有想像空間；同 [16](16-canvas-case-scout-comic.md) 童軍漫畫生成器同類素材方向。
- **授權陷阱（重要）**：兩個都係 Remotion 之上——Remotion 本體授權 **NOASSERTION（Remotion License）**：免費額＝**個人／≤3 位員工公司／非牟利／評估用途**；較大 for-profit 公司要 Company License。**童軍非牟利應屬免費額，但採用前必須開 [remotion LICENSE](https://github.com/remotion-dev/remotion/blob/main/LICENSE) 核實資格**，唔好當 MIT 用。

### 3.3 Pixel2Motion（[nolangz/pixel2motion](https://github.com/nolangz/pixel2motion)，2,594★，MIT）

- Logo／光柵圖 → SVG 路徑動畫＋animated HTML demo＋GIF／MP4＋motion QA 證據。對我哋：[33](33-icon-standard.md) 圖標標準出爐後，可以試出「SCOUT SYSTEM」動態 logo 版。可選，未試。

### 3.4 LottieFiles（[LottieFiles/lottie-player](https://github.com/LottieFiles/lottie-player)，1,658★，MIT 等）

- 貼文「LottieFiles：節奏時序」查無此單一工具；實況係 Lottie／dotLottie **播放器生態**（web／Android／RN）。我哋而家**冇**設計師交 Lottie 檔，先記低；真有需要先加 `<lottie-player>`（CDN）入頁面。

## 4. 維持原判（本輪只更新星數快照）

- **Taste Skill**（[Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill)，110,817★，MIT）：[29](29-reading-map.md) 已終評——借「望圖自檢＋frontmatter 檢查核心」唔全裝（Node 22＋Chrome、30–45 分鐘 build、247 站庫 vs 瘦身規矩衝突）。本輪星數 107,744→110,817，授權／定位不變，**唔重做評估**。
- **VoiceStudio**（[debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio)，102,114★，**AGPL-3.0**）：完全本地 ElevenLabs 替代（克隆／設計／配音／有聲書，646 語言）。對要分發產品嘅我哋：AGPL-3.0 係強 copyleft；加上克隆聲音同意（PDPO／[A12](03-security.md)）一樣要處理——**粵語聲音繼續用 [34 §5](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件) VoxCPM2**（Apache-2.0、廣東話支援、同意／AI 標記 checklist 已寫好）。
- **#8 自動套公司 PPT 模板**（marcorefusestocode，非 GitHub）：上傳 .pptx＋大綱 → 幾秒可編輯 PPT、支援 Google Slides；無公開 repo、條款／私隱／價格**未核實**——公司模板／成員資料唔好隨便上傳；如需此功能，[34 §2](34-ai-workflow-tools.md#2-ppt-master真正有價值係可繼續改唔係一鍵完美) PPT Master「Edit Native PPTX」路線已有收貨 checklist，優先用熟；要比較先親訪 marcorefusestocode 核實條款。

## 5. 暫不採用（原因＋乜時候先得）

| 工具 | ★／授權 | 唔採用原因 | 乜時候先得 |
|---|---|---|---|
| Paperclip | 111,503／MIT | 我哋未到多 agent 編制（角色／預算／權限儀表板）；infra 成本＋操作複雜度違反瘦身；一兩個 agent＋真理倉已夠 | 常態化跑 ≥3 個常設 agent、要預算／審批線／權限分級時重估 |
| MoneyPrinterTurbo | 139,887／MIT | 自動匹配素材＋BGM → 幾乎必撞 [W](12-copyright-scout-system.md) 版權（庫存片／音樂來源唔明）；README 贊助位唔代表成片受控 | 純自有／已授權素材＋人手終審先考慮；寧願揀 §3.1 HyperFrames 路線 |
| Agent-Reach | 109,345／MIT | 爬 X／Reddit／YouTube／小紅書＝踩平台 ToS；抓到個人資料＝PDPO 風險；同 [A12](03-security.md) 私隱底線衝突；輸出未必準 | 唔建議入正式流程；要社媒情報用人手＋平台官方 API |
| Edge0 | 9,099／Apache-2.0 | 離線／飛行模式 35B 本地跑先有意義；權重約 23GB 下載；我哋主線係 Gemini Canvas／雲端；stars／ecosystem 仍淺 | 要做「離營零網絡」Scout 訓練 app（iPhone 飛行模式演示錄得起 viral 但非剛需）先重估 |
| Hindsight | 59,185／MIT | 長期記憶 server；我哋嘅 AGENTS／README／docs 本身就係長期記憶；多一個 infra 違反瘦身 | 跨週續做大型多 agent 項目、context 真係成為瓶頸先 |
| Univer | 22,903／Apache-2.0 | 貼文 repo 名寫錯（univerjs/univer → 404；實為 dream-num/univer）；內嵌 Excel 編輯器重，Google Sheets＋GAS 已滿足我哋「Sheet 當 DB」；另有 `dream-num/skills`（79★）做試算表 agent 但我哋未有編輯 Excel 嘅 agent 需求 | 真係要喺 app 內畀用戶直接改 xlsx／協同編輯先試 |

## 6. 非 GitHub 項目（貼文有，非我哋棧）

- **Cantolyrics AI**（[cantolyrics.ai](https://cantolyrics.ai)，創辦人 song4song._／Jenny Wong）：0243 聲調＋主題 → 5 分鐘 3 版粵語填詞＋押韻庫＋K-song／Ballad 風格。**當終端用家服務睇**——童軍營火會填詞可以自己去玩；唔入 repo、唔整合、唔依賴。
- **KAREOKIE**（[bizmark.hk](http://bizmark.hk)）：Windows 免費、閉源；AI 去人聲、自由升降 Key、歌詞自動對時、日文振假名、QR 排隊點歌、即時音準評分、多語系、本地處理保私隱。**營火會 karaoke 可以考慮用**；但非開源、Windows only、唔嵌入我哋任何產品。
- **6 個滾動動畫術語**（#5）：直接攞用——**Scroll-triggered**（入 viewport 觸發）／**Scroll-linked**（同滾動位置綁定，如進度條）／**Parallax**（視差）／**Sticky**（吸頂）／**Scroll Snap**（分頁式吸附）／**Horizontal Scroll**（橫向滾動）。跟 AI 講「Menu 用 Sticky，卡片用 Scroll-triggered」即夠。**已併入起手包 [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md) 速查表；Menu Sticky＋卡片 Scroll-triggered 就係我哋故事頁應該用嘅預設**。
- **#2「7 個 AI 動畫技能」溯源**：GSAP（官方核實 ✓）／HyperFrames（✓ 同 HyperFrames 出片路線相關）／Pixel2Motion／Remotion／Video Shotcraft／story-to-handdrawn／LottieFiles——全部圍住 **GSAP（網頁內動畫）／HyperFrames／Remotion（出片兩條路）** 三個底層生態；**先揀底層路線，再揀 skill**，唔好逐個裝。

## 7. 查證限制／維護

- **已做**（2026-11-06）：GitHub API 逐個查 17 個 repo 嘅 metadata（stars／forks／license／created_at／pushed_at／archived／fork）；讀 pstack README／plugin.json／skills 目錄（24 條 `principle-*` 實證）、motion-prompt README（192／繁中 packs 實證）、gsap-skills README 頭、HyperFrames README 頭＋Node≥22、Remotion LICENSE 頭（Free/Company 兩級實證）、Hindsight／Paperclip／Agent-Reach／MoneyPrinterTurbo／Univer／Edge0 README 頭（至少各 25–50 行）。
- **已做跟進採用（2026-11-06）**：vendor `external/motion-prompt`（verbatim，`sha256` 三檔已記 §2.3）；新增 promoted `web-motion`；起手包 CATALOG／AGENTS／bucket README 同步；`check_skills`／`consistency`／`guard`／`final_check` 全綠。**未實跑** motion-prompt CLI（要網絡）、未喺 app repo 實裝 GSAP、未出過任何動畫。
- **未做**：安裝／執行任何工具；未出過任何片／任何動態 logo；未開 cantolyrics.ai／bizmark.hk／marcorefusestocode／gallery 頁（出站限制＋非 GitHub，**請親身開一次睇條款**）；Remotion「非牟利免費」資格未向官方確認；HyperFrames／Pixel2Motion／Video Shotcraft／story-to-handdrawn 未量化任何輸出。
- **星數會變**：引用前重查；跨 repo 對比星數唔代表品質（Edge0 9k★ 但技術方向啱先得，MoneyPrinterTurbo 140k★ 但版權唔啱我哋）。
- **更新時機**：真正採用前、上游大改版後、引用星數前；更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件檢查通過唔會升級「未實測」狀態。
- **單一入口**：PPT／語音／Reverse API／`grill-me` 去 [34](34-ai-workflow-tools.md)；Skill 治理去 [29](29-reading-map.md)＋[`skills/CATALOG.md`](../templates/repo-starter/skills/CATALOG.md)；設計資源去 [23](23-design-resources.md)；本頁只放「爆紅清單核實」，唔複製其他功能表。

**一句結論**：啱嘅已用——`web-motion`（GSAP 免費、scroll 術語、Motion Prompt 編號）＋ `external/motion-prompt` 已入起手包；pstack 維持「讀，唔裝」；有影片場景先試 HyperFrames／story-to-handdrawn／Pixel2Motion；懶人包入面 100k★ 級嘅 Paperclip／MoneyPrinterTurbo／Agent-Reach／VoiceStudio／Edge0／Hindsight／Univer，**而家全部唔啱我哋**。
