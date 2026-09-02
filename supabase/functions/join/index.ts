// ============================================================
// POST /join —— 「加入我们」表单的收件接口
//
// 为什么不让前端直连 PostgREST：
// 那样必须把 anon key 放进页面，安全就全押在 RLS 策略写得对不对上。
// 这张表里是真实姓名和邮箱，策略写错一次就是数据泄露。
// 改成前端只调这个函数，service_role 密钥留在服务端，浏览器里
// 一个密钥都没有；表本身 RLS 拒绝一切，只有本函数写得进去。
//
// 部署（关掉 JWT 校验，公开表单本来就要匿名可提交）：
//   npx supabase functions deploy join --no-verify-jwt
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// ---- 配置 ----------------------------------------------------
// 允许的来源，逗号分隔。必须显式配置，不做通配。
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// IP 哈希的盐。没配就退化成不限流，但会在日志里叫一声。
const IP_SALT = Deno.env.get("IP_SALT") ?? "";

const MAX_PER_HOUR = Number(Deno.env.get("MAX_PER_HOUR") ?? "5");

// 必须和 careers.html 表单里的 radio 取值完全一致
const RELATIONS = [
  "加入团队", "人工智能 / 软件技术", "设备 / 硬件技术", "产品与设备接入",
  "渠道 / 市场", "创作者 / KOL", "媒体 / 公共关系", "研究 / 大学",
  "隐私 / 法务 / 政策", "战略合作", "其他",
];

const LIMITS: Record<string, number> = {
  relation: 60, name: 120, email: 254, org: 200,
  region: 100, link: 500, bring: 4000, goal: 4000, work: 4000,
};

// ---- 工具 ----------------------------------------------------
function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function clean(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // 去掉控制字符，避免把奇怪的东西写进后台表格
  return v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .trim().slice(0, max);
}

async function hashIp(ip: string): Promise<string | null> {
  if (!IP_SALT || !ip) return null;
  const data = new TextEncoder().encode(IP_SALT + "|" + ip);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- 主处理 --------------------------------------------------
Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "只接受 POST" }, 405, origin);
  }
  if (ALLOWED.length === 0) {
    console.error("ALLOWED_ORIGINS 没有配置，拒绝所有请求");
    return json({ ok: false, error: "服务未正确配置" }, 500, origin);
  }
  if (!origin || !ALLOWED.includes(origin)) {
    return json({ ok: false, error: "来源不被允许" }, 403, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "请求格式不正确" }, 400, origin);
  }

  // 蜜罐：真人看不见这个字段，填了的基本是机器人。
  // 返回 200 是故意的——让机器人以为成功了，别换招式重试。
  if (clean(body.company_website, 200)) {
    console.log("honeypot 命中，已丢弃");
    return json({ ok: true }, 200, origin);
  }

  const relation = clean(body.relation, LIMITS.relation);
  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);

  if (!RELATIONS.includes(relation)) {
    return json({ ok: false, error: "关系类型不正确" }, 400, origin);
  }
  if (!name) return json({ ok: false, error: "请填写姓名" }, 400, origin);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ ok: false, error: "邮箱格式不正确" }, 400, origin);
  }
  if (body.consent !== true) {
    return json({ ok: false, error: "需要先同意我们如何使用这些信息" }, 400, origin);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
  const ipHash = await hashIp(ip);

  // 限流：同一个 IP 一小时内最多 MAX_PER_HOUR 条
  if (ipHash) {
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { count, error } = await supabase
      .from("join_submissions")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (error) {
      console.error("限流查询失败", error.message);
    } else if ((count ?? 0) >= MAX_PER_HOUR) {
      return json(
        { ok: false, error: "提交太频繁了，请稍后再试，或直接写信到 hello@earthory.com" },
        429,
        origin,
      );
    }
  } else {
    console.warn("IP_SALT 未配置，本次不限流");
  }

  const { error } = await supabase.from("join_submissions").insert({
    relation,
    name,
    email,
    org: clean(body.org, LIMITS.org) || null,
    region: clean(body.region, LIMITS.region) || null,
    link: clean(body.link, LIMITS.link) || null,
    bring: clean(body.bring, LIMITS.bring) || null,
    goal: clean(body.goal, LIMITS.goal) || null,
    work: clean(body.work, LIMITS.work) || null,
    consent: true,
    source: clean(body.source, 200) || null,
    user_agent: clean(req.headers.get("user-agent"), 400) || null,
    ip_hash: ipHash,
  });

  if (error) {
    // 不把数据库错误原文回给浏览器，只留在日志里
    console.error("写入失败", error.message);
    return json(
      { ok: false, error: "保存失败，请稍后重试，或直接写信到 hello@earthory.com" },
      500,
      origin,
    );
  }

  return json({ ok: true }, 200, origin);
});
