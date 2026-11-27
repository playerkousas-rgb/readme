# 61 — 後台開戶（用戶名＋密碼）＋ 一票通行所有 App ＋ 同一帳戶只 1 個活躍 session ＋ 你隨時刪得走

> **2026-11-26 用戶定案（第二次，以此為準）**：「我唔想用呢種方式，我想直接用一個後台登記用戶帳戶密碼，唔洗每次派 OTP，但每次只能 1 個帳戶登入 1。」
> → **採用：你在後台開戶（你設用戶名＋密碼，交俾對方）＋ 用戶打用戶名密碼登入 ＋ 同一帳戶任何時候只有 1 個活躍 session。**
> → **否決：Email OTP／Magic Link／Google 登入／邀請碼自助註冊。** 原因同「否決紀錄」寫在 §4.3，**未來 Agent 唔准再建議 OTP**（除非用戶重新提出）。
> **呢份係設計圖，唔係已實作**：SQL 骨架見 [`templates/supabase/member_gate_v1.1.sql`](../templates/supabase/member_gate_v1.1.sql)，**未在任何 Supabase 專案跑過、未喺真機驗收**。
> **同 SG 系列嘅關係（重要）**：[docs/50](50-app-store-whitelist-and-shutdown.md) 嘅 `store_gate`（SG1–SG19）管「**你由邊度嚟**（APP STORE／圖書館／成員系統…）」；本文嘅登記閘管「**你有冇戶口**」。兩層唔可以互相取代：白名單放行 ≠ 已登入，登入咗亦唔代表可以直打網址。
> **本文只新增局部編號 MG1–MG9，唔入 PLAYBOOK**（唔係新通用鐵律），所以 `docs/10` checklist 唔會多一項。控制面（一次統管 68 個 App）見 [docs/62](62-one-control-plane-for-all-apps.md)。

---

## 0. 一頁答案

| # | 你嘅要求 | 機制 | 邊層負責 | 一句驗收 |
|:--:|---|---|---|---|
| 1 | **唔再完全公開**；帳戶由你開，唔派 OTP | **後台開戶**（`members` 表，你設用戶名＋密碼）＋ 登入頁只有「登入」冇「註冊」 | 登記中心（建議 `member-portal`）＋ Supabase | 未有帳戶嘅人開任何 App → 只見到登入頁，**冇註冊入口** |
| 2 | **一個戶口可以用晒所有 APP** | 中心一次登入 → 每個 App 用「**60 秒一次性票**」換自己嘅 cookie（唔係共用 cookie） | 中心簽票 ＋ 每個 App 驗票 | 喺 A App 登入完，開 B App 唔使再打密碼 |
| 3 | **每次只能 1 個帳戶登入 1 部** | `sessions` 表 ＋ partial unique index（DB 硬保證）＋ 心跳 | 資料庫（硬）＋ 每個 App 驗票 | 第二部機登入 → 第一部 ≤60 秒被踢，畫面講明原因 |
| 4 | **你隨時刪走** | 後台：踢下線／停用／重設密碼／**真刪**（`members` 一行，cascade 清 session） | 中心 ＋ 資料庫 | 你刪完 → 佢下一個請求即 401，DB 冇殘留 |

**核心決定**：**唔好**逐個 App 做帳號系統；做**一個**後台 ＋ **一個**登入中心（建議直接用 `member-portal`，Next.js 16 + React 19，有 middleware／API route），其餘 68 個 App 只加「驗票」幾行。

---

## 1. 路線選擇（同 2026-11-26 上午版本比較）

| 路線 | 做法 | 滿足 1／2／3／4？ | 工作量 | 主要限制 |
|---|---|:--:|:--:|---|
| A. Vercel Deployment Protection | Dashboard 開 Password | 1 ⚠️／2 ❌／3 ❌／4 ⚠️ | 5 分鐘／專案 | 一個共用密碼，冇「誰在用」；刪人＝換密碼。**只做臨時罩** |
| **B. 後台開戶 ＋ 登記中心（採用）** | `members`（用戶名＋bcrypt 密碼）＋ session ＋ 簽票 | ✅✅✅✅ | MVP 1–2 日 | 純靜態 App 只做得到軟閘；忘記密碼要你重設（冇自助） |
| C. 全部流量經中心反代 | rewrite `/a/<app>/*` | ✅✅✅✅ | 每個 App 改網址 | 全部 App 變同一 origin → `localStorage` 撞 key、PWA／Push 要重做。**唔建議** |

