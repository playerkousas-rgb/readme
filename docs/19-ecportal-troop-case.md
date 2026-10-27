# 19 — ecportal 旅團／進度追蹤：專案案例（**唔係通用設定**）

> ## ⚠️ 定位聲明（2026-10-27 用戶指示）
> **呢份係一個專案嘅 as-built 案例，唔係通用規則。**
> 通用底線只有 [PLAYBOOK](../PLAYBOOK.md) 嘅 **S／F／A／W／V ＋ G／VL／X／U／C**。
> 下面所有 `TROOP_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN`／`SCOUT_ID`／`YMIS`／`vsbadge` 等名詞，
> 都係 **ecportal 一個專案嘅實際做法**，新 app **唔使跟、唔應該照抄**。
> 想知「通用規則點嚟」→ [18 對照審計](18-as-built-gap-audit.md)；想知各 repo 有乜病 → [20 repo 健康審計](20-repo-health-audit.md)。
>
> 四份原始真理檔（**保持原樣，無改過**）：`BUILD.md`（151 行）／`AGENTS.md`（107 行）／`EXTERNAL.md`（39 行）／`進度追蹤旅系統升級版.md`（299 行）。
> 本檔只做**導讀＋集中索引**，唔取代佢哋；有衝突以原檔為準。

---

## 1. 兩層定位（最緊要：唔好撈亂）

| | **管理層**＝團／旅系統（平台 ADMIN、公開頁） | **記錄冊**＝進度追蹤（各支部 leaf） |
|---|---|---|
| 做乜 | 開戶、模組註冊、通告／訂閱、行事曆、物資、財務、移交、權限、ADMIN APP | 記進度、記履歷、記獎章（每項顯示得詳細） |
| 位階 | 上游 | **最下游 leaf**（1 團 1 張 SHEET + 一支 `/exec`） |
| 狀態 | 以 ecportal 為基礎參考，**未完成** | **已完成**，本輪只升級「接駁」 |
| 規格 | `BUILD.md` §1–§10 | `進度追蹤旅系統升級版.md`（＋`BUILD.md` §1 registry／§2 開戶錨點／§5 分享） |

> **「進度追蹤冇管理層功能＝正常，唔係缺失」**。管理層唔會幫進度做 UI；進度亦唔准加通告／圖書館／推送／訂閱（硬禁令，`AGENTS.md` §2 黑名單）。
> 進度 leaf 只做三件事：**被登記**、**被上游 `sig` 讀寫**、**本地入口自己開住／由上游閂**。UI 豁免統一骨架（`BUILD.md` §4）。

---

## 2. 五級階梯 ＋ 可改／不可改（`AGENTS.md` §1–2）

```
ADMIN (平台) ── 管 units.json + Vercel env + 收件匣
  └─ TROOP_OPS (旅) ── 管 TROOP_MODULES + 旅層 registry
       └─ BRANCH (支部/團) ── 管自己 SHEET 數據 + 模組開關
            └─ SHEET (leaf = 一張 SHEET + /exec) ── 原子寫入
                 └─ EXTERNAL (外部系統) ── 零特權，經 Share／訂閱接入
```

| 級別 | 可改 | 不可改（越級） | 典型錯誤 |
|------|------|---------------|----------|
| ADMIN | `units.json`、Vercel env `TROOP_*`、收件匣 Sheet、平台公開頁 | 直接寫支部 SHEET 數據 | 支部 Agent 改 `units.json` |
| TROOP | `TROOP_MODULES`、TROOP_OPS 表、旅日曆／財務整合、訂閱 allowlist | 冒充 ADMIN 改平台 env；未經目標團批就加 `branch_access` | 旅長繞過目標團加跨團權限 |
| BRANCH | 本團成員／通告／相簿、`branch_access`、模組訂閱 | 跨團寫對方 SHEET；改全旅開關；**自閂／自開下游入口** | 團前端自己閂進度入口 |
| SHEET / API | `doGet/doPost` 原子寫入、ScriptLock、雜湊 | 回傳 apikey；子 leaf 自行開成員戶口／自改旗 | leaf 將 apikey 噴去前端 |
| EXTERNAL | 只能被連結／被訂閱／被工具目錄登記（stateless） | 拎 apikey／session／DB 存取 | 進度追蹤想加圖書館推送 → **禁止** |

