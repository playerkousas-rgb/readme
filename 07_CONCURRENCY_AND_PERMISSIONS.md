---
version: v4.4.0
date: 2026-09-22
status: FINAL
---

# 多人協作、雙入口、權限與密碼 - 定案 (問2-問7)

## 問2 多人同時「填」進度, 唔係只讀
- 可以。多人同時寫入係正常用法；但係 offline-first 異步合併，唔係 Google Docs 式即時 co-edit（無 websocket/OT/CRDT，防 bloat 見 04）
- 流程: 每人瀏覽器自己 staging -> save 先落本地(黃點) -> sync 上後端(綠點)
- 後端 ScriptLock 內 merge3(base, local, remote) 做欄位級合併:
  - 唔同成員 / 唔同欄位: 兩邊修改都保留，完全唔衝突
  - 同一成員同一欄位兩邊都改: 真衝突 -> 以後端 serverTime 較新者勝(last-write-wins)，輸嗰邊 staging 標紅留底，可再改再覆蓋
- 同步撞 ScriptLock 等 20s 都輪唔到: 該次 sync 失敗留黃點自動重試，數據唔會壞（讀寫都在 Lock 內 + 寫入原子 tmp+pointer swap，見 03）
- 預設可寫矩陣: 領袖可改自己團成員進度；成員可改自己進度；家長唯讀(子女聯集, 06)，最多加「家長確認」欄位
- 實務分工(唔同領袖跟唔同成員)衝突率極低；寧可紅點事後覆蓋，唔做格鎖

## 問3 A經支部入進度追蹤, B直接用進度追蹤 - 同時得
- 可以，呢個正正係「LEAF做地基 + 信任鏈」嘅設計
- A路線: 支部 TROOP 用 registry 入面 PROG 嘅 apikey 簽 sig -> PROG 驗簽免密碼認人 (01)
- B路線: PROG 本地密碼直接登入 (01 ScoutBadge 偏離聲明: 本地入口常開，唔會被上層鎖走)
- 兩條路打同一個 PROG 後端、同一個 DB，冇第二份數據，唔會分叉
- 身份同一把 key: sig sub(YMIS/EMAIL) 經 normId 對上同一成員記錄；A 改完，B 下次 sync 就見到
- Session 互相獨立，唔會互踢；兩邊同時寫照 問2 merge3 規則合併
- 同一人雙開都得: staging 按瀏覽器/userSub 分 key，後端照 merge
- 家長仲可以同時行 CUB+SCOUT 兩個支部 (06，有旅先有超然)

## 問4 上級設下級權限
- 有，落 members.permissions_override (01 schema 已預留)
- 誰可設: 只有直接上級 - TROOP領袖設自己團成員；DISTRICT設TROOP領袖；SUPER經Vercel設任何；家長唔可以設權限（家長權限固定=子女聯集）
- 存邊: override 存喺該成員所在 leaf 後端嘅成員記錄（容器不存下級數據）；上級改權限 = 對 leaf 做一次帶 sig 嘅寫操作，上層唔另開一份表
- 建議欄位: `{canEditProgress, canManageMembers, canResetPw, canViewContact, scope: patrol|troop}`；未設用 role 預設
- 封頂原則: 下級 override 永遠 ⊆ 上級自己嘅權限；上級失權，下級 override 即時封頂失效
- 服務端執行: doGet/doPost requireAuth 之後按 sig scope + permissions_override 授權；前端收埋UI只係化妝，唔算數
- 審計: 改權限必寫 updatedBy/updatedAt

## 問5 上級幫下級改密碼
- 有，但只可以「重設」，唔可以代設並知道對方永久密碼:
- 成員(YMIS/SCOUT_ID): 上級觸發重設 -> 後端生成隨機12字臨時密碼(明示一次，領袖交畀成員)或一次性連結 -> 存 passwordHash+salt + mustChangePw=true -> 成員下次登入強制改
- 領袖/家長(EMAIL): 上級觸發 -> leaf 後端 MailApp 寄一次性 reset 連結(隨機12字, 24h, inviteToken/inviteExp 同一套機制)；上級永遠見唔到對方密碼
- 範圍: 只有直接上級 + SUPER；sig scope 鎖死 targetYmis/children_ids，唔可以隔團 reset
- 重設即踢線: session JWT 加 pv(passwordVersion)，重設時 pv+1，verifySession 驗 pv 唔對即 401

## 問6 各登入自己改密碼; 超管靠 Vercel
- 領袖/家長/成員登入後都有「更改密碼」: 驗舊密碼 -> 新 passwordHash+salt 寫返自己 leaf 後端 -> pv+1 踢走其他 session
- SUPER 唔係普通帳號: SUPER = sheep + EC_SUPER_KEY (Vercel env, HttpOnly server-only)，後端根本唔存 SUPER 嘅 hash
- 改超管密碼 = 去 Vercel 改 EC_SUPER_KEY -> redeploy；冇UI改、冇忘記密碼、冇reset
- SUPER 幫人改密碼一樣只可以觸發 問5 嘅 reset，見唔到明文

## 問7 領袖 Email 登入 -> 有忘記密碼
- 係。EMAIL+PW 帳號(領袖/家長)登入頁有「忘記密碼」:
- 流程: 輸email -> leaf 後端寄一次性連結(隨機12字, 24h, 用一次即廢) -> 開連結設新密碼 -> pv+1 踢舊session
- token 只存該領袖所在 leaf 後端 (inviteToken/inviteExp 同一套)，Vercel proxy 唔經手、唔存
- 防帳號枚舉: 無論 email 存唔存在，回應一律「如果存在就寄咗」
- 成員(YMIS)冇 email 登入 -> 冇自助忘記密碼，行 問5 上級重設
- SUPER 冇忘記密碼，行 問6 Vercel env
