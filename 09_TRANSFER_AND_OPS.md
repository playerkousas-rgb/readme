---
version: v4.6.0
date: 2026-09-22
status: FINAL
---

# 升團遷移、跨支部領袖、密碼政策與維運定案 (A1/A2/A5 + C1-C5)

## 09.1 升團遷移 CUB→SCOUT (定案 A2)
- 原則: **歷史進度不帶走** (佢已完成該支部)。歷史永久留喺來源支部做唯讀存檔
- 先修章: **唔自動帶**。移出套裝可選附「先修章參考摘要」(唯讀 ticks 清單)，童軍團自己考、自己 tick；用唔用隨團
- 核心動作 = 移動 SCOUT_ID 嘅 membership:
  1. 來源(幼童軍)領袖「升團移出」: 成員記錄 `status=TRANSFERRED_OUT` (tombstone，唔係刪除) + transferTo/transferDate；活動名單消失、存檔可查、來源端登入拒絕
  2. 系統生成移交套裝 JSON: `{transferId:uuid, scout_id, ymis, name, dob, 家長聯絡, patrol史?, 先修章摘要?}` + sha256
  3. 目標(童軍)領袖「升團接收」: 匯入套裝 → 驗 scout_id/ymis 無現役撞號 → 建新 ACTIVE membership (同一 scout_id/ymis)，密碼行 09.3 開戶流程 (領袖畀臨時密碼, mustChangePw)
  4. transferId 冪等: 同一套裝匯兩次第二次拒絕；撞號 → 阻住 + 人手處理
- 進度追蹤同一步: 成員喺 PROG 嘅記錄行同一套 tombstone+新建，舊支部進度留來源存檔 (若 PROG 用單庫+支部 tag，就改歸屬 tag + 舊進度封存唯讀)
- **家長零改動 — 只限同旅升團**: children_ids 一律存「全域 SCOUT_ID」(修正 06 嘅支部前綴示例)。SCOUT_ID 移到邊，家長 sig 就解析到邊 = 「SCOUT ID 能移佢就能移」
  - Mode B 獨立團: 家長喺童軍系統用同一 SCOUT_ID 加返子女 (兩套帳號，06 已知限制)
- **轉旅/調區 — 家長帳號帶唔走 (v4.4.0 修正)**: 家長係旅層帳號、密碼存來源旅自己庫；子女移出來源旅 Sheet 後，來源旅解析唔返呢個 SCOUT_ID，家長聯集斷裂 → 來源家長帳號降級「歷史存檔/停用」。**接收旅按套裝內家長聯絡 email 行 01 邀請連結** → 家長喺新旅開新帳號(新密碼)，children_ids=[同一SCOUT_ID]；跨區=成套重行。通知文案要寫明: 轉旅=家長要喺新旅重新啟動帳號
- 無旅 Mode B: 步驟一樣，套裝用檔案人手交接。**轉旅/調區都係呢套 file-mode**
- 升團季批量: 領袖多選成員 → 一次過生成一個 bundle 檔

## 09.2 領袖跨支部 (定案 A1)
- 有旅: 領袖同家長一樣係「旅層帳號」(單一 email+密碼，存旅自己成員庫 — 旅層人員係旅自己嘅數據，不違「容器不存下級數據」)
- 領袖記錄加 `branch_access:[TROOP_CUB,TROOP_SCOUT,...]`；**只有旅長/旅管理員可以開通/收回**
- 進入支部 = 旅按 branch_access 簽 sig；冇開通 → 唔簽 → 入唔到。07 問4 封頂原則照用
- 旅長帳號由區(DISTRICT)或 SUPER(Vercel) bootstrap
- 無旅 Mode B: 領袖同家長一樣，每個支部系統獨立帳號 (已知限制)

## 09.3 成員首次密碼政策 (定案 A5)
- 成員開戶: 預設密碼 1234 + `mustChangePw=true`；首登強制改 (最少4位)
- mustChangePw 期間鎖死: 只可以行 change-password 一個 API，其餘全部 403 (B10 — 呢個而家係死規矩)
- 開戶兩途: 人手逐個 / 批量 CSV (ymis,scout_id,name,patrol) → 驗唯一 → 批量建號
- 領袖可重設 (07 問5): 重設返 1234+mustChangePw 或隨機臨時碼
- ⚠ **4位PIN+預設1234 ⇒ B3 rate limit 由 P0 建議變「死規矩」**: 每帳號5次失敗鎖15分鐘，解鎖要領袖；冇呢個，4位PIN=幾千次試完即爆
- 領袖/家長帳號不變: 邀請連結，冇預設密碼 (01 非1234)

## 09.4 被吃 Runbook 與 Key Rotation (C1 詳解；修正 01 #15)
**點解係最大風險**: sig = HMAC(下級apikey, 內容)，驗簽只能證明「簽嗰個人有 key」，唔能證明「係邊個人」。所以攞到 registry 某支部嘅 key = 可以冒簽任何 sub (任何領袖 email/任何成員 ymis)、要咩 scope 有咩 scope = 支「萬能簽名筆」。攻擊面: registry Sheet、Vercel env、保管嘅人。

