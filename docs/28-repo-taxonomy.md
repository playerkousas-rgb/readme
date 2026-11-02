# 28 — 85 個 Repo 用「形式」點分（輕／有後台／Gemini）

> **2026-11-02 修正**：上一版按「內容／主題」分（行政、地圖、雀鳥…）；用戶指明要按**形式**分 —— 邊啲輕、邊啲有後台、邊啲係 Gemini。本版全部重做。
> 方法：`gh api` 逐 repo 攞檔案樹 + `package.json` dependencies，再 **shallow clone 83 個 repo** 本機 grep（其餘 2 個大倉用檔案樹 + 已讀檔案）；**檔案層面分類，唔係功能實測**。
> 配套：[27](27-repo-starter.md) 開局 · [29](29-reading-map.md) 閱讀 · [30](30-repo-health-check.md) 體檢 · [docs/README](README.md) 分章

---

## 1. 一句結論

**30 個「輕」、21 個「中」、34 個「重」；30 個有後台；17 個同 Gemini／AI 有關（當中真正直接 call Gemini API 得 5 個）。**
「輕」唔等於「簡單」，`cubsmeeting` 有 318 個檔但冇 build、冇 server，仍然係輕；「有後台」唔等於「多層系統」，兩者要分開守規矩。

## 2. 用返你哋自己嘅術語去定義

| 軸 | 值 | 對應邊份規則 |
|---|---|---|
| **輕重** | 輕 / 中 / 重 | [PLAYBOOK §0 三分類](../PLAYBOOK.md)（工具／App／系統）、[C13-g](09-gemini-canvas.md) |
| **交付形狀** | 單一 HTML／靜態多檔／框架 SPA／後台靜態殼／多層系統／資料管道／知識倉／空殼 | [09](09-gemini-canvas.md) Type A/B/C、[01](01-slim.md) |
| **有冇後台** | 無 / `api/` / GAS / Supabase / 混合 | [06-vercel](06-vercel.md) VL、[07-apps-script](07-apps-script.md)、[08-supabase](08-supabase.md)、[EXTERNAL](../EXTERNAL.md) |
| **Gemini／AI** | 無 / Canvas 單檔 / Gem・Share Link / 直接 API / 其他 AI 辨識 / AI 文件 | [09](09-gemini-canvas.md)、[14-api-key-injection](14-api-key-injection.md) |
| **P1 檔次** | 工具 / App / 系統（推斷） | [PLAYBOOK §0](../PLAYBOOK.md) |

**「輕」嘅硬定義**：冇 framework build（`vite`／`next`／`react` deps）、冇 server-side code（`api/`、`.gs`、`script.google.com`、Supabase client）、交付就係一堆靜態 HTML/JS/JSON。對應 P1「工具 stateless」+ [docs/09 Type A](09-gemini-canvas.md) + **C13-g 單一 HTML 5MB 上限（唔強制瘦身）**。
**「有後台」嘅硬定義**：repo 內有 `api/` 或 `app/api/`（Vercel/Next serverless）、`.gs` 或 `script.google.com`（Apps Script）、`@supabase/supabase-js` 或 Supabase RPC／SQL。純 `vercel.json` rewrite 去靜態檔**唔算**。
**「Gemini」要拆三種，唔好撈埋**：
1. **Canvas／Share Link 單檔 app**（Type A/B/C、C13 注入、BYOK）—— 例如 `DRAWSCOUT`、`Infographic`、`oneclick-photo`；
2. **直接 call Gemini／Imagen API** —— `scout-policy-assistant`、`prompt`、`scoutdesign`、`answer`、`MD`；
3. **只係目錄／文件／其他 AI** —— `GEMINI`（用 Supabase 管 Canvas Share Link 目錄，**佢本身係 React+Vite+Supabase，唔係一支 Canvas app**）、`api/docs/ai.md`、三隻雀鳥 app 用 Hugging Face 辨識、**唔係 Gemini**。

