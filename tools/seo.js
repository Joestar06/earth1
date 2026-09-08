/* ============================================================
   全站 SEO 元数据生成（中英双语）

   一份配置（tools/seo.config.json）驱动三样东西：
     · 每个 HTML 的 <head>：title / description / canonical /
       hreflang / Open Graph / Twitter Card / JSON-LD
     · robots.txt
     · sitemap.xml（含 hreflang 交叉引用）

   为什么要生成而不是手写：现在有 18 个页面（9 页 × 2 语言）。
   手工维护的话，改一次域名要改 18 处 canonical、18 处 og:url、
   36 条 hreflang，还要同步 sitemap。漏一处就是一个指向错地址的
   canonical——那比没有 canonical 更糟。

   hreflang 必须成对且互指：英文页要指回中文页，中文页也要指回英文页，
   两边还都要有 x-default。只写单向的话 Google 会直接忽略整组声明。

   命令：npm run seo
   幂等：head 里由本脚本管理的区段夹在注释标记之间，每次整段重写。
   ============================================================ */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, 'seo.config.json'), 'utf8'));
const ORIGIN = CFG.origin.replace(/\/$/, '');
const LOCALES = CFG.locales;
const DEFAULT = LOCALES.find((l) => l.default) || LOCALES[0];

const BEGIN = '<!-- SEO:BEGIN 由 tools/seo.js 生成，不要手改。改 tools/seo.config.json 后跑 npm run seo -->';
const END = '<!-- SEO:END -->';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* 语言前缀 + 页面路径 → 完整 URL */
function urlFor(loc, p) {
  if (p === '/') return ORIGIN + (loc.prefix || '') + '/';
  return ORIGIN + (loc.prefix || '') + p;
}
/* 语言前缀 + 页面路径 → 仓库里的文件 */
function fileFor(loc, page) {
  return path.join(REPO, (loc.prefix || '').replace(/^\//, ''), page.file);
}

/* ---------- JSON-LD ---------- */
function jsonld(page, loc) {
  const org = CFG.organization;
  const orgId = ORIGIN + '/#organization';
  const siteId = ORIGIN + '/#website';
  const self = urlFor(loc, page.path);
  const t = page[loc.id];

  const organization = {
    '@type': 'Organization',
    '@id': orgId,
    name: org.name,
    legalName: org.legalName,
    url: ORIGIN + '/',
    description: org.description,
    logo: { '@type': 'ImageObject', url: ORIGIN + org.logo },
    email: org.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: org.locality,
      addressCountry: org.country,
    },
  };
  /* sameAs 为空就整个不输出。写一个空数组等于告诉爬虫
     「这家公司没有任何官方账号」，不如不说。 */
  if (org.sameAs && org.sameAs.length) organization.sameAs = org.sameAs;

  const graph = [
    organization,
    {
      '@type': 'WebSite',
      '@id': siteId,
      url: ORIGIN + '/',
      name: org.name,
      description: org.description,
      publisher: { '@id': orgId },
      inLanguage: LOCALES.map((l) => l.htmlLang),
    },
    {
      '@type': 'WebPage',
      '@id': self + '#webpage',
      url: self,
      name: t.title,
      description: t.description,
      isPartOf: { '@id': siteId },
      about: { '@id': orgId },
      inLanguage: loc.htmlLang,
    },
  ];

  /* 首页不做面包屑——它就是根，给自己做一条只有一项的面包屑是噪音 */
  if (page.breadcrumb && page.breadcrumb.length) {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': self + '#breadcrumb',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: urlFor(loc, '/') },
        ...page.breadcrumb.map(([name, p], i) => ({
          '@type': 'ListItem', position: i + 2, name, item: urlFor(loc, p),
        })),
      ],
    });
  }

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

/* ---------- head 区段 ---------- */
function head(page, loc) {
  const t = page[loc.id];
  const canonical = urlFor(loc, page.path);
  const ogImage = ORIGIN + '/assets/earthory-og.png';
  const L = [];

  L.push(BEGIN);
  L.push('<title>' + esc(t.title) + '</title>');
  L.push('<meta name="description" content="' + esc(t.description) + '">');
  L.push('<link rel="canonical" href="' + canonical + '">');
  if (page.noindex) L.push('<meta name="robots" content="noindex,follow">');

  /* hreflang 必须每种语言都列出来，而且每个页面都要列全，
     还要包含指向自己的那一条——只写「另一种语言」是常见错误，
     Google 会因为缺少自指而忽略整组。 */
  LOCALES.forEach((l) => {
    L.push('<link rel="alternate" hreflang="' + l.hreflang + '" href="' + urlFor(l, page.path) + '">');
  });
  L.push('<link rel="alternate" hreflang="x-default" href="' + urlFor(DEFAULT, page.path) + '">');

  L.push('<meta property="og:type" content="website">');
  L.push('<meta property="og:site_name" content="' + esc(CFG.organization.name) + '">');
  L.push('<meta property="og:locale" content="' + loc.ogLocale + '">');
  LOCALES.filter((l) => l.id !== loc.id).forEach((l) => {
    L.push('<meta property="og:locale:alternate" content="' + l.ogLocale + '">');
  });
  L.push('<meta property="og:url" content="' + canonical + '">');
  L.push('<meta property="og:title" content="' + esc(t.title) + '">');
  L.push('<meta property="og:description" content="' + esc(t.description) + '">');
  L.push('<meta property="og:image" content="' + ogImage + '">');
  L.push('<meta property="og:image:alt" content="Earthory — AI Memory">');
  L.push('<meta name="twitter:card" content="summary_large_image">');
  L.push('<meta name="twitter:title" content="' + esc(t.title) + '">');
  L.push('<meta name="twitter:description" content="' + esc(t.description) + '">');
  L.push('<meta name="twitter:image" content="' + ogImage + '">');
  L.push('<script type="application/ld+json">' + jsonld(page, loc) + '</script>');
  L.push(END);

  return L.join('\n');
}

