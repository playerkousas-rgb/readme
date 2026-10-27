# 21 — 三個問題嘅實作修復方案（已喺 `/tmp` scratch clone 實測）

> 日期 **2026-10-27**。對應你三條問題：① `prompt` 有咩問題／點解決 ② `scout-circulars` Git 太帳會唔會出事、bot commit 會唔會定期洗 ③ `cubsbadge`／`scoutbadge` 有咩問題（有用戶在用）。
> **全部實測都喺 `/tmp` 嘅 clone 做，冇改過你任何一個 repo、冇 commit／push。**
> 相關：[20 repo 健康審計](20-repo-health-audit.md)、[19 旅團專案案例](19-ecportal-troop-case.md)。

---

## 0. 優先次序一張表

| 優先 | Repo | 一件事 | 停機? | 實測結論 |
|------|------|--------|-------|----------|
| **P0** | `prompt` | 升級 `next` 14.2.15 → **16.4.3** + `npm audit fix` | 分鐘級（deploy 一次） | ✅ build 過、audit **0 漏洞** |
| **P1** | `scout-circulars` | 停止每日 commit 數據入 Git history（**JSON 保留**） | 零（改 workflow） | main 40.8MiB／stories ~115MiB，155.8MiB 總 |
| **P2（可推遲）** | `scoutbadge` | `PORTAL_SIG_MAX_TTL` 3600 → 300 + `postMessage` origin allowlist | 零 | **只喺三層接入時先中；獨立單位可推遲** |
| **P2（可推遲）** | `cubsbadge` | `ecSigLogin` 加 `jti` 一次性消費 + TTL 30min → 5min（或獨立模式直接閂 action） | 零（server 改） | `jti` 已簽但未消費；見 §3.5 |
| **P2** | 11 個 repo | 加 CI + LICENSE + branch protection | 零 | 10/11 個 repo 0 workflow |

---

## 1. `prompt` — 有咩問題？點解決？

### 1.1 問題（兩層）

**第一層：套件版本。** `package.json` 寫 `next: ^14.2.15`，`package-lock.json` 實裝 **14.2.15**（2024 年尾版本）。`npm audit` → **1 critical / 1 high / 1 moderate**。
`next` 身上嘅 advisory 包括 middleware 授權繞過、Image Optimization API 嘅未認證 RCE（AVIF／SVG 触发）、Server Components DoS、cache poisoning、HTTP request smuggling、SSRF 等；`postcss` 有 high（sourceMappingURL 任意讀檔）。

**要老實講嘅可利用性**：呢個 app **無 `middleware.*`、無 `'use server'`**，`next.config.js` 係 `images: { unoptimized: true }` → middleware bypass 同 Image Optimization RCE 大概率唔中；但 DoS／cache poisoning／request smuggling 呢類 high 仍然適用，而且個站係公開嘅。

**第二層（更根本）：冇人幫你睇門口。** `prompt` 有 **0 個 CI workflow、0 個測試檔、0 個 Dependabot**。即係 `npm audit` 永遠唔會自動跑；今次個漏洞擺咗兩年冇人知，下次新版 advisory 出咗一樣唔會知。**升級只醫到今次，加 CI 先醫到下次。**

其他衛生問題：
- `.gitignore` 只有 `.env` 同 `.env*.local` → **漏咗 `.env.production`／`.env.development`**（Next.js 常用，有機會誤 commit 真 key）；成個 repo 亦無 `.env.example`。
- 頂層有 `legacy/`（3 個舊 HTML，64KB）同 `readme`（19 bytes 空檔）死重；無 LICENSE。
- `scripts.lint = "next lint"` —— **Next 16 移除咗 `next lint`**（Next 15 已經 deprecate 並彈互動 prompt）。

### 1.2 版本對照（我實測咗四個版本）

