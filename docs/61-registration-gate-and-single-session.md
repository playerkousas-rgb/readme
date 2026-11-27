# 61 — 登記閘（會員制）＋ 登記完通行所有 App ＋ 同一帳號只 1 個活躍 session ＋ 你隨時刪得走

> **2026-11-26 用戶定案原文**：「未來我不想再完全公開給所有人用了，如果想要所有人都作簡單登記才能使用要如何做，但我想登記完可以使用我所有 APP，以及同一帳號只能同時 1 人使用，及我隨時可以刪走。」
> **呢份係設計圖，唔係已實作**：本文寫清楚「點做、要改幾多、邊種 App 做得到硬擋、邊種只做得到軟閘」，同埋你日後嘅操作面。**未在任何 repo 實作、未喺 Supabase 跑過 SQL、未喺真機驗收**。SQL 骨架見 [`templates/supabase/member_gate_v1.0.sql`](../templates/supabase/member_gate_v1.0.sql)。
> **同 SG 系列嘅關係（重要）**：[docs/50](50-app-store-whitelist-and-shutdown.md) 嘅 `store_gate`（SG1–SG19）管「**你由邊度嚟**（APP STORE／圖書館／成員系統…）」；本文嘅登記閘管「**你有冇戶口**」。兩層唔可以互相取代：白名單放行 ≠ 已登記，登記咗亦唔代表可以直打網址。**本文只新增局部編號 MG1–MG10，唔入 PLAYBOOK**（唔係新通用鐵律），所以 `docs/10` checklist 唔會多一項。

---

## 0. 一頁答案（你想嘅四件事，各由邊一層做）

| # | 你嘅要求 | 機制 | 邊層負責 | 一句驗收 |
|:--:|---|---|---|---|
| 1 | **唔再完全公開**：所有人都要簡單登記先用得 | Supabase Auth（**Email OTP／Magic Link，免密碼**）＋ `profiles.status` | **登記中心**（建議直接用 `member-portal`，佢已經係 portal #3） | 未登入直打任何 app → 彈登記／登入頁，唔會見到內容 |
| 2 | **登記完可以用我所有 APP** | 中心一次登入 → 每個 app 用「**60 秒一次性票**」換自己嘅 session（唔係共用 cookie） | 中心簽票 ＋ 每個 app 驗票 | 喺 A app 登記完，開 B app 唔使再登記（最多閃一次「正在登入」） |
| 3 | **同一帳號只可以同時 1 人用** | `sessions` 表 ＋ `sessions_one_active_per_user` 唯一索引 ＋ 心跳 | 資料庫（硬）＋ 每個 app 嘅驗票（軟到硬） | 第二部機登入 → 第一部機下次心跳（≤60 秒）即彈「此帳號已在另一裝置登入」 |
| 4 | **你隨時可以刪走** | Owner 頁／RPC：踢下線、停用、**真刪**（`auth.users` 一行，cascade 清 profile／session） | 中心 ＋ 資料庫 | 你刪完 → 該帳號下一次驗票即 401，資料庫冇殘留 |

**核心決定（慳你 68 次工程）**：**唔好**逐個 app 做帳號系統。做**一個**登記中心，其餘 app 只加「驗票」幾行。

---

## 1. 三條路線，先揀方向（誠實比較）

