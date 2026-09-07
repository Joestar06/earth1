-- ============================================================
-- 销售线索表
--
-- 为什么单独一张表，不并进 join_submissions：
-- 那张表是「加入我们」——求职、KOL、媒体、研究合作。
-- 想买东西的人和想来上班的人是两回事：跟进的人不同、
-- 要问的字段不同、状态机也不同（招聘看的是有没有回复，
-- 销售看的是报价到成单走到哪一步了）。混在一张表里，
-- 两边的人都得先过滤掉一半不相干的行。
--
-- 安全前提和 join_submissions 完全一致：
-- 表里是真实姓名、邮箱和联系方式，属于个人数据。
-- RLS 打开且【不建任何 policy】——anon 与 authenticated
-- 一行都读不到、写不了。只有 service_role 能写，而 service_role
-- 的密钥只存在于 Edge Function 的环境变量里，永远不进浏览器。
--
-- 查看数据：Supabase 后台 Table Editor。
-- ============================================================

create table if not exists public.sales_enquiries (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  -- 联系人。窗口一共只问四样：名字、邮箱、联系方式，加下面的 message（用途）。
  -- 公司/职位/地区/时间范围刻意不收：配置快照那一块已经说清楚客户要什么，
  -- 再多问几屏只会拉低填写率。要加回来是一句 alter table add column。
  name        text        not null,
  email       text        not null,
  phone       text,

  -- 客户点「联系销售」时页面上是哪一档、配的什么
  -- 存快照而不是外键：以后改价格改套餐，历史线索仍要能还原当时看到的东西
  plan            text,
  billing_cycle   text,
  storage_gb      integer,
  retention_days  integer,
  memory_years    integer,
  devices         integer,
  seats           integer,
  ai_tier         text,
  est_price       numeric(10,2),
  currency        text,

  -- 需求：客户自己描述的用途
  message     text,

  -- 合规：PDPA 要求能证明用户同意过
  consent     boolean     not null default false,

  -- 销售跟进
  status      text        not null default 'new',
  owner       text,
  notes       text,

  -- 运维
  source      text,
  user_agent  text,
  -- 只存哈希，不存明文 IP：限流够用，又不多留一份个人数据
  ip_hash     text,

  -- 长度与取值约束在数据库层再挡一道，不只靠 Edge Function
  constraint sales_name_len    check (char_length(name) between 1 and 120),
  constraint sales_email_len   check (char_length(email) between 3 and 254),
  constraint sales_email_shape check (position('@' in email) > 1),
  constraint sales_phone_len   check (phone     is null or char_length(phone)     <= 40),
  constraint sales_message_len check (message   is null or char_length(message)   <= 4000),
  constraint sales_notes_len   check (notes     is null or char_length(notes)     <= 4000),
  constraint sales_cycle_vals  check (billing_cycle is null or billing_cycle in ('monthly','yearly')),
  constraint sales_tier_vals   check (ai_tier is null or ai_tier in ('standard','high','enterprise')),
  constraint sales_storage_rng check (storage_gb     is null or storage_gb     between 1 and 100000000),
  constraint sales_retain_rng  check (retention_days is null or retention_days between 1 and 36500),
  constraint sales_memory_rng  check (memory_years   is null or memory_years   between 1 and 999),
  constraint sales_devices_rng check (devices        is null or devices        between 1 and 1000000),
  constraint sales_seats_rng   check (seats          is null or seats          between 1 and 1000000),
  constraint sales_price_rng   check (est_price      is null or est_price >= 0),
  -- 销售的状态机比招聘长：从报价一路走到成单或流失
  constraint sales_status_vals check (
    status in ('new','contacted','qualified','quoted','won','lost','spam')
  )
);

comment on table  public.sales_enquiries is '定价页的销售线索。含个人数据，受 PDPA 约束。与 join_submissions（招聘/合作）分开。';
comment on column public.sales_enquiries.plan is '客户提交时页面上选中的套餐档位，快照值。';
comment on column public.sales_enquiries.est_price is '提交时页面上显示的预估月费，快照值。不是最终报价。';
comment on column public.sales_enquiries.consent is '提交时用户是否勾选了同意条款。PDPA 举证用，不要改。';
comment on column public.sales_enquiries.ip_hash is 'IP 的 SHA-256，仅用于限流。不存明文。';
comment on column public.sales_enquiries.owner is '跟进人。留给销售自己在后台填。';

create index if not exists sales_enquiries_created_idx on public.sales_enquiries (created_at desc);
create index if not exists sales_enquiries_status_idx  on public.sales_enquiries (status);
create index if not exists sales_enquiries_plan_idx    on public.sales_enquiries (plan);
create index if not exists sales_enquiries_owner_idx   on public.sales_enquiries (owner);
-- 限流查询用：按 ip_hash 找最近一小时的提交
create index if not exists sales_enquiries_ip_time_idx on public.sales_enquiries (ip_hash, created_at desc);

-- 关键一步：开 RLS，且不建 policy。默认拒绝一切。
alter table public.sales_enquiries enable row level security;

-- 明确收回前端角色的权限，双保险
revoke all on public.sales_enquiries from anon, authenticated;

-- service_role 绕得过 RLS，但绕不过表级 GRANT。
-- 用 SQL Editor 建表时这条授权不一定会自动带上，缺了就是
--   permission denied for table sales_enquiries
-- Edge Function 需要 insert（写入）和 select（限流计数）。
grant select, insert, update on public.sales_enquiries to service_role;
grant usage, select on all sequences in schema public to service_role;

-- 让 PostgREST 立刻认识这张新表，省得等缓存自己刷新
notify pgrst, 'reload schema';