> **行 B。** 同上一版唯一分別：把 `auth.users`／Email 換成**自建 `members` 表**。好處係**完全冇 email 概念**——唔會「收唔到信」、唔會「兩兄弟姊妹共用一個 email 只開到一個戶口」、亦唔使畀 Supabase Auth 嘅 MAU 費用。

---

## 2. 先拆一個誤解：「一個 cookie 通行所有 App」

`*.vercel.app` 喺 **Public Suffix List**，所以 `a.vercel.app` 同 `b.vercel.app` 喺瀏覽器眼中係**兩個唔同網站**：

- ❌ 唔可以在 `a` 設一個 cookie 畀 `b` 讀；
- ❌ 唔可以共用 `localStorage`（4 本 BOOK 嘅資料唔會互通，亦唔會互踩）；
- ✅ 但可以「**中心簽一張短命票 → 帶去 App → App 自己種自己嘅 cookie**」（同 [docs/50](50-app-store-whitelist-and-shutdown.md) §4.3 同一招）。

好處：每個 App 嘅儲存照舊留喺自己 origin，PWA／`localStorage`／Web Push／`SameSite=Lax` 全部唔受影響（同 SG2 五類禁區一致）。

```
（未登入）
 用戶 ──開任何 App──▶ App 驗票失敗 ──302──▶ 中心 /login?next=<App 原路徑>
                                              │
                                     打 用戶名 ＋ 密碼
                                              │
                                 撤銷舊 session → 開新 session
                                              │
 用戶 ◀──302 回 App?t=<票，60 秒>──────────────┘
   │
   └─▶ App 驗票（簽名＋未過期＋session 仍活躍）→ 種自己 cookie → 見內容
```

---

## 3. 資料模型（四張表，全部唔開放畀瀏覽器）

完整可貼 SQL：[`templates/supabase/member_gate_v1.1.sql`](../templates/supabase/member_gate_v1.1.sql)。

| 表 | 一行代表 | 關鍵欄 |
|---|---|---|
| `members` | 一個帳戶（你開） | `username`（細楷 3–20）、`display_name`、`unit_name`、`role`（`member`/`owner`）、`status`、**`password_hash`（bcrypt cost 12）**、`must_change_pw`、`failed_count`、`locked_until` |
| `sessions` | 一部裝置嘅一次登入 | `member_id`、`device`、`persistent`、`last_seen_at`、`revoked_at`、`revoked_reason` |
| `gate_settings` | 全站開關 | `access_mode`（`open`/`registered`/`closed`）、`max_active_sessions`、密碼長度、鎖定門檻 |
| `gate_audit` | 你每次開戶／踢／刪 | `actor`、`action`、`target_username`、`at` |

**「只 1 人同時用」嘅硬保證**唔靠前端，靠資料庫：

```sql
create unique index sessions_one_active_per_member
  on public.sessions (member_id) where revoked_at is null;
```

配 `login_member()`：**先撤銷該帳戶所有未撤銷 session，再插入新嘅**。所以舊機唔會靜靜雞繼續用得——佢下次驗票就發現自己個 `sid` 已 `revoked`。

> **權限鎖死**：四張表 `enable row level security` 但**一條 policy 都唔開**＝默認拒絕；所有函數 `revoke all from anon, authenticated` ＋ `grant execute to service_role`。即係**只有你嘅中心伺服器（持 service key）叫得，瀏覽器叫唔到**，連暴力試密碼都打唔到 DB 出面。

---

## 4. 開戶同登入（你嘅工作 ＝ 開戶；用戶嘅工作 ＝ 打兩格）

### 4.1 你開戶（後台，一次一個人或一次一個旅）

