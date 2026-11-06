# `docs/` 分章索引 — 邊份管邊樣

> **呢個 repo 嘅唯一入口仍然係 [根 README](../README.md)**；本頁只做 `docs/` 嘅分章分類，等 00–38 唔使再靠估。
> 整理日期：2026-11-06 · 規則衝突時以 [PLAYBOOK](../PLAYBOOK.md) 為準 · 案例已隔離去 [19](19-ecportal-troop-case.md)，**唔係通用底線**。

## 點用

| 你得… | 去 |
|---|---|
| 5 分鐘知規矩 | [00](00-quickcard.md) → [17 §2](17-final-check-and-tutorial.md) |
| 開新 app | [10](10-checklists.md) → [templates](../templates/README.md) |
| 搵「規則 ID 邊份」 | 下面 **章 1–2** |
| 搵「我 Git 有乜可以重用」 | 下面 **章 6** |
| 交付前 | `node scripts/guard.mjs` + `node scripts/final_check_v1.0.mjs --json` |

---

## 章 0 — 總綱同入口（所有 Agent 先讀）

| 檔 | 管乜 |
|---|---|
| [根 README](../README.md) | 唯一入口、五大鐵律一句版、導覽表 |
| [AGENTS.md](../AGENTS.md) | Agent 級別／施工邊界／開工順序 |
| [PLAYBOOK.md](../PLAYBOOK.md) | 核心規範總綱、規則 ID 總表、P1 |
| [BUILD.md](../BUILD.md) · [EXTERNAL.md](../EXTERNAL.md) | **ecportal as-built 案例**、外部系統零特權（唔當通用規則） |
| [進度追蹤旅系統升級版.md](../進度追蹤旅系統升級版.md) | 進度 leaf 專案說明 |
| [00-quickcard.md](00-quickcard.md) | 一頁紙速查 |

## 章 1 — 五大通用鐵律（S / F / A / W / V）

| 檔 | 規則 |
|---|---|
| [01-slim.md](01-slim.md) | S 瘦身（5MB／2MB、C13-g 例外） |
| [02-foolproof.md](02-foolproof.md) | F 防呆（fail closed、白名單、冪等、dry-run） |
| [03-security.md](03-security.md) | A 安全 + A12 私隱 PDPO |
| [04-settings-super.md](04-settings-super.md) | 系統級：設定層 + 隱藏超管 |
| [12-copyright-scout-system.md](12-copyright-scout-system.md) | W 版權三軌、W6 key、W8 第三方來源 |
| [13-versioning.md](13-versioning.md) | V 雙版號 |

## 章 2 — 技術棧契約

| 檔 | 棧 |
|---|---|
| [05-git.md](05-git.md) | Git |
| [06-vercel.md](06-vercel.md) | VL1–VL12、`/api/proxy`、VL7 rate limit |
| [07-apps-script.md](07-apps-script.md) | Google Apps Script |
| [08-supabase.md](08-supabase.md) | U 系列、U9 每日 scrape／推送 |
| [09-gemini-canvas.md](09-gemini-canvas.md) | C 系列、A/B/C 三結構、C13 注入 |
| [14-api-key-injection.md](14-api-key-injection.md) | API KEY 注入三軌 |

## 章 3 — 研發前調查 P1 同資源索引