> 施工前自問 12 條喺 `AGENTS.md` §6（我係邊個級？有無越級？閂口前有無轉發路徑？…）。
> **呢個階梯係呢個專案嘅組織結構，唔係所有 app 都要有五級。**

---

## 3. 模組註冊制（`BUILD.md` §4／`AGENTS.md` §3）

- 任何功能＝一個模組（名、入口位置、所需權限、開關、說明頁）；登記入 `TROOP_MODULES` 或 `docs/MODULE_REGISTRY.md`。
- 旅長／管理員按單位粒度開關（全旅或指定支部）；**導航由註冊表自動生成，最多兩層**；server-side 拒絕停用模組讀寫；cache 5 分鐘。
- **未登記不得直接加導航／改 UI**（防「順手加個圖書館」）。
- **分享前設＝接收方都有該模組**：童軍有小隊計分、深資冇 → 嗰頁根本唔存在，自然分享唔到。
- UI：一套模版行晒支部＋旅＋公開頁（頂欄＋導航＋卡片），掣位統一（儲存／危險動作／設定入口固定）；**進度追蹤保留自己詳細 UI（豁免）**。

---

## 4. 接入 registry 同 ID（`BUILD.md` §1／`進度追蹤` §1–2）

- 層級：平台(ADMIN) → 旅 → 支部/團 → **1 團 1 張 SHEET + 一支 `/exec`**；旅系統自己都係一個 leaf。
- **兩條公理**（呢兩條已通用化去 [README §2](../README.md)）：① 一切身份＝`SCOUT_ID` + 所在 SHEET；② 一切接入＝交俾邊個 + 登記邊個 registry。
- `normId` 單一實現：`trim → 大寫 → 數字補零至 4 位 + 字母尾`（82／082／0082／00082 同一單位）。
- registry 兩層：
  - 平台：`units.json`（公開 metadata）＋ Vercel env `TROOP_<id>_BACKEND/_APIKEY/_NAME`；ADMIN 經收件匣管理。
  - 旅（GAS 接駁）：上游 `ScriptProperties` 每條下游一組 `DOWNSTREAM_<id>_URL/_KEY/_NAME/_AT`（`<id>` 英數／底線／連字號，≤32 字符）；`sig` 係 GAS→GAS，**唔經 Vercel proxy**。
  - `TROOP_OPS` 表（Vercel server-to-server + cache 5 分鐘）只喺「Vercel 真係要讀旅層」先建；未建前 **Script Properties 係唯一真理**，唔好兩份並存。
- **接入 registry 追加唔搬**：旅掛團只加上游 `DOWNSTREAM_*`，**唔改／唔刪** `units.json`／Vercel env（免 ADMIN 動 ENV）。
- **換 D（撤銷舊 key）＝三處同步**（漏一處就靜靜打唔通）：① 下游 Script Properties 刪 `API_KEY` → `showApiKey()` 生新 key；② 上游重新登記下游；③ ADMIN 改 Vercel env + Redeploy。
- **ABCD 四個變數都唔寫入任何工作表**（有測試守）：A=`SUPER_KEY`（Vercel env，隱藏，與旅無關）；B=`TROOP_<id>_BACKEND`（`/exec` URL）；C=`TROOP_<id>_NAME`（顯示名）；D=`TROOP_<id>_APIKEY`（同時係 `sig` 根密鑰）。
- 接入三條路：獨立前端 → ADMIN 登記入平台；有旅系統 → 旅長登記入旅系統；兩條並行 → 交兩邊。**退出＝刪 registry entry；數據永遠喺單位自己 Sheet。**
- 新團開通次序：① 兩張 SHEET（支部＋進度）各部署 `/exec` + 各自 apikey → ② 旅長喺上游 ScriptProperties 登記 `DOWNSTREAM_*`（首團連同生 GS 時種入首個旅長帳號）→ ③ 旅層帳號 + `branch_access` + 邀請連結 → ④ 該團領袖邀請 → ⑤ 成員喺該團支部開（人手／CSV），進度自動同步；此時下游旗仍開，上游可一鍵閂。

