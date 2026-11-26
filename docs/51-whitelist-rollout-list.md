# 51 — 白名單上線清單（全 repo 掃描・2026-11-15）

> **2026-11-26 加 §0.1**：用 `gh` 實查**邊個 repo 真係已經接咗閘**（唔係靠估、唔係靠舊清單）。結果：68 個有網址 repo 之中 **21 個已接閘、43 個未接、4 個屬入口本體唔可以接**。舊清單漏咗 8 個（原因見 §0.1「掃描陷阱」）。
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

## 0.1 2026-11-26 實查：邊個 repo **真係**已經接咗閘（`gh` 逐個核，唔係靠估）

**查法（可以照做，兩分鐘）**：

```bash
gh api -X GET search/code -f q='initStoreGate user:playerkousas-rgb' -f per_page=100   # ① 全帳戶搜呼叫
gh api repos/playerkousas-rgb/<repo>/git/trees/main?recursive=1                        # ② 搵入口檔
gh api repos/playerkousas-rgb/<repo>/contents/<入口檔>                                  # ③ 讀 mode／portalIds
```

**⚠️ 掃描陷阱（今次真係撞到，所以舊清單漏咗 8 個）**：

1. **入口檔唔一定係根 `index.html`**：`Aircraft-Encyclopedia`／4 本 BOOK 喺 `web/`；`router`／`troop-attendance` 喺 `public/`；`HKMAP` 喺 `js/entry_v1.1.0.js`；`map3d` 喺 `public/store_gate_map3d_init.js`；`minigame` 喺 `store_gate_config_v1.3.0.js`。
2. **檔案 >1MB code search 索引唔到**：`mirror` 嘅 `index.html` 2.7MB，`contents` API 亦回唔到內容，要用 `git/blobs` 讀 → **唔查就以為佢冇閘**。
3. **「有 `store_gate_v1.0.js` 檔」≠「有閘」**：要見到 `<script>` 載入 **＋** `initStoreGate({…})` 呼叫先算。
4. 只查 `main` 分支同 repo 源碼；**未喺 live URL 驗**（今次網絡只通 GitHub），亦未計 production env（`birddex3`／2 本 BOOK 用 `IS_PRODUCTION`／`localDev` 分支決定 `mode`，本機 build 會變 `open`，屬正常）。

### A. 已接閘 21 個（✅ 有呼叫、mode = `entry-gate`、`portalIds: ['appstore']`；有寫 `silentPortalIds: ['library']` 嘅另標）

| 組 | Repo | 入口檔（實查） | 備註 |
|:--:|---|---|---|
| A | `Aircraft-Encyclopedia` | `web/index.html` | 示範倉；SG18 讚好掣參考實作 |
| A | `AYP` | `index.html` | |
| A | `drawtheroute` | `index.html` | |
| A | `hkcamping` | `index.html` | |
| A | `HKMAP` | `js/entry_v1.1.0.js` | 唔喺根 `index.html` |
| A | `map3d` | `public/store_gate_map3d_init.js` | 獨立 init 檔 |
| A | `minigame` | `store_gate_config_v1.3.0.js` | 經 `STORE_GATE_CONFIG.mode` |
| A | `mirror` | `index.html`（2.7MB） | 大檔，要 `git/blobs` 先讀到 |
| A | `skw-radar-hunt2` | `index.html` | |
| A | `skw-tracking-signs` | `index.html` | |
| A | `upgrade` | `index.html` | |
| B | `scoutworld` | `index.html` | 有 SW，`allowStandalone: true` |
| B | `Zentangle-Pattern-Generator` | `index.html` | |
| C | `AvianDex` | `index.html` | 有 `/api`，前端閘唔等於後端閘 |
| C | `birddex3` | `index.html` | `IS_PRODUCTION ? 'entry-gate' : 'open'` |
| C | `CUBSBOOK` | `web/index.html` | |
| C | `HM20C` | `index.html` | |
| C | `ROVERBOOK` | `web/index.html` | `localDev ? 'open' : 'entry-gate'` |
| C | `SCOUT3D` | `index.html` | |
| C | `SCOUTBOOK` | `web/index.html` | 同上 |
| C | `VSBOOK` | `web/index.html` | |

### B. 未接閘 43 個（有網址、可以接、但實查**冇** `initStoreGate` 呼叫）

