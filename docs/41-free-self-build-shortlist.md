# 41 — 值得自己做總清單（免費限定）：Gemini AI／自架系統／前端網站

> 用戶 2026-11-07 定落兩條規矩：**① 唔係免費嘅唔保留**（付費項目唔入候選，見 §4 剔除記錄）；**② 要一份「值得我哋自己做」嘅清單**，按做法分三種：Gemini AI 嗰種、自架系統嗰種、前端網站嗰種。本頁將第一至六輪參考資料（[34](34-ai-workflow-tools.md)–[40](40-canvas-diy-candidates.md)）所有候選按此重新收攏，一次過答曬，唔使逐輪重問。
> 「免費」定義：開源可本機／自架跑、或免费额度真係用到核心功能；用 Gemini API 嗰種會耗用戶自己嘅 Gemini 額度，嗰個係用量成本唔係買工具，逐項寫明。本頁唔新增規則 ID；未實測嘅逐項寫明未實測。

## 1. Gemini AI 嗰種（Type B／C，跟 [09](09-gemini-canvas.md) 決策表）

| # | 值得做 | 狀態 | 下一步／門檻 |
|---|---|---|---|
| G1 | **風格海報／明信片產生器**：相＋9 個風格 presets → 成品圖 | ✅ presets 已備好（[STYLE_PRESETS_v1.0.md](../templates/canvas/STYLE_PRESETS_v1.0.md)＋根 README §1 入口），**未貼入任何 app、未出過圖** | 喺**現有產生器 repo**（童軍漫畫生成器嗰邊）貼入做風格掣，唔好新起 app（犯 F1）；貼完實跑幾張，驗標籤串字同 W2 水印解碼先算完成。要留紀錄／保密 prompt 先升 Type C |
| G2 | **Pre-mortem 意念鬧場**：入 idea → Gemini 分飾四人鬧 → 假設清單 | ✅ **模板已備好**（[pre-mortem.md](../templates/repo-starter/docs/pre-mortem.md)），覆蓋約八成價值；**Type C app 未起** | 而家用模板就夠；真係要留紀錄＋保密 prompt 先起 Type C app（腦殼分離全套）。紅線：產出永遠係**待驗證假設**，唔係用戶證據，唔好用嚟代替問真人 |
| — | Sketch→Logo（手繪草稿→logo 母圖） | ❌ 唔自己起引擎 | 要專門模型；用 LogoDiffusion 免費出稿（已核實免費生成、免信用卡，[39 §1](39-verified-sites-and-diy.md)）→ 入 [Icon Maker](../templates/iconmaker/icon_maker_v1.0.html) 出齊 9 檔。呢個係「用免費 SaaS」，唔係自己做 |

## 2. 自架／本機系統嗰種（開源、本機或自己 server 跑）

| # | 值得做 | 狀態 | 下一步／門檻 |
|---|---|---|---|
| S1 | **VoxCPM2 本機粵語 TTS／配音**（Apache-2.0，廣東話支援） | 🔶 未實測；同意＋AI 標記 checklist 已寫好（[34 §5](34-ai-workflow-tools.md)） | 有教學片／旁述要配音嗰陣，本機試跑一次（唔使起 server、唔使買 ElevenLabs）；克隆真人聲前必須有當事人同意 |
| S2 | **HyperFrames 本機出片**（Apache-2.0，HTML→確定性 MP4） | 🔶 未實測 | Scout 活動／app 介紹片有場景先試：本機 CLI 出片，唔好 `npm install` 入任何 app；素材版權照 W 鐵律 |
| S3 | **手繪故事片管線** story-to-handdrawn-video（MIT；底層 Remotion 授權要核實非牟利資格） | 🔶 未實測 | 同 G1 同類素材方向（童軍訓練故事片）；採用前開 Remotion LICENSE 原文核實資格，唔好當 MIT 咁用 |
| S4 | **Pixel2Motion 動態 logo**（MIT，圖→SVG 路徑動畫） | 🔶 未試，可選 | [33](33-icon-standard.md) 圖標出爐之後，試出一個 SCOUT SYSTEM 動態 logo 版；純試作，唔入任何 app 依賴住 |
| S5 | Cal.diy 預約（開源；託管版優先） | 🔶 有場景先試 | 真有「畀家長／領袖自己揀時間」先有價值：先用託管版零 infra，自架要養 Next.js＋DB 唔值得；用前核實託管版條款 |

