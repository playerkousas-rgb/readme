# 37 — AI 工具／設計畫廊／生圖 Prompt 核實（FreeLLMAPI／Claude SEO／20 種風格）

> 呢份管用戶提供嘅**第 4 份爆紅清單**（本週 AI 新聞／FreeLLMAPI／Claude SEO／8 個網站設計資源／9 條生圖風格片／Radiocast，共 14 個位）：逐項核實，並按「我哋 SCOUT SYSTEM 棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）」評估邊個啱用。有 GitHub repo 嘅用 **GitHub API（2026-11-06 快照）**核實；冇 repo 嘅網站／新聞／prompt 片，明寫未核實，唔當事實收錄。
> 收錄方式同 [34](34-ai-workflow-tools.md)／[35](35-viral-ai-tools.md)／[36](36-lazy-coding-and-open-alternatives.md) 一致：**本頁唔新增規則 ID，亦唔代表已安裝或試跑任何外部工具**。設計資源主檔係 [23](23-design-resources.md)（本輪已喺 §5.3 落地 8 個畫廊站）；揀 API 去 [15](15-resource-index.md)／[25](25-reverse-api-reuse.md)；SEO 舊判（OpenSEO 身份未確認）見 [36 §5](36-lazy-coding-and-open-alternatives.md)。
>
> **一句結論先講**：即刻吸收兩樣——①「睇 API 文件只睇三樣（驗證／格式／限額）」嘅讀法（§2.1，零安裝）；② 8 個 UI 部位畫廊已入 [23 §5.3](23-design-resources.md)。Claude SEO 係少有「有場景值得試」嘅一件（§3，自己公開站上線前跑一次）。生圖 9 條片吸收嘅係**詞彙同 prompt 句式**，唔係片入面要留言先攞到嗰啲 prompt 本人（§4）。FreeBuff 教訓之後再講多次：FreeLLMAPI 同佢唔同種，但一樣唔入生產（§2.2）。

## 0. 核實總表（2026-11-06 GitHub API 快照／未核實標明）

| 貼文位 | 項目 | 入口 | ★／授權 | 核實結果 |
|---|---|---|---|---|
| #1 | 本週 AI 大事（6 單新聞） | 無 repo、無官方連結 | — | **全部未核實**：片稱 Mistral Large 4（1 萬億參數開源）／Gemini App 生成改檔同簡報／ElevenLabs SFX v3／Google 太空 TPU＋Gemma 俳句／Figure 03 機械人／Claude Message Threads；本輪冇開官方公告逐單對，唔當事實寫入任何規範（見 §5） |
| #2 | FreeLLMAPI | [tashfeenahmed/freellmapi](https://github.com/tashfeenahmed/freellmapi)（HEAD `73e3f05`） | 48,361／MIT | 真 repo（片講 41.6k 係舊快照）；自述聚合 34 間免費額度供應商／635 個免費 endpoint、統一 OpenAI-compatible `/v1`、429 自動 failover；但 README＋Disclaimer 明寫 **「Personal experimentation only／not production」** |
| #3 | Claude SEO | [AgriciDaniel/claude-seo](https://github.com/AgriciDaniel/claude-seo)（HEAD `6be93f4`） | 27,028／MIT | 真 repo（片講 24.4k 係舊快照）；26 sub-skills＋19 agents 同上游 README／描述一字對得上；免費＝「連你自己 Claude Code plan 用」，9 個 optional extensions 係 BYO 付費服務 |
| #4 | 8 個設計畫廊站 | Scrolltide／navbar.gallery／footer.design／cta.gallery／styles.refero.design／supahero.io／3dicons.co／glass.samasante.com | 非 GitHub | **未能開站核實**（出站限制）；已按用途入 [23 §5.3](23-design-resources.md)，逐站紅線寫明，第一次用自己開站驗收費／授權 |
| #5 | 20 種設計風格合集（3 條片） | 無 repo | — | 片內容係風格名單＋同圖轉風格對比；prompt 本人要留言先攞到，**未取得、唔複製**；吸收方式係風格詞彙（§4.1） |
| #6 | Higgsfield 海報風（9 種） | Higgsfield（閉源服務） | — | 風格名可登記做詞彙（§4.1）；工具本身 [36 §5](36-lazy-coding-and-open-alternatives.md) 已判：唔轉用 Open Generative AI，我哋出圖行 Gemini 路線 |
| #7 | 實用生圖 prompt（5 條片） | ChatGPT／Logo Diffusion 等 | — | 吸收**句式同方法**（產品唔變形、相轉畫、明信片、3D 字、草稿轉 logo），prompt 原文未取得，我哋嗰啲係自己按片中描述重寫、未實測（§4.2） |
| #8 | Radiocast 世界電台 | 網站（網址未核實） | — | 未開站核實；同類「世界地圖點播電台」概念清楚，但串流版權／地區限制令佢唔啱嵌入 app（§5） |