| 版本 | `npm audit` 結果 | 備註 |
|------|------------------|------|
| 14.2.15（現況） | **critical 1 / high 1 / moderate 1** | |
| 14.2.35（14 最新） | **critical 1 / high 1 / moderate 1** | 14.x **補唔到**，因為有啲 advisory 範圍係 `>=13.0.0 <15.5.21`／`<=15.5.27` |
| 15.5.28（15 最新） | critical 0 / **high 1** / moderate 2 | `next lint` 變互動 prompt，CI 會卡住 |
| **16.4.3（最新）** | critical 0 / high 0 / **moderate 1** → `npm audit fix` 後 **0** | ✅ `npm ci` + `npm run build` 實測通過 |

`next@16.4.3` 嘅 `peerDependencies` 接受 `react ^18.2.0`（你係 18.3.1），**React 唔使升級**；`engines.node >= 20.9.0`（我 sandbox Node 22.22.3；Vercel 要設 Node 20.9+／22）。

### 1.3 一條龍指令（實測順序）

```bash
cd prompt
npm install next@16.4.3          # lock 會變 ^16.4.3；React 18.3.1 照用
npm audit fix                    # 實測：0 vulnerabilities（upgrade postcss-selector-parser 6.1.4 → 6.1.5）
npm run build                    # 實測：✓ Compiled successfully · 7 routes（/ /badge /card /gift /api/generate）
npm audit --audit-level=high     # CI 用呢條：要高/critical = 0 先放行
```

`next build` 會**自動改 `tsconfig.json`**（`jsx: react-jsx`、加 `.next/dev/types/**/*.ts`）—— 呢個改動要 commit。

### 1.4 跟手要改嘅 6 樣（唔做就下次再中）

1. **`package.json`**：加 `"engines": { "node": ">=20.9.0" }`；將 `"lint": "next lint"` 改成 `"lint": "eslint ."` 並 `npm i -D eslint eslint-config-next@16.4.3`（或者暫時刪咗 `lint`，CI 用 `audit + build` 已夠）。
2. **`.gitignore`**：加 `.env*` 同 `!.env.example`；補一個 `.env.example` 只寫 key 名、冇值。
3. **加 CI**（下面 §1.5），令 `npm audit --audit-level=high` 每次 push 都跑。
4. **加 Dependabot**：`.github/dependabot.yml`，npm weekly。
5. **清死重**：刪 `legacy/` 同 19-byte `readme`；補 LICENSE。
6. **Vercel Dashboard**：Project Settings → Node.js Version 設 **22.x**（或最少 20.9）；Deploy 後喺真 URL 開一次 `/`、`/badge`、`/card`、`/gift` 同 `/api/generate`。

### 1.5 CI workflow（可直接抄）

```yaml
# .github/workflows/ci.yml
name: ci
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm audit --audit-level=high
      - run: npm run build
```

> 對應通用規則：[A 安全](03-security.md)／[G Git](05-git.md)／[VL Vercel](06-vercel.md)／[17 最終實測](17-final-check-and-tutorial.md)。

---

## 2. `scout-circulars` — Git 太帳會唔會有問題？bot commit 會唔會定期洗？

### 2.1 先講清楚：你之前做嘅防爆係**啱**嘅，但係醫緊另一件事

我睇咗你 `.github/workflows/vercel-prune.yml`／`vercel-retention.yml`／`vercel-bundle-guard.yml` 同 `.vercelignore` 嘅註解 —— 嗰度記錄咗 2026-09-16/17 由 10.49GB → 11.82GB 爆 Functions Storage，真正病源係根目錄 `requirements.txt` 嘅 playwright（137MB）被 pip install 入每個 function bundle。你已經：清空 `requirements.txt`、依賴搬去 `.github/requirements-*.txt`、加 `.vercelignore`（deployment 8.4MB → 1.2MB）、加 prune／retention／bundle-guard。

**呢啲全部係清 Vercel deployments，唔係清 Git history。** 兩件事唔同，所以 Git 嗰邊 158MB 完全冇人理。

### 2.2 158MB 實際係邊度嚟（我計咗）

