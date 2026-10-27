# 07 — Google Apps Script（X1–X12）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> 定位：**每個單位自己嘅 leaf 後端** = 一張 Sheet + 一支 `Code.gs` + 一個 `/exec`。
> 優點：單位自己擁有數據、零 server 成本；限制：quota、6 分鐘執行上限、`/exec` 公開面。
> 所以呢份文件特別重 **auth / sig / 原子寫入 / 瘦身**。

完整 as-built 實戰（**專案，唔係通用**）：[19 專案案例](19-ecportal-troop-case.md)（內有原檔連結）。

---

## X1 — 一份 `Code.gs` 部署喺每一層

```
上游 GAS ──sig──▶ 中游 GAS ──sig──▶ 下游 leaf GAS
  │ 上游 ScriptProperties: DOWNSTREAM_<id>_URL/_KEY/_NAME/_AT
  └─ 下游 ScriptProperties: ALLOW_LOCAL_LOGIN
```

- 同一份碼：一個節點可以同時係上游（對自己下游）同下游（對自己上游）。
- 升級：Apps Script → **全檔覆蓋** `Code.gs` → 部署 → 管理部署 → ✏️ 編輯 → 版本選「新版本」。
  **`/exec` URL 唔變 → registry 唔使改**。
- 只有**全新 Sheet** 先跑 `initializeSheets()`；現有 Sheet 唔好重跑（唔改 schema、唔清資料）。

---

## X2 — 四個變數 ABCD（四個都唔寫入 Sheet）

| 代號 | 名 | 邊度 |
|------|-----|------|
| **A** | `SUPER_KEY` | Vercel env（隱藏超管，與上下游接駁無關） |
| **B** | `UNIT_<id>_BACKEND` | Vercel env；上游存 `DOWNSTREAM_<id>_URL` |
| **C** | `UNIT_<id>_NAME` | Vercel env（純顯示名） |
| **D** | `UNIT_<id>_APIKEY` | GAS `ScriptProperties.API_KEY` + Vercel env；上游 `DOWNSTREAM_<id>_KEY` |

