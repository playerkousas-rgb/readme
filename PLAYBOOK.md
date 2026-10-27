# PLAYBOOK — 核心規範總綱（唯一規則編號表）

> **點用**：呢份係「必看」嘅濃縮版。每條規則有一個 ID（S/F/A/W/V/G/VL/X/U/C）。
> **案例隔離**：由 ecportal 案例抽出嘅「可選模式」R1–R8 已移去 [docs/19](docs/19-ecportal-troop-case.md)，**唔係通用底線**；新 app 只守 S/F/A/W/V ＋ 技術棧契約。checklist、CI、PR template 全部用 ID 引用，唔好改 ID。
> **層級**：呢份 = 所有 app 嘅**最低要求**。個別 app 可以加嚴，唔可以減；要減就喺 PR 寫例外原因 + 補償措施。
> 深挖：每個章節尾有對應 `docs/` 連結。

---

## 0. 開工前：三分類，決定做幾多

| 類型 | 例子 | 要做嘅嘢 |
|------|------|----------|
| **工具（stateless）** | 密碼產生器、日期計算機、Canvas 小工具 | 純前端、無後端無儲存 → 只需 S6/S7、A11、C 系列；**唔需要設定層同超管** |
| **App（有資料）** | 表單、記錄冊、通告頁 | 全套 S/F/A ＋ 設定層 ＋ 備份；超管視乎有冇帳號 |
| **系統（多層／多單位／有身份）** | ecportal 旅團系統、管理平台 | **全套 ＋ 設定層 ＋ 隱藏超管 ＋ registry ＋ 審計鏈，一個都唔少** |

> 用戶講「系統」兩個字 = 自動當第三類，**設定層同隱藏超管係硬性交付物**，唔係 nice-to-have。
> 無論邊一類，**S 瘦身／F 防呆／A 安全／W COPYRIGHT SCOUT SYSTEM／V 雙版號** 五套通用規則全部適用。

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
| **S6** | 圖轉 AVIF / WebP | 單檔 `< 500KB`；上載單檔 ≤5MB、每筆 3 張、每單位每日總量上限 |
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
| **F5** | 白名單 > 黑名單 | action／檔種／origin／欄位／重定向 URL 全部用 allowlist |
| **F6** | 冪等鍵 | `transferId`／`nonce`／`jti`／`baseVersion`；重複請求結果一致，唔會雙寫 |
| **F7** | 樂觀鎖 + 原子寫入 | 寫入帶 `baseVersion`；撞版回 `conflict:true`；後端 lock + 暫存行一次過 commit；刪除 = tombstone |
| **F8** | 三色狀態 | 黃＝未存、綠＝已存、紅＝衝突；一鍵複製診斷報告 `{version,bytes,sizes,stagingRows}` |
| **F9** | 危險動作三步 | dry-run → diff 預覽 → 確認；批量操作前自動提醒備份 |
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

## 8. 技術棧契約（快表）

| 棧 | 必做 ID | 詳細 |
|----|---------|------|
| **Git** | G1–G10：main 保護、feature branch → PR、Conventional Commits、tag、lockfile、Actions pin SHA、CODEOWNERS、secret scanning、唔 commit binary、docs 跟版本 | [docs/05-git.md](docs/05-git.md) |
| **Vercel** | VL1–VL12：`/api/proxy` 先驗 session 再 inject key、env 分環境、`NEXT_PUBLIC_*`/`VITE_*` = 公開、regions hkg1、security headers、rate limit、preview 關、retention 7、rollback、cron、log 唔記 PII | [docs/06-vercel.md](docs/06-vercel.md) |
| **Apps Script** | X1–X13：一份 `Code.gs` 部署各層、`ScriptProperties` 存 secret、`/exec` 新版本唔改 URL、`requireAuth` 第一行、action 白名單、ScriptLock、CacheService、Drive 匯出 private、雙版號源檔 + 部署拷貝 sync | [docs/07-apps-script.md](docs/07-apps-script.md) |
| **Supabase** | U1–U12：migrations 入 Git、每表 RLS、anon vs service_role、Edge Functions 唔 log secret、Storage policy、index + 分頁、push 訂閱只存 hash、每日 cron、備份、free-tier 休眠 | [docs/08-supabase.md](docs/08-supabase.md) |
| **Gemini / Canvas** | C1–C12 三種結構 ＋ C13：A 全開放／B 隱藏水印＋API KEY 注入／C 腦殼分離（GS 腦＋HTML 殼，記錄原圖／成品圖／使用紀錄＋保護 PROMPT）；Canvas 只准生殼；**C13 三軌自動注入（已實作、實測可用）**；**C13-g 單一 HTML 5MB 上限、唔強制瘦身** | [docs/09-gemini-canvas.md](docs/09-gemini-canvas.md) |
| **資源查找** | 上游 `f/prompts.chat` → 自己 `prompt` Prompt Studio → `api` 香港 API 天書 → 呢個 repo 嘅 W/V 規則；索引只放連結，唔複製內容（F1） | [docs/15-resource-index.md](docs/15-resource-index.md) |
| **實戰案例** | `童軍漫畫生成器 v4.2.1`（2.04MB 單一 HTML）：V1 雙版號腐爛、`?key=`、水印 v1、C13 請求代理實證；升級路線 + 審計器 | [docs/16-canvas-case-scout-comic.md](docs/16-canvas-case-scout-comic.md) |
| **對照審計** | 原有 4 份 as-built 檔 vs 新系統：漏咗乜、佢哋有乜好系統我冇 | [docs/18-as-built-gap-audit.md](docs/18-as-built-gap-audit.md) |
| **專案案例（唔係通用）** | ecportal 旅團／進度追蹤：五級階梯、`UNIT_*`／`DOWNSTREAM_*`、舊 sig、五個 repo | [docs/19-ecportal-troop-case.md](docs/19-ecportal-troop-case.md) |
| **Repo 健康** | 11 個 repo 審計：`api`／`prompt` 留唔留、邊個有 critical／158MB | [docs/20-repo-health-audit.md](docs/20-repo-health-audit.md) |

