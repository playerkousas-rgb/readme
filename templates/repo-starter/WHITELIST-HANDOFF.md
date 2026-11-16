# 白名單／書架交接清單（逐個 App 用・可直接貼去該 App 嘅對話）

> 用途：真理倉 [docs/50](../../docs/50-app-store-whitelist-and-shutdown.md) 只定**通用規則**（SG1–SG14）；**每個 App 嘅具體決定交返該 App 嘅 AGENT**——因為佢對自己個 App 熟啲，會諗多啲。
> 用法：把下面整段（由「## 你要做嘅事」開始）貼去該 App repo 嘅對話，AGENT 答完就落實。

---

## 你要做嘅事

你係 `____________`（App 名）嘅維護 AGENT。真理倉 `playerkousas-rgb/readme` 已定好入口管制規則（`docs/50`，SG1–SG14）。請**先答以下 6 條**，再改代碼。**唔識就答「唔識」，唔准估**。

| # | 問題 | 你嘅答案 |
|:--:|---|---|
| **1** | 用戶資料係咪存在**本機**（`localStorage`／`IndexedDB`）而且要跨日保留？ | 是／否：＿＿＿（是 → 之後**唔可以用 `iframe`**，見 SG2） |
| **2** | 有冇 **PWA 加入主畫面**（manifest `display: standalone`）？ | 是／否：＿＿＿（是 → 必須 `allowStandalone: true`，見 SG7） |
| **3** | 有冇 **Web Push 訂閱**？ | 是／否：＿＿＿（是 → **必須維持 `open`**，見 SG10-a） |
| **4** | 有冇**後端 `/api`** 或**第三方 API 額度**（例如 BRouter、地政總署、Gemini）？ | 是／否：＿＿＿（是 → 講清楚邊啲功能離不開後端） |
| **5** | 用家今日**點樣入嚟**？（APP STORE 撳入／圖書館連結／成員系統／直打網址／加咗主畫面） | ＿＿＿ |
| **6** | 你認為呢個 App 應該屬邊類？ | ☐ 紀錄冊（寬鬆）☐ 專業工具（收緊）☐ 自家系統（靠後端登入）☐ 圖書館類（維持 `open`） |

---

## 答完之後，按以下規則落實（唔需要再問真理倉）

### A. 一律先做（所有 App）

1. 抄 [`templates/vercel/store_gate_v1.0.js`](../../templates/vercel/store_gate_v1.0.js) 去 App 根目錄（或 `public/`），喺 `index.html` `<head>` 最頂掛入。
2. 用 `portalIds` 引用**官方入口**，唔准自己另抄網址：
   - `['appstore']` — 只准由 APP STORE（主站）
   - `['appstore','library','member','district']` — 四個入口全開（寬鬆）
   - `['appstore','member','district']` — 排除圖書館
3. 若**問題 2 = 是**，一定寫 `allowStandalone: true`（唔寫會踢走已裝主畫面嘅用戶）。
4. 若 App 由**圖書館／成員系統／區管理系統**撳入，先確認該處連結係 `rel="noopener"`（**唔可以有 `noreferrer`**，否則 `Referer` 被清空會被擋）。位置見 `docs/50` §4.4。

### B. 按 App 類型加做

| 類型 | 額外要求 |
|---|---|
| **紀錄冊**（`BOOK` 類） | `portalIds` 四個全開；**唔好**開 `supportNudge`（唔好騷擾成員）；確認有 JSON／QR 匯出備份 |
| **專業工具**（`HM20C`、`drawtheroute`、`HKMAP` 等） | `portalIds` 收窄到 `['appstore']`；可開 `supportNudge`（文案已內置，見 SG13） |
| **自家系統**（成員／區管理／badge） | 靠**後端登入**把關；入口只作導流；**唔需要** `supportNudge` |
| **圖書館類（有 Push）** | **維持 `mode: 'open'`**：唔可以 `iframe`、唔可以 `closed`、唔可以改 manifest `start_url` |

### C. 唔准做

- ❌ 唔准為「防抄」而加後端驗票／簽票基建（用戶 2026-11-15 定案：唔需要）。
- ❌ 唔准用 `iframe` 嵌任何有本機儲存／PWA／Push／登入 Cookie 嘅 App（SG2）。
- ❌ 唔准用 `supportNudge` 做倒數、延時解鎖、遮罩迫 Like（SG13）。
- ❌ 唔准寫死「幾日 0 Like 就收起」呢類數字門檻（SG14：判斷權喺用戶）。
- ❌ 唔准未問就改 `SCOPE.md` 以外嘅架構。

### D. 做完要交付

1. `SCOPE.md`／README 寫明：`mode`、`portalIds`、`allowStandalone`、有冇 `supportNudge`。
2. 跑一次真機：① 由 APP STORE 入（應正常）② 直打網址（應見白名單卡）③ 已裝主畫面撳 icon（應直接入）。
3. 回報：**改咗邊幾個檔、邊幾行、真機結果**。未做真機就要講明「未做」。

---

## 回報格式（COPY 呢個）

```
App：____________
1 本機資料：是/否    2 PWA：是/否    3 Push：是/否    4 後端 API：是/否
5 今日入口：____________
6 類型：紀錄冊/專業工具/自家系統/圖書館類
→ 採用 mode=____________  portalIds=[____________]  allowStandalone=____  supportNudge=開/關
→ 改咗：____________（檔名 + 行數）
→ 真機：APP STORE 入 ✓/✗ ｜ 直打網址見卡 ✓/✗ ｜ 主畫面直開 ✓/✗
→ 未做／風險：____________
```
