# v2.0 — 分類目錄（App 編號、合併去向、待確認）

> **呢份係 2.0 嘅「貨架」**：每個 App 有固定編號，你同 Agent 都用同一個號講嘢。
> **逐個 repo 對照（可篩可排）**：[`../docs/readme-2.0-inventory.csv`](../docs/readme-2.0-inventory.csv)
> **一頁數字**：91 個 public repo → **約 70 個 2.0 App**（26 個 repo 合併成 9 個 App、1 個退役）＋ 2 個全新（身份核心、ADMIN）。

---

## 0. 一頁數字

| 層 | App 數（2.0） | 來源 repo | 狀態 |
|:--:|:--:|:--:|---|
| L0 平台 | **4** | 2 個現有 + 2 個全新 | PLAT-01/04 重建；PLAT-02/03 新增 |
| L1 中央生態 | **5–6** | 9 個 repo（含 2 個子模組、1 個退役、1 個待確認） | 逐個重建 |
| L2 旅團生態 | **5** | 16 個 repo | 全部合併／重建 |
| L3 工具 | **46** | 53 個 repo | 重建 / 合併 / 待確認 |
| L4 內容素材 | **3** | 3 個 repo | 重建 |
| L5 基礎設施 | **6** | 7 個 repo | 重建 / 待確認 |
| L6 AI | **1** | GEMINI（private） | 定位：輔助工具，無保護 |
| L7 治理 | **1** | `readme` | 2.0 規格包 |

---

## 1. 編號規則（唔准自創）

| 層 | 前綴 | 例子 | 意思 |
|:--:|---|---|---|
| L0 | `PLAT-` | `PLAT-01` | 平台部件（4 件） |
| L1 | `CEN-` | `CEN-02` | 中央生態系統 |
| L2 | `TRP-` | `TRP-04` | 旅團生態 |
| L3 | `TOOL-` | `TOOL-002` | 工具（後面有段位，見 §2） |
| L4 | `CONTENT-` | `CONTENT-01` | 內容與素材 |
| L5 | `INFRA-` | `INFRA-01` | 基礎設施 |
| L6 | `AI-` | `AI-01` | AI |
| L7 | `GOV-` | `GOV-01` | 治理 |

- **子模組**加細楷後綴：`CEN-01a`（區系統內嘅區徽章）。
- **號碼一經分配，永唔重用**（退役都保留號，標 `retired`）。
- 段位只可以往後加，唔可以插隊（同 docs 命名規則一致）。

---

## 2. L3 工具段位（每段 10 個號，方便分類）

| 段 | 範圍 | 內容 | 現有 |
|:--:|---|---|---|
| 001–009 | 童軍技能 | 繩結、先鋒、追蹤符號、求生 | 001 航空圖鑑＊、002 繩結、003 先鋒、013 追蹤符號、014 求生 tin |
| 011–019 | 知識／計劃 | AYP、津貼／獎勵、其他證書 | 011 AYP、012 BP（待確認）… |
| 020–029 | 地圖／戶外 | 地圖、營地、定向、路線、圖鑑 | 020 鳥類圖鑑（合併 3→1）、021 畫路線、022 營地、023 地圖、024 HM20C、025 3D 地圖、026 定向、027 3D 工具、028 童軍世界 |
| 030–039 | 創作／圖像 | 圖卡、紙公仔、禪繞、鏡像 | 030–034 |
| 040–049 | 通訊／密碼 | 解碼、摩斯、電碼 | 040–043 |
| 050–059 | 遊戲 | 幼童軍遊戲、小遊戲、線上遊戲 | 050–053 |
| 060–069 | 活動／集會 | **集會（合併 5→1）**、計分、雷達、相機、典禮 | 060–065 |
| 070–079 | 媒體／設計 | 圖標、相片、設計、簡報、影片 | 070–076 |

> ＊`TOOL-001` 本應係「童軍技能」段，但航空圖鑑係最早嘅成品，保留 001 做「旗艦示範」，唔搬號（搬號會壞連結同記憶）。

---

## 3. 合併表（你重建時最抵做嘅一步）

