# 02 — 防呆（F1–F18）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> 核心假設：**人一定會手震、會抄錯、會漏一步、會以為自己記得**。所以每一個「一定要」都要變成系統自動攔截，唔係寫喺文件就叫做完。
> 呢度嘅規則多數係由 ecportal 真實事故／邊界提煉（[BUILD.md](../BUILD.md)、[進度追蹤旅系統升級版.md](../進度追蹤旅系統升級版.md)）。

---

## F1 — 單一真理（Single Source of Truth）

每個概念只可以有一份定義：

| 概念 | 唯一位置 | 常見違規 |
|------|----------|----------|
| 規則編號 | `PLAYBOOK.md` | checklist 自己改咗個 ID |
| 單位／團資料 | registry（`units.json` / `DOWNSTREAM_*`） | 前端 hardcoded 一個 troop list |
| 功能開關 | `FEATURE_REGISTRY` / config table | 每個 page 自己 `if (enabled)` |
| 密碼 hash 邏輯 | server 一個 function | GAS 同 Vercel 各寫一份 |
| 版號 | MD 文件 | code 註解 `// v2.3` |

**做法**：定義一次 → 其他地方 import / reference；有測試掃「有冇第二份定義」。

---

## F2 — ID 正規化單一實現

```js
// 唯一一個 normId（82 / 082 / 0082 / 00082 = 同一單位）
export function normId(x) {
  const s = String(x ?? '').trim().toUpperCase();
  const m = s.match(/^(\d{1,})([A-Z]*)$/);
  return m ? m[1].padStart(4, '0') + m[2] : null;   // 唔合法 = null，唔好「盡量修」
}
```

**死規矩**：所有比較、lookup、key 拼接之前都要過 `normId`；入 DB 存正規化後嘅值。
撞號 / 唔合法 → **拒絕 + 人手處理**，唔好自動猜。

---

## F3 — registry 驅動

```
新功能 = 一條 registry entry（名、入口位置、所需權限、開關、說明頁）
導航由 registry 自動生成，最多兩層
未登記 = 唔存在（server 亦拒）
```

好處：唔會「順手加個圖書館」；分享前設（接收方要有該模組）自然成立；下游掛接唔使改 ENV。
反面：hardcoded 選單 → 永遠有個孤兒頁冇人管。

---

## F4 — fail closed（最常用嘅一條）

```js
const OPEN = new Set(['1','true','yes','on','open']);
export function isOpen(v) { return OPEN.has(String(v ?? '').trim().toLowerCase()); }
// 未設定 = 開啟，係唯一例外（向下兼容）；一旦有值，只有精確白名單先算開
```

適用：功能開關、`ALLOW_LOCAL_LOGIN`、kill switch、遠端 config、權限旗、webhook 簽名驗證。
**串錯字 = 閂**，唔係「當佢開」。呢條救過 `ALLOW_LOCAL_LOGIN`（[進度追蹤 §5](../進度追蹤旅系統升級版.md)）。

---

## F5 — 白名單 > 黑名單

| 地方 | 用白名單 |
|------|----------|
| GAS `action` | 讀 12 個／寫 19 個明確列出；其餘（包括 `login`／`updateConfig`）一律拒 |
| 檔種 | MIME allowlist |
| CORS / 回打 URL | 固定 URL 陣列 |
| 重定向 | 只准相對路徑 / 已登記 domain |
| 用戶標籤 | 字符 allowlist `0-9A-Za-z_.@-`（同時防算式注入，見 A11） |
| 訂閱來源 | allowlist origin |

黑名單永遠漏（`javascript:`／`data:`／大小寫／雙重編碼…）。

---

## F6 — 冪等鍵

每個「寫」都要有可以重複送而結果一致嘅鍵：

| 場景 | 鍵 |
|------|-----|
| 移交 / 匯入 | `transferId` (uuid)，重複匯入拒絕 |
| `sig` 請求 | `nonce` 一次性（CacheService 10 分鐘） |
| session | `jti` |
| 資料列 | `baseVersion`（見 F7） |
| 開戶 | 同 會員 ID / Email = 更新（upsert），唔係新增第二個 |

```js
// 寫入前：見過呢個 key 就返同一個結果，唔好再寫
if (seen.has(req.transferId)) return seen.get(req.transferId);
```

---

## F7 — 樂觀鎖 + 原子寫入 + tombstone