| 步 | 你做 | 系統做 |
|:--:|---|---|
| 1 | 後台撳「新增帳戶」：**用戶名**（建議 `chan-tai-man` 呢類，唔好用學號）＋顯示名＋旅團＋你設嘅密碼 | `owner_create_member()`：bcrypt 雜湊、`must_change_pw = true`、寫 `gate_audit` |
| 2 | 把「用戶名＋密碼」交俾對方（WhatsApp／紙仔／當面） | 系統**唔會**任何情況下自動發出去（冇 email） |
| 3 | （可選）批量：貼 CSV（`username,display_name,unit_name`）一次開一個旅 | `owner_bulk_create()`：自動生成 10 位臨時密碼，**只回傳一次**，你即刻抄落紙／表格 |

**MG1：只准後台開戶，冇自助註冊。** 登入頁唔可以出現「註冊／免費加入」；`gate_settings` 冇「開放註冊」開關（避免日後有人手多多開返）。
**MG2：密碼政策**——最少 8 字（可調）、唔准等於用戶名、唔准常見弱密碼；由 DB `assert_password_ok()` 守，前端只做提示。
**MG3：首次登入必須改密碼**（`must_change_pw = true`）；改完先可以入 App。
**MG9：臨時密碼只顯示一次**，唔准寫入 log、唔准放 URL query、唔准存喺前端 `localStorage`。

### 4.2 用戶登入（三個場景）

| 場景 | 用戶做乜 | 次數 |
|---|---|:--:|
| **第一次**（你已交帳號） | 撳 App／QR → 登入頁 → 打**用戶名＋密碼** → 改密碼 → 自動返原本嗰頁 | 約 4 步、30–60 秒 |
| **第二次**（同一部機） | 唔使做任何嘢（中心 session 仍有效） | 0 步 |
| **開其他 App** | 唔使再登入（中心簽票自動入場） | 0 步 |
| **換電話／清瀏覽器** | 再打一次用戶名＋密碼 | 1 次 |

**兩個要寫落 UI 嘅細節**：
1. **「記住我」**（`persistent`）：預設開（cookie 30 日）。**共用平板／旅團電腦就要關**——關咗＝閂瀏覽器即登出，第二個人坐低就要自己登入。
2. **忘記密碼**：冇 email，所以**一定**係「請聯絡管理員」。登入頁要明寫，唔好整個假嘅「重設連結」出嚟。你重設之後，佢下次登入要再改（同 MG3）。

### 4.3 已否決嘅方式（記錄原因，唔准重提）

| 方式 | 為何否決（2026-11-26 用戶定案） |
|---|---|
| Email OTP（6 位碼） | 用戶明講「唔想每次派 OTP」；而且學校／公司信箱收唔到外部信、OTP 落 spam |
| Magic Link | 同上；另外 WhatsApp／IG WebView 開 link 常失效，安全掃描器會「先用掉」一次性 link |
| Google 登入 | 幼童軍多數冇 Google 帳戶；共用裝置易揀錯人 |
| 邀請碼自助註冊 | 仍然要你自己派碼／換碼；既然你已經要開戶，直接開戶更直接 |

> 記錄原因係為咗**唔好有下一個 Agent 又嚟建議 OTP**。要用返，必須用戶重新明確定案。

---

## 5. 「同一帳戶只 1 部機」有幾硬？三個嚴格度

| 級 | 做法 | 舊裝置幾時死 | 成本 | 幾時用 |
|:--:|---|---|---|---|
| **L1 登入時踢** | 登入撤銷舊 session；App 開頁驗一次票 | 舊機下次**開頁／刷新**先死（一直唔關頁就唔會死） | 最低 | 最低要求，已擋到大部分共用帳戶 |
| **L2 心跳（建議）** | L1 ＋ App 每 **60 秒**打 `/api/heartbeat` | ≤60 秒，畫面即彈「此帳戶已在另一部裝置登入」 | 每人每分鐘 1 請求 | **默認揀呢級** |
| **L3 每請求驗** | 每個 `/api/*` 都驗 `sid`（30–60 秒快取） | 即時 | 高（要改每個 App 後端） | 有收費／敏感資料嘅 App |

