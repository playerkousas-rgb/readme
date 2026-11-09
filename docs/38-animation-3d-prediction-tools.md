# 38 — 動畫／API 目錄／3D 生成／群體模擬核實（Animate UI／ApiVault／MiroFish）

> 呢份管用戶提供嘅**第 5 份爆紅清單**（Animate UI 2.0／apivault.dev／Qwen3.5-4B-3D-Coder／SUAPP AIM／Convertio／MiroFish，共 6 個位）：逐項核實，並按「我哋 SCOUT SYSTEM 棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）」評估邊個啱用。有 GitHub repo 嘅用 **GitHub API（2026-11-06 快照）**核實；冇 repo 嘅網站／模型／商業插件，明寫未核實。
> 收錄方式同 [34](34-ai-workflow-tools.md)–[37](37-ai-tools-design-prompts.md) 一致：**本頁唔新增規則 ID，亦唔代表已安裝或試跑任何外部工具**。網頁動畫主檔係起手包 `web-motion`（見 [35 §2](35-viral-ai-tools.md)）；揀 API 去 [15](15-resource-index.md)（本輪已補 ApiVault 一行）；開新 repo 第 0 步問真人去 [`INTAKE.md`](../templates/repo-starter/INTAKE.md)。
>
> **一句結論先講**：冇一件要即刻裝。最接近「啱用」嘅係 ApiVault——但佢只係**搵 API 嗰陣嘅第二層目錄**，唔取代我哋自己 `api` repo（§3，已入 [15](15-resource-index.md) 快速表）。Animate UI 要有 shadcn／Radix 先用得，而我哋 89 個 repo 而家係 **零個**（§2，2026-11-07 普查更正）；MiroFish 只可以當「假設產生器」，永遠唔當市場證據（§4）；其餘係端用家工具或者未核實嘅觀察名單。

