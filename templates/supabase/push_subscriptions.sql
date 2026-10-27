-- U4/U9：推送訂閱表 — 只存 hash，唔存身份（PDPO）
-- 統計出到「幾多人訂、訂咩」，但唔知邊個。

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint_hash text not null unique,
  client_token_hash text not null,
  branch_ids text[] not null default '{}',
  topic_ids text[] not null default '{}',
  source text not null default 'library' check (source in ('library','system','mock')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- 用戶可以登記／更新自己嘅訂閱（寫入），但讀唔到別人
create policy "push_anon_insert" on public.push_subscriptions
  for insert to anon with check (true);

create policy "push_anon_update_own" on public.push_subscriptions
  for update to anon
  using (client_token_hash = (current_setting('request.headers', true)::json ->> 'x-client-token-hash'))
  with check (client_token_hash = (current_setting('request.headers', true)::json ->> 'x-client-token-hash'));

-- 只有 server / stats job 可以讀全部
create policy "push_service_all" on public.push_subscriptions
  for all to service_role using (true) with check (true);

create index if not exists push_branch_gin on public.push_subscriptions using gin (branch_ids);
create index if not exists push_topic_gin  on public.push_subscriptions using gin (topic_ids);
create index if not exists push_created_idx on public.push_subscriptions (created_at desc);

-- 冪等推送紀錄（F6）：同一通告只推一次
create table if not exists public.push_deliveries (
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  circular_id text not null,
  sent_at timestamptz not null default now(),
  primary key (subscription_id, circular_id)
);
alter table public.push_deliveries enable row level security;
create policy "deliveries_service_all" on public.push_deliveries
  for all to service_role using (true) with check (true);

-- 統計 view（U4）：唔含任何身份欄位
create or replace view public.subscription_stats as
select source,
       count(*) as total,
       count(*) filter (where last_seen_at > now() - interval '30 days') as active_30d,
       min(created_at) as first_seen
from public.push_subscriptions
group by source;
