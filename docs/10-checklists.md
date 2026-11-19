# 10 — Checklists（全部喺度）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> **ecportal 已退役（2026-11-19；新系統 = VSPORTAL）**：舊案例已刪，退場見 [57](57-ecportal-to-vsportal-migration.md)；想參考多層系統嘅可選模式 R1–R8 → [58](58-multilevel-system-patterns.md)（**唔係通用規則，新 app 唔使跟**）；repo 健康 → [20](20-repo-health-audit.md)。


> 用法：**逐格剔，唔好靠記憶**。CI（`node scripts/guard.mjs`）只可以守住機械化嗰部分；其餘係人肉閘，但都要寫低。
> 規則 ID 對返 [PLAYBOOK.md](../PLAYBOOK.md)。

---

## 1. 開新 app（30 分鐘）

### 1.1 判定
```
[ ] P1：研發前上網查相近產品及自己現有項目；記錄日期、關鍵字、來源、差異、費用／授權、未核實項與採用／整合／自建理由（無法搜尋須說明限制）；參考 docs/24
[ ] L1 雙閘判定（雙語介面；**只適用於 2026-11-08 之後新開嘅 app**，舊 app 唔追溯）：加咗英文之後嘅體積（S7 dist <5MB / C13-g 單一 HTML ≤5MB）＋ 要譯嘅 UI 字串數（≤300）；兩項都達標 = 預設要做英文 + 右上角切換掣；任一超標可豁免，寫 EXCEPTION: L1 + 實際數字（[44](44-bilingual-ui.md)）
[ ] 類型：工具 / App / 系統
[ ] 若「系統」→ 設定層 + 隱藏超管 + registry + 審計鏈全部係硬性交付物
[ ] 兩條公理答到：身份 = 邊個 ID + 邊個資料源？接入 = 交俾邊個 + 登記邊個 registry？
[ ] 多單位系統先需要：定職責邊界／「唔做清單」／功能 registry（**可選做法**，案例見 [58](58-multilevel-system-patterns.md)；唔係通用底線）
[ ] 技術棧揀好：Git / Vercel / GAS / Supabase / Gemini Canvas（邊幾個）
[ ] Gemini 結構揀好：A 全開放 / B 隱藏水印 / C 腦殼分離（見 [09-gemini-canvas C1](09-gemini-canvas.md#c1--決策表揀錯結構--之後要拆)）
[ ] SG1/SG2 入口與關站白名單判定（已主動告知用戶五個官方入口 APP STORE／圖書館／成員系統／區管理系統／GEMINI，[50 §0.1](50-app-store-whitelist-and-shutdown.md)）：公開直連 `open`（預設）／頂層跳板白名單 `entry-gate`（`portalIds` 引用）／純 `iframe-only`／暫時關站 `closed`；凡有 `localStorage`（含紀錄冊／C13 BYOK）、PWA 加入主畫面、Web Push、`SameSite=Lax` Cookie 或相機／GPS 嚴禁用 `iframe-only`，改用 `entry-gate`；並已向用戶講清 SG7「先由入口進入，再按瀏覽器選單加入主畫面」；SG8 入口自己永不被閘、直開網址預設唔自動跳；SG9 分享／QR 只由 APP STORE 產生；SG10 統計以 APP STORE `clicks/stars/hearts` 為主、圖書館維持 `open`（SG10-a）、子 App `trackEndpoint` 按需要才加；SG11 下架已按 Delist→Gate→Soft→Hard 逐級、`BOOK` 類已保留入口並通知備份；SG12 防偷用＝`entry-gate`＋`supportNudge`（唔起後端驗票）；SG13 支持提示講明書架政策、預設 skip appstore；SG14 書架政策已公開前置、`BOOK`／自家系統豁免、收起只 Delist；SG16 已分清兩條派發線：outbound（1–4 Vercel，可放行）／canvas（5 Gemini，有自己統計但唔可放行）；SG17 已分清入場準備度（`admit`）：`appstore`＝`always`（`DEFAULT_PORTAL_IDS`，所有子 App 預設寫入）、`library`＝`conditional`（先改 `scout-circulars/index.html` L5662 `noreferrer`，Push／統計／通告流程唔准動）、`member`／`district`＝`optional`（唔做 App 目錄，預設唔加；例外＝4 本 BOOK）、`gemini`＝`never`（放入 `portalIds` 會被剔除）；批量上線按 [51-whitelist-rollout-list.md](51-whitelist-rollout-list.md) A→B→C 批次、D 組入口本體唔加閘（[50](50-app-store-whitelist-and-shutdown.md)）
[ ] SG18：子 App 有「讚好／收藏」一鍵回跳主站掣（`getAppStoreUrl(slug)`、零 Supabase 直連、`<slug>` 已對 seed 核實、`[hidden]` CSS 生效、列印隱藏）
[ ] SG19：`silentPortalIds: ['library']` 已寫（圖書館放行但唔畫掣）；直打網址只出 1 粒 APP STORE 掣；預設簡短文案冇「白名單」字眼
[ ] **SG7-a**：要講清白名單嘅代價 —— 分享連結／搜尋結果／書籤／QR／Push 深層連結**一律會撞卡**；**有 Web Push 嘅 app 一律維持 `open`，唔准落閘**（SG10-a）（[50 §3.4](50-app-store-whitelist-and-shutdown.md#34-全部-app-都經白名單其實有影響新用戶直點網址404加入主畫面又點)）
[ ] **SG8-a**：`autoRedirectSeconds: 0` 為預設（停低顯示入口卡）；要自動跳就 3–5 秒並講明跳去邊個入口
```

