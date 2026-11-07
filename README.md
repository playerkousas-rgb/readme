# 🧭 必看 GIT 檔 — 我整 APP 嘅唯一入口

> **一句話**：開新 app 前睇呢頁；每次施工前對 checklist；出事先睇 runbook。
> 呢個 repo **唔係一個 app**，而係我所有 app 共用嘅**說明書 ＋ 可複製模板 ＋ 自動防呆檢查**。
> **案例隔離（2026-10-27）**：通用規則包括 S/F/A/W/V、研發前調查 P1 ＋ 技術棧契約；ecportal 旅團／進度追蹤嘅專案設定全部喺 [docs/19](docs/19-ecportal-troop-case.md)，**唔係通用底線**；邊個 repo 有問題喺 [docs/20](docs/20-repo-health-audit.md)。

更新日期：2026-11-07 · 適用技術棧：**Git ＋ Vercel ＋ Google Apps Script ＋ Supabase**（GEMINI 系統規範已集中去 GEMINI repo，本倉唔再做佢嘅入口）

---

## 🆕 開新 REPO：AGENT 第一步（2026-11-02）

> **如果你係 AGENT，而用戶話「開個新 repo／開新 app」：唔使讀晒呢頁，直接跟下面 6 步（0–5）。** 用戶會叫你「先睇一次呢個 repo 嘅 README」—— 呢個就係嗰個入口。**第 0 步最緊要：先主動問清楚用戶需求，唔好靠估。**

| 步 | 做乜 | 檔 |
|:--:|---|---|
| **0** | **主動問用戶**：一輪問晒「而家問得」嘅問題（形式／有冇 UI／身份／後台／Gemini／授權／一句定位），每條俾建議答案；**fact 自己查、決定留畀用戶；用戶確認先好郁手** | [`INTAKE.md`](templates/repo-starter/INTAKE.md) ＋ 實體原文 [`external/grilling/SKILL.md`](templates/repo-starter/skills/external/grilling/SKILL.md)（MIT）；全部喺 [`skills/CATALOG.md`](templates/repo-starter/skills/CATALOG.md) 入咗目錄 |
| 1 | 抄起手包 → 填 `{{...}}` → **揀授權** → 抄 5 支真理 script → `git init` | [`templates/repo-starter/START.md`](templates/repo-starter/START.md) ⓪–④ |
| 2 | **主動讀 `repo-setup` 並跟住做**：12 樣核心 → 按**形式**揀第 13／14 項 → 兩軸 review（Standards／Spec 分開） | [`skills/promoted/repo-setup/SKILL.md`](templates/repo-starter/skills/promoted/repo-setup/SKILL.md) |
| 3 | **有 UI／要出畫面**：`repo-setup` 第 4 步會明確叫你讀 `design-review`（house rules、inventory、390/768/1440 望圖、6 條 critique、`ROUND n`、40/30/20/10） | [`skills/promoted/design-review/SKILL.md`](templates/repo-starter/skills/promoted/design-review/SKILL.md) |
| 4 | **未 commit 之前**跑閘門：`ok: true` 先好郁，`exit 1` 即刻停手（8 個 check） | [`PREFLIGHT.md`](templates/repo-starter/PREFLIGHT.md) ＋ `node scripts/preflight_v1.0.mjs . --json` |
| 5 | 交付前 `guard` ＋ `final_check`；舊 repo 唔使一次過補，按 L2 排隊 | [docs/30](docs/30-repo-health-check.md) · [docs/27](docs/27-repo-starter.md) |

> ⚠️ **唔係自動觸發**：呢個環境無 Skill tool／plugin harness，要你（AGENT）**主動讀** `repo-setup`／`design-review` 兩份 `SKILL.md`（`external/grilling` 只作溯源）；PREFLIGHT 只驗佢哋存在、frontmatter 合格同**入咗 [`CATALOG.md`](templates/repo-starter/skills/CATALOG.md)**，**唔會代你執行**。
> ⚠️ **唔會自動整靚版面**：無瀏覽器／screenshots／Chrome inspector；望圖、設計分、`ROUND n` critique、兩軸報告要你自己寫低，做唔到就照實寫「做唔到」（[docs/32 §8.9](docs/32-consistency-audit.md)）。想睇「開新 repo 之後實際會／唔會發生乜」：[`START.md` 個對照表](templates/repo-starter/START.md)。
> 用戶只想**改現有 repo／查規則／審計** → 落下面 §1 導覽，唔好行呢 6 步（改現有 repo 只需要問「想改乜」，見 `INTAKE.md` 第 2 輪）。

