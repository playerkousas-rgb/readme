# 17 — 最終檢查實測 ＋ STEP BY STEP 用戶教學

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **一句話**：`node scripts/final_check_v1.0.mjs` = 一條命令跑**六角度自動檢查** + 印**人手實測清單**。
> 同一條命令喺真理倉同新 app repo 都用得（自動偵測 mode）。
> 全綠 ≠ 完成，下面 7 條人手實測一定要做（第 7 條嚟自 [19 專案案例](19-ecportal-troop-case.md)：新部署要真機跑一次）。對應要求：寫完 app 要用唔同角度實測一次；教學要短、STEP BY STEP、一般用戶睇得明。

```bash
node scripts/final_check_v1.0.mjs                          # 六角度報告
node scripts/final_check_v1.0.mjs --html myapp_v1.0.html   # 順便審計單一 HTML
node scripts/final_check_v1.0.mjs --json                  # AI agent 用
```

見 `✅ FINAL CHECK PASS — 可以交付` 先繼續；見 `❌` → [§5](#5--常見-fail--點改)。

---

## 1 — 六角度實測對照

| 角度 | 佢關心 | 自動檢查 | 人手要做 |
|------|--------|----------|----------|
| **① Vercel 官方** | build 到、env 唔漏、region 啱 | `vercel.json` 用 `--include=dev`（唔好 `--omit=dev`）、`dist`、`hkg1`；`.env.example` 只有 key 名 | Preview + Production 各開一次；F12 無 error |
| **② Git 官方** | 無 secret、無大檔、CI 會跑 | `.gitignore` 擋 `.env*`／`node_modules`／`dist`；CI workflow 存在 | PR 頁 CI 全綠先 merge |
| **③ 程序員** | code 真係行到 | `guard --ci` + `node --test` 全綠 | 改一行 code 再跑，確認測試捉到 |
| **④ 系統架構師** | 單一真理，冇兩份唔同步 | 部署拷貝 sync **兩次結果一樣**；contract `fileVersion` + 版權；**as-built 4 份案例 + README 引用 + docs/18／19／20** | 新舊檔對一次版號四處一致；新部署真機跑一次 |
| **⑤ AI Agent** | 文件可解析、無矛盾 | 入口檔齊；PLAYBOOK 規則 ID + 5MB 上限齊；**通用規則同 19 專案案例已分離** | 叫 Agent 由頭做 STEP 3–7 |
| **⑥ 一般用戶** | 開到、無 key、版權版號見到 | 所有交付 HTML 審計 → 0 FAIL | `file://`、手機、斷網、解碼器各試一次 |

**FAIL 代表乜**：① 通常係 `--omit=dev` 令 `vite: command not found`（[06](06-vercel.md#vl8--部署衛生s8)）；② 會洩漏 secret，優先修；③ 睇 guard 輸出最後一行；④ 有人直接改咗部署拷貝（[V4](13-versioning.md#v4--部署拷貝例外type-c-gas)）；⑤ AI 會跟錯文件（[F16](02-foolproof.md#f16--三處同步-checklist最常出事)）；⑥ 最常見，跑 `audit_single_html_v1.0.mjs <檔名>` 睇逐項。

---

## 2 — STEP BY STEP（由零到一個 app）

> 每步：**做乜 → 打乜 → 應該見到乜**。Vercel app 例子；單一 HTML app 跳 [§3](#3--捷徑我淨係想檢查一個單一-html)。

**STEP 0 — 定邊界（1 分鐘，多單位系統先需要）**：答三句 —— ① 邊個准改邊層？② 呢個元件嘅「唔做清單」係乜？③ 新功能入咗功能 registry 未？
呢三句係**可選做法**，具體案例喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用底線**）；[PLAYBOOK §8.1](../PLAYBOOK.md) 係案例隔離指針。

**STEP 1 — 揀類型（30 秒）**：工具（無資料）→ 只要 S/A/W/V；App（有資料）→ 全套 + 設定層 + 備份；**系統**（多單位／有身份）→ 再加**設定層 + 隱藏超管 + registry + 審計鏈**。你講「系統」= 自動第三類。

**STEP 2 — 抄模板（1 分鐘）**

```bash
APP=../my-new-app && mkdir -p "$APP"/{.github/workflows,api,scripts}
cp templates/vercel/{vercel.json,package.json}  "$APP/"
cp templates/vercel/env.example                 "$APP/.env.example"    # 要加點
cp templates/vercel/vercelignore                "$APP/.vercelignore"
cp templates/vercel/api/*.mjs                   "$APP/api/"
cp templates/git/gitignore                      "$APP/.gitignore"
cp templates/github/guard.yml                   "$APP/.github/workflows/"
cp templates/github/dependabot.yml              "$APP/.github/dependabot.yml"
cp scripts/guard.mjs                            "$APP/scripts/guard.mjs"  # 一定要抄
cp scripts/{final_check_v1.0.mjs,audit_single_html_v1.0.mjs} "$APP/scripts/"
printf '# My App\n' > "$APP/README.md" && cd "$APP"
```

✅ `ls -a` 有 `.env.example`、`.gitignore`、`.vercelignore`、`vercel.json`、`api/`、`scripts/guard.mjs`。
⚠️ 三個最易錯：`.env.example` 要加點；`guard.mjs` 要抄；`dependabot.yml` 放 `.github/` 唔係 `workflows/`。

**STEP 3 — 填設定（2 分鐘）**：`cp .env.example .env.local` → 喺本機填真值，**Vercel Dashboard → Environment Variables** 再填一次。`.env.example` 永遠只寫 key 名；前端可見先用 `VITE_`／`NEXT_PUBLIC_` 前綴。

**STEP 4 — 第一次防呆（30 秒）**：`node scripts/guard.mjs` → 見 `✅ GUARD PASS`。紅就照 `✗` 嗰行改，**未綠唔好寫功能**。

**STEP 5 — 寫功能（次序唔好調轉）**：`getConfig + fail closed` → `/api/proxy`（verifySession → 白名單 → inject secret）→ session／原子寫入／限流／消毒 → AUDIT_LOG + 超管 → 先至做功能 → 備份／診斷／回滾。詳情 [PLAYBOOK §9](../PLAYBOOK.md#9-施工次序唔好調轉)。

**STEP 6 — 有單一 HTML 就審計**：`node scripts/audit_single_html_v1.0.mjs myapp_v1.0.html` → `✅ AUDIT PASS — 0 FAIL`。要改：檔名 `_vX.Y`、內文四處版號、兩個 meta、key 唔好落 `?key=`。**5MB 係上限唔係目標 —— 越輕量 load 越快**；減無用 base64／外置大圖係建議優化，唔係 CI fail 條件。

**STEP 7 — 最終實測**：`node scripts/final_check_v1.0.mjs` → 六角度全 `✅` + `✅ FINAL CHECK PASS`。報告尾印 7 條人手實測。
同一條命令喺**真理倉**（`truth-repo` mode）同**新 app repo**（`app-repo` mode）都用得，冇嘅元件會自動跳過，唔會誤判 FAIL。

**STEP 8 — 人手實測（10 分鐘，唔好跳）**

1. `file://` 開一次 + 部署 URL 開一次 → 頁尾 `© SCOUT SYSTEM` + 版號。
2. 手機開一次 → 版面／撳鈕／上載圖正常。
3. **斷網**開一次 → 零 key 路徑仍然用到。
4. 成品圖放入 `drawscout_decoder_v1.0.html` → 讀到水印 payload。
5. F12 Console → 無 error、無 `AIza...`、無 `?key=`。
6. 清 cache 再開 → 唔係舊版。

**STEP 9 — Commit / PR / CI**

```bash
git add -A && git commit -m "feat(app): 第一版"
git push -u origin feat/my-app && gh pr create --fill
```

✅ PR 頁 CI 全綠。紅就返 STEP 4。

**STEP 10 — Deploy 驗收**：Production branch = `main` only；非 main 關 Preview；retention 7 日。部署後喺**真 URL** 再做一次 STEP 8 第 1、5 點；回滾指令（上一個 deployment URL）寫入 PR。

---

## 3 — 捷徑：我淨係想檢查一個單一 HTML

```bash
mv "code_artifact.html" myapp_v1.0.html          # ① 檔名要有版號
# ② 內文四處改 v1.0：meta app-version / meta copyright / title / APP_VERSION / footer
node scripts/audit_single_html_v1.0.mjs myapp_v1.0.html
node scripts/final_check_v1.0.mjs --html myapp_v1.0.html
```

兩個都 `PASS` 就交得。真實例子（5 FAIL → 0 FAIL）→ [16 §5](16-canvas-case-scout-comic.md#5--升級路線由-v421-去-v430)。

---

## 4 — 最終人手實測（7 條，機器代唔到）

`final_check` 會印出嚟，呢度係完整版：

1. 一般用戶：`index.html`（`file://`）同部署 URL 各開一次，睇頁尾版權 + 版號。
2. 一般用戶：手機開一次；clear cache 再開一次。
3. 一般用戶：斷網開一次（零 key 路徑應該仍然用到）。
4. 一般用戶：成品圖放入解碼器，應該讀到水印 payload。
5. Vercel：Preview + Production 各開一次；F12 Console 無 error。
6. Git：PR 頁 CI 全綠先 merge；merge 後睇 deployment log。
7. 系統架構師（[19 案例教訓](19-ecportal-troop-case.md)，**本地回歸綠唔算完成**）：新部署真機跑一次 —— GAS 302 轉址、Drive 權限、Script Properties 配額、`onOpen` 選單授權、中央登入回打驗票，逐項喺真 URL／真 Sheet 試。

---

## 5 — 常見 FAIL → 點改

| 見到 | 原因 | 一分鐘修法 |
|------|------|-----------|
| `vite: command not found` | `installCommand` 用咗 `--omit=dev` | 改 `npm install --include=dev`（[06](06-vercel.md#vl8--部署衛生s8)） |
| `App repo 缺檔：.env.example` | 抄咗做 `env.example`（無點） | `mv env.example .env.example` |
| `A1：.env.local 有實際值` | 舊 guard 誤判（已修） | 升級 guard；`.gitignore` 有 `.env` 就 OK |
| `W2：缺解碼器` | 舊 guard 對無出圖 app 都要求水印（已修） | 升級 guard；出圖 app 先至需要 |
| `S10：大檔 > 1MB` | 單一 HTML 被當普通檔（已修） | 升級 guard；HTML 上限 5MB（C13-g） |
| `V1：檔名同內文版號唔一致` | 改咗內文冇改檔名 | 兩邊一齊改（[13](13-versioning.md)） |
| `W1：無 copyright meta` | 只有頁尾無 meta | 加 `<meta name="copyright" content="© SCOUT SYSTEM">` |
| `A1/W6：?key=` | BYOK key 落咗 URL | 改 `x-goog-api-key` header（[14](14-api-key-injection.md)） |
| `G10：壞連結／壞錨點` | 改咗標題冇改連結 | 跑 guard 睇邊條 |

---

## 6 — 文件點讀（唔使讀晒）

| 你得… | 讀 |
|-------|-----|
| **5 分鐘** | [00-quickcard](00-quickcard.md) + 本檔 §2 |
| **20 分鐘** | [README](../README.md) + [PLAYBOOK](../PLAYBOOK.md) |
| 撞到問題 | README §1 導覽 → 對應 `docs/` |
| 想知原檔有乜我漏咗 | [18 對照審計](18-as-built-gap-audit.md) |
| 睇旅團專案設定（唔係通用） | [19 專案案例](19-ecportal-troop-case.md) |
| 邊個 repo 有問題／API 同 PROMPT 留唔留 | [20 repo 健康審計](20-repo-health-audit.md) |
| 實際點修 | [21 修復方案](21-fix-plans.md) |
| 改規則 | PLAYBOOK + 對應 doc + `guard.mjs` + `templates/`（[F16](02-foolproof.md#f16--三處同步-checklist最常出事)） |
| AI Agent | `AGENTS.md` 頭 12 行 → README → PLAYBOOK → `final_check --json` |

> 原則：**入口要短、細節要搵到、規則只有一份真理**。同一件事兩份文件講法唔同 = bug，即刻改。
