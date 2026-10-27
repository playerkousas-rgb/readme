# 🧭 必看 GIT 檔 — 我整 APP 嘅唯一入口

> **一句話**：開新 app 前睇呢頁；每次施工前對 checklist；出事先睇 runbook。
> 呢個 repo **唔係一個 app**，而係我所有 app 共用嘅**說明書 ＋ 可複製模板 ＋ 自動防呆檢查**。
> **案例隔離（2026-10-27）**：通用規則只有 S/F/A/W/V ＋ 技術棧契約；ecportal 旅團／進度追蹤嘅專案設定全部喺 [docs/19](docs/19-ecportal-troop-case.md)，**唔係通用底線**；邊個 repo 有問題喺 [docs/20](docs/20-repo-health-audit.md)。

更新日期：2026-10-27 · 適用技術棧：**Git ＋ Vercel ＋ Google Apps Script ＋ Supabase ＋ Gemini／Canvas**

---

## 📖 唔使讀晒 4000 行（閱讀階梯）

| 你得… | 讀呢啲就夠 |
|-------|-----------|
| **5 分鐘** | [docs/00-quickcard.md](docs/00-quickcard.md)（一頁紙）＋ [docs/17 §3 STEP BY STEP 教學](docs/17-final-check-and-tutorial.md#2--step-by-step由零到一個-app) |
| **20 分鐘** | 本 README ＋ [PLAYBOOK.md](PLAYBOOK.md)（規則 ID 總表） |
| 撞到問題 | 下面 §1 導覽 → 對應 `docs/` |
| 交付前 | `node scripts/final_check_v1.0.mjs`（六角度實測，見 [docs/17](docs/17-final-check-and-tutorial.md)） |
| AI Agent | [AGENTS.md](AGENTS.md) 頭 12 行 → README → PLAYBOOK → `final_check --json` |

---

## 0. 30 秒：五大通用鐵律（違反 = 唔准 deploy）

> 五套規則**全部 app 都適用**（工具／App／系統、Gemini 三種結構都一樣），
> 就好似瘦身系統咁，係底線唔係選項。

| # | 鐵律 | 一句版 | 詳情 |
|---|------|--------|------|
| 1 | **瘦身 S** | 唔好用嘅嘢一件都唔部署（**Vercel/dist 類**） | `dist < 5MB`、bundle `< 2MB`、`api` 零依賴；**單一 HTML / Gemini Canvas 例外：5MB 上限、唔強制瘦身（C13-g，越輕越快）** | [01-slim](docs/01-slim.md) |
| 2 | **防呆 F** | 人手一定會錯，所以要畀系統兜住 | fail closed、白名單、冪等鍵、樂觀鎖、dry-run、CI 硬攔 | [02-foolproof](docs/02-foolproof.md) |
| 3 | **安全 A** | 永遠假設前端已經被攻陷 | secret 只留 server、所有授權 server-side 計、HMAC sig、RLS、審計鏈 | [03-security](docs/03-security.md) |
| 4 | **COPYRIGHT SCOUT SYSTEM W** | 版權要講出口、寫入圖、留紀錄 | `© SCOUT SYSTEM` 頁尾＋中繼資料；生成圖落 DCT 隱形水印（v1/v2）；原圖／成品圖／使用紀錄 | [12-copyright](docs/12-copyright-scout-system.md) |
| 5 | **雙版號 V** | 每次更新檔名同內文一齊改版號 | `app_v1.0.html` ↔ `meta/title/APP_VERSION/頁尾/註解` 全部 v1.0；測試＋guard 自動對照 | [13-versioning](docs/13-versioning.md) |

**系統級 app 必須額外有兩樣嘢**（唔係 optional）：
- **設定層**：所有開關／參數一個入口讀寫，唔准散落喺 code 同 UI → [04-settings-super](docs/04-settings-super.md)
- **隱藏超管**：唔喺任何選單／名冊／API 回應出現嘅 break-glass 通道，用一次留一次痕 → [04-settings-super](docs/04-settings-super.md#2-隱藏超管hidden-super-admin)

---

## 1. 我要做嘢，應該睇邊份？（導覽）

| 我想… | 睇 |
|-------|-----|
| 5 分鐘內知全部規矩 | **[PLAYBOOK.md](PLAYBOOK.md)** — 核心規範總綱（規則 ID：S/F/A/W/V/G/VL/X/U/C；專案案例已分開去 19） |
| 印出嚟貼喺枱面 | [docs/00-quickcard.md](docs/00-quickcard.md) — 一頁紙速查 |
| 開一個新 app | [docs/10-checklists.md](docs/10-checklists.md#1-開新-app30-分鐘) ＋ [templates/](templates/README.md) |
| 檢查每次 commit / deploy | [docs/10-checklists.md](docs/10-checklists.md#2-每次施工commit-前) |
| 上線前 Go / No-Go | [docs/10-checklists.md](docs/10-checklists.md#3-上線前-go--no-go) |
| 出事（key 外洩／爆 quota／資料唔見） | [docs/11-incidents.md](docs/11-incidents.md) |
| 決定 Gemini app 用邊種結構 | [docs/09-gemini-canvas.md](docs/09-gemini-canvas.md) — **A 全開放／B 隱藏水印／C 腦殼分離** |
| 加隱形水印、用解碼器驗圖 | [docs/12-copyright-scout-system.md](docs/12-copyright-scout-system.md) ＋ [templates/watermark/](templates/watermark/README.md) |
| 喺 Gemini 自動注入 API KEY | [docs/14-api-key-injection.md](docs/14-api-key-injection.md) — **C13 三軌自動注入（已實作可用）**：唯一 slot＋平台代理＋BYOK 後備；全端 app 先至用 server-side secret；[docs/09 C5](docs/09-gemini-canvas.md#c5--type-b喺-gemini-自動注入-api-keyc13已實作可用) |
| 改版（檔名＋內文雙版號） | [docs/13-versioning.md](docs/13-versioning.md) |
| 一次過搵晒 API／Prompt／開源 prompt 庫 | [docs/15-resource-index.md](docs/15-resource-index.md) — `f/prompts.chat` → `prompt` → `api` → 呢個 repo |
| 睇真實 Gemini Canvas app 踩過咩坑 | [docs/16-canvas-case-scout-comic.md](docs/16-canvas-case-scout-comic.md) — 童軍漫畫生成器 v4.2.1 實戰 |
| 驗一個單一 HTML 交唔交到貨 | `node scripts/audit_single_html_v1.0.mjs <檔名>` — S/F/A/W/V/C 靜態審計 |
| 保護 PROMPT 設定／記錄原圖成品圖 | [docs/09-gemini-canvas.md](docs/09-gemini-canvas.md#c6--type-c腦殼分離html-殼--gs-腦) ＋ [templates/canvas/](templates/canvas/README.md) |
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
Gemini / Canvas  = 生 UI 殼；三種結構：
                   A 全開放（一個 HTML）
                   B 隱藏水印（HTML + DCT 水印 + 解碼器 + API KEY 注入位）
                   C 腦殼分離（HTML 殼 + GS 腦，記錄原圖／成品圖／使用紀錄）
```

**鐵則**：
- **secret 只可以喺 Vercel env / GAS ScriptProperties / Supabase Vault**，永遠唔入 Git、唔入前端、唔入 URL/QR、唔入 Sheet 儲存格。
- **前端永遠唔直接揸 service key**：Vercel `/api` 做 proxy，Supabase 用 `anon key + RLS`，GAS 用一次性 `sig`。
- **身份只誕生一次**：喺身份錨點開戶，其他系統靠 `sig` / 同步收到鏡像，唔准各自開、唔准下游反寫上游。
- **Gemini app 嘅 prompt 同紀錄都係敏感資產**：Type C 一律放 `Code.gs` + Sheet／Drive；Type A/B 唔好寫入 HTML（「檢視原始碼」即公開）→ [09-gemini-canvas](docs/09-gemini-canvas.md)。
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
templates/
  README.md               可抄嘢對照表 + 一鍵抄指令
  vercel/ git/ github/ gas/ supabase/   各平台 config / SQL / workflow
  watermark/              W 系列：codec / 解碼器 / 生成器 / key 注入器 / 測試（全部 _v1.0）
  canvas/                 C 系列：brain_v1.0.gs / shell_v1.0.html / 部署拷貝 / 合約 / PROMPT / RECORDS
scripts/guard.mjs         自動防呆檢查（本機 + CI 同一條）
scripts/audit_single_html_v1.0.mjs  單一 HTML / Canvas artifact 交付前審計（S/F/A/W/V/C）
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

**新增案例（通用規則嘅實證，唔係專案级 as-built）**：
[docs/16-canvas-case-scout-comic.md](docs/16-canvas-case-scout-comic.md) — 你嘅 Gemini Canvas app「童軍漫畫生成器 v4.2.1」。
佢個 `VERSION_LOG` 記錄咗 S/F/A/W/V 嘅真實踩坑（1.20MB→433KB、`localStorage` sandbox 炸 app、兩處 key 宣告、
**C13 三軌自動注入已實作、實測可用**），並附 [單一 HTML 審計器](scripts/audit_single_html_v1.0.mjs) 實跑結果（5MB 版）。

---

## 7. 相關 repo（你 GitHub 帳戶 `playerkousas-rgb` 入面）

> 以下係**你自己嘅 repo**（我對過 `gh repo list`，79 個入面），同呢份必看檔直接相關：

| Repo | 係乜 | 點用喺呢份規範 |
|------|------|----------------|
| [`api`](https://github.com/playerkousas-rgb/api) | 🇭🇰 **香港免費 API 天書**：`data/apis.csv` 機讀總索引 + 20+ 份 `docs/*.md`（天氣／交通／AI／封港名單…） | **開新 app 揀 API 之前先睇**；特別 [`docs/ai.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/ai.md)、[`docs/hk-blocked.md`](https://github.com/playerkousas-rgb/api/blob/main/docs/hk-blocked.md) 直接約束 [14-api-key-injection](docs/14-api-key-injection.md) |
| [`prompt`](https://github.com/playerkousas-rgb/prompt) | **提示站 Prompt Studio**（Next.js，https://prompt-smoky-pi.vercel.app）：欄位 ↔ 卡面區塊 ↔ 提示詞片段三向連動 | Prompt 資產庫；對應 [C9 保護 PROMPT](docs/09-gemini-canvas.md#c9--type-c保護-prompt-設定)、[V5 版號入紀錄](docs/13-versioning.md) |
| [`DRAWSCOUT`](https://github.com/playerkousas-rgb/DRAWSCOUT) ／ [`decode`](https://github.com/playerkousas-rgb/decode) | 出圖 app ／ 水印解碼器（你畀我嘅 `drawscout.html` 就係呢條線） | [W2 隱形水印](docs/12-copyright-scout-system.md) 嘅真實來源；已收錄做 `templates/watermark/drawscout_decoder_v1.0.html` |
| [`GEMINI`](https://github.com/playerkousas-rgb/GEMINI) | Gemini 相關試驗 | 對照 [09 三種結構](docs/09-gemini-canvas.md) |
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
