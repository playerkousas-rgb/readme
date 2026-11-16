# 50 — 關站與 App Store 白名單入口 SG1–SG6（經 website 進入・不適合白名單處理）

> **2026-11-15 用戶定案**：「未來有機會會關站，或某些程式必須經指定入口（如 APP STORE `website` 或通告圖書館 `scout-circulars`）進入；要把這在開 APP 時告知有白名單，以及那些 APP 不適合白名單如何處理。」
> **層級**：按需啟用嘅入口管制規則（預設 `open` 公開直連，唔強制鎖站；現有 repo 唔自動追溯）。支援**單一入口**或**多個指定入口並存**（例如同時容許由 **SCOUT APP STORE** 或 **通告圖書館** 進入，其餘直連一律攔截）。一旦開新 App 時揀咗白名單或日後要關站，必須按 **SG1–SG7** 處理，避免撞入 Safari 儲存隔離、PWA 主畫面踢人、`SameSite=Lax` Cookie 全滅、通告圖書館 `noreferrer` 清空 `Referer` 同 `308` 永久快取五大陷阱。
> **官方四大準入白名單入口（2026-11-15 用戶定案・真理倉唯一登記處）**：**1. APP STORE** · **2. 圖書館** · **3. 成員系統** · **4. 區管理系統**。四個入口嘅 repo、pinned commit、Origin、現時連結行為同 `<iframe>` 殼狀況全部實查列於 [§0.1](#01-官方四大準入白名單入口註冊表canonical-portal-registry)；程式碼層面嘅同一份表係 [`store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js) 嘅 `PORTAL_REGISTRY`（子 App 只需寫 `portalIds: ['appstore','library','member','district']`）。日後加／改名／改網址，**只改呢兩處**。

---

## 0. 現況核實：指定入口真實結構（`website` ＋ `scout-circulars`）

未寫規則前先讀母站源碼，確認今日實際行為（唔靠估）：

| 檢查點 | `website`（`041f074`）同 `scout-circulars`（`8808cd17`）實際源碼 | 對多入口白名單設計嘅直接影響 |
|---|---|---|
| **公開網址（Origin）** | ① `website` [`index.html` L23](https://github.com/playerkousas-rgb/website/blob/041f0742dbabeffa3405b5c0b208f4935f1a215c/index.html#L23)：`https://scoutappstore.vercel.app`<br>② `scout-circulars` [`notify.py` `DEFAULT_SITE_URL`](https://github.com/playerkousas-rgb/scout-circulars/blob/8808cd1708981df61d9191e80282d8e58a840b89/notify.py)：`https://scout-circulars.vercel.app` | 多入口白名單可同時放入呢兩個 Origin（或按個別 App 增減，例如旅團門戶），任一指定入口撳入都放行 |
| **撳「開啟／進入系統」做乜** | ① `website` [`app.js` L50–53](https://github.com/playerkousas-rgb/website/blob/041f0742dbabeffa3405b5c0b208f4935f1a215c/app.js#L50-L53)：`window.location.href = app.url`<br>② `scout-circulars` [`index.html` L5662](https://github.com/playerkousas-rgb/scout-circulars/blob/8808cd1708981df61d9191e80282d8e58a840b89/index.html#L5662)：`<a target="_blank" ...>進入系統 ↗</a>` | **兩個母站現時都係頂層導覽／開新分頁，未有 `<iframe>` 檢視器**。因此想規定「必須經圖書館或 App Store 入」，**現階段用頂層跳板 `entry-gate` 最順**；`iframe-only` 須等母站加 `<iframe>` 殼先開得 |
| **⚠️ 通告圖書館 `noreferrer` 陷阱（必睇）** | `website` 無設 `noreferrer`，預設送出 `Referer: https://scoutappstore.vercel.app/`；**但 `scout-circulars` [`index.html` L5662](https://github.com/playerkousas-rgb/scout-circulars/blob/8808cd1708981df61d9191e80282d8e58a840b89/index.html#L5662) 寫咗 `rel="noopener noreferrer"`**！ | `noreferrer` 會強制令瀏覽器**清空 `document.referrer` 為 `""`**！若唔改呢行，就算子 App 白名單加咗 `https://scout-circulars.vercel.app`，由圖書館撳「進入系統 ↗」仍會因無 `Referer` 被誤擋。<br>**一行修復**：喺 `scout-circulars/index.html` L5662 將小工具（`isTool`）嘅 `rel` 改為 `${isTool ? 'noopener' : 'noopener noreferrer'}`（保留 `noopener` 防新分頁反控母頁，同時讓瀏覽器按預設 `strict-origin-when-cross-origin` 送出純網域 `Referer: https://scout-circulars.vercel.app/`，唔洩漏路徑） |
| **分享按鈕行為** | `website` [`app.js` L747–764](https://github.com/playerkousas-rgb/website/blob/041f0742dbabeffa3405b5c0b208f4935f1a215c/app.js#L747-L764) 同 `scout-circulars` `shareUrlFor(item)` 直接分享子站 URL | 若某個子站開啟白名單限制，分享連結應指回母站入口（否則朋友撳 WhatsApp 條子站 link 會見到白名單提示卡，需再撳一次掣入母站） |
| **Vercel 連接器權限** | 本輪實測 `vercel` connector `list_projects` 回報 `Access denied`（token 未授權 projects 讀寫範圍） | Pause／Resume Project 現階段喺 Vercel Dashboard 手動撳最快；日後重新授權 token 先可由 Agent 代撳 |

---

## 0.1 官方四大準入白名單入口註冊表（Canonical Portal Registry）

> **用戶 2026-11-15 定案原文**：「我未來會有準入白名單，會標記在你這，因為你這是真理倉，所有 APP 都會看的 —— 1. APP STORE／2. 圖書館／3. 成員系統／4. 區管理系統。」
> 以下四行就係**唯一權威名單**。子 App 唔可以自己另外寫死一堆網址；一律用 `portalIds` 引用呢個表（或喺 `portals` 補自訂入口，官方四個照樣以 id 引用）。

| # | 入口（名稱） | Repo | Pinned commit（實查） | Origin（公開網址） | 現時撳入行為 | `<iframe>` 殼 | `noreferrer` 要改嘅位 |
|:--:|---|---|---|---|---|---|---|
| **1** | **APP STORE** | [`playerkousas-rgb/website`](https://github.com/playerkousas-rgb/website) | [`041f0742`](https://github.com/playerkousas-rgb/website/commit/041f0742dbabeffa3405b5c0b208f4935f1a215c)（2026-11-13） | `https://scoutappstore.vercel.app` | 頂層 `window.location.href = app.url`（[`app.js` L50–53](https://github.com/playerkousas-rgb/website/blob/041f0742dbabeffa3405b5c0b208f4935f1a215c/app.js#L50-L53)） | ❌ 未有（頂層跳轉） | ✅ 無（本身送出 `Referer`） |
| **2** | **圖書館**（通告圖書館 v5.11） | [`playerkousas-rgb/scout-circulars`](https://github.com/playerkousas-rgb/scout-circulars) | [`8808cd17`](https://github.com/playerkousas-rgb/scout-circulars/commit/8808cd1708981df61d9191e80282d8e58a840b89)（2026-11-16） | `https://scout-circulars.vercel.app` | `<a target="_blank" rel="noopener noreferrer">`（[`index.html` L5662](https://github.com/playerkousas-rgb/scout-circulars/blob/8808cd1708981df61d9191e80282d8e58a840b89/index.html#L5662)） | ❌ 未有（新分頁） | ⚠️ **要改**：`isTool` 分支改 `rel="noopener"` |
| **3** | **成員系統**（公開服務平台） | [`playerkousas-rgb/member-portal`](https://github.com/playerkousas-rgb/member-portal) | [`de879a49`](https://github.com/playerkousas-rgb/member-portal/commit/de879a495a3a12d15129fa8e101179a7c07be6e7)（2026-11-15） | `https://member-portal-sigma-swart.vercel.app` | `/books` 用 `<iframe>` 嵌 4 個 `BOOK`；另有 `<a target="_blank" rel="noopener noreferrer">開啟原網站 ↗</a>`（`components/BookSelector.tsx` L88） | ✅ 有（`/books`，`allow="camera; fullscreen"`）＋ 自身被 `https://www.skwscout.org.hk` 以 `frame-ancestors` 嵌入 | ⚠️ **要改**：`BookSelector.tsx` L88 改 `rel="noopener"` |
| **4** | **區管理系統**（童軍區管理平台） | [`playerkousas-rgb/scout-district-portal`](https://github.com/playerkousas-rgb/scout-district-portal) | [`70809bbc`](https://github.com/playerkousas-rgb/scout-district-portal/commit/70809bbc45a9f203c8279d5c105cb313de619fbd)（2026-11-15） | `https://scout-district-portal.vercel.app` | `/embed` 用 `<iframe>` 嵌工具（`?role=…&from=portal&embed=1&d=…`）；另有「↗ 在新分頁開啟」（`app/embed/page.tsx` L45）同 `/links`（`app/links/page.tsx` L138） | ✅ 有（`/embed`，`allow="clipboard-write"`） | ⚠️ **要改**：`embed/page.tsx` L45 同 `links/page.tsx` L138 改 `rel="noopener"` |

**點用（子 App 側，一行搞掂）**：

```js
initStoreGate({
  appKey: 'scoutbook',
  mode: 'entry-gate',
  portalIds: ['appstore', 'library', 'member', 'district'], // 官方四大入口；可只揀子集
  allowStandalone: true,
});
// 想加旅團門戶等自訂入口：portals: [{...自訂...}] 同 portalIds 可同時寫，兩者會合併（同一 Origin 唔會重複）；
// 結果順序 = 先列自訂入口，再接官方未重複嘅入口
```

**註冊表三個硬約定**：

1. **只認 Origin**：`PORTAL_REGISTRY` 每個入口只登記 `https://host`（無尾斜線、無路徑、無 query）。子站比對一律用 `new URL(referrer).origin` 精確等同（防 `https://scoutappstore.vercel.app.evil.com` 前綴偽造，A9）。
2. **順序＝1/2/3/4**：`portalsFromIds()` 會按 `order` 排序，攔截卡第一粒掣永遠係 APP STORE，符合「主入口」慣性；用家仍可揀其餘三個。
3. **登記 ≠ 已通**：`member-portal` 自身被 `www.skwscout.org.hk` 嵌入、`/books` 同 `/embed` 已經有 `<iframe>` 殼，但**末端連結仲帶 `noreferrer`**；未按 §4.4 改之前，由第 2／3／4 號入口撳入嘅子 App 會因空 `Referer` 被 `entry-gate` 擋。註冊表如實反映呢個狀態，唔會假裝已通。

---

## 1. 規則總表 SG1–SG7（Store Gate）

| ID | 規則 | 硬要求 / 一句驗收 |
|---|---|---|
| **SG1** | **開新 APP 時主動告知白名單與關站選項** | AGENT 行 [`INTAKE.md`](../templates/repo-starter/INTAKE.md) 第 0 步（Q8）時，**必須主動告知用戶**本生態設有**四大官方準入白名單入口**（[§0.1](#01-官方四大準入白名單入口註冊表canonical-portal-registry)：1. APP STORE／2. 圖書館／3. 成員系統／4. 區管理系統）及暫時關站機制，列出四種模式（`open`／`entry-gate`／`iframe-only`／`closed`）俾用戶揀，結果寫入 `SCOPE.md`；未指定預設 `open` |
| **SG2** | **`<iframe>` 白名單五類禁區自動轉軌** | `*.vercel.app` 列於 Public Suffix List，兩個 `*.vercel.app` 之間屬 **Cross-Site（跨站）**。凡中下面 §3 五類任何一項（本機長期儲存／PWA 主畫面／Web Push／登入 Cookie／硬體權限），**嚴禁用 `iframe-only`**；AGENT 必須主動提醒並改用頂層跳板 `entry-gate` 或維持 `open` |
| **SG3** | **用家開 APP 被攔時必須清晰告知有白名單／關站** | 禁止無聲黑屏或無解釋閃走。前端掛 [`templates/vercel/store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js)：攔截時隱藏底層內容（`display: none !important`），彈出無障礙對話框明確告知「此程式需經 SCOUT APP STORE 開啟（白名單保護）」或「此網站目前暫時關閉」，並附上 `target="_top"` 前往主站按鈕 |
| **SG4** | **純 `<iframe>` 白名單雙層配置＋禁留 `SAMEORIGIN`** | 只限純無狀態小工具／圖卡／簡報，且**必須等母站 `website` 實作 `<iframe>` 檢視器後先可啟用**。用 [`templates/vercel/vercel.iframe-whitelist.json`](../templates/vercel/vercel.iframe-whitelist.json) 設 `CSP: frame-ancestors https://scoutappstore.vercel.app;`（**必須移除 `X-Frame-Options: SAMEORIGIN`**，否則自相矛盾擋死母站）＋ `<head>` 掛 `store_gate_v1.0.js`（`mode: 'iframe-only'`） |
| **SG5** | **不適合 `<iframe>` 嘅 App 改用頂層跳板 `entry-gate`** | App 保持**頂層獨立網域**執行（100% 保住 Safari `localStorage`、PWA、Push、`SameSite=Lax` Cookie）。輕量級用 `store_gate_v1.0.js`（`mode: 'entry-gate'`）：以 `new URL(referrer).origin` 嚴格比對白名單 Set（防 `.evil.com` 前綴偽造）＋ `sessionStorage`（`try/catch`）保同分頁重整 ＋ `allowStandalone: true` 放行已裝主畫面 PWA；嚴格級再加 `/api/enter` 60 秒 HMAC `sig` 驗票寫 `HttpOnly` Cookie |
| **SG6** | **暫時關站分硬關站（Pause）與軟關站（告示頁）** | 硬關站：Vercel Dashboard → `Settings → General → Pause Project`（連 `/api` 即停、零額度，但出英文預設頁）；軟關站：`store_gate_v1.0.js` 設 `mode: 'closed'` 出中文維護卡，或 `vercel.json` `redirects` 設 **`"permanent": false`（302，嚴禁 `true`/308 永久快取）** 導回 `scoutappstore.vercel.app` |
| **SG7** | **「加入主畫面」只准由指定入口第一次進入** | 直開網址嘅用家**唔會** 404（`store_gate_v1.0.js` 會出白名單卡），但**唔准教用家直接開網址然後「加入主畫面」**：① 在入口母站（例如 APP STORE）「加入主畫面」會裝到**母站**而唔係個 App；② 真 404／未部署路徑根本冇 `manifest`，瀏覽器唔會提供「加入主畫面」；③ 已退役 app 嘅舊主畫面圖示撳落去只會白屏／「找不到網頁」。標準話術一律係「**先由入口進入 → 再按瀏覽器選單加入主畫面**」，並靠 `allowStandalone: true` 令裝好之後撳 icon 直開 |

---

## 2. 四種入口／關站模式點揀（決策表）

| 模式 | 點運作 | Function 額度 | 適合邊種 App | 用家直打 `xxx.vercel.app` 見到乜 |
|---|---|:--:|---|---|
| **`open`（預設）** | 獨立網址直開＋可上架 `website` | 零 | 公開系統、通告、需廣泛分享連結嘅工具 | 正常進入 App |
| **`entry-gate`（頂層跳板白名單）** | **唔用 `<iframe>`**；由 `website` 頂層跳過去，驗 `Referer` origin（或短期 `sig` 票據）＋ `sessionStorage` ＋ 放行主畫面 `standalone` PWA | 輕量級：零<br>嚴格級：每次入場 1 次 `/api` | **所有唔適合 `<iframe>` 但又想規定由 `website` 進入嘅 App**（紀錄冊、PWA、BYOK 工具、相機／GPS 工具） | 顯示白名單提示卡：「此程式需經 SCOUT APP STORE 開啟」＋ 一鍵前往主站掣 |
| **`iframe-only`（純 `<iframe>` 白名單）** | `CSP frame-ancestors` 鎖死只准 `website` 嵌入 ＋ 攔截頂層直入（**須先等 `website` 加 `<iframe>` 殼**） | 零 | 純無狀態計算機、對照表、學習圖卡、PPT 簡報、唔存分單局小遊戲 | Edge `302` 彈去主站，或由 `store_gate_v1.0.js` 顯示白名單提示卡＋前往主站掣 |
| **`closed`（暫時關站）** | ① Vercel `Pause Project`（硬關）<br>② `store_gate_v1.0.js` `mode: 'closed'` 或 `302` 轉址（軟關） | 零 | 換季停用、改版維護、已退役併入主站嘅舊項目 | 硬關：Vercel 英文暫停頁<br>軟關：中文「此網站目前暫時關閉」＋ 前往主站掣 |

---

## 3. 邊啲 APP 唔適合 `<iframe>` 白名單？點樣逐類處理

> **核心技術原因**：`vercel.app` 喺瀏覽器 **Public Suffix List（PSL）** 入面，所以 `scoutappstore.vercel.app` 嵌 `xxx.vercel.app` 喺 Chrome／Safari／Firefox 眼中全部屬於 **Cross-Site（跨站第三方內容）**，同嵌外人網站受同一套嚴格隔離限制。

| # | 不適合 `<iframe>` 嘅類型 | 本帳戶真實例子（對照 [28](28-repo-taxonomy.md)） | 硬塞入 `<iframe>` 會壞乜 | 正確處理方法（SG2 / SG5） |
|:--:|---|---|---|---|
| **1** | **靠 `localStorage`／`IndexedDB` 跨日存資料嘅 App** | `SCOUTBOOK`、`CUBSBOOK`、`ROVERBOOK`、`VSBOOK`、`minigame` | iOS Safari 跨站儲存分區隔離（同直開網址嘅舊紀錄唔互通），且 ITP 有機會隔 7 日清走資料 | **改用 `entry-gate`（`allowStandalone: true`）**：由 `website` 頂層跳入，資料存喺子站自己一等網域，永久唔隔離 |
| **2** | **有 PWA「加入主畫面」（[46](46-pwa-install-and-update.md) I1–I8）嘅 App** | 4 個 `BOOK`、`minigame`、`morse-beacon-app` | `<iframe>` 內唔會觸發 Android `beforeinstallprompt`；iOS 撳「加入主畫面」只會裝咗母站；**更致命係已裝上主畫面嘅用家撳 icon 開 App 屬於 `Sec-Fetch-Dest: document` 頂層開啟，`iframe-only` 會將已裝用家踢走！** | **改用 `entry-gate` 並開 `allowStandalone: true`**（預設已開）：未裝時由 `website` 進入並可正常裝上主畫面；裝好後由主畫面 icon 直開自動放行 |
| **3** | **有 Web Push 推播通知（[08](08-supabase.md) U9）嘅 App** | `scout-circulars` | 跨站 `<iframe>` 唔支援獨立 Web Push 權限請求與 Service Worker 推播訂閱 | **維持 `open` 公開直連**（推播通知撳入嚟本身無母站 `Referer`）；若真要加閘，推播連結要帶專屬深層參數或只鎖部分頁面，**絕不入 `<iframe>`** |
| **4** | **有帳號登入 Session Cookie（[03](03-security.md) A4 `SameSite=Lax`）或 GAS 上下游接駁嘅系統** | `member-portal`、`scout-district-portal`、`vs_portal`、`cubsbadge`、`scoutbadge`、`vsbadge`、`roverbadge` | 跨站 `<iframe>` 請求**完全唔會帶 `SameSite=Lax` Cookie**，登入完一打 `/api/proxy` 即刻 401；若強改 `SameSite=None` 亦會被 Safari ITP「阻擋跨網站追蹤」預設擋死 | 系統本身已有登入閘／上游 `ALLOW_LOCAL_LOGIN`（[19](19-ecportal-troop-case.md)）；如需限由 `website` 進入，**只可用頂層 `entry-gate`（建議配 §4.3 嚴格級 `/api/enter` HMAC 驗票）** |
| **5** | **用 C13 BYOK 自備 API Key 或相機／GPS／Wake Lock／Web Share 嘅工具** | `DRAWSCOUT`、`Infographic`、`oneclick-photo`、`AvianDex`、`HKMAP`、`morse-beacon-app` | ① `C13` `safeStore` 將領袖條 Gemini Key 存 `localStorage`，入 `<iframe>` 會同直開分家兼易被清；② 相機／定位／螢幕常亮／系統分享喺 `<iframe>` 預設被 Permissions Policy 封鎖 | **優先用頂層 `entry-gate`**；若純無儲存但要用相機／GPS 且堅持入 `<iframe>`，母站 `<iframe allow="camera; geolocation; clipboard-write; web-share">` 同子站 `Permissions-Policy` 兩邊都要顯式放行母站 origin |

### 3.1 `<iframe>` 白名單到底係咩一回事（機制／限制／邊個用得）

**一句話**：`<iframe>` 白名單 = 母站（APP STORE／圖書館／成員系統／區管理系統）喺自己頁面開一個「視窗」，把子 App 嘅網址載入去；子 App 用 HTTP header 講明「我只准被邊幾個網域嵌入」。用家**由頭到尾都留喺母站網址**，只係中間個框換咗做子 App。

| 層面 | 實際發生咩事 | 對子 App 嘅硬影響 |
|---|---|---|
| **① 准入（准唔准嵌）** | 子 App 回應 header `Content-Security-Policy: frame-ancestors https://scoutappstore.vercel.app;`（多個用**空格**分隔）。無呢個 header 時，Vercel 預設 `X-Frame-Options: SAMEORIGIN` 會直接封死——所以兩者唔可以並存 | 純靜態頁／`vercel.json` 改一行就搞完；**唔會**影響子 App 自己嘅資料 |
| **② 瀏覽器眼中「係咪同一個網站」** | `vercel.app` 喺 **Public Suffix List（PSL）**，所以 `scoutappstore.vercel.app` 同 `scoutbook-five.vercel.app` 屬**唔同 Site**（Cross-Site／第三方內容），同嵌一個外人網站受同一套限制 | 呢條係一切壞法嘅根：跨站 = 儲存分區、Cookie 唔送、權限要另外批 |
| **③ 儲存（`localStorage` / `IndexedDB` / Cookie）** | 現代瀏覽器按 `(頂層 Site, 內嵌 Origin)` **分區（storage partitioning）**。同一個 `SCOUTBOOK` 喺 APP STORE 個框、喺成員系統個框、同直接開網址，係**三個唔相通嘅倉**；Safari ITP 仲會對跨站內嵌儲存加限制／清走 | **靠本機儲存嘅 App 一入 `<iframe>` 就「開唔返舊資料」**（見 §3.2） |
| **④ Cookie（`SameSite=Lax`）** | 跨站 `<iframe>` 內嘅請求**完全唔會帶** `SameSite=Lax` Cookie；就算改 `SameSite=None` 亦要有 `Secure`，Safari ITP 仍會擋第三方 Cookie | 有登入系統嘅 App（成員系統、區管理系統、各 badge 系統）一嵌就 401 |
| **⑤ PWA「加入主畫面」** | `<iframe>` 內唔會觸發 Android `beforeinstallprompt`；iOS「加入主畫面」只會裝到**母站**。更致命：已裝用家撳 icon 開 App 屬頂層 `document` 導覽，`iframe-only` 會把佢踢走 | 有 PWA 嘅 App 一律唔可以用 `iframe-only`（§3.3） |
| **⑥ 權限（相機／GPS／剪貼板／Push）** | 內嵌頁要攞硬體權限，預設被 `Permissions Policy` 封；母站 `<iframe allow="…">` 同子站 header 兩邊都要放行先得。Web Push / Service Worker 訂閱喺第三方框內基本無得做 | BYOK／相機／GPS／Push 類工具唔適合入框 |
| **⑦ 導覽／UX** | 子 App 內 `target="_top"` 會搶走成個母站；`window.open` 彈窗被攔；`history`／上一頁行為怪；母站 reload 就成個框重置；手機細螢幕變「框中框」 | 深度多頁系統體驗差，唔適合做主系統入口 |
| **⑧ 雙重嵌入（nested iframe）** | `CSP frame-ancestors` 檢查嘅係**成條祖先鏈**，唔止上一層。現時 `www.skwscout.org.hk` → `member-portal`（已設 `frame-ancestors` 放行）→ 若再嵌子 App，子 App 嘅 `frame-ancestors` 要**同時**列 `member-portal` 同 `skwscout.org.hk`，否則空白 | 想做「官網 → 成員系統 → BOOK」三層，等於三處 header 都要對齊，維護成本倍增 |

**邊個用得 `iframe-only`（四條全中先得）**：① 完全無長期本機儲存（或只用 `sessionStorage` 單局）② 無 PWA 加入主畫面 ③ 無 Web Push／登入 Cookie ④ 唔需要相機／GPS／剪貼板／系統分享。答中＝純無狀態計算機、對照表、學習圖卡、簡報、單局小遊戲。**其餘一律用 §3.2 嘅頂層 `entry-gate`。**

### 3.2 靠本機儲存嘅 `BOOK` 系列：經指定頁進入有冇影響？

**先講結論：經「指定入口」進入本身零影響；真正有影響嘅係「用 `<iframe>` 定頂層跳轉」。**

| 進入方式 | `localStorage`／`IndexedDB` 落喺邊 | 對 `SCOUTBOOK`／`CUBSBOOK`／`ROVERBOOK`／`VSBOOK` 嘅後果 |
|---|---|---|
| **頂層跳板 `entry-gate`**（推薦・SG5） | 子站自己一等網域，`https://scoutbook-five.vercel.app` 嘅正常倉 | ✅ **完全無影響**。由 APP STORE 今日入、圖書館明日入、成員系統後日入，甚至直接開網址，讀寫都係**同一個倉**；舊有成員紀錄、考章進度 100% 保留 |
| **`iframe-only`**（禁區） | `(頂層 Site, scoutbook-five.vercel.app)` 每個母站一個獨立分區 | ❌ **資料分家／睇唔返**。喺 APP STORE 個框入嘅紀錄，去成員系統個框或者直開網址都見唔到；Safari ITP 仲有機會清走跨站內嵌儲存。呢個正正係 [`member-portal/components/BookSelector.tsx` L78–80](https://github.com/playerkousas-rgb/member-portal/blob/de879a495a3a12d15129fa8e101179a7c07be6e7/components/BookSelector.tsx#L78-L80) 已經要出警告嘅原因 |
| **`open` 公開直連** | 同上，一等網域正常倉 | ✅ 無影響，但等於冇白名單 |

**點解經咩入口都唔會影響（技術原因）**：`localStorage` 嘅 key 係「**子站自己嘅 origin**」，唔關 Referer、唔關邊個入口、唔關 user agent 事。白名單閘門只係決定「准唔准入場」，入到場之後瀏覽器照樣用 `scoutbook-five.vercel.app` 呢個一等倉。**只有 `iframe` 會改變頂層 Site，令儲存被分區。**

**要留意嘅三個誠實邊界**（同 `iframe` 無關，係白名單機制本身嘅限制）：

1. **`noreferrer` 會令 `entry-gate` 誤擋**：圖書館 `/ index.html` L5662、成員系統 `BookSelector.tsx` L88、區管理系統 `embed/page.tsx` L45 同 `links/page.tsx` L138 現時寫 `rel="noopener noreferrer"`。`noreferrer` 會清空 `document.referrer`，輕量級 `entry-gate` 會當成「無入口」而擋。**修法**：改成 `rel="noopener"`（保留安全性，按預設 `strict-origin-when-cross-origin` 只送網域層 `Referer`，唔洩漏路徑）。
2. **App 內置 WebView 有獨立沙盒**：用家喺 **WhatsApp／Instagram／Facebook 內置瀏覽器**開入口再跳入 `BOOK`，該 WebView 嘅儲存同系統 Safari／Chrome 分開，出到去 Safari 開又係另一份。呢個係 App 本身行為，唔係白名單造成，但會令用家覺得「紀錄唔見咗」。**對策**：`BOOK` 本身有 JSON 匯出／QR 備份還原，並喺切換環境時提示用家匯出。
3. **清除瀏覽資料／無痕模式**：無痕視窗關閉即清；用家清 Safari 網站資料亦會清。白名單唔會加重呢個風險，但白名單也救唔到——所以 `BOOK` 要繼續保留備份／還原。

### 3.3 「加入主畫面」（PWA standalone）之後又點？

**兩條線要分開講：閘門會點判、儲存會去邊。**

**A. 閘門側（`allowStandalone: true`，預設已開）**

1. 用家撳主畫面 icon 開 App 時屬**頂層 `document` 導覽**，`document.referrer` 通常係空，所以**冇入口 Referer 可以驗**。若無放行機制，`entry-gate` 會把**已裝用家**都擋住（自己友都踢走）。
2. `store_gate_v1.0.js` 檢查 `matchMedia('(display-mode: standalone)').matches` 或 `navigator.standalone === true`；中咗就直接放行（`reason: 'standalone-pwa'`），**0 秒入到，唔需要再經任何入口**。
3. 前提：`manifest.json` 要有 `"display": "standalone"`（4 個 `BOOK` 已實查全部有），否則主畫面開啟時 `display-mode` 仍然係 `browser`，就唔會觸發放行。用 `"display": "browser"` 或 `fullscreen` 嘅 App 要另外處理（可改判 `display-mode: fullscreen`／`minimal-ui`）。
4. **首次安裝流程不變**：未裝時照樣要由指定入口第一次進入，裝好之後先可以直開。

**B. 儲存側（Android 同 iOS 完全唔同，呢個係最多人踩嘅位）**

| 平台 | 主畫面 App 嘅 `localStorage`／`IndexedDB` | 對 `BOOK` 嘅實際後果 |
|---|---|---|
| **Android Chrome（WebAPK）** | 同 Chrome 分頁**共用同一個倉**（同 origin 同 profile） | ✅ 由入口入嘅紀錄、裝之前入嘅紀錄，撳 icon 開都見到，來回切換都一致 |
| **iOS / iPadOS Safari（WebClip）** | **獨立容器**：主畫面 Web App 有自己一套 `localStorage`／`IndexedDB`，同 Safari 分頁**唔相通** | ⚠️ Safari 分頁（經四大入口入）同主畫面 App（撳 icon 入）會見到**兩份唔同紀錄**。呢個係 iOS 平台設計，唔係白名單造成，但白名單會令用家更常經入口入 Safari、更明顯撞到 |
| **iOS 主畫面 App 之間** | 同一 origin 嘅同一個 WebClip 容器會保留；**刪除 icon = 清走該容器** | ⚠️ 提醒用家唔好亂刪 icon；換機／重裝要用 JSON／QR 備份還原 |

**實務做法（`BOOK` 類）**：① `mode: 'entry-gate'` ＋ `allowStandalone: true`，令入口同主畫面都得；② 保留並突顯「匯出 JSON／QR 備份」同「匯入還原」，喺「由 Safari 轉用主畫面」時提示用家搬一次；③ 唔可以用 `iframe-only`；④ 喺 `SCOPE.md` 寫明「iOS 主畫面與 Safari 儲存分家」已向用戶交代。

---

### 3.4 「全部 App 都經白名單」其實有影響；新用戶直點網址／404／加入主畫面又點？

**先修正一個危險誤解**：白名單**唔係**「對所有東西沒影響」。要分清兩件事：

| 問題 | 答案 |
|---|---|
| **對「App 內部資料」有冇影響？** | 只要用**頂層 `entry-gate`**（唔用 `iframe`）就**零影響**——`localStorage`、IndexedDB、PWA、Cookie 全部照舊（§3.2、§3.3） |
| **對「App 以外嘅所有嘢」有冇影響？** | **有，而且必須接受**：見下面清單，呢啲係白名單本身嘅代價，唔關 `iframe` 事 |

**白名單真實代價（用戶必須知，否則會覺得「壞咗」）**：

| 項目 | 會發生咩事 | 緩解 |
|---|---|---|
| **分享連結** | 朋友撳 WhatsApp 收到嘅 `xxx.vercel.app` 直連 → 見到白名單卡，要再撳一次掣入入口 | 分享連結一律指回四大入口（§4.4-6）；白名單卡要清楚（SG3） |
| **Google 搜尋／書籤／QR code／舊通告 PDF 內連結** | 同上，一律撞卡 | 預期行為；重要對外文件改貼入口網址 |
| **Web Push 深層連結** | 推播撳入屬頂層導覽、通常無 `Referer` → 會被 `entry-gate` 擋 | 有 Push 嘅 App（例如 `scout-circulars`）**維持 `open`**，或推播連結附一次性簽名票（§4.3） |
| **WhatsApp／IG／FB 內置瀏覽器** | 有自己沙盒；`Referer` 有機會被剝走，儲存同系統瀏覽器分家 | 提示用家「用 Safari／Chrome 開啟」；必要時用 §4.3 簽票 |
| **新用戶上手** | 多一步：要經入口先入到 | 入口頁寫清楚「第一次請由此進入」；白名單卡本身已係引導 |
| **iOS 主畫面 vs Safari** | 兩個容器，紀錄分家（§3.3-B） | `BOOK` 保留 JSON／QR 備份還原 |

**新用戶「直接點網址」嘅四種真實情境**：

| 情境 | 實際會見到 | 可唔可以「加入主畫面」 | 處理 |
|---|---|---|---|
| **① 網址存在・`entry-gate`**（最常見） | **唔會 404**。`store_gate_v1.0.js` 出白名單卡，列出四大入口按鈕＋（SG7）「想加入主畫面？請先由入口進入」提示 | 該頁仍然有 `manifest`，所以**技術上裝得到**，但裝出嚟**一樣受閘**（撳 icon 開一樣見白名單卡，除非 `allowStandalone` 已放行） | 用家照卡指示經入口入一次，之後可以正常加入主畫面 |
| **② 真 404**（路徑打錯／app 未部署／已刪除） | 平台（Vercel）預設 404 頁：**冇白名單卡、冇 `manifest`、冇閘門 script** | ❌ **完全冇得加入主畫面**（瀏覽器唔會提供呢個選項） | 唔需要處理；若想連 404 都友善，可加 `vercel.json` rewrite 去 404 引導頁（見下） |
| **③ 已退役／換咗網域嘅舊 app** | 舊網址 404 或舊部署 | ❌ 冇得裝；**舊主畫面圖示撳落去＝白屏（iOS）／「找不到網頁」（Android）** | 舊 icon 要用家自己刪；公告講明新入口，唔好留住舊 icon 誤導 |
| **④ 已經裝錯來源**（按 §3.3 教錯方法） | 在**入口母站**按「加入主畫面」→ icon 開出嚟係**母站**（唔係個 App）；在 `iframe` 內按 → 裝到母站 | 該 icon 存在但內容錯 | 刪 icon，改為「由入口入到 App 之後」再按加入主畫面 |

**標準引導話術（SG7，四個入口都應該照抄）**：

> 第一次使用：**請由 APP STORE／圖書館／成員系統／區管理系統進入**本程式 → 進入後按瀏覽器選單「加入主畫面」→ 之後就可以直接撳 icon 開啟（閣下嘅紀錄會保留）。

**想連 404 都唔會令用家迷路（可選）**：靜態 app 可以在 `vercel.json` 加 rewrite，把所有未知路徑導去 `index.html`，令「打錯路徑」都出白名單卡而唔係平台 404 頁；但記住 **`rewrite` 唔可以取代 `redirects` 嘅 `permanent: false` 規則（SG6）**，亦唔好攔 `/assets/*` 同 `/icons/*`。

**誠實邊界**：Vercel 平台層 404 頁**無法**注入我哋嘅提示卡（唔經我哋部署嘅檔案），只能靠上面 rewrite 或入口頁文案避免用家行到呢一步。

## 4. 實作範本與接線步驟

### 4.1 開 APP 時告知有白名單／關站（通用前端閘門 `store_gate_v1.0.js`，支援單一或多個指定入口）

抄 [`templates/vercel/store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js) 去子 App 根目錄（或 `public/`），喺 `index.html` 嘅 `<head>` 最頂掛入（零依賴，自動跟 `<html lang>`／`data-lang` 切換中英文文案，並支援**多個指定白名單入口**）：

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: 'scoutbook',                                  // 每個 app 獨立前綴，防 sessionStorage 撞 key
    mode: 'entry-gate',                                   // 'open' | 'entry-gate' | 'iframe-only' | 'closed'
    portalIds: ['appstore', 'library', 'member', 'district'], // 官方四大入口（§0.1 註冊表）；可只揀子集
    allowStandalone: true,                                // true = 已加入主畫面嘅 PWA 直開自動放行（I1/SG2）
    autoRedirectSeconds: 0                                // 0 = 停喺提示卡等用家睇清楚先撳；>0 = 倒數跳去第一個入口
  });
</script>
```

想加自訂入口（例如旅團門戶）就用 `portals`——同 `portalIds` **可以並存**，兩者會按 Origin 去重合併（先列自訂，再接官方未重複嘅入口）：

```js
initStoreGate({
  appKey: 'scoutbook',
  mode: 'entry-gate',
  portals: [
    { labelZh: '1. 前往 APP STORE', labelEn: '1. Go to APP STORE', url: 'https://scoutappstore.vercel.app/' },
    { labelZh: '前往第 21 旅門戶',  labelEn: 'Go to Troop 21 Portal',  url: 'https://troop21.vercel.app/' }
  ],
  allowStandalone: true
});
```

> 官方四大入口嘅**網址／標籤／排序只喺 `PORTAL_REGISTRY`（§0.1）維護**，子 App 只寫 id；日後入口改名或換網域，改真理倉一處即可，唔使逐個 App 追。

- **單一入口 vs 多入口自由切換**：想「只准經 App Store 入」就喺 `portals` 留第一個物件（或直接傳 `storeUrl: 'https://scoutappstore.vercel.app/'`）；想「必須經圖書館或 App Store 入」就放晒兩個入 `portals`——用家由其中**任何一個**指定入口撳入都自動放行，而直打網址時提示卡會自動改題為「此程式需經指定入口網站開啟」並**同時列出兩個入口按鈕**俾用家揀。
- **點解預設 `autoRedirectSeconds: 0`（唔即刻秒彈走）？** 用家撳舊書籤入嚟如果 0 秒閃走，完全唔會知發生咩事、仲以為條 link 壞咗；停低顯示清晰卡片告知有白名單保護 ＋ 列出指定入口按鈕，先真正做到「開 APP 時告知有白名單」。想要睇完自動跳去主入口可以設 `autoRedirectSeconds: 5`。
- **軟關站一鍵切換**：改 `mode: 'closed'` 即變成「此網站目前暫時關閉」維護頁（同樣列出 `portals` 入口按鈕），隨時改返 `'open'` 或 `'entry-gate'` 即開站。

### 4.2 純 `<iframe>` 白名單專用 `vercel.json`（只限適合 `<iframe>` 嘅小工具）

確認該工具**唔屬於 §3 五類禁區**，而且**指定母站已經支援 `<iframe>` 開啟**之後，用 [`templates/vercel/vercel.iframe-whitelist.json`](../templates/vercel/vercel.iframe-whitelist.json) 取代預設 `vercel.json`：

- **關鍵差異一（防自爆＋多入口語法）**：移走咗預設 `templates/vercel/vercel.json` 入面嘅 `"X-Frame-Options": "SAMEORIGIN"`，改用 `"Content-Security-Policy": "frame-ancestors https://scoutappstore.vercel.app;"`。若要同時允許 **App Store 同通告圖書館**嵌入，**多網域必須用空格隔開，千祈唔好用逗號 `,`**（寫逗號會令瀏覽器當成語法錯誤而全擋）：
  `"frame-ancestors https://scoutappstore.vercel.app https://scout-circulars.vercel.app;"`
- **關鍵差異二（防永久鎖死）**：`redirects` 一定寫 `"permanent": false`（HTTP `302`），**千祈唔好寫 `true`（HTTP `308`）**——否則日後你想解除白名單開放直連時，曾經開過網址嘅用家瀏覽器會死記住永久轉址開唔返。
- **想喺子站顯示中文白名單提示卡 vs Edge 直接彈返母站**：
  - 如果保留 `vercel.iframe-whitelist.json` 段 `redirects`（攔 `sec-fetch-dest: document`），瀏覽器喺 Edge 層已經 `302` 去 `https://scoutappstore.vercel.app/?from=whitelist`（建議母站見到 `?from=whitelist` 彈一句 toast 提示「已為你導回 SCOUT APP STORE」）；
  - 如果想用家直打子站網址時**親眼喺畫面見到「此程式需經指定入口網站開啟」提示卡（並可揀去 App Store 或通告圖書館）**，刪走 `vercel.json` 段 `redirects`，淨留 `CSP frame-ancestors` header ＋ `<head>` 嘅 `store_gate_v1.0.js`（`mode: 'iframe-only'` ＋ `portals`）即可。

### 4.3 嚴格級後端驗票（不適合 `<iframe>` 且有敏感內容／後端 `/api` 嘅 App）

如果個 App 有後端 `/api`、唔入得 `<iframe>`，同時要防人用 DevTools 改 `sessionStorage` 或 `curl` 偽造 `Referer`，用對齊 [PLAYBOOK A7](../PLAYBOOK.md)（詳見 [03-security](03-security.md)）嘅 **60 秒 HMAC 通行票據**（多入口同樣適用）：

1. **共享密鑰（[A1](03-security.md)）**：喺所有獲授權嘅指定入口（如 `website` 同 `scout-circulars`）以及子站各自嘅 Vercel Environment Variables 設同一條 `STORE_LAUNCH_SECRET`（或每個入口獨立一條 secret 方便單獨撤銷，只留 server，唔入前端）。
2. **指定入口簽票（`<portal>/api/launch`）**：用家喺 App Store 或通告圖書館撳開啟 → 打母站自己嘅 `/api/launch?app=<slug>` → server 用 `crypto.createHmac('sha256', STORE_LAUNCH_SECRET)` 簽 `launch|<portal>|<slug>|<ts>|<nonce>` → `302` 跳去 `https://<slug>.vercel.app/api/enter?portal=...&ts=...&nonce=...&sig=...`。
3. **子站驗票寫 Cookie（`<app>/api/enter.mjs`）**：用 `crypto.timingSafeEqual` 驗簽 ＋ 檢查 `|now - ts| <= 60s` → 通過後 `Set-Cookie: store_pass=<signed-session>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800` → `302` 去 `/`。
4. **效果**：子站全程喺**頂層獨立網域**行（Safari `localStorage`、PWA、`SameSite=Lax` 完全正常），而冇母站簽名票據嘅直連請求喺 `/api` 層已經被硬擋。

### 4.4 四大指定入口啟用白名單前嘅配合清單

當你準備正式鎖第一批子 App（例如規定必須經 §0.1 四大入口任一進入）時，先喺對應入口做齊呢幾點先好開子站閘門：

1. **`scout-circulars`（通告圖書館）必改一行（清走 `noreferrer`）**：若要將通告圖書館列入 `entry-gate` 白名單入口，先將 `scout-circulars/index.html` L5662 小工具按鈕嘅 `rel="noopener noreferrer"` 改為 `rel="${isTool ? 'noopener' : 'noopener noreferrer'}"`——保留 `noopener` 安全性，但容許送出 `Referer: https://scout-circulars.vercel.app/`，否則由圖書館撳入去會因為空 `Referer` 被子站擋住。
2. **`website` 項目資料加入口模式欄位**：例如 `accessMode: 'open' | 'entry-gate' | 'iframe'`；詳情 bottom sheet（`app.js`）對非 `open` 項目顯示提示標籤（例：「🔒 白名單項目 · 須經指定入口開啟」）。
3. **`iframe` 模式先起檢視器殼**：只有 `accessMode === 'iframe'` 先用全屏 `<iframe src="...">`（加返頂部返回列）；`open` 同 `entry-gate` 維持頂層開啟（唔加 `noreferrer`）。
4. **`member-portal`（成員系統）清走 `noreferrer`**：`components/BookSelector.tsx` L88 嘅「開啟原網站 ↗」改成 `rel="noopener"`，否則由成員系統撳入 `BOOK` 會無 `Referer` 被擋。
5. **`scout-district-portal`（區管理系統）清走 `noreferrer`**：`app/embed/page.tsx` L45「↗ 在新分頁開啟」同 `app/links/page.tsx` L138 兩處改成 `rel="noopener"`。另外 `/embed` 個 `<iframe>` 殼若要嵌有儲存嘅 App，記住 §3.2：**`iframe` 會令儲存分家**，寧願用 `/embed` 嘅「在新分頁開啟」走頂層。
6. **分享連結改指入口**：白名單項目嘅分享網址改指回四大入口之一（`https://scoutappstore.vercel.app/`、`https://scout-circulars.vercel.app/`、`https://member-portal-sigma-swart.vercel.app/`、`https://scout-district-portal.vercel.app/`），唔好直接將子站 `*.vercel.app` 獨立網址傳出去撞閘。

---

## 5. 安全邊界與誠實限制（對照 [47](47-readme-discipline.md)）

- **前端閘門係防誤傳／防一般直入，唔係加密邊界**：`store_gate_v1.0.js`（`Referer`＋`sessionStorage`＋DOM 遮罩）同純靜態 `vercel.json` `sec-fetch-dest` 足以擋晒一般用家直接打網址、舊書籤直入同外站偷嵌 `<iframe>`；但識開瀏覽器 DevTools 嘅人可以手動改 `sessionStorage` 或睇靜態 bundle，識用 `curl` 嘅人可以自訂 `Referer`／`Sec-Fetch-Dest` header。凡涉及個人資料（PDPO）、帳號權限或付費 API 額度，必須行 §4.3 後端驗票或 [VL1 `/api/proxy`](06-vercel.md#vl1--apiproxy-係唯一出入口)。
- **App 內置瀏覽器與嚴格私隱設定對 `Referer` 嘅影響**：如果用家喺極嚴格私隱瀏覽器或個別 In-App WebView 開母站，跨站跳轉有機會被剝走 `Referer` 令輕量級 `entry-gate` 誤攔；遇到呢類情況可改用 §4.3 `/api/enter` URL 簽名票據（唔依賴瀏覽器送 `Referer`）。
- **已驗證 vs 未做（誠實列明）**：
  - ✅ `templates/vercel/store_gate_v1.0.js` 四種模式、`F4` fail-closed、`new URL().origin` 防前綴偽造（如 `https://scoutappstore.vercel.app.evil.com`）、Safari 私隱模式 `sessionStorage` 拋錯兜底、`standalone` PWA 放行，以及 `PORTAL_REGISTRY` 四大入口註冊表（id／Origin／排序／未知 id 靜靜略過）同 `templates/vercel/vercel.iframe-whitelist.json` 結構，均已由 `scripts/store_gate.test.mjs` 單元測試自動守住（`node --test`）。
  - ⚠️ 本輪只喺真理倉 `readme` 建立規範、四大入口註冊表、第 0 步 `INTAKE.md` 問項同可抄範本；**未改動 `playerkousas-rgb/website`、`scout-circulars`、`member-portal`、`scout-district-portal` 或任何現有子 App**（四個入口仍然全部係 `open`／無閘），亦未喺 iPhone Safari／Android Chrome 真機實測跨站跳轉（日後首次落到真 App 時須按 [17 §4](17-final-check-and-tutorial.md#4--最終人手實測7-條機器代唔到) 真機跑一次）。