| 路線 | 做法 | 滿足 1／2／3／4？ | 工作量 | 主要限制（唔好睇漏） |
|---|---|:--:|:--:|---|
| **A. Vercel Deployment Protection** | Dashboard → 專案 → Settings → Deployment Protection，開 Password 或 Vercel Authentication | 1 ⚠️ ／2 ❌／3 ❌／4 ⚠️ | 每個專案 5 分鐘 | **一個共用密碼**，冇「邊個用緊」；刪人 = 換全站密碼 = 所有人一齊要再入；做到「唔對外」但做唔到「登記制」。免費方案限制要喺 Vercel 定價頁即時核實。**只可以做臨時罩，唔可以當最終方案** |
| **B. 自建登記中心（建議）** | Supabase Auth ＋ 一個中心 app（`member-portal`）＋ 每 app 驗票 | ✅✅✅✅ | MVP 約 1–2 日；示範 3 個 app 半日 | 純靜態單檔 app **只做得到軟閘**（識開 DevTools 嘅人繞得過）；要硬擋必須有後端／middleware（見 §7） |
| **C. 全部流量經中心反代** | 中心用 rewrite／proxy 將 `/a/<app>/*` 轉去各 app | ✅✅✅✅（最硬） | 每個 app 改網址＋長遠效能／成本／除錯都變重 | 所有 app 變成**同一個 origin** → `localStorage`／IndexedDB **撞 key**（4 本 BOOK 同小遊戲會互踩）、PWA 主畫面變成一個、Push 訂閱全部要重做。**唔建議**，除非日後有收費／敏感資料 |

> **結論：行 B。** 中心用你已經有嘅 `member-portal`（Next.js 16 ＋ React 19，即係有 middleware、有 API route、有 PWA），唔使開新 repo、唔使新網域。

---

## 2. 先拆一個最常見嘅誤解：「一個 cookie 通行所有 App」

`*.vercel.app` 喺 **Public Suffix List**，所以 `a.vercel.app` 同 `b.vercel.app` 喺瀏覽器眼中係**兩個完全唔同嘅網站**：

- ❌ 唔可以在 `a` 設一個 cookie 畀 `b` 讀；
- ❌ 唔可以共用 `localStorage`（4 本 BOOK 嘅資料唔會互通，亦唔會互相踩）；
- ✅ 但可以用「**中心簽一張短命票 → 帶去 app → app 自己種自己嘅 cookie**」（同 [docs/50](50-app-store-whitelist-and-shutdown.md) §4.3 已寫嘅「60 秒 HMAC 通行票」係同一招）。

好處係：**每個 app 嘅儲存照舊留喺自己 origin**，所以 PWA 主畫面、`localStorage`、Web Push、`SameSite=Lax` 全部唔受影響（呢點同 SG2 五類禁區一致）。

```
（未登入）
 用戶 ──開任何 app──▶ app 見到冇票 ──302──▶ 中心 /?next=<app>&slug=<slug>
                                              │
                                    填 名稱＋Email → OTP／Magic Link
                                              │
                                    開 session（踢走舊裝置）
                                              │
 用戶 ◀──302 回 app?t=<票，60 秒>─────────────┘
   │
   └─▶ app 驗票（簽名＋未過期＋session 仍活躍）→ 種自己嘅 HttpOnly cookie → 見內容
```

---

## 3. 資料模型（三張表 ＋ 一張審計）

完整可貼 SQL：[`templates/supabase/member_gate_v1.0.sql`](../templates/supabase/member_gate_v1.0.sql)。骨架：

| 表 | 一行代表 | 關鍵欄 |
|---|---|---|
| `profiles` | 一個登記用戶（跟 `auth.users` 一對一，`on delete cascade`） | `email`、`display_name`、`status`（`pending`/`active`/`blocked`）、`role`（`member`/`owner`） |
| `sessions` | 一部裝置嘅一次登入 | `user_id`、`device`、`last_seen_at`、`revoked_at`、`revoked_reason` |
| `gate_settings` | 全站一個開關 | `access_mode`（`open`/`registered`/`closed`）、`auto_approve`、`max_active_sessions` |
| `gate_audit` | 你每次踢／刪嘅紀錄 | `actor`、`action`、`target_email`、`at`（PDPO 問起有交代） |

**「只 1 人同時用」嘅硬保證**唔係靠前端，係靠資料庫：

```sql
create unique index sessions_one_active_per_user
  on public.sessions (user_id) where revoked_at is null;
```