| 檔 | 搵乜 |
|---|---|
| [15-resource-index.md](15-resource-index.md) | API／Prompt／開源庫三層查找（由 `api/data/apis.csv` 產生） |
| [23-design-resources.md](23-design-resources.md) | 字體／配色／Icon／UI library／模板 |
| [24-similar-products.md](24-similar-products.md) | 相近產品比較及來源（P1 起點） |
| [25-reverse-api-reuse.md](25-reverse-api-reuse.md) | 85 個 repo 對 Reverse API 嘅可重用盤點 |
| [26-reverse-api-walkthrough.md](26-reverse-api-walkthrough.md) | 「自製 API」用自己 repo 講清楚 + 可跑 demo |
| [29-reading-map.md](29-reading-map.md) | API 設計／Agent Skills／文件分類嘅閱讀地圖 |
| [34-ai-workflow-tools.md](34-ai-workflow-tools.md) | **第三方 GitHub 開源 AI 工具**：PPT Master／Reverse API Engineer／`grill-me`／VoxCPM2 嘅來源、授權、限制、驗收；本機使用條件／未實測狀態明寫，唔重抄 25／26／INTAKE |
| [35-viral-ai-tools.md](35-viral-ai-tools.md) | **2026-11 爆紅清單核實＋採用**：Motion Prompt／gsap-skills／pstack／HyperFrames／Remotion／Paperclip／MoneyPrinterTurbo／VoiceStudio／Univer／Agent-Reach／Hindsight／Edge0 等 17 個 repo（GitHub API 2026-11-06 快照＋授權陷阱）；已入起手包 `web-motion`＋`external/motion-prompt`；HyperFrames／story-to-handdrawn／Pixel2Motion 有場景先試；其餘暫不採用；未實測狀態明寫 |
| [36-lazy-coding-and-open-alternatives.md](36-lazy-coding-and-open-alternatives.md) | **爆紅清單第三輪核實**：Ponytail（七級梯已改寫做 checklist，讀唔裝）／FreeBuff（數據條款，唔用喺真 repo）／Concept Studio Blender 城市（查無 repo，版權先行）／9 個開源平替逐個判（11 個 repo GitHub API 2026-11-06 快照）；未實測狀態明寫，唔重抄 34／35 |
| [37-ai-tools-design-prompts.md](37-ai-tools-design-prompts.md) | **爆紅清單第四輪核實**：FreeLLMAPI（吸收「睇 API 三樣」讀法；工具只限個人實驗）／Claude SEO（自家公開站上線前有場景先試）／8 個設計畫廊已入 [23 §5.3](23-design-resources.md)／生圖 20 種風格詞彙＋5 條句式（自己重寫、未實測）；新聞同 Radiocast 唔收錄做規範，原因寫明 |
| [38-animation-3d-prediction-tools.md](38-animation-3d-prediction-tools.md) | **爆紅清單第五輪核實＋ repo 形狀普查**：89 個 repo 實測（React 26／Next 9／靜態 HTML 32／shadcn 0，Animate UI 而家零個 repo 跑到）／ApiVault（已入 [15](15-resource-index.md) 做搵 API 第二層）／Qwen3.5-3D-Coder（觀察名單）／SUAPP AIM＋Convertio（端用家）／MiroFish（只當假設產生器）；未實測明寫 |

## 章 4 — 交付、驗收、出事

| 檔 | 幾時睇 |
|---|---|
| [10-checklists.md](10-checklists.md) | 開新 app／每次 commit／Go-No-Go |
| [11-incidents.md](11-incidents.md) | key 外洩、爆 quota、資料唔見 |
| [16-canvas-case-scout-comic.md](16-canvas-case-scout-comic.md) | 真實 Gemini Canvas app 踩過嘅坑 |
| [17-final-check-and-tutorial.md](17-final-check-and-tutorial.md) | 六角度實測 + STEP BY STEP 教學 |
| [scripts/guard.mjs](../scripts/guard.mjs) · [scripts/final_check_v1.0.mjs](../scripts/final_check_v1.0.mjs) | 每次施工前後／交付前一條命令 |

## 章 5 — 專案案例同審計（**已隔離，唔係通用底線**）

| 檔 | 範圍 |
|---|---|
| [18-as-built-gap-audit.md](18-as-built-gap-audit.md) | as-built 對照「我漏咗乜」 |
| [19-ecportal-troop-case.md](19-ecportal-troop-case.md) | 旅團五級階梯、R1–R8 可選模式 |
| [20-repo-health-audit.md](20-repo-health-audit.md) | 11 個 repo 健康檢查（scrape 資料入 git 等） |
| [21-fix-plans.md](21-fix-plans.md) | 實際點修（已喺 `/tmp` clone 實測） |
| [22-scout-circulars-agent-handoff.md](22-scout-circulars-agent-handoff.md) | 可直接貼畀 `scout-circulars` AGENT 嘅問題清單 |

## 章 6 — Repo 治理（2026-11-02 新章）

