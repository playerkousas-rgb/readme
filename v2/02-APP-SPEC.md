# v2.0 — App 規劃書規格（每個 App 一份，Agent 只讀自己嗰份）

> **用途**：2.0 每個 App **開工之前**必須有 `v2/apps/<slug>.md`，用下面同一個格式。目的有三個：① 你一眼睇到個 App 做乜、幾時得；② Agent 唔會自己發明需求；③ 68 個 App 唔會各自一套。
> **規則**：格式**唔准改**（可以加附錄，唔可以刪節）。14 節全部要填；唔適用就寫「不適用：原因」，**唔准留空**。
> 分類代號／App 編號：見 [03-CATALOG](03-CATALOG.md)。重建次序：見 [04-BUILD-ORDER](04-BUILD-ORDER.md)。

---

## 1. 檔案位置同命名

```
v2/apps/<slug>.md          # 一個 App 一份，slug 同 ?app=<slug> 一致
v2/apps/_template.md       # 空白模板（唔准改結構）
```

- `<slug>`：細楷 ASCII、`a-z0-9-`、2–40 字（同 SG9 分享連結一致）。
- **一個 App 一份**；合併族（例 `book`）都係**一份**，唔係 4 份（用 config 區分支部）。

---

## 2. 模板（照抄，改內容）