- 平時準備:
  - registry Sheet 權限最少化 + 2FA + Drive 存取記錄
  - key 另存離線 (密碼管理器/封套，最少兩名管理人) — 保證可以 rotate 唔會自己鎖死自己
  - 記低每個 leaf Apps Script 位置/擁有人/部署網址
- 偵測: ACCESS_LOG (09.6) 異常 sig/登入；Vercel/Google 登入警示
- 止血 (分鐘級):
  1. 受影響 leaf 即刻換 apikey (Script Properties) → 舊 key 即死，假 sig 即失效
  2. registry 更新新 key 或 enabled=false；手動 flush registry cache (唔等5分鐘)
  3. 疑 Vercel 層: 換 EC_SUPER_KEY + SESSION_SECRET → redeploy → 全員 session 作廢
  4. 疑 Google 層: 收復帳戶、踢 session、查轉寄規則/過濾器
- **修正 01 #15 (邏輯反轉)**: 懷疑被吃 = **停 SIG、只收本地密碼** (攻擊者有 key 冇密碼)，換 key 完成後先恢復 sig。原本「停密碼只收sig」係倒入股: 攻擊者行緊嗰條路你留畀佢，自己反而冇後路。本地密碼入口 (ScoutBadge 偏離聲明) 就係災難恢復通道
- 清算: 受影響帳號全體重設密碼 (pv+1)；查 AUDIT_LOG 攻擊者做過咩；搵後門 (多出嘅領袖帳號/permissions_override)
- 恢復: 數據壞 → 09.5 還原；確認乾淨 → 重開 sig
- 複盤: 事故報告 + 堵缺口
- 例行: 每季 rotate key 一次 (有 procedure 就平)；有管理權領袖離任即刻 rotate (09.8)

## 09.5 備份 (C2 定案: 唔使一張張 Sheet 下載)
- 每個 leaf 後端加 admin endpoint `exportAll` (requireAuth + canManageMembers):
  - 枚舉全部 db key → readDbChunked → 包成**單一 JSON** `{meta, exportedAt, version, sha256, data}` → 瀏覽器一鍵下載一個檔
  - chunked DB 本身 key 可枚舉，所以技術上一鍵全庫冇難度；百人團數據量級幾百 KB，一個 JSON 完全得
- **自動備份 (推薦)**: Apps Script 每週 time-driven trigger → exportAll → DriveApp 寫入旅自己 Drive「ecportal-backup」資料夾 → 留最近13份，過期自動刪。零人力
- 還原: admin endpoint `importAll` 驗 sha256+version → 行 03 原子寫 (tmp+pointer swap) 成庫替換；或 Sheets 人手匯入
- 免費後備: Sheets 版本記錄 (人手錯誤近線還原) + Google Takeout (成個帳戶)
- 旅團做唔做自決；我哋負責提供工具

## 09.6 審計 (C4 定案: 而家 spec 真係冇，加兩張 append-only 表)
- 現狀澄清: 07 只有「改權限寫 updatedBy」；記錄 updatedAt 會被 sync 覆寫又唔記「邊個」，唔算審計；登入記錄完全冇
- ACCESS_LOG (每 leaf 一張): `{ts, sub, role, via: password|sig|session, event: LOGIN_OK|LOGIN_FAIL|LOCKOUT|RESET}` — 登入與 requireAuth 事件必寫
- AUDIT_LOG: `{ts, actor, targetSub, recordKey, action: CREATE|UPDATE|DELETE|TRANSFER|PERM|PW_RESET, before_hash, after_hash}` — ScriptLock 內 commit 前寫入
- Append-only: 領袖 UI 無入口，只有後端 service append；可加 prev_hash 鏈 (每行含上一行 hash) 做防竄改證據
- 保留: 24個月後 purge (log 都係個人資料，接 09.7)
- 用途: 護幼爭議攞證據 (邊個幾時 tick 過咩)、被吃調查 (09.4)

## 09.7 私隱 (C5 定案: 提供模板，旅團自決執行)
- App 內建: 開戶流程「家長同意」欄位 + 可複製文案:
  「本系統收集: 姓名/SCOUT ID/YMIS/出生日期/家長聯絡/進度評核記錄。用途: 童軍訓練及進度記錄。查閱: 直屬領袖及家長(限自己子女)。保留: 離隊後12個月內刪除或匿名化。查詢/刪除: [旅團聯絡]」
- 數據清單 (旅團自己交 PDPO 功課用): 欄位 × 目的 × 來源 × 保留期 一張表
- 離隊: TRANSFERRED_OUT/LEFT → 12個月 purge job (同 09.1 tombstone purge 共用機制)

## 09.8 交接 SOP (C3: 接受現實，淨係留低一頁)
- 領袖離任清單: 上級重設其密碼 + 撤 branch_access/permissions_override → Google/Vercel ownership 轉名 (最好一開始用機構/專用帳戶+2管理員) → 換受影響 key (09.4)
