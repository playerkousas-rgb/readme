# 20 — Repo 健康審計：API／PROMPT 留唔留？邊個 GIT 有大問題？

> 日期 **2026-10-27**。檢查方法：`gh api` metadata + recursive tree、**shallow clone 11 個 repo 去 `/tmp` 實際睇碼**、
> secret pattern scan（current tree）、`git log -S` 查歷史私鑰、`npm audit --package-lock-only`、逐個 workflow 睇。
> **只係審計，冇改過你任何一個 repo、冇 commit／push。**
> 相關：[15 資源索引](15-resource-index.md)（查找入口）、[19 旅團案例](19-ecportal-troop-case.md)（專案嘢）、[18 對照審計](18-as-built-gap-audit.md)。
> **➡️ 點修（已實測）：[21 修復方案](21-fix-plans.md)**；想交畀 `scout-circulars` AGENT 做 → [22 handoff](22-scout-circulars-agent-handoff.md)。 —— prompt 升級指令、scout-circulars 保留 JSON 嘅 workflow 改法、兩個 badge repo 嘅零停機雙軌修法。

---

## 0. 先答你兩條問題

**①「你已經查找完並寫入好東西了對吧？」— 係，已完成。**
- 逐行讀完 4 份原檔（596 行），寫咗 [18 對照審計](18-as-built-gap-audit.md)：我漏咗乜、佢哋有乜好系統。
- 由案例抽出嘅教訓 + 你嘅指示，已搬去 [19 專案案例](19-ecportal-troop-case.md)（**同通用規則分開**）。
- guard 加咗 `checkAsBuilt()`（[18](18-as-built-gap-audit.md)）、final_check 六角度加 as-built 留存 + MANUAL 第 7 條、docs/15 加五 repo 索引。
- 今次再實際查咗 **11 個 repo** 嘅碼（唔只係 README），下面係結果。

