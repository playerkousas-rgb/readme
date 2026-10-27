# Gemini Canvas Prompts（可直接貼）
> 版本：v1.0 · © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM

> **核心一句**：每次叫 Gemini／Canvas 改嘢，都要講清楚 **「Code.gs 唔准改」**。
> Canvas 只可以生 `shell_v1.0.html`（殼）；prompt、規則、紀錄、key 全部喺 `brain_v1.0.gs`（腦），唔好貼入對話，唔好寫入 HTML。

---

## ① 生殼（最常用）

````text
幫我生一個 Apps Script HTML file，檔名 index.html。

背景：呢個 app 行「腦殼分離」— server-side 有一個 Code.gs 已經寫好，
公開入口只有 google.script.run.api(action, payload)，可用 action 清單如下：
<貼 contract_v1.0.json 嘅 actions>

要做：
- 一個清晰嘅 UI（頂欄、表單、列表、狀態訊息），純 HTML + CSS + 原生 JS。
- 所有資料操作一律經 call(action, payload, done)；call 內部用
  google.script.run.withSuccessHandler().withFailureHandler().api(action, payload)。
- 用戶內容一律用 textContent / DOM API，唔好 innerHTML。
- 標咗 danger 嘅 action 要有確認彈窗。

限制（硬）：
1. 唔准寫 system prompt、角色設定、few-shot、API key、業務規則喺 HTML。
2. 唔准 fetch 任何外部 API，唔准用 localStorage 做紀錄。
3. 唔准模擬／重寫 Code.gs 嘅邏輯，唔准自己判斷 role 嚟授權。
4. 唔准改 Code.gs、contract.json、PROMPT.md、RECORDS.md。
5. 單一 HTML 單檔 ≤ 5MB（C13-g，唔強制瘦身）；Vercel/dist 類先至要 < 2MB。

完成後列出：用咗邊啲 action、有冇改過 Code.gs（應該係「冇」）。
````

---

## ② 生腦（第一次寫 Code.gs）

````text
幫我寫 Apps Script Code.gs（腦），配合 index.html（殼）用。

規格：
- PROMPT.md（system prompt 內容 + 版號）
- contract.json（action 白名單）
- RECORDS.md（紀錄 schema）

要求：
1. 只有兩個 public function：api(action, payload) 同 doGet()。
   其餘 helper 全部收喺一個 BRAIN IIFE 入面，client 唔可以直接呼叫。
2. SYSTEM_PROMPT 放喺 IIFE 入面常數；GEMINI_API_KEY 由 ScriptProperties 讀。
3. api() 順序：白名單 → 角色（server 計）→ validate → RULES[action] → appendRecord → 回應。
4. 每次非 read action 寫 RECORDS Sheet：ts / actorHash / action / payloadHash /
   resultCode / promptVersion / prevHash / hash（hash 鏈，唔存原文）。
5. gemini.ask 由 Code.gs 用 UrlFetchApp 代 call Gemini API，
   systemInstruction 放 request body；只回傳模型輸出文字，唔好回傳 prompt / key / raw response。
6. api() 回應永遠唔含 SYSTEM_PROMPT、GEMINI_API_KEY、hash 原文、個人資料。
7. doGet() 用 HtmlService.createHtmlOutputFromFile('index')。
8. 程式碼內唔好寫版號註解；PROMPT_VERSION 只係紀錄欄位，對照 PROMPT.md。

完成後列出：action 清單、邊啲資料落 Sheet、邊啲落 ScriptProperties。
````

---

## ③ 加一個新 action（四處同步）

````text
我要加一個 action：<名>。

請同時改四處（F16）：
1. contract.json：加 action + roles + 輸入 schema（danger 要標）。
2. Code.gs：ACTIONS 加同一條、RULES 加對應 pure function、必要時加 RECORDS 欄位說明。
3. index.html：加對應 UI 同 call()，唔好加業務規則。
4. brain.test.mjs：加測試（成功 + 權限失敗 + 輸入錯誤 + 留痕）。