| 目標 App | 由邊幾個 repo 合併 | repo 數 | 慳 | 理由 |
|---|---|:--:|:--:|---|
| `TRP-02` 支部 portal | gh／cubs／sc／vs／rs_portal | 5 → 1 | −4 | 同一套版面，只差支部名同功能開關 |
| `TRP-04` BOOK | CUBSBOOK／SCOUTBOOK／VSBOOK／ROVERBOOK | 4 → 1 | −3 | 同一套資料結構（要 schema 對照） |
| `TRP-05` 徽章 | cubs／scout／vs／roverbadge | 4 → 1 | −3 | 同上 |
| `TRP-01` 旅系統 | troop-portal／troop_portal／troop-attendance | 3 → 1 | −2 | 點名係旅系統一頁 |
| `TOOL-060` 集會 | gh／cubs／scout／vs／rsmeeting | 5 → 1 | −4 | 你話做得唔好要重做；分 5 份＝同一個 bug 修 5 次 |
| `TOOL-020` 鳥類圖鑑 | AvianDex／birddex3（＋skw-birdex2 未部署） | 2–3 → 1 | −2 | 同一份資料 |
| `CEN-01a` 區徽章 | dbs3.0 → 併入 CEN-01 | 1 | −1 | 區系統一個模組 |
| `CEN-04a` 證書 | CERT → 併入 CEN-04 | 1 | −1 | 訓練班一個模組 |
| `INFRA-02` 轉駁器 | router／troop-router | 2 → 1 | −1 | 同一功能 |
| **合計** | **26 個 repo → 9 個 App** | | **−21** | |

**唔合併（保持獨立）**：`photo-edit`／`Photo-Prep`／`Icon-Maker`（用途唔同）、`GAME`／`minigame`／`CUBSGAME`（客群唔同）、所有 L1 系統（責任邊界唔同）。

> ⚠️ **合併前必須做 schema 對照**（4 本 BOOK、4 個徽章、5 個 portal 嘅資料表／儲存鍵）。冇對照就合併＝搬錯資料。呢步我未做。

---

## 4. 各層清單

### L0 平台（4 件）

| 編號 | 名稱 | 現時 | 動作 | 備註 |
|:--:|---|---|:--:|---|
| `PLAT-01` | APP STORE 殼（唯一入口／目錄／搜尋／我的最愛／自訂版面） | `website` | 重建 | 一次上架＋用戶自訂 |
| `PLAT-02` | 身份核心（開戶、登入、票、1 部機） | — | **新增** | 寄生 `PLAT-01` 的 `/login`、`/api/ticket` |
| `PLAT-03` | ADMIN（開戶、政策、回報、審計） | — | **新增** | 寄生 `PLAT-01` 的 `/admin` |
| `PLAT-04` | 通告中心（要登入）＋ Push | `scout-circulars` | 重建 | 訂閱要綁 `member_id`；通知 link 指 APP STORE |

### L1 中央生態（5 個系統；子模組唔另立門戶）

| 編號 | 名稱 | 現時 | 動作 |
|:--:|---|---|:--:|
| `CEN-01` | 區系統（＋`CEN-01a` 區徽章） | `scout-district-portal`、`dbs3.0` | 重建（`dbs` 退役） |
| `CEN-02` | 服務平台（成員系統） | `member-portal` | 重建 |
| `CEN-03` | 管理系統 | `scout-admin` | 重建（**範圍待你確認**） |
| `CEN-04` | 訓練班系統（＋`CEN-04a` 證書） | `course`、`CERT` | 重建 |
| `CEN-05` | 專章秘書系統 | `BadgeHouse` | 重建（**待你確認**） |
| `CEN-06` | 徽章／專章內容平台？ | `scoutapp`（Flask） | **待確認**（可能併入 CEN-05 或 L4） |

### L2 旅團生態（5 個 App）

| 編號 | 名稱 | 現時 | 動作 |
|:--:|---|---|:--:|
| `TRP-01` | 旅系統（含點名） | `troop-portal`、`troop_portal`、`troop-attendance` | 合併重建 |
| `TRP-02` | 支部 portal（5 config：gh／cubs／scout／vs／rs） | 5 個 `*_portal` | 合併重建 |
| `TRP-03` | 進度（4 config：cubs／scout／vs／rs） | **⚠️ 91 個 public repo 搵唔到**（見 §6） | 重建（來源待確認） |
| `TRP-04` | 紀錄冊 BOOK（4 config） | 4 本 BOOK | 合併重建 |
| `TRP-05` | 徽章（4 config） | 4 個 `*badge` | 合併重建 |

