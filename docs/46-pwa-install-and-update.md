# 46 — PWA 安裝入口＋版本更新 I1–I8／UP1–UP5（安裝要有掣、更新要問過人）

> **2026-11-12 定案**。來源案例：[`playerkousas-rgb/minigame`](https://github.com/playerkousas-rgb/minigame)（出門玩 Pocket Play）**v1.2.0** —— 2026-11-12 已 merge 入 main（實測 main HEAD `34e0107`，Merge PR #11，2026-11-12 11:20 +0800）並部署 Vercel 成功；以及 **4 個 BOOK**（SCOUTBOOK v2.1.3／CUBSBOOK v1.3.0／ROVERBOOK v2.2.0／VSBOOK v1.0.3，2026-11-12 pinned，見 §0.1）。
> **一句原則：「安裝要有掣、更新要問過人」** —— 唔靠瀏覽器自己彈，也唔准背景偷換版。
> **適用**：**所有有 UI 嘅 web app**（純靜態／Vite／Next 都一樣）。純後端／API（無 UI）唔適用；工具型（stateless）web app 一樣要做。
> **唔重抄**：圖標／manifest／9 個 PNG 跟 [33](33-icon-standard.md)；版號同步跟 [13](13-versioning.md)；英文介面（預設要做・可豁免）跟 [44](44-bilingual-ui.md)。本頁只管「安裝入口」同「更新流程」兩件事。

---

## 0. 來源案例一：出門玩 v1.2.0 實作位置（2026-11-12 讀 source 核對）

| 位置 | 做咗乜 |
|---|---|
| `index.html` → `#installAppButton` | 首頁 welcome 區「📲 加入主畫面」掣，預設 `hidden`，唔會一開頁就彈出；已 standalone 就永遠收起 |
| `index.html` → `#installHelpModal` | iOS／iPadOS 三步教學卡：`role="dialog"`、`aria-modal="true"`、`aria-labelledby="installHelpTitle"`；三步 = Safari 分享⬆ → 揀「加入主畫面」→ 按「加入」；`Esc`／點背景／「知道了」掣都可以關；開卡時 focus 去關閉掣 |
| `index.html` → `#updateBanner`（`#updateNowButton`／`#updateLaterButton`） | 「有新版本可用」banner：`role="region"` `aria-label="版本更新"`；「立即更新」掣 ＋ `×`（`aria-label="稍後再更新"`） |
| `app.js` | `beforeinstallprompt` → `preventDefault()` 存入 `deferredInstallPrompt`，按掣先 `prompt()`；`appinstalled` → 收掣＋開 toast「已加入主畫面」；`isStandalone()` = `matchMedia('(display-mode: standalone)').matches` 或 `navigator.standalone === true`；`isIos()` = UA 含 `iphone\|ipad\|ipod` 或 `MacIntel` ＋ `maxTouchPoints > 1`；`registration.waiting`／`updatefound` → 顯示 banner；「立即更新」→ `postMessage({ type: 'SKIP_WAITING' })` → `controllerchange` → `location.reload()`，**2.5 秒 timeout fallback**；「稍後」→ 記住 `dismissedWorker`，同一個 worker 唔再嘈；檢查時機 = `visibilitychange`（回前景）／`online`／每 30 分鐘 `registration.update()` |
| `sw.js` | `install`：快取完**只在 `self.registration.active` 為空（首次安裝）先 `skipWaiting()`**；之後嘅更新留在 `waiting`。`message`：收到 `{ type: 'SKIP_WAITING' }` 先 `skipWaiting()`。`activate`：清舊快取＋`clients.claim()`。導覽 network-first、靜態 stale-while-revalidate；`APP_VERSION = '1.2.0'`，版本號＝快取名，舊快取自動清 |
| `tools/verify.mjs`（`update-flow` 檢查） | 靜態兜底：`index.html` 要有 `installAppButton`／`installHelpModal`／`updateBanner`／`updateNowButton`；`app.js` 要攔 `beforeinstallprompt`、送 `SKIP_WAITING`、聽 `updatefound`；`sw.js` 要有 `SKIP_WAITING` message handler；`install` 入面出現無條件 `self.skipWaiting()` 即 fail（會玩到一半偷換版） |

### 0.1 來源案例二：4 個 BOOK 嘅 PWA 實作（2026-11-12 讀 source 核對，HEAD＝當日）

同一做法已喺 4 個 React＋Vite 旅團紀錄冊 app 行緊，全部係 2026-11 月持續發版中嘅 production app：

| Repo | pinned commit | 版號 | 安裝入口 | 更新流程（`web/src/pwa.js`＋`web/public/sw.js`） |
|---|---|---|---|---|
| [SCOUTBOOK](https://github.com/playerkousas-rgb/SCOUTBOOK/blob/e6636371d466bff2bf20b119f4687d6e827d516f/web/src/pwa.js) | `e663637` | v2.1.3 | menu「加到手機主畫面」靜態雙語教學（iPhone Safari／Android Chrome 兩段）；**冇** `beforeinstallprompt` | waiting／`updatefound` → `scoutbook:update` 事件 → 頂欄 `updatebar`（`role="alertdialog"`）→「立即更新」→ `SKIP_WAITING` → `controllerchange` → reload；**3 秒 fallback**；檢查：`visibilitychange`＋`focus`＋`online`＋每 30 分鐘；`updateViaCache: 'none'`；SW 快取 `scoutbook-cache-v6`（**註解仍寫 v4，見下表第 6 點**） |
| [CUBSBOOK](https://github.com/playerkousas-rgb/CUBSBOOK/blob/bac85eb39cb72dfcd378ebfc3211f7ac3ba919e1/web/src/pwa.js) | `bac85eb` | v1.3.0 | 同上（`MenuDialog.jsx`） | 同構但**最簡陋**：只靠 `visibilitychange`；`applyPwaUpdate()` **冇 timeout fallback**；冇 `focus`／`online`／30 分鐘；SW 快取 `cubbook-cache-v9`（CHANGELOG v1.2.9 有記「快取升至 cubbook-cache-v8」→ 再升 v9） |
| [ROVERBOOK](https://github.com/playerkousas-rgb/ROVERBOOK/blob/8c3066f1608b9d36dd7d944eb4efe86497585a62/web/src/pwa.js) | `8c3066f` | v2.2.0 | 同上（`MenuDialog.jsx`） | `visibilitychange`＋`pageshow`＋`focus`（冇 `online`／30 分鐘）；**1.5 秒 fallback**；`export hasPendingPwaUpdate()`；SW 快取 `roverbook-v5` |
| [VSBOOK](https://github.com/playerkousas-rgb/VSBOOK/blob/5763f2615c8b5aa122f020fe5b5c20a308258d9f/web/src/pwa.js) | `5763f26` | v1.0.3 | 同上（`MenuDialog.jsx`） | 最齊：`visibilitychange`＋`focus`＋`online`＋每 30 分鐘 `reg.update()`；`peekRemoteVersion()` 拉 `/index.html`（`no-store`）讀 `meta[name="app-version"]`，提示行顯示「v1.0.1 → v1.0.2」；**3 秒 fallback**；`hadController` 旗標防首次安裝 `clients.claim()` 誤觸發 reload；SW 快取 `vsbook-cache-v1.0.3`（綁版號＋測試守）；**CHANGELOG v1.0.1 有完整驗收實錄**（舊版開→部署新版→切背景再切回→出提示→按「立即更新」→自動重載，毋須刪裝） |

五個 app（含出門玩）**共同點**：manifest `display: standalone`；SW `install` 唔自動 `skipWaiting()`；`message` 收到 `SKIP_WAITING` 先接手；`activate` 清舊快取＋`clients.claim()`；導覽 network-first；更新一律由「有新版本 → 立即更新／稍後」banner 交由用戶決定。即係：**「加主畫面之後，更新隨時換，唔使刪除重裝」呢個體驗已喺 5 個 production app 驗證過。**

**誠實對照（BOOKs 唔係完美樣辦，新 app 照本頁規則做會更嚴）**：

| # | 差異 | 說明 |
|---|---|---|
| 1 | **安裝入口兩條路** | minigame＝`beforeinstallprompt` 掣＋iOS 教學卡（即 I2／I3）；四個 BOOK＝menu 入面靜態雙語教學（冇攔 `beforeinstallprompt`、冇 standalone 自動隱藏偵測）。兩者都滿足「有掣、唔自動彈」；新 app 建議**照 I2／I3**（系統對話框體驗較好），menu 教學當後備位 |
| 2 | **「稍後」記唔記住 worker（UP2）** | minigame 記 `dismissedWorker`，同一 worker 一世唔再彈；四個 BOOK 只係 session 級 `setState(false)`，下次載入又會再 announce（waiting 仲喺度）。**BOOKs 未達 UP2 嚴格版** |
| 3 | **首次安裝唔彈更新** | 全部靠 `navigator.serviceWorker.controller` 有無判斷；VSBOOK 多一個 `hadController` 旗標防 `clients.claim()` 誤觸發 reload；minigame 用 `updateReloading` 旗標。同一原則、兩種寫法，任揀一種都得 |
| 4 | **timeout fallback（UP3）** | 出門玩 **2.5 秒**；SCOUTBOOK／VSBOOK **3 秒**；ROVERBOOK **1.5 秒**；**CUBSBOOK 冇**——CUBSBOOK 呢個係已知缺口，新 app 唔好跟 |
| 5 | **檢查時機（UP4）** | 只有 SCOUTBOOK／VSBOOK 齊足（visibility＋online＋30 分鐘）；ROVERBOOK 用 `pageshow`、冇 online／interval；CUBSBOOK 最少。新 app 照 UP4 三件套＋可加 `focus` |
| 6 | **版號／cache 名同步** | VSBOOK CHANGELOG 明文「四處版號（`package.json`／`APP_VERSION`／`index.html` meta／SW `CACHE_NAME`）一齊遞增＋測試守」；SCOUTBOOK 註解寫 `cache-v4` 但實際係 `v6`——**註解唔準，要靠 checklist／測試兜底**（V 系列） |
| 7 | **圖標／manifest 偏差** | CUBSBOOK 用 `/favicon.svg`；ROVERBOOK maskable 直接指去 `icon-512.png`（冇獨立 maskable-512）。[33](33-icon-standard.md) 仍係唯一標準，BOOKs 唔代表可以鬆手 |
| 8 | **Vercel 部署狀態未核實** | 四個 BOOK 喺 vercel.com 嘅最新 production deployment，本輪**冇法核實**（Vercel connector 連個人帳號讀 projects 被 Access denied，帳號無 teams）——本表只核實到 source（2026-11-12 pinned）與 CHANGELOG |

> ⚠️ **UP5 現況（出門玩）**：banner 文案係「更新之後仍然離線可玩，本機資料與分數會保留。」——**冇**寫「連線房間會斷，重新加入即可」（PeerJS 多人房間係記憶體連線，reload 即斷）。UP5 定案：有連線房間嘅 app，banner 一定要寫呢句；出門玩下次改版要補（見 UP5）。

---

## 1. 規則總表

### 安裝 I1–I8

| ID | 規則 | 一句驗收 |
|---|---|---|
| **I1** | 首頁或 header 要有「加入主畫面」入口；`display-mode: standalone` 或 `navigator.standalone` 時自動隱藏 | standalone 開頁：掣唔見；普通瀏覽器開頁：掣見到 |
| **I2** | Android／Chrome：`beforeinstallprompt` → `preventDefault()` → 存起 event → 用戶按下才 `prompt()`；`appinstalled` 後收起並提示 | 撳掣先彈系統對話框；裝完掣消失＋toast |
| **I3** | iOS／iPadOS：冇 `beforeinstallprompt`，一定要出三步教學卡（Safari 分享⬆ → 加入主畫面 → 加入）；唔准叫人「裝 Chrome」；`Esc`／點背景可關 | iPhone Safari 開頁見到掣，撳開卡，三步關得走 |
| **I4** | 偵測：`matchMedia('(display-mode: standalone)')`、`navigator.standalone`、iOS 判斷（UA 或 `MacIntel` + `maxTouchPoints > 1`） | 兩條路徑（Android／iOS）分開判斷，唔靠估 |
| **I5** | 圖標／manifest 跟 [33](33-icon-standard.md)：9 個 PNG／ICO、maskable 66%、`display: standalone`、`theme_color`／`background_color` 同圖標主色一致 | manifest `standalone`；主題色 = meta `theme-color` |
| **I6** | 文案一句講清「加主畫面＝全螢幕、離線都開得返」；按鈕要 keyboard focus、有 `aria-label` | Tab 撳得到掣；螢幕閱讀器讀到掣用途 |
| **I7** | 驗收：Android Chrome ＋ iOS Safari **真機各一次**（安裝 → 由主畫面開 → 斷網開） | 兩部真機各行一次，記喺 PR／交付單 |
| **I8** | 唔准做：第三方 install widget、自動彈窗、`alert()` | grep 唔到第三方 widget／自動 `prompt()`／`alert(` |

### 更新 UP1–UP5

| ID | 規則 | 一句驗收 |
|---|---|---|
| **UP1** | 新 Service Worker 停在 `waiting`，**唔准自動 `skipWaiting()`**；只有首次安裝（`registration.active` 為空）才可以即刻接手 | 更新時個頁面唔會自己 reload |
| **UP2** | 頁面偵測 `registration.waiting`／`updatefound` → 顯示「有新版本 → 立即更新／稍後」；「稍後」要記住同一個 worker，唔好反覆嘈 | 撳「稍後」之後同一版本唔再彈 banner |
| **UP3** | 一鍵更新：`postMessage({ type: 'SKIP_WAITING' })` → `controllerchange` → `location.reload()`，並加 **2–3 秒 timeout fallback** | 撳「立即更新」→ 自動 reload 入新版 |
| **UP4** | 檢查時機：`visibilitychange`（回到前景）、`online`、每 30 分鐘；唔准背景無限輪詢 | 睇得到三個掛勾；無 `<30` 分鐘輪詢 |
| **UP5** | 資料：reload 前要確保 localStorage／進行中分數已存；文案寫明「連線房間會斷，重新加入即可」 | banner／modal 文案含呢句（有連線房間嘅 app） |

---

## 2. 安裝實作要點

### I1／I4 — 入口位置、standalone 隱藏、偵測

```js
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent || '')
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS 13+ 會扮 Mac
```

- 掣放**首頁或 header**（出門玩放 welcome 區），唔好收埋入選單。
- standalone 開頁：入口**唔顯示**（`showInstallEntry()` 第一行就 `if (isStandalone()) return`）。
- iPadOS 判斷唔可以只靠 UA（UA 寫 `Macintosh`），一定要 `MacIntel + maxTouchPoints > 1`。

### I2 — Android／Chrome：攔住個 event，唔好畀瀏覽器自己彈

```js
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();          // 攔住瀏覽器自彈
  deferredInstallPrompt = event;   // 存起，等用戶按掣
  showInstallEntry();              // 顯示自己嘅掣
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
  showToast('已加入主畫面');
});
// 撳掣嗰陣：
//   if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; }
//   else if (isIos()) { /* 開教學卡 */ }
```

> 另一條路（四個 BOOK 嘅做法，見 §0.1 第 1 點）：menu 入面放「加到手機主畫面」靜態雙語教學（iPhone Safari／Android Chrome 各兩步），完全唔攔 `beforeinstallprompt`。有效，但冇系統對話框體驗；**新 app 建議照 I2**，menu 教學當後備位。

### I3 — iOS／iPadOS：三步教學卡

iOS Safari **完全冇** `beforeinstallprompt`，唯一做法係教學卡：

1. 用 Safari 開啟呢一頁
2. 按底部「分享」⬆
3. 揀「加入主畫面」，再按「加入」

技術要求：`role="dialog"` ＋ `aria-modal="true"` ＋ `aria-labelledby`；`Esc` 關得、點背景關得、右上角／「知道了」掣關得、開卡時 focus 入去（出門玩 focus 去「知道了」掣）。**唔准叫人「裝 Chrome」**——iOS 全系 WebKit，裝 Chrome 一樣要行「分享 → 加入主畫面」，講裝 Chrome 係害人冤枉路。教學卡文案要寫明用 **Safari**。

### I5 — 圖標／manifest（跟 [33](33-icon-standard.md)，唔喺呢度抄）

- 9 個 PNG／ICO（`.ico`／16／32／180／192／512／maskable 192／512／`og-image`），maskable 安全區 **66%**。
- manifest 要 `display: standalone`；`theme_color`／`background_color` 要同圖標主色一致（出門玩實測 `#0b0c10` 兩處 + meta `theme-color` 三者一致）。
- manifest `icons` 至少 `192 any`＋`512 any`＋`maskable`；HTML 要掛 `<link rel="manifest">`。

### I6 — 文案同可達性

- 一句講清：**「加主畫面＝全螢幕、離線都開得返」**（出門玩 iOS 卡底部：「之後從主畫面開啟，就會全螢幕、沒網路也能玩。」）。
- 掣要 `type="button"`、keyboard Tab 撳得到、有可見 focus ring、有 `aria-label`（或掣內文字已講明用途）。
- banner／卡片嘅圖示 `aria-hidden="true"`，文字先係讀屏內容。

### I7 — 真機驗收（唔可以用模擬器代替）

Android Chrome ＋ iOS Safari 各一部，各行一次：**安裝 → 由主畫面開（確認 standalone）→ 斷網開（確認離線可用）**。記喺 PR／交付單。

### I8 — 硬禁

- ❌ 第三方 install widget（任何「一鍵安裝」SaaS／widget script）
- ❌ 自動彈窗（一開頁／定時彈「要唔要安裝？」）
- ❌ `alert()`／`confirm()`／`prompt()` 當提示（用自己嘅 toast／banner）

---

## 3. 更新實作要點

### UP1 — sw.js：首次安裝即刻接手，更新留在 waiting

```js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      // 第一次安裝（未有 active SW）即刻接手；
      // 之後的更新留在 waiting，等用戶按「立即更新」才接手，避免玩到一半被換版。
      .then(() => (self.registration.active ? undefined : self.skipWaiting()))
  );
});

self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SKIP_WAITING') return;
  self.skipWaiting();
});
```

- `install` 裡面**唔准**無條件 `skipWaiting()`；條件永遠係「`registration.active` 為空先可以即刻接手」。
- `activate` 照做：清走舊快取（`keys.filter(k => k !== CACHE_NAME)`）＋ `clients.claim()`。
- sw.js 自己嘅 `APP_VERSION` 要同 `package.json`／`index.html`／`app.js` 一齊改（雙版號，見 [13](13-versioning.md)）；版本號直接入快取名（`pocket-play-v1.2.0`），activate 自動清舊版。

### UP2 — 頁面偵測 waiting，出 banner；「稍後」記住同一個 worker

```js
function showUpdateBanner(worker) {
  if (!updateBanner || !worker || worker === dismissedWorker) return; // 同一個 worker 唔再嘈
  waitingWorker = worker;
  updateBanner.hidden = false;
}
// 註冊後：
if (registration.waiting && navigator.serviceWorker.controller) showUpdateBanner(registration.waiting);
const watch = (worker) => {
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) showUpdateBanner(worker);
  });
};
watch(registration.installing);
registration.addEventListener('updatefound', () => watch(registration.installing));
// 「稍後」：
updateLaterButton.addEventListener('click', () => {
  dismissedWorker = waitingWorker;   // 記住呢個 worker
  updateBanner.hidden = true;
});
```

- 「有新版本 → 立即更新／稍後」兩個掣都要有（banner 結構：`立即更新` ＋ `×`）。
- `navigator.serviceWorker.controller` 為空（首次安裝）**唔應該**出「更新」banner——嗰陣係安裝緊，唔係更新緊（VSBOOK 用 `hadController` 旗標做同一件事）。
- 「稍後」一定要**記住 worker**（`dismissedWorker = waitingWorker`）；四個 BOOK 現況只係 session 級隱藏，下次載入 waiting 仲喺度就再彈——**未達 UP2 嚴格版**，新 app 唔好跟（見 §0.1 第 2 點）。

### UP3 — 一鍵更新：SKIP_WAITING → controllerchange → reload＋timeout fallback

```js
function applyUpdate() {
  if (!waitingWorker) { window.location.reload(); return; }
  updateReloading = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  // 保險：若 controllerchange 沒發生（舊瀏覽器），兩秒半後自己重新載入。
  window.setTimeout(() => window.location.reload(), 2500);
}
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (!updateReloading) return;
  updateReloading = false;
  window.location.reload();
});
```

timeout **2–3 秒**；controllerchange 同 timeout 行邊個都一樣 reload，但 `updateReloading` 旗標確保只 reload 一次。

文案實測樣辦（任揀但一定要講明）：SCOUTBOOK／CUBSBOOK／ROVERBOOK 用「**已下載新版本——按一下即自動重新載入，毋須刪除或重裝 APP**」配掣「立即更新」；VSBOOK 會額外顯示目標版號（「VSBOOK 有新版本可用 · v1.0.2」），做法 = `fetch('/index.html', { cache: 'no-store' })` 讀 `meta[name="app-version"]`（純前端、零依賴、顯示不到就跌回無版號文案，`catch` 吞掉）；出門玩用「有新版本可用／立即更新」＋toast。唔好寫「請刪除 APP 重裝」——加主畫面之後本來就可以隨時換版。

### UP4 — 檢查時機（三個掛勾，唔准無限輪詢）

```js
const checkForUpdate = () => { registration.update().catch(() => {}); };
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate();
});
window.addEventListener('online', checkForUpdate);
window.setInterval(checkForUpdate, 30 * 60 * 1000); // 每 30 分鐘
```

唔准背景無限輪詢（例如 `< 30` 分鐘間隔、或冇 visible 條件嘅 `setInterval`）。

### UP5 — 資料同文案：reload 前存好，文案講明會斷線

- reload 前確保 localStorage／進行中分數已存（出門玩做法：每次變更即寫 localStorage，唔靠離開頁面先寫）。
- banner／confirm 文案要講清：**「連線房間會斷，重新加入即可」**（有多人連線房間嘅 app 必須寫；出門玩現版本文案只寫咗「本機資料與分數會保留」，PeerJS 房間會斷——下次改版要補呢句）。
- 寫「離線可玩、資料保留」之前，先確認個 app 真係做得到，唔好靠估。

---

## 4. 手動驗收清單（本頁無自動檢查，逐項人手做）

> **2026-11-12 核對**：真理倉 `scripts/final_check_v1.0.mjs`／`scripts/repo_health_v1.0.mjs` **目前冇** PWA／SW 相關檢查（只有 `installCommand` 字面比對），所以本節以**人手驗收**代替自動檢查；**唔准為呢個加第三方依賴**。將來若要加自動檢查，直接抄 minigame `tools/verify.mjs` 嘅 `update-flow` 做法（純 `node:fs`＋正則，零依賴）——六個 grep：四個 HTML id（`installAppButton`／`installHelpModal`／`updateBanner`／`updateNowButton`）、`beforeinstallprompt`、`SKIP_WAITING` 送出、`updatefound` 監聽、sw.js 嘅 `SKIP_WAITING` message handler、install 區塊無無條件 `skipWaiting()`。

1. **I7 真機 ×2**：Android Chrome＋iOS Safari，各做「安裝 → 主畫面開 → 斷網開」，結果記喺 PR／交付單。
2. **I1／I4**：standalone 開頁見唔到掣；iPhone（UA 正常）同 iPad（`MacIntel`＋touch）都出到 iOS 教學卡路徑。
3. **I2**：Android 撳掣先出系統對話框（唔係一開頁就彈）；裝完掣消失＋toast「已加入主畫面」。
4. **I3**：iOS 教學卡三步正確（分享⬆ → 加入主畫面 → 加入）；`Esc`／點背景／「知道了」都關得；focus 入咗卡。
5. **I5**：manifest `display: standalone`；`theme_color`＝`background_color`＝HTML meta `theme-color`＝圖標主色；9 個圖標齊（按 [33](33-icon-standard.md) 驗收 5 項）。
6. **I6**：Tab 撳得到安裝掣，focus ring 見到，讀屏讀到掣用途；文案有「全螢幕／離線」意思。
7. **UP1**：改版 deploy 後，舊頁面**唔會**自己 reload；sw.js install 區塊無無條件 `skipWaiting()`。
8. **UP2**：見到「有新版本 → 立即更新／稍後」；撳「稍後」後同一 worker 唔再彈；下一個版本又再彈。
9. **UP3**：撳「立即更新」→ 自動 reload 入新版；模擬 `controllerchange` 唔發生（舊瀏覽器）→ 2–3 秒內都 reload。**驗收實錄範本**（VSBOOK v1.0.1→v1.0.2 實戰）：舊版開啟 → 部署新版 → 切背景再切回 → 出更新提示 → 按「立即更新」→ 自動重載入新版，舊快取清晒，全程冇刪除／重裝 APP。
10. **UP4**：`visibilitychange`／`online`／30 分鐘三個掛勾都在；無更頻繁輪詢。
11. **UP5**：reload 後 localStorage 資料／進行中分數仲在；有連線房間嘅 app，banner 文案有「連線房間會斷，重新加入即可」。

---

## 5. 反模式速查

- ❌ 瀏覽器自彈安裝提示（冇 `preventDefault()`）
- ❌ 一開頁／定時自動彈安裝窗
- ❌ `sw.js` install 無條件 `skipWaiting()`（玩到一半偷換版）
- ❌ 「稍後」之後每 `visibilitychange` 都再彈同一個 banner
- ❌ 第三方 install widget／`alert()` 當提示
- ❌ iOS 叫用戶「裝 Chrome／裝其他瀏覽器」
- ❌ 更新檢查 `< 30` 分鐘無限輪詢
- ❌ 更新文案講「資料保留」但實際 localStorage 寫入未完成就 reload

---

## 未做／限制

- **冇自動化真機驗收**（I7 一律人手；iOS Simulator／Android Emulator 唔算數）。
- **UP5 連線房間文案係定案要求**；出門玩 v1.2.0 現文案未寫（見 §0.1），唔代表呢條豁免。
- **四個 BOOK 嘅 PWA 實作只核對到 source**（2026-11-12 pinned）同 CHANGELOG，**未喺真機實測過佢哋嘅安裝／更新流程**；佢哋 Vercel 最新 production deployment 因 connector 權限（Access denied）**未核實**——「已部署」只屬源碼＋CHANGELOG 聲稱。
- **四個 BOOK 未完全達本頁規則**：安裝入口只係 menu 靜態教學（冇 `beforeinstallprompt`、冇 standalone 自動隱藏，未達 I1／I2 嚴格版）；「稍後」只係 session 級記住（未達 UP2 嚴格版）；CUBSBOOK 冇 timeout fallback（未達 UP3）；CUBSBOOK／ROVERBOOK 檢查時機未齊（未達 UP4）。本頁規則比佢哋嚴係刻意。
- **本頁 I／UP 規則冇入 guard／final_check／repo_health**（2026-11-12 核對呢三支 script 都冇 PWA／SW 檢查）；要加自動檢查嘅話照 §4 引用嘅 minigame `update-flow` 做法，零依賴。
- 真理倉未有任何「PWA 最低要求」的 CI 硬擋；I／UP 同 [44](44-bilingual-ui.md) 一樣屬人工判斷＋人手驗收，唔係 S/F/A/W/V 嗰種 CI 硬擋。
- 只引用 [33](33-icon-standard.md)／[13](13-versioning.md)／[44](44-bilingual-ui.md)，三份都**冇改**。