限制：唔好改 SYSTEM_PROMPT（要改就行 PROMPT_v1.0.md 改版流程）；
唔好將新邏輯寫入 HTML；所有授權仍然 server-side。
完成後跑 node --test brain.test.mjs，全部要綠。
````

---

## ④ 保護紀錄（由 localStorage 搬去 Sheet）

````text
而家個 HTML 用 localStorage 存對話／操作紀錄，我要搬去 server。

請改：
- Code.gs：加 appendRecord()，寫 RECORDS Sheet（schema 見 RECORDS.md），
  append-only + prev_hash 鏈；只存 payloadHash 同 promptVersion，唔存原文。
- Code.gs：record.list action 只回傳 metadata（ts/action/resultCode/promptVersion/hash 頭 12 位）。
- index.html：刪走所有 localStorage.setItem 嘅紀錄寫入；改為 call('record.list', ...) 顯示。

保留：非敏感 UI 偏好（排序／顏色）可以繼續用 localStorage。
限制：client 唔可以有 update / delete 紀錄嘅入口。
完成後列出：邊啲資料搬咗、邊啲留低、點驗 hash 鏈。
````

---

## ⑤ 由單一 HTML 遷移去 GS 腦 ＋ HTML 殼

````text
將呢個單一 index.html 拆成腦殼分離，行為要完全不變。

步驟：
1. 由 HTML 抽出 SYSTEM_PROMPT / few-shot / 評分標準 → Code.gs 常數，PROMPT.md 記版號。
2. 抽出 localStorage 紀錄 → RECORDS Sheet（appendRow + hash 鏈）。
3. 抽出所有規則／驗證／role 判斷 → ACTIONS 白名單 + RULES + 唯一 api() 入口。
4. HTML 淨低 UI：所有資料操作改做 google.script.run.api(action, payload)。
5. 加 brain.test.mjs 驗證：action 白名單、prompt 唔外洩、紀錄有寫、合約同 GS 一致。

驗收：重新用 Canvas 生一個全新 index.html，node --test brain.test.mjs 仍然全綠。
唔准改舊 app 嘅可見行為；有衝突先問我。
````

---

## ⑥ 醫生 prompt（改完壞咗用）

````text
而家個 app 壞咗。唔好重寫成個 project，唔好將邏輯搬返入 HTML。

先做：
1. 讀 contract.json，列出所有 action。
2. 對照 Code.gs 嘅 ACTIONS / RULES 同 index.html 嘅 call()，搵唔一致嘅地方。
3. 只修唔一致嗰幾行，唔好順手重構。
4. 檢查 index.html 有冇唔小心寫入 prompt / key / fetch / localStorage 紀錄。
5. 跑 node --test brain.test.mjs；如果測試本身有錯，先問我。

輸出：壞因、改咗邊幾行、測試結果。
````

---

## ⑦ 普通結構（工具／prototype）專用

````text
生一個單檔 index.html（Gemini Canvas artifact），功能係 <工具名>。

限制：
- 純前端、無後端、無 fetch、無 API key、無 system prompt、無個人資料儲存。
- 一個 STATE 物件帶 schemaVersion；提供 exportState() / importState(json)。
- 用 textContent / DOM API，唔好 innerHTML 插用戶內容。
- 單一 HTML 單檔 ≤ 5MB（C13-g，唔強制瘦身）；Vercel/dist 類先至要 < 2MB。
- 頂欄顯示「示範模式」水印（如果係 MOCK）。
- 雙版號：檔名 `tool_v1.0.html` + 內文 meta/title/APP_VERSION/頁尾全部 v1.0（見 docs/13-versioning.md）。

完成後列出：STATE 結構、匯出入格式、已知限制。
````

> **升級提示**：一旦呢個工具要加 prompt／紀錄／身份，就要行 ⑤ 遷移去腦殼分離。
