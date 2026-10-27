# AGENTS — Agent 級別與施工邊界 (防「咩都做曬」)

> 🤖 **AGENT BOOT（任何 Agent 第一行讀呢度）**
> ① 呢個 repo 係**真理倉**，唔係 app；唔好喺度直接改模板當交付。
> ② 開工順序：`AGENTS.md` 本段 → [README 導覽](README.md#1-我要做嘢應該睇邊份導覽) → [PLAYBOOK 規則 ID](PLAYBOOK.md)（通用規則；**旅團專案案例喺 [19](docs/19-ecportal-troop-case.md)，唔好當通用**）→ [17 STEP BY STEP](docs/17-final-check-and-tutorial.md#2--step-by-step由零到一個-app)。
> ②b 本檔 §1–2 嘅五級階梯同可改/不可改矩陣**屬專案案例**，已集中去 [19](docs/19-ecportal-troop-case.md)（可選模式 R1–R8 喺 §14，**唔係通用底線**）；[18](docs/18-as-built-gap-audit.md) 係對照審計記錄；[20](docs/20-repo-health-audit.md) 係 11 個 repo 健康檢查。
> ③ 交付前跑 `node scripts/final_check_v1.0.mjs --json`；六角度全綠先至交付。
> ④ `BUILD.md` / `EXTERNAL.md` / 本檔其餘部分是 **ecportal as-built 案例**，唔好當通用規則；衝突以 PLAYBOOK 為準。

> **跨專案底線（2026-10-26 加註）**：任何 Agent 喺呢個生態系開工，先讀 **[README.md](README.md)** 同 **[PLAYBOOK.md](PLAYBOOK.md)**。
> 嗰度嘅瘦身 S／防呆 F／安全 A／COPYRIGHT SCOUT SYSTEM W／雙版號 V 係**所有 app 嘅最低要求**；本檔同 `BUILD.md` 係 ecportal 專案嘅執行面，兩者衝突時以安全／防呆底線為先，並喺 PR 寫明例外。
> Gemini app 分三種結構（[docs/09-gemini-canvas.md](docs/09-gemini-canvas.md)）：A 全開放／B 隱藏水印／C 腦殼分離。
> 每次更新交付檔要**檔名＋內文同時改版號**（[docs/13-versioning.md](docs/13-versioning.md)）；每個交付檔要有 © SCOUT SYSTEM（[docs/12-copyright-scout-system.md](docs/12-copyright-scout-system.md)）。
> **C13（2026-10-27 定案）**：單一 HTML 嘅**正確自動注入 = 三軌同一套** —— ① 全檔唯一 `const API_KEY = ""` 注入 slot ② `credentials:'include'` + 冇 key 唔加 `?key=` 平台代理 ③ `safeStore` BYOK 後備。**用戶已實作、實測可用**；BYOK key 用 `x-goog-api-key` header（[docs/14 §1.1](docs/14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)）。
> **C13-g**：單一 HTML / Gemini Canvas app **唔經 Vercel、唔強制瘦身，硬上限 5MB** —— S7（2MB）／S10（1MB）唔適用（[docs/01-slim](docs/01-slim.md#s7--ci-硬攔體積)）。
> 單一 HTML 交付前跑 `node scripts/audit_single_html_v1.0.mjs <檔名>`；真實案例見 [docs/16-canvas-case-scout-comic.md](docs/16-canvas-case-scout-comic.md)，搵 API／Prompt 見 [docs/15-resource-index.md](docs/15-resource-index.md)。
> 每次施工前後跑 `node scripts/guard.mjs`；上線前對 [docs/10-checklists.md](docs/10-checklists.md)。

> 頂住！**Agent 必須先知自己係邊個級，才可施工**。越級施工 = 破壞 registry 單一真理 = 零容忍。

本檔與 `BUILD.md` 共同構成唯一真理之「執行面」。`BUILD.md` 定義「做咩」，本檔定義「邊個做」。

---

## 1. 五級階梯 (對應 BUILD.md §1)

```
ADMIN (平台) ── 管 units.json + Vercel env + 收件匣
  └─ TROOP_OPS (旅) ── 管 TROOP_MODULES + TROOP_OPS Sheet + 旅層 registry
       └─ BRANCH (支部/團) ── 管自己 SHEET 內數據 + 模組開關 (支部粒度)
            └─ SHEET (leaf 後端 = 一張 SHEET + /exec) ── 數據原子寫入
                 └─ EXTERNAL (外部系統) ── 零特權，經 Share/訂閱接入

**GAS 接駁 registry（2026-09-23 實作定案）**：旅 → 團 → 進度 嘅連結登記寫喺**上游 GAS `ScriptProperties`**（`DOWNSTREAM_<id>_URL/_KEY/_NAME/_AT`），唔係 Vercel env、唔入任何 SHEET（ABCD 四項都唔落 SHEET）；`sig` 係 GAS→GAS，唔經 Vercel proxy。詳見 `進度追蹤旅系統升級版.md`。
```

**進度追蹤** 屬特殊 leaf（1團1張，子 leaf）：
- **定位：記錄冊（最下游、已完成系統，本輪只升級接駁）**。管理層功能（模組註冊、通告、財務、權限、ADMIN APP、旅層 registry…）屬**團／旅系統**，進度 leaf 冇呢啲功能係**正常，唔係缺失**，唔准夾硬加（見 `進度追蹤旅系統升級版.md` §0.1）
- 支部系統前端「進度」頁經上游登記嘅 `PROGRESS_*` key 打進度 /exec（B模式），支部 SHEET 本身唔存進度數據；**呢一頁屬支部前端（團／旅系統）範圍，唔屬進度 leaf**；舊 ecportal 共用一張 SHEET 只作兼容
- 開戶/改密碼/停用一律由該團支部落筆再同步落去 (`upsertUser/setPw/setStatus` + `verifyPw` 核對)，進度唔會自己開成員戶口、唔會反寫上游 (BUILD.md §2 開戶錨點)
- **UI 豁免**：進度追蹤保留自己詳細 UI，唔使跟支部/旅的統一骨架

## 2. 每級的「可改」與「不可改」

| 級別 | 可改 | 不可改 (越級) | 典型錯誤 (已攔截) |
|------|------|---------------|-------------------|
| **ADMIN** | `units.json`、Vercel env `TROOP_*`、收件匣 Sheet、平台公開頁 | 不可直接寫支部 SHEET 數據 | 支部 Agent 去改 `units.json` |
| **TROOP** | `TROOP_MODULES`、TROOP_OPS 表、旅日曆、旅物資/財務整合、訂閱 allowlist；跨團幫手 `branch_access` 最終寫 TROOP_OPS | 不可冒充 ADMIN 改平台 env；不可未經目標團批就加 `branch_access` | 旅長繞過目標團直接加跨團權限 |
| **BRANCH** | 成員/通告/行事曆/相簿 (本團)、`branch_access`、模組訂閱；1團1張 SHEET | 不可跨團寫對方 SHEET、不可改 TROOP_MODULES 全旅開關；**不可自閂/自開下游入口**（開關掣只在上游，經 sig 寫下游 `ALLOW_LOCAL_LOGIN`；下游 Sheet 選單嗰個「本機直接入口」掣只算**獨立運作／災難恢復**用，一掛接上游即以上游為準，下游前端一律唔准加掣） | 支部 Agent 越權開全旅模組；團前端自己閂進度入口 |
| **SHEET / API** | `doGet/doPost` 原子寫入、ScriptLock、雜湊；下游 `ALLOW_LOCAL_LOGIN` 旗只接受上游 `sig` 寫入 | 不可回傳 apikey/不入 URL/QR；子 leaf 不可自行開成員戶口/自改旗 | leaf 把 apikey 噴去前端；進度/團自己改 `ALLOW_LOCAL_LOGIN` |
| **EXTERNAL** | 只能被連結 / 被訂閱 / 被工具目錄登記 (stateless) | 不可拿 apikey/session/DB 存取 | 進度追蹤想加圖書館推送 — **禁止** |

> **黑名單案例**：**進度追蹤 ≠ 通告**，圖書館推送只屬通告模組 (BUILD.md §4 ★)。
> 進度追蹤係**記錄冊 leaf，唔設模組註冊制、唔設 `TROOP_MODULES`**（嗰啲屬管理層＝團／旅系統）。所以進度追蹤要加「圖書館／通告／推送／訂閱」概念 = **一律越級，直接拒**，冇「先登記後批准」呢條路。

## 3. 模組註冊制 — 管理層新功能唯一入口

> **適用範圍：團／旅系統（管理層）**。進度追蹤係記錄冊 leaf，**唔設模組註冊制**（無 `TROOP_MODULES`、無註冊表導航）——即係唔會「登記咗就可以加」。

任何功能 = 一個模組 (名、入口位置、所需權限、開關、說明頁)。流程：

1. 在 `TROOP_MODULES` 登記 (或 `docs/MODULE_REGISTRY.md` 草案)
2. 旅長/管理員按單位粒度開關 (可全旅或指定支部)
3. 導航由註冊表自動生成，最多兩層
4. 分享前設 = 接收方有該模組才可分享 (BUILD.md §4)

**未登記不得直接加導航/改 UI** — 防「順手加個圖書館」。

## 4. 施工次序 (BUILD.md §10)

1. `/api/proxy` + GAS `requireAuth` + key 未設拒絕敏感 action
2. 密碼雜湊 server 化 + 自動升級
3. ScriptLock + 前端排隊
4. mustChangePw gate + 鎖定
5. 限流 (§3 匿名可寫面)
6. AUDIT/ACCESS LOG
7. 其他 (silent refresh、sig jti、shard 等)

**功能次序**：UI 骨架 → 帳號/登入 (§2) → 通告+個人化訂閱 (★最優先) → 行事曆 → 物資 → 財務 → 移交 → MOCK/教學

> 進度追蹤不在此序列前端 — 它係**已完成嘅記錄冊 leaf（最下游）**，本輪只做接駁；管理層嘅通告／訂閱／行事曆／財務等一律唔關佢事，不可插隊硬加。

## 5. 體積治理 — 各級共同責任

- `api` 零依賴 (原生 fetch+crypto)
- Preview deployment 關閉 (儀表板)，retention 7 天
- 圖轉 AVIF，`dist <5MB`、`bundle <2MB` (CI 硬攔)
- `.vercelignore` / `.gitignore` 已配；新增資源必須通過 `npm run slim:dead`

## 6. 自檢清單 — 每次施工前問自己

- [ ] 我係邊個級？ (ADMIN/TROOP/BRANCH/SHEET/EXTERNAL)
- [ ] 我要改嘅 registry / Sheet / env 係咪我轄下？
- [ ] 有無經 `TROOP_MODULES` 登記？旅長批咗未？
- [ ] 有無越級改其他旅/支部嘅嘢？
- [ ] 進度追蹤嘅改動有無誤加通告圖書館邏輯？ (若有，立即撤回)
- [ ] 開戶係咪喺錨點做 (成員=該團支部、領袖=所屬層、家長=有旅就旅)？有無喺進度追蹤開戶或由下游反寫上游？含 hash JSON 吐出有冇濫用（只限後掛上游批量開戶）？ (BUILD.md §2 §3)
- [ ] 下游入口開關係咪上游控、下游寫（`ALLOW_LOCAL_LOGIN` 經 `sig` 寫下游 GS，唔係下游自改/唔郁 ENV）？ (BUILD.md §1 入口開關)
- [ ] 跨團幫手係咪教練員=旅長直開、本職領袖兼幫=目標團批後追加 `branch_access`？有無繞過目標團？
- [ ] 接駁係咪守齊三條：① 中央登入回打只限**自己 app 嘅固定端點**（例 `/api/super`）＋一次性防重放 ② 上游打下游，下游**同步回傳**結果 ③ **旅系統冇 callback endpoint**、下游永唔主動回打上游？ (`進度追蹤旅系統升級版.md` §4)
- [ ] `sig` 用途字串（`<purpose>`）有無**錯誤假設跨 repo 直連**？（VS／RS 各自一條、實測成功；跨 repo 唔通係已知邊界，見 §12 ①）
- [ ] 中央登入嘅回打（若有）係咪只限**自己 app 嘅固定端點**（例 `/api/super`）、一次性防重放？ (VS／RS 定案，見 §4)
- [ ] 閂下游直接入口之前，係咪已經有「經上游用 `sig` 轉發」嘅前端路徑？（冇就唔好閂，一閂 apikey 路徑即死）
- [ ] `npm run check && npm run build` 通過未？

---

*違反本檔 = 視為 regressions，CI 與 code review 會擋。*
