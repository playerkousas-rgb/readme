# 50 — 關站與 App Store 白名單入口 SG1–SG6（經 website 進入・不適合白名單處理）

> **2026-11-15 用戶定案**：「未來有機會會關站，或某些程式必須經指定入口（如 APP STORE `website` 或通告圖書館 `scout-circulars`）進入；要把這在開 APP 時告知有白名單，以及那些 APP 不適合白名單如何處理。」
> **層級**：按需啟用嘅入口管制規則（預設 `open` 公開直連，唔強制鎖站；現有 repo 唔自動追溯）。支援**單一入口**或**多個指定入口並存**（例如同時容許由 **SCOUT APP STORE** 或 **通告圖書館** 進入，其餘直連一律攔截）。一旦開新 App 時揀咗白名單或日後要關站，必須按 **SG1–SG16** 處理，避免撞入 Safari 儲存隔離、PWA 主畫面踢人、`SameSite=Lax` Cookie 全滅、通告圖書館 `noreferrer` 清空 `Referer` 同 `308` 永久快取五大陷阱。
> **官方準入入口（2026-11-15 用戶定案・真理倉唯一登記處）**：**1. APP STORE** · **2. 圖書館** · **3. 成員系統** · **4. 區管理系統**（四者＝**Vercel 派發線**，我哋可以掛閘）＋ **5. GEMINI**（**Canvas 派發線**：同樣係整俾人用嘅入口，只係工具用 Canvas 寫、跑喺 Google 網域，**我哋管唔到閘但有自己完善統計**，見 [§3.9](#39-第五個門口-gemini同一條派發線只係canvas-類工具)）。四個入口嘅 repo、pinned commit、Origin、現時連結行為同 `<iframe>` 殼狀況全部實查列於 [§0.1](#01-官方四大準入白名單入口註冊表canonical-portal-registry)；程式碼層面嘅同一份表係 [`store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js) 嘅 `PORTAL_REGISTRY`（子 App 只需寫 `portalIds: ['appstore','library','member','district']`）。日後加／改名／改網址，**只改呢兩處**。

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

| # | 入口（名稱） | **方向（SG16）** | **角色（SG9）** | Repo | Pinned commit（實查） | Origin（公開網址） | 現時撳入行為 | `<iframe>` 殼 | `noreferrer` 要改嘅位 |
|:--:|---|---|---|---|---|---|---|---|---|
| **1** | **APP STORE** | **`main` 真正主站（全方位）＋統計基地**：唯一應該帶**分享連結／QR code**；已有 `apps.clicks／stars／hearts`（RPC `bump_clicks`／`bump_stars`／`bump_hearts`），後台睇得到逐個 App 點擊／收藏／Like | **派出去**（`outbound`） | [`playerkousas-rgb/website`](https://github.com/playerkousas-rgb/website) | [`041f0742`](https://github.com/playerkousas-rgb/website/commit/041f0742dbabeffa3405b5c0b208f4935f1a215c)（2026-11-13） | `https://scoutappstore.vercel.app` | 頂層 `window.location.href = app.url`（[`app.js` L50–53](https://github.com/playerkousas-rgb/website/blob/041f0742dbabeffa3405b5c0b208f4935f1a215c/app.js#L50-L53)） | ❌ 未有（頂層跳轉） | ✅ 無（本身送出 `Referer`） |
| **2** | **圖書館**（通告圖書館 v5.11） | **派出去**（`outbound`） | **`feed` 通告推送主場**（**唔帶分享連結**）：主要目的係**睇通告**＋**加入主畫面收 Push**；**現時冇點擊統計**，推廣 APP STORE 屬後期功能（2026-11-15 用戶說明） | [`playerkousas-rgb/scout-circulars`](https://github.com/playerkousas-rgb/scout-circulars) | [`8808cd17`](https://github.com/playerkousas-rgb/scout-circulars/commit/8808cd1708981df61d9191e80282d8e58a840b89)（2026-11-16） | `https://scout-circulars.vercel.app` | `<a target="_blank" rel="noopener noreferrer">`（[`index.html` L5662](https://github.com/playerkousas-rgb/scout-circulars/blob/8808cd1708981df61d9191e80282d8e58a840b89/index.html#L5662)） | ❌ 未有（新分頁） | ⚠️ **要改**：`isTool` 分支改 `rel="noopener"` |
| **3** | **成員系統**（公開服務平台） | **派出去**（`outbound`） | **`internal` 自家副系統入口**：自家出產系統由此直入（**唔帶分享連結**） | [`playerkousas-rgb/member-portal`](https://github.com/playerkousas-rgb/member-portal) | [`de879a49`](https://github.com/playerkousas-rgb/member-portal/commit/de879a495a3a12d15129fa8e101179a7c07be6e7)（2026-11-15） | `https://member-portal-sigma-swart.vercel.app` | `/books` 用 `<iframe>` 嵌 4 個 `BOOK`；另有 `<a target="_blank" rel="noopener noreferrer">開啟原網站 ↗</a>`（`components/BookSelector.tsx` L88） | ✅ 有（`/books`，`allow="camera; fullscreen"`）＋ 自身被 `https://www.skwscout.org.hk` 以 `frame-ancestors` 嵌入 | ⚠️ **要改**：`BookSelector.tsx` L88 改 `rel="noopener"` |
| **4** | **區管理系統**（童軍區管理平台） | **派出去**（`outbound`） | **`internal` 自家副系統入口**：自家出產系統由此直入（**唔帶分享連結**） | [`playerkousas-rgb/scout-district-portal`](https://github.com/playerkousas-rgb/scout-district-portal) | [`70809bbc`](https://github.com/playerkousas-rgb/scout-district-portal/commit/70809bbc45a9f203c8279d5c105cb313de619fbd)（2026-11-15） | `https://scout-district-portal.vercel.app` | `/embed` 用 `<iframe>` 嵌工具（`?role=…&from=portal&embed=1&d=…`）；另有「↗ 在新分頁開啟」（`app/embed/page.tsx` L45）同 `/links`（`app/links/page.tsx` L138） | ✅ 有（`/embed`，`allow="clipboard-write"`） | ⚠️ **要改**：`embed/page.tsx` L45 同 `links/page.tsx` L138 改 `rel="noopener"` |
| **5** | **GEMINI**（**Canvas 派發線**） | **派出去（Canvas 類）**（`canvas`） | **`canvas` 入口**：派發用 Canvas 寫嘅工具／App（單一 HTML、跑喺 Google 網域）。**同樣係整俾人用**，**Gemini 自己嗰邊有完善統計**；我哋改唔到 Google 嘅 header，所以**唔可以**做 `entry-gate` 放行來源（見 §3.9） | —（Google 網域；創作由真理倉 [09](09-gemini-canvas.md) C1–C13 規範） | — | `https://gemini.google.com` | 由 Gemini 派發／分享（唔經 Vercel） | ❌ 不適用（Google 控制） | ❌ 不適用 |

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
3. **入口唔等價（SG9）**：四個入口角色唔同——`main`（APP STORE）／`feed`（圖書館，每日引流）／`internal`（成員系統、區管理系統，自家副系統）。**分享連結同 QR code 只可以由 `main` 產生**；`feed` 同 `internal` 只做「入場」，唔做「對外宣傳」。
4. **兩條派發線唔可以混淆（SG16）**：`outbound`（1–4）＝**Vercel 派發線**，我哋可以掛閘、帶 `Referer`，可做 `entry-gate` 放行來源；`canvas`（5 Gemini）＝**Canvas 派發線**，同樣係入口、同樣有人用、同樣有統計，但**我哋管唔到 Google 嘅 header／iframe**，所以**放入 `portalIds` 會被自動略過**（程式已強制，避免畫出撞唔中嘅掣）。
5. **登記 ≠ 已通**：`member-portal` 自身被 `www.skwscout.org.hk` 嵌入、`/books` 同 `/embed` 已經有 `<iframe>` 殼，但**末端連結仲帶 `noreferrer`**；未按 §4.4 改之前，由第 2／3／4 號入口撳入嘅子 App 會因空 `Referer` 被 `entry-gate` 擋。註冊表如實反映呢個狀態，唔會假裝已通。

---

## 1. 規則總表 SG1–SG16（Store Gate）

| ID | 規則 | 硬要求 / 一句驗收 |
|---|---|---|
| **SG1** | **開新 APP 時主動告知白名單與關站選項** | AGENT 行 [`INTAKE.md`](../templates/repo-starter/INTAKE.md) 第 0 步（Q8）時，**必須主動告知用戶**本生態設有**四大官方準入白名單入口**（[§0.1](#01-官方四大準入白名單入口註冊表canonical-portal-registry)：1. APP STORE／2. 圖書館／3. 成員系統／4. 區管理系統）及暫時關站機制，列出四種模式（`open`／`entry-gate`／`iframe-only`／`closed`）俾用戶揀，結果寫入 `SCOPE.md`；未指定預設 `open` |
| **SG2** | **`<iframe>` 白名單五類禁區自動轉軌** | `*.vercel.app` 列於 Public Suffix List，兩個 `*.vercel.app` 之間屬 **Cross-Site（跨站）**。凡中下面 §3 五類任何一項（本機長期儲存／PWA 主畫面／Web Push／登入 Cookie／硬體權限），**嚴禁用 `iframe-only`**；AGENT 必須主動提醒並改用頂層跳板 `entry-gate` 或維持 `open` |
| **SG3** | **用家開 APP 被攔時必須清晰告知有白名單／關站** | 禁止無聲黑屏或無解釋閃走。前端掛 [`templates/vercel/store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js)：攔截時隱藏底層內容（`display: none !important`），彈出無障礙對話框明確告知「此程式需經 SCOUT APP STORE 開啟（白名單保護）」或「此網站目前暫時關閉」，並附上 `target="_top"` 前往主站按鈕 |
| **SG4** | **純 `<iframe>` 白名單雙層配置＋禁留 `SAMEORIGIN`** | 只限純無狀態小工具／圖卡／簡報，且**必須等母站 `website` 實作 `<iframe>` 檢視器後先可啟用**。用 [`templates/vercel/vercel.iframe-whitelist.json`](../templates/vercel/vercel.iframe-whitelist.json) 設 `CSP: frame-ancestors https://scoutappstore.vercel.app;`（**必須移除 `X-Frame-Options: SAMEORIGIN`**，否則自相矛盾擋死母站）＋ `<head>` 掛 `store_gate_v1.0.js`（`mode: 'iframe-only'`） |
| **SG5** | **不適合 `<iframe>` 嘅 App 改用頂層跳板 `entry-gate`** | App 保持**頂層獨立網域**執行（100% 保住 Safari `localStorage`、PWA、Push、`SameSite=Lax` Cookie）。輕量級用 `store_gate_v1.0.js`（`mode: 'entry-gate'`）：以 `new URL(referrer).origin` 嚴格比對白名單 Set（防 `.evil.com` 前綴偽造）＋ `sessionStorage`（`try/catch`）保同分頁重整 ＋ `allowStandalone: true` 放行已裝主畫面 PWA；嚴格級再加 `/api/enter` 60 秒 HMAC `sig` 驗票寫 `HttpOnly` Cookie |
| **SG6** | **暫時關站分硬關站（Pause）與軟關站（告示頁）** | 硬關站：Vercel Dashboard → `Settings → General → Pause Project`（連 `/api` 即停、零額度，但出英文預設頁）；軟關站：`store_gate_v1.0.js` 設 `mode: 'closed'` 出中文維護卡，或 `vercel.json` `redirects` 設 **`"permanent": false`（302，嚴禁 `true`/308 永久快取）** 導回 `scoutappstore.vercel.app` |
| **SG7** | **「加入主畫面」只准由指定入口第一次進入** | 直開網址嘅用家**唔會** 404（`store_gate_v1.0.js` 會出白名單卡），但**唔准教用家直接開網址然後「加入主畫面」**：① 在入口母站（例如 APP STORE）「加入主畫面」會裝到**母站**而唔係個 App；② 真 404／未部署路徑根本冇 `manifest`，瀏覽器唔會提供「加入主畫面」；③ 已退役 app 嘅舊主畫面圖示撳落去只會白屏／「找不到網頁」。標準話術一律係「**先由入口進入 → 再按瀏覽器選單加入主畫面**」，並靠 `allowStandalone: true` 令裝好之後撳 icon 直開 |
| **SG8** | **入口網站自己永不被自己嘅閘擋** | 四大入口（APP STORE／圖書館／成員系統／區管理系統）**自己嘅 origin 一旦出現在 `portalIds` 就自動放行**（`reason: 'self-portal'`），因為「入口就係入口」，佢本身唔需要再經其他地方。**但**：① 入口自己**唔應該掛** `entry-gate`（佢唔係子 App）；② 入口若要軟關站，用 `mode: 'closed'`（`closed` 優先於 self 放行）；③ 子 App 記得**唔好**把入口 origin 當成自己 origin（判別靠 `location.origin`，唔靠 Referer） |
| **SG9** | **入口角色分工：分享連結／QR 只准由 `main` 產生** | 入口**唔係等價互替**：`main`＝APP STORE（真正主站・全方位）、`feed`＝圖書館（每日通告＋新 APP 引流）、`internal`＝成員系統／區管理系統（自家副系統）。**對外分享連結、QR code、宣傳單張、WhatsApp 群發、IG bio 一律只放 `main`（APP STORE）**；`feed` 同 `internal` 只做「入場」，唔做「宣傳」。理由：用戶收到嘅必須係**一個**穩定入口，否則同一 App 有四個唔同網址流通，版本控管同統計即刻散 |
| **SG10** | **統計按入口各司其職，唔好重複起爐灶** | ① **APP STORE（`main`）＝唯一權威統計來源**：已有 `apps.clicks／stars／hearts`（RPC `bump_clicks`／`bump_stars`／`bump_hearts`），後台睇逐個 App 點擊／收藏／Like，**唔需要**再加 `trackEndpoint`。② **圖書館（`feed`）現時唔統計**（用戶定案 2026-11-15：圖書館主責係睇通告＋Push 訂閱，推廣 APP STORE 係後期功能）——**唔准**為咗統計而改動圖書館核心流程。③ **子 App `trackEndpoint` 屬 opt-in 補充**（未設＝零請求），只補 APP STORE 睇唔到嘅嘢：`reason: 'standalone-pwa'`（主畫面開啟）同 `reason: 'missing-whitelist-entry'`（撞卡＝仲用舊連結） |
| **SG11** | **「收起」≠「用不到」——要分清四個下架齒輪** | ⚠️ **實查**：APP STORE 後台「隱藏」只係前端過濾（`store.js` L782 `sb.from("apps").select("*")` 拉晒全部，再用 `a.visible !== false` 喺瀏覽器篩走），**個 App 本身仍然 100% 開得**（舊 link／書籤／QR／搜尋照入）。要真正令人用唔到，必須用：① **Delist**（APP STORE 隱藏）＝冇人發現，但 URL 仍可入；② **Gate**（`entry-gate`）＝擋直開；③ **Soft close**（`mode: 'closed'`）＝見維護卡；④ **Hard close**（Vercel Pause）＝完全離線。四者係**齒輪唔係等號**，見 §3.7 |
| **SG11-a** | **有本機儲存（`BOOK`）嘅 App 唔可以「一收起就當冇」** | `SCOUTBOOK`／`CUBSBOOK`／`ROVERBOOK`／`VSBOOK` 用戶手上有**真實紀錄**（成員進度、考章）。Delist 或 Hard close 會令佢哋**冇入口更新／冇得匯出**。所以 `BOOK` 類下架前必須：① 保留可達入口（APP STORE 或成員系統，`internal` 角色）＋ ② 開 `allowStandalone`（已裝用戶照用）＋ ③ **先叫用戶匯出 JSON／QR 備份**，之後才可以 Pause |
| **SG11-b** | **敏感 App 唔可以靠「隱藏」做保護** | 既然隱藏只係前端過濾、`apps` 表匿名可 `select("*")`，**`visible=false` 唔係安全邊界**。含個人資料／收費／權限嘅 App 要落架，必須用 `entry-gate`（+ §4.3 簽票）或 Vercel Pause，**唔可以只喺 APP STORE 撳「隱藏」就當處理完** |
| **SG12** | **防「偷用」唔係技術問題，係「表態」問題** | 用戶 2026-11-15 定案：「領袖權限**不用保**，我有空改一下功能變數就可以」「我很多 App 功能簡單，他們要抄也能自己寫；我只想擋那些**又不表態支持又想用**的人」。→ 所以：① **唔准**為咗「防抄」而過度工程（唔需要為每個 App 起後端驗票）；② **真正要做**嘅係「**經入口**（`entry-gate`）＋ **一個極低門檻嘅支持位置**（`supportNudge`，見 §3.8-B）」；③ 抄走代碼**唔當損失**（你自己講：佢抄得到都寫得到），損失係「用你嘅成果但唔表態」 |
| **SG13** | **支持提示要講真話：「書架位置有限，冇人用會收起」——而且只對「你睇唔到嘅人」講** | 文案**必須**老實講後果（長期 0 收藏／Like → 收起騰位），唔好講「多謝支持」呢類客氣話。**預設 `skipPortalIds: ['appstore']`**：經 APP STORE 正常入嘅人，你 `clicks`／`stars`／`hearts` 已經睇得到，**唔需要再騷擾佢**；只有「主畫面直開」同「由其他入口入」嘅人（你睇唔到）才提一次。其餘硬規則：只在**已放行**時顯示、`role="complementary"`（唔遮內容唔阻擋）、一定有「唔使喇」、每 30 日最多一次、Safari 封 storage 靜默、**嚴禁**倒數／延時／遮罩迫 Like |
| **SG14** | **書架政策：唔寫死門檻，但「公開、可逆、唔刪資料」三條要守** | 幾時收起由**你睇後台**（`clicks`／`stars`／`hearts`）自行判斷——**唔准**寫任何固定日數／數字門檻入代碼或文件（用戶 2026-11-15 定案：「唔需要特登寫死規則，其實個後台我成日都睇」）。要守嘅只有三條：① **公開前置**（收起政策寫喺 APP STORE 說明，唔可以臨時通知）；② **收起＝只 Delist**，代碼／網址／用戶資料一律保留、隨時復活；③ **豁免**：`BOOK` 類（有人存真實紀錄）同自家系統。**Like 數 ≠ 使用人數**，所以決定權喺你，唔喺數字 || **SG11** | **「收起」≠「用不到」——要分清四個下架齒輪** | ⚠️ **實查**：APP STORE 後台「隱藏」只係前端過濾（`store.js` L782 `sb.from("apps").select("*")` 拉晒全部，再用 `a.visible !== false` 喺瀏覽器篩走），**個 App 本身仍然 100% 開得**（舊 link／書籤／QR／搜尋照入）。要真正令人用唔到，必須用：① **Delist**（APP STORE 隱藏）＝冇人發現，但 URL 仍可入；② **Gate**（`entry-gate`）＝擋直開；③ **Soft close**（`mode: 'closed'`）＝見維護卡；④ **Hard close**（Vercel Pause）＝完全離線。四者係**齒輪唔係等號**，見 §3.7 |
| **SG15** | **逐個 App 由該 App 嘅 AGENT 決定，真理倉只派清單** | 用戶 2026-11-15 定案：「你做好你呢邊未來要定嘅規則就 OK，之後再比唔同嘅對話我，我一個個同個 App 嘅 AGENT 講，佢對自己個 App 熟 D 會再諗多 D。」→ 真理倉**唔替**個別 App 決定 `mode`／`portalIds`／`supportNudge`；一律派 [`templates/repo-starter/WHITELIST-HANDOFF.md`](../templates/repo-starter/WHITELIST-HANDOFF.md)（6 條問題 → 按類型落實 → 真機三項驗收 → 回報格式）。AGENT **唔准**估，唔識要答「唔識」 |
| **SG16** | **五個入口＝兩條派發線，唔可以混淆** | **1–4 ＝ Vercel 派發線（`outbound`）**：我哋托管、可掛 `store_gate`／`CSP`、帶 `Referer`、可做 `entry-gate` 放行來源。**5 GEMINI ＝ Canvas 派發線（`canvas`）**：同樣係整俾人用嘅入口、**Gemini 自己嗰邊有完善統計**，但跑喺 Google 網域、我哋改唔到佢 header → **`gemini` 唔准放入 `portalIds` 做放行來源**（`portalsFromIds` 預設剔除；要畫按鈕用 `includeCanvas`）。Canvas app 要連受管制嘅 Vercel App → **一律經 APP STORE 轉接**；Vercel App 想嵌 Canvas app → **唔可以 `<iframe>`**（Google `frame-ancestors` 會封），改另開分頁或 API（C13 三軌注入） |
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

> ✅ **你講得對嘅部分（已寫成 SG8）**：四大入口**自己**就係入口，佢哋嘅 origin 一在 `portalIds` 名單內就自動放行（`reason: 'self-portal'`），永遠唔會被自己嘅閘擋，亦唔需要再經其他地方。

**但子 App 就唔同**：白名單**唔係**「對所有東西沒影響」。要分清兩件事：

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

**「直開網址會唔會自動跳去 APP STORE？」——預設：唔會自動跳，會停低顯示入口卡**

| 設定 | 直開子 App 網址會發生咩事 |
|---|---|
| `autoRedirectSeconds: 0`（**預設**） | **停喺原地**顯示白名單卡：4 個入口掣＋安裝提示，用家自己揀。**唔會**自動跳 |
| `autoRedirectSeconds: 3`（想自動） | 畫面顯示「3 秒後自動前往…（1. 前往 APP STORE）」，然後用 `location.replace()` 跳去**第一個入口**（即 APP STORE） |
| `autoRedirectSeconds: 3` ＋ `autoRedirectPortalId: 'library'` | 自動跳去你指定嘅入口（例如圖書館），唔一定係 APP STORE |
| `vercel.json` `redirects`（Edge 層 302，見 §4.2） | 連白名單卡都唔會出現，瀏覽器**立刻 302** 去 `https://scoutappstore.vercel.app/?from=whitelist` |

> **建議**：`BOOK` 類／有紀錄嘅 App **保持 `0`（唔自動跳）**——用家由舊書籤入嚟即刻被彈走會以為壞咗；而且自動跳會令用家永遠只識 APP STORE，其餘三個入口等於冇用。想「自動」就把秒數設 3–5 秒，並一定要顯示目的地名稱（現已內置）。
> **注意**：自動跳係 `location.replace()`，即係**唔會**留低上一頁紀錄；用家之後按返回唔會 loop。呢個係「頂層跳轉」而唔係 `iframe`，所以 `BOOK` 嘅 `localStorage` 唔受影響（§3.2）。

**標準引導話術（SG7，四個入口都應該照抄）**：

> 第一次使用：**請由 APP STORE／圖書館／成員系統／區管理系統進入**本程式 → 進入後按瀏覽器選單「加入主畫面」→ 之後就可以直接撳 icon 開啟（閣下嘅紀錄會保留）。

**想連 404 都唔會令用家迷路（可選）**：靜態 app 可以在 `vercel.json` 加 rewrite，把所有未知路徑導去 `index.html`，令「打錯路徑」都出白名單卡而唔係平台 404 頁；但記住 **`rewrite` 唔可以取代 `redirects` 嘅 `permanent: false` 規則（SG6）**，亦唔好攔 `/assets/*` 同 `/icons/*`。

**誠實邊界**：Vercel 平台層 404 頁**無法**注入我哋嘅提示卡（唔經我哋部署嘅檔案），只能靠上面 rewrite 或入口頁文案避免用家行到呢一步。

### 3.5 四個入口各有角色：對原有用戶同「分享出去幫手宣傳」有咩影響？

> **用戶 2026-11-15 定案（第二次修正）**：① **APP STORE＝真正主站（全方位）**，**後台 Supabase 已有統計**：每個 App 嘅**點擊**、**收藏（stars）**、**Like（hearts）**；② **圖書館＝主要係睇通告**＋**等人加入主畫面收 Push**；**現時冇統計**，**推廣 APP STORE 屬後期先加**；③ 成員系統／區管理系統＝**自家出產**副系統，用戶直接由此入最合理，**少人用都要繼續完善**。**痛點：唔知有冇人用、值唔值得花時間更新。**

**A. 入口角色同「帶唔帶分享」嘅硬規則（SG9）**

| 入口 | 角色 | 應唔應該帶分享連結／QR？ | 原因 |
|---|---|:--:|---|
| **1. APP STORE** | `main` 真正主站 | ✅ **唯一應該帶** | 全方位目錄＋分享對話框＋QR；對外只需記住**一個**網址 |
| **2. 圖書館** | `feed` 通告＋Push 主場 | ❌ 唔帶 | 主責係**通告內容**同**主畫面 Push 訂閱**；引入 App 推廣係**後期功能**，現階段連點擊統計都未有 |
| **3. 成員系統** | `internal` 自家副系統 | ❌ 唔帶 | 對內（成員／領袖）入口；對外宣傳會令人以為要登入先用得 |
| **4. 區管理系統** | `internal` 自家副系統 | ❌ 唔帶 | 同上，而且含權限角色，唔應該成為公開連結 |

**B. 對「原有用戶」有咩影響（逐項講清楚，唔靠估）**

| 原有習慣 | 白名單後會點 | 是否需要補救 |
|---|---|---|
| 由 APP STORE 撳入 App | **完全一樣**（APP STORE 係 `main`，永遠放行） | ❌ 唔需要 |
| 由圖書館通告撳入新 App | 一樣，但**要先將 `noreferrer` 改成 `noopener`**，否則被擋 | ⚠️ 改一行（§4.4-1） |
| 由成員系統／區管理系統撳入自家副系統 | 一樣，同樣先改 `noreferrer`（§4.4-4、4.5） | ⚠️ 改三行 |
| 用**舊書籤／舊 QR／舊 WhatsApp 轉發**開子 App | 見到白名單卡（唔會 404），要再撳一次入口 | ✅ 已由 SG3 卡引導；分享一律改指 APP STORE 後會慢慢自然消失 |
| **已加入主畫面**嘅用戶 | `allowStandalone: true` → 撳 icon 直接開，**完全唔受影響** | ❌ 唔需要（iOS 儲存分家見 §3.3） |
| 直接打網址嘅重度用戶 | 每次多一步 | 可接受（白名單本身目的） |

> **結論**：對**已經由入口用開**嘅用戶，白名單實際上**零感覺**；真正有感覺嘅只有「手上攞住子站直連網址」嘅人，而呢批人正好就係要靠 SG9 慢慢收斂去 APP STORE。**唔會**因為白名單而流失現有用戶嘅資料（`entry-gate` 頂層跳轉，`localStorage` 完全保留）。

**C. 對「用戶幫手分享宣傳」有咩影響（呢個係最易出錯嘅位，已實查你現有程式碼）**

⚠️ **實查發現**：`website/app.js` L723–727 嘅分享對話框同 QR code 現時係**直接複製子站網址**：

```js
if (urlEl) urlEl.value = app.url;                                   // L723
qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?...data=${encodeURIComponent(app.url)}`; // L727
```

一旦子 App 開白名單，**所有經分享掣／QR code 傳出去嘅連結都會即刻撞卡**——分享得越多，撞卡越多，睇落好似「宣傳失效」。

**SG9 嘅正確做法**：

| 分享途徑 | 應該指向 | 實作 |
|---|---|---|
| APP STORE 分享對話框（文字連結） | `https://scoutappstore.vercel.app/?app=<slug>` | 改 `app.js` L723：`urlEl.value = 'https://scoutappstore.vercel.app/?app=' + app.slug` |
| APP STORE QR code | 同上（**唔好**用 `app.url`） | 改 L727：`encodeURIComponent(shareUrl)` |
| APP STORE「分享網站連結」 | 主站首頁 | 保持 `https://scoutappstore.vercel.app/` |
| 圖書館／成員系統／區管理系統 | **唔提供對外分享掣**（或分享時自動改指 APP STORE） | 內部工具維持「只做入場」 |
| WhatsApp／IG 群發 | 一律 APP STORE 深層連結 | 靠 `?app=<slug>` 自動打開詳情 |

**但要有配套先成立**：APP STORE **必須支援 `?app=<slug>` 深層連結**（現時 `app.js` 冇讀 `location.search`，即係**未有**）。落地次序：① APP STORE 加 `?app=` 支援 → ② 分享掣／QR 改指深層連結 → ③ 子 App 開 `entry-gate`。**次序錯就會令分享連結失效**，所以要按呢個次序做。

**D. 「唔知有冇人用」→ 各入口分工量度（SG10 已按你實況修正）**

| 你想知 | 數據喺邊 | 要唔要新做嘢？ |
|---|---|---|
| **每個 App 有幾多人撳入** | ✅ **APP STORE 已有**：`apps.clicks`（RPC `bump_clicks`） | ❌ 唔需要（後台 Supabase 睇得到） |
| **有幾多人收藏／Like** | ✅ **APP STORE 已有**：`apps.stars`／`apps.hearts`（`bump_stars`／`bump_hearts`，帶 `p_delta` 可加可減） | ❌ 唔需要 |
| **有幾多人由圖書館引流入 App** | ⚠️ **現時無**（你明示圖書館冇統計，主責係通告＋Push） | **後期先做**；要做時 **唔可以**為統計改動通告／Push 核心流程 |
| **有幾多人係「加入主畫面」開 App**（唔經任何入口） | ❌ APP STORE 睇唔到（`clicks` 只計 store 內撳掣） | 子 App 加 `trackEndpoint`（opt-in）→ `reason: 'standalone-pwa'` |
| **仲有幾多人用舊子站直連（撞卡）** | ❌ APP STORE 睇唔到 | 子 App 加 `trackEndpoint` → `reason: 'missing-whitelist-entry'` |
| **成員系統／區管理系統有冇人用** | ✅ 你自己後台登入紀錄 | ❌ 唔需要子 App 統計 |
| **值唔值得繼續更新某 App** | **clicks ＋ stars ＋ hearts 趨勢**（APP STORE）＋ 主畫面開啟數（可選） | 連續 4 週 clicks／stars 都 0 → 軟關站或退役；**無數據 ≠ 無人用**（未掛統計前根本冇數據） |

> **關鍵結論**：**你已經有嘅 `clicks／stars／hearts` 就係「值唔值得更新」嘅主要答案**，唔需要為咗呢個問題喺圖書館加統計、亦唔需要即刻喺所有子 App 加 `trackEndpoint`。`trackEndpoint` 只在你想知「主畫面用戶」同「撞卡人數」時才加。
> **圖書館日後加推廣時嘅順序建議**：① 先確保圖書館自己嘅 Push／通告零影響 → ② 再喺通告列表加「SCOUT APP STORE」單一入口（帶 UTM 或 `?from=library`）→ ③ 最後才考慮圖書館端統計（可直接用 APP STORE 嘅 `clicks` 反推，唔使喺圖書館加 analytics）。

**隱私邊界（必須守住）**：payload 只有 5 個欄位、唔含 IP／UA／Referer 全文／姓名／班別；母站現有 `record_site_visit` 已經係「隨機 `visitor_id` ＋ 香港日期去重、唔收 IP／UA」嘅做法，子 App 統計要跟同一標準（[08](08-supabase.md) U9、[03](03-security.md)）。若要更準，可加「每日去重」而**唔可以**加指紋識別。

### 3.6 圖書館（Push 主場）特別保護規則：佢一定要維持 `open`

既然圖書館主責係**睇通告**同**等人加入主畫面收 Push**，佢嘅白名單處理同其他 App **唔同**，必須最保守：

| 項目 | 圖書館（`scout-circulars`）現況 | 硬規則 |
|---|---|---|
| **推送訂閱** | `push_subscriptions` 存 Supabase（同 APP STORE 同一個 project）；`notify.py` 每日推送 | **絕對唔可以入 `<iframe>`**、**絕對唔可以 `closed`**（會令所有已訂閱用戶收唔到通告） |
| **主畫面 PWA** | `manifest.webmanifest`：`"display": "standalone"`、`start_url: /`、`scope: /` | 保留；**唔准**改 `start_url` 令已裝用戶嘅 icon 失效 |
| **白名單模式** | **維持 `open`** | 若要「限經入口」，只可以**局部**（例如只有「推廣 APP STORE」頁面），**通告主頁永遠 `open`** |
| **App 推廣（後期）** | 現時無統計、無推廣模組 | 日後加入時：**單一入口**指向 APP STORE（帶 `?from=library`），**唔加第三方 analytics**，用 APP STORE `clicks` 反推效果 |
| **`rel` 屬性** | `index.html` L5662 現時 `rel="noopener noreferrer"` | 改 `rel="noopener"` **只改小工具（`isTool`）分支**；**通告下載／PDF 對外連結保持 `noreferrer`**（唔需要送 Referer，亦唔應該洩漏） |

> **一句話**：圖書館係四個入口中**唯一唔可以隨便動**嘅一個——因為佢載住 Push 訂閱。任何改動都要先問「會唔會令已訂閱用戶收唔到通告」。

### 3.7 「入站管制」真正嘅價值：四個下架齒輪（Delist → Gate → Soft → Hard）

> **用戶 2026-11-15 提問**：「入站點擊更重要嘅係咩？就係除咗要本機儲存嘅 `BOOK`，我可以在 APP STORE 把他收起，其他人就用不到。」
> **答案**：方向完全正確——**「我可以隨時收回」就係入站管制最大價值**。但**「收起」同「用不到」係兩件事**，要分四級齒輪，唔可以一步跳到最盡。

**四個齒輪（實查你現有系統）**

| 齒輪 | 做乜 | 實作 | 直開 URL | 舊書籤／分享連結 | 已裝主畫面 | 用戶資料 | 可逆性 |
|:--:|---|---|:--:|:--:|:--:|:--:|---|
| **① Delist（收起）** | APP STORE 唔顯示卡片 | 後台撳「隱藏」（`apps.visible = false`） | ✅ **仍然入得** | ✅ 仍然入得 | ✅ 照用 | 100% 保留 | 一秒復原 |
| **② Gate（落閘）** | 直開子 App 見白名單卡 | 子 App 掛 `store_gate_v1.0.js` `entry-gate` | ❌ 見卡 | ❌ 見卡 | ✅ **照用**（`allowStandalone`） | 100% 保留 | 改一行 |
| **③ Soft close（軟關站）** | 見「暫時關閉」告示 | `mode: 'closed'` | ❌ 告示卡 | ❌ 告示卡 | ❌ 告示卡（連 PWA 都停） | 100% 保留 | 改一行 |
| **④ Hard close（硬關站）** | Vercel `Pause Project` | Dashboard 撳 Pause | ❌ 完全離線 | ❌ 完全離線 | ❌ 完全離線 | 保留但**開唔到** | 要重新 Deploy |

⚠️ **關鍵事實（實查）**：**① Delist 完全唔會阻止任何人開個 App**。原因：`store.js` 用 `sb.from("apps").select("*")` 拉晒全部記錄（包括隱藏），只喺瀏覽器用 `a.visible !== false` 篩走顯示。所以：
- 個 App 網址仍然 online，任何人手上有 link 都入得；
- 舊分享連結、WhatsApp 群組、QR 海報、Google 索引全部照舊有效；
- 連 APP STORE 嘅公開 API 回應都仍然含住該筆記錄。

**正確用法：四個齒輪按意圖揀，唔係按「幾快」**

| 你想達到 | 用邊個齒輪 | 點解 |
|---|---|---|
| 「唔想再有人**發現**呢個 App，但舊用戶照用得」 | **① Delist** | 唔破壞任何人 |
| 「唔想人**直開**，但由入口入／已裝主畫面就用得」 | **①＋②** | 最常用組合；**唔會整爛任何用戶資料** |
| 「暫停維護，全世界都見到告示」 | **③ Soft close** | 保留資料、清楚交代、隨時復原 |
| 「即刻停止一切（刪錯資料／嚴重漏洞／要收費停用）」 | **④ Hard close** | 最快但最傷；**要做之前先叫用戶備份** |

**`BOOK` 類（有本機儲存）特別規則（SG11-a）**

你講「除咗要本機儲存嘅 `BOOK`」——正解係：**`BOOK` 唔可以行到 ③④ 而冇預告**，因為用戶手上係**真實紀錄**（成員進度、考章、服務時數）：

1. 下架前**一定要先保留一條可達入口**（APP STORE，或成員系統 `internal` 角色）——即係**只可以 Delist，唔可以同時拆走入口**。
2. 一定要開 `allowStandalone: true`，令**已加入主畫面**嘅用戶繼續用得到自己嘅紀錄。
3. 落 ③ 或 ④ 之前，**先出通告叫用戶匯出 JSON／QR 備份**（`BOOK` 本身已有備份／還原功能）。
4. iOS 主畫面同 Safari 儲存分家（§3.3-B）→ 用戶備份係**唯一**跨環境搬資料方法，更加唔可以冇預警就關站。

**敏感 App 特別規則（SG11-b）**

`visible = false` **唔係安全機制**（前端過濾、API 照樣回傳）。含個人資料／收費／權限嘅 App 要真正落架：
- 用 **② `entry-gate`**（要再加 §4.3 `/api/enter` HMAC 簽票）擋直開，**並且**
- 敏感資料／收費 API 由**後端**擋（[VL1 `/api/proxy`](06-vercel.md#vl1--apiproxy-係唯一出入口) 驗 session 先 inject key），**唔可以**靠前端遮罩；
- 要完全停 → **④ Vercel Pause**（連 `/api` 一齊停）。

**「由 APP STORE 收起」實務流程（建議照抄）**

```
1. APP STORE 後台 → 該 App → 撳「隱藏」            （① Delist，即時、可逆）
2. 觀察 2–4 週：clicks 走勢、有冇用戶查詢           （用 clicks/stars/hearts 判斷）
3. 仍要收緊 → 子 App 開 entry-gate（portalIds 只留 internal 或 appstore）
4. 要暫停 → mode: 'closed'（出中文告示，保留資料）
5. 要徹底停 → 先叫用戶備份，再 Vercel Pause        （④，最後手段）
```

### 3.8 真正目的：擋「唔表態都想用」——技術防線 vs 表態設計

> **用戶 2026-11-15 定案**：「我最主要係封那些偷用 HM20C、DrawTheRoute 那類 App 的人。」
> **實查現狀**：`HM20C`（`https://hm20c.vercel.app`，v1.2.2）＝領袖密碼模式（`LEADER_PASSWORD`＋`LEADER_SESSION_SECRET`＋HMAC session，`/api/leader-verify` ＋ Cloudflare Worker 驗票）；`drawtheroute`（`https://drawtheroute-yd8p.vercel.app`，ReliefForge Pro）＝**純前端 Vite/React，冇 `/api`、冇登入**。兩者今日都係「靠人唔好轉發網址」——呢個就係要封嘅洞。

**先講清楚「偷用」究竟偷咩，決定要出幾重防線**

| 偷用類型 | 實際發生咩事 | 你損失咩 |
|---|---|---|
| **A. 轉發網址** | 有人將 `hm20c.vercel.app` 貼去群組，非童軍都用 | 領袖功能免費外流（`LEADER_PASSWORD` 除外） |
| **B. 直接搜尋／亂撞** | 網址公開、Google 索引、Vercel 預設域名易猜 | 同上 |
| **C. 抄走整份前端** | 純靜態 app 可以 `Ctrl+S`／`curl` 拎走 HTML／JS，**自己另起一個站** | **最傷，但任何前端閘門都防唔到**（見下） |
| **D. 逆用你的 API** | 呼叫 `/api/leader-verify` 或第三方 BRouter／地政總署 API 額度 | 免費額度被耗、可能被停權 |

**兩條路線（用戶 2026-11-15 定案：走 A，唔走 B）**

| 路線 | 內容 | 成本 | 用戶定案 |
|---|---|:--:|---|
| **A. 表態設計（採用）** | `entry-gate` 令所有使用都經入口 ＋ `supportNudge` 喺用家開 App 時邀請一次 ❤️（可關、每 30 日一次） | 零（改一行 + 一個選項） | ✅ **就係呢個** |
| **B. 技術防線（唔採用）** | §4.3 簽票、VL1 後端驗票、領袖逐人帳號 | 高（每個 App 要後端） | ❌ **明確唔需要**：① 領袖權限「有空改一下功能變數就得」→ 唔值得為佢起基建；② 功能簡單嘅 App 抄得到都寫得到，防守無意義 |

**技術參考（保留紀錄，唔係要做）**：以下三層只在**日後出現真正有價資產**（例如收費、大量第三方 API 額度）時才參考。

| 層 | 做法 | 擋 A 轉發 | 擋 B 亂撞 | 擋 C 抄走 | 擋 D API 濫用 | 成本 | 對正常用戶影響 |
|:--:|---|:--:|:--:|:--:|:--:|---|---|
| **① 入口閘門**（本文件 SG5 `entry-gate`） | 子 App 掛 `store_gate_v1.0.js`，`portalIds` 收窄（可只留 `appstore`／`internal`） | ✅ | ✅ | ❌ | ❌ | 零（改一行） | 每次由入口入一次，之後 `sessionStorage` 通行；已裝主畫面照用 |
| **② 伺服器簽票**（§4.3 `/api/enter` HMAC 60 秒票 ＋ `HttpOnly` Cookie） | 由入口 `/api/launch` 簽票 → 子站 `/api/enter` 驗票寫 Cookie → 前端／API 都要求有票 | ✅ | ✅ | ⚠️ 擋唔到抄走靜態檔，但**抄走都冇票 → 用唔到有票功能** | ✅ | 小（1 支 serverless function） | 無感（自動跳一次） |
| **③ 真正嘅敏感功能留在後端**（[VL1 `/api/proxy`](06-vercel.md#vl1--apiproxy-係唯一出入口)） | 題庫活動、GPX 計算、地政總署／BRouter 代理全部經後端，**後端驗票先 inject key** | ✅ | ✅ | ✅ **抄走前端都冇用** | ✅ | 中 | 無感 |

> **用戶立場（2026-11-15）**：「我很多 App 都是功能簡單的，他們能抄也能自己寫。我其實只想擋那些又不表達支持又想用的。」→ 所以本節**唔會**建議你花時間防抄，只列事實，實際採用路線見下面 **A. 表態設計**。

**⚠️ 最重要嘅一句實話**：**純前端 App（DrawTheRoute 類）冇任何辦法阻止人抄走原始碼**——`Ctrl+S`、`curl`、DevTools 都拎得到。`entry-gate` 只係令「抄走嘅人**用唔到你嘅後端**」。所以：

- **DrawTheRoute 類（純前端）**：用 **①** 已經足夠達到「唔准直開、要經入口」嘅目的；接受「抄走會發生」，因為**佢抄走後冇你嘅持續更新**。
- **HM20C 類（有領袖模式＋`/api`）**：必須用 **②＋③**，因為佢有**領袖權限**同**政府／BRouter API 額度**——呢兩樣係真正要保護嘅資產，靠前端遮罩完全冇用。

**HM20C 現有設定嘅漏洞（實查）**

1. `LEADER_PASSWORD` 係**部署者設定的單一密碼**：一旦外流／被截圖，全港同一個密碼，**冇得逐人撤銷**。
2. `/api/leader-verify` 已經要求 `x-hm20c-worker-key`（好），但**任何知道網址嘅人仍然可以呼叫你嘅 `/api/activity`**（題庫活動）——需要加票。
3. 建議演進（唔急，但方向要清）：`LEADER_PASSWORD` → **領袖登記碼／`badge` 系統帳號**（呼應你「BADGE 要登記」嘅方向），令每個領袖有獨立身份、可逐個撤銷、可審計。

**B. 表態設計：`supportNudge` 實作（就係你要嘅「擋唔表態」）**

與其用技術擋（擋唔到），不如**令「用得着」同「表態」綁埋一齊**。做法極輕：

```js
initStoreGate({
  appKey: 'hm20c',
  mode: 'entry-gate',                                  // ① 一定要經入口
  portalIds: ['appstore'],                             //    收窄到只認 APP STORE
  allowStandalone: true,                               //    ② 已裝主畫面照用（你已成功嘅人）
  supportNudge: {                                      // ③ 講一次書架政策（可關、30 日一次）
    url: 'https://scoutappstore.vercel.app/?app=hm20c',
    days: 30,
    skipPortalIds: ['appstore'],                       // 經 APP STORE 入嘅你已睇得到 → 唔提
  },
});
```

出現時機同規則：

| 規則 | 實作 |
|---|---|
| 只在**已放行**（成功入到 App）時出現 | 被攔截只見入口卡，唔會同時出支持提示 |
| **唔遮內容、唔阻擋操作** | `role="complementary"`（唔係 `dialog`）、貼底部、可捲走 |
| 一定要有**「唔使喇」** | 撳一次 → 記入 `localStorage`，**30 日內唔再騷擾** |
| 唔可以迫人 Like | **禁止**倒數、延時解鎖、遮罩迫撳 |
| 儲存被封（Safari 私隱） | `try/catch` 靜默，唔會令 App 開唔到 |
| 文案 | 預設：「**書架位置有限：長期冇人收藏／Like 嘅 App 會收起，騰返個位俾新 App。覺得有用就按一下 ❤️，一個就夠。**」（用戶 2026-11-15 定稿，唔用客氣話） |
| 只對「你睇唔到嘅人」講 | `skipPortalIds: ['appstore']`（預設）→ 經 APP STORE 入嘅**唔提**（`clicks`／`stars`／`hearts` 已計）；由成員系統／圖書館入、或主畫面直開嘅**提一次** |

**C. 書架政策（Shelf Policy）：幾時收起由你判斷，唔寫死門檻**

> **用戶 2026-11-15 定案**：「唔需要特登寫死規則，其實個後台我成日都睇。」→ 所以本文件**唔會**定「90 日」呢類數字。**判斷權喺你**，真理倉只負責三件事：

| 必須守 | 內容 |
|---|---|
| **① 公開前置** | 「書架位置有限，長期冇人用會收起」要寫喺 APP STORE 說明／提示文案，**唔可以收起時才通知** |
| **② 收起＝只 Delist** | 只係「隱藏」，**代碼／網址／用戶資料全部保留**，隨時復活（SG11）。唔可以「收起」= 刪 repo／Pause／清資料 |
| **③ 豁免** | ① **`BOOK` 類**（有人存真實紀錄，唔可以用 Like 數收）② **自家系統**（成員／區管理，唔參與） |

**判斷材料（你自己睇，唔係規則）**：`clicks`（有冇人撳）／`stars`（有冇人收藏）／`hearts`（有冇人 Like）／有冇人查詢。三者長期全 0 又冇人問，就係你自己判斷嘅時候。

**⚠️ 一個誠實提醒**：Like 數**唔等於使用人數**——好多童軍領袖只會用、永遠唔撳 Like。所以呢件事**唔適合寫成機械規則**，只適合你睇住後台自己衡量。真理倉已經把「可以收起」嘅機制（Delist）同「唔可以摧毀」嘅底線（②）寫實，剩返嘅判斷交返你。

**D. 逐個 App 交接（呢個才係你真正需要嘅產出）**

你講「之後再比唔同嘅對話我，我一個個同個 App 嘅 Agent 講，佢對自己個 App 熟 D 會再諗多 D」——完全正確。所以真理倉**唔應該**替每個 App 決定，而係提供一份**交接清單**：每個 App 嘅 AGENT 只需要答自己嗰幾條，然後落實。清單模板見 [`templates/repo-starter/WHITELIST-HANDOFF.md`](../templates/repo-starter/WHITELIST-HANDOFF.md)，可直接貼去該 App 嘅對話。

**心理上嘅分別（呢個先係重點）**：

| 情況 | 用家感受 | 對你嘅價值 |
|---|---|---|
| 完全開放 | 「免費嘢，隨便用」 | 你唔知有冇人珍惜 |
| 硬鎖（付費／登入／驗票） | 「麻煩／又要登記」 | 連支持者都趕走 |
| **經入口 ＋ 講明書架政策（採用）** | 「原來位有限，冇人按就會收」 | **`clicks`／`stars`／`hearts` 會講真話**；同時把「維護取捨」講成公開規則，唔會被人覺得你偏心 |

> 你有一句講得好準：**「他曾經經入口、或把我的 APP 加進主畫面，其實我已經成功了。」** `entry-gate` 正正就係把「用你嘅嘢」變成「經你嘅門」——已經裝主畫面嘅人零感覺，而隨手轉發網址嘅人會見到你嘅門。呢個已經係最溫和而有效嘅篩選。
> **而對於「用咗但唔表態、仲背後講你傻」嘅人**：技術上永遠擋唔盡（佢抄得到／自己寫得到），所以**唯一可持續嘅做法係「唔再靠佢」**——用 `clicks`／`stars`／`hearts` 決定資源放喺邊個 App、放幾多時間。呢個係止蝕，唔係報復。

**這與你的 BADGE ／支部系統路線一致**

你講「`BOOK` 普及 = 未來 `BADGE` 普及；`BADGE` 要登記；`BADGE` 普及 = 支部系統及旅系統普及，那些都要登記」——**方向完全正確，而且同 SG11 一致**：

| 階段 | 入口管制 | 身份 |
|---|---|---|
| 今日 | `entry-gate`（`portalIds`） | 無身份，靠「由邊個入口入」 |
| 過渡 | `entry-gate` ＋ §4.3 簽票 | 有短期票，可撤銷 |
| 目標 | **成員系統（`internal`）登入 → 派票** | **真實身份（領袖／成員、支部、旅）**，可逐人撤銷、可審計、可統計 |

**所以「`BOOK` 唔要緊」係對嘅判斷**：`BOOK` 係**自願使用**嘅紀錄工具，用戶愈多愈好（最終導向 BADGE 登記）；而 **HM20C／DrawTheRoute 係「專業工具」**，愈多非目標用戶用＝愈多免費外流＋API 成本。兩者管制力度應該**唔同**（下表）。

| App 類型 | 例子 | 管制建議 | 理由 |
|---|---|---|---|
| **紀錄冊（自願）** | `SCOUTBOOK`／`CUBSBOOK`／`ROVERBOOK`／`VSBOOK` | `entry-gate` ＋ `allowStandalone` **寬鬆**（`portalIds` 全部四個）；`supportNudge` **可選、建議關** | 要用得方便，目的係導向 BADGE 登記（唔好騷擾成員） |
| **專業工具（有價值）** | `HM20C`、`drawtheroute`、`HKMAP`、`AvianDex` | **`portalIds` 只留 `appstore`** ＋ **`supportNudge`**（SG13） | 擋「唔表態都想用」；唔做後端驗票（用戶定案） |
| **自家系統（有身份）** | 成員系統、區管理系統、各 `badge` | 後端登入把關（SG11-b），入口只作導流；**唔需要 `supportNudge`** | 已有真實身份同關係，唔需要再提 |

### 3.9 第五個門口 GEMINI：同一條派發線，只係「Canvas 類」工具

> **用戶 2026-11-15 澄清（重要修正）**：「你誤會了。GEMINI 也是我整來給人用的，只是那邊都是用 CANVAS 寫的工具，和 APP STORE 這邊是不同類而已。那邊我也有完善的統計，所以也是一個入口。」

**所以五個門口係咁分（唔係「方向相反」，係「類型唔同」）**

| # | 入口 | 派發乜 | 用家由邊入 | 統計喺邊 | 我哋可唔可以掛閘 |
|:--:|---|---|---|---|:--:|
| 1 | **APP STORE** | Vercel 上嘅 App（全方位目錄） | `scoutappstore.vercel.app` | ✅ APP STORE 後台（`clicks`／`stars`／`hearts`） | ✅ 可以 |
| 2 | **圖書館** | 通告＋新 App 引流 | `scout-circulars.vercel.app` | 自有（Push 訂閱；點擊統計後期） | ✅ 可以（但**必須維持 `open`**，SG10-a） |
| 3 | **成員系統** | 自家副系統 | `member-portal-sigma-swart.vercel.app` | 自有登入紀錄 | ✅ 可以 |
| 4 | **區管理系統** | 自家副系統 | `scout-district-portal.vercel.app` | 自有登入紀錄 | ✅ 可以 |
| 5 | **GEMINI** | **Canvas 類工具／App**（單一 HTML，跑喺 Google 網域） | `gemini.google.com`（Gem Canvas／分享連結） | ✅ **Gemini 自己嗰邊有完善統計**（用戶） | ❌ **管唔到**（Google 網域，我哋改唔到佢 header／iframe） |

**一句話**：1–4 係「**Vercel 派發線**」，5 係「**Canvas 派發線**」。**五個都係入口，兩條線並行**，只係技術形態唔同。

**兩條線嘅技術分別（決定「可唔可以管」）**

| 項目 | Vercel 派發線（1–4 → 子 App） | Canvas 派發線（5 → Canvas app） |
|---|---|---|
| 托管 | Vercel（`*.vercel.app`） | Google（Gemini Canvas，單一 HTML） |
| 我哋可唔可以放 `store_gate_v1.0.js` | ✅ 可以（自己部署） | ❌ 唔可以（唔係我哋托管） |
| 可唔可以設 `CSP frame-ancestors` | ✅ 可以（`vercel.json`） | ❌ 唔可以（Google 控制） |
| `entry-gate` 放行來源 | ✅ 可以（有 `Referer`） | ❌ 唔可以（跨站、無我哋 `Referer`） |
| 體積規則 | S7（`dist < 5MB`） | **C13-g 單一 HTML ≤ 5MB，唔強制瘦身**（[09](09-gemini-canvas.md)） |
| 體積／資產規範 | [06](06-vercel.md) VL1–VL12 | [09](09-gemini-canvas.md) C1–C13 |
| 統計 | APP STORE `clicks`／`stars`／`hearts`（或子 App `trackEndpoint`） | **Gemini 自己嗰邊**（唔需要重複做） |

**所以 `gemini` 喺 `portalIds` 嘅正確用法**

`gemini` **仍然係登記入口**（第 5 個），但因為我哋管唔到佢嗰邊嘅閘，所以：

```js
// ✅ 正常情況：只列可控閘嘅入口（1–4）做放行來源
portalIds: ['appstore', 'library', 'member', 'district']

// ✅ 若個別 App 想喺攔截卡多一粒「去 Gemini 用 Canvas 版」
portalIds: ['appstore', 'gemini']  // ← 程式預設會自動略過 gemini
// 要真係畫出嚟：另外傳 includeCanvas（見下）
```

程式層面（`store_gate_v1.0.js`）：

```js
PORTAL_REGISTRY.gemini.kind    = 'canvas';
PORTAL_REGISTRY.gemini.gateable = false;      // 我哋管唔到閘
PORTAL_REGISTRY.gemini.stats    = 'gemini-side'; // 統計喺 Gemini 自己嗰邊
CANVAS_PORTAL_IDS;   // ['gemini']
OUTBOUND_PORTAL_IDS; // ['appstore','library','member','district']
portalsFromIds(['gemini','appstore']);                      // → ['appstore']
portalsFromIds(['appstore','gemini'], {}, { includeCanvas: true }); // → 兩個都保留
```

**實務上你要注意嘅 4 點**

| 情境 | 正確做法 |
|---|---|
| **同一個工具有 Vercel 版 ＋ Canvas 版** | 兩個係**唔同嘅入口選擇**，各自統計（Vercel 版睇 APP STORE、Canvas 版睇 Gemini 後台）。**唔需要**把兩邊數字合併，亦**唔可以**把 Canvas 版放入 `portalIds` 做放行 |
| **Canvas 版想連去受管制嘅 Vercel App** | 一律**經 APP STORE 轉接**（Canvas 內開 `scoutappstore.vercel.app` 連結），咁子 App 就收到正確入口 `Referer` |
| **Vercel App 想嵌 Canvas app** | ❌ 唔可以 `<iframe>` 嵌 Gemini（Google `frame-ancestors` 會封）→ 改為**另開分頁連結**，或把功能用 API 做入自己 App（C13 三軌注入） |
| **API key（Canvas app 要 call Gemini）** | 唔准入 Git／唔准入前端 → 用 `C13` 三軌注入 或 `/api/proxy`（A1） |

**一句話總結**：**1–4 係「我可以掛閘嘅派發線」，5 係「我唔可以掛閘、但有自己統計嘅派發線」。五個都係正式入口，唔可以互相代替，亦唔可以因為管唔到就當佢唔存在。**

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
6. **分享連結／QR 只准由 APP STORE 產生（SG9）**：`website/app.js` L723 `urlEl.value = app.url` 同 L727 QR code 要改成 `https://scoutappstore.vercel.app/?app=<slug>`；**唔好**再用子站 `*.vercel.app` 直連做分享。前提係 APP STORE 要先支援讀 `?app=<slug>`（現時未支援）。
7. **掛統計（SG10）**：子 App 加 `trackEndpoint: '/api/store-hit'`（唔想統計就唔加，完全零請求），只回報 `{appKey, mode, reason, portal, v}`，唔送個人資料。
8. **落地次序（唔可以調亂）**：① APP STORE 支援 `?app=<slug>` → ② 分享掣／QR 改指深層連結 → ③ 子 App 開 `entry-gate`。次序錯，分享出去嘅連結會即刻撞卡。

---

## 5. 安全邊界與誠實限制（對照 [47](47-readme-discipline.md)）

- **前端閘門係防誤傳／防一般直入，唔係加密邊界**：`store_gate_v1.0.js`（`Referer`＋`sessionStorage`＋DOM 遮罩）同純靜態 `vercel.json` `sec-fetch-dest` 足以擋晒一般用家直接打網址、舊書籤直入同外站偷嵌 `<iframe>`；但識開瀏覽器 DevTools 嘅人可以手動改 `sessionStorage` 或睇靜態 bundle，識用 `curl` 嘅人可以自訂 `Referer`／`Sec-Fetch-Dest` header。凡涉及個人資料（PDPO）、帳號權限或付費 API 額度，必須行 §4.3 後端驗票或 [VL1 `/api/proxy`](06-vercel.md#vl1--apiproxy-係唯一出入口)。
- **App 內置瀏覽器與嚴格私隱設定對 `Referer` 嘅影響**：如果用家喺極嚴格私隱瀏覽器或個別 In-App WebView 開母站，跨站跳轉有機會被剝走 `Referer` 令輕量級 `entry-gate` 誤攔；遇到呢類情況可改用 §4.3 `/api/enter` URL 簽名票據（唔依賴瀏覽器送 `Referer`）。
- **已驗證 vs 未做（誠實列明）**：
  - ✅ `templates/vercel/store_gate_v1.0.js` 四種模式、`F4` fail-closed、`new URL().origin` 防前綴偽造（如 `https://scoutappstore.vercel.app.evil.com`）、Safari 私隱模式 `sessionStorage` 拋錯兜底、`standalone` PWA 放行，以及 `PORTAL_REGISTRY` 四大入口註冊表（id／Origin／排序／未知 id 靜靜略過）同 `templates/vercel/vercel.iframe-whitelist.json` 結構，均已由 `scripts/store_gate.test.mjs` 單元測試自動守住（`node --test`）。
  - ⚠️ 本輪只喺真理倉 `readme` 建立規範、四大入口註冊表、第 0 步 `INTAKE.md` 問項同可抄範本；**未改動 `playerkousas-rgb/website`、`scout-circulars`、`member-portal`、`scout-district-portal` 或任何現有子 App**（四個入口仍然全部係 `open`／無閘），亦未喺 iPhone Safari／Android Chrome 真機實測跨站跳轉（日後首次落到真 App 時須按 [17 §4](17-final-check-and-tutorial.md#4--最終人手實測7-條機器代唔到) 真機跑一次）。
