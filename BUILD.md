# ecportal 建構定案 (BUILD) — 2026-09-22

本檔係唯一真理。所有 Agent 以此為準施工。
兩條公理: **一切身份 = SCOUT_ID + 所在 SHEET**；**一切接入 = 交俾邊個 + 登記邊個 registry**。

---

## 1. 單位與接入
- 層級: 平台(ADMIN) → 旅 → 支部/團。**每個支部/團 = 一張 Google Sheet + 一支 Apps Script (/exec) = 一個 leaf 後端**；旅系統 (TROOP_OPS) 自己都係一個 leaf
- 團之間共用定各自一張 SHEET，由旅長安排
- 接入三條路: 獨立前端 → ADMIN 登記入平台；有旅系統 → 旅長登記入旅系統；兩條路並行 → 交兩邊
- 退出 = 刪 registry entry；數據永遠在單位自己 Sheet
- ID 正規化 normId 單一實現 (82/082/0082/00082 = 同一單位): `trim→大寫→數字補零至4位+字母尾`
- registry 兩層:
  - 平台: `units.json` 公開 metadata + Vercel env `TROOP_<id>_BACKEND/_APIKEY`；ADMIN 經收件匣管理 (§7)
  - 旅: TROOP_OPS Sheet 一張表存各支部 key；旅長寫；Vercel server-to-server 讀 + cache 5 分鐘 + 手動 flush endpoint
- apikey 只存 server (env / registry 表)，永不回前端、永不入 URL、永不入 QR

## 2. 帳號與登入
- 三點進入並存:
  1. **上層 sig**: `sig = HMAC(下級apikey, childId|sub|role|children|target|exp)`，sub=EMAIL/YMIS，exp 15-30 分鐘，綁 session jti；下級用自己 key 重算驗證，scope 簽死喺 sig 內
  2. **leaf 本地密碼**: 常開；同時係 key 外洩時嘅災難恢復通道
  3. **SUPER**: sheep + EC_SUPER_KEY (Vercel env, server-only)；SUPER 幫人改密碼一樣只可以觸發重設
- 領袖/家長: EMAIL+PW，開戶用一次性邀請連結 (隨機12字, 24h)；領袖橫跨支部 = 旅層帳號 + `branch_access` 清單，旅長開通
- 成員: SCOUT_ID/YMIS+PW；開戶預設 1234 + mustChangePw，首登強制改 (4 位以上)；開戶兩途: 人手 / 批量 CSV
- 密碼雜湊 server-side (Code.gs 內): PBKDF2-SHA256 ≥100k 迭代 + per-user salt + timing-safe compare；hash 只存 server，隨 DB 同步前剝走
- 登入保護 (server-side): 每帳號 5 次失敗鎖 15 分鐘，解鎖要領袖；mustChangePw 期間只放行改密碼 API
- 改密碼: 自己驗舊改新；上級「重設」= 隨機臨時碼或重設返 1234+mustChangePw (領袖交收)，EMAIL 帳號改行一次性連結；任何重設/改密碼 → pv+1，session 驗 pv 不對即 401
- 忘記密碼: EMAIL 帳號有 (leaf 寄一次性連結，用一次即廢；回應統一防帳號枚舉)；SUPER 靠 Vercel 改 env redeploy
- 權限: `permissions_override` 只有直接上級設定 (領袖→團員、DISTRICT→領袖、SUPER→任何)；下級 override ⊆ 上級自己權限 (封頂，上級失權即失效)；存成員所在 leaf；server-side 按簽名 scope+override 授權；記 updatedBy
- 兩條路同一組密碼: 支部同進度係同一後端 (兩個前端) → 密碼天生一份；真係分開兩個 leaf 嘅單位，支部改密碼時 server-to-server `setPw` 同步另一邊，並用 `verifyPw` 背景核對，唔一致就常駐提示改齊 (verifyPw 每 sub 每小時上限 5 次)
- key 外洩應變: 停 SIG、收本地密碼 → 換 apikey → registry 更新 + flush cache → 換 SESSION_SECRET/EC_SUPER_KEY redeploy → 查審計 → 恢復 SIG；每季例行 rotate；有管理權者離任即刻 rotate
- Session: JWT HttpOnly `Secure; SameSite=Lax`，exp ≤30 分鐘 + silent refresh；Vercel /api/proxy verifySession 之後先至 inject apikey

