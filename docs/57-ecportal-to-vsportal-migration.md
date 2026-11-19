# 57 — ecportal → VSPORTAL 交接：舊系統點退場、唔可以靜靜刪乜

> **2026-11-19 用戶指示**：「ECPORTAL 已經是舊的了，新的是 VSPORTAL，所以 ECPORTAL 會刪掉了。」
> **本頁作用**：ecportal 喺呢個倉**唔係一個 app，而係一套散落 25 份檔嘅「專案案例」**（BUILD／EXTERNAL／進度追蹤／docs/18–22…）。呢頁講清楚：**今日做咩（標記）、之後做咩（換指針）、真刪嗰日要一齊改邊幾行 code**，免得刪完 CI 紅或者連 live repo 仍靠嘅知識都冇埋。
> **狀態**：階段 A 已做（見 §3）；階段 B／C **未做**，等 VSPORTAL 定案。

## 0. 實查（2026-11-19 用 `gh`，唔係靠記憶）

| 查乜 | 結果 |
|---|---|
| `playerkousas-rgb/ecportal` | **404** —— `GraphQL: Could not resolve to a Repository`。即係 GitHub 上**已經冇呢個 repo** |
| `playerkousas-rgb/vs_portal` | **存在**（public），`pushedAt` 2026-11-14，README 標題「**深資童軍管理系統**」 |
| vs_portal 架構（照 README 引述） | 每支部**自己一個 Google Sheet ＋ 一支 Unified Apps Script**；前端原生 HTML/CSS/ES Modules；身份 `member`／`exco`／`leader`／`chief`／`super`；後端按 session／role／scope 驗；BOOK 匯入**先待批、領袖確認才寫入**；支部之間**不可互連、不可存對方 URL/Key** |
| 全倉 `ecportal` 字樣 | **115 次**，分佈 25 份檔（最多：`README` 9、`BUILD` 9、`docs/18` 6、`docs/21` 5、`docs/17` 5、`docs/07` 5、`PLAYBOOK` 5、`AGENTS` 5） |
| `VSPORTAL` 字樣 | **0 次** —— 呢個倉完全未記錄新系統 |

> **一句**：舊系統喺 GitHub 已經冇咗，但**呢個倉仲當佢係「現行案例」**；新系統就一個字都未有。所以真正嘅風險唔係「刪唔切」，而係「**新系統冇入倉，舊嘅先刪 → 中間冇記錄**」。

## 1. 唔可以靜靜刪嘅知識（先睇呢節）

docs/19 自己指住 **5 個仍然存在嘅 repo**：`vsbadge`／`scoutbadge`／`cubsbadge`／`roverbadge`／`scout-circulars`。佢哋**而家仍然跑住** ecportal 時代定落嘅規矩：

| 知識 | 喺邊 | 點解唔可以跟 ecportal 一齊刪 |
|---|---|---|
| 五級階梯（ADMIN／TROOP／BRANCH／SHEET／EXTERNAL）＋可改/不可改矩陣 | `AGENTS §1–2`、`docs/19 §2` | 5 個 live repo 嘅權限邊界照住佢行；VSPORTAL README 都有同族嘅 role 階梯（`member`→`super`），但**未寫成通用規則** |
| `sig` 接駁（GAS→GAS、`ScriptProperties DOWNSTREAM_<id>_URL/_KEY/_NAME/_AT`） | `進度追蹤旅系統升級版.md`、`docs/19 §5` | 呢個係**跨 repo 契約**，唔係 ecportal 私有實作；VSPORTAL 有冇沿用**未核實** |
| `ALLOW_LOCAL_LOGIN` 開關（只接受上游 `sig` 寫入） | `AGENTS §2`、`docs/19 §6` | 同族：下游前端唔准自己加掣 |
| `UNIT_*`／`TROOP_*`／`TROOP_MODULES`／`units.json` | `BUILD §1`、`docs/19` | 屬「管理層＝團／旅」概念；VSPORTAL 係**支部**系統，旅層「未來獨立、只讀」→ 未定案 |
| 下架四齒輪 Delist→Gate→Soft→Hard、`BOOK` 豁免 | `docs/50`（**通用**，唔屬案例） | 呢啲**唔好**當 ecportal 一齊刪 |

> **判準**：見 `docs/19` 先問一句「**VSPORTAL 有冇沿用？**」有 → 搬去新案例；冇 → 標「已退役」留檔；唔清楚 → **唔好刪**。

## 2. 三階段退場

| 階段 | 做乜 | 幾時 | 誰決定 |
|---|---|---|---|
| **A 標記（已完成）** | 4 份案例檔 ＋ docs/19 加「已退役」banner；README §6／AGENTS ④ 改寫成「舊系統存檔」；本頁落地 | 2026-11-19 | 已做 |
| **B 換指針** | VSPORTAL 入倉（新案例 doc）→ `PLAYBOOK §8.1`／`README §6`／`docs/19` 標題指去新案例；舊案例變 `docs/` 嘅存檔（檔名保留，內容唔再更新） | VSPORTAL 定案後 | 用戶 |
| **C 真刪** | 照 §4 清單逐項刪＋**同步改 code**，跑 `guard`＋`npm test` 綠先 commit | ecportal 完全退役 | 用戶 |

## 3. 階段 A 已改（2026-11-19）

