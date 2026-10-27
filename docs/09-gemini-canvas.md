# 09 — Gemini／Canvas 三種結構（全開放 ／ 隱藏水印 ／ 腦殼分離）

> **2026-10-26 定案**：我平時整嘅 Gemini app 分 **三種**，唔係兩種，亦唔係「JS module 分層」。
> 三種都要守通用規則：**瘦身 S／防呆 F／安全 A／COPYRIGHT SCOUT SYSTEM W／雙版號 V**。

| 類型 | 名 | 一句 | 主要用途 |
|------|-----|------|----------|
| **A** | 全開放 | 一個 HTML，乜都唔保護，任何人攞去用 | 工具、教學、公開 demo |
| **B** | 隱藏水印 | 一個 HTML ＋ 隱形水印 ＋ 解碼器 ＋ API KEY 自動注入位 | 出圖／生成內容，要證明來源 |
| **C** | 腦殼分離 | `HTML（殼）＋ Code.gs（腦）` | 記錄原圖／成品圖／使用紀錄，保護 PROMPT 設定 |

---

## C1 — 決策表（揀錯結構 = 之後要拆）

```
係咪要證明「呢張圖係我個系統出」？ ── 是 → Type B（或 B+C）
係咪要留住原圖／成品圖／使用紀錄？ ── 是 → Type C
係咪有 PROMPT 設定唔想俾人睇？   ── 是 → Type C
係咪要 call Gemini API？          ── 是 → B（自動注入）或 C（server-side，推薦）
以上全部唔係？                    ── Type A
```

| 考慮 | A 全開放 | B 隱藏水印 | C 腦殼分離 |
|------|----------|-----------|-----------|
| 檔 | `app_v1.0.html` | `app_v1.0.html` + `drawscout_decoder_v1.0.html` | `index.html` + `Code.gs` |
| PROMPT | 可以公開（甚至無） | 可以公開 | **放 `Code.gs`，受保護** |
| API KEY | 唔好用 | placeholder + 本機注入／BYOK | **ScriptProperties，server-side** |
| 圖片紀錄 | 無 | 只有水印 payload | **原圖 + 成品圖 + 使用紀錄** |
| 來源證明 | 無 | 隱形水印（頂到輕微壓縮） | 水印 + 伺服器紀錄（雙軌） |
| 部署 | 直接開 / Vercel 靜態 | 直接開 / Vercel 靜態 | Apps Script Web App `/exec` |
| 風險 | 零保護 | 水印唔係 DRM；前端 key 會外洩 | GAS quota、部署較麻煩 |

> **可以疊**：Type C 嘅成品圖一樣可以落 Type B 水印（雙軌最穩）。

---

## C2 — Type A：全開放（一個 HTML）

**適用**：密碼產生器、日期計算機、色票、教材 MOCK、公開 demo、外接工具目錄（[EXTERNAL.md 模式 C](../EXTERNAL.md)）。

```
✅ 一個 HTML，方便 Gemini Canvas preview／直接分享
✅ 單檔 ≤ 5MB（C13-g：Gemini Canvas 上限，唔強制瘦身；S6/S7 唔適用）
✅ STATE 帶 schemaVersion + exportState()/importState()（F10 逃生門）
✅ 用 textContent / DOM API，唔好 innerHTML（A11）
✅ 頁尾要有 © SCOUT SYSTEM + 版號（W1/V2）—— 全開放 ≠ 無版權
❌ 唔好放 API key / system prompt / few-shot（原始碼 = 公開，A1）
❌ 唔好將重要紀錄只放 LocalStorage（會被清、無審計）
❌ 唔好喺前端做授權判斷（可 bypass，A6）
```

**交付**：`tool_v1.0.html`，內文 `<meta name="app-version" content="v1.0">` + `APP_VERSION` + 可見頁尾（[V 系列](13-versioning.md)）。

---

## C3 — Type B：隱藏水印模式（出圖專用）

**目的**：成品圖落入 WhatsApp／社交平台之後，仍然可以用解碼器讀到 `© SCOUT SYSTEM` 來源標記。