> ⚠️ 用戶最容易誤會：`GEMINI` 呢個 repo 名唔等於「呢個係 Gemini app」；`AvianDex/index.html` 入面 `gemini-3.1-pro-preview` 係設計平台注入嘅瀏覽量 script，唔係功能（見 §6）。

## 3. 形式總表

| 形式 | 數 | 輕重 | 代表 repo | 要守嘅規矩 | 檢查重點 |
|---|:--:|---|---|---|---|
| **單一 HTML／少檔靜態** | 4 | 輕 | `Infographic`, `decode`, `morse-beacon-app`, `oneclick-photo` | P1 工具、C13-g 5MB、W1/V 雙版號、A1 唔好放 key | audit_single_html、W1/V2、5MB |
| **靜態多檔／PWA** | 11 | 輕 | `AYP`, `CUBSGAME`, `DRAWSCOUT`, `HKMAP` … | P1 工具／App、S 瘦身、F10 exportState、service worker cache | guard G10、repo_health size/scaffold |
| **框架 SPA／PWA** | 28 | 中/重 | `AvianDex`, `CERT`, `GAME`, `GEMINI` … | P1 App、S7 dist <5MB、A1 無 secret 入 bundle、final_check | final_check 六角度、S7、npm audit（A16） |
| **後台靜態殼** | 3 | 重 | `skw-booking-system`, `troop-camera`, `website` | VL1–VL12、A 系列、`/api/proxy` inject key、VL7 rate limit | repo_health secrets/env、VL7、EXTERNAL 零特權 |
| **後台／多層系統** | 18 | 重 | `DGA`, `course`, `cubsbadge`, `dbs` … | 全套 + 設定層 + 隱藏超管 + registry + 審計鏈（缺一不可） | checklist §1.1 全勾 + 設定層／超管實測 |
| **資料管道** | 5 | 重 | `forward`, `hkcamping`, `scout-circulars`, `scoutworld` … | [20]/[21]：唔好每日 commit 可再生 JSON、fail-closed、30 日 artifact | repo_health cron-data、data 分支快照、fail-closed 測試 |
| **知識／索引倉** | 4 | 中/輕 | `MD`, `answer`, `api`, `readme` | G10 連結／錨點、W8 標來源、P1 記錄日期與未核實項 | guard G10、內容現行版核對（answer Skill） |
| **空殼／預留** | 12 | 輕 | `AGENT`, `Materials`, `PPTMAKER`, `bookkeeping` … | 先決定留／合併／archive；留就補 [27] 起手包 | repo_health scaffold + 12 樣起手包 |

## 4. 三條你要嘅名單

### 4.1 「輕」（30 個，無 build ＋ 無後台）

`AGENT`· `AYP`· `CUBSGAME`· `DRAWSCOUT`· `HKMAP`· `Infographic`
`Materials`· `PPTMAKER`· `answer`· `api`· `bookkeeping`· `ceremony`
`cubs_portal`· `cubsmeeting`· `decode`· `gh_portal`· `ghmeeting`· `gitlink`
`minigame`· `morse-beacon-app`· `oneclick-photo`· `onlinegame`· `readme`· `rs_portal`
`rsmeeting`· `sc_portal`· `scoutmeeting`· `upgrade`· `voice_slide_web`· `vsmeeting`

> 呢批**基本唔使設定層／隱藏超管**。當中真正單一 HTML 嘅 4 個先至行 **C13-g 5MB + W1/V2**；其餘靜態多檔行 S 瘦身 + `guard` G10；知識倉／空殼另按 §6 處理。

### 4.2 「有後台」（30 個）

- **Vercel /api+GAS**（13）：`DGA`· `cubsbadge`· `dbs3.0`· `event`· `roverbadge`· `scout-admin`
`scout-district-portal`· `scoutbadge`· `troop-attendance`· `troop-portal`· `troop_portal`· `vs_portal`
`vsbadge`
- **Vercel /api**（9）：`AvianDex`· `HM20C`· `birddex3`· `cardmaster`· `prompt`· `scout-circulars`
`skw-birdex2`· `skw-booking-system`· `troop-camera`
- **GAS**（4）：`course`· `dbs`· `router`· `troop-router`
- **Vercel /api+Supabase**（2）：`scout-policy-assistant`· `website`
- **Supabase**（1）：`GEMINI`
- **Vercel /api+GAS+Supabase**（1）：`member-portal`