### 1.2 Repo 骨架
```
[ ] 由 templates/ 抄：.gitignore / .vercelignore / vercel.json / package.json / env.example
[ ] .github/workflows/guard.yml + dependabot.yml
[ ] scripts/guard.mjs（本機 + CI 同一條）
[ ] README.md（呢個 app 嘅入口）＋ BUILD.md（專案定案）＋ docs/（教材/checklist）
[ ] .env.local 只喺本機；Vercel Dashboard 設 Production env
[ ] icons/ 9 個圖標齊（PNG／ICO，尺寸用程式驗；maskable 66%）＋ manifest 4 icon（G11 → [docs/33](33-icon-standard.md)）
[ ] <head> 5 link ＋ 4 meta（og:image 絕對網址）；/icons/* immutable → 改圖要改檔名（G11）
[ ] node scripts/guard.mjs 綠
[ ] 交付前：node scripts/final_check_v1.0.mjs 六角度全綠 + 人手實測（docs/17）
```

### 1.3 安全底層（PLAYBOOK §9 第 1–8 步）
```
[ ] config.mjs：SCHEMA + getConfig() + fail closed + env 自檢（F4/F12）
[ ] /api/proxy：verifySession → scope 檢查 → inject secret（VL1, A6）
[ ] GAS doGet/doPost 第一行 requireAuth + action 白名單（X3/X4）
[ ] 密碼：PBKDF2 ≥100k + salt + timing-safe；mustChangePw gate；鎖定 5/15（A3/A5）
[ ] Session：HttpOnly Secure SameSite=Lax, exp ≤30min, pv, jti（A4）
[ ] 原子寫入：ScriptLock + baseVersion + tombstone（F7）
[ ] 限流 + origin allowlist + 輸入消毒（A8/A9/A11）
[ ] AUDIT_LOG / ACCESS_LOG + hash 鏈（A13）
[ ] 隱藏超管完整流程 + DR 四件套（A14/A15）
```

### 1.4 功能
```
[ ] 身份錨點定死（邊個 Sheet / table 誕生）；下游唔反寫
[ ] registry 驅動導航／模組（F3）
[ ] 核心功能 → 次要功能（跟 PLAYBOOK §9 次序）
[ ] 備份 / 匯出匯入 / 診斷 / MOCK 教學（F8/F10/F11）
[ ] 若「系統（有身份）」→ 帳號生命週期 8 樣（含**忘記密碼**）逐格剔：[31](31-system-basics.md) §2
[ ] 若「系統（有身份）」→ **ADMIN 回報系統** 8 樣 + 收貨實測：[31](31-system-basics.md) §3（通用，唔只某個 repo）
[ ] 上面兩份係人手 + runtime 實測；`guard`／`preflight` 係靜態檢查，驗唔到功能有冇寫
```

---

## 2. 每次施工（commit 前）

