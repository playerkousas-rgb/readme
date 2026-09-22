---
version: v4.5.1
date: 2026-09-22
status: FINAL
---

# 通告/行事曆/公開資料 + 密碼統一 (兩條路並行)

## 10.1 用語規範 (取代「吃」)
- 全部文檔統一: registry「吃」→「**共用下級key**」; 「被吃」→「**key外洩**」
- 模型描述改為: 上級與下級後端「**同時使用、兩條路並行**」— sig路(免密碼) + 本地密碼路，**同一組帳戶密碼驗證**，偵測到唔同就提示改齊 (10.3)
- 架構本質不變: 信任鏈、封頂原則、容器不存私有數據照舊

## 10.2 通告/行事曆/相簿 — 公開資料模型
- 兩級可見度: **私有(BRANCH)** / **公開(TROOP)**
- **各支部先定義「公開資料」係咩類別** (通告/行事曆/相簿/社交平台連結...)，逐項發佈時揀 scope
- 數據流向: 私有項目留喺支部自己後端; 公開項目 = 支部**主動寫入旅系統** — 公開係上載，唔係旅去抄，符合「容器不存私有數據」
- TROOP_OPS: 旅層一個 leaf 後端+Sheet。registry 存各支部 key (旅=支部容器，共用下級key 照架構)；支部後端用**自己 key** 簽寫入/讀取 sig，OPS 驗簽確認 ownerBranch → 有來源認證，防支部冒認對方發佈
- schema: `{id, type: notice|event|album|link, ownerBranch, title, body|url, startsAt, endsAt, scope, author, publishedAt, deleted}`
- 發佈權: 支部領袖 `canPublish` (permissions_override 新預設欄位，07 問4 封頂照用)；刪除=tombstone (03)
- **接收(訂閱)**: 每支部喺自己後端存 `subs:[{source: TROOP|支部id, types:[...]}]`，**領袖開關是否接收**邊個來源嘅通告/行事曆；新支部預設只接收旅方，其他支部預設關
- 讀取路徑: 支部成員App照舊只打自己支部後端，支部後端 server-to-server 拉已訂閱來源嘅 scope=TROOP 項目合併 → 成員可見 = 本支部全部 + 已訂閱來源公開項目；**旅內任何登入者(領袖/家長/成員)都睇到公開項目**
- 合併行事曆可輸出 ICS 訂閱連結 (P2)
- PDPO (09.7): **相簿**通常只係一條連結指向旅團自己放相嘅地方 (Google Photos 等)，系統核實唔到連結內容 → **只能提示、唔做硬閘**: scope=TROOP 發佈時彈提示，領袖剔「我確認已取得所需家長同意」先出到(剔咗記 AUDIT_LOG 事後有得查)；預設相簿 scope=BRANCH
- AUDIT_LOG 記 PUBLISH/UNPUBLISH (09.6)

## 10.3 密碼統一 — 兩條路並行、同一組密碼 (定案)
- 理想狀態: 支部系統密碼 = 進度追蹤密碼 = **同一組**
- **預設即一致**: 開戶時支部同 PROG 兩邊都係 1234 + mustChangePw (09.3)
- **問: 喺支部改密碼可唔可以一次改兩個? 答: 可以**
  - 改密碼嗰刻支部後端有新密碼 (HTTPS 內明文)，即刻 server-to-server 帶 sig 呼叫 PROG `setPw(sub, newPw)` → PROG 自己 re-salt 存 hash → 兩邊一致
  - UI 預設勾選「同時更新進度追蹤密碼」；PROG setPw 成功會清埋 PROG 側 mustChangePw (如有)
  - PROG 暫時唔到: 記 `pendingPwSync` 自動重試；長期失敗升級紅色提示「請登入進度追蹤手動改」
- **偵測唔一致 (兩邊密碼唔同，例如支部1234/PROG4321)**:
  - 用戶喺支部密碼登入後，支部後端**背景 async** 帶 sig 呼叫 PROG `verifyPw(sub, 剛輸入嘅密碼)` → PROG 答 yes/no (唔阻登入)
  - 答 no → 常駐提示: 「你的進度追蹤密碼與支部不同，請先登入**進度追蹤**更換密碼，或在支部改密碼時揀『同步兩邊』」— **提示一直出現直到一致** (必須改其中一個)
  - 反向都收斂: 用戶喺 PROG 直接改密碼 → 下次支部登入 parity check 就偵測到
  - sig 路入 PROG (免密碼) 一樣照 parity cache 出提示
