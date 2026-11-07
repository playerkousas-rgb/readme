# 36 — 懶人工程／免費 Coding Agent／Blender 城市／9 個開源平替核實

> 呢份管用戶提供嘅**第 3 份爆紅清單**（Ponytail「教 AI 偷懶」／Concept Studio Blender 倒城市／FreeBuff 免費 Coding Agent／9 個收費軟件開源平替，共 4 條片 12 個位）：逐項用 **GitHub API（2026-11-06 快照）**核實 repo／星數／授權，並按「我哋 SCOUT SYSTEM 棧（Git＋Vercel＋GAS＋Supabase＋Gemini Canvas／單一 HTML）」評估邊個啱用。
> 收錄方式同 [34](34-ai-workflow-tools.md)／[35](35-viral-ai-tools.md) 一致：保留上游連結、授權、限制，唔搬成套 repo 入本倉；**本頁唔新增規則 ID，亦唔代表已安裝或試跑任何外部工具**。語音見 [34 §5](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件)／[35 §4](35-viral-ai-tools.md#4-維持原判本輪只更新星數快照)；Skill 治理見 [29](29-reading-map.md)；外部系統接入見 [EXTERNAL.md](../EXTERNAL.md)。
>
> **一句結論先講**：真正值得即刻吸收嘅只有 Ponytail 條**「寫 code 前七級梯」**（§2，已改寫成我哋可直接用嘅 checklist，唔使裝佢成套 plugin）；其餘 11 個位全部係「端用家自己試／有場景先試／暫不採用」，冇一個應該入現有 app 嘅依賴。FreeBuff 更加**唔好用嚟開真 repo**（§3，佢自己 README 寫明數據可攞去訓練兼可分享／出售畀第三方）。

## 0. 核實總表（2026-11-06 GitHub API 快照，唔係永久數字）

| 貼文位 | 項目 | Repo（入口） | ★ | 授權 | 核實結果 |
|---|---|---|---|---|---|
| #1 | Ponytail | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | 185,764 | MIT | 真 repo；2026-06-12 建立（到核實日約 5 個月，片講「4 個月 171.6k」係舊快照，數字已過）；核心只係一份 3.5KB `SKILL.md`（HEAD `96608e0`），其餘係 20 個 agent 嘅 plugin／hook 包裝 |
| #2 | Concept Studio OSM Add-on | 查無 GitHub repo | — | 未核實 | GitHub 搜尋搵唔到對應 repo，似商業 add-on（網站／售價／條款未核實）；開源同類係 [vvoovv/blosm](https://github.com/vvoovv/blosm)（2,151★，授權欄 null） |
| #3 | FreeBuff | [CodebuffAI/freebuff](https://github.com/CodebuffAI/freebuff) | 13,998 | Apache-2.0 | 真 repo；片中模型名（GPT-6 Luna／GLM 5.3／DeepSeek V4.1 等）同上游 README 模型表一致，唔係片主作名；但模型真身／量化版（README 自承可出 Q8_0）無從獨立核實 |
| #4-1 | Open Generative AI（替 Higgsfield） | [Anil-matcha/Open-Generative-AI](https://github.com/Anil-matcha/Open-Generative-AI) | 32,809 | MIT | README 自稱「Unrestricted／No content filters」，經 MuAPI 雲端出圖出片，唔係本地免費無限 |
| #4-2 | VoiceStudio（替 ElevenLabs） | [debpalash/VoiceStudio](https://github.com/debpalash/VoiceStudio) | 102,715 | **AGPL-3.0** | [35 §4](35-viral-ai-tools.md#4-維持原判本輪只更新星數快照) 已終評：唔採用，粵語聲音用 VoxCPM2；本輪只更新星數 |
| #4-3 | OpenSEO（替 SEMrush） | **身份未能確認** | 28–239 | 不一 | 同名 repo 至少 4 個（[duckduckdeploy/openseo](https://github.com/duckduckdeploy/openseo) 28★／MIT／2026-10 新 repo、[TahaHachana/OpenSEO](https://github.com/TahaHachana/OpenSEO) 239★／2016 年已停更等），冇一個對得上片講嘅「排名追蹤＋反向連結＋網站審核」全功能；當未核實，唔好亂裝同名 repo |
| #4-4 | AppFlowy（替 Notion） | [AppFlowy-IO/AppFlowy](https://github.com/AppFlowy-IO/AppFlowy) | 78,320 | **AGPL-3.0** | 真・成熟項目；但我哋真理係 Git Markdown（本倉），唔需要多一個 workspace 系統 |
| #4-5 | OpenWhispr（替 Flow） | [OpenWhispr/openwhispr](https://github.com/OpenWhispr/openwhispr) | 10,879 | MIT | 本地 Parakeet／Whisper＋BYOK 雲端；端用家聽寫工具，唔係 app 組件 |
| #4-6 | OpenProject（替 Asana） | [opf/openproject](https://github.com/opf/openproject) | 17,053 | GPL-3.0 | 2012 年至今嘅老牌項目管理；自架重 infra（Rails／Postgres） |
| #4-7 | Cal.diy（替 Calendly） | [calcom/cal.diy](https://github.com/calcom/cal.diy)（即 Cal.com） | 49,751 | MIT（LICENSE 檔核實） | 真項目；自架要成套 Next.js／DB，託管版先係「開連結即用」 |
| #4-8 | Chatwoot（替 Intercom） | [chatwoot/chatwoot](https://github.com/chatwoot/chatwoot) | 38,996 | NOASSERTION（核心 MIT Expat、enterprise/ 另授權） | 真項目；自架重 infra（Rails／Postgres／Redis） |
| #4-9 | Cap（替 Loom） | [CapSoftware/Cap](https://github.com/CapSoftware/Cap) | 24,529 | NOASSERTION（主體 AGPL-3.0、cap-camera／scap  crate 係 MIT） | 真項目；桌面錄屏端用家工具 |

> 片入面嘅數字同本表唔一致嘅，以本表為準；星數只代表 2026-11-06 當日，亦唔代表品質（OpenSEO 對唔上身份嗰課先係重點）。

## 1. 按「我哋而家要做乜」揀（先做呢個判斷，唔好裝為裝）

| 你而家要做乜 | 建議入口 | 點解 |
|---|---|---|
| 叫 AI 寫 code 前唔好過度工程、唔好亂加依賴 | §2 Ponytail 七級梯（**即刻吸收，零安裝**） | 同瘦身 S／[35](35-viral-ai-tools.md) §2.1 pstack `Subtract Before You Add` 同一信仰；一頁 checklist 就夠 |
| 想慳訂閱費用免費 AI 睇住 code 做嘢 | §3 FreeBuff（**唔好用喺真 repo**） | 佢自己 README 嘅數據條款同 A 安全／[A12 私隱](03-security.md) 底線衝突 |
| 要 3D 城市做建築預覽／previz | §4 Blender＋OSM 路（有場景先試，app 以外） | 同我哋 web app 棧無關；Google 3D 數據版權／ToS 先係真門檻 |
| 出圖／出片 | 繼續 Gemini＋W 水印路線（[12](12-copyright-scout-system.md)） | Open Generative AI「無過濾」定位同 W／內容安全衝突，見 §5 |
| 聲音克隆／聽寫 | 克隆用 [34 §5 VoxCPM2](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件)；聽寫可自己試 OpenWhispr（§5） | VoiceStudio（AGPL）[35](35-viral-ai-tools.md) 已終評唔採用 |
| 筆記／項目管理／預約／客服／錄屏 | §5 逐個睇：全部「端用家試或有規模先自架」 | 我哋已有 Git 真理倉、ecportal、[31 ADMIN 回報](31-system-basics.md)；重 infra 違反瘦身 |

## 2. Ponytail — 唯一值得即刻吸收：寫 code 前七級梯

- **來源**：[`DietrichGebert/ponytail`](https://github.com/DietrichGebert/ponytail)（MIT，185,764★，2026-06-12 建立）。本體一句講完：**「最好嘅 code，就係你唔使寫嘅 code。」** 佢將「最懶資深工程師」寫成一份 prompt（`skills/ponytail/SKILL.md`，約 3.5KB），再包裝成 20 個 agent host 嘅 plugin／commands／hooks。
- **Benchmark 要識睇**：片講嘅 −53% code／−41% 時間／−26% 成本／−45% tokens／98% 高風險邏輯有測試，係**上游自家 benchmark**（`benchmarks/results/2026-10-07-agentic.md`：Claude Code、39 個任務、每任務 5 次、無 shell 權限）。方法寫得算老實（有中位數／信賴區間／隱藏檢查），但留意三點：① 只有 18 個「手術任務」有隱藏正確性檢查，三臂合格率其實打和（96.7% vs 無 skill 95.6%）——即係「少寫冇蝕正確性」，唔係「寫得啱多啲」；② 其餘 21 個任務只量體積，完整度靠 AI 評審；③ 冇第三方複跑。**結論：數字當方向參考，唔好引用做我哋嘅成效承諾。** 日期選擇器 335 行 → 10 行嗰例係真嘅（README before/after：唔自己砌 calendar，改用 repo 已有 `Input`＋瀏覽器原生 `type="date"`），而呢個正正就係七級梯第 2＋4 級。

### 2.1 七級梯（已改寫成我哋棧嘅版本，寫 code 前逐級停）

> 逐級問，**停喺第一級企得住嘅位置**；唔好跳級：

1. **呢樣嘢需唔需要存在？** 冇人要求嘅功能／選項／彈性，一律唔寫；跳過咗乜要喺回覆講一句。
2. **呢個 repo 已經有冇？** 已有 helper／component／pattern 就照返佢嘅用法，唔好平行再寫一套（呼應 F1 單一真理、F3 registry 驅動）。
3. **標準庫／平台原生做到嗎？** 例：日期揀選用 `<input type="date">`、日期運算用原生 `Date`／`Intl`，唔好為幾行嘢加日期 library（呼應 S1 原生優先、S3 依賴白名單）。
4. **已裝依賴做到嗎？** 做得到就唔加新依賴；要加先講清理由同體積代價。
5. **可唔可以一行搞掂，而且一眼睇明？** 得就一行；要解碼先明嘅一行唔算短。
6. **先至寫「最小但完整」嘅新 code**：完整 = 包埋受影響嘅 caller、測試、fixture，唔係寫一半最短嗰截。
7. **有邏輯就留一個細測試**：有分支／循環／parser／錢／安全嘅新邏輯，留一個細 test 或 assert 自檢；trivial 改動唔使。

**永遠唔准偷懶嗰啲**（上游原文同我哋底線一致）：信任邊界輸入驗證（F5／A9）、防資料流失嘅錯誤處理、安全（A 系列）、無障礙、用戶明確要求咗嘅嘢。偷懶嘅對象係「解法」，唔係「讀 code」——郁手前要讀晒改動會掂到嘅 code 同真實數據流。

**兩個好習慣照抄**：
- 故意行捷徑兼知有限制嗰陣，留低 `shortcut: <限制>, <幾時升級>` 註解，日後 grep 得返，唔好等「之後」變「永遠唔做」。
- 每次回覆結尾用一兩行交代：**跳過咗乜／冇驗乜／有咩風險**（同我哋一貫「未實測要明寫」同一規矩）。

### 2.2 採用姿勢：讀，唔裝（成套 plugin 唔入真理倉）

- **唔裝 plugin／hooks**：上游為 20 個 agent 出咗各自嘅 plugin、lifecycle hooks、狀態列（band）同本地統計 board。呢啲同我哋 `guard`／`final_check`／PREFLIGHT 閘門重疊又互不知情，hooks 仲會喺每次 session 注入行為；我哋環境本身亦無 Skill tool 自動觸發（見 [CATALOG](../templates/repo-starter/skills/CATALOG.md) 未核實段）。裝咗唔等於生效，生效咗又多一層唔受真理倉管嘅行為。
- **唔 vendor 原文**：同 [35 §2.3](35-viral-ai-tools.md#23-motion-prompt--跟-ai-講動態用編號唔好用形容詞) vendor motion-prompt 唔同——嗰份係無可替代嘅編號庫；Ponytail 嘅價值係七級梯**方法**，已經喺 §2.1 用我哋嘅規則 ID 改寫晒，再存一份英文原文只會變第二個真理源（犯 F1）。
- **點樣先算用咗**：開新 app／派任務嗰陣，將 §2.1 七級梯貼入該次任務要求（或該 app repo 自己嘅 `AGENTS.md`），施工後回覆照 §2.1 尾段交代跳過／風險。用幾次覺得邊級唔啱我哋，先返嚟改 §2.1，唔好逐個 repo 各自改一份。
- **未實測**：本輪只讀上游 `SKILL.md`／`AGENTS.md`／benchmark 方法同結果表；冇安裝 plugin、冇喺任何 app repo 跑過對照、冇複跑佢 39 個任務。

## 3. FreeBuff — 免費嘅代價寫喺佢自己 README：唔好用喺真 repo

- **來源**：[`CodebuffAI/freebuff`](https://github.com/CodebuffAI/freebuff)（Apache-2.0，13,998★）；終端／桌面／Web／Cloud 四種形態，靠文字廣告養免費額度。片講嘅模型（GPT-6 Luna、GLM 5.3 Flash、DeepSeek V4.1 Flash 等）同上游 README 模型表對得上，仲有地區分級（full／limited access）、按倍率扣「小時」額度、部分模型限一日一 session 等細節，片入面「每日 GPT-6 Luna 5 小時」嗰類講法同現行 README 計法（2026-10-15 起以小時計、limited 每日 5 小時）已經唔完全同款——**額度數字引用前要以 app 內 picker 為準**。
- **唔採用嘅決定性理由（上游 README 自述，2026-11-06 讀取）**：佢嘅 Data Use 段寫明——揀咗會用數據訓練嘅模型／功能時，你嘅提交（messages、agent traces、files）可被用嚟訓練／改進 AI，**仲可以分享或出售畀第三方**；另外亦會用你嘅數據訓練揀廣告／量度廣告嘅模型。README 同時自承部分模型可能出**量化版（Q8_0）**，即係「同名模型」唔保證同官方原廠質素一樣。
- **對我哋即係**：任何真 repo（成員資料、未公開 code、secret 附近嘅檔案）經佢手 = 撞 A1（secret 只留 server）、[A12 私隱 PDPO](03-security.md) 同「前端／第三方永遠唔好揸唔需要嘅數據」底線；廣告養模型呢個商業模式本身就係要你嘅數據變現，唔係「平替版 Claude Code」咁簡單。**唔好喺本生態任何 repo 登入／連接 FreeBuff Cloud，唔好用佢行有成員資料嘅任務（片中示範嗰類分類客服 email 正正就係個人資料，唔好跟）。**
- **唯一可接受用法**：完全公開、掉咗都冇所謂嘅拋棄式實驗（例如攞公開文件練手），用獨立目錄、零 secret、零個人資料，產出當未審 code 睇，入真 repo 前照樣過 `guard`／人手 review。唔值得為咗呢個用途喺本頁以外再開任何登記。
- **未實測**：冇安裝、冇註冊、冇跑過任何模型；片講嘅速度／質素／額度未驗；佢 Privacy Policy 全文未逐條讀（只讀 README 嘅 Data Use 摘要段，引用前自己開嚟睇）。

## 4. Concept Studio／Blender 倒城市 — app 以外嘅 previz 工具，同版權先係門檻

- **核實**：片中「Concept Studio」add-on 喺 GitHub 搵唔到 repo（搜尋 `concept studio blender`／`blender osm addon google maps` 冇對應結果），似係商業 add-on；其網站、售價、授權、版本**全部未核實**，要買／要用先自己去官方渠道查清。開源同類有 [vvoovv/blosm](https://github.com/vvoovv/blosm)（2,151★，Blosm：Google 3D cities／OSM／地形一鍵導入；GitHub 授權欄係 null，採用前要開 repo 睇 LICENSE 原文）。
- **同我哋有咩關係**：冇直接關係。我哋棧係 web app（Git／Vercel／GAS／Supabase／Canvas），Blender 城市模型唔會入任何 app 依賴；佢嘅位置係**內容製作**嗰邊——例如營地／活動場地 3D 預覽、宣傳片 previz（同 [35 §3](35-viral-ai-tools.md#3-有場景先試試完記錄唔好裝為裝) 出片路線同層），有呢類場景先試，試完喺嗰個項目記低工具版本同來源。
- **版權紅線（片中留言區問得啱）**：Google 3D Tiles／Maps 數據唔係「導入咗就係你嘅」——要用自己 Google API Key、跟 Google Maps Platform ToS 同署名要求，唔可以離線打包人哋嘅 3D 城市數據去分發／入商業產品；做遊戲／要再分發嘅場景，行 OpenStreetMap 數據路（OSM 係 ODbL：要署名，衍生資料庫有 share-alike 條款）。出圖出片一律返返 [W 版權](12-copyright-scout-system.md)：來源寫入該項目 `CREDITS.md`（W8），唔好將 Google 街景質感當自家素材。
- **未實測**：冇裝 Blender、冇裝任何 add-on、冇導入過任何城市；片中「撳掣實時出成個紐約」嘅速度／質素未驗。

## 5. 9 個開源平替 — 逐個判：多數係「自己試」或者「有規模先自架」

> 通用判準先講：呢 9 個入面，除咗端用家桌面工具（OpenWhispr／Cap），其餘自架版全部要自己養 server（DB／Redis／背景任務），同我哋「Vercel＋GAS＋Supabase 託管、瘦身 S」係兩種養法。**「開源免費」唔等於「零成本」，養 server 嘅時間就係成本**；冇規模之前，託管免費額／現有系統通常仲平。

| 平替 | 判 | 理由／幾時先得 |
|---|---|---|
| Open Generative AI（替 Higgsfield） | **唔採用** | 自稱「Unrestricted／No content filters」同 W 版權＋內容安全底線衝突；「600+ 模型」係經 MuAPI 雲端計量，唔係本地任用；我哋出圖行 Gemini＋[W2 隱形水印](12-copyright-scout-system.md) 已成路線 |
| VoiceStudio（替 ElevenLabs） | **唔採用（維持原判）** | [35 §4](35-viral-ai-tools.md#4-維持原判本輪只更新星數快照) 已終評：AGPL-3.0＋聲音同意問題；粵語配音／克隆用 [34 §5 VoxCPM2](34-ai-workflow-tools.md#5-voxcpm2本機-tts聲音設計克隆同意同-ai-標記係前置條件)。本輪星數 102,114→102,715，結論不變，唔重做評估 |
| OpenSEO（替 SEMrush） | **唔採用（身份未確認）** | 同名 repo 至少 4 個，冇一個功能／活躍度對得上片講嘅全套 SEO 工具；喺身份未確認前裝任何一個都係亂裝。我哋站 SEO 暫時人手＋Google Search Console 已夠；真有排名追蹤需求嗰陣，重新按 P1 流程揀（寫明揀邊個 repo／邊個 commit） |
| AppFlowy（替 Notion） | **唔採用** | AGPL-3.0（自用唔受 copyleft 影響，但分發改版要小心）；決定性理由係重複：我哋嘅文件真理已經係 Git Markdown＋本倉，團隊筆記再開一套 workspace 只會多一個真理源（犯 F1）。個人自己鍾意用嚟做私人筆記係個人選擇，唔入本倉登記 |
| OpenWhispr（替 Flow） | **端用家可試** | MIT、本地 Parakeet／Whisper 離線聽寫＋BYOK；同我哋 app 無關，純粹打字／寫文件嘅個人生產力工具。試嗰陣留意：雲端模式（BYOK）音訊會出機、咪高峰權限畀邊個 app；會議／成員對話唔好喺未確認模式下用雲端聽寫（A12） |
| OpenProject（替 Asana） | **暫不採用** | GPL-3.0 老牌穩，但自架重；我哋項目管理已有 Git＋ecportal 旅團系統（[19 案例](19-ecportal-troop-case.md)）。真係要跨團隊甘特／工時嗰種規模，先按系統類（PLAYBOOK §0 第三類）正式評估，唔好順手開個 server 就當用咗 |
| Cal.diy／Cal.com（替 Calendly） | **有場景先試（託管優先）** | 真有「畀家長／領袖自己揀時間」嗰類預約場景先有價值；姿勢係 [EXTERNAL.md](../EXTERNAL.md) 模式 A 連結去託管版，零 infra。自架版要養 Next.js＋DB，唔值得為一條預約連結做；要用先核實託管版收費／私隱條款 |
| Chatwoot（替 Intercom） | **暫不採用** | 核心 MIT、enterprise 部分另授權（NOASSERTION 就係呢個意思，採用前要分清用到邊部分）；自架重 infra。我哋「用戶搵管理員」嘅需求已有 [31 ADMIN 回報系統](31-system-basics.md) 內建路線；真係要全渠道客服 inbox（網站 live chat＋email 同一收件匣）嗰陣先重估 |
| Cap（替 Loom） | **端用家可試** | 桌面錄屏＋分享連結，錄教學片（呼應 [17 用戶教學](17-final-check-and-tutorial.md)）係啱用場景；主體 AGPL-3.0（cap-camera／scap 部分 MIT）——自己錄自己用冇授權問題，改版分發先要理。錄到成員樣貌／畫面有個人資料嗰陣，跟 A12 處理分享範圍。託管分享版條款未核實，先試本地錄製 |

## 6. 查證限制／維護

- **已做**（2026-11-06）：GitHub API 逐個查 11 個 repo 嘅 metadata（stars／license／created_at／pushed_at／archived）；讀 Ponytail `SKILL.md` 全文、`AGENTS.md` 體積、benchmark 結果檔嘅方法＋正確性段；讀 FreeBuff README 嘅模型表＋Free access＋Data Use 段；讀 Cap／Chatwoot／Cal.com 嘅 LICENSE 頭確認混合授權；GitHub 搜尋 OpenSEO 同名 repo（4 個）同 Concept Studio（查無）。
- **未做**：安裝／執行任何一個工具；冇註冊 FreeBuff、冇買／冇裝 Concept Studio 或任何 Blender add-on、冇自架 AppFlowy／OpenProject／Chatwoot／Cal；冇開 freebuff.com／concept-studio 網站睇條款全文（出站限制，**引用前請親身開一次**）；Ponytail benchmark 冇第三方複跑呢點，係讀佢方法段後嘅判斷，唔係我哋實測。
- **星數會變**：引用前重查；「邊個 repo 先係片講嗰個」唔明嗰陣（OpenSEO、Concept Studio），寧願寫未核實，唔好就咁貼一條最似嘅連結當答案。
- **更新時機**：真正採用前、上游大改版後、引用星數前；更新來源 commit／日期／限制，再跑 `node scripts/guard.mjs`、`node scripts/consistency_v1.0.mjs . --json`、`node scripts/final_check_v1.0.mjs --json`。文件檢查通過唔會升級「未實測」狀態。
- **單一入口**：動態／爆紅清單第一、二輪去 [35](35-viral-ai-tools.md)；PPT／語音／Reverse API 去 [34](34-ai-workflow-tools.md)；設計資源去 [23](23-design-resources.md)；本頁只放第三輪清單核實＋Ponytail 七級梯，唔複製其他功能表。
