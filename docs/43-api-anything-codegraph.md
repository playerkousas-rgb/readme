# 43 — API Anything／CodeGraph 公開 GitHub 源碼評審（網站請求學成 spec／程式碼靜態圖譜）

> **2026-11-08 修訂**：按用戶要求，直接睇兩個公開 GitHub repo 嘅檔案、schema、測試、CI 同 benchmark 證據；唔再以影片摘要逐句核對做主軸。下面所有程式判斷都釘喺指定 commit，唔係靠星數或者宣傳句。
> 收錄方式同 [34](34-ai-workflow-tools.md)–[42](42-iconmaker-photoprep-repo-briefs.md) 一致：留來源、授權、限制，唔搬上游 repo 入本倉；**本頁唔新增規則 ID，亦冇安裝或執行任何上游工具**。Reverse API 主檔去 [25](25-reverse-api-reuse.md)／[26](26-reverse-api-walkthrough.md)／[34 §3](34-ai-workflow-tools.md)。
>
> **一句結論**：兩個都值得學做法，唔係即刻加依賴。API Anything 最值錢係「確定性歸納同 agent 分工、證據分級、寫入不確定狀態」；CodeGraph 最值錢係「靜態索引連來源/freshness、可退化嘅查詢入口」。CodeGraph **唔係對本倉零作用**：`.mjs`／`.py` 腳本可索引，只係 Markdown 規則唔會變成 graph；`.gs` 可以自訂映射做 JavaScript 解析實驗，但唔等於支援 GAS runtime。

## 0. 睇邊份 source、證據釘喺邊