**你提供嘅 `drawscout.html` 就係解碼器**（已收錄成 [drawscout_decoder_v1.0.html](../templates/watermark/drawscout_decoder_v1.0.html)）：
```
MARK  = 'DRAWSCOUT|v1'（向後兼容）
STEP  = 32
基底  = 8×8 DCT 中頻 (u=2, v=3)，A[2]·A[3]·COS[2][y]·COS[3][x]
寫入  = 每區塊 1 bit，payload 循環重複；QIM 量化
解碼  = 逐區塊投票（majority vote），信心度 > 0.58 先算找到
```

**v2 payload（預設）**：`SCOUTSYSTEM|v2|<unit4>|<yyyymmdd>|<hash4>`（33 chars / 264 bit）
— 含版權前標、單位、日期、校驗；**唔放個人資料**（W7）。

完整 W 系列規則 → [12-copyright-scout-system.md](12-copyright-scout-system.md)。

---

## C4 — Type B：生成器 ＋ 解碼器 ＋ codec（可抄）

| 檔 | 角色 |
|----|------|
| [scout_generator_v1.0.html](../templates/watermark/scout_generator_v1.0.html) | 上圖 → 嵌水印 → 下載 `xxx_scout_v1.0_wm.png`；可見版權字 + 隱形水印雙軌 |
| [drawscout_decoder_v1.0.html](../templates/watermark/drawscout_decoder_v1.0.html) | 揀圖 → 解 v1/v2 → 顯示 payload／信心度／單位／日期 |
| [scout_watermark_codec_v1.0.mjs](../templates/watermark/scout_watermark_codec_v1.0.mjs) | 演算法唯一真理：`embed()` / `decode()` / `makePayloadV2()` |
| [watermark.test.mjs](../templates/watermark/watermark.test.mjs) | 9 條測試（v1/v2 round-trip、魯棒性、payload 消毒、雙版號） |

```bash
node --test templates/watermark/watermark.test.mjs     # 全綠
```

**限制一定要同用家講（W4）**：頂到輕微 JPEG 壓縮／部分裁切；頂唔到大幅縮放、旋轉、重度壓縮、AI 重繪。**陰性結果唔代表圖片一定唔係本系統生成** — 水印係來源標記，唔係加密／DRM／法律證據。

---

## C5 — Type B：喺 GEMINI 自動注入 API KEY（C13，已實作可用）