| 檔 | 改咗 |
|---|---|
| `BUILD.md`、`EXTERNAL.md`、`進度追蹤旅系統升級版.md`、`docs/19-ecportal-troop-case.md` | 檔頭加「**已退役（ecportal → VSPORTAL）**」banner，指返本頁 |
| `README.md` §6 標題、`AGENTS.md` ④ | 由「保留：ecportal 既有 as-built 真理」→「**舊系統存檔（已退役）**」 |
| `docs/18`／`docs/20`／`docs/21`／`docs/22` | 屬審計／修復記錄，**唔加 banner**（歷史記錄就係要保留原貌）；由本頁 §4 統一講清 |

## 4. 真刪清單（階段 C，逐項剔）

### 4.1 檔案

| 檔 | 刪咗會影響 |
|---|---|
| `BUILD.md`（ecportal 建構定案） | `guard.mjs` F16 必備檔清單、`final_check.test.mjs`、`README §6`、`AGENTS` ④ |
| `EXTERNAL.md` | 同上（`guard.mjs` L594 案例清單） |
| `進度追蹤旅系統升級版.md` | 同上；另 `docs/19 §5` 引用佢做 `sig` 來源 |
| `docs/18-as-built-gap-audit.md` | `guard.mjs` 必備檔清單（L86） |
| `docs/19-ecportal-troop-case.md` | **`guard.mjs` L594–601 整段 `checkAsBuilt()` 同 `final_check.test.mjs` 都硬性要佢存在，而且要有 R1–R8 同「唔係通用底線」**；`PLAYBOOK §8.1`／`§10`／`docs/README`／`README` 全部指住佢 |
| `docs/21-fix-plans.md` | `guard.mjs` L470／L601、`final_check.test.mjs` |
| `docs/20-repo-health-audit.md`、`docs/22-scout-circulars-agent-handoff.md` | `guard.mjs` 必備檔清單；但**唔屬 ecportal**（係 repo 健康／圖書館交接）→ **唔好一齊刪** |

### 4.2 一定要同步改嘅 code（唔改一定 CI 紅）

| 位置 | 而家寫死咗乜 | 刪檔時要改 |
|---|---|---|
| `scripts/guard.mjs` L77–89 | 必備檔：`BUILD.md`、`EXTERNAL.md`、`進度追蹤…md`、`docs/18`、`docs/19` | 由清單移除，或者改成「新案例檔」 |
| `scripts/guard.mjs` L594–604 `checkAsBuilt()` | 4 份案例檔要存在、README 要引用、`docs/19` 要有 R1–R8＋「唔係通用底線」、`PLAYBOOK` 要指 19 | 整段改寫：指標轉去 VSPORTAL 案例，或者整段變「已退役，跳過」 |
| `scripts/final_check.test.mjs` L38–48 | 同樣斷言 4 份案例＋R1–R8 | 同步改，否則 `node --test` 紅 |
| `scripts/fresh_eyes.test.mjs` L98–99 | fixture 要 `docs/18/19/20/21` 存在 | 同步改 |
| `docs/10-checklists.md`／`docs/17`／`docs/07`／`docs/15`／`docs/02`／`docs/06` 等 | 各 1–5 次提及 ecportal 做例子 | 逐句判斷：**通用規則唔好因為例子退役而刪規則**，只換例子名 |

### 4.3 一句

> **刪 ecportal 唔等於刪 rules。** 115 次提及之中，大部分係「用 ecportal 做例子講一條通用規則」；真正屬案例嘅只有 `BUILD`／`EXTERNAL`／`進度追蹤`／`docs/18`／`docs/19`／`docs/21` 六份。**逐句分類，唔好整批 sed。**

## 5. 未確認（要用戶答，我唔靠估）

1. **VSPORTAL 係咪 `playerkousas-rgb/vs_portal`？**（我查到嘅係「深資童軍管理系統」；如果你講嘅 VSPORTAL 係另一個 repo／未上 GitHub，請講名。）
2. **「會刪掉」嘅範圍**：(a) 只係呢個倉嘅 6 份案例檔？(b) 連 `vsbadge`／`scoutbadge`／`cubsbadge`／`roverbadge` 都退役？(c) 只係 GitHub 上嘅 ecportal repo（已經 404，即係已做）？
3. **`sig` 接駁／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 有冇沿用去 VSPORTAL？** 呢三樣決定「搬去新案例」定「標退役」。
4. **VSPORTAL 要唔要喺呢個倉開一份新案例**（`docs/58-vsportal-case.md`）？如果要，我可以照 `vs_portal` 嘅 README／SCOPE 起草，未核實嘅照寫「未核實」。

## 6. 我嘅建議（只係建議，唔係決定）

**今日唔好刪。** 三個理由：
1. 5 個 live repo 仍然靠 docs/19 嘅權限邊界同 `sig` 契約；
2. `guard` + `final_check.test` 有 **4 處硬依賴**，刪之前要一次過改埋，唔係「刪檔」而係「重構」；
3. **VSPORTAL 一個字都未入倉** —— 先寫新案例，再標舊案例，最後才刪，中間任何一步都仲有記錄。

---
- 相關：[docs/19 專案案例](19-ecportal-troop-case.md)（待退役）、[docs/20 repo 健康](20-repo-health-audit.md)、[docs/51 白名單清單](51-whitelist-rollout-list.md)、[docs/56 術語表](56-glossary.md)。
- 維護：階段 B／C 做完就喺 §2 打勾，並喺 §0 更新 `gh` 查詢日期。
