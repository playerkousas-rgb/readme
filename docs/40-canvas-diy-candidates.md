# 40 — 邊啲嘢應該用 Gemini＋Canvas 自己整（候選判決）

> 呢份答用戶一個問題：第一至五輪清單（[34](34-ai-workflow-tools.md)–[39](39-verified-sites-and-diy.md)）入面，**邊啲值得用我哋 Gemini＋Canvas 系統（Type A／B／C）自己整**。判決跟返 [09 C1 決策表](09-gemini-canvas.md)（要證明來源→B；要留紀錄／保護 prompt→C；要 call Gemini→B 或 C；都唔係→A），同埋 [39 §2](39-verified-sites-and-diy.md) 嘅「自己做」判準：外面有得用又啱授權嘅唔好起壇；自己做只做入到我哋流程、每個 app 都受惠嗰啲。
> 本頁唔新增規則 ID，**亦唔代表已開工起任何 app**；真係起嗰陣，要跟返根 README 嘅「開新 REPO 6 步」，喺**新 repo** 做，唔好喺呢個真理倉起 app（AGENTS.md 開工順序）。

## 1. 判決總表

| # | 候選（靈感來源） | 用 Canvas 整？ | 結構 | 優先 |
|---|---|---|---|---|
| 1 | **G11 圖標產生器**：上載母圖 → 出齊 9 個圖標檔（[33](33-icon-standard.md)） | ✅ **應該整** | Type A | **第一** |
| 2 | **風格海報／明信片產生器**：相＋風格名 → 成品圖（[37 §4](37-ai-tools-design-prompts.md)） | ✅ 整，但係**升級現有**，唔好新起 | Type B（要紀錄／保密 prompt 升 C） | 第二 |
| 3 | **Pre-mortem 意念鬧場**：入 idea → 人格化批評清單（[38 §4](38-animation-3d-prediction-tools.md) MiroFish 啟發） | 🔶 可整，但排最後 | Type C（prompt 係資產、意念可能敏感） | 第三 |
| 4 | 相片預備工具：壓縮到 <500KB／轉 PNG·JPG·WebP（Convertio 啟發） | 🔶 可整，細工具 | Type A | 有餘力先 |
| — | API 搜尋頁（ApiVault 啟發） | ❌ 唔用 Canvas | 靜態頁入 `api` repo | [39 §2](39-verified-sites-and-diy.md) 已判 |
| — | 其餘（SEO 檢查／LLM 路由／電台地圖／3D 世界／Logo 引擎等） | ❌ 唔用 Canvas | 見 §3 | — |

## 2. 逐個講

### 2.1 G11 圖標產生器（Type A）— 最應該整嗰件

- **點解係佢**：每個新 repo 開工都要出齊 9 個圖標檔（[33](33-icon-standard.md)：16／32／180／192／512／maskable 兩隻／favicon.ico／og-image），而家係**人手照規格出圖**，冇工具。呢件係純確定性運算（縮放、置中、安全區、打包），唔使 API key、唔使 prompt、唔使後端——正中 Type A 定義（工具、公開 demo、一個 HTML 攪掂）。
- **功能範圍（起嗰陣照呢個，唔好加多）**：① 上載方形母圖（本地處理，唔上載去任何 server）；② 即時預覽各尺寸，**16px 嗰格要嚟驗「縮到咁細認唔認得出」**（33 §4 第 6 點）；③ maskable 預覽疊 66% 安全區框＋圓裁預覽；④ 一鍵逐個下載 8 個 PNG＋`favicon.ico`（16／32／48 三合一，瀏覽器砌 ICO 容器做到）；⑤ og-image（1200×630）用母圖置中＋標題文字砌；⑥ 順手出埋 `<head>` 5 link＋4 meta 同 `manifest.webmanifest` 內容畀人 copy（33 §7 現成規格）；⑦ 每個檔顯示 KB，同 33 嘅 ≤260KB 總預算對照，超咗出聲。
- **唔做嘅嘢**：唔做 AI 生圖（母圖邊度嚟係用戶嘅事，可以用 [39 §1](39-verified-sites-and-diy.md) LogoDiffusion 出意念稿再餵入嚟）；唔做 ZIP 打包（要 JSZip 就多個依賴，逐個下載夠用；真係要先再講）；16×16「手繪版」係 33 §6 嘅要求，工具只可以畀**像素格編輯**幫手起稿，最終認唔認要用眼驗，唔好寫「自動生成手繪版」扮做到。
- **點解唔用現成網上工具**：網上 favicon generator 多到一地都係，但冇一個跟我哋 33 嘅規格（maskable 66%、冇 1024、PNG/ICO 限定、≤260KB、head 掛法），逐次對規格就係每次新 repo 嘅重複勞動——呢啲先係自己整工具要消滅嘅嘢。

### 2.2 風格海報／明信片產生器（Type B，升級現有）