> 有後台就要 [A 安全](03-security.md)／[VL7 rate limit](06-vercel.md)／[EXTERNAL 零特權](../EXTERNAL.md)；若同時係 `後台／多層系統`（18 個），仲要**設定層 + 隱藏超管 + registry + 審計鏈**，一個都唔少。

### 4.3 「Gemini／AI」（17 個，逐個講清楚屬邊種）

| Repo | 屬邊種 | 關鍵證據 |
|---|---|---|
| `DRAWSCOUT` | **Gemini Gem／BYOK 瀏覽器直連**（[16](16-canvas-case-scout-comic.md) 嘅 Canvas 單檔案例） | `可行性研究.md`：「領袖自備 API Key，不設後台」；`DRAWSCOUT|v1` 水印 |
| `Infographic` | **Canvas 單檔＋BYOK** | `app.js` 有 API key 檢查 regex；4 個檔、無 build |
| `oneclick-photo` | **Gem／OPAL ＋ BYOK Gemini API 頁** | `docs/GEM-系統指令.txt`、`extra/api.html`（`gemini-2.5-flash-image`） |
| `GEMINI` | **Canvas Share Link 目錄**（本身 React+Vite+Supabase，**唔係 Canvas app**） | `README.md`、`package.json` `@supabase/supabase-js` |
| `website` | 收錄／分發 Canvas app 嘅目錄 | `README.md` SCOUT APP STORE |
| `MD` | **直接 call Gemini**（問答頁） | `gemini/index.html`（README：`需要 Gemini API key`） |
| `answer` | **BYOK 直接 call Gemini** | `web/index.html`：`generativelanguage.googleapis.com/...:generateContent` |
| `scout-policy-assistant` | **直接 call Gemini（SDK，server-side）** | `src/lib/gemini.ts` `@google/generative-ai` + `GEMINI_API_KEY` |
| `prompt` | **直接 call Gemini（Next server route）** | `app/api/generate/route.ts`、`lib/providers.ts` |
| `scoutdesign` | **Gemini Imagen（BYOK）** | `src/lib/aiProviders.ts` `generativelanguage.googleapis.com/...:predict` |
| `cardmaster` | 其他 AI 生圖（**Flux，非 Gemini**） | `app/api/generate-image/route.ts` `model = 'flux'` |
| `AvianDex` | 其他 AI 辨識（**HF／Nyckel，非 Gemini**） | `api/analyze.js` |
| `birddex3` | 其他 AI 辨識（**HF／ImageNet，非 Gemini**） | `api/analyze.js`、`src/lib/aiClient.ts` |
| `skw-birdex2` | 其他 AI 辨識（**HF／ImageNet，非 Gemini**） | `api/analyze.js`、`src/lib/aiClient.ts` |
| `scout-circulars` | AI 底圖（**外製圖片**，repo 內無 API call） | `README.md` IG Story 流程 |
| `api` | AI 文件（`docs/ai.md` 免費 tier 索引） | 純 MD／CSV |
| `readme` | AI 規則／模板（[09](09-gemini-canvas.md)、[14](14-api-key-injection.md)、`templates/canvas/`），**非 app** | 本倉 |

**計法**：repo 內真係有 Gemini／Imagen endpoint 或 SDK 嘅 **5 個**（`MD`、`answer`、`scout-policy-assistant`、`prompt`、`scoutdesign`，另 `oneclick-photo` 有 BYOK 頁）；純 Canvas／Gem／Share Link 型 **5 個**；其餘 7 個係其他 AI／文件／目錄，**唔好當 Gemini app** 去守 [09](09-gemini-canvas.md) Type B/C 規矩。

## 5. 85 個 repo 逐個（形式 × 後台 × AI）

> 「後台」欄寫 `無` = 純前端；`P1 檔次` 係按檔案結構推斷，正式判定仍要跟 [PLAYBOOK §0](../PLAYBOOK.md) 同人手確認。