- 安全規矩 (死規矩):
  - `verifyPw`/`setPw` **只接受支部後端 sig** (帶 sub)，唔接受瀏覽器直接呼叫
  - `verifyPw` 係密碼 oracle → 嚴格 rate limit: **每 sub 每小時 ≤5 次** + 全域計數 + AUDIT_LOG
  - 明文只在 TLS+sig 內傳一次，兩邊即刻 re-salt、**永不記錄明文**
  - 有支部 key = 可 setPw 任何人，但 09.4 已定義 key外洩=全支部妥協，無新增風險；setPw 寫 AUDIT_LOG (actor=支部後端)
- 範圍: 只有**成員**帳號做 parity (N4/N5: 家長行 sig 唔做；領袖如有 PROG 本地帳號照成員處理)

## 10.4 本輪新發現問題 (答「還有沒有其他問題」)
- N1 verifyPw oracle 濫用 → 已寫死 rate limit (10.3) ✅
- N2 相簿公開 vs 兒童私隱 → 相簿多為外連，改為發佈提示+領袖確認剔(記審計)，唔做硬閘 (10.2) ✅
- N3 pendingPwSync 積壓 (PROG 長期離線) → 紅色提示 + 領袖儀表可見報告
- N4 家長 parity → 唔做 (家長唔直接用 PROG 本地密碼)
- N5 開戶要同時開 PROG 側 1234 → 批量開戶一次過兩邊 (09.3 延伸)
- 仍然開住嘅工程項目 (08 P1，實現期落碼): B5 session踢線 / B6 sig jti / B7 read lock / B12 leaf 自製 session

## 10.5 全模組開關 — 旅有自主權
- **所有支部系統功能都有開關**: notice / calendar / album / finance / progress / 之後任何新功能，全部入 TROOP_MODULES 表
- 表存旅層 (TROOP_OPS config): `{module, enabled, branches?[]}` — 可全旅統一開關，或只開/關指定支部
- 只有**旅長/旅管理員**可以改；我哋平台層預設唔鎖死「邊個功能必有」— 我哋覺得冇用嘅，旅覺得有需要就開得
- 執行 server-side: 模組停用時 OPS/leaf 直接拒絕該模組讀寫 (前端收埋UI只係化妝，07 問4 同一原則)
- 支部後端 cache 5 分鐘 (同 registry cache 02 一致)；改動最耐 5 分鐘全面生效

## 10.6 行事曆細化 — 多日曆/標籤/跨支部分享鏈
- **多日曆模型 (似正常 Google Calendar)**: 每支部一個日曆 + 旅一個 = 6 個日曆，各自配一隻**顏色**；用戶可逐個勾選顯示/隱藏、可按日曆 SORT
- **支部自訂標籤**: 事件可加支部自訂 tags (露營/考章/大活動/會議...)，用嚟 FILTER/SORT；標籤表存支部自己後端，支部自決
- **跨支部分享鏈** (例: 深資常規只睇到深資):
  1. 童軍領袖開放自己日曆畀深資: share `{shareTo:[VENTURE], memberVisible:false}` — 資料照 10.2 寫入 TROOP_OPS，scope=BRANCHES(指定支部)
  2. 深資**領袖**即刻見到兩個日曆 (深資+童軍 兩隻色)
  3. 深資領袖**再決定開唔開放畀自己成員** (訂閱開關由 leader-only 轉做 members 可見)
  - 每個 hop 都有開關: 分享方揀對象，接收方領袖揀成員睇唔睇到
  - 分享方隨時收返 (OPS tombstone)，接收支部成員端即時消失、領袖端見提示
- 公開(TROOP) 同 分享(BRANCHES) 並存: 公開=全旅任何登入者；分享=指定支部、可以有 leader-only 層

## 10.7 財務 — 旅層整合視圖
- 定位: 財務天生係**旅層**功能 (要睇整合現況)，存 TROOP_FIN (旅系統另一個 store，模式同 TROOP_OPS 一樣)
- 寫入: 支部領袖/司庫用**自己支部 key** 簽提交自己帳目: `{id, branch, date, type:income|expense, category, amount, note, receiptUrl?, author, deleted}` → OPS 驗簽確認 ownerBranch (10.2 同一機制，防冒認)
- 權限: 支部領袖=只睇自己支部帳目；**旅長/旅管理員=一次過睇晒各支部財務 + 整合現況** (OPS 服務端計 consolidate: 總收支/按支部/按月/按類別)
- 支部成員預設**冇**財務入口 (旅長開模組時可以特別開放，預設關)
- 模組受 10.5 開關管 (finance 可以成個關掉)
- AUDIT_LOG 全記 (財務係高敏感)；帳目唔記成員個人資料；匯出沿 09.5 exportAll (TROOP_FIN 係其中一個 db key，自動入備份)