**②「API 同 PROMPT 兩個 GIT 要保留嗎？」— 兩個都保留，但 `prompt` 要即刻修。**
- [`api`](https://github.com/playerkousas-rgb/api)：**保留**。佢係香港免費 API 嘅**唯一真理**（`data/apis.csv` 254 條／40 類）。
  我哋 `docs/15` 由佢自動生表，符合 F1 單一真理 —— **千祈唔好將 CSV 抄入 `readme`**（會 drift）。只需補基本衛生（§3）。
- [`prompt`](https://github.com/playerkousas-rgb/prompt)／Prompt Studio：**保留**。佢係你嘅 prompt 工作台＋ Pollinations 免 key 出圖路線，亦係 [14 API KEY 注入](14-api-key-injection.md) 嘅真實例子。
  但佢係 **11 個 repo 入面唯一有 critical 漏洞**嘅（§2），保留 ≠ 唔使修。

---

## 1. 11 個 repo 一張總表（2026-10-27 實測）

| Repo | GitHub size | 最後 push | CI workflow | 測試檔 | 明顯 secret | `npm audit` | 判決 |
|------|------------:|-----------|------------:|-------:|------------|-------------|------|
| `api` | 73 KB | 2026-09-29 | 0 | 0 | 無 | 無 lock | ✅ 留（要補衛生） |
| `prompt` | 2.0 MB | 2026-10-07 | 0 | 0 | 無 | **1 critical / 1 high / 1 moderate** | ⚠️ **留但要即刻升級** |
| `DRAWSCOUT` | 517 KB | 2026-10-08 | 0 | 0 | 無 | 無 lock | ✅ 留（小問題） |
| `decode` | 73 KB | 2026-10-07 | 0 | 3 | 無 | 無 lock | ✅ 留 |
| `GEMINI` | 174 KB | 2026-10-23 | 0 | 4 | 無 | 0 | ✅ 留（1 個 docs PR 未 merge） |
| `vsbadge` | 5.1 MB | 2026-10-24 | 0 | 11 | 無 | 0 | ✅ 留（無 CI） |
| `roverbadge` | 3.0 MB | 2026-10-24 | 0 | 30 | 無 | 0 | ✅ 留（無 CI） |
| `cubsbadge` | 7.1 MB | 2026-10-25 | 0 | 12 | 測試假值 | 無 lock | ⚠️ 舊 sig 路徑仍在 |
| `scoutbadge` | 8.6 MB | 2026-10-24 | 0 | 16 | 測試假值 | 無 lock | ⚠️ 舊 sig 路徑仍在 |
| `scout-circulars` | **158 MB** | 2026-10-26 | **11** | 46 | 只係 placeholder／anon key | 無 lock | 🔴 **結構性問題最大** |
| `readme`（呢個） | ~0.6 MB（本機） | — | 1 | 40 | 無 | 無 lock | ✅ 18/18 guard 綠 |

> **secret scan 結論**：11 個 repo 嘅**現況檔案都冇真 key**。搵到嘅 `SUPER_KEY='cubpreview2026'`／`'test-super-key-42'` 等全部喺測試／devserver；
> `scout-circulars` 個 `-----BEGIN … PRIVATE KEY-----` 係 `.env.example`／`PUSH_SETUP.md`／`notify.py` 嘅 **placeholder 或註解**（`git log -S` 查過歷史，得 2 個 commit 加過，兩個都係 `replace-with-private-pem`）；
> `appstore.json` 個 JWT decode 出嚟 `role=anon`（Supabase 公開 key，靠 RLS，可以 commit）。**呢部分算乾淨。**
>
> **未能驗證**：branch protection —— `gh api .../branches/main/protection` 返 `403 Resource not accessible by integration`（token 無權讀），所以**唔可以話「全部無保護」**，要你喺 GitHub Settings 自己睇。

---

## 2. 🔴 最大問題 #1：`prompt` — 公開網站行緊有 critical RCE  advisory 嘅 Next.js

**證據**
- `package.json` `next: ^14.2.15`；`package-lock.json` 實裝 **`14.2.15`**（2024 年尾版本，兩年無升級）。
- `npm audit --package-lock-only` → **critical 1 / high 1 / moderate 1 / total 3**。
- `next` 身上嘅 advisory 包括（節錄）：
  - `GHSA-f82v-jwr5-mffw` **Authorization Bypass in Next.js Middleware**（critical，`>=14.0.0 <14.2.25`）
  - `GHSA-p293-qw3h-jr36` Unauthenticated RCE（windows-hosted servers，critical）
  - `GHSA-2xp9-vwfh-vxw4` RCE in Image Optimization API when **AVIF** files used（critical，範圍 `>=10.0.0 <15.5.24`）
  - `GHSA-2464-fhr4-w9xw` RCE in Image Optimization API when **SVG** used（critical）
  - 另有多個 high：Server Components DoS、HTTP request deserialization DoS、SSRF、cache poisoning、HTTP request smuggling。
  - `postcss` high（sourceMappingURL 任意讀檔）、`postcss-selector-parser` moderate。
- `npm audit` 建議修復要 **`next@16.4.3`（major upgrade）**。
- **實際可利用性（要老實講）**：呢個 repo **無 `middleware.*`、無 `'use server'`**，`next.config.js` 係 `images: { unoptimized: true }` → middleware bypass 同 Image Optimization RCE 大概率唔中；
  但 Server Components DoS／cache poisoning／request smuggling 等 high 仍然適用，而且個站係公開（`https://prompt-smoky-pi.vercel.app`）。
- **加劇因素**：**0 個 CI workflow、0 個測試檔、0 個 Dependabot** → `npm audit` 永遠唔會自動跑；冇人會知有漏洞。
- 其他衛生：`.gitignore` 只有 `.env` 同 `.env*.local`，**漏咗 `.env.production`／`.env.development`**（Next.js 常用，有機會誤 commit 真 key）；頂層有 `legacy/`（3 個舊 HTML，64KB）同 `readme`（19 bytes 空檔）死重；**無 LICENSE**。

**結論**：`prompt` 係**安全優先級最高**嘅一個。保留，但要排第一修。

---

## 3. 🔴 最大問題 #2：`scout-circulars` — 將「每日數據」commit 入 Git，倉庫膨脹到 158MB

**證據**
- GitHub API `size = 161,741 KB ≈ 158 MiB`；`git fetch --unshallow` 後 pack **40.64 MiB**；**615 個 commit**。
- 目前 working tree 26.5 MiB / **399 個檔**；`icons/` 一個目錄 **230 個檔**，9 個檔 > 500KB（最大 `icons/orgs/src/islands-離島區.jpg` **3.5MB**，其餘多張 ~1MB JPG 未轉 AVIF）。
- `cache.json` **3.6MB**、`enrich.json` **2.0MB**，`git log -- cache.json` = **269 次**、`-- enrich.json` = **156 次**。
- **615 個 commit 入面約 266 個（43%）係 bot commit**（`🤖 Auto-update circulars [skip ci]`／`📊 Update subscription stats`／`📲 Instagram Story assets`…）。
- 11 個 workflow 入面，`scrape.yml`／`scrape-appstore.yml` 每日 cron `15 16 * * *` 做 `git add cache.json enrich.json fingerprints.json && git commit && git push`；
  `story-draft.yml` 每日 `0 4 * * *` commit 生成圖；`notify.yml`／`org-icons.yml`／`story-queue.yml`／`update-appstore-snapshot.yml` 都會自動 push。
- **好嘅一面（唔好抹殺）**：佢有 `vercel-bundle-guard.yml`／`vercel-prune.yml`／`vercel-retention.yml`，Vercel 體積衛生做得比其他 10 個 repo 都好；
  `.env.example` 清楚寫明 VAPID 私鑰只放 GitHub Actions Secret、唔好放 Vercel／前端；`PUSH_SETUP.md` 有完整 rotation 指引。
- **問題本質**：Git 用嚟做**每日爬蟲資料儲存**。呢啲係可再生數據，應該去 Supabase／R2／Artifact／Release asset，唔應該入 git history（一次入咗就好難清，要 `git filter-repo` + force push + 全部 clone 重整）。

**結論**：`scout-circulars` 係**結構／體積問題最大**嘅一個（但安全上反而算乾淨）。對應我哋 [S 瘦身](01-slim.md) 同 [G 唔 commit 大檔](05-git.md)。

---

## 4. ⚠️ 其餘值得知嘅問題（按優先級）

| 優先 | Repo | 問題 | 證據 |
|------|------|------|------|
| 中（**可推遲**） | `cubsbadge`／`scoutbadge` | **兩套 sig 並存，舊嗰套可重放（只喺三層樹狀接入模式先中）** | 兩個 repo 已经有 `verifyLinkSig` + `LINK_SIG_WINDOW_MS`（±5min + nonce，部分對齊 VS／RS），但**舊路徑仍然 callable**：`cubsbadge` `action==='ecSigLogin'` → `ecSigLogin()` 用 `childId\|sub\|role\|children\|target\|exp\|jti` + `EC_SIG_MAX_TTL=30*60`，**冇 nonce／冇 ts**；`scoutbadge` `verifyPortalSig()` 用 `childId\|sub\|scope\|exp`，同樣得 TTL。即係舊登入飛喺 30–60 分鐘內可以重放。**但呢個係「旅→團→進度」三層接入先會出現嘅路徑；單位獨立使用時冇上游簽 sig，實際攻擊面不存在** → 用戶可以繼續獨立用、之後先一併接入。對應 [19 §6.1](19-ecportal-troop-case.md) 同 [21 §3.5](21-fix-plans.md)。 |
| 中 | 10/11 個 repo | **有測試但冇 CI** | `vsbadge`(11)／`roverbadge`(30)／`cubsbadge`(12)／`scoutbadge`(16) 測試檔全部存在，但 `.github/workflows` = **0** → 測試只會喺人手 `npm test` 時跑；`GEMINI`(4)／`decode`(3) 同理。只有 `scout-circulars` 有 CI。 |
| 中 | `prompt` | 見 §2 | critical advisories + 無 CI + `.gitignore` 漏 `.env.production` |
| 低 | `api` | 無 `.gitignore`、無 CI、無 LICENSE、`verified=2026-09-29` 已一個月 | 30 個檔／0.1 MiB 純 docs + CSV；`docs/15` 靠佢生表，建議季度重驗 API 可用性（香港免費 API 好易失效）。 |
| 低 | `DRAWSCOUT` | 無 README、無 CI、無測試 | 22 個檔／0.5 MiB 簡單 app；唔係大問題，但同 [W2 水印](12-copyright-scout-system.md) 相關，值得加返份 README。 |
| 低 | `GEMINI` | 1 個未 merge PR **#8**（純 docs：記錄 migration 005 已執行） | `npm audit` = 0，`.env.example` 有寫明「only anon key, NEVER service_role」。只係積住一個 PR。 |
| 低 | 全部 11 個 | **無 LICENSE 檔** | `gh api` `license: none`；public repo 預設「版權保留」，別人唔知可唔可以用。唔係技術問題，但你做開源資源庫（`api`／`prompts`）時要決定。 |

---

## 5. 建議行動（按先後，全部係建議；我未動你嘅 repo）

**P0 — 今日做（`prompt`）**
```bash
cd prompt
npm audit                       # 確認 1 critical / 1 high / 1 moderate
# 升級 Next（major，要睇 breaking changes；最少升到 audit 建議嘅 16.4.3）
npm install next@16.4.3
npm audit                       # 要見 0
npm run build                   # 確認 build 過到
```
另外：`.gitignore` 加 `.env*`（保留 `.env.example` 例外）、**加一個 `.github/workflows/ci.yml`** 跑 `npm ci && npm audit --audit-level=high && npm run build`、加 Dependabot、清 `legacy/` 同 `readme`、補 LICENSE。

**P1 — 今個星期（`scout-circulars`）**
1. 停止將 `cache.json`／`enrich.json`／`fingerprints.json`／每日 story 圖 commit 入 Git；改去 Supabase table／R2／GitHub Actions artifact（保留最新一份就得）。
2. `icons/orgs/src/*.jpg` 轉 AVIF/WebP（單檔 <500KB），已生成嘅 `icons/` derived 檔考慮由 build step 產生而唔入庫。
3. 歷史清理先**唔好急住做**：要 `git filter-repo` + force push + 通知所有 clone 過嘅人；先停止每日寫入，等新 history 唔再膨脹，再揀時間做大手術。

**P2 — 跟手做**
- `cubsbadge`／`scoutbadge`：將 `ecSigLogin`／`verifyPortalSig` 舊路徑加 nonce + ts（照 [19 §5](19-ecportal-troop-case.md) 嘅雙通道做法），或直接停用舊 action，只留 `verifyLinkSig`。
- 四個 badge repo + `GEMINI` + `decode`：各加一條 CI 跑現成測試（`node --test`／`npm test`），唔使改碼。
- `api`：加 `.gitignore`（最少 `.env*`）+ 一個季度重驗 workflow（probe CSV 啲 URL，標 `hk_status`）；補 LICENSE。
- 全部 repo：揀一個 LICENSE（例如 MIT／CC-BY 畀 `api` 數據），並喺 GitHub Settings 開 main branch protection（我呢邊 token 無權讀，要你手動確認）。

---

## 6. 一句話總結

**`api` 同 `prompt` 兩個都要留** —— 佢哋係你生態系嘅兩個真理源（API 目錄／Prompt 工作台），`docs/15` 只放入口唔複製內容係啱嘅。
但要老實講：**`prompt` 有 critical 漏洞（舊 Next.js + 零 CI），係最急；`scout-circulars` 158MB／615 commits／每日 commit 數據，係最脹。**
其餘 9 個 repo 安全性算乾淨（無真 key 外洩），主要問題係「有測試冇 CI」同兩條舊 `sig` 重放窗口。全部證據喺上面，我冇改過任何一個 repo。
