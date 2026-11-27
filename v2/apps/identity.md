---
id: PLAT-02
slug: identity
name_zh: 身份核心
name_en: Identity Core
layer: L0
category: 平台
status: planned
version: v2.0.0
repo: （新，寄生 website）
url: （同 PLAT-01 同一主網域）
gate: hard
auth_required: true
identity_mode: central
backend_operator: platform
session_policy: central_single_device
scopes: [apps:read]
storage: supabase
offline: false
pwa: false
i18n: [zh-Hant, en]
audience: both
data_sensitivity: high
merged_from: []
configs: []
---

## 1. 一句目的
中央身份用戶以一組帳戶登入所有已接入 `PLAT-02` 嘅 App：`members`＋`memberships`＋60 秒簽名票；**中央帳戶 1 部機**。`CEN-01`／`TRP-01` 由本地後端管理帳戶及 session，不屬本服務範圍。

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| 你（owner） | 開學前 | 一次性 | 開 80 個帳戶唔使開 DB editor |
| 領袖 | 每次 | 10 秒 | 一個帳戶入到支部 portal／BOOK／集會 |
| 家長 | 每次 | 10 秒 | 只見到通告＋自己小朋友支部 |
| 換電話 | 偶爾 | 30 秒 | 新機登入，舊機自動被踢，唔使找你 |

## 3. 功能（M／O／X）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 登入（用戶名＋密碼） | M | `login_member()` 一次交易完成驗證＋撤舊 session＋開新 |
| 2 | 首次登入強制改密碼 | M | `must_change_pw` = true 時，除 `/change-pw` 外全部拒絕 |
| 3 | 中央身份 1 部機 | M | DB 唯一索引保證；只適用 `PLAT-02` 帳戶，唔套用 `CEN-01`／`TRP-01` local identity |
| 4 | 60 秒票 | M | `/api/ticket` 簽 `sub`／`units[]`／`scopes[]`／`exp`／`device_id` |
| 5 | 換票 `/api/verify` | M | 一次性（`jti` 用過即廢）、驗簽名、驗 `device_id` |
| 6 | 服務端判角色 | M | 子 App **只讀 claims**，唔自己查 DB |
| 7 | 改密碼／登出全部裝置 | M | 改密碼 → 全部 session 撤銷（`revoked_reason='password'`） |
| 8 | 鎖定政策 | M | 5 次失敗鎖 15 分鐘（`gate_settings` 可調） |
| 9 | 自助註冊 / Email / OTP / Magic Link / Google | X | **已否決**（`01-DECISIONS` §B），程式**唔准**有註冊路由 |
| 10 | 中央身份 owner 2 部機例外 | X | **已否決**：中央身份一視同仁 1 部機；`CEN-01`／`TRP-01` local identity 允許多裝置、不受此規則管 |

## 4. 權限（5 個角色，**按單位**）
| Scope | 邊個有 | 影響 |
|---|---|---|
| `apps:read` | 所有已登入 | 睇目錄 |
| `members:all:write` | owner（你） | 中央 ADMIN 開戶／帳戶生命週期操作；全部由你處理 |
| `apps:policy:write` | owner | 政策 |

| 角色 | 意思 | 例子 |
|---|---|---|
| `owner` | 你，全站 | 跨旅、開任何人 |
| `admin` | 具體系統授予嘅管理角色；不預設區／旅兩級 | 由該系統 scope 決定可管理嘅範圍；CEN-03 業務登記後台與 L0 身份開戶分開 |
| `leader` | 支部領袖 | 只寫自己支部 |
| `member` | 童軍成員／家長 | 只讀 |
| `guest` | 臨時（如訓練班學員） | 只讀指定 App，限期 |

> scope 由 `memberships` 派生，**由伺服器組票**；客戶端唔准自己拼。

## 5. 入口與路由
- 冇獨立網址：`PLAT-01` 嘅 `/login`、`/change-pw`、`/api/ticket`、`/api/verify`、`/api/logout`
- 票：`/app/<slug>` → `?t=`（60 秒）→ 子 App verify → 子 App 自己 cookie（唔共用）
- 分享：不適用（身份核心唔對外）

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | Supabase（現有 `templates/supabase/member_gate_v1.1.sql`，**未實測**） |
| 表（v1.1 已有） | `members`、`sessions`、`gate_settings`、`gate_audit` |
| 表（2.0 要加） | `memberships(member_id, unit_type, unit_id, role, valid_from, valid_to)`、`ticket_jti`（防重放） |
| 容量 | 預估 < 500 個中央帳戶、< 5,000 memberships；不計入 CEN-01／TRP-01 local accounts |
| 保留 | `sessions` 90 日後 `purge_sessions()`；`gate_audit` 永久（少量） |
| 敏感度 | **high**（密碼雜湊、個人資料）→ 必須後端，唔准軟閘 |

