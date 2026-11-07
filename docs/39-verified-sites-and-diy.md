# 39 — 10 個網站實測＋「邊啲值得自己做」總清單

> 呢份管兩件事：① 用戶 2026-11-07 提供正確網址之後，**逐個真開**嚟核實嗰 10 個站（Logo Diffusion／Scrolltide／navbar.gallery／footer.design／cta.gallery／styles.refero.design／supahero.io／3dicons.co／glass.samasante.com／apivault.dev），更正之前 [37](37-ai-tools-design-prompts.md)／[38](38-animation-3d-prediction-tools.md)「開唔到站、未核實」嘅狀態；② 將第一至五輪清單（[34](34-ai-workflow-tools.md)–[38](38-animation-3d-prediction-tools.md)）入面所有嘢，統一答一次「**邊啲值得我哋自己做**」，唔使逐輪重問。
> 本頁唔新增規則 ID。本輪**真係做咗兩樣**：自己嘅 SEO/GEO 靜態檢查器 [`scripts/seo_check_v1.0.mjs`](../scripts/seo_check_v1.0.mjs)（§3.1），同起手包 `web-motion` 補返 React／framer-motion 線（§3.2）。其餘自己做候選逐個判，未做嘅寫明未做。

## 1. 10 個站實測（2026-11-07 逐站開嚟睇）

