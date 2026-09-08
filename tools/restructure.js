/* ============================================================
   目录重构：英文进根目录，中文进 /zh/

   为什么英文在根而不是 /en/：
   静态托管（GitHub Pages 之类）做不了服务端 301，根目录只能是一个
   真实页面。要让英文当主语言，它就必须占住 /。在 / 放一个跳转到
   /en/ 的 meta refresh，等于把全站最值钱的 URL 浪费掉。

   为什么资源路径要改成绝对：
   earthory.js 里的图片是 ./assets/… 相对路径，中文页搬进 /zh/ 之后
   会解析成 /zh/assets/… 而 404。改成 /assets/… 之后，两套语言树用
   完全相同的相对内链就能各自正确——/zh/x.html 里的 hardware.html
   自然指向 /zh/hardware.html。

   代价：不能再用 file:// 直接双击打开，必须起 http 服务。
   反正读 pricing-config.json 本来就需要，已经在文档里写明。

   命令：node tools/restructure.js
   幂等：重复跑不会重复搬（已经在 /zh/ 就跳过）。
   ============================================================ */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const ZH = path.join(REPO, 'zh');

/* 中文源页 → 英文生成页。React 三页没有 .en.html，
   它们的英文版靠换 script 引用实现。 */
const STATIC = ['how', 'privacy', 'careers', 'pricing', 'download', '404'];
const REACT = ['index', 'hardware', 'app'];

/* ---------- 1. 资源路径绝对化 ---------- */
function absolutize(src) {
  return src
    .replace(/(["'(])\.\/assets\//g, '$1/assets/')
    .replace(/(["'(])assets\//g, '$1/assets/')
    .replace(/(src|href)="(earthory[^"]*\.(?:js|css))"/g, '$1="/$2"')
    .replace(/(src|href)="(favicon\.ico)"/g, '$1="/$2"')
    .replace(/(src|href)="(pricing-config[^"]*\.json)"/g, '$1="/$2"');
}

let n = 0;
/* JS 包和 CSS 里的资源引用 */
['earthory.js', 'earthory.css', 'earthory-motion.css', 'earthory-pages.css'].forEach((f) => {
  const p = path.join(REPO, f);
  const before = fs.readFileSync(p, 'utf8');
  const after = absolutize(before);
  if (before !== after) { fs.writeFileSync(p, after, 'utf8'); n++; }
});
console.log('资源路径绝对化：' + n + ' 个文件');

/* ---------- 2. 建 /zh/ ---------- */
if (!fs.existsSync(ZH)) fs.mkdirSync(ZH, { recursive: true });

/* ---------- 3. 中文页搬进 /zh/ ---------- */
let moved = 0;
[...STATIC, ...REACT].forEach((name) => {
  const from = path.join(REPO, name + '.html');
  const to = path.join(ZH, name + '.html');
  if (!fs.existsSync(from)) return;
  /* 已经搬过就不再搬——判断依据是根目录那份是不是英文 */
  const src = fs.readFileSync(from, 'utf8');
  const isEnglish = /<html lang="en"/.test(src);
  if (isEnglish) return;

  let html = absolutize(src);
  /* 中文页加载中文包 */
  html = html.replace(/\/earthory\.en\.js/g, '/earthory.js')
    .replace(/\/earthory-content\.en\.js/g, '/earthory-content.js')
    .replace(/\/earthory-motion\.en\.js/g, '/earthory-motion.js')
    .replace(/\/earthory-pages\.en\.js/g, '/earthory-pages.js');
  fs.writeFileSync(to, html, 'utf8');
  moved++;
});
console.log('中文页搬入 /zh/：' + moved + ' 个');

/* ---------- 4. 英文页进根目录 ---------- */
let placed = 0;
STATIC.forEach((name) => {
  const en = path.join(REPO, name + '.en.html');
  if (!fs.existsSync(en)) return;
  let html = absolutize(fs.readFileSync(en, 'utf8'));
  /* 英文页加载英文包 */
  html = html
    .replace(/\/earthory-motion\.js/g, '/earthory-motion.en.js')
    .replace(/\/earthory-pages\.js/g, '/earthory-pages.en.js')
    .replace(/\/earthory-content\.js/g, '/earthory-content.en.js')
    .replace(/\/earthory\.js/g, '/earthory.en.js');
  fs.writeFileSync(path.join(REPO, name + '.html'), html, 'utf8');
  fs.unlinkSync(en);
  placed++;
});

/* React 三页：从 /zh/ 那份复制外壳，换成英文包，清空预渲染内容 */
REACT.forEach((name) => {
  const zhFile = path.join(ZH, name + '.html');
  if (!fs.existsSync(zhFile)) return;
  let html = fs.readFileSync(zhFile, 'utf8')
    .replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script)/, '<div id="root"></div>')
    .replace(/<html lang="[^"]*"/, '<html lang="en"')
    .replace(/\/earthory-motion\.js/g, '/earthory-motion.en.js')
    .replace(/\/earthory-pages\.js/g, '/earthory-pages.en.js')
    .replace(/\/earthory-content\.js/g, '/earthory-content.en.js')
    .replace(/\/earthory\.js/g, '/earthory.en.js');
  fs.writeFileSync(path.join(REPO, name + '.html'), html, 'utf8');
  placed++;
});
console.log('英文页放入根目录：' + placed + ' 个');

/* ---------- 5. 中文页的 React 外壳清空预渲染，等下一轮重跑 ---------- */
REACT.forEach((name) => {
  const p = path.join(ZH, name + '.html');
  if (!fs.existsSync(p)) return;
  const html = fs.readFileSync(p, 'utf8')
    .replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script)/, '<div id="root"></div>');
  fs.writeFileSync(p, html, 'utf8');
});

console.log('\n目录结构：');
console.log('  /            英文（' + fs.readdirSync(REPO).filter((f) => f.endsWith('.html')).length + ' 页）');
console.log('  /zh/         中文（' + fs.readdirSync(ZH).filter((f) => f.endsWith('.html')).length + ' 页）');
