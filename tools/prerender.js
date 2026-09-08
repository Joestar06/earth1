/* ============================================================
   预渲染 React 页面

   index.html / hardware.html / app.html 原本只有一个空的
   <div id="root"></div> 加一个 290KB 的 JS 包。爬虫拿到的 HTML 里
   没有标题、没有正文、没有链接——SEO 上等于三个空页面。

   Googlebot 现在会执行 JS，但 Bingbot、以及 ChatGPT / Perplexity /
   Claude 这些 AI 抓取器大多不会。而「让 AI 系统认识 Earthory」正是
   这轮 SEO 的核心目标，所以不能赌爬虫会不会跑 JS。

   做法：用 jsdom 在构建时把页面跑出来，把渲染结果写回 #root。
   浏览器打开时 React 仍会接管并重新渲染，视觉完全不变；
   区别只是爬虫和用户第一眼就能拿到真实内容（LCP 也顺带变好）。

   什么时候要重跑：
     earthory.js / earthory-content.js / earthory-motion.js 改了之后。
     命令：npm run prerender

   幂等：每次都从 <div id="root"></div> 的空壳重新生成，
   重复跑不会叠加。
   ============================================================ */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const REPO = path.resolve(__dirname, '..');
/* 两套语言树各三页。URL 要给对——motion.js 靠 location.pathname
   判断当前是不是中文站（语言切换、配置文件路径都依赖它）。 */
const PAGES = [
  ['index.html', '/'],
  ['hardware.html', '/hardware.html'],
  ['app.html', '/app.html'],
  ['zh/index.html', '/zh/'],
  ['zh/hardware.html', '/zh/hardware.html'],
  ['zh/app.html', '/zh/app.html'],
];

/* 这些是 earthory-motion.js 加的运行时装饰，不该进静态 HTML：
   面板和汉堡按钮是挂在 body 上的交互组件，装饰层是纯视觉的空 div。
   页面在浏览器里加载时 motion.js 会自己再建一遍。 */
const RUNTIME_ONLY = [
  '#eo-mnav', '.nav-burger', '.eo-atmo', '.eo-hud',
  '.eo-net', '.eo-rings', '.eo-veil',
];

const SHELL = '<div id="root"></div>';

function render(page, urlPath) {
  const file = path.join(REPO, page);
  let html = fs.readFileSync(file, 'utf8');

  /* 先还原成空壳再渲染，保证幂等 */
  html = html.replace(/<div id="root">[\s\S]*?<\/div>(?=\s*<script)/, SHELL);
  if (!html.includes(SHELL)) {
    throw new Error(page + '：找不到 <div id="root"></div>，结构变了？');
  }

  const dom = new JSDOM(html, {
    url: 'https://www.earthory.com' + urlPath,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const doc = window.document;

  /* jsdom 没有的浏览器 API，补成空实现 */
  window.matchMedia = () => ({
    matches: false, addEventListener() {}, removeEventListener() {},
    addListener() {}, removeListener() {},
  });
  window.IntersectionObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
  window.ResizeObserver = class { constructor() {} observe() {} unobserve() {} disconnect() {} };
  window.scrollTo = () => {};
  window.Element.prototype.scrollIntoView = function () {};

  /* motion.js 也要跑：导航里的「计划和定价」「加入我们」两条链接
     和首页那条品类说明都是它补的，这些对内链和收录有价值。 */
  /* 英文页加载生成出来的英文包，中文页加载原包 */
  const en = !urlPath.startsWith('/zh');
  const bundles = en
    ? ['earthory.en.js', 'earthory-content.en.js', 'earthory-motion.en.js']
    : ['earthory.js', 'earthory-content.js', 'earthory-motion.js'];
  for (const js of bundles) {
    window.eval(fs.readFileSync(path.join(REPO, js), 'utf8'));
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      RUNTIME_ONLY.forEach((sel) => {
        doc.querySelectorAll(sel).forEach((n) => n.remove());
      });
      /* 进场动画的状态标记：留在静态 HTML 里会让内容以透明度 0 起步，
         万一 JS 没跑起来就整页空白。 */
      doc.querySelectorAll('[data-reveal]').forEach((n) => n.removeAttribute('data-reveal'));
      doc.querySelectorAll('[style*="transition-delay"]').forEach((n) => n.removeAttribute('style'));

      const root = doc.getElementById('root');
      const inner = root ? root.innerHTML : '';
      const text = root ? (root.textContent || '').replace(/\s+/g, ' ').trim() : '';

      if (inner.length < 2000) {
        throw new Error(page + '：渲染结果只有 ' + inner.length + ' 字节，太短，可能没渲染成功');
      }

      const out = html.replace(SHELL, '<div id="root">' + inner + '</div>');
      fs.writeFileSync(file, out, 'utf8');

      resolve({
        page,
        bytes: inner.length,
        chars: text.length,
        h1: [...doc.querySelectorAll('#root h1')].map((h) => h.textContent.trim()),
        h2: doc.querySelectorAll('#root h2').length,
        links: doc.querySelectorAll('#root a[href]').length,
        imgs: doc.querySelectorAll('#root img').length,
        /* 装饰图留空 alt 是对的，不算缺失 */
        noAlt: [...doc.querySelectorAll('#root img')].filter((i) => {
          if (i.getAttribute('alt')) return false;
          var f = (i.getAttribute('src') || '').split('/').pop();
          return !/^(earthory-mark|earthory-orb)\./.test(f);
        }).length,
      });
    }, 1200);
  });
}

(async () => {
  console.log('预渲染 React 页面…\n');
  let bad = 0;
  for (const [p, u] of PAGES) {
    try {
      const r = await render(p, u);
      console.log('  ' + r.page.padEnd(18)
        + String(r.bytes).padStart(6) + ' 字节  '
        + String(r.chars).padStart(5) + ' 字  '
        + 'h2×' + String(r.h2).padStart(2) + '  '
        + '链接×' + String(r.links).padStart(2) + '  '
        + '图×' + String(r.imgs).padStart(2)
        + (r.noAlt ? '  ⚠ ' + r.noAlt + ' 张缺 alt' : ''));
      console.log('  ' + ''.padEnd(18) + 'h1: ' + (r.h1.join(' | ') || '（没有 h1！）'));
      if (r.h1.length !== 1) { console.log('  ⚠ h1 数量应该是 1'); bad++; }
    } catch (e) {
      console.log('  ✗ ' + p + '  ' + e.message);
      bad++;
    }
  }
  console.log('\n' + (bad ? '有 ' + bad + ' 处问题' : '全部完成'));
  process.exitCode = bad ? 1 : 0;
})();
