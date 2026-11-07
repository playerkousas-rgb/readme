# 41 — 值得自己做總清單（免費限定）：Gemini AI／自架系統／前端網站

> 用戶 2026-11-07 定落兩條規矩：**① 唔係免費嘅唔保留**（付費項目唔入候選，見 §4 剔除記錄）；**② 要一份「值得我哋自己做」嘅清單**，按做法分三種：Gemini AI 嗰種、自架系統嗰種、前端網站嗰種。本頁將第一至六輪參考資料（[34](34-ai-workflow-tools.md)–[40](40-canvas-diy-candidates.md)）所有候選按此重新收攏，一次過答曬，唔使逐輪重問。
> 「免費」定義：開源可本機／自架跑、或免费额度真係用到核心功能；用 Gemini API 嗰種會耗用戶自己嘅 Gemini 額度，嗰個係用量成本唔係買工具，逐項寫明。本頁唔新增規則 ID；未實測嘅逐項寫明未實測。

## 1. Gemini AI 嗰種（Type B／C，跟 [09](09-gemini-canvas.md) 決策表）

| # | 值得做 | 狀態 | 下一步／門檻 |
|---|---|---|---|
| G1 | **風格海報／明信片產生器**：相＋9 個風格 presets → 成品圖 | ✅ presets 已備好（[STYLE_PRESETS_v1.0.md](../templates/canvas/STYLE_PRESETS_v1.0.md)＋根 README §1 入口），**未貼入任何 app、未出過圖** | 喺**現有產生器 repo**（童軍漫畫生成器嗰邊）貼入做風格掣，唔好新起 app（犯 F1）；貼完實跑幾張，驗標籤串字同 W2 水印解碼先算完成。要留紀錄／保密 prompt 先升 Type C |
| G2 | **Pre-mortem 意念鬧場**：入 idea → Gemini 分飾四人鬧 → 假設清單 | ✅ **模板已備好**（[pre-mortem.md](../templates/repo-starter/docs/pre-mortem.md)），覆蓋約八成價值；**Type C app 未起** | 而家用模板就夠；真係要留紀錄＋保密 prompt 先起 Type C app（腦殼分離全套）。紅線：產出永遠係**待驗證假設**，唔係用戶證據，唔好用嚟代替問真人 |
| — | Sketch→Logo（手繪草稿→logo 母圖） | ❌ 唔自己起引擎 | 要專門模型；用 LogoDiffusion 免費出稿（已核實免費生成、免信用卡，[39 §1](39-verified-sites-and-diy.md)）→ 入 [Icon Maker](../templates/iconmaker/icon_maker_v1.0.html) 出齊 9 檔。呢個係「用免費 SaaS」，唔係自己做 |

## 2. 自架／本機系統嗰種 — ❌ 用戶決定唔做（2026-11-07）

> 用戶明示「本機唔做」：唔喺本機跑生成工具、唔自架養 server。以下全部剔出候選，保留一行記錄點解當初諗過＋點解唔做，將來改主意先再開返：

| # | 曾經候選 | 唔做原因 |
|---|---|---|
| S1 | VoxCPM2 本機粵語 TTS／配音（Apache-2.0） | 本機跑，唔做。要配音嗰陣行返雲端／現成服務，同意＋AI 標記規矩照 [34 §5](34-ai-workflow-tools.md) |
| S2 | HyperFrames 本機出片（Apache-2.0） | 本機 CLI 出片，唔做 |
| S3 | 手繪故事片管線 story-to-handdrawn-video（Remotion） | 本機渲染，唔做；兼 Remotion 授權要核實 |
| S4 | Pixel2Motion 動態 logo（MIT） | 本機試作，唔做 |
| S5 | Cal.diy 預約自架 | 唔自架（要養 Next.js＋DB）；真有預約場景嗰陣先考慮託管版，嗰個係用現成服務唔係本機做 |

**唔自架（已判，唔好下次又諗返）**：AppFlowy（同 Git Markdown 真理重複，犯 F1）、OpenProject（自架重；項目管理已有 Git＋ecportal）、Chatwoot（自架重；找管理員已有 [31](31-system-basics.md) ADMIN 回報路線）、VoiceStudio（AGPL＋聲音同意問題，粵語行 S1）、Open Generative AI（無內容過濾，同 W 底線衝突）、免費 LLM 路由（上游自承 not production，仲要養 30+ 條 key）、OpenSEO（身份未確認，唔亂裝）。