## 1. 按「我哋而家要做乜」揀

| 你而家要做乜 | 建議入口 | 點解 |
|---|---|---|
| 學點樣快速睇懂一個新 API／揀免費額度試嘢 | §2.1 三樣讀法（即刻吸收）＋ [25](25-reverse-api-reuse.md) 現有盤點 | 方法係真功夫，同我哋「開新 app 前查 API」流程直接合併 |
| 慳錢用免費模型行 coding agent | §2.2 FreeLLMAPI（**只限個人實驗，唔入生產**） | 上游自己寫明 not production；同 [36](36-lazy-coding-and-open-alternatives.md) FreeBuff 分清：呢個係自架＋自己 key，唔係廣告養數據 |
| 自己公開站上線前做 SEO／畀唔畀 AI 搜尋引用 | §3 Claude SEO（有場景先試） | 身份明確、MIT、輸出 Markdown 行動計劃；同 [36](36-lazy-coding-and-open-alternatives.md) 嗰個「OpenSEO 身份未確認」係兩回事 |
| 開新 Git 前搵設計參考、唔想撞舊模板樣 | [23 §5.3](23-design-resources.md) 8 個部位畫廊（已落地） | 按欠邊格去睇（navbar／footer／CTA／hero／玻璃／3D icon），配 `design-review` 用 |
| 生圖嗰陣講唔清想要咩風格 | §4.1 風格詞彙表 | 同 Motion Prompt 編號（[35 §2.3](35-viral-ai-tools.md)）同一道理：用名詞唔用形容詞 |
| 將產品相／旅遊相／草稿變宣傳圖 | §4.2 五條句式（自己重寫，未實測） | 係內容製作技巧，唔係 app 功能；出圖照跟 W 水印 |
| 追 AI 新聞 | §5：睇完就算，要用先查官方 | 新聞唔係規範；冇官方來源唔寫入真理倉 |

## 2. FreeLLMAPI — 吸收讀法，唔吸收做生產後端

### 2.1 即刻吸收：「睇 API 文件只睇三樣」

片主講嘅方法本身係啱嘅，而且同我哋 P1／揀 API 流程係同一件事。寫落嚟做固定讀法，開新 app／接新 API 嗰陣逐項答：

1. **驗證（Auth）**：點樣畀 key？header 定 query？key 擺邊度先唔洩漏？我哋答案永遠係：secret 只喺 Vercel env／GAS ScriptProperties／Supabase Vault，經 `/api` proxy 出去，唔入前端、唔入 URL（A1）。
2. **格式（Format）**：request／response 咩形狀？有冇 OpenAI-compatible？錯誤回應點分（唔好靠估 status 以外嘅嘢）？對返我哋 contract 寫法（[templates/canvas/](../templates/canvas/README.md) 合約行先）。
3. **限額（Limits）**：免費額幾多、429 點算、超額會截斷定收錢？冇寫明限額嘅 API 當唔存在免費額咁用，要有 fail closed 出路（F4）。

> 呢三樣答唔晒，就未算「睇完文件」，唔好開工。呢個係讀法，唔需要新增規則 ID——A／F 系列已經管晒後果，本節只係入口姿勢。

### 2.2 工具本身：只限個人實驗

