# ecportal 建構定案 (BUILD) — 2026-09-22

本檔係唯一真理。所有 Agent 以此為準施工。
兩條公理: **一切身份 = SCOUT_ID + 所在 SHEET**；**一切接入 = 交俾邊個 + 登記邊個 registry**。

**兩層定位（2026-09-23 加註，施工前先分清）**

| | **管理層** = 團／旅系統（含平台 ADMIN、公開頁） | **記錄冊** = 進度追蹤（各支部 leaf） |
|---|---|---|
| 做乜 | 開戶、模組註冊、通告／訂閱、行事曆、物資、財務、移交、權限、ADMIN APP | 記進度、記履歷、記獎章（每項要顯示得詳細） |
| 位階 | 上游 | **最下游 leaf**（1團1張 SHEET + 一支 /exec） |
| 狀態 | 以 **ecportal** 作基礎參考，**未完成**（本檔大部分章節講呢邊） | **已完成嘅系統，本輪只升級「接駁」** |
| 規格 | 本檔 §1–§10 | `進度追蹤旅系統升級版.md`（＋本檔 §1 registry、§2 帳號/開戶錨點、§5 分享） |

→ **進度追蹤冇管理層功能係正常，唔係缺失**；同樣，管理層唔會幫進度做進度 UI。

---

## 1. 單位與接入
- 層級: 平台(ADMIN) → 旅 → 支部/團 → **1團1張 支部 SHEET** (同一支部有5團 = 5張支部 SHEET)。**每張 SHEET + 一支 Apps Script (/exec) = 一個 leaf 後端**；旅系統 (TROOP_OPS) 自己都係一個 leaf
- 進度追蹤: **1團1張 進度 SHEET**；支部系統前端有「進度」一頁，背後打嗰團進度 SHEET 嘅 /exec (B模式)，支部 SHEET 本身唔存進度數據；舊 ecportal「兩前端共用一張 SHEET」只作兼容保留。**定位：進度追蹤 = 記錄冊 leaf（最下游、已完成系統，本輪只升級接駁）；管理層功能（模組註冊、通告、財務、權限、ADMIN APP…）一律屬團／旅系統，進度 leaf 冇呢啲功能係正常，唔係缺失**（見 `進度追蹤旅系統升級版.md` §0.1）
- 接入三條路: 獨立前端 → ADMIN 登記入平台；有旅系統 → 旅長登記入旅系統；兩條路並行 → 交兩邊
- 退出 = 刪 registry entry；數據永遠在單位自己 Sheet
- ID 正規化 normId 單一實現 (82/082/0082/00082 = 同一單位): `trim→大寫→數字補零至4位+字母尾`
- registry 兩層:
  - 平台: `units.json` 公開 metadata + Vercel env `TROOP_<id>_BACKEND/_APIKEY`；ADMIN 經收件匣管理 (§7)
  - 旅（**GAS 接駁，2026-09-23 實作定案**）: 上游 GAS `ScriptProperties` 每條下游一組 `DOWNSTREAM_<id>_URL/_KEY/_NAME/_AT`（`<id>` 英數/底線/連字號、最長 32），上游憑此經 `sig` 讀寫下游（旅→團→進度；`sig` 係 GAS→GAS，唔經 Vercel proxy）。換 D = 三處同步: 下游重生 → 上游重新登記 → ADMIN 改 Vercel env + Redeploy
  - 旅（**屬旅系統（管理層）範圍，進度 leaf 唔涉及**）: `TROOP_OPS` Sheet 每團一行存該團兩把 key（支部 + 進度）、Vercel server-to-server 讀 + cache 5 分鐘 + flush endpoint —— 只喺「Vercel 側真係要讀旅層」先建；未建之前**以 Script Properties 為唯一真理**，唔好兩份並存
  - 進度 SHEET = 該團支部 SHEET 嘅**子 leaf**: key 登記喺上游 Script Properties（旅模式同團一行、獨立模式入 Vercel env）；開戶/身份行 §2 開戶錨點
  - **屬團／旅系統（支部前端）範圍**: 支部前端「進度」頁經 `PROGRESS_BACKEND/APIKEY` 打進度 /exec（原設計）——進度 leaf 唔做管理層 UI，所以呢一頁屬支部系統嗰邊；而且**閂下游直接入口後 apikey 路徑一齊失效**，前端唯一出路係支部經自己上游 GAS 用 `sig` 轉發。**未起好呢條路之前唔好閂口**（見 `進度追蹤旅系統升級版.md` §12 ④）
