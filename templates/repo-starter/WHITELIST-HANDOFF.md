# 白名單／書架交接清單（逐個 App 用・可直接貼去該 App 嘅對話）

> 用途：真理倉 [docs/50](../../docs/50-app-store-whitelist-and-shutdown.md) 只定**通用規則**（SG1–SG19）；**每個 App 嘅具體決定交返該 App 嘅 AGENT**——因為佢對自己個 App 熟啲，會諗多啲。
> 用法：把下面整段（由「## 你要做嘅事」開始）貼去該 App repo 嘅對話，AGENT 答完就落實。
> **2026-11-17 更新**：加入 SG18（一鍵回跳主站讚好／收藏）、SG19（靜默放行圖書館＋單一粒掣＋簡短文案）、Vercel 發佈根目錄核實、本機模擬 vs 真機實測分開。

---

## 你要做嘅事

你係 `____________`（App 名）嘅維護 AGENT。真理倉 `playerkousas-rgb/readme` 已定好入口管制規則（`docs/50`，SG1–SG19）。請**先答以下 6 條**，再改代碼。**唔識就答「唔識」，唔准估**。

| # | 問題 | 你嘅答案 |
|:--:|---|---|
| **1** | 用戶資料係咪存在**本機**（`localStorage`／`IndexedDB`）而且要跨日保留？**請掃清全倉**（含 `src/`、`web/`、`public/`、`app/`）逐一列出 | 是／否：＿＿＿；用咗嘅 key：＿＿＿（是 → 之後**唔可以用 `iframe`**，見 SG2） |
| **2** | 有冇 **PWA 加入主畫面**（manifest `display: standalone`）？ | 是／否：＿＿＿（是 → 必須 `allowStandalone: true`，見 SG7） |
| **3** | 有冇 **Web Push 訂閱**？（Service Worker 係做 **Push 訂閱** 定 **離線快取**？兩者後果完全唔同） | 是／否：＿＿＿（Push → **必須維持 `open`**，見 SG10-a；只做離線快取 → 可以照落閘） |
| **4** | 有冇**後端 `/api`** 或**第三方 API 額度**（例如 BRouter、地政總署、Gemini）？ | 是／否：＿＿＿（是 → 講清楚邊啲功能離不開後端） |
| **5** | 用家今日**點樣入嚟**？（APP STORE 撳入／圖書館連結／成員系統／直打網址／加咗主畫面） | ＿＿＿ |
| **6** | 你認為呢個 App 應該屬邊類？ | ☐ 紀錄冊（寬鬆）☐ 專業工具（收緊）☐ 自家系統（靠後端登入）☐ 圖書館類（維持 `open`） |

### Q1 停機規則（2026-11-17 定案，唔准靠估）

| 本機資料性質 | 例子 | 做法 |
|---|---|---|
| **純介面偏好** | 語言、深淺色、排序、篩選、上次睇到邊 | 如實列出 → **可以繼續執行**（唔會令用家失去重要東西） |
| **單機小遊戲最高分／進度** | 分數、關卡、成就 | 如實列出 → **可以繼續執行**，但要在回報寫明「換機／清快取會冇」 |
| **用家自建重要紀錄** | 成員名單、考章進度、報名表、自訂清單、作品草稿 | **必須停手，先問用戶**：① 有冇匯出／備份功能？② 冇備份就要先加匯出，或者維持 `open` |

> ⚠️ 「唔識」＝**唔准改**。掃唔清就問，唔好假設「應該冇」。

---

## 答完之後，按以下規則落實（唔需要再問真理倉）

### A. 一律先做（所有 App）