配一條 `open_session()`（`security definer`）：**先將該用戶所有未撤銷 session 標 `revoked`，再插入新嘅**。咁樣任何時候最多 1 行「活躍」，而且**舊機唔會靜靜雞繼續用得**——佢下一次驗票就會發現自己嗰個 `sid` 已經 `revoked`。

> 想你自己（owner）可以手機＋電腦同時開：`drop index sessions_one_active_per_user;` 再將 `max_active_sessions` 設 2，並喺 `open_session()` 只撤銷「最舊」。**但 `max_active_sessions` 唔係裝飾**：超過上限就一定要撤銷，唔係就等於冇做。

---

## 4. 登記流程（你要嘅「簡單」＝ 免密碼）

| 步 | 用戶見到 | 系統做 |
|:--:|---|---|
| 1 | 任何 app → 「此程式需先登記／登入」 | app 302 去中心，帶 `?next=`（只准自家 `*.vercel.app` 白名單，防開放轉址） |
| 2 | 一個表單：**顯示名稱＋Email**（＋可選「所屬旅團」） | `supabase.auth.signInWithOtp({ email })` |
| 3 | 收 6 位 OTP／撳 Magic Link | Supabase 驗證 → 觸發 `handle_new_user()` 建 `profiles` |
| 4 | 自動入返原本個 app | 中心開 session、簽票、302 回 `next` |
| 5 | 之後開其他 app | 中心已有 session → 直接簽票，**唔會再問你一次**（＝要求 2） |

**兩個模式，你揀一個**（`gate_settings.auto_approve`）：

- `true`（建議起步）：登記即用。你想控制時再逐個停用／刪除。
- `false`：登記後 `status='pending'`，你喺 owner 頁撳「批准」先入得。適合你真的要「只放自己人」。

**唔好收嘅資料**：電話、身份證、地址、學校班別。`email` ＋ 自選顯示名已經足夠行「誰在用」；收多咗就係 PDPO 負擔（見 §9）。

### 4.1 登記方式點揀：三條路嘅真實摩擦（**2026-11-26 補**）

| 方式 | 用戶要做幾步 | 適合邊個 | 真實唔好處（會令你收投訴） |
|---|---|:--:|---|
| **Email 6 位 OTP**（Supabase 內建，最易起） | 打 email → 去信箱搵信 → 打 6 位 → 回 App | 有自己 email 嘅領袖／家長 | 學校／公司信箱**收唔到外部信**；OTP 落 spam；由 WhatsApp 內建瀏覽器跳去郵件再返嚟成日失 context；**兩兄弟姊妹共用一個 email → 只開到一個戶口** |
| Magic Link（一撳即登入） | 打 email → 去信箱撳 link | 電腦多嘅成人 | 喺 WhatsApp／IG／FB **WebView 開 link 會失效**；公司／學校安全掃描器會「先開咗」條 link → 你撳時已經用過（一次性）→ 死 |
| **邀請碼 ＋ 自訂用戶名 ＋ 4 位 PIN**（建議做童軍主路） | 領袖派 6 位碼 → 打碼＋打名＋設 PIN | **幼童軍／冇 email 嘅成員**、一班人一次過開戶 | 你要派碼、派漏／外流要換；忘記 PIN 要你重設；名冊要跟旅團 |
| Google 一撳 | 揀帳號 | 有 Google 嘅人 | 13 歲以下多數冇；共用裝置要揀帳號、易揀錯人；同 Google 綁死 |

**建議（兩條路並存，寫入同一個 `profiles`）**：
- **成人／領袖／家長 → Email OTP**（唔用 magic link，因為你嘅用戶多數由 WhatsApp 入）。
- **幼童軍／冇 email → 邀請碼**：由領袖喺自己旅一次過派（每碼限 1 人、90 日有效、用過即失效）。呢條路同時幫你「只放自己人」，因為碼只會經領袖流出。
- 如果你唔想管 PIN／派碼，就先淨用 Email OTP，接受「共用 email 只能開一個戶口」——**但要寫明**，唔好等家長投訴先發現。