| 組 | Repo（逐個都要做） | 小計 |
|:--:|---|:--:|
| **A**（風險最低） | `BP`、`card`、`course`、`CUBSGAME`、`cubsmeeting`、`dbs`、`doll`、`forward`、`GAME`、`ghmeeting`、`Icon-Maker`、`knotmaster`、`MCScript`、`photo-edit`、`Photo-Prep`、`pioneer`、`router`、`scoutdesign`、`scoutmeeting`、`skw-score`、`troop-router`、`Veritas`、`voice_slide_web`、`vsmeeting` | **24** |
| **B**（有本機儲存） | `CERT`、`decode`、`morse-beacon-app`、`Orienteering` | **4** |
| **C**（有 `/api`／紀錄冊） | `cardmaster`、`code`、`cubsbadge`、`dbs3.0`、`DGA`、`event`、`roverbadge`、`scout-admin`、`scoutapp`、`scoutbadge`、`troop-attendance`、`troop-camera`、`troop-portal`、`vs_portal`、`vsbadge` | **15** |

> `skw-birdex2` 仍在 repo 清單但**冇 `homepageUrl`（未部署）**，所以唔計入 68；部署之後再按同一個流程查。

### C. 永遠唔加閘 4 個（入口本體，SG8）

`website`（APP STORE）、`scout-circulars`（圖書館）、`member-portal`（成員系統）、`scout-district-portal`（區管理系統）。GEMINI 係 private repo／自己部署，亦屬入口，**唔會幫佢加閘**。

> **對數**：91 個 public repo − 23 個冇網址 = 68 → 21 已接 ＋ 43 未接 ＋ 4 入口 = 68 ✅
> **下一步**：未接嘅 43 個照 §6 三行改；但如果你打算行「登記制」（[docs/61](61-registration-gate-and-single-session.md)），**先做中心 P0，再一次過改**，唔好改完白名單又改登記閘（每個 app 要開兩次工）。

---

## 1. A 組：第一批可以即做（無 `/api`；本機儲存只限介面偏好／小遊戲分數）— 35 個

條件：`api=0`。用 `mode: 'entry-gate'` ＋ `portalIds: ['appstore']` ＋ **`silentPortalIds: ['library']`**（SG19，攔截卡只出一粒掣）即可，**風險最低**。

> **2026-11-21 定案**：SG18「讚好／收藏」掣係**所有新 App 必做**（唔分 A／B／C 組），唔單止 A 組照抄航空圖鑑嘅做法——見 [60](60-future-apps-support-button.md)。

> **2026-11-17 修正**：本節舊標題寫「無明顯本機儲存」，但**表內有 7 行 `本機儲存痕跡=1`**（`drawtheroute`／`hkcamping`／`knotmaster`／`scoutdesign`／`skw-radar-hunt2`／`skw-score`／`minigame`）—— 標題同表格前後唔一致。已改為「本機儲存只限介面偏好／小遊戲分數」：呢 7 隻用 `entry-gate` ＋ `allowStandalone: true` 一樣安全（唔用 `iframe` 就唔會令儲存分家），但**要按 WHITELIST-HANDOFF Q1 停機規則逐隻問**（若涉及用家自建重要紀錄而冇備份 → 停手）。