```markdown
---
id: TOOL-012                  # 由 03-CATALOG 分配；唔准自創
slug: knotmaster              # = ?app=；細楷 ASCII
name_zh: 繩結大師
name_en: Knot Master
layer: L3                     # L0 | L1 | L2 | L3 | L4 | L5 | L6 | L7
category: 技能工具            # 見 03-CATALOG §2 分類表
status: planned               # planned | building | pilot | live | retired
version: v2.0.0               # App 自己版號（雙版號：檔名＋內文）
repo: knotmaster              # 現有 repo 名／新 repo 名
url: https://knotmaster.vercel.app
gate: soft                    # hard（有後端）| soft（純靜態）| none（唔需要）
auth_required: true           # 需登入時 true；登入來源見 identity_mode
identity_mode: central        # central (PLAT-02) | local (系統自管後端/帳戶) | none
backend_operator: platform   # platform | district | troop | third_party
session_policy: central_single_device # central_single_device | local_multi_device | none
scopes: [tool:knot:read]      # 需要的 scope；見 §4
storage: local                # none | local | supabase | gas
offline: true
pwa: true
i18n: [zh-Hant, en]
audience: both                # member | leader | both | public
data_sensitivity: low         # low | medium | high；high 唔准用 Canvas／軟閘
merged_from: []               # 例 book: [CUBSBOOK, SCOUTBOOK, VSBOOK, ROVERBOOK]
---

## 1. 一句目的
（20–40 字。用戶做乜、解決乜問題。唔准寫「提升用戶體驗」呢類空話。）

## 2. 用戶同場景
| 用戶 | 幾時用 | 用幾耐 | 成功係點 |
|---|---|---|---|
| 例：支部領袖 | 集會前 | 2 分鐘 | 3 次點擊內查到繩結步驟 |

## 3. 功能（M＝必需／O＝可選／X＝明確唔做）
| # | 功能 | M/O/X | 驗收一句 |
|:--:|---|:--:|---|
| 1 | 繩結分類瀏覽 | M | 離線都開得到 |
| 2 | 步驟動畫 | M | 390px 寬唔爆版 |
| 3 | 收藏 | O | 存本機，唔使登入都記住 |
| 4 | 分享 | X | 2.0 唔做（避免漏資料） |

## 4. 權限（scope → 睇得到／做得到）

**身份／後端邊界（frontmatter 必填）**：每份 spec 要填 `identity_mode`、`backend_operator`、`session_policy`。`central` 由 `PLAT-02` 發票並受中央 1 部機限制；`local` 由責任系統自管登入／帳戶/session，但採 `local_multi_device`（同帳戶可多裝置，不做新機踢舊機），唔可以假設接入中央身份。前端只持有短效 session/token，不得內藏後端密鑰；敏感資料每次由所屬後端驗權。
| Scope | 邊個有 | 影響 |
|---|---|---|
| `tool:knot:read` | 所有已登入 | 睇全部繩結 |
| `tool:knot:write` | leader、admin、owner | 新增／編輯繩結 |
> scope 命名：`<領域>:<對象>:<動作>`（read/write/admin）。**唔准自創**；新 scope 要喺本節列出並喺 03-CATALOG 登記。

## 5. 入口與路由
- 唯一入口：APP STORE `?app=knotmaster`
- App 內路由：`/`（列表）`/knot/<id>`
- 分享／QR：**一律指 APP STORE 深層連結**，唔准用子站網址
- `central` 票：`?t=<60 秒票>` → 驗票 → 種自己 cookie；`local` 由責任系統後端登入，唔接中央票

## 6. 資料
| 項 | 內容 |
|---|---|
| 存放 | 本機 `localStorage`（收藏）／無後端 |
| 表 | 不適用（無 DB） |
| 容量 | < 50KB |
| 保留 | 直到用戶清除 |
| 敏感度 | low（無個人資料） |

## 7. 與其他系統接口
| 對象 | 方向 | 內容 |
|---|---|---|
| L0 身份 | 收 | 票（`sub`／`scopes`） |
| 其他 | 無 | — |

## 8. 離線與 PWA
- SW 策略：cache-first（靜態資源）
- 離線可做：睇步驟、收藏
- 離線唔可做：無（本 App 無後端）

## 9. 失敗模式（fail-closed 定 fail-soft）
| 情況 | 行為 |
|---|---|
| 中央驗票失敗 | 轉去 APP STORE 登入（fail-closed）；local auth 失敗由責任系統處理（fail-closed） |
| 讀政策失敗 | 用本機 default `entry-gate`（fail-soft） |
| 離線 | 照用（本 App 唔需要網絡） |

## 10. 體積預算（S1／S7）
- 首屏 ≤ 200KB（gzip）／總 ≤ 1MB
- 圖片：≤ 3 張、每張 ≤ 120KB、轉 WebP／AVIF

## 11. 驗收（真機；每條都要做過才剔）
- [ ] iPhone Safari 390px：開得到、唔爆版
- [ ] Android Chrome：同上
- [ ] 未登入直打網址 → 按 `identity_mode` 去中央或本地登入；**未授權見唔到底層內容**
- [ ] `central_single_device`：第二部機登入同一帳戶 → 第一部 ≤60 秒被踢；`local_multi_device`：同一帳戶可同時多裝置登入，登出／session 到期仍正常
- [ ] 離線（飛行模式）→ 開得到列表
- [ ] 加入主畫面 → 開 icon 仍按 `identity_mode` 驗證（MG7：唔准 standalone 放行）
- [ ] 中英切換（L1–L6）
- [ ] 圖標 9 檔（G11）、`© SCOUT SYSTEM`、雙版號（V1）
- [ ] `noindex` 生效

## 12. 版號與遷移（1.0 → 2.0）
| 項 | 內容 |
|---|---|
| 舊 App | `knotmaster`（1.0，公開直連） |
| 舊資料 | 本機收藏 → 唔搬（低價值），或提供「匯出／匯入」 |
| 切換 | 2.0 上線後 30 日退役舊版，舊網址 302 → APP STORE `?app=knotmaster` |
| 回滾 | 保留舊 deployment 30 日 |

## 13. 未做／限制（誠實）
- 未實作：本文件只係規劃。
- 限制：純靜態 → 只做得到軟閘（識開 DevTools 就繞得過）。
- 唔做：分享功能（見 §3 X）。

## 14. 變更紀錄
| 日期 | 版號 | 改乜 |
|---|---|---|
| 2026-11-26 | 規劃 v1 | 初稿 |
```

---

## 3. 合併族（一個 App、多個支部）點寫

用 `book` 做例：**一份 spec**，但功課要分「共通」同「支部差異」。

