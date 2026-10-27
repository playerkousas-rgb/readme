# 13 — 檔名 ＋ 內文雙版號（V1–V6）

> **通用規則，同瘦身 S 同級**。用戶定案：**每次更新都要檔案名稱同內文同時更新版號**。
> 目的：杜絕「我唔知手上係邊個版本」——檔名、內文、部署拷貝、紀錄全部要對得上。

---

## V1 — 鐵則：檔名同內文同一個版號

```
✅ scout_generator_v1.0.html   →  內文所有版號都係 v1.0
✅ brain_v1.0.gs               →  APP_VERSION = 'v1.0'
✅ scout_watermark_codec_v1.0.mjs → export const VERSION = 'v1.0'
❌ app.html 內文寫 v2.0（檔名冇版號 / 對唔上）→ 拒絕
❌ app_v1.0.html 內文寫 v2.0 → 拒絕
```

**格式**：`_v<MAJOR>.<MINOR>[.<PATCH>]`（例 `v1.0`、`v1.1`、`v2.0.1`）。
MAJOR = 結構／payload／API 不相容改動；MINOR = 功能／規則改動；PATCH = 修正錯字、样式。

**適用範圍**：所有**交付檔**＝會交出去／部署嘅 HTML、GS、JS/codec、解碼器、prompt 包、合約 JSON。
**純說明 MD**（`docs/`、README）用「頁首版本行 + Git tag/commit」，因為佢哋唔係交付 artifact；但內部引用交付檔時要寫清楚版號。

---

## V2 — 內文至少四處要寫版號

```html
<meta name="app-version" content="v1.0">           <!-- ① machine-readable -->
<title>Scout Generator v1.0 — © SCOUT SYSTEM</title><!-- ② 瀏覽器標題 -->
<!-- 版本：v1.0 · © SCOUT SYSTEM -->                <!-- ③ 檔頭註解 -->
const APP_VERSION = 'v1.0';                        <!-- ④ runtime 常數 -->
<footer>© SCOUT SYSTEM · <strong>v1.0</strong></footer> <!-- ⑤ 用家可見 -->
```

`.gs`／`.mjs` 至少要 `APP_VERSION`／`VERSION` 常數 + 檔頭註解。
`contract_v1.0.json` 要 `"fileVersion": "v1.0"` + `"copyright": "© SCOUT SYSTEM"`。

> 測試會 `grep` 全部 `vX.Y` 出現位置，任何一個唔一致即 fail（V3）。

---

## V3 — 更新流程（五步，一步都唔少）

```
① 改檔名：app_v1.0.html → app_v1.1.html
② 改內文全部 v1.0 → v1.1（meta / title / 註解 / APP_VERSION / footer / console.info）
③ 改相關常數：codec VERSION、解碼器 MARK／PREFIX、合約 fileVersion、測試期望值
④ 改版本登記表（本檔 §6）+ CHANGELOG（如有）
⑤ 跑：node --test ... && node scripts/guard.mjs
```

**唔准**：
- 只改內文唔改檔名（舊檔名會繼續流傳）
- 只改檔名唔改內文（Runtime 顯示舊版）
- 覆蓋舊版檔（要保留一個舊版喺 Git 歷史，唔好硬改）
- 喺 code 寫 `// v1.1` 散裝註解當版號（要集中喺 `APP_VERSION` + 檔頭）

---

## V4 — 部署拷貝例外（Type C GAS）

Apps Script 硬性要求 HTML file 叫 `index.html`，`Code.gs` 亦係約定名 —— 同 V1 有衝突。解法：

```
Git 唯一真理（版本化源檔）       部署拷貝（名字固定，內容同源）
  brain_v1.0.gs      ──sync──▶    Code.gs
  shell_v1.0.html    ──sync──▶    index.html
```

- 由 [sync_canvas_v1.0.mjs](../templates/canvas/sync_canvas_v1.0.mjs) 產生，檔頭有 `GENERATED from ... (v1.0)` 標記。
- **唔准直接改部署拷貝**：改源檔 → 跑 sync → 跑測試。
- 部署拷貝內文 `APP_VERSION`／`meta` 一定要同源檔一致（測試守）。
- 更新版本時 sync 腳本本身嘅版號（`sync_canvas_v1.0.mjs`）都要一齊更新。

---

## V5 — 版號要入紀錄

- 每條 `RECORDS` 記 `appVersion` + `promptVersion`（[W5](12-copyright-scout-system.md)）。
- 水印 payload v2 本身有 `v2` 前標（演算法版本，同檔案版號分開，唔好撈亂）。
- 審計 log / 診斷報告要回傳 `backendVersion` + `appVersion`（[F8](02-foolproof.md)）。
- 出事時可以由成品圖水印 → `watermarkPayload` → RECORDS → 反查邊個 app 版本 / prompt 版本生成。

---

## V6 — 自動驗（唔靠人手記）

`scripts/guard.mjs` 同測試守：

```
✓ 檔名有 _vX.Y 嘅檔，內文一定要有同一個 vX.Y
✓ 所有交付 HTML 有 meta app-version + APP_VERSION + 可見版號 + © SCOUT SYSTEM
✓ Type C 部署拷貝（Code.gs / index.html）版號 = 版本化源檔
✓ contract_vX.Y.json 嘅 fileVersion = 檔名版號
✓ 水印 codec / 解碼器 / 生成器版號一致
✓ guard 會擋：_local_ / _injected / *.keyed 檔入 repo（W6）
✓ 單一 HTML 審計器會對照「靜態 HTML 版號」同 APP_VERSION（V1/V3）
```

