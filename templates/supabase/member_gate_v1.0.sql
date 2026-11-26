-- member_gate_v1.0.sql — 登記閘（會員制）＋ 全 App 通行 ＋ 同一帳號只 1 個活躍 session ＋ 隨時刪人
-- © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM
-- 規格／流程／限制：[docs/61](../docs/61-registration-gate-and-single-session.md)
--
-- 用法：Supabase Dashboard → SQL Editor → 一次貼（**先備份**）。
-- 前提：已開 Supabase Auth（Email → 建議「OTP 或 Magic Link」，唔使密碼）。
-- 安全模型：
--   ① 三張表全部 enable RLS；一般用戶只讀得到自己。
--   ② 所有寫入（開 session／心跳／踢人／刪人）一律經 security definer 函數，
--      anon key 唔可以直接 insert／update 任何 session 行。
--   ③ 刪帳號 = 刪 auth.users 一行 + cascade 清 profile／session（真刪，唔係軟刪）。
--
-- ⚠️ 未實測：本檔按 Postgres／Supabase 標準語法寫，未在你任何一個 Supabase 專案跑過。
--    首次套用要喺測試專案跑一次，確認 `select * from public.sessions` 同 RPC 都正常。

create extension if not exists pgcrypto;   -- digest()／gen_random_uuid()

-- ─────────────────────────────────────────────────────────────
-- 0. 全站設定（單行表）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gate_settings (
  id boolean primary key default true check (id),          -- 只准一行
  access_mode text not null default 'registered'            -- 'open' 全公開／'registered' 要登記／'closed' 全站暫停
    check (access_mode in ('open', 'registered', 'closed')),
  auto_approve boolean not null default true,               -- false = 登記後要你手動批准
  max_active_sessions int not null default 1 check (max_active_sessions between 1 and 3),
  updated_at timestamptz not null default now()
);
insert into public.gate_settings (id) values (true) on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────
-- 1. 會員 profile（1 用戶 1 行，跟 auth.users 生命週期）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null default '',
  unit_name text,                                           -- 可選：所屬旅團（唔好收電話／身份證）
  role text not null default 'member' check (role in ('member', 'owner')),
  status text not null default 'pending' check (status in ('pending', 'active', 'blocked')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  deleted_at timestamptz                                    -- 只在軟刪模式用；預設真刪（見 §5）
);
create unique index if not exists profiles_email_key on public.profiles (lower(email));

-- 新 auth 用戶 → 自動建 profile（status 由 gate_settings.auto_approve 決定）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auto boolean;
begin
  select auto_approve into v_auto from public.gate_settings where id;
  insert into public.profiles (id, email, display_name, status)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'user'), '@', 1)),
    case when coalesce(v_auto, true) then 'active' else 'pending' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- 2. 活躍 session（「同一帳號只 1 人」嘅唯一真相）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  device text not null default 'unknown',                   -- 'iPhone Safari' 之類，畀你自己認得出
  ua_hash text,                                             -- UA 只存 hash，唔存原文（PDPO 最小化）
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text                                        -- 'replaced' 被新登入取代／'owner' 你踢／'blocked'
);
create index if not exists sessions_user_idx on public.sessions (user_id, revoked_at);

-- 硬保險：同一用戶任何時候最多 1 行 revoked_at is null。
-- 想容許 2 部裝置（例如你自己）：drop index sessions_one_active_per_user; 並將 max_active_sessions 設 2。
create unique index if not exists sessions_one_active_per_user
  on public.sessions (user_id) where revoked_at is null;

