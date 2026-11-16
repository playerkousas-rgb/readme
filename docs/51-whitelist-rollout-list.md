# 51 — 白名單上線清單（全 repo 掃描・2026-11-15）

> **用途**：回答「邊啲 App 可以現在就加白名單」。**唔係靠估**：下表由 GitHub API 逐個 repo 掃 `git/trees` ＋讀入口檔 grep `localStorage|indexedDB|safeStore` 得出。
> **掃描範圍**：`playerkousas-rgb` 全部 95 個 repo，其中 **69 個有公開網址**（其餘係非網站 repo 或未部署）。
> **⚠️ 掃描限制（必須由該 App 嘅 AGENT 覆核）**：① 「本機儲存痕跡」只 grep 根目錄入口檔（`index.html`／`src/main.*`／`src/App.*`／`app/page.tsx`），深層檔案可能漏；② 「`/api` 數」＝路徑開頭符合 `api/`、`pages/api/`、`app/api/`、`src/api/`、`server/` 嘅檔案數，含非 serverless 檔；③ **冇掃** Web Push、`SameSite` Cookie、相機／GPS 權限、`beforeinstallprompt`。所以每隻 App 仍要行 [`WHITELIST-HANDOFF.md`](../templates/repo-starter/WHITELIST-HANDOFF.md) 6 條問題。

---

## 0. 先修正一個說法

你問「係唔係在所有**沒有後台**、**不是本機儲存**的 App 加白名單」——方向對，但條件要補齊。`iframe`／白名單嘅**五類禁區**（SG2）任何一項中咗都唔可以用 `iframe-only`：

1. 本機儲存（`localStorage`／`IndexedDB`）要跨日保留
2. PWA 加入主畫面
3. Web Push
4. 登入 Session Cookie（`SameSite=Lax`）
5. 相機／GPS／Wake Lock／剪貼板等權限

**但注意**：以上五項只係**禁止用 `iframe-only`**，**唔係禁止加白名單**。要加白名單一律用**頂層 `entry-gate`**（零影響，見 [50 §3.2](50-app-store-whitelist-and-shutdown.md)）。所以真正嘅問題係：

> **邊啲 App 可以「第一批」加，風險最低？** → 下表 A 組。

---

## 1. A 組：第一批可以即做（無 `/api`、無明顯本機儲存）— 35 個