- **佢係咩**：自架一個 router，將 34 間供應商嘅免費額度 key 收埋一齊，對外扮一個 OpenAI-compatible endpoint；邊間 429 就自動跳下一間；keys 加密存放；可以駁 Claude Code／Codex／Cursor 等用免費模型。片講 30+ 供應商、統一 key、自動跳台，大致同上游 README 對得上（上游而家自述 34 間／635 endpoint）。
- **點解唔入生產（上游自己都咁寫）**：Disclaimer 明寫「for personal experimentation and learning, not production」，出貨前要換返付費 API；Limitations 自承冇 frontier 模型、延遲浮動、冇 SLA，**日頭尾段好模型打爆日額之後，成個 endpoint 嘅「智力」會跌**，UTC 午夜先重置。即係：攞嚟做正式 app 後端，等於將可用性交畀 34 間免費額度嘅心情，撞 F／VL 可靠性底線。
- **同 FreeBuff（[36 §3](36-lazy-coding-and-open-alternatives.md)）嘅分別要分清**：FreeBuff 係廣告養、數據可畀第三方，係**私隱**問題，所以真 repo 都唔好掂；FreeLLMAPI 係自架＋自己 key，私隱面細好多，問題係**可靠性同條款**——每間供應商嘅 ToS 對「個人 proxy 聚合」嘅態度唔一樣（上游自己有逐間 review，引用前自己睇），用嚟行正式服務隨時犯人哋條款。
- **可接受用法**：本機個人實驗——試新模型手感、做唔敏感嘅拋棄式 prototype、學 API 行為。用獨立目錄、唔好入成員資料／真 secret 落去試（試都用專用低權限 key），產出入真 repo 前照過 `guard` 同人手 review。
- **未實測**：冇安裝、冇入任何 key、冇駁過 Claude Code；7.4B tokens／月係上游將各家免費額加總嘅講法，冇獨立核實。

## 3. Claude SEO — 有場景先試：自己公開站上線前跑一次