**唔自架（已判，唔好下次又諗返）**：AppFlowy（同 Git Markdown 真理重複，犯 F1）、OpenProject（自架重；項目管理已有 Git＋ecportal）、Chatwoot（自架重；找管理員已有 [31](31-system-basics.md) ADMIN 回報路線）、VoiceStudio（AGPL＋聲音同意問題，粵語行 S1）、Open Generative AI（無內容過濾，同 W 底線衝突）、免費 LLM 路由（上游自承 not production，仲要養 30+ 條 key）、OpenSEO（身份未確認，唔亂裝）。

## 3. 前端網站嗰種（Type A 單一 HTML／靜態頁／React 線）

| # | 值得做 | 狀態 | 下一步／門檻 |
|---|---|---|---|
| F1 | **G11 圖標產生器**（Type A） | ✅ **已做**（[iconmaker/](../templates/iconmaker/icon_maker_v1.0.html)，audit PASS） | 下一個新 repo 開工抄去用；第一次用照 [33](33-icon-standard.md) §9 做真機驗收（ICO 相容／多檔下載／16px 認讀未喺真瀏覽器實測） |
| F2 | **相片預備工具**（Type A，壓到目標 KB／轉格式／去 EXIF） | ✅ **已做**（[photo_prep_v1.0.html](../templates/iconmaker/photo_prep_v1.0.html)，audit PASS） | 即開即用；未喺真瀏覽器逐平台實測 |
| F3 | **ApiVault 式 API 搜尋頁**（靜態前端，落自己 `api` repo） | 🔶 **未做，值得細細做** | 我哋已有 `apis.csv` 數據，欠一個可搜尋靜態頁；做之前先確認 `api` repo 而家有冇前端，冇先加；唔好喺真理倉另起一份數據（F1） |
| F4 | House DESIGN 風格庫（自家 3 套 DESIGN.md） | ✅ 起點已做（[design-styles_v1.0.md](../templates/repo-starter/docs/design-styles_v1.0.md)） | **未驗對比度、未喺真 app 用過**；採用前用 WebAIM 驗色對，通過先入新 repo |
| F5 | SEO/GEO 靜態檢查器 | ✅ **已做**（[`scripts/seo_check_v1.0.mjs`](../scripts/seo_check_v1.0.mjs)，唔做好網頁版） | 公開頁上線前行一次／入 CI；唔驗排名同收錄（要 Search Console） |

**用免費現成、唔自己起**：navbar.gallery／footer.design／cta.gallery（設計參考，免費）、3dicons（CC0 圖標素材，Pro 付費部分唔使理）、liquid-glass（MIT 細庫，要玻璃 UI 先引）、Refero（參考人哋點寫 DESIGN.md；自己嗰套行 F4，唔 scrape 人哋品牌）。

## 4. 剔除記錄（唔免費，唔保留）

| 項目 | 剔除原因 |
|---|---|
| Scrolltide（$299 一次性付費模板庫） | 用戶規矩 2026-11-07：唔免費唔保留。技術棧幾啱都唔入候選；[39 §1](39-verified-sites-and-diy.md) 判決已同步改為剔除。React 動畫點寫，我哋已有 `web-motion` skill（framer-motion 線）免費覆蓋 |

## 5. 建議開工次序

1. **G1**（價值最高、料已備好）：喺現有產生器 repo 貼 presets 出圖驗證 — 呢步唔喺真理倉做。
2. **F3**（唯一未起嘅新前端）：先睇 `api` repo 現況，再喺嗰邊起靜態搜尋頁。
3. **S1／S2**：唔好為試而試 — 等真有配音／出片場景，嗰個項目入面試跑兼記低結果。
4. F1／F2／F4 嘅驗收（真機、對比）等下一個真 repo 開工嗰陣順手做，唔好齋為驗收開工。

**查證限制**：本頁係彙整 [34](34-ai-workflow-tools.md)–[40](40-canvas-diy-candidates.md) 已核實判決，冇新增外部查證；星數／授權以各頁 2026-11-06／07 GitHub API 快照為準。S1–S5 全部**未實測**；G1 presets **未出過圖**；F4 對比**未驗**。