**MG5：預設 1 部**；你自己（`role='owner'`）可以 2 部（`max_active_sessions` 按角色畀）。
**MG6：改密碼 ＝ 踢走所有其他 session**（防「舊密碼仲通」）。

**誠實限制**：
- 同一人手機＋平板會互踢，用戶會以為「壞咗」→ 被踢畫面一定要寫清楚「你喺另一部裝置登入；如非本人請即刻改密碼」。
- 背景分頁／飛航模式會延遲被踢；返嚟嗰下先知。
- 同一個瀏覽器 profile **分唔到兩個人**——共用機要教「用完登出」或用共用模式（§4.2「記住我」關）。
- **頻繁被踢係有用訊號**：同一個帳戶一日被踢幾次 ＝ 可能幾個人共用一個戶口；後台可以列出嚟（SQL 喺範本尾）。

---

## 6. 驗票（App 側）三種做法

| App 類型 | 例子 | 做法 | 硬度 |
|---|---|---|:--:|
| **Next.js／有 API route** | `member-portal`、`scout-district-portal`、`scoutapp`(Flask)、4 本 BOOK、`AvianDex` | middleware 見 `?t=` → `POST /api/enter` 驗 HMAC 簽名 ＋ `session_is_active(sid)` → `Set-Cookie: gate=<JWT>; HttpOnly; Secure; SameSite=Lax; Max-Age=…` | **硬**（`curl` 都擋） |
| **Vite／React 有 build** | `scoutdesign`、`photo-edit`、`CERT` | 同上；平台唔支援 middleware 就當下一行 | 中→硬 |
| **純靜態單檔（無 build、無 API）** | A 組大部分：`router`、`Icon-Maker`、`course` | `<head>` 掛登記閘小腳本：冇 `sessionStorage.mg` 或 `?t=` → `location.replace(中心 + '/login?next=…')` | **軟**（擋普通人／舊書籤／搜尋引擎） |

票據（兩邊共享 `GATE_SECRET`，只放 Vercel env，**唔准入前端**）：

```
票 = base64url(header).base64url(payload).HMAC-SHA256(header.payload, GATE_SECRET)
payload = { sub: <member id>, sid: <session id>, aud: <app slug>, iat, exp: iat + 60 }
```

驗票三步（次序唔可以調）：① 簽名對（`timingSafeEqual`）→ ② `exp` 未過（≤60 秒，容許 ±5 秒時差）→ ③ `session_is_active(sid)` 仍 true。任何一步 fail ＝ 唔放行。

> 純靜態 App **驗唔到簽名**（secret 唔可以落前端），所以軟閘只「認有冇票」，唔「認票真假」。**唔好用「以為簽咗名就安全」嚟說服自己。**

> **MG7（重要）：登記模式下 `allowStandalone: true` 係後門，唔准用。**
> [docs/50](50-app-store-whitelist-and-shutdown.md) 嗰個 `allowStandalone` 係為**白名單**（「邊度嚟」）而設——已裝主畫面就當係自己人，合理。但**登記模式**唔同：任何人只要喺你開閘**之前**撳過「加入主畫面」，之後開 icon 就會被放行，**永遠唔使登入**。
> 所以 `require_registration` 嘅 App 一律 `allowStandalone: false`，並要用「先裝 PWA、後開閘」次序真機實測。**呢個係 docs/50 舊行為同 docs/61 新要求嘅唯一直接衝突，以本文為準。**

---

## 7. 你（Owner）嘅操作面

中心一條 `/admin`（只 `role='owner'`，而且要**再打一次自己密碼**，防有人借你開住嘅瀏覽器）：

