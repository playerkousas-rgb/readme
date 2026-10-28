# templates/ — 可抄嘅嘢

> **唔好直接喺呢度改嚟用**，抄去新 app repo 再改。呢度嘅檔係「唯一真理範本」，改動要同步 [PLAYBOOK.md](../PLAYBOOK.md) + `docs/` + `scripts/guard.mjs`（F16）。

## 對照表

| 想要 | 抄 | 去邊 |
|------|-----|------|
| Git ignore | `git/gitignore` | 新 repo `.gitignore`（**記得改返個點**） |
| Vercel 設定 | `vercel/vercel.json` | repo 根 `vercel.json`（已含 `/icons/*` immutable 標頭，**G11**） |
| Vercel 上傳黑名單 | `vercel/vercelignore` | repo 根 `.vercelignore` |
| 極簡 package | `vercel/package.json` | repo 根 `package.json` |
| **🖼️ 站台圖標規範** | [README §9 G11](../README.md#9-g11-全站圖標標準iconfavicon) | 9 個 PNG／ICO + `<head>` 5 link ＋ 4 meta（唔係抄檔，係照規格出圖） |
| env 清單 | `vercel/env.example` | repo 根 `.env.example` + 本機 `.env.local` |
| `/api/proxy` 骨架 | `vercel/api/proxy.mjs` | `api/proxy.mjs` |
| `/api/super` 骨架 | `vercel/api/super.mjs` | `api/super.mjs` |
| GitHub 檢查 | `github/guard.yml` | `.github/workflows/guard.yml` |
| Dependabot | `github/dependabot.yml` | `.github/dependabot.yml` |
| GAS 設定 / auth 骨架 | `gas/Config.gs` | Apps Script `Config.gs`（同 `Code.gs` 一齊貼） |
| GAS manifest | `gas/appsscript.json` | Apps Script `appsscript.json`（顯示隱藏檔案） |
| RLS 範本 | `supabase/rls.sql` | `supabase/migrations/<ts>_rls.sql` |
| 推送訂閱表 | `supabase/push_subscriptions.sql` | `supabase/migrations/<ts>_push.sql` |
| **🧠 Canvas 腦源檔** | `canvas/brain_v1.0.gs` | Git 唯一真理；sync → `Code.gs` 貼入 Apps Script |
| **🎨 Canvas 殼源檔** | `canvas/shell_v1.0.html` | Git 唯一真理；sync → `index.html`（GAS HTML file） |
| Canvas 部署拷貝 | `canvas/Code.gs` + `canvas/index.html` | GENERATED，唔好直接改 |
| Canvas sync 腳本 | `canvas/sync_canvas_v1.0.mjs` | 產生部署拷貝 + 驗版號（V4） |
| **🔍 水印解碼器** | `watermark/drawscout_decoder_v1.0.html` | 直接開，驗成品圖（W3） |
| **🧬 水印 codec** | `watermark/scout_watermark_codec_v1.0.mjs` | `embed()` / `decode()` 唯一真理（W2） |
| **🖼️ Type B 生成器** | `watermark/scout_generator_v1.0.html` | 上圖 → 嵌水印 → 下載 |
| **🔑 KEY 注入器** | `watermark/inject_key_v1.0.mjs` | 本機注入 placeholder（W6 / docs/14） |
| 水印測試 | `watermark/watermark.test.mjs` | 10 條（W/V，含真實 app legacy embed 互通） |
| **🧪 單一 HTML 審計器** | `../scripts/audit_single_html_v1.0.mjs` | 交付前 S/F/A/W/V/C 靜態審計（C13-f） |
| 資源索引更新器 | `../scripts/refresh_resources_v1.0.mjs` | 由 `api/data/apis.csv` 更新 `docs/15` |
| Canvas action 合約 | `canvas/contract_v1.0.json` | Git `contract_v1.0.json` |
| Canvas prompt 規格 | `canvas/PROMPT_v1.0.md` | Git（**唔好貼入 Gemini 對話**） |
| Canvas 紀錄 schema | `canvas/RECORDS_v1.0.md` | Git + Sheet `RECORDS` |
| Canvas 守護測試 | `canvas/brain.test.mjs` | Git（`node --test brain.test.mjs`） |
| Canvas prompts | `canvas/PROMPTS_v1.0.md` | 7 條，貼去 Gemini Canvas |
| Canvas 目錄說明 | `canvas/README.md` | 三步起機 + 鐵則 |

完整目錄：[templates/canvas/](canvas/README.md) · 規格：[docs/09-gemini-canvas.md](../docs/09-gemini-canvas.md)

## 一鍵抄（Vercel app 例子）

```bash
APP=../my-new-app && mkdir -p "$APP"/{.github/workflows,api,docs,scripts,supabase/migrations}
cp templates/git/gitignore            "$APP/.gitignore"
cp templates/vercel/vercel.json       "$APP/vercel.json"
cp templates/vercel/vercelignore      "$APP/.vercelignore"
cp templates/vercel/package.json      "$APP/package.json"
cp templates/vercel/env.example       "$APP/.env.example"
cp templates/vercel/api/*.mjs         "$APP/api/"
cp templates/github/guard.yml         "$APP/.github/workflows/guard.yml"
cp templates/github/dependabot.yml    "$APP/.github/dependabot.yml"
cp ../readme/scripts/guard.mjs        "$APP/scripts/guard.mjs"
cp ../readme/scripts/{audit_single_html_v1.0.mjs,final_check_v1.0.mjs} "$APP/scripts/"
cd "$APP" && node scripts/guard.mjs
```

## 一鍵抄（Gemini Type B/C app 例子）

```bash
# Type C：腦殼分離
APP=../my-gemini-app && mkdir -p "$APP"/{.github/workflows,docs,scripts}
cp templates/canvas/brain_v1.0.gs            "$APP/brain_v1.0.gs"
cp templates/canvas/shell_v1.0.html          "$APP/shell_v1.0.html"
cp templates/canvas/sync_canvas_v1.0.mjs     "$APP/sync_canvas_v1.0.mjs"
cp templates/canvas/contract_v1.0.json       "$APP/contract_v1.0.json"
cp templates/canvas/PROMPT_v1.0.md           "$APP/PROMPT_v1.0.md"
cp templates/canvas/RECORDS_v1.0.md          "$APP/RECORDS_v1.0.md"
cp templates/canvas/PROMPTS_v1.0.md          "$APP/PROMPTS_v1.0.md"
cp templates/canvas/brain.test.mjs           "$APP/brain.test.mjs"

# Type B：隱形水印（可以同 C 一齊用）
cp templates/watermark/scout_watermark_codec_v1.0.mjs "$APP/"
cp templates/watermark/drawscout_decoder_v1.0.html    "$APP/"
cp templates/watermark/scout_generator_v1.0.html      "$APP/"
cp templates/watermark/inject_key_v1.0.mjs            "$APP/"
cp templates/watermark/watermark.test.mjs             "$APP/"

cp templates/git/gitignore                    "$APP/.gitignore"
cp templates/github/guard.yml                 "$APP/.github/workflows/guard.yml"
cp ../readme/scripts/guard.mjs                "$APP/scripts/guard.mjs"
cp ../readme/scripts/{audit_single_html_v1.0.mjs,final_check_v1.0.mjs}  "$APP/scripts/"
cd "$APP" && node sync_canvas_v1.0.mjs && node --test && node scripts/guard.mjs
```

> ⚠️ 上面啲骨架係**教學用起點**，唔係生產完成品：
> - `api/super.mjs` 要補真正 nonce store（Vercel KV / Upstash）+ 告警。
> - `Code.gs` 嘅 `USER_ROLES`（email → role）只係示範：匿名 Web App 嘅 `Session.getActiveUser().getEmail()` 通常係空白，正式要用邀請 ticket／`sig` scope／中央登入驗票（見 [docs/09 C7](../docs/09-gemini-canvas.md#c8--type-ccodegs-唯一入口--indexhtml-殼)）。
> - Gemini 例子要預先開 `RECORDS` Sheet 並寫 header（見 [canvas/RECORDS_v1.0.md](canvas/RECORDS_v1.0.md)）。

## 結構揀選

- **A 全開放**（單一 HTML 工具）：一個 `tool_v1.0.html`，守 [C2](../docs/09-gemini-canvas.md#c2--type-a全開放一個-html)（無 prompt／key／重要紀錄）+ W1 版權 + V1 雙版號。
- **B 隱藏水印**（出圖）：單一 HTML + codec + 解碼器 + KEY 注入位（[templates/watermark](watermark/README.md)）。
- **C 腦殼分離**（有原圖／成品圖／使用紀錄 + PROMPT 保護）：`brain_v1.0.gs` + `shell_v1.0.html` + 部署拷貝 + 合約 + PROMPT + RECORDS + 測試（[templates/canvas](canvas/README.md)）。
- 三種都要守通用 S/F/A/W/V；B/C 可以疊（成品圖一樣落水印）。

對應文件：[09-gemini-canvas.md](../docs/09-gemini-canvas.md) · [14 API KEY 注入](../docs/14-api-key-injection.md) · [15 資源索引](../docs/15-resource-index.md) · [16 實戰案例](../docs/16-canvas-case-scout-comic.md)。
