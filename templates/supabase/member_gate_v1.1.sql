-- member_gate_v1.1.sql — 後台開戶（用戶名＋密碼）＋ 全 App 通行 ＋ 同一帳戶只 1 個活躍 session ＋ 隨時刪人
-- © SCOUT SYSTEM · COPYRIGHT SCOUT SYSTEM
-- 規格：[docs/61](../docs/61-registration-gate-and-single-session.md)
--
-- v1.1（2026-11-26 用戶定案）：
--   ❌ 唔用 Supabase Auth email／OTP／Magic Link（用戶唔想每次派 OTP）
--   ✅ 由你喺後台開戶：你設**用戶名＋密碼**，交俾對方；對方登入只打用戶名＋密碼
--   ✅ 冇 email 欄位 → 冇「收唔到信」問題、冇共用 email 問題、私隱負擔更細
--   ✅ 同一帳戶任何時候只有 1 個活躍 session（DB partial unique index 硬保證）
--
-- 用法：Supabase Dashboard → SQL Editor → 一次貼（**先備份**）。
-- 安全模型（重要，唔好改）：
--   ① 呢幾張表**完全唔開放** anon／authenticated：enable RLS 但**一條 policy 都唔開**＝默認拒絕。
--   ② 所有函數 `revoke all from anon, authenticated` ＋ `grant execute to service_role`。
--      即係只有你嘅登記中心（Next.js 伺服器，持 service key）叫得，瀏覽器叫唔到。
--   ③ 密碼用 pgcrypto `crypt()`（bcrypt, cost 12）雜湊，**永不存明文、永不回傳**。
--   ④ 失敗 5 次鎖 15 分鐘（鎖喺 DB，唔靠前端）。
--
-- ⚠️ 未實測：按 Postgres 14+／Supabase 標準語法寫，未在你任何 Supabase 專案跑過。
--    首次套用請喺**測試專案**跑，並確認：`select public.login_member('test','bad',...)` 回 bad_credentials。

create extension if not exists pgcrypto;   -- crypt()／gen_salt()／gen_random_uuid()
-- ⚠️ Supabase 會將 pgcrypto 裝喺 `extensions` schema，所以下面每條函數都寫 `search_path = public, extensions`；
--    漏咗就會出現 `function crypt(text, text) does not exist`。

-- ─────────────────────────────────────────────────────────────
-- 0. 全站設定（單行表）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gate_settings (
  id boolean primary key default true check (id),        -- 只准一行
  access_mode text not null default 'registered'          -- 'open' 全公開／'registered' 要登入／'closed' 全站暫停
    check (access_mode in ('open', 'registered', 'closed')),
  max_active_sessions int not null default 1
    check (max_active_sessions between 1 and 3),
  password_min_len int not null default 8 check (password_min_len between 6 and 64),
  lock_after_failures int not null default 5 check (lock_after_failures between 3 and 20),
  lock_minutes int not null default 15 check (lock_minutes between 1 and 1440),
  updated_at timestamptz not null default now()
);
insert into public.gate_settings (id) values (true) on conflict (id) do nothing;
-- 注意：冇「自己註冊」開關。帳戶只可以由後台開（MG1）。

-- ─────────────────────────────────────────────────────────────
-- 1. 帳戶（你喺後台開；冇 email、冇電話）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  username text not null,                                  -- 細楷，3–20 字：a-z 0-9 . _ -
  display_name text not null default '',
  unit_name text,                                          -- 可選：所屬旅團／支部
  role text not null default 'member' check (role in ('member', 'owner')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  password_hash text not null,                             -- crypt(pw, gen_salt('bf', 12))
  must_change_pw boolean not null default true,            -- 首次登入強制改密碼
  failed_count int not null default 0,
  locked_until timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid,
  last_seen_at timestamptz,
  constraint members_username_fmt check (
    username = lower(username) and username ~ '^[a-z0-9][a-z0-9._-]{2,19}$'
  )
);
create unique index if not exists members_username_key on public.members (username);

-- ─────────────────────────────────────────────────────────────
-- 2. 活躍 session（「同一帳戶只 1 人」唯一真相）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  device text not null default 'unknown',
  ua_hash text,
  persistent boolean not null default true,                -- false＝關閉瀏覽器即登出（共用平板用）
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text                                       -- 'replaced'／'owner'／'blocked'／'password'
);
create index if not exists sessions_member_idx on public.sessions (member_id, revoked_at);

-- 硬保險：同一帳戶任何時候最多 1 行「未撤銷」。
-- 想你自己（owner）2 部機：drop index sessions_one_active_per_member;
--   並喺 login_member() 只撤銷「最舊」，同時 max_active_sessions 設 2。
create unique index if not exists sessions_one_active_per_member
  on public.sessions (member_id) where revoked_at is null;