| 功能 | 做乜 | 即時性 |
|---|---|---|
| **開戶（單個）** | 你設用戶名／顯示名／旅團／密碼；可勾「首次登入要改密碼」 | 即時 |
| **批量開戶（CSV）** | 一次開一個旅；生成臨時密碼，**只顯示一次**（可複製／列印） | 即時 |
| **重設密碼** | 生成 10 位臨時密碼給你轉交；同時踢走舊 session | 即時 |
| **解鎖** | 失敗 5 次鎖 15 分鐘，你可以即刻解 | 即時 |
| **踢下線** | 撤銷當前 session，唔停用 | ≤60 秒 |
| **停用／恢復** | `status='blocked'` ＋ 撤銷 session，資料保留 | 即時擋新登入 |
| **刪除** | 真刪 `members` 一行，`sessions` cascade 消失 | 即時 |
| **匯出** | CSV（用戶名／顯示名／旅團／最後上線）——**唔會**導出密碼（只有雜湊，導出無意義） | — |
| **全站急停** | `gate_settings.access_mode='closed'`（配 docs/50 軟關站卡） | 下個請求 |
| **審計** | 邊時、邊個被開／踢／刪（`gate_audit`） | — |

**你實際會花嘅時間（估算，未實測）**：開一個旅 30 人 ≈ 貼 CSV 一次（1–2 分鐘）；日常 ≈ 每週幾單「忘記密碼」＋「換電話」。**同 App 數量無關，同人數成正比。**

---

## 8. 落地次序（每階段有驗收）

| 階段 | 做乜 | 大約 | 驗收（真機） |
|:--:|---|---|---|
| **P0** | `member-portal` 加：`/login`（淨登入）、`/admin`（開戶／踢／刪／重設）、`/api/ticket`、`/api/enter`；Supabase 貼 SQL；建你自己 owner；設 `GATE_SECRET` | 1 日 | 你開一個測試帳戶 → 登入 → 被要求改密碼 → 踢自己 → 60 秒內被登出 |
| **P1** | **3 個示範**：1 個 Next.js（`member-portal` 自己）、1 個 Vite（`scoutdesign`）、1 個單檔（`router`） | 半日 | 未登入直打 → 去登入頁（**冇註冊掣**）；登入後 3 個都開得；第二部機 → 第一部被踢 |
| **P2** | A 組 35 個加軟閘（同 [docs/62](62-one-control-plane-for-all-apps.md) 嘅中央政策一齊做，一次過改 `<head>`） | 每個 15 分鐘 | 抽 5 個真機驗；舊書籤落到登入頁 |
| **P3** | 有後端嘅 App 加 L3 硬驗票；最後考慮全部唔再 `mode:'open'` | 逐個 | `curl` 直打 API → 401 |

> **次序陷阱**：P0 未企穩唔好做 P2（一開閘全站入唔到）。另外**分享連結仍然要指 APP STORE 深層連結**（SG9），唔好直接分享子站網址。

---

## 9. 私隱（PDPO）——呢個方案反而更好

- **唔收 email／電話**：只收「用戶名、顯示名、旅團」＋ 使用紀錄。比 OTP 方案少一項個人資料，PDPO 負擔更細。
- **密碼**：只存 bcrypt 雜湊（cost 12），**任何人（包括你）都睇唔到原密碼**；你只能「重設」，唔可以「查看」。呢點要寫清楚，免得你以為自己可以幫人查密碼。
- **保留期**：離團／畢業 90 日內刪（`owner_delete`，真刪）。`sessions` 每月 `purge_sessions(90)`。
- **未成年人**：帳戶由你（或旅團領袖）開，等於已有成人把關；仍然建議一頁私隱聲明（誰是控制人、用途、刪除方法）。
- **搜尋引擎**：所有 App 加 `X-Robots-Tag: noindex`，否則「已登入先睇到」嘅內容有機會被爬。

---

## 10. 成本（比 OTP 方案少一項）

| 項 | 情況 |
|---|---|
| Supabase Auth | **唔用** → 冇 MAU 費用、冇 email 發送費用 |
| Supabase DB | 免費額度足夠（`members` 幾百行、`sessions` 每月清理） |
| Vercel | 中心嘅 API／middleware 呼叫；Hobby 有上限，**上線前喺定價頁睇當日數字** |
| 慳法 | 驗票後種 8 小時 cookie，只每 60 秒心跳；`session_is_active` 喺 App 側快取 30–60 秒 |

