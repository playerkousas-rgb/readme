# AGENTS — Agent 級別與施工邊界 (防「咩都做曬」)

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
- 支部系統前端「進度」頁經 TROOP_OPS 同行 `PROGRESS_BACKEND/_APIKEY` 打進度 /exec（B模式），支部 SHEET 本身唔存進度數據；舊 ecportal 共用一張 SHEET 只作兼容
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

> **黑名單案例**：**進度追蹤 ≠ 通告**，圖書館推送只屬通告模組 (BUILD.md §4 ★)。進度追蹤若要「圖書館」概念，必須先經 `TROOP_MODULES` 登記並由旅長批准，否則視為越級。

## 3. 模組註冊制 — 新功能唯一入口

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

> 進度追蹤不在此序列前端 — 它是獨立前端，排期由旅長決定，不可插隊搶做通告訂閱。

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
- [ ] 接駁係咪守齊三條：① 上游打下游、下游**同步回傳**結果 ② **冇 callback endpoint**、下游永唔主動回打上游 ③ 中央登入嘅回打（若有）只限**固定受信端點**？ (`進度追蹤旅系統升級版.md` §4)
- [ ] `sig` 用途字串（`<purpose>`）同 action 名有無跨 repo 一致？（唔一致＝其他支部接唔到；見 §12 ①②）
- [ ] 閂下游直接入口之前，係咪已經有「經上游用 `sig` 轉發」嘅前端路徑？（冇就唔好閂，一閂 apikey 路徑即死）
- [ ] `npm run check && npm run build` 通過未？

---

*違反本檔 = 視為 regressions，CI 與 code review 會擋。*
