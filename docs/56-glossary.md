# 56 — 術語表：呢個倉自己嘅專有名詞（一頁睇完）

> **用途**：另一個 AGENT／另一個對話第一次入嚟，睇完呢頁就知「呢個字喺呢個倉係咩意思、去邊睇詳情」。
> **紀律**：**一個詞一行、只講「係咩」同「去邊」**，唔重抄規則本文（F1 一個事實寫一次）。規則本身一律指去 `PLAYBOOK`／`docs/NN`。
> **由來**：[docs/55](55-whole-repo-comprehension-audit-2026-11-19.md) E1 —— 全倉有 55 份 docs，但冇一份講「自己嘅術語」；起手包 `GLOSSARY.md` 係空模板（比新 repo 填）。

## 1. 倉本身

| 詞 | 一句解釋 | 詳情 |
|---|---|---|
| **真理倉** | 即係呢個 repo（`playerkousas-rgb/readme`）。所有子 App 共用嘅規則、模板、檢查都喺呢度 | [README](../README.md) |
| **子 App** | 由真理倉派規則去管嘅 app repo（約 69 個有公開網址） | [docs/51](51-whitelist-rollout-list.md) |
| **專案案例** | 只適用某一個專案、**唔係通用底線**嘅設定（例如 ecportal 旅團／進度追蹤）。出現「案例」字樣就要當隔離 | [docs/58](58-multilevel-system-patterns.md) |
| **起手包** | `templates/repo-starter/`，一抄即用嘅新 repo 骨架 | [START](../templates/repo-starter/START.md) |
| **12 樣核心／13a–13e／第 14 項** | 起手包分三層：12 樣必加；13 係按形式加（13a 設計 review／13b skills／13c skill 模板／**13d PREFLIGHT 必跑**／**13e 金魚審留低**）；14 係有身份系統先加 | [START](../templates/repo-starter/START.md) |
| **六角度** | `final_check` 嘅六個檢查角度：Vercel／Git／程序員／系統架構師／AI Agent／一般用戶 | [docs/17 §1](17-final-check-and-tutorial.md) |
| **L0／L1／L2** | repo 檢查三層：L0 開局（PREFLIGHT）、L1 每次 commit、L2 每季全倉 | [docs/30](30-repo-health-check.md) |
| **改寫先行** | 金魚審第一步：reviewer 先用自己嘅話寫返文件主張，寫錯就係 finding | [docs/52](52-fresh-eyes-review.md) |
| **金魚審** | 交另一個**新對話**（可能連模型都唔同）用零上文睇文件；同一個對話自己審自己唔算 | [docs/52](52-fresh-eyes-review.md) |
| **接受風險** | 重審 1 次之後仍然唔修嘅爭議，要寫低原因，唔可以無聲消失 | [docs/52 §2](52-fresh-eyes-review.md) |
| **未核實登記表** | 寫住「講咗但未實測」嘅清單 | [docs/10 §9](10-checklists.md) |

## 2. 規則系統

| 詞 | 一句解釋 | 詳情 |
|---|---|---|
| **規則 ID** | `S` 瘦身／`F` 防呆／`A` 安全／`W` 版權／`V` 版號／`L` 雙語／`I`＋`UP` PWA／`SG` 入口白名單／`C` Gemini Canvas／`G` repo 治理／`VL` Vercel／`U` Supabase／`X` GAS | [PLAYBOOK](../PLAYBOOK.md) |
| **`docs/NN`** | 章節檔命名：兩位數前綴＋kebab-case，**只可往後加，唔好插中間改號** | [docs/README](README.md) |
| **`EXCEPTION:`** | 豁免寫法：`EXCEPTION: <規則ID> — 原因 — 補償措施`，同時要喺 docs/10 §8 登記 | [docs/10 §8](10-checklists.md) |
| **四處同步（F16）** | 改規則要同時改 `PLAYBOOK` ＋ `docs` ＋ `guard` ＋ `templates`；漏一處 = 文件同檢查唔一致 | [docs/02](02-foolproof.md) |
| **stale 指紋** | `consistency` 封住「已知嘅舊講法」，任何人重用舊句即 FAIL；**佢唔會做語意交叉檢查** | [docs/32](32-consistency-audit.md) |
| **`guard`** | 結構／連結／版號／secret 嘅硬閘（本機＋CI 同一條） | `scripts/guard.mjs` |
| **`consistency`** | 全倉「標準／數字／舊講法」一致性掃描（只喺真理倉跑） | `scripts/consistency_v1.0.mjs` |
| **`final_check`** | 六角度最終實測 orchestrator，會印 7 條人手實測 | `scripts/final_check_v1.0.mjs` |
| **`preflight`** | 新 repo 開局 8 個 check 嘅 orchestrator（複用上面幾支） | [PREFLIGHT](../templates/repo-starter/PREFLIGHT.md) |

