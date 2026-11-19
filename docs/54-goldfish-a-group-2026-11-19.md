# 54 — 金魚審報告（2026-11-19）：`A-GROUP-INSTRUCTION.md`

> **審邊份**：[`templates/repo-starter/A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md)（152 行）
> **方法**：[docs/52](52-fresh-eyes-review.md) —— 改寫先行 → 三個審查向量（未定義名詞／假設咗嘅前提／前後打架）→ 最多 50 條 → reviewer 只讀唔改。
> **點解審呢份**：委託書 [`FRESH-EYES-REQUEST.md`](../templates/repo-starter/FRESH-EYES-REQUEST.md) 建議次序 **1**（要貼去 34 隻子 App 自己執行，讀錯就做錯 34 次）。
> **身分**：2026-11-19 開嘅**新對話**，開頭零上文（第一句就係「開始金魚審計」）。**唔係**同一個對話自己審自己。

## 0. 誠實限制（先講，因為佢影響你點讀呢份報告）

| 項 | 實情 |
|---|---|
| 我幾時睇過咩 | 第一輪**只睇**目標檔全文。之後為咗寫 `docs/54`／索引，我開過 `docs/52`（方法）、`docs/53`（上一份報告）、`docs/10 §2`。 |
| 污染 | `docs/53` 已經寫住上一輪搵到嘅 SG12／SG7-a 簽票問題。**我審之前已經知有呢件事**——所以「我冇撞到第三個類似矛盾」唔可以當成證明。 |
| 第二輪 | §3 有一輪機械核對（開 `store_gate_v1.0.js`、`PLAYBOOK`、`docs/50` 對字）。嗰輪**有上文**，唔算金魚；我分開列，你分開秤。 |
| 我冇開 | `docs/50` §3.2／§3.4 全文、`docs/51` 全清單、`PORTAL_REGISTRY` 以外嘅主站 repo。凡涉及「呢份文件有冇準確轉述 §3.2／§3.4」嘅，我判唔到，唔會評。 |

## 1. 改寫先行（你只需要認真讀呢兩段）

**① 呢份文件主張做乜（我嘅理解）**

> 呢份係一份「貼去另一個對話就照做」嘅派工指令，對象係 A 組 App（冇 `/api`、本機只存介面偏好同小遊戲分數）。要做嘅係加一個「準入白名單」閘：由 APP STORE 撳入就照用，直接打網址就出一張提示卡，卡上只有一粒返 APP STORE 嘅掣。做法固定五步：先答 6 條問題（本機資料／PWA／Push／API／今日入口／類型），答到「用家自建重要紀錄又冇備份」或者「有真 Web Push」就停手；然後核實 Vercel 發佈位置、把 `store_gate_v1.0.js` 原封不動抄去該位置、喺入口頁 `<head>` 用固定參數叫 `initStoreGate`；再加一粒 SG18「讚好／收藏」掣（slug 必須核實，唔准靠 repo 名猜）；最後分開填「本機模擬」同「真機實測」兩欄，照指定格式回報，冇真機結果唔准寫「已完成」。

**② 按佢所講，現有系統點運作（我嘅理解）**

> `store_gate_v1.0.js` 係一支零依賴、喺 App 畫面之前就跑嘅共用腳本，由真理倉派發。喺 `entry-gate` 模式下，佢會睇你係點嚟：Referer 屬指定入口就放行、同一分頁先前由入口入過就放行、或者已經加入主畫面（standalone）就放行；三樣都唔中就畫攔截卡，卡上列出「非沉默」嘅入口（A 組只有 APP STORE）。同一支腳本另外提供 `getAppStoreUrl(slug)`，等 App 可以開新分頁返自己喺 APP STORE 嘅詳情卡。slug 嘅唯一真相係主站嘅 seed／`apps.slug`。

**③ 我改寫時自信最低嘅三處（呢三處本身就係 finding）**

1. 提示卡嗰粒「APP STORE 掣」去邊——APP STORE 首頁，定係「我呢個 App 嘅詳情卡」？文件兩處都叫「APP STORE 掣」（L70 vs L103）。
2. 「同一分頁入過就放行」呢個機制，文件**冇提**；我係讀完腳本才知（見 §2 #4）。
3. 由 `initStoreGate` 到 `ScoutStoreGate` 呢兩個名，文件冇講係同一支腳本出（見 §2 #3）。

## 2. 漏洞清單（23 條：CRITICAL 2／HIGH 8／MEDIUM 10／LOW 3）

> 位置全部指 [`A-GROUP-INSTRUCTION.md`](../templates/repo-starter/A-GROUP-INSTRUCTION.md) 嘅行號。**我唔講應該點改**（委託書規矩 5）——只講我缺咩、邊句我讀成相反意思。

| # | 級 | 位置 | 我缺咩上文／邊句讀唔明 |
|:--:|:--:|---|---|
| 1 | **CRITICAL** | L85 | 寫「唔准用 `iframe-only`（**除非你肯定四類禁區全中**）」。我讀成：中 1–3 類可以用 `iframe-only`，全中才唔准。而同一件事喺本倉其他文件係「中**任何**一類就嚴禁」＋「**五類**禁區」。兩處一齊讀，等於兩條相反指令，而錯嘅一邊會令子 App 資料分家。另外「四類」係邊四類，本文件冇列。 |
| 2 | **CRITICAL** | L50–56 | L52 叫我確認「發佈根目錄」，候選包括 `dist/`、`out/`、`.vercel/output/`；L56 叫我將閘門檔抄去「該發佈根目錄」。如果根目錄係 build 輸出，我抄入去之後**下次 build 會唔會仲在**？文件冇答——而 L54 自己講抄錯係「靜靜失效（冇任何錯誤訊息）」。同時 L53 叫我睇 Vercel 嘅 **Root Directory／Output Directory** 兩格，但全文用同一個名「發佈根目錄」指晒兩個唔同設定，我唔知跟邊格抄。 |
| 3 | **HIGH** | L99–106（對 L62、L65） | 第 3 步寫死指令碼要放 `<head>`、`<meta charset>` 之後、`<title>` 之前；第 4 步嗰段 IIFE（`getElementById('storeSupportTop')`）**冇講放邊**。我照「指令碼放 `<head>`」嘅語氣照做，`getElementById` 會係 `null`，而段碼自己 `return` → 個掣永遠 `hidden`，冇任何錯誤。文件要我靠第 5 步驗收先發現，但冇講呢個位係「靜靜唔出聲」嘅設計。 |
| 4 | **HIGH** | 全份（唯一線索 L150） | 文件由頭到尾**冇講 sessionStorage 通行證**：由入口撳入一次，同一分頁之後直打網址都會放行。結果 L119「直接打 `https://<你個網域>/` → **只有 1 粒** APP STORE 掣」我唔知要用**新分頁／清 sessionStorage** 先測得準——照做會出現「明明冇掣」或者「明明有掣」兩種假警報。`sessionStorage` 三個字只喺 L150 講 appKey 撞 key 時出現，冇解釋。 |
| 5 | **HIGH** | L56／L102 | 「`ScoutStoreGate`」呢個名第一次出現就係用嚟做 `typeof` 判斷，但文件從來冇講佢係邊度嚟、同 `initStoreGate` 係咪同一支腳本出。我唯一合理猜法係「都係 `store_gate_v1.0.js` 出」，而文件又叫我「原封不動」抄，即係我連驗都冇得驗。 |
| 6 | **HIGH** | L50–54 | 文件講抄錯位會靜靜失效，但**冇一個即場驗得到嘅方法**（例如開一次 `https://<網域>/store_gate_v1.0.js` 睇下係咪返到檔案）。L53 叫我睇 Vercel 設定面板，但面板顯示嘅係「設定」，唔係「部署之後 `/store_gate_v1.0.js` 呢條路徑返唔返到 200」。所以我核實完都唔知算唔算核實完。 |
| 7 | **HIGH** | L119 vs L91–106 | 驗收表寫「**只有 1 粒** APP STORE 掣」。但 SG18 掣（❤️ 讚好／收藏）都係一粒掣、都同 APP STORE 有關，我數唔清「1 粒」係指卡上嗰粒、頂欄嗰粒、定兩者都要計。更基本：**被攔截嘅時候，app 本身嘅 UI（連 SG18 掣）仲見唔見到**？冇講，我數唔到。 |
| 8 | **HIGH** | L40 | Q1 叫我掃「全倉 `src/`、`web/`、`public/`、`app/`」判斷有冇本機資料。A 組好多係**單一 HTML／根目錄 `index.html`**，四個目錄可能一個都唔存在 → 我會掃到「冇」而答「冇本機資料」，直接跌落「可以繼續」。呢個係答錯就落錯閘嘅一條。 |
| 9 | **HIGH** | L69（對 L85、L86、L46） | `mode` 我只見過 `'entry-gate'`（L69）、`'iframe-only'`（L85）、`'closed'`（L86）、`open`（L46「維持 open」）。四個值邊個係預設、幾時用邊個、`entry-gate` 靠咩判斷放行（Referer？通行證？standalone？）——全部冇講。而第 1 步 Q2／Q3 同「揀邊個 mode」嘅關係亦冇連起。 |
| 10 | **HIGH** | L142（對全份） | 全份冇寫**誤攔之後點算**：上閘之後如果用家入唔到（書籤、App 內建瀏覽器清走 Referer、公司網絡剝 Referer），我做咩？改邊個參數、要唔要問你、回滾程序係咩——冇。L86 只講「要關站我會另外叫你做」，係另一個方向。 |
| 11 | MEDIUM | L118 | 驗收項寫「由圖書館撳入 → 正常（`matchedPortalId: library`）」。我唔知 `matchedPortalId` 喺邊度睇到（console？頁面？），亦即驗唔到括號嗰句。 |
| 12 | MEDIUM | L81 | 「網址由真理倉 `PORTAL_REGISTRY` 統一」——冇指去邊個檔／邊行。我想核實 `'appstore'`／`'library'` 嘅拼法同大小寫都冇門路（L71 叫我照抄 `['library']`，即係我只能信）。 |
| 13 | MEDIUM | L110 | 「雙語同步（中 `讚好／收藏` / 英 `Like / Save`）」——幾時用邊個？靠 `data-lang`、靠兩段文字、定靠 JS 換？A 組 APP 有冇雙語機制我唔知，文件亦冇指去邊份規範。 |
| 14 | MEDIUM | L120 | 「已加入主畫面（**或模擬 `display-mode: standalone`**）」——模擬方法冇寫（DevTools 邊一欄？定改 CSS？）。呢一項又係「本機模擬」「真機實測」都要剔。 |
| 15 | MEDIUM | L87（對 L70） | 文件叫我「唔准加任何後端驗票／簽票」，但冇講**前提**：呢個閘係純前端、改 DevTools／curl 就繞得過，所以 A 組（冇 `/api`、冇敏感資料）才夠用。一個零上文讀者會以為呢個閘等於「鎖住內容」。 |
| 16 | MEDIUM | L119 | 驗收寫「唔會 404」。404 與否係 hosting 嘅 fallback／rewrite 設定決定，文件冇提過要檢查或設定過任何 rewrite，我唔知 404 係邊嚟。 |
| 17 | MEDIUM | L108（對 L121） | 第 4 步要求 slug 對 seed 核實，查唔到就「停低問我」。但第 5 步真機驗收（L121「落到該 App 詳情卡」）要個 App 已經喺 APP STORE 上咗架先做得到。**未上架／未入 seed 嘅 App 做到邊一步為止**，冇講。 |
| 18 | MEDIUM | L12–16（對 L56） | 文件假設子 App 嗰個對話**開得到** `playerkousas-rgb/readme` 三份文件，而且抄得到 `templates/vercel/store_gate_v1.0.js`。開唔到（冇權限／冇檔案系統）點算？L48 只講「唔識就唔准改」，冇講「開唔到檔」呢種情況。 |
| 19 | MEDIUM | L35／L46（對 L69） | Q1 分類表最後一格嘅出路係「**或者維持 `open`**」，但第 3 步嘅碼寫死 `mode: 'entry-gate'`。即係「維持 open」= 要我自己改 `mode`，但 L86 又只叫我唔准改去 `closed`。我可以改 `open` 嗎？邊個情況准？冇答案。 |
| 20 | MEDIUM | L113（對 L64–78） | 攔截卡係一支喺 `<head>` 就跑嘅腳本畫出嚟，覆蓋喺 app 上面；app 自己嘅畫面已經 render。**被攔截時用家會唔會見到內容閃一下**、有冇需要先遮住畫面——文件冇交代，而 A 組雖然只有偏好資料，都仍然有「見到 app 但用唔到」嘅觀感問題。 |
| 21 | LOW | L3 | 叫我複製「`=== 開始 ===`」到「`=== 結束 ===`」，但實際 marker 係 L10 `=== 開始（複製以下全部） ===`。第一個字面搵唔到。 |
| 22 | LOW | L148–152 | React／Vite／Next.js 嘅指示同 L60–62 重複寫一次（同一個事實兩個地方，改一處會漏另一處）。 |
| 23 | LOW | L5 | `<APPKEY>` 規則「repo 名細楷」，例子係 `hm20c`／`icon-maker`。如果 repo 名有大寫、`_`、`.`，或者同一個 repo 有多個 app——冇講點算（L150 只講唔可以同其他 App 撞）。 |

## 3. 機械核對（**有上文，唔算金魚**；只列事實同出處）

| # | 我核對咗 | 事實 | 出處 |
|:--:|:--:|---|---|
| 1 | 「禁區」類數 | 全倉唯一講法係**五類**（① 本機長期儲存 ② PWA 主畫面 ③ Web Push ④ `SameSite=Lax` 登入 Cookie ⑤ 相機／GPS／Wake Lock） | `PLAYBOOK.md` L251（SG2）、`docs/50` L64、`docs/51` L11 |
| 2 | 條件方向 | 「凡中下面五類**任何一項**，**嚴禁**用 `iframe-only`」 | 同上三處 |
| 3 | `ScoutStoreGate` | `store_gate_v1.0.js` 尾段 `globalThis.ScoutStoreGate = { …, getAppStoreUrl, PORTAL_REGISTRY, … }`；同一支檔亦提供 `initStoreGate()`。**所以 #5 係「文件冇寫」，唔係「名唔存在」** | `templates/vercel/store_gate_v1.0.js` L843、L860 |
| 4 | 通行證 | `readSessionPass`／`writeSessionPass`，key 係 `${appKey}.store_pass`，由入口成功進入時寫入 | 同上 L428–441、L514 附近 |
| 5 | `entry-gate` 判斷次序 | standalone → session pass → Referer origin ∈ 白名單；三樣都唔中才攔 | 同上 L493–519 |
| 6 | `PORTAL_REGISTRY` 位置 | 就喺 `store_gate_v1.0.js` 內（L79 `Object.freeze`），五個入口 id：`appstore`／`library`／`member`／`district`／`gemini` | 同上 L79、L34–44 |
| 7 | mode 定義 | 四個值有定義：`open`（唔攔）／`entry-gate`／`iframe-only`（配 CSP `frame-ancestors`）／`closed`（軟關站）；未知值 fail closed | 同上 L10、L55–64 |
| 8 | 閘唔等於保安 | 檔頭自己寫「防唔到 DevTools 改 sessionStorage 或 curl 偽造 Referer。敏感資料／收費 API 須配後端驗票」 | 同上 L64 |

> 一句總結呢欄：**#1、#2 兩條 CRITICAL 係真撞（有另一份文件寫相反）**；#5、#6、#9 係「腳本有、文件冇」，屬缺上文，唔屬腳本錯。

## 4. 我捉唔到嘅（免你以為零漏洞）

| 冇做 | 影響 |
|---|---|
| 冇讀 `docs/50` §3.2／§3.4 全文 | 我判唔到本文件有冇準確轉述「本機儲存影響」「新用戶直開網址」兩節（L15 叫你讀嗰兩節）。如果本文件抄歪咗，我睇唔到。 |
| 冇讀 `docs/51` 全清單 | 我唔知「A 組 = 34 隻」對唔對，亦唔知有冇 A 組 App 其實有 `/api`。 |
| 冇睇過任何子 App repo | 「單一 HTML」嘅比例（#8 嘅嚴重性）我靠 `docs/51` 描述推，冇實查。 |
| 冇跑過真部署 | #2（build 之後檔案仲在唔在）、#6（路徑返唔返到 200）、#16（404）全部係**靜態推理**，需要一次真部署才判得死。 |
| 冇審第 2–4 位 | `PLAYBOOK §7.7`（SG1–SG19）、`WHITELIST-HANDOFF.md`、`docs/50` 未審。 |

## 5. 收貨（作者側，唔關我事但你要做）

- [ ] 先讀 §1 第 ① 段：**呢個係唔係你原意？** 唔係 → 問題喺文件，唔喺我。
- [ ] 逐條分類：#1–#10 屬「真缺上文」定「我誤解」；凡屬「應該改英文／改正式啲／換架構」一律丟（我冇講呢類，如果有，係噪音）。
- [ ] 修完**最多重審 1 次**（[docs/52 §2](52-fresh-eyes-review.md)）。重審完仲有 CRITICAL → 改結構，唔好再審。
- [ ] 剩餘唔修嘅寫落「接受風險」，唔好無聲消失。
- [ ] 記錄格式（貼返 `docs/10 §9` 或該檔檔頭）：
  `> 金魚審 2026-11-19：CRITICAL 2／HIGH 8／MEDIUM 10／LOW 3；已修 a 條，接受風險 b 條（原因：…）。reviewer 有全文＋有檔案系統，另做咗一輪機械核對（見 docs/54 §3）。`

## 6. 下一份建議

按委託書次序：**#2 `PLAYBOOK.md` §7.7（SG1–SG19）** —— 交叉引用最多，而 #1、#2 兩條 CRITICAL 都係由呢組規則漂出嚟；審完 §7.7 一次過會照出同類矛盾。**一次審一份**，唔好三份一齊貼。