> **2026-11-26 更新（以 §0.1 為準）**：下表「狀態」欄係 2026-11-15 掃描時嘅快照；**現時真實狀態睇 §0.1-A**——A 組已完成 11 個（`Aircraft-Encyclopedia`／`AYP`／`drawtheroute`／`hkcamping`／`HKMAP`／`map3d`／`minigame`／`mirror`／`skw-radar-hunt2`／`skw-tracking-signs`／`upgrade`），**剩 24 個未做**。下面「⬜ 待做」唔再逐行改，免得兩份清單各講一套。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 | 狀態 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `Aircraft-Encyclopedia` | https://aircraft-encyclopedia-web.vercel.app | 0 | 1 | 0 | 0 | ✅ **已完成** |
| `AYP` | https://ayp-eight.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `BP` | https://bp-nine-beryl.vercel.app | 0 | 1 | 0 | 0 | ⬜ 待做 |
| `card` | https://card-git-arena-01a0f5ad-card-playerkousas-rgbs-projects.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `course` | https://course-six-coral.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `CUBSGAME` | https://cubsgame.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `cubsmeeting` | https://cubsmeeting.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `dbs` | https://dbs-teal-iota.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `doll` | https://doll-ivory.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `drawtheroute` | https://drawtheroute-yd8p.vercel.app | 0 | 0 | 0 | 1 | ⬜ 待做 |
| `forward` | https://forward-black.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `GAME` | https://game-blond-nu.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `ghmeeting` | https://ghmeeting.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `hkcamping` | https://hkcamping.vercel.app | 0 | 1 | 0 | 1 | ⬜ 待做 |
| `HKMAP` | https://hkmap.vercel.app | 0 | 0 | 1 | 0 | ⬜ 待做 |
| `Icon-Maker` | https://icon-maker-tau.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `knotmaster` | https://knotmaster.vercel.app | 0 | 0 | 0 | 1 | ⬜ 待做 |
| `map3d` | https://map3d-chi.vercel.app | 0 | 1 | 0 | 0 | ⬜ 待做 |
| `MCScript` | https://mc-script.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `minigame` | https://minigame-one-red.vercel.app | 0 | 1 | 1 | 1 | ⬜ 待做 |
| `mirror` | https://mirror-ten-sand.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `photo-edit` | https://photo-edit-vert.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `Photo-Prep` | https://photo-prep-eight.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `pioneer` | https://pioneer-ecru.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `router` | https://router-gold.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `scoutdesign` | https://scoutdesign.vercel.app | 0 | 0 | 0 | 1 | ⬜ 待做 |
| `scoutmeeting` | https://scoutmeeting.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |
| `skw-radar-hunt2` | https://skw-radar-hunt2.vercel.app | 0 | 1 | 0 | 1 | ⬜ 待做 |
| `skw-score` | https://skw-score.vercel.app | 0 | 0 | 0 | 1 | ⬜ 待做 |
| `skw-tracking-signs` | https://skw-tracking-signs-8r55.vercel.app | 0 | 1 | 0 | 0 | ⬜ 待做 |
| `troop-router` | https://troop-router.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `upgrade` | https://upgrade-ashen.vercel.app | 0 | 1 | 0 | 0 | ⬜ 待做 |
| `Veritas` | https://veritas-delta-seven.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `voice_slide_web` | https://voice-slide-web.vercel.app | 0 | 0 | 0 | 0 | ⬜ 待做 |
| `vsmeeting` | https://vsmeeting.vercel.app | 0 | 1 | 1 | 0 | ⬜ 待做 |