---

## 📖 唔使讀晒 4000 行（閱讀階梯）

| 你得… | 讀呢啲就夠 |
|-------|-----------|
| **5 分鐘** | [docs/00-quickcard.md](docs/00-quickcard.md)（一頁紙）＋ [docs/17 §3 STEP BY STEP 教學](docs/17-final-check-and-tutorial.md#2--step-by-step由零到一個-app) |
| **20 分鐘** | 本 README ＋ [PLAYBOOK.md](PLAYBOOK.md)（規則 ID 總表） |
| 撞到問題 | 下面 §1 導覽 → 對應 `docs/` |
| 交付前 | `node scripts/final_check_v1.0.mjs`（六角度實測，見 [docs/17](docs/17-final-check-and-tutorial.md)） |
| **開新 REPO（AGENT）** | **上面 🆕 6 步（0–5）**：先 [`INTAKE.md`](templates/repo-starter/INTAKE.md) 問清楚 → [`START.md`](templates/repo-starter/START.md) → `repo-setup` SKILL.md → PREFLIGHT |
| AI Agent | [AGENTS.md](AGENTS.md) 頭 12 行 → README → PLAYBOOK → `final_check --json` |

---

## 0. 30 秒：五大通用鐵律（違反 = 唔准 deploy）

> 五套規則**全部 app 都適用**（工具／App／系統都一樣），
> 就好似瘦身系統咁，係底線唔係選項。

| # | 鐵律 | 一句版 | 詳情 |
|---|------|--------|------|
| 1 | **瘦身 S** | 唔好用嘅嘢一件都唔部署（**Vercel/dist 類**） | `dist < 5MB`、bundle `< 2MB`、`api` 零依賴；**單一 HTML 例外：5MB 上限、唔強制瘦身（越輕越快）** | [01-slim](docs/01-slim.md) |
| 2 | **防呆 F** | 人手一定會錯，所以要畀系統兜住 | fail closed、白名單、冪等鍵、樂觀鎖、dry-run、CI 硬攔 | [02-foolproof](docs/02-foolproof.md) |
| 3 | **安全 A** | 永遠假設前端已經被攻陷 | secret 只留 server、所有授權 server-side 計、HMAC sig、RLS、審計鏈 | [03-security](docs/03-security.md) |
| 4 | **COPYRIGHT SCOUT SYSTEM W** | 版權要講出口、寫入圖、留紀錄 | `© SCOUT SYSTEM` 頁尾＋中繼資料；生成圖落 DCT 隱形水印（v1/v2）；原圖／成品圖／使用紀錄 | [12-copyright](docs/12-copyright-scout-system.md) |
| 5 | **雙版號 V** | 每次更新檔名同內文一齊改版號 | `app_v1.0.html` ↔ `meta/title/APP_VERSION/頁尾/註解` 全部 v1.0；測試＋guard 自動對照 | [13-versioning](docs/13-versioning.md) |

**系統級 app 必須額外有兩樣嘢**（唔係 optional）：
- **設定層**：所有開關／參數一個入口讀寫，唔准散落喺 code 同 UI → [04-settings-super](docs/04-settings-super.md)
- **隱藏超管**：唔喺任何選單／名冊／API 回應出現嘅 break-glass 通道，用一次留一次痕 → [04-settings-super](docs/04-settings-super.md#2-隱藏超管hidden-super-admin)

---

**研發前額外必做 P1**：先上網找相近產品及自己的現有方案，記錄來源、差異與決策；無法查證須說明限制。[PLAYBOOK P1](PLAYBOOK.md#0-開工前三分類決定做幾多) · [相近產品參考](docs/24-similar-products.md)

## 1. 我要做嘢，應該睇邊份？（導覽）

| 我想… | 睇 |
|-------|-----|
| 5 分鐘內知全部規矩 | **[PLAYBOOK.md](PLAYBOOK.md)** — 核心規範總綱（規則 ID：S/F/A/W/V/G/VL/X/U/C；專案案例已分開去 19） |
| 印出嚟貼喺枱面 | [docs/00-quickcard.md](docs/00-quickcard.md) — 一頁紙速查 |
| 研發前查相近產品 | [docs/24-similar-products.md](docs/24-similar-products.md) — 既有比較及來源；新項目仍須自行搜尋核實（P1） |
| 盤點自己 Git 有乜可以重用（Reverse API／私有 API） | [docs/25-reverse-api-reuse.md](docs/25-reverse-api-reuse.md) — 85 個 repo 盤點：已有後台 API client／proxy／fail-closed／drift audit，獨缺 HAR→codegen |
| **想將 `docs/` 分章分類放好** | **[docs/README.md](docs/README.md)** — 章 0–6 索引、命名約定、加新檔四步 |
| 仍唔明「自製 API」點用 | [docs/26-reverse-api-walkthrough.md](docs/26-reverse-api-walkthrough.md) — 用九龍城區／營地天氣／IKEA 三個例子 + [`templates/reverse-api-demo/`](templates/reverse-api-demo/README.md) 可跑示範 |
| 開新 Git repo 要加乜 | [docs/27-repo-starter.md](docs/27-repo-starter.md) ＋ [`templates/repo-starter/START.md`](templates/repo-starter/START.md) — 12 樣 ＋ 第 13／14 項；**AGENT 開局讀 [`repo-setup/SKILL.md`](templates/repo-starter/skills/promoted/repo-setup/SKILL.md)**（有 UI 再讀 `design-review`） |
| **想 AGENT 設定 repo 前先檢查好**（唔想每次 push 跑 YML） | [`templates/repo-starter/PREFLIGHT.md`](templates/repo-starter/PREFLIGHT.md) ＋ `node scripts/preflight_v1.0.mjs . --json` — 8 個 check 一次過，exit 1 就停手 |
| 有身份系統要有乜基本功能（忘記密碼／ADMIN 回報） | **[docs/31-system-basics.md](docs/31-system-basics.md)** — 帳號生命週期 8 樣 ＋ **ADMIN 回報系統 8 樣**（通用）＋ [`templates/repo-starter/docs/system-basics.md`](templates/repo-starter/docs/system-basics.md) 可抄驗收表 |
| 我啲 repo 係咪「輕／有後台／Gemini」 | [docs/28-repo-taxonomy.md](docs/28-repo-taxonomy.md) — **形式分類**：30 輕／30 有後台／17 同 AI 有關，85 個逐個標籤 |
| API 設計／SKILL／分類嘅閱讀地圖 | [docs/29-reading-map.md](docs/29-reading-map.md) — 含 mattpocock/skills 同 taste-skill 評審 |
| **每個 repo 要點檢查** | **[docs/30-repo-health-check.md](docs/30-repo-health-check.md)** ＋ `node scripts/repo_health_v1.0.mjs <path> --json` |
| **成個 repo 有冇混亂／矛盾** | **[docs/32-consistency-audit.md](docs/32-consistency-audit.md)** ＋ `node scripts/consistency_v1.0.mjs . --json` — 3 軸 11 種檢查；**§8 用兩個 GIT 嘅 SKILL 原文再審一次**（邊啲做咗／做唔到寫明） |
| 開一個新 app | [docs/10-checklists.md](docs/10-checklists.md#1-開新-app30-分鐘) ＋ [templates/](templates/README.md) |
| **出圖標（Icon／Favicon）** | **[docs/33-icon-standard.md](docs/33-icon-standard.md)** — 9 個 PNG／ICO、四種格式否決、maskable 66%、16px 手繪、體積 ≤260 KB、驗收 5 項（[README §9](README.md#9-g11-全站圖標標準iconfavicon) 只留一句原則；照抄，唔再重新設計） |
| 檢查每次 commit / deploy | [docs/10-checklists.md](docs/10-checklists.md#2-每次施工commit-前) |
| 上線前 Go / No-Go | [docs/10-checklists.md](docs/10-checklists.md#3-上線前-go--no-go) |
| 出事（key 外洩／爆 quota／資料唔見） | [docs/11-incidents.md](docs/11-incidents.md) |
| 加隱形水印、用解碼器驗圖 | [docs/12-copyright-scout-system.md](docs/12-copyright-scout-system.md) ＋ [templates/watermark/](templates/watermark/README.md) |
| 改版（檔名＋內文雙版號） | [docs/13-versioning.md](docs/13-versioning.md) |
| 一次過搵晒 API／Prompt／開源 prompt 庫 | [docs/15-resource-index.md](docs/15-resource-index.md) — `f/prompts.chat` → `prompt` → `api` → 呢個 repo |
| **揀第三方 GitHub 開源 AI 工具**（PPT／Reverse API／需求訪談／語音） | **[docs/34-ai-workflow-tools.md](docs/34-ai-workflow-tools.md)** — PPT Master、Reverse API Engineer、`grill-me`、VoxCPM2：上游來源／授權、用途、本機使用條件同驗收；未實測事項明寫 |
| **爆紅 AI 清單揀邊個啱我哋**（動態／方法論／懶人包／Edge／粵語填詞） | **[docs/35-viral-ai-tools.md](docs/35-viral-ai-tools.md)** — 已用：起手包 `web-motion`＋`external/motion-prompt`；有場景先試 HyperFrames／story-to-handdrawn／Pixel2Motion；Paperclip／MoneyPrinterTurbo／Agent-Reach／VoiceStudio／Univer／Hindsight／Edge0 暫不採用；17 個 repo 已用 GitHub API 核實（2026-11-06） |
| **教 AI 偷懶／免費平替啱唔啱我哋**（Ponytail／FreeBuff／Blender 城市／9 個開源平替） | **[docs/36-lazy-coding-and-open-alternatives.md](docs/36-lazy-coding-and-open-alternatives.md)** — 即刻吸收：Ponytail「寫 code 前七級梯」checklist（讀，唔裝 plugin）；FreeBuff 唔好用喺真 repo（數據條款）；其餘平替逐個判端用家試／有場景先試／唔採用；11 個 repo 已用 GitHub API 核實（2026-11-06） |
| **免費 API／SEO 插件／設計畫廊／生圖風格啱唔啱我哋**（FreeLLMAPI／Claude SEO／20 種風格） | **[docs/37-ai-tools-design-prompts.md](docs/37-ai-tools-design-prompts.md)** — 即刻吸收：睇 API 三樣讀法＋8 個畫廊站入 [docs/23 §5.3](docs/23-design-resources.md)；Claude SEO 自家公開站上線前先試；FreeLLMAPI 只限個人實驗；生圖吸收詞彙＋句式（未實測）；GitHub API 已核實 2 個 repo（2026-11-06） |
| **動畫 CLI／API 目錄／AI 預測啱唔啱我哋**（Animate UI／ApiVault／MiroFish） | **[docs/38-animation-3d-prediction-tools.md](docs/38-animation-3d-prediction-tools.md)** — ApiVault 入 [docs/15](docs/15-resource-index.md) 做搵 API 第二層；Animate UI 要 shadcn 先用得（我哋 89 個 repo 普查：React 26／Next 9／靜態 32、shadcn 零個，2026-11-07）；MiroFish 只當假設產生器、唔當市場證據 |
| **10 個站實測＋邊啲值得自己做**（設計畫廊／Logo／SEO） | **[docs/39-verified-sites-and-diy.md](docs/39-verified-sites-and-diy.md)** — 10 站逐個開嚟核實（Scrolltide 係付費、3dicons CC0、Refero DESIGN.md 庫）；自己做總清單：已做 `scripts/seo_check_v1.0.mjs`＋`web-motion` 補 framer-motion 線，其餘逐個判 |
| **邊啲嘢應該用 Gemini＋Canvas 自己整** | **[docs/40-canvas-diy-candidates.md](docs/40-canvas-diy-candidates.md)** — 第一：G11 圖標產生器（Type A）；第二：現有產生器加風格 presets（Type B，唔新起）；第三：Pre-mortem 鬧場（Type C，產出只當假設）；其餘唔用 Canvas 嘅原因逐個寫明 |
| **值得自己做總清單（淨係免費）** | **[docs/41-free-self-build-shortlist.md](docs/41-free-self-build-shortlist.md)** — Gemini AI（風格產生器／Pre-mortem）值得做；本機／自架用戶決定唔做；前端網站圖標・相片工具已做；付費嘅唔保留（Scrolltide 已剔除） |
| **開 Icon Maker／Photo Prep 新 repo** | **[docs/42-iconmaker-photoprep-repo-briefs.md](docs/42-iconmaker-photoprep-repo-briefs.md)** — 兩個工具各一段開工對話成稿，開新 repo 後貼去第一個 AI 對話即用（唔加 AI、唔起後端、真機驗收清單） |
| **開新 Git 前揀設計資源**（字體／配色／Icon／插畫／UI library／模板／DESIGN.md／系統設計） | **[docs/23-design-resources.md](docs/23-design-resources.md)** — 5 個主庫 ＋ Nippon Colors／Adobe Color／Color Hunt ＋ 配色對比驗收 ＋ 10 步開工 checklist |
| 用 Git / PR / branch | [docs/05-git.md](docs/05-git.md) |
| 部署去 Vercel | [docs/06-vercel.md](docs/06-vercel.md) |
| 寫 Google Apps Script（Sheet 當 DB） | [docs/07-apps-script.md](docs/07-apps-script.md) |
| 用 Supabase（Postgres / Auth / Storage / Push） | [docs/08-supabase.md](docs/08-supabase.md) |
| 抄嘢（config / SQL / workflow / Canvas 骨架 / 水印） | [templates/](templates/README.md) |
| 交付前六角度實測 + 用戶教學 | [docs/17-final-check-and-tutorial.md](docs/17-final-check-and-tutorial.md) — `node scripts/final_check_v1.0.mjs` |
| 知原有 Git 檔有乜好系統／我漏咗乜 | [docs/18-as-built-gap-audit.md](docs/18-as-built-gap-audit.md) — as-built 對照審計 |
| 睇旅團／進度追蹤**專案**設定（唔係通用） | [docs/19-ecportal-troop-case.md](docs/19-ecportal-troop-case.md) — 五級階梯、`UNIT_*`、舊 sig、五個 repo |
| API／PROMPT 兩個 Git 留唔留？邊個有大問題？ | [docs/20-repo-health-audit.md](docs/20-repo-health-audit.md) — 11 個 repo 實測審計 |
| 實際點修（升級／瘦 Git／修 sig） | [docs/21-fix-plans.md](docs/21-fix-plans.md) — 已喺 `/tmp` clone 實測嘅指令同 code |
| 想叫 `scout-circulars` AGENT 幫手 | [docs/22-scout-circulars-agent-handoff.md](docs/22-scout-circulars-agent-handoff.md) — 可直接複製貼過去嘅問題清單（長版＋短版＋Q&A） |
| 跑自動檢查 | `node scripts/guard.mjs` |

---

## 2. 兩條公理（所有 app 通用）

```
① 一切身份 = 一個正規化 ID + 佢嘅資料源（邊張 Sheet／邊個 project）
② 一切接入 = 交俾邊個管 + 登記喺邊個 registry
```

任何新功能，先答呢兩條問題，答唔到就**唔准開工**。
由呢兩條公理派生：單一真理、registry 驅動、身份錨點、開戶只喺一個地方做。

---

## 3. 技術棧：邊個做乜（唔好撈亂）

```
Git              = 唯一真理 + 歷史 + PR 審查 + CI 閘（唔存 secret、唔存大檔）
Vercel           = 前端靜態 host + /api serverless（verifySession → inject secret）
Apps Script      = 單位自己嘅 leaf 後端（Sheet 當 DB、/exec、sig、ScriptLock）
                   ＋ Type C 嘅「腦」（brain_vX.Y.gs，保護 prompt／原圖成品圖紀錄）
Supabase         = 共用／跨平台數據（Postgres + RLS + Auth + Storage + 推送訂閱）
```

**鐵則**：
- **secret 只可以喺 Vercel env / GAS ScriptProperties / Supabase Vault**，永遠唔入 Git、唔入前端、唔入 URL/QR、唔入 Sheet 儲存格。
- **前端永遠唔直接揸 service key**：Vercel `/api` 做 proxy，Supabase 用 `anon key + RLS`，GAS 用一次性 `sig`。
- **身份只誕生一次**：喺身份錨點開戶，其他系統靠 `sig` / 同步收到鏡像，唔准各自開、唔准下游反寫上游。
- **所有生成圖要有 `© SCOUT SYSTEM`**：可見頁尾 + DCT 隱形水印雙軌（[W1/W2](docs/12-copyright-scout-system.md)）。
- **所有交付檔要雙版號**：檔名 `_vX.Y` + 內文 `APP_VERSION`，每次更新兩邊一齊改（[V1](docs/13-versioning.md)）。

---

## 4. 新 app 五步（照做就得）

> **完整 STEP BY STEP 教學喺 [docs/17 §2](docs/17-final-check-and-tutorial.md#2--step-by-step由零到一個-app)**（10 步，每步有指令同預期輸出）。
> 以下係濃縮版；第一次做建議直接跟 17。

```
1. 揀結構：A / B / C（docs/09 C1 決策表）；揀類型：工具 / App / 系統
2. 抄模板：跟 docs/17 STEP 2 嗰 10 行 cp（⚠️ .env.example 要加點、guard.mjs 要抄）
3. 填設定：cp .env.example .env.local → 本機填值 + Vercel Dashboard 填一次
4. 第一次防呆：node scripts/guard.mjs 綠
5. 寫功能 → 最終實測：node scripts/final_check_v1.0.mjs 六角度全綠
6. 人手實測（file:// / 手機 / 斷網 / 解碼器 / F12 / 清 cache）→ PR → CI 綠 → deploy
```

> **G11 圖標**：第 1 步起 repo 骨架就順手出齊 9 個圖標（**唔好留到最後**）—— 照 [docs/33](docs/33-icon-standard.md) 抄，唔重新設計。

Type B/C 專用起機指令：[templates/README.md](templates/README.md) · [watermark](templates/watermark/README.md) · [canvas](templates/canvas/README.md)。

> **唔記得點做？** `node scripts/guard.mjs` 會逐項話你知缺乜；`node scripts/final_check_v1.0.mjs` 會由六個角度驗多次。

---

## 5. 文件地圖

```
README.md                 ← 你而家喺度（入口／導覽）
PLAYBOOK.md               ← 核心規範總綱（唯一規則編號表：S/F/A/W/V/G/VL/X/U/C）
docs/
  00-quickcard.md          一頁紙速查卡
  01-slim.md               S1–S12 瘦身
  02-foolproof.md          F1–F18 防呆（F15 已改為雙版號）
  03-security.md           A1–A18 安全
  04-settings-super.md     系統設定層 + 隱藏超管（重點）
  05-git.md                G1–G10 Git / PR / CI
  06-vercel.md             VL1–VL12 Vercel
  07-apps-script.md        X1–X13 Google Apps Script（X13 = HtmlService 腦殼分離）
  08-supabase.md           U1–U12 Supabase
  09-gemini-canvas.md      C1–C12 Gemini 三種結構（A 全開放／B 水印／C 腦殼分離）
  10-checklists.md         所有 checklist
  11-incidents.md          出事 runbook
  12-copyright-scout-system.md  W1–W8 COPYRIGHT SCOUT SYSTEM（隱形水印／版權／原圖成品圖）
  13-versioning.md         V1–V6 檔名＋內文雙版號（版本登記表）
  14-api-key-injection.md  C13 三軌自動注入（已實作）+ C13-g 5MB + 香港做法 + prompt
  15-resource-index.md     資源查找總索引（prompts.chat / prompt / api 三層）
  16-canvas-case-scout-comic.md  實戰案例：童軍漫畫生成器 v4.2.1（C13 注入 / C13-g 5MB / V1 實證）
  17-final-check-and-tutorial.md  交付前六角度實測 + STEP BY STEP 用戶教學（最短入門）
  18-as-built-gap-audit.md       原有 4 份 as-built 檔 vs 新系統：漏咗乜／好系統
  19-ecportal-troop-case.md     【專案案例，唔係通用】旅團／進度追蹤全部具體設定 + 可選模式 R1–R8
  20-repo-health-audit.md       11 個 repo 健康審計：api/prompt 去留 + critical 漏洞 + 158MB 問題
  21-fix-plans.md              三個問題嘅實作修復方案（已實測：升級／Git 暴脹／舊 sig 重放）
  22-scout-circulars-agent-handoff.md  貼去 scout-circulars AGENT 嘅對話式問題清單
  23-design-resources.md      設計資源總索引（字體／配色／Icon／UI library／DESIGN.md／系統設計）＋開工 checklist
  24–33                      相近產品／API 教學／repo 治理／圖標等（完整索引：docs/README.md）
  34-ai-workflow-tools.md     第三方 GitHub 開源 AI 工具：PPT Master／Reverse API Engineer／grill-me／VoxCPM2 核實與驗收
  35-viral-ai-tools.md        2026-11 爆紅清單核實＋採用：17 個 repo GitHub API 快照；web-motion／external motion-prompt 已入起手包
  36-lazy-coding-and-open-alternatives.md  爆紅清單第三輪：Ponytail 七級梯（已吸收做 checklist）／FreeBuff／Blender 城市／9 個開源平替核實
  37-ai-tools-design-prompts.md  爆紅清單第四輪：FreeLLMAPI（只限實驗）／Claude SEO（有場景先試）／設計畫廊入 23 §5.3／生圖詞彙句式
  38-animation-3d-prediction-tools.md  爆紅清單第五輪：Animate UI（React 先試）／ApiVault（入 15 做第二層）／MiroFish（只出假設）／3D 生成觀察名單
  39-verified-sites-and-diy.md  10 站實測＋自己做總清單：已做 seo_check script＋web-motion 補 React 線
  40-canvas-diy-candidates.md  用 Gemini＋Canvas 自己整嘅候選判決：圖標產生器（A）／風格 presets（B）／Pre-mortem（C）
  （圖標規範**唯一來源係 [docs/33](docs/33-icon-standard.md)** — 2026-11-02 由 README §9 抽出；9 個 PNG／ICO、maskable 66%、16px 手繪）
templates/
  README.md               可抄嘢對照表 + 一鍵抄指令
  vercel/ git/ github/ gas/ supabase/   各平台 config / SQL / workflow
  watermark/              W 系列：codec / 解碼器 / 生成器 / key 注入器 / 測試（全部 _v1.0）
  canvas/                 C 系列：brain_v1.0.gs / shell_v1.0.html / 部署拷貝 / 合約 / PROMPT / RECORDS / STYLE_PRESETS（風格句共用）
scripts/guard.mjs         自動防呆檢查（本機 + CI 同一條）
scripts/audit_single_html_v1.0.mjs  單一 HTML / Canvas artifact 交付前審計（S/F/A/W/V/C）
scripts/seo_check_v1.0.mjs  公開頁 SEO/GEO 靜態檢查（title/og/JSON-LD 等；docs/39 §3.1）
scripts/refresh_resources_v1.0.mjs  由 api/data/apis.csv 更新 docs/15 分類表
scripts/final_check_v1.0.mjs      交付前一條命令跑六角度實測（docs/17）
.github/workflows/        呢個 repo 自己都跑 guard（dogfooding）
```

---

## 6. 實戰案例（保留：ecportal 既有 as-built 真理）

以下係**專案級文件**，唔係通用規範；佢哋係上面規則嘅真實來源，改通用規則時要對返佢哋有冇矛盾。

| 檔 | 作用 |
|----|------|
| [BUILD.md](BUILD.md) | ecportal 建構定案（身份／登入／同步／模組／審計／體積治理） |
| [AGENTS.md](AGENTS.md) | Agent 級別與施工邊界（五級階梯、越級零容忍） |
| [EXTERNAL.md](EXTERNAL.md) | 外部系統接入（零特權、三種模式） |
| [進度追蹤旅系統升級版.md](進度追蹤旅系統升級版.md) | GAS 上下游接駁 as-built（`sig`／`ALLOW_LOCAL_LOGIN`／吐 JSON／10 項守護測試） |

> **已分開寫**：呢 4 份原檔講嘅全部係 **ecportal 專案**，佢哋嘅具體設定（五級階梯、`UNIT_*`／`DOWNSTREAM_*`、舊 sig、五個 repo）
> 已集中去 **[docs/19 專案案例](docs/19-ecportal-troop-case.md)**（唔係通用規則）；由案例抽出嘅 R1–R8 亦放喺 19 §14 做**可選模式**。
> [docs/18](docs/18-as-built-gap-audit.md) 保留做「我漏咗乜」嘅審計記錄。
>
> 通用規範同專案文件衝突時：**S/F/A/W/V 五套底線以 PLAYBOOK 為最低要求**；專案業務邏輯以該專案 `BUILD.md` 為準，並要喺 PR 寫明點解有例外。
> 已知例外／勘誤：① ecportal `進度追蹤旅系統升級版.md §9` 仍寫「版號只留本 MD」—— 新 app 一律跟 [V 系列](docs/13-versioning.md)。
> ② `BUILD.md §S3` 寫 `installCommand: npm install --omit=dev` —— 已證實會令 Vercel build 搵唔到 `vite`；新 app 用 `--include=dev`（[VL3/VL8](docs/06-vercel.md#vl8--部署衛生s8)）。

---

## 7. 相關 repo（你 GitHub 帳戶 `playerkousas-rgb` 入面）

> 以下係**你自己嘅 repo**（我對過 `gh repo list`，79 個入面），同呢份必看檔直接相關：

| Repo | 係乜 | 點用喺呢份規範 |
|------|------|----------------|
| [`api`](https://github.com/playerkousas-rgb/api) | 🇭🇰 **香港免費 API 天書**：`data/apis.csv` 機讀總索引 + 20+ 份 `docs/*.md`（天氣／交通／AI／封港名單…） | **開新 app 揀 API 之前先睇**；特別 [`docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md)、[`docs/hk-blocked.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/hk-blocked.md) 直接約束 [14-api-key-injection](docs/14-api-key-injection.md) |
| [`prompt`](https://github.com/playerkousas-rgb/prompt) | **提示站 Prompt Studio**（Next.js，https://prompt-smoky-pi.vercel.app）：欄位 ↔ 卡面區塊 ↔ 提示詞片段三向連動 | Prompt 資產庫；對應 [C9 保護 PROMPT](docs/09-gemini-canvas.md#c9--type-c保護-prompt-設定)、[V5 版號入紀錄](docs/13-versioning.md) |
| [`DRAWSCOUT`](https://github.com/playerkousas-rgb/DRAWSCOUT) ／ [`decode`](https://github.com/playerkousas-rgb/decode) | 出圖 app ／ 水印解碼器（你畀我嘅 `drawscout.html` 就係呢條線） | [W2 隱形水印](docs/12-copyright-scout-system.md) 嘅真實來源；已收錄做 `templates/watermark/drawscout_decoder_v1.0.html` |
| 其餘 5 個旅團 as-built repo | `vsbadge`／`roverbadge`／`cubsbadge`／`scoutbadge`／`scout-circulars` | **屬專案案例** → [docs/19 §12](docs/19-ecportal-troop-case.md)；健康問題 → [docs/20](docs/20-repo-health-audit.md) |

> **去留決定**：`api` 同 `prompt` **兩個都保留**（佢哋係兩個真理源，`docs/15` 只放入口唔複製內容）；
> 但 `prompt` 有 critical 漏洞要即刻升級 Next.js、`scout-circulars` 158MB 要停止每日 commit 數據 —— 詳情 [docs/20](docs/20-repo-health-audit.md)。

**`PROMPTS.CHAT`**：你帳戶冇呢個 repo；公開項目係 [`f/prompts.chat`](https://github.com/f/prompts.chat)（前名 *Awesome ChatGPT Prompts*，開源提示詞庫／平台，可 self-host）。你個 `prompt` repo 唔係佢 fork。
👉 三層查找（`f/prompts.chat` → `prompt` → `api` → W/V 規則）已寫成 [docs/15-resource-index.md](docs/15-resource-index.md)（含 254 條 API 分類索引）。

---

## 8. 維護約定

- **改規則 = 改 `PLAYBOOK.md` 規則表 + 對應 `docs/` + `scripts/guard.mjs` + `templates/`**，四處同步（[F16](docs/02-foolproof.md)）。
- **每次更新交付檔 = 檔名 + 內文同時改版號**：`app_v1.0.html` → `app_v1.1.html`，`meta/title/APP_VERSION/頁尾/註解` 全部改，跑 sync + 測試，更新 [版本登記表](docs/13-versioning.md)（[V3](docs/13-versioning.md)）。
- **每個交付檔要有 `© SCOUT SYSTEM`**：可見頁尾 + `<meta name="copyright">`；出圖再加隱形水印（[W1/W2](docs/12-copyright-scout-system.md)）。
- **注入版（`_local_`／`_injected`）永遠唔入 Git**：本機用完即刻刪（[W6](docs/12-copyright-scout-system.md)）。
- 歷史版本／審查報告存 Git 歷史（tag/commit），工作目錄只留最終定案。
- 每次改完跑：
  ```bash
  node scripts/guard.mjs
  node --test
  node templates/canvas/sync_canvas_v1.0.mjs
  node scripts/final_check_v1.0.mjs     # 六角度最終實測
  ```
  全綠先 commit。交付任何單一 HTML 之前再加 `node scripts/audit_single_html_v1.0.mjs <檔名>`（[C13-f](docs/09-gemini-canvas.md#c13--單一-html-體積同自動注入2026-10-27-定案)）。
- 每月（或 `api` repo 有 push）更新資源索引：`node scripts/refresh_resources_v1.0.mjs`（需要 `gh` 登入）。
- 設計資源（§23）每季用 GitHub API 實測星星數再更新；真係用咗人哋素材 → 該 repo 即寫 `CREDITS.md`（[W8](docs/12-copyright-scout-system.md#w8--第三方素材要標來源)）。

---

## 9. G11 全站圖標標準（Icon／Favicon）

> **一句原則**：每個 app 開工第一件事就**出齊 9 個 PNG／ICO 圖標檔**，唔准 SVG／AVIF／WebP、唔准逐次重新設計格式。**完整標準（尺寸表、四種格式否決、maskable 66%、16px 手繪、HTML／manifest 掛法、≤260 KB 預算、驗收 5 項）→ [docs/33-icon-standard.md](docs/33-icon-standard.md)**，嗰份係唯一來源。
> 2026-11-02 抽出：本節 138 行搬咗去 docs/33，圖標唔係每次開新 repo 都要睇，README 只留原則 + 指針。G 系列第 11 條（G1–G10 見 [docs/05](docs/05-git.md)）；定案 2026-10-28，實測來源 `hkcamping` v1.12.1。

> 配合 [§4 新 app 五步](README.md#4-新-app-五步照做就得) 第 1 步：起 repo 骨架就順手出齊 9 個圖標，**唔好留到最後**。
