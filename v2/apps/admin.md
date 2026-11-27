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
scopes: [members:unit:write, members:all:write, apps:policy:write]
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
你唔開 Supabase dashboard 都管到日常：開戶、派角色、暫停 App、睇審計、追「未通知」名單。

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| owner（你） | 開學／加人 | 每次 2 分鐘 | 開戶 → 自動入「未通知」隊列 |
| owner | 每週 | 5 分鐘 | 5 個數字睇完全站健康 |
| admin（單位） | 加新成員 | 1 分鐘 | 只開自己單位，開唔到別個單位 |
| 你 | 出事 | 30 秒 | 一 App 一開關，唔影響其他 |

## 3. 功能（M／O／X）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 開戶（用戶名＋臨時密碼＋`must_change_pw`） | M | 一個表單開完，帳戶即刻入到 |
| 2 | 批量開戶（貼 CSV） | M | 一次 ≤100 行，失敗逐行回報 |
| 3 | 「未通知」清單 → 標「已通知」 | M | 你 WhatsApp 通知完，一撳打勾，有時間戳 |
| 4 | 派／改角色（`memberships`） | M | 改完 ≤60 秒生效（下一張票） |
| 5 | 重設密碼／踢下線／封鎖／刪除 | M | 四樣都入 `gate_audit` |
| 6 | App 開關（`apps.status`／`access_mode`／`pilot_units`） | M | 暫停一個 App 唔影響其他 |
| 7 | 審計查詢（邊個幾時對邊個做乜） | M | 可按人／按 App 篩，匯出 CSV |
| 8 | 健康睇板（登入失敗率、被踢次數、App 錯誤） | M | 5 個數字，紅／黃／綠 |
| 9 | 回報箱（用戶按「打唔開」） | O | 可以標「已修」 |
| 10 | 改自己密碼（任何角色） | M | 唔使經 owner |
| 11 | 自助註冊／邀請碼／email 通知 | X | 已否決；**唔准**有呢啲路由 |
| 12 | 睇童軍個人資料全文 | X | 2.0 唔做（最小權限） |

## 4. 權限
| Scope | 邊個有 | 影響 |
|---|---|---|
| `members:unit:write` | admin、owner | 只限自己單位（admin）；owner 全站 |
| `members:all:write` | owner | 刪除、跨單位 |
| `apps:policy:write` | owner | 政策／開關 |
| `apps:read` | 所有已登入 | 但 `/admin/*` 除上述 scope 外一律 403 |

> **admin 只能見自己單位嘅名單**（`01-DECISIONS` 附錄 A-2 待你確認；本 spec 採「唔可以跨支部」）。

## 5. 入口與路由
- 入口：`PLAT-01` 目錄裏「管理」一項（只對有 scope 嘅人顯示）
- 路由：`/admin`（睇板）、`/admin/members`、`/admin/members/new`、`/admin/roles`、`/admin/apps`、`/admin/audit`、`/admin/inbox`
- 全部經 `PLAT-02` 驗票；**每個 API 都再驗一次 scope**（前端隱藏唔算）

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | Supabase；呼叫 v1.1 已存在嘅 RPC |
| RPC（已有） | `owner_create_member`、`owner_bulk_create`、`owner_reset_password`、`owner_kick`、`owner_block`、`owner_delete`、`purge_sessions` |
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
| L1/L2 App | 收 | 讀 `apps.status`／`pilot_units` |

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
- [ ] 由零開一個 leader 帳戶 → 對方即刻入到（你唔使開 dashboard）
- [ ] 開完 → 「未通知」+1；打勾後有時間戳＋操作人
- [ ] 批量貼 10 行 CSV → 10 個帳戶，重複名逐行報錯
- [ ] admin 帳戶開戶 → 只可以揀自己單位；用 URL 硬打別個單位 → 403 且入審計
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
