# 23 — 設計資源總索引（開新 Git／新 App 前揀設計語言）

> **點解有呢份**：每次開新 repo，最花時間嘅唔係寫 code，而係「字體用邊隻、色用邊套、icon 邊度搵、UI 用邊個 library」。
> 呢份係**查找入口**（同 [15-resource-index.md](15-resource-index.md) 同一原則：**只放連結＋摘要，唔複製內容**，F1 單一真理）。
> 上游＝GitHub 上最常 bookmark 嘅 5 個設計資源庫；下游＝你自己嘅 G／W／S 規則（圖標 [README §9](../README.md#9-g11-全站圖標標準iconfavicon)、版權 [12](12-copyright-scout-system.md)、瘦身 [01](01-slim.md)）。

**星星數為 2026-10-29 用 GitHub API 實測**（`GET /repos/{owner}/{repo}` 嘅 `stargazers_count`），唔係估。

---

## 1. 五個主庫（一頁睇完）

| # | Repo | ⭐ | License | 係乜 | 幾時開 | 對應規則 |
|---|------|----:|---------|------|--------|----------|
| 1 | [`bradtraversy/design-resources-for-developers`](https://github.com/bradtraversy/design-resources-for-developers) | 67,270 | MIT | **設計素材大雜燴**：字體、配色、Icons、插畫、CSS framework、UI library、免費圖庫、模板、工具 | 開工第一步「搵素材」；唔知去邊搵就由呢度掃目錄 | S1（唔好整套 library 塞入 dist）、W8（標來源） |
| 2 | [`gztchan/awesome-design`](https://github.com/gztchan/awesome-design) | 17,707 | 無（awesome list，連結為主） | **設計靈感＋設計師向資源**：靈感網站、Designer News、UX checklist、設計工具、書／課程 | 想「參考人哋點做」、要 UX checklist、要靈感流 | W8（靈感 ≠ 可以照抄）、[10 checklists](10-checklists.md) |
| 3 | [`VoltAgent/awesome-design-md`](https://github.com/VoltAgent/awesome-design-md) | 124,289 | MIT | **`DESIGN.md` 集合**：Stripe／Vercel／Linear 等品牌 design system 寫成一份 Markdown，掉落 project 就叫 AI agent 依個 design language 出 UI | 用 AI（Cursor／Claude Code／Arena Agent）起 UI 之前，先揀一份 `DESIGN.md` 做設計語言契約 | **F1（一份 `DESIGN.md` = 單一設計真理）**、W8（品牌語言可參考，logo／素材唔可以照抄）、W1（自己成品要 `© SCOUT SYSTEM`） |
| 4 | [`donnemartin/system-design-primer`](https://github.com/donnemartin/system-design-primer) | 375,963 | CC-BY-4.0（repo 標 NOASSERTION，內文另有 CC-BY） | **系統設計聖經**（唔係視覺設計）：可擴展架構、cache、DB、queue、面試題＋Anki | 「設計」其實指**後端／系統架構**時；設計 Supabase schema、拆 API、估容量之前 | X／U 系列（[07](07-apps-script.md)、[08](08-supabase.md)）、[15](15-resource-index.md) `api/docs/glue.md` |
| 5 | [`ant-design/ant-design`](https://github.com/ant-design/ant-design) | 99,974 | MIT | 螞蟻金服**企業級 UI 設計語言 + React 組件庫**（Design Token、暗色模式、表格／表單最強） | 要「一個 dashboard／後台即刻有production 樣」；想抄佢套 **Design Token 命名法**落自己 CSS | S1（tree-shake／按需引入）、V（版號）、W8（icon 來源要標） |

> 記法：**1 搵素材 → 2 搵靈感 → 3 定 design language → 4 定架構 → 5 落 component**。
> 「設計」兩個字喺 GitHub 有兩條完全唔同嘅路（視覺 vs 系統），唔好撈亂 —— 見下面 §4 分流表。

---

## 2. 逐個庫：入面有乜、點揀

### 2.1 `bradtraversy/design-resources-for-developers`（素材倉，MIT）

目錄大致分（睇 repo 目錄名為準）：**General／Fonts／Colors／Icons／Logos／Favicons／Icon Fonts／Stock Photos／Stock Videos／Stock Music／Vectors／Illustrations／HTML Templates／CSS Frameworks／UI Libraries／React UI／Vue UI／Angular UI／Design Systems／Design Tools／Chrome Extensions／Podcasts／Books**。

- **用法**：當「供應商名單」，唔係「下載站」。揀 1–2 個 per 類別就夠，唔好每類儲 10 個（S1 瘦身＋注意力）。
- **字體**：留意 licence（Google Fonts = OFL 可 self-host；Adobe Fonts 要訂閱）。**只 load 用得到嘅字重**，`font-display: swap`，中文字體 subset 先（一個中文字體 full set 可以 10MB+，直接爆 S7／C13-g）。
- **配色**：抄 hex 之前先定**語意 token**（`--bg`／`--fg`／`--accent`／`--danger`），唔好散落 50 個 raw hex（同 [04 設定層](04-settings-super.md) 一個入口嘅思路一樣）。
- **Icons**：SVG inline 或 sprite；**唔好**整套 icon font 拖入 dist。
- **Templates**：可以抄骨架，唔好抄到連授權檔都唔睇；落地時改到「唔認得原本」，再喺 `CREDITS.md` 標來源（[W8](12-copyright-scout-system.md#w8--第三方素材要標來源)）。

### 2.2 `gztchan/awesome-design`（靈感／UX，無 license 檔）

- 內容係 **curated links**（靈感站、Dribbble／Behance 類、Designer News、UX 方法論、checklist、工具、書）。
- **用法**：開工前 30 分鐘掃一輪，做 3 張 mood reference，然後**寫落自己 repo 嘅 `docs/DESIGN.md`**（見 §3），唔好邊做邊改風格。
- **注意**：呢個 repo **冇 LICENSE 檔** → 佢嘅**文字內容**唔好整段複製；連結本身唔受版權保護，但被連結嘅作品有。靈感 ≠ 授權（W8）。

### 2.3 `VoltAgent/awesome-design-md`（AI 用 design language，MIT）

呢個係 2026 最實用嘅一個：每個品牌一份 `DESIGN.md`，內容通常包括 **色彩（含 hex）／字體階層／間距節奏／圓角／陰影／動效／component 規格／do & don't**。

**標準用法（建議寫死喺新 repo）**：

```text
新 repo/
├─ DESIGN.md              ← 由上游揀一份做底，改成自己品牌（唯一設計真理 F1）
├─ CREDITS.md             ← 標明 DESIGN.md 來源 repo + commit（W8）
└─ src/styles/tokens.css  ← DESIGN.md 嘅 token 落成 CSS variables（唔好散寫 hex）
```

流程 5 步：
1. 去上游揀 1 份最接近你想要嘅（例：Linear 感 = 冷灰 + 極細邊框；Vercel 感 = 純黑白 + 大字距）。
2. **Copy 落自己 repo，改檔頭**：寫明「Adapted from `<repo>` @ `<commit>`，MIT」＋你自己嘅品牌名（W8、V5 版號概念）。
3. 用 AI agent 前，**先叫佢讀 `DESIGN.md`**，再叫佢出 UI；一句 prompt 足夠：「Follow DESIGN.md strictly; do not invent new colors or spacing scale.」
4. 出完 UI 對一次：**顏色全部出自 token？字階只用 5 級？圓角只用 2 種？** 唔係就返去改 `DESIGN.md` 或者改 code，唔好兩邊都改。
5. 交付加 `© SCOUT SYSTEM`（W1）＋圖標走 [README §9 G11](../README.md#9-g11-全站圖標標準iconfavicon)。

**三個風險（實測要知）**：
- 品牌 design system 係**別人嘅商標資產**：抄「感覺／比例／token 命名」可以，**抄 logo、品牌 icon、獨有插畫**唔可以（W8）。
- 上游係社群整理，個別 `DESIGN.md` 可能過時或同真實官網有出入 → **以官網 live 版為最終對照**。
- 佢會令所有 app 生得一模一樣。至少改 **字體、主色、圓角、密度** 其中兩項，否則你自己 5 個 repo 睇落係同一間公司（唔一定係壞事，但要係你揀嘅）。

### 2.4 `donnemartin/system-design-primer`（系統設計，唔係視覺）

- 內容：可擴展性原則、CAP、cache／CDN、DB 選型（SQL vs NoSQL）、replication／sharding、async queue、負載平衡、monitoring、面試 8 步框架、Anki flashcards、中文／日文等多語翻譯。
- **幾時真係要開**：你個 app 開始有「多人同時寫同一張表」、要選 Supabase vs Sheet、要設計 idempotency／retry、要估免費額度夠唔夠。
- **對照你已有嘅規則**：佢講嘅 cache／queue／replication，落地版本就係 [07 Apps Script](07-apps-script.md)（ScriptLock／CacheService）、[08 Supabase](08-supabase.md)（index／RLS／cron）、[02 F 系列](02-foolproof.md)（冪等鍵、樂觀鎖）。**唔好因為讀完就想加 Kafka**（S1：唔用嘅嘢一件都唔部署）。
- **License 注意**：repo 頁顯示 `NOASSERTION`，內文有 CC-BY-4.0 聲明；引用圖文要標來源（W8），翻譯版另有授權。

### 2.5 `ant-design/ant-design`（企業級 UI，MIT）

- 三樣可分開用，**唔一定要用 React**：
  1. **Design Token**（`colorPrimary`／`borderRadius`／`controlHeight`／字階）→ 抄概念寫自己 `tokens.css`。
  2. **組件規格**（表格、表單、抽屜、通知、空狀態）→ 做 dashboard 時照佢嘅互動慣例，用戶零學習成本。
  3. **React 組件庫**（`antd`）→ 真係用 React 先引入，**按需引入**（`import { Table } from 'antd'`），主題用 ConfigProvider 一次過改。
- 同 `DESIGN.md` 玩法可以疊：`DESIGN.md` 定「感覺」，antd 提供「現成零件」，token 做橋。
- 體積：antd 全套唔細，Vercel 類交付要睇 S7（dist < 5MB／bundle < 2MB）；單一 HTML 例外看 C13-g 5MB。
- 相關：`ant-design/ant-design-pro`（後台樣板）、`ant-design/icons`（圖標，同樣要標來源）。

---

## 3. 新 Git 開工：設計決策 checklist（照做）

| 步 | 做乜 | 產出 | 規則 |
|---|------|------|------|
| 1 | 講清楚係**視覺設計**定**系統設計**（§4） | 一句話喺 README 頂 | — |
| 2 | 揀 3 個 reference（`awesome-design` 掃） | `docs/DESIGN.md` §Reference | W8 |
| 3 | 揀 1 份 `DESIGN.md` 做底，改成自己品牌 | `DESIGN.md` ＋ `CREDITS.md`（來源＋commit） | F1／W8 |
| 4 | Design Token 落 CSS variables（色／字／距／圓角／陰影 5 組） | `tokens.css` | S1（一套 token，唔好散 hex） |
| 5 | 揀字體：≤2 家族、≤4 字重、中文 subset | `<link>` 或 self-host | S1／S7 |
| 6 | 揀 icon 方案：**一個**（inline SVG sprite 或 icon library 按需） | `icons/` | S1／W8 |
| 7 | 出齊 9 個圖標（favicon.ico／16／32／180／192／512／maskable×2／og） | `public/icons/*` | **G11**（[README §9](../README.md#9-g11-全站圖標標準iconfavicon)） |
| 8 | UI 組件：自己寫 or antd／shadcn 類 → 記錄理由 | `docs/DESIGN.md` §Components | S1 |
| 9 | 若要後端架構：用 system-design-primer 對照 cache／index／queue | `docs/ARCH.md`（可選） | F／U／X |
| 10 | 交付前：`© SCOUT SYSTEM`、雙版號、guard 全綠 | 頁尾＋`node scripts/guard.mjs` | W1／V1／F16 |

> 10 步入面，**只有 3、4、7 係硬性**（冇 design language、冇 token、冇齊圖標就唔好開工）。

---

## 4. 分流：「設計」兩個字，去兩條唔同嘅路

| 你講嘅「設計」係… | 主要睇 | 唔好搞錯 |
|---|---|---|
| 介面／視覺／品牌（字體、色、icon、layout） | 1、2、3、5（`bradtraversy` → `awesome-design` → `awesome-design-md` → `ant-design`） | 呢邊**唔關** system-design-primer 事 |
| 系統／後端／資料流（schema、API、cache、擴展） | 4（`system-design-primer`）＋ [15 api 索引](15-resource-index.md)＋[07](07-apps-script.md)／[08](08-supabase.md) | 呢邊**唔關**字體色票事 |
| 兩樣都要（新 app 最常見） | 先 §1→§3 定視覺（1 日內做完），再 §4 定架構（唔好反過來） | 架構先行 = UI 做完發現 schema 撐唔住，重做 |

---

## 5. 補充：同類常青資源（唔喺上面 5 個入面，但常用）

> 唔係你指定嘅清單，只係補位；冇實測星星數，所以唔列數字。

| 類別 | 去 | 用嚟做乜 |
|------|-----|----------|
| 字體 | [Google Fonts](https://fonts.google.com) · [Fontshare](https://www.fontshare.com) | 免費商用字體；下載前睇 licence |
| 配色 | [Coolors](https://coolors.co) · [Realtime Colors](https://realtimecolors.com) | 5 色 palette → 直接出 token |
| Icons | [Lucide](https://lucide.dev) · [Iconify](https://icon-sets.iconify.design) | 一套線性 icon，可 copy SVG |
| 插畫 | [unDraw](https://undraw.co) · [Storyset](https://storyset.com) | 可改色插畫（標來源，W8） |
| UI 零件 | [shadcn/ui](https://ui.shadcn.com) | copy-paste 組件，唔綁版本（合 S1） |
| 無障礙／UX 檢查 | [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) | 文字對比 ≥4.5:1（AA） |
| 系統設計（中文） | [system-design-primer 繁中版](https://github.com/donnemartin/system-design-primer/blob/master/README-zh-TW.md) | 同上 §2.4，中文對照 |

---

## 6. 維護約定

- 星星數每季（或想引用之前）用呢條命令實測，唔好靠記憶：
  ```bash
  for r in bradtraversy/design-resources-for-developers gztchan/awesome-design \
           VoltAgent/awesome-design-md donnemartin/system-design-primer ant-design/ant-design; do
    printf '%s :: ' "$r"
    curl -s "https://api.github.com/repos/$r" | grep -o '"stargazers_count":[0-9]*'
  done
  ```
- 加新資源 → **一定要對應一條現有規則 ID**（S/F/A/W/V/G/C/U/X），否則只係 bookmark，唔入呢份。
- 新 repo 真係用咗某份 `DESIGN.md`／素材 → **即刻寫落該 repo 嘅 `CREDITS.md`**（W8），唔好等交付前補。
- 連結搬咗 → 改呢份 ＋ [15 §2](15-resource-index.md#2-我想搵-去邊快速表)；`node scripts/guard.mjs` 會驗內部連結同錨點。