條件：`api=0` 且 `本機儲存痕跡=0`。用 `mode: 'entry-gate'` ＋ `portalIds: ['appstore']`（或四入口）即可，**風險最低**。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 |
|---|:--:|:--:|:--:|:--:|:--:|
| `Aircraft-Encyclopedia` | https://aircraft-encyclopedia-web.vercel.app | 0 | 1 | 0 | 0 |
| `AYP` | https://ayp-eight.vercel.app | 0 | 1 | 1 | 0 |
| `BP` | https://bp-nine-beryl.vercel.app | 0 | 1 | 0 | 0 |
| `card` | https://card-git-arena-01a0f5ad-card-playerkousas-rgbs-projects.vercel.app | 0 | 0 | 0 | 0 |
| `course` | https://course-six-coral.vercel.app | 0 | 0 | 0 | 0 |
| `CUBSGAME` | https://cubsgame.vercel.app | 0 | 1 | 1 | 0 |
| `cubsmeeting` | https://cubsmeeting.vercel.app | 0 | 1 | 1 | 0 |
| `dbs` | https://dbs-teal-iota.vercel.app | 0 | 0 | 0 | 0 |
| `doll` | https://doll-ivory.vercel.app | 0 | 0 | 0 | 0 |
| `drawtheroute` | https://drawtheroute-yd8p.vercel.app | 0 | 0 | 0 | 1 |
| `forward` | https://forward-black.vercel.app | 0 | 0 | 0 | 0 |
| `GAME` | https://game-blond-nu.vercel.app | 0 | 1 | 1 | 0 |
| `ghmeeting` | https://ghmeeting.vercel.app | 0 | 1 | 1 | 0 |
| `hkcamping` | https://hkcamping.vercel.app | 0 | 1 | 0 | 1 |
| `HKMAP` | https://hkmap.vercel.app | 0 | 0 | 1 | 0 |
| `Icon-Maker` | https://icon-maker-tau.vercel.app | 0 | 0 | 0 | 0 |
| `knotmaster` | https://knotmaster.vercel.app | 0 | 0 | 0 | 1 |
| `map3d` | https://map3d-chi.vercel.app | 0 | 1 | 0 | 0 |
| `MCScript` | https://mc-script.vercel.app | 0 | 0 | 0 | 0 |
| `minigame` | https://minigame-one-red.vercel.app | 0 | 1 | 1 | 1 |
| `mirror` | https://mirror-ten-sand.vercel.app | 0 | 0 | 0 | 0 |
| `photo-edit` | https://photo-edit-vert.vercel.app | 0 | 0 | 0 | 0 |
| `Photo-Prep` | https://photo-prep-eight.vercel.app | 0 | 0 | 0 | 0 |
| `pioneer` | https://pioneer-ecru.vercel.app | 0 | 0 | 0 | 0 |
| `router` | https://router-gold.vercel.app | 0 | 0 | 0 | 0 |
| `scoutdesign` | https://scoutdesign.vercel.app | 0 | 0 | 0 | 1 |
| `scoutmeeting` | https://scoutmeeting.vercel.app | 0 | 1 | 1 | 0 |
| `skw-radar-hunt2` | https://skw-radar-hunt2.vercel.app | 0 | 1 | 0 | 1 |
| `skw-score` | https://skw-score.vercel.app | 0 | 0 | 0 | 1 |
| `skw-tracking-signs` | https://skw-tracking-signs-8r55.vercel.app | 0 | 1 | 0 | 0 |
| `troop-router` | https://troop-router.vercel.app | 0 | 0 | 0 | 0 |
| `upgrade` | https://upgrade-ashen.vercel.app | 0 | 1 | 0 | 0 |
| `Veritas` | https://veritas-delta-seven.vercel.app | 0 | 0 | 0 | 0 |
| `voice_slide_web` | https://voice-slide-web.vercel.app | 0 | 0 | 0 | 0 |
| `vsmeeting` | https://vsmeeting.vercel.app | 0 | 1 | 1 | 0 |