---

## 5. `sig` 接駁（GAS → GAS，`進度追蹤` §3／§12）

```
根密鑰    = 該節點嘅 SHEET KEY（D）
sigKey    = hex(HMAC-SHA256("<purpose>", D))
canonical = action + "\n" + ts(毫秒) + "\n" + nonce + "\n" + hex(SHA-256(rawBody))
sig       = hex(HMAC-SHA256(canonical, sigKey))
```

- 上游簽出站用**下游嘅 D**；下游驗入站用**自己嘅 D**；推導結果唔落地、唔儲存。
- **雙通道**：query `?sig=&sts=&snonce=`（digest 綁完整 raw body）＋ body `{…, sig, sig_ts, sig_nonce}`（digest 綁去掉三個 sig 欄位後嘅 body）。下游先驗 query，驗唔到再驗 body；**兩組 nonce 一次過消耗**（堵死混合重放）。原因：GAS 302 轉址會遺失 query。
- 防護：時窗 ±5 分鐘（未來 ts 都拒）／nonce 一次性（CacheService 10 分鐘）／body ≤ 900 KB／`sig` 必須 64 位 hex／比較前兩邊各自 SHA-256（避免短路時序）／**一律 POST，唔收 GET 帶 sig**。
- 標籤消毒只留 `0-9A-Za-z_.@-`（防試算表算式注入）；每筆簽名寫入喺下游「操作紀錄」留一行（`actor=upstream` + `on_behalf`）；讀取唔留。
- action 白名單：讀 12 個（`load`／`getMembers`／`getAllUsers`／`getAuditLog`…）、寫 19 個（`upsertUser`／`importUsers`／`setLocalLogin`…）；**永不接受（即使有 sig）**：`login`／`apply`／`logout`／`changePassword`／`updateConfig`／白名單外任何 action。
- 讀取回應**永不含 `password_hash`**；所以搬舊密碼只能行 §8 嘅「JSON 吐出」（下游主動 export，唔係上游拉）。
- **`<purpose>` 每 repo 一條**（`vsbadge-troop-sig-v1`／`roverbadge-troop-sig-v1`，寫死喺 GS 常數）：上下游必須同 repo 同一條；**跨 repo 直連唔支援（已知邊界，唔係 bug）**。

---

## 6. 入口開關 `ALLOW_LOCAL_LOGIN`（`進度追蹤` §5／`BUILD.md` §1）

- 旗寫喺**下游 GS ScriptProperties**；開關掣**只喺上游前端**（旅控團、團控進度），經 `sig` 打下游 `setLocalLogin`／`setDownstreamAccess`。下游前端無此掣 → 唔會誤觸；下游自己嗰個掣只作**未掛上游／災難恢復**用，一掛接即以上游為準。
- **fail closed**：`1/true/yes/on/open`（大小寫／空白不敏感）＝開；**其餘任何值（含串錯字）＝閂**；未設定＝開（現有旅團零影響，`initializeSheets()` 唔自動寫值）。
- 閂口後：前端直接 `login`／`apply`／`GET ?action=load`／舊 Portal apikey `save`／用戶 token 操作 → **一律 403**（`upstream_only:true`）；上游 `sig` 請求同中央登入（A）照收。
- 可逆；**每個下游至少留一個本地領袖戶 + SUPER 做災難恢復**。
- **次序鐵律**：先搬數、先測連線（`📡 測試下游連線(sig)`）、**先至閂口**。未起好「經上游 `sig` 轉發」嘅前端路徑之前唔好閂 —— 一閂 apikey 路徑即死。

---

