# 08 — Supabase（U1–U12）

> **案例隔離**：本檔係通用規則。檔內 `UNIT_*`／`DOWNSTREAM_*`／`ALLOW_LOCAL_LOGIN` 等只係**中性示例名**；
> ecportal 旅團／進度追蹤嘅具體專案設定全部喺 [19 專案案例](19-ecportal-troop-case.md)（**唔係通用規則，新 app 唔使跟名**）；repo 健康 → [20](20-repo-health-audit.md)。


> 定位：**跨平台共用數據**（Push 訂閱、通告 cache、統計、Auth、Storage）。
> 同 GAS 分工：GAS = 單位自己嘅 leaf／記錄冊；Supabase = 共用／跨單位／需要 SQL 查詢嘅嘢。
> 鐵則：**anon key 可以公開，但 RLS 必須全部生效；service_role 永遠只喺 server。**

---

## U1 — 項目結構入 Git

```
supabase/
  migrations/20261026120000_init.sql     ← 所有 schema 改動用 migration，唔用手改 Dashboard
  functions/notify/index.ts             ← Edge Function（每日推送）
  seed.sql                              ← 只放假數據，唔放真 secret
  config.toml
```

- `supabase db push` / CI 跑 migration；**Dashboard 手改 schema = 冇得重現**。
- `seed.sql` 只放 non-sensitive 假資料；MOCK 數據要標 `_exportedFrom:'mock'`（[BUILD.md §9](../BUILD.md)）。

---

## U2 — 三條 key，唔好撈亂

| Key | 放邊 | 權限 |
|-----|------|------|
| `SUPABASE_URL` | 前端得 | 公開 |
| `SUPABASE_ANON_KEY` | 前端得 | 受 RLS 限制 |
| `SUPABASE_SERVICE_ROLE_KEY` | **只喺 Vercel env / Edge Function** | 繞過 RLS，超危險 |

