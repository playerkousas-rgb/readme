---
version: v4.5.0
date: 2026-09-22
status: REVIEW
---

# v4.2.0 三角度審查: 用戶 / 系統工程 / 管理

評級: **P0** = 上線前必須修 / **P1** = 要修或要規劃 / **P2** = 建議
每條: 問題 → 影響 → 建議修法 → 落邊份 spec

---

## A. 用戶角度 (成員 / 領袖 / 家長 / SUPER)

| # | 級 | 問題 | 影響 | 建議 |
|---|----|------|------|------|
| A1 | P1 | 一個領袖橫跨兩個支部 (CUB+SCOUT 領袖好常見): members schema 只有單一 role/troop_id/patrol_id，同一 email 冇可能開兩個帳號 | 領袖要兩個 email 兩套密碼，或者只做得到一邊 | role 改為 per-leaf membership（同一 sub 對每個 leaf 一條 role 記錄），sig 本來就 per-leaf 簽，天然支援 | 01 |
| A2 | P1 | 成員升團 CUB→SCOUT: 帳號遷移、SCOUT_ID 保留、舊進度歷史帶唔帶走，完全未定義 | 升團季全旅人手搬數據，出錯高危 | 定義「升團」操作: 同 ymis 開新 membership + 舊記錄 tombstone + 歷史唯讀保留 | 01/03 |
| A3 | P2 | 家長跨旅（細路喺唔同旅）: 只可以兩個帳號兩套密碼，忘記密碼要逐個旅做 | 家長體驗差，但 06 已聲明係 Mode-B 限制 | 接受 + 文檔寫清楚；長遠先考慮中央 PARENTS | 06 |
| A4 | P2 | 邀請連結 24h 過期後冇重發流程 | 新領袖錯過窗口就卡死 | 上級可 re-issue（覆寫 inviteToken/inviteExp），一文講明 | 01 |
| A5 | P2 | 成員（YMIS）首次密碼邊個設、點交畀成員/家長，未定義 | 開學季混亂，可能全團同一預設密碼 | 領袖批量開戶→每人隨機臨時密碼+mustChangePw（行 07 問5 同一套） | 01/07 |
| A6 | P2 | 家長全唯讀: 冇家長確認/回條（請假、同意書、活動回條） | 家長仲係要 WhatsApp 做嘢，portal 價值打折扣 | 加一個「家長確認」欄位（07 問2 已提），P2 範圍 | 07 |
| A7 | P2 | 領袖離任交接: 權限移交、帳戶 ownership 轉手流程未定義（見 C3 更嚴重） | 離任領袖仲有權，或者數據鎖死 | 定義交接 SOP: 上級重設密碼+撤 override+轉 Google/Vercel ownership | 07 |

**做得啱嘅地方**: offline-first 對露營/營地無訊號場景係正確取捨；成員忘記密碼行上級重設對青少年團體合理；家長唯讀+子女聯集簡單易懂。

---

## B. 系統工程角度 (BUG)