- **來源**：[`AgriciDaniel/claude-seo`](https://github.com/AgriciDaniel/claude-seo)（MIT，27,028★，2026-02-07 建立）。Claude Code 插件：入網址，26 個 sub-skills＋19 個專家 agent 平行跑技術 SEO／內容 E-E-A-T／Schema／效能／GEO（畀 Google AI Overviews、ChatGPT 等引用嘅程度），10–15 分鐘出**分咗優先次序嘅 Markdown 行動計劃**，唔係淨係警告清單。片講嘅內容同上游 README／FAQ 對得上，連收費對比（agency $2K–$15K）都係佢 README 自己嘅講法——**係佢嘅市場對比，唔係我哋驗證過嘅市價**。
- **「免費」要識睇**：FAQ 自述 MIT、冇 per-site 收費、冇追蹤；成本係你自己嘅 Claude Code plan；9 個 optional extensions 先要 BYO 付費數據服務（唔駁都用到核心）。數據面：被審計網站內容會送去 Anthropic（同任何 Claude Code 工作一樣），報告存本機；唔駁 extension 就冇其他第三方經手。
- **對我哋啱用嘅場景**：**公開、想畀人搜到嘅站**上線之前——例如提示站、公開頁嗰類 Vercel 站，跑一次攞技術 SEO＋Schema＋GEO 清單，好過自己靠估。**唔啱**：要登入嘅系統、用完即棄嘅單一 HTML Canvas 工具（嗰啲唔靠搜尋引擎食飯，唔好為佢哋做 SEO 工程）。
- **試用姿勢（試嗰陣照呢個）**：① 只審自己／已獲授權嘅站；② 報告逐項人手核實先改——冇 Google API key 嗰陣 Core Web Vitals 只係 lab 估算、收錄狀態係推斷（上游 Limits 自述），唔好照單全收；③ 改完用 Search Console／PageSpeed 自己再驗，唔好用佢自報嘅分數當收貨；④ 報告入該 repo 存檔，寫明日期同工具版本。
- **唔好做**：唔好將佢寫入 CI／`guard`（佢係 Claude Code 插件，我哋環境無 plugin harness，唔會自動行；同 [36](36-lazy-coding-and-open-alternatives.md) 唔裝 Ponytail plugin 同一理由）；唔好攞嚟審人哋個站做「免費報告」招徠，數據同結論責任唔係佢哋嘅。
- **未實測**：冇安裝、冇跑過任何審計；10–15 分鐘、agent 平行數、佢自家站「12 週 10.8K clicks」都係上游自述，未獨立核實。要試就喺你自己 Claude Code 環境、攞一個自己嘅公開站行第一次，結果記返入嚟先升級狀態。

## 4. 生圖風格片（9 條）— 吸收詞彙同句式，唔追留言 prompt

> 呢 9 條片嘅共同玩法係「留言關鍵字攞 prompt」，即係 prompt 本人唔公開。**我哋冇攞到、唔會扮有**；值得收嘅係兩樣公開資訊：風格**名單**（畫面有寫出嚟）同意圖講得清嘅**做法**。下面句式係按片中描述自己重寫，未實測，出圖照跟 [W 版權＋隱形水印](12-copyright-scout-system.md)。

### 4.1 風格詞彙：同 Motion Prompt 編號同一道理

生圖嗰陣講「靚啲／高級啲」同叫 AI 做動畫講「流暢啲」一樣冇得驗收。以下名單由 3 條「20 種風格」片＋Higgsfield 海報片彙總，**用嗰陣揀一個做主風格寫入該次 prompt／`DESIGN.md`**，唔好一張圖溝三種：

| 類 | 風格名（中／英對照用） |
|---|---|
| 排版／印刷 | 瑞士設計 Swiss Design、編輯風 Editorial、波希米亞 Bohemian、維多利亞 Victorian、復古 Retro、Y2K、普普藝術 Pop Art、2000s Preppy 雜誌風、西部 Pulp 冒險 |
| 質感／媒介 | 玻璃擬態 Glassmorphism、黏土風 Clay、像素 Pixel、向量 Vector、手寫風 Handwritten、塗鴉 Graffiti、拼貼 Collage、油彩厚塗 Impasto（見 §4.2） |
| 光色／氣氛 | Cyberpunk、Aurora 極光、未來感 Futuristic、超現實 Surreal、熱成像 Thermal、微生物學 Microscopic |
| 民族／工藝（海報片） | Gzhel 青花瓷、斯拉夫民族刺繡、亞洲復古、Visual Kei、Acoustic 包浩斯（Bauhaus）、太平洋龐克波 |

規矩三條：① **UI 同生圖分開**——呢張表係畀生圖 prompt 同 mood reference 用，唔係 UI 風格餐牌；app 畫面風格繼續跟 `design-review` 同 `DESIGN.md`，唔好因為見到 Clay 風得意就成個 app 轉黏土。② 民族／工藝風格（青花瓷、刺繡嗰類）借風唔借圖案版權，生成圖照落 W 水印、來源寫 `CREDITS.md`（W8）。③ 同一個畫面轉 20 種風格嗰個做法（create_daniel2 條片）值得學嚟**揀**風格：一張基準圖轉 4–6 個候選、揀定一個先量產，唔好量產完先發現唔啱。

### 4.2 五條句式（自己重寫，未實測）

| 場景（片源） | 句式骨架（方括號自己填） | 收貨要驗 |
|---|---|---|
| 產品變廣告海報（sebintel） | 「將呢張產品相變成雜誌式廣告海報：[風格名]、[背景場景]、[光線]；**產品形狀、比例、標籤文字完全保持原樣，唔加唔改任何產品細節**」 | 標籤字有冇畀 AI 改錯／捏造——產品圖最常見死喺呢度；錯字即棄，唔好用嚟做真宣傳 |
| 相變油畫厚塗（raktimcreates） | 「將呢張相轉成油彩厚塗（impasto）風格：保留構圖同主體輪廓，筆觸厚重、[色調方向]」 | 人臉／手部變形；做紀念品先啱用，唔好將成員相未經同意攞去轉（A12） |
| 旅遊明信片（miramakesai） | 「上半係原相，下半將同一景色畫成復古郵票插畫風，兩者構圖對位；留白位寫 [地名]」 | 上下對唔對位、地名拼寫；郵票齒孔嗰類細節 AI 好易畫錯 |
| 3D 立體字（itsdesignare） | 「將單詞 [WORD] 做成 3D 海報字，質感係 [布料／透明玻璃／彩虹反光／絲帶／層疊壓克力／水泥]，[背景色]，字形保持可讀」 | 串字一定要逐隻字母對；做標題裝飾得，唔可以取代正文排版 |
| 草稿變 Logo（logodiffusion，Logo Diffusion 工具） | 隨手畫草稿＋一句「minimalist [主體] logo」攞幾款方向（線條／剪影／吉祥物／雕刻／抽象／卡通）再揀 | **唔可以直接做交付 logo**：AI 出嘅係點陣圖兼可能撞款；站台圖標一律返 [G11](33-icon-standard.md) 標準（9 個 PNG／ICO 出齊、16px 手繪驗收），草稿圖只做意念起點 |

共通收貨：生成圖一律 `© SCOUT SYSTEM` 頁尾＋DCT 隱形水印（W1／W2）、解碼器驗過先用；片入面示範嘅品牌產品（Lay's／Nescafe／Pixel 嗰類）係人哋商標，自己產品先好用「唔變形」句式做宣傳圖，唔好攞人哋產品圖改完當自己作品。

## 5. 唔收錄做規範嗰啲（講明點解，唔好下次又問返）

- **本週 AI 大事（6 單）**：全部未核實，冇官方來源跟到入倉。其中就算屬實，同我哋即刻有關嘅都好間接——Gemini App 生簡報撞 [34 §2 PPT Master](34-ai-workflow-tools.md) 已有嘅可編輯簡報路線、ElevenLabs 音效撞 [34 §5 VoxCPM2](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件) 本地語音路線；模型參數新聞（Mistral Large 4 嗰類）唔改我哋技術棧契約。**姿勢：新聞睇完就算；邊單想用，去返官方公告／文件核實，再按 P1 流程寫低來源先採用，唔好引用片中數字。**
- **Radiocast**：世界地圖點播電台係好玩嘅消閒站（片稱成千上萬個直播點、隨機跳台、收藏），但**唔好諗住嵌入 app**：電台串流有地區／版權限制，人哋嘅 stream 唔係你嘅內容源（同 [36 §5](36-lazy-coding-and-open-alternatives.md) MoneyPrinterTurbo 素材版權同一課）；自己開嚟聽係端用家消閒，唔入倉登記。要做「地圖＋點播」嗰種介面，學佢**互動概念**（地圖做主介面、㩒點即播）就夠，內容要嚟自自己有權用嘅源。

## 6. 查證限制／維護

- **已做**（2026-11-06）：GitHub API 查 FreeLLMAPI／Claude SEO 兩個 repo 嘅 metadata＋HEAD；讀 FreeLLMAPI README 嘅 Limitations／Disclaimer、Claude SEO README 嘅 Pricing／FAQ／Limits 段；8 個畫廊站按用途入 [23 §5.3](23-design-resources.md) 並逐站寫紅線。
- **未做**：出站限制下**開唔到** 8 個畫廊站、Radiocast、新聞入面任何官方公告（curl 無回應），全部標未核實，**引用前請親身開一次**；冇安裝 FreeLLMAPI／Claude SEO、冇入任何 API key、冇跑過 SEO 審計；§4.2 五條生圖句式未用 Gemini／ChatGPT 實跑過；片中「留言攞 prompt」嘅 prompt 冇攞、冇睇、冇抄。
- **星數會變**：引用前重查（本輪 FreeLLMAPI 41.6k→48,361、Claude SEO 24.4k→27,028，片中數字已舊）。
- **更新時機**：真正採用前、上游大改版後、引用星數前；更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件檢查通過唔會升級「未實測」狀態。
- **單一入口**：設計資源去 [23](23-design-resources.md)；爆紅清單第一至三輪去 [35](35-viral-ai-tools.md)／[36](36-lazy-coding-and-open-alternatives.md)；PPT／語音去 [34](34-ai-workflow-tools.md)；本頁只放第四輪核實＋兩個工具嘅試用姿勢，唔複製其他功能表。
