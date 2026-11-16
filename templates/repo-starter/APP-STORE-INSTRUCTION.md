# APP STORE 指令（可直接複製貼去 `playerkousas-rgb/website` 對話）

> 用途：白名單落地嘅**第 0 步**。你逐個子 App 開閘之前，APP STORE 要先識得「每一隻 App 有自己一條深層連結」。
> **只改一個 repo**：`playerkousas-rgb/website`（SCOUT APP STORE）。**唔使改任何子 App、唔使改圖書館。**
> 貼之前唔需要改任何嘢（下面已寫實查行號）。

---

=== 開始（複製以下全部） ===

請先讀真理倉 `playerkousas-rgb/readme` 呢三份，然後照做：

1. `docs/50-app-store-whitelist-and-shutdown.md` —— **§1 SG9／SG9-a**（分享／QR 只准由 APP STORE 產生）、**§4.4-6**、**§4.4-8**（落地次序）
2. `docs/51-whitelist-rollout-list.md` —— **§8 第 0 步**
3. `templates/vercel/store_gate_v1.0.js` —— 睇一眼 `PORTAL_REGISTRY` 就明（你**唔需要**改呢個檔）

## 背景（1 分鐘讀完）

APP STORE 係唯一主站，所有分享連結同 QR code 將來都要指返 APP STORE，而**唔係**子站網址。原因：子站一開「準入白名單」（只准由指定入口進入），任何人收到一條子站直連（WhatsApp／舊 QR／書籤）都會撞到白名單卡。所以要有一條「APP STORE 內部深層連結」，指去某一個 App 嘅詳情。

## 我實查你今日嘅源碼（`041f0742`，2026-11-13），以下 11 個位係直接分享／開子站網址

| # | 位置 | 今日行為 | 要改成 |
|:--:|---|---|---|
| 1 | `app.js` L52 `openApp()` | `window.location.href = app.url` | 唔改（呢個係真正「進入 App」，見下面「唔准做」） |
| 2 | `app.js` L120（sheet「開啟」掣） | `window.location.href = app.url` | 唔改（同上） |
| 3 | `app.js` L190（卡片 `<a href="${app.url}">`） | **anchor 帶子站網址**（只係被 L683 嘅 `e.preventDefault()` 接住） | **改**：`href` 改做深層連結（見任務 3） |
| 4 | `app.js` L250（排行榜 `<a href="${a.url}">`） | anchor 帶子站網址 | **改**：同上 |
| 5 | `app.js` L723 分享面板 `urlEl.value = app.url` | 用戶睇到／複製到**子站網址** | **改**：深層連結 |
| 6 | `app.js` L727 QR code `data=${encodeURIComponent(app.url)}` | QR 編碼**子站網址** | **改**：深層連結 |
| 7 | `app.js` L739 `copyShareUrl()` `clipboard.writeText(_currentShareApp.url)` | 複製**子站網址** | **改**：深層連結 |
| 8 | `app.js` L747–762 `shareTo()`（WhatsApp／Facebook／Telegram／X／Line／系統分享） | 分享**子站網址** | **改**：深層連結 |
| 9 | `index.html` L2319–2326 `shareApp()`（主推廣掣／Web Share API） | 分享**子站網址** | **改**：深層連結 |
| 10 | `index.html` L2283「今期主打」大掣 | `window.open(f.app.url)` —— **直接開子站，跳過詳情** | **改**：改為開該 App 詳情（`?app=`），同其他卡一致 |
| 11 | 卡片撳落去（L681–691 委派） | 開詳情 sheet、**唔會跳走** ✅ 已經正確 | 唔改 |

**結論**：真正要改嘅係「分享／複製／QR／卡片 href 全部改指深層連結」，加埋「今期主打」唔好再跳過詳情。**唔好碰 `openApp()` 同 sheet 嘅「開啟」掣** —— 嗰兩個就係真正送用家入子站嘅位置，要保留（並且要保留真實 `Referer`，唔好加 `noreferrer`）。

## 任務 1：加 `?app=<key>` 深層連結

**契約（一定要做到）**：

- `https://scoutappstore.vercel.app/?app=<key>` → 打開該 App 嘅**詳情 sheet**（即係同撳卡片一樣嘅畫面），**唔會白屏、唔會跳去子站**。
- `<key>` 要**穩定、細楷 ASCII**，唔好用中文、唔好用會改名嘅名稱。
  - 建議：`apps` 表加一欄 `slug text unique`（後台可編輯），例如 `hm20c`、`icon-maker`、`gemini`、`cub-book`。
  - **唔好用 `name`**（中文又會改名）、**唔好用 `id`（uuid）**（太長，QR code 好密）。
- `?app=` 對唔到（打錯／已下架／`visible=false`）→ **唔准白屏、唔准報錯頁**：靜靜返首頁，並用你現有 `showToast()` 出一句「搵唔到呢個 App」。
- `visible = false` 嘅 App **一律當唔存在**（唔准經深層連結偷偷開到；`visible=false` 只係前端過濾，唔係安全邊界，見 SG11）。
- 撳卡開 sheet 時，**建議順手 `history.replaceState` 寫返 `?app=<slug>`**，咁用戶喺網址欄複製到嘅就係可分享連結（呢個係「分享只由 APP STORE 產生」最省力嘅做法）。
- **可選**：接受 `?from=<portal>`（例如 `?app=hm20c&from=library`）只作備註／統計用，唔影響任何行為；**唔准**為此加新表或改 `bump_clicks` 語意。

