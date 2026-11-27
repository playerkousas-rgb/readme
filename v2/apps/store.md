---
id: PLAT-01
slug: store
name_zh: APP STORE 殼
name_en: App Store Shell
layer: L0
category: 平台
status: planned
version: v2.0.0
repo: website
url: https://playerkousas-rgb.github.io/website/   # 現況；2.0 部署位置待定（見 §13）
gate: hard
auth_required: true
scopes: [apps:read, apps:prefs:write, apps:policy:write]
storage: supabase
offline: false
pwa: true
i18n: [zh-Hant, en]
audience: both
data_sensitivity: medium
merged_from: []
configs: []
---

## 1. 一句目的
全系統**唯一入口**：登入後見到自己有權限嘅 App 目錄，可自訂擺位／分類／隱藏；亦係發票同驗票嘅中樞。

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| 所有已登入用戶 | 每次開工 | 10 秒 | 2 次點擊內開到目標 App |
| 領袖 | 集會前 | 30 秒 | 見到「我支部」全套，唔見其他支部 |
| owner/admin | 每週 | 2 分鐘 | 睇到未通知帳戶、暫停某 App |
| 未登入訪客 | 偶然 | 5 秒 | 只見到登入頁＋一句說明，**唔見目錄** |

## 3. 功能（M／O／X）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 登入（用戶名＋密碼） | M | 錯 5 次鎖 15 分鐘，訊息唔透露帳戶存在 |
| 2 | 目錄：按層／分類／搜尋 | M | 只列 `scopes` 允許嘅 App |
| 3 | 發票 `/api/ticket` | M | 60 秒有效、一次性、簽名 |
| 4 | 自訂版面（擺位／分組／隱藏／置頂） | M | 存 `user_app_prefs`，換機登入照舊 |
| 5 | 深層連結 `?app=<slug>` | M | 未登入 → 登入 → **回原目標**（唔係回首頁） |
| 6 | 一鍵回報「打唔開」 | O | 寫入 `gate_audit`，ADMIN 睇到 |
| 7 | App 狀態顯示（`live`/`paused`/`retired`） | M | `paused` 唔准開，寫一句原因 |
| 8 | 雙語切換 | O | 2.0 只做中／英 |
| 9 | 分享／QR 產生 | X | **2.0 唔做**：你決定唔買網域 → 分享只可在站內複製深層連結（見 §13） |

## 4. 權限
| Scope | 邊個有 | 影響 |
|---|---|---|
| `apps:read` | 所有已登入 | 睇目錄（內容按 `scopes` 過濾） |
| `apps:prefs:write` | 所有已登入 | 只改自己 `user_app_prefs` |
| `apps:policy:write` | owner | 改 `access_mode`、`apps.status`、`pilot_units` |

> 目錄過濾 = 票上 `scopes` ∩ `apps.scopes`，**唔可以靠前端隱藏**（隱藏≠無權限）。

## 5. 入口與路由
- 唯一入口：`/`（登入）→ `/home`（目錄）
- 路由：`/login`、`/home`、`/app/<slug>`（中轉發票）、`/admin/*`（PLAT-03）、`/api/ticket`、`/api/verify`
- 分享／QR：**一律本站深層連結** `/app/<slug>`；唔准子站網址（SG9）
- 票：`/app/<slug>` → 產 `?t=<60 秒票>` → 302 去子 App → 子 App `/api/verify` 換票 → 種自己 cookie

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | Supabase（現有 `apps` 表＋migrations 10 檔，含 `retired_apps`、`is_store_admin()`） |
| 表 | 沿用 `apps`；**新增** `user_app_prefs(member_id, app_slug, visible, pinned, grp, sort)`、`app_requests`（回報） |
| 容量 | 目錄 < 200 行；prefs 每人 < 200 行 |
| 保留 | prefs 跟帳戶；`app_requests` 保留 180 日 |
| 敏感度 | medium（有帳戶關聯，冇密碼明文） |

