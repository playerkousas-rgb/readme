# INTAKE — 開新 REPO 之前，AGENT 要先問清楚

> **第 0 步，喺抄任何檔之前。** 方法原文 [`skills/external/grilling/SKILL.md`](skills/external/grilling/SKILL.md) **實體放咗喺本 repo**（[mattpocock/skills 原檔](https://github.com/mattpocock/skills/blob/main/skills/productivity/grilling/SKILL.md)，MIT，**2026-11-02 讀取**，2,077 bytes；見 [`skills/CATALOG.md`](skills/CATALOG.md)）：問到共同理解為止、每條問題俾**建議答案**、一輪問晒「而家問得」嘅嘢、fact 自己去查唔好問用戶、**用戶確認先好郁手**。下面係本地化版，**唔使上網都睇到**。
> 配套：[START.md](START.md) · [`repo-setup/SKILL.md`](skills/promoted/repo-setup/SKILL.md) · [PREFLIGHT.md](PREFLIGHT.md) · 真理倉 [docs/28](https://github.com/playerkousas-rgb/readme/blob/main/docs/28-repo-taxonomy.md) · [docs/32 §8](https://github.com/playerkousas-rgb/readme/blob/main/docs/32-consistency-audit.md)

---

## 點問（唔好連環追問）

1. **設計樹 + frontier**：一輪問晒「而家問得」嘅問題（唔使等第 1 題答案就已經可以問嘅），**編號 + 每條俾一個建議答案**；問法要令用戶答「係／照你講」就等於接受建議。
2. **等用戶答完先至下一輪**：第 2 輪只問被第 1 輪答案解鎖嘅問題（例：答咗「有登入」先問帳號／回報細節）。
3. **Fact 係 AGENT 自己查**，唔好問用戶：85 個 repo  baseline、`docs/28` 嘅形式名、模板有乜檔、[P1](https://github.com/playerkousas-rgb/readme/blob/main/PLAYBOOK.md) 相近產品／授權、ToS。用戶只負責**決定**。
4. **問完要寫低**，唔好只留喺對話：答案寫入 `SCOPE.md`（做乜／唔做乜兩條 bar）+ README 第一句定位；難逆轉嘅決定寫一段 [`docs/adr/0001-*.md`](docs/adr/0000-template.md)。
5. **用戶確認「係，理解啱」先好抄檔**；未確認唔好 `git init`、唔好揀授權、唔好改 `LICENSE`。
6. **唔好靠估**：答唔到就寫「未定／待用戶確認」，唔好自己揀個 default 當答案。

> ⚠️ **唔好問「你想用咩內容／主題分類」**：用戶明確講過要按**形式**分（輕／有後台／Gemini），唔係內容分類。下面 Q1–Q8 全部係形式與入口問題。

---

## 第 1 輪：frontier（無前設，一過問）

```
❓ Q1 — 交付形式：呢個 repo 係邊種？
   單一 HTML／少檔靜態 · 靜態多檔／PWA · 框架 SPA／PWA · 後台靜態殼／多層系統 ·
   資料管道 · 知識／索引倉 · 空殼／預留
   ➡️ 建議：未講就當「框架 SPA／PWA」，但請用戶確認。
   → 對 [docs/28 §3](https://github.com/playerkousas-rgb/readme/blob/main/docs/28-repo-taxonomy.md) 8 種形式；決定 12 樣可簡化幾多。

❓ Q2 — 有冇 UI／要唔要出畫面？
   ➡️ 建議：有。有就加 13a，並由 repo-setup 明確叫 design-review SKILL.md。
   → 純工具／資料管道／知識倉答「無」就唔使 design-review。

❓ Q3 — 有冇身份／登入（帳號、角色、session）？
   ➡️ 建議：無。答「有」就係系統級，要設定層＋隱藏超管＋registry＋審計鏈，
      並加第 14 項 [docs/system-basics.md](docs/system-basics.md)（忘記密碼等 8 樣 + ADMIN 回報系統 8 樣）。

❓ Q4 — 有冇後台／server-side code？（Vercel /api、GAS .gs、Supabase）
   ➡️ 建議：無。有就要 .env.example、.vercelignore、零特權（EXTERNAL）、
      /api/proxy scope 檢查、AUDIT_LOG；純 vercel.json rewrite 唔當後台。

❓ Q5 — 係咪 Gemini／Canvas app？邊種結構 A 全開放／B 隱藏水印／C 腦殼分離？
   ➡️ 建議：唔係。係就要 [docs/09 C1 決策表](https://github.com/playerkousas-rgb/readme/blob/main/docs/09-gemini-canvas.md)，
      單一 HTML 硬上限 5MB（C13-g）；BYOK key 唔入 Git。

❓ Q6 — 授權揀邊個？MIT／Apache-2.0／其他／私人唔公開？
   ➡️ 建議：MIT（同真理倉一致），但**呢條一定要用戶自己揀**，AGENT 唔准代揀。
   → START.md ③「先揀授權先至將 LICENSE-MIT.txt 改名做 LICENSE」。

❓ Q7 — 一句定位 + 明確唔做乜 + 主要對象？
   ➡️ 建議：請用戶填一句，AGENT 唔好代寫。
   → 寫入 README 第一句同 SCOPE.md 兩條 bar；「唔做乜」去 docs/out-of-scope/。

❓ Q8 — 入口與白名單／關站模式（經官方入口任一進入）？
   【AGENT 必須主動告知用戶本生態有 **5 個正式派發入口，分兩條線：Vercel 派發線 1–4（outbound）＋Canvas 派發線 5（GEMINI）**（真理倉 docs/50 §0.1 唯一登記：
     1. APP STORE `https://scoutappstore.vercel.app`
     2. 圖書館 `https://scout-circulars.vercel.app`
     3. 成員系統 `https://member-portal-sigma-swart.vercel.app`
     4. 區管理系統 `https://scout-district-portal.vercel.app`
     ＋ 5. GEMINI `https://gemini-woad-sigma.vercel.app`（**用戶自己 private repo `GEMINI` 部署嘅 Vercel app**，
        同 1–4 一樣可以掛閘、可以放入 portalIds、可以做放行來源；統計喺佢自己嗰邊。
        ⚠️ 唔好同 **Google 嘅 Gemini／Canvas**（gemini.google.com）混淆，見 SG16））
   及暫時關站機制】
   open（公開直連，預設）· entry-gate（頂層跳板白名單，唔用 iframe，可揀五個入口任一或全部）·
   iframe-only（純 iframe 白名單，須該入口已有 iframe 殼）· closed（暫時關站／維護告示）
   ➡️ 建議：預設 `open`；若想規定經指定入口進入：
      - 寫法 `portalIds: ['appstore','library','member','district']`（可只揀子集；自訂入口用 `portals`，優先於 portalIds）。
      - 凡有 localStorage／IndexedDB 長期資料（含 C13 BYOK key）、PWA 加入主畫面、Web Push、
        登入 Session Cookie（SameSite=Lax）或相機／GPS 權限 → **唔適合 iframe 白名單**，
        必須提醒用戶改揀 `entry-gate`（頂層跳板白名單）或維持 `open`（SG2）。
      - 若白名單包埋圖書館／成員系統／區管理系統，提醒該三處連結現時帶 `rel="noopener noreferrer"`（會清空 `Referer`），要先改 `rel="noopener"` 先放行得到：
        圖書館已改好（`89ef3cf1`，現 L5812）；仍未改：`member-portal/components/BookSelector.tsx` L88、`scout-district-portal/app/embed/page.tsx` L45 同 `app/links/page.tsx` L138（呢三處只有你決定把 App 加 `member`／`district` 才需要動）。
      - 靠本機儲存嘅 App（含 4 個 `BOOK`）：經入口**頂層跳轉**零影響（`localStorage` 只認子站 origin，用咩入口都係同一個倉）；但**唔可以入 `iframe`**（會分區／睇唔返舊紀錄）。
      - 已加主畫面 PWA：`allowStandalone: true` ＋ manifest `"display": "standalone"` → 撳 icon 直開自動放行；提醒 **iOS 主畫面容器同 Safari 分頁儲存分家**（Android Chrome 共用），要靠 JSON／QR 備份還原搬資料。
      - 【SG9】四個入口角色唔同（APP STORE＝主站、圖書館＝每日引流、成員系統／區管理系統＝自家副系統）：**對外分享連結同 QR code 只准指 APP STORE**，唔好傳子站直連；APP STORE 已於 2026-11-17 支援 `?app=<slug>` 深層連結（`website` `bd721421`）；歷史次序係「APP STORE 支援 → 分享改指 → 子 App 開閘」。
      - 【SG10】統計分工：**APP STORE 已有** `clicks／stars／hearts`（後台 Supabase 睇逐個 App 點擊／收藏／Like）＝主要答案；**圖書館現時唔統計**（主責通告＋Push，推廣 APP STORE 屬後期）；子 App 只喺想知「主畫面開啟」同「撞卡人數」時才加 `trackEndpoint`。
      - 【SG12】防「偷用」**唔係技術問題，係「表態」問題**（用戶定案）：領袖權限唔需要保、功能簡單嘅 App「佢抄得到都寫得到」。所以**唔准**建議為每個 App 起後端驗票／簽票基建；正解＝**`entry-gate` 令使用經入口** ＋ **`supportNudge` 邀一次 ❤️**。老實講清「原始碼擋唔到被抄走（`Ctrl+S`／`curl`）」，抄走代碼唔當損失，損失係「用你嘅成果但唔表態」。
      - 【SG13】`supportNudge` 文案要**講真話**：「書架位置有限：長期冇人收藏／Like 會收起，騰位俾新 App」。**預設 `skipPortalIds: ['appstore']`**——經 APP STORE 入嘅你後台已睇得到 `clicks/stars/hearts`，唔需要再提；只對「主畫面直開」「其他入口入」嘅人提一次。其餘：只在已放行時顯示、唔遮內容、有「唔使喇」、30 日一次、**嚴禁**迫 Like；`BOOK` 類建議關閉。
      - 【SG14】書架政策要**公開前置寫明**、**唔准寫任何固定日數／數字門檻**（幾時收起由用戶睇後台自行判斷，AGENT 唔准代定）、收起＝只 Delist 唔刪資料（代碼／網址／用戶資料保留、隨時復活）、**`BOOK` 類同自家系統豁免**；並提醒「Like 數 ≠ 使用人數」。
      - 【SG11】要主動講清「收起 ≠ 用不到」：APP STORE 撳「隱藏」只係前端過濾（API 照回傳、App 網址照開得）。真正令人用唔到要按四級齒輪：Delist（隱藏）→ Gate（`entry-gate`）→ Soft close（`closed`）→ Hard close（Vercel Pause）。有本機儲存嘅 App（如 `BOOK`）只可以 Delist，**唔可以同時拆走入口**，落關站前先叫用戶匯出 JSON／QR 備份（SG11-a）。含個人資料／收費嘅 App **唔可以**靠「隱藏」做保護（SG11-b）。
      - 【SG10-a】如果該 App 會收 Push（例如圖書館），**必須維持 `open`**：唔可以 `iframe`、唔可以 `closed`、唔可以改 manifest `start_url`，否則已訂閱用戶收唔到通告。
      - 【SG8】五個入口自己永不被閘（`selfOrigin` 在 `portalIds` 內自動放行 `self-portal`）；直開網址**預設唔自動跳**（`autoRedirectSeconds: 0`），要自動就 3–5 秒並顯示目的地，或用 `autoRedirectPortalId` 指定。
      - 【SG17】**唔使逐個入口「打招呼」**（用戶 2026-11-15 定案）：`portalIds` 預設值就係 `DEFAULT_PORTAL_IDS` ＝ `['appstore']`。`appstore`＝`always`（分享／QR 只由佢產生 → 每隻子 App 都寫，唔使問）；`library`＝`conditional`（要**先**改 `scout-circulars/index.html` L5662 一個 `noreferrer`，未改唔好加、加咗只會撞卡；**Push／統計／通告流程一律唔准動**）；`member`／`district`＝`optional`（實查兩邊唔做 App 目錄，只連入口＋自家系統 → 預設唔加；例外＝4 本 `BOOK`，但 BOOK 管制宜寬鬆，加咗冇壞、唔加亦足夠）；`gemini`＝`optional`（自己 private repo 嘅 Vercel app，可以加；但唔好加錯做 Google 網域）。要一次過開 1–4 就寫 `portalIdsAdmit: 'all'`（永遠唔會誤包 Gemini）。
      - 【SG18】**子 App 一律內置「讚好／收藏」一鍵回跳主站**（用戶 2026-11-17 定案）：常駐非阻塞 `<a target="_blank" rel="noopener">`，網址由 `ScoutStoreGate.getAppStoreUrl(slug)` 組出（零寫死）。**嚴禁**直連主站 Supabase／複製 anon key／自行呼叫 `bump_hearts`／`bump_stars` —— 用家個人收藏清單存喺 `scoutappstore.vercel.app` 同源 `localStorage`，子 App 寫 DB 都唔會入到用家收藏夾。`<slug>` 要對 `website/migrations/20261116-app-slug-seed.sql` 按正式 host 核實，**唔准靠 repo 名猜**；`ScoutStoreGate` 未載入要 `hidden`（CSS 要有 `[hidden]{display:none}`）。
      - 【SG19】**攔截卡按鈕 ≠ 放行來源**（用戶 2026-11-17 定案）：預設 `portalIds: ['appstore']` ＋ `silentPortalIds: ['library']` —— 圖書館照放行（有 Referer 就入得），但用家直開網址撞卡時**只出 APP STORE 一粒掣**。預設文案係簡短人話「需經由 SCOUT APP STORE 開啟」／「請按下方按鈕前往 APP STORE 開啟。」；`allowedOrigins` 只係**額外**放行來源，同 `portals` 聯集，**唔可以蓋過**。
      - 【SG7】要主動講清「加入主畫面」正確流程：**先由入口進入 → 再按瀏覽器選單加入主畫面**。直開網址唔會 404（會出白名單卡），但在入口母站裝／在 iframe 內裝只會裝到母站；真 404 沒有 manifest 裝唔到；已退役 app 嘅舊 icon 撳落去只會白屏。
      - 只有純無狀態計算機／圖卡／簡報，且確認母站已起 iframe 殼後，先可揀 `iframe-only`。
   → 見真理倉 [docs/50](https://github.com/playerkousas-rgb/readme/blob/main/docs/50-app-store-whitelist-and-shutdown.md)（SG1–SG19）。
   → 逐個 App 交接用 [`WHITELIST-HANDOFF.md`](WHITELIST-HANDOFF.md)（6 條問題＋回報格式，可直接貼去該 App 對話）。
```

---

## 第 2 輪：只問被解鎖嘅（唔好一開始就問）

| 如果第 1 輪答… | 先問 |
|---|---|
| Q3 = 有身份 | 邊個身份錨點／資料源？帳號點開（邀請定自助）？要唔要忘記密碼／MFA？ADMIN 回報系統收乜類別、保留幾耐？（[system-basics.md](docs/system-basics.md) §D 表） |
| Q4 = 有後台 | Vercel／GAS／Supabase 邊個？第三方 API／feed 有冇 ToS／rate limit？數據放邊、備份點做？ |
| Q2 = 有 UI | 係「頁面」定「app 屏幕」（dashboard／admin／收件箱）？目標寬度 390/768/1440 有冇得實測？有冇 brand 字体／色？（[design-review SKILL.md](skills/promoted/design-review/SKILL.md)） |
| Q5 = Gemini | A/B/C 邊種？有冇隱形水印／雙版號？交付檔係咪單一 HTML？ |
| 有 SKILL.md／RAG／agent 工作流 | 用 `promoted/in-progress/deprecated` 邊個 bucket？user- 定 model-invoked？（[docs/skills/README.md](docs/skills/README.md)） |
| 用戶話「改現有 repo」 | **唔使行 intake**，直接落真理倉 README §1 導覽；淨係問「想改乜」。 |

---

## 問完點落地（對照表）

| 用戶答案 | 起手包跟住點做 |
|---|---|
| Q1 形式 | [START.md](START.md) 12 樣 + [docs/28 §6](https://github.com/playerkousas-rgb/readme/blob/main/docs/28-repo-taxonomy.md) 各形式專屬檢查 |
| Q2 有 UI | 13a `docs/design-review.md` + 明確讀 `design-review` SKILL.md |
| Q3 有身份 | **第 14 項** `docs/system-basics.md` + 設定層／超管／registry／審計鏈 |
| Q4 有後台 | `.env.example`／`.vercelignore`／`EXTERNAL` 零特權／`api` 零依賴 |
| Q5 Gemini | docs/09 結構 + 5MB + W1/V2 雙版號 |
| Q6 授權 | 先揀先改 `LICENSE` |
| Q7 定位 | `README.md` 第一句 + `SCOPE.md`；已拒絕去 `docs/out-of-scope/` |
| Q8 入口／白名單 | 寫入 `SCOPE.md`；非 `open` 時抄 `templates/vercel/store_gate_v1.0.js`（開 APP 時告知白名單／關站）；純 `iframe-only` 另換 `vercel.iframe-whitelist.json`（[docs/50](https://github.com/playerkousas-rgb/readme/blob/main/docs/50-app-store-whitelist-and-shutdown.md)） |

> **13d PREFLIGHT、5 份 SKILL.md 同 [`skills/CATALOG.md`](skills/CATALOG.md) 唔跟形式**：所有新 repo 都有，唔使問。
> **PREFLIGHT 係第 4 步，唔係第 0 步**：佢驗檔，唔驗「你估中用戶需求未」。問清楚先抄檔，唔好倒轉。

## 未核實／限制

- `external/grilling` 原文係 Claude／Codex skill（有 `grill-me` user-invoked 版，我哋**唔複製**，因為佢只係叫 Skill tool）；呢度只借**方法**，無 Skill tool、無 sub-agent，唔扮自動觸發。`external/` 檔案唔改、唔 promote（[`CATALOG.md`](skills/CATALOG.md) §1）。
- 問題入面嘅「建議答案」係**出發點**，唔係 default —— 用戶未確認就唔好當答咗。
- fact（85 repo 統計、形式名、模板檔）要 AGENT 自己 `ls`／讀檔查，唔好問用戶。
