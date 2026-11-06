# 34 — AI 開發／文件處理工具（整理、核實與落地）

> 呢份管用戶提供嘅第三方 GitHub 開源 AI 工具清單：用途、查證結果、採用條件同本倉入口；整理日期 **2026-11-06**。配色工具放 [23 §5.1](23-design-resources.md)，API 細節放 [25](25-reverse-api-reuse.md)／[26](26-reverse-api-walkthrough.md)，Skill 治理放 [29](29-reading-map.md)。本頁唔新增規則 ID，亦唔代表已安裝或試跑外部工具。

## 0. 收錄範圍：6 項已確認（3 個配色站＋3 個 AI 工具）

**用戶最終確認：AI 開發／文件處理組只有 3 個，冇第 4 個；全部係其他人嘅 GitHub 開源項目／Skill，唔係自有 repo。** 原貼文編號由 ④ 跳到 ⑥，唔再按編號缺口補項；連同 3 個配色站，呢份清單合共 **6 項**。

- **來源分類**：已識別嘅 PPT Master、Reverse API Engineer、`mattpocock/skills` 均係第三方 GitHub repo；本輪 GitHub API 授權欄位係 MIT。`grill-me` 係 `mattpocock/skills` 入面嘅 Skill，唔係獨立 repo。
- **使用位置**：可下載到本機／相容 agent 環境使用（PPT workflow、RAE CLI、Skill 檔）；「本機用」唔等於離線推理或零模型費用，亦唔代表本輪已安裝實測。
- **收錄方式**：保留上游連結、用途、授權、查證 commit 同限制，唔將其他人成套 repo 搬入本倉；現有 `grilling` MIT 引用原文維持不變，呢輪冇新增外部 Skill。

| 資源 | 原貼文識別 | 整理後入口 | 本輪狀態 |
|---|---|---|---|
| Nippon Colors | 配色 1 | [23 §5.1](23-design-resources.md)：傳統色靈感 | 官方頁搜尋摘要已核對；未開站實測 |
| Adobe Color | 配色 2 | [23 §5.1](23-design-resources.md)：圖片抽色 | 官方說明搜尋摘要已核對；未試上傳／匯出 |
| Color Hunt | 配色 3 | [23 §5.1](23-design-resources.md)：四色組合 | 官方頁搜尋摘要已核對；未試搜尋結果量 |
| PPT Master | ③・影片 ID `DfHiF9Wj_Yg` | 本頁 §2 | 已讀上游文件；未安裝／生成 PPTX |
| Reverse API Engineer | ④・影片 ID `DfHiKBBlJ3k` | 本頁 §3 → [25](25-reverse-api-reuse.md)／[26](26-reverse-api-walkthrough.md) | 已更新文件入口；未執行逆向／打目標網站 API |
| `/grill-me`／`grilling` | ⑥・影片 ID `DfJSVWrotqt` | 本頁 §4 → 現有 [`INTAKE.md`](../templates/repo-starter/INTAKE.md) | 已核對上游原文；本地方法已有，Slash 指令未安裝實測 |

> 影片 ID 只保留做來源線索，**唔等於已核實影片內容**。下面以項目官方 README／檔案為依據；宣傳說話同實際驗證分開寫。

## 1. 唔使全部裝：先按任務揀

| 你而家要做乜 | 優先入口 | 最小產出 |
|---|---|---|
| 將已授權材料整成可編輯簡報 | §2 PPT Master（候選） | 大綱＋來源對照＋通過人手驗收嘅 `.pptx` |
| 搞清楚網站資料由邊個 endpoint 嚟 | §3 Reverse API Engineer（候選） | 授權／條款紀錄＋去敏請求分析＋ reviewed client |
| 想法太模糊，驚 AI 做出嚟唔對 | §4 現有 `INTAKE.md` | 用戶確認嘅 `SCOPE.md`＋驗收條件 |
| 揀色、抽色、搵配色靈感 | [23 §5.1–5.2](23-design-resources.md) | 有來源、有語意、有對比驗證嘅 design tokens |