| Repo | 今次 pinned commit | 授權 | Repo 形狀同揀讀範圍 |
|---|---|---|---|
| [goodnight000/api-anything](https://github.com/goodnight000/api-anything) | [`985ae8f65f4c`](https://github.com/goodnight000/api-anything/commit/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6) | MIT | TypeScript；tree 有 `src/` 57 檔、`test/` 83 檔、`sites/` 114 份 JSON spec；揀讀 learn／spec／execute／heal／seal／share／publish、MCP 入口、HN spec、相關 tests、CI、benchmark protocol/results |
| [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) | [`f72c9d2efb14`](https://github.com/colbymchenry/codegraph/commit/f72c9d2efb14454ff4f9fd7b8460abd82f19a287) | MIT | TypeScript＋Rust kernel；tree 有 `src/` 359 檔、`__tests__/` 1045 檔；揀讀 schema／types／extraction／resolution／graph／sync／MCP freshness／telemetry、相關 tests、benchmark 報告 |

方法：GitHub contents API 以 `ref=<上面 SHA>` 攞檔案，總共下載並揀讀 68 個 source／test／CI／benchmark 等檔案；唔係全 repo 逐行審計。`src/` 路徑下面嘅連結全部用完整 SHA＋行號，之後上游改咗都追得返。套件 metadata 只作背景：API Anything source `package.json` 係 0.4.0、Node ≥22.13；CodeGraph source 係 1.6.2，npm 發行包裝同 source 依賴形狀唔完全一樣，唔好混為一談。

## 1. 兩個 repo 實際係乜架構

```text
API Anything
browser capture → agent 揀 request／extraction recipe
  → learnOperation（確定性 diff／slot 歸納）→ Zod OperationSchema
  → 本機 save gates → 可選 holdout／clean replay／sharing
  → call（HTTP／browser fallback）→ write ledger／readback → heal candidate

CodeGraph
副檔名選擇 → extraction（TS／Rust）→ SQLite nodes／edges／files／unresolved_refs
  → resolution／graph／search → MCP explore（回傳現行 source＋關係）
  → watcher／sync／freshness checks；telemetry 係另一條開關路徑
```

| 你而家要做乜 | 判級 | 源碼理由 |
|---|---|---|
| 幫冇官方 API 嘅網站搵 endpoint／參數形狀 | API Anything：**有場景先試，只限本機 read-only 偵察** | 確定性 core 可重用概念；瀏覽器、session、sharing 唔應該塞入產品 runtime |
| 寫 GAS／Supabase upsert、防重複寫 | **即刻吸收做法，零安裝** | `accepted` 唔等於 `applied`；不確定送達要保留狀態，唔係自動 retry |
| 令 AI 搵大型 React／Next codebase 嘅 call chain | CodeGraph：**有真實 discovery 痛點先逐倉試** | 靜態 symbol graph＋現行 source 查詢；效益要連 context 殘留同答案正確度一齊量 |
| 理解本倉 Markdown 規則／單一 HTML inline script | **唔使為此裝 CodeGraph** | Markdown／plain HTML 冇預設 extraction；但本倉獨立 `.mjs`／`.py` 腳本係支援對象，唔可以講「全倉零作用」 |
| 將任何一個當 Vercel app 依賴 | **暫不採用** | 撞 [01 S1](01-slim.md) `api/` 零 runtime 依賴取向；生產 client 繼續用 [25 §2](25-reverse-api-reuse.md) 自家骨架 |

## 2. API Anything — 由 source 睇到嘅設計

### 2.1 確定性 core 同 agent 係分開嘅

- [`learnOperation`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/learn.ts#L2103-L2223) 係普通 TypeScript function：揀 captured request、保留其他 request bytes、將已證明嘅位置換成 example／session／derived slots，再學 response recipe。[`LearnInput`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/learn.ts#L56-L90) 接受一或兩份 capture；短 example 值容易撞其他欄位，第二份樣本用嚟 disambiguate。**「唔使 LLM 估」只適用於呢個歸納 core**。
- 外層 [`mcp-learn.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/mcp-learn.ts#L25-L34) 仍然由 agent 提供 `args`／`args2`／`args3`、揀 request id／extract／pick；[`learnSite`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/learnsite.ts#L462) 負責 browser orchestration。即是「agent 做判斷，core 做可重現歸納」，唔係成條 pipeline 都冇模型。
- 輸出唔係自由文字，而係 [`OperationSchema`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/spec.ts#L257-L299)：request、slots、volatile、trigger、match、response、params、`readOnly`、`minTier`、checks、readback、`unproven` 等。學唔到某個參數真係影響答案，就標 `unproven`，唔扮已知。
- 實例 [`sites/hacker-news.json`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/sites/hacker-news.json) 同時有 GET HTML extraction 同 POST Algolia JSON search；後者將網站前端公開 key 明確列入 `public` allowlist。**前端公開 key 唔等於用戶授權，亦唔代表可以任爬**；呢度只係說明 spec 點樣區分「公開常數」同 session secret，本文唔重印 key。

### 2.2 「save／holdout／replay」唔係同一道閘

呢點修正之前過度簡化嘅講法：

1. 本機 `add` 嘅 [`saveOperation`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/heal.ts#L945-L990) 會 judge captured response、scan secrets、喺 lock 下重讀再 save；**唔係所有 local save 都要求第三個 holdout 成功**。[`addOperation`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/heal.ts#L1294-L1307) 甚至可以帶住 `unproven` warning 保存，之後 publish 先拒。
2. `learn_site` 喺保存之後用 `args3` 做 [holdout＋clean replay](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/learnsite.ts#L736-L801)：holdout 要成功而且結果非空；tier-1 先做無 cookie replay。呢個係 sharing／proof 流程嘅證據，**非空結果亦唔等於語義全部正確**。
3. [`healOperation`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/heal.ts#L1645-L1675) 先 rescan／recapture 出 candidate，`validate` replay 話 ok 先 [`saveHealed`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/heal.ts#L1880-L1888)；寫入嘅 validation 本身就係一次真寫入，所以 budget 收緊到一次。

**值得抄嘅係證據分級**：observed／inferred／holdout-passed／replay-passed／unproven 分開記，唔好一粒 `ok` 包晒。對應 [02 F4](02-foolproof.md) fail-closed 同 [26 §4](26-reverse-api-walkthrough.md) 偵察七步。

### 2.3 寫入狀態機比「成功／失敗」誠實

[`execute.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/execute.ts#L246-L255) 將 write 分成 `not_sent`／`not_applied`／`accepted`／`may_have_applied`／`applied`。2xx 只係 `accepted`；send 之後行一次 [readback](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/execute.ts#L1414-L1433)，搵到預期變更先升級 `applied`。送之前要攞 [write ledger／lock](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/execute.ts#L1594-L1624)；lock busy 唔送，ledger 寫唔到一般亦唔送，除非 caller 明確用 `again` 接受繞過 duplicate guard。

落地建議：GAS／Supabase upsert 嘅回覆同 audit log 保留「已接受／可能已生效／已讀回確認」，唔好見到 timeout 就自動再寫。對應 [F6 冪等鍵／F9 危險動作](02-foolproof.md)。呢個係設計借鑑，唔係話本倉已經改咗 upsert code。

### 2.4 私隱／儲存：有閘，但唔係絕對保證

- Raw capture 本身含 cookies／authenticated headers；[`loadCapture`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/heal.ts#L662-L687) 超過 24h 會拒絕並刪除。Spec 用 `cookie:name` reference，唔代表原始 capture 冇秘密。
- [`seal.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/seal.ts#L410-L432) 用 AES-256-GCM＋OS key store／passphrase；但從未 sealed、又冇 key store 嘅新 home 會 [0600 plaintext fallback＋警告](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/seal.ts#L556-L575)。已 sealed home 攞唔到 key 則拒絕寫。唔好簡化成「一定加密」。
- [`shareOps`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/src/share.ts#L59-L116)：`local-only` 喺 registry 活動之前返回；但 sharing 開住時，登入學嘅 op 即使未畀 body consent，**fingerprint 都可能已經上傳**。Secret scan 係 heuristic，唔係匿名化證明；catalog quorum 係「多個網絡見過」，唔係內容正確／有授權。

對應 [03 A1／A12](03-security.md)：HAR／capture 當敏感材料，唔 commit；「本機」同「完全冇網絡傳出」要分開講。

### 2.5 Tests／CI 學到嘅嘢

[`test/heal.test.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/test/heal.test.ts#L55-L77) 明測「兩個 example 答案一樣 → 可以 save 但標 unproven」；[`write-guards.test.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/test/write-guards.test.ts#L69-L159) 測瀏覽器學習途中截停非預期寫入；[`schema.test.ts`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/test/schema.test.ts#L143) 對 MCP output schema。[`ci.yml`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/.github/workflows/ci.yml#L15-L48) 將 actions 釘 SHA、Node 22／24、`REQUIRE_BROWSER=1` 防止 browser tests 靜靜雞 skip、再裝 packed tarball 做 smoke test。

**我只係讀咗呢啲配置同測試，冇跑上游 CI。** 值得吸收：負向測試要成為交付一部分；「有測試檔」唔等於「我哋驗證過」。部分 browser suite 本機冇 Chromium 會 skip，CI 先強制要求。

## 3. CodeGraph — 由 source 睇到嘅設計

### 3.1 佢係靜態 symbol graph，唔係語義萬能鏡

[`schema.sql`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/db/schema.sql#L20-L100) 核心係 `nodes`（symbol＋位置）、`edges`（calls／imports／extends…）、`files`（hash／mtime）、`unresolved_refs`（pending／failed 留待重試）。[`types.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/types.ts#L218-L235) 嘅 edge 有 `provenance: tree-sitter | scip | heuristic`；resolution 係 best-effort，唔係每條邊都係編譯器證明。

MCP [`server-instructions.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/mcp/server-instructions.ts#L56-L77) 自己寫明：explore 係 lexical matching，唔係按意義搜；ambiguous calls 可能多個 candidate；**冇 live correctness validation，仍然要靠 compiler／tests／linter**。所以「預先索引」值得學，但 graph 答案唔可以當真理。

### 3.2 Freshness 係分狀態＋有預算，唔係一句「自動同步」

- Watcher 有 pending／degraded／recovering 狀態。Degraded 時，[`validateAnswerFiles`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/mcp/answer-freshness.ts#L13-L65) 對 contributing files 行 hash 驗證，預算係 200 files／8MB／250ms；分開 `stale` 同 `unchecked`，超預算唔當 fresh。
- [`tools.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/mcp/tools.ts#L3163-L3187) 喺 degraded 路徑見到 stale／unchecked 就拒絕由該 index 回答，叫用戶 sync 或收窄查詢。對應測試 [`mcp-stale-refusal.test.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/__tests__/mcp-stale-refusal.test.ts#L141-L156) 連「只驗頭 200 個就扮全部驗咗」都防。
- 另一條 per-file drift check [`isFileStaleOnDisk`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/mcp/tools.ts#L2865-L2895) 用 size／mtime／hash，但某啲 read/cache/root error 路徑返回 false，交畀其他 not-found 路徑處理。**唔好將成件事講成絕對 freshness 保證**。

可零安裝吸收：快取／索引結果帶 source hash 同 `fresh | stale | unchecked`；驗證超時要報 unknown，唔好靜靜雞當啱。對應 [02 F8／F10](02-foolproof.md)。

### 3.3 語言支援：要睇 map，唔係淨係睇 README 表格

預設 [`EXTENSION_MAP`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/extraction/grammars.ts#L59-L75) 有 `.ts/.tsx/.js/.mjs/.cjs/.jsx/.py` 等；冇 `.md`、plain `.html`、`.gs`。但 [`project-config.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/project-config.ts#L334-L344) 支援 `codegraph.json` 自訂副檔名映射，覆蓋 built-ins；[`extension-mapping.test.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/__tests__/extension-mapping.test.ts#L106-L155) 有 end-to-end 自訂副檔名索引測試。

| 我哋嘅形狀（[38 §2.1](38-animation-3d-prediction-tools.md) 普查） | 修正後判法 |
|---|---|
| React＋Vite／Next.js | 潛在最有價值；TS/JS/JSX 係預設對象，但要實測 discovery-heavy 問題先知賺唔賺 |
| 獨立 `.mjs`／`.py` 腳本（包括本倉 scripts） | **支援**；之前「本倉零作用」講錯咗，只係 Markdown 規則本身唔會入 graph |
| 靜態 HTML／單一 HTML inline `<script>` | 預設冇 plain HTML extraction；唔好假設 inline JS 會自動抽出 |
| GAS `.gs` | 預設 skip；可以試將 `.gs` map 去 `javascript` 做語法解析，但 GAS services、HTML Service、跨檔案 runtime 關係唔會因此變成完整支援。**未試，唔當可用適配** |

### 3.4 Telemetry 同 Git exclusion 係兩件事

[`telemetry/index.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/telemetry/index.ts#L231-L253) 確認優先序：`DO_NOT_TRACK` > `CODEGRAPH_TELEMETRY` > stored choice > **default on**；off 會清 pending queue。[`telemetry-optout.test.ts`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/__tests__/telemetry-optout.test.ts#L7-L86) 覆蓋運行中實例觀察到 off、唔重用舊 identity、in-flight chunk 前再查 consent。

[`init --local-only`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/src/bin/codegraph.ts#L706-L720) 只係令 `.codegraph/.gitignore` ignore 自己，**唔係 telemetry 開關**。將來若試：先確認 telemetry off／`DO_NOT_TRACK=1`，再確保 index 唔入 Git；呢個係源碼結論，唔代表我哋已經做過網絡私隱實測。

## 4. Benchmark：讀埋方法同不利結果，唔淨係攞 headline

| 上游證據 | 實際範圍 | 可以講／唔可以講 |
|---|---|---|
| API Anything [`popular-2026-10-31/protocol.md`](https://github.com/goodnight000/api-anything/blob/985ae8f65f4c4918f24080bd7dbaf51fe92e6bf6/bench/results/popular-2026-10-31/protocol.md) | Netflix／IKEA 兩個已知任務、預先 bundled specs、每臂 5 次、獨立 signed-out DOM truth、凍結 prompt/spec/retry；單模型／單機／單網絡 | 可以講「已知任務 capability check 有獨立真值方法」；唔可以講「未見網站都保證快幾倍」 |
| CodeGraph [`residual-context-occupancy.md`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/docs/benchmarks/residual-context-occupancy.md#L155-L208) | Sonnet、3 turns、每臂 4 runs、7 repos；retrieval residual 平均高約 82% | 同 README Opus 單問題係唔同 regime，唔可以互相推翻；「少咗工具呼叫」唔等於「長 session 慳 context」 |
| CodeGraph 舊 [`codegraph-ab-matrix.md`](https://github.com/colbymchenry/codegraph/blob/f72c9d2efb14454ff4f9fd7b8460abd82f19a287/docs/benchmarks/codegraph-ab-matrix.md#L1-L38) | 37 cells、每臂一次；file reads 少 76%，但總成本 with $15.4 vs without $13.8 | 上游保留咗「reads 少但成本反而高」嘅不利結果；短任務固定 MCP overhead 可以唔抵 |

全部係上游自家實驗，**我冇重跑**。值得學佢將 adverse results、分母、模型、turn 數、污染控制留喺 repo，而唔係只留成功百分比。將來我哋試 CodeGraph，要同時記 tools calls、tokens、時間、答案正確度、完成後 context 殘留。

## 5. 對 SCOUT 棧採用清單（零安裝優先）

| 學到嘅做法 | 落喺邊 | 狀態 |
|---|---|---|
| Agent 只做判斷；可重現嘅 diff／validation 交畀確定性 code＋schema | [25](25-reverse-api-reuse.md)／[26](26-reverse-api-walkthrough.md) reverse API 流程；GAS／Supabase 輸入驗證 | 設計建議，未改 app code |
| 證據分級：observed／inferred／verified／unproven；唔好一粒 ok 包晒 | 偵察紀錄、健康檢查、文件「未實測」欄 | 本頁已按呢個原則寫；其他流程待逐個落實 |
| Write 狀態保留不確定性＋readback；唔自動重送 | GAS／Supabase upsert、危險動作 audit | **規則已落地（2026-11-08）**：[F6-b](02-foolproof.md#f6-b--寫入結果狀態送咗之後點算)＋F9 第④步＋PLAYBOOK F6/F9＋[10 §2](10-checklists.md)；文件同步有測試守。**各 app backend 未改，readback 要人手造 timeout 實測** |
| Raw secret material 同 shareable spec 分開；TTL＋明確 data-flow | HAR/capture 處理、任何「本機工具」聲明 | 對應 A1／A12；唔好將 heuristic scan 當匿名化 |
| Index/cache 帶 provenance＋hash；fresh／stale／unchecked 分開 | Git 文件索引、資源 cache、將來代碼探索 | 對應 F8／F10；唔使起 graph DB |
| 負向測試、CI 強制 browser、packed artifact smoke | 本倉現有 gates 之外的逐 app 驗收 | 負向測試文化本倉已有；browser／packed smoke 屬各 app 驗收，未加 |
| Actions 釘 commit SHA（[A16](03-security.md#a16--供應鏈) 本來就有條文，但本倉 CI 未跟） | `.github/workflows/guard.yml`＋`templates/github/guard.yml` | **已落實（2026-11-08）**：兩個 action 釘 v4.4.0 SHA（GitHub API 核實）；`guard.mjs` 新增 A16 檢查（本機 `./` 豁免、docker 要 digest），`scripts/actions_pin.test.mjs` 7 項測試守 |

**工具本體判級不變**：API Anything 只可作本機一次性 read-only 偵察，事前先查官方 API／ToS（[25 §5](25-reverse-api-reuse.md)／[15](15-resource-index.md)），用 local-only、唔學寫入／登入頁、唔入 app 依賴。CodeGraph 只喺某個 React／Next 倉真係有「開幾十個 file 先答到」嘅痛先試，唔全倉安裝；`.codegraph/` 係可再生產物，唔 commit（[20](20-repo-health-audit.md)／[21](21-fix-plans.md)）。單一 HTML／Canvas 唔需要為此加 runtime。

## 6. 查證限制／維護

- **已做**：2026-11-08 用 GitHub API 固定兩個 SHA，下載並揀讀核心 source、schema、tests、CI、benchmark；本頁連結指向實際檔案／行號。兩個 commit 喺本輪覆查時仍係 main HEAD，但之後會變。
- **未做**：冇安裝上游套件、冇執行上游程式／tests／CI、冇學任何網站、冇 index 任何 repo、冇重跑 benchmark、冇做完整 security／privacy audit。呢個係源碼級設計評審，唔係 runtime 驗證。
- **今次更正**：① CodeGraph 支援本倉獨立 `.mjs`／`.py`，唔係全倉零作用；`.gs` 可自訂映射但唔等於 GAS 完整支援。② API Anything local save、holdout/replay、heal replay 係唔同閘口。③ 加密有 plaintext fallback；sharing 開住時 fingerprint 可能早過 body consent 上傳。④ benchmark 要連唔同 regime 同不利結果一齊讀。
- **已吸收落地（2026-11-08，用戶指示「而家做」）**：F6-b 寫入結果狀態＋F9 執行後 readback（PLAYBOOK／docs/02／docs/10 同步）；A16 Actions 釘 SHA（本倉 CI + 範本 + guard 檢查 + 7 項測試）。跟 [F16](02-foolproof.md#f16--三處同步-checklist最常出事) 四處同步。**規則同 gate 已改，各 app 嘅 backend code 未改**；readback 有冇真係做，仍要喺自己 app 造 timeout 實測。
- **更新時機**：真正試用前、上游大改版後、引用數字前；重釘 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件 gates 通過唔會將「未實測」升級成「已驗證」。