- 入口開關（**上游控、下游寫**）: 下游是否接受本地登入/開戶由旗 `ALLOW_LOCAL_LOGIN`（寫喺**下游 GS ScriptProperties**）決定；開關掣**只喺上游前端**（旅控團、團控進度），經 `sig` 調下游 `setDownstreamAccess`／`setLocalLogin` 寫旗，下游前端無此掣故單用下游時唔會誤觸；未掛接前旗=開；旅掛團/團掛進度後，上游可一鍵閂，下游即只接受 `sig`/server-to-server（本地入口回 403，災難恢復走 SUPER/本地留一戶機制）。掣值 **fail closed**：只有 `1/true/yes/on/open` 算開啟，其他值（含串錯字）＝閂口
- **回傳／回調三條（2026-09-23 定案，見 `進度追蹤旅系統升級版.md` §4）**: ① **中央登入回傳**：GAS 回打固定受信端點 `/api/super` 驗票（60 秒票據、一次性防重放）——vsbadge/roverbadge 實測成功，其他系統照抄 ② 旅系統 sig 鏈單向（上游 → 下游），下游**同步回一個結果**（唔算回調）③ **旅系統冇 callback endpoint**：下游永不主動回打上游。cubsbadge/scoutbadge 現時行**零回打**版（Vercel 驗 `SUPER_KEY` → `action=superLogin`），係現況差異，日後對齊時改跟 ①
- 接入 registry 追加唔搬：旅掛團時只喺上游 ScriptProperties 追加 `DOWNSTREAM_<id>_*`，不改/不刪 `units.json/Vercel env`（免 ADMIN 動 ENV），掛接前後 ENV 唔郁
- apikey 只存 server (env / registry 表)，永不回前端、永不入 URL、永不入 QR
- 新團開通次序（每團一對 SHEET）: ① 該團兩張 SHEET（支部 + 進度）各部署 /exec、各自一條 apikey → ② 旅長喺**上游 GAS ScriptProperties** 登記該團下游 (`DOWNSTREAM_<id>_URL/_KEY`；`TROOP_OPS` 表未實作，見 registry)；首團連同生 GS 時種入首個旅長帳號（見 §2）→ ③ 旅層帳號: 旅長 + 跨團領袖 (+家長) 邀請連結 + `branch_access` → ④ 該團領袖邀請連結（旅長可經 sig 入該團支部代發）→ ⑤ 成員喺該團支部開（人手/CSV），進度自動同步（§2）；此時下游旗仍開，上游可按需一鍵閂下游本地入口（見入口開關）。新旅 = 1張旅 SHEET + N團×2張；後加支部/進度只係加登記行，已用緊進度後加支部 = 補支部 SHEET 並登記（「支部『進度』頁即時指向現有進度 SHEET」**未有實作**，見 registry 未實作項）

## 2. 帳號與登入
- 三點進入並存:
  1. **上層 sig**: `sig = HMAC(下級apikey, childId|sub|role|children|target|exp)`，sub=EMAIL/YMIS，exp 15-30 分鐘，綁 session jti；下級用自己 key 重算驗證，scope 簽死喺 sig 內
  2. **leaf 本地密碼**: 預設開，受下游 `ALLOW_LOCAL_LOGIN` 旗控；旗閂後本地入口回 403（但每 leaf 至少留一本地領袖戶 + SUPER 作災難恢復，見入口開關）
  3. **SUPER**: sheep + EC_SUPER_KEY (Vercel env, server-only)；SUPER 幫人改密碼一樣只可以觸發重設
