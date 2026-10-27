# 18 — 對照審計：原有 Git 檔 vs 我寫嘅新系統

> **你問嘅兩條問題，呢份一次過答**：
> ① 原有 Git 檔（`BUILD.md`／`AGENTS.md`／`EXTERNAL.md`／`進度追蹤旅系統升級版.md`）**有乜係我漏咗**？
> ② 佢哋**有啲咩好系統，係我個新 docs／templates／guard 冇嘅**？
>
> 對照日期 2026-10-27。原檔 4 份共 **596 行**（151／107／39／299）；我新增 58 個檔約 4,300 行。
> 方法：逐行讀完 4 份原檔 → 抽出「可重用嘅制度」→ 逐個關鍵字 grep 我嘅 `PLAYBOOK.md`／`docs/`／`templates/`／`scripts/` → 再睇 guard／final_check 實際冇冇檢查到。
> **結論先行**：技術細節（sig、水印、版號、fail closed）我覆蓋得唔差；**我漏得最多係「管人同管功能邊界」嗰層**，同埋**幾條 as-built 檔本身冇被 guard 守住**。
>
> **⚠️ 2026-10-27 更新（用戶指示）**：「旅團／進度追蹤管理系統唔屬通用設定，要分開寫。」
> 所以本報告 §3 抽出的 **R1–R8 已由通用 `PLAYBOOK` 移去 [19 專案案例](19-ecportal-troop-case.md) §14**，標明為**可選模式、唔係通用底線**；
> `PLAYBOOK §8.1` 而家只係一條「案例隔離」指針。本報告保留做**審計記錄**（點解當初抽出嚟），唔代表 R 系列仲係通用規則。
> 各 repo 健康問題（邊個有 critical／158MB）另寫咗 [20](20-repo-health-audit.md)。

---

## 1. 原有 Git 檔「有」，但我漏咗（已修／部分修）

| # | 漏咗乜 | 證據（原檔） | 點解重要 | 狀態 |
|---|--------|--------------|----------|------|
| 1 | **`進度追蹤旅系統升級版.md` 唔喺 guard 必需檔** | `guard.mjs` `requireFiles(...)` 只有 `README/PLAYBOOK/AGENTS/BUILD/EXTERNAL` | 最詳細嘅 299 行 as-built 規格可以靜靜被刪而 CI 唔叫 | ✅ 已加入必需檔 |
| 2 | **final_check 六角度完全無驗 as-built 檔** | `final_check_v1.0.mjs` 只查 entry docs + contract + HTML | 「六角度」少咗「Git 官方＝歷史資產仲喺度」 | ✅ arch 角度加檢查 |
| 3 | **五個 as-built repo 冇入資源索引** | 原檔講 `vsbadge`／`roverbadge`／`cubsbadge`／`scoutbadge`／`scout-circulars`；`docs/15` §1 心智圖只有 prompts.chat→prompt→api→readme | 想搵「邊份碼實測成功」無入口（`gh api` 已確認 5 個 repo 都存在） | ✅ `docs/15` 加 §2.5 |
| 4 | **冇「職責級別／越級」嘅整理** | `AGENTS.md` §1–2 五級階梯 + 可改/不可改矩陣 + 典型錯誤；我嘅 PLAYBOOK 只有 S/F/A/W/V/G/VL/X/U/C | 我分類咗「工具／App／系統」，但冇分類「邊個 Agent 准改邊層」 → 最容易發生「咩都做晒」 | ✅ 抽出 R1–R8 → **放 19 §14 做可選模式** |
| 5 | **冇「功能註冊制」通用化** | `BUILD.md` §4／`AGENTS.md` §3：`TROOP_MODULES`、未登記不得加導航、分享前設＝接收方有該模組 | 我得 F3「registry 驅動」一句，冇「新功能唯一入口」嘅硬閘 | ✅ R3 |
| 6 | **零散但實用嘅營運細節冇抄落通用規則** | `rel="noopener"`（EXTERNAL）、`dbInfo` 回 `{version,bytes,sizes,stagingRows}`（BUILD §3）、**三色燈** 黃/綠/紅（BUILD §3）、`verifyPw` 每 sub 每小時 5 次（BUILD §2）、`children_ids` 全域 ID 令同旅移動零改動（BUILD §6）、MOCK／教材三層／開旅 checklist（BUILD §9） | 全部係「用戶／維運先會撞到」嘅嘢，純技術 guard 唔會提 | ✅ 寫入 R8 + §3 清單；部分保留做案例 |
| 7 | **「10 項守護測試 ＋ 真機跑一次」嘅驗收文化** | `進度追蹤旅系統升級版.md` §10：本地 10/10 綠 + 153 e2e，**但明講「新部署仍然要真機跑一次」**（302 轉址／Drive 權限／Script Properties 配額） | 我有 `final_check` 自動化，但人手清單 6 條冇「真機跑一次」呢條 | ✅ MANUAL 加第 7 條 |
| 8 | **施工前「問自己 12 條」自檢** | `AGENTS.md` §6，尤其「我係邊個級？」「有無越級？」「閂口前有無轉發路徑？」 | 我嘅 checklists 偏技術，少咗身份／權限自問 | ✅ `docs/10` §1 加 3 條 |

