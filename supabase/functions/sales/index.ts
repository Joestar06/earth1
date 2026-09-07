// ============================================================
// POST /sales —— 定价页「联系销售」窗口的收件接口
//
// 和 /join 分开的原因见 migrations/20260907000000_sales_enquiries.sql：
// 想买东西的人和想来上班的人不是同一批，字段和跟进流程都不一样。
//
// 安全模型和 /join 完全一致：
// 前端不持有任何密钥，只调这个函数；service_role 密钥留在服务端；
// 表本身 RLS 拒绝一切，只有本函数写得进去。
//
// 部署（关掉 JWT 校验，公开表单本来就要匿名可提交）：
//   npx supabase functions deploy sales --no-verify-jwt
//
// 需要的环境变量和 join 那个函数共用同一套：
//   ALLOWED_ORIGINS  逗号分隔的允许来源
//   IP_SALT          IP 哈希的盐
//   SALES_MAX_PER_HOUR  同一 IP 每小时上限，不配则默认 8
//                       （比招聘的 MAX_PER_HOUR 放宽，一个公司几个人分别来问是正常的）
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2";

// ---- 配置 ----------------------------------------------------
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const IP_SALT = Deno.env.get("IP_SALT") ?? "";

// 比招聘表单放宽一点：一个公司里几个人分别来问是正常的
const MAX_PER_HOUR = Number(Deno.env.get("SALES_MAX_PER_HOUR") ?? "8");

// 必须和 pricing-config.json 里的 plans[].plan_id 对得上
const PLANS = ["personal", "family", "business", "industrial", "enterprise", "custom"];
const CYCLES = ["monthly", "yearly"];
const TIERS = ["standard", "high", "enterprise"];

// 窗口只问四件事：名字、邮箱、联系方式、用途。
// 公司/职位/地区/时间范围都去掉了——配置那一块已经说清楚要什么，
// 再摆一屏字段只会让人关掉窗口。以后要加回来，
// 表加一列、这里加一行 clean()、窗口加一个 input 就行。
const LIMITS: Record<string, number> = {
  name: 120, email: 254, phone: 40, message: 4000,
};

// 数值字段的上下界，和数据库的 CHECK 约束保持一致
const RANGES: Record<string, [number, number]> = {
  storage_gb: [1, 100000000],
  retention_days: [1, 36500],
  memory_years: [1, 999],
  devices: [1, 1000000],
  seats: [1, 1000000],
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

// 数值一律自己解析并夹在范围内。
// 前端那几个数字是用户能改的输入框，不能信。
function intOrNull(v: unknown, key: string): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const [lo, hi] = RANGES[key];
  const i = Math.round(n);
  if (i < lo || i > hi) return null;
  return i;
}

function priceOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 10000000) return null;
  return Math.round(n * 100) / 100;
}

function pick(v: unknown, allowed: string[]): string | null {
  const s = clean(v, 40);
  return allowed.includes(s) ? (s || null) : null;
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

  const name = clean(body.name, LIMITS.name);
  const email = clean(body.email, LIMITS.email);

  if (!name) return json({ ok: false, error: "请填写名字" }, 400, origin);
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
      .from("sales_enquiries")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);

    if (error) {
      console.error("限流查询失败", error.message);
    } else if ((count ?? 0) >= MAX_PER_HOUR) {
      return json(
        { ok: false, error: "提交太频繁了，请稍后再试，或直接写信到 sales@earthory.com" },
        429,
        origin,
      );
    }
  } else {
    console.warn("IP_SALT 未配置，本次不限流");
  }

  const { error } = await supabase.from("sales_enquiries").insert({
    name,
    email,
    phone: clean(body.phone, LIMITS.phone) || null,

    // 配置快照。全部单独校验过，不直接透传前端给的值。
    plan: pick(body.plan, PLANS),
    billing_cycle: pick(body.billing_cycle, CYCLES),
    storage_gb: intOrNull(body.storage_gb, "storage_gb"),
    retention_days: intOrNull(body.retention_days, "retention_days"),
    memory_years: intOrNull(body.memory_years, "memory_years"),
    devices: intOrNull(body.devices, "devices"),
    seats: intOrNull(body.seats, "seats"),
    ai_tier: pick(body.ai_tier, TIERS),
    est_price: priceOrNull(body.est_price),
    currency: clean(body.currency, 8) || null,

    message: clean(body.message, LIMITS.message) || null,

    consent: true,
    source: clean(body.source, 200) || null,
    user_agent: clean(req.headers.get("user-agent"), 400) || null,
    ip_hash: ipHash,
  });

  if (error) {
    // 不把数据库错误原文回给浏览器，只留在日志里
    console.error("写入失败", error.message);
    return json(
      { ok: false, error: "保存失败，请稍后重试，或直接写信到 sales@earthory.com" },
      500,
      origin,
    );
  }

  return json({ ok: true }, 200, origin);
});