> **2026-11-09 分類入口**：新增參數化實物 CAD 資源 text-to-cad，同一般 3D 場景／浮雕分開；有實物製作場景先試，詳見 [45 §2](45-ui-skills-text-to-cad.md#2-實物設計cad有場景先試)。UI 動效 Skills 亦見 [45](45-ui-skills-text-to-cad.md)。

## 0. 核實總表（2026-11-06 GitHub API 快照／未核實標明）

| 貼文位 | 項目 | 入口 | ★／授權 | 核實結果 |
|---|---|---|---|---|
| #1 | Animate UI 2.0 | [imskyleen/animate-ui](https://github.com/imskyleen/animate-ui)（HEAD `1d00dd0`） | 4,915／**MIT＋Commons Clause**（GitHub 顯示 NOASSERTION 就係呢個混合授權） | CLI 真存在：上游 README 明寫 `npx @animate-ui/cli@latest animate all` 一次過換晒已裝 shadcn component 嘅 primitive；自帶 `audit` 命令（repo 內 `packages/cli/src/commands/audit.ts` 實證）。授權要留意：可用於任何產品，**但唔可以出售／再分發啲 component 本身** |
| #2 | apivault.dev | 站：apivault.dev；repo [exa-studio/ApiVault](https://github.com/exa-studio/ApiVault) | 755／NOASSERTION | 目錄站概念對得上（51 分類、免費公開 API）；但 repo **2024-09 已停更**，站現況／收錄準確度未開站核實。定位：發現工具，唔係真理源 |
| #3 | Qwen3.5-4B-3D-Coder | 查無官方 repo | — | GitHub 只搵到 2026-10-29 嘅 1★ 社群包裝 repo，引住 Ollama tag `maternion/qwen3.5-3d-coder:4b-q8_0`；即係**社群 fine-tune 模型**，唔係 Qwen 官方出品。片講嘅 4,146 訓練例子／60 小時訓練／例子質素全部未核實 |
| #4 | SUAPP AIM（SketchUp 插件） | 商業插件；底層 Hunyuan3D：[Tencent-Hunyuan/Hunyuan3D-2](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) | 15,339／NOASSERTION（騰訊社群授權，採用前睇原文） | 插件本身冇開源 repo、售價／版本未核實；「2D 圖變 3D 浮雕做 CNC」係實體製作工作流，同我哋 web app 棧無關（§5） |
| #5 | Convertio.co | 閉源網站 | — | 未開站核實（出站限制）；線上轉格式工具，重點唔係功能係私隱（§5） |
| #6 | MiroFish | [666ghj/MiroFish](https://github.com/666ghj/MiroFish)（HEAD `7657031`） | 84,468／**AGPL-3.0** | 片講 84k ★ **屬實**（2025-11-26 建立）；架構同上游 README 對得上（種子材料→GraphRAG→大量 agent 人格模擬→預測報告＋可同 agent 對話）。但「預測準唔準」冇任何獨立驗證，README 自承行一次**高消耗**（建議先試少過 40 輪） |

## 1. 按「我哋而家要做乜」揀

| 你而家要做乜 | 建議入口 | 點解 |
|---|---|---|
| 之後開 React／Next 項目兼決定用 shadcn，想成個 app 加動畫 | §2 Animate UI（到時先試） | 要有 `components.json`＋Radix／Base UI／React Aria primitive 先跑到 CLI；我哋現有 89 個 repo 係零個，唔好為佢而轉會 |
| 現有 React app 加動畫 | 沿用各 repo 已有嘅 framer-motion（普查 105 個檔案在用）＋ [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md) 嘅術語／驗收 | 已經在用嘅嘢先係基準，唔好見新工具就成套換 |
| 靜態 HTML/JS／Canvas 加動畫 | [`web-motion`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md)（GSAP＋編號，[35](35-viral-ai-tools.md)） | 靜態嗰 32 個 repo 行呢條線 |
| 搵免費公開 API 砌 app | 自己 [`api` repo](15-resource-index.md) 第一層 → §3 ApiVault 第二層 | 香港 API 我哋自己份先係真理；ApiVault 補全球目錄 |
| 未出產品前想有人「鬧吓」個 idea | §4 MiroFish（試玩姿勢，只出假設清單） | 模擬人格鬧嘅點可能有用，但唔係證據；真人嗰關繼續行 INTAKE |
| 整 3D 場景／浮雕／轉格式 | §5：全部端用家層面，唔入 app | 製作工具同 app 依賴分開；檔案上雲前諗私隱 |

## 2. Animate UI — 要有 shadcn 先用得；而家係零個 repo

- **佢係咩**：將 Radix／Base UI／React Aria 嘅 primitive 預先加好 Motion 動畫，你換 import（或者跑 `npx @animate-ui/cli@latest animate all`）就成個 component 有動畫，唔使逐個手寫。片講嘅「一句 prompt＋一句 CLI」大致屬實——上游仲有自家 `SKILL.md` 畀 agent 用，同埋 `audit` 命令去捉慢／jank 嘅動畫。片講嘅數字（24 種動畫、70+ component）未逐個數，引用前去上游 docs 自己對。
- **同片講法有出入嗰點**：片話佢「鍵盤導航唔做動畫」，但上游 SKILL.md 嘅哲學係 springs 為主、鍵盤同 pointer 一樣處理；真正硬性嗰條係**尊重 `prefers-reduced-motion`**（我哋 `web-motion` 本來就當紅線）。即係話：片嘅「成套規則」方向啱（有 tokens、有 gate、有 audit），細節唔好照抄，要跟返上游文件同我哋驗收。

### 2.1 更正（2026-11-07）：我哋啲 repo 實際係咩形狀

> 上一版寫「Animate UI 只啱 React／shadcn 項目，例如提示站」同埋對外講「我哋主力係單一 HTML/Canvas」，**冇數過 GitHub 就落筆，係錯嘅**。2026-11-07 用 GitHub API 普查 `playerkousas-rgb` 全部 **89 個 repo**（逐個讀根目錄＋`package.json` 依賴；GitHub Code Search 輔助），實情係：

| 形狀（按 `package.json` 依賴判） | 數目 | 代表 |
|---|---:|---|
| React＋Vite 等 | 26 | SCOUTBOOK／CUBSBOOK／ROVERBOOK／VSBOOK／map3d／GEMINI／Veritas 系 |
| Next.js | 9 | prompt／member-portal／troop-portal／dbs 系／cardmaster |
| Vite vanilla | 3 | code／MCScript／Zentangle |
| 靜態 HTML/JS（`package.json` 只做 scripts／test／build） | 25 | HKMAP／hkcamping／scoutbadge／vsmeeting／DRAWSCOUT |
| 純 HTML（冇 `package.json`） | 7 | decode／oneclick-photo／morse-beacon-app／Infographic |
| 文件／其他／Node 工具／攞唔到 | 19 | readme／api／answer／router 系／4 個 portal |
| **shadcn（`components.json`）** | **0** | Code Search 全帳戶 0 個檔案；`radix-ui` 引用 0 個檔案 |
| 動畫現況 | — | `framer-motion` 有 105 個檔案在用（React 線現行路線）；`gsap` 得 5 個檔案；`tailwindcss` 103 個檔案 |

即係：**主力係 React＋Vite（26）同 Next.js（9）打頭、靜態 HTML/JS（合計 32）居次**；單一 HTML／Gemini Canvas 係其中一種交付格式（[09](09-gemini-canvas.md) 管嗰條線），唔係大多數。以後邊個再講「我哋主力係 X」，先數完呢張表先講。

- **咁 Animate UI 仲啱唔啱**：佢 CLI 要靠 `components.json` 搵 shadcn component、再換 Radix／Base UI／React Aria primitive——我哋係零 shadcn、零 Radix，所以**現有冇一個 repo 直接跑到**。要有資格試，要等將來某個 React／Next 項目由零決定用 shadcn嗰日；到時：① 先 `--dry-run` 睇佢改乜，唔好直接 `animate all` 落主 branch；② Commons Clause 睇清——用喺自己產品冇問題，**唔可以轉售／再分發啲 component**，引入嗰陣寫入該 repo `CREDITS.md`（W8）；③ 照 `design-review` 望圖驗收（390／768／1440＋reduced-motion），唔好用佢個 audit 分數代替人眼。而家 React 線嘅動畫就繼續用已在用嘅 framer-motion，唔好為新工具成套換。
- **唔好做**：唔好為咗 Animate UI 將現有 repo 搬去 shadcn／Radix（搬 UI 底層唔係加動畫，係重寫）；唔好 vendor 佢份 SKILL.md 入真理倉（同 [36](36-lazy-coding-and-open-alternatives.md) 唔 vendor Ponytail 同一理由：`web-motion` 已係我哋動畫施工入口）。
- **未實測**：冇安裝、冇跑過 CLI；上面普查只數根目錄同 `package.json` 依賴，冇逐個 repo 深挖 `src/` 結構，個別 repo 可能有例外（例如根目錄係靜態殼、子目錄先係 app），引用個別 repo 形狀前自己開嚟對。

## 3. ApiVault — 搵 API 嘅第二層，唔係真理源

- **定位講清**：我哋搵 API 嘅次序唔變——第一層係自己 [`api` repo](https://github.com/playerkousas-rgb/api)（香港 API 天書、`data/apis.csv`，[15](15-resource-index.md) 係佢索引），嗰度冇先向外搵。ApiVault（apivault.dev，51 分類：匯率／天氣／新聞／地圖／健康等）啱做**第二層發現**：唔知有咩 API 存在嗰陣去碌一次，短list 完返嚟逐間核實。已喺 [15 §2](15-resource-index.md#2-我想搵-去邊快速表) 補咗一行，唔另開新入口。
- **核實程度**：開源嗰邊 [exa-studio/ApiVault](https://github.com/exa-studio/ApiVault) 得 755★ 而且 2024-09 停更，站而家邊個維護、收錄有冇過期，**未開站核實**（出站限制）。目錄站嘅通病係：API 死了／轉收費／改條款佢唔會即時知，所以喺嗰度見到嘅每間 API，都要返官方文件行 [37 §2.1](37-ai-tools-design-prompts.md) 「驗證／格式／限額」三樣，過到先入短list；真係用咗，寫返入自己 `api` repo 嗰邊先係真理，唔好每次去碌外站。
- **未實測**：冇開過站、冇經佢搵過任何 API 落產品。

## 4. MiroFish — 當「假設產生器」得，當「預測」唔得

- **佢係咩（核實咗）**：[666ghj/MiroFish](https://github.com/666ghj/MiroFish)（AGPL-3.0，84,468★，盛大集團有關連，上游 README 有 Shanda 連結）。流程：入種子材料（報告／計劃）＋用自然語言講想預測乜 → 起 GraphRAG 世界 → 生成大量唔同人格嘅 agent 互動演化 → 出預測報告，仲可以單對單同任何一個 agent 傾佢點解咁諗。片講嘅玩法（成千人格鬧你個 idea、問佢買唔買）同上游對得上。
- **成本同門檻（上游自述）**：要自己 LLM API key（上游推薦阿里百煉 Qwen-plus）＋ Zep Cloud key；README 明寫 **「High consumption」**，叫人先試少過 40 輪。即係「成千 agent 開會」係用真金白銀 token 燒出嚟嘅，唔係免費玩具；自架仲要 Node＋Python 一套（AGPL：改版做網絡服務要留意 copyleft）。
- **點解永遠唔當證據**：模擬人格係 LLM 按刻板印象扮嘅人群，佢哋一致讚好／一致鬧，證明嘅只係「模型覺得呢類人會咁反應」，唔係真人會點。將模擬共識寫入產品決策（定價、文案、做唔做），等於用 AI 嘅偏見幫自己背書——正正係我哋 [INTAKE 第 0 步](../templates/repo-starter/INTAKE.md)「問真人、fact 自己查」要防嗰樣。**佢嘅產出只可以入「待真人驗證假設清單」，唔可以入「用戶證明咗」嗰欄。**
- **可接受試法**：有新 app idea、未寫 code 之前，用佢個官方 online demo（上游 README 有連結）或者細規模自架，攞佢鬧嘅點嚟做 pre-mortem 清單（邊度唔清晰、邊個定價位會畀人鬧），然後**拎住清單去問真人**。種子材料只入公開／已去敏嘅嘢：未公開產品計劃、成員資料唔好成份餵入去（佢要經你揀嘅 LLM 供應商，A12）。
- **未實測**：冇跑過 demo、冇自架、冇驗過任何一次「預測」準唔準；84k ★ 只證明多人 star，唔證明預測能力。

## 5. 其餘三件：端用家層面，唔入 app

| 項目 | 判 | 理由 |
|---|---|---|
| Qwen3.5-4B-3D-Coder | **觀察名單，唔試住** | 社群 fine-tune（Ollama `maternion/qwen3.5-3d-coder`），冇官方 repo、冇訓練／評測文件跟到；「文字生 Three.js 世界」同我哋單一 HTML 路線表面啱，但我哋而家用 Gemini／Claude 生 HTML 嘅質素同可控性先係基準，4B 本地模型要試就攞同一個場景 prompt 對照出一次先講。片中例子（櫻花寺廟、鬥獸場）質素未核實 |
| SUAPP AIM | **端用家工具（要用 SketchUp 先講）** | 商業插件將 2D 圖轉 3D 浮雕做 CNC，係實體製作（例如真係要雕塊牌先啱）；底層 Hunyuan3D 係騰訊開源模型（NOASSERTION 社群授權，用之前睇清限制）。輸入嘅插畫如果係人哋嘅作品，轉 3D 去雕刻／出售一樣撞版權（W8），唔好以為「AI 轉過」就冇事 |
| Convertio.co | **端用家可用，但唔好上載敏感檔** | 線上轉格式（PDF↔DOCX、HEIC→JPG、MP4→GIF）零安裝係方便，但檔案會上人哋 server：成員名單、未公開文件、證件圖一律唔好用佢轉，嗰啲用本地工具（ffmpeg／ImageMagick／LibreOffice／macOS 預覽）搞掂。一般公開檔案轉格式就冇乜所謂；站嘅留存／私隱條款未核實，第一次用自己開嚟睇 |

## 6. 查證限制／維護

- **已做**（2026-11-06）：GitHub API 查 animate-ui／ApiVault／MiroFish／Hunyuan3D-2 四個 repo 嘅 metadata＋HEAD；讀 Animate UI README＋`SKILL.md`（CLI／授權／motion 哲學）、MiroFish README 嘅 Quick Start（key 要求／高消耗警告）；ApiVault 已補入 [15 §2](15-resource-index.md#2-我想搵-去邊快速表)。
- **未做**：出站限制下開唔到 apivault.dev／Convertio／MiroFish demo 站；冇安裝 Animate UI CLI、冇跑 MiroFish、冇下載 Qwen3.5-3D-Coder 模型、冇裝 SUAPP AIM；片中所有示範效果（3D 世界質素、浮雕精度、模擬報告有冇用）一律未實測。
- **星數會變**：引用前重查；MiroFish 嗰種「爆星」項目要特別分清「多人 star」同「預測有效」係兩件事。
- **更新時機**：真正採用前、上游大改版後、引用星數前；更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件檢查通過唔會升級「未實測」狀態。
- **單一入口**：動畫去 [35](35-viral-ai-tools.md)＋`web-motion`；API 去 [15](15-resource-index.md)；爆紅清單第一至四輪去 [35](35-viral-ai-tools.md)／[36](36-lazy-coding-and-open-alternatives.md)／[37](37-ai-tools-design-prompts.md)；本頁只放第五輪核實，唔複製其他功能表。
