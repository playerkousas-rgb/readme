---
id: TRP-04
slug: book
name_zh: 紀錄冊（BOOK）
name_en: Record Book
layer: L2
category: 旅團生態
status: planned
version: v2.0.0
repo: book   # 新 repo；來源 4 個舊 repo
url: （同 PLAT-01 同一主網域）/book
gate: hard
auth_required: true
scopes: [book:cubs:read, book:cubs:write, book:scout:read, book:scout:write, book:vs:read, book:vs:write, book:rover:read, book:rover:write]
storage: supabase
offline: true
pwa: true
i18n: [zh-Hant, en]
audience: both
data_sensitivity: high
merged_from: [CUBSBOOK, SCOUTBOOK, VSBOOK, ROVERBOOK]
configs: [cubs, scout, vs, rover]
---

## 1. 一句目的
一個 App 記四個支部嘅童軍紀錄（宣誓、技能、服務、露營、考核）；領袖寫、成員睇自己嗰份。

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| 支部領袖 | 集會後 | 5 分鐘 | 一次過記 20 人嘅考核，唔使開 3 個網頁 |
| 童軍成員 | 考完章 | 1 分鐘 | 見到自己進度、知差幾多 |
| 家長（member） | 偶爾 | 1 分鐘 | 只讀自己小朋友 |
| 你（owner） | 換屆 | 30 分鐘 | 匯出全旅 CSV |
| 小童軍 `gh` | — | — | **不適用**：小童軍冇 BOOK，只有支部 portal 嘅「年資記錄」頁（`00-OVERVIEW` §3） |

## 3. 功能（M／O／X）
### 3.1 共通功能
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 成員名單（自己支部） | M | 只見到自己支部；`scopes` 過濾 |
| 2 | 逐人紀錄（分類＋項目＋日期＋簽核人） | M | 一次儲存 ≤2 秒；失敗有明確錯誤 |
| 3 | 批量簽核（揀多人 × 一項） | M | 20 人一次過，逐人可撤 |
| 4 | 個人檢視（成員睇自己） | M | 只讀，見唔到別人 |
| 5 | 匯出 CSV（領袖） | M | 匯出即係「當時」快照，有時間戳 |
| 6 | 變更歷史（邊個幾時改邊條） | M | 每條紀錄有 `updated_by`／`updated_at` |
| 7 | 離線暫存後同步 | O | 離線寫入排隊，上線自動送；衝突顯示「以邊個為準」 |
| 8 | 跨支部睇 | M（受控） | 預設拒絕；提供支部授權＋接收支部接受指定資料後，後端按 grant 限定讀取 |
| 9 | 相片／附件 | X | 2.0 唔做（storage 成本＋私隱） |
| 10 | 自動計「進度百分比」 | X | 進度／BADGE 係 `TRP-05` 嘅責任，BOOK 只記事實 |

### 3.2 `config` 差異表（**未核實，開工前要對照 4 個舊 repo**）
| config | 特別欄位／分類（推測） | 來源 repo |
|---|---|---|
| `cubs` 幼童軍 | 金紫荊章相關項目；小隊（六人小隊） | `CUBSBOOK` |
| `scout` 童軍 | 訓練段（標準／高級／艇長？）；Patrol | `SCOUTBOOK` |
| `vs` 深資 | 服務時數、活動計劃 | `VSBOOK` |
| `rover` 樂行 | 服務／項目式紀錄 | `ROVERBOOK` |

> ⚠️ 上表**係由 repo 名推測**。4 個舊 repo 嘅**實際表結構／欄位我未睇過**。M5 開工前必須做 §12 嘅 schema 對照，呢張表要按實情改。

## 4. 權限
| Scope | 邊個有 | 影響 |
|---|---|---|
| `book:<branch>:read` | 該支部 leader／member；owner／admin | 睇該支部紀錄 |
| `book:<branch>:write` | 該支部 leader；owner | 寫／改／簽核 |

> `<branch>` ∈ `cubs|scout|vs|rover`。**唔准**用 `book:read` 呢種無支部嘅 scope。跨支部另由雙方同意嘅 grant 限定資料類別／接收支部；唔可以靠通用 `admin` scope 放行。
> 成員只讀**自己**一列：呢個係**後端**判斷（`memberships` + 成員對應），唔係前端過濾。跨支部 grant 只開指定 data category，不會自動授予該支部整份 BOOK 或成員名單。

