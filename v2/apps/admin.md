---
id: PLAT-03
slug: admin
name_zh: ADMIN 管理台
name_en: Admin Console
layer: L0
category: 平台
status: planned
version: v2.0.0
repo: （新，寄生 website 的 /admin）
url: （同 PLAT-01 同一主網域）/admin
gate: hard
auth_required: true
identity_mode: central
backend_operator: platform
session_policy: central_single_device
scopes: [members:all:write, apps:policy:write]
storage: supabase
offline: false
pwa: false
i18n: [zh-Hant]
audience: leader
data_sensitivity: high
merged_from: []
configs: []
---

## 1. 一句目的
你唔開 Supabase dashboard 都管到中央身份日常：開戶、派角色、暫停中央 App、睇審計、追「未通知」名單。區系統 `CEN-01`、旅系統 `TRP-01` 的本地帳戶不由此處管理。

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| owner（你） | 開學／加人 | 每次 2 分鐘 | 開戶 → 自動入「未通知」隊列 |
| owner | 每週 | 5 分鐘 | 5 個數字睇完全站健康 |
| 你（owner） | 開中央身份帳戶／批量開戶 | 3 分鐘 | 所有 `PLAT-02` 中央帳戶由你經 ADMIN 建立；CEN-01／TRP-01 小帳戶由區／旅自理 |
| 你 | 出事 | 30 秒 | 一 App 一開關，唔影響其他 |

## 3. 功能（M／O／X）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 開中央身份帳戶（用戶名＋臨時密碼＋`must_change_pw`） | M | `PLAT-02` 帳戶開完即刻可登入 |
| 2 | 批量開中央身份帳戶（貼 CSV） | M | 一次 ≤100 行，失敗逐行回報 |
| 3 | 中央身份「未通知」清單 → 標「已通知」 | M | 你通知 PLAT-02 帳戶後，一撳打勾，有時間戳 |
| 4 | 派／改中央身份角色（`memberships`） | M | 改完 ≤60 秒生效（下一張票）；不管理 CEN-01／TRP-01 local roles |
| 5 | 重設密碼／踢下線／封鎖／刪除 | M | 四樣都入 `gate_audit` |
| 6 | Central App 入口開關（`apps.status`／`access_mode`／`pilot_units`） | M | 暫停中央目錄入口唔影響其他；唔代管 `CEN-01`／`TRP-01` 後端 |
| 7 | 審計查詢（邊個幾時對邊個做乜） | M | 可按人／按 App 篩，匯出 CSV |
| 8 | 健康睇板（登入失敗率、被踢次數、App 錯誤） | M | 5 個數字，紅／黃／綠 |
| 9 | 回報箱（用戶按「打唔開」） | O | 可以標「已修」 |
| 10 | 改中央身份密碼（任何角色） | M | 唔使經 owner；local system 密碼由各自後端管理 |
| 11 | 自助註冊／邀請碼／email 通知 | X | 已否決；**唔准**有呢啲路由 |
| 12 | 睇童軍個人資料全文 | X | 2.0 唔做（最小權限） |

## 4. 權限
| Scope | 邊個有 | 影響 |
|---|---|---|
| `members:all:write` | owner（你） | 中央 `PLAT-02` 帳戶生命週期操作；不含 CEN-01／TRP-01 本地小帳戶 |
| `apps:policy:write` | owner | 中央 App 政策／入口開關；不控制 CEN-01／TRP-01 自管後端 |
| `apps:read` | 所有已登入 | 但 `/admin/*` 除上述 scope 外一律 403 |

> 用戶已確認唔設通用區／旅兩級 admin。L0 ADMIN 只管理 `PLAT-02` 中央帳戶／平台政策；`CEN-01`／`TRP-01` 的上層管理帳戶由你提供，區／旅自行管理其下小帳戶及 session，唔由本 App 代管。CEN-03 業務登記後台亦按自身規格。跨支部資料按 `03-CATALOG` §6.2 雙方授權規則。

