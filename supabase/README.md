# 「加入我们」表单后端

careers.html 的表单收件后端。一张 Postgres 表 + 一个 Edge Function 当 API。

```
supabase/
  migrations/20260902000000_join_submissions.sql   建表 + RLS
  functions/join/index.ts                          POST /join
```

## 为什么不让前端直连数据库

Supabase 常见做法是前端带 anon key 直接写 PostgREST。这里没这么做，因为
这张表里是真实姓名和邮箱——那种方案的安全性完全押在 RLS 策略写得对不对上，
写错一次就是数据泄露。

现在的做法是：

- 表打开 RLS 且**不建任何 policy** → anon 和 authenticated 一行都读不到、写不了
- 只有 `service_role` 写得进去，而这个密钥只存在 Edge Function 的环境变量里
- 浏览器里一个密钥都没有

看数据走 Supabase 后台的 Table Editor，它用的是 service_role，不受 RLS 限制。

## 部署

需要一个 Supabase 项目。**区域选新加坡**（Southeast Asia），数据留在本地
对 PDPA 更稳妥。

```bash
npm i -D supabase                     # 装到项目里，不用全局装
npx supabase login
npx supabase link --project-ref <你的项目 ref>

# 1. 建表
npx supabase db push

# 2. 配置环境变量
npx supabase secrets set ALLOWED_ORIGINS="https://earthory.com,https://www.earthory.com"
npx supabase secrets set IP_SALT="$(openssl rand -hex 32)"
npx supabase secrets set MAX_PER_HOUR="5"

# 3. 部署接口（--no-verify-jwt：公开表单本来就要匿名可提交）
npx supabase functions deploy join --no-verify-jwt
```

`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 是平台自动注入的，不用手动配。

## 接上前端

部署完拿到函数地址，填进 `earthory-pages.js` 顶部：

```js
var JOIN_API = 'https://<项目 ref>.supabase.co/functions/v1/join';
```

留空的话页面不会坏——会退回「把内容整理好让对方自己复制发邮件」的模式。

## 环境变量

| 变量 | 必填 | 说明 |
|---|---|---|
| `ALLOWED_ORIGINS` | 是 | 允许的来源，逗号分隔。**不配就拒绝所有请求**，不做通配 |
| `IP_SALT` | 是 | IP 哈希的盐。不配则不限流，日志里会有警告 |
| `MAX_PER_HOUR` | 否 | 同一 IP 每小时上限，默认 5 |

本地开发时要把 `http://localhost:8000` 之类加进 `ALLOWED_ORIGINS`。
注意直接双击打开 HTML（`file://`）时 Origin 是 `null`，会被拒绝——
本地测试请用 `python -m http.server` 起一个静态服务。

## 防垃圾提交

三层，都在服务端：

1. **蜜罐** — 表单里有个移出视口的 `company_website` 字段，真人看不到。
   填了就丢弃，但**返回 200** ——让机器人以为成功了，不去换招式重试。
2. **限流** — 同一 IP 哈希每小时最多 `MAX_PER_HOUR` 条。
3. **白名单校验** — `relation` 必须是表单里那 11 个值之一；
   所有字段有长度上限，数据库层还有一遍 CHECK 约束。

量大了再上 Cloudflare Turnstile，在 `Deno.serve` 开头加一次校验即可。

## PDPA

表单收的是个人数据，新加坡《个人数据保护法》适用。已经做的：

- 提交前必须勾选同意，`consent` 字段存进库里，需要举证时拿得出来
- 勾选文案写明了用途、不外传、以及如何要求查阅或删除
- **只存 IP 的 SHA-256**，不存明文——限流够用，又不多留一份个人数据

还需要你们做的：

- **保留期限**。目前没有自动清理。定个期限（比如 24 个月），
  用 `pg_cron` 定期删除，或人工清。
- **删除请求**。有人来信要求删除时，在后台按 email 找到删掉。
- 上线前请法务过一遍勾选处的措辞。

## 查看数据

Supabase 后台 → Table Editor → `join_submissions`。

`status` 字段可以当工作流用：`new` / `reading` / `replied` / `archived` / `spam`。
