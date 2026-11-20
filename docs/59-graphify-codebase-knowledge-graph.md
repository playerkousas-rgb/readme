# 59 — Graphify（Graphify-Labs/graphify）對我哋多個 App 同未來研發有冇幫助

> **研究日期：2026-11-19。** 用戶問「GITHUB 上的 GRAPHIFY，能否幫到所有 APP 及未來研發」。本頁只研究官方開源 repo [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify)，唔係同名其他項目／Graphify Cloud 評價。
>
> **更正後結論（用戶釐清需求）：我之前將需要理解成「分析既有程式結構」，方向偏咗。** 我哋係設計者，初創設計時已知道系統、App、資料源同流程之間應該點連；真正要嘅應該係由設計者直接畫出、可維護嘅**設計地圖／架構地圖**，而唔係靠工具由 code 反推一張圖。Graphify 係 reverse-analysis 工具，對呢個核心需要唔係答案；**現階段不建議為此試裝 Graphify**。佢只可能喺日後核對「實作有冇偏離已知設計」時，成為輔助工具。
>
> **狀態：源碼／官方文件研究；未安裝、未掃描我哋任何 app、未執行 Graphify、未驗證輸出準確率／節省時間。** 本頁唔代表採用 Graphify。根據用戶釐清嘅不同核心需要，通用 D1 人工設計地圖要求另列入 PLAYBOOK；新 repo 起手包已加入範本及開局 gate，具體 App 地圖留在各自 repo。

## 0. 固定查證範圍