- 領袖/家長: EMAIL+PW，開戶用一次性邀請連結 (隨機12字, 24h)；領袖橫跨支部 = 旅層帳號 + `branch_access` 清單，旅長開通；**首個旅長帳號由生 GS 時種入**（TROOP_OPS Sheet 擁有人 setup 頁寫入首個 EMAIL + 臨時碼，不經邀請連結；之後由旅長發邀請連結開其他人；SUPER 只觸發重設，不直接開旅長戶）；**下游閂口後新戶點開**：團/進度本地入口 403 時，一律由**上游前端揀團開戶**（旅揀團→經 `sig` 落該團支部寫、團揀進度→經 `sig` 落進度寫），寫入仍在下游 sheet（AUDIT `via=sig`），前端只作選單
- 成員: SCOUT_ID/YMIS+PW；開戶預設 1234 + mustChangePw，首登強制改 (4 位以上)；開戶兩途: 人手 / 批量 CSV
- 密碼雜湊 server-side (Code.gs 內): PBKDF2-SHA256 ≥100k 迭代 + per-user salt + timing-safe compare；hash 只存 server，隨 DB 同步前剝走
- 登入保護 (server-side): 每帳號 5 次失敗鎖 15 分鐘，解鎖要領袖；mustChangePw 期間只放行改密碼 API
- 改密碼: 自己驗舊改新；上級「重設」= 隨機臨時碼或重設返 1234+mustChangePw (領袖交收)，EMAIL 帳號改行一次性連結；任何重設/改密碼 → pv+1，session 驗 pv 不對即 401
- 忘記密碼: EMAIL 帳號有 (leaf 寄一次性連結，用一次即廢；回應統一防帳號枚舉)；SUPER 靠 Vercel 改 env redeploy
- 權限: `permissions_override` 只有直接上級設定 (領袖→團員、DISTRICT→領袖、SUPER→任何)；下級 override ⊆ 上級自己權限 (封頂，上級失權即失效)；存成員所在 leaf；server-side 按簽名 scope+override 授權；記 updatedBy
- 跨團幫手：教練員 = 旅層 `branch_access`（旅長一鍵開多團）；本職領袖（例 XX支部領袖）想兼幫他團 → 上游發「幫手申請」→ **目標團領袖批** → TROOP_OPS 追加該領袖 `branch_access` 含目標團（AUDIT 記 `grantedBy=目標團領袖`），失效由目標團撤
- 兩條路同一組密碼: 支部同進度係同一後端 (兩個前端) → 密碼天生一份；真係分開兩個 leaf 嘅單位，支部改密碼時 server-to-server `setPw` 同步另一邊，並用 `verifyPw` 背景核對，唔一致就常駐提示改齊 (verifyPw 每 sub 每小時上限 5 次)
- **開戶錨點（每團一對 SHEET 都適用）**: 身份只喺一個 SHEET 誕生，其餘靠 sig 或同步落去 — 永不三邊各開一次、永不由下游反寫上游:
  - 成員 (SCOUT_ID/YMIS) 錨點 = **該團支部 SHEET（名冊所在）**: 人手/CSV/批開戶申請 (§7)/接收移交 (§6) 全部係該團支部動作；旅長想喺旅系統開 = 經 sig 入該團支部落筆（AUDIT 記 actor=旅長 via=sig），成員 row 永不入旅 SHEET（成員 App 只打所屬團支部後端，旅唔需要識佢）
  - 領袖 (EMAIL) 錨點 = 所屬層: 只帶一團 → 該團支部 SHEET（邀請連結，旅長可經 sig 代發）；旅長/跨團 → 旅 SHEET + `branch_access`；每個 leaf 至少留一個本地領袖帳號（災難恢復通道先有人用得到）
  - 家長 (EMAIL): 有旅系統 → 旅 SHEET（§6「同旅移動零改動」先做得到）；冇旅系統 → 該團支部 SHEET
  - 進度 SHEET（1團1張，子 leaf）= **純下游 + 前端 B模式指向**: 支部前端「進度」頁經上游登記嘅 `PROGRESS_*` key 打進度 /exec（**未實作**，見 §1 registry 未實作項），支部 SHEET 本身唔存進度數據；開戶/改密碼/停用/移出同上一條 server-to-server 鏈（`upsertUser`／`resetPassword`／`setUserStatus`；roverbadge 對應 `deactivateUser`／`reactivateUser`，各 repo 自己白名單、各自實測）；`verifyPw` 背景核對照舊（**vsbadge／roverbadge 本輪未實作，屬本輪範圍外**）；領袖/旅長經 sig 入，下游唔使有 row；子 leaf **拒絕本地開成員戶口**，搵唔到 sub = 該團支部未開，唔會自己補；本地入口受 `ALLOW_LOCAL_LOGIN` 旗控（上游控、下游寫）
  - **JSON 吐出批量開戶（保留密碼）**: 下游已存舊資料、後掛上游時無資料 → 上游雖然可經 `sig` **讀**下游（讀 action 白名單，回應永不含 hash），但**密碼 hash 讀唔到**，故仍由**下游 `exportAll`／`exportUsersJson` 吐 JSON（含 `hash+salt+迭代數`，見 §3）** → 上游/領袖在下游新 sheet 按「匯入」逐個 `upsertUser` 直插 hash（不經 `1234+mustChangePw`），`transferId` 冪等 + 撞號阻擋 + `sha256` 驗；匯完下游即轉純下游並可閂口（見 5情景）
  - **掉轉禁止**（進度開戶再寫上游）: 佢係身份消費者、可選部件、仲有匿名進度申報面（§3）— 做身份源頭 = 安全倒轉 + 支部依賴可選件