## 6.1 三種使用模式（2026-10-27 用戶澄清：**唔好迫全套**）

> 原檔 `進度追蹤旅系統升級版.md §0` 已寫明：**「接入完全自願：唔登記下游、或者登記咗但唔閂口，現有旅團一切照舊（旗未設定＝開啟，行為零變化）。」**
> 用戶再澄清：舊 sig 嘅重放問題係**三層樹狀（旅 → 團 → 進度）接入模式**先會出現；**旅團可以分開獨立使用，或者之後先一併使用**，唔應該迫佢哋全套上。

| 模式 | 設定 | 用緊嘅登入路徑 | 舊 sig 重放風險 |
|------|------|----------------|-----------------|
| **① 獨立使用**（standalone） | 唔登記 `DOWNSTREAM_*`；`ALLOW_LOCAL_LOGIN` 未設定＝開 | 本地密碼／開戶／邀請連結 | **無實際攻擊面** —— 冇上游簽發 sig，攻擊者攞唔到有效票據；`ecSigLogin`／`portalLogin` 技術上可達但無票可用 |
| **② 部分接入**（過渡） | 有登記下游，但**未閂口** | 本地 + 上游 sig 並行 | 低 —— sig 已出現，但仲有本地入口；呢個係雙軌過渡期 |
| **③ 全套三層樹狀** | 登記 + 閂口（只收 `sig`） | **sig 係唯一入口** | **需要先修好防重放** —— 呢個模式先真正依賴張飛 |

**結論**：
- 模式 ① 完全合法，**唔使改任何嘢**，可以繼續用；想再安全啲可以直接將舊 sig action 閂做 `410 Gone`（見 [21 §3.5](21-fix-plans.md)）。
- 由 ① → ② → ③ 係**自願、逐個單位、逐步**；唔好一次過推全旅。
- **接入前閘門**：任何單位要行模式 ③ 之前，必須先完成 [21 §3](21-fix-plans.md) 嘅 nonce／ts／jti 防重放 + 雙軌；唔係就住喺模式 ①。
- 建議加一個 `INTEGRATION_MODE` 旗：`off` = 舊 sig action 直接 404／410（攻擊面歸零）；`on` = 只接受新格式 sig。咁獨立同接入兩套可以共存。

---

## 7. 回傳／回調三條（`進度追蹤` §4／`BUILD.md` §1）

1. **中央登入回傳＝有，已實測成功**：GAS 收到 `login` 帶 `super_ticket` → 回打**固定受信端點** `SUPER_VERIFY_URL`（vsbadge `https://vsbadge.vercel.app/api/super`、roverbadge 同理，寫死一行常數）驗票 → 驗過先發 token。票據 60 秒、AES-GCM、綁旅團、**一次性防重放**；`SUPER_KEY` 只喺 Vercel env，GAS／Sheet 永遠收唔到密碼或 hash。**呢個係全系統唯一嘅「回打」**，屬登入鏈，唔屬旅系統。
2. **旅系統 `sig` 鏈單向（上游 → 下游），下游同步回一個結果** `{success,data}` 或 `{success:false,error}`；失敗要明講（例「上游已開戶，但下游寫入失敗」），唔可以靜靜兩邊唔一致。
3. **旅系統冇非同步回調**：冇 callback endpoint、**下游永唔主動回打上游**；冇定時器／`onEdit` 觸發器（全倉掃 `callback|postMessage|newTrigger|onEdit` 零命中）。

---

## 8. 帳號、開戶錨點、搬數（`BUILD.md` §2–3／`進度追蹤` §6–7／§12）

