# PLAYBOOK — 核心規範總綱（唯一規則編號表）

> **點用**：呢份係「必看」嘅濃縮版。每條規則有一個 ID（S/F/A/W/V/G/VL/X/U/C/P/L/I/UP/SG/D）。
> **案例隔離（2026-11-19 更新）**：ecportal 案例已退役刪除（[docs/57](docs/57-ecportal-to-vsportal-migration.md)）；由佢抽出嘅「可選模式」R1–R8 已通用化去 [docs/58](docs/58-multilevel-system-patterns.md)，**唔係通用底線**；新 app 守 S/F/A/W/V、P1、D1 ＋ 技術棧契約。checklist、CI、PR template 全部用 ID 引用，唔好改 ID。
> **層級**：呢份 = 所有 app 嘅**最低要求**。個別 app 可以加嚴，唔可以減；要減就喺 PR 寫例外原因 + 補償措施。
> 深挖：每個章節尾有對應 `docs/` 連結。

**Version 1.1.0** ｜ **Ratified 2026-10-24** ｜ **Last Amended 2026-11-19**

| 版號位 | 幾時升 | 例子 |
|---|---|---|
| **MAJOR** | 刪除規則、或重新定義一條已生效規則嘅意思（讀者跟舊寫法會做錯） | SG16（GEMINI 由「唔可以放行」改為第 5 個入口）就係 MAJOR 級改口 |
| **MINOR** | 新增規則 ID、新增章節 | 新增 SG18／SG19 |
| **PATCH** | 澄清、改字、改連結、補例子（意思不變） | 改一句錯別字 |

> **規矩**：本輪新增嘅規則**一定**同時改 `Last Amended`。版號只喺呢一行，唔好喺每個章節各寫一個。
> **為何要版號**：呢份有 95 條 ID、子 App 會引用「SG16」「F16」等 ID；冇版號就分唔到「舊版 SG16」同「現時 SG16」（SG16 就係 MAJOR 級改口）。Git history 係最終證據，版號係方便人引用。

---

## 0. 開工前：三分類，決定做幾多

**D1 — 設計地圖（所有新 App 必須有；現有 App 下次重大架構改動時補／更新）**：需求同範圍經用戶確認後、開始實作前，由負責設計的 Agent 根據已確認事實，在 App 自己的 repo 根目錄建立／更新 [`ARCHITECTURE.md`](templates/repo-starter/ARCHITECTURE.md)。用一張易讀圖畫出入口、主要元件、責任邊界、資料源／讀寫方向、內外部依賴；按 App 形狀補身份／權限／信任邊界及關鍵錯誤流程。就算係純前端小工具都要有精簡地圖，無後端／外部依賴要明寫「無」，唔可以留空或省略。**不得靠估**：未確認嘅關係標「待確認」並向用戶查清；未有答案前不得把它寫成既定設計。後續 Agent 每次施工前先讀地圖；任何令元件、資料流、責任邊界或跨 App 關係改變的施工，先同步更新地圖，再改 code／驗收。此為人工設計／維護閘，不是 Graphify 自動生成，亦非 CI 能保證圖的語義正確。詳情與範本見 [docs/59](docs/59-graphify-codebase-knowledge-graph.md)／[repo-starter ARCHITECTURE.md](templates/repo-starter/ARCHITECTURE.md)。

**P1 — 研發前先搜尋相近產品（所有工具／app／系統）**：開始新產品研發前，先上網查找相近產品及現有方案，包括自己的項目；記錄搜尋日期、關鍵字、來源連結、相同／不同功能、適用地區、費用或授權及未核實事項，並寫明採用、整合或自建的理由。不得單憑宣傳或舊資料假設功能已可用；無法上網或查不到時如實記錄限制及待查項，先向用戶說明，不能當已完成調查。既有比較可參考 [docs/24](docs/24-similar-products.md)，仍須重新核實。此為人工檢查，並非自動 CI 保證。

| 類型 | 例子 | 要做嘅嘢 |
|------|------|----------|
| **工具（stateless）** | 密碼產生器、日期計算機、Canvas 小工具 | 純前端、無後端無儲存 → 只需 S6/S7、A11、C 系列；**唔需要設定層同超管** |
| **App（有資料）** | 表單、記錄冊、通告頁 | 全套 S/F/A ＋ 設定層 ＋ 備份；超管視乎有冇帳號 |
| **系統（多層／多單位／有身份）** | VSPORTAL 支部系統、多層管理平台 | **全套 ＋ 設定層 ＋ 隱藏超管 ＋ registry ＋ 審計鏈，一個都唔少** |

> 用戶講「系統」兩個字 = 自動當第三類，**設定層同隱藏超管係硬性交付物**，唔係 nice-to-have。
> 無論邊一類，**S 瘦身／F 防呆／A 安全／W COPYRIGHT SCOUT SYSTEM／V 雙版號** 五套通用規則全部適用。
> **人工通用規則（唔係 CI 硬擋）**：**D1** 設計地圖（上面，所有新 App 必須有；架構改動要更新）；**P1** 研發前搜尋（上面）；**L1–L6** 雙語介面（下面 §7.5，詳情 [docs/44](docs/44-bilingual-ui.md)）——唔太重嘅 app 預設要有英文版 + 右上角切換掣，可豁免但要寫 `EXCEPTION`。

---

## 1. Gemini 三種結構（A 全開放／B 水印／C 腦殼分離）

> **三種（用戶定案，[09-gemini-canvas](docs/09-gemini-canvas.md)）**：
> **A 全開放** = 一個 HTML 乜都唔保護；**B 隱藏水印** = 一個 HTML + DCT 隱形水印 + 解碼器 + API KEY 自動注入位；
> **C 腦殼分離** = 原本一個 HTML 拆做 **`brain_vX.Y.gs`（腦，server-side）＋ `shell_vX.Y.html` → `index.html`（殼）**。
> C 嘅目的 = **記錄上傳原圖／成品圖／使用紀錄 + 保護 PROMPT 設定**，唔好俾人「檢視原始碼」睇到，亦唔好被 Canvas 重新生成洗走。

```
┌─ 🎨 殼 index.html（會落瀏覽器，當佢公開）────────────
│    UI + CSS + event；零 prompt、零 key、零規則、零紀錄
│    唯一通道：google.script.run.api(action, payload)
├─ 🧠 腦 Code.gs（Apps Script server，唔會送出）──────
│    SYSTEM_PROMPT / ACTIONS 白名單 / RULES / appendRecord()
│    ScriptProperties（key、state、config）
│    只有 api() 同 doGet() 係 public function
└─ 🗂️ 底座 RECORDS Sheet + ScriptProperties ──────────
     append-only + prev_hash 鏈；client 無 update/delete 入口
```