> **2026-10-27 用戶定案**：你 `童軍漫畫生成器` 嘅「自動注入」**已經實作、真係用到，呢個就係正確嘅注入方式**。
> 我上一版將佢講成「過時／誤解」係錯，已改正。三軌係**同一套實作**，唔係三選一，亦唔係本機換 placeholder。
> 詳見 [14 §1.1](14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)、[16 案例 §2](16-canvas-case-scout-comic.md#2--自動注入你已經實作而且真係用到)。

| # | 模式 | 做法 | 安全 / 備註 |
|---|------|------|-------------|
| **C13-①** | **唯一注入 slot** | 全檔唯一 `const API_KEY = "";`，平台可填入；你 VERSION_LOG v3.7.0 實測重複宣告會令注入改錯位 | **已實作** |
| **C13-②** | **平台請求代理** | `fetch(..., { credentials:'include' })`；冇 key 時**唔加 `?key=`**，平台攔截 request 代加認證（v3.9.0 實測） | **已實作** |
| **C13-③** | **本機／BYOK 後備** | 用戶自己入 key，`safeStore` 保存；離開 Canvas（ZIP／`file://`）都用得 | **已實作** |
| **C13-a** | AI Studio Build server-side secret（**另一類 app**） | 全端 app（有 server route）平台設 `GEMINI_API_KEY` 做 server-side env；前端零 key | 最高，但唔係單一 HTML |
| **B-1** | 零 key 單一 HTML（**香港交付首選**） | 生成期用 AI，runtime 唔 call AI（水印解碼器模式）；或 Pollinations 免金鑰 provider | 最高（A1 天然合格） |
| **B-3** | Type C server-side | `Code.gs` 由 ScriptProperties 拎 key，`UrlFetchApp` 用 header 代 call | 最高 |
| **B-4** | 本機手動注入（**另一條路，唔係 C13 自動注入**） | `inject_key_v1.0.mjs` 換 `__INJECT_GEMINI_API_KEY__` → `_local_v1.0.html` | 只限本機，注入版永不入 Git |

**C13 硬規則**（你 v3.5.1／v3.7.0／v3.9.0 實測）：
1. ①②③ 三軌**同時保留**；唔好刪走任何一軌。
2. 全檔**只准一處** `API_KEY` 宣告。
3. `localStorage` 一律 try/catch（`safeStore`）—— Canvas sandbox 存取即拋錯令全 app 停擺。
4. 缺 key 時**先照樣送出請求**（平台可能代理加認證），失敗先顯示清楚原因；唔好一開始就拋「冇 key」。
5. **可選加固**：③ 嘅 BYOK key 改用 `x-goog-api-key` header，唔好 `?key=` query（A1/W6，會入 log／history／referrer）。
   呢個只係改 ③ 嘅傳遞方式，**唔影響 ①② 嘅注入機制**。

**Gemini Canvas prompt（唯一真理）**：直接抄 [14 §4 Gemini Canvas prompt](14-api-key-injection.md#4-gemini-canvas-prompt正確版)，
唔好喺呢度再貼一份（兩份會 drift，F1）。重點：三軌注入、單檔 5MB、© SCOUT SYSTEM + 雙版號。

> ⚠️ **千祈唔好**將真 API key 貼入 Gemini 對話叫佢「幫我寫入去」— 對話紀錄／分享連結／Canvas 原始碼全部會見到，等於公開（A1）。
> 🇭🇰 **香港可用性**：你個 [`api/docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md) 實測 Google AI Studio / Gemini API 香港 IP 封咗；
> 但 **Canvas preview 靠 C13 三軌注入行得通**（你個 `童軍漫畫生成器 v4.2.1` 就係實證）。
> 要**交付**俾香港用戶永久用 → 用 B-1 零 key 單一 HTML 或 B-3 Type C；唔好假設 `file://` 直打得通。
> 單一 HTML **5MB 上限**（C13-g）；完整判斷：[14 §2](14-api-key-injection.md#2-香港真正用得到嘅做法你個水印-html-就係)、[15 資源索引](15-resource-index.md)。

---

## C6 — Type C：腦殼分離（HTML 殼 ＋ GS 腦）

> **定義**：原本一個 HTML 拆做 **`Code.gs`（腦，Apps Script server-side）＋ `index.html`（殼）**。
> **目的**：① 記錄**上傳嘅原圖同成品圖** ② 記錄**使用紀錄** ③ **保護 PROMPT 設定**。

```
🎨 index.html（會落瀏覽器 → 當佢公開）
   UI + 上載／預覽／下載；唯一通道 google.script.run.api(action, payload)
   （GS HTML file 硬性命名 index.html，部署拷貝由 sync 腳本產生）
        ↓
🧠 brain_v1.0.gs → Code.gs（Apps Script server，唔會送出）
   SYSTEM_PROMPT / ACTIONS 白名單 / RULES / appendRecord()
   只有 api() 同 doGet() 係 public function
        ↓
🗂️ RECORDS Sheet（append-only + prev_hash 鏈）＋ Drive／Supabase Storage（圖）
```

---

## C7 — Type C：檔案職責 + 原圖／成品圖點存

| 原本喺單一 HTML | 搬去 | 原因 |
|---|---|---|
| `SYSTEM_PROMPT` / few-shot / 評分標準 | `Code.gs` `BRAIN` IIFE 常數 | 原始碼會被睇到（C9） |
| Gemini API key | `ScriptProperties.GEMINI_API_KEY` + `UrlFetchApp` | A1 |
| 上傳嘅**原圖** | Drive 私有資料夾／Supabase Storage（private bucket），只存 `fileId` + `sha256` | 唔好 base64 入 Sheet（S11）；唔好用公開連結 |
| 生成嘅**成品圖** | 同上，另存一份；`watermarkPayload` 記低 | 要可以由水印反查邊張圖 |
| **使用紀錄** | `RECORDS` Sheet append-only + hash 鏈 | LocalStorage 會被改／清／無審計 |
| 用戶狀態／角色 | ScriptProperties `STATE` / `USER_ROLES` | server 驗，唔信前端 role（A6） |
| 規則／驗證／計分 | `ACTIONS` + `RULES` + 唯一 `api()` | 前端規則可 bypass |
| UI / CSS / event | `index.html` | 本來就公開 |

**RECORDS 建議欄（圖片版）**：
```
ts | actorHash | action | unit | promptVersion | watermarkPayload |
originalHash | originalFileId | outputHash | outputFileId | bytes | resultCode | prevHash | hash
```

- 只存 hash 同 fileId，**唔存圖檔本體、唔存個人資料**（A12/W7）。
- 圖檔保留期跟 PDPO：離隊／項目完結 12 個月後 purge（[A12](03-security.md)）。
- 下載用短時效 signed URL，唔好長期公開分享連結（A9）。

---

## C8 — Type C：`Code.gs` 唯一入口 ＋ `index.html` 殼

```javascript
// ❌ 唔好：每個 function 都 public，client 可以 google.script.run 直接扑
// ✅ 啱：只有 api()，其他收喺 BRAIN IIFE
function api(action, payload) {
  var def = ACTIONS[action];
  if (!def) return fail('UNKNOWN_ACTION');                  // F5
  if (!hasRole(def.roles)) return fail('AUTH_FAILED');     // A6
  var bad = validate(def.in, payload || {});
  if (bad) return fail('BAD_INPUT', bad);
  var r = RULES[action](payload || {});
  if (!def.read) appendRecord(action, payload, r);         // C7 留痕
  return r;
}
function doGet() { return HtmlService.createHtmlOutputFromFile('index').setTitle('My App'); }
```

`index.html` 只可以做：
```js
google.script.run.withSuccessHandler(done).withFailureHandler(onErr).api(action, payload);
```

**鐵則**：GAS 所有 top-level function 都要當成 client 可呼叫；敏感 helper 收喺 `ACTIONS`／`RULES` 物件入面。

> ⚠️ **身份陷阱**：Web App「任何人」存取時 `Session.getActiveUser().getEmail()` 對匿名訪客通常係空白。骨架 `USER_ROLES` 只係示範；正式要行邀請 ticket／`sig` scope／中央登入驗票（[A4/A7](03-security.md)）。

完整骨架：[templates/canvas/](../templates/canvas/README.md)。

---

## C9 — Type C：保護 PROMPT 設定

| 做法 | 點解 |
|------|------|
| `SYSTEM_PROMPT` 放 `Code.gs` 常數／ScriptProperties，**唔好用 `<?= ?>` 注入 HTML** | scriptlet 輸出會落瀏覽器原始碼 |
| `gemini.ask` 由 `Code.gs` `UrlFetchApp` 代 call，`systemInstruction` 放 request body | key + prompt 都唔出 server |
| `api()` 回應**永遠唔回傳** `SYSTEM_PROMPT`／`GEMINI_API_KEY` | 有測試守 |
| Prompt 改動 = `PROMPT_v1.0.md` → `Code.gs` → `contract_v1.0.json` → 測試，四處同步 | F16 |
| `PROMPT_VERSION` 寫入每條 RECORDS | 追到「邊個 prompt 版本出邊張圖」 |
| 版號只係紀錄欄位／MD；code 唔寫 `// vX.X` 註解（改用 `APP_VERSION` 常數） | [V 系列](13-versioning.md) |

> 如果你係**喺 Gemini Canvas 入面**生 UI：Canvas 只收到「殼規格」，真正 system prompt 同紀錄規則寫喺 `Code.gs`，**唔好貼入 Canvas 對話**。

---

## C10 — Type C：使用紀錄（原圖／成品圖／操作）

```
RECORDS Sheet append-only：
  ts | actorHash | action | payloadHash | resultCode | promptVersion |
  originalHash | outputHash | watermarkPayload | bytes | prevHash | hash
```

- 只用 `appendRow()`；**client 無 update / delete 入口**。
- 失敗請求（AUTH_FAILED／BAD_INPUT）都要留低，否則暴力試嘢無得查。
- `payloadHash` = `sha256(正規化 payload)`；**唔存用戶原文／圖檔內容**。
- `hash = sha256(prevHash + 整行)` → 改任何一格斷鏈；每月驗鏈（[10-checklists §5](10-checklists.md)）。
- `record.list` 只回傳 metadata，唔回傳圖檔／個人資料。
- 保留 24 個月後 purge；圖檔 12 個月（A13/A12）。

對應測試：[brain.test.mjs](../templates/canvas/brain.test.mjs)（16 條）。

---

## C11 — Canvas 工作流程（詳細版見 17）

```
① 揀 A/B/C（C1）→ ② Git 寫好腦／codec → ③ Canvas 用 PROMPTS_v1.0.md 生殼
→ ④ 貼入交付檔 → ⑤ 部署 → ⑥ final_check 六角度實測
```

完整 STEP BY STEP（一般用戶版）：[docs/17 §2](17-final-check-and-tutorial.md#2--step-by-step由零到一個-app)。
**每次都要同 Canvas 講「只改 index.html；Code.gs／codec 唔准改、唔准將 prompt 寫入 HTML，資料靠 google.script.run.api()」** —— 否則重新生成會洗走腦。

---

## C12 — 遷移、Anti-patterns、驗收

### 遷移路徑
```
A → B：加 codec + 水印嵌入 + 解碼器 + 雙版號 + 版權頁尾
B → C：將 prompt／key／紀錄搬去 Code.gs + Sheet／Drive；HTML 淨低 UI
A → C：直接行 C12 五步（見 [PROMPTS_v1.0.md](../templates/canvas/PROMPTS_v1.0.md) ⑤）
```

### Anti-patterns
| Anti-pattern | 點改 |
|---|---|
| 將真 API key 貼入 Gemini 對話叫佢寫入 HTML | C13 唯一 `API_KEY` slot + 平台代理／server-side secret |
| 兩處 `const API_KEY = ""` 宣告 | C13：全檔只准一處，否則平台注入改錯位 |
| `?key=` 將 key 放 URL | C13-③/A1：BYOK 後備路徑改用 `x-goog-api-key` header |
| `<?= SYSTEM_PROMPT ?>` 注入 HTML | C9 放 server |
| `localStorage` 做唯一紀錄／原圖 | C7/C10 落 Sheet + Drive |
| 水印當加密／DRM／法律證據 | W4 講清限制 |
| `google.script.run.deleteAll()` 散裝 public function | C8 只有 `api()` + 白名單 |
| 改版只改內文唔改檔名（或相反） | [V1](13-versioning.md)：檔名＋內文同步 |
| 成品圖無 © SCOUT SYSTEM 可見標示 | W1 雙軌：可見頁尾 + 隱形水印 |

### 交付前 checklist
```
[ ] 類型寫明（A/B/C）＋ 對應模板用咗
[ ] 檔名 + 內文版號一致（meta / APP_VERSION / title / 頁尾 / 註解）→ V1
[ ] 頁尾／中繼資料有 © SCOUT SYSTEM → W1
[ ] B/C：水印嵌入 + 解碼器實測讀到 v1 或 v2 → W2
[ ] B：C13 三軌自動注入（唯一 slot + 平台代理 + BYOK 後備）已實作；key 只落 header，唔落 ?key= → W6/A1
[ ] B：全檔唯一 API_KEY 宣告；localStorage 有 try/catch（Canvas sandbox）；單檔 ≤ 5MB（C13-g）
[ ] B：單一 HTML 跑 node scripts/audit_single_html_v1.0.mjs <檔名> 無 FAIL
[ ] C：index.html grep 唔到 prompt / key / fetch / localStorage 紀錄
[ ] C：RECORDS 有原圖 hash、成品圖 hash、watermarkPayload、使用紀錄
[ ] C：PROMPT 四處同步（PROMPT_v1.0.md / Code.gs / contract / 測試）
[ ] node --test templates/watermark/watermark.test.mjs（全綠，含真實 app legacy embed 互通）
[ ] node --test templates/canvas/brain.test.mjs（全綠）
[ ] node scripts/guard.mjs 綠
```

---

## C13 — 單一 HTML 體積同自動注入（2026-10-27 定案）

> 來源：用戶實戰 [16 — 童軍漫畫生成器 v4.2.1](16-canvas-case-scout-comic.md)。
> **用戶定案**：佢個自動注入**已經實作、真係用到，呢個就係正確做法**；
> 單一 HTML **唔經 Vercel、唔強制瘦身，上限 5MB**；越輕量 LOAD 越快。
> 詳細機制：[14 §1.1](14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)。

| ID | 規則 |
|----|------|
| **C13-①** | 全檔唯一 `const API_KEY = ""` = **平台注入 slot**（唔係「只係 BYOK slot」）；重複宣告會令注入改錯位 |
| **C13-②** | `fetch(..., { credentials:'include' })` + 冇 key 時唔加 `?key=` = **平台請求代理加認證** |
| **C13-③** | 本機／BYOK 後備 = 用戶自己入 key；`localStorage` 要 try/catch（`safeStore`） |
| **C13-a** | 全端 app（有 server route）先至用 `GEMINI_API_KEY` server-side env — 同單一 HTML 係兩類 |
| **C13-d** | ③ 嘅 key 用 `x-goog-api-key` header，唔好 `?key=`（A1/W6，只係加固，唔否定 ①②） |
| **C13-e** | 離開 Canvas（ZIP／self-host／分享）就冇 ② 代理 → 靠 ③ BYOK 或轉 server-side／零 key 路徑 |
| **C13-f** | 每個單一 HTML 交付前跑 `node scripts/audit_single_html_v1.0.mjs <檔名>`；FAIL 即 No-Go |
| **C13-g** | **單一 HTML / Gemini Canvas app 唔經 Vercel、唔強制瘦身**；S7／S10／S6 唔適用；唯一硬上限 **5MB**（用戶實測保守值；社群有講 app 檔案總量 10MB）。最長一行／inline base64／CDN 只做 INFO；**越輕量 LOAD 越快**（可選優化） |

**審計器會驗**：5MB 上限（C13-g）、真 key、`?key=`、重複 key 宣告、`credentials` 代理、BYOK 來源、
全域變數掃 key、`localStorage` try/catch、W1 版權 meta、W2 水印 payload、
V1 檔名＋內文雙版號（連靜態 fallback）、C9 PROMPT 暴露、C10 紀錄缺失。
體積相關（最長一行、inline 圖、CDN）只做 **INFO**，唔判 FAIL。

**真實案例結果**：`童軍漫畫生成器 v4.2.1`（2.04MB ≤ 5MB ✅）→ **5 FAIL / 3 WARN**：
V1 三處版號唔一致、`?key=`、無版權／版號 meta；warn 係全域掃 key／v1 水印／PROMPT 公開。
佢個 C13 三軌注入 **PASS**。升級路線見 [16 §5](16-canvas-case-scout-comic.md#5--升級路線由-v421-去-v430)。

---

## 13. 可抄嘅骨架

| 類型 | 檔 |
|------|-----|
| A | [templates/canvas/shell_v1.0.html](../templates/canvas/shell_v1.0.html)（簡化當單檔工具都得） |
| B | [templates/watermark/](../templates/watermark/README.md) — codec / decoder / generator / key injector |
| C | [templates/canvas/](../templates/canvas/README.md) — `brain_v1.0.gs` + `shell_v1.0.html` + contract + PROMPT + RECORDS + 測試 |
| 通用 | [12-copyright-scout-system.md](12-copyright-scout-system.md) · [13-versioning.md](13-versioning.md) · [14-api-key-injection.md](14-api-key-injection.md) |
