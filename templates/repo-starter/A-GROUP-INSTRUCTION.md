# A 組 App 白名單指令（可直接複製貼去該 App 對話）

> 用途：你逐個 App 開對話時，複製下面「=== 開始 ===」到「=== 結束 ===」之間嘅整段，貼落去即可。
> 只適用於 [docs/51](../../docs/51-whitelist-rollout-list.md) **A 組**（無 `/api`、無本機儲存痕跡）。
> 貼之前只需改 **1 個位**：`<APPKEY>`（通常係 repo 名細楷）。

---

=== 開始（複製以下全部） ===

請先讀真理倉 `playerkousas-rgb/readme` 呢三份文件，然後照做：

1. `templates/repo-starter/WHITELIST-HANDOFF.md`（交接清單，你要答嘅 6 條問題）
2. `docs/50-app-store-whitelist-and-shutdown.md` 嘅 **§1 規則總表 SG1–SG17**、**§3.2**（本機儲存影響）、**§3.4**（新用戶直開網址／404／加入主畫面）
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

**如果第 1 或第 3 題答「有」→ 停手，先同我講，唔好改。**（有 Push 嘅必須維持 `open`，見 SG10-a）

### 第 2 步：抄閘門檔

由真理倉 `templates/vercel/store_gate_v1.0.js` **原封不動**抄一份去本 repo 根目錄（或 `public/`／`dist` 會部署嘅位置）。**唔准改邏輯、唔准自創變數。**

### 第 3 步：喺入口頁掛入

喺 `index.html` 嘅 `<head>` **最頂**（`<title>` 之前）加：

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: '<APPKEY>',              // 用 repo 名細楷，例如 hm20c / icon-maker
    mode: 'entry-gate',
    portalIds: ['appstore'],         // A 組第一批：只認 APP STORE（＝DEFAULT_PORTAL_IDS，唔使問任何人）
                                     //   ⚠️ 唔好加 'library'（要等圖書館改好 noreferrer，SG17）
                                     //   ⚠️ 唔好加 'member'／'district'（佢哋唔做 App 目錄，唔關你事）
    allowStandalone: true,           // 免費保險：已加主畫面嘅用家照用
    autoRedirectSeconds: 0           // 0 = 停低顯示提示卡，唔好秒彈走
  });
</script>
```

**唔准做**：
- ❌ 唔准自己寫死入口網址（一律用 `portalIds`，網址由真理倉 `PORTAL_REGISTRY` 統一）
- ❌ 唔准把 `gemini` 放入 `portalIds`（佢屬 Canvas 派發線，管唔到閘，見 SG16；程式亦會自動剔除）
- ❌ 唔准自行加 `library`／`member`／`district`（入口幾時入場由真理倉決定，見 SG17；你只寫 `['appstore']`）
- ❌ 唔准改動 APP STORE／圖書館／任何入口 repo（你只改自己個 repo）
- ❌ 唔准用 `iframe-only`（除非你肯定四類禁區全中）
- ❌ 唔准改 `mode` 去 `closed`（要關站我會另外叫你做）
- ❌ 唔准加任何後端驗票／簽票（我明確唔需要，見 SG12）
- ❌ 唔准動 `share`／`QR`／資料格式

### 第 4 步：真機／瀏覽器實測三項（必做，唔准跳）

1. **由 APP STORE 入** → 應該**正常入到 App**，乜都唔彈
2. **直接打 `https://<你個網域>/`** → 應該見白名單卡（4 個入口掣＋「加入主畫面」提示），**唔會 404**
3. **已加入主畫面**（或模擬 `display-mode: standalone`）→ 撳 icon 應該**直接入到**

### 第 5 步：回報（照抄呢個格式）

```
App：<repo 名>
1 本機資料：是/否    2 PWA：是/否    3 Push：是/否    4 後端 API：是/否
5 今日入口：____________
6 類型：紀錄冊/專業工具/自家系統/圖書館類
→ mode=entry-gate  portalIds=['appstore']  allowStandalone=true
→ 改咗：____________（檔名 + 行數）
→ 真機：APP STORE 入 ✓/✗ ｜ 直打網址見卡 ✓/✗ ｜ 主畫面直開 ✓/✗
→ 未做／風險：____________
```

**唔准講「已完成」而冇真機結果。未做就寫「未做」。**

=== 結束 ===

---

## 一次過貼多個 App 時嘅注意

- 每個 App **獨立一個** `appKey`（唔可以同其他 App 撞，因為 `sessionStorage` key 會撞）。
- 逐個 App 分開對話貼，**唔好一次叫一個 AGENT 改幾個 repo**（會亂）。
- 如果該 App 嘅 AGENT 話「我冇 `index.html`」（係 React/Vite）→ 叫佢改 **`index.html`（Vite 根目錄嗰個）**，唔係 `src/main.tsx`；Next.js 就改 `app/layout.tsx` 用 `<Script src="/store_gate_v1.0.js" strategy="beforeInteractive" />`。