### L3 工具（46 個編號；逐個見 CSV）

- **已定、要重建（25 個）**：TOOL-001/002/003/011/013/014/020/021/022/023/024/025/026/027/028/034/041/042/043/050/051/052/060/062/063/064/070/071/072/073/074/075（逐個名見 CSV）
- **待確認（13 個）**：TOOL-012/016/017/018/019/030/031/032/033/040/053/061/065/076（見 §5）
- **合併入其他**：`TOOL-060` 集會（5→1）、`TOOL-020` 鳥類圖鑑（2–3→1）

### L4 內容素材（3）

| 編號 | 名稱 | 現時 | 動作 |
|:--:|---|---|:--:|
| `CONTENT-01` | 素材庫 | `Materials` | 重建 |
| `CONTENT-02` | PPT 產生 | `PPTMAKER` | 重建 |
| `CONTENT-03` | 文件／Markdown | `MD` | 待確認 |
> 圖卡／PPT／連結嘅**內容本身**喺 `PLAT-01` 嘅 `pages`／`categories`，唔另立 App。

### L5 基礎設施（6）

| 編號 | 名稱 | 現時 | 動作 |
|:--:|---|---|:--:|
| `INFRA-01` | API 代理（`/api/proxy`） | `api` | 重建 |
| `INFRA-02` | 轉駁器（短連結／跳轉） | `router`、`troop-router` | 合併重建 |
| `INFRA-03` | Agent 指令／共用設定 | `AGENT` | 重建 |
| `INFRA-04` | 待確認（Python） | `answer` | 待確認 |
| `INFRA-05` | Git 連結工具 | `gitlink` | 待確認 |
| `INFRA-06` | 記帳（內部營運？） | `bookkeeping` | 待確認 |
> **2.0 新增（未有 repo）**：備份、監控、成本睇板、測試環境 → 併入 `INFRA-03` 或 `PLAT-03`，唔另立 App。

### L6 / L7

| 編號 | 名稱 | 說明 |
|:--:|---|---|
| `AI-01` | GEMINI（統合輔助平台） | Canvas 類，**分享即漏**；唔做入口、唔放機密（[00-OVERVIEW](00-OVERVIEW.md) §5） |
| `GOV-01` | 真理倉 `readme` | 2.0 規格包、模板、審計 |

---

## 5. 待確認 21 個（我唔知你係咪仲要；逐個答「要／唔要／叫乜」）

| repo | 編號 | 我嘅猜測 | 一句問法 |
|---|---|---|---|
| `BP` | TOOL-012 | Baden-Powell／步操？ | 呢個係做乜？ |
| `DGA` | TOOL-016 | ？ | 縮寫代表乜？ |
| `forward` | TOOL-017 | 先鋒工程（同 pioneer 重複？） | 同 `pioneer` 有咩分別？ |
| `upgrade` | TOOL-018 | 升級／轉換工具？ | 做乜嘅？ |
| `Veritas`／`Veritas-Project`／`veritas2` | TOOL-019 | 三個同名系列 | 邊個係現行？另外兩個退役？ |
| `card`／`cardmaster` | TOOL-030/031 | 圖卡／圖卡製作 | 兩個都要，定合併？ |
| `doll` | TOOL-032 | 紙公仔 | 仲要嗎？ |
| `mirror` | TOOL-033 | 對稱繪圖 | 仲要嗎？ |
| `code` | TOOL-040 | 編碼工具 | 同 `decode`／`MCScript` 重複？ |
| `onlinegame` | TOOL-053 | 線上遊戲 | 仲要嗎？ |
| `event` | TOOL-061 | 活動報名 | 要唔要收費？ |
| `ceremony` | TOOL-065 | 典禮流程 | 仲要嗎？ |
| `makemovie` | TOOL-076 | 影片製作 | 仲要嗎？ |
| `scoutapp` | CEN-06 | 徽章內容平台 | 併入 `CEN-05` 定獨立？ |
| `scout-admin` | CEN-03 | 管理系統 | 管啲乜？同上「ADMIN」有咩分別？ |
| `BadgeHouse` | CEN-05 | 專章秘書 | 係咪就係「專章秘書系統」？ |
| `course`／`CERT` | CEN-04/04a | 訓練班＋證書 | 證書併入訓練班 OK？ |
| `answer` | INFRA-04 | ？ | 做乜？ |
| `gitlink` | INFRA-05 | Git 工具 | 仲要嗎？ |
| `bookkeeping` | INFRA-06 | 記帳 | 係你私人記帳定童軍用？ |
| `MD` | CONTENT-03 | 文件工具 | 併入內容素材？ |