- key 外洩應變: 停 SIG、收本地密碼 → 換 apikey → registry 更新 + flush cache → 換 SESSION_SECRET/EC_SUPER_KEY redeploy → 查審計 → 恢復 SIG；每季例行 rotate；有管理權者離任即刻 rotate
- Session: JWT HttpOnly `Secure; SameSite=Lax`，exp ≤30 分鐘 + silent refresh；Vercel /api/proxy verifySession 之後先至 inject apikey

## 3. 同步與多人寫入
- offline-first: 編輯先入瀏覽器 staging (黃點) → 儲存上後端 (綠點) → 衝突 (紅點)
- 版本 server 派 (ISO+隨機尾數)；寫入帶 baseVersion 樂觀鎖，撞版回 `conflict:true` 等前端拉合併重存
- merge3 欄位級合併: 登入快照做 base；唔同欄各自保留；同格衝突彈出畀用戶逐格確認 (ask)；批量/無人看場行 serverTime 新者勝 + 紅點留底
- 後端: ScriptLock `waitLock(20s)`，攞唔到回 busy 由前端排隊重試；寫入原子 (暫存行 + 一次過 commit/swap，行號計算由底往上刪)；大庫分件儲存 (saveDbPart/Commit) + 分段讀取 (loadDbPart 每段核 version，變咗由頭再讀)；刪除 = tombstone flag，purge 由後端定期
- 匿名可寫面 (每個都係: 白名單 action + 限流 + 寫入待批表): 通告報名 (同通告同名去重) / 物資借用 / 收支申報 / 進度申報 / 開戶申請 / 相片上載 (單檔 ≤5MB、每筆 3 張、每 unit 每日總量上限)
- 診斷: dbInfo 標準回 `{version, bytes, sizes, stagingRows}`；status 回 backendVersion (前端偵測舊後端提示更新)；三色燈 + 診斷報告一鍵複製
- 備份: `exportAll` 一鍵全庫單一 JSON (`{meta:{unit,exportedAt,version,sha256}, data}`，**預設剝密碼欄；後掛上游批量開戶時可選「含 hash」吐出**，見 §2 JSON 吐出） + 每週自動存 Drive 留 13 份 + `importAll` 驗 hash 行原子寫還原（保留 hash 直插，`transferId` 冪等）；離線都匯得；三時機提醒 (升級前/批量操作前/7日冇備份)

## 4. 支部功能模組（**管理層**：團／旅系統；以 ecportal 為基礎作參考，未完成）

> **本章唔適用於進度追蹤**：進度追蹤係**已完成嘅記錄冊 leaf**（最下游），只記進度／履歷／獎章，冇模組、冇通告、冇財務、冇權限樹 — 呢啲「冇」係正常設計，唔係缺失。本輪進度追蹤只做**接駁升級**（見 `進度追蹤旅系統升級版.md`）。

- **一套 UI 模版行晒支部系統＋旅系統＋公開頁**: 同一個排版骨架 (ecportal 嘅整體感覺: 頂欄+導航+卡片)、同一套元件 (掣/表單/對話框/表格)、同一套導航邏輯 — 用戶由支部去旅**零重新適應**
- **進度追蹤保留自己嗰套 UI**: 要顯示得詳細啲，設計自由度豁免統一；佢只係「另一個獨立前端」，唔影響支部/旅嘅一致性
- 掣位統一規則 (統一範圍內適用): 同類掣永遠同一位置 (儲存/主操作固定嗰角、危險動作固定樣式、設定固定入口)；功能入口由模組註冊表決定 (下一條)，唔散裝
- 模組註冊制: 每個功能 = 模組 (名、入口位置、所需權限、開關、說明頁)；導航由註冊表自動生成，最多兩層
- `TROOP_MODULES` 全模組開關 (notice/calendar/album/finance/progress/新功能)：旅長/管理員設定，可全旅或指定支部；server-side 拒絕停用模組讀寫；cache 5 分鐘
- 進度: 1團1張 進度 SHEET（子 leaf）；支部系統前端「進度」頁經上游登記嘅 key 打進度 /exec（B模式，支部 SHEET 唔存進度數據；**此頁未有實作**，見 §1 registry 未實作項）；舊 ecportal「兩前端共用一張 SHEET」只作兼容；分開時行 §2 開戶/密碼同步條款；catalog per-團揀選
- 通告/行事曆/相簿:
  - 可見度: **本支部 (預設) / 分享俾指定支部** — 發佈時逐個支部揀 (揀晒全部 = 全旅可見)；深資可以只分享童軍、唔分享幼童；各支部自定「公開資料」類別
  - **分享前設 = 接收方都有該模組**: 分享目標清單由模組註冊表過濾 — 童軍有小隊計分、深資冇呢個模組 → 嗰頁根本唔存在，自然分享唔到入去；通告/物資/行事曆呢啲大家都有嘅先分享得到
  - 外部系統接入 (集會助手/進團指南/AYP/專科徽章/單件工具) → 見 **EXTERNAL.md**
  - 公開項目 = 支部用自己 key 簽**寫入旅系統 TROOP_OPS** (帶 ownerBranch，OPS 驗簽防冒認)
  - 支部間接收: 每支部領袖逐來源 (旅/其他支部) 訂閱；成員 App 照舊只打自己支部後端，由支部 server 拉已訂閱項合併 (呢個係支部對支部，同下面個人化訂閱唔同)
  - **個人化訂閱 ★ 重中之重** (通告圖書館 scout-circulars ↔ 系統，同一套機制內建):
    - 定位: 未來構想嘅重中之重 — push 內建咗就唔使「拉落嚟」、領袖唔使多理一樣嘢，通告自動去到啱嘅人手上
    - 每個用戶 (領袖/成員/家長) 喺自己系統管理自己訂閱: 揀支部 (小童軍/幼童軍/童軍/深資/樂行/領袖/家長/會務委員) × 分類 (訓練/服務/活動/比賽/未分類)；設定存本機 LocalStorage，命中即推，同一通告只推一次
    - **推送基建 = 圖書館現有嗰條鏈，系統零另起爐灶**: 圖書館每日 scrape → Supabase (`push_subscriptions` 表: endpoint_hash/client_token_hash/branch_ids/topic_ids) → GitHub Actions 每日 06:00 `notify.py` 命中「支部 AND 項目」→ pywebpush (VAPID) 推送，7 日 rolling 補漏
    - **系統做嘅嘢 = 訂閱設定前端**: 用戶喺系統內揀支部×項目 → 旅系統 service worker (用圖書館 VAPID public key 訂閱) → 寫入同一張 Supabase 表。實現時圖書館要改: `require_same_origin` 加 origin allowlist (認住各單位系統網址)；建議 `push_subscriptions` 加 `source` 欄 (library/system) 統計分開
    - **館方數據完整保留**: 全部訂閱入同一張表 → `subscription_stats.py` 照出: 訂閱數增長、每支部/每項目分佈、30日活躍 — 知**幾多人訂、訂咩**，一樣**唔知邊個** (冇 YMIS/email/身份)
    - 通告頁 = 本單位通告 + 用戶已訂閱嘅圖書館通告，同頁同列表 (來源標示)，附件指返圖書館
    - 領袖見到啱成員嘅活動/訓練班 → 推薦俾成員，成員自己個人報名 (報名喺外部主辦方，唔係團活動)
    - 圖書館 ScoutSystem 網址 = 單位自己系統網址；deep link「加入 ScoutSystem」直接開用戶訂閱設定
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
- 功能施工次序: UI 模版骨架 → 帳號/登入 (§2) → 通告+個人化訂閱 (★重中之重) → 行事曆 → 物資 → 財務 → 移交 → MOCK/教學
- 體積治理 (Vercel 防爆 — 真正 ecportal 代碼倉必守，唔係呢個 MD 真理倉):
  - `api` 零依賴: 只用原生 `fetch`+`crypto`，唔裝 `axios`/`lodash`/`moment` 等重型庫；真要裝只可入 `devDependencies`
  - `.vercelignore` (最重要): 必須擋 `node_modules` / `.git` / `.vercel` / `.cache` / `*.bak` `*.tmp` `*.old` `*.log` / `uploads/` / `__tests__/` / `coverage/`，只上傳最終 `dist`；否則 Vercel 儲存配額即爆
  - `package.json` 極簡: `dependencies` 保持空或白名單，建置工具 (`vite`/`tailwind` 等) 一律 `devDependencies` + `vercel.json` 設 `installCommand: "npm install --omit=dev"`
  - `vercel.json`: `framework: null` + `outputDirectory: dist` (或 `out`) + `cleanUrls: true` + `regions: ["hkg1"]`，只部署最終靜態產物，唔上傳成個開發環境
  - 死重檔案: 全文 grep `public/images/assets`，未被 `HTML/CSS/JS` 引用嘅高清原圖/孤立測試檔直接刪；`*.bak`/`*.tmp` 零容忍
  - 圖轉 AVIF: 所有相片轉 `AVIF`/`WebP`，單檔 `<500KB`，`dist<5MB`、`bundle<2MB`，CI 硬攔 (`du -sb dist` >5MB 即 fail)
  - 部署衛生: Vercel Dashboard 關非 `main` 分支嘅 Preview Deployment，Retention 設 `7` 天；上載面單檔 ≤5MB、每筆 3 張、每 unit 每日總量上限 (§3)
