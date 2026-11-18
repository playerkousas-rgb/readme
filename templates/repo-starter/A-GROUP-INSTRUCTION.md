# A 組 App 白名單指令（可直接複製貼去該 App 對話）

> 用途：你逐個 App 開對話時，複製下面「=== 開始 ===」到「=== 結束 ===」之間嘅整段，貼落去即可。
> 只適用於 [docs/51](../../docs/51-whitelist-rollout-list.md) **A 組**（無 `/api`；本機儲存只限介面偏好／小遊戲分數）。
> 貼之前只需改 **3 個位**：`<APPKEY>`（repo 名細楷）、`<SLUG>`（主站 slug，**要核實，唔准猜**）、`<REPO名>`。
> **2026-11-17 更新**：加入 SG19（`silentPortalIds` ＋ 單一粒掣 ＋ 簡短文案）、SG18（一鍵回跳主站讚好／收藏）、Vercel 發佈根目錄核實、模擬 vs 真機分欄。

---

=== 開始（複製以下全部） ===

請先讀真理倉 `playerkousas-rgb/readme` 呢三份文件，然後照做：

1. `templates/repo-starter/WHITELIST-HANDOFF.md`（交接清單，你要答嘅 6 條問題）
2. `docs/50-app-store-whitelist-and-shutdown.md` 嘅 **§1 規則總表 SG1–SG19**（特別係 **SG18**＝一鍵回跳主站、**SG19**＝攔截卡按鈕同放行來源分離）、**§3.2**（本機儲存影響）、**§3.4**（新用戶直開網址／404／加入主畫面）
3. `docs/51-whitelist-rollout-list.md`（我呢個 App 屬 A 組）

## 我要你做嘅事

呢個 App 要加「準入白名單」：**由 APP STORE 進入就用得，直接打網址就見提示卡**。

### 第 1 步：先答 6 條（唔准估，唔識就答「唔識」）

| # | 問題 | 你嘅答案 |
|:--:|---|---|
| 1 | 有冇 `localStorage`／`IndexedDB` 要跨日保留？ | |
| 2 | 有冇 PWA 加入主畫面（`manifest` `display: standalone`）？ | |
| 3 | 有冇 Web Push 訂閱？ | |
| 4 | 有冇 `/api` 或第三方 API 額度？ | |
| 5 | 用家今日點樣入嚟？ | |
| 6 | 屬邊類？（紀錄冊／專業工具／自家系統／圖書館類） | |

**第 1 題（本機資料）唔係「有就停」，要分類判斷**（詳見下面「Q1 停機規則」）：
- 純介面偏好（語言／深淺色／篩選／上次睇到邊）＋ 單機小遊戲最高分 → **如實列出就可以繼續**
- 用家自建重要紀錄（成員名單、考章進度、報名、自訂清單、作品草稿）而**冇匯出備份** → **停手，先同我講**

**如果第 3 題答「有」（真 Web Push 訂閱）→ 停手，先同我講，唔好改。**（有 Push 必須維持 `open`，見 SG10-a）
只做離線快取嘅 Service Worker 唔算 Push，可以照落閘，但要喺回報寫明。

### Q1 停機規則（唔准靠估；要掃清全倉 `src/`、`web/`、`public/`、`app/`）

| 本機資料性質 | 例子 | 做法 |
|---|---|---|
| **純介面偏好** | 語言、深淺色、排序、篩選、上次睇到邊 | 如實列出 → **繼續執行** |
| **單機小遊戲最高分／進度** | 分數、關卡、成就 | 如實列出 → **繼續執行**，但回報要寫明「換機／清快取會冇」 |
| **用家自建重要紀錄** | 成員名單、考章進度、報名、自訂清單、作品草稿 | **停手，先問我**：有冇匯出／備份？冇就要先加，或者維持 `open` |

> 「唔識」＝**唔准改**。掃唔清就問，唔好假設「應該冇」。

### 第 2 步：先核實發佈根目錄，再抄閘門檔

**（a）核實 Vercel 實際發佈根目錄**：`/`、`public/`、`web/`，定係 build 輸出（`dist/`、`out/`、`.vercel/output/`）？
去 Vercel Project → Settings → Build & Development → **Root Directory／Output Directory** 睇清楚，或者睇 `vercel.json`。
**唔准假設係 `/`** —— 抄錯位就等於冇掛閘，而且會靜靜失效（冇任何錯誤訊息）。

**（b）** 由真理倉 `templates/vercel/store_gate_v1.0.js` **原封不動**抄一份去**該發佈根目錄**。**唔准改邏輯、唔准自創變數。**

### 第 3 步：喺入口頁掛入

喺 `index.html` 嘅 `<head>`，**`<meta charset="UTF-8">` 之後、`<title>` 之前**加
（唔可以早過 charset；唔可以等 `DOMContentLoaded`；React/Vite 改**根目錄** `index.html`，唔係 `src/main.tsx`；
Next.js 改 `app/layout.tsx` 用 `<Script src="/store_gate_v1.0.js" strategy="beforeInteractive" />`）：

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: '<APPKEY>',              // repo 名細楷，例如 hm20c / icon-maker
    mode: 'entry-gate',
    portalIds: ['appstore'],         // 主站：攔截卡只會出呢一粒掣
    silentPortalIds: ['library'],    // SG19：圖書館照樣放行（有 Referer 就入得），但唔畫成掣
                                     //   圖書館 2026-11-17 已完成 noreferrer 修正，條件已滿足
                                     //   ⚠️ 唔好自己加 'member'／'district'／'gemini'（SG17）
    allowStandalone: true,           // 已加主畫面＝品牌已入屋，唔好攔（免費保險）
    autoRedirectSeconds: 0           // 0 = 停低顯示提示卡，唔好秒彈走
  });
