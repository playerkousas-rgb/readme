# 49 — 五個 repo 值唔值得學／收錄（設計 Skills／Creative Studio／dotfiles／EffectCraft）

> **2026-11-13 核實**。用戶提供 5 個 GitHub repo ＋「Awesome Design.md」，問「有無值得學習或者收錄」。
> 做法同 [48](48-video-audio-creative-tools.md)／[45](45-ui-skills-text-to-cad.md) 一致：用 **GitHub API（2026-11-13 快照）** 查 metadata，讀 README 同關鍵原始檔，逐個判「收錄／參考／唔收錄」。
> **未 clone、未安裝、未執行任何工具**；本頁唔新增規則 ID，亦唔代表已改任何設計 Skill 內容。今次唯一落地嘅改動係 [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs) 加兩個 frontmatter 檢查（見 §3）。
> 已經收錄過嘅兩個（`awesome-design-md`、`taste-skill`）**本頁只更新快照＋交叉引用，唔重寫**，避免一個事實寫兩次。

## 閱讀導航（按任務揀，唔使全文讀）

| 想知 | 讀邊節 |
|---|---|
| 值唔值得收錄 | [§0 一句判決](#0-一句判決) |
| 某個 repo 值得借乜 | §2.1 設計 Skills／§2.2 品牌 Studio／§2.3 dotfiles／§2.4 EffectCraft |
| 今次真正改咗乜 | [§3 已落地](#3-今次真正落地咗乜已跑過) |
| 將來有場景先做乜 | [§4 候選](#4-值得借但今次未做有場景先做) |
| 安裝／採用之前 | [§5 風險](#5-風險同唔好照抄總表)＋[§6 限制](#6-查證限制同維護) |

**分類**：本頁係「研發前調查／第三方工具評審」，唔係必守規則或已安裝 Skill 目錄。已安裝／可用 Skill 以 [CATALOG](../templates/repo-starter/skills/CATALOG.md) 為準。

## 0. 一句判決

| # | Repo | ★／Fork | 授權 | 判決 | 去邊 |
|---|---|---|---|---|---|
| 1 | [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) · [commit `fcc7028`](https://github.com/VoltAgent/awesome-design-md/tree/fcc70284932276d085f01ef9f83edde90b1258cb) | 127,332／14,099 | MIT | **已經收錄**，唔重複寫；只更新星數快照 | [23 §2.3](23-design-resources.md) |
| 2 | [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) · [commit `f6b7657`](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8) | 114,630／7,704 | MIT | **已經評審＋已落地**（check_skills／design-review／PREFLIGHT），唔重複寫 | [29 §5](29-reading-map.md#5-兩個外國-repo-評審q6) |
| 3 | [`elayadesign/ai-design-skills`](https://github.com/elayadesign/ai-design-skills) · [commit `456d9e0`](https://github.com/elayadesign/ai-design-skills/tree/456d9e0d3e2d84c748bb143c6ca3d90c45e16213) | 15,431／1,185 | MIT | **參考＋局部落地**：借 2 個 frontmatter 檢查（已入 script）；22KB skill 內容唔併入 | 本頁 §2.1、§3 |
| 4 | [`BULDEE/claude-creative-studio`](https://github.com/BULDEE/claude-creative-studio) · [commit `58bc989`](https://github.com/BULDEE/claude-creative-studio/tree/58bc989062efefe718b975d81bd0538fbc4bdedc) | 2／1 | MIT | **參考，唔安裝**：借 ADR 同「每個 phase 人手確認」；plugin hooks 自動跑 shell、無社群驗證 | 本頁 §2.2、§5 |
| 5 | [`kettleofketchup/dotfiles`](https://github.com/kettleofketchup/dotfiles) · [commit `5989d18`](https://github.com/kettleofketchup/dotfiles/tree/5989d183f3738adfc0d13be1cdd2f4055b8d7d1e) | 0／1 | **無 LICENSE** | **唔收錄**（個人機設定＋無法授權重用）；只讀概念：skill 單一來源、生成 adapter、擋「pre-existing」卸責 | 本頁 §2.3、§4 |
| 6 | [`storytold/effectcraft`](https://github.com/storytold/effectcraft) · [commit `a5ddc93`](https://github.com/storytold/effectcraft/tree/a5ddc932578a94a826b0ee824ad2719a0e6dd3cd) | 8,698／4,587 | Apache-2.0（repo 有 `LICENSE-MIT` ＋ `LICENSE-APACHE`，實際雙授權） | **有場景先試**（內容製作工具，唔係產品依賴）；同 [48 §1.6](48-video-audio-creative-tools.md) ArtCraft 同一家族 | 本頁 §2.4 |

**收錄門檻（本頁用嘅三條）**：① 授權明確、可以講清楚點用；② 對我哋棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）有**可驗收**用途；③ 唔同已有 `docs/` 重複。三條缺一，就只列「參考」或「唔收錄」。

---

## 1. 核實方法同範圍

| 做咗 | 未做 |
|---|---|
| GitHub API 查 6 個 repo 嘅 stars／forks／license／language／size／created／pushed／open issues | 未 clone、未安裝、未跑任何 app／plugin／skill |
| 讀 README、`AGENTS.md`、`SKILL.md`、`hooks.json`、`validate_skills.py`、workflow、部分 ADR | 未用 Chrome／瀏覽器開 EffectCraft web build，未試 BULDEE 出圖 |
| 抽查 repo 檔案樹（計 skill 數、knowledge 大小、大檔案） | 未核實每個 skill 嘅設計值好唔好睇；未做設計評分 |
| 6 個 repo 都釘 commit SHA 連結 | 未查 slopscan 收費／未查 getartcraft.com 商業條款 |

**已核實嘅授權**：`awesome-design-md`／`taste-skill`／`ai-design-skills`／`claude-creative-studio` 根目錄 LICENSE 為 MIT；`effectcraft` 同時有 `LICENSE-MIT`（1,103 bytes）＋`LICENSE-APACHE`（10,174 bytes），README 寫 `MIT OR Apache-2.0`（GitHub API 只顯示 Apache-2.0，因為佢揀咗其中一個）；`dotfiles` **冇 LICENSE 檔**。

---

## 2. 逐個評審

### 2.1 `elayadesign/ai-design-skills`（MIT，15,431★）— 參考，局部落地

- **定位**：設計 skill 集合，兩個 skill——`landing-page-design`（22,115 bytes）同 `figma-designer`（22,079 bytes）；每份係**單一 `SKILL.md`**，無 `references/`。用 `npx skills add elayadesign/ai-design-skills` 安裝（要 Node），或手動 copy 入 `.claude/skills/`。
- **結構**：`scripts/validate_skills.py`（4,053 bytes，PyYAML）＋`tests/test_validate_skills.py`（4,981 bytes）＋`.github/workflows/validate-skills.yml`（PR／push 跑 unittest ＋驗 skill）。另有 `redesign-skill` 独立 repo、`slopscan.co` 導流（付費與否未核實）。
- **值得學（已落地一項）**：
  1. **`name` 必須等於資料夾名**、`compatibility` ≤500 字——同 [agentskills.io 規格](https://agentskills.io/specification) 一致；strict client（Codex 等）遇到唔匹配會**靜靜跳過成個 skill**。今次已加入我哋 [`check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)（見 §3）。
  2. **先策略後視覺嘅兩半結構**（Part A 講 one offer／one audience／one action，Part B 才講字體／間距／圓角）＋明文寫「framework default 同本檔衝突時，本檔贏；用戶明確要求同本檔衝突時，用戶贏」——同我哋「衝突以 PLAYBOOK 為準」係同一種優先次序寫法。
  3. **`validate_skills.py` 有 tests**：validator 自己都有 test，唔止驗 skill。我哋支 checker 未有 test（見 §4）。
- **唔好照抄**：
  - 22KB 單檔 skill＝**反 progressive disclosure**；[29 §5](29-reading-map.md#5-兩個外國-repo-評審q6) 已結論長文應該落 `references/`，唔好塞晒入 `SKILL.md`。
  - 設計值綁 Tailwind scale、指定字體／icon 家族、禁斜體／禁 ultra bold——係**另一位設計師嘅 house style**，同我哋 Scout Field／Paper／Clean 三套同 `design-review` 六條 critique 唔同脈絡；照抄會令所有 app 變同一個樣。
  - 佢個 workflow 用 `actions/checkout@v4` 呢類 **tag 而唔係 commit SHA**；我哋 [A16](03-security.md) 明確要求釘 SHA，所以連 workflow 都唔可以直接搬。
  - README 講「每個 skill 嘅設計值集中喺檔尾一節」——`figma-designer` 係（有 `Token reference`），`landing-page-design` 就分散喺 Part B 嘅 B1–B11。**宣傳句同實物有出入**，要自己開檔睇。
- **判決**：**參考＋局部落地**。只借檢查規則，唔併入 skill 內容、唔裝 CLI、唔加依賴。

### 2.2 `BULDEE/claude-creative-studio`（MIT，2★）— 參考，唔安裝

- **定位**：Claude Code plugin，做品牌設計（logo、3D render、16 節單檔 HTML brandbook、React design system、LinkedIn／IG carousel、Playwright 截圖教學）。6 個 skill、4 個 agent、3 個 command、1 個 knowledge MCP、3 個 hook、8 份 ADR（001–006、008、009）。
- **值得學**：
  1. **`docs/adr/` 用真 ADR 寫取捨**：例如 ADR-006「一個 bounded context 一個 skill」講清楚 logo／brand visuals／app guide 三分，附 DDD 對照。我哋起手包已有 [`docs/adr/0000-template.md`](../templates/repo-starter/docs/adr/0000-template.md)，佢係一個寫得夠具體嘅範例。
  2. **8 階段 pipeline 每階段人手確認**（探索 → brandbook → HTML DA → 3D logos → export → landing → design system → carousel）＝我哋 [F2](02-foolproof.md) dry-run／確認嘅內容製作版。
  3. **`brand.json` 做單一品牌真理**，再出 `brand-tokens.css`／`tailwind.preset.ts`——同 [23 §2.3](23-design-resources.md) 嘅 `DESIGN.md → tokens.css` 係同一條路，只係佢用 JSON。
  4. **`brand-consistency-check.sh`** 喺 Write／Edit 之後掃 hardcoded hex、提醒用 token；概念等於我哋「顏色只出自 token」嗰條驗收，只係佢做成 hook。
- **唔好照抄／唔安裝**：
  - **2★、1 fork、0 open issue、2026-04-06 之後無 push**：無社群驗證、無 test suite。掛 plugin 即係喺 SessionStart／UserPromptSubmit／每次 Write|Edit 自動跑佢嘅 bash——等於未審核嘅本機執行權，[A1](03-security.md) 角度唔應該裝落做嘢嘅機。
  - `knowledge/` 解壓前檔案合計 **≈57.8 MB**（兩個法文 PDF 各 ≈26 MB），GitHub repo size ≈41.6 MB——同 [S1 瘦身](01-slim.md) 完全相反，亦唔應該入任何 app repo。
  - 出圖要 `GEMINI_API_KEY`／`OPENAI_IMAGE_KEY` 放 shell rc；full pipeline 約 40–50 張圖（Gemini 免費額 ~500/day、OpenAI 約 $2–8/次）。**成本同行為未實測**。
  - 佢個「HTML brandbook」係生成物，冇設計評分、冇 390／768／1440 驗收——生成得靚唔等於啱我哋規矩。
- **判決**：**參考 ADR 寫法同 phase gate 概念**；唔安裝 plugin、唔抄 hooks、唔搬 knowledge。

### 2.3 `kettleofketchup/dotfiles`（無 LICENSE，0★）— 唔收錄，只讀概念

- **定位**：個人 dotfiles（GNU Stow symlink 入 `$HOME`），但入面係一套完整 agent harness：`.claude/` 做**單一來源**（`skills/` 檔案樹 1,870 個檔、2 個 agent、22 個 hook 檔、`plugin-skills/` 61 個檔，含 `comment-reviewer` 同 tests／PR gate），再用 `agent-harness` script 生成 `.agents/skills`（symlink）、`.codex/skills/`、`.openhands/microagents/`（137 個）。`bin/oh-my-posh` 係 **18.43 MB 已 commit 二進位檔**，成個 repo ≈69.8 MB、2,367 個檔。
- **值得學（概念，唔係 code）**：
  1. **`name` ≠ 資料夾名、frontmatter 唔係合法 YAML → strict client 會靜靜跳過**。佢 `AGENTS.md` 明寫呢兩條要 CI hard-error，同 §2.1 嘅 validator 互相印證。呢個係今次最實在嘅收穫。
  2. **skill 單一來源＋生成 adapter＋`--check` 入 CI**：改 `.claude/skills/` 之後跑 sync，生成其他 harness 嘅格式；「Never hand-edit a generated file」。我哋得一個 `skills/` 樹＋`CATALOG.md`，**未有第二個 harness 需要生成**，所以暫時唔加。
  3. **Stop hook `preexisting-nudge.py`**：agent 用「pre-existing」做藉口唔修（failing test、lint、bug）就 block 個回合，逼佢修或者明文要 sign-off。呢個正正係 [docs/47](47-readme-discipline.md) 五條原則第 2 條「已修要有 commit＋實測」嘅機械版。
  4. **PreToolUse `cmd_checker`**：多個 check 並行（絕對路徑、`git -c`、命令鏈、read／write／edit pattern），任何一個 block 就即刻擋。概念同我哋 `guard.mjs`／PREFLIGHT 互補，但**時機唔同**（佢喺工具執行前，我哋喺 commit 前）。
- **點解唔收錄**：
  - **冇 LICENSE** → 代碼、hooks、skill 一律唔可以複製；只能讀概念再自己寫（W8）。
  - 內容綁死個人機：`/home/kettle/...` 路徑、Arch／Omarchy、特定麥克風 filter-chain、18 MB binary。做模板會即刻 violate S1。
  - README 只講 Stow 同降噪，**冇講成個 agent harness**；單睇 README 會低估佢，但呢個唔係「收錄」理由。
- **判決**：**唔收錄、唔裝、唔抄 code**；概念已寫入本頁同 §4 候選清單。

### 2.4 `storytold/effectcraft`（MIT OR Apache-2.0，8,698★）— 有場景先試

- **定位**：純 Rust 動態圖形／合成軟件（After Effects 類），composition／layer／keyframe／308 effects／layer styles／expressions／3D camera＋lights／render queue；macOS／Windows／Linux／FreeBSD 安裝檔＋browser build。**2026-10-01 第一個 commit**、v0.24.1（2026-11-12）已 50 個 release asset、1,138 個 open issue。
- **同 [48](48-video-audio-creative-tools.md) 嘅關係**：同一個 ArtCraft 家族——FilmCraft（剪片，18,114★）、ArtCraft（AI 圖像／影片 IDE，40,768★）、EffectCraft（動態圖形）。48 已判 ArtCraft「可試」；EffectCraft 係同一條內容製作路線嘅**動態標題／合成**工具。
- **值得學（架構）**：
  1. **一個 command surface 餵晒 UI／CLI／JSON control channel／MCP**：menu action、timeline edit、property change 全部係 command，agent 可以用同一套命令操控，唔使 simulate 滑鼠。呢個係「agent-operable app」嘅乾淨做法。
  2. **`.ecproj` 專案檔係 versioned readable JSON**：講明可以 diff、入 version control。同我哋「設定／資料要可讀、可審計」一致。
  3. **`docs/gaps.md` ＋ target parity 91% ＋「約 45% 才夠專業製作」＋明講 alpha、唔建議 production client work**：呢種**主動報短處**嘅寫法，正正係 [docs/47](47-readme-discipline.md) 想要嘅誠實 README。
  4. **預設無 telemetry、無網絡**（要你要求才連）＋ clean-room 開發規則（只睇公開文件同行為，唔碰專有檔案）——對 [A12 私隱](03-security.md) 同 W8 都係好示範。
- **唔好照抄／風險**：
  - 佢係 **desktop Rust app**（Rust 1.95+），唔係可以掉落 web app 嘅 library；亦唔係我哋產品方向。
  - **alpha**：1,138 open issues、macOS 最受測、Linux／Windows 有基本互動 bug、render 測試只覆蓋細 composition。**唔可以用嚟交客戶 production 工作**。
  - 官網／商業條款、web build 效能、GPU 需求**全部未核實**。
- **判決**：**有場景先試**——要出「Scout 宣傳片」「動態標題」「活動海報分鏡」先裝；用嚟出素材，最終成品仍然走我哋 Gemini Canvas／單一 HTML 路線。**唔做產品依賴、唔加落任何 repo**。

---

## 3. 今次真正落地咗乜（已跑過）

| 改動 | 內容 | 來源 | 驗證 |
|---|---|---|---|
| [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs) | 喺標準 `skills/` 樹加兩項：① `name` 要等於資料夾名；② `compatibility` 如有提供，要非空且 ≤500 字 | ai-design-skills `validate_skills.py` ＋ dotfiles `AGENTS.md` 嘅「strict client 靜靜跳過」規則 | `node scripts/check_skills_v1.0.mjs` → **PASS（5 份 SKILL.md）** |
| [docs/29 §3](29-reading-map.md#3-章-c--agent-skills對應-q4skill-分類放好) 硬規則清單 | 補「`name` 要等於資料夾名」同 `compatibility` 上限，並寫明由邊份上游印證 | 同上 | `node scripts/guard.mjs`、`consistency_v1.0.mjs` |

**向後兼容**：檢查只在路徑含 `skills/` 嘅樹生效。舊 repo 用單數 `skill/`（例如 `answer` 嘅 `skill/hk-scout-kb`）唔會被新規則擋；但如果你嗰個 repo 係標準 `skills/<name>/SKILL.md` 而 name 唔匹配，**而家會 fail**——呢個係真問題，唔係誤報，因為 strict client 會靜靜唔載入。

**冇改**：`design-review`／`web-motion`／`repo-setup` 三份 SKILL.md 內容、`CATALOG.md`、任何模板；亦冇新增依賴（checker 仍然零依賴，唔跟 ai-design 用 PyYAML）。

---

## 4. 值得借但今次未做（有場景先做）

| 候選 | 上游依據 | 我哋對應 | 幾時做／驗收 |
|---|---|---|---|
| **Stop gate 擋「pre-existing」卸責** | dotfiles `preexisting-nudge.py` | [47](47-readme-discipline.md) 原則 2；`final_check` 六角度 | 我哋環境無 hook harness，**唔會自動觸發**。可以先做一條人手 checklist：「有冇用『本身已經壞』做理由而冇修／冇 sign-off？」未改任何規則 |
| **跑命令前攔截（PreToolUse）** | dotfiles `cmd_checker`（並行 check、exit 2 block） | `guard.mjs`（commit 前）＋PREFLIGHT（開局前） | 只有將來有 agent harness 先有意義；概念上唔應該取代 guard，係多一道閘 |
| **validator 自己有 test** | ai-design-skills `tests/test_validate_skills.py` | `check_skills_v1.0.mjs` 目前無 test | 下次改 checker 時加一個零依賴 fixture 測試（好 skill／壞 name／壞 YAML 三格） |
| **一個 command surface 俾 UI＋CLI＋agent** | effectcraft CLI／control channel／MCP | 我哋多數係單一 HTML＋GAS／Vercel API | 將來如果做「agent 操作嘅工具」先設計；唔係今日嘅 app 需要 |
| **專案檔用 versioned readable JSON** | effectcraft `.ecproj` | 我哋設定層／backup JSON | 已有同類做法（`brand.json`／`units.json`）；唔使另立規則 |
| **單一來源 skill＋生成多 harness adapter** | dotfiles `agent-harness` | `skills/` 四 bucket＋`CATALOG.md` | 得一個 harness，**暫時唔加**；有第二個 client 才做 |

---

## 5. 風險同「唔好照抄」總表

| 風險 | 邊個 | 點解 |
|---|---|---|
| **未審核代碼自動執行** | BULDEE plugin hooks（SessionStart／UserPromptSubmit／PostToolUse） | 安裝＝每次開 session、每個 prompt、每次寫檔都跑佢嘅 bash；2★ 無 review、無 test |
| **參考檔撐爆 repo** | BULDEE `knowledge/` ≈57.8 MB（PDF／DOCX） | 同 S1 相反；要參考都唔應該入 git，最多本機放 |
| **無授權就係無授權** | dotfiles（無 LICENSE） | 概念可以自己重寫；code／hooks／skill 文字唔可以複製（W8） |
| **單檔巨型 skill** | ai-design-skills（22KB × 2，無 references） | 反 progressive disclosure；context 成本高、難局部改 |
| **未成熟就當 production** | effectcraft（alpha、91% feature parity、45% production-ready） | 官方自己都話唔建議 client work；只可以試素材 |
| **供應鏈／API key** | BULDEE（Gemini／OpenAI key 放 shell rc）、ai-design（`npx skills add` 要 Node） | key 只留 server 係 A1 底線；CLI 安裝要清楚佢寫咩入 repo |
| **工作流唔釘 SHA** | ai-design-skills workflow（`actions/checkout@v4`） | 我哋 A16 要求 commit SHA，copy 之前要改 |

---

## 6. 查證限制同維護

- **未做**：未安裝任何 plugin／skill／app；未執行 EffectCraft（包括 web build）；未用 BULDEE 出圖；未跑 slopscan；未核實 EffectCraft 官網商業條款、GPU 需求、web build 效能；未計 ai-design-skills 兩份 skill 嘅實際輸出質素。
- **快照會過時**：星數／issue 數係 **2026-11-13** GitHub API 讀數；`effectcraft` 一日內已有新 commit，`taste-skill`／`awesome-design-md` 嘅舊快照（11-02／之前）只作對照，唔好當今日數字。
- **兩個已收錄項目唔重寫**：`awesome-design-md` 去 [23 §2.3](23-design-resources.md)、`taste-skill` 去 [29 §5](29-reading-map.md#5-兩個外國-repo-評審q6)；本頁只補 2026-11-13 星數（127,332＋14,099 forks；114,630＋7,704 forks）同新來源，結論不變。
- **更新時機**：真正採用任何一個之前、上游大改版之後、或者要引用星數之前。更新要同時改 commit SHA、日期、限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。
- **單一入口**：影音／創作工具去 [48](48-video-audio-creative-tools.md)；UI 設計 skills／CAD 去 [45](45-ui-skills-text-to-cad.md)；skill 治理去 [29](29-reading-map.md)；設計素材去 [23](23-design-resources.md)。本頁只答「呢五個值唔值得學／收錄」，唔複製其他頁嘅功能表。
