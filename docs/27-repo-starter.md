# 27 — 每個 Repo 開局要加乜（起手包）

> 接 [docs/README](README.md) 章 6 · 可抄檔案：[`templates/repo-starter/START.md`](../templates/repo-starter/START.md)
> 調查日期：2026-11-02（85 個 public repo 檔案樹 + GitHub metadata，方法同限制見 [25 §1](25-reverse-api-reuse.md)）

---

## 1. 點解要講呢題：而家嘅底線有幾參差

| 項目 | 有 | 無 | 解讀 |
|---|:--:|:--:|---|
| `README.md` | 65 | 20 | 有 20 個 repo 連一句定位都冇。**兩組數唔好相加**：空殼／預留共 **12** 個（[28 §3](28-repo-taxonomy.md)，按檔案樹計）；呢度 65/20 係「根目錄有冇 `README.md`」，另一個計法（GitHub `/readme` API）係 69/16 |
| GitHub 辨識到嘅 `LICENSE` | **5** | **80** | [20](20-repo-health-audit.md) 一早講過：公開 repo 無授權 = 預設版權保留 |
| `AGENTS.md` | 4 | 81 | Agent 入到去唔知開工順序同邊界 |
| `CONTRIBUTING.md` | 1 | 84 | issue／PR 無路由 |
| `CHANGELOG.md` | 2 | 83 | 配合 V 雙版號嘅紀錄缺失 |
| `.github/workflows/` | 13 | 72 | 得 13 個 repo 有 CI |
| `.gitignore` | 59 | 26 | 部分係空 repo，但其餘要補 |
| `docs/` | 33 | 52 | 文件散落根目錄 |

> **唔係叫你一次過幫 85 個 repo 補檔**。正確做法：新 repo 由起手包開局；舊 repo 按 [30](30-repo-health-check.md) 嘅 L2 每季 audit，按風險排優先（有 key／有 scrape／有用戶資料嘅先）。

## 2. 12 樣必加（對應 START.md 個 tick list）

| # | 檔 | 點解（一句） | 邊度抄 | 點檢查 |
|:--:|---|---|---|---|
| 1 | `README.md` | 5 分鐘入口：一句定位、點跑、去邊搵嘢 | 起手包 | `repo_health` R |
| 2 | `AGENTS.md` | Agent 開工順序 + 可改／不可改矩陣 | 起手包 | `repo_health` A |
| 3 | `LICENSE` | 無授權 = 人哋唔知可唔可以用 | 起手包 `LICENSE-MIT.txt`（**先揀**） | `repo_health` L |
| 4 | `.gitignore` | secret／`node_modules`／大檔／注入版唔入 Git | [`templates/git/gitignore`](../templates/git/gitignore) | `repo_health` G |
| 5 | `SCOPE.md` | 做乜／唔做乜 + 收貨兩條 bar | 起手包 | `repo_health` O |
| 6 | `GLOSSARY.md` | 共用語言，慳返 Agent 一堆贅字 | 起手包 | `repo_health` Y |
| 7 | `CONTRIBUTING.md` | issue 去邊、PR 最低要求、AI 寫 issue 底線 | 起手包 | `repo_health` C |
| 8 | `CHANGELOG.md` | 每次改版一行，配合 V 規則 | 起手包 | `repo_health` H |
| 9 | `docs/00-quickcard.md` | 一頁紙；之後 `NN-kebab-case.md` | 起手包 `docs/quickcard.md` | `repo_health` D |
| 10 | `docs/adr/0000-template.md` | 難逆轉決定先寫一段 ADR | 起手包 | `repo_health` D |
| 11 | `.github/workflows/guard.yml` | 每週自動掃 secret／連結／體積 | [`templates/github/guard.yml`](../templates/github/guard.yml) | `repo_health` W |
| 12 | `scripts/guard.mjs` + `final_check` | 交付前一條命令六角度 | 真理倉 `scripts/` | `repo_health` S |

**按 P1 三分類加減**（[PLAYBOOK §0](../PLAYBOOK.md)）。**呢張表嘅答案要由 [`INTAKE.md`](../templates/repo-starter/INTAKE.md) 第 0 步問用戶攞，唔好 AGENT 自己估**（用戶明確要按**形式**分，唔係內容／主題）：

| 類型 | 必加 | 額外 |
|---|---|---|
| 工具（stateless） | 12 樣全齊（可簡化 SCOPE／GLOSSARY） | 只需 S/F/A/W/V |
| App（有資料） | 12 樣 | + 設定層、備份、私隱同意（A12） |
| 系統（多層／有身份） | 12 樣 | + 設定層 + 隱藏超管 + registry + 審計鏈，**一個都唔少**；＋ [31](31-system-basics.md) 嘅**帳號生命週期 8 樣（含忘記密碼）**同 **ADMIN 回報系統 8 樣**（[起手包第 14 項](../templates/repo-starter/docs/system-basics.md)） |

