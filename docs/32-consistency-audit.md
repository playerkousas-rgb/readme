# 32 — 全倉一致性審計（按兩個外國 GIT 嘅檢查方式）

> **2026-11-02**。目的：用你之前畀嘅 [mattpocock/skills](https://github.com/mattpocock/skills) 同 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) 嘅**檢查方式**，望一次成個 repo，搵出「混亂／矛盾」而唔係只驗連結。
> 工具：[`scripts/consistency_v1.0.mjs`](../scripts/consistency_v1.0.mjs)（零第三方依賴、**一次性 AGENT gate**，`--json`／exit 1；**唔係 CI、唔係每次 push YML** —— 跟返 [PREFLIGHT](../templates/repo-starter/PREFLIGHT.md) 嘅取向）。
> 配套：[27 起手包](27-repo-starter.md) · [28 形式分類](28-repo-taxonomy.md) · [30 三層檢查](30-repo-health-check.md) · [docs/README 章 6](README.md)
> **§8 係後補**：§1–§7 只借「檢查方式」；§8 先真正讀兩個 GIT 嘅 `SKILL.md` 原文、跑佢哋嘅原生檢查，並寫明邊啲做唔到。要睇「有冇跟 SKILL」直接去 §8。

---

## 1. 方法：兩個 GIT 教咗乜，我哋點落地

| 來源 | 佢哋嘅檢查方式 | 我哋變成（3 軸） |
|---|---|---|
| mattpocock `AGENTS.md` | 分類憲法：邊啲入索引、邊啲唔入；**一個事實只寫一次** | **Standards**：`docs/README`／根 README 索引覆蓋、章節號、數字聲稱全倉一致 |
| mattpocock `SCOPE.md` | 兩條 bar：真實失敗 + 合乎定位 | 每個 finding 要有 `file:line` 證據，唔靠「我覺得」 |
| mattpocock `GLOSSARY.md` | 定義／避免用／已釐清歧義 | 術語一致：**「可選」** vs **「必跑」**、**「第 13 項」** vs **「第 14 項」** |
| mattpocock `code-review/SKILL.md` | **兩軸 review**：Standards（跟唔跟 repo 標準）＋ Spec（忠唔忠於原本意圖） | **Spec**：對返你講過嘅意圖（唔想每次 push 跑 YML、要 AGENT 開局前檢查、系統要有基本功能） |
| mattpocock `.out-of-scope/` + ADR | 一決定一檔、ADR 1–3 句 | 每個修正寫低決定 + 點解（§4） |
| taste-skill `tests/frontmatter.mjs` | strict YAML、UTF-8、`node --check` | **Mechanics**：frontmatter／UTF-8／syntax／secret／placeholder／script 版號 |
| taste-skill `references/critique.md` | **望成品（screenshot），唔好望自己寫過嘅 code**；14 passes | 望**成個 repo 嘅成品**：由根 README 導覽、docs 索引、模板摘要一路對落去，唔係只望新寫嗰幾份 |
| taste-skill `evals/` | 每條 eval 有 `expected_output` | 每個 check 有預期值（85 行、canon 數字、索引覆蓋） |
| taste-skill look-and-fix loop | 出圖 → 評分 → 改 → 再出圖 → 再評 | **第 1 輪 → 修正 → 第 2 輪複檢**（§3–§5）＋ §8.5 嘅 ROUND 1／2 |

> ⚠️ §1 呢張表係**方法對照**，唔代表執行咗 `code-review`／`design-taste-frontend` 兩支 SKILL；真正逐步對照喺 §8.2／§8.5。

> **冇引入**：39KB `SKILL.md`、247 站 library、Chrome inspector、plugin manifest、`npm install yaml`、任何 GitHub Actions runner。全部零依賴本機 `node`。

## 2. 掃咗乜

| | 數 |
|---|:--:|
| 全倉檔（排除 `.git`／`node_modules`／`dist`） | **102** |
| Markdown | **62** |
| `docs/NN-*.md` | **33**（00–32） |
| `scripts/*.mjs` | **10**（含 2 支 `.test.mjs`） |
| 其餘（`templates/`、`.github/`、`*.yml/json/py/html`） | 其餘 |

檢查範圍：連結／錨點由 [`guard.mjs`](../scripts/guard.mjs) G10 守（19 綠）；呢份補嘅係 **跨檔語義矛盾**，兩者唔重疊。

## 3. 第 1 輪：9 個 FAIL + 2 個 WARN（checker）

| # | 軸 | 位置 | 混亂／矛盾 | 嚴重 |
|:--:|---|---|---|:--:|
| 1 | Standards | `docs/29:125` | 寫「[28] 見到嘅 80 個無 LICENSE」，但 **80/85 統計喺 [27 §1](27-repo-starter.md)**，[28](28-repo-taxonomy.md) 係形式分類 | FAIL |
| 2 | Standards | `docs/30:32` | `scaffold` 指去「[28] **§6** 陷阱表」，但陷阱表喺 **§7**（§6 係「形式 → 要守咩」） | FAIL |
| 3 | Standards | `docs/30:92` | 「同 [28] 嘅 80/85 一致」again 錯配出處 | FAIL |
| 4 | Standards | `docs/27:12` | 「20 個無 README（**當中 8 個**係空殼／預留）」硬湊一個數，但 [28 §3](28-repo-taxonomy.md) 計出 **12** 個空殼，兩者定義唔同（**人手加**，非第 1 輪 checker） | 人手 |
| 5 | Spec | `README.md:54` | 起手包摘要只講「**可選第 13 項**」，漏咗後來加嘅**第 14 項**（有身份系統基本功能） | FAIL |
| 6 | Spec | `docs/README.md:86` | 同上 | FAIL |
| 7 | Spec | `templates/README.md:23,27` | 摘要「12 樣 + 可選 13」漏第 14 項；PREFLIGHT 標「**可選 13d**」但 `START.md` 寫「所有新 repo 都應該有」 | FAIL |
| 8 | Spec | `docs/27:50`／`START.md:52` | 標題「**可選第 13 項 … PREFLIGHT**」同 13d「必跑」自相矛盾；§2b 表又寫「知識倉 ❌ 唔加」，似連 13d 都唔加 | FAIL |
| 9 | Spec | `docs/28:194` | §6 表將 **PREFLIGHT 開局 gate 只掛喺「框架 SPA／PWA」**嗰行，但佢係所有新 repo 嘅 L0 gate | FAIL |
| 10 | Spec | `docs/30:13,16` | L1 仍寫「本工具 `--json` 做 **CI gate**」／「CI 要紅」，同你「唔想每次 push 跑 YML、要 AGENT 開局前檢查」撈亂 | WARN |
| 11 | Mechanics / 其他 | — | UTF-8、`.mjs` syntax、SKILL.md frontmatter、secret、placeholder、script 版號、索引覆蓋、章節號、85 行表：**全過** | ✅ |

> **人手再對多 2 項**（對應 taste-skill critique「望成品，唔好只望自己寫過嘅 code」）：
> - `docs/27:12` 個「當中 8 個」無出處，同 12 個空殼撈亂 → 已改寫 + 加做 `STALE` 新指紋。
> - 加入本份審計報告後，checker **自己引用返舊講法做證據**，第 3 輪出咗 8 個假陽性 → 已將 `docs/32` 由 `STALE`／`optionality`／`preflight-scope` 排除（§6 有講）。
>
> 另外兩個**假陽性已排除**：`docs/27` 嘅 `### 13d` 係項目號唔係章節（章節順序 checker 改只計 `##`）；`CHANGELOG.md` 每個版本都有 `### Added` 係 Keep a Changelog 標準格式，唔當錨點撞。

## 4. 修正（一個決定一句）

| # | 決定 | 點解 |
|:--:|---|---|
| 1–3 | 80 個無 LICENSE／20 個無 README 改指 **[27 §1]**；陷阱表改 **§7**；[28] 只留形式分類 | 出處要同內容相符（SCOPE 兩條 bar：真實證據） |
| 4 | 刪「當中 8 個」，改寫「**兩組數唔好相加**：空殼 12（28 §3）／65-20 係根 README／API 計法 69-16」 | 唔好為咗順口硬湊一個無出處嘅數 |
| 5–7 | 三份摘要補**第 14 項**；`可選 13d` → **`13d，必跑`**；`起手包（12 樣 + 第 13 項 + 第 14 項）` | 用戶問過「有冇記低」，加到就要全線同步 |
| 8 | 標題統一做「**第 13 項：13a–13c 按形式加、13d PREFLIGHT 必跑**」；§2b 表加一句「13d 唔跟形式，所有新 repo 開局都要跑」 | 拆清「可選」同「必跑」兩個術語（GLOSSARY 思維） |
| 9 | §6 表移除框架 SPA 行嘅 PREFLIGHT，表下加註「12 樣 + 13d 係所有新 repo」 | gate 唔應該因為形式分類而被局部化 |
| 10 | L1 改「**本機**，唔係 push YML」；Gate 定義改「`FAIL > 0` 就 exit 1，**AGENT 停手**」，並註明 CI 只做改動後 regression | 忠於你原本意圖（code-review 嘅 Spec 軸） |
| 11 | `docs/32`（本份）由 3 個語義 check 排除，並收窄 `11 類` 指紋做 `11 類參考` | 審計報告要引用舊講法做證據；「11 種檢查」唔應該被當「11 類分類」 |
| 12 | 新增 [`scripts/consistency_v1.0.mjs`](../scripts/consistency_v1.0.mjs)，將上面 11 種檢查變成可重跑指紋（`CLAIMS` canon、`STALE` 舊講法、索引／章節／術語／scope） | 唔好只修一次，要擋返轉（F16 同款） |

## 5. 第 2／3 輪（look-and-fix 複檢）

```bash
node scripts/consistency_v1.0.mjs . --json     # exit 0
```

✅ **CONSISTENCY PASS — 0 FAIL / 0 WARN**（**102 檔 / 62 MD**）

**三輪 look-and-fix**：第 1 輪 9 FAIL + 2 WARN（101 檔／61 MD）→ 修正 → 第 2 輪 0 FAIL → 加入本份 `docs/32` 後第 3 輪出 8 個 self-reference 假陽性 → 排除 + 收窄指紋 → **0 FAIL**（102 檔／62 MD）。呢個就係 taste-skill「出圖 → 睇 → 改 → 再出圖」嘅做法，只係我哋望嘅係 repo 而唔係 screenshot。
✅ `node scripts/guard.mjs` → **19 項全綠**（G10 驗咗 62 份 MD／近 800 條連結＋錨點）
✅ `node scripts/final_check_v1.0.mjs --json` → `ok: true`
✅ `node scripts/repo_health_v1.0.mjs .` → PASS 8/2/0
✅ `node scripts/preflight_v1.0.mjs . --allow-placeholders --json` → 8/8
✅ `node scripts/check_skills_v1.0.mjs <answer clone>` → 1 份 SKILL.md 合格

## 6. 刻意唔改／未核實（backlog，唔當矛盾）

| 項 | 點解唔郁 |
|---|---|
| [`templates/github/guard.yml`](../templates/github/guard.yml) 仍有 `push: ['**']` + 每週 `cron` | **既有模板，唔係本輪新增**。PREFLIGHT 取代嘅係我上一版加嘅 `check-skills.yml`（已移除）。要連佢都改做 `pull_request` + `schedule` + `workflow_dispatch`，等你一句決定（[27 §2b](27-repo-starter.md) 有寫） |
| 65/20（檔案樹）vs 69/16（GitHub `/readme` API） | 兩個**計法**並存，已喺 [27 §1](27-repo-starter.md) 寫明，唔再當矛盾 |
| `GEMINI` 回報系統、`scout-circulars` 嘅 hardcoded Bearer token、IKEA 私有 endpoint、[29 §6](29-reading-map.md) 嘅非 GitHub 參考 | 只讀過檔／未實測／sandbox 出唔到網；[25](25-reverse-api-reuse.md)／[31](31-system-basics.md) 已標「未核實」 |
| 85 個 repo 全 L2 體檢、ToS／runtime／功能實測 | 未做；[30](30-repo-health-check.md) 列做 L2 每季 |
| 兩個外國 repo 嘅 star／版本 | 2026-11-02 GitHub API 快照，會變 |
| `docs/32` 自己 | **審計報告要引用已修正嘅舊講法做證據**，所以由 `STALE`／`optionality`／`preflight-scope` 三類 check 排除；其餘 61 份 MD 照驗。同 taste-skill 個 UTF-8 checker 要避開自己 regex 係同一種 self-reference 處理 |
| 執行環境 | 無 sub-agent、無 commit（diff 空）、無瀏覽器／screenshots、無 issue tracker → §8.2／§8.5 逐項寫明偏差，**唔當做咗** |
| 呢支 checker 本身 | **靜態檢查**：驗到文字／數字／索引／語法，驗唔到 app 行唔行、ToS、私隱同意、功能閉環（同 `preflight`／`guard` 一樣） |

## 7. 點重用（唔好只跑一次）

```bash
node scripts/consistency_v1.0.mjs . --json        # 全倉；exit 1 = 有矛盾
node scripts/consistency_v1.0.mjs .               # 人讀
```

加新嘢時要同步三格，否則下一輪會紅：

1. **新 `docs/NN-*.md`** → 加 [`docs/README`](README.md) 索引行 + 根 `README.md` §1 導覽（`index-coverage`／`nav-coverage`）。
2. **改 canon 數字**（例如第日真係 clone 晒 85 個 repo 重計形式分類）→ 改 `consistency_v1.0.mjs` 入面 `CLAIMS` 嘅 `canon`，全倉舊數即刻會被捉到。
3. **新舊講法交替**（例如再改名／改觸發時機）→ 加落 `STALE` 指紋陣列，等同 mattpocock `.out-of-scope/` 一決定一檔。

> **唔建議**將呢支加落 `preflight_v1.0.mjs` 做第 9 格：PREFLIGHT 係「新 repo 開局」gate，consistency 係「真理倉自己」嘅全倉審計，兩者目標唔同；分開跑先唔會令新 repo 要抄多一支唔關事嘅 script（S 瘦身）。

---

## 8. 補充：直接跟兩個 GIT 嘅 **SKILL 原文**再審一次（2026-11-02 後補）

> **先老實答：§1–§7 跟嘅係「檢查方式／原則」，唔係執行佢哋個 SKILL。** 上一版我借咗兩軸、SCOPE bar、GLOSSARY 術語、望成品、look-and-fix，但**冇真正讀 `SKILL.md` 全文、冇跑佢哋嘅 gate、冇用 14 passes、冇用 Fowler 12 smells、冇開平行 sub-agent**。呢節補返：用 `gh api ... raw` 攞原件（唔靠摘要／記憶），逐條對照，跑得到嘅原生檢查真跑一次，跑唔到嘅**寫明點解**，唔扮做咗（taste-skill `SKILL.md` §10：「Do not claim a check you did not run」）。

### 8.1 讀咗邊啲原件

| Repo / 檔 | bytes | 關鍵要求 |
|---|---:|---|
| mattpocock `skills/engineering/code-review/SKILL.md` | 6,721 | **兩軸**（Standards / Spec）、pin fixed point、`git diff <base>...HEAD`、standards sources（`CONTRIBUTING.md` 存在就**必須**列）、Fowler 12 smells、**兩個平行 sub-agent**、`## Standards`／`## Spec` 分開、**唔合併唔 rerank** |
| mattpocock `AGENTS.md` / `SCOPE.md` / `GLOSSARY.md` / `.agents/invocation.md` | 4,206 / 2,348 / 1,768 / 3,850 | 一個事實一次、兩條 bar、避免用字、user- vs model-invoked |
| taste-skill `skills/taste-skill/SKILL.md` | **39,537** | 10-step run、House rules、§7 Gate（`lint.mjs`／`inspect.mjs`／`scenes.mjs`）、§8 Look、§9 Move、§10 Report |
| taste-skill `references/critique.md` | 11,157 | **14 passes、只准望 screenshots 唔准望 code**、40/30/20/10 加權、caps、`ROUND n` 固定格式、最多 3 輪 |
| taste-skill `tests/frontmatter.mjs` / `tests/text-encoding.mjs` / `.github/workflows/check-skills.yml` / `evals/evals.json` | 4,069 / 1,796 / 903 / 8,198 | strict YAML（`yaml@2.6.1`）、UTF-8、`node --check`、expected output |

### 8.2 `code-review` SKILL 逐步對照

| Step | SKILL 要求 | 實際 | 偏差 |
|:--:|---|---|---|
| 1 | pin fixed point、驗 `git rev-parse`、**diff 非空否則 fail** | `c9908bb` 存在；但 `HEAD == base`（本輪**無 commit**）→ three-dot diff 係空。改用 `git archive c9908bb` export 對工作樹：**32 新 / 4 改 / 0 刪** | 用工作樹當 diff，唔係 `git diff` |
| 2 | 由 issue tracker / `specs/` 搵 spec，搵唔到要問 | 冇 issue tracker；spec = **呢個 conversation 嘅用戶原句**（§8.4 逐句 quote） | 用對話做 spec，已寫明 |
| 3 | 列晒 standards sources + Fowler 12 smells；`CONTRIBUTING.md` 存在必須列 | 列咗 9 份：`AGENTS.md`／`PLAYBOOK.md`／[10](10-checklists.md)／[docs/README](README.md)／`EXTERNAL.md`／起手包 `CONTRIBUTING.md`／`guard.mjs`／`guard.yml`／`templates/README.md`。**根目錄無 `CONTRIBUTING.md`／`CODING_STANDARDS.md`** → 呢個係本倉既有 backlog（[30 §5](30-repo-health-check.md)） | 無得「必須列」；12 smells 對過（§8.3） |
| 4 | **兩個平行 sub-agent**，各自 fresh context | **做唔到**：呢個環境無 sub-agent tool。改做兩份**分開寫、唔合併、唔 rerank** 嘅報告（§8.3／§8.4），保留「一軸唔好掩蓋另一軸」嘅目的 | 明確偏差 |
| 5 | 兩軸各自總數 + 各軸最差一項，唔揀單一贏家 | §8.8 照做 | ✅ |

### 8.3 ## Standards

**Hard violations：0。** `guard.mjs` 19 綠、`final_check` `ok:true`、`repo_health` PASS、`consistency` 0 FAIL、`preflight` 8/8、`node --check` 10/10、`text-encoding.mjs` 全乾淨 —— 「Skip anything tooling enforces」已跳過。

**Judgement calls（Fowler 12 smells，全部係 labelled heuristic）：**

- **Duplicated Code**：`walk()`／`rel()` 喺 **5 支** script 各寫一次；`AIza` 系列 secret pattern 喺 **5 支**；`MOJIBAKE` 喺 **2 支**。**Repo overrides**：[`START.md`](../templates/repo-starter/START.md) §5 明文要 5 支 script 抄去新 repo 後**各自獨立跑得、零第三方 dep**，抽 `scripts/lib/` 會破壞呢條 → suppress，但記低維護成本（改一條規則要改 5 處）。
- **Shotgun Surgery**：加 `docs/32` 要同步 9 份檔。**Repo overrides**：`docs/README`「加新檔四步」本來就要求索引同步，其餘係指針 → suppress。
- **Speculative Generality**：`consistency_v1.0.mjs` 原本 hardcode `['25'..'32']` 做 nav 檢查 → **已修**，改由 `docByNum` 推導，加 `docs/33` 自動跟。
- 其餘 9 條（Mysterious Name／Feature Envy／Data Clumps／Primitive Obsession／Repeated Switches／Message Chains／Middle Man／Refused Bequest／Divergent Change）：對 4 支新 `.mjs` + 4 份改檔無明顯命中。

**Documented-standard gap（唔當新 FAIL）**：[27 §2](27-repo-starter.md) 第 7 項叫新 repo 加 `CONTRIBUTING.md`，真理倉自己根目錄無；[30 §5](30-repo-health-check.md) 一早記低「自己都缺 …／tests」，屬 backlog。

**Worst within axis**：5 支 script 嘅重複 helper（有防守理由，但改規則要改 5 處，係真實成本）。

### 8.4 ## Spec

| 用戶原句（quote） | 判定 |
|---|---|
| 「我不是想以內容分類,我是想以形式分類…」 | ✅ [28](28-repo-taxonomy.md) 全改形式分類 |
| 「我剛給你的兩個GIT 都是有關設計APP 的你有把他加進去無個REPO 開局要加嗎? 這兩個應該都是很實用的」 | ⚠️ **Partial**：加咗 13a–13d **衍生檔**，但**冇加入任何一支真正嘅 `SKILL.md`**（13b/13c 只係收納約定 + 空白範本）。呢個係我「唔抄 plugin manifest／39KB prompt／Chrome inspector」嘅決定，**唔係你明示** |
| 「每次PUSH 都行一次YML 會不會很麻煩,我自是想AGENT 在設定REPO 前先檢查好」 | ⚠️ **Partial**：移除 `check-skills.yml` → [PREFLIGHT](../templates/repo-starter/PREFLIGHT.md) ✅；但既有 `templates/github/guard.yml` 同本倉 `.github/workflows/guard.yml` 仍有 `on: push`。問過兩次未決定，列 backlog |
| 「…要加入忘記密碼等正常系統會有的基本功能」／「ADMIN 那的回報系統也有記下嗎?(這是通用的)」 | ✅ [31](31-system-basics.md) §2／§3 + 起手包第 14 項 |
| 「最後幫我再整份按我之前給你的GIT 的檢查方式看看整個REPO 內有沒有混亂矛盾的地方」 | ✅ §1–§7；**但「按檢查方式」≠「執行 SKILL」**，呢節補返 |

**Scope creep（冇要求但加咗）**：`scripts/consistency_v1.0.mjs`、`docs/32` 本身 —— 為咗「可重跑」而加，唔係你點名要嘅交付物。
**Implemented-but-looks-wrong（已修）**：`docs/29` 舊句「零依賴 frontmatter checker，對應 taste-skill 嗰支 CI 嘅**檢查內容**」講法過滿 → 改成「frontmatter 規則嘅**核心子集**」（§8.6 負面對照證實）。

**Worst within axis**：兩個 GIT 嘅 **SKILL 本身**冇落入起手包，只加咗衍生檔 —— 如果你期望係「裝 skill」，呢個係最大落差。（**其後已修，見 §8.9**；歷史唔改寫。）

### 8.5 taste-skill `SKILL.md` / `critique.md` 適用性（唔好扮做咗）

| 部分 | 適唔適用 | 點解 |
|---|---|---|
| Steps 1–6（brief／argument／direction／idea／words／build） | ❌ N/A | 本倉係 MD 規則倉，無新 UI 頁面 |
| §7 Gate `lint.mjs`／`inspect.mjs`／`scenes.mjs` | ❌ **冇跑** | 需要 taste-skill 個 Chrome inspector + 真瀏覽器 + 1440/768/390 screenshots；上一版已決定**唔引入**（S 瘦身）。只跑到 CI 入面 3 支零瀏覽器檢查（§8.6） |
| §8 Look **14 passes** | ⚠️ 只 1 條適用 | pass 12「Substance」（內容係咪交齊）同 **content 10%** 可以對 MD；其餘 13 條全部係視覺／screenshot，N/A |
| §9 Move／§10 Report 嘅圖片／credits 部分 | ❌ N/A | 無頁面、無相片；但 §10「do not claim a check you did not run」**照做** |
| 40/30/20/10 加權分 | ❌ **唔計** | design／usability／creativity 冇 screenshots 就無得評；亂計反而違反 SKILL。只寫 content 軸定性判斷 |

`critique.md` §4 格式，只填適用欄（**ROUND 1**）：

```
Seen in one second: 一份 33 章嘅規則／審計 repo，唔係一個 page
Idea (one sentence): 用一個 truth repo 管 85 個 repo 嘅開局、分類同檢查
Live thing: node scripts/*.mjs . --json 會因檔案改動而畀唔同結果
Layout words by section: 全部 table／checklist（視覺 passes N/A）
Scores: design — · usability — · creativity — · content 8 → overall 不計
Caps applied: 視覺 caps 不適用；「無 screenshots」唔係 cap，係做唔到
Top three problems (content 軸，最易睇錯先):
1. docs/27 §1 65/20 同 69/16 兩個計法並列，第一次讀易當矛盾 → 加「兩組數唔好相加」+ 出處
2. docs/29「對應 taste-skill 檢查內容」過滿，講到好似等價 → 改「核心子集」
3. docs/32 自己引用舊講法要由 checker 排除，讀者唔知點解放過自己 → §6 加一列寫明
```

**ROUND 2**：三項已修 → `consistency` 0 FAIL、`docs/32` 加咗呢節說明。**最多 3 輪，唔使去到 3**；`critique.md` §6 講「stop early when a round finds no problem a stranger would notice」。

### 8.6 真正跑咗佢哋嘅**原檔**檢查（唔係我改寫版）

```bash
# taste-skill tests/text-encoding.mjs（原檔；symlink 我哋 102 個檔落佢 ROOT，唔改 repo）
ok - every text file reads as clean UTF-8

# taste-skill tests/frontmatter.mjs（原檔 + 佢 CI 指定嘅 yaml@2.6.1）
# 用 13c 範本嘅 frontmatter 生一個 skills/example/SKILL.md
ok - 1 skills load: every frontmatter parses, names are unique, manifests point at real skills

# 負面對照：13c 警告嘅「未 quote 嘅 word: word」
# description: Use when the user says: review this
not ok - 1 problem(s): YAML YAMLParseError: Nested mappings are not allowed in compact mappings
# 我哋 scripts/check_skills_v1.0.mjs 對同一個檔
FAIL — 1 個問題： description 入面有未 quote 嘅 "word: word"，strict YAML 會出事
# 修返好 → ok - 1 skills load

# taste-skill CI 嘅 node --check 步驟，對我哋 10 支 .mjs
ok - 10 支 .mjs parse 到
```

**結論**：13c 範本嘅 frontmatter **過到** strict parser；我哋零依賴 checker 喺呢個 trap 上同 strict parser 一致，但只係**子集**（`|`／巢狀 YAML／inline JSON 唔支援），所以 `docs/29` 舊句已改，唔再講到等價。

### 8.7 呢輪真正新發現

| # | 發現 | 處理 |
|:--:|---|---|
| 1 | `consistency` nav 檢查 hardcode `25..32` | ✅ 已修改由 `docByNum` 推導 |
| 2 | `docs/29` 「對應檢查內容」過滿 | ✅ 已改「核心子集」 |
| 3 | 根目錄無 `CONTRIBUTING.md`／`CODING_STANDARDS.md` | backlog（[30 §5](30-repo-health-check.md) 已記，唔當新 FAIL） |
| 4 | 5 支 script 重複 helper／secret pattern | **刻意保留**（`START.md` §5 要獨立可抄），列維護成本 |
| 5 | 兩個 GIT 嘅 SKILL **本身**未落入起手包 | **要你決定**：要唔要真係放一份 `SKILL.md` 入 13b？ |
| 6 | 冇 sub-agent、冇 commit、冇瀏覽器、冇 issue tracker |  limitation，唔可以補做，寫低就算 |

### 8.8 一軸一句（SKILL step 5：分開報、唔合併、唔 rerank、唔揀單一贏家）

- **Standards**：0 hard violation、4 項 judgement call（1 已修、3 有防守理由）；**最差** = 5 支 script 重複 helper 嘅維護成本。
- **Spec**：5 句 spec 入面 3 句完成、**2 句 partial**，另有 1 項 scope creep；**最差** = 開局時嘅 skill 執行係後補，唔係一開始就做（§8.9）。

### 8.9 再補：用戶問「SKILL 你用唔用到？有無用？」（呢個先係重點）

> 原句：「問題係SKILL 你用唔用到?同有無用,因為我比你既兩個SKILL 都係整新REPO 時應該要用到的」。呢句指出 §8.4 個 **worst-within-Spec** 唔係「文檔寫得唔夠」，而係**兩份 skill 根本冇放喺開新 repo 嗰陣會被執行嘅位置**。以下係直接答 + 修正。

**① 用唔用到？** 分兩層，唔好撈：

| | 答 |
|---|---|
| **Harness 自動載入**（Claude Code／Codex Skill tool、`npx skills add`、plugin marketplace） | ❌ **用唔到**。呢個 Arena 環境無 Skill tool、無 plugin harness、無 Codex／Claude Code，出網只到 GitHub／npm／PyPI；我唔可以「裝」一個 skill 等佢自動觸發。上一版 13b README 都寫咗「當文件約定用」 |
| **當 AGENT 指示讀嚟執行** | ✅ **用得到**。`SKILL.md` 本質係一份有 frontmatter 嘅 Markdown prompt；任何 agent（包括我、同第日喺新 repo 開工嘅 agent）讀到就可以一步一步跟。呢個係我哋唯一可以老實講「用緊」嘅方式 —— **唔好扮自動注入** |

**② 有無用？** 老實答：
- **做 13a–13d／[27](27-repo-starter.md)／[28](28-repo-taxonomy.md)／[31](31-system-basics.md) 當時：無。** 只讀咗兩個 repo 嘅檔、derive 咗 checklist／checker，冇執行任何一支 SKILL。
- **§8 補審時：部分。** 讀咗 `SKILL.md` 原文、跑咗佢哋嘅原生檢查、跟咗 `code-review` 兩軸同 `critique.md` ROUND 格式，但係**事後 review**，唔係「開新 repo 時用」。
- **而家：補咗落啱嘅位置**（下面）。

**③ 修正：將兩支 SKILL 放喺「整新 REPO 時 AGENT 會讀」嘅位置**

| 加咗 | 位 | 點樣被用 |
|---|---|---|
| [`repo-setup/SKILL.md`](../templates/repo-starter/skills/promoted/repo-setup/SKILL.md) | `templates/repo-starter/skills/promoted/` | **`AGENTS.md` 開工順序第 1 步明文寫「讀 `repo-setup` 呢份 skill 並跟住做」**；內容 = 12 樣核心 → 按形式揀 13／14 → PREFLIGHT → 兩軸 review |
| [`design-review/SKILL.md`](../templates/repo-starter/skills/promoted/design-review/SKILL.md) | 同上 | `repo-setup` 第 4 步**明確指名**「讀 `design-review` 嘅 SKILL.md 並跟住做」（mattpocock 嘅 invocation 約定：指名，唔用 `../` 深連結）；有 UI 先觸發 |
| 兩份 frontmatter | `name` kebab-case、`description: >-` rich trigger、無 `disable-model-invocation`（**model-invoked**） | 用 taste-skill **原檔** `tests/frontmatter.mjs` + `yaml@2.6.1` 實跑：`ok - 2 skills load: every frontmatter parses, names are unique…` |
| `check_skills_v1.0.mjs` | 改咗 | 之前**跳過** `templates/` → 而家全倉掃，真理倉跑出 **2 份合格**（PREFLIGHT 第 8 格會驗到） |
| `consistency_v1.0.mjs` | 新增 `skills-wired` check | 起手包少過 2 份 `SKILL.md`、或 `AGENTS.md` 無指名 → **FAIL**，防止日後又退化做「得個紀錄」 |
| 13b README／`START.md`／[27 §2b](27-repo-starter.md)／[29 §5](29-reading-map.md)／`templates/README.md`／`docs/README.md`／根 README | 同步 | 全部講清楚「開局 AGENT 會讀」，並寫明**呢個環境無自動 harness** |

**④ 仍然係 limitation（唔改）**：無 `agents/openai.yaml`（Codex picker 未實測）、無 `.claude-plugin/`、無 Skill tool 自動觸發、無 Chrome inspector。即係兩份 skill 係**俾 agent 讀嘅可執行 prompt**，唔係「裝咗就會自己彈出嚟」嘅 plugin。要喺 Claude Code／Codex 自動載入，就要再補 harness metadata 並喺嗰個環境實測 —— 未做，唔扮做咗。

**⑤ §8.4 個 worst-within-Spec 更新**：由「兩個 GIT 嘅 SKILL 本身未落入起手包」→ **已修正**（真係放咗 2 份 + 寫入 `AGENTS.md` + 過 strict parser）；但**「有無用」呢題嘅完整答案仍然係「做嘢當時無用、而家先補」**，唔可以因為補咗就改寫歷史。§8.8 個 Spec 一句維持：3 完成／2 partial，最差改為「**開局時嘅 skill 執行係後補，唔係一開始就做**」。

### 8.10 再補：用戶要求「開 REPO 時 AGENT 主動問清楚需求」

> 原句：「同開REPO 時要AGENT 主動問用戶了解清楚用戶需求」。呢個補咗 §8.9 最後一個窿：兩份 SKILL.md 而家係**有指示**，但指示第一步應該係**問**，唔係即刻抄檔。

- 讀咗 mattpocock 第三份原文：[`skills/productivity/grilling/SKILL.md`](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)（**2,077 bytes**）同 `grill-me/SKILL.md`（157 bytes，user-invoked，內容只係「Call the Skill tool with "grilling"」）。`grilling` 嘅方法：**design tree／frontier**、一輪問晒而家問得嘅問題、每題編號 + 俾建議答案、**finding facts is your job, never the user's**、問到 frontier 空晒、**用戶確認先好郁手**。
- 落成 [`templates/repo-starter/INTAKE.md`](../templates/repo-starter/INTAKE.md)：第 1 輪 7 條（**形式**／UI／身份／後台／Gemini／授權／一句定位；**特登唔問內容／主題分類**，因為用戶早前明確拒絕）；第 2 輪只問被解鎖嘅；答案對照表直接 mapping 去 12 樣／13a–d／第 14 項；寫入 `SCOPE.md` + README 第一句。
- 根 `README.md` 🆕 區由 **5 步改 6 步（0–5）**，**第 0 步最緊要**；根 `AGENTS.md` ②a、`repo-setup/SKILL.md` 開局步驟 0、`START.md` ⓪、starter `AGENTS.md`、`templates/README.md`、`docs/README.md`、[27 §2](27-repo-starter.md) 全部同步。
- `consistency_v1.0.mjs` 加 `intake-wired` check：缺 `INTAKE.md`／根 README 🆕 區無指去佢／`repo-setup` 無第 0 步 → **FAIL**。
- **仍然係方法借用，唔係 skill 執行**：無 Skill tool、無 sub-agent；`grilling` 原文叫 dispatch sub-agent 搵 fact，呢個環境做唔到，改做 AGENT 自己 `ls`／讀檔。呢點寫咗落 `INTAKE.md` 未核實。

### 8.11 再補（2026-11-02 第二輪）：抽出 G11 + 實體 external SKILL + 「加 skill 必入目錄」

> 用戶確認整體寫法啱，只提兩點：① G11 圖標標準喺根 README §9 佔太長，應抽去 docs，README 只留原則 + link；② `INTAKE.md` 只係文字引用 `mattpocock grilling/SKILL.md`，無實體檔，AGENT 搵唔到會當「呃佢」。再加一句：**「同時更新讓以後你 SKILL 入加入目錄」** —— 即係唔只要補今次，仲要令**之後每一次加 SKILL 都自動被逼入目錄**。

**① G11 抽出**

| 項 | 實測／做法 |
|---|---|
| 原況 | 根 README **12 個 H2**、416 行；§9 由 279 行到 EOF 共 **138 行**（9.1–9.11 小節） |
| 改名 | **唔用 `docs/09-icon-standard.md`**：`docs/09-gemini-canvas.md` 已存在，`docs/README.md` §命名寫明「兩位數前綴，章節只可往後加，唔好插中間改號」。已用最大 = 32 → **`docs/33-icon-standard.md`**（142 行，小節改 1–11，`§9.8` → `§8`、相對連結改 `05-git.md`／`01-slim.md`） |
| README §9 | **保留 `## 9. G11 全站圖標標準（Icon／Favicon）` H2**（唔壞 `README.md#9-g11-...` 既有錨點），只留 5 行：一句原則 + 指針 + 日期 + §4 配合。README 416 → **284 行** |
| 暗雷 | `guard.mjs:410` 原本 `read('README.md')` 硬驗 9 個圖標檔名喺 README → 抽走即 FAIL。改成 `readme + docs/33`（`existsSync` 先判），**新 repo 無 docs/33 仍向後兼容** |
| 反面既有決定 | `README.md:198`「圖標規範唔另開 docs：唯一來源係 README §9」改做「唯一來源係 docs/33」；`PLAYBOOK S6`／`PLAYBOOK §G11`／`docs/05` 頭同 `:169`／`docs/10:32`／README `:82,160` 全部改指 docs/33 |
| 索引 | `docs/README.md` 章 6 加 `33-icon-standard.md` 行；根 README §1 既有用 `docs/33-` 嘅導覽行（`nav-coverage` 由 `docByNum` 推導，加 33 自動跟） |

**② `external/grilling` 實體檔**

- [`skills/external/grilling/SKILL.md`](../templates/repo-starter/skills/external/grilling/SKILL.md)：`gh api` 重新 pull **2,077 bytes verbatim**，frontmatter 之後加 MIT 出處／日期／「唔好直接執行」blockquote，正文一字不改，最底另標「本地註記（非原文）」。**唔複製 `grill-me`**（佢只係 `Call the Skill tool with "grilling"`，呢個環境無對應工具，放咗反而誤導）。
- 13b README §1 由「三分 bucket」變 **4 個**（加 `external/`：只作引用＋溯源、唔改、唔 promote、唔入根 README）。
- `INTAKE.md`／`repo-setup` 第 0 步／`START.md` ⓪／根 README 🆕 第 0 步／根 AGENTS ②a／[27 §2b](27-repo-starter.md)／[29 §5](29-reading-map.md)／`templates/README.md`／`PREFLIGHT.md` 全部改 **本地連結優先 + 外連做來源**。

**③ 「以後加 SKILL 必入目錄」（用戶呢句嘅重點）**

- 新檔 [`skills/CATALOG.md`](../templates/repo-starter/skills/CATALOG.md)：**唯一目錄**（3 行：`repo-setup`／`design-review`／`grilling`，各要有 `name` + 完整相對路徑）＋ **加新 SKILL 四步**（生檔 → 驗 frontmatter → **加目錄行 + `AGENTS.md` 指名** → PREFLIGHT／consistency 綠先 commit）。13b README §0 個兩行表**刪咗**，改做指針，避免一個事實寫兩次。
- `scripts/check_skills_v1.0.mjs`：見到 `skills/CATALOG.md` 就逐份對 `name` + `f.where`；缺一 `FAIL`。**冇 catalog 嘅舊 repo 唔扮有**（例如單數 `skill/` 嘅 `answer` repo 照 PASS）。`--json` 多咗 `catalog: true/false`。
- `scripts/consistency_v1.0.mjs` 新增 **`skills-catalog`**：缺 CATALOG.md ／任一 SKILL 未入目錄 ／ `docs/README.md`・`templates/README.md`・13b README・starter `AGENTS.md` 無指去 CATALOG.md → **FAIL**；`skills-wired` 訊息由「預期 2 份」改「至少 2 份核心」。改完未同步索引嘅中間狀態實測 **5 FAIL**（負面對照），補完 0 FAIL。
- 即係：**唔靠 AGENT 記得**。PREFLIGHT 第 8 格（新 repo）同 `consistency`（真理倉）兩層都會擋。

**仍然係 limitation**：無 Skill tool／plugin harness，CATALOG.md 係**目錄 + 文件約定**唔係 manifest，唔會令 skill 自動載入；`external/grilling` 原文嘅 sub-agent 搵 fact 喺呢個環境做唔到，本地化版喺 `INTAKE.md`。