> **直接可用嘅指令**：[`templates/repo-starter/A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md)（複製即貼去該 App 對話，只需改 `<APPKEY>`、`<SLUG>`、`<REPO名>`）。
> **✅ 已完成示範倉（2026-11-17）：`Aircraft-Encyclopedia`** —— `v0.36.0` 接入白名單（`mode: 'entry-gate'`、`portalIds: ['appstore']`、`allowStandalone: true`，HEAD `050951f5`）；`v0.37.0` 加 SG18 一鍵返回 APP STORE 讚好／收藏（頂欄 `#storeSupportTop` ＋ 頁尾 `#storeSupportBar`，零 Supabase 請求、零寫死網址、中英同步、列印自動隱藏）。**其餘未做嘅照抄佢嘅結構即可（2026-11-26 實查：A 組已完成 11 個、剩 24 個，見 §0.1-A／B）。2026-11-21 起，呢個示範倉係全 App 必做 SG18 嘅參考 implementation（見 [60](60-future-apps-support-button.md)）。**
> 建議第一批先揀 3–5 個試（例如 `Icon-Maker`、`Photo-Prep`、`router`、`voice_slide_web`），真機驗一次再批次做。**有 `SW=1` 嘅**（`AYP`／`CUBSGAME`／`GAME`／`cubsmeeting`／`ghmeeting`／`scoutmeeting`／`vsmeeting`／`HKMAP`）要先確認個 Service Worker 係做離線快取定 Push 訂閱。

### 1.1 A 組 slug 對照（**落閘前必須核實**，SG18 靠佢）

`<slug>` 唯一真源＝`playerkousas-rgb/website` 嘅 [`migrations/20261116-app-slug-seed.sql`](https://github.com/playerkousas-rgb/website/blob/main/migrations/20261116-app-slug-seed.sql)（或主站 `apps.slug`）。**嚴禁靠 repo 名猜。**

| Repo | 正式 host | `slug` |
|---|---|---|
| `Aircraft-Encyclopedia` | aircraft-encyclopedia-web.vercel.app | `aircraft-encyclopedia` |
| `AYP` | ayp-eight.vercel.app | `ayp` |
| `BP` | bp-nine-beryl.vercel.app | `bp` |
| `course` | course-six-coral.vercel.app | `course` |
| `CUBSGAME` | cubsgame.vercel.app | `cubsgame` |
| `cubsmeeting` | cubsmeeting.vercel.app | `cubsmeeting` |
| `dbs` | dbs-teal-iota.vercel.app | `dbs` |
| `doll` | doll-ivory.vercel.app | `doll` |
| `drawtheroute` | drawtheroute-yd8p.vercel.app | `drawtheroute` |
| `forward` | forward-black.vercel.app | `forward` |
| `GAME` | game-blond-nu.vercel.app | `game` |
| `ghmeeting` | ghmeeting.vercel.app | `ghmeeting` |
| `hkcamping` | hkcamping.vercel.app | `hkcamping` |
| `HKMAP` | hkmap.vercel.app | `hkmap` |
| `Icon-Maker` | icon-maker-tau.vercel.app | `icon-maker` |
| `knotmaster` | knotmaster.vercel.app | `knotmaster` |
| `map3d` | map3d-chi.vercel.app | `map3d` |
| `MCScript` | mc-script.vercel.app | `mcscript` |
| `minigame` | minigame-one-red.vercel.app | `minigame` |
| `mirror` | mirror-ten-sand.vercel.app | `mirror` |
| `photo-edit` | photo-edit-vert.vercel.app | `photo-edit` |
| `Photo-Prep` | photo-prep-eight.vercel.app | `photo-prep` |
| `pioneer` | pioneer-ecru.vercel.app | `pioneer` |
| `router` | router-gold.vercel.app | `router` |
| `scoutmeeting` | scoutmeeting.vercel.app | `scoutmeeting` |
| `skw-tracking-signs` | skw-tracking-signs-8r55.vercel.app | `skw-tracking-signs` |
| `troop-router` | troop-router.vercel.app | `troop-router` |
| `upgrade` | upgrade-ashen.vercel.app | `upgrade` |
| `voice_slide_web` | voice-slide-web.vercel.app | `voice-slide-web` |
| `vsmeeting` | vsmeeting.vercel.app | `vsmeeting` |

#### ✅ 已證實：`appSlug()` **有 `_id` fallback**（2026-11-18 實查 `website` `bd721421`）

```js
// app.js L73-76
function appSlug(app) {
  if (!app) return "";
  return String(app.slug || app._id || "").trim();   // ← 冇 slug 就用 _id
}
```

**結論改寫**（之前寫「缺 slug 只會去首頁」係**未證實嘅推測**，實查後**唔成立**）：

| 情況 | 實際結果 |
|---|---|
| 有 `slug` | `?app=<slug>`（短、穩定、可讀） |
| **冇 `slug`，有 `_id`** | `?app=<uuid>` —— **照樣開得到該 App 詳情卡**，唔會去首頁 |
| 冇 slug 又冇 `_id` | 才退回首頁（`appDeepLink()` L81 嘅 `: STORE_ORIGIN + '/'`） |

所以缺 slug 嘅嚴重程度由「舊版以為嘅功能失效」降為「連結難睇／不穩定」：
- ✅ **唔會**阻住落閘
- ⚠️ 但 `?app=<uuid>` 係 Supabase 內部 id，如果日後換 DB／重建 record 就會斷；而且 SG18 個 ❤️ 掣會攞到一條 36 字元 UUID 嘅網址
- 📌 **建議**（唔急）：照樣補齊，但**唔係落閘嘅前置條件**

| Repo | 正式 host | 建議 slug |
|---|---|---|
| `card` | ⚠️ 現時 homepage 係 git branch 預覽 `card-git-arena-…`，**要另外確認 production 網域** | `card` |
| `scoutdesign` | scoutdesign.vercel.app | `scoutdesign` |
| `skw-radar-hunt2` | skw-radar-hunt2.vercel.app | `skw-radar-hunt2` |
| `skw-score` | skw-score.vercel.app | `skw-score` |
| `Veritas` | veritas-delta-seven.vercel.app | `veritas` |

> ⚠️ `card` 仲有一個獨立問題：`apps.url` 如果真係指向 branch 預覽網址，**白名單會認錯 origin**（預覽網址每次 push 都變）。落閘前必須確認 `apps.url` 係穩定 production 網域 —— 呢個同 slug **無關**，係更嚴重嘅問題。

## 2. B 組：可以加，但要 `allowStandalone` 先做（本機儲存明顯）— 6 個

> **2026-11-26 實查**：`scoutworld`、`Zentangle-Pattern-Generator` **已接閘**；`CERT`、`decode`、`morse-beacon-app`、`Orienteering` 未接（見 §0.1）。

`entry-gate` **一樣零影響**（儲存喺子站自己 origin），但一定要：① `allowStandalone: true`；② 確認有備份／匯出功能；③ 唔可以用 `iframe-only`。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 |
|---|:--:|:--:|:--:|:--:|:--:|
| `CERT` | https://cert-tan.vercel.app | 0 | 0 | 0 | 5 | ⬜ 待做 |
| `decode` | https://decode-sandy-eight.vercel.app | 0 | 0 | 0 | 4 | ⬜ 待做 |
| `morse-beacon-app` | https://morse-beacon-app.vercel.app | 0 | 1 | 1 | 16 | ⬜ 待做 |
| `Orienteering` | https://orienteering-tan.vercel.app | 0 | 0 | 1 | 11 | ⬜ 待做 |
| `scoutworld` | https://scoutworld.vercel.app | 0 | 1 | 1 | 14 | ⬜ 待做 |
| `Zentangle-Pattern-Generator` | https://zentangle-pattern-generator.vercel.app | 0 | 1 | 0 | 8 | ⬜ 待做 |

## 3. C 組：有 `/api` 或屬 4 本紀錄冊 — 最後做，要逐個判斷 — 24 個

> **2026-11-26 實查**：`AvianDex`、`birddex3`、`CUBSBOOK`、`HM20C`、`ROVERBOOK`、`SCOUT3D`、`SCOUTBOOK`、`VSBOOK` **已接閘**（4 本 BOOK 全部）；其餘 15 個未接（見 §0.1）。⚠️ 有 `/api` 嘅 app 前端閘只擋頁面，`/api` 仍然直開——要硬擋見 [docs/61](61-registration-gate-and-single-session.md) L3。

有後端就要考慮「`entry-gate` 只擋前端，`/api` 仍然開得」。按你嘅定案（SG12）**唔需要**起簽票基建，但要：
- 若 `/api` 只係 proxy／統計 → 可以直接 `entry-gate`；
- 若 `/api` 會寫入／有成本 → 先確認後端自己有冇把關，再決定。

| Repo | 網址 | `/api` | manifest | SW | 本機儲存痕跡 |
|---|:--:|:--:|:--:|:--:|:--:|
| `AvianDex` | https://avian-dex.vercel.app | 3 | 2 | 1 | 3 | ⬜ 待做 |
| `birddex3` | https://birddex3.vercel.app | 1 | 1 | 0 | 0 | ⬜ 待做 |
| `cardmaster` | https://cardmaster-pi.vercel.app | 2 | 0 | 0 | 0 | ⬜ 待做 |
| `code` | https://code-zeta-beryl.vercel.app | 8 | 0 | 1 | 0 | ⬜ 待做 |
| `cubsbadge` | https://cubsbadge.vercel.app | 14 | 0 | 0 | 28 | ⬜ 待做 |
| `CUBSBOOK` | https://cubsbook.vercel.app | 2 | 1 | 1 | 0 | ⬜ 待做 |
| `dbs3.0` | https://districtbadgesystem30.vercel.app | 2 | 0 | 0 | 0 | ⬜ 待做 |
| `DGA` | https://dga-five.vercel.app | 1 | 0 | 0 | 4 | ⬜ 待做 |
| `event` | https://event-zeta-sage.vercel.app | 1 | 0 | 0 | 2 | ⬜ 待做 |
| `HM20C` | https://hm20c.vercel.app | 7 | 1 | 0 | 1 | ⬜ 待做 |
| `roverbadge` | https://roverbadge.vercel.app | 8 | 1 | 0 | 27 | ⬜ 待做 |
| `ROVERBOOK` | https://roverbook.vercel.app | 5 | 1 | 1 | 0 | ⬜ 待做 |
| `scout-admin` | https://scout-admin-blue.vercel.app | 2 | 0 | 0 | 11 | ⬜ 待做 |
| `SCOUT3D` | https://scout3d-gamma.vercel.app | 2 | 1 | 0 | 2 | ⬜ 待做 |
| `scoutapp` | https://scoutapp-vico.vercel.app | 1 | 1 | 0 | 0 | ⬜ 待做 |
| `scoutbadge` | https://scoutbadge.vercel.app | 3 | 0 | 0 | 28 | ⬜ 待做 |
| `SCOUTBOOK` | https://scoutbook-five.vercel.app | 2 | 1 | 1 | 0 | ⬜ 待做 |
| `skw-birdex2` | https://skw-birdex2.vercel.app | 1 | 1 | 0 | 0 | ⬜ 待做 |
| `troop-attendance` | https://troop-attendance.vercel.app | 3 | 0 | 0 | 4 | ⬜ 待做 |
| `troop-camera` | https://troop-camera.vercel.app | 14 | 1 | 1 | 0 | ⬜ 待做 |
| `troop-portal` | https://troop-portal.vercel.app | 4 | 0 | 0 | 3 | ⬜ 待做 |
| `vs_portal` | https://vs-portal-pi.vercel.app | 10 | 1 | 0 | 0 | ⬜ 待做 |
| `vsbadge` | https://vsbadge.vercel.app | 6 | 0 | 0 | 30 | ⬜ 待做 |
| `VSBOOK` | https://vsbook-sand.vercel.app | 2 | 1 | 1 | 0 | ⬜ 待做 |

## 4. D 組：入口本體，**唔可以**加閘（SG8）

| Repo | 角色 | 原因 |
|---|---|---|
| `website` | 1. APP STORE（`main`） | 主站；加閘等於全生態斷路 |
| `scout-circulars` | 2. 圖書館（`feed`） | **載住 Push 訂閱**，必須維持 `open`（SG10-a） |
| `member-portal` | 3. 成員系統（`internal`） | 自己就係入口 |
| `scout-district-portal` | 4. 區管理系統（`internal`） | 自己就係入口 |
| GEMINI | 5. 自家 private repo | **自己部署嘅 Vercel app**（`gemini-woad-sigma.vercel.app`），同 1–4 同級、可放行；但佢自己就係入口，所以**唔會**幫佢加閘（SG16 已修正） |

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
    portalIds: ['appstore'],           // ＝DEFAULT_PORTAL_IDS（SG17）：主站，攔截卡只畫呢一粒掣
    silentPortalIds: ['library'],       // SG19：圖書館照放行（matchedPortalId: 'library'）但唔畫掣。
                                        //   圖書館 noreferrer 已於 89ef3cf1 改好，條件已滿足。
                                        //   ⚠️ member／district 唔做 App 目錄；gemini 屬 optional（SG16）
                                        //      可以加但預設唔加 —— 三個都唔准自己加，等真理倉叫你先加
    allowStandalone: true,             // B 組必開；A 組亦建議開（已加主畫面＝品牌已入屋，唔好攔）
    autoRedirectSeconds: 0             // 0 = 停低顯示提示卡，唔好秒彈走
  });