### 4.2 用戶實際體驗：五個場景，邊個位最痛

| # | 場景 | 用戶經歷 | 痛度 | 減痛做法 |
|:--:|---|---|:--:|---|
| 1 | **第一次**（由 QR／分享連結／APP STORE 入） | 見「此程式需先登記」→ 打 email → 打 6 位 → 自動返去原本嗰頁。**約 5 次點擊、60–90 秒**（估算，未實測） | 🟡 中 | 一屏搞掂（名＋email 同一頁）；**保留原本路徑**（`?next=` 帶埋 path＋query，唔好掉返首頁）；中文先、英文後 |
| 2 | **第二次開另一個 App** | 唔使再做任何嘢（中心已有 session） | 🟢 無 | 呢個就係「登記完可以用晒所有 APP」 |
| 3 | **換電話／清咗瀏覽器** | 要再收一次 OTP | 🟡 中 | 登記頁記住 email（localStorage）；session 設 30 日，唔好每次開都問 |
| 4 | **同時兩部機（電話＋平板）** | 第二部登入 → **第一部 60 秒內被踢**，會以為「壞咗」 | 🔴 **最痛** | 開 2 部裝置（`max_active_sessions=2`）；被踢畫面要寫清楚「你喺另一部裝置登入，如非本人請…」，唔好靜靜彈走 |
| 5 | **已裝主畫面（PWA）** | 開 icon 仍然要驗登記 | 🟡 中（但**必須**） | 見 §6 MG7：**唔可以**為咗順暢而放行 standalone，否則變後門 |

> **最易被忽略嘅兩點**：① **一個 email 兩個小朋友**（共用 email 只能一個戶口）；② **WhatsApp 內建瀏覽器**（OTP／link 流程最易斷）。呢兩點唔解決，你日後收嘅投訴會集中喺度。

---

## 5. 「同一帳號只 1 人」到底有幾硬？三個嚴格度

| 級 | 做法 | 舊裝置幾時死 | 成本 | 幾時用 |
|:--:|---|---|---|---|
| **L1 開 session 時踢** | 只喺登入時撤銷舊 session；app 每次開頁驗一次票 | 舊機下次**開頁／刷新**先死（可能幾日後，如果佢一直唔關頁就永遠唔死） | 最低 | 最低要求；已經擋到「兩個學生共用一個戶口」九成情況 |
| **L2 心跳（建議）** | L1 ＋ app 每 **60 秒**打一次 `/api/heartbeat`（或驗票＋touch） | ≤60 秒，畫面即彈「此帳號已在另一部裝置登入」 | 每人每分鐘 1 個請求 | **默認揀呢級** |
| **L3 每請求驗** | 每個 `/api/*` 都驗 `sid` 仍然活躍（帶 30–60 秒記憶體快取） | 即時（≤快取 TTL） | 高（要每個 app 改後端） | 有收費／敏感資料嘅 app |

**誠實限制（一定要講）**：

- **同一人手機＋電腦會互踢**：呢個係「1 人」嘅直接後果，唔係 bug。介意就開 2 部裝置。
- **背景分頁／飛航模式**：心跳停咗唔等於登出；返嚟嗰下就會知。
- **共用同一部機**：同一個瀏覽器 profile 分唔到「兩個人」——呢個只有實名／人臉／學校帳號先解決得到，**唔在本方案範圍**。
- **前端軟閘擋唔到識開 DevTools 嘅人**（同 [docs/50](50-app-store-whitelist-and-shutdown.md) §5 一致）；要真擋就要 L3。

---

## 6. 驗票（app 側）的三種做法

