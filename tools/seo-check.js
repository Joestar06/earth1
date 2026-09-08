/* ============================================================
   SEO 自检

   对着执行方案第十九条的验收清单，把「本地能验的」全部跑一遍。
   剩下那些（Search Console 截图、PageSpeed、Core Web Vitals、
   收录数量）必须等站点真正上线、且在你们自己的账号里做，
   本脚本查不了，最后会明确列出来，不假装通过。

   命令：npm run seo:check
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO = path.resolve(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo.config.json'), 'utf8'));
const ORIGIN = CFG.origin.replace(/\/$/, '');

const pass = [], warn = [], fail = [];
const ok = (m, x) => pass.push(m + (x ? '  → ' + x : ''));
const no = (m, x) => fail.push(m + (x ? '  → ' + x : ''));
const hm = (m, x) => warn.push(m + (x ? '  → ' + x : ''));

/* ---------- 1. 基础文件 ---------- */
['robots.txt', 'sitemap.xml', '404.html'].forEach((f) => {
  fs.existsSync(path.join(REPO, f)) ? ok('存在 ' + f) : no('缺少 ' + f);
});

const robots = fs.existsSync(path.join(REPO, 'robots.txt'))
  ? fs.readFileSync(path.join(REPO, 'robots.txt'), 'utf8') : '';
/* 最常见也最致命的错误：一条 Disallow: / 把整站从搜索引擎里抹掉 */
/^\s*Disallow:\s*\/\s*$/m.test(robots)
  ? no('robots.txt 有 Disallow: / —— 整站会被拒绝收录')
  : ok('robots.txt 没有屏蔽整站');
/Googlebot|Bingbot/i.test(robots) && /Disallow:\s*\//i.test(robots)
  ? hm('robots.txt 里对 Googlebot/Bingbot 有 Disallow，确认是有意的')
  : ok('robots.txt 没有单独屏蔽 Googlebot / Bingbot');
robots.includes('Sitemap:') ? ok('robots.txt 声明了 Sitemap') : no('robots.txt 没有声明 Sitemap');

/* ---------- 2. sitemap ---------- */
const sm = fs.existsSync(path.join(REPO, 'sitemap.xml'))
  ? fs.readFileSync(path.join(REPO, 'sitemap.xml'), 'utf8') : '';
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok('sitemap 收录 ' + locs.length + ' 条 URL');
locs.filter((u) => !u.startsWith(ORIGIN)).forEach((u) => no('sitemap 里有跨域 URL', u));
/* sitemap 里的地址必须真的存在，否则提交后一堆 404 */
locs.forEach((u) => {
  let rel = u.replace(ORIGIN, '') || '/';
  if (rel.endsWith('/')) rel += 'index.html';
  const f = rel.replace(/^\//, '');
  if (!fs.existsSync(path.join(REPO, f))) no('sitemap 指向不存在的文件', u);
});
/* noindex 的页面不该出现在 sitemap 里，这是自相矛盾的信号 */
CFG.pages.filter((p) => p.noindex).forEach((p) => {
  const anyIn = CFG.locales.some((l) => locs.includes(ORIGIN + (l.prefix || '') + p.path));
  anyIn ? no('noindex 的页面却在 sitemap 里', p.file)
        : ok('noindex 页面已排除出 sitemap', p.file);
});

/* ---------- 3. 逐页检查 ---------- */
const titles = new Map(), descs = new Map();
/* 两套语言树都要查 */
const htmls = [
  ...fs.readdirSync(REPO).filter((f) => f.endsWith('.html')),
  ...(fs.existsSync(path.join(REPO, 'zh'))
    ? fs.readdirSync(path.join(REPO, 'zh')).filter((f) => f.endsWith('.html')).map((f) => 'zh/' + f)
    : []),
];

htmls.forEach((f) => {
  const doc = new JSDOM(fs.readFileSync(path.join(REPO, f), 'utf8')).window.document;
  const t = (doc.querySelector('title') || {}).textContent || '';
  const d = (doc.querySelector('meta[name="description"]') || { getAttribute: () => '' }).getAttribute('content') || '';
  const can = doc.querySelector('link[rel="canonical"]');
  const h1 = doc.querySelectorAll('h1');

  if (!t) no(f + ' 没有 title');
  else {
    titles.set(t, (titles.get(t) || 0) + 1);
    /* Google 桌面端标题大约 60 个字符后截断，中文按两倍宽算 */
    const wide = [...t].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0);
    if (wide > 62) hm(f + ' 标题偏长，搜索结果里可能被截断', wide + ' 字宽');
  }

  if (!d) no(f + ' 没有 description');
  else {
    descs.set(d, (descs.get(d) || 0) + 1);
    const wide = [...d].reduce((n, c) => n + (c.charCodeAt(0) > 255 ? 2 : 1), 0);
    if (wide > 320) hm(f + ' 描述偏长', wide + ' 字宽');
    if (wide < 80 && !/404/.test(f)) hm(f + ' 描述偏短，摘要信息量不足', wide + ' 字宽');
  }

  if (!can) no(f + ' 没有 canonical');
  else if (!can.getAttribute('href').startsWith(ORIGIN)) no(f + ' canonical 指向站外', can.getAttribute('href'));

  /* h1 必须且只能有一个——方案第十四条 */
  if (h1.length === 0) no(f + ' 没有 h1');
  else if (h1.length > 1) no(f + ' 有 ' + h1.length + ' 个 h1，应该只有 1 个');

  if (!doc.querySelector('script[type="application/ld+json"]')) no(f + ' 没有 JSON-LD');
  if (!doc.querySelector('meta[property="og:title"]')) no(f + ' 没有 Open Graph');
  if (!doc.querySelector('link[rel="alternate"][hreflang="x-default"]')) no(f + ' 没有 x-default hreflang');
  if (doc.querySelector('meta[name="keywords"]')) no(f + ' 还有 meta keywords（Google 早已不用，方案第十七条要求删掉）');

  /* 正文必须在 HTML 里就有，不能只靠 JS 渲染出来——方案第九条 */
  const body = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  const isNoindex = !!doc.querySelector('meta[name="robots"][content*="noindex"]');
  /* noindex 的页面（比如 404）本来就不该有长正文，不按这个门槛卡 */
  if (!isNoindex && body.length < 300) no(f + ' HTML 里正文只有 ' + body.length + ' 字，爬虫看不到内容');
  if (!isNoindex && body.length >= 300) ok(f.padEnd(15) + 'HTML 里就有 ' + body.length + ' 字正文');

  /* 内容图必须有 alt；装饰图（品牌标识、光球）留空才是对的 */
  const bad = [...doc.querySelectorAll('img')].filter((i) => {
    if (i.getAttribute('alt')) return false;
    const n = (i.getAttribute('src') || '').split('/').pop();
    return !/^(earthory-mark|earthory-orb)\./.test(n);
  });
  if (bad.length) hm(f + ' 有 ' + bad.length + ' 张内容图缺 alt',
    bad.map((i) => (i.getAttribute('src') || '').split('/').pop()).join(', '));
});

