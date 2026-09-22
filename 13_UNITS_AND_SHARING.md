---
version: v4.7.0
date: 2026-09-22
status: FINAL
---

# 支部內多團 (A/B團·海·空童軍) 與物資共享

## 13.1 三層定位: 旅 → 支部 → 團
- **團 = 操作單位**（聚會、點名、小隊嘅地方）; **支部 = leaf 預設粒度**; 旅 = 容器
- 同一支部多個團（童軍 A團+B團、或者 童軍/海童軍/空童軍 同屬童軍支部）— 兩種模式:
  - **Mode 1 (預設): 1支部 1 leaf，團 = unit tag**
    - members 加 `unit_id` (A/B/SEA/AIR)；進度/通告/行事曆/財務記錄全部帶 unit 維度
    - 優點: 義務團體 ops 最輕 — 一張 Sheet 一個 Script；領袖跨團帶組常見，一個帳號照用 (branch_access 內加 units 清單)
    - 團與團之間分隔靠: 成員列表按 unit 過濾、行事曆逐團一隻色 (10.6 6色模型延伸: 團級日曆)、通告/活動可 scope 到 unit
  - **Mode 2: 團獨立成 leaf**（某團要求完全獨立 — 唔同領袖隊、唔同進度課程、自己帳目）
    - 架構**分形不變**: 個旅 registry 多一行，個團當一個細支部咁用；帳號/密碼/轉移全部照 09 機制
    - 由 Mode 1 升格 = 行 09.1 移交套裝 file-mode（同團內 transfer 一样, SCOUT_ID 不變），家長 children_ids 照舊解析到
- 揀邊個: 共享需求多（領袖共用/物資共用/聯合活動密）→ Mode 1；獨立需求多（訓練課程唔同, 例海童軍獨有水上課章）→ Mode 2。**兩樣都合法，旅長自決（10.5 自主權精神）**
- Mode 1 入 PROG: 進度課程 catalog 可以 per-unit 揀（海/空童軍特有章節），記錄照帶 unit_id — 一個後端餵晒

## 13.2 Mode 1 下嘅規則細節
- **身份**: SCOUT_ID 全域不變，membership 帶 unit_id → 同支部內 A團轉B團 = 改一個欄（唔使 09.1 移交套裝，零成本）；跨支部先至行 09.1
- **權限**: branch_access 延伸 `[{branch:'SCOUT', units:['A','B']}]`；旅長/支部長設定（09.2 同一機制）
- **家長**: 完全唔使改 — children_ids 認 SCOUT_ID，sig 解析到 membership 就知喺邊團；子女喺幾多個團都一個帳號睇晒
- **行事曆/通告**: 每團可以有自己日曆（顏色自訂）；聯合活動開喺支部/旅層日曆；訂閱/分享鏈照 10.6 行，粒度多咗「團」一級
- **財務**: 照 10.7 入 TROOP_FIN，帳目加 unit tag → 旅長整合視圖可以按團過濾（A團收支 vs B團）
- **審批/報名**: 帶 unit 過濾 — B團領袖只批 B團申報（權限封頂照用）

## 13.3 物資共享模型 (10.8 — 照你講: 有旅共享、有旅獨立)
- 物資記錄加: `owner` (unit|branch) + `shareScope: private | section | troop | branches[]`
- **三種玩法，旅長 per-模組自決 (10.5)**:
  1. **各自獨立 (預設)**: 每團/支部自己嘅清單，互不可見
  2. **完全共享**: 成個支部/旅一個池 — 物資開喺共享層 store，全部可見
  3. **混合 (最常見)**: 自己嘅嘢自己管 + 支部領袖揀啲大型器材 publish 去共享池（10.2 「公開係上載」同一哲學 — 共享係主動放出去，唔係人嚟抄）
- **借用路由**: 跨團/跨支部借用 = 借用申請路由去 owner 批核（現有 appendLoan/批核流程照用，加 owner 路由）；借出/歸還記錄雙邊可見
- 公開借用頁 (borrow.html) 照現有 QR 模式（12.6: QR 只帶公開 URL）
- 共享唔共享隨時轉: 開關喺旅長手，數據唔使遷移（shareScope 係記錄級欄位）

## 13.4 對既有條文嘅影響清單
- 01 members schema: 加 `unit_id`（Mode 2 獨立 leaf 免加）
- 09.2 branch_access: 延伸為 branch+units 結構
- 10.6 日曆: 粒度加「團級日曆」（顏色池照舊）
- 10.7 財務: 帳目加 unit tag，consolidate 可按團切
- 07 問4 權限: scope 加 unit 層（patrol → unit → branch）
- 12.7 支部微調清單: 加「Mode 1/Mode 2 揀選、物資 shareScope 政策」