| app 類型 | 例子 | 做法 | 硬度 |
|---|---|---|:--:|
| **Next.js／有 API route** | `member-portal`、`scout-district-portal`、`scoutapp`(Flask)、4 本 BOOK（有 `server/`）、`AvianDex` | middleware 見 `?t=` → `POST /api/enter` 驗簽（HMAC）＋查 `session_is_active` → `Set-Cookie: gate=<JWT>; HttpOnly; Secure; SameSite=Lax; Max-Age=28800` | **硬**（`curl` 都擋） |
| **Vite／React 但有 build** | `scoutdesign`、`photo-edit`、`CERT`、`skia?…` | 同上，用平台支援嘅 middleware／edge function；**唔支援就當下面一行** | 中→硬 |
| **純靜態單檔（無 build、無 API）** | A 組大部分：`router`、`Icon-Maker`、`course`、`M33`… | `<head>` 掛「登記閘」小腳本：冇 `sessionStorage.mg` 或 `?t=` → 立即 `location.replace(hub + '/?next=…')`；有票就記住再顯示 | **軟**（只擋普通人／舊書籤／搜尋引擎爬入嚟嘅人） |

驗票票據（兩邊都要有嘅共享 secret `GATE_SECRET`，只放 Vercel env，**唔准入前端**）：

```
票 = base64url(header).base64url(payload).HMAC-SHA256(header.payload, GATE_SECRET)
payload = { sub: <user uuid>, sid: <session uuid>, aud: <app slug>, iat, exp: iat+60 }
```

驗票三步（**次序唔可以調**）：① 簽名對（`timingSafeEqual`）→ ② `exp` 未過（≤60 秒，容許 ±5 秒時差）→ ③ `session_is_active(sid)` 仍然 true。任何一步 fail = 唔放行。

> 純靜態 app **驗唔到簽名**（secret 唔可以落前端）。所以軟閘只「認有冇票」，唔「認票真假」——呢個就係 §5 講嘅 L1 上限。**唔好用「以為簽咗名就安全」嚟說服自己。**

> **MG7（2026-11-26 修正，重要）：登記模式下 `allowStandalone: true` 係後門，唔准用。**
> [docs/50](50-app-store-whitelist-and-shutdown.md) 嗰個 `allowStandalone` 係為**白名單**（「邊度嚟」）而設——已裝主畫面就當係自己人，合理。但**登記模式**（「有冇戶口」）唔同：任何人只要喺你開閘**之前**撳過「加入主畫面」，之後開 icon 就會因為 standalone 而被放行，**永遠唔使登記**。
> 所以：`require_registration` 嘅 App 一律 `allowStandalone: false`（或者只准「已登記用戶」先放行），並且喺真機用「先裝 PWA、後開閘」嘅次序實測一次。**呢個係 docs/50 舊行為同 docs/61 新要求嘅唯一直接衝突，以本文為準。**

---

## 7. 你（Owner）嘅操作面

中心一條 `/admin`（只 `role='owner'` 入得，並且**要你嘅 Email 再加一次 Supabase 密碼／OTP**）：

| 功能 | 做乜 | 即時性 |
|---|---|---|
| 用戶列表／搜尋 | Email、顯示名、旅團、狀態、最後上線、當前裝置 | — |
| **踢下線** | 撤銷當前 session，唔停用帳號 | 下次心跳（≤60 秒） |
| **停用** | `status='blocked'` ＋ 撤銷 session，資料保留 | 即時擋新登入；舊 session ≤60 秒死 |
| **批准** | `pending → active` | 即時 |
| **刪除** | 真刪 `auth.users` 一行 → cascade 清 `profiles`／`sessions` | ≤60 秒，之後查唔返 |
| **全站急停** | `gate_settings.access_mode='closed'`（軟關站，配 [docs/50](50-app-store-whitelist-and-shutdown.md) 嘅 `mode:'closed'` 卡片） | 下個請求即停 |
| 審計 | `gate_audit`：你幾時踢／刪過邊個 | — |

**手機應急（唔開電腦都做得到）**：Supabase Dashboard → SQL Editor 貼一行。例如踢人：