- 三點進入並存：① 上層 `sig`（sub=EMAIL/YMIS，exp 15–30 分鐘，綁 session jti，scope 簽死喺 sig 內）② leaf 本地密碼（預設開，受 `ALLOW_LOCAL_LOGIN` 控）③ SUPER（`EC_SUPER_KEY`，Vercel env，server-only；改密碼只可觸發重設）。
- **身份錨點**（只誕生一次，下游唔反寫上游）：
  - 成員（`SCOUT_ID`／YMIS）＝**該團支部 SHEET**（名冊）；人手／CSV／批核申請／接收移交都喺嗰度。進度 leaf 搵唔到 sub ＝「該團未開戶」，**唔會自己補**。
  - 領袖（EMAIL）＝所屬層：只帶一團 → 該團支部；旅長／跨團 → 旅 SHEET + `branch_access`。
  - 家長（EMAIL）：有旅 → 旅層；冇旅 → 該團支部。
- 密碼：PBKDF2-SHA256 ≥100k 迭代 + per-user salt + timing-safe compare；hash 只存 server；改密碼／重設 → `pv+1`，session 驗 pv 唔對即 401；5 次失敗鎖 15 分鐘；`mustChangePw` 期間只放行改密碼 API；忘記密碼一次性連結 + 統一回應防帳號枚舉。
- 權限：`permissions_override` 只有直接上級設定，**下級 override ⊆ 上級自己權限（封頂）**；跨團幫手＝教練員由旅長直開，本職領袖兼幫他團 → **目標團領袖批** → `TROOP_OPS` 追加 `branch_access`（AUDIT 記 `grantedBy`）。
- 兩個 leaf 分開時：支部改密碼 → server-to-server `setPw` 同步進度 + `verifyPw` 背景核對（**每 sub 每小時上限 5 次**），唔一致常駐提示。VS／RS 本輪未實作（範圍外）。
- **含 hash JSON 搬數**：下游 `exportAll`／`exportUsersJson` 吐 `{hash+salt+迭代數}` → 上游逐個 `upsertUser` 直插 hash（保留舊密碼，唔經 `1234+mustChangePw`）；`transferId` 冪等 + 撞號阻擋 + `sha256` 驗。
  - 寫入 Drive 檔 `vsbadge-users-<yyyyMMdd-HHmmss>.json`，**建立後即設 `Access.PRIVATE` + `Permission.NONE`**；Drive 失敗時完整 JSON 寫入 Logger 後備；**只寫 Drive／Logger，絕不寫入工作表**；「操作紀錄」只記筆數同 file ID。
  - 匯入只收 64 位 hex hash；明文／假 hash／壞 JSON／缺 YMIS 一律拒；一次最多 2000 筆；完成顯示「新增 X／更新 Y／失敗 Z」；**匯完即刪 Drive 檔**，唔好用共享資料夾或電郵明文傳送。
- 移交套裝 JSON `{transferId, scout_id, ymis, name, dob, 家長聯絡, 先修章摘要…}` + sha256；`TRANSFERRED_OUT` tombstone；目標驗撞號；家長**同旅移動零改動**（`children_ids` 存全域 `SCOUT_ID`），轉旅則停用 + 邀請重開。

---

## 9. 多人寫入同診斷（`BUILD.md` §3）

- offline-first 三色燈：**黃＝編輯入咗瀏覽器 staging 未存**／**綠＝已存上後端**／**紅＝衝突**。
- 版本 server 派（ISO + 隨機尾數）；寫入帶 `baseVersion` 樂觀鎖，撞版回 `conflict:true`；**merge3 欄位級合併**（登入快照做 base，唔同欄各自保留，同格衝突彈出逐格確認；批量／無人看場行 serverTime 新者勝 + 紅點留底）。
- 後端 `ScriptLock.waitLock(20s)`，攞唔到回 `busy` 由前端排隊重試；寫入原子（暫存行 + 一次過 commit/swap，行號由底往上刪）；大庫 `saveDbPart/Commit` 分件 + `loadDbPart` 分段讀取（每段核 version，變咗由頭再讀）；刪除＝tombstone，後端定期 purge。
- **匿名可寫面 6 種**（通告報名／物資借用／收支申報／進度申報／開戶申請／相片上載）＝每個都係「白名單 action + 限流 + 寫入**待批表**」；上載單檔 ≤5MB、每筆 3 張、每 unit 每日總量上限。
- `dbInfo` 標準回 `{version, bytes, sizes, stagingRows}`；`status` 回 `backendVersion`（前端偵測舊後端提示更新）；三色燈 + **診斷報告一鍵複製**。
- 備份：`exportAll` 單一 JSON `{meta:{unit,exportedAt,version,sha256}, data}`，**預設剝密碼欄**（後掛上游批量開戶先可選「含 hash」）＋每週自動存 Drive 留 **13 份**＋`importAll` 驗 hash 原子還原；離線都匯得；**三時機提醒**（升級前／批量操作前／7 日冇備份）。