- **唔好新起**：你已經有 Type B 實證 app（童軍漫畫生成器，[16 案例](16-canvas-case-scout-comic.md)）同 `templates/watermark/scout_generator_v1.0.html` 骨架；再生一個「風格轉換 app」只會同佢哋重複（犯 F1）。
- **值得加嘅係 presets**：將 [37 §4.1](37-ai-tools-design-prompts.md) 風格詞彙（瑞士／編輯／黏土／青花瓷／厚塗／明信片等）做成現有產生器嘅風格掣，加埋「產品唔變形」鎖定句（[37 §4.2](37-ai-tools-design-prompts.md)）同上／下對比預覽（原相 vs 成品）。成品照落 W1 頁尾＋W2 隱形水印，解碼器驗到先用。
- **幾時升 Type C**：想留原圖／成品圖／使用紀錄，或者啲 prompt 調校想保密嗰陣，先跟 [09 C6](09-gemini-canvas.md) 拆腦殼分離；未有呢個需要就唔好為升而升（GAS 部署同 quota 係真成本）。

### 2.3 Pre-mortem 意念鬧場（Type C）— 排最後，要有心理準備

- **整到嘅版本**：入一段 idea 描述 → Gemini 分飾幾個人格（家長／領袖／新手用戶／財務嗰個）逐個鬧 → 出「邊度唔清晰、邊度冇人會用、邊度貴」清單。呢個係 MiroFish 嘅平價版：唔起模擬世界、唔燒成千 agent 嘅 token，一次 Gemini call 攪掂。
- **點解 Type C**：批評 prompt 係你會慢慢調校嘅資產（唔想畀人抄就放腦）；用戶入嘅 idea 可能係未公開計劃，紀錄點存要諗過（跟 [templates/canvas/PROMPT_v1.0.md](../templates/canvas/PROMPT_v1.0.md) 規矩：RECORDS 只存 hash＋版本，唔存原文）。
- **紅線（整之前要接受）**：產出永遠係**假設清單**，唔係用戶證據（[38 §4](38-animation-3d-prediction-tools.md)）；個 app 介面同報告都要寫明呢句，唔好做到似「AI 幫你驗證咗」咁。用佢代替問真人，就係整咗嚿嘢嚟呃自己。

### 2.4 相片預備工具（Type A，可有可無）

上載前將相壓到 <500KB（S6 上載面規矩）、轉 PNG／JPG／WebP、去 EXIF，全部瀏覽器本地做到，唔使 Convertio 嗰種「上載去人哋 server」（[38 §5](38-animation-3d-prediction-tools.md) 私隱嗰課）。同 2.1 同屬「媒體預備」類，**如果起 2.1，可以考慮合併做同一工具嘅第二個 tab**，唔好起兩個 app。

## 3. 唔好用 Canvas 整嗰啲（講明原因，唔好下次又諗返）

| 候選 | 唔用 Canvas 嘅原因 |
|---|---|
| SEO 檢查器 | 已做 CLI script（[39 §3.1](39-verified-sites-and-diy.md)），入 CI 先係佢嘅價值；做網頁版只會冇咗自動化，仲要養多份邏輯 |
| 免費 LLM 路由／聚合 | 要 server 保管 30+ 條 key＋長開服務，Canvas 前端做唔到亦唔應該做（A1）；[37 §2](37-ai-tools-design-prompts.md) 已判 not production |
| 世界電台地圖 | 做到（公開 API＋地圖），但同 Scout 主線冇關係（[39 §2](39-verified-sites-and-diy.md)）；Canvas 唔係「做到就整」嘅理由 |
| 文字生 3D 世界 | Gemini 生 Three.js code 再即場行，出錯同安全都冇得控；要 3D 預覽用返 [36 §4](36-lazy-coding-and-open-alternatives.md) Blender／OSM 嗰條線 |
| Sketch→Logo 生成 | 要專門模型；用 LogoDiffusion 出稿＋2.1 處理交付，先係最短路徑 |
| Animate UI／設計畫廊類 | 嗰啲係 React 生態同參考站，唔係 app；React 線動畫已喺 `web-motion` 補返（[39 §3.2](39-verified-sites-and-diy.md)） |
| 管理類（預約／客服／項目） | 要身份、要 DB、要長開——係 PLAYBOOK §0 嘅 App／系統類，走 Vercel＋Supabase／GAS，唔好塞入單一 HTML（C2 明文：重要紀錄唔好只放 LocalStorage） |

## 4. 開工次序建議

1. **先起 2.1 圖標產生器**（Type A）：範圍最細、每個新 repo 即刻受惠、冇 key 冇後端，做完用 `audit_single_html` 驗一次就交付得。
2. 之後先喺**現有產生器 repo** 加 2.2 嘅風格 presets（唔好喺真理倉改模板當交付）。
3. 2.3 等真係有 idea 想鬧、又接受到「假設唔係證據」先起，而且要行 Type C 全套（contract／RECORDS／brain 測試）。
4. 每次起完，返嚟呢頁將狀態更新，並照根 README「開新 REPO 6 步」喺新 repo 落地，唔好將 app 本體放返入真理倉。

**查證限制**：本頁係按 [09](09-gemini-canvas.md) 決策表、[16](16-canvas-case-scout-comic.md) 實證案例同 [33](33-icon-standard.md) 規格做嘅判決，冇起過任何新 app、冇實測過 ICO 瀏覽器打包喺各瀏覽器嘅相容性（2.1 開工第一件事就要驗呢樣）。再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json` 先 commit。