```
前端：staging（黃） → save（帶 baseVersion） → 綠 / conflict（紅）
後端：ScriptLock.waitLock(20s) → 暫存行 → 一次過 commit/swap
刪除：flag = DELETED（tombstone），purge 由後端定期做
```

- 撞版：回 `{ conflict:true, serverRow }`，前端 merge3 欄位級合併；同格衝突要用戶逐格確認。
- 攞唔到 lock：回 `{ busy:true }`，前端排隊重試 + backoff + jitter，**唔好靜靜 drop**。
- 行號計算「由底往上刪」，唔好由上往下刪（會移位）。

---

## F8 — 三色狀態 + 一鍵診斷

```js
// 標準診斷回應
{ version, bytes, sizes: {members, notices, logs}, stagingRows, backendVersion, configVersion }
```

用戶唔使識 console，撳一個掣就複製到完整診斷報告；前端見 `backendVersion` 舊就提示更新。
離線優先 app 必備，否則「我以為存咗」係最難查嘅 bug。

---

## F9 — 危險動作三步

```
① dry-run  →  「將會新增 12、更新 3、刪除 1，影響 4 個單位」
② diff 預覽 →  逐項列出 before/after（敏感欄位遮罩）
③ 確認     →  彈窗寫明後果 + 備份時間 + 回滾方法
```

適用：批量匯入、批量改密碼、刪用戶、閂入口、改 registry、migration、換 key。
**批量操作前自動提示備份**（F11）；閂下游入口之前要確認「已搬數 + 已測 sig 連線」。

---

## F10 — 校驗和 + schema 版本

```json
{
  "meta": { "unit":"...", "exportedAt":"...", "version":"...", "schemaVersion":3, "sha256":"..." },
  "data": { }
}
```

- 匯入先驗 `schemaVersion`（唔支援就拒，唔好「試吓」），再驗 `sha256(data)`。
- 密碼匯出只可選「含 hash」模式，且只收 64-bit hex hash；**帶明文 `password` 一律拒**。
- 匯出檔即設 `Access.PRIVATE` + `Permission.NONE`；用完即刪（[進度追蹤 §7](../進度追蹤旅系統升級版.md)）。

---

## F11 — 備份三時機

| 時機 | 動作 |
|------|------|
| 升級前 | `exportAll` 一份 |
| 批量操作前 | 自動彈提示 + 一份 |
| 7 日冇備份 | 頂欄黃提醒 |
| 每週自動 | Drive 存一份， rolling 留 13 份 |

`importAll` 要驗 hash + 原子寫還原；離線都匯得。
**冇實測過還原嘅備份 = 冇備份**：每季至少演練一次。

---

## F12 — 開機自檢（env 未設即拒敏感 action）

```js
const REQUIRED = ['SESSION_SECRET','SUPER_KEY','UNIT_DEMO_BACKEND','UNIT_DEMO_APIKEY'];
const missing = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  // 公開頁照行；敏感 action 一律 503 + 診斷（唔好爆堆疊）
  return json({ ok:false, code:'CONFIG_MISSING', missing }, 503);
}
```

**唔好等到 runtime 先 `undefined` 崩**。呢條亦係 GAS `requireAuth` 第一句「key 未設 = 拒」嘅兄弟。

---

## F13 — 統一錯誤碼

```js
// 一個表，前後端共用
const E = {
  CONFIG_MISSING: '系統設定未完整，請聯絡管理員',
  AUTH_FAILED:    '帳號或密碼不正確',        // 同「帳號不存在」一樣回應（A17）
  RATE_LIMITED:   '太多請求，請稍後再試',
  CONFLICT:       '資料已被其他人改動，請重新載入',
  UPSTREAM_ONLY:  '此入口已關閉，請經上層系統進入',
};
```

- 回應唔好帶 SQL、堆疊、env 名、檔案路徑。
- log 記 `code + requestId + metadata`，唔記密碼 / token / 個人資料。

---

## F14 — 守護測試 = 可執行嘅文件

文件每一句「一定要」都要有測試。實戰榜樣：`tests/troop_link.test.mjs` 10 項 —