> **直接可用嘅指令**：[`templates/repo-starter/A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md)（複製即貼去該 App 對話，只需改 `<APPKEY>`）。
> 建議第一批先揀 3–5 個試（例如 `Aircraft-Encyclopedia`、`Icon-Maker`、`Photo-Prep`、`router`、`voice_slide_web`），真機驗一次再批次做。**有 `SW=1` 嘅**（`AYP`／`CUBSGAME`／`GAME`／`cubsmeeting`／`ghmeeting`／`scoutmeeting`／`vsmeeting`／`HKMAP`）要先確認個 Service Worker 係做離線快取定 Push 訂閱。

## 2. B 組：可以加，但要 `allowStandalone` 先做（本機儲存明顯）— 6 個

`entry-gate` **一樣零影響**（儲存喺子站自己 origin），但一定要：① `allowStandalone: true`；② 確認有備份／匯出功能；③ 唔可以用 `iframe-only`。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 |
|---|:--:|:--:|:--:|:--:|:--:|
| `CERT` | https://cert-tan.vercel.app | 0 | 0 | 0 | 5 |
| `decode` | https://decode-sandy-eight.vercel.app | 0 | 0 | 0 | 4 |
| `morse-beacon-app` | https://morse-beacon-app.vercel.app | 0 | 1 | 1 | 16 |
| `Orienteering` | https://orienteering-tan.vercel.app | 0 | 0 | 1 | 11 |
| `scoutworld` | https://scoutworld.vercel.app | 0 | 1 | 1 | 14 |
| `Zentangle-Pattern-Generator` | https://zentangle-pattern-generator.vercel.app | 0 | 1 | 0 | 8 |

## 3. C 組：有 `/api` 或屬 4 本紀錄冊 — 最後做，要逐個判斷 — 24 個

有後端就要考慮「`entry-gate` 只擋前端，`/api` 仍然開得」。按你嘅定案（SG12）**唔需要**起簽票基建，但要：
- 若 `/api` 只係 proxy／統計 → 可以直接 `entry-gate`；
- 若 `/api` 會寫入／有成本 → 先確認後端自己有冇把關，再決定。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 |
|---|:--:|:--:|:--:|:--:|:--:|
| `AvianDex` | https://avian-dex.vercel.app | 3 | 2 | 1 | 3 |
| `birddex3` | https://birddex3.vercel.app | 1 | 1 | 0 | 0 |
| `cardmaster` | https://cardmaster-pi.vercel.app | 2 | 0 | 0 | 0 |
| `code` | https://code-zeta-beryl.vercel.app | 8 | 0 | 1 | 0 |
| `cubsbadge` | https://cubsbadge.vercel.app | 14 | 0 | 0 | 28 |
| `CUBSBOOK` | https://cubsbook.vercel.app | 2 | 1 | 1 | 0 |
| `dbs3.0` | https://districtbadgesystem30.vercel.app | 2 | 0 | 0 | 0 |
| `DGA` | https://dga-five.vercel.app | 1 | 0 | 0 | 4 |
| `event` | https://event-zeta-sage.vercel.app | 1 | 0 | 0 | 2 |
| `HM20C` | https://hm20c.vercel.app | 7 | 1 | 0 | 1 |
| `roverbadge` | https://roverbadge.vercel.app | 8 | 1 | 0 | 27 |
| `ROVERBOOK` | https://roverbook.vercel.app | 5 | 1 | 1 | 0 |
| `scout-admin` | https://scout-admin-blue.vercel.app | 2 | 0 | 0 | 11 |
| `SCOUT3D` | https://scout3d-gamma.vercel.app | 2 | 1 | 0 | 2 |
| `scoutapp` | https://scoutapp-vico.vercel.app | 1 | 1 | 0 | 0 |
| `scoutbadge` | https://scoutbadge.vercel.app | 3 | 0 | 0 | 28 |
| `SCOUTBOOK` | https://scoutbook-five.vercel.app | 2 | 1 | 1 | 0 |
| `skw-birdex2` | https://skw-birdex2.vercel.app | 1 | 1 | 0 | 0 |
| `troop-attendance` | https://troop-attendance.vercel.app | 3 | 0 | 0 | 4 |
| `troop-camera` | https://troop-camera.vercel.app | 14 | 1 | 1 | 0 |
| `troop-portal` | https://troop-portal.vercel.app | 4 | 0 | 0 | 3 |
| `vs_portal` | https://vs-portal-pi.vercel.app | 10 | 1 | 0 | 0 |
| `vsbadge` | https://vsbadge.vercel.app | 6 | 0 | 0 | 30 |
| `VSBOOK` | https://vsbook-sand.vercel.app | 2 | 1 | 1 | 0 |

## 4. D 組：入口本體，**唔可以**加閘（SG8）

| Repo | 角色 | 原因 |
|---|---|---|
| `website` | 1. APP STORE（`main`） | 主站；加閘等於全生態斷路 |
| `scout-circulars` | 2. 圖書館（`feed`） | **載住 Push 訂閱**，必須維持 `open`（SG10-a） |
| `member-portal` | 3. 成員系統（`internal`） | 自己就係入口 |
| `scout-district-portal` | 4. 區管理系統（`internal`） | 自己就係入口 |
| GEMINI | 5. Canvas 派發線 | 托管喺 Google，我哋改唔到 header（SG16）＋同 Vercel 子 App 零關係，唔會做佢哋入口（SG17） |

## 5. 未列入：非網站 repo（約 26 個）

`AGENT`、`Materials`、`PPTMAKER`、`answer`、`api`、`bookkeeping`、`ceremony`、`cubs_portal`、`gh_portal`、`gitlink`、`MD`、`onlinegame`、`rs_portal`、`rsmeeting`、`sc_portal`、`troop_portal`、`Veritas-Project`、`veritas2`、`scout-survival-tin`、`oneclick-photo` 等——冇 `homepageUrl`，即係冇部署入口頁，暫時冇需要加白名單。

---

## 6. 每個 App 嘅實作（唔需要再問）

抄 [`templates/vercel/store_gate_v1.0.js`](../templates/vercel/store_gate_v1.0.js)，喺 `index.html` `<head>` 最頂：

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: '<repo-name-lowercase>',   // 每個 app 獨立前綴
    mode: 'entry-gate',
    portalIds: ['appstore'],           // ＝DEFAULT_PORTAL_IDS（SG17）。第一批只認 APP STORE，
                                       //   唔使問任何人；library 要等入口改好 noreferrer 才可加，
                                       //   member／district 唔做 App 目錄、gemini 永遠唔入
    allowStandalone: true,             // B 組必開；A 組亦建議開（免費保險）
  });
</script>
```

## 7. 要唔要「先同兩個大入口講」？→ 只有一件事要動（SG17）

> **答案：唔使逐個入口打招呼。** 詳情規則見 [50 §3.10](50-app-store-whitelist-and-shutdown.md) ＋ **SG17**。五個入口嘅入場條件唔同，只有一個要改一行代碼：

| 入口 | 要唔要事先處理 | 對 A／B 組 App 嘅影響 |
|---|:--:|---|
| **1. APP STORE** | ❌ **唔使** —— 佢本來就係預設入口（`DEFAULT_PORTAL_IDS`）；分享／QR 亦只由佢產生（SG9） | **每一隻都要寫** `portalIds: ['appstore']` |
| **2. 圖書館** | ⚠️ **要，但只需一次**：`scout-circulars/index.html` L5662 小工具掣 `rel="noopener noreferrer"` → `rel="${isTool ? 'noopener' : 'noopener noreferrer'}"`。**Push／統計／通告流程一律唔准動**（SG10-a） | 改完之後，逐隻 App 自己決定加唔加 `library`；**A 組第一批唔加**（只認 APP STORE），所以第 1 批完全唔受影響 |
| **3. 成員系統** | ❌ **唔使** —— 實查 `app/page.tsx` 只連 `/books`（4 本 BOOK）、通告圖書館、`districtbadgesystem30`、`scoutappstore`；**唔做 App 目錄** | 預設唔加。唯一例外＝4 本 `BOOK`（本身喺 C 組，BOOK 管制宜寬鬆，維持 `['appstore']` 已夠） |
| **4. 區管理系統** | ❌ **唔使** —— 卡片／`/embed`／`/links` 只連自家 `builtin` 系統 | 預設唔加 |
| **5. GEMINI** | ❌ **唔使，亦唔可以** —— 另一套系統、同 Vercel 子 App 零關係 | 永遠唔會放入 `portalIds`（程式剔除） |

**所以「打招呼」呢一步唔存在**；真正要做嘅只有兩件：① **APP STORE 加 `?app=<slug>`**（下面第 0 步，為咗分享／QR，唔係為白名單）② **圖書館改 L5662 一行**（如果你要放圖書館入場）。兩件都係**機器層面**，唔需要同「入口嘅 AGENT」開會；成員系統／區管理系統／Gemini 更加唔關事。

---

## 8. 建議執行次序

| 批次 | 內容 | 為咩 |
|:--:|---|---|
| **第 0 步** | 喺 APP STORE 加 `?app=<slug>` 深層連結，並把分享／QR／卡片 href 由 `app.url` 改指 APP STORE（[50 §4.4-6](50-app-store-whitelist-and-shutdown.md)）。**可直接貼嘅指令：[`templates/repo-starter/APP-STORE-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-INSTRUCTION.md)**（已列明 11 個實查位置） | **唔做呢步，一開閘分享連結就全部撞卡**（SG9-a）。**唔需要問任何入口**——APP STORE 本來就係預設入口（SG17） |
| **第 1 批** | A 組揀 3–5 個 | 驗證流程，風險最低 |
| **第 2 批** | A 組其餘全部 | 批量複製。**同時間可選做**：圖書館改 L5662 一行（`noreferrer`），之後仍要逐隻 App 自己決定加唔加 `library` |
| **第 3 批** | B 組（確認備份功能後） | 有儲存，要小心 |
| **第 4 批** | C 組逐個判斷 | 有 `/api`，要睇後端 |
| **永遠唔做** | D 組入口本體 | 會鎖死自己（SG8） |

> **第 0 步要貼嘅訊息**：[`APP-STORE-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-INSTRUCTION.md)（APP STORE 對話用）；第 1／2 批（A 組）用 [`A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md)。
