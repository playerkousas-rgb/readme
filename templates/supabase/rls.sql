-- U3：RLS 範本。每張新表都要開；新表未開 policy = 未交付。
-- ⚠️ 按你專案嘅 table / role 改；以下係最小安全起點。

-- 例子：通告表
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  unit_id text not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '',
  share_to text[] not null default '{}',
  created_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.notices enable row level security;

-- 讀：只可以讀自己單位，或者 share_to 有自己單位
create policy "notices_select" on public.notices
  for select to authenticated
  using (
    unit_id = (auth.jwt() ->> 'unit_id')
    or unit_id = any (share_to)
  );

-- 寫：只可以寫自己單位，而且 created_by 必須係自己
create policy "notices_insert" on public.notices
  for insert to authenticated
  with check (
    unit_id = (auth.jwt() ->> 'unit_id')
    and created_by = auth.uid()
  );

create policy "notices_update" on public.notices
  for update to authenticated
  using (unit_id = (auth.jwt() ->> 'unit_id'))
  with check (unit_id = (auth.jwt() ->> 'unit_id'));

-- server-side（service_role）先可以刪除 / 批量
create policy "notices_service_all" on public.notices
  for all to service_role using (true) with check (true);

create index if not exists notices_unit_created_idx on public.notices (unit_id, created_at desc);

-- 驗收（U3）：要用 anon / authenticated 身份實測讀唔到隔離資料。
-- select * from public.notices;  ← 喺 SQL editor 用 service_role 跑會見到全部，呢個唔算驗證。
