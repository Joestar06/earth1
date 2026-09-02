-- ============================================================
-- 「加入我们」表单收件表
--
-- 安全前提：这张表里全是真实姓名、邮箱、公司等个人数据。
-- 所以 RLS 打开且【不建任何 policy】——anon 与 authenticated
-- 一行都读不到、写不了。只有 service_role 能写，而 service_role
-- 的密钥只存在于 Edge Function 的环境变量里，永远不进浏览器。
--
-- 查看数据：Supabase 后台 Table Editor（走的是 service_role，不受 RLS 限制）。
-- ============================================================

create table if not exists public.join_submissions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- 表单内容
  relation    text        not null,
  name        text        not null,
  email       text        not null,
  org         text,
  region      text,
  link        text,
  bring       text,
  goal        text,
  work        text,

  -- 合规：PDPA 要求能证明用户同意过
  consent     boolean     not null default false,

  -- 运维用
  status      text        not null default 'new',
  notes       text,
  source      text,
  user_agent  text,
  -- 只存哈希，不存明文 IP：限流够用，又不多留一份个人数据
  ip_hash     text,

  -- 长度约束在数据库层再挡一道，不只靠 Edge Function
  constraint relation_len check (char_length(relation) <= 60),
  constraint name_len     check (char_length(name) between 1 and 120),
  constraint email_len    check (char_length(email) between 3 and 254),
  constraint email_shape  check (position('@' in email) > 1),
  constraint org_len      check (org    is null or char_length(org)    <= 200),
  constraint region_len   check (region is null or char_length(region) <= 100),
  constraint link_len     check (link   is null or char_length(link)   <= 500),
  constraint bring_len    check (bring  is null or char_length(bring)  <= 4000),
  constraint goal_len     check (goal   is null or char_length(goal)   <= 4000),
  constraint work_len     check (work   is null or char_length(work)   <= 4000),
  constraint status_vals  check (status in ('new','reading','replied','archived','spam'))
);

comment on table  public.join_submissions is '加入我们页面的投递与合作意向。含个人数据，受 PDPA 约束。';
comment on column public.join_submissions.consent is '提交时用户是否勾选了同意条款。PDPA 举证用，不要改。';
comment on column public.join_submissions.ip_hash is 'IP 的 SHA-256，仅用于限流。不存明文。';

create index if not exists join_submissions_created_idx  on public.join_submissions (created_at desc);
create index if not exists join_submissions_relation_idx on public.join_submissions (relation);
create index if not exists join_submissions_status_idx   on public.join_submissions (status);
-- 限流查询用：按 ip_hash 找最近一小时的提交
create index if not exists join_submissions_ip_time_idx  on public.join_submissions (ip_hash, created_at desc);

-- 关键一步：开 RLS，且不建 policy。默认拒绝一切。
alter table public.join_submissions enable row level security;

-- 明确收回前端角色的权限，双保险
revoke all on public.join_submissions from anon, authenticated;

-- service_role 绕得过 RLS，但绕不过表级 GRANT。
-- 用 SQL Editor 建表时这条授权不一定会自动带上，缺了就是
--   permission denied for table join_submissions
-- Edge Function 需要 insert（写入）和 select（限流计数）。
grant select, insert, update on public.join_submissions to service_role;
grant usage, select on all sequences in schema public to service_role;

-- 让 PostgREST 立刻认识这张新表，省得等缓存自己刷新
notify pgrst, 'reload schema';
