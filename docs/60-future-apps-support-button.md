# 60 — 所有將來 App 都要有「讚好／收藏」掣（參考航空圖鑑 v0.37.0）

> **2026-11-21 定案**：「之後所有 APP 落地，都要在 App 入面內置「讚好／收藏」一鍵掣」—— 方便 APP STORE 統計點擊／收藏／Like（SG10）。本頁係 SG18（[docs/50 §1](50-app-store-whitelist-and-shutdown.md)）嘅參考 implementation ＋ 新 App 必做條；**唔分 A / B / C 組**（唔同於 SG17 嗰批要經官網白名單嘅選擇）。

---

## 1. 為咩存在（一句）

用家在子 App 入面想表態一次（點個/讚收藏），直接返去 APP STORE 詳情卡撳 ❤️／⭐ 就一刀便利（零跨倉密鑰、零額外 Supabase 請求）。APP STORE 後台嘅 `clicks／stars／hearts`（SG10）才能由「主站自己統計」升級成「所有子 App 觸發一次表態 → 統計入主站」。

## 2. 參考 pinned implementation（Aircraft-Encyclopedia v0.37.0）

來源：`playerkousas-rgb/Aircraft-Encyclopedia` @ `v0.37.0`（`web/` 為發佈根，HEAD `050951f5`，2026-11-17）—— [docs/51 §1](51-whitelist-rollout-list.md) 已記錄。

### 2.1 head 掛入白名單閘門 + 文案（SG19 簡短人話版）

```html
<script src="/store_gate_v1.0.js"></script>
<script>
  initStoreGate({
    appKey: 'aircraft-encyclopedia',
    mode: 'entry-gate',
    portalIds: ['appstore'],
    allowedOrigins: ScoutStoreGate.portalsFromIds(['appstore', 'library']).map(function (p) { return p.origin; }),
    customTitle: '需經由 SCOUT APP STORE 開啟',
    customMessage: '請按下方按鈕前往 APP STORE 開啟。',
    allowStandalone: true,
    autoRedirectSeconds: 0
  });
</script>
```

### 2.2 頂欄掣（常駐・非阻塞）

```html
<a id="storeSupportTop" class="support-btn" target="_blank" rel="noopener" hidden
   aria-label="前往主站讚好或收藏此程式（開新分頁）" title="前往主站讚好或收藏此程式（開新分頁）">
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"
       stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
  <span data-i18n="supportBtn">讚好／收藏</span>
</a>
```

### 2.3 頁尾輕量提示列（可選・參考航空圖鑑）

```html
<div id="storeSupportBar" class="support-bar" hidden>
  <span data-i18n="supportPrompt">覺得呢個工具有用？撳一下話我哋知，幫手留住佢喺書架：</span>
  <a id="storeSupportFoot" class="support-foot-btn" target="_blank" rel="noopener" data-i18n="supportFootBtn">前往主站讚好／收藏 ↗</a>
</div>
```

### 2.4 app.js fail-safe 接線（零寫死網址）

```js
const APP_STORE_SLUG = 'aircraft-encyclopedia';
function storeSupportUrl() {
  if (typeof ScoutStoreGate === 'undefined' || typeof ScoutStoreGate.getPortal !== 'function') return '';
  const portal = ScoutStoreGate.getPortal('appstore');       // 向下相容；標準做法 = getAppStoreUrl(slug)
  if (!portal || !portal.url) return '';
  return portal.url.replace(/\/?$/, '/') + '?app=' + encodeURIComponent(APP_STORE_SLUG);
}

// 渲染：
const sUrl = storeSupportUrl();
const sTop = document.getElementById('storeSupportTop');
const sBar = document.getElementById('storeSupportBar');
if (sTop) { sTop.hidden = !sUrl; if (sUrl) sTop.href = sUrl; }
if (sBar) sBar.hidden = !sUrl;
```

**重要**：`ScoutStoreGate` 未載入 / 組唔到 URL → **保持 hidden，唔出死連**。雙語 App 同步 `data-i18n` 字串（`supportBtn`／`supportAria`／`supportPrompt`／`supportFootBtn`）。

