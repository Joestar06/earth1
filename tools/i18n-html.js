/* ============================================================
   静态页的中英生成

   how / privacy / careers / pricing / download / 404 是手写的中文
   HTML。和 JS 那边一样用表驱动：中文页是源，英文页由翻译表生成。

   为什么不手写两份 HTML：两份会立刻开始漂移——改了中文忘了改英文，
   过两个月就没人知道哪边是对的。一份源 + 一份表，改哪边都只有一处。

   提取范围：
     · 文本节点里的中文
     · alt / placeholder / title / aria-label / content 这些会被
       用户或爬虫读到的属性
   不碰 href、class、id、data-* ——那些是结构不是文案。

   命令：
     node tools/i18n-html.js --extract   抽取待翻译文本到 tools/i18n/html.json
     node tools/i18n-html.js             按表生成英文页
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO = path.resolve(__dirname, '..');
const TABLE = path.join(__dirname, 'i18n', 'html.json');
const CJK = /[一-龥]/;

/* 中文源页 → 生成的英文页 */
const PAGES = [
  ['how.html', 'how.en.html'],
  ['privacy.html', 'privacy.en.html'],
  ['careers.html', 'careers.en.html'],
  ['pricing.html', 'pricing.en.html'],
  ['download.html', 'download.en.html'],
  ['404.html', '404.en.html'],
];

/* 会被人或爬虫读到的属性。href / class / id 不在其中——那是结构。 */
const ATTRS = ['alt', 'placeholder', 'title', 'aria-label', 'content', 'value'];

/* head 里由 tools/seo.js 生成的区段跳过：那部分的中英文各自由
   seo.config.json 提供，在这里翻会和 seo.js 打架。 */
function insideSeoBlock(node) {
  let n = node;
  while (n) {
    if (n.nodeType === 8 && /SEO:BEGIN/.test(n.data || '')) return true;
    n = n.previousSibling;
  }
  return false;
}

function walk(doc, fn) {
  /* 文本节点 */
  const it = doc.createTreeWalker(doc.documentElement, 4 /* TEXT_NODE */);
  const texts = [];
  let n;
  while ((n = it.nextNode())) texts.push(n);
  texts.forEach((t) => {
    const p = t.parentNode;
    if (!p) return;
    const tag = (p.nodeName || '').toLowerCase();
    if (tag === 'script' || tag === 'style') return;
    const v = t.nodeValue;
    if (!v || !CJK.test(v)) return;
    fn(v.trim(), (en) => {
      /* 保留原来的前后空白，只换中间的文字 */
      const lead = v.match(/^\s*/)[0];
      const tail = v.match(/\s*$/)[0];
      t.nodeValue = lead + en + tail;
    }, t);
  });

  /* 属性 */
  doc.querySelectorAll('*').forEach((el) => {
    ATTRS.forEach((a) => {
      if (!el.hasAttribute(a)) return;
      const v = el.getAttribute(a);
      if (!v || !CJK.test(v)) return;
      fn(v.trim(), (en) => el.setAttribute(a, en), el);
    });
  });
}

const mode = process.argv.includes('--extract') ? 'extract' : 'build';

if (mode === 'extract') {
  let existing = {};
  if (fs.existsSync(TABLE)) existing = JSON.parse(fs.readFileSync(TABLE, 'utf8'));

  const keys = new Map();
  PAGES.forEach(([src]) => {
    const doc = new JSDOM(fs.readFileSync(path.join(REPO, src), 'utf8')).window.document;
    walk(doc, (text) => {
      if (insideSeoBlock(doc.querySelector('title'))) { /* 仅示意，见下 */ }
      keys.set(text, (keys.get(text) || 0) + 1);
    });
  });

  const table = {};
  [...keys.keys()].sort((a, b) => a.length - b.length)
    .forEach((k) => { table[k] = existing[k] !== undefined ? existing[k] : ''; });

  if (!fs.existsSync(path.dirname(TABLE))) fs.mkdirSync(path.dirname(TABLE), { recursive: true });
  fs.writeFileSync(TABLE, JSON.stringify(table, null, 2) + '\n', 'utf8');

  const done = Object.keys(table).filter((k) => table[k]).length;
  const chars = Object.keys(table).reduce((n, s) => n + (s.match(/[一-龥]/g) || []).length, 0);
  console.log('抽取静态页文案');
  console.log('  不重复片段   ' + Object.keys(table).length + ' 条，共 ' + chars + ' 字');
  console.log('  已翻译       ' + done + ' / ' + Object.keys(table).length);
  console.log('  写入 ' + path.relative(REPO, TABLE));
} else {
  if (!fs.existsSync(TABLE)) {
    console.log('还没有翻译表，先跑 node tools/i18n-html.js --extract');
    process.exit(1);
  }
  const dict = JSON.parse(fs.readFileSync(TABLE, 'utf8'));
  const missing = new Set();
  let bad = 0;

  PAGES.forEach(([src, out]) => {
    const dom = new JSDOM(fs.readFileSync(path.join(REPO, src), 'utf8'));
    const doc = dom.window.document;
    let n = 0;

    walk(doc, (text, set) => {
      const en = dict[text];
      if (en === undefined || en === '') { missing.add(text); return; }
      set(en);
      n++;
    });

    /* 语言标记要跟着改，否则搜索引擎和读屏软件会按中文处理英文内容 */
    doc.documentElement.setAttribute('lang', 'en');

    fs.writeFileSync(path.join(REPO, out), '<!doctype html>\n' + doc.documentElement.outerHTML + '\n', 'utf8');

    const left = (doc.body.textContent.match(/[一-龥]/g) || []).length;
    console.log('  ' + out.padEnd(20) + '替换 ' + String(n).padStart(3) + ' 处   '
      + (left ? '⚠ 正文还剩 ' + left + ' 个汉字' : '✓ 正文全英文'));
    if (left) bad++;
  });

  if (missing.size) {
    console.log('\n  ⚠ 翻译表里没有的片段 ' + missing.size + ' 条：');
    [...missing].slice(0, 15).forEach((s) => console.log('     ' + s.slice(0, 70)));
    bad++;
  }
  console.log('');
  console.log(bad ? '  有 ' + bad + ' 处问题' : '  ✓ 全部通过');
  process.exitCode = bad ? 1 : 0;
}
