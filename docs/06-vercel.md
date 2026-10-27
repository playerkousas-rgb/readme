# 06 — Vercel（VL1–VL12）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> Vercel = **前端靜態 host + `/api` serverless proxy**。佢係唯一可以揸 secret 嘅前端側元件；亦係最易「靜靜變肥」嘅地方（見 [01-slim](01-slim.md)）。

---

## VL1 — `/api/proxy` 係唯一出入口

```
瀏覽器 ──(session cookie)──▶ /api/proxy ──verifySession()──▶ inject apikey ──▶ GAS /exec
                                    │
                                    └─ 驗證失敗即 401，永遠唔會將 apikey 交俾前端
```

骨架：[templates/vercel/api/proxy.mjs](../templates/vercel/api/proxy.mjs)

**三步，順序唔可以調轉**：
1. `verifySession(req)` — 驗 JWT（`HttpOnly; Secure; SameSite=Lax`、exp、`pv`、`jti`）。
2. 檢查 action 喺白名單（F5）＋ 用戶 scope 夠唔夠（A6）。
3. **先至此**由 `process.env` 拎 apikey，注入出站 request。

> key 未設 = 拒絕敏感 action（[F12](02-foolproof.md#f12--開機自檢env-未設即拒敏感-action)），唔係照跑。

---

## VL2 — 零 runtime 依賴

`api/` 只用 Node 原生 `fetch` + `crypto`（[S1](01-slim.md#s1--api-零-runtime-依賴)）。Functions 嘅 cold start 對 dependency 數量好敏感。

---

## VL3 — `vercel.json` 定案

```json
{
  "framework": null,
  "outputDirectory": "dist",
  "installCommand": "npm install --include=dev",
  "cleanUrls": true,
  "regions": ["hkg1"],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
    ]}
  ]
}
```

完整範本：[templates/vercel/vercel.json](../templates/vercel/vercel.json)。
CSP 按 app 需要加（Canvas 單檔 app 要用 nonce 或 `'unsafe-inline'`，要寫明原因）。

---

## VL4 — Env 分環境

| Env | 用途 |
|-----|------|
| `SESSION_SECRET` | JWT 簽名（Production 一條、Preview 一條，唔好共用） |
| `SUPER_KEY` | 隱藏超管（Production only；Preview 唔好設） |
| `UNIT_<id>_BACKEND` / `_APIKEY` / `_NAME` | 各單位 GAS 接駁（server-only） |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | 可以公開（但要 RLS） |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only**，只放 Production |

**陷阱**：`NEXT_PUBLIC_*` / `VITE_*` 前綴 = 會被打入前端 bundle，任何嘢放進去即公開。
`.env.example` 範本：[templates/vercel/env.example](../templates/vercel/env.example)。

---

## VL5 — `/api/super`（隱藏超管唯一端點）

- 固定 route，唔喺任何選單／文件公開值；完整設計 [04-settings-super](04-settings-super.md#2-隱藏超管hidden-super-admin)。
- 缺 `SUPER_KEY` → 回 **404**；錯誤回應統一（A17）。
- 60 秒 AES-GCM ticket + nonce 一次性 + 綁單位；三權限白名單；每次寫 AUDIT + 告警。
- 骨架：[templates/vercel/api/super.mjs](../templates/vercel/api/super.mjs)。

---

## VL6 — CORS / Origin allowlist

```js
const ALLOW = new Set(['https://<app>.vercel.app','https://<custom-domain>']);
const origin = req.headers.get('origin');
if (origin && !ALLOW.has(origin)) return new Response('forbidden', {status:403});
```

- 唔好用 `*` 配 credentials。
- 回打端點（`SUPER_VERIFY_URL`）寫死 server 常數，唔由 request 指定（A9）。
- 容許第三方訂閱來源時，用 origin allowlist（[BUILD.md §4 個人化訂閱](../BUILD.md)）。

---

## VL7 — Rate limit

```js
// 簡易版：per-IP + per-action，Sliding window（Production 用 Vercel KV / Upstash）
const key = `rl:${ip}:${action}:${Math.floor(Date.now()/60000)}`;
if (++hits.get(key) > LIMIT[action]) return json({code:'RATE_LIMITED'}, 429);
```

適用所有匿名可寫面（A8）：報名／借用／申報／申請／上載／登入／ticket 驗證。
**實測要觸發到**，唔係得個設定。

---

## VL8 — 部署衛生（S8）

| 設定 | 值 |
|------|-----|
| Production branch | `main` only |
| Preview Deployment（非 main） | 關閉 |
| Deployment Retention | 7 日 |
| `.vercelignore` | 必須存在，擋 `node_modules/.git/docs`（S2） |
| `installCommand` | `npm install --include=dev`（**唔好**用 `--omit=dev`） |

> ⚠️ **勘誤（Vercel 官方視角）**：`BUILD.md §S3` 仍然寫 `--omit=dev`，係 ecportal 舊 as-built 值，
> 我哋保留原檔做案例，但**新 app 一律用 `--include=dev`**。原因：Vercel build 要 `devDependencies`
> 先有 `vite` [2](https://vercel.com/docs/builds/configure-a-build)；`NODE_ENV=production` 會跳過 devDeps
> 令 `vite: command not found` [4](https://vercel.com/kb/guide/dependencies-from-package-json-missing-after-install)。

---

## VL9 — Log 唔好記 PII

```js
console.log(JSON.stringify({ t:Date.now(), reqId, action, code, ms, bytes }));
// ❌ console.log(req.body) / console.log(process.env)
```

Vercel log retention 有限但依然係資料外洩面；log 只記 metadata（A12）。

---

## VL10 — Cron / 背景 job

- 每日 06:00 推送 / scrape 用 GitHub Actions + Supabase（見 [08-supabase U9](08-supabase.md#u9--推送訂閱個人化訂閱基建)），Vercel Cron 唔好同 Actions 重複跑。
- Cron endpoint 要驗 `CRON_SECRET`（header），唔好公開。
- 長 job（>10s）拆細 + 冪等鍵（F6），唔好一條 request 跑到底。

---

## VL11 — Rollback

```
Vercel Dashboard → Deployments → 揀上一個成功 deployment → Promote to Production
或 CLI: vercel rollback <deployment-url>
```

每個 PR 描述要寫回滾指令（F18）。
資料 schema 改動要 expand → migrate → contract（向後兼容一個版本）。

---

## VL12 — 常見死法（對照表）

| 症狀 | 原因 | 解法 |
|------|------|------|
| 儲存配額爆 | 無 `.vercelignore`，upload 咗 `node_modules` | S2 |
| 前端見到 apikey | 用咗 `VITE_` 前綴 / 直接 fetch GAS | VL1/VL4 |
| 冷啟動慢 | `api/` 裝咗重型 lib | S1 |
| 302 後 sig 失效 | GAS 轉址遺失 query | A7 雙通道 |
| Preview 一大堆 deployment | 非 main 開咗 preview | S8 |
| 改咗 env 但冇效 | 冇 Redeploy / cache 未 flush | F16 |
| 403 但唔知邊度錯 | 錯誤訊息唔統一 | F13 |

---

## Vercel 驗收

```
[ ] /api/proxy 先 verifySession 再 inject key
[ ] 所有 env 喺 Dashboard；前端 bundle grep 唔到 secret
[ ] vercel.json + .vercelignore 就位
[ ] security headers + CORS allowlist + rate limit 實測
[ ] /api/super 測過 + AUDIT 有痕
[ ] size gate 喺 CI（S7）
[ ] Preview 關 + retention 7
[ ] 回滾指令寫咗喺 PR
```