- B/D 由 Sheet 選單一次過抄，經安全渠道交管理員；**四個值都唔寫入任何 Sheet**（案例做法見 [19 §4](19-ecportal-troop-case.md)）。
- **有測試守「ABCD 唔落任何工作表」**（[F14](02-foolproof.md#f14--守護測試--可執行嘅文件)）。
- 換 D = 三處同步（[F16](02-foolproof.md#f16--三處同步-checklist最常出事)）。

---

## X3 — `requireAuth` 第一行

```javascript
function doPost(e) {
  return guard(e, () => handlePost(e));   // 第一行就驗
}
function guard(e, fn) {
  const key = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!key) return json({ success:false, code:'CONFIG_MISSING' });   // F12
  // 驗 sig（query 優先，body 後備）或驗用戶 token
  if (!verifyInbound(e, key)) return json({ success:false, code:'AUTH_FAILED' }, 401);
  return fn();
}
```

`doGet` 一樣；**key 未設 = 拒絕敏感 action**，唔好「暫時開放」。

---

## X4 — Action 白名單（兩張表）

```
讀：load / getLoginMode / getLinkState / getMembers / getConfig / getAllUsers /
    getOtherBadges / getPendingRequests / getApplications / getLogRecords /
    getLogRequests / getAuditLog
寫：save / saveOtherBadge / requestComplete / reviewRequest / addMember / addUser /
    bulkAddUsers / upsertUser / importUsers / resetPassword / updateUserProfile /
    setUserStatus / deleteUser / updateUserRole / updatePermissions /
    saveLogRecord / deleteLogRecord / reviewLogRequest / setLocalLogin
永不接受（即使有 sig）：
    login / apply / logout / changePassword / updateConfig / requestLogRecord /
    cancelLogRequest ＋ 白名單外任何 action
```

- 各 repo 可以有自己嘅 action set（例 roverbadge 用 `deactivateUser`/`reactivateUser`），但**要各自寫明白名單、各自實測**。
- 讀取回應**永遠唔含 `password_hash`**（有測試守）。
- 上游傳嚟嘅標籤先消毒（只留 `0-9A-Za-z_.@-`），防試算表算式注入（A11）。

---

## X5 — `sig`（GAS → GAS，唔經 Vercel proxy）

```
sigKey    = hex(HMAC-SHA256("<purpose>", D))
canonical = action + "\n" + ts + "\n" + nonce + "\n" + hex(SHA-256(rawBody))
sig       = hex(HMAC-SHA256(canonical, sigKey))
```

- `<purpose>` 每個 repo 一條常數（`<repo>-bridge-sig-v1`）；**上游下游必須同 repo 同字串**；跨 repo 直連係已知邊界。
- 兩組 sig 一齊送（query + body），因 GAS 302 會遺失 query；兩組 nonce 一次過消耗。
- 防護：`±5min`、`nonce` 一次性（CacheService 10 分鐘）、body ≤900KB、64 hex、只 POST、比較用雙 SHA-256。
- 上游簽出站用**下游嘅 D**；下游驗入站用**自己嘅 D**。
- 詳見 [03-security A7](03-security.md#a7--sig-簽名gas--gas-實戰定案)。

---

## X6 — ScriptLock + 原子寫入

```javascript
const lock = LockService.getScriptLock();
if (!lock.waitLock(20000)) return json({ success:false, busy:true });  // 前端排隊重試
try {
  // 暫存行 → 校對 baseVersion → 一次過 setValues / commit/swap
} finally { lock.releaseLock(); }
```

- 撞版回 `{ conflict:true, serverRow }`（F7）。
- 刪除 = tombstone flag；purge 由後端定期做。
- 行號計算由底往上刪。
- 大庫分件 `saveDbPart` / 分段 `loadDbPart`（每段核 version）。

---

## X7 — 瘦身 / quota

| 限制 | 對策 |
|------|------|
| body ≤ 900KB | 分件／壓縮；`sig` 都以 900KB 為上限 |
| 逐格 `setValue` 慢 | `getRange().setValues()` 批量 |
| 6 分鐘執行上限 | 拆 job + 冪等鍵 + 續跑指標 |
| Script Properties 配額 | 只存必要 key；定期清 `DOWNSTREAM_*` 孤兒 |
| CacheService | cache 5 分鐘；nonce store 10 分鐘 |
| Logger 太大 | 只記 metadata，唔好 log 整個 db |

---

## X8 — 開戶錨點（唔准反寫）

```
身份只喺**一個來源**誕生（例：主名冊 Sheet）；其餘系統只收鏡像，
下游 leaf 係純身份消費者：搵唔到 sub 就報「上游未開戶」，唔會自己補、唔會反寫上游。
（具體角色分層 → [19 §8](19-ecportal-troop-case.md)）
```

- 閂口後新戶由**上游前端開戶** → 經 `sig` 落下游 `upsertUser`（兩邊同一 hash）。
- `upsertUser`：新戶必須帶 64 hex `password_hash`；**帶明文 `password` 一律拒**；同 會員 ID／Email = 更新；冪等。
- 回應永遠唔含 `password_hash`。

---

## X9 — 吐 JSON（搬舊數）

```
舊後端「匯出 JSON（含 hash）」→ private 檔（ Drive 即設 PRIVATE + Permission.NONE；失敗寫 Logger 後備）
新後端「匯入 JSON」→ 逐個 upsertUser 直插 hash（保留舊密碼）
                     一次最多 2000 筆；只收 64 hex hash；壞 JSON／缺 ID 一律拒
核對筆數 → 先至可閂下游入口 → 即刪匯出檔（案例：Drive 做法見 19 §8）
```

- `transferId` 冪等 + `sha256` 驗 + 撞號阻擋。
- 完成彈窗顯示「新增 X、更新 Y、失敗 Z」。
- **唔好用共享資料夾或電郵明文傳送**（含 hash）。

---

## X10 — 部署 / 選單 / 版號

- 部署設定：執行身分「我」、存取權「任何人」；URL 必須係正式 `/exec`（登記時會驗）。
- 選單分兩類：**日常管理**（登記下游／測試連線／開戶／匯出入）同 **災難恢復**（開本機入口）。
- **雙版號**（[V 系列](13-versioning.md)）：版本化源檔 `brain_v1.0.gs`／`shell_v1.0.html` 係唯一真理，部署拷貝 `Code.gs`／`index.html` 由 `sync_canvas_v1.0.mjs` 產生；code 唔寫散裝 `// vX.X` 註解。
- `operations/` / `docs/` 維運 MD 入 `.vercelignore`，只留 Git 唔部署。

---

## X11 — 回傳三條（唔好撈亂）

1. 中央登入「回傳」= **有**：GAS 回打固定 `/api/super` 驗 60 秒一次性票據（唯一容許嘅回打）。
2. 上下游 sig 鏈 = **單向**（上游 → 下游），下游**同步回一個結果** `{success, data}`（呢個唔算回調）。
3. **冇非同步 callback endpoint**：下游永不主動回打上游；冇 timer / `onEdit` trigger。

---

## X12 — 守護測試（10 項）

守護測試（真實例子 `tests/troop_link.test.mjs` → [19 §12](19-ecportal-troop-case.md)）要守：掣未設定行為零變化／閂口後全拒／sig 可讀可寫＋非 GAS URL 拒／sig 防護／ABCD 唔落 Sheet／兩邊同一 hash＋冪等／匯出入保留舊密碼＋明文拒／`getAllUsers` 唔洩漏 hash／標籤唔變算式／GS 內冇版號。

真機仍要驗：GAS 302 轉址、Drive 權限、Script Properties 配額、`onOpen` 選單授權。

---

## Apps Script 驗收

```
[ ] /exec 部署正確 + URL 正式格式
[ ] ABCD 只喺 ScriptProperties / env，唔喺 Sheet
[ ] doGet/doPost 第一行 requireAuth
[ ] action 兩張白名單 + 永不接受清單
[ ] sig 雙通道 + nonce + ts + body digest + 只 POST
[ ] ScriptLock + 樂觀鎖 + tombstone
[ ] 讀取回應無 password_hash
[ ] 開戶錨點無反寫
[ ] 匯出入實測過 + 用完刪檔
[ ] 雙版號：源檔名 + 內文 APP_VERSION + 部署拷貝 GENERATED 標記一致（V1/V4）
```

---

## X13 — Gemini 腦殼分離嘅 GAS 承載（HtmlService）

> 完整規格：[09-gemini-canvas.md](09-gemini-canvas.md)。呢度只講 GAS 側要使注意嘅嘢。

```
Code.gs（腦）  ──doGet()──▶  HtmlService.createHtmlOutputFromFile('index')
      ▲                              │ 會落瀏覽器
      └──── google.script.run.api(action, payload) ────┘
```

| 要點 | 做法 |
|------|------|
| 只有 `api()` + `doGet()` public | GAS 所有 top-level function 都要當成 client 可呼叫；helper 收喺 `BRAIN` IIFE |
| HTML file 名 | 必須 `index.html`（`createHtmlOutputFromFile('index')`） |
| Prompt 唔注入 | 唔好用 `<?= SYSTEM_PROMPT ?>`；scriptlet 輸出會落瀏覽器原始碼 |
| 紀錄 | `RECORDS` Sheet `appendRow()` + `prev_hash` 鏈；client 無 update/delete action |
| key | `GEMINI_API_KEY` 放 ScriptProperties；`UrlFetchApp` 代 call Gemini API（X7 quota、body 上限照守） |
| 部署 | 管理部署 → 版本選「新版本」；`/exec` URL 唔變，registry 唔使改 |
| 測試 | `node --test templates/canvas/brain.test.mjs`（Node `vm` 載入 `brain_v1.0.gs`，16 條） |
| 改 UI | 用 [Canvas prompts](../templates/canvas/PROMPTS_v1.0.md) 只生 `index.html`；`Code.gs` 唔交俾 Canvas 改 |

**常見死法**：將 `Code.gs` 內容貼入 Canvas 對話「方便改」→ prompt 即刻外洩。
**另一個**：用 `localStorage` 做唯一紀錄 → 換機即失、無審計。要落 Sheet（C10）。