</script>
```

> **SG18**（子 App 一鍵回跳主站讚好／收藏）另見 [50 §4.1](50-app-store-whitelist-and-shutdown.md) 同 [60](60-future-apps-support-button.md)（**2026-11-21 全 App 必做**）；`<slug>` 對照見上面 §1.1。

## 7. 要唔要「先同兩個大入口講」？→ 只有一件事要動（SG17）

> **答案：唔使逐個入口打招呼。** 詳情規則見 [50 §3.10](50-app-store-whitelist-and-shutdown.md) ＋ **SG17**。五個入口嘅入場條件唔同，只有一個要改一行代碼：

| 入口 | 要唔要事先處理 | 對 A／B 組 App 嘅影響 |
|---|:--:|---|
| **1. APP STORE** | ❌ **唔使** —— 佢本來就係預設入口（`DEFAULT_PORTAL_IDS`）；分享／QR 亦只由佢產生（SG9） | **每一隻都要寫** `portalIds: ['appstore']` |
| **2. 圖書館** | ⚠️ **要，但只需一次**：`scout-circulars/index.html` L5662 小工具掣 `rel="noopener noreferrer"` → `rel="${isTool ? 'noopener' : 'noopener noreferrer'}"`。**Push／統計／通告流程一律唔准動**（SG10-a） | 改完之後，逐隻 App 自己決定加唔加 `library`；**A 組第一批唔加**（只認 APP STORE），所以第 1 批完全唔受影響 |
| **3. 成員系統** | ❌ **唔使** —— 實查 `app/page.tsx` 只連 `/books`（4 本 BOOK）、通告圖書館、`districtbadgesystem30`、`scoutappstore`；**唔做 App 目錄** | 預設唔加。唯一例外＝4 本 `BOOK`（本身喺 C 組，BOOK 管制宜寬鬆，維持 `['appstore']` 已夠） |
| **4. 區管理系統** | ❌ **唔使** —— 卡片／`/embed`／`/links` 只連自家 `builtin` 系統 | 預設唔加 |
| **5. GEMINI** | ❌ **唔使** —— 你話「佢同其他 App 完全冇關係」，所以冇嘢要協調 | **可以**加（`admit: 'optional'`），但預設唔加。⚠️ 舊版寫「永遠唔會放入 `portalIds`（程式剔除）」係**錯**，已撤回（SG16）：`NEVER_ADMIT_PORTAL_IDS` 現時係**空陣列**，`portalsFromIds(['gemini','appstore'])` 會正常回兩個 |

**所以「打招呼」呢一步唔存在**；真正要做嘅兩件都**已經完成**：① ✅ **APP STORE 已加 `?app=<slug>`**（`bd721421`，為咗分享／QR，唔係為白名單）② ✅ **圖書館已改 L5812 一行**（如果你要放圖書館入場）。兩件都係**機器層面**，唔需要同「入口嘅 AGENT」開會；成員系統／區管理系統／Gemini 更加唔關事。

---

## 8. 建議執行次序

| 批次 | 內容 | 為咩 |
|:--:|---|---|
| **第 0 步** ✅ **已完成（2026-11-17，`website` `bd721421`）** | 喺 APP STORE 加 `?app=<slug>` 深層連結，並把分享／QR／卡片 href 由 `app.url` 改指 APP STORE（[50 §4.4-6](50-app-store-whitelist-and-shutdown.md)）：`app.js` L838／L842／L854／L861、`index.html` L2453 全部改指 `appDeepLink()`；`openApp()` L50–54 同 sheet「開啟」L227 保持真 url。（歷史記錄：[`APP-STORE-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-INSTRUCTION.md)；**仲要貼嘅係 [`APP-STORE-SLUG-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-SLUG-INSTRUCTION.md)**） | **唔做呢步，一開閘分享連結就全部撞卡**（SG9-a）。**唔需要問任何入口**——APP STORE 本來就係預設入口（SG17） |
| **第 1 批** | A 組揀 3–5 個 | 驗證流程，風險最低 |
| **第 2 批** | A 組其餘全部 | 批量複製。圖書館 `noreferrer` **✅ 已於 2026-11-17 完成**（`scout-circulars` `89ef3cf1`，現 L5812）—— 唔使再做，直接寫 `silentPortalIds: ['library']` 即可（⚠️ 仍有一處待修：`openNoticePage()` 彈窗 `.np-primary` L5914，見 `docs/50` §4.4-10） |
| **第 3 批** | B 組（確認備份功能後） | 有儲存，要小心 |
| **第 4 批** | C 組逐個判斷 | 有 `/api`，要睇後端 |
| **永遠唔做** | D 組入口本體 | 會鎖死自己（SG8） |

> **第 0 步已完成**，唔使再貼 [`APP-STORE-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-INSTRUCTION.md)（留作歷史記錄）；改貼 [`APP-STORE-SLUG-INSTRUCTION.md`](../templates/repo-starter/APP-STORE-SLUG-INSTRUCTION.md)。**仲要 APP STORE 做嘅只有兩件**：① 補 §1.1 嗰 5 隻缺 slug ② 確認 `apps.url` 冇 branch 預覽網址（見下）。
> 第 1／2 批（A 組）用 [`A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md)。