-- 開 session（登入／換裝置）：先踢走舊嘅，再開新嘅 —— 呼叫者只會拿到最新 session id
create or replace function public.open_session(p_device text default 'unknown', p_ua text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_sid uuid;
  v_status text;
begin
  if v_user is null then raise exception 'not_authenticated'; end if;

  select status into v_status from public.profiles where id = v_user;
  if v_status is distinct from 'active' then raise exception 'not_allowed:%', coalesce(v_status, 'missing'); end if;

  update public.sessions
     set revoked_at = now(), revoked_reason = 'replaced'
   where user_id = v_user and revoked_at is null;

  insert into public.sessions (user_id, device, ua_hash)
  values (v_user, coalesce(p_device, 'unknown'), encode(digest(coalesce(p_ua, ''), 'sha256'), 'hex'))
  returning id into v_sid;

  update public.profiles set last_seen_at = now() where id = v_user;
  return v_sid;
end;
$$;

-- 心跳／驗票：session 仲有效就 true，並更新 last_seen_at
create or replace function public.touch_session(p_sid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_ok boolean;
begin
  update public.sessions s
     set last_seen_at = now()
   where s.id = p_sid and s.revoked_at is null and s.user_id = auth.uid()
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

-- 純查（唔寫）：畀後端／middleware 用 service_role 呼叫
create or replace function public.session_is_active(p_sid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    join public.profiles p on p.id = s.user_id
    where s.id = p_sid and s.revoked_at is null and p.status = 'active' and p.deleted_at is null
  );
$$;

revoke all on function public.session_is_active(uuid) from anon, authenticated;
grant execute on function public.session_is_active(uuid) to service_role;

-- ─────────────────────────────────────────────────────────────
-- 3. Owner 操作（踢人／停用／刪除）—— 只有 role = 'owner' 或 service_role 用得
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gate_audit (
  id bigserial primary key,
  actor text not null,
  action text not null,
  target_email text,
  at timestamptz not null default now(),
  note text
);

create or replace function public.assert_owner()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception 'owner_only';
  end if;
end;
$$;

-- ① 踢走某人目前裝置（唔停用帳號，佢可以再登入）
create or replace function public.owner_kick(p_email text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_n int;
begin
  perform public.assert_owner();
  update public.sessions s
     set revoked_at = now(), revoked_reason = 'owner'
    from public.profiles p
   where p.id = s.user_id and lower(p.email) = lower(p_email) and s.revoked_at is null;
  get diagnostics v_n = row_count;
  insert into public.gate_audit (actor, action, target_email) values (auth.uid()::text, 'kick', p_email);
  return v_n;
end;
$$;

-- ② 停用（保留資料，登唔到）
create or replace function public.owner_block(p_email text, p_blocked boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_owner();
  update public.profiles set status = case when p_blocked then 'blocked' else 'active' end
   where lower(email) = lower(p_email);
  update public.sessions s set revoked_at = now(), revoked_reason = 'blocked'
    from public.profiles p
   where p.id = s.user_id and lower(p.email) = lower(p_email) and s.revoked_at is null and p_blocked;
  insert into public.gate_audit (actor, action, target_email, note)
  values (auth.uid()::text, case when p_blocked then 'block' else 'unblock' end, p_email, null);
end;
$$;

-- ③ 批准（auto_approve = false 時用）
create or replace function public.owner_approve(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assert_owner();
  update public.profiles set status = 'active' where lower(email) = lower(p_email) and status = 'pending';
  insert into public.gate_audit (actor, action, target_email) values (auth.uid()::text, 'approve', p_email);
end;
$$;

-- ④ 真刪（你隨時可以刪走）：刪 auth.users 一行，profile／session 一齊 cascade 消失
create or replace function public.owner_delete(p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  perform public.assert_owner();
  select id into v_id from public.profiles where lower(email) = lower(p_email);
  if v_id is null then raise exception 'no_such_member'; end if;
  if exists (select 1 from public.profiles where id = v_id and role = 'owner') then
    raise exception 'refuse_delete_owner';
  end if;
  insert into public.gate_audit (actor, action, target_email) values (auth.uid()::text, 'delete', p_email);
  delete from auth.users where id = v_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. RLS：一般用戶只讀自己；冇任何直接寫入權
-- ─────────────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.sessions      enable row level security;
alter table public.gate_settings enable row level security;
alter table public.gate_audit    enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'owner'));

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and role = 'member');   -- 唔准自己升做 owner／改 status

drop policy if exists sessions_select_self on public.sessions;
create policy sessions_select_self on public.sessions
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists settings_read_all on public.gate_settings;
create policy settings_read_all on public.gate_settings
  for select to anon, authenticated using (true);

-- gate_audit／sessions 嘅 insert／update／delete：冇 policy = 冇權（只准 security definer 函數同 service_role）

-- ─────────────────────────────────────────────────────────────
-- 5. 一次性：將你自己設做 owner（改成你嘅 email 再跑）
-- ─────────────────────────────────────────────────────────────
-- update public.profiles set role = 'owner', status = 'active' where lower(email) = lower('you@example.com');

-- 常用巡邏 SQL（Supabase SQL Editor 直接跑）
-- 睇誰在線：select p.email, p.display_name, p.status, s.device, s.last_seen_at
--           from public.profiles p left join public.sessions s
--             on s.user_id = p.id and s.revoked_at is null order by s.last_seen_at desc nulls last;
-- 睇幾多人登記：select status, count(*) from public.profiles group by status;
-- 清走 30 日冇上線嘅 pending：delete from public.profiles where status='pending' and created_at < now() - interval '30 days';