---

## 11. 唔做／已知限制（交付前照抄，唔准美化）

- ❌ **未實作**：本文只係設計；SQL 未跑過、票據／middleware 未寫、未真機驗收。
- ❌ **冇自助重設密碼**：一定要你（或授權嘅領袖）動手。人多就一定變成你嘅日常工作。
- ❌ **密碼係唯一因素**：冇第二因素。防線只有「長度＋鎖定＋限流」。所以 **MG4 一定要做**（失敗 5 次鎖 15 分鐘，鎖喺 DB）。
- ❌ **純靜態 App 只係軟閘**：識開 DevTools 就繞得過；要硬擋必須有後端（L3）。
- ⚠️ **你唔可以查看密碼**：只能重設。要同用戶講清楚，否則會有人以為你「幫佢睇返」。
- ⚠️ **共用帳戶仍然存在**：同一組用戶名密碼可以傳幾個人（但會互踢）。要靠審計（頻繁 `replaced`／`kick`）＋ 你嘅觀察去收窄。
- ⚠️ **中心係單點**：政策可以 fail-soft，但**登入唔得**——中心死＝全部人入唔到。要有「Pause 個別 App」同「中心 rollback」嘅預案。
- ⚠️ **批量開戶嘅臨時密碼只顯示一次**：你要即刻抄／印；頁面一關就冇（DB 只得雜湊）。

---

## 12. 驗收清單（P1 完咗逐條剔）

- [ ] 未登入直打示範 App → 見到登入頁，**冇「註冊／加入」掣**，亦見唔到底層內容（DOM 真係冇）
- [ ] 你開嘅帳戶登入得；打錯密碼 5 次 → 鎖 15 分鐘；你喺後台解鎖 → 即刻可以再試
- [ ] 首次登入強制改密碼（MG3）；改完自動返原本 App 嗰頁（`?next=` 帶埋 path＋query）
- [ ] 同一帳戶第二部機登入 → 第一部 ≤60 秒彈「已在另一裝置登入」並登出
- [ ] 改密碼後，其他裝置即刻失效（MG6）
- [ ] 你喺 `/admin` 撳「刪除」→ 即刻登入唔返；SQL 查 `members`／`sessions` 冇殘留
- [ ] `curl` 用 anon key 直接打 `members`／`sessions` → **冇資料**（RLS 冇 policy ＋ revoke）
- [ ] 臨時密碼冇出現喺 URL、log、前端儲存（MG9）
- [ ] 已加主畫面 PWA → **仍然要登入**；`allowStandalone: false`（MG7），並試過「先裝 PWA、後開閘」
- [ ] 共用平板：閂咗「記住我」→ 關瀏覽器即要再登入
- [ ] 全站急停（`access_mode='closed'`）→ 出中文告示卡，唔係白屏或英文 500

---

## 13. 同其他文件嘅分工

| 你想 | 去 |
|---|---|
| **整個系統嘅六個部分（APP STORE／ADMIN／圖書館／成員／區／身份）** | [docs/63](63-system-blueprint-six-parts.md) — 藍圖＋「PORTAL 帳戶可否用 APP STORE」＋「單體 vs 分散」 |
| **一次統管 68 個 App（一個掣改政策／開關）** | [docs/62](62-one-control-plane-for-all-apps.md) — 政策搬去 APP STORE 一份設定，App 只掛兩行 |
| 白名單入口（邊度嚟）／關站模式／`store_gate` | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| 邊個 App 而家有閘（實查清單） | [docs/51](51-whitelist-rollout-list.md) §0.1 |
| 後端簽票／`/api/enter` 詳細原理 | [docs/50](50-app-store-whitelist-and-shutdown.md) §4.3 |
| Supabase RLS／RPC 寫法 | [docs/08](08-supabase.md) |
| Vercel 設定／`/api/proxy` | [docs/06](06-vercel.md) |
| 可以照抄嘅 SQL | [`templates/supabase/member_gate_v1.1.sql`](../templates/supabase/member_gate_v1.1.sql) |