---

## 2. 佢哋有嘅「好系統」，我薄弱／冇（逐個判決）

> 判決分三種：**升級做通用規則**／**已有，補強**／**保留做 as-built 案例**（唔通用化，避免過度規範）。
> **最終安置（用戶指示後）**：原本「升級做通用規則」嘅 R1–R8 改為**「可選案例模式」放 19 §14**；只有技術機制（A7／F4／F11／U4）留喺通用 PLAYBOOK。

| # | 好系統 | 出自 | 好喺邊 | 我嘅現況 → 判決 |
|---|--------|------|--------|----------------|
| G1 | **五級階梯 ＋ 可改/不可改矩陣 ＋ 典型錯誤欄** | AGENTS §1–2 | 將「權限」寫成**表**而唔係形容詞；每級附「已攔截嘅錯誤」，新人一眼知邊界 | 我得 flat 嘅 secret 鐵則 → **升級 R1** |
| G2 | **「leaf 冇管理層功能＝正常，唔係缺失」＋ 明確 `唔做` 清單** | BUILD §4 註、進度 §0.1／§8 | 防 scope creep 最有效嘅寫法：唔只講「做乜」，仲**寫死「唔做乜」**，連「豁免統一 UI」都寫明 | 我得「三種結構」分類，冇「唔做清單」→ **升級 R2** |
| G3 | **模組註冊制 ＋ 未登記不得加導航 ＋ 分享前設** | BUILD §4、AGENTS §3、EXTERNAL §1C | 新功能唯一入口；導航自動生最多兩層；分享目標由註冊表過濾（冇嗰個模組＝分享唔到） | F3 太薄 → **升級 R3** |
| G4 | **registry「追加唔搬」＋ 換 key 三處同步＋`normId` 單一實現** | BUILD §1、進度 §1 | 掛下游只加上游 `DOWNSTREAM_*`，**唔郁** `units.json`／Vercel env；換 D 漏一處就「靜靜打唔通」——呢句係最好嘅防呆教材 | 我有 F1 單一真理 + A7 sig，但冇「接駁追加」 → **升級 R4**（補強） |
| G5 | **上游控、下游寫 ＋ fail closed ＋ 留一戶災難恢復 ＋ 可逆** | BUILD §1、進度 §5 | 開關掣只喺上游；下游冇掣就唔會誤觸；串錯字＝閂口；閂口後仍留本地領袖 + SUPER | F4 已有 fail closed，但冇「災難恢復戶」→ **補強 R5** |
| G6 | **回傳／回調三條寫死 ＋ 下游永不回打上游 ＋ 跨 repo 邊界** | 進度 §4／§12①、AGENTS §6 | 將「回打」限制成**唯一一條**中央登入鏈；其餘同步回結果；`<purpose>` 每 repo 一條，跨 repo 直連＝已知邊界唔係 bug | A7／X 已有技術，但「邊界聲明」唔夠顯眼 → **升級 R6** |
| G7 | **身份錨點 ＋ 子 leaf 唔開戶 ＋ 含 hash 搬數（Drive private／匯完即刪）** | BUILD §2–3、進度 §6–7 | 「身份只誕生一次」＋ 下游搵唔到 sub 就報「上遊未開」，**唔會自己補**；搬舊數用 hash 直插保留密碼，唔經 `1234+mustChangePw` | README 鐵則有提，但流程細節喺模板冇 → **升級 R7** |
| G8 | **offline-first 三色燈 ＋ merge3 欄位級合併 ＋ ScriptLock 20s ＋ 大庫分件** | BUILD §3 | 用戶睇得明嘅狀態（黃=未存／綠=已存／紅=衝突）＋ 逐格確認；伺服器端分段讀寫每段核 version | F7/F8 有樂觀鎖、排隊、tombstone；**三色燈／dbInfo 冇** → **補強 R8** |
| G9 | **匿名可寫面 6 種 ＋ 待批表 ＋ 限流 ＋ 診斷報告一鍵複製** | BUILD §3、EXTERNAL §3 | 每一個公開入口都係「白名單 action + 限流 + 落待批表」，唔係直接寫正式表 | 我有 F17/S9 限流；「待批表」已有 → **保留，R8 補 dbInfo** |
| G10 | **個人化訂閱 ★ 重中之重 ＋ 私隱統計（知幾多人、唔知邊個）** | BUILD §4 | 唔另起推送基建，用圖書館現有鏈；同一張 Supabase 表加 `source` 欄；統計照出但冇身份欄 | `templates/supabase/push_subscriptions.sql` 已有 `source` + `subscription_stats` view → **已對齊，唔使改** |
| G11 | **外部系統零特權 ＋ 三種模式 A/B/C ＋ stateless 工具目錄 ＋ `rel=noopener`** | EXTERNAL 全文 | 平台只登記目錄、唔代審第三方碼；`target=_blank` 必加 `noopener` | A? 有零特權，`noopener` 完全冇 → **R8 補一小條** |
| G12 | **以 as-built 為真理（「照 VS／RS 抄」）＋ 現況差異對照表 ＋ 定案表** | 進度 §0／§11／§12 | 明文寫「兩個 repo 已實測成功，本 MD 唔提出改動」；差異用**對照表**而唔係散文；12 項定案逐條 | 呢個正係我今次報告想補嘅心法 → **寫入 R8 + 本報告 §4** |