```yaml
id: TRP-04
slug: book
merged_from: [CUBSBOOK, SCOUTBOOK, VSBOOK, ROVERBOOK]
configs: [cubs, scout, vs, rover]     # 小童軍冇 BOOK（見 00-OVERVIEW §3）
```

| 節 | 合併族要額外寫 |
|---|---|
| §3 功能 | 分「共通功能」＋「`config` 差異表」（例：幼童軍有「金紫荊章」、深資有「服務時數」） |
| §4 權限 | scope 用 `book:cubs:read` 呢種（**支部名放中間**） |
| §6 資料 | 一張表、`unit_type` 分開；**唔准**每支部一張表 |
| §11 驗收 | 每個 config 各驗一次（唔係驗一個當全部） |
| §12 遷移 | 4 個舊 App 嘅資料來源逐個列；搬完抽 5 個樣本對數 |

**合併族嘅硬規矩（唔准破）**：
1. **一套 code、一份 spec、一份測試**；差異只可以喺 `config` 同少量 `feature flag`。
2. 唔准 `if (branch === 'cubs')` 散落 20 處；要集中一張 `BRANCH_CONFIG`。
3. 一個 config 壞 = 全部壞，所以 §11 要逐 config 驗，而且上線前要有一個支部做 pilot。

---

## 4. scope 對照表（2.0 起手，唔准自創）

| 領域 | Scope | 意思 |
|---|---|---|
| 平台 | `apps:read` | 睇目錄（所有已登入都有） |
| 平台 | `apps:prefs:write` | 改自己版面（擺位／分類／隱藏） |
| 平台 | `apps:policy:write` | 改 App 政策（只 owner） |
| 帳戶 | `members:all:write` | 中央 ADMIN 開戶／帳戶生命週期操作（只 owner；符合「你開戶、你通知」） |
| BOOK | `book:<branch>:read` / `write` | 睇／寫自己支部紀錄冊 |
| BADGE／進度 | `badge:<branch>:read` / `write` | 睇／寫 BADGE 及進度（同一功能，不另設 progress scope） |
| 集會 | `meeting:<branch>:read` / `write` | 睇／寫集會 |
| 點名 | `attendance:<branch>:write` | 點名 |
| 通告 | `notice:read` / `notice:write` | 睇／發通告 |
| 工具 | `tool:<slug>:read` / `write` | 個別工具 |

> 新 scope 一定要先入呢張表（同 `03-CATALOG` 登記），然後才可以用。

---

## 5. Agent 開工前自檢（10 條，缺一唔准開始）

- [ ] 我讀嘅係 `v2/apps/<slug>.md`，**唔係**舊 repo 嘅 README
- [ ] `id`／`slug`／`layer`／`category` 同 [03-CATALOG](03-CATALOG.md) 一致（唔准改名）
- [ ] §3 每個 M 功能都有「驗收一句」
- [ ] §4 用嘅 scope **全部**喺 §4 對照表出現過
- [ ] §5 入口係 APP STORE，分享連結**冇**用子站網址
- [ ] §6 有寫容量／保留／敏感度；`high` 就唔准用 Canvas 或軟閘
- [ ] §9 有寫中央驗票／本地 auth 失敗及讀政策失敗
- [ ] §10 有體積預算（S1／S7）
- [ ] §11 真機清單包含：未登入被擋、第二部機被踢、離線、PWA、雙語
- [ ] §13 有誠實限制（唔准寫「理論上應該 work」）

---

## 6. 交付格式（App 做完要交乜）

| 交 | 內容 |
|---|---|
| 1 | `v2/apps/<slug>.md` 更新（status → `pilot`／`live`，version 升） |
| 2 | 截圖：390px（iPhone）、390px（Android）、離線狀態、被踢畫面 |
| 3 | 真機驗收逐條剔（§11）＋實測日期／裝置型號 |
| 4 | 舊 App 處置：退役日期、舊網址 302 去向 |
| 5 | 資料搬遷對數（如有）：舊 vs 新，樣本 5 個 |