1. 掣未設定 = 行為零變化
2. 閂口後直接登入 / 申請 / load / apikey save 全拒
3. 登記後 sig 可讀可寫 + 上游可閂掣 + 非 GAS URL 拒
4. sig 防護（錯 key／竄改／過期／未來 ts／重放／混合傳送／白名單外）
5. ABCD 唔落任何工作表
6. 上游開戶 = 兩邊同一 hash + 冪等
7. 匯出匯入保留舊密碼 + 明文拒
8. 批量 import + `getAllUsers` 唔洩漏 hash
9. 標籤唔會變算式
10. GS 內冇版號註解

另一組榜樣：[templates/canvas/brain.test.mjs](../templates/canvas/brain.test.mjs) 用 Node `vm` 載入 `brain_v1.0.gs`，16 條守：合約同 GS 白名單一致、prompt 版號對照、白名單外拒、角色拒、驗證、tombstone、紀錄 hash 鏈、`shell_v1.0.html` grep 無 prompt/key/fetch、缺 key 拒、`gemini.ask` 唔外洩。

**新寫一條規則 → 同時寫一個測試**；否則三個月後一定 drift。

---

## F15 — 版號可驗證（檔名＋內文雙寫）

> **2026-10-26 用戶定案改版**：每次更新都要**檔案名稱同內文同時更新版號**。
> 完整規則見 **[13-versioning.md](13-versioning.md)（V1–V6）**；呢條由「版號只留 MD」改成「雙版號 + 自動驗」。

```
✅ scout_generator_v1.0.html   → meta / title / APP_VERSION / 頁尾 / 註解全部 v1.0
✅ brain_v1.0.gs → Code.gs（部署拷貝由 sync 腳本產生，檔頭標 GENERATED v1.0）
❌ app.html 內文寫 v2.0（檔名冇版號）
❌ app_v1.0.html 內文仲係 v2.0
❌ Code.gs：// v2.3 2026-09-23 fixed sig（散裝註解當版號）
```

理由：單靠 MD 記版號，部署出去嗰個檔無人知係邊版；單靠 code 註解又會同 MD 打架。
而家兩邊都要寫、要一致，並由 `scripts/guard.mjs` + 測試自動對照（V6）。

> 專案級例外：[進度追蹤旅系統升級版.md §9](../進度追蹤旅系統升級版.md) 仍係「版號只留本 MD」——
> 嗰個係 ecportal 既有約定，新 app 一律跟 V 系列；要沿用舊約定喺 PR 用 `EXCEPTION: V1` 登記。

---

## F16 — 三處同步 checklist（最常出事）

### 換 apikey（D）
```
① 下游 ScriptProperties 刪 API_KEY → showApiKey() 生新 key
② 上游重新登記 DOWNSTREAM_<id>_KEY
③ ADMIN 改 Vercel env + Redeploy
④ 測連線（sig）→ 舊 key 即刻失效驗證
⑤ 查 AUDIT 有冇舊 key 使用
```

### 改通用規則
```
① PLAYBOOK.md 規則表
② docs/0X-*.md 詳情
③ scripts/guard.mjs / CI workflow
④ templates/ 入面對應範本
```

漏任何一處 = 「文件話要，系統冇做」。寫成 checklist，唔好靠記憶。

---

## F17 — 施工次序固定

見 [PLAYBOOK §9](../PLAYBOOK.md#9-施工次序唔好調轉)。
**1–8（repo 骨架 → 設定 → auth → 原子寫入 → 限流 → 審計 → 超管 → DR）唔可以插隊**。
功能次序可以調，但安全底層未起好就加功能，之後全部要拆。

---

## F18 — 開關 + 回滾

- 每個新功能一個 kill switch（config flag，fail closed）。
- 每次 PR 描述要有**回滾指令**：Vercel 上一個 deployment URL / `git revert <sha>` / GAS 部署版本還原。
- 改 schema 要向後兼容一個版本（expand → migrate → contract），唔好一步到位。
- 下游閂口前要有「經上游轉發」嘅路徑；**冇就唔好閂**（一閂即死，呢條係實戰教訓）。

---

## 防呆驗收

```
[ ] 每個新 action 入咗白名單，而且有測試
[ ] 每個寫入有冪等鍵 + baseVersion
[ ] 每個開關 fail closed
[ ] 每個危險動作有 dry-run + 確認 + 回滾
[ ] 每個 env 有 .env.example + 開機自檢
[ ] 每個匯出有 schemaVersion + sha256，而且實測還原過
[ ] 每條「一定要」有對應測試（F14）
[ ] 版號只喺 MD（F15）
```