```
[ ] node scripts/guard.mjs 綠
[ ] 有單一 HTML 交付：node scripts/audit_single_html_v1.0.mjs <檔名> 無 FAIL（C13-f）
[ ] 有 `package.json` 先做：npm run check && npm run build 綠；純文件／單一 HTML／Canvas app 寫 N/A（C13-g）
[ ] 冇 secret / .env / node_modules / dist / *.bak,tmp,old,log 入 Git（G5）
[ ] 新 action → 白名單 + 測試（F5/F14）
[ ] 新 env → .env.example 條目 + F12 自檢 + rotation 步驟
[ ] 新設定 → SCHEMA 條目 + 預設 + failClosed + audit
[ ] 新寫入 → 冪等鍵 + baseVersion + 錯誤碼（F6/F7/F13）
[ ] 新寫入 → 狀態分 accepted / may_have_applied / applied + readback；不確定唔自動重送（F6-b；guard 只驗文件，要人手造 timeout 實測）
[ ] 危險動作 → dry-run / diff / 確認 / 回滾 + 執行後 readback（F9/F18）
[ ] 有做雙語 → node scripts/i18n_check_v1.0.mjs <檔或目錄> 無 FAIL（L2–L5：掣／data-lang+lang／localStorage try-catch／字典鍵）
[ ] 有做雙語 → 人手實測：撳掣換到字、F5 記住、私隱窗口唔炸、390px 唔爆版、英文模式冇殘留中文（L6；機器驗唔到）
[ ] 新開 app 雙閘達標但唔做英文 → PR／SCOPE 寫 EXCEPTION: L1 + 原因 + 補償，並喺 §8 登記（唔准靜靜跳過；舊 app 唔使填）
[ ] 改規則 → PLAYBOOK + docs + guard + templates 四處同步（F16）
[ ] 新 ID 冇第二套寫法：`F2` 一個正規化實現（`normalizeId()` 唯一真理，唔好每個 route 各寫一次）
[ ] 施工次序冇跳步（`F17`）：先安全底層 → 再功能 → 最後 UI 糖衣；唔好先做畫面後補驗證（順序見 §9 施工次序）
[ ] 新規則／新 docs 章節／新派工指令 → 交**另一個對話**做[金魚審](52-fresh-eyes-review.md)（零上文／改寫先行｜最多重審 1 次）；**同一個對話自己審自己唔算**，冇做就寫「未做」
[ ] 改版 → 檔名 + 內文全部 vX.Y + 版本登記表 + 測試（V3）
[ ] 交付檔有 © SCOUT SYSTEM 頁尾 + meta copyright（W1）
[ ] 生成圖有隱形水印，解碼器實測讀到（W2/W3）
[ ] 交付 HTML 零真 key：C13 三軌（唯一 API_KEY slot + 平台代理 + BYOK）；_local_ 手動注入版無入 Git（W6/A1）
[ ] 檔名＋內文雙版號一致（V1）；code 用 APP_VERSION，無散裝 // vX.X（F15）
[ ] commit message Conventional Commits（G3）
[ ] PR 描述有：身份／registry／env／action／回滾（G4）
```

---

## 3. 上線前 Go / No-Go

### 3.1 瘦身
```
[ ] dist < 5MB；單一 bundle < 2MB；圖 < 500KB（S6/S7 — Vercel/dist 類）
[ ] 單一 HTML ≤ 5MB、唔強制瘦身（C13-g；S7/S10 唔適用）
[ ] .vercelignore 擋 node_modules/.git/docs（S2）
[ ] api/ 零 runtime dependency；dependencies 空白（S1/S3）
[ ] vercel.json：framework null / outputDirectory / regions hkg1（S4）
[ ] Preview 非 main 關；retention 7 日（S8）
[ ] 上載配額 server 計（S9）
[ ] 無 >1MB 檔入 Git（S10；單一 HTML 例外 5MB，C13-g）
[ ] 死重檔案零容忍（S5）：grep `public/images/assets`，無引用即刪；`*.bak/tmp/old/log` 唔入 repo
[ ] 平台 payload 冇肥：只送畫面要用嘅欄位，唔好整個 object／整張表落前端（S11）
```

