# {{REPO_NAME}} — {{ONE_LINE_PURPOSE}}

> **一句話**：{{WHAT_IT_IS_AND_WHO_USES_IT}}
> 類型（P1 三分類）：工具 / App / 系統 = {{TYPE}} · 技術棧：{{STACK}}
> 非官方聲明（如適用）：{{UNOFFICIAL_DISCLAIMER}}

更新日期：{{YYYY-MM-DD}} · 負責：{{OWNER}} · 授權：{{LICENSE_SPDX}}

---

## 5 分鐘

| 我想… | 去 |
|---|---|
| 即刻跑 | {{RUN_COMMAND_OR_URL}} |
| 知規矩／先理解架構 | [AGENTS.md](AGENTS.md) · [SCOPE.md](SCOPE.md) · [GLOSSARY.md](GLOSSARY.md) · [ARCHITECTURE.md](ARCHITECTURE.md) |
| 一頁紙速查 | [docs/quickcard.md](docs/quickcard.md) |
| 交付前檢查 | `node scripts/guard.mjs` + `node scripts/final_check_v1.0.mjs --json` |
| 出事 | {{INCIDENT_DOC_OR_RUNBOOK}} |
| 改版紀錄 | [CHANGELOG.md](CHANGELOG.md) · [CONTRIBUTING.md](CONTRIBUTING.md) |

## 呢個 repo 唔係乜

- {{NOT_DOING_1}}
- {{NOT_DOING_2}}
- 詳細界線同「已拒絕嘅提議」：[SCOPE.md](SCOPE.md) · `docs/out-of-scope/`

## 目錄

```
README.md          入口
AGENTS.md          Agent 開工順序 / 邊界
ARCHITECTURE.md    D1：設計者維護嘅入口／元件／資料流地圖（後續 Agent 先讀）
SCOPE.md           做乜 / 唔做乜
GLOSSARY.md        共用語言
CONTRIBUTING.md    點提 issue / PR
CHANGELOG.md       改版紀錄
LICENSE            授權
docs/              文件（NN-kebab-case.md）
scripts/           檢查同工具
tests/             測試
.github/workflows/ CI
```

## 驗收（交付前）

```
[ ] 五大通用鐵律 S / F / A / W / V（見真理倉 PLAYBOOK）
[ ] D1：`ARCHITECTURE.md` 已由設計者畫出、架構改動已更新；後續 Agent 先讀地圖
[ ] P1：研發前查過相近產品 + 自己現有方案，來源同未核實項寫低
[ ] 無真 key、無 .env、無大檔入 Git
[ ] `node scripts/repo_health_v1.0.mjs .` 0 FAIL
[ ] **條件式規則（按類型，唔中都要喺 PR 寫 N/A）**：
      L1–L6 雙語（有 UI）· I1–I8／UP PWA（有 manifest）· SG1–SG19 入口白名單／關站（要經官方入口入）· 金魚審（文件要交畀其他人執行）
[ ] 交付前對一次真理倉 PLAYBOOK §10（驗收閘 Definition of Done）17 項 —— 呢張 5 行唔等於 §10
```

---

{{COPYRIGHT_LINE}}