> **2026-11-02 補**：「正常系統會有嘅基本功能」之前散喺 [`BUILD.md`](../BUILD.md) §2／[03 A5](03-security.md)／`A17`，無一張開局 checklist；**ADMIN 回報系統完全無記錄**（只有 [`GEMINI`](https://github.com/playerkousas-rgb/GEMINI) 個別 repo 有）。兩份而家收埋喺 [31](31-system-basics.md)，並加落 [10 §1.4](10-checklists.md) 同 [30 §6](30-repo-health-check.md)。**唔開新 A-ID**，全部掛返現有 A3/A4/A5/A8/A12/A13/A17 + VL7。

## 2b. 第 13 項：13a–13c 按形式加、13d PREFLIGHT 必跑（2026-11-02 補）

> 你提嗰兩個 repo —— [mattpocock/skills](https://github.com/mattpocock/skills) 同 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) —— **應該加，之前只加咗一半**。但唔係塞落 12 樣核心：30 個「輕」工具／知識倉／資料管道唔需要。按 [28](28-repo-taxonomy.md) 嘅**形式**揀：

| 形式 | 第 13 項（**13a–13c**） |
|---|---|
| 框架 SPA／PWA、後台 App／多層系統（**有 UI**） | ✅ `design-review.md` |
| 有 `SKILL.md`／RAG 知識包／agent 工作流 | ✅ `docs/skills/` |
| 單一 HTML／少檔靜態（出畫面嘅 Canvas app） | ⚠️ 只加 `design-review.md` |
| 知識／索引倉、資料管道、空殼／預留 | ❌ 唔加 13a–13c，留返 12 樣 |

> **13d PREFLIGHT 唔跟形式**：所有新 repo 開局都要跑一次（寫入 `AGENTS.md` 第 0 步），上表只決定 13a–13c。
> **13b 嘅兩份 `SKILL.md` 亦唔跟形式**：佢哋係「開新 repo 嗰個 AGENT」要用嘅指示（寫入 `AGENTS.md` 第 1 步），唔係等目標 repo 有 RAG 先至加。目標 repo 要唔要**留低** `skills/` 就按上表形式決定（[32 §8.9](32-consistency-audit.md)）。

| # | 檔 | 借自 | 實際加到乜 |
|:--:|---|---|---|
| 13a | [`docs/design-review.md`](../templates/repo-starter/docs/design-review.md) | taste-skill | 反 slop house style、頁面 vs app 屏幕、inventory 8–12 件、每段 claim＋proof、`390/768/1440` 三寬度 look-and-fix、6 條 critique、評分 40/30/20/10；**零依賴、無 Chrome inspector** |
| 13b | [`docs/skills/README.md`](../templates/repo-starter/docs/skills/README.md) ＋ [`skills/promoted/repo-setup/SKILL.md`](../templates/repo-starter/skills/promoted/repo-setup/SKILL.md) ＋ [`design-review/SKILL.md`](../templates/repo-starter/skills/promoted/design-review/SKILL.md) | mattpocock × taste-skill | 三分 bucket ＋ invocation 軸 ＋ progressive disclosure，再加**兩份真正可執行嘅 `SKILL.md`**：`repo-setup`（開局 12 樣／13 項／第 14 項／兩軸 review）同 `design-review`（望圖）；`AGENTS.md` 開工順序明確指名 |
| 13c | [`docs/skills/0000-template.md`](../templates/repo-starter/docs/skills/0000-template.md) | 兩者 | `SKILL.md` frontmatter 規格（kebab-case ≤64／description ≤1024／唯一名／boolean flag）＋ What／When／Common questions／It's working if 四段 |
| 13d | [`PREFLIGHT.md`](../templates/repo-starter/PREFLIGHT.md) ＋ [`scripts/preflight_v1.0.mjs`](../scripts/preflight_v1.0.mjs) | taste-skill 嘅**檢查內容**，改咗**觸發時機** | AGENT 喺**設定／commit repo 之前**一條命令擋住：8 個 check（scripts 齊／placeholder／UTF-8／`node --check`／guard／final_check／repo_health／check_skills） |

### 13d 點解唔係一條 YML（2026-11-02 修正）

上一版我加咗 `.github/workflows/check-skills.yml`（`on: push`），你指出「每次 push 跑一次好麻煩、只想 AGENT 設定 repo 前先檢查好」—— **呢個方向啱，已改**：

| | 上一版（YML） | 而家（PREFLIGHT） |
|---|---|---|
| 觸發 | Git `push`／PR，GitHub runner | **AGENT 本機**，寫入 `AGENTS.md` 開工順序第 **0** 步 |
| 時機 | 已經 commit／push **之後** | **未設定、未 commit 之前** |
| 擋到未 | ❌ 事後先話你知 | ✅ `exit 1` 即刻停手 |
| 每個 repo 成本 | 多 1 個 `.yml` + Actions minutes | 0 個新檔（用返已抄嘅 `scripts/`） |
| 需要 | 網絡／GitHub | 得 `node`，零第三方 dep |

`preflight_v1.0.mjs` 係 **orchestrator**，唔複製規則：佢 `spawn` 返 [`guard.mjs`](../scripts/guard.mjs)／[`final_check_v1.0.mjs`](../scripts/final_check_v1.0.mjs)／[`repo_health_v1.0.mjs`](../scripts/repo_health_v1.0.mjs)／[`check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)，另外補三樣 CI 先有嘅靜態檢查（未填 placeholder、UTF-8 雙重編碼、`.mjs` syntax）。**同一組檢查，早咗一個階段跑，而且由 AGENT 話事。**

> 補充：12 樣核心第 11 項個 [`templates/github/guard.yml`](../templates/github/guard.yml) 本身就係 `push: ['**']` + 每週 `cron`（唔係我新加）。佢係**改咗之後防 regress** 嘅網，同開局 gate 唔同層；如果你連佢都想唔好每次 push，可以改做 `pull_request` + `schedule` + `workflow_dispatch`（見 [PREFLIGHT.md](../templates/repo-starter/PREFLIGHT.md) 末段）。

**兩者係兩層「設計」，夾啱補到起手包最弱嗰兩忽**：

- `mattpocock/skills` = **設計個 repo 嘅知識結構**（點收納、邊個可以呼叫、點寫 ADR／glossary）→ 之前已落地喺 12 樣嘅 `SCOPE`／`GLOSSARY`／ADR／`out-of-scope`，今次補埋 `docs/skills/`。
- `taste-skill` = **設計個畫面**（美術方向、望圖自檢）→ 之前**只得** [29 §5](29-reading-map.md) 評審 + [`check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)，起手包完全無 UI 檢查，今次補 `design-review.md` ＋ PREFLIGHT 入面嘅 UTF-8／syntax 檢查。

**唔抄**：39KB `SKILL.md`、247 站 library、Chrome inspector／`inspect.mjs`、plugin manifest、Node 22 工具鏈、`npm install yaml@2.6.1` —— 同 S 瘦身／零依賴／C13-g 單一 HTML 5MB 衝突（理由見 [29 §5](29-reading-map.md)）。要真係用先至另外做 P1 比較。

## 3. 授權點揀（唔好順手用 MIT）

| 你想 | 建議 | 注意 |
|---|---|---|
| 俾人隨便改、商用都得 | MIT（起手包範本） | 要保留 copyright notice |
| 只俾非商用／教育 | CC-BY-NC-4.0 | [`answer/skill/hk-scout-kb/SKILL.md`](https://github.com/playerkousas-rgb/answer/blob/main/skill/hk-scout-kb/SKILL.md) 用呢個 + 非官方 disclaimer |
| 內容係官方文件轉錄 | **唔好亂授權** | `MD`／`answer` 要寫明原稿版權屬總會（W8） |
| 唔公開／內部用 | 唔加 LICENSE，改放 `SCOPE.md` 講清楚 | 但 repo 設 private |

揀完要改 `LICENSE` 入面 `{{YEAR}} {{OWNER}}`，`grep -rn '{{' .` 要零結果先至 commit。

## 4. 兩個外國 repo：逐項對照「已落地／今次補」

[mattpocock/skills](https://github.com/mattpocock/skills) 同 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) 詳細評審見 [29 §5](29-reading-map.md)。**狀態欄**係 2026-11-02 核對起手包實際檔案嘅結果，唔係「評審過就算加咗」。

| 佢哋嘅做法 | 我哋變成 | 狀態 |
|---|---|:--:|
| `AGENTS.md` 開頭就寫「skills 分 bucket、邊啲要入 README／plugin.json」 | 起手包 `AGENTS.md` 寫「開工順序 + 可改／不可改」 | ✅ 舊有 |
| `SCOPE.md` 兩條 bar + `.out-of-scope/` 一個拒絕一個檔 | `SCOPE.md` + `docs/out-of-scope/` | ✅ 舊有 |
| `GLOSSARY.md` 定義／避免用／關係／已釐清歧義 | 同名檔，同樣四段 | ✅ 舊有 |
| `CONTRIBUTING.md` 路由表 + 「AI 寫 issue 五條」 | 同名檔，改成自己嘅 issue template | ✅ 舊有 |
| `docs/adr/0001-*.md` 一段式 ADR + 三條「幾時寫」 | `docs/adr/0000-template.md` | ✅ 舊有 |
| `CHANGELOG.md` + `.changeset/` + `claude plugin validate --strict` | CHANGELOG + `guard.mjs`／`final_check` 做單一真理 | ✅ 舊有 |
| `check-skills.yml` 驗 `SKILL.md` frontmatter、UTF-8、`node --check` | [`scripts/check_skills_v1.0.mjs`](../scripts/check_skills_v1.0.mjs)（零依賴） | ✅ 舊有（而家由 PREFLIGHT 一次過叫） |
| `.agents/invocation.md` 分 user-／model-invoked | `docs/skills/README.md` 兩欄對照 + `0000-template.md` 嘅 `disable-model-invocation` | 🆕 §2b 13b/13c |
| `docs/<bucket>/<skill>.md` mirror + 四段式 skill doc | `docs/skills/0000-template.md`（What／When／Common questions／It's working if） | 🆕 §2b 13c |
| `check-skills.yml` 每次 push 自動跑（唔靠人手記得） | **唔抄呢個時機**：改做 [`PREFLIGHT.md`](../templates/repo-starter/PREFLIGHT.md) + [`preflight_v1.0.mjs`](../scripts/preflight_v1.0.mjs)，由 AGENT **設定 repo 前**跑 | 🆕 §2b 13d（已按你意思改） |
| `SKILL.md` 反 slop、`references/critique.md` 14 passes、`evals/` 三寬度 | `docs/design-review.md`（6 條 critique + look-and-fix loop） | 🆕 §2b 13a |

**唔好照抄**：佢哋係 Claude／Codex plugin 專用（`.claude-plugin/`、marketplace.json、每 skill 一個 `agents/openai.yaml`），你哋生態係 Git + Vercel + GAS + Supabase + Gemini Canvas，唔需要整套 plugin manifest；taste-skill 嘅 Chrome inspector／247 站 library 亦唔適合落 85 個 repo（尤其 30 個「輕」）。

## 5. 10 分鐘開局（可直接貼）

```bash
# ⓪ AGENT 第一步：未抄檔之前，先驗真理倉個起手包冇壞
node /path/to/readme/scripts/preflight_v1.0.mjs /path/to/readme --allow-placeholders --json

cp -r /path/to/readme/templates/repo-starter/. /path/to/NEW_REPO/
cd /path/to/NEW_REPO
grep -rn '{{' .                       # 改晒 placeholders
# 由唯一真理倉抄現成模板，唔好喺起手包複製第二份
cp /path/to/readme/templates/git/gitignore .gitignore
cp /path/to/readme/templates/vercel/vercelignore .vercelignore   # guard S2
mkdir -p .github/workflows
cp /path/to/readme/templates/github/guard.yml .github/workflows/guard.yml
cp /path/to/readme/templates/repo-starter/LICENSE-MIT.txt LICENSE   # 揀好授權先
# PREFLIGHT gate 要用到呢五支（由真理倉抄，唔好喺起手包複製第二份）
mkdir -p scripts
cp /path/to/readme/scripts/{guard.mjs,final_check_v1.0.mjs,check_skills_v1.0.mjs,repo_health_v1.0.mjs,preflight_v1.0.mjs} scripts/
git init && git add -A
node scripts/preflight_v1.0.mjs . --json    # exit 1 = 唔好 commit（取代逐支分開跑）
```

> **順序係重點**：⓪ 驗來源 → 抄 → 填 placeholder → ① 驗目標 → `ok: true` 先至 commit。CI 係之後防 regress，唔係呢一步。

## 6. 開局常見錯（全部喺你 Git 見過）

| 錯 | 出處 | 起手包點擋 |
|---|---|---|
| 公開 repo 無 LICENSE | [20](20-repo-health-audit.md) | 第 3 項 + health check L |
| 硬編碼 Bearer token 喺 `sources.json` | [25 §6](25-reverse-api-reuse.md) | `.gitignore` + guard W6 + health check secret scan |
| 每日 `git commit` 可再生 scrape JSON | [20](20-repo-health-audit.md)／[21](21-fix-plans.md) | health check 偵測 `schedule:` + `git commit` |
| Playwright 137MB 入部署 bundle | [25 §6](25-reverse-api-reuse.md)／[01](01-slim.md) | health check 大檔 + S7 |
| README 係 `create-next-app` 預設文 | `scout-policy-assistant`／`knotmaster`／`skw-score` | 第 1 項 + health check「模板未改」偵測 |
| 案例規格當通用規則 | [AGENTS.md ②b](../AGENTS.md) | `SCOPE.md` + `docs/` 分章（[docs/README](README.md) 章 5） |
