---
version: v4.6.0
date: 2026-09-22
status: REVIEW
---

# ecportal 實際代碼審查 (對照本 spec v4.5.0)

審查對象: github.com/playerkousas-rgb/ecportal @ 6791406 (Code.gs v2.6.3)
方法: 全讀 Code.gs(1772行) / api/*(5個) / auth,gateway,guard,hub-session,merge3,store,remote,onboard,member-me / git 歷史查 key 洩漏
總評: **架構方向同 spec 一致**（offline-first、樂觀鎖、merge3、分段讀寫、registry 乾淨無 key），但**成條 auth 鏈未起**——而家等同「成個後端對公眾開放」。以下按嚴重程度排，每一條都指明 spec 邊條cover、定要開新條目。

---

## P0 — 公開咗喺外面嘅門（上線前必須封）

### X1 Proxy 注入 apikey 前完全冇驗證 = 任何人都可讀寫成個旅團資料庫
- `api/proxy.js`: `payload.apiKey = unit.apiKey` 對**任何來者**注入；ALLOWED_ACTIONS 包 `loadDb`/`saveDb`/`saveDbPart`/`saveDbCommit`
- 攻擊鏈（唔需要任何帳號）: `POST /api/proxy {action:'loadDb', unit:'0082'}` → proxy 代 injection → 回**成個 DB**（團員名單+YMIS+電話電郵、帳目、收支申報+聯絡、進度、審批紀錄）→ 攞到 `version` 後 `{action:'saveDb', db:…, baseVersion:version}` → **匿名完整寫入**
- 即係: 靜態網站嗰句「保護唔到超管身份」唔係最大事；**資料庫本身全裸**
- Spec 對應: 01 #5「/api/proxy 必須帶 session，server 先 verifySession() 先至 inject apikey」— spec 啱，原型未做。**呢個係實現期第一優先**
- 附帶: `sync`（無 db）喺 GAS 端完全唔查 key，`writeTab` 會 `sh.clear()` — 匿名清空晒啲報表分頁

### X2 成員密碼 hash 住喺共享 DB，仲要派到每個客戶端
- `loginMember`/`verifyPassword` 全部**client-side** 對 `db.members[].hubPw` 驗證 → hash 隨住整份 DB 同步去每一部登入機器嘅瀏覽器
- 演算法: **單次 SHA-256 + 6字元 Math.random 鹽**（auth.js makeSalt/hashPassword），非 HTTPS 環境仲有 FNV fallback（可逆）；密碼最短 4 位
- 結合 X1: 攞到 DB → 離線爆破全團 4 位 PIN 係毫秒級
- Spec 對應: 01 有 passwordHash+salt、08 B4 已寫死 PBKDF2；**要加一條新規矩: 驗證同雜湊一律 server-side（Code.gs 內做，PBKDF2-JS 實現），hash 唔好落前端；DB 內只存 server 產生嘅 hash**。否則就算 X1 封咗，任何一個執委部機都有全團 hash

### X3 後端 auth fail-open + 進度資料免 key 公開
- `doGet action=load`: `if (supplied && expected && supplied !== expected)` — **唔帶 key 就放行** → 團員名單、YMIS、全部進度、待批申報（連證據連結，可能係兒童相）任何人都讀到
- `doPost` 多處 `if (expectedKey && …)` — API_KEY property 一旦清空（新部署/出錯），**全部寫入動作門全開**（fail-open）；應該 fail-closed
- Spec 對應: 01 #5「全體 requireAuth，doGet/doPost 首行」— spec 啱；補一條: **key 未設定時敏感 action 必須拒絕，唔可以靜靜放行**

### X4 withLock 攞唔到鎖照做 — 鎖形同虛設
- `withLock()`: `tryLock(20000)` 失敗（got=false）**照樣執行 fn()**，註解明言「等唔到鎖都照做，唔好卡死用戶」
- 後果: 高峰（通告出咗全團報名、升團季批量儲存）並發讀改寫 → `appendIntoDb` 嘅「讀版本→改→存」唔再原子 → 派漏報名/互相蓋; saveDbCommit 行號刪除競態風險重現
- Spec 對應: 03「waitLock(20000); 等唔到→回失敗留黃點重試」— spec 啱，原型反方向。佢想「唔卡死用戶」嘅意願由**前端排隊重試**滿足，唔係後端放棄鎖

---

## P1 — 重大但要規劃

### X5 登入零 rate limit / 零鎖定（client-side 登入形同裝飾）
- YMIS 10位數字 + 預設 1234 自動開戶（auth.js loginMember）— 冇失敗計數、冇延遲、冇鎖定
- 09.3 已寫死「5次鎖15分鐘」— 呢度證實必須做喺 **server-side**（client 端鎖自己冇意思）

### X6 progress.js 預設接受前端傳 backend+apikey
- 「進度→設定」填嘅 /exec+key 存入旅團 db.settings → key 住喺 DB 入面（X1 讀到）+ 喺瀏覽器 localStorage
- Spec 02「apikey 永不回前端」— 正式路線（registry/env）啱；但**自助 Mode B 旅團**（未入 registry）就要明確聲明: 自助旅=key 自己保管、風險自負，UI 要講清楚。呢個係 01 ScoutBadge 偏離聲明嘅延伸，建議寫入 02 做註腳

### X7 mustChangePw 純 UI gate
- 強制改密碼只係前端畫面；直接打 API（有 key/經 X1）完全繞過 → 09.3「mustChangePw 期間鎖死只可以行 change-password」必須 server-side 執行（08 B10 同一條）

### X8 上傳相片免登入無上限
- `uploadPhotos`/`claim`: 任何人可以無限 base64 上載去旅團 Drive，仲自動 set 成「知道連結嘅人都可以睇」→ 灌爆儲存/濫用公共連結
- 建議: 單檔≤5MB、每 claim≤3張、每 unit 每日總量上限、超限拒絕；公開頁加簡單 rate limit（GAS PropertiesService 計數）

### X9 轉介/申請接入冇防spam
- `submitRegistration` 轉發去中央收件匣，無 captcha/無限流 — 收件匣 Sheet 可以被灌爆
- 建議: proxy 層 per-IP 限流 + 收件匣 GAS 自動去重

---

## P2 — 記低，實現期執

| # | 發現 | 建議 |
|---|------|------|
| X10 | auditLog 係客戶端 db 行（store.js audit，cap 400，跟 sync 上）— 任何客戶端可改、唔會有審計效力 | 09.6 server-side AUDIT_LOG 照做；前端嗰個只當「操作歷史」UX |
| X11 | loadDb GET 支援 `?apikey=` — key 落 URL（瀏覽器歷史/伺服器 log） | 只准 POST；GAS 端 doGet 敏感 action 收緊 |
| X12 | 同步紀錄/報名/借用作 appendRow 無限增長 | 定期封存/purge job（09.7 機制共用） |
| X13 | saveProgress 每個 change 5次 setValue+每次重讀全表 | 批量 setValues；大班bulk改先見到 |
| X14 | saveDbCommit 內拼合+刪行+重寫報表分頁×9 單一次執行 — 大 DB 撞 45s proxy timeout/GAS 6min | reports 改 async（另一個 trigger 執行），commit 淨係寫 DB |
| X15 | GAS 錯誤原句回客戶端（String(err)） | 統一錯誤碼+人話，細節入 log |
| X16 | `loginMember` 用 `p === TEMP_PASSWORD` 判定 mustChange — 用戶真係想用1234做新密碼會被卡（好事，但提示要講明） | 提示文案 |
| X17 | hub-session 30日 localStorage + client-side session — 已知原型狀態 | 01 session 模型（JWT+pv）取代 |

---

## 做得啱、spec 可以直接抄嘅嘢 ✅

1. **樂觀鎖 + server 派版本**（ISO+隨機尾數，唔用 client 時鐘）— 08 B1 嘅正確答案已經喺度
2. **merge3 登入快照做 base → 衝突彈畀用戶確認，唔係靜靜 LWW** — 比 07 寫嘅 LWW 更好，**建議 07 改成「衝突預設彈確認（ask），批量先本 win」**，同實際實現一致
3. **分段讀寫帶 version 守尾門**（loadDbPart 每段核 version，變咗由頭再讀）— 防半新半舊
4. **saveDbPart/saveDbCommit 暫存+原子拼合**，v2.6.2 嘅行號走位修正好扎實
5. **api/auth.js 係教科書級**: fail-closed、timingSafeEqual、帳密錯誤同一句、rate limit、log 無秘密
6. **registry 乾淨**: units.json 無 key 無後端網址，git 歷史都查過無洩漏
7. **scripts/lint.mjs 自動比對 SUPPORTED_ACTIONS/ALLOWED_ACTIONS** — 防白名單漂移（uploadPhotos 事故嘅根治）
8. **guard.js 草稿暫存+危險動作打字確認+可還原** — 05 offline-first 嘅好示範

---

## 行動次序建議（對照 08 行動清單）

| 次 | 做咩 | 對應 |
|----|------|------|
| 1 | proxy 加 session 驗證先至 inject key；GAS doGet/doPost 首行 requireAuth；fail-closed | X1 X3 / spec 01 #5 |
| 2 | 密碼驗證+雜湊搬入 Code.gs（PBKDF2-JS），hash 唔落前端；hash 遷移要相容舊 hubPw | X2 X5 / B4 |
| 3 | withLock 改 waitLock 語義（等唔到→回 busy，前端重試） | X4 / spec 03 |
| 4 | server-side mustChangePw gate + 登入失敗鎖定 | X5 X7 / 09.3 |
| 5 | uploadPhotos 限流限額；submitRegistration 限流 | X8 X9 |
| 6 | server-side AUDIT_LOG/ACCESS_LOG | X10 / 09.6 |

結論: **spec v4.5.0 嘅 01-10 經已 cover 咗 X1-X7 嘅解法**，今次審查嘅價值係證實咗邊啲係真彈藥，同埋加咗三條 spec 要補: ①hash 唔落前端（X2）②fail-open 禁令（X3）③07 衝突處理跟 merge3 嘅 ask 模式。