| Repo | 形式 | 輕重 | 後台 | Gemini／AI | P1 檔次（推斷） | 證據 |
|---|---|:--:|---|---|---|---|
| `AGENT` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `AYP` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 HTML、31 檔 |
| `AvianDex` | 框架 SPA／PWA | 重 | Vercel /api | AI 辨識（HF／Nyckel；非 Gemini） | 工具或 App | api/、vite/next.config |
| `CERT` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `CUBSGAME` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 workflows |
| `DGA` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs、1 workflows |
| `DRAWSCOUT` | 靜態多檔／PWA | 輕 | 無 | Gemini Gem＋BYOK 直連 | 工具或 App | 1 HTML、25 檔 |
| `GAME` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `GEMINI` | 框架 SPA／PWA | 重 | Supabase | Canvas Share Link 目錄（Supabase 管理） | 工具或 App | vite/next.config |
| `HKMAP` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 workflows |
| `HM20C` | 框架 SPA／PWA | 重 | Vercel /api | 無 | 工具或 App | api/、vite/next.config |
| `Infographic` | 單一 HTML／少檔靜態 | 輕 | 無 | Canvas 單檔＋BYOK | 工具或 App | 1 HTML、4 檔 |
| `MCScript` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | 1 HTML、7 檔 |
| `MD` | 知識／索引倉 | 中 | 無 | Gemini 問答頁 | 工具／文件 | 25 .py、2 workflows、knowledge/*.md |
| `Materials` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `Orienteering` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `PPTMAKER` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `Veritas` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | 1 HTML、50 檔 |
| `Veritas-Project` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | 0 HTML、56 檔 |
| `Zentangle-Pattern-Generator` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `answer` | 知識／索引倉 | 輕 | 無 | BYOK Gemini 查冊頁 | 工具／文件 | 6 .py、SKILL.md |
| `api` | 知識／索引倉 | 輕 | 無 | AI 免費 tier 索引 | 工具／文件 | 0 HTML、33 檔 |
| `birddex3` | 框架 SPA／PWA | 重 | Vercel /api | AI 辨識（HF／ImageNet） | 工具或 App | api/、vite/next.config、1 workflows、4 .py |
| `bookkeeping` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `card` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `cardmaster` | 框架 SPA／PWA | 重 | Vercel /api | AI 生圖（Flux /api/generate-image） | 工具或 App | vite/next.config |
| `ceremony` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `code` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `course` | 後台／多層系統 | 重 | GAS | 無 | 系統 | .gs |
| `cubs_portal` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `cubsbadge` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `cubsmeeting` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 HTML、318 檔 |
| `dbs` | 後台／多層系統 | 重 | GAS | 無 | 系統 | .gs、vite/next.config |
| `dbs3.0` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | .gs、vite/next.config |
| `decode` | 單一 HTML／少檔靜態 | 輕 | 無 | 無 | 工具或 App | 1 HTML、9 檔 |
| `doll` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `drawtheroute` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config、3 .py |
| `event` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs、9 .py |
| `forward` | 資料管道 | 重 | 無 | 無 | App／系統 | 1 HTML、18 檔 |
| `gh_portal` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `ghmeeting` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 3 HTML、168 檔 |
| `gitlink` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `hkcamping` | 資料管道 | 重 | 無 | 無 | App／系統 | 4 workflows |
| `knotmaster` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `member-portal` | 後台／多層系統 | 重 | Vercel /api+GAS+Supabase | 無 | 系統 | .gs、vite/next.config |
| `minigame` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 HTML、17 檔 |
| `morse-beacon-app` | 單一 HTML／少檔靜態 | 輕 | 無 | 無 | 工具或 App | 1 HTML、28 檔 |
| `oneclick-photo` | 單一 HTML／少檔靜態 | 輕 | 無 | Gem／BYOK Gemini API | 工具或 App | 4 HTML、14 檔 |
| `onlinegame` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `photo-edit` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `pioneer` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `prompt` | 框架 SPA／PWA | 重 | Vercel /api | Next /api/generate → Gemini | 工具或 App | vite/next.config |
| `readme` | 知識／索引倉 | 輕 | 無 | AI 規則／模板（非 app） | 工具／文件 | MD + templates + scripts（.gs 只係範本） |
| `router` | 後台／多層系統 | 重 | GAS | 無 | 系統 | .gs |
| `roverbadge` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `rs_portal` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `rsmeeting` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `sc_portal` | 空殼／預留 | 輕 | 無 | 無 | 未定 | 只得 README／空 |
| `scout-admin` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `scout-circulars` | 資料管道 | 重 | Vercel /api | AI 底圖（外製） | App／系統 | api/、15 workflows、79 .py |
| `scout-district-portal` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | .gs、vite/next.config |
| `scout-policy-assistant` | 框架 SPA／PWA | 重 | Vercel /api+Supabase | Gemini API（GoogleGenerativeAI） | 工具或 App | api/、supabase/、vite/next.config |
| `scout-survival-tin` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `scoutbadge` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `scoutdesign` | 框架 SPA／PWA | 中 | 無 | Gemini Imagen（BYOK） | 工具或 App | vite/next.config |
| `scoutmeeting` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 HTML、216 檔 |
| `scoutworld` | 資料管道 | 重 | 無 | 無 | App／系統 | 3 workflows、4 .py |
| `skw-birdex2` | 框架 SPA／PWA | 重 | Vercel /api | AI 辨識（HF／ImageNet） | 工具或 App | api/、vite/next.config、4 .py |
| `skw-booking-system` | 後台靜態殼 | 重 | Vercel /api | 無 | App／系統 | api/ |
| `skw-radar-hunt2` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `skw-score` | 框架 SPA／PWA | 中 | 無 | 無（AI 字眼命中，無 API 證據） | 工具或 App | vite/next.config |
| `skw-tracking-signs` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | vite/next.config |
| `troop-attendance` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `troop-camera` | 後台靜態殼 | 重 | Vercel /api | 無 | App／系統 | api/、1 workflows |
| `troop-portal` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | .gs、vite/next.config |
| `troop-router` | 後台／多層系統 | 重 | GAS | 無 | 系統 | .gs |
| `troop_portal` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs、1 workflows |
| `upgrade` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 workflows |
| `veritas2` | 框架 SPA／PWA | 中 | 無 | 無 | 工具或 App | 0 HTML、55 檔 |
| `voice_slide_web` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 2 HTML、16 檔 |
| `vs_portal` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `vsbadge` | 後台／多層系統 | 重 | Vercel /api+GAS | 無 | 系統 | api/、.gs |
| `vsmeeting` | 靜態多檔／PWA | 輕 | 無 | 無 | 工具或 App | 1 HTML、164 檔 |
| `website` | 後台靜態殼 | 重 | Vercel /api+Supabase | 收錄 Canvas app（本身非 AI） | App／系統 | api/ |
| `whereami` | 資料管道 | 重 | 無 | 無 | App／系統 | vite/next.config、2 workflows |

## 6. 形式 → 要守咩、點檢查

| 形式 | 起手包（[27](27-repo-starter.md)） | 本倉檢查 | 必讀 |
|---|---|---|---|
| 單一 HTML／少檔靜態 | 12 樣可簡化 SCOPE／GLOSSARY | `audit_single_html_v1.0.mjs`、W1/V2、5MB | [09 C2](09-gemini-canvas.md)、[13](13-versioning.md) |
| 靜態多檔／PWA | 12 樣 | `guard.mjs` G10、`repo_health` size/scaffold | [01](01-slim.md)、[02](02-foolproof.md) |
| 框架 SPA／PWA | 12 樣 + `.gitignore` ＋ 13a 設計檢查（[27 §2b](27-repo-starter.md)） | S7、`npm audit`、三寬度望圖 | [06](06-vercel.md)、[17](17-final-check-and-tutorial.md) |
| 後台靜態殼／多層系統 | **全套**（設定層＋超管＋registry＋審計鏈）＋ [31](31-system-basics.md) 基本功能驗收（第 14 項） | `repo_health` secrets/env、`guard` A1、[10 checklists](10-checklists.md) §1.1、帳號／回報實測 | [03](03-security.md)、[04](04-settings-super.md)、[EXTERNAL](../EXTERNAL.md) |
| 資料管道 | 全套 + `data` 分支策略 | `repo_health` cron-data、fail-closed 實測 | [20](20-repo-health-audit.md)、[21](21-fix-plans.md) |
| 知識／索引倉 | 12 樣 + `CREDITS`／W8 | `guard` G10 連結＋錨點、`check_skills` | [15](15-resource-index.md)、[25](25-reverse-api-reuse.md) |
| 空殼／預留 | 決定留／合併／archive；留就補 | `repo_health` scaffold | [27](27-repo-starter.md) |

> **上表只列各形式專屬嘅嘢**。[PREFLIGHT 13d](../templates/repo-starter/PREFLIGHT.md) 同 12 樣核心係**所有新 repo 開局都要**，唔跟形式揀；第 14 項就只喺有身份系統加（[31](31-system-basics.md)）。

## 7. 陷阱同澄清（點解要本機 grep 而唔淨係靠 code search）

| 陷阱 | 實例 |
|---|---|
| 有 `package.json` ≠ 有框架 | `AYP`／`HKMAP`／`CUBSGAME`／`scoutmeeting`／`cubsmeeting`／`vsmeeting`／`minigame`／`hkcamping` 得 Node build/test script 或 `@vercel/analytics`，**冇 vite/next/react**，仍然歸「輕／靜態」 |
| `canvas` 一字 ≠ Gemini Canvas | `drawtheroute`／`doll`／`code`／`GAME` 講嘅係 HTML `<canvas>` 繪圖；要用 `APP_VERSION`／`app-version`／`google.script.run`／Gemini API endpoint 先算 [09](09-gemini-canvas.md) 嘅 Type A/B/C |
| `gemini` 一字 ≠ Gemini 功能 | `AvianDex/index.html` 係 designarena 注入嘅 `gemini-3.1-pro-preview` 分析 script；`DGA/Code.gs` 命中係 base64 模板；`GEMINI/src/data/store.js` 命中只係 `website-gemini.json` 檔名 |
| `vercel.json` ≠ 有後台 | 50 個 repo 有 `vercel.json`，多數只做 rewrite／headers；真正有後台要見 `api/` 或 `.gs` 或 Supabase client |
| 「AI 辨識」≠ Gemini | `AvianDex`／`birddex3`／`skw-birdex2` 用 Hugging Face／Nyckel／BirdNET，`cardmaster` 用 Flux；得 `scout-policy-assistant` 用 `@google/generative-ai` SDK，`prompt`／`scoutdesign`／`answer` 係直連 REST endpoint 或 BYOK |
| 「Share Link 目錄」≠ Canvas app | `GEMINI` 用 Supabase 存其他人嘅 Canvas share link，自己係 React+Vite 後台 App |

## 8. 未核實／限制

- 只涵蓋 **public** repo；`MD`、`scout-circulars` 兩個大倉（94MB／161MB）無 shallow clone，用 GitHub 檔案樹 + 已讀檔案判斷。
- 「有冇後台」係** repo 內有冇 server-side 碼**；唔包括「前端直連第三方 API」（例如 `hkcamping` 直連官方 feed、`forward` 用 Resend）—— 嗰啲屬 [EXTERNAL](../EXTERNAL.md)「外部系統」，唔當自己後台。
- `P1 檔次` 係按檔案結構推斷，未逐個對 README／實際部署；`空殼／預留` 12 個要人手確認係咪真係放棄。
- AI 標籤以** repo 內可見嘅 code** 為準；`skw-score` 有 AI 字眼但無 API 證據，標「無（待核實）」；`scout-circulars` 嘅 AI 底圖係外製圖片，唔係 repo 內 call API。
- 星星／體積／框架版本係 2026-11-02 快照；`package.json` deps 會變，決策前要重新核實（[P1](../PLAYBOOK.md)）。