---

## 10. 個人化訂閱、分享、外部（`BUILD.md` §4–5／`EXTERNAL.md`）

- **個人化訂閱（★ 重中之重）**：用戶揀支部 × 分類（設定存本機 LocalStorage，命中即推，同一通告只推一次）。
  - 推送基建＝**通告圖書館現有嗰條鏈**，系統零另起爐灶：圖書館每日 scrape → Supabase `push_subscriptions`（`endpoint_hash`／`client_token_hash`／`branch_ids`／`topic_ids`）→ GitHub Actions 每日 06:00 `notify.py` 命中「支部 AND 項目」→ pywebpush (VAPID) 推送，7 日 rolling 補漏。
  - 系統做嘅嘢＝**訂閱設定前端**（service worker 用圖書館 VAPID public key → 寫入同一張表）；圖書館要加 origin allowlist + 建議 `source` 欄（library/system）分統計。
  - 館方統計（`subscription_stats.py`）照出訂閱數增長／支部分佈／30 日活躍，但**唔知邊個**（冇 YMIS／email／身份）。
- **三個概念唔同（死規矩）**：① 內部分享（支部之間，發佈時揀）② **Share 連結／QR**（已公開項目，收到嘅人直接開嗰頁，唔使密碼；QR／連結永不帶 key）③ **公開頁門戶**（要登入；家長可由旅長開共享密碼公開帳；外人入唔到）。
- 跨支部分享 `shareTo:[支部], memberVisible:false` → 對方領袖先見，再開畀成員；分享方可收返（tombstone）。相簿公開發佈要剔「已取得家長同意」+ 記審計。
- **外部系統零特權**（`EXTERNAL.md`）：永遠攞唔到 apikey／session／DB；數據出口只經 Share 頁同內建訂閱。三種模式：
  - **A 連結**：外連一律 `target=_blank rel=noopener`；單位自決。
  - **B 個人化通告訂閱**：來源係圖書館公開 cache。
  - **C 工具登記**：平台維護公開 JSON 目錄（名／描述／URL／類型）；**前設 stateless**（純前端、無後端、無儲存），有後端嘅行 §4 單位接入；平台只登記目錄、唔代審第三方碼（風險自負，目錄寫明）。
- 現有外部系統：童軍小工具站（集會助手／進團指南／通告圖書館／優異旅團系統）、AYP 獎勵計劃、專科徽章系統 → A 起步，深度同步預留。

---

## 11. ADMIN／私隱／交接／教材（`BUILD.md` §7–9）