| # | 級 | BUG | 影響 | 建議 |
|---|----|-----|------|------|
| B1 | **P0** | LWW 用 client 時鐘: staging updatedAt 係瀏覽器時間，客戶端時鐘歪幾分鐘→衝突判錯邊個新 | 靜靜地食咗人嘅修改 | 時鐘只有一個來源: sync 時後端 serverTime 蓋章 + 每記錄 version 自增（03 已有半個，要講明 client 時間一律唔信） | 03 |
| B2 | **P0** | merge3 無 tombstone: A 刪記錄、B 改同一記錄另一欄 → 3-way merge 復活咗條刪咗嘅記錄 | 刪唔走嘅幽靈記錄 | 刪除=寫 `deleted:true` marker 唔做 hard delete；purge 由後端定期做 | 03 |
| B3 | **P0** | 登入完全冇 rate limit / 帳號鎖定: YMIS/SCOUT_ID 係猜到嘅格式（0082V+序號），可以暴力試密碼 | 成員帳號可被爆 | Apps Script 內做 per-account 失敗計數（PropertiesService）+ 遞增延遲 + 鎖定要上級解 | 01 |
| B4 | **P0** | 密碼雜湊演算法未指定（01 只寫 passwordHash+salt）; SUPER 直接驗證都未講比對方法 | 可能出咗單次 SHA-1 級別嘅嘢 | 寫死: PBKDF2-SHA256 ≥100k 迭代 + per-user salt + timing-safe compare（Vercel 同 Apps Script 兩邊都要） | 01 |
| B5 | P1 | 「重設即踢線」其實做唔到: verifySession() 只本地驗 JWT 簽名，唔會每次請求查 leaf pv；sig 路徑更加冇 pv | 改咗密碼，舊 session 仲用到 exp 為止 | session exp 縮到 ≤30min + silent refresh；或者 leaf 每次 sync 檢查 session 版本（60s cache 折衷） | 01/07 |
| B6 | P1 | sig 冇 jti/綁定: sig 落到瀏覽器，1 小時內可以重放、可以複製畀第二部機 | sig 外洩=1小時冒名 | sig 加綁 session jti；exp 收短至 15-30min | 01 |
| B7 | P1 | read 都要 ScriptLock → 全 script 串行，全旅同一晚 sync 會大塞（20s 等唔到就失敗） | 同步高峰大量黃點 | read 改 optimistic: 讀 pointer→chunks→覆查 pointer 冇變，變咗先重讀；寫先排 Lock | 03 |
| B8 | P1 | 每次寫入重寫「全庫」所有 chunk → O(庫大細)，寫越多衝突面越大 | 上規模後同步失敗率上升 | 收益遞減先做，但至少分 shard（per-團/per-badge）減低撞鎖面 | 03 |
| B9 | P1 | 同步重試冇 backoff/jitter/上限 | 失敗風暴打自己後端 | 指數 backoff + jitter + 上限，超過標紅等人手 | 05 |
| B10 | P1 | mustChangePw 冇講限定: 未改密碼前理應只可以行 change-password 一個 API | 臨時密碼帳號可以照用晒所有功能 | requireAuth 加一層 mustChangePw gate | 01 |
| B11 | P1 | 隨機來源未指定: 12字 token/臨時密碼如果用 Math.random 就廢 | 邀請連結可被猜 | 寫死 crypto.getRandomValues / Utilities 之 crypto 級 PRNG，36+ 字元集 | 01/07 |
| B12 | P1 | leaf 本地密碼登入嘅 session 機制未定義（Apps Script Web App 冇正式 session API） | 「三點進入並存」其中一點係空話 | leaf 自製 token（HMAC leaf 自己 key）+ HttpOnly cookie，或短時票據 | 01 |
| B13 | P2 | 家長帳號單一來源矛盾: 06 話「DISTRICT 存 PARENT」，但家長係「旅層帳號」喺旅登入 — 密碼 hash 邊個庫先係真理？ | 兩邊都有 parent 記錄就會 drift | 講明: TROOP 係 parent 認證真理，DISTRICT 只存 reference/children_ids 映射 | 06 |
| B14 | P2 | normId(null/undefined) 會出 "NULL"/"UNDEFINED" 當合法 ID（03 已見「處理null字串」跡象） | 髒 ID 污染庫 | normId 開頭 guard: 非非空字串即 throw | 02 |
| B15 | P2 | Cookie 只寫 HttpOnly，冇 Secure、SameSite | 中間人/CSRF 面 | `Secure; SameSite=Lax`（Vercel 全 https，冇藉口唔加） | 01 |
| B16 | P2 | sig 用 `JSON.stringify(scope)` 簽: signer/verifier 構建順序唔同就驗簽失敗 | 難排查嘅 403 | 改固定欄位串 `childId\|sub\|role\|children\|target\|exp` | 01 |
| B17 | P2 | registry cache 5 分鐘: 換 apikey/停用下級，最耐 5 分鐘先全面生效 | 應變時要計埋呢 5 分鐘 | 接受+寫明；緊急時 cache invalidation endpoint | 02 |
| B18 | P2 | MailApp 配額: consumer 帳戶約 100 封/日 | reset 連結靜靜地寄唔出 | 寄失敗要喺上級 UI 顯示錯誤+後備（直接畀一次性 token 上級轉交） | 01/07 |
| B19 | P2 | 冇任何觀察性: sync 失敗率、登入失敗、lock timeout 全部無 log | 出事全靠用戶報告 | Apps Script 後加 error-log sheet + Vercel log drain，最低限度失敗計數 | 03/05 |

**做得啱嘅地方**: 全體 requireAuth、原子寫入（tmp+pointer）、chunk 解 50k、apikey 永不回前端、 registry safe 剝 key — 呢啲全部係正確嘅底層決定。

---

## C. 管理角度 (合理性)