### 2.5 styles.css 硬規則

```css
.support-btn[hidden], .support-bar[hidden] { display: none; }   /* 否則 inline-flex 令 hidden 照顯示 */
.support-btn { min-height: 40px; padding: .35rem .78rem; border-radius: 999px; }
.support-bar { display: flex; flex-wrap: wrap; gap: .6rem 1rem; padding: .75rem 1rem; border: 1px solid var(--line); border-radius: 12px; }
@media (max-width: 430px) { .support-btn { padding: .35rem .65rem; font-size: .8rem; } }
@media print { /* 隱藏 topbar / footer 時掣自動隱藏 */ }
```

### 2.6 版號 V 同 SG15

版本號一律同 `meta/title/標題/頁尾` 同步（航空圖鑑 v0.37.0 已實踐）；`<slug>` 對 `website/migrations/20261116-app-slug-seed.sql` **按正式 host 核實**，唔准靠 repo 名猜。

## 3. 每個新 App 必做（之後所有 APP，2026-11-21 定案）

| # | 項 | 條件 |
|:--:|---|---|
| 1 | 頂欄「讚好／收藏」掣 | ① `id="storeSupportTop"`；② `target="_blank" rel="noopener"`；③ `[hidden]` fail-safe；④ `aria-label`＋`title` |
| 2 | 網址 | `ScoutStoreGate.getAppStoreUrl(slug)` 組出；向下相容可用 `getPortal('appstore').url + '?app=' + encodeURIComponent(slug)` |
| 3 | `<slug>` 核實 | 按正式 Vercel host 查 `20261116-app-slug-seed.sql`；查唔到 → 停低問用戶 |
| 4 | CSS `[hidden]{display:none}` | 否則 `display:inline-flex` 令「hidden 照顯示」＝死連 |
| 5 | 零直連主站 Supabase | 唔准自行呼叫 `bump_hearts`／`bump_stars`、唔准複製 anon key（SG18 規則） |
| 6 | 常駐但低調 | 零彈窗、零倒數、零遮擋、零打斷、零新增 localStorage key；觸控 ≥ 40px；`:focus-visible`；窄屏 360–430px 唔爆版 |
| 7 | 雙語 App | 中英同步（中文 `讚好／收藏` / 英文 `Like / Save`）；`aria-label`／`title` 都要 |
| 8 | 有列印輸出 | `@media print` 必須隱藏掣（航空圖鑑做法：隱藏 `.topbar`／`footer`） |
| 9 | `supportNudge` 浮窗 | **唔開**（係同一用家被騷擾兩次）；常駐掣已經夠 |
| 10 | PREFLIGHT 驗唔到呢件事 | 交付前人手逐件驗收（見建議 ✓ 清單） |

## 4. 落地流程（接在 INTAKE 第 0 步）

```
第 0 步（INTAKE Q8）→ 確認 + 寫入 SCOPE.md（含 slug / 掣存在條件）
→ 實作（preflight PASS 後）
→ 交付前人手驗：① 掣存在 + hidden 狀態 ② 掣跳主站詳情卡 ③ 窄屏/print/雙語 ④ 列入回報格式
```

## 5. 唔係

- **唔係** in-app 收藏清單（SG18 只一粒掣回跳主站詳情卡）；收藏實際寫入喺主站同源 localStorage。
- **唔係** `supportNudge`（SG13 浮窗）的互斥替代（其實係常駐掣，只是不開浮窗）。
- **唔係** SG1–SG19 嘅選擇機構：`open` / `entry-gate` / `iframe-only` / `closed` 照 INTAKE Q8 自己揀；本頁只定 SG18 掣呢一項所有新 App 必做。

---

## 6. 更新記錄

| 日期 | 變更 |
|---|---|
| 2026-11-21 | 新建：之後所有 APP 必做 SG18 讚好／收藏掣（參考航空圖鑑 v0.37.0）；SG18 現為全 App 必做（唔分組） |
