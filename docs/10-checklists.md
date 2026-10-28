# 10 — Checklists（全部喺度）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> 用法：**逐格剔，唔好靠記憶**。CI（`node scripts/guard.mjs`）只可以守住機械化嗰部分；其餘係人肉閘，但都要寫低。
> 規則 ID 對返 [PLAYBOOK.md](../PLAYBOOK.md)。

---

## 1. 開新 app（30 分鐘）

### 1.1 判定
```
[ ] 類型：工具 / App / 系統
[ ] 若「系統」→ 設定層 + 隱藏超管 + registry + 審計鏈全部係硬性交付物
[ ] 兩條公理答到：身份 = 邊個 ID + 邊個資料源？接入 = 交俾邊個 + 登記邊個 registry？
[ ] 多單位系統先需要：定職責邊界／「唔做清單」／功能 registry（**可選做法**，案例見 [19](19-ecportal-troop-case.md)；唔係通用底線）
[ ] 技術棧揀好：Git / Vercel / GAS / Supabase / Gemini Canvas（邊幾個）
[ ] Gemini 結構揀好：A 全開放 / B 隱藏水印 / C 腦殼分離（見 [09-gemini-canvas C1](09-gemini-canvas.md#c1--決策表揀錯結構--之後要拆)）
```

### 1.2 Repo 骨架
```
[ ] 由 templates/ 抄：.gitignore / .vercelignore / vercel.json / package.json / env.example
[ ] .github/workflows/guard.yml + dependabot.yml
[ ] scripts/guard.mjs（本機 + CI 同一條）
[ ] README.md（呢個 app 嘅入口）＋ BUILD.md（專案定案）＋ docs/（教材/checklist）
[ ] .env.local 只喺本機；Vercel Dashboard 設 Production env
[ ] icons/ 9 個圖標齊（PNG／ICO，尺寸用程式驗；maskable 66%）＋ manifest 4 icon（G11 → [README §9](../README.md#9-g11-全站圖標標準iconfavicon)）
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
```

---

## 2. 每次施工（commit 前）

```
[ ] node scripts/guard.mjs 綠
[ ] 有單一 HTML 交付：node scripts/audit_single_html_v1.0.mjs <檔名> 無 FAIL（C13-f）
[ ] npm run check && npm run build 綠
[ ] 冇 secret / .env / node_modules / dist / *.bak,tmp,old,log 入 Git（G5）
[ ] 新 action → 白名單 + 測試（F5/F14）
[ ] 新 env → .env.example 條目 + F12 自檢 + rotation 步驟
[ ] 新設定 → SCHEMA 條目 + 預設 + failClosed + audit
[ ] 新寫入 → 冪等鍵 + baseVersion + 錯誤碼（F6/F7/F13）
[ ] 危險動作 → dry-run / diff / 確認 / 回滾（F9/F18）
[ ] 改規則 → PLAYBOOK + docs + guard + templates 四處同步（F16）
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
```

### 3.3 防呆 / 恢復
```
[ ] 備份啱啱做過 + importAll 實測還原（F11）
[ ] 一鍵診斷報告可用（F8）
[ ] kill switch 測過（F18）
[ ] 回滾指令寫咗喺 PR（VL11）
[ ] W1 版權 + V1 雙版號 + 水印（B/C）全部驗過
[ ] 守護測試全綠（F14）
```

### 3.4 文件
```
[ ] README / BUILD / docs 同 as-built 一致
[ ] 通用規則同專案文件無矛盾（G10）
[ ] runbook 放咗喺 docs/ 或呢個真理倉
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
