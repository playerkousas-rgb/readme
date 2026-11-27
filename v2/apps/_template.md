# `v2/apps/_template.md` — 空白模板（結構唔准改）

> 用法：**複製下面 `---` 之間嘅全部內容** → 改名為 `v2/apps/<slug>.md` → 逐節填。
> 規則：14 節全填；唔適用寫「不適用：原因」；**唔准刪節、唔准留空、唔准改節名**。
> 規範來源：[`../02-APP-SPEC.md`](../02-APP-SPEC.md)｜編號：[`../03-CATALOG.md`](../03-CATALOG.md)｜次序：[`../04-BUILD-ORDER.md`](../04-BUILD-ORDER.md)

---

```markdown
---
id: TOOL-012                  # 由 03-CATALOG 分配；唔准自創
slug: knotmaster              # = ?app=；細楷 ASCII、a-z0-9-
name_zh: 繩結大師
name_en: Knot Master
layer: L3                     # L0 | L1 | L2 | L3 | L4 | L5 | L6 | L7
category: 技能工具            # 見 03-CATALOG §2
status: planned               # planned | building | pilot | live | retired
version: v2.0.0               # App 自己版號（雙版號：檔名＋內文）
repo: knotmaster              # 現有 repo 名／新 repo 名
url: https://knotmaster.vercel.app
gate: soft                    # hard（有後端）| soft（純靜態）| none（唔需要）
auth_required: true           # 需登入時 true；登入來源見 identity_mode
identity_mode: central        # central | local | none
backend_operator: platform   # platform | district | troop | third_party
session_policy: central_single_device # central_single_device | local_multi_device | none
scopes: [tool:knot:read]      # 見 02-APP-SPEC §4；唔准自創
storage: local                # none | local | supabase | gas
offline: true
pwa: true
i18n: [zh-Hant, en]
audience: both                # member | leader | both | public
data_sensitivity: low         # low | medium | high；high 唔准用 Canvas／軟閘
merged_from: []               # 合併族用：例 [CUBSBOOK, SCOUTBOOK, VSBOOK, ROVERBOOK]
configs: []                   # 合併族用：例 [cubs, scout, vs, rover]
---

## 1. 一句目的
（20–40 字。用戶做乜、解決乜問題。唔准寫「提升用戶體驗」呢類空話。）

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
|  |  |  |  |

## 3. 功能（M＝必需／O＝可選／X＝明確唔做）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 |  |  |  |

## 4. 權限（scope → 睇得到／做得到）
身份來源：`central`（PLAT-02）／`local`（系統自管）。Local 系統自行管理帳戶及裝置/session；唔套中央一機限制。敏感資料由後端逐次驗權。
| Scope | 邊個有 | 影響 |
|---|---|---|
|  |  |  |
> scope 命名：`<領域>:<對象>:<動作>`；新 scope 要先入 `02-APP-SPEC` §4 同 `03-CATALOG` 登記。

## 5. 入口與路由
- 入口：APP STORE `?app=<slug>`（catalog 有 local exception 時，登入交由責任系統）
- App 內路由：
- `central`：60 秒票 → verify → App 自己 session；`local`：責任系統後端登入／驗權，同帳戶允許多裝置，不做新機踢舊機
- 分享／QR：按 SG9 使用 APP STORE 深層連結；任何模式都唔准前端假裝有權限

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 |  |
| 表 |  |
| 容量 |  |
| 保留 |  |
| 敏感度 |  |

## 7. 與其他系統接口
| 對象 | 方向 | 內容 |
|---|---|---|
| 身份來源 | 收 | central（PLAT-02 claims）或 local（責任系統 session/API）；local 不得單機踢舊 session |

## 8. 離線與 PWA
- SW 策略：
- 離線可做：
- 離線唔可做：

## 9. 失敗模式（fail-closed 定 fail-soft）
| 情況 | 行為 |
|---|---|
| 驗票失敗 |  |
| 讀政策失敗 |  |
| 離線 |  |

## 10. 體積預算（S1／S7）
- 首屏 ≤ 200KB（gzip）／總 ≤ 1MB
- 圖片：≤ 3 張、每張 ≤ 120KB、轉 WebP／AVIF

## 11. 驗收（真機；每條都要做過才剔）
- [ ] iPhone Safari 390px：開得到、唔爆版
- [ ] Android Chrome：同上
- [ ] 未登入直打網址 → `central` 轉中央登入；`local` 轉責任系統登入；`none` 只顯示公開內容；任何模式都**見唔到底層未授權內容**
- [ ] `central_single_device`：第二部機登入同一帳戶 → 第一部 ≤60 秒被踢；`local_multi_device`：同一帳戶可多裝置登入；驗收 session 到期／登出
- [ ] 離線（飛行模式）→ 開得到
- [ ] 加入主畫面 → 開 icon 仍按 `identity_mode` 驗證（central 驗票／local 本地驗證；MG7 唔准 standalone 放行）
- [ ] 中英切換（L1–L6）
- [ ] 圖標 9 檔（G11）、`© SCOUT SYSTEM`、雙版號（V1）
- [ ] `noindex` 生效

## 12. 版號與遷移（1.0 → 2.0）
| 項 | 內容 |
|---|---|
| 舊 App |  |
| 舊資料 |  |
| 切換 |  |
| 回滾 |  |

## 13. 未做／限制（誠實）
- 未實作：
- 限制：
- 唔做：

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿 |
```

---

## 合併族額外要寫嘅（`configs` 非空時）

| 節 | 額外要求 |
|---|---|
| §3 | 加「`config` 差異表」 |
| §4 | scope 用 `book:<branch>:read` 呢種（支部名放中間） |
| §6 | **一張表**、用 `unit_type` 分開；唔准每支部一張表 |
| §11 | **每個 config 各驗一次** |
| §12 | 舊 App 資料來源逐個列，搬完抽 5 個樣本對數 |

**硬規矩**：一套 code、一份 spec、一份測試；差異集中喺 `BRANCH_CONFIG`，唔准散落 20 個 `if (branch === ...)`。