1. **先核實 Vercel 實際發佈根目錄**：`/`、`public/`、`web/`、或者 build 輸出（`dist/`、`out/`、`.vercel/output/`）。**唔准假設係 `/`** —— 抄錯位就等於冇掛閘（而且會靜靜失效）。
2. 抄 [`templates/vercel/store_gate_v1.0.js`](../../templates/vercel/store_gate_v1.0.js) 去**該發佈根目錄**，`<script src="/store_gate_v1.0.js">` 要放喺 **`<meta charset="UTF-8">` 之後、`<title>` 之前**（唔可以早過 charset，唔可以等 `DOMContentLoaded`）。
3. **掛閘（SG19 新標準）**：

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: '<APPKEY>',                                    // repo 名細楷
    mode: 'entry-gate',
    portalIds: ['appstore'],                               // 主站
    silentPortalIds: ['library'],                          // 圖書館照放行，但唔畫成掣
    allowStandalone: true,
    autoRedirectSeconds: 0
  });
</script>
```

   - `silentPortalIds` 同 `portalIds` 兩種寫法等效：`portalIds: ['appstore','library'], silentPortalIds: ['library']` 都得。
   - **效果**：由 APP STORE 撳入 → 正常；由圖書館撳入 → 正常（`matchedPortalId: 'library'`）；直打網址 → **只出 APP STORE 一粒掣**。
4. 若**問題 2 = 是**，一定寫 `allowStandalone: true`（唔寫會踢走已裝主畫面嘅用戶）。**已加主畫面＝品牌已入屋，唔要再攔。**

### B. SG18：子 App 內置「讚好／收藏」一鍵回跳主站（A 組標準做法）

```html
<!-- 頂欄右上角（常駐、低調、非阻塞） -->
<a id="storeSupportTop" class="support-btn" target="_blank" rel="noopener" hidden
   aria-label="前往主站讚好或收藏此程式（開新分頁）">❤️ 讚好／收藏</a>
```

```js
// 零寫死網址；ScoutStoreGate 未載入就保持 hidden（唔准出死連）
(function () {
  var a = document.getElementById('storeSupportTop');
  if (!a || typeof ScoutStoreGate === 'undefined') return;   // ← 未載入 → 保持 hidden
  a.href = ScoutStoreGate.getAppStoreUrl('<SLUG>');          // → https://scoutappstore.vercel.app/?app=<SLUG>
  a.hidden = false;
})();
```

**硬規則：**

- ❌ **嚴禁**直連主站 Supabase、複製主站 URL／anon key、自行呼叫 `bump_hearts`／`bump_stars`。
  理由：零密鑰耦合、零額外額度，而且**用家個人收藏清單存喺 `scoutappstore.vercel.app` 同源 `localStorage`** —— 子 App 就算寫得入 DB，用家個收藏夾都唔會多一粒星。
- ✅ `<SLUG>` **必須**對 `playerkousas-rgb/website` 嘅 `migrations/20261116-app-slug-seed.sql`（或主站 `apps.slug`）**按正式 Vercel host 核實**，**嚴禁靠 repo 名猜**（`avian-dex.vercel.app` → `aviandex`、`districtbadgesystem30.vercel.app` → `dbs3-0`）。查唔到 → **停低問用戶**。
- ✅ CSS **必須**有明確 `[hidden]{display:none}` 規則（例：`.support-btn[hidden],.support-bar[hidden]{display:none}`），否則 `display:inline-flex` 會令「hidden 但照顯示」＝死連。
- ✅ 常駐但低調：**零彈窗、零倒數、零遮擋、零打斷、零新增 `localStorage` key**；觸控目標 ≥ 40px；有 `:focus-visible`；窄屏 360–430px 唔爆版。
- ✅ 雙語 App（`docs/44` L1–L6）：中英同步切換（中文 `讚好／收藏`、英文 `Like / Save`），`aria-label`／`title` 都要。
- ✅ 有列印輸出（試卷／證書／報表）→ `@media print` 必須隱藏。
- ✅ 攔截卡顯示中（`#scoutStoreGate`）→ 必須隨主體一併隱藏（`store_gate_v1.0.js` 已用 `body > :not(#scoutStoreGate)` 處理，唔使自己再加）。
- ⚠️ **A 組預設唔開 `supportNudge`**（浮窗）—— 兩者並存＝同一用家被騷擾兩次。揀常駐掣（本節）就夠。

### C. 按 App 類型加做