## 5. 入口與路由
- 入口：`PLAT-01` 目錄裏「管理」一項（只對 owner 顯示）
- 路由：`/admin`（睇板）、`/admin/members`、`/admin/members/new`、`/admin/roles`、`/admin/apps`、`/admin/audit`、`/admin/inbox`
- 全部經 `PLAT-02` 驗票；**每個 API 都再驗一次 scope**（前端隱藏唔算）

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | Supabase；呼叫 v1.1 已存在嘅 RPC |
| RPC（已有） | `owner_create_member`、`owner_bulk_create`、`owner_reset_password`、`owner_kick`、`owner_block`、`owner_delete`、`purge_sessions`（只管理中央 identity tables） |
| 表（要加） | `notify_log(member_id, notified_at, by, channel)`、`app_requests`（見 PLAT-01） |
| 容量 | 審計 < 10 萬行／年 |
| 保留 | 審計永久；`notify_log` 永久 |
| 敏感度 | **high**（名單、帳戶操作） |

## 7. 與其他系統接口
| 對象 | 方向 | 內容 |
|---|---|---|
| `PLAT-02` | 呼叫 | 全部 `owner_*` RPC |
| `PLAT-01` | 被掛載 | `/admin/*` 同一 app |
| `PLAT-04` | 發 | 開新戶後提示「要唔要順便開 Push」 |
| Central identity Apps | 收 | 讀 `apps.status`／`pilot_units` |
| `CEN-01`／`TRP-01` | 只影響 STORE 入口／顯示 | 其自管後端的 access policy／shutdown 由區／旅系統管理者處理 |

## 8. 離線與 PWA
- 不適用：管理台**唔准離線**（會做出「以為封鎖咗」嘅錯覺）。PWA `false`。

## 9. 失敗模式
| 情況 | 行為 |
|---|---|
| 驗票失敗 | 去 `/login?next=/admin`（fail-closed） |
| 冇 scope | 403 ＋ 寫 `gate_audit`（記錄越權嘗試） |
| RPC 失敗 | 顯示實際錯誤碼，**唔准**靜默成功 |
| DB 掛 | 全部寫入停用（唔准入 local queue 稍後重放） |

## 10. 體積預算
- 首屏 ≤ 150KB；唔用重型 UI 框架；表格分頁 50 行

## 11. 驗收（真機）
- [ ] 由零開一個中央 `PLAT-02` leader 帳戶 → 對方即刻入到（你唔使開 dashboard）
- [ ] 開完 → 「未通知」+1；打勾後有時間戳＋操作人
- [ ] 批量貼 10 行 CSV → 10 個帳戶，重複名逐行報錯
- [ ] 非 owner 帳戶打開戶 API → 403 且入審計；owner 才可建立帳戶
- [ ] 暫停 `TOOL-060` → 其他 App 照行
- [ ] 審計查到「邊個幾時踢咗邊個」
- [ ] 冇任何「註冊」入口；`grep` 無 `signup`／`register` 路由
- [ ] 390px 都操作得到（你要喺手機做）

## 12. 版號與遷移
| 項 | 內容 |
|---|---|
| 舊系統 | `website` 現有 `admin.js`＋`is_store_admin()`（**未睇過全部邏輯**） |
| 舊資料 | 現有管理員 → `owner`；舊「管理員」概念可能係 boolean → 轉 `memberships.role` |
| 切換 | 新 `/admin` 上線後舊 admin 介面 302 |
| 回滾 | 舊 `admin.js` 保留 30 日 |

## 13. 未做／限制（誠實）
- 未有通知功能（WhatsApp 發送要靠你人手；系統只記「已通知」）。**唔准**做 email／SMS（已否決 email）。
- 「未通知」清單嘅定義要你確認：係「開戶未通知」定「改角色未通知」都要？（建議：兩樣都入）。
- 未做跨單位報表（你未要求）。

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿（示範 spec，示範「後台／審計／最小權限」點寫） |