</script>
```

**唔准做**：
- ❌ 唔准自己寫死入口網址（一律用 `portalIds`，網址由真理倉 `PORTAL_REGISTRY` 統一）
- ❌ 唔准把 `gemini` 放入 `portalIds`（第一批只認 APP STORE；`gemini` 本身係合法入口，但要我另外叫你加，見 SG16／SG17）
- ❌ 唔准將 `library` 放入 `portalIds` 渲染成掣（`silentPortalIds: ['library']` 照抄即可）；亦唔准自行加入 `member`／`district`／`gemini`（入口幾時入場由真理倉決定，見 SG17／SG19）
- ❌ 唔准改動 APP STORE／圖書館／任何入口 repo（你只改自己個 repo）
- ❌ 唔准用 `iframe-only`（除非你肯定四類禁區全中）
- ❌ 唔准改 `mode` 去 `closed`（要關站我會另外叫你做）
- ❌ 唔准加任何後端驗票／簽票（我明確唔需要，見 SG12）
- ❌ 唔准動 `share`／`QR`／資料格式
- ❌ **唔准直連主站 Supabase**、唔准複製主站 URL／anon key、唔准自行呼叫 `bump_hearts`／`bump_stars`（SG18）

### 第 4 步：SG18 — 加「讚好／收藏」一鍵回跳主站掣（A 組標準做法）

```html
<!-- 頂欄右上角：常駐、低調、非阻塞 -->
<a id="storeSupportTop" class="support-btn" target="_blank" rel="noopener" hidden
   aria-label="前往主站讚好或收藏此程式（開新分頁）">❤️ 讚好／收藏</a>
```

```js
(function () {
  var a = document.getElementById('storeSupportTop');
  if (!a || typeof ScoutStoreGate === 'undefined') return;   // 未載入 → 保持 hidden，唔准出死連
  a.href = ScoutStoreGate.getAppStoreUrl('<SLUG>');
  a.hidden = false;
})();
```

- `<SLUG>` **必須**對 `playerkousas-rgb/website` 嘅 `migrations/20261116-app-slug-seed.sql`（或主站 `apps.slug`）按**正式 Vercel host** 核實，**嚴禁靠 repo 名猜**。查唔到 → 停低問我。
- CSS **必須**有 `[hidden]{display:none}` 明確規則（例：`.support-btn[hidden]{display:none}`），否則 `display:inline-flex` 會令「hidden 但照顯示」＝死連。
- 同時：觸控 ≥ 40px、有 `:focus-visible`、窄屏 360–430px 唔爆版、雙語同步（中 `讚好／收藏` / 英 `Like / Save`）、有列印就 `@media print` 隱藏。
- **唔好開 `supportNudge`**（浮窗）—— 兩者並存＝同一用家被騷擾兩次。

### 第 5 步：驗收（**本機模擬** 同 **真機實測** 分開填，唔准混）

| 項 | 本機模擬 | 真機實測 |
|---|:--:|:--:|
| 由 APP STORE 撳入 → 正常，乜都唔彈 | ☐ | ☐ |
| 由圖書館撳入 → 正常（`matchedPortalId: library`） | ☐ | ☐ |
| 直接打 `https://<你個網域>/` → **只有 1 粒** APP STORE 掣（唔會 404、唔會白屏） | ☐ | ☐ |
| 已加入主畫面（或模擬 `display-mode: standalone`）→ 撳 icon 直接入到 | ☐ | ☐ |
| SG18 掣 → 開新分頁，落到該 App 詳情卡 | ☐ | ☐ |
| SG18 掣喺 `ScoutStoreGate` 未載入時保持隱藏 | ☐ | — |
| 有列印 → 掣被隱藏（冇列印功能可寫 N/A） | ☐ | — |
| 窄屏 360／430px 唔爆版 | ☐ | ☐ |

### 第 6 步：回報（照抄呢個格式）

```
App：<REPO名>
1 本機資料：是/否（keys：____________）    2 PWA：是/否    3 Push：是/否（SW：Push/離線快取）
4 後端 API：是/否    5 今日入口：____________    6 類型：紀錄冊/專業工具/自家系統/圖書館類
→ Vercel 發佈根目錄：____________（實查過？是/否）
→ mode=entry-gate  portalIds=['appstore']  silentPortalIds=['library']  allowStandalone=true
→ supportNudge：關（A 組預設）
→ SG18 slug：____________（來源：20261116-app-slug-seed.sql / apps.slug / 問用戶）
→ 改咗：____________（檔名 + 行數）
→ 本機模擬：APP STORE 入 __ ｜ 圖書館入 __ ｜ 直打見 1 粒掣 __ ｜ 主畫面 __ ｜ SG18 掣 __ ｜ 列印隱藏 __
→ 真機實測：APP STORE 入 __ ｜ 圖書館入 __ ｜ 直打見 1 粒掣 __ ｜ 主畫面 __ ｜ SG18 掣 __
→ 未做／風險：____________
```

**唔准講「已完成」而冇真機結果。模擬過但未上真機，就寫「真機未做」。**

=== 結束 ===

---

## 一次過貼多個 App 時嘅注意

- 每個 App **獨立一個** `appKey`（唔可以同其他 App 撞，因為 `sessionStorage` key 會撞）。
- 逐個 App 分開對話貼，**唔好一次叫一個 AGENT 改幾個 repo**（會亂）。
- 如果該 App 嘅 AGENT 話「我冇 `index.html`」（係 React/Vite）→ 叫佢改 **`index.html`（Vite 根目錄嗰個）**，唔係 `src/main.tsx`；Next.js 就改 `app/layout.tsx` 用 `<Script src="/store_gate_v1.0.js" strategy="beforeInteractive" />`。