### 3.2 安全
```
[ ] 前端 bundle grep 無 secret / service_role
[ ] 所有 /api 驗 session 先；所有 GAS 驗 requireAuth 先
[ ] sig：ts + nonce + body digest + 只 POST + 雙通道（A7）
[ ] RLS 每表開 + anon 實測隔離（A10/U3）
[ ] 限流實測觸發到（A8/VL7）
[ ] 錯誤回應統一、防枚舉（A17/F13）
[ ] AUDIT_LOG 有寫到 + hash 鏈驗過（A13）
[ ] 超管測過一次 + 有 audit entry + 之後 rotate（A14）
[ ] 私隱：同意文案 + 數據清單 + 保留期（A12）
[ ] 權限係最小（A18）：外部系統零特權；工具目錄 stateless；每個 component／role 只有佢需要嘅權限，逐個實測一次
[ ] 水印／紀錄冇個人資料（W7）：payload 只放 unit／date／hash（版本號另計，見 V5）；唔放會員 ID／email／姓名／相中人物身份（A12）
```

### 3.3 防呆 / 恢復
```
[ ] 備份啱啱做過 + importAll 實測還原（F11）
[ ] 一鍵診斷報告可用（F8）
[ ] kill switch 測過（F18）
[ ] 回滾指令寫咗喺 PR（VL11）
[ ] W1 版權 + V1 雙版號 + 水印（B/C）全部驗過
[ ] 守護測試全綠（F14）
[ ] **SG11-a**：`BOOK`／有真實紀錄嘅 app 落閘前 —— ① 入口已備 ② 有匯出備份 ③ `allowStandalone: true`；三樣缺一唔准落閘
[ ] **SG11-b**：敏感 app 唔可以靠 APP STORE「隱藏」做保護（`visible=false` 唔係安全邊界，API 照回傳）→ 要 `entry-gate` 或後端驗票
[ ] 版號入咗紀錄（V5）：每條 RECORDS／水印 payload／診斷報告都帶 `appVersion` + `promptVersion`，可由成品圖反查版本
[ ] 冇將水印講成加密／DRM：README 要寫明水印只係溯源，唔阻止人取用（W4）
[ ] 第三方素材（字體／圖標／模板／程式碼）全部喺 `CREDITS.md` 標來源＋授權（W8）
```

### 3.4 文件
```
[ ] README / BUILD / docs 同 as-built 一致
[ ] 通用規則同專案文件無矛盾（G10）
[ ] runbook 放咗喺 docs/ 或呢個真理倉
[ ] L1–L6（**只限新開 app**）：雙閘達標有英文 + 右上角切換掣，或者 §8 有 L1 豁免紀錄；舊 app 唔追溯（[44](44-bilingual-ui.md)）
```

> **任何一格未剔 = No-Go。** 例外要用 `EXCEPTION: <ID> — 原因 — 補償 — 復原日期` 寫喺 PR。

---

## 4. 每次 deploy 後（5 分鐘）

```
[ ] production URL 開到；health endpoint 正常
[ ] 一個真用戶流程行一次（登入 → 讀 → 寫 → 登出）
[ ] AUDIT_LOG 有對應紀錄
[ ] Vercel log 無 500 / 無 secret 洩漏
[ ] 體積數字同 CI 一致
[ ] 回滾 URL 記低
```

---

## 5. 每月 / 每季

```
每月：
[ ] 檢討超管用過幾次（成日用 = 流程有問題）
[ ] 驗 AUDIT hash 鏈
[ ] 睇 dist / repo 大小趨勢
[ ] 清孤兒 registry entry / 暫存檔

每季：
[ ] rotate 所有 apikey + SUPER_KEY + SESSION_SECRET（A2）
[ ] 備份還原演練（F11）
[ ] DR 演練：超管重設測試帳號 + 由備份還原測試庫（A15）
[ ] npm audit / dependency 更新（A16）
[ ] 檢查 PDPO 保留期：12 個月 purge（A12）
[ ] 對一次 PLAYBOOK 規則同 scripts/guard.mjs 係咪同步（F16）
```

---

## 6. 交接 / 離任

```
[ ] 上級重設其密碼 → pv+1 踢 session
[ ] 撤 branch_access / permissions_override
[ ] Google / Vercel / Supabase ownership 轉名（機構專用帳戶 + 兩名管理人 + 2FA）
[ ] rotate 所有受影響 key（A2）
[ ] 交接文件（docs/）更新持有人
[ ] 檢查有冇個人 email 做咗收件匣 / 告警接收
```

---

## 7. Gemini / Canvas app 交付前（A/B/C 通用）