## 3. 同步與多人寫入
- offline-first: 編輯先入瀏覽器 staging (黃點) → 儲存上後端 (綠點) → 衝突 (紅點)
- 版本 server 派 (ISO+隨機尾數)；寫入帶 baseVersion 樂觀鎖，撞版回 `conflict:true` 等前端拉合併重存
- merge3 欄位級合併: 登入快照做 base；唔同欄各自保留；同格衝突彈出畀用戶逐格確認 (ask)；批量/無人看場行 serverTime 新者勝 + 紅點留底
- 後端: ScriptLock `waitLock(20s)`，攞唔到回 busy 由前端排隊重試；寫入原子 (暫存行 + 一次過 commit/swap，行號計算由底往上刪)；大庫分件儲存 (saveDbPart/Commit) + 分段讀取 (loadDbPart 每段核 version，變咗由頭再讀)；刪除 = tombstone flag，purge 由後端定期
- 匿名可寫面 (每個都係: 白名單 action + 限流 + 寫入待批表): 通告報名 (同通告同名去重) / 物資借用 / 收支申報 / 進度申報 / 開戶申請 / 相片上載 (單檔 ≤5MB、每筆 3 張、每 unit 每日總量上限)
- 診斷: dbInfo 標準回 `{version, bytes, sizes, stagingRows}`；status 回 backendVersion (前端偵測舊後端提示更新)；三色燈 + 診斷報告一鍵複製
- 備份: `exportAll` 一鍵全庫單一 JSON (`{meta:{unit,exportedAt,version,sha256}, data}`，可選剝密碼欄) + 每週自動存 Drive 留 13 份 + `importAll` 驗 hash 行原子寫還原；離線都匯得；三時機提醒 (升級前/批量操作前/7日冇備份)

## 4. 支部功能模組
- **一套 UI 模版行晒支部系統＋旅系統＋公開頁**: 同一個排版骨架 (ecportal 嘅整體感覺: 頂欄+導航+卡片)、同一套元件 (掣/表單/對話框/表格)、同一套導航邏輯 — 用戶由支部去旅**零重新適應**
- **進度追蹤保留自己嗰套 UI**: 要顯示得詳細啲，設計自由度豁免統一；佢只係「另一個獨立前端」，唔影響支部/旅嘅一致性
- 掣位統一規則 (統一範圍內適用): 同類掣永遠同一位置 (儲存/主操作固定嗰角、危險動作固定樣式、設定固定入口)；功能入口由模組註冊表決定 (下一條)，唔散裝
- 模組註冊制: 每個功能 = 模組 (名、入口位置、所需權限、開關、說明頁)；導航由註冊表自動生成，最多兩層
- `TROOP_MODULES` 全模組開關 (notice/calendar/album/finance/progress/新功能)：旅長/管理員設定，可全旅或指定支部；server-side 拒絕停用模組讀寫；cache 5 分鐘
- 進度: **一個後端、兩個前端** (支部系統 + 進度追蹤讀寫同一張 SHEET)；catalog per-支部/團揀選
- 通告/行事曆/相簿:
  - 可見度: **本支部 (預設) / 分享俾指定支部** — 發佈時逐個支部揀 (揀晒全部 = 全旅可見)；深資可以只分享童軍、唔分享幼童；各支部自定「公開資料」類別
  - **分享前設 = 接收方都有該模組**: 分享目標清單由模組註冊表過濾 — 童軍有小隊計分、深資冇呢個模組 → 嗰頁根本唔存在，自然分享唔到入去；通告/物資/行事曆呢啲大家都有嘅先分享得到
  - 外部系統接入 (集會助手/進團指南/AYP/專科徽章/單件工具) → 見 **EXTERNAL.md**
  - 公開項目 = 支部用自己 key 簽**寫入旅系統 TROOP_OPS** (帶 ownerBranch，OPS 驗簽防冒認)
  - 每支部領袖逐來源訂閱接收；成員 App 照舊只打自己支部後端，由支部 server 拉訂閱項合併
  - 行事曆: 每支部一個日曆 + 旅一個，各自一色，用戶可勾選/按日曆 SORT；事件帶支部自訂標籤做 FILTER
  - 跨支部分享: `shareTo:[支部], memberVisible:false` → 對方領袖先見到，對方領袖再開畀成員；分享方隨時收返 (tombstone)
- 物資: 共享 = 顯示所屬 + 申請借用 (路由去 owner 批核，紀錄雙邊可見)；開關清單級: 全收(預設)/全放/分類放；公開借用頁只列已共享範圍
- 財務: TROOP_FIN 旅層 store；支部領袖/司庫用自己 key 簽提交帳目；旅長/管理員睇晒各支部 + 整合現況 (總收支/按支部/按月/按類別)；支部只睇自己；成員預設冇入口；AUDIT_LOG 全記
- 團別: 名冊「團別」欄做顯示/過濾 (行事曆/財務/批核清單)

## 5. 分享、公開頁與 QR
- **三個概念唔同 (死規矩)**:
  1. **內部分享 (支部之間)**: 發佈時揀分享俾邊啲支部 (§4)；冇分享俾嘅支部睇唔到 — 唔會「另一個支部自動睇到」
  2. **分享 (Share) 連結/QR**: 已發佈公開項目有「分享」掣 → WhatsApp/複製連結/QR → 收到嘅人**直接開嗰一頁，唔使任何密碼** — share 就係 share 俾你想俾嘅人；可分享嘅嘢本身唔係重大機密個人資料 (通告/團章/相簿)；QR/連結永不帶 key
  3. **公開頁 (門戶)**: **要登入先入到** (照 ecportal 而家設計): 執委/團員用自己帳戶 (鼓勵，全功能)；家長等由旅長決定開唔開**公開帳** (共享密碼，方便唔想開戶嘅人入去睇)；**冇帳戶嘅外人入唔到** — 81 旅見到 82 想入嚟睇？入唔到