## 5. 入口與路由
- 入口：APP STORE `?app=book`（預設去自己支部嘅 config）
- 路由：`/`（自己支部名單）、`/m/<member>`（個人）、`/batch`（批量簽核）、`/export`
- 分享／QR：**一律 APP STORE 深層連結** `?app=book`；唔准帶成員 ID 落 URL（私隱）
- 票：`?t=` 60 秒 → verify → 自己 cookie（8 小時）

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | Supabase（**一張表、`unit_type` 分支部**，唔准每支部一張） |
| 表 | `book_records(id, unit_type, unit_id, member_ref, category, item, awarded_on, note, created_by, updated_by, updated_at)`；`branch_data_grants`（共享授權記錄；實際共用表由 M5 identity/API spec 定義）；`book_members`（若唔用中央 `memberships`） |
| 容量 | 4 支部 × 約 30 人 × 約 80 條 ≈ **1 萬行**（極細） |
| 保留 | 永久（童軍紀錄有紀念價值）；刪除只軟刪 |
| 敏感度 | **high**（未成年人資料＋考核紀錄）→ 必須後端 + RLS |

## 7. 與其他系統接口
| 對象 | 方向 | 內容 |
|---|---|---|
| `PLAT-02` 身份 | 收 | 票（`sub`／`units`／`scopes`） |
| `TRP-02` 支部 portal | 互相 | portal 顯示「BOOK 摘要」；BOOK 唔自己維護成員名單 |
| `TRP-05` BADGE／進度 | 發 | 紀錄 BOOK 事實供進度判定，並參照已達成項目做徽章審核 |
| `PLAT-03` ADMIN | 收 | 匯出／停用開關 |

## 8. 離線與 PWA
- SW 策略：app-shell cache-first；資料 network-first 但寫入排隊（IndexedDB）
- 離線可做：睇已載入名單、暫存簽核
- 離線唔可做：批量跨 20 人以上嘅新查詢、匯出

## 9. 失敗模式
| 情況 | 行為 |
|---|---|
| 驗票失敗 | 回 APP STORE `/login?next=/app/book`（fail-closed） |
| 讀政策失敗 | 用 `registered`（fail-closed） |
| 寫入衝突（兩人同時改） | 顯示兩版差異，**唔准**靜默覆蓋 |
| 離線寫入未同步就登出 | 明確警告「有 N 條未送出」 |
| DB 掛 | 唯讀（用 cache），寫入停用 |

## 10. 體積預算
- 首屏 ≤ 200KB（gzip）／總 ≤ 1MB；**冇圖片**（頭像唔做）

## 11. 驗收（真機；**每個 config 各驗一次**）
每個 config（`cubs`／`scout`／`vs`／`rover`）都要做：
- [ ] iPhone Safari 390px／Android Chrome：名單開得到、唔爆版
- [ ] 未登入直打 `/book` → 去登入，**見唔到任何名字**
- [ ] member 帳戶 → 只見到自己一列；用 URL 改 `<member>` → 403
- [ ] 跨支部無 grant：cubs leader 讀 scout → 403 且入審計
- [ ] 雙方同意 grant：只可讀 grant 指定資料類別／接收支部；撤回任一方同意後即 403
- [ ] TRP-01 旅長／副旅長／管理員切換所屬旅支部：只可查看該支部允許範圍，不能跨旅
- [ ] 第二部機登入 → 第一部 ≤60 秒被踢
- [ ] 離線簽核 → 上線自動同步；衝突有提示
- [ ] 加入主畫面 → 仍要驗票（MG7）
- [ ] 中英切換、圖標 9 檔、`© SCOUT SYSTEM`、雙版號、`noindex`
- [ ] 用 member 帳戶直接打 REST 讀別人 `book_records` → 失敗（RLS）
- [ ] 匯出 CSV 只包自己支部；有時間戳

## 12. 版號與遷移（4 → 1）
| 項 | 內容 |
|---|---|
| 舊 App | `CUBSBOOK`、`SCOUTBOOK`、`VSBOOK`、`ROVERBOOK`（各自獨立，格式唔同） |
| **schema 對照（開工前必做）** | 4 個 repo 逐個列：表名／欄位／型別／資料量／有無軟刪；輸出「差異表」入本節 |
| 舊資料 | 逐 config 搬；**搬完抽 5 個樣本對數**（人／項目／日期） |
| 舊網址 | 302 → `?app=book`（保留 90 日） |
| 切換 | 先 `cubs` config pilot（你主場）→ 其餘 3 個 |
| 回滾 | 舊 4 個 deployment 保留 90 日；新表可獨立 drop |

### 12.1 我而家知同唔知
| 我知 | 我唔知 |
|---|---|
| 有 4 個 repo，名對應 4 個支部 | 4 個 repo 嘅**實際資料表結構**（未睇 code） |
| 都要「記人 × 記項目 × 記日期」 | 各支部嘅**分類清單**有冇官方標準（你可能有紙本） |
| 小童軍冇 BOOK | `cubs` 同 `scout` 嘅**考核項目**差異幾大 |

## 13. 未做／限制（誠實）
- 未做：相片／附件、家長簽核、列印 PDF。
- 限制：離線衝突用「人手揀邊個為準」，冇自動 merge。
- 限制：**4 個舊 repo 我未睇 code**，§3.2 表格係推測。
- 唔做：自動計進度（屬 `TRP-05`）。

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿（**合併族示範**：4 repo → 1 App、config 差異、schema 對照未做） |