| 站 | 實測結果 | 有冇用 | 判 |
|---|---|---|---|
| [Scrolltide](https://scrolltide.co) | **唔係免費**：$299 一次性付費，140 模板／75 組件／55 shaders，大部分 Premium、得小量 Free；賣點係「copy prompt 貼畀 AI」，技術棧明寫 React／Vite／Next／Tailwind／Framer Motion／GSAP／Three.js | 付費，唔保留 | ❌ **已剔除**（用戶規矩 2026-11-07：唔係免費嘅唔需要保留，見 [41 §4](41-free-self-build-shortlist.md)）。唔再考慮課金；React 動畫點寫行返自家 `web-motion` skill（framer-motion 線，見本頁 §3.2）。片中「8 個免費金礦」講法喺呢站係錯嘅，已更正 [23 §5.3](23-design-resources.md) |
| [navbar.gallery](https://navbar.gallery) | 免費，550+ 個真實網站 navbar，可按 dropdown／megamenu／sidebar／searchbar 等分類，每個有截圖＋原站連結 | 有用 | **開工參考**，已入 [23 §5.3](23-design-resources.md)。借結構唔借品牌樣 |
| [footer.design](https://footer.design) | 免費，footer 專門畫廊，可按 type／style 篩選 | 有用（細但專） | 同上。記住我哋 footer 硬性要有 © SCOUT SYSTEM |
| [cta.gallery](https://cta.gallery) | 免費，CTA 畫廊，可按行業／明暗篩選 | 有用 | 同上。一頁一個主 CTA 先係學到嘅紀律，唔係抄款 |
| [styles.refero.design](https://styles.refero.design) | 免費（Beta），**2,000+ 個真實產品嘅 DESIGN.md**：色／字體／間距／組件寫成 AI 睇得明嘅檔，可直接餵 Cursor／Claude Code／Codex，仲有 MCP 連接 | **今次最有用** | 同我哋 [23](23-design-resources.md) 嘅 DESIGN.md 工作流係同一件事，仲要係現成 2,000 個起點。用法：揀一個做**結構起點**，換返自己色／字體先用——成份抄 Stripe／Apple 嗰啲等於扮人哋品牌，唔得。已更新 [23 §5.3](23-design-resources.md) |
| [supahero.io](https://supahero.io) | 免費，hero section 範例庫（現屬 Screensdesign） | 有用 | 借構圖唔借圖（W8），已入 [23 §5.3](23-design-resources.md) |
| [3dicons.co](https://3dicons.co) | 免費，1,500+ 手工 3D icon，**CC0**（個人／商業、免署名）；有線上 editor 改色／角度／remix；另有 Pro 版 | **有用，即刻用得** | 活動頁／海報／簡報嘅內容裝飾直接落載嚟用（CC0 嗰批先免署名，Pro 另計）。**唔准做 favicon**——站台圖標照返 [G11](33-icon-standard.md)。已更新 [23 §5.3](23-design-resources.md) |
| [glass.samasante.com](https://glass.samasante.com) | 真 code：`@samasante/liquid-glass` v0.1.0、**MIT、零依賴**，真 DOM 折射、Safari／Firefox／Chrome 都得 | 有用但好新 | v0.1.0 即係早期版：細範圍試（一個 hero 玻璃牌），實測效能同 AA 對比先擴大用 |
| [apivault.dev](https://apivault.dev) | 企喺度：**1,454 個 API、51 分類**，每條有 HTTPS／CORS／要唔要 key 標籤；開源 repo 755★ | 有用 | 維持 [38 §3](38-animation-3d-prediction-tools.md) 判：我哋 `api` repo 之後嘅**第二層發現**，已入 [15](15-resource-index.md)。目錄會過期，逐間要返官方核實 |
| [logodiffusion.com](https://logodiffusion.com) | 免費生圖（唔使信用卡），自稱 1.4m+ 用戶（未核實）；文字／草稿／相 → 11 種 logo 風，逐個元素改，**出到真・grouped SVG 向量檔**或者透明 PNG；另有 logo 動畫 | 有用 | 做 logo **意念稿**真係啱：出 SVG 呢點贏過一般生圖。但交付用嗰陣：① 佢生成嘅款可能撞款，商標註冊前要查；② 站台圖標最終照返 [G11](33-icon-standard.md) 出 9 個檔驗收，唔好攞 AI 圖直接縮做 favicon；③ 免費生圖唔等於免費商用出檔，出檔嗰步嘅收費／授權第一次用嗰陣睇清 |

## 2. 「值得自己做」總清單（五輪嘢一次過判）

> 判準用返 [36 §2](36-lazy-coding-and-open-alternatives.md) Ponytail 七級梯第一級：**需唔需要存在？** 外面有得用又啱授權嘅，唔好自己起壇；自己做只做三種：① 外面嗰件入唔到我哋流程（要 plugin／要課金／數據問題）；② 我哋已有生態（scripts／skills／templates）加少少就覆蓋到；③ 做完之後每個 app 都受惠。

| 候選（來源） | 自己做？ | 點解／做成點 |
|---|---|---|
| SEO/GEO 檢查器（Claude SEO／OpenSEO 啟發） | ✅ **已做**（§3.1） | Claude SEO 要 Claude Code plugin，我哋環境行唔到；靜態嗰部分（title／og／JSON-LD 等）用零依賴 script 就驗到，仲可以入 CI |
| React／framer-motion 動畫施工線（Animate UI／Scrolltide 啟發） | ✅ **已做**（§3.2） | 普查話我哋 React 線用 framer-motion（105 檔案），但 `web-motion` 淨係講 GSAP——補返條線先係對返自己生態 |
| 自己嘅 DESIGN.md 風格庫（Refero 啟發） | 🔶 **值得，下次做** | 唔係 scrape Refero 2,000 個（嗰啲係人哋品牌），係將我哋自己 35 個 React/Next repo 用過嘅設計，沉澱成 3–5 套「SCOUT house styles」DESIGN.md 入起手包。成本低（整理現有嘢）、每個新 repo 受惠 |
| ApiVault 式搜尋介面（落自己 `api` repo） | 🔶 **值得，細細做** | 我哋已有 `apis.csv` 數據，欠嘅只係一個可搜尋靜態頁，喺 `api` repo 入面做，唔好喺真理倉另起一份數據（F1）。做之前先確認 `api` repo 而家有冇前端，冇先加 |
| Pre-mortem 人格鬧場模板（MiroFish 啟發） | 🔶 **可做，只做 prompt 模板** | 唔起成千 agent 引擎（燒 token＋AGPL＋模擬唔係證據，[38 §4](38-animation-3d-prediction-tools.md)）；做就做一份 INTAKE 附加問題集：「假設一年後呢個 app 死咗，邊三個原因」，產出只入「待真人驗證」欄 |
| 世界電台地圖 app（Radiocast 啟發） | ❌ 唔做 | 用 Radio Browser 嗰類免費 API 技術上做到，但同 Scout 主線冇關係；想玩就開人哋個站聽，唔好開個 repo 養 |
| 免費 LLM 路由器（FreeLLMAPI 啟發） | ❌ 唔做 | 上游自己寫明 not production（[37 §2](37-ai-tools-design-prompts.md)）；自己砌一個只會更唔穩，仲要養 30+ 條 key |
| Sketch→Logo 生成器（LogoDiffusion 啟發） | ❌ 唔做 | 要專門模型，我哋冇；用佢 SaaS 出意念稿已經夠，交付行 G11 管線 |
| 成套 UI 畫廊站（navbar.gallery 等啟發） | ❌ 唔做 | 人哋免費又更新勤，自己起一個等於養多份會過期嘅截圖倉；我哋要沉澱嘅係**自己嘅** component 樣式（嗰個係 DESIGN.md 庫嗰行，唔係畫廊站） |
| Ponytail 式 review／audit 工具 | ❌ 唔使做 | `guard`／`consistency`／`final_check`／`audit_single_html` 已覆蓋；方法（七級梯）已入 [36](36-lazy-coding-and-open-alternatives.md)，唔好再寫多支 |

## 3. 本輪真係做咗嘅兩樣

### 3.1 `scripts/seo_check_v1.0.mjs` — 自己嘅 SEO/GEO 靜態檢查器

- **點用**：`node scripts/seo_check_v1.0.mjs <path-to.html> [--json]`；退出碼 0／1／2 同其他 script 一致（CI 用得）。守護測試 `scripts/seo_check.test.mjs`（7 個，`node --test scripts/seo_check.test.mjs` 全過）。
- **驗乜**：title（冇＝FAIL）、meta description（冇＝FAIL）、charset／viewport／lang、robots noindex 警告、canonical、og 三件、JSON-LD（壞 JSON＝FAIL）、h1 數量、img alt。
- **唔驗乜（老實寫）**：Core Web Vitals 分數、Google 收錄狀態、排名、AI 引用率——嗰啲要 PageSpeed＋Search Console＋人手，呢支唔扮做到。想做全套審計仍然係 [37 §3](37-ai-tools-design-prompts.md) Claude SEO 嗰條路（喺你自己 Claude Code 環境試）。
- **即刻實跑示範**：`node scripts/seo_check_v1.0.mjs templates/canvas/index.html` → 1 FAIL（冇 meta description）＋5 WARN（冇 canonical／og／JSON-LD）。嗰個檔係 Canvas 殼模板、本身唔係公開 SEO 頁，**示範嚟，唔使改佢**；真係公開嘅頁上線前行一次就係咁用。

### 3.2 起手包 `web-motion` 補 React／framer-motion 線

- 改咗 [`templates/repo-starter/skills/promoted/web-motion/SKILL.md`](../templates/repo-starter/skills/promoted/web-motion/SKILL.md)：What 段分清兩條線（React 線 framer-motion／靜態線 GSAP）、施工要點第 2 點按線揀引擎、驗收清單同步。原因係 [38 §2.1 普查](38-animation-3d-prediction-tools.md)：我哋 framer-motion 有 105 個檔案在用、GSAP 得 5 個，舊版 skill 淨係教 GSAP 係同生態脫節。
- 冇改 frontmatter、冇加新 skill，CATALOG 唔使改；`check_skills` 照過（下面維護段）。

## 4. 查證限制／維護

- **已做**（2026-11-07）：逐站開晒 10 個站嘅首頁（fetch 成功，內容見 §1）；更正 [23 §5.3](23-design-resources.md) 嘅 Scrolltide 免費講法同各站描述；寫咗 `seo_check_v1.0.mjs`＋7 個測試並實跑一次真檔案；改咗 `web-motion` 三處。
- **未做**：冇註冊／課金任何站（Scrolltide $299 未買、LogoDiffusion 未出過檔、Refero MCP 未駁）；冇逐間驗 ApiVault 1,454 條 API；LogoDiffusion「1.4m 用戶」、Scrolltide 模板質素、liquid-glass 效能，全部未實測。
- **更新時機**：真係買／用之前再睇條款；做咗 §2 嗰兩個 🔶 候選嗰陣，返嚟將狀態改成 ✅ 並寫低喺邊個 repo 做。再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`；文件檢查通過唔會升級「未實測」狀態。
- **單一入口**：設計資源去 [23](23-design-resources.md)；API 去 [15](15-resource-index.md)；爆紅清單各輪去 [35](35-viral-ai-tools.md)–[38](38-animation-3d-prediction-tools.md)；本頁只放 10 站實測＋自己做總清單＋本輪兩件交付，唔複製其他功能表。
