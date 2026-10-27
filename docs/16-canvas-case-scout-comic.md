# 16 — 實戰案例：童軍漫畫生成器（Gemini Canvas 單一 HTML，v4.2.1）

> **來源**：用戶 2026-10-27 提供嘅附件 `code_artifact (11).html`（2,139,320 B / 3,749 行）。
> **體積結論（2026-10-27 用戶定案，C13-g）**：2.04MB **完全合格** —— 單一 HTML / Gemini Canvas app
> **唔經 Vercel、唔強制瘦身，硬上限 5MB**（越輕量 LOAD 越快）。我較早前用 Vercel 嘅 S7（2MB）／S10（1MB）去判佢死刑係**錯**，已改正。
> 原件冇複製入 repo 只係因為佢仲有 V1 版號問題（見 §5），同體積無關；要收錄原件可以改名後放入。
> **點睇**：呢個係你真正行緊嘅 app，係 S/F/A/W/V 五套規則嘅**實證來源**——佢個 `VERSION_LOG` 就係一部踩坑史。
> 審計工具：[scripts/audit_single_html_v1.0.mjs](../scripts/audit_single_html_v1.0.mjs)（零 dependency，5MB 上限）。
> 相關：[09 三種結構](09-gemini-canvas.md)、[12 W 系列](12-copyright-scout-system.md)、[13 V 系列](13-versioning.md)、[14 API KEY 注入](14-api-key-injection.md)。

---

## 0 — 一句結論

呢個 app **已經做到**：
✅ **C13 三軌自動注入**（唯一 `API_KEY` slot + `credentials:'include'` 平台代理 + BYOK 後備）—— **已實作、真係用到，呢個就係正確做法**；
✅ W1 可見版權、W2 DCT 隱形水印、F `safeStore`、A 零寫死 key、單檔 2.04MB ≤ 5MB。

**剩低要執嘅**（5 項，全部唔涉及改注入機制）：
❌ V1 雙版號（檔名無版號 + 靜態 `v4.2.0`／`v4.0.0` vs `APP_VERSION 4.2.1`）、W1/V2 兩個 meta、`?key=` 放 URL（BYOK 後備路徑）。