## 3. 前端網站嗰種（Type A 單一 HTML／靜態頁／React 線）

| # | 值得做 | 狀態 | 下一步／門檻 |
|---|---|---|---|
| F1 | **G11 圖標產生器**（Type A） | ✅ **已做**（[iconmaker/](../templates/iconmaker/icon_maker_v1.0.html)，audit PASS） | 下一個新 repo 開工抄去用；第一次用照 [33](33-icon-standard.md) §9 做真機驗收（ICO 相容／多檔下載／16px 認讀未喺真瀏覽器實測） |
| F2 | **相片預備工具**（Type A，壓到目標 KB／轉格式／去 EXIF） | ✅ **已做**（[photo_prep_v1.0.html](../templates/iconmaker/photo_prep_v1.0.html)，audit PASS） | 即開即用；未喺真瀏覽器逐平台實測 |
| F3 | **自家 API 搜尋頁**（靜態前端，落自己 `api` repo） | 🔶 **未做，價值細，待用戶決定** | 先分清：人哋嘅 [ApiVault](https://apivault.dev) 已經免費任用（1,454 條 API 有齊搜尋，唔使起）；但我哋自己個 `api` repo（HK Free APIs）只有 `data/apis.csv`＋20+ 份 docs、**冇網站前端**，佢嘅價值係香港可用性角度（人哋冇）。起一頁靜態搜尋純粹係方便自己睇嗰份清單，GitHub 本身都開到 CSV——要唔要做等用戶話事，唔好喺真理倉另起一份數據（F1） |
| F4 | House DESIGN 風格庫（自家 3 套 DESIGN.md） | ✅ 起點已做（[design-styles_v1.0.md](../templates/repo-starter/docs/design-styles_v1.0.md)） | **未驗對比度、未喺真 app 用過**；採用前用 WebAIM 驗色對，通過先入新 repo |
| F5 | SEO/GEO 靜態檢查器 | ✅ **已做**（[`scripts/seo_check_v1.0.mjs`](../scripts/seo_check_v1.0.mjs)，唔做好網頁版） | 公開頁上線前行一次／入 CI；唔驗排名同收錄（要 Search Console） |

**用免費現成、唔自己起**：navbar.gallery／footer.design／cta.gallery（設計參考，免費）、3dicons（CC0 圖標素材，Pro 付費部分唔使理）、liquid-glass（MIT 細庫，要玻璃 UI 先引）、Refero（參考人哋點寫 DESIGN.md；自己嗰套行 F4，唔 scrape 人哋品牌）。

## 4. 剔除記錄（唔免費，唔保留）

| 項目 | 剔除原因 |
|---|---|
| Scrolltide（$299 一次性付費模板庫） | 用戶規矩 2026-11-07：唔免費唔保留。技術棧幾啱都唔入候選；[39 §1](39-verified-sites-and-diy.md) 判決已同步改為剔除。React 動畫點寫，我哋已有 `web-motion` skill（framer-motion 線）免費覆蓋 |

## 5. 建議開工次序

1. **G1**（價值最高、料已備好）：喺現有產生器 repo 貼 presets 出圖驗證 — 呢步唔喺真理倉做。
2. **F3**：價值細，等用戶決定先好去 `api` repo 起；唔決定就唔好起。
3. F1／F2／F4 嘅驗收（真機、對比）等下一個真 repo 開工嗰陣順手做，唔好齋為驗收開工。
4. 本機／自架嗰類（§2）用戶已決定唔做，唔好再排入次序。

**查證限制**：本頁係彙整 [34](34-ai-workflow-tools.md)–[40](40-canvas-diy-candidates.md) 已核實判決，冇新增外部查證；星數／授權以各頁 2026-11-06／07 GitHub API 快照為準。§2 全部**未實測**而且用戶已決定唔做；G1 presets **未出過圖**；F4 對比**未驗**；F3 所述 `api` repo 現況（只有 CSV＋docs、冇前端）係 2026-11-07 用 GitHub API 睇過檔案樹確認嘅。