- `service_role` 誤入前端 = 即刻 rotate（[11-incidents](11-incidents.md#1-key-外洩)）。
- Edge Function 要用 service_role 之前，先驗 caller 身份（session / cron secret）。
- `.env.example` 只寫 key 名，唔寫值。

---

## U3 — 每張表開 RLS

```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint_hash text not null,
  client_token_hash text not null,
  branch_ids text[] not null default '{}',
  topic_ids text[] not null default '{}',
  source text not null default 'library' check (source in ('library','system','mock')),
  created_at timestamptz not null default now()
);
alter table public.push_subscriptions enable row level security;

create policy "anon_insert" on public.push_subscriptions
  for insert to anon with check (true);
create policy "service_select" on public.push_subscriptions
  for select to service_role using (true);
```

完整範本：[templates/supabase/rls.sql](../templates/supabase/rls.sql)、[templates/supabase/push_subscriptions.sql](../templates/supabase/push_subscriptions.sql)。

**新表未開 RLS = 未交付**。要用 `anon` 身份實測讀唔到隔離資料。

---

## U4 — 私隱：只存 hash

- 訂閱表只存 `endpoint_hash` / `client_token_hash` / `branch_ids` / `topic_ids` / `source`。
- **唔存** 會員 ID、email、姓名、電話、身份證。
- 統計（`subscription_stats.py`）出到「幾多人訂、訂咩」，但**唔知邊個**（[BUILD.md §4](../BUILD.md)）。
- `source` 欄分開 library / system / mock，統計唔會撈亂。

---

## U5 — Auth

- Email 驗證開；密碼政策 server-side（同 A3 一致）。
- 唔好自己喺 `public.users` 存密碼；用 Supabase Auth 或現有 hash 機制。
- `auth.uid()` 做 RLS policy 基礎；唔好用 request body 傳 user id 做授權（A6）。
- 管理員操作用 server-side service_role + 審計。

---

## U6 — Storage

- Bucket policy 分 public read / authenticated write；上載檔名由 server 生成 uuid（防路徑遍歷）。
- 檔放 Storage，DB 只存 path；**唔好 base64 入 text column**（S11）。
- 設定 lifecycle：暫存上載 7 日後 purge；相片保留期跟 PDPO（A12）。
- 單檔 ≤5MB、每筆 3 張、每單位每日總量（S9）。

---

## U7 — 查詢效能

```sql
create index on public.push_subscriptions using gin (branch_ids);
create index on public.push_subscriptions using gin (topic_ids);
create index on public.push_subscriptions (created_at desc);
```

- 禁 `select *`；只揀需要欄位；list 一律 `.range(0, 99)` 分頁（S11）。
- log / notification 表每日 purge，保留 24 個月（A13）。
- 大表用 RPC 做聚合，唔好拉晒落前端計。

---

## U8 — Edge Functions

```ts
// functions/notify/index.ts（概念）
Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) return new Response('', {status:401});
  const db = createClient(URL, SERVICE_ROLE_KEY);   // 只喺 server
  // 抓命中訂閱 → pywebpush / Web Push (VAPID) → 7 日 rolling 補漏
});
```

- secret 用 `Deno.env.get`；**唔好 log 落 console**（VL9）。
- 每個 function 有 timeout + 冪等鍵 + 重試（F6），避免重複推送。

---

## U9 — 推送訂閱（個人化訂閱基建）

```
外部內容源每日 scrape
   → Supabase push_subscriptions（endpoint_hash / client_token_hash / branch_ids / topic_ids）
   → GitHub Actions 每日 06:00 notify.py 命中「單位 AND 項目」
   → Web Push（VAPID），7 日 rolling 補漏
```

- 系統做嘅嘢 = **訂閱設定前端**：用戶揀單位 × 分類 → service worker（用圖書館 VAPID public key）→ 寫入同一張表。
- 設定存用戶本機 LocalStorage（**非敏感偏好**），server 唔存身份（[EXTERNAL.md §3](../EXTERNAL.md)）。
- 圖書館要改：`require_same_origin` 加 origin allowlist，認住各單位系統網址（A9）。
- 同一通告只推一次（F6 冪等）。
- 統計照舊出到訂閱數增長、單位／項目分佈、30 日活躍。

---

## U10 — Cron 去重

- GitHub Actions `schedule: '0 22 * * *'`（UTC 22:00 = HKT 06:00）。
- **一條 job only**：Vercel Cron 同 Actions 唔好同時跑同一個推送（S8）。
- job 要有 lock（DB advisory lock 或 `run_id` 冪等鍵），防止 workflow 重跑推兩次。

---

## U11 — 備份 / free-tier 陷阱

| 項目 | 對策 |
|------|------|
| Free project 7 日無活動會暫停 | 每日 cron / health check 保持活躍；重要項目用 Pro |
| 自動備份 | 每日 `pg_dump` 去私有 Storage / 外部；每週還原演練（F11） |
| Migration 失敗 | expand → migrate → contract；每個 migration 可回滾 |
| 連線數 | 用 pooler（transaction mode）；serverless 唔好開長連線 |
| 費用 | 設 billing alert；Storage lifecycle 清暫存檔 |

---

## U12 — 常見死法

| 症狀 | 原因 | 解法 |
|------|------|------|
| 前端讀到所有人資料 | 新表冇開 RLS | U3 |
| `service_role` 外洩 | 放咗去 `VITE_` / Edge log | U2 + VL4 |
| 推送重複 | cron 無 lock / 冪等 | U10 |
| query 逾時 | `select *` + 無分頁 + 無 index | U7 |
| 統計撈亂 | library/system/mock 冇分 | U4 |
| schema drift | Dashboard 手改 | U1 |

---

## Supabase 驗收

```
[ ] migrations 入 Git + CI 可重現
[ ] 每張表 RLS 開 + anon 實測隔離
[ ] service_role 只喺 server，前端 bundle 無
[ ] 訂閱表只存 hash，無身份資料
[ ] Storage policy + lifecycle + 檔名 uuid
[ ] index + 分頁 + 無 select *
[ ] cron 唯一 + 有冪等 lock
[ ] 備份 + 還原演練 + billing alert
```