> `apps.slug` 沿用現有規則 `^[a-z0-9][a-z0-9-]{0,38}[a-z0-9]$` → 中央 `gate-config` 用 slug 做 key，**唔准改名**（改名會斷票同連結）。

## 7. 與其他系統接口
| 對象 | 方向 | 內容 |
|---|---|---|
| `PLAT-02` 身份 | 互通 | 同一 Supabase schema；`/login` 由 `PLAT-02` 提供 |
| `PLAT-03` ADMIN | 收 | `/admin/*` 掛喺同一 app（Path-based） |
| `PLAT-04` 通告 | 收 | 通告深層連結指向 `/app/circulars?id=…` |
| L1/L2/L3 App | 發 | 60 秒票（`?t=`） |
| 所有 App | 收 | `/api/verify` 驗票、`/api/health` 監控 |

## 8. 離線與 PWA
- SW 策略：network-first（目錄要最新）；只 cache 殼同圖標
- 離線可做：顯示「離線」頁＋最後一次目錄（唯讀）
- 離線唔可做：登入、發票、開任何 App

## 9. 失敗模式
| 情況 | 行為 |
|---|---|
| 驗票失敗 | 回 `/login?next=<原目標>`（fail-closed） |
| 讀政策失敗（`gate_settings` 讀唔到） | 用 `registered`（要登入）＋ 寫 error log（fail-closed，唔會變成 `open`） |
| Supabase 掛 | 顯示維修頁；唔准 fallback 到「全開放」 |
| 離線 | 唯讀目錄 |

## 10. 體積預算
- 首屏 ≤ 200KB（gzip）／總 ≤ 1MB；圖標 SVG 優先，PNG ≤ 120KB

## 11. 驗收（真機）
- [ ] iPhone Safari 390px／Android Chrome 開得到、唔爆版
- [ ] 未登入打 `/home` 或 `/app/book` → 去登入，**見唔到目錄／標題**
- [ ] 登入後回原目標（`next` 生效）
- [ ] 第二部機登入 → 第一部 ≤60 秒被踢
- [ ] `paused` App 開唔到，有一句原因
- [ ] `pilot_units` 唔包自己 → 目錄見唔到（即使有 scope）
- [ ] 加入主畫面 → 開 icon 仍要驗票（MG7）
- [ ] 中英切換、圖標 9 檔（G11）、`© SCOUT SYSTEM`、雙版號、`noindex`
- [ ] 用 member 帳戶直接打 Supabase REST 讀 `members` → **失敗**（RLS 生效）

## 12. 版號與遷移
| 項 | 內容 |
|---|---|
| 舊 App | `website`（現有目錄，已有 `apps`／`retired_apps`／`is_store_admin()`） |
| 舊資料 | `apps` 表**沿用唔搬**（只加欄）；舊「管理員」帳號 → 遷去 `memberships` `role=owner` |
| 切換 | 新舊並行 → pilot 旅驗收 → 舊路徑 302 去新 `/home` |
| 回滾 | 保留舊 deployment 30 日；DB 改動全部係 `add column`／新表（可 drop） |

## 13. 未做／限制（誠實）
- **部署位置未定**：現時 `website` 喺 GitHub Pages（`*.github.io`），但 2.0 要後端（發票／驗票／RLS）→ 需轉 Vercel 或 Supabase Edge Functions。**未實測**。
- **唔買網域嘅後果**（`00-OVERVIEW` §4）：登入 cookie 只喺同一主網域生效 → 所有 App 必須同一主網域（subpath）或逐個驗票；PWA 要逐個裝；票只 60 秒。
- 分享／QR 產生器 2.0 唔做（要穩定短網域）。
- 我**未睇過** `website` 現有 `admin.js` 全部邏輯，只知有 `is_store_admin()`。

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿（示範 spec，示範「L0＋硬閘＋新表」點寫） |