**我判斷唔應該通用化嘅（保留做案例）**：`TROOP_MODULES` 具體模組名（notice/calendar/album/finance）、`SCOUT_ID`/YMIS 業務格式、通告圖書館嘅 VAPID key、`vsbadge-troop-sig-v1` 具體 `<purpose>` 字串、`版號只留本 MD`（已知例外，新 app 跟 V 系列）。呢啲係**專案業務**，抄落通用規則只會變成過度規範。

---

## 3. R1–R8 — 由 as-built 提煉嘅**可選模式**（已移去 19 §14）

> R = **Registry / Responsibility**。**呢 8 條唔係通用底線**，只係由 ecportal 案例抽出嚟嘅可選做法。
> 完整表喺 **[19 §14](19-ecportal-troop-case.md)**；`PLAYBOOK §8.1` 只留「案例隔離」指針；guard 檢查 R1–R8 喺 19 而唔係喺 PLAYBOOK。

| ID | 規則（一句話） | 可驗證動作 |
|----|----------------|-----------|
| **R1** | **定級別先開工**：每次改動前寫低「我係邊個級／我改嘅係咪我轄下」；越級＝FAIL | PR 描述第一行有 `LEVEL=`；對照可改/不可改表 |
| **R2** | **每層要有「唔做清單」**：寫死「呢層冇 X 係正常」，唔准因為統一而夾硬加 | 每個元件 README 有 `## 唔做` |
| **R3** | **功能註冊制**：新功能先入 registry（名／入口／權限／開關／說明頁），導航由 registry 生，最多兩層；未登記不得加掣 | CI 檢查導航項目 ⊆ registry keys |
| **R4** | **接駁追加唔搬**：掛下游只加上游登記；`normId` 單一實現；換 key 要「下游重生 → 上游重登 → env + redeploy」三處同步 | 換 key runbook + 連線測試 |
| **R5** | **上游控、下游寫**：開關掣只喺上游；fail closed；閂口前要有轉發路徑；每下游留一戶 + 超管做災難恢復；閂口可逆 | `ALLOW_LOCAL_LOGIN` 測試（開／閂／錯值） |
| **R6** | **回傳三條寫死**：中央登入回打自己 app 固定端點（一次性票據）；其餘上游→下游同步回結果；**下游永不主動回打上游**；跨 repo 邊界寫明 | 全倉掃 `callback\|postMessage\|newTrigger` |
| **R7** | **身份錨點＋搬數**：身份只喺一個來源誕生；子 leaf 唔開戶／唔反寫；含 hash 搬數只經 private Drive／Logger，匯完即刪；`transferId` 冪等 | `upsertUser` 拒明文密碼；回應永不含 `password_hash` |
| **R8** | **用戶可見狀態＋回歸＋教材**：三色燈 staging、`dbInfo` 診斷、`backendVersion` 提示；外連 `rel=noopener`；`verifyPw` 限次；MOCK 示範＋教材三層；**本地回歸綠 ≠ 完成，新部署要真機跑一次** | final_check MANUAL 第 7 條 |

**順手補返嘅零散位**：`rel="noopener"`（G11）／`dbInfo` 回傳 `{version,bytes,sizes,stagingRows}`（G8）／`verifyPw` 每 sub 每小時 5 次（G8）／`children_ids` 用全域 ID 令同旅移動零改動（G7）／MOCK 匯出帶 `_exportedFrom:'mock'`（G12）→ 全部收納喺 R8，唔另開新 ID。