| 類型 | 額外要求 |
|---|---|
| **紀錄冊**（`BOOK` 類） | `portalIds` 四個全開；**唔好**開 `supportNudge`（唔好騷擾成員）；確認有 JSON／QR 匯出備份 |
| **專業工具**（`HM20C`、`drawtheroute`、`HKMAP` 等） | `portalIds` 收窄到 `['appstore']` ＋ `silentPortalIds: ['library']`；SG18 常駐掣 |
| **自家系統**（成員／區管理／badge） | 靠**後端登入**把關；入口只作導流；**唔需要** `supportNudge` |
| **圖書館類（有 Push）** | **維持 `mode: 'open'`**：唔可以 `iframe`、唔可以 `closed`、唔可以改 manifest `start_url` |

### D. 唔准做

- ❌ 唔准為「防抄」而加後端驗票／簽票基建（用戶 2026-11-15 定案：唔需要）。
- ❌ 唔准用 `iframe` 嵌任何有本機儲存／PWA／Push／登入 Cookie 嘅 App（SG2）。
- ❌ 唔准用 `supportNudge` 做倒數、延時解鎖、遮罩迫 Like（SG13）。
- ❌ 唔准寫死「幾日 0 Like 就收起」呢類數字門檻（SG14：判斷權喺用戶）。
- ❌ 唔准把 `gemini`／`member`／`district` 自行加入 `portalIds`（SG17：由真理倉叫你加才加）。
- ❌ 唔准改動 APP STORE／圖書館／任何入口 repo（你只改自己個 repo）。
- ❌ 唔准未問就改 `SCOPE.md` 以外嘅架構。

### E. 做完要交付

1. `SCOPE.md`／README 寫明：`mode`、`portalIds`、`silentPortalIds`、`allowStandalone`、有冇 `supportNudge`、SG18 用咗邊個 `<slug>`。
2. 驗收表要**分開兩欄**（對齊 [docs/47](../../docs/47-readme-discipline.md) 誠實原則）：

| 項 | 本機模擬 | 真機實測 |
|---|:--:|:--:|
| 由 APP STORE 撳入 → 正常 | ☐ | ☐ |
| 由圖書館撳入 → 正常（`matchedPortalId: library`） | ☐ | ☐ |
| 直打網址 → 只出 **1 粒** APP STORE 掣 | ☐ | ☐ |
| 已裝主畫面撳 icon → 直接入 | ☐ | ☐ |
| SG18 掣 → 開新分頁，落到該 App 詳情卡 | ☐ | ☐ |
| SG18 掣喺 `ScoutStoreGate` 未載入時保持隱藏 | ☐ | ☐ |
| 有列印 → 掣被隱藏 | ☐ | — |
| 窄屏 360／430px 唔爆版 | ☐ | ☐ |

3. 回報：**改咗邊幾個檔、邊幾行、模擬結果、真機結果**。未做真機就要講明「未做」。

---

## 回報格式（COPY 呢個）

```
App：____________
1 本機資料：是/否（keys：____________）    2 PWA：是/否    3 Push：是/否（SW：Push/離線快取）
4 後端 API：是/否    5 今日入口：____________    6 類型：紀錄冊/專業工具/自家系統/圖書館類
→ Vercel 發佈根目錄：____________（實查過？是/否）
→ mode=entry-gate  portalIds=[____________]  silentPortalIds=[____________]  allowStandalone=____
→ supportNudge：開/關（A 組預設關）
→ SG18 slug：____________（來源：20261116-app-slug-seed.sql / apps.slug / 問用戶）
→ 改咗：____________（檔名 + 行數）
→ 本機模擬：APP STORE 入 ✓/✗ ｜ 圖書館入 ✓/✗ ｜ 直打見 1 粒掣 ✓/✗ ｜ 主畫面 ✓/✗ ｜ SG18 掣 ✓/✗ ｜ 列印隱藏 ✓/✗
→ 真機實測：APP STORE 入 ✓/✗ ｜ 圖書館入 ✓/✗ ｜ 直打見 1 粒掣 ✓/✗ ｜ 主畫面 ✓/✗ ｜ SG18 掣 ✓/✗
→ 未做／風險：____________
```