-- ─────────────────────────────────────────────────────────────
-- 3. 內部工具
-- ─────────────────────────────────────────────────────────────
create or replace function public.gate_now()
returns timestamptz language sql stable as $$ select now() $$;

-- 密碼政策：長度 ＋ 唔准等於用戶名 ＋ 唔准常見弱密碼
create or replace function public.assert_password_ok(p_username text, p_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_min int;
begin
  select password_min_len into v_min from public.gate_settings where id;
  v_min := coalesce(v_min, 8);
  if p_password is null or char_length(p_password) < v_min then
    raise exception 'password_too_short:%', v_min;
  end if;
  if lower(p_password) = lower(p_username) then
    raise exception 'password_same_as_username';
  end if;
  if lower(p_password) in ('12345678','123456789','password','password1','11111111','abcd1234','qwertyui','12345678a') then
    raise exception 'password_too_common';
  end if;
end;
$$;

create or replace function public.assert_owner(p_actor uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.members m
     where m.id = p_actor and m.role = 'owner' and m.status = 'active'
  ) then
    raise exception 'owner_only';
  end if;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 4. 登入（後台開戶制；冇 OTP、冇 email）
-- ─────────────────────────────────────────────────────────────
create or replace function public.login_member(
  p_username text,
  p_password text,
  p_device text default 'unknown',
  p_ua text default null,
  p_persistent boolean default true
)
returns table (
  out_session uuid,
  out_member uuid,
  out_display_name text,
  out_role text,
  out_must_change_pw boolean,
  out_error text
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  m public.members%rowtype;
  st public.gate_settings%rowtype;
  v_sid uuid;
  v_ua text;
begin
  select * into st from public.gate_settings where id;
  v_ua := case when p_ua is null or p_ua = '' then null
               else encode(digest(p_ua, 'sha256'), 'hex') end;

  select * into m from public.members where username = lower(btrim(coalesce(p_username, '')));
  if not found then
    return query select null::uuid, null::uuid, null::text, null::text, null::boolean, 'bad_credentials'::text;
    return;
  end if;

  if m.locked_until is not null and m.locked_until > now() then
    return query select null::uuid, null::uuid, null::text, null::text, null::boolean, 'locked'::text;
    return;
  end if;

  if m.status <> 'active' then
    return query select null::uuid, null::uuid, null::text, null::text, null::boolean, 'blocked'::text;
    return;
  end if;

  if m.password_hash is distinct from crypt(coalesce(p_password, ''), m.password_hash) then
    update public.members set
      failed_count = m.failed_count + 1,
      locked_until = case when m.failed_count + 1 >= coalesce(st.lock_after_failures, 5)
                          then now() + make_interval(mins => coalesce(st.lock_minutes, 15))
                          else m.locked_until end
     where id = m.id;
    return query select null::uuid, null::uuid, null::text, null::text, null::boolean,
                        case when m.failed_count + 1 >= coalesce(st.lock_after_failures, 5)
                             then 'locked'::text else 'bad_credentials'::text end;
    return;
  end if;

  -- 密碼正確：清失敗紀錄 → 撤銷舊 session → 開新
  update public.members
     set failed_count = 0, locked_until = null, last_seen_at = now()
   where id = m.id;

  update public.sessions
     set revoked_at = now(), revoked_reason = 'replaced'
   where member_id = m.id and revoked_at is null;

  insert into public.sessions (member_id, device, ua_hash, persistent)
  values (m.id, left(coalesce(nullif(btrim(p_device), ''), 'unknown'), 60), v_ua, coalesce(p_persistent, true))
  returning id into v_sid;

  return query select v_sid, m.id, m.display_name, m.role, m.must_change_pw, null::text;
end;
$$;

-- 已登入用戶自己改密碼（登記中心持 service key 呼叫；p_member 由 cookie 驗證後帶入）
create or replace function public.change_own_password(
  p_member uuid, p_old text, p_new text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare m public.members%rowtype;
begin
  select * into m from public.members where id = p_member;
  if not found then raise exception 'no_such_member'; end if;
  if m.password_hash is distinct from crypt(coalesce(p_old, ''), m.password_hash) then
    return false;
  end if;
  perform public.assert_password_ok(m.username, p_new);
  update public.members set
    password_hash = crypt(p_new, gen_salt('bf', 12)),
    must_change_pw = false,
    failed_count = 0,
    locked_until = null
  where id = p_member;
  -- 改密碼 = 踢走其他 session（自己嗰個由中心重新簽發）
  update public.sessions set revoked_at = now(), revoked_reason = 'password'
   where member_id = p_member and revoked_at is null;
  return true;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 5. Session 驗證／心跳
-- ─────────────────────────────────────────────────────────────
create or replace function public.touch_session(p_sid uuid)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_ok boolean;
begin
  update public.sessions s set last_seen_at = now()
   where s.id = p_sid and s.revoked_at is null
  returning true into v_ok;
  return coalesce(v_ok, false);
end;
$$;

create or replace function public.session_is_active(p_sid uuid)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1 from public.sessions s
    join public.members m on m.id = s.member_id
    where s.id = p_sid and s.revoked_at is null and m.status = 'active'
  );
$$;

create or replace function public.session_info(p_sid uuid)
returns table (out_member uuid, out_username text, out_display_name text, out_role text, out_persistent boolean)
language sql
security definer
set search_path = public, extensions
as $$
  select m.id, m.username, m.display_name, m.role, s.persistent
    from public.sessions s
    join public.members m on m.id = s.member_id
   where s.id = p_sid and s.revoked_at is null and m.status = 'active';
$$;

-- ─────────────────────────────────────────────────────────────
-- 6. 後台操作（全部要 p_actor = owner）
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gate_audit (
  id bigserial primary key,
  actor uuid,
  action text not null,
  target_member uuid,
  target_username text,
  at timestamptz not null default now(),
  note text
);

-- 開戶（單個）：你設密碼；must_change_pw 預設 true（首次登入要改）
create or replace function public.owner_create_member(
  p_actor uuid,
  p_username text,
  p_display_name text,
  p_unit_name text default null,
  p_password text default null,
  p_role text default 'member',
  p_must_change boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user text := lower(btrim(coalesce(p_username, '')));
  v_pw text := coalesce(nullif(p_password, ''), substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_id uuid;
begin
  perform public.assert_owner(p_actor);
  if p_role not in ('member', 'owner') then raise exception 'bad_role'; end if;
  perform public.assert_password_ok(v_user, v_pw);

  insert into public.members (username, display_name, unit_name, role, password_hash, must_change_pw, created_by)
  values (v_user, coalesce(nullif(btrim(p_display_name), ''), v_user), nullif(btrim(p_unit_name), ''),
          p_role, crypt(v_pw, gen_salt('bf', 12)), coalesce(p_must_change, true), p_actor)
  returning id into v_id;

  insert into public.gate_audit (actor, action, target_member, target_username, note)
  values (p_actor, 'create', v_id, v_user, case when p_password is null then 'temp_password_generated' else 'password_set_by_owner' end);
  return v_id;
end;
$$;

-- 批量開戶（一個旅幾十人）：回傳每個帳戶嘅**臨時密碼，只此一次**
-- p_rows = [{"username":"chan-tai-man","display_name":"陳大文","unit_name":"第21旅"}, …]
create or replace function public.owner_bulk_create(p_actor uuid, p_rows jsonb)
returns table (out_username text, out_temp_password text, out_member uuid, out_error text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  r jsonb;
  v_user text;
  v_pw text;
  v_id uuid;
begin
  perform public.assert_owner(p_actor);
  for r in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_user := lower(btrim(coalesce(r ->> 'username', '')));
    v_pw := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
    begin
      insert into public.members (username, display_name, unit_name, password_hash, must_change_pw, created_by)
      values (v_user, coalesce(nullif(btrim(coalesce(r ->> 'display_name', '')), ''), v_user),
              nullif(btrim(coalesce(r ->> 'unit_name', '')), ''),
              crypt(v_pw, gen_salt('bf', 12)), true, p_actor)
      returning id into v_id;
      insert into public.gate_audit (actor, action, target_member, target_username, note)
      values (p_actor, 'create_bulk', v_id, v_user, null);
      out_username := v_user; out_temp_password := v_pw; out_member := v_id; out_error := null;
      return next;
    exception when unique_violation then
      out_username := v_user; out_temp_password := null; out_member := null; out_error := 'username_taken';
      return next;
    when others then
      out_username := v_user; out_temp_password := null; out_member := null; out_error := sqlerrm;
      return next;
    end;
  end loop;
end;
$$;

-- 重設密碼（忘記密碼 / 你唔想知舊密碼）：回傳新臨時密碼一次
create or replace function public.owner_reset_password(p_actor uuid, p_username text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_pw text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);
  m public.members%rowtype;
begin
  perform public.assert_owner(p_actor);
  select * into m from public.members where username = lower(btrim(p_username));
  if not found then raise exception 'no_such_member'; end if;
  update public.members set
    password_hash = crypt(v_pw, gen_salt('bf', 12)),
    must_change_pw = true,
    failed_count = 0,
    locked_until = null
  where id = m.id;
  update public.sessions set revoked_at = now(), revoked_reason = 'password'
   where member_id = m.id and revoked_at is null;
  insert into public.gate_audit (actor, action, target_member, target_username)
  values (p_actor, 'reset_password', m.id, m.username);
  return v_pw;
end;
$$;

-- 踢下線（唔停用，佢可以再用同一密碼登入）
create or replace function public.owner_kick(p_actor uuid, p_username text)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_n int; v_id uuid;
begin
  perform public.assert_owner(p_actor);
  select id into v_id from public.members where username = lower(btrim(p_username));
  if v_id is null then raise exception 'no_such_member'; end if;
  update public.sessions set revoked_at = now(), revoked_reason = 'owner'
   where member_id = v_id and revoked_at is null;
  get diagnostics v_n = row_count;
  insert into public.gate_audit (actor, action, target_member, target_username)
  values (p_actor, 'kick', v_id, lower(btrim(p_username)));
  return v_n;
end;
$$;

-- 停用／恢復
create or replace function public.owner_block(p_actor uuid, p_username text, p_blocked boolean default true)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  perform public.assert_owner(p_actor);
  select id into v_id from public.members where username = lower(btrim(p_username));
  if v_id is null then raise exception 'no_such_member'; end if;
  if exists (select 1 from public.members where id = v_id and role = 'owner') then
    raise exception 'refuse_block_owner';
  end if;
  update public.members set status = case when coalesce(p_blocked, true) then 'blocked' else 'active' end
   where id = v_id;
  if coalesce(p_blocked, true) then
    update public.sessions set revoked_at = now(), revoked_reason = 'blocked'
     where member_id = v_id and revoked_at is null;
  end if;
  insert into public.gate_audit (actor, action, target_member, target_username)
  values (p_actor, case when coalesce(p_blocked, true) then 'block' else 'unblock' end, v_id, lower(btrim(p_username)));
end;
$$;

-- 真刪：member 一行，sessions 因 cascade 一齊消失
create or replace function public.owner_delete(p_actor uuid, p_username text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_id uuid;
begin
  perform public.assert_owner(p_actor);
  select id into v_id from public.members where username = lower(btrim(p_username));
  if v_id is null then raise exception 'no_such_member'; end if;
  if exists (select 1 from public.members where id = v_id and role = 'owner') then
    raise exception 'refuse_delete_owner';
  end if;
  insert into public.gate_audit (actor, action, target_member, target_username)
  values (p_actor, 'delete', v_id, lower(btrim(p_username)));
  delete from public.members where id = v_id;      -- sessions: on delete cascade
end;
$$;

-- 清理舊 session（建議每月跑一次）
create or replace function public.purge_sessions(p_keep_days int default 90)
returns int
language plpgsql
security definer
set search_path = public, extensions
as $$
declare v_n int;
begin
  delete from public.sessions
   where coalesce(revoked_at, last_seen_at) < now() - make_interval(days => greatest(coalesce(p_keep_days, 90), 7));
  get diagnostics v_n = row_count;
  return v_n;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- 7. 鎖死權限：瀏覽器（anon／authenticated）完全掂唔到
-- ─────────────────────────────────────────────────────────────
alter table public.members       enable row level security;
alter table public.sessions      enable row level security;
alter table public.gate_settings enable row level security;
alter table public.gate_audit    enable row level security;
-- 故意唔開任何 policy ＝ 默認拒絕（只有 service_role 穿得過 RLS）

revoke all on public.members, public.sessions, public.gate_settings, public.gate_audit from anon, authenticated;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname in ('gate_now','assert_password_ok','assert_owner','login_member','change_own_password',
                         'touch_session','session_is_active','session_info','owner_create_member',
                         'owner_bulk_create','owner_reset_password','owner_kick','owner_block','owner_delete',
                         'purge_sessions')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
    execute format('grant execute on function %s to service_role', f.sig);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────
-- 8. 一次性：建立你自己（第一個 owner）
--    改 username／密碼再跑；跑完**即刻喺後台改密碼**（must_change_pw = true）
-- ─────────────────────────────────────────────────────────────
-- insert into public.members (username, display_name, role, password_hash, must_change_pw)
-- values ('owner', '你的名', 'owner', crypt('ChangeThisNow-2026', gen_salt('bf', 12)), true);

-- 常用巡邏 SQL
-- 睇誰在線：select m.username, m.display_name, m.status, s.device, s.last_seen_at
--           from public.members m left join public.sessions s
--             on s.member_id = m.id and s.revoked_at is null order by s.last_seen_at desc nulls last;
-- 睇頻繁被踢（疑似共用帳號）：select target_username, count(*) from public.gate_audit
--           where action='kick' and at > now() - interval '30 days' group by 1 order by 2 desc;
-- 睇鎖定：select username, failed_count, locked_until from public.members where locked_until > now();