/* ---------- 改写单个 HTML ---------- */
const STRIP = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name="description"[^>]*>\s*/gi,
  /<meta\s+name="robots"[^>]*>\s*/gi,
  /<meta\s+name="keywords"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
  /<link\s+rel="alternate"\s+hreflang[^>]*>\s*/gi,
  /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
  /<meta\s+name="twitter:[^"]*"[^>]*>\s*/gi,
  /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
];

function rewrite(page, loc) {
  const file = fileFor(loc, page);
  if (!fs.existsSync(file)) return { skipped: path.relative(REPO, file) };
  let html = fs.readFileSync(file, 'utf8');

  /* 连同前后空白一起删掉上一次生成的整段，否则每跑一次
     </head> 前就多一个空行，文件会一直长胖。 */
  html = html.replace(new RegExp('\\s*' + BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    + '[\\s\\S]*?' + END + '\\s*', 'g'), '\n');
  STRIP.forEach((re) => { html = html.replace(re, ''); });

  /* 语言标记必须和内容一致，否则读屏软件和搜索引擎会按错的语言处理 */
  html = html.replace(/<html\s+lang="[^"]*"/i, '<html lang="' + loc.htmlLang + '"');

  const block = head(page, loc);
  if (!/<\/head>/i.test(html)) throw new Error(path.relative(REPO, file) + ' 没有 </head>');
  html = html.replace(/\s*<\/head>/i, '\n' + block + '\n</head>');

  fs.writeFileSync(file, html, 'utf8');
  return { file: path.relative(REPO, file).replace(/\\/g, '/'), title: page[loc.id].title };
}

/* ---------- robots.txt ---------- */
function robots() {
  const txt = [
    '# Earthory — ' + ORIGIN,
    '# 由 tools/seo.js 生成，改 tools/seo.config.json 后跑 npm run seo',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    '# 构建产物和后端源码没有被访问的必要，也不该出现在搜索结果里',
    'Disallow: /supabase/',
    'Disallow: /tools/',
    '',
    'Sitemap: ' + ORIGIN + '/sitemap.xml',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPO, 'robots.txt'), txt, 'utf8');
  return txt.split('\n').length;
}

/* ---------- sitemap.xml ---------- */
/* 每条 URL 都带上全部语言版本的 xhtml:link，这是 Google 认可的
   多语言 sitemap 写法，比只靠页面里的 hreflang 更稳。 */
function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const items = [];
  CFG.pages.filter((p) => p.inSitemap !== false && !p.noindex).forEach((p) => {
    LOCALES.forEach((loc) => {
      if (!fs.existsSync(fileFor(loc, p))) return;
      items.push([
        '  <url>',
        '    <loc>' + urlFor(loc, p.path) + '</loc>',
        ...LOCALES.map((l) => '    <xhtml:link rel="alternate" hreflang="' + l.hreflang
          + '" href="' + urlFor(l, p.path) + '"/>'),
        '    <xhtml:link rel="alternate" hreflang="x-default" href="' + urlFor(DEFAULT, p.path) + '"/>',
        '    <lastmod>' + today + '</lastmod>',
        '    <changefreq>' + (p.changefreq || 'monthly') + '</changefreq>',
        '    <priority>' + (p.priority || '0.5') + '</priority>',
        '  </url>',
      ].join('\n'));
    });
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- 由 tools/seo.js 生成。加页面请改 tools/seo.config.json 后跑 npm run seo -->',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...items,
    '</urlset>',
    '',
  ].join('\n');
  fs.writeFileSync(path.join(REPO, 'sitemap.xml'), xml, 'utf8');
  return items.length;
}

/* ---------- 跑 ---------- */
console.log('生成 SEO 元数据（' + LOCALES.map((l) => l.id).join(' / ') + '）\n');
const seen = new Map();
let bad = 0;

LOCALES.forEach((loc) => {
  console.log('  [' + loc.id + ']');
  CFG.pages.forEach((p) => {
    const r = rewrite(p, loc);
    if (r.skipped) { console.log('    · ' + r.skipped + ' 不存在，跳过'); return; }
    console.log('    ✓ ' + r.file.padEnd(20) + r.title);
    seen.set(r.title, (seen.get(r.title) || 0) + 1);
  });
});

const dupes = [...seen.entries()].filter(([, n]) => n > 1);
if (dupes.length) {
  console.log('\n  ✗ 有重复的 title（每页每语言必须唯一）：');
  dupes.forEach(([t, n]) => console.log('    ' + n + '× ' + t));
  bad++;
}

console.log('\n  robots.txt   ' + robots() + ' 行');
console.log('  sitemap.xml  ' + sitemap() + ' 条 URL');
console.log('\n' + (bad ? '有问题' : '完成'));
process.exitCode = bad ? 1 : 0;