> 呢 21 個**唔會阻住開工**：M1（身份＋APP STORE）同佢哋無關。可以一路做一路答。

---

## 6. ⚠️ 進度追蹤 ×4：我搵唔到對應 repo

你講「進度追蹤系統（4 支部）」，但 91 個 public repo 裏面**冇**明顯嘅進度 repo。可能係：

1. **Google Apps Script（GAS）** 做後端（docs/07／58 講嘅「進度 leaf」）；
2. **private repo**（同 GEMINI 一樣，API 讀唔到）；
3. 藏喺 5 個支部 portal 裏面（唔係獨立 App）。

**要你答**：進度係 (a) GAS 做的？(b) private repo？(c) 支部 portal 內一頁？
**影響**：如果係 GAS，`TRP-03` 嘅 2.0 重建要決定「繼續 GAS（Sheet 當 DB）」定「搬去 Supabase」。呢個決定會影響 4 個支部嘅資料遷移。

---

## 7. APP STORE 目錄 metadata（驅動「用戶自訂版面」）

`PLAT-01` 嘅 `apps` 表 2.0 欄位（每個 App 上架要填齊）：

| 欄 | 例 | 用途 |
|---|---|---|
| `slug` | `knotmaster` | `?app=` 唯一鍵 |
| `app_id` | `TOOL-002` | 對應本目錄 |
| `name_zh`／`name_en` | 繩結／Knots | 雙語顯示 |
| `layer`／`category` | L3／技能工具 | 分類、篩選 |
| `icon` | `/icons/knot.svg` | 目錄卡 |
| `desc_zh`／`desc_en` | 一句 | 目錄卡 |
| `access_mode` | `entry-gate` | 政策（[docs/62](../docs/62-one-control-plane-for-all-apps.md)） |
| `scopes` | `tool:knot:read` | 邊個見到 |
| `default_groups` | `["常用","訓練"]` | 預設分類 |
| `default_visible` | `true` | 預設要唔要（用戶可改） |
| `pilot_units` | `["cubs-21"]` | 灰度：先只見某單位 |
| `status` | `live`／`paused`／`retired` | 停用／退役 |

**預設版面規則**（新用戶一登入見到乜）：
- `owner`／`admin`：全部
- `leader`：自己支部全套（portal／進度／BOOK／徽章／集會）＋常用工具
- `member`：自己支部（只讀）＋工具
- 一律**唔會**見到 `pilot_units` 唔包自己嘅 App

---

## 8. 新增一個 App 嘅流程（5 步，唔准跳）

1. **分配編號**：喺本目錄攞下一個未用號（段位見 §2）；退役號唔重用。
2. **寫 spec**：`v2/apps/<slug>.md` 用 [02-APP-SPEC](02-APP-SPEC.md) 模板，14 節填齊。
3. **定 scope**：用 §4 對照表嘅寫法；新 scope 先入 `02-APP-SPEC` §4。
4. **上架設定**：`apps` 表填齊 §7 欄位；先 `pilot_units` 只你自己。
5. **驗收**：[02-APP-SPEC](02-APP-SPEC.md) §11 真機逐條 ＋ §5 自檢 10 條。

---

## 9. 唔准做

- ❌ 自創編號（例 `TOOL-100` 跳段）。
- ❌ 同一個 App 兩個層（例「又係 portal 又係工具」）。
- ❌ 未寫 spec 就開工。
- ❌ 為改名而改現有 repo 名（會壞連結；用編號對照）。
- ❌ 冇 schema 對照就合併。