---

## 4. 已經對齊（唔使抄，避免 drift）

以下原檔嘅好嘢，我嘅新系統**已經有**，列出嚟避免你以為我冇睇到：

- `sig` 雙通道 query+body、兩組 nonce 一次消耗、±5 分鐘、body ≤900KB、64 hex、SHA-256 比對、一律 POST、永不接受清單、標籤消毒防算式注入 → [A7/X4/A11](03-security.md) + [`templates/gas/Config.gs`](../templates/gas/Config.gs)（實際實作咗，唔只係文字）。
- `/api/super` 60 秒一次性票據、`SUPER_KEY` 只喺 Vercel env、GAS 收唔到 hash → [A?／04-settings-super](04-settings-super.md)。
- `ALLOW_LOCAL_LOGIN` fail closed + 開關表 + 閂口後行為對照 → [F4](02-foolproof.md)。
- `exportAll` sha256 + 每週 Drive 13 份 + 三時機提醒 + `importAll` 驗 hash → [F11](02-foolproof.md)。
- `push_subscriptions` 只存 hash、`source` 欄、`subscription_stats` view → [`templates/supabase/push_subscriptions.sql`](../templates/supabase/push_subscriptions.sql)。
- ADMIN 收件匣代替管理員 email、per-IP 限流、2FA、登記後 rotate → [10-checklists](10-checklists.md)。
- PDPO 家長同意 + 12 個月 purge + 交接 SOP ownership 轉名 → [03-security](03-security.md)／[11-incidents](11-incidents.md)。
- 施工次序 10 步 + 功能次序 → [PLAYBOOK §9](../PLAYBOOK.md)。
- **兩個已知例外／勘誤已記錄**：`版號只留本 MD`（→ 新 app 跟 V）、`--omit=dev`（→ 新 app `--include=dev`）→ [README §6](../README.md#6-實戰案例保留ecportal-既有-as-built-真理)。

---

## 5. 今次實際改咗乜／建議但未做

**已改（本報告同時係 commit 內容）**
1. `guard.mjs`：必需檔加 `進度追蹤旅系統升級版.md`／`docs/19`／`docs/20`；`checkAsBuilt()` 改為驗「4 份 as-built + README 連結 + **19 有 R1–R8 + PLAYBOOK 指向 19 + 20 存在**」→ guard 18 項。
2. `final_check_v1.0.mjs`：arch 角度加「as-built 4 份齊 + README 有引用」；AI Agent 角度加 R1；MANUAL 加第 7 條「新部署真機跑一次」。
3. `PLAYBOOK.md`：§8.1 由「R1–R8 通用表」改成**案例隔離指針**；§9 STEP 0 改成中性「定職責邊界（多單位系統先需要）」。
4. `docs/15`：原 §2.5 五 repo 表**移去 19 §12**；§2.5 而家只係一條指針，避免專案名返入通用索引。
5. `docs/10` §1 嘅 R 自問改成中性「多單位系統」提示；quickcard／17 嘅 R 標籤改成指去 19。
6. `README.md`：加 18／19／20 三份導覽；§6 講明 4 份原檔係專案級；§7 五個 as-built repo 一行指去 19。
7. **新增** [19 專案案例](19-ecportal-troop-case.md)（分開寫）同 [20 repo 健康審計](20-repo-health-audit.md)（11 個 repo 實測）。

**建議但未做（要你決定，唔想自作主張）**
- 幫 5 個 as-built repo 各寫一份 `docs/AGENT_TEMPLATE_FOR_OTHER_SECTIONS.md` 對照（原檔 §11 提過「MD 同實例唔可以矛盾」，但我未讀嗰 5 個 repo 嘅碼，唔敢寫）。
- 將 `進度追蹤旅系統升級版.md §10` 嘅 `troop_link.test.mjs` 10 項守護測試**實體移植**做 `templates/gas/troop_link.test.mjs`（而家只有文字描述）。
- `checkAsBuilt()` 日後可升級做「原檔關鍵字 → 規則 ID」對照表自動檢查，防止改規則時忘記對返案例。

> **一句話總結**：技術底線我寫得比原檔更可執行（有 guard、有測試、有模板）；原檔最叻嗰樣 —— **「邊個准改邊層、邊啲功能唔應該出現」嘅治理**，同埋**「已實測先算真理」嘅態度** —— 已寫成 [19 專案案例](19-ecportal-troop-case.md) 嘅可選模式，**唔再混入通用設定**。