- **Type A** 只限工具／prototype，仍要守 C2（無 secret／無 prompt／無重要紀錄）＋ W1 版權標示。
- **Type B/C** 係有出圖／有 prompt／有紀錄嘅 app 嘅預設：B 加隱形水印，C 換殼唔換腦 + `node --test` 驗腦。
- 兩層只靠一份 **contract**（[templates/canvas/contract_v1.0.json](templates/canvas/contract_v1.0.json)：action 白名單 + roles + input schema）溝通；測試對照 `contract_v1.0.json` 同 `Code.gs ACTIONS`。
- **C13 三軌自動注入（2026-10-27 定案，已實作可用）**：① 全檔唯一 `const API_KEY = ""` 注入 slot ② `credentials:'include'` + 冇 key 唔加 `?key=` 平台代理 ③ `safeStore` BYOK 後備。
  三軌係同一套，唔係三選一，亦唔係本機換 placeholder；全檔只准一處 `API_KEY`；③ 嘅 key 用 `x-goog-api-key` header。
  唯一真理：[14 §1.1](docs/14-api-key-injection.md#11-canvas-單一-html-artifact你已實作嘅三軌自動注入c13)；實證 [16 案例](docs/16-canvas-case-scout-comic.md)。
- **C13-g 5MB 上限**：單一 HTML / Gemini Canvas app 係另一類，唔經 Vercel、**唔強制瘦身**（S7／S10／S6 唔適用）；硬上限 **5MB**，體積項目只做 INFO。
  **但 5MB 係上限唔係目標 —— 越輕量 LOAD 越快**，建議減無用 base64／外置大圖（可選優化，唔判 FAIL）。
- 每個單一 HTML 交付前跑 `node scripts/audit_single_html_v1.0.mjs <檔名>`；全部 app 交付前跑 `node scripts/final_check_v1.0.mjs`（[17](docs/17-final-check-and-tutorial.md)）。
- 詳見 [docs/09-gemini-canvas.md](docs/09-gemini-canvas.md)。

---

## 2. 瘦身 S1–S12（詳情 [docs/01-slim.md](docs/01-slim.md)）

| ID | 規則 | 硬數字 / 檢查 |
|----|------|---------------|
| **S1** | `api/` 零 runtime 依賴 | 只用原生 `fetch` + `crypto`；禁 `axios`／`lodash`／`moment` |
| **S2** | 必須有 `.vercelignore` | 擋 `node_modules`／`.git`／`.vercel`／`.cache`／`*.bak`／`*.tmp`／`*.old`／`*.log`／`uploads/`／`__tests__/`／`coverage/`／`docs/` |
| **S3** | `dependencies` 空白或白名單 | 建置工具一律 `devDependencies`；`installCommand: npm install --include=dev` |
| **S4** | `vercel.json` 只部署最終產物 | `framework: null` + `outputDirectory: dist` + `cleanUrls: true` + `regions: ["hkg1"]` |
| **S5** | 死重檔案零容忍 | grep `public/images/assets`，無引用即刪；`*.bak/tmp/old/log` 唔入 repo |
| **S6** | 圖轉 AVIF / WebP（**站台圖標例外**：跟 [G11](docs/33-icon-standard.md) 一律 PNG／ICO） | 單檔 `< 500KB`；上載單檔 ≤5MB、每筆 3 張、每單位每日總量上限 |
| **S7** | CI 硬攔體積（**只適用 Vercel / dist**） | `dist < 5MB`、單一 bundle `< 2MB`（`du -sb dist` 超即 fail）。**單一 HTML / Gemini Canvas app 唔適用**，見 C13-g |
| **S8** | 部署衛生 | 非 `main` branch 關 Preview Deployment；retention = 7 日 |
| **S9** | 上載面配額 | 檔種白名單 + 檔大小 + 每筆數量 + 每單位每日總量（server 計） |
| **S10** | Git 瘦身（**只適用 Vercel / dist 類**） | 唔 commit binary／node_modules／dist；大檔用 LFS；每個檔 `< 1MB` 為原則（guard 會掃）。**單一 HTML 例外：5MB**，見 C13-g |
| **S11** | 平台 payload 瘦身 | GAS body ≤900KB、批量讀寫；Supabase 禁 `select *`、要分頁、log 表定期 purge |
| **S12** | 自動化 | `node scripts/guard.mjs` 本機 + CI 同一條，每週定時跑一次 |

---

## 3. 防呆 F1–F18（詳情 [docs/02-foolproof.md](docs/02-foolproof.md)）

| ID | 規則 | 一句實作 |
|----|------|----------|
| **F1** | 單一真理 | 每個概念只有一份定義（config／registry／ID 演算法），其餘引用 |
| **F2** | ID 正規化單一實現 | `trim → 大寫 → 補零 → 字母尾`（`82/082/0082` = 同一個），只准有一個 function |
| **F3** | registry 驅動 | 導航／功能入口／下游連結由註冊表生成；未登記 = 唔存在 |
| **F4** | fail closed | 只有 `1/true/yes/on/open` 算開；其他值（包括串錯字）一律閂 |
| **F5** | 白名單 > 黑名單（呢度嘅「白名單」＝action／欄位 allowlist；**唔係** §7.7 嘅入口白名單） | action／檔種／origin／欄位／重定向 URL 全部用 allowlist |
| **F6** | 冪等鍵 + 寫入結果狀態 | `transferId`／`nonce`／`jti`／`baseVersion`；重複請求結果一致，唔會雙寫。**送咗之後**分 `not_sent`／`not_applied`／`accepted`／`may_have_applied`／`applied`；2xx 只係 accepted，readback 搵到先算 applied，不確定**唔准自動重送**（[F6-b](docs/02-foolproof.md#f6-b--寫入結果狀態送咗之後點算)） |
| **F7** | 樂觀鎖 + 原子寫入 | 寫入帶 `baseVersion`；撞版回 `conflict:true`；後端 lock + 暫存行一次過 commit；刪除 = tombstone |
| **F8** | 三色狀態 | 黃＝未存、綠＝已存、紅＝衝突；一鍵複製診斷報告 `{version,bytes,sizes,stagingRows}` |
| **F9** | 危險動作三步 + 讀回 | dry-run → diff 預覽 → 確認；批量操作前自動提醒備份；**執行後 readback 對照預期**先回報 applied（F6-b） |
| **F10** | 校驗和 + schema 版本 | 匯出／匯入帶 `sha256` + `schemaVersion`；唔對就拒，唔好靜靜轉壞 |
| **F11** | 備份三時機 | 升級前／批量操作前／7 日冇備份；每週自動 Drive 留 13 份；`importAll` 驗 hash 原子還原 |
| **F12** | 開機自檢 | 必要 env 未設＝**拒絕敏感 action**（唔係照跑）；啟動時 dump 一份「缺邊個 key」診斷 |
| **F13** | 統一錯誤碼 | 一個 error code 表；回應唔洩漏堆疊／SQL／帳號是否存在；前端有對應人話 |
| **F14** | 守護測試 = 可執行文件 | 文件每一句「一定要」都要有測試守（例：`troop_link.test.mjs` 10 項） |
| **F15** | 版號可驗證 | 每次更新檔名＋內文同步（見 §7 V 系列）；code 用 `APP_VERSION` 常數，唔寫散裝 `// vX.X`；有測試守 |
| **F16** | 三處同步 checklist | 換 key = ① 下游重生 ② 上游重新登記 ③ Vercel env + Redeploy；改規則 = PLAYBOOK + docs + guard |
| **F17** | 施工次序固定 | 先安全底層 → 再功能 → 最後 UI 糖衣（見 §9） |
| **F18** | 開關 + 回滾 | 每個新功能有 kill switch；每次 deploy 有明確回滾指令（上一個 deployment） |

---

## 4. 安全 A1–A18（詳情 [docs/03-security.md](docs/03-security.md)）

| ID | 規則 | 硬要求 |
|----|------|--------|
| **A1** | secret server-only | 唔入 Git／前端／URL／QR／Sheet 格／LocalStorage；前端只有 `anon key` |
| **A2** | key rotation | 每季例行；有管理權者離任即 rotate；外洩行 [11-incidents](docs/11-incidents.md#1-key-外洩) |
| **A3** | 密碼雜湊 | PBKDF2-SHA256 ≥100k 迭代 + per-user salt + timing-safe compare；hash 只存 server |
| **A4** | Session | JWT `HttpOnly; Secure; SameSite=Lax`，exp ≤30 分鐘 + silent refresh + `jti` 綁定 |
| **A5** | 登入閘 | 5 次失敗鎖 15 分鐘；`mustChangePw` 期間只放行改密碼 API；改／重設密碼 → `pv+1` 踢走舊 session |
| **A6** | 授權 server-side | role 由 session 計，**永遠唔信 request body 嘅 role**；scope 簽入 `sig`；override ⊆ 授權人自己權限 |
| **A7** | `sig` 簽名 | HMAC-SHA256 + purpose 分離 + `ts ±5min` + nonce 一次性 + body digest + 只收 POST；比較用雙 SHA-256 防時序 |
| **A8** | 匿名可寫面 | 白名單 action + per-IP/per-unit 限流 + 寫入待批表 + 去重 |
| **A9** | Origin allowlist | CORS / postMessage / callback URL 固定 allowlist；回打端點寫死一行常數 |
| **A10** | Supabase RLS | 每張表開 RLS + policy；`service_role` 只喺 server；anon key 唔等於授權 |
| **A11** | 輸入消毒 | 試算表算式注入（只留 `0-9A-Za-z_.@-`）、XSS escape、SQL 參數化、檔種／大小驗證 |
| **A12** | 私隱 PDPO | 收集同意 + 數據清單 + 保留期（離隊 12 個月 purge／匿名化）；log 只記 metadata |
| **A13** | 審計鏈 | `AUDIT_LOG` append-only + `prev_hash` 鏈 + `ACCESS_LOG`；保留 24 個月；server-side 寫入 |
| **A14** | 隱藏超管 | 見 [04-settings-super](docs/04-settings-super.md#2-隱藏超管hidden-super-admin)：env-only、一次性票據、全動作留痕 |
| **A15** | 災難恢復 | 每 leaf 至少一個本地領袖戶 + SUPER；下游閂口後仍有恢復路徑 |
| **A16** | 供應鏈 | lockfile commit、`npm audit`、Actions pin SHA、branch protection、secret scanning、CODEOWNERS |
| **A17** | 防枚舉 | 登入／忘記密碼／申請回應統一；時序一致 |
| **A18** | 最小權限 | 外部系統零特權；工具目錄 stateless；每個 component 只有佢需要嘅權限 |

---

## 5. 系統設定 + 隱藏超管（詳情 [docs/04-settings-super.md](docs/04-settings-super.md)）

### 5.1 設定層（每個系統必備）

```
defaults (code)  →  env (Vercel / ScriptProperties)  →  remote config (Supabase / Sheet)  →  per-unit override
                         ↑ secret 只可以喺呢層，唔落 remote config
```

- **唯一入口** `getConfig(key)`：驗證型別 + 範圍 + fail closed + cache 5 分鐘 + flush endpoint。
- **secret 同設定分開**：可公開設定先落 DB；secret 只放 env，DB 只存「邊條 env 名」嘅 reference。
- **每個設定有**：key、型別、預設值、失敗行為、改動者、改動時間、audit entry。
- **開關掣只喺上游**：下游旗（例 `ALLOW_LOCAL_LOGIN`）由上游經 `sig` 寫，下游唔自改。
- **遠端設定要有 kill switch**：config 服務死咗 → 用上一個已知良好值 + 唯讀模式，唔好變磚。

### 5.2 隱藏超管（Hidden Super Admin）

> **隱藏係 UX，唔係安全本身。** 真正安全 = env-only credential + crypto ticket + 審計 + 輪換。

| 要做 | 唔准做 |
|------|--------|
| 憑證只喺 env（`SUPER_KEY`），server-only，缺 key 即 404/503 | 唔准落 DB user row、唔准有 `role=super` 普通帳號 |
| 固定受信端點 `/api/super`，60 秒一次性 AES-GCM 票據 + 防重放 | 唔准喺任何選單／導航／API list／Swagger 出現 |
| 權限只得三樣：重設密碼／解鎖帳號／唯讀診斷 | 唔准批量匯出個人資料、唔准 bypass 審計 |
| 每次使用寫 `AUDIT_LOG`（actor=super、reason、IP、ts）+ 告警 | 唔准共用密碼、唔准寫喺 README／Slack |
| 2FA／兩人規則 + 每季 rotate + 離任即 rotate | 唔准用 `admin/admin` 之類預設值 |


---

## 6. COPYRIGHT SCOUT SYSTEM W1–W8（詳情 [docs/12-copyright-scout-system.md](docs/12-copyright-scout-system.md)）

> **同瘦身 S 同級嘅通用規則**，三種 Gemini 結構（A/B/C）全部要守。

| ID | 規則 | 硬要求 |
|----|------|--------|
| **W1** | 可見版權標示 | `<meta name="copyright" content="© SCOUT SYSTEM">` + 頁尾「© SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM · `<app>` vX.Y」+ 檔頭註解 |
| **W2** | 生成圖片落隱形水印 | 8×8 DCT 中頻 QIM（`STEP=32`）；v1 `DRAWSCOUT\|v1` 向後兼容；v2 `SCOUTSYSTEM|v2\|<unit4>\|<yyyymmdd>\|<hash4>` |
| **W3** | 解碼器要兼容 + 老實 | 同時解 v1/v2；陰性結果要寫「唔代表一定唔係本系統」；decoded 內容 escape 先入 HTML（A11） |
| **W4** | 水印唔係加密／DRM | 頂到輕微 JPEG／部分裁切；頂唔到大幅縮放／旋轉／AI 重繪；唔可以當法律證據 |
| **W5** | 原圖／成品圖／使用紀錄 | Type C 必做：`originalHash`/`outputHash`/fileId + `watermarkPayload` + `promptVersion`；圖存私有 Drive／Storage，只記 hash |
| **W6** | API KEY 唔外洩 | 交付檔零真 key；單一 HTML 用 **C13 三軌**（唯一 `API_KEY` slot + 平台代理 + BYOK）；本機手動注入版 `_local_` 唔入 Git；正式系統用 Type C server-side key |
| **W7** | 水印／紀錄無個人資料 | 只放 unit／date／hash；唔放 會員 ID／email／姓名／相中人物身份（A12） |
| **W8** | 第三方素材標來源 | 用咗嘅圖／字型／CDN／模型要列 CREDITS；唔好將第三方素材落自己水印 |

---

## 7. 檔名＋內文雙版號 V1–V6（詳情 [docs/13-versioning.md](docs/13-versioning.md)）

> **用戶定案：每次更新都要檔案名稱同內文同時更新版號。** 同瘦身 S 同級嘅通用規則。

| ID | 規則 | 硬要求 |
|----|------|--------|
| **V1** | 檔名 = 內文 | 交付檔名 `_vX.Y`（例 `scout_generator_v1.0.html`）；內文所有 `vX.Y` 必須一致；測試 + guard 對照 |
| **V2** | 內文至少四處 | `<meta name="app-version">`、`<title>`、檔頭註解、`APP_VERSION` 常數、可見頁尾 |
| **V3** | 更新五步 | ① 改檔名 ② 改內文全部版號 ③ 改常數／合約／測試期望值 ④ 改版本登記表 ⑤ 跑測試 + guard |
| **V4** | 部署拷貝例外 | GAS 硬性 `index.html`／`Code.gs` → 由版本化源檔 `shell_v1.0.html`／`brain_v1.0.gs` 經 sync 腳本產生，檔頭標 `GENERATED from ... (vX.Y)` |
| **V5** | 版號入紀錄 | 每條 RECORDS／水印 payload／診斷報告帶 `appVersion` + `promptVersion`，可由成品圖反查版本 |
| **V6** | 自動驗 | guard + 測試守：檔名版號 == 內文版號 == 部署拷貝版號 == contract `fileVersion`；`_local_`/`_injected` 檔入 repo 即 fail |

---

## 7.5 雙語介面 L1–L6（**預設要做・可豁免**，詳情 [docs/44](docs/44-bilingual-ui.md)）

> **2026-11-08 用戶定案**：「如果該 APP 唔係太重，就加入英文版，中英對照，右上角有切換掣嗰種，像 4 個 BOOK 那樣。」
> 參考實作 = SCOUTBOOK／CUBSBOOK／ROVERBOOK／VSBOOK 嘅 `web/src/i18n.jsx`（pinned commit 見 docs/44 §0）。
> **層級**：同 P1 一樣係**有紀錄嘅人工判斷** — 預設要做，可豁免；豁免要寫 `EXCEPTION: L1 — 原因 — 補償措施`。**唔係** S/F/A/W/V 嗰種 CI 硬擋底線。

| ID | 規則 | 硬要求 |
|----|------|--------|
| **L1** | 雙閘判定 | **兩項都達標 → 預設要做**：① 體積：加咗英文仍過 S7（`dist` <5MB／bundle <2MB）或 C13-g（單一 HTML ≤5MB）；② 字串：要譯嘅 UI 字串 ≤300 條。任何一項超標 → 可豁免，PR／SCOPE 寫 `EXCEPTION: L1` + 實際數字 |
| **L2** | 右上角一鍵切換 | 掣放 header／top bar **右側**，唔可以收埋入選單；**顯示目標語言**（中文模式顯示 `EN`，英文模式顯示 `中文`）；`aria-label` + `title` 講明動作；鍵盤撳到；列印時隱藏 |
| **L3** | 狀態 + `lang` | 切換時同時設 `data-lang`（畀 CSS）同 `<html lang>`（`en` / `zh-Hant-HK`）；`localStorage` **全部 try/catch**（私隱模式會 throw）；key 有 app 前綴（`<app>.lang`）；**預設中文**，唔好用 `navigator.language` 自動切 |
| **L4** | 乾淨分離 | 螢幕**一次一種語言**；唔准寫死「日期 Date」並排字串（SCOUTBOOK `ui_contracts` 有測試攔）；術語單一字典，全 app 譯法一致。列印／官方表格可中英並排，限 `@media print` 範圍 |
| **L5** | 實作形狀 | React：`LangProvider` + `useLang()` + `bi(lang, zh, en)`；單一 HTML：零依賴 `data-i18n` + 字典（範本 [`templates/i18n/lang_toggle_v1.0.js`](templates/i18n/lang_toggle_v1.0.js)）。**缺譯 fall back 中文，唔可以空白**；唔准為翻譯引入 i18n 套件（S1） |
| **L6** | 驗收 | `node scripts/i18n_check_v1.0.mjs <檔或目錄>` 驗結構（掣／`lang`／try-catch／字典鍵）；**撳掣換字、F5 記住、窄螢幕唔爆版、螢幕閱讀器讀音 = 人手實測**。檢查器對「完全冇雙語」只出 WARN，唔會 FAIL |

> **範圍（用戶 2026-11-08 定案）**：呢條係**為未來 app 而設嘅定義**，只適用於**本定案之後新開嘅 app**。用戶講明「各自 APP 唔使做」＋「我只想為未來 APP 定義」——**現有 repo 一律唔追溯**（包括大改／重構；除非用戶主動開口要求嗰個 app 加英文）。規則同範本放真理倉，新 app 開工時跟。

---

## 7.6 PWA 安裝＋版本更新 I1–I8／UP1–UP5（詳情 [docs/46](docs/46-pwa-install-and-update.md)）

> **2026-11-12 用戶定案**：「安裝要有掣、更新要問過人」——唔靠瀏覽器自己彈，也唔准背景偷換版。
> **適用**：所有有 UI 嘅 web app（純靜態／Vite／Next 都一樣）。出門玩 Pocket Play v1.2.0（minigame）同 4 個 BOOK（SCOUTBOOK v2.1.3／CUBSBOOK v1.3.0／ROVERBOOK v2.2.0／VSBOOK v1.0.3，2026-11-12 pinned）已按此實作（README／CHANGELOG 聲稱部署在 Vercel；本倉未獨立核實）。
> 層級：有 UI 嘅 web app **通用**；驗收以**真機**為準（靜態檢查只兜底結構），唔係 CI 硬擋。

| ID | 規則 | 一句實作 |
|----|------|----------|
| **I1–I8** | PWA 安裝入口 | 首頁／header 有「加入主畫面」掣：standalone 自動隱藏；Android `beforeinstallprompt` 攔住存起、用戶按下先 `prompt()`；iOS 出三步教學卡；manifest／圖標跟 [G11/docs/33](docs/33-icon-standard.md) — 詳情 [docs/46](docs/46-pwa-install-and-update.md) |
| **UP1–UP5** | Service Worker 更新要問過人 | 新 SW 停在 `waiting`，唔准自動 `skipWaiting()`（首次安裝除外）；頁面出「有新版本 → 立即更新／稍後」，一鍵 `SKIP_WAITING` → `controllerchange` → reload（**2–3 秒 timeout 兜底**），reload 前存好 localStorage — 詳情 [docs/46](docs/46-pwa-install-and-update.md) |

---

## 7.7 關站與準入白名單入口 SG1–SG19（**按需啟用**，詳情 [docs/50](docs/50-app-store-whitelist-and-shutdown.md)）

> **2026-11-15 用戶定案**：「未來有機會會關站，或某些程式必須經 APP STORE（repo `website`）進入；要把這在開 APP 時告知有白名單，以及那些 APP 不適合白名單如何處理。」
> **2026-11-15 用戶第二次定案（五個官方入口，SG16 修正後）**：準入白名單入口一共 **5 個**（1 APP STORE · 2 圖書館 · 3 成員系統 · 4 區管理系統 · 5 GEMINI），登記於真理倉 [docs/50 §0.1](docs/50-app-store-whitelist-and-shutdown.md) ＋ 程式碼嘅 `PORTAL_REGISTRY`。子 App 一律用 `portalIds` 引用，唔准自己另抄一堆網址。
> **層級**：按需啟用（預設 `open` 公開直連，現有 repo 唔自動追溯）。一旦揀咗經指定入口白名單進入或暫時關站，必須跟 **SG1–SG19**（§7.7 全 19 條，唔係只有前 6 條）。

| # | 入口 | Origin | 現時撳入行為 | `<iframe>` 殼 |
|:--:|---|---|---|---|
| 1 | **APP STORE**（[`website`](https://github.com/playerkousas-rgb/website)） | `https://scoutappstore.vercel.app` | 頂層 `location.href` | ❌ |
| 2 | **圖書館**（[`scout-circulars`](https://github.com/playerkousas-rgb/scout-circulars)） | `https://scout-circulars.vercel.app` | 新分頁，**帶 `noreferrer`**（要改） | ❌ |
| 3 | **成員系統**（[`member-portal`](https://github.com/playerkousas-rgb/member-portal)） | `https://member-portal-sigma-swart.vercel.app` | `/books` `<iframe>` ＋「開啟原網站」**帶 `noreferrer`**（要改） | ✅ |
| 4 | **區管理系統**（[`scout-district-portal`](https://github.com/playerkousas-rgb/scout-district-portal)） | `https://scout-district-portal.vercel.app` | `/embed` `<iframe>` ＋新分頁**帶 `noreferrer`**（要改） | ✅ |
| 5 | **GEMINI**（**自家 private repo** `GEMINI`） | `https://gemini-woad-sigma.vercel.app` | 同 1–4 一樣係自己部署嘅 Vercel app：可掛閘、**可以**做放行來源；統計喺佢自己嗰邊 | 自己控制 |

> 子 App 寫法：`initStoreGate({ appKey, mode: 'entry-gate', portalIds: ['appstore','library','member','district'], allowStandalone: true })`。

| ID | 規則 | 硬要求 |
|----|------|--------|
| **SG1** | 開新 APP 時主動告知 | AGENT 喺 [`INTAKE.md`](templates/repo-starter/INTAKE.md) 第 0 步（Q8）必須主動告知用戶本生態設有**五個官方入口**（APP STORE／圖書館／成員系統／區管理系統／GEMINI，[docs/50 §0.1](docs/50-app-store-whitelist-and-shutdown.md)）白名單及關站機制，由用戶揀 `open`／`entry-gate`／`iframe-only`／`closed` 並寫入 `SCOPE.md` |
| **SG2** | `<iframe>` 五類禁區自動轉軌 | `*.vercel.app` 屬 Public Suffix List（跨子網域＝跨站）。凡有 ① `localStorage`／`IndexedDB` 長期資料（含 4 個 `BOOK` 及 C13 BYOK key）② PWA 加入主畫面（`I1–I8`）③ Web Push（`U9`）④ `SameSite=Lax` 登入 Cookie（`A4`）⑤ 相機／GPS／Wake Lock 權限 —— **嚴禁用 `iframe-only`**，必須改用頂層跳板 `entry-gate` 或維持 `open` |
| **SG3** | 用家開 APP 時清晰告知有白名單／關站 | 禁黑屏或無解釋閃走；掛 [`templates/vercel/store_gate_v1.0.js`](templates/vercel/store_gate_v1.0.js) 隱藏底層內容並顯示無障礙對話框告知「此程式需經 SCOUT APP STORE 開啟」或「此網站目前暫時關閉」＋ `target="_top"` 前往主站掣 |
| **SG4** | 純 `<iframe>` 白名單雙層配置 | 只限純無狀態小工具／圖卡／簡報，且**須等母站 `website` 實作 `<iframe>` 檢視器後先可開**（`041f074` 現時係頂層跳轉）；用 [`vercel.iframe-whitelist.json`](templates/vercel/vercel.iframe-whitelist.json) 設 `CSP: frame-ancestors`、**移除 `X-Frame-Options: SAMEORIGIN`** |
| **SG5** | 不適合 `<iframe>` 改用頂層跳板 `entry-gate` | App 留喺頂層獨立網域運行；輕量級驗 `new URL(referrer).origin` 白名單 Set ＋ `sessionStorage`（`try/catch`）＋ `allowStandalone: true` 放行已裝主畫面 PWA；敏感／有 `/api` 升級用 60 秒 HMAC `sig` `/api/enter` 驗票。**經任何一個入口做頂層跳轉都唔會影響 `BOOK` 嘅 `localStorage`**（只認子站 origin）；`iframe` 先會令儲存分區 |
| **SG6** | 暫時關站雙軌 | 硬關站：Vercel Dashboard `Pause Project`（連 `/api` 即停）；軟關站：`store_gate_v1.0.js` `mode: 'closed'` 或 `vercel.json` `redirects` **`"permanent": false`（302，嚴禁 `true`/308 永久快取）** |
| **SG7** | 「加入主畫面」只准由入口第一次進入 | 直開網址唔會 404（會出白名單卡），但**唔准教用家直開網址再裝**：在入口母站裝會裝到母站；真 404 冇 `manifest` 裝唔到；舊 icon 撳落去白屏。標準話術「先由入口進入 → 再按瀏覽器選單加入主畫面」，配 `allowStandalone: true` 令裝好後撳 icon 直開 |
| **SG7-a** | 白名單有代價，必須講清 | 分享連結／搜尋／書籤／QR／推播深層連結一律撞卡，WhatsApp 內置瀏覽器另有沙盒；有 Push 嘅 app 維持 `open`（**唔准**因為白名單而落閘）（docs/50 §3.4）。**「唔使用 iframe 就對 App 內部零影響」≠「對所有東西零影響」** |
| **SG8** | 入口自己永不被閘 | 五個入口自己嘅 origin 在 `portalIds` 內即自動放行（`reason: 'self-portal'`）——入口就係入口，唔需要再經其他地方；`closed` 優先蓋過 self 放行；入口自己唔應該掛 `entry-gate` |
| **SG8-a** | 直開網址預設唔自動跳 | `autoRedirectSeconds: 0` 為預設（停低顯示入口卡，避免用家以為壞咗、亦避免其餘三個入口變裝飾）；要自動就 3–5 秒＋顯示目的地，或用 `autoRedirectPortalId` 指定入口 |
| **SG9** | 入口角色分工，分享只由 `main` | `main`＝APP STORE（主站，**唯一**帶分享連結／QR）／`feed`＝圖書館（每日引流）／`internal`＝成員系統、區管理系統（自家副系統）。`website/app.js` L723／L727 現時直接分享 `app.url`（子站），開閘後會全部撞卡，要改指 `?app=<slug>` |
| **SG9-a** | 落地次序 | ① APP STORE 支援 `?app=<slug>` **✅ 已完成（`website` `bd721421`）** → ② 分享掣／QR 改深層連結 **✅ 已完成（`app.js` L838／L842／L854／L861、`index.html` L2453）** → ③ 子 App 開 `entry-gate`（**進行中：A 組**）；次序錯＝分享連結即刻失效 |
| **SG10** | 統計按入口分工，唔好重複起爐灶 | **APP STORE 已有** `apps.clicks／stars／hearts`（`bump_clicks`／`bump_stars`／`bump_hearts`）＝逐 App 點擊／收藏／Like，**唯一權威來源**；**圖書館現時唔統計**（主責通告＋Push，推廣 APP STORE 屬後期）；子 App `trackEndpoint` 只作 opt-in 補充（主畫面開啟 `standalone-pwa`／撞卡 `missing-whitelist-entry`）；無數據 ≠ 無人用 |
| **SG10-a** | 圖書館要維持 `open` | `scout-circulars` 載住 Push 訂閱（`push_subscriptions`）→ **唔可以 `iframe`、唔可以 `closed`、唔可以改 `start_url`**；要限經入口只可以局部限非通告頁 |
| **SG11** | 「收起」≠「用不到」：四個下架齒輪 | **實查**：APP STORE「隱藏」只係前端過濾（`store.js` L782 `select("*")` 拉晒再 `a.visible !== false` 篩走），**App 本身照開得**。四齒輪＝① Delist（隱藏，URL 仍可入）② Gate（`entry-gate`，擋直開但主畫面照用）③ Soft close（`closed`，見告示）④ Hard close（Vercel Pause，完全離線）。按意圖揀，唔係按「幾快」 |
| **SG11-a** | `BOOK` 類下架要先保入口＋備份 | 有真實紀錄（成員進度／考章）→ 只可以 Delist，**唔可以同時拆走入口**；必須 `allowStandalone: true`；落 ③④ 前先出通告叫用戶匯出 JSON／QR |
| **SG11-b** | 敏感 App 唔可以靠「隱藏」做保護 | `visible=false` 唔係安全邊界（API 照回傳）→ 要 `entry-gate`（或 Vercel Pause 全停）；**唔准**用 §4.3 簽票／後端驗票做預設（SG12：用戶明確唔需要基建）（docs/50 §3.8 B） |
| **SG12** | 防偷用唔係技術問題，係「表態」問題 | 用戶定案：領袖權限**不用保**（有空改功能變數即可）；功能簡單嘅 App「佢抄得到都寫得到」。→ **唔准**過度工程（唔需要為每個 App 起後端驗票）；真正要做＝**經入口 `entry-gate`** ＋ **一次輕量支持邀請 `supportNudge`**；抄走代碼唔當損失，損失係「用你嘅成果但唔表態」 |
| **SG13** | 支持提示要講真話，只對「睇唔到嘅人」講 | 文案用「**書架位置有限：長期冇人收藏／Like 會收起，騰位俾新 App**」（唔用客氣話）。**預設 `skipPortalIds: ['appstore']`**：經 APP STORE 入嘅你已睇得到 `clicks`／`stars`／`hearts`，唔提；只對「主畫面直開」同「其他入口入」嘅人提。其餘：只在已放行時顯示、`role="complementary"`、有「唔使喇」、30 日一次、Safari 封 storage 靜默、**嚴禁**迫 Like |
| **SG14** | 書架政策：唔寫死門檻，三條要守 | **唔准**寫固定日數／數字門檻（用戶睇後台自行判斷）；只守 ① 公開前置（政策寫喺 APP STORE 說明）② 收起＝只 Delist，代碼／網址／資料保留 ③ 豁免 `BOOK` 類同自家系統；Like 數 ≠ 使用人數，所以決定權喺用戶 |
| **SG15** | 逐個 App 由該 App 嘅 AGENT 決定 | 真理倉唔替個別 App 決定細節 → 一律派 [`WHITELIST-HANDOFF.md`](templates/repo-starter/WHITELIST-HANDOFF.md)：6 條問題 → 按類型落實 → 真機三項驗收 → 回報格式 |
| **SG16** | 五個入口全部同等（**2026-11-15 第二次修正**） | 用戶：「我說的是我的 REPO "GEMINI"」＋「因為果個係私人 REPO」→ 第 5 個入口係**用戶自己 private repo 部署嘅 Vercel app**（`gemini-woad-sigma.vercel.app`），**唔係** Google 的 Gemini／Canvas。所以 **1–5 全部屬 `outbound`**：可掛 `store_gate`、帶 `Referer`、可做 `entry-gate` 放行來源；`portalIds: ['appstore','gemini']` 正常生效；`CANVAS_PORTAL_IDS`／`INBOUND_PORTAL_IDS` 固定為**空陣列**（舊錯分類已撤銷）。⚠️ private repo → agent 用 GitHub API 可能回 `403`，**讀唔到唔等於唔存在、唔准寫成死連** |
| **SG17** | 要唔要先逐個入口「打招呼」？ → **唔使** | 用戶 2026-11-15：「GEMINI 是另一系統佢同其他 App 完全無關係當然唔洗；成員系統區管理系統其實都唔會直入 APP，佢地係連 APP STORE 同圖書館的，最多成員連埋 BOOK。」→ 每個入口登記 `admit`：`appstore`=`always`（分享／QR 只由佢產生，所有子 App 預設寫入）、`library`=`conditional`（**只需**改 `index.html` L5662 一個 `noreferrer`，Push／統計／通告流程一律唔准動）、`member`／`district`=`optional`（實查兩邊唔做 App 目錄，只連入口＋自家系統；例外＝4 本 BOOK，但 BOOK 管制宜寬鬆）、`gemini`=`optional`（自己 private repo 嘅 Vercel app，可以加）。程式：`DEFAULT_PORTAL_IDS = ['appstore']`、`portalIdsAdmit: 'all'` ＝ 1–4 全開、永遠唔會誤包 Gemini |
| **SG18** | 子 App「讚好／收藏」一鍵回跳主站詳情卡 | **2026-11-21 定案**：呢粒掣係**所有新 App 必做**（唔分組，方便 APP STORE 統計 clicks／stars／hearts —— 參考航空圖鑑 v0.37.0，詳見 [docs/60](docs/60-future-apps-support-button.md)）。**嚴禁**子 App 直連主站 Supabase／複製 anon key／呼叫 `bump_hearts`／`bump_stars`（收藏清單存喺主站同源 `localStorage`，子 App 寫 DB 都唔會入到用家收藏夾）；唯一做法＝常駐非阻塞 `<a target="_blank" rel="noopener">` 開 `ScoutStoreGate.getAppStoreUrl(slug)`；`<slug>` 必須對 `website/migrations/20261116-app-slug-seed.sql` 核實（**唔准靠 repo 名猜**）；`ScoutStoreGate` 未載入要 `hidden`（CSS 要有 `[hidden]{display:none}`）；列印隱藏、雙語同步、觸控 ≥40px；**預設唔開 `supportNudge`**（避免同一用家被騷擾兩次，SG13） |
| **SG19** | 攔截卡按鈕 ≠ 放行來源 | 預設同時放行 `appstore`＋`library`，但攔截卡**只出 appstore 一粒掣**（`silentPortalIds`）；`allowedOrigins` 只係**額外**放行來源，同 `portals` **聯集唔可以蓋過**（舊寫法令 `matchedPortalId` 變空）；單掣自動去 `1.` 編號；預設文案＝簡短人話（「需經由 SCOUT APP STORE 開啟」），**舊字串保留做 alias 唔准刪**；`COPY.en` 要補齊 `supportText`／`supportCta`／`supportDismiss` |

---

## 8. 技術棧契約（快表）

| 棧 | 必做 ID | 詳細 |
|----|---------|------|
| **Git** | G1–G10：main 保護、feature branch → PR、Conventional Commits、tag、lockfile、Actions pin SHA、CODEOWNERS、secret scanning、唔 commit binary、docs 跟版本 | [docs/05-git.md](docs/05-git.md) |
| **站台圖標** | **G11 全站圖標標準**：開工即出齊 **9 個 PNG／ICO**（`.ico`／16／32／180／192／512／maskable 192／maskable 512／og 1200×630）；**否決 SVG／AVIF／WebP／JPEG**；滿版無框、≥4 色、主體居中 60–70%；maskable 安全區 **66%**；16px **手繪**；9 檔 **≤260 KB**、dist **≤1 MB**；HTML 5 link＋4 meta（`og:image` **絕對網址**）；`/icons/*` immutable → 改圖要改檔名 | [docs/33](docs/33-icon-standard.md) |
| **Vercel** | VL1–VL12：`/api/proxy` 先驗 session 再 inject key、env 分環境、`NEXT_PUBLIC_*`/`VITE_*` = 公開、regions hkg1、security headers、rate limit、preview 關、retention 7、rollback、cron、log 唔記 PII | [docs/06-vercel.md](docs/06-vercel.md) |
| **Apps Script** | X1–X13：一份 `Code.gs` 部署各層、`ScriptProperties` 存 secret、`/exec` 新版本唔改 URL、`requireAuth` 第一行、action 白名單、ScriptLock、CacheService、Drive 匯出 private、雙版號源檔 + 部署拷貝 sync | [docs/07-apps-script.md](docs/07-apps-script.md) |
| **Supabase** | U1–U12：migrations 入 Git、每表 RLS、anon vs service_role、Edge Functions 唔 log secret、Storage policy、index + 分頁、push 訂閱只存 hash、每日 cron、備份、free-tier 休眠 | [docs/08-supabase.md](docs/08-supabase.md) |
| **Gemini / Canvas** | C1–C12 三種結構 ＋ C13：A 全開放／B 隱藏水印＋API KEY 注入／C 腦殼分離（GS 腦＋HTML 殼，記錄原圖／成品圖／使用紀錄＋保護 PROMPT）；Canvas 只准生殼；**C13 三軌自動注入（已實作、實測可用）**；**C13-g 單一 HTML 5MB 上限、唔強制瘦身** | [docs/09-gemini-canvas.md](docs/09-gemini-canvas.md) |
| **資源查找** | 上游 `f/prompts.chat` → 自己 `prompt` Prompt Studio → `api` 香港 API 天書 → 呢個 repo 嘅 W/V 規則；索引只放連結，唔複製內容（F1） | [docs/15-resource-index.md](docs/15-resource-index.md) |
| **設計資源** | 開新 repo 揀設計：素材（`bradtraversy`）→ 靈感＋UX（`awesome-design`）→ design language `DESIGN.md`（`awesome-design-md`）→ 系統設計（`system-design-primer`）→ UI 組件（`ant-design`／`astryx` 只做 **CSS 變數 theme + 互動慣例**參考，見 [23 §2.6](docs/23-design-resources.md#26-metaastryxreact-19--stylexbetamit-只抄-token-概念)）；落 repo 要留 `CREDITS.md`（W8）＋ 圖標跟 G11 | [docs/23-design-resources.md](docs/23-design-resources.md) |
| **實戰案例** | `童軍漫畫生成器 v4.2.1`（2.04MB 單一 HTML）：V1 雙版號腐爛、`?key=`、水印 v1、C13 請求代理實證；升級路線 + 審計器 | [docs/16-canvas-case-scout-comic.md](docs/16-canvas-case-scout-comic.md) |
| **退役記錄** | ecportal 6 份案例檔點解刪、依賴清單、5 個 live repo 現況 | [docs/57](docs/57-ecportal-to-vsportal-migration.md) |
| **多層系統可選模式（唔係通用）** | R1–R8（定級別／唔做清單／registry／接駁／上游控下游／回傳三條／身份錨點／診斷）＋ VSPORTAL 現行架構 | [docs/58](docs/58-multilevel-system-patterns.md) |
| **Repo 健康** | 11 個 repo 審計：`api`／`prompt` 留唔留、邊個有 critical／158MB | [docs/20-repo-health-audit.md](docs/20-repo-health-audit.md) |

---

## 8.1 專案案例隔離（**唔係通用規則**）

> 2026-10-27 用戶指示：**多單位管理系統嘅設定唔屬通用，要分開寫。**
> **2026-11-19 更新**：ecportal 已退役；佢嘅 R1–R8（定級別、模組註冊制、接駁 registry、`ALLOW_LOCAL_LOGIN`、身份錨點等）已**通用化**（拎走舊專案名）搬去 **[docs/58 可選模式](docs/58-multilevel-system-patterns.md)**，並標明「唔係通用底線」。舊案例本身喺 git history。
> 通用技術機制（A7 雙通道 sig／F4 fail closed／F11 備份／U4 推送只存 hash）仍然留喺本檔同對應 `docs/`。
> 各 repo 有乜病（critical 漏洞／158MB）→ [docs/20](docs/20-repo-health-audit.md)；點解當初抽咗出嚟 → [docs/57](docs/57-ecportal-to-vsportal-migration.md)。

**判準**：一個設定係咪通用，睇佢係咪「換咗業務都仍然成立」。
`ALLOW_LOCAL_LOGIN` fail closed、`sig` 雙通道、備份驗 hash → 通用；
五級階梯、`FEATURE_REGISTRY` 具體模組名、`會員 ID` 格式、`<repo>-troop-sig-v1` 字串、五個 repo 名 → **專案**，一律去 19。

---

## 9. 施工次序（唔好調轉）

```
0. 定職責邊界 + 寫「唔做清單」+ 功能 registry 骨架      ← 多單位系統先需要（案例見 19）
1. repo 骨架 + .gitignore/.vercelignore + guard（CI 綠）
1b. 出齊 9 個站台圖標 + 掛 link／meta／manifest      ← G11（唔好留到最後）
2. 設定層 getConfig + fail closed + env 自檢         ← F12
3. /api/proxy：verifySession → inject secret；GAS requireAuth   ← A1/A6
4. 密碼雜湊 + 自動升級 + mustChangePw gate + 鎖定  ← A3/A5
5. 原子寫入（ScriptLock / 樂觀鎖）+ 前端排隊        ← F7
6. 限流 + origin allowlist + 輸入消毒               ← A8/A9/A11
7. AUDIT_LOG / ACCESS_LOG                          ← A13
8. 隱藏超管 + 災難恢復通道                         ← A14/A15
9. 功能：身份/開戶 → 核心模組 → 次要模組
10. 備份 / 匯出匯入 / 診斷 / MOCK 教學
11. 瘦身驗收（S7 CI 硬攔）+ 上線 checklist
12. W/V 驗收：© SCOUT SYSTEM 標示 + 水印實測 + 檔名／內文雙版號 + 版本登記表
```

> 功能次序可以因專案調整，**0–8 唔可以插隊**：邊界未定就開工 = 易越級；安全底層未起好就加功能 = 之後全部要拆。

---

## 10. 驗收閘（Definition of Done）

一個 change 要被稱為「完成」，必須同時：

- [ ] 多單位系統：職責邊界／唔做清單／功能 registry 已定（可選模式 R1–R3 見 [docs/58](docs/58-multilevel-system-patterns.md)）
- [ ] `node scripts/guard.mjs` 綠（本機 + CI）
- [ ] `node scripts/final_check_v1.0.mjs` 六角度全綠 + 7 條人手實測做咗（[docs/17](docs/17-final-check-and-tutorial.md)）
- [ ] 單一 HTML artifact：`node scripts/audit_single_html_v1.0.mjs <檔名>` 無 FAIL（C13-f）
- [ ] **有 `package.json`（有建置步驟）先做**：`npm run check && npm run build` 綠；純文件／單一 HTML／Canvas app 冇 package.json → 喺 PR 寫 `N/A`（C13-g）
- [ ] G11：9 個圖標齊（尺寸用程式驗）、manifest 4 icon 200、9 檔 ≤260 KB、`og:image` 絕對網址
- [ ] S7 體積冇超標（Vercel/dist 類）；**單一 HTML 改用 C13-g 5MB 上限，唔強制瘦身**；新增資源經 `npm run slim:dead` 檢查
- [ ] 每個新 action 有白名單 + 測試；每個新 secret 有 `.env.example` 條目 + rotation 步驟
- [ ] 每個新設定有 `getConfig` 條目 + 預設值 + fail closed 值 + audit
- [ ] 每個危險動作有 dry-run / 確認 / 回滾指令
- [ ] W1 版權標示 + W2 水印（如出圖）+ W6 交付檔無真 key
- [ ] V1 檔名＋內文版號一致 + V4 部署拷貝已 sync（Type C）
- [ ] L1–L6：雙閘達標嘅 app 有英文 + 右上角切換掣（`i18n_check` 無 FAIL + 人手撳實測）；唔做有寫 `EXCEPTION: L1`（[docs/44](docs/44-bilingual-ui.md)）
- [ ] SG1–SG6（判定／告知／提示卡／閘門）：已避開五類 `iframe` 禁區、開 APP 時有白名單／關站提示卡、`redirects` 用 `permanent: false`、“加入主畫面”引導係「先入口、後安裝」（[docs/50](docs/50-app-store-whitelist-and-shutdown.md)）
- [ ] SG7–SG14（運作／統計／下架／書架）：圖書館維持 `open`；下架按四齒輪 Delist→Gate→Soft→Hard 逐級落；`supportNudge` 文案寫明書架政策、預設 skip appstore；書架政策已公開、`BOOK`／自家系統豁免；`BOOK` 類落 ③④ 前已通知用戶備份
- [ ] SG15–SG19（交接／入口擴充／回跳）：逐個 App 交接清單派咗、五個入口用 `portalIds`／`admit` 而唔自抄網址、分享／QR 只由 APP STORE 產生、SG18／SG19 詳見下一行
- [ ] SG18／SG19（子 App 回跳主站用 `getAppStoreUrl(slug)`，冇直連主站 Supabase；`<slug>` 對 `20261116-app-slug-seed.sql` 核實；`silentPortalIds` 之後攔截卡只出一粒掣；`[hidden]{display:none}` 有寫實）；SG18 **所有新 App 必做**（2026-11-21 定案）—— 掣存在＋fail-safe＋窄屏/print/雙語，人手驗收（PREFLIGHT 驗唔到，參考航空圖鑑 v0.37.0，見 docs/60）
- [ ] README 寫作紀律（[docs/47](docs/47-readme-discipline.md)）：每句「已修」有檢查或實測、每句「未做」寫限制、冇「理論上應該 work」字樣
- [ ] `docs/` 同 `PLAYBOOK.md` 已更新（規則改動時）
- [ ] 新規則／新 `docs/` 章節／新派工指令：已交**另一個對話**做[金魚審](docs/52-fresh-eyes-review.md)（零上文＋改寫先行；同一個對話自己審自己**唔算**；最多重審 1 次，剩餘寫入「接受風險」）
- [ ] PR 描述寫明：身份錨點有冇改、registry 有冇加、key 有冇 rotate

---

## 11. 違規處理

違反 S/F/A/W/V（同 G11 圖標標準）任何一條 = **regression**，CI 同 code review 直接擋。
真係有例外：喺 PR 用 `EXCEPTION: <ID> — 原因 — 補償措施 — 復原日期` 格式寫明，並喺 `docs/10-checklists.md` 登記，唔准靜靜過。

**條件式通用規則（P1／L1–L6）唔入上面呢個硬擋清單**：佢哋係「預設要做、可豁免」。豁免照用同一個 `EXCEPTION:` 格式寫原因同補償（L1 要寫埋邊個閘超標同實際數字），並喺 `docs/10-checklists.md` 登記。**冇寫 EXCEPTION 又冇做 = 施工未完成**，喺 code review 追，唔係喺 CI 擋。