| 項目 | 查證結果 |
|---|---|
| 官方 repo | [Graphify-Labs/graphify](https://github.com/Graphify-Labs/graphify) |
| 固定版本證據 | `v8` branch commit [`2a296fa7a1d571f196c4ba8c2fc29c4c68f971ce`](https://github.com/Graphify-Labs/graphify/commit/2a296fa7a1d571f196c4ba8c2fc29c4c68f971ce)；GitHub 頁面於 2026-11-19 顯示最新 commit 訊息為 `bump version to 0.9.113`。**分支會繼續移動，本頁用 commit URL 固定證據。** |
| 授權 | Apache-2.0，見該 commit 的 [`LICENSE`](https://github.com/Graphify-Labs/graphify/blob/2a296fa7a1d571f196c4ba8c2fc29c4c68f971ce/LICENSE)。寬鬆開源授權唔等於要把工具放入產品。 |
| 官方說明 | [README（固定 commit）](https://github.com/Graphify-Labs/graphify/blob/2a296fa7a1d571f196c4ba8c2fc29c4c68f971ce/README.md)、[Supported inputs](https://docs.graphify.com/open-source/features/languages)、[Architecture](https://docs.graphify.com/concepts/architecture)、[Security policy](https://github.com/Graphify-Labs/graphify/security/policy)。官方文件會更新；涉及版本細節時以實際安裝版本再核對。 |
| 查證方式／限制 | 讀官方 README、supported-inputs、architecture、security policy 與 LICENSE；未下載或執行程式，未做完整安全稽核，未核實宣傳 benchmark，亦未確認使用者帳戶所有 repo 的語言／規模／活躍狀態。 |

## 1. Graphify 做乜（唔好將佢當成另一個 App）

Graphify 係本機開發者／coding-agent 工具：掃一個 repo，從程式結構建立可查詢圖譜，輸出互動式圖、Markdown 報告同 JSON；之後可用 CLI（`query`／`path`／`explain`）或 MCP 問「某個概念連到邊個模組」「兩個元件之間有咩路徑」。佢嘅目標係幫人／agent 快啲理解 codebase，**唔係替 app 加用戶功能，亦唔會令已部署 app 自動變好。**

```text
repo source
  ├─ code / manifest：本機 AST 結構抽取（Tree-sitter／專用 extractor）
  ├─ 文件／PDF／圖像：可選語義抽取（會用指定 assistant/model/backend）
  └─ 合併關係／標示 provenance
        ↓
  graph.json + GRAPH_REPORT.md + graph.html
        ↓
  人或 coding agent 用 CLI／MCP 查圖，再回到 source/tests 核實
```

官方標籤 `EXTRACTED`／`INFERRED` 可協助分辨直接抽取與推導；但 **INFERRED 唔等於模型必然有錯，EXTRACTED 亦唔代表整個程式行為已驗證**。官方 architecture 明講動態 dispatch、generated code、缺失輸入、舊圖都會造成缺口，應檢查 source citations；graph 唔可以代替 compiler、tests、guard 或人手審核。

## 2. 對我哋常見 App 形狀嘅適配度

| 我哋嘅形狀 | 初步適配 | 原因／限制 |
|---|---|---|
| 較大 React／Next／TypeScript／JavaScript repo | **若日後要做現況／drift 輔助，技術上最合適** | 官方有 JS／TS 結構解析、跨檔案關係、CLI/MCP；但這不代表我哋目前需要它，也不改變「設計者直接畫預期地圖」的主方向。 |
| 靜態網站／少量獨立 `.js`／`.mjs` | **通常低至中** | 可以抽到部分 code 結構，但 repo 小、依賴關係少時，建立／維護圖譜嘅額外步驟可能冇回報。HTML 文件被列作 documents；唔好假設 inline script 一定按完整 JS 專案方式解析。 |
| 單一 HTML／Gemini Canvas | **低** | 單一檔案通常冇足夠跨檔案圖結構；Graphify 不是 Canvas runtime／單檔驗收工具。HTML 內容可能落文件語義抽取，而非可依賴嘅 inline JS AST call graph。繼續用本倉單檔審計、測試與真機驗收。 |
| Google Apps Script `.gs` | **未證明適配，先當弱** | 官方 supported-inputs 列表未見 `.gs`；佢有 JS 支援唔足以證明 GAS extension、服務物件（SpreadsheetApp 等）、觸發器、HTML Service 同跨檔案 runtime 都受支援。唔可以將「JavaScript parser」講成「GAS 完整支援」。若真要試，先驗證檔案有冇被分類、符號／關係是否正確。 |
| Supabase SQL／schema | **局部可能有用** | 官方有 SQL schema extractor（需 `sql` extra），可以提供表、關係等結構線索；唔會因此驗證 RLS policy、權限邏輯、migration 成功或 production 資料行為。仍以 migration／SQL 測試／實際權限驗收為準。 |
| 本倉（README、PLAYBOOK、Markdown 規則＋少量 scripts） | **唔建議為本倉裝** | 核心知識係精心編排嘅 Markdown 規則／索引，而唔係大型 code graph；文件語義模式要走 model/backend，可能重覆既有入口、產生另一份需維護嘅地圖。repo 有少量 `.mjs` scripts 可被抽取，唔代表全倉都值得 graphify。 |
| 我哋真正要嘅設計地圖 | **由設計者直接畫，作為意圖來源** | 設計者掌握產品邊界、跨 App 關係、資料責任與預期流程；呢啲意圖未必存在於 code，靜態解析唔能夠可靠反推。每個 App 嘅具體地圖留喺該 App 自己 repo，真理倉只放共用方法／可複製範本。 |
| Graphify 對設計地圖嘅角色 | **非主工具；只可能做後續差異提示** | Graphify 從現有 source 抽取「目前可見結構」，設計者手繪圖表達「應該點運作」。兩者用途唔同；若日後有實際 drift／漏接痛點，先比較 graph 與設計圖，唔好反過來由 graph 決定架構。 |

## 3. 私隱、安全、操作成本

### 資料流要分開睇

- 官方 README 聲稱 code 結構抽取喺本機完成、code-only 可離線跑；有混合 corpus 時可用 `--code-only` 跳過 docs／PDF／images 等語義抽取。呢個係上游聲明，今次未用封包／網絡監測獨立驗證。
- 文件、PDF、圖像嘅語義抽取會送去所選 model/backend；用本機 coding assistant 時亦應確認該 assistant 自己嘅資料政策。唔好將「AST 本機」概括成「整次執行完全冇網絡」。
- 官方 README 表示無 telemetry；但 CLI `query`／`path`／`explain` 同 MCP 查詢會預設寫本機 `~/.cache/graphify-queries.log`（含問題、corpus、結果節點數、時間等欄位）。官方提供 `GRAPHIFY_QUERY_LOG_DISABLE=1` opt-out。私人 repo 名稱、問題文字、graph 輸出同樣當內部資料保護。
- `graph.json`、報告、HTML 圖可能暴露模組名稱、內部架構、註解或文件摘要；**唔因為係本機生成就直接 commit／公開**。先查內容、體積、secret，決定本機保存或是否有理由進 Git。亦唔應放入 Vercel deploy artifact。

### 安全邊界

官方 security policy 將佢定位為 local development tool，描述 URL fetch 的 SSRF／大小限制、MCP path traversal、輸出 sanitization、prompt injection 防護等。這些是上游自述，不是我方完整安全驗證。使用時先禁用不需要的 URL ingest／網絡 MCP／hooks；如需 MCP，只開本機可信 client，絕不把圖譜資料或服務暴露到公開網絡。安裝 Python CLI 亦會引入一批依賴，應先在隔離環境測試，確認版本與變更檔案，再決定是否常駐。

### 版本與工作流程

官方 PyPI distribution 名為 `graphifyy`（雙 y），CLI 叫 `graphify`；需 Python 3.11+。README 同時提供 repo-scoped assistant skill、CLI、MCP 等不同整合，不應一口氣安裝全部。尤其 repo-scoped `install` 會寫 assistant 指令／設定檔，任何寫入前先檢查 diff，避免覆蓋既有 `AGENTS.md`／skill／hook 規則或同我哋起手包互相衝突。

## 4. 正確方向：設計時由我哋直接畫地圖

**依用戶釐清：現階段先唔試 Graphify。** 我哋唔係等工具話畀我哋知產品點連；應該由設計者喺方案初創時明確記錄「預期關係」，再由實作／驗收按地圖對照。具體 app 的 as-designed／as-built 文件放喺該 app 自己 repo；真理倉只放通用方法或可複製起手包，避免將所有 app 的細節塞入中央規則倉。

設計地圖可按需要畫成 Mermaid、流程圖、表格或其他人易讀方式；重點係清楚表達以下幾類，不係追求圖譜技術：

1. **邊界與責任**：每個 App／模組負責乜、唔負責乜；誰係資料 owner／source of truth。
2. **入口與角色**：用戶由邊度進入、角色／權限如何分流、跨 App 跳轉或嵌入關係。
3. **資料流**：邊個讀／寫邊份資料、API／Sheet／Supabase 等實際連線、寫入後如何確認與錯誤處理。
4. **依賴與信任邊界**：哪些服務互相依賴、secret 留在哪一層、哪些資訊不可跨界流動。
5. **重要決策與禁區**：為何選此架構、不可破壞的限制、故障／停機時的預期行為。

完成後再以 code、tests、權限設定與實際操作驗收地圖是否落實。**設計圖係意圖／合約；source graph 只係工具對現況的觀察；兩者不一致時要調查，不可以自動以其中一邊覆蓋另一邊。**

### Graphify 仍可能有嘅次要用途

只有當某個 repo 長期出現「實作已經複雜到設計者／Agent 都難以追蹤」或「要盤點 code 同設計圖的 drift」等實際痛點，先考慮小型試點。屆時 Graphify 只能做現況索引，仍須由人逐條對照設計圖與 source；沒有明確痛點就不安裝、不加起手包、不加產品依賴。

## 5. 對未來研發嘅實際幫助：保存設計意圖，而非等 code 長成先逆向

用戶指出嘅核心更適合前移到設計階段：**既然我哋清楚模組、App、資料源之間應該點連，就直接把地圖畫出來，讓未來開發者／Agent 以此理解設計意圖。** 這樣做仍要回到 source、tests、權限與實際操作驗收，避免文件與實作脫節；但設計圖回答的是「應該點運作」，Graphify 回答的主要是「目前 source 可抽取到乜結構」，不可混為一談。

若要把方法複用到未來 app，先在個別 app repo 的設計文件記錄邊界、資料責任、入口、關鍵流程、跨系統依賴、信任邊界與重要決策；中央真理倉提供 PLAYBOOK D1 通用要求、起手範本及流程指引，唔集中收錄所有 app 的 as-built 細節。

與本倉 [43](43-api-anything-codegraph.md) 的關係：43 評的是 API Anything／CodeGraph，不是 Graphify；Graphify 是另一個較廣的多格式 codebase graph 工具。可比較其「provenance／freshness」概念，但唔把舊 CodeGraph 結論直接套到 Graphify，也唔因為 Graphify 有相似名目而認定解析能力／隱私行為一樣。

## 6. 判斷總表

| 問題 | 結論 |
|---|---|
| Graphify 解決我哋講嘅核心需要嗎？ | **唔係。** 它偏向從現有程式做結構分析；我哋知道設計關係，應由設計者直接畫預期地圖。 |
| 我哋下一步應做乜？ | **設計時直接劃地圖**，記錄邊界、責任、資料流、依賴與決策；具體 App 文件留在該 App repo。 |
| 而家要唔要安裝／加到模板？ | **唔需要，暫不採用。** 除非日後有 code 與設計圖比對／漂移檢查的實際痛點。 |
| Graphify 可否完全無用？ | 唔係；複雜 repo 的現況索引／設計 drift 輔助仍可能有用，但屬次要用途，未實測。 |
| 可唔可以放進產品？ | **唔建議。** 係開發工具，不是 app runtime dependency。 |
| 可以信 Graph 結果嗎？ | 只當「現況」線索；重要結論回設計意圖、source、tests／production contract 核實。 |

## 7. 查證限制／維護

- **已查**：2026-11-19 固定 GitHub `v8` commit `2a296fa7a1d571f196c4ba8c2fc29c4c68f971ce`；讀 README、LICENSE、security policy，以及官方 supported-inputs／architecture 文件。公開 repo 頁面顯示版本資訊為 0.9.113。
- **未做**：未 clone／安裝／執行；未測 code-only 離線網絡行為；未掃任何自家 app；未驗 `.gs`／inline HTML／SQL 的實際抽取質量；未重跑 benchmark；未做完整供應鏈、依賴漏洞或 security audit。
- **更新時機**：真的要試用前、上游主版本／language extractor 大改、官方 data-flow／license 變更時；更新 pin、版本、限制同本頁判決。若做試點，另記被測 repo commit、命令、產物位置、測試任務與 adverse findings，唔好把「未實測」改寫成「已驗證」。