| # | 級 | 議題 | 點解要緊 | 建議 |
|---|----|------|----------|------|
| C1 | **P0** | 完全冇 key rotation / 「被吃」應變 runbook。而家模型: 上級食下級 key → registry 失陷=可以冒名任何人（sig 用下級 key 簽，有 key 就有全部權）；01 #15 被吃後仲要「停密碼模式只接受 sig」= 攻擊者有 key 時合法用戶冇任何後路 | 呢個係全系統最大風險，而家連應變步驟都冇寫 | 新增 runbook spec: ① 換 leaf apikey→更新 registry→flush cache ② rotate SESSION_SECRET 全員踢線 ③ leaf 本地重設密碼 ④ 審計匯出。另外 #15 改做「停 sig 只收本地密碼+換key後先恢復」先至合理 | 新 09 |
| C2 | **P0** | 冇備份策略。Sheets 就係 DB，tmp+pointer swap 出 bug 即係冇咗；刪舊 rows 係真刪 | 一個 merge bug 可以永久洗庫 | 每週 trigger 匯出全庫至第二個 Google 帳戶（90日 retention）+ 依賴 Sheets 版本記錄做近線還原；每季演練還原一次 | 新 09 |
| C3 | P1 | Google/Vercel 資產 ownership: 好可能全部掛喺一個領袖私人帳戶名下。離任=數據人質；被 hack=全區失陷 | 組織風險，唔係技術風險 | 機構帳戶（或最少專用 Google 帳戶）+ 最少兩名管理人 + Vercel/Google 開 2FA；交接 SOP 寫入 C/A7 | 新 09 |
| C4 | P1 | 審計不足: 07 有權限變更 updatedBy，但進度改動冇不可篡改審計（updatedAt 會被 sync 覆寫）。護幼場景（爭議邊個改過評核）攞唔出證據 | 青少年機構護幼係底線 | 加 append-only 審計 sheet: 誰/何時/邊條記錄/動作，只准寫不准改 | 新 09 |
| C5 | P1 | 私隱（PDPO）: 兒童個人資料保留幾耐、離隊成員刪除 SOP、家長同意，全部未提 | 法定+機構聲譽風險 | 一頁數據保留政策: 離隊 12 個月後刪/匿名化；開戶時家長同意條款 | 新 09 |
| C6 | P2 | 配額盤點未做: MailApp（consumer ~100/日）、UrlFetch、Apps Script 執行時間 — 全旅發通知/全旅 reset 會爆 | 高峰日集體失敗 | 按旅人數計一次數，超標就升 Workspace 帳戶或分批 | 04 |
| C7 | P2 | 冇測試環境/演練: 所有變更直打生產 Sheets | 改 spec 無處試 | 開 sandbox leaf（假團）+ 假成員，測 merge/被吃/還原 | 新 09 |
| C8 | P2 | 升團/開學季高峰無容量規劃（連住 B7/B8/A2） | 高峰=同步風暴+開戶風暴 | 高峰前演練一次 batch 開戶+sync | 03 |

**合理性總評**: 架構方向（LEAF 做地基、信任鏈用下級 key 簽、原子寫入、offline-first、家長=子女聯集、權限封頂）係合理而且自洽嘅，層級對應童軍架構（區→旅→支部）正確。**弱點唔喺架構，喺維運缺頁**: 應變、備份、ownership、審計、私隱 — 即係「系統建成之後點樣營運佢」成章完全空白。呢個對義務團體尤其致命，因為人手交接最頻密。

---

## D. 行動清單

上線前必須（P0）: B1 時鐘、B2 tombstone、B3 rate limit、B4 密碼雜湊、C1 runbook、C2 備份
第二波（P1）: B5-B13、A1-A2、C3-C5
修好後開 **v4.3.0**（新增 09_OPS_RUNBOOK.md 承接 C 類），07 內「重設即踢線」一句到時要跟 B5 改寫。

---

## E. v4.3.0 跟進狀態 (2026-09-22)

| 項 | 狀態 |
|----|------|
| A1 跨支部領袖 | ✅ 定案 09.2 — 旅層帳號 + branch_access 由旅長開通 |
| A2 升團遷移 | ✅ 定案 09.1 — 歷史不帶走、membership tombstone+新建、children_ids 用全域SCOUT_ID 家長零改動、先修章摘要選用 |
| A5 首次密碼 | ✅ 定案 09.3 — 預設1234+首登強制改4+位、批量CSV；B3/B10 升級做死規矩 |
| B1-B19 | 修法已全部列於本文件；要 pseudo-code 另行出 |
| C1 key rotation | ✅ 詳解+runbook 09.4；01 #15 已反轉 (停SIG收本地密碼) |
| C2 備份 | ✅ 定案 09.5 — 一鍵全庫JSON匯出 + 每週自動Drive備份 + importAll還原，唔使一張張Sheet下載 |
| C3 ownership | ✅ 接受現實，留低一頁交接SOP 09.8 |
| C4 審計 | ✅ 定案 09.6 — 加 ACCESS_LOG + AUDIT_LOG (append-only, prev_hash鏈) |
| C5 PDPO | ✅ 定案 09.7 — App內建家長同意文案模板+數據清單，旅團自決執行 |
| 通告/行事曆/公開資料 | ✅ 新增 10.2 — TROOP_OPS、支部自定義公開類別、領袖訂閱接收、相簿家長同意閘 |
| 密碼統一(雙入口同一組密碼) | ✅ 新增 10.3 — 支部改密碼一次改兩個(setPw同步)、parity偵測提示改齊 |
| 轉旅/調區家長 | ✅ 09.1 修正 — 家長帳號帶唔走，接收旅邀請重開(套裝帶家長email) |
| 相簿私隱把關 | ✅ 修正 10.2 — 相簿多為外連結，改做發佈提示+領袖確認剔(記審計)，唔做硬閘 |
| 全模組開關(旅自主權) | ✅ 新增 10.5 — TROOP_MODULES 所有功能可開關，旅長/管理員設定，server-side執行 |
| 行事曆細化 | ✅ 新增 10.6 — 6日曆6色可SORT、支部自訂標籤FILTER、跨支部分享鏈(分享方揀對象→接收領袖揀成員可見) |
| 財務 | ✅ 新增 10.7 — TROOP_FIN旅層store、支部自己key簽寫、旅長/管理員睇晒各支部+整合現況、成員預設無入口 |