| 部分 | 大小 | 點嚟 |
|------|------|------|
| `main` 全 history（615 commits） | **40.82 MiB** | 2026-05-20 → 10-27；`cache.json` 改過 **269 次**（3.6MB/份）、`enrich.json` **156 次**（2MB/份） |
| **`stories` branch（22 commits）** | **~115 MiB** | 2026-09-22 → 10-25；210 個 PNG blob 共 122.8MiB，每個 1–2MB；每日一個新 commit，每個 commit 包 7 日 story 圖 |
| 8 條 `arena/*` 舊 branch | 物件共享，增量好少 | 每條 ~556–614 commits；但對 pack 大小影響輕微（全部 refs 155.83 vs main+stories 156.02 MiB） |
| **GitHub 報嘅 size** | **158 MiB** | 約等於全部 refs 嘅 pack |

> 即係：**最大嚿唔係你啲 JSON，係 `stories` branch 嘅 PNG。** 你啲 JSON 喺 main history 只佔 40.8MiB。

`story-draft.yml` 雖然每日 `git push --force origin HEAD:stories`，但佢先 `git fetch --depth 1 origin stories:stories-tmp` → `git checkout -f stories-tmp` → `git commit` —— **每日喺舊 commit 上面加一個新 commit**，所以 history 由 22 日累積到 22 個 commit，每個都包住 7 日圖。Force-push 只換 branch tip，**唔會刪舊 commit**。

### 2.3 會唔會有問題？而家唔會即刻死，但會一路谷

GitHub 官方：repo **建議 < 1 GB，強烈建議 < 5 GB**；單檔 >100MB 會被 block，>50MB 會 warn；push 上限 2GB [1](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits) [2](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)。你最大單檔 3.5MB，**158MB 離硬限好遠**。

但實際影響：
- **Full clone 要落 156MiB**（working tree 得 46MiB）；CI 用 `fetch-depth: 1` 頂住，但 `notify.yml`／部分 workflow 無 `fetch-depth`，`git pull --rebase` 會拎多啲。
- **增長率**：main ~8MiB/月；`stories` ~3.5MiB/日（≈1.3GB/年）。合計約 **+5MiB/日 → 半年前後過 1GB 建議線**，到時 GitHub Support 可能叫你減 [2](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)。
- GitHub Pages（如有用）硬限 1GB；GitHub 搜尋／indexing／`git gc` 亦會越嚟越慢。
- **68 個 `refs/pull/*/head`** 仍然指住舊 commit —— 即使你 force-push，呢啲 refs 會繼續 pin 住舊 blob，令 GC 清唔走。

### 2.4 bot commit 會唔會定期洗？**唔會。**

要講得好清楚：