```sql
select public.owner_kick('someone@example.com');
-- 或者你自己 email 直接做（service_role 唔經 assert_owner）：
update public.sessions s set revoked_at = now(), revoked_reason = 'owner'
  from public.profiles p
 where p.id = s.user_id and lower(p.email) = lower('someone@example.com') and s.revoked_at is null;
```

> 「隨時刪走」有兩種意思，**兩樣都做得到**：① 刪帳號（上面）② 刪走個 app／關站（Vercel Pause Project 或 `access_mode='closed'`）。**唔好靠「刪 app 個網址」**——舊連結會 404，但已登記嘅人仍然有你嘅資料喺 Supabase。

---

## 8. 落地次序（每階段都有驗收，唔好一次過改 68 個）

| 階段 | 做乜 | 大約 | 驗收（真機） |
|:--:|---|---|---|
| **P0** | 喺 `member-portal` 加：`/`（登記／登入）、`/admin`、`/api/ticket`、`/api/enter`；Supabase 貼 SQL；設 `GATE_SECRET` | 半日–1 日 | 你自己 email 登記得；`/admin` 見到自己；踢自己 → 60 秒內被登出 |
| **P1** | **3 個示範**：1 個 Next.js（`member-portal` 自己）、1 個 Vite（`scoutdesign`）、1 個單檔（`router`） | 半日 | 未登入直打 → 去登記；登記完 3 個都開得；第二部機登入 → 第一部被踢 |
| **P2** | A 組（35 個）逐個加軟閘（同 docs/51 嘅批次一齊做，一次過改 `<head>` 三行） | 每個 15 分鐘 | 抽 5 個真機驗；舊書籤／分享連結要落到登記頁 |
| **P3** | 有後端嘅 app（C 組、4 本 BOOK）加 L3 硬驗票；最後考慮所有 app 都唔再 `mode:'open'` | 逐個 | `curl -I` 直打 API → 401 |

> **次序陷阱**：**P0 未做完唔好開 P2**。一開閘而中心未企穩，全部 app 一齊入唔到，同 [docs/50](50-app-store-whitelist-and-shutdown.md) §4.4 嘅「落地次序」同一個道理。另外，**分享連結仍然要指 APP STORE 深層連結**（SG9），唔好直接分享子站網址——否則朋友撳入嚟只會見到登記頁。

---

## 9. 私隱（PDPO）同「唔好做多」

- **最小化**：只收 `email` ＋ 顯示名（＋可選旅團）。唔收電話／身份證／出生日期。
- **講清楚**：登記頁一句「你嘅 Email 只用嚟登入同帳號管理，唔會公開；你可以隨時要求刪除」。要一份一頁私隱聲明（誰是控制人、用途、保留期、刪除方法）。
- **未成年人**：童軍好多未滿 18 歲。建議一句「如未滿 18 歲，請先取得家長／監護人同意」；你亦可以只接受領袖／家長登記，成員用返旅團內部系統。
- **IP／UA**：唔好存 IP 原值。本文 SQL 只存 UA 嘅 SHA-256 hash，方便你認「同一部機」而唔存可識別資料。
- **刪除 = 真刪**：`owner_delete()` 刪 `auth.users` 一行，`profiles`／`sessions` 因 `on delete cascade` 一齊消失；`gate_audit` 只留「你幾時刪過邊個 email」呢條行政紀錄（唔含內容）。
- **搜尋引擎**：登記閘唔等於唔會被 Google 索引。所有 app 加 `X-Robots-Tag: noindex`（`vercel.json` header）或 `robots.txt`，否則「已登記」嘅內容有機會被爬。

---

## 10. 成本與配額（要自己核實，唔好信我記憶）