> 我上一版寫「你個注入係過時／誤解／要改做本機 placeholder」係**錯**，已全部改正：
> [14 §0](14-api-key-injection.md#0-一句結論)、[09 C5](09-gemini-canvas.md#c5--type-b喺-gemini-自動注入-api-keyc13已實作可用)、[PLAYBOOK §1](../PLAYBOOK.md)。

---

## 1 — 佢係邊種結構？（對照 09）

| 項目 | 實際 | 判定 |
|------|------|------|
| 檔案 | 一個 HTML，內嵌 Tailwind CSS、64 張 base64 角色圖、全部 JS；2.04MB | **Type B**，**C13-g 5MB 合格，唔強制瘦身** |
| 出圖 | runtime call `generativelanguage.googleapis.com`，六格漫畫 + 角色參考圖 | Type B（有 AI） |
| 自動注入 | 唯一 `const API_KEY = ""` + `credentials:'include'` + `safeStore` BYOK + 冇 key 時唔加 `?key=` | **C13 三軌，已實作可用** ✅ |
| 水印 | `WM_MARK = 'DRAWSCOUT|v1'`，`STEP=32`，8×8 DCT `(2,3)` 中頻，QIM，生成同改圖都嵌 | **W2 ✅**（v1） |
| 版權 | 頁尾 `© 2026 Copyright Scout System · All Rights Reserved` | **W1 部分 ✅**（無 meta） |
| PROMPT | `systemPrompt`、`buildPagePrompt`、`castPromptBlock` 全喺前端 JS | **C9 正常**（Type B 本質；要保密先轉 Type C） |
| 紀錄 | 自訂角色存 `localStorage`（`drawscout-custom-characters-v1`），無 server 原圖／成品圖／使用紀錄 | **C10 Type B 可接受**，W5 唔完整 |
| 設定層 | 本機 API key 輸入 + API 狀態徽章 + 除錯面板 + 版本紀錄 | **F ✅**（工具類唔使隱藏超管） |

> 一句：**佢係 Type B，唔係 Type A**（有 prompt、有 key、有出圖），亦**未到 Type C**（無 GS 腦、無 RECORDS）。
> 如果要保護 PROMPT 同記錄原圖／成品圖，遷移路徑見 [§5](#5--升級路線由-v421-去-v430)。

---

## 2 — 自動注入：你已經實作，而且真係用到

> **呢個先係正確嘅注入方式。** 以下全部係由你個 app 嘅實際 code + `VERSION_LOG` 抄出嚟，唔係我估。
> 規則 ID **C13**（[14 §1.1](14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)、[09 C13](09-gemini-canvas.md#c13--單一-html-體積同自動注入2026-10-27-定案)）。

### 三軌係同一套實作（唔係三選一）

**完整 code（唯一真理）**：[14 §1.1](14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)。呢度只列重點，唔好喺兩份文件各存一份 code（F1）。

```
① const API_KEY = "";                      全檔唯一，平台注入 slot
② fetch(..., { credentials:'include' })    冇 key 時唔加 ?key=，平台代理加認證
③ safeStore + resolveApiKey()             BYOK 後備；冇 key 唔拋錯，照樣送出請求
```

| 軌 | 你 VERSION_LOG 嘅實測證據 | 點解重要 |
|----|---------------------------|----------|
| **① 唯一 slot** | v3.7.0：「檔案內有兩處相同的 key 宣告文字，Canvas 自動注入時改錯了第一處（版本紀錄內的字串），真正的宣告仍是空值」→ 全檔只剩一處，移到 script 最前面 | 平台**會**對呢個 slot 做注入；重複宣告 = 改錯位 |
| **② 平台代理** | v3.9.0：「平台是靠**請求代理**加認證，不是改 JS 變數」→ 冇 key 時唔加 `?key=`、加 `credentials:include`、移除「沒有 key 就拋錯」、串流請求同樣改 | 冇本機 key 嗰陣都照樣生成到圖 |
| **③ BYOK 後備** | v3.5.1：「Canvas 沙盒禁 localStorage，存取即拋錯令整個程式停擺」→ `safeStore`；v3.8.0：API 狀態徽章 + 缺 key 就地輸入自動續跑 + 全域掃 `AIza` | 離開 Canvas／注入失效都有得救 |

> ✅ **結論**：① 同 ② **並存**，唔係互相排斥。你 v3.7.0 發現「重複宣告令注入改錯位」正正證明 ① 係真嘅注入 slot；
> v3.9.0 發現「請求代理」係補上 ② 令冇 key 都用得。我上一版將 ① 講成「過時註解」係錯 —— **兩句註解都啱，只要保持全檔唯一**。
> ❌ **唔好**為咗「簡化」而刪走任何一軌，亦唔好改成本機 `__INJECT_GEMINI_API_KEY__` 手動替換。

### 唯一可選加固（唔影響三軌）

③ BYOK 後備路徑用咗 `?key=` query。key 放 URL 會落 server access log／browser history／referrer（A1/W6）。
將 ③ 改成 `headers: { 'x-goog-api-key': key }` 就得 —— **①② 完全唔使改**。

### 兩類 app 唔好撈亂

| | 單一 HTML / Gemini Canvas（你呢個） | AI Studio Build 全端 app |
|---|---|---|
| 注入方式 | **C13 三軌**（已實作） | `GEMINI_API_KEY` server-side secret（§1） |
| 體積 | **5MB，唔強制瘦身**（C13-g） | `dist < 5MB` / bundle `< 2MB`（S7） |
| 部署 | 一個 HTML 檔 / Canvas preview | Vercel / Cloud Run / server route |

> 🇭🇰 **香港含義**：② 正正係「香港用得到」嘅原因 —— 請求由平台代理加認證，唔係香港瀏覽器直打
> `generativelanguage.googleapis.com`（[`api/docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md) 實測香港 IP 封咗）。
> 所以：**喺 Canvas preview 入面用得；撳 ZIP 落 `file://` 就要靠 ③ BYOK**。
> 要交付俾香港用戶永久用，仍然係 [零 key 單一 HTML](14-api-key-injection.md#21-首選零-key-單一-htmltype-ab-水印解碼器模式)（水印解碼器）或者 [Type C server-side](14-api-key-injection.md#22--24-三條要-runtime-ai嘅路揀一條)。

---

## 3 — 你個 `VERSION_LOG` = 五套規則嘅實證

| 版本（日期） | 你實際做咗 | 對應規則 |
|--------------|-----------|----------|
| v3.0.0–3.1.0 | 加入童軍角色層、角色人數跟劇情走 | C9 PROMPT 資產化 |
| v3.2.0 | 拆「重新生成／回到最開始」，失敗後可續畫 | **F** 可恢復、唔好一刀切 |
| v3.3.0 | 統一 SCOUT SYSTEM 主題；頁尾加 Copyright；故仔改原創 | **W1／W8** 版權 + 第三方素材 |
| v3.4.0 | 修正多餘 `</div>` 導致結構錯誤 | **F** HTML 結構檢查 |
| v3.5.0 | 版本號顯示（標題／頁尾／除錯面板）；生圖失敗降級重試；錯誤卡顯示 HTTP status | **V2 多點版號 + F 錯誤可診斷** |
| v3.5.1 | ⭐ Canvas sandbox 禁 `localStorage`，存取即拋錯令全 app 停擺 → `safeStore` | **C13-③ / F 沙盒防呆** |
| v3.5.2 | 1.20MB → 433KB；最長一行 848KB → 31KB；開機守衛 | **F 開機自檢**（當年係為咗載入穩定，唔係通用瘦身規矩） |
| v3.6.0 | 移除 Tailwind CDN，預編譯內嵌 CSS 24KB；斷網測試 | **F 零外部樣式依賴**（可選） |
| v3.7.0 | ⭐ 兩處相同 key 宣告令**平台注入改錯位** → 全檔只剩一處 | **C13-① 唯一 slot** |
| v3.8.0 | API 狀態徽章；缺 key 就地輸入自動續跑；掃描全域變數搵 `AIza` | **C13-③ / F 狀態可視** |
| v3.9.0 | ⭐⭐ 平台「請求代理」加認證；冇 key 唔加 `?key=`；`credentials:include` | **C13-② 平台代理** |
| v4.0.0 | 角色「主角／配角／群眾」三層，prompt 明確寫性別同定位 | **C9 PROMPT 結構化** |
| v4.1.0 | 生成／改圖後自動嵌 DCT 隱形水印 + 獨立解碼器（測試下載圖、WhatsApp JPEG） | **W2／W3** |
| v4.2.0–4.2.1 | 13 種漫畫風格；本機保存自訂角色（最多 10 款） | **F 配額 + V 版號** |

> 呢個 log 本身就係一部「點解要有 S/F/A/W/V」嘅教科書。新版 app 可以直接引用呢張表做 review 範本。
> **注意**：v3.5.2／v3.6.0 嘅瘦身係你當年為咗**載入穩定**做嘅專案決定，**唔係通用規則** ——
> C13-g 講清楚單一 HTML 5MB 內唔強制瘦身。

### 水印互通實測（W3 向後兼容）

你個 app 用嘅常數同我哋 [`drawscout_decoder_v1.0.html`](../templates/watermark/drawscout_decoder_v1.0.html) **完全一致**：
`DRAWSCOUT|v1`、`STEP = 32`、8×8 DCT `(2,3)` 基底、payload 循環、解碼多數決 + confidence > .58。
我哋加咗一條測試，將你 v4.2.1 嘅 `embedSourceWatermark` 原碼抄入去 embed，再用我哋 decoder 解：

```
node --test templates/watermark/watermark.test.mjs
✓ W3：真實 app 嘅 legacy embed → 我哋 decoder 解到 DRAWSCOUT|v1
```

即係話：**你而家出嘅圖，我個 decoder 解到；我個 v2 payload，你個 v1 decoder 唔會誤判**（W3 向後兼容）。
v1 payload 得 `DRAWSCOUT|v1`，**無單位／日期／hash** → 可選升級做 v2（[W5／V5](12-copyright-scout-system.md#w5--原圖成品圖使用紀錄type-c-必做)）。

---

## 4 — 審計結果（實跑，5MB 版）

```bash
node scripts/audit_single_html_v1.0.mjs "code_artifact (11).html"
```

```
單一 HTML 審計 v1.0 — code_artifact (11).html
C13-g：5MB 上限（唔經 Vercel、唔強制瘦身）· 3749 行 · S/F/A/W/V/C 對照

  ✓ [C13-g] 單檔 2.04 MB ≤ 5MB（Gemini Canvas 上限）— 唔強制瘦身
  · [C13-g/S] 最長一行 542492 chars（第 1095 行）、3749 行 — 體積只做參考，唔判 FAIL；Canvas 編輯／載入卡住先考慮拆行
  · [C13-g/S6] 64 張 inline base64 圖 — 單一 HTML 可以用，唔使外置（除非超 5MB）
  · [F/C13-g] 4 個外部 CDN（fonts.googleapis.com, cdnjs.cloudflare.com）— 斷網降級自己決定，唔係體積問題
  ✓ [C13] 全檔 1 處 API_KEY 宣告 = 平台注入 slot；保持唯一就啱
  ✓ [C13] credentials:'include' 已實作 = 平台請求代理加認證（已驗證可用嘅正確注入方式）
  · [C13] 有本機／BYOK 後備 key 來源（用戶自己入 key，離開 Canvas 都用得）
  ✓ [A1] 檔內無真 key 形狀字串
  ✗ [A1/W6] BYOK 後備路徑將 key 放喺 URL query（?key=...）— 會落 log／history／referrer；淨係呢條路改做 x-goog-api-key header，平台注入／代理機制唔使改
  ! [A1] 掃描所有 window 全域變數搵 key — 可加固做只讀明確 slot；但唔影響你個注入機制運作
  ✗ [W1] 無 <meta name="copyright"> — 加 `© SCOUT SYSTEM`
  ✓ [W1] 可見頁面有版權標示
  ! [W2/W5] 只有 v1 payload（DRAWSCOUT|v1）— 可選升 v2（單位＋日期＋hash）；v1 解碼器仍向後兼容
  ✗ [V1] 檔名 code_artifact (11).html 無 _vX.Y 版號 — 每次更新檔名＋內文要同步改
  · [V2] APP_VERSION = v4.2.1
  ✗ [V2] 無 <meta name="app-version"> — 至少要 meta／title／檔頭／常數／頁尾四處
  ✗ [V1/V3] 靜態 HTML 有舊版號 v4.0.0, v4.2.0（APP_VERSION v4.2.1）— JS 未開機／開機守衛攔截時用戶會見到錯版
  ! [C9/A] PROMPT 寫咗喺前端 JS — 「檢視原始碼」睇到；要保密就轉 Type C 腦殼分離（Code.gs），但 Type B 咁做係正常
  · [C10] 無 server-side 使用紀錄／原圖成品圖存檔 — Type B 交付可接受，但要喺 README 講明限制（W5）
  ✓ [F] localStorage 有安全包裝（sandbox 唔會炸）

❌ AUDIT FAIL — 5 項要修（3 個警告）
```

### 逐項點解

1. **V1/V3（最易中）**：footer `v4.2.0`、紀錄 `v4.0.0` vs `APP_VERSION 4.2.1`。JS 開機後會 override，但**開機守衛攔截時用戶會見到舊版** → [V2](13-versioning.md#v2--內文至少四處要寫版號)。
2. **體積合格**：2.04MB ≤ 5MB。最長一行／64 張 base64／CDN 全部只做 INFO。越輕量 load 越快，但係可選優化；超 5MB 或實際載入卡住先至拆圖。
3. **`?key=`**：只係 ③ BYOK 後備。改 `x-goog-api-key` header 就得，①② 唔使改。
4. **其餘係 WARN 唔係錯**：全域掃 key／v1 水印／PROMPT 前端公開（Type B 本質）。**C13 三軌全部 PASS** —— 你個注入係啱嘅。

---

## 5 — 升級路線：由 v4.2.1 去 v4.3.0

> 跟足 [V3 五步](13-versioning.md#v3--更新流程五步一步都唔少)：檔名 → 內文 → 常數／合約／測試 → 版本登記表 → 跑 guard。

```bash
# 0. 改名（V1）—— 2.04MB ≤5MB，可以直接入 repo
mv "code_artifact (11).html" scout_comic_generator_v4.3.0.html

# 1. 內文四處以上（V2）：meta app-version / meta copyright / title /
#    檔頭註解 / APP_VERSION / APP_BUILD / footer / versionLogNow 全部 v4.3.0
#    → 靜態 HTML 唔好寫死舊版號，改用 JS 由 APP_VERSION 填入

# 2. 保留 C13 三軌（唔好改！）
#    ① const API_KEY = ""; 全檔唯一   ② credentials:'include' + 冇 key 唔加 ?key=
#    ③ safeStore BYOK 後備 + 缺 key 先照樣送出請求

# 3. 可選加固（只改 ③）：BYOK key 由 ?key= 改做 headers: {'x-goog-api-key': key}
# 4. 可選升級 W2：WM_MARK 升 v2 payload（SCOUTSYSTEM|v2|unit4|date|hash4，264 bit）
# 5. 補 VERSION_LOG 一條 + 更新 docs/13 §6 版本登記表

# 6. 驗收
node scripts/audit_single_html_v1.0.mjs scout_comic_generator_v4.3.0.html   # 目標 0 FAIL
node scripts/final_check_v1.0.mjs --html scout_comic_generator_v4.3.0.html
```

> **唔強制做**（可選提速）：拆 64 張 base64、壓最長一行、減 CDN。呢啲係 Vercel `dist` 類 S7/S10，唔適用喺單一 HTML；但越輕量 LOAD 越快。

### 如果要 PROMPT 保密 + 原圖／成品圖紀錄（轉 Type C）

唔好喺單一 HTML 度硬加 —— 跟 [09 C6–C10](09-gemini-canvas.md#c6--type-c腦殼分離html-殼--gs-腦) 拆：

```
shell_v1.0.html  ← UI + CSS + event；零 prompt、零 key
   ↓ google.script.run.api(action, payload)
Code.gs          ← SYSTEM_PROMPT / buildPagePrompt / ACTIONS 白名單 /
                    ScriptProperties.GEMINI_API_KEY / UrlFetchApp（header 帶 key）
RECORDS Sheet    ← 上傳原圖 hash、成品圖 hash、prompt 版本、使用者、時間、usage log
```

可抄：[templates/canvas/](../templates/canvas/README.md)（含 contract、`node --test` 16 條腦測試、sync 產生部署拷貝）。

---

## 6 — 呢個案例沉澱落通用規範嘅嘢

| 新增／強化 | 內容 | 位置 |
|-----------|------|------|
| **C13** | 單一 HTML 嘅**正確自動注入 = 三軌同一套**：① 全檔唯一 `const API_KEY = ""` 注入 slot ② `credentials:'include'` + 冇 key 唔加 `?key=` 平台代理 ③ `safeStore` BYOK 後備。**已實作、實測可用**，唔係本機換 placeholder | [14 §1.1](14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)、[09 C5](09-gemini-canvas.md#c5--type-b喺-gemini-自動注入-api-keyc13已實作可用) |
| **C13-g** | **單一 HTML / Gemini Canvas app 係另一類**：唔經 Vercel、**唔強制瘦身**，硬上限 **5MB**；S7／S10／S6 唔適用；體積項目只做 INFO | [01-slim S7](01-slim.md#s7--ci-硬攔體積)、[09 C13](09-gemini-canvas.md#c13--單一-html-體積同自動注入2026-10-27-定案)、guard `checkHygiene` |
| **A1/W6** | BYOK 後備路徑嘅 key 唔落 URL query，一律 `x-goog-api-key` header（只改 ③，唔影響 ①②） | [guard](../scripts/guard.mjs) `checkEnvLeakPattern` |
| **A1** | `vite.config.*` 禁 `loadEnv(..., '')` + `define process.env.API_KEY`；build 後 scan `dist/**` key | [14 §3](14-api-key-injection.md#3--真實陷阱ai-studio-export-會靜靜-inline-key-入-client-bundle) |
| **V2** | 靜態 HTML 版號要同 `APP_VERSION` 一致；JS override 唔算數（開機失敗會穿幫） | 審計器 + [13](13-versioning.md) |
| **F** | key 宣告全檔唯一；`localStorage` 一定要 try/catch（Canvas sandbox） | 審計器 + [02](02-foolproof.md) |
| **W3** | 新增「真實 app legacy embed → 我哋 decoder」互通測試 | `templates/watermark/watermark.test.mjs` |
| **C13-f** | 每個單一 HTML 交付前跑 `node scripts/audit_single_html_v1.0.mjs <檔名>`（5MB 版，FAIL 即 No-Go）；`scripts/audit.test.mjs` 8 條測試守（含 5MB 邊界、三軌偵測、findings 唔累積） | CI + [10-checklists](10-checklists.md#7-gemini--canvas-app-交付前abc-通用) |