[...titles.entries()].filter(([, n]) => n > 1)
  .forEach(([t, n]) => no('title 重复 ' + n + ' 次（每页必须唯一）', t));
[...descs.entries()].filter(([, n]) => n > 1)
  .forEach(([d, n]) => no('description 重复 ' + n + ' 次', d.slice(0, 40) + '…'));
if (![...titles.values()].some((n) => n > 1)) ok('所有 title 互不相同', titles.size + ' 个');

/* ---------- 4. 内链 ---------- */
/* 孤岛页面爬虫爬不到，也传不到权重 */
const linked = new Set();
htmls.forEach((f) => {
  const doc = new JSDOM(fs.readFileSync(path.join(REPO, f), 'utf8')).window.document;
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h && !/^(https?:|mailto:|tel:|#)/.test(h)) linked.add(h.split('#')[0].split('?')[0]);
  });
});
CFG.pages.filter((p) => !p.noindex && p.file !== 'index.html').forEach((p) => {
  linked.has(p.file) ? ok('有内链指向 ' + p.file) : no(p.file + ' 是孤岛页面，站内没有任何链接指向它');
});

/* ---------- 5. hreflang 成对性 ---------- */
/* 单向的 hreflang Google 会整组忽略：A 指向 B，B 必须指回 A，
   而且两边都要有指向自己的那一条。 */
CFG.pages.filter((p) => !p.noindex).forEach((p) => {
  CFG.locales.forEach((loc) => {
    let rel = (loc.prefix || '') + p.path;
    if (rel.endsWith('/')) rel += 'index.html';
    const f = path.join(REPO, rel.replace(/^\//, ''));
    if (!fs.existsSync(f)) return;
    const doc = new JSDOM(fs.readFileSync(f, 'utf8')).window.document;
    const got = [...doc.querySelectorAll('link[rel="alternate"][hreflang]')]
      .map((a) => a.getAttribute('hreflang'));
    const want = CFG.locales.map((l) => l.hreflang).concat('x-default');
    const miss = want.filter((h) => !got.includes(h));
    if (miss.length) no(rel + ' 缺 hreflang', miss.join(', '));
  });
});
const anyOk = CFG.locales.length > 1;
if (anyOk && !fail.some((m) => /hreflang/.test(m))) {
  ok('hreflang 双向成对且含 x-default', CFG.locales.map((l) => l.hreflang).join(' ↔ '));
}

/* 站内链接不能指向不存在的文件（按所在目录解析） */
htmls.forEach((f) => {
  const dir = path.dirname(path.join(REPO, f));
  const doc = new JSDOM(fs.readFileSync(path.join(REPO, f), 'utf8')).window.document;
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (!h || /^(https?:|mailto:|tel:|#|\/\/)/.test(h)) return;
    const target = h.startsWith('/')
      ? path.join(REPO, h.replace(/^\//, ''))
      : path.join(dir, h);
    const clean = target.split('#')[0].split('?')[0];
    const final = clean.endsWith(path.sep) || clean.endsWith('/')
      ? path.join(clean, 'index.html') : clean;
    if (!fs.existsSync(final)) no('站内死链  ' + f + ' → ' + h);
  });
});

/* ---------- 输出 ---------- */
console.log('\n===== SEO 自检 =====\n');
pass.forEach((m) => console.log('  ✓ ' + m));
if (warn.length) { console.log(''); warn.forEach((m) => console.log('  ⚠ ' + m)); }
if (fail.length) { console.log(''); fail.forEach((m) => console.log('  ✗ ' + m)); }
console.log('\n  ' + pass.length + ' 通过 / ' + warn.length + ' 提示 / ' + fail.length + ' 失败');

console.log('\n===== 本地验不了，必须上线后在你们账号里做 =====');
[
  'Google Search Console 绑定域名并提交 sitemap.xml',
  'Bing Webmaster Tools 同上',
  'Google Rich Results Test 验证结构化数据',
  'PageSpeed Insights / Core Web Vitals（LCP、INP、CLS）',
  '实际收录数量（site:earthory.com）',
  '301 重定向规则（裸域 → www，http → https）',
].forEach((m) => console.log('  □ ' + m));
console.log('');

process.exitCode = fail.length ? 1 : 0;
