# AGENTS — {{REPO_NAME}} 開工邊界

> **Agent 第一行讀呢度。** 同 [README.md](README.md) 衝突時，以通用安全／防呆底線為先。

## 開工順序

> **開新 repo 嘅 AGENT（前置步 pre-step，喺下面開工順序之前）**：如果未問清楚用戶需求，先去 [`INTAKE.md`](INTAKE.md) 主動問（一輪問晒 + 建議答案 + 用戶確認），答案寫入 `SCOPE.md`；**唔好靠估**。方法原文 `grilling` 放咗喺 [`skills/external/grilling/SKILL.md`](skills/external/grilling/SKILL.md)（只作溯源，唔直接執行）。用戶喺真理倉 README 已經答咗並確認就跳過。真理倉 README 叫呢步做「第 0 步」，本檔下面個 `0.` 係**開工順序**第一步，兩者唔同層。

> **加新 skill**：一定要跟 [`skills/CATALOG.md`](skills/CATALOG.md) §2 四步（生檔 → 驗 frontmatter → **加目錄行 + 呢份 AGENTS.md 指名** → PREFLIGHT／consistency 綠）。`check_skills` 會自動對，漏即 FAIL。

0. **先讀 `repo-setup` 並完成 D1 地圖**：[`skills/promoted/repo-setup/SKILL.md`](skills/promoted/repo-setup/SKILL.md)。新 repo 必須先根據已確認需求寫好根目錄 [`ARCHITECTURE.md`](ARCHITECTURE.md)，再開始實作；按形式揀第 13／14 項及兩軸 review 亦跟呢份 skill；有 UI／要出畫面再讀 [`design-review`](skills/promoted/design-review/SKILL.md)，要加 UI 動態再讀 [`web-motion`](skills/promoted/web-motion/SKILL.md)（編號庫原文 [motion-prompt](skills/external/motion-prompt/SKILL.md) 只作溯源，施工跟 `web-motion`）。收納約定見 [`docs/skills/README.md`](docs/skills/README.md)。
   > ⚠️ **skill 要 AGENT 主動讀，唔會自動彈出嚟**：完成地圖後先跑下一步 PREFLIGHT；新 repo 無 Skill tool／plugin harness。
1. **PREFLIGHT gate（已填地圖後、未 commit 前）**：`node scripts/preflight_v1.0.mjs . --json` → 9/9 `ok: true` 先好開始實作／commit；`exit 1` 就停手。詳見 [PREFLIGHT.md](PREFLIGHT.md)。
2. 讀 [README.md](README.md)（5 分鐘入口）→ [SCOPE.md](SCOPE.md)（做乜／唔做乜）→ [GLOSSARY.md](GLOSSARY.md)（共用語言）→ [`ARCHITECTURE.md`](ARCHITECTURE.md)（後續每次接手先理解元件、邊界、資料流與依賴）。
3. 對 [docs/quickcard.md](docs/quickcard.md) 嘅一頁紙 checklist。
4. 通用規則去真理倉 [README](https://github.com/playerkousas-rgb/readme) 同 [PLAYBOOK](https://github.com/playerkousas-rgb/readme/blob/main/PLAYBOOK.md)；**唔好喺本 repo 複製第二份**。
5. 改動前後各跑一次 `node scripts/guard.mjs`；交付前 `node scripts/final_check_v1.0.mjs --json`。

## 可改 / 唔好改

| 可改 | 唔好改（除非用戶明講 + 寫例外原因） |
|---|---|
| `src/`、`app/`、測試、文件 | 設定層唯一入口、registry、身份／授權邏輯 |
| 新增 `docs/NN-*.md`（要同步更新目錄）；按 D1 更新 `ARCHITECTURE.md` | 已定案嘅對外 contract／API schema；未確認就改元件責任／資料流／跨 App 依賴 |
| 修 bug、加測試 | 將 secret 由 server 搬去前端 |

## 條件式規則（唔會自動彈，要自己查）

> 下面五族**唔屬五大鐵律**，但中咗就會喺驗收被查；中唔中由你在第 0 步問清楚。中咗就照住做，冇中就喺 PR 寫 `N/A + 原因`：

| 族 | 幾時觸發 | 去邊睇 |
|---|---|---|
| **L1–L6 雙語介面** | 有 UI 而且雙閘達標（體積＋≤300 字串） | 真理倉 PLAYBOOK §7.5 ／後端 docs/44 |
| **I1–I8／UP1–UP5 PWA** | 有 `manifest`／要「加入主畫面」 | §7.6 ／docs/46 |
| **SG1–SG19 入口白名單／關站** | 要經 APP STORE／圖書館等官方入口進入 | §7.7 ／docs/50（**第 0 步就要問用戶**，`INTAKE` Q8） |
| **SG18 讚好／收藏掣** | **所有新 App 必做（2026-11-21 定案，唔分 A／B／C 組）** | 真理倉 docs/60 ／docs/50（SG18）—— 參考航空圖鑑 v0.37.0 |
| **金魚審** | 文件要交畀其他人／其他 AGENT 執行 | 真理倉 docs/52 ／本 repo `docs/fresh-eyes-review.md`（13e） |

## 鐵律捷徑

- **S**：唔好用嘅嘢一件都唔部署；交付檔 ≤5MB。
- **F**：fail closed、白名單、冪等、dry-run。
- **A**：secret 只留 server；所有授權 server-side 計；log 唔記 PII。
- **W**：每個交付檔有可見版權 + 第三方素材標來源。
- **V**：改交付檔 = 檔名版號 + 內文版號 + 頁尾一齊改，並寫 [CHANGELOG.md](CHANGELOG.md)。

## 做完要留低

- [CHANGELOG.md](CHANGELOG.md) 一行、`docs/adr/` 一份 ADR（只限難逆轉嘅決定）。
- SG18 掣嘅驗收（掣存在、fail-safe hidden、窄屏/print/雙語）一項寫落 CHANGELOG 驗收記錄 —— PREFLIGHT 驗 **唔到**呢件事（靜態檢查），人手驗證。
- 未核實事項寫「待查」，唔好當已完成；提 issue／PR 跟 [CONTRIBUTING.md](CONTRIBUTING.md)。