**建議次序**：先問清楚 → 查官方 API／現有方案 → 需要時先試工具 → 人手驗收。唔係每個 project 都要裝齊三套 AI 工具。

## 2. PPT Master：真正有價值係「可繼續改」，唔係「一鍵完美」

### 2.1 核實結果／原清單修正

來源：[`hugohe3/ppt-master`](https://github.com/hugohe3/ppt-master)；本輪讀取 commit `f3633771fe699d327f02ae86393831bbcf5169f7` 嘅 [README](https://github.com/hugohe3/ppt-master/blob/f3633771fe699d327f02ae86393831bbcf5169f7/README.md)、[Getting Started](https://github.com/hugohe3/ppt-master/blob/f3633771fe699d327f02ae86393831bbcf5169f7/docs/getting-started.md)、[FAQ](https://github.com/hugohe3/ppt-master/blob/f3633771fe699d327f02ae86393831bbcf5169f7/docs/faq.md) 同 [SKILL.md](https://github.com/hugohe3/ppt-master/blob/f3633771fe699d327f02ae86393831bbcf5169f7/skills/ppt-master/SKILL.md)。

| 原清單講法 | 文件核實後應該點寫 |
|---|---|
| GitHub 7.1 萬星 | GitHub API 喺 **2026-11-06** 回傳 **73,962 stars、MIT**，repo 非 fork。係當日快照，唔係永久數字，亦唔係品質保證。 |
| 上傳 PDF／Word，或者只俾主題 | 佢係**本機、有檔案讀寫及執行命令能力嘅 AI agent** 入面行嘅 workflow，唔係已驗證嘅免安裝網頁服務。README 列 PDF／DOCX／圖片／文字等材料；legacy `.doc` 等格式另需 Pandoc。 |
| 完全可編輯嘅原生 `.pptx` | 文字、圖形等可輸出 PowerPoint 原生元件；**唔等於所有 PowerPoint 功能都齊**，例如上游明言 SmartArt 唔係支援目標。 |
| 圖表都可以編輯 | **要分兩種**：預設圖表係 SVG 轉原生形狀，可改色／改形，但冇 Excel 數據活頁簿；支援嘅圖表／表格可經 `--native-charts-and-tables` 匯出成有數據嘅原生物件。需要改數據就要明確要求，唔好收到檔先假設。 |
| 模板、比例、頁數可揀 | 預設流程會確認溝通目標、格式、頁數等；Quick mode 省略確認，未指定嘅嘢由 agent 決定。公司底稿可走 **Edit Native PPTX**；提煉可重用模板係另一條 **Create Template** 路線。 |
| 動畫、備註都做到 | 上游文件列原生轉場／動畫、講者備註及可選語音；動畫以 Microsoft PowerPoint 為主要驗證目標，Keynote／WPS／LibreOffice 可能有差異。 |
| 支援中日韓德多語言 | Skill 要求跟用戶／來源語言，除非用戶 Override；可以明確要求繁中。但**未做中／日／韓／德輸出品質矩陣**，字形、斷行、字體授權及語音仍要逐種驗。 |

### 2.2 試用條件：開源唔等於零成本／零外傳

- 查閱版本列 **Python 3.10–3.14**、已登入嘅相容 agent host，以及上游 Python dependencies。實際安裝跟 [Getting Started](https://github.com/hugohe3/ppt-master/blob/f3633771fe699d327f02ae86393831bbcf5169f7/docs/getting-started.md)，唔將成套外部 repo 塞入呢個真理倉。
- MIT 係軟件授權；**模型 token、訂閱、搜尋、生圖、語音服務可以另外收費**。先用非敏感短材料試一份，記錄實際時間／費用，再決定長文件值唔值得用。
- 「本機 pipeline」唔代表內容永不離開電腦：材料仍可能送去你選用嘅模型／搜尋／圖片／語音服務。機密合約、成員資料、公司未公開數字，先確認資料處理條款及去敏，唔好直接上傳（[A12](03-security.md)）。
- 只係整理資源，**本輪無安裝、無付費呼叫、無產出 PPTX**；以上係文件核實，唔係效能或品質實測。

### 2.3 可直接改寫嘅簡報需求 prompt（範例，未實測）

```text
請用我提供、已獲授權嘅材料，製作一份俾 [對象] 睇嘅 [用途] 簡報。
語言：繁體中文；比例：16:9；頁數：8–10 頁；模板：[已授權公司 .pptx／自由設計]。
先俾我確認大綱、每頁目的、視覺方向同資料來源，唔好跳過確認直接生成。
輸出可編輯 .pptx；統計圖表同表格要可修改數據，請用支援嘅 native charts/tables 匯出路線。
唔支援嘅項目要逐項講明，唔可以用截圖圖表假裝達標。
唔作數字、唔補作引用；講者備註標明來源檔案／頁碼，未知資料標「待核實」。
完成後回報：輸出檔路徑、原生圖表是否成功、字體需求、未解決問題同需要人手執嘅頁面。
```

方括號內容要按真實任務改；公司模板、品牌字體同圖片本身嘅授權唔會因為工具係 MIT 就自動取得（[W8](12-copyright-scout-system.md)）。

### 2.4 收貨 checklist：有 `.pptx` 唔等於交到貨

- [ ] 用目標 PowerPoint 版本開檔，唔係只睇預覽圖；逐頁檢查 overflow、遮擋、字體缺字及繁中斷行。
- [ ] 隨機改一段文字、一個形狀；抽一個數據圖表改數值，確認圖表真係更新，而唔係只郁到形狀。
- [ ] 對返來源核對數字、日期、單位、引用；AI 補作內容要刪除或明確標示。
- [ ] 公司模板／字體／圖片有授權；第三方來源寫入該 project 嘅 `CREDITS.md`，唔將人哋素材當自己原創（W8）。
- [ ] 有動畫／語音先額外測播放、順序、音量及匯出；冇要求就唔好為咗展示功能而加。
- [ ] 記錄模型、工具 commit、實際成本同失敗項；正式交付檔跟現有 [V 雙版號](13-versioning.md) 慣例。

> [guard](../scripts/guard.mjs)／[final_check](17-final-check-and-tutorial.md) 係本倉嘅程式／文件閘門，**唔會替你開 PowerPoint 驗證內容或原生圖表**。呢張 checklist 必須人手做。

## 3. Reverse API Engineer：自動化偵察，唔係永久 API 保證

來源：[`kalil0321/reverse-api-engineer`](https://github.com/kalil0321/reverse-api-engineer)，本輪 commit `cd221e9ef5fe30d4fb66ad0d5198f179191aca57`。最新 [README](https://github.com/kalil0321/reverse-api-engineer/blob/cd221e9ef5fe30d4fb66ad0d5198f179191aca57/README.md) 仍以 Claude 為預設 SDK，但亦列其他 SDK／多種輸出語言，唔應寫死成「只可用 Claude、只出 Python」。[25](25-reverse-api-reuse.md) 嘅舊版本盤點保留做歷史紀錄。

```text
網址＋想要嘅欄位
  → 先查官方 API、授權、ToS（P1）
  → 喺乾淨／獲授權嘅瀏覽 session 做一次操作
  → 捕獲 HAR（manual／指定 agent capture 路線）
  → 模型分析請求 → client 候選（例如 api_client.py）
  → 去敏、code review、schema／分頁／錯誤測試
  → server-side 授權＋限速＋fail-closed＋drift 監察
```

| 宣傳易誤解位 | 正確邊界 |
|---|---|
| 「唔使爬蟲」 | 可以減少依賴 DOM selector，但捕獲階段仍可能用 Playwright／瀏覽器自動化；唔係完全唔涉及網站存取。 |
| 「IKEA 190 個書桌」 | 仍係原影片案例，**本倉未錄 HAR 或打 IKEA endpoint 驗證**。詳見 [26 案例 C](26-reverse-api-walkthrough.md)，唔當已交付功能。 |
| 「網站改版都唔會掛」 | 冇呢個保證。endpoint、schema、token、headers、限流或 bot 防護一變，client 都可以壞；要健康檢查同失效通報。 |
| 「生成咗就可以直接用」 | 上游都叫你先 review 生成 code 先執行。唔好跳過測試，亦唔好直接將 client credentials 放前端。 |

**補強防線（沿用現有規則，唔另建一套）**：

1. **先官方，後私有**：跟 [25 §5](25-reverse-api-reuse.md) 查現成 API；記錄點解要用私有 endpoint。攞到數據唔代表有權重用，仍要睇條款／私隱。
2. **HAR 當敏感材料**：可含 Cookie、Authorization、response 個人資料。用專用測試帳號／最少操作，分享前檢查及去敏；原始 HAR 唔入 Git、唔直接貼畀模型。去敏唔等於取得授權（[A1／A12](03-security.md)）。
3. **憑證唔寫死**：唔好將捕獲到嘅長期 token 當常設金鑰；跟 [26 §5](26-reverse-api-walkthrough.md) 處理 refresh／失效，意外洩漏就跟 [11](11-incidents.md) 輪換。
4. **生成 code 只係候選**：保留 timeout、分頁、429、空結果、schema drift 測試；重用 [25 §2](25-reverse-api-reuse.md) 嘅 proxy／限速／錯誤紀錄骨架。瀏覽器依賴留喺工具環境，唔塞入前端 bundle。

本輪無新逆向目標、無執行外部工具；可跑嘅本倉示例仍然係 [`templates/reverse-api-demo/`](../templates/reverse-api-demo/README.md)。

## 4. `/grill-me`：先釐清決策，再寫規格；唔係保證成品啱用

來源：[`mattpocock/skills`](https://github.com/mattpocock/skills)，本輪 commit `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`；已讀 [grill-me](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grill-me/SKILL.md)、[grilling](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/productivity/grilling/SKILL.md)、[grill-with-docs](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/grill-with-docs/SKILL.md)、[to-spec](https://github.com/mattpocock/skills/blob/4ae2317ddb22b046e26455e4f9c9b3aaaf62212d/skills/engineering/to-spec/SKILL.md) 同對應人讀頁。

### 4.1 名稱同功能唔好撈亂

| 名稱 | 實際係乜 | 唔應該誤解成 |
|---|---|---|
| `/grill-me` | User-invoked wrapper，呼叫 `grilling`；單獨裝 wrapper 並唔保證依賴已齊 | 自動寫 App／自動產出完整規格書 |
| `grilling` | 可重用訪談方法：逐輪問到共同理解，事實由 agent 查、決定留畀用戶 | 要安裝嘅獨立「規格產生器」 |
| design tree | 決策之間嘅依賴樹 | 本輪查閱 tree 內未見同名獨立 Skill，唔寫成必裝 `/design-tree` |
| frontier | 前設已解決、**而家可以問**嘅決策集合；唔係無限 context memory | 未見同名獨立 Skill，唔寫成必裝 `/frontier` |
| `/grill-with-docs` | 訪談期間更新 `GLOSSARY.md`，合資格決策寫 ADR；依賴 `grilling`＋`domain-modeling` | 所有問答都會自動保存成完整 spec |
| `/to-spec` | 將已有對話整合成規格並發布去 issue tracker；需要相應 tracker 設定 | 取代需求訪談，或者喺任何環境都自動識發布 |

`grill-me` 嘅直接產出係**共同理解**，唔係一份保證齊全嘅檔案。要規格落地，仍要整理範圍、資料流、錯誤情況、非功能要求及驗收案例，再俾用戶確認。上游另有 `wayfinder` 處理跨 session 大計劃，但本倉未安裝，唔列做既有能力。

### 4.2 本倉已經點接住（唔使再抄一份 Skill）

| 上游概念 | 本地落地入口 | 狀態 |
|---|---|---|
| 訪談方法原文 | [`skills/external/grilling/SKILL.md`](../templates/repo-starter/skills/external/grilling/SKILL.md) | 已有 MIT 原文；本輪核對方法正文仍一致，不改 upstream 快照 |
| 一輪問晒 frontier＋建議答案 | [`INTAKE.md`](../templates/repo-starter/INTAKE.md) | **開新 repo 先用完整問卷**；改現有 repo 只需問清楚想改乜 |
| 用戶確認後先施工 | [`repo-setup/SKILL.md`](../templates/repo-starter/skills/promoted/repo-setup/SKILL.md) | Agent 主動讀；本環境無對應 Skill tool 自動觸發 |
| 範圍／術語／決策留檔 | 起手包 `SCOPE.md`／`GLOSSARY.md`／ADR 範本，見 [27](27-repo-starter.md) | 用本地檔案落地，唔依賴 conversation 記住所有答案 |
| Skill 來源、分類、依賴治理 | [`skills/CATALOG.md`](../templates/repo-starter/skills/CATALOG.md)＋[29](29-reading-map.md) | 呢輪係資源整理，無新增／promote 外部 Skill |

**如果喺相容 agent harness 另行安裝**：先按上游安裝說明審視來源，確保 wrapper 連同所需 primitive 一齊安裝；唔好喺呢個真理倉自動裝成套 plugin。Slash 指令係 host 功能，唔係貼入 README 就會生效。

驗收唔係「佢問咗好多問題」，而係：答案有冇寫入 SCOPE；有冇明確唔做清單；每項重要要求有冇可測條件；用戶有冇確認；實作後有冇對返規格。呢啲先係減少「做出嚟唔對」嘅防線。

## 5. 將工具串起嚟：每一步都有可檢查產出

| 階段 | 做乜 | 產出／依據 |
|---|---|---|
| 1・問清楚 | 新 repo 跟 INTAKE；現有 repo 先確認改動範圍 | 已確認範圍＋驗收條件（F1） |
| 2・查先例 | 查自己 repo、官方 API、同類產品、費用／授權 | P1 紀錄；需要私有 API 先入 §3 防線 |
| 3・定視覺 | 配色站搵靈感 → 對比檢查 → token | [23 §5.2](23-design-resources.md)；`DESIGN.md`／`CREDITS.md` |
| 4・實作與測試 | 按現有 S/F/A/W/V 同技術棧契約施工 | `guard`＋測試＋真實操作；唔係單靠 AI 自稱完成 |
| 5・有需要先出簡報 | 用已核實材料試 PPT Master，跟 §2.4 收貨 | 可編輯檔＋來源／成本／限制紀錄 |

> 呢條係按需要選用嘅工作路線，唔係「每個 app 必須裝 PPT Master／RAE／外掛 Skill」嘅新底線。

## 6. 查證限制／維護

- **已做**：2026-11-06 用 GitHub API 查三個已識別第三方上游 repo metadata、commit、README／指定 Skill 文件；配色站只核對公開搜尋索引內嘅官方頁摘要。冇將搜尋摘要當操作實測。
- **範圍定案**：2026-11-06 用戶確認冇第 4 個 AI 工具；已移除待補位，唔再按原貼文編號缺口補項。
- **未做**：安裝／執行三個已識別 AI 工具、模型付費測試、PPTX 人手驗收、第三方網站逆向、Skill slash-command 實測、配色站登入／上傳／匯出、地區可用性測試。原貼文三條影片亦未核實內容。
- **自有方案限制**：本輪查 `playerkousas-rgb/PPTMAKER` GitHub API 回傳 **404**，未能核實現況；[28](28-repo-taxonomy.md) 嘅「空殼／預留」只係舊盤點，唔當作今日仍存在的證明。自有 `voice_slide_web` 屬簡報播放方向，見 [24](24-similar-products.md)，唔等於 PPT 生成器。
- **單一入口**：配色去 23；PPT 評估留本頁；Reverse API 深入內容留 25／26；Skill 方法／目錄留 INTAKE／CATALOG。15、29、README 只放指針，唔複製多份功能表。
- **重新核實時機**：真正採用前、工具升級後、引用星數前。更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件檢查通過唔會升級「未實測」狀態。