> **2026-10-27 實證（[16 案例 §4](16-canvas-case-scout-comic.md#4--審計結果實跑5mb-版)）**：
> `童軍漫畫生成器` 有 `APP_VERSION = 4.2.1`，但 footer 靜態寫 `v4.2.0`、版本紀錄靜態寫 `v4.0.0`。
> 開機後 JS 會 override，所以平時睇唔到；**但開機守衛攔截／JS 出錯嗰陣，用戶就見到舊版**。
> 所以 V2 要求四處以上版號，而且**靜態 HTML 唔准留舊版號**——要由 JS 由 `APP_VERSION` 填入，
> 或者每次改版一齊改（後者易漏，建議前者）。審計器 `audit_single_html_v1.0.mjs` 會自動捉。

```bash
node --test templates/watermark/watermark.test.mjs   # V1/V2/V3 測試
node --test templates/canvas/brain.test.mjs          # V1/V5 + W1/W6 測試
node scripts/guard.mjs                               # 全倉版號 + 版權 + secret scan
```

---

## 6. 版本登記表（每次更新要改呢度）

| 日期 | 檔 | 舊 → 新 | 改咗乜 | 對應規則 |
|------|-----|---------|--------|----------|
| 2026-10-26 | `drawscout_decoder_v1.0.html` | — → v1.0 | 由用戶提供嘅 `drawscout.html` 收錄；加 v2 payload、XSS escape、雙版號、版權頁尾 | W1/W2/W3/V1 |
| 2026-10-26 | `scout_watermark_codec_v1.0.mjs` | — → v1.0 | 抽出嵌入／解碼演算法唯一真理 | W2/V1 |
| 2026-10-26 | `scout_generator_v1.0.html` | — → v1.0 | Type B 生成器示範（水印 + API KEY placeholder） | W2/W6/C5 |
| 2026-10-26 | `inject_key_v1.0.mjs` | — → v1.0 | 本機 API KEY 注入器 | W6/V1 |
| 2026-10-26 | `brain_v1.0.gs` / `shell_v1.0.html` | — → v1.0 | Type C 版本化源檔 + 部署拷貝 sync | V4/C6 |
| 2026-10-26 | `contract_v1.0.json` | — → v1.0 | action 白名單 + fileVersion + copyright | V2/C8 |
| 2026-10-26 | `PROMPT_v1.0.md` / `RECORDS_v1.0.md` / `PROMPTS_v1.0.md` | — → v1.0 | 檔名版號化 | V1 |
| 2026-10-27 | `scripts/audit_single_html_v1.0.mjs` | — → v1.0 | 單一 HTML / Canvas artifact 靜態審計（S/F/A/W/V/C，含靜態 fallback 版號檢查） | V6/C13-f |
| 2026-10-27 | `scripts/refresh_resources_v1.0.mjs` | — → v1.0 | 由 `api/data/apis.csv` 自動更新 `docs/15` 分類索引 | F1/V1 |
| 2026-10-27 | `scout_generator_v1.0.html` / `brain_v1.0.gs` | v1.0 → v1.0（**定稿前修正**） | key 由 `?key=` 改做 `x-goog-api-key` header；加零 key／C13 說明 | A1/W6/C13 |
| 2026-10-27 | `scripts/final_check_v1.0.mjs` + `scripts/final_check.test.mjs` + `docs/17-final-check-and-tutorial.md` | — → v1.0 | 六角度最終實測 orchestrator + STEP BY STEP 用戶教學 | F14/docs17 |
| 2026-10-27 | `scripts/audit_single_html_v1.0.mjs` + `scripts/audit.test.mjs` | v1.0 → v1.0（**定稿前修正**） | 改正兩點：單一 HTML 改用 **5MB 上限（C13-g）**、體積項目降做 INFO；C13 改為「三軌已實作可用」；修 `findings` 累積 bug；加 8 條守護測試 | C13/C13-g/F14 |

> **定稿前修正嘅定義**：以上 v1.0 檔全部係首次加入、未 commit／未交付過，所以同一版號內修正唔算「改版」。
> **一旦交付／commit 之後再改任何一個字，就要按 V3 升 `_v1.1`**，唔可以靜靜改 v1.0。

> **改版時**：喺度加一行，同時改檔名 + 內文 + 測試 + 呢張表。Git tag 用 `v<date>` 或者 semantic tag 都得，但一定要同交付檔版號對得上。

---

## 7. 同其他規則嘅關係

```
V（雙版號）  ←→  W（版權）：頁尾版號同時係版權標示一部分
V（雙版號）  ←→  F15：舊「版號只留 MD」已作廢；新規則係檔名+內文雙寫
V（雙版號）  ←→  F14：每條 V 規則都有測試守
V（雙版號）  ←→  A1：注入版（_local_）唔可以入 Git
V（雙版號）  ←→  S10：舊版檔唔好累積喺工作目錄，用 Git 歷史保存
```

> **ecportal 既有文件**（[進度追蹤旅系統升級版.md §9](../進度追蹤旅系統升級版.md)）寫「版號只留本 MD、code 唔寫 `// vX.X` 註解」—— 嗰個係**嗰個 repo 嘅專案約定**，同本通用規則唔同。新 app 一律跟 V 系列；要沿用舊約定就喺 PR 用 `EXCEPTION: V1` 登記。