- ADMIN 一人；**收件匣（GAS Web App）代替管理員個人 email** 做公開接收入口（保護管理員電郵）；申請表 `{troopId,troopName,scriptUrl,apiKey,聯絡,備註}` → 同源 `/api/proxy` 白名單 → 伺服器端常數 `SCOUT_ADMIN_API` → 收件匣 Sheet。管理員流程：核對（ping/status）→ `units.json` 加 entry + Vercel env → Redeploy → 通知。安全：per-IP 限流、去重、**管理員 2FA**、收件匣 Sheet 只有本人、登記後可叫對方 rotate key 一次。
- 審計：`ACCESS_LOG`（ts, sub, role, via, event）+ `AUDIT_LOG`（append-only、server-side、ScriptLock 內 commit、`prev_hash` 鏈）；24 個月 purge。
- PDPO：開戶流程帶「家長同意」欄 + 可複製文案（收集咩／用途／邊個睇到／離隊 12 個月刪）；數據清單一張表；離隊 `TRANSFERRED_OUT`／`LEFT` 12 個月 purge 或匿名化。
- 交接 SOP：上級重設密碼 → 撤 `branch_access`／override → Google／Vercel **ownership 轉名**（機構／專用帳戶 + 兩名管理人 + 2FA）→ rotate 受影響 key。
- MOCK 示範旅團：純前端全功能假數據，頂欄「示範模式」水印，匯出帶 `_exportedFrom:'mock'` 同真數據分開。**教材三層**：每角色一頁快速入門（首次登入必見）／每模組一頁說明／MOCK 引導任務；加「開旅 checklist」一頁；教材放 repo `docs/` 跟版本走。
- 施工次序（`BUILD.md` §10）：`/api/proxy`+`requireAuth` → 密碼雜湊 → ScriptLock → `mustChangePw`+鎖定 → 限流 → AUDIT/ACCESS LOG → 其餘；功能次序：UI 骨架 → 帳號 → 通告+個人化訂閱（★）→ 行事曆 → 物資 → 財務 → 移交 → MOCK／教學。

---

## 12. 五個 as-built repo ＋ 現況差異（`進度追蹤` §11／§12）

> 2026-10-27 `gh api` 查實存在。健康狀況（邊個有大問題）→ [20 repo 健康審計](20-repo-health-audit.md)。