> Type C 腦部細節（SYSTEM_PROMPT／ACTIONS／RECORDS／PROMPT 四處同步）見 [09 C12 checklist](09-gemini-canvas.md#c12--遷移anti-patterns驗收)。
> 以下係**單一 HTML / Type B** 嘅交付閘；全部由 `final_check_v1.0.mjs` 自動驗大半。

```
[ ] 結構寫明 A/B/C；對應模板用咗
[ ] 單一 HTML ≤ 5MB（C13-g，唔強制瘦身；越輕越快）；Vercel/dist 類先至驗 S7
[ ] C13 三軌已實作：① 唯一 API_KEY slot ② credentials 代理 ③ BYOK 後備
[ ] C13：全檔唯一 API_KEY 宣告；localStorage try/catch；③ key 用 header 唔落 ?key=
[ ] W1 版權 meta + 頁尾；W2 水印（如出圖）；W6 交付檔零真 key
[ ] V1 檔名＋內文版號；V2 靜態 HTML 版號 = APP_VERSION；V4 部署拷貝已 sync
[ ] C：index.html grep 唔到 prompt / key / fetch；RECORDS 有原圖／成品圖 hash
[ ] node scripts/audit_single_html_v1.0.mjs <檔名> 無 FAIL
[ ] node --test scripts/audit.test.mjs + watermark.test.mjs + brain.test.mjs 全綠
[ ] node scripts/final_check_v1.0.mjs 六角度全綠 + 人手實測（docs/17）
```

> 真實對照：[16 — 童軍漫畫生成器 v4.2.1 審計結果](16-canvas-case-scout-comic.md#4--審計結果實跑5mb-版)（5 FAIL / 3 WARN，C13-g 5MB 版）。

---

## 8. 例外登記（有例外就喺度記）

| 日期 | App | 規則 ID | 原因 | 補償措施 | 復原日期 | 狀態 |
|------|-----|---------|------|----------|----------|------|
| — | — | — | — | — | — | — |

> 例外唔可以永久。每次季度檢討要清一次。
> **L1（雙語介面）**：屬「預設要做・可豁免」，唔係 CI 硬擋；豁免一定要寫低邊個閘超標同實際數字（例 `EXCEPTION: L1 — UI 字串 480 條 >300 — 只做導覽／按鈕英文，書冊正文留中文 — 持續`）。冇紀錄又冇做 = 施工未完成，code review 追。

---

## 9. 未核實登記表（2026-11-19 新增）

> **為何要有**：全倉有百幾處「未核實／未實測／待查」，散落喺各章。誠實係好，但散咗就冇人知邊條仍然未解決。呢張表係**唯一收斂入口**（同 §8 例外登記表同一個做法）。
> **規矩**：① 只記**會影響交付**嘅未核實項；② 每項要有「幾時查」；③ 查完就改狀態＋寫查到乜，**唔好刪走原句**（留住先睇到當時判斷）。
> **何時填**：寫「未核實」落任何文件嗰陣，順手喺呢度加一行；月度檢討（§5）掃一次過期項。

| # | 位置 | 未核實乜 | 為何重要 | 幾時查 | 狀態 |
|:--:|---|---|---|---|---|
| 1 | [50 §3.9](50-app-store-whitelist-and-shutdown.md) | GEMINI 作為第 5 個入口，用真機撳入時 `entry-gate` 實際行為未試過（`gh api` 對 private repo 回 403 ≠ 唔存在；但「可放行」係規則，唔係實測） | 講錯會令 GEMINI 被當死連，或者反過來以為試過 | 有 GEMINI 改動時，用真機撳一次 | 待查 |
| 2 | [51 §1](51-whitelist-rollout-list.md) | 34 隻子 App 嘅 `localStorage` 實際用途（掃 grep 唔等於明用途） | 直接影響 Q1 停機規則（會唔會令用家失去資料） | 每隻 app 派工時由該 app AGENT 實掃 | 待查 |
| 3 | [37](37-ai-tools-design-prompts.md)／[38](38-animation-3d-prediction-tools.md) | 第四、五輪 AI 工具清單全部「未安裝未實測」 | 引用做決策前要先試 | 決定採用前 | 待查 |

> 呢三行係**示例格式**，唔係完整清單：真正嘅數量係全倉「未核實／未實測／待查」實測 **139 處**（2026-11-19 grep 計，會隨改動變），逐條搬入呢張表係浪費；只搬**會影響交付**嘅。其餘留喺原文件，寫明「未核實」已經符合 [47 原則三](47-readme-discipline.md)。