## 任務 2：所有分享／複製／QR 改指深層連結

- 分享面板顯示同複製嘅網址（#5、#7）、QR code（#6）、五個平台分享（#8）、`shareApp()`（#9）→ **全部用 `deepLink(app)`**。
- 建議只加一個 helper，唔好在 6 個地方各自砌字串：
  ```js
  function appDeepLink(app) {
    return 'https://scoutappstore.vercel.app/?app=' + encodeURIComponent(app.slug || app._id);
  }
  ```
  （`app.slug` 未填就 fallback `app._id`，保證永遠有 link，唔會 `undefined`。）
- 分享文字保持原樣（`name — description`），**唔准**加水印、邀請碼、「必須經入口」等字眼。

## 任務 3：卡片 `<a href>` 改做深層連結（#3、#4、#10）

- 卡片／排行榜嘅 `href` 改做 `appDeepLink(app)`。咁「用新分頁開卡片」都唔會跌出 APP STORE（今日會直接開子站）。
- 撳卡嘅行為**唔變**：仍然係 `e.preventDefault()` → 開詳情 sheet。
- 「今期主打」大掣（#10）改為開該 App 嘅詳情（等同 `openAppSheet(idx)`），**唔好**再 `window.open(app.url)`。

## 唔准做（違反任何一項就停手，先問我）

- ❌ 唔准改 `apps` 表嘅 `url` 欄，唔准改任何子站網址。
- ❌ 唔准改 `manifest.webmanifest` 嘅 `start_url`（現時 `/`）同 `scope` —— 已加入主畫面嘅用戶要照樣入首頁。
- ❌ 唔准改 `bump_clicks`／`bump_stars`／`bump_hearts` 嘅語意（一次開啟＝一次 click，唔好因為深層連結而重複計）。
- ❌ 唔准刪走 `openApp()` 或 sheet「開啟」掣，亦**唔准**喺嗰度加 `noreferrer`／`noopener`（子站要靠真實 `Referer` 認入口；`noopener` 本身唔會清 `Referer`，但唔好順手改成 `noreferrer`）。
- ❌ 唔准加「這個 App 需要經指定入口開啟」之類字眼（白名單係子站自己嘅事，APP STORE 只負責派出去）。
- ❌ 唔准改動現有 `visible=false` 過濾、排序、搜尋、收藏／讚好邏輯。
- ❌ 唔准加後端簽票／驗票（SG12 明確唔需要）。
- ❌ 唔准一次過改其他 repo（圖書館／成員系統／子 App 一律唔關你事）。

## 真機／瀏覽器實測（必做，唔准跳）

1. **分享面板**：隨便揀一隻 App → 撳分享 → 顯示同複製到嘅網址係 `https://scoutappstore.vercel.app/?app=…`（**唔再係 `xxxx.vercel.app` 子站**）。
2. **QR code**：掃出嚟同 (1) 一樣；用手機相機掃 → 落到該 App 詳情。
3. **無痕視窗**直接貼 `?app=<slug>` → 開到該 App 詳情；再撳「開啟」→ 正常入到子站（今日未開閘，應該同平時一樣）。
4. **亂打** `?app=not-exist` → 唔白屏、有提示、停喺首頁。
5. **卡片**：撳卡開 sheet、網址欄出現 `?app=…`；用「在新分頁開啟」亦唔會跳出 APP STORE。
6. **已加入主畫面**（或 `display-mode: standalone`）撳 icon → 仍然入首頁（`start_url` 冇改）。

## 回報格式（照抄）

```
Repo：playerkousas-rgb/website
1. apps 表加 slug：是/否（欄位名：______，有冇 unique：是/否，後台可改：是/否）
2. deepLink 影響位置：#3 卡片 / #4 排行榜 / #5 分享面板 / #6 QR / #7 複製 / #8 平台分享 / #9 shareApp / #10 今期主打（逐個 ✓/✗）
3. 未知 slug 行為：______（要靜靜返首頁 + toast）
4. 改咗邊幾個檔（檔名 + 行數）：______
5. 真機：分享連結 ✓/✗ ｜ QR ✓/✗ ｜ 無痕深層連結 ✓/✗ ｜ 亂打 slug ✓/✗ ｜ 卡片唔跳 ✓/✗ ｜ 主畫面 start_url 冇改 ✓/✗
6. 未做／風險：______
```

**唔准講「已完成」而冇真機結果。未做就寫「未做」。**

=== 結束 ===

---

## 貼之前要知嘅兩件事（唔使貼落去）

1. **`Gemini 輔助工具` 已經喺你 APP STORE 入面**（`apps.id = 080a07e8-79ba-4db4-a159-e8cdf703f73f`，`url = https://gemini-woad-sigma.vercel.app/`，`visible = true`，`clicks = 20`／`hearts = 1`）。加 `slug` 時記得幫佢填一個，例如 `gemini`。**我冇權讀 `playerkousas-rgb/GEMINI` 呢個 repo**（`gh api` 回 `403 Resource not accessible by integration`），所以佢嘅內容我未實查過 —— 唔好靠我假設。
2. 呢一步**唔會**令任何子站即刻變白名單；佢淨係令「分享出去嘅連結」指返 APP STORE。子站開閘係下一批（`docs/51` §8 第 1 批之後），次序錯就會一開閘全撞卡（SG9-a）。