| 項 | 你要注意 |
|---|---|
| Supabase Auth | 免費方案有 MAU 上限；超出要升級。OTP／Magic Link 逐封 email 計，量大要自備 SMTP（Resend／Brevo） |
| Supabase DB | 免費 500MB 級；`sessions` 會長大 → 加清理 job（見 SQL 尾註） |
| Vercel | Hobby 對 Edge／Function 呼叫有上限；68 個 app 每人每分鐘心跳 1 次＝真實用量，上線前**喺 Vercel 定價頁睇當日數字**，唔好靠估算 |
| 慳法 | 驗票後種 **8 小時 cookie**，之後只每 60 秒心跳；`session_is_active` 喺 app 側快取 30–60 秒，唔使每次打 DB |

---

## 11. 唔做／已知限制（交付前必須照抄，唔准美化）

- ❌ **未實作**：本文只係設計；SQL 未跑過，票據／middleware 未寫、未測。
- ❌ **純靜態 app 冇硬邊界**：軟閘只係「唔對外開放」，唔係「加密」。任何人攞到 bundle 就攞到內容，識開 DevTools 就繞得過。
- ❌ **「同時 1 人」靠心跳**：最壞延遲 = 心跳間隔（60 秒）；如果用戶一直唔關頁又唔刷新，L1 模式下可能長期唔被踢。
- ❌ **擋唔到同機換人**：同一個瀏覽器 profile 冇「誰在用」概念。
- ⚠️ **一個 email 可以開多個 Supabase 帳號**（`+alias`）：民政式登記必然有呢個問題；要嚴格就用學校／旅團名冊白名單（`pending` + 你人手批准）。
- ⚠️ **轉用 `mode:'open'` 嘅舊 app 會繞過**：P2 未做完之前，仍然有 43 個 app 係公開直連（見 [docs/51](51-whitelist-rollout-list.md) §0.1）。**登記閘嘅「全站」係目標，唔係現狀。**

---

## 12. 驗收清單（P1 完咗逐條剔）

- [ ] 未登入直打示範 app → 見到登記／登入，**見唔到底層內容**（唔可以只係彈窗遮住，DOM 要真係冇內容）
- [ ] 登記（OTP）→ 自動返原本個 app，而且**唔使再登入第二次**
- [ ] 同一帳號第二部機登入 → 第一部 60 秒內彈提示並登出（L2）
- [ ] 你喺 `/admin` 撳「刪除」→ 該 email 即刻開唔返；SQL 查 `profiles` 冇殘留
- [ ] `curl` 直打有後端 app 嘅 `/api/*` → 401（L3 才有）
- [ ] 舊書籤（`?app=<slug>` 深層連結）→ 落到登記頁，唔會白屏
- [ ] 已加主畫面（standalone PWA）→ **仍然要驗登記**；`allowStandalone` 已設 `false`（MG7），並且試過「先裝主畫面、後開閘」都攔得到
- [ ] 私隱聲明有連結、`robots.txt`／`X-Robots-Tag: noindex` 已生效
- [ ] 你自己（owner）手機＋電腦同時用得（如果有需要）
- [ ] 全站急停（`access_mode='closed'`）→ 出中文告示卡，唔係白屏或英文 500

---

## 13. 同其他文件嘅分工

| 你想 | 去 |
|---|---|
| **想一次統管 68 個 App（一個掣改政策／開關）** | **[docs/62](62-one-control-plane-for-all-apps.md)** — 政策搬去 APP STORE 一份設定，App 只掛兩行，改一次全部跟 |
| 白名單入口（邊度嚟）／關站模式／`store_gate` | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| 邊個 app 而家有閘、邊個未有（實查清單） | [docs/51](51-whitelist-rollout-list.md) §0.1 |
| 後端簽票／`/api/enter` 詳細原理 | [docs/50](50-app-store-whitelist-and-shutdown.md) §4.3 |
| Supabase RLS 寫法 | [docs/08](08-supabase.md) |
| Vercel 設定／`/api/proxy` | [docs/06](06-vercel.md) |
| 可以照抄嘅 SQL | [`templates/supabase/member_gate_v1.0.sql`](../templates/supabase/member_gate_v1.0.sql) |