| Repo | 角色 | 去邊搵 |
|------|------|--------|
| [`vsbadge`](https://github.com/playerkousas-rgb/vsbadge) | 深資支部；`operations/TROOP_LINK_UPGRADE.md`（PR #19）**基準** | `sig` 雙通道、12 讀／19 寫白名單、`upsertUser`、`tests/troop_link.test.mjs` |
| [`roverbadge`](https://github.com/playerkousas-rgb/roverbadge) | 樂行支部；`docs/TROOP_UPGRADE_2026.md`（PR #23／#24）**另一基準** | `deactivateUser`／`reactivateUser` 差異、接入步驟表 |
| [`cubsbadge`](https://github.com/playerkousas-rgb/cubsbadge) | 幼童支部；**現況差異**（唔係基準） | 舊 `sig` 無 nonce／零回打 → 唔好照抄 |
| [`scoutbadge`](https://github.com/playerkousas-rgb/scoutbadge) | 童軍支部；同上現況差異 | 同上；兩者之間 canonical 都唔同 |
| [`scout-circulars`](https://github.com/playerkousas-rgb/scout-circulars) | 通告圖書館；每日 scrape + push + VAPID | 推送鏈真實上游、`subscription_stats.py` |

**VS／RS（實測成功） vs cubsbadge／scoutbadge（現況）對照**：

| | VS／RS | cubsbadge／scoutbadge |
|---|---|---|
| `sig` 輸入 | `action + ts + nonce + sha256(body)` | `childId + sub + scope/role + children + target + exp（+jti）` |
| 密鑰推導 | `HMAC("<repo>-troop-sig-v1", D)` | 直接用單位 apikey 做 HMAC key |
| 防重放 | ±5 分鐘 + nonce 一次性 + body digest | **冇 nonce／冇 ts**：重放窗口＝TTL（30–60 分鐘） |
| 傳送 | query + body 雙通道 | body 一次 |
| 登記位置 | 上游 GAS `ScriptProperties` `DOWNSTREAM_*` | 冇（靠 Vercel env／`setDownstreamAccess`） |
| 中央登入 | GAS 回打 `/api/super` 驗票（已成功） | 零回打：Vercel 驗 `SUPER_KEY` → `action=superLogin` |
| 跨 repo | 唔支援（同 repo 同 `<purpose>`） | 同樣唔支援，而且兩者之間亦唔相同 |

**12 項定案（`進度追蹤` §12）**：① `<purpose>` 每 repo 一條 ② action 各自白名單各自實測 ③ 旅層 registry 喺上游 ScriptProperties，唔建 TROOP_OPS 表 ④ 先搬數先測連線先閂口 ⑤ 中央登入回打固定端點 ⑥ `setPw`／`verifyPw` 本輪範圍外。其餘照 §2／§5／§6／§7／§9／§10。

**驗收（`進度追蹤` §10）**：`troop_link.test.mjs` **10 項守**（掣未設定零變化／閂口全拒／登記後 sig 可讀可寫／sig 防護／ABCD 唔落 Sheet／兩邊同一 hash／匯出匯入保留舊密碼／批量唔洩漏 hash／標籤唔變算式／GS 無版號註解）；vsbadge e2e **153 通過 0 失敗**、roverbadge check 46/46 + e2e 151。
> **本地回歸綠 ≠ 完成**：`sig` 經真實 302 轉址、Drive 權限、Script Properties 配額、`onOpen` 選單授權，喺新部署嘅旅團**仍然要真機跑一次**。

---

## 13. 已知例外／勘誤（**只屬呢個專案**）

| 原檔寫法 | 通用規則 | 點處理 |
|----------|----------|--------|
| `進度追蹤 §9`「版號只留本 MD，Code.gs 唔寫 `// vX.X`」 | [V1/V2](../docs/13-versioning.md) 檔名＋內文雙版號 | 專案例外，保留；**新 app 一律跟 V 系列** |
| `BUILD.md §S3` `installCommand: npm install --omit=dev` | [`--include=dev`](../docs/06-vercel.md) | **勘誤**：`--omit=dev` 會令 Vercel build 搵唔到 `vite`；新 app 唔好抄 |
| `進度追蹤 §11` cubsbadge／scoutbadge 舊 `sig` | [A7 通用簽名](../docs/03-security.md) | 已知弱點（重放窗口＝TTL），日後對齊 VS／RS |

---

## 14. 由案例提煉嘅「可選模式」（R1–R8，**唔係通用底線**）

> 2026-10-27 用戶指示：呢堆係專案案例嘅**extract**，唔應該變成所有 app 嘅強制設定。
> 放喺呢度畀你參考；**新 app 唔使逐條跟**，通用底線仍然係 S/F/A/W/V ＋ G/VL/X/U/C。
> 對照審計（點解當初抽咗出嚟）→ [18 §3](18-as-built-gap-audit.md)。

| 可選模式 | 一句話 | 案例出處 |
|----------|--------|----------|
| R1 | 定級別先開工：寫低「我係邊個級／我改嘅係咪我轄下」 | `AGENTS.md` §1–2 |
| R2 | 每層要有「唔做清單」：寫死「呢層冇 X 係正常」 | `進度追蹤` §0.1／§8 |
| R3 | 功能註冊制：新功能先入 registry，導航由 registry 生 | `BUILD.md` §4 |
| R4 | 接駁追加唔搬 + `normId` 單一實現 + 換 key 三處同步 | `BUILD.md` §1 |
| R5 | 上游控下游寫 + fail closed + 留一戶災難恢復 | `進度追蹤` §5 |
| R6 | 回傳三條寫死 + 下游永不回打上游 + 跨 repo 邊界 | `進度追蹤` §4／§12 |
| R7 | 身份錨點 + 子 leaf 唔開戶 + 含 hash 搬數即刪 | `BUILD.md` §2–3 |
| R8 | 三色燈／`dbInfo`／`rel=noopener`／`verifyPw` 限次／MOCK 教材三層／真機跑一次 | `BUILD.md` §3／§9 |

> 通用化咗嘅部分（仍然喺 PLAYBOOK）：`sig` 雙通道技術（A7/X4）、fail closed（F4）、`exportAll` 備份（F11）、`push_subscriptions` 只存 hash（U4）、`/api/super` 60 秒票據（A 系列）、身份錨點概念（README 兩條公理）。
> 呢個表同通用規則嘅**邊界**就係：技術機制通用；組織階梯、模組名、`SCOUT_ID` 格式、`<purpose>` 字串、五個 repo 名 — 全部留喺本檔。
