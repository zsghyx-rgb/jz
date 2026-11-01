-- ═══════════════════════════════════════════════════════════
-- 记一笔 · Supabase 初始化脚本（可重复执行）
-- 用法：Supabase 控制台 → SQL Editor → 新建查询 → 粘贴全部 → Run
-- ═══════════════════════════════════════════════════════════

-- 1) 记录表：每行一条账户 / 交易 / 计划交易 / 配置，enc 是 App 端加密后的密文
create sequence if not exists public.records_seq;

create table if not exists public.records (
  id         text primary key,                 -- 交易/账户 id；配置为 'config'；账户顺序为 'order:用户名'
  kind       text    not null,                 -- txn | acc | plan | config | order
  owner      text,                             -- 所属用户（配置为空）
  enc        text    not null,                 -- 密文（服务器看不到账目内容）
  ts         bigint  not null default 0,       -- 记录的 updatedAt（毫秒），用于冲突判断
  deleted    boolean not null default false,   -- 软删除标记（墓碑），密文仍保留，可恢复
  seq        bigint  not null default nextval('public.records_seq'),  -- 服务器递增序号，增量同步靠它
  updated_at timestamptz not null default now()
);
create index if not exists records_seq_idx on public.records (seq);

-- 2) 写入守卫：
--    · 已删除的记录不可“复活”（删除优先，与原来的 deletedLog 行为一致）
--    · 带着更旧时间戳的写入会被忽略，旧设备不会覆盖新数据
--    · 每次有效写入都分配新的 seq
create or replace function public.records_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.deleted then return null; end if;
    if new.deleted = false and new.ts < old.ts then return null; end if;
  end if;
  new.seq := nextval('public.records_seq');
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists records_guard_trg on public.records;
create trigger records_guard_trg
  before insert or update on public.records
  for each row execute function public.records_guard();

-- 3) 每日备份表：每天第一次同步时自动对全部记录做一份快照（仍是密文），保留 30 天
create table if not exists public.backups (
  day        date primary key,
  content    jsonb not null,
  row_count  int   not null default 0,
  created_at timestamptz not null default now()
);

create or replace function public.ensure_daily_backup() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.backups where day = current_date) then
    insert into public.backups (day, content, row_count)
    select current_date,
           coalesce(jsonb_agg(jsonb_build_object(
             'id', id, 'kind', kind, 'owner', owner, 'enc', enc,
             'ts', ts, 'deleted', deleted, 'seq', seq)), '[]'::jsonb),
           count(*)
    from public.records;
    delete from public.backups where day < current_date - 30;
  end if;
end $$;

revoke all on function public.ensure_daily_backup() from public;
grant execute on function public.ensure_daily_backup() to authenticated;

-- 4) 行级安全：只有登录用户可读写；匿名（只有 anon key 的人）什么都访问不了
alter table public.records enable row level security;
alter table public.backups enable row level security;

drop policy if exists "records_all_authenticated" on public.records;
create policy "records_all_authenticated" on public.records
  for all to authenticated using (true) with check (true);

drop policy if exists "backups_read_authenticated" on public.backups;
create policy "backups_read_authenticated" on public.backups
  for select to authenticated using (true);

-- 5) 补充：不给任何人直接删除记录的权限（App 只做软删除），防止误操作/脚本误删
revoke delete on public.records from authenticated;
revoke delete on public.backups from authenticated;