| 檔 | 管乜 |
|---|---|
| [27-repo-starter.md](27-repo-starter.md) | **每個新 repo 開局必加**嘅 12 樣嘢 + 第 13 項（13a–13c 按形式加／13d PREFLIGHT 必跑）+ 第 14 項（有身份系統）+ 點抄 |
| [28-repo-taxonomy.md](28-repo-taxonomy.md) | 85 個 repo **形式分類**（輕／有後台／Gemini） + 每種形式要守嘅規矩 |
| [29-reading-map.md](29-reading-map.md) | 閱讀地圖（同章 3 共用）：API 設計／Skills／分類法／兩個外國 repo 評審 |
| [30-repo-health-check.md](30-repo-health-check.md) | **每個 repo 點檢查**：L0/L1/L2 三層 + 可跑 script |
| [31-system-basics.md](31-system-basics.md) | **有身份系統**基本功能：帳號生命週期 8 樣（含忘記密碼）＋ ADMIN 回報系統 8 樣（通用） |
| [32-consistency-audit.md](32-consistency-audit.md) | **全倉一致性審計**：3 軸 11 種檢查（9 FAIL → 0 FAIL）＋ **§8 按兩個 GIT 嘅 SKILL 原文逐步對照 + 原生檢查實跑** |
| [templates/repo-starter/docs/system-basics.md](../templates/repo-starter/docs/system-basics.md) | 可抄驗收 tick list（起手包第 14 項，有身份系統先加） |
| [skills/CATALOG.md](../templates/repo-starter/skills/CATALOG.md) | **所有 SKILL.md 嘅唯一目錄**（`repo-setup`／`design-review`／`grilling`）＋ **加新 SKILL 四步**；以後加 skill 一定要入目錄，`check_skills`／`consistency` 會自動驗 |
| [templates/repo-starter/](../templates/repo-starter/START.md) | 起手包（可直接 `cp -r`） |
| [33-icon-standard.md](33-icon-standard.md) | **G11 全站圖標標準**（2026-11-02 由 README §9 抽出）：9 個 PNG／ICO、四種格式否決、maskable 66%、16px 手繪、體積預算、驗收 5 項 |
| [templates/repo-starter/PREFLIGHT.md](../templates/repo-starter/PREFLIGHT.md) | **AGENT 開局 gate**：設定／commit 前一條命令擋住（取代每次 push 嘅 YML） |
| [templates/repo-starter/INTAKE.md](../templates/repo-starter/INTAKE.md) | **第 0 步問卷**：開新 repo 前 AGENT 主動問清楚用戶需求（借 mattpocock `grilling`），唔好靠估 |
| [templates/reverse-api-demo/](../templates/reverse-api-demo/README.md) | 5 分鐘「自製 API」可跑示範 |
| [scripts/preflight_v1.0.mjs](../scripts/preflight_v1.0.mjs) | PREFLIGHT orchestrator：8 個 check 一次過，`--json`／exit 1（零依賴） |
| [scripts/repo_health_v1.0.mjs](../scripts/repo_health_v1.0.mjs) | 單 repo 體檢（JSON／CLI） |
| [scripts/check_skills_v1.0.mjs](../scripts/check_skills_v1.0.mjs) | `SKILL.md` frontmatter 檢查（零依賴） |
| [scripts/consistency_v1.0.mjs](../scripts/consistency_v1.0.mjs) | 全倉一致性審計（Mechanics／Standards／Spec 三軸，`--json`／exit 1） |

---

## 命名同收檔約定

1. `docs/` 一律 `NN-kebab-case.md`，**兩位數前綴**（00–99），章節只可往後加，唔好插中間改號（會壞連結）。
2. 檔頭用 `# NN — 標題`，第二行一句 `>` 講清楚「呢份管乜 + 日期」；正文表格優先、廣東話書面語 OK。
3. **Doc 檔名唔帶版號**：V 雙版號管嘅係交付 HTML／生成檔；改文件靠 Git history + CHANGELOG。
4. 內部連結一律**相對路徑**；`node scripts/guard.mjs` 嘅 G10 會實驗每條連結同錨點，壞連結會 fail。
5. 一個事實只寫一次：案例去 19、通用規則去 PLAYBOOK、`docs/` 只放入口同指針，唔好複製全文。
6. 加新檔四步：① 揀章 → ② 取下一個未用號 → ③ 寫檔 → ④ 更新 **本頁 + 根 README §1 導覽 + `templates/README.md`對照表（如屬模板）**，最後跑 `guard.mjs` 同 `final_check --json`。
