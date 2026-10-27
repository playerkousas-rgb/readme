# 03 — 安全（A1–A18）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> **唯一假設**：前端已經被攻陷。任何喺瀏覽器／Canvas／Sheet 見到嘅嘢，都可能被改、被讀、被重放。
> 授權永遠喺 server 計；secret 永遠唔離開 server；所有敏感動作留痕。

---

## A1 — Secret 只喺 server

| 平台 | 放邊 | 永遠唔好放 |
|------|------|-----------|
| Vercel | Project Settings → Environment Variables（Production / Preview 分開） | `NEXT_PUBLIC_*` / `VITE_*` / `dist/` / `vercel.json` |
| Apps Script | `ScriptProperties`（`API_KEY`、`DOWNSTREAM_*`） | Sheet 儲存格、HTML template、`Logger.log` |
| Supabase | Vault / Edge Function env | `anon key` 以外嘅嘢落前端 |
| 本機 | `.env.local`（已 gitignore） | `.env` commit、貼去 Slack／issue |

**死規矩**：apikey 唔入 URL、唔入 QR、唔入 LocalStorage、唔回前端、唔入 Sheet。
前端只可以有 `anon key`（而且要有 RLS，見 A10）。

**Prompt 都係受保護資產**（Gemini app，[09-gemini-canvas C9](09-gemini-canvas.md#c9--type-c保護-prompt-設定)）：
system prompt／few-shot／評分標準／Gemini API key 一律放 `Code.gs` 或 ScriptProperties；
寫入單一 HTML = 「檢視原始碼」即公開；`api()` 回應亦唔可以回傳 prompt 內容。
紀錄只存 `payloadHash` + `promptVersion`，唔存用戶原文（[RECORDS_v1.0.md](../templates/canvas/RECORDS_v1.0.md)）。

```bash
# guard 會 scan 呢啲 pattern
sk_live_  ghp_  github_pat_  AKIA  eyJhbGci  -----BEGIN ... PRIVATE KEY-----
```

---

## A2 — Key rotation

- **每季**例行一次；有管理權者離任即刻一次；懷疑外洩即刻一次。
- 換 key 行 [F16 三處同步](02-foolproof.md#f16--三處同步-checklist最常出事)。
- 舊 key 要有「即刻失效驗證」步驟：換完用舊 key 打一次，必須失敗。
- 外洩完整流程：[11-incidents.md#1-key-外洩](11-incidents.md#1-key-外洩)。

---

## A3 — 密碼雜湊

```
PBKDF2-SHA256, iterations ≥ 100,000, per-user random salt (16 bytes)
存：hash (hex 64) + salt + iterations
比對：timingSafeEqual（唔好 ===）
```

- hash 只存 server；隨 DB 同步／export 前**預設剝走**。
- 例外：後掛上游批量開戶要先由下游 `exportAll(include_hash)` 吐 JSON（含 hash + salt + 迭代數），上游逐個 `upsertUser` 直插 hash；**回應／讀取 API 永遠唔含 hash**。
- 舊 hash（弱演算法）喺用戶下次登入成功時**自動升級**。

---

## A4 — Session

```
JWT, HttpOnly; Secure; SameSite=Lax, exp ≤ 30 min
payload: { sub, role, jti, pv, iat, exp }
silent refresh：到期前換新，舊 jti 作廢
```

- 每次改／重設密碼 → `pv + 1`；server 驗 `pv` 唔對即 401（即時踢走所有舊 session）。
- `jti` 亦用嚟綁 `sig`（A7），防止一張 ticket 重放去第二個節點。
- 唔好用 LocalStorage 存 session；Canvas 工具如果一定要存，只存非敏感偏好（訂閱設定）。

---

## A5 — 登入閘

| 機制 | 值 |
|------|-----|
| 失敗鎖定 | 每帳號 5 次失敗 → 鎖 15 分鐘；解鎖要領袖 |
| 首次登入 | 預設臨時碼（例 `1234`）＋ `mustChangePw`，強制改 ≥4 位 |
| `mustChangePw` 期間 | 只放行改密碼 API，其他一律 403 |
| 邀請連結 | 隨機 12 字元、24h、一次性 |
| 忘記密碼 | 一次性連結，用一次即廢；回應統一（A17） |

---

## A6 — 授權 server-side

```js
// ❌ 錯
const { role } = req.body; if (role === 'admin') ...

// ✅ 啱
const session = await verifySession(req);           // role 由簽過嘅 session 嚟
const scope = session.scope;                        // 已簽入 sig
if (!can(scope, action, targetUnit)) return 403;
```

- `permissions_override` 只得直接上級可設；**下級 override ⊆ 上級自己權限**（封頂）；上級失權即失效；記 `updatedBy`。
- 跨單位幫手要目標單位批（唔准上級直接加）；失效由目標單位撤。
- `sig` 嘅 scope 要簽死喺簽名內容入面，下游用自己 key 重算驗證。

---

## A7 — `sig` 簽名（GAS → GAS 實戰定案）

```
根密鑰 D  = 下游嘅 SHEET KEY（只存 ScriptProperties / Vercel env）
sigKey    = hex( HMAC-SHA256( message = "<purpose>", key = D ) )
canonical = action + "\n" + ts(毫秒) + "\n" + nonce + "\n" + hex(SHA-256(rawBody))
sig       = hex( HMAC-SHA256( canonical, sigKey ) )
```

防護清單（一項都唔少）：

| 防護 | 值 |
|------|-----|
| 用途分離 | 每個 repo 一條 `<purpose>` 常數（例 `<repo>-bridge-sig-v1`），上游下游必須同 repo 同字串 |
| 時間窗 | `ts ± 5 分鐘`，未來時間戳都拒 |
| nonce | 一次性，`CacheService` 10 分鐘 |
| body | `≤ 900KB`；digest 綁**原始** body |
| 傳送 | query `?sig=&sts=&snonce=` ＋ body `{..., sig, sig_ts, sig_nonce}` 兩組（GAS 302 會遺失 query）；兩組 nonce 一次過消耗 |
| 方法 | **一律 POST**，唔收 GET 帶 sig |
| 格式 | `sig` 必須 64 位 hex |
| 比較 | 兩邊各自 SHA-256 再比（避免逐字元短路時序攻擊） |
| 白名單 | 讀／寫 action 明確兩張表；`login`／`apply`／`logout`／`changePassword`／`updateConfig` 等**永不接受**（即使有 sig） |

> 詳細數學同白名單：[進度追蹤旅系統升級版.md §3](../進度追蹤旅系統升級版.md)。跨 repo 直連唔支援係已知邊界，唔係 bug。

---

## A8 — 匿名可寫面

以下每個都必須 **白名單 action + 限流 + 寫入待批表 + 去重**：

```
通告報名（同通告同名去重） / 物資借用 / 收支申報 / 進度申報 / 開戶申請 / 相片上載
```

- 限流維度：per-IP + per-unit + per-day；server 計數，唔信前端。
- 輸出寫入「待批表」，領袖對名冊核對先變正式資料。
- 公開連結要印「有效期 + 關閉方法」，領袖要識收線。

---

## A9 — Origin / callback allowlist

- CORS：`Access-Control-Allow-Origin` 用固定 allowlist，唔好用 `*` 配 credentials。
- `postMessage`：驗 `event.origin` + 固定 `source`。
- 回打端點：寫死一行常數（例 `https://<app>.vercel.app/api/super`），唔好由 request 帶 URL。
- 中央登入票據：60 秒、AES-GCM、綁定單位、**一次性防重放**；GAS 永遠收唔到密碼或 hash。
- 下游唔主動回打上游（旅系統 sig 鏈單向）；唯一例外係登入驗票呢條固定鏈。

---

## A10 — Supabase RLS

```sql
alter table public.push_subscriptions enable row level security;
create policy "anon_insert_own" on public.push_subscriptions
  for insert to anon with check (true);          -- 只可 insert，唔可讀别人
create policy "service_read_all" on public.push_subscriptions
  for select to service_role using (true);
```

- **每張表開 RLS**，新表未開 policy 之前當佢未交付。
- `anon key` 可以放前端（佢係 public identifier），但**授權靠 RLS**；`service_role` 只喺 server / Edge Function。
- Edge Function 用 `createClient(url, service_role_key)` 之前先驗呼叫者身份。
- Storage bucket 一樣要 policy（public read / authenticated write 分開）。

---

## A11 — 輸入消毒

| 攻擊 | 防線 |
|------|------|
| 試算表算式注入（`=IMPORTXML(...)`） | 用戶標籤只留 `0-9A-Za-z_.@-`；Sheet 寫入前 escape 前綴 `'` |
| XSS | 輸出 escape；Canvas 用 `textContent` 唔用 `innerHTML`；CSP header |
| SQL injection | Supabase 用參數化 RPC / PostgREST filter，唔好拼 string |
| 上載 | MIME allowlist + size + 檔名消毒 + 存 Storage 唔存執行路徑 |
| 路徑遍歷 | 檔名由 server 生成 uuid，唔用用戶提供嘅 path |
| SSRF | 目標 URL 必須喺 registry allowlist（例只准正式 GAS `/exec`） |

---

## A12 — 私隱（PDPO）

- 開戶流程帶「家長同意」欄位 + 可複製文案（收集乜／用途／邊個睇到／幾時刪）。
- 數據清單一張表：每個 table 收集咩、保留期、誰可讀。
- 離隊／`TRANSFERRED_OUT` 12 個月後 purge 或匿名化。
- 相簿公開發佈：提示 + 領袖剔「已取得家長同意」+ 記審計。
- log 只記 metadata（ts、sub hash、action、bytes），**唔記密碼／email／電話／完整 body**。

---

## A13 — 審計鏈

```
ACCESS_LOG : ts, sub, role, via, event (LOGIN_OK/FAIL/LOCKOUT/RESET)
AUDIT_LOG  : ts, actor, targetSub, recordKey, action, before_hash, after_hash, prev_hash
```

- append-only、server-side 寫入、喺 ScriptLock 內 commit。
- `prev_hash` 鏈 → 改任何一行都會斷鏈（定期驗鏈）。
- 保留 24 個月後 purge；超管動作（A14）永久保留摘要。
- 審計log 本身要備份，否則還原時無得查。

---

## A14 — 隱藏超管

完整設計喺 **[04-settings-super.md](04-settings-super.md#2-隱藏超管hidden-super-admin)**。
最低要求：env-only credential、固定 `/api/super`、60 秒一次性票據、三權限、全留痕、每季 rotate。

> **警告**：超管唔可以變成後門。任何「唔留痕嘅超管」= 直接違規。

---

## A15 — 災難恢復通道

- 每個 leaf 至少留**一個本地領袖戶 + SUPER**（否則閂咗入口即變磚）。
- 下游入口開關可逆：`setLocalLogin(allow=true)` 經上游 `sig`，或者下游選單（獨立／災難模式）。
- 災難恢復動作寫入 AUDIT（actor=super / via=breakglass）。
- 每季演練：用超管重設一個測試帳號、由備份還原一個測試庫。

---

## A16 — 供應鏈

```
[ ] package-lock.json / pnpm-lock.yaml commit
[ ] npm audit（CI fail on high/critical）
[ ] GitHub Actions 用 SHA pin（唔用 @v1 浮動 tag）
[ ] Dependabot 開
[ ] main branch protection：PR + 1 review + CI 綠 + 唔准 force push
[ ] secret scanning / push protection 開
[ ] CODEOWNERS 指明邊個審安全相關改動
```

---

## A17 — 防帳號枚舉

- 登入失敗、帳號不存在、帳號鎖定、忘記密碼 → **同一句回應 + 相近時序**。
- 申請表按 unit + 聯絡去重；回執唔好講「呢個 email 已註冊」。
- 錯誤訊息統一到 [F13](02-foolproof.md#f13--統一錯誤碼) 個表。

---

## A18 — 最小權限

- 外部系統**零特權**：攞唔到 apikey / session / 直接 DB（見 [EXTERNAL.md](../EXTERNAL.md)）。
- 工具目錄入面嘅工具必須 stateless（純前端、無後端、無儲存）。
- `permissions_override` 封頂（A6）；每個 component 只拎佢需要嘅 env。
- 分享前設：接收方要有該模組；冇就分享唔到（[F3](02-foolproof.md#f3--registry-驅動)）。

---

## 安全驗收（上線前逐條）

```
[ ] 前端 bundle grep 唔到任何 secret / service_role
[ ] 所有 /api 第一句驗 session，先至 inject key
[ ] 所有 GAS doGet/doPost 第一句 requireAuth
[ ] 所有寫入 action 喺白名單；所有輸入過消毒
[ ] sig 有 ts + nonce + body digest + 只 POST
[ ] RLS 每表開 + 實測 anon 唔讀到隔離資料
[ ] 限流實測觸發到（唔係得個設定）
[ ] AUDIT_LOG 有寫到 + hash 鏈驗過
[ ] 超管測過一次 + 有 audit entry + 之後 rotate
[ ] 備份還原演練過
```