## 3. 入口白名單（SG 系列）

| 詞 | 一句解釋 | 詳情 |
|---|---|---|
| **入口白名單** | 只准由 APP STORE／圖書館等官方入口進入嘅機制（**唔係** F5 講嘅 action allowlist） | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| **`open`／`entry-gate`／`iframe-only`／`closed`** | 四種 mode：公開／頂層跳板白名單／iframe 白名單／軟關站。未知值一律 fail closed | `templates/vercel/store_gate_v1.0.js` |
| **`PORTAL_REGISTRY`** | 五個官方入口嘅唯一登記（`appstore`／`library`／`member`／`district`／`gemini`），含 origin、`admit` 級別 | 同上（程式碼）＋[docs/50 §0.1](50-app-store-whitelist-and-shutdown.md) |
| **`portalIds`** | 子 App 用嚟引用入口嘅 id 陣列（**唔准自己抄網址**） | 同上 |
| **`silentPortalIds`** | 照放行但**唔畫成掣**嘅入口（SG19 標準：`['library']`） | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| **`matchedPortalId`** | 判定結果「你由邊個入口入」，SG10 統計靠佢 | `store_gate_v1.0.js` |
| **`supportNudge`** | 浮窗式支持提示（**同 SG18 掣唔可以並存**） | [docs/50](50-app-store-whitelist-and-shutdown.md) |
| **SG18／`<slug>`** | 子 App 內「讚好／收藏」一鍵回跳主站詳情卡；`slug` 要對主站 seed 核實，唔准靠 repo 名猜 | [docs/50](50-app-store-whitelist-and-shutdown.md) |

## 4. 一詞兩義（最容易誤讀，睇到要停一停）

| 詞 | 意思 A | 意思 B |
|---|---|---|
| **白名單** | **入口**白名單（SG1–SG19，`portalIds`） | **F5** 嘅 action／origin／欄位 allowlist |
| **P1** | `PLAYBOOK §0` 嘅「研發前搜尋相近產品」規則 | `docs/25` 嘅優先級 **P0／P1／P2**（越前越急） |
| **L** | `L1–L6` 雙語介面 | `L0／L1／L2` repo 檢查層級（[docs/30](30-repo-health-check.md)） |
| **A 組** | [docs/51](51-whitelist-rollout-list.md) 白名單上線分組（無 `/api`，即刻做） | `PLAYBOOK §1` 嘅 Gemini **Type A**（全開放結構） |
| **13d** | 起手包第 13 項 d：**PREFLIGHT 必跑** | —（唔好同 docs/52/53 嘅章節號撈亂） |

## 5. 其他常用縮寫

| 詞 | 一句解釋 |
|---|---|
| **`C13`／`C13-g`** | 單一 HTML 嘅三軌金鑰注入定案；`C13-g`＝單一 HTML 唔經 Vercel、唔強制瘦身，硬上限 5MB |
| **雙版號（V1／V3）** | 檔名版號＝內文版號，改交付檔要三處一齊改（檔名／內文／頁尾） |
| **`BOOK`** | 四個本機儲存型 app（SCOUTBOOK／CUBSBOOK／ROVERBOOK／VSBOOK），有本機資料 → 唔可以用 `iframe-only`、唔可以靜靜落閘 |
| **雙閘（L1）** | 判定要唔要做雙語：體積達標 **同** 要譯字串 ≤300 條，兩項都中就要做 |
| **`I1–I8`／`UP1–UP5`** | PWA 安裝入口＋版本更新（「安裝要有掣、更新要問過人」） |
| **`v_1.0` script** | 版本化腳本命名（`*_vX.Y.mjs`）；檔名版號必須等於內文 `VERSION` |

---

- 維護：新規則出現新專有名詞 → **加一行**；改咗意思 → 改呢度同來源檔（一次改兩處）。**唔好**喺呢度抄規則內文。
- 相關：[docs/README](README.md)（章節索引）、[docs/55](55-whole-repo-comprehension-audit-2026-11-19.md) E1（點解要有呢頁）。