- 匿名可寫頁 (報名/借用/申報): 單位揀「要登入/公開帳先填」定「全開」(都有限流)；印「有效期 + 關閉方法」(領袖要識收線)
- 相簿公開發佈時: 提示 + 領袖確認剔「已取得家長同意」(記審計)；預設相簿只本支部

## 6. 移交與升降團
- 流程 (跨支部/轉旅/調區/海轉空 全部同一套):
  1. 來源領袖「移出」: 記錄 `TRANSFERRED_OUT` (tombstone) + transferTo/transferDate；歷史留來源唯讀
  2. 生成移交套裝 JSON `{transferId:uuid, scout_id, ymis, name, dob, 家長聯絡, 先修章摘要?, ...}` + sha256；檔案面交或私密頻道傳送
  3. 目標領袖「接收」: 驗 scout_id/ymis 無現役撞號 → 新 ACTIVE membership (同一 SCOUT_ID)，密碼行開戶流程 (1234+mustChangePw)
  4. transferId 冪等 (重複匯入拒絕)；撞號阻住人手處理
- 家長: 同旅移動 = 零改動 (children_ids 存全域 SCOUT_ID，移到邊解析到邊)；轉旅/調區 = 來源家長帳號停用 + 接收旅按套裝內 email 行邀請連結重開 (通知文案寫明)
- 升團季批量: 多選成員 → 一個 bundle 檔

## 7. ADMIN APP 與接入申請
- ADMIN 一人；收件匣 (GAS Web App) 代替管理員個人 email 做公開接收入口，目的 = 保護管理員電郵
- 只服務「獨立前端」接入；申請表 `{troopId, troopName, scriptUrl, apiKey, 聯絡, 備註}` → 同源 /api/proxy 白名單 action → 伺服器端常數 SCOUT_ADMIN_API → 收件匣 Sheet (無回執語義: 過得去當送到)
- 管理員流程: 核對 (ping/status) → units.json 加公開 entry + Vercel env → Redeploy → 通知
- 安全: per-IP 限流、收件匣按 unit+聯絡去重、管理員帳戶 2FA、收件匣 Sheet 只有本人、ADMIN APP GAS 專用、登記後可叫對方 rotate key 一次
- unit 內帳號開戶申請: 團員/家長喺成員入口提交 (YMIS+姓名+聯絡) → 該 unit db `accountApps` 待批 → 領袖對名冊核對 → 批 = 開戶或邀請連結，拒 = 記錄原因；同 YMIS 待批唯一；領袖可改純邀請制

## 8. 審計、私隱、交接
- ACCESS_LOG (ts, sub, role, via, event: LOGIN_OK/FAIL/LOCKOUT/RESET) + AUDIT_LOG (ts, actor, targetSub, recordKey, action, before/after_hash, prev_hash 鏈)；append-only、server-side 寫入、ScriptLock 內 commit；24 個月後 purge
- PDPO: 開戶流程帶「家長同意」欄位 + 可複製文案 (收集咩/用途/邊個睇到/離隊12個月刪)；數據清單一張表；離隊 TRANSFERRED_OUT/LEFT 12 個月 purge 或匿名化
- 交接 SOP: 上級重設其密碼 → 撤 branch_access/override → Google/Vercel ownership 轉名 (機構/專用帳戶 + 兩名管理人 + 2FA) → rotate 受影響 key

## 9. MOCK 與教學
- MOCK 示範旅團: 純前端、全功能、假數據；頂欄「示範模式」水印；匯出帶 `_exportedFrom:'mock'` 與真數據分開
- 教材三層: 每角色一頁快速入門 (首次登入必見) / 每模組一頁說明 (跟模組註冊) / MOCK 引導任務；加「開旅 checklist」一頁；教材放 repo docs/ 跟版本走
- 沙盒: MOCK 就是沙盒；進階 = 管理員開示範 Sheet 練習真同步

## 10. 施工次序
1. /api/proxy: session 驗證 → inject apikey；GAS doGet/doPost 首行 requireAuth；key 未設定 = 拒絕敏感 action
2. 密碼雜湊 server 化 (PBKDF2)，舊 hash 登入成功時自動升級
3. ScriptLock waitLock 語義 + 前端排隊重試
4. server-side mustChangePw gate + 登入失敗鎖定
5. 上傳/申請限流 (§3 匿名可寫面清單)
6. server AUDIT_LOG/ACCESS_LOG
7. 其餘工程項目: session 靜默刷新、sig jti、讀取優樂觀化 (pointer 覆查代替全 read lock)、leaf 自製 session token、db shard、同步 backoff+jitter、錯誤碼統一、log 只記 metadata
- 體積治理: api 零依賴原生 fetch+crypto、關 preview deployment、retention 7 天、圖轉 AVIF、dist<5MB、bundle<2MB