### 6.1 v1.1 → 2.0 必做遷移（**未寫**）
| # | 改動 | 為何 |
|:--:|---|---|
| 1 | `members.role` 只有 `member`/`owner` → 加 `admin`/`leader`（或**完全改用 `memberships` 判角色**，`members.role` 只留 `owner`） | 一個 user 一個 role 唔夠（docs/64 §3.1） |
| 2 | `members.unit_name text` → 正規化成 `memberships` 多對多 | 一個人可同時係領袖＋家長 |
| 3 | 新增 `ticket_jti` 表 | 票一次性，防重放 |
| 4 | `login_member()` 要回 `units[]`／`scopes[]` | 子 App 只讀 claims |

## 7. 與其他系統接口

> **接入範圍**：只供選用 `identity_mode: central` 嘅 Apps。`CEN-01`／`TRP-01` 用 local backend/auth，不接本票、不共用 `members`／session；唔可由中央登出／鎖裝置影響其本地帳戶。

| 對象 | 方向 | 內容 |
|---|---|---|
| `PLAT-01` | 被呼叫 | `/login`、`/api/ticket` |
| `PLAT-03` ADMIN | 被呼叫 | `owner_create_member()`、`owner_bulk_create()`、`owner_reset_password()`、`owner_kick()`、`owner_block()`、`owner_delete()` |
| Central identity Apps | 發 | `?t=` 票 |
| `PLAT-04` 通告 | 發 | Push 訂閱綁 `member_id` |

## 8. 離線與 PWA
- 不適用：身份核心**唔可以離線**（離線驗票＝假閘）。
- PWA：`false`

## 9. 失敗模式
| 情況 | 行為 |
|---|---|
| 驗票失敗／過期 | 302 回 `/login?next=`（fail-closed） |
| DB 掛 | 拒絕登入（**唔准**有「本地快取帳戶」後門） |
| 簽名密鑰缺失 | 啟動即 fail（唔准用 default key） |
| 時鐘偏差 | 票容許 ±5 秒；超出即拒 |

## 10. 體積預算
- 不適用（冇首屏）；`login` 頁 ≤ 60KB

## 11. 驗收（真機）
- [ ] 3 個帳戶（owner／leader／member）登入到，見到唔同目錄
- [ ] 第 2 部機登入 → 第 1 部 ≤60 秒被踢，`gate_audit` 有 `replaced`
- [ ] 票 60 秒後失效；同一張票用兩次 → 第二次失敗
- [ ] `must_change_pw` → 未改密碼前開任何 App 都被擋
- [ ] 錯 5 次 → 鎖 15 分鐘；鎖住時提示同「密碼錯」**一樣**（唔透露帳戶存在）
- [ ] 改密碼 → 其他 session 全部失效
- [ ] 用 member 帳戶直接打 Supabase REST 讀 `members`／`sessions` → 失敗
- [ ] curl 偽造票（改 `scopes`）→ 驗簽失敗
- [ ] 冇任何註冊／忘記密碼／email 路由（`grep` 驗證）

## 12. 版號與遷移
| 項 | 內容 |
|---|---|
| 舊系統 | 現時 91 個 App 各自閘／部分無閘（docs/51：21 有閘、43 未接） |
| 舊資料 | 現有 `website` 管理員帳號 → `owner`；其他系統帳號**唔搬**（重建，`01-DECISIONS` 決定 11） |
| 切換 | 2.0 上線時舊系統仍在線；舊系統帳號用「人手開新戶」方式過渡 |
| 回滾 | 新增表可 drop；`members` 改動只加欄（`role` 值域擴張係向後兼容） |

## 13. 未做／限制（誠實）
- `member_gate_v1.1.sql` **從未跑過**（未實測 migration、未測 RLS）。
- 未有「忘記密碼」自助 → 全部經 ADMIN 重設（你嘅決定，但你要做嗰個人）。
- 未有 2FA（未討論）。
- **唔買網域** → 票要用 `?t=` 帶（跨子網域 cookie 唔可靠），而且每個子 App 要自己 verify。**冇單一登入 cookie 通行呢回事。**

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿（示範 spec，示範「高敏感度＋後端判角色」點寫） |