- **GitHub 唔會自動刪除任何 commit。** `git gc` 只會清 **unreachable（冇任何 ref 指住）** 嘅物件；你 615 個 bot commit 全部由 `main` 可達 → **永遠留低**。
- 就算你 force-push 改寫 history，舊 commit 仍可能經 `refs/pull/*`、fork、cached view、SHA 直接存取；GitHub 官方文件講明要完全清走需要 `git filter-repo` + force-push + **聯絡 GitHub Support 做 server-side GC 同清 cached views**，而且 Support 一般只幫 sensitive data [1](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) [3](https://github.com/github/docs/blob/main/content/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository.md)。
- 非敏感資料嘅 unreachable 物件，GitHub 背景 GC 最終會清，但**唔係即時**（社群實測由幾日到兩星期不等）[7](https://github.com/orgs/community/discussions/190183)。

**所以：唔好指望佢自己洗。要改 workflow 令佢「由一開始就唔寫入 history」。**

### 2.5 你啲 JSON 好重要 —— 四個「保留數據但唔谷爆 Git」嘅方案

| 方案 | 點做 | 好處 | 代價 |
|------|------|------|------|
| **A（推薦）固定 `data` branch + amend** | 開一條 orphan `data` branch，**每日 `git commit --amend` 同一個 commit** + force-push；前端 raw URL 改指 `data` branch | 歷史得 1 個 commit，size 恆定；JSON 照樣公開可讀 | 要改前端 raw URL；每日 force-push |
| **B GitHub Release asset** | 固定 tag `latest-data`，每日 delete + recreate asset（`cache.json`／`enrich.json`） | asset **唔入 git history**；穩定 URL | 要改前端讀 release asset URL |
| **C Actions artifact** | `actions/upload-artifact` with `retention-days: 30` | **90 日自動過期清除**，官方默認 90 日、可設 1–90 [9](https://github.com/actions/upload-artifact) [1](https://docs.github.com/en/organizations/managing-organization-settings/configuring-the-retention-period-for-github-actions-artifacts-and-logs-in-your-organization) | 30 日後舊 snapshot 冇咗；要 download API |
| **D Supabase / R2** | 每日 upsert 落 DB／object storage，Git 只留一個 pointer manifest | 最正規，可查詢、可保留全歷史 | 要改 code + 設 credentials |

> **我建議 A + C 一齊**：A 畀前端繼續有穩定 raw URL（最新一份），C 保留 30–90 日每日 snapshot 做審計／回溯。
> 對應 GitHub 官方建議「Store programmatically generated files outside of Git, such as in object storage」[1](https://docs.github.com/en/repositories/creating-and-managing-repositories/repository-limits)。

### 2.6 即刻可以做嘅三件事（按順序，全部零停機）

**Step 1 — 刪 8 條 stale `arena/*` branch + 檢查 PR refs**
```bash
gh api --method DELETE repos/playerkousas-rgb/scout-circulars/git/refs/heads/arena/1c29341e-scout-circulars
# ... 其餘 7 條同樣
```
（刪之前確認冇人仲用；呢啲係舊 session 分支。刪完舊 blob 會變 unreachable，等 GitHub GC。）

**Step 2 — 改 `story-draft.yml`：每日真正 orphan，唔好喺舊 commit 上加**

將 `if git fetch --depth 1 origin stories:stories-tmp ...` 嗰段改成：**先備份上 7 日資料 → 每日都 `git checkout --orphan` → 只 commit 一份**，例如：

```bash
# 1) 先由舊 stories branch 拎返最近 7 日圖（放 RUNNER_TEMP）
git fetch --depth 1 origin stories:stories-prev 2>/dev/null || true
mkdir -p "$RUNNER_TEMP/prev"
git archive stories-prev stories | tar -x -C "$RUNNER_TEMP/prev" 2>/dev/null || true
# 2) 每日都開孤兒 branch（唔係只限第一次）
git checkout --orphan stories-tmp
git rm -rf . >/dev/null 2>&1 || true
cp -R "$RUNNER_TEMP/prev/." . 2>/dev/null || true
mkdir -p "stories/$TODAY" && cp -R "$RUNNER_TEMP/story-output/$TODAY/." "stories/$TODAY/"
# 3) 只留 7 日（你而家已有呢段），commit 一個，force-push
git add -A && git commit -qm "📲 Story assets $TODAY [skip ci]"
git push --force origin HEAD:stories
```
咁 `stories` branch 永遠得 **1 個 commit**，~115MiB 唔會再倍增。

**Step 3 — 改 `scrape.yml`／`scrape-appstore.yml`：唔好再 `git commit` 落 `main`**

```yaml
# 原本：git add cache.json enrich.json fingerprints.json && git commit && git push
# 改成：
- uses: actions/upload-artifact@v4
  with:
    name: circulars-data-${{ github.run_id }}
    path: |
      cache.json
      enrich.json
      fingerprints.json
    retention-days: 30
# 另外將最新一份 push 去固定 data branch（方案 A），前端 raw URL 改用嗰條
```

**Step 4（可選，大手術）— 清現有 history**

```bash
git clone --mirror https://github.com/playerkousas-rgb/scout-circulars.git
cd scout-circulars.git
git filter-repo --invert-paths --path cache.json --path enrich.json --path stories/ \
  --preserve-commit-hashes --force
git push --force --all origin
```
> ⚠️ 呢步會改寫所有 commit SHA、**影響 68 個 PR refs、所有 fork／本地 clone**，要同所有協作者講；舊 blob 仍可能留喺 GitHub cached view，要開 Support ticket 先完全清 [1](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)。
> **建議先做 Step 1–3 止血，等新 history 唔再谷，先至揀時間做 Step 4。**

---

## 3. `cubsbadge`／`scoutbadge` — 到底咩問題？有用戶在用喎

> ### ⚠️ 2026-10-27 用戶澄清（**最緊要**）
> **呢個問題係「三層樹狀系統（旅 → 團 → 進度）」接入模式先會出現。** 我唔應該假設所有旅團都要全套上。
> 原檔已經講明 **「接入完全自願：唔登記下游、或者登記咗但唔閂口，現有旅團一切照舊」**（`進度追蹤旅系統升級版.md §0`）。
> **單位可以分開獨立使用，或者之後先一併使用** → 見 [19 §6.1](19-ecportal-troop-case.md) 三模式表同本文 §3.5。
> 所以下面嘅修復係**「接入前閘門」，唔係「即刻迫所有人改」**：獨立單位繼續用完全冇問題；要行全套三層之前先做就得。

### 3.1 實際 code 證據（我睇咗真碼）

兩個 repo **已經有新版 `verifyLinkSig`**（`LINK_SIG_WINDOW_MS` ±5 分鐘 + nonce 一次性 + body digest，即 [19 §5](19-ecportal-troop-case.md) 嗰套）—— 呢部分**係好嘅**。問題係**舊登入路徑仲行緊**，同新版並存：

**`cubsbadge`（`apps-script/Code.gs`）**
- L2177 `if(action==='ecSigLogin') return ecSigLogin(...)` → 由 `doPost` 直接可達。
- L2085–2093 `ecCanonical` = `childId|sub|role|children|target|exp|jti`；L2110 `EC_SIG_MAX_TTL=30*60`。
- L2142 只係 `ecAccessLog(...,'jti='+...)` —— **`jti` 有簽、有 log，但從來冇 `CacheService` 消費／檢查重放**。
- 即係：一張有效 sig 喺 30 分鐘內可以 **重放無限次**換本地 token。
- 我 clone 嘅 11 個 repo 入面**冇其他 repo call `ecSigLogin`**（只有 cubsbadge 自己嘅 `Code.gs`／`test/ecosystem.test.mjs`／CHANGE_LOG），但**有可能由我未 clone 嘅上游系統呼叫**，所以唔好直接當死 code 刪。

**`scoutbadge`（`apps-script/Code.gs` + `index.html`）**
- L756 `PORTAL_SIG_MAX_TTL = 3600`（**1 小時**）；L794–805 `verifyPortalSig()` canonical = `childId|sub|scope|exp`，**冇 nonce／冇 jti／冇 ts／冇 CacheService 重放檢查**。
- L834／844 `requireAuthBody`／`requireAuthParams` 每個請求都接受佢；L1470 `action==='portalLogin'` 係 live 登入路徑。
- `index.html` L2029–2035 `window.addEventListener('message', ...)` **冇檢查 `ev.origin`**；L2019–2041 前端收 `scoutbadge:portal-sig` 後 call `portalLogin`；註解講明「家長 → sig bearer（currentSigPayload 隨每個請求附帶，唔發本地 token）」。
- 即係：家長張 sig 係一個 **1 小時有效嘅 bearer token**，每個 request 都重用；如果張 sig 洩漏（browser history／referrer／log／screenshot／XSS／上游 portal 被入侵），攻擊者可以扮嗰個家長／領袖 1 小時。

**兩個 repo 都有 `CacheService` 一次性防重放，但只用喺 `super_ticket`（60 秒）同新版 `verifyLinkSig`** —— 舊 `sig` 路徑漏咗。

### 3.2 風險評估（唔好嚇親用戶）

- **唔係已經被入侵。** 攻擊者**唔可以偽造 sig**（要 HMAC key = 單位 `API_KEY`）；佢必須先**拎到一張有效 sig**。所以係「條件式風險」，唔係「而家中緊招」。
- **有用戶在用 ≠ 唔使修；但係代表唔可以硬切。** 直接停用 `portalLogin`／`ecSigLogin` 會即時踢走**已接入**嘅用戶。要用 **雙軌過渡（dual-accept）**；**獨立單位可以直接閂 action，唔使雙軌**（佢哋根本無 sig 可用）。
- **獨立模式（模式 ①）冇實際攻擊面**：冇上游簽發 sig，攻擊者攞唔到有效票據。所以下面 P2 可以**按單位接入進度排期**，唔使一次過推全旅。
- 最陰質係：佢有新版 `verifyLinkSig`，但舊版仍然開住 —— 你想像中「已經升級咗」其實只係升咗一半。

### 3.3 三階段修復（零停機，2–4 星期）

**Phase 0（今日，server-side only，零 client 改動；只對「已接入／準備接入」嘅單位做）**

> 如果某個單位確定係**獨立使用（模式 ①）**，最簡單唔係加 cache，而係直接將 `ecSigLogin`／`portalLogin` 舊 action 改成回 `410 Gone`（或用 `INTEGRATION_MODE=off` 旗）—— 攻擊面即刻歸零，零改動風險。雙軌只係為咗仲有 sig 流量嘅單位。

`cubsbadge` —— `jti` 已經喺 payload，直接加一次性消費（**上游同前端唔使改**）：
```javascript
// ecSigLogin() 內，驗 sig 成功之後、createToken() 之前
var cache = CacheService.getScriptCache();
var jti = String(payload.jti || '').trim();
var replayKey = 'ec-sig-jti:' + (jti || Utilities.base64EncodeWebSafe(
  Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(sig))));
if (cache.get(replayKey)) {
  ecAccessLog(sub, payload.role, 'sig', 'FAIL', 'sig_replayed');
  return jsonResponse({success:false, error:'SIG 已使用'});
}
cache.put(replayKey, '1', 5 * 60);   // TTL 改 5 分鐘
```
同時 `EC_SIG_MAX_TTL = 5*60`（原本 30*60）。

`scoutbadge` —— 先縮短窗口 + 加 origin 白名單：
```javascript
const PORTAL_SIG_MAX_TTL = 300;   // 3600 → 300 秒
```
```javascript
// index.html message listener
const ALLOWED_ORIGINS = ['https://你的上游portal.vercel.app'];
window.addEventListener('message', function(ev){
  if (ALLOWED_ORIGINS.indexOf(ev.origin) < 0) return;   // ★ 新增
  const d = ev.data;
  if(!d || d.type!=='scoutbadge:portal-sig') return;
  ...
});
```
> ⚠️ 呢個階段**唔好**喺 `requireAuthBody` 加「一張 sig 只用一次」，因為家長每個 request 都重用同一張 sig —— 會即時炸 app。要等 Phase 1 改成 local token 先做得。

**Phase 1（第 1–2 星期，雙軌）**

- 上游簽 sig 嗰邊加 `ts` + `nonce`（照 `verifyLinkSig` 嘅格式），下游 `verifyPortalSig` 同時接受：
  - 新格式（有 `ts`+`nonce`）→ ±5 分鐘 + nonce 一次性（CacheService）
  - 舊格式 → 仍然接受，但 TTL 得 5 分鐘 + 記 `ACCESS_LOG` 標 `legacy`
- **`portalLogin` 對家長都發 local token**（而家只對 member/leader 發）；前端 `currentSigPayload` 改成 `currentToken`，之後每個 request 用 token，唔再送 raw sig。
- 前後端同時 deploy；期間舊 sig 同新 token 都通行 → 用戶零感覺。
- `cubsbadge` 嘅 `ecSigLogin` 一樣加新格式雙軌（如果確認有上游用）。

**Phase 2（第 3–4 星期，收口）**

- 睇 `ACCESS_LOG`：連續 7 日 `legacy` hit = 0 → 將舊格式改成 return `410 Gone`／移除 `verifyPortalSig`、停用 `ecSigLogin`（若確認無上游）。
- 加 **regression test**：同一張 sig 打兩次，第二次必須 `FAIL`（兩個 repo 都有現成測試框架：`cubsbadge/test/ecosystem.test.mjs`、`scoutbadge/test/troop_upgrade.test.js`）。
- **加 CI**：兩個 repo 而家 `.github/workflows` = **0**，測試只會人手跑。加一條 `node --test`／`npm test` on push，防下次再退化。

### 3.4 點解要咁麻煩，唔直接刪？

| 做法 | 結果 |
|------|------|
| 直接刪舊 sig 路徑 | ❌ 現有家長／領袖即時登入唔到 |
| 只升級但唔加重放檢查 | ❌ 舊路徑繼續可重放（而家就係咁） |
| 雙軌 + 短 TTL + local token + 最後收口 | ✅ 用戶零停機，2–4 星期後徹底關漏洞 |

> 通用技術做法（nonce／ts／CacheService／雙通道）喺 [03-security A7](03-security.md) 同 [07 GAS X5](07-apps-script.md)；專案專屬嘅 `<purpose>` 字串同 repo 名喺 [19 §5／§12](19-ecportal-troop-case.md)。

---

### 3.5 獨立使用／之後先一併用嘅安排（用戶要求）

| 你想點 | 做乜 | 幾時做 |
|--------|------|--------|
| **繼續獨立用**（大部分旅團） | 乜都唔使改；建議加 `INTEGRATION_MODE=off` → 舊 sig action 回 `410`，攻擊面歸零 | 得閒先 |
| **逐個單位試接入** | 保持模式 ②（登記但唔閂口）；先做 Phase 0（TTL/cache/origin），觀察 `ACCESS_LOG` | 逐個單位 |
| **全套三層一併用** | 完成 Phase 0 + Phase 1 雙軌 → 先至可以閂口轉模式 ③；Phase 2 收口 | 全部單位準備好先 |

**建議嘅一個旗（可選，唔係規定）**：
```javascript
// Code.gs 頂部
var INTEGRATION_MODE = PropertiesService.getScriptProperties()
  .getProperty('INTEGRATION_MODE') === 'on';   // 未設定 = off（獨立）

// doPost 分派
if (!INTEGRATION_MODE && (action === 'ecSigLogin' || action === 'portalLogin')) {
  return jsonResponse({ success:false, code:'INTEGRATION_DISABLED' }, 410);
}
```
咁樣：**獨立單位零風險、零改動；想接入嘅單位開 `on` 並完成防重放** —— 兩套共存，唔使迫人。

> 對應 [19 §6.1](19-ecportal-troop-case.md)（三種使用模式）同 [19 §12](19-ecportal-troop-case.md)（VS／RS vs cub／scout 現況差異）。

---

## 4. 做完之後點驗證

```bash
# prompt
npm ci && npm audit --audit-level=high && npm run build     # 全部綠

# scout-circulars
git ls-remote --heads origin | grep arena                   # 應該 0 條
git rev-list --count origin/stories                         # 應該 = 1
git count-objects -vH                                      # pack 應該由 156MiB 明顯回落（GC 後）
gh api repos/playerkousas-rgb/scout-circulars --jq .size   # 追蹤 GitHub size

# badge repos
node --test test/ecosystem.test.mjs         # cubsbadge：加咗「重放第二次 FAIL」
node --test test/troop_upgrade.test.js      # scoutbadge：同上
grep -n 'PORTAL_SIG_MAX_TTL' apps-script/Code.gs           # 已接入單位應該 300
grep -n 'INTEGRATION_MODE' apps-script/Code.gs                # 獨立單位應該 = off / 410
```

> 對應 [17 最終檢查](17-final-check-and-tutorial.md)：任何一項改完都要跑 `node scripts/final_check_v1.0.mjs` + 人手開一次真 URL／真 Sheet（[20 §5](20-repo-health-audit.md) 第 7 條「真機跑一次」）。