---

## 8.1 專案案例隔離（**唔係通用規則**）

> 2026-10-27 用戶指示：**旅團／進度追蹤管理系統唔屬通用設定，要分開寫。**
> 所以原本放喺呢度嘅 R1–R8（五級階梯、模組註冊制、接駁 registry、`ALLOW_LOCAL_LOGIN`、身份錨點等）
> 已全部搬去 **[docs/19 專案案例](docs/19-ecportal-troop-case.md)**，並標明為「可選模式，唔係通用底線」。
> 通用技術機制（A7 雙通道 sig／F4 fail closed／F11 備份／U4 推送只存 hash）仍然留喺本檔同對應 `docs/`。
> 各 repo 有乜病（critical 漏洞／158MB）→ [docs/20](docs/20-repo-health-audit.md)；點解當初抽咗出嚟 → [docs/18](docs/18-as-built-gap-audit.md)。

**判準**：一個設定係咪通用，睇佢係咪「換咗業務都仍然成立」。
`ALLOW_LOCAL_LOGIN` fail closed、`sig` 雙通道、備份驗 hash → 通用；
五級階梯、`FEATURE_REGISTRY` 具體模組名、`會員 ID` 格式、`<repo>-troop-sig-v1` 字串、五個 repo 名 → **專案**，一律去 19。

---

## 9. 施工次序（唔好調轉）

```
0. 定職責邊界 + 寫「唔做清單」+ 功能 registry 骨架      ← 多單位系統先需要（案例見 19）
1. repo 骨架 + .gitignore/.vercelignore + guard（CI 綠）
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

- [ ] 多單位系統：職責邊界／唔做清單／功能 registry 已定（可選模式見 [docs/19](docs/19-ecportal-troop-case.md)）
- [ ] `node scripts/guard.mjs` 綠（本機 + CI）
- [ ] `node scripts/final_check_v1.0.mjs` 六角度全綠 + 7 條人手實測做咗（[docs/17](docs/17-final-check-and-tutorial.md)）
- [ ] 單一 HTML artifact：`node scripts/audit_single_html_v1.0.mjs <檔名>` 無 FAIL（C13-f）
- [ ] `npm run check && npm run build` 綠
- [ ] S7 體積冇超標（Vercel/dist 類）；**單一 HTML 改用 C13-g 5MB 上限，唔強制瘦身**；新增資源經 `npm run slim:dead` 檢查
- [ ] 每個新 action 有白名單 + 測試；每個新 secret 有 `.env.example` 條目 + rotation 步驟
- [ ] 每個新設定有 `getConfig` 條目 + 預設值 + fail closed 值 + audit
- [ ] 每個危險動作有 dry-run / 確認 / 回滾指令
- [ ] W1 版權標示 + W2 水印（如出圖）+ W6 交付檔無真 key
- [ ] V1 檔名＋內文版號一致 + V4 部署拷貝已 sync（Type C）
- [ ] `docs/` 同 `PLAYBOOK.md` 已更新（規則改動時）
- [ ] PR 描述寫明：身份錨點有冇改、registry 有冇加、key 有冇 rotate

---

## 11. 違規處理

違反 S/F/A/W/V 任何一條 = **regression**，CI 同 code review 直接擋。
真係有例外：喺 PR 用 `EXCEPTION: <ID> — 原因 — 補償措施 — 復原日期` 格式寫明，並喺 `docs/10-checklists.md` 登記，唔准靜靜過。
