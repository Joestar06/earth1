/* ============================================================
   Earthory Motion Layer — 交互与动画驱动
   纯原生 JS，无依赖。只读取 / 增补 DOM，不改动 React 已有节点结构。
   与 earthory.js 解耦：删掉本文件引用即可完全回退。
   ============================================================ */
(function () {
  'use strict';

  var html = document.documentElement;
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* 与 earthory.js 内部一致的“静态文件模式”判断 */
  var STATIC = location.protocol === 'file:' ||
    /\/(index|hardware|app)\.html$/.test(location.pathname);

  /* 进场节奏总开关：调小 = 更快，调大 = 更慢。
     只影响「元素之间的先后延迟」，单个元素的动画时长在
     earthory-motion.css 顶部的 --eo-d / --eo-d-mask 里调。 */
  var SPEED = 0.5;

  html.classList.add('eo-motion');

  function el(tag, cls) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }
  function each(sel, ctx, fn) {
    var list = (ctx || document).querySelectorAll(sel);
    for (var i = 0; i < list.length; i++) fn(list[i], i);
  }

  /* ==========================================================
     1. 进场遮罩 + 顶部进度条
     ========================================================== */
  var veil = el('div', 'eo-veil');
  var progress = el('div', 'eo-progress');
  document.body.appendChild(veil);
  document.body.appendChild(progress);

  function ready() { html.classList.add('eo-ready'); }

  /* 正常路径：等两帧再揭幕，避免首帧闪烁。
     兜底：后台标签页里 rAF 会被推迟甚至不触发，白幕就会一直盖着页面，
     所以再挂一个定时器和 load 事件，任意一个先到都算数。 */
  requestAnimationFrame(function () { requestAnimationFrame(ready); });
  setTimeout(ready, 400);
  window.addEventListener('load', ready);
  window.addEventListener('pageshow', function () {
    html.classList.remove('eo-leaving');
    ready();
  });

  /* ==========================================================
     2. 滚动进场引擎
     配置顺序 = 匹配优先级；已被祖先/后代认领的元素会自动跳过，
     避免嵌套动画叠加。 [选择器, 类型, 逐个延迟ms, 起始延迟ms]
     ========================================================== */
  var CFG = [
    /* 首页 hero */
    ['.hero-copy .eyebrow', 'up', 0, 0],
    ['.hero h1', 'mask', 0, 120],
    ['.hero-copy > p', 'up', 0, 340],
    ['.hero .hero-actions', 'up', 0, 470],
    ['.hero-orb', 'stage', 0, 180],

    /* 子页 hero */
    ['.subhero .back-link', 'down', 0, 0],
    ['.subhero .eyebrow', 'up', 0, 90],
    ['.subhero h1', 'mask', 0, 190],
    ['.subhero > div:first-child > p', 'up', 0, 400],
    ['.subhero .hero-actions', 'up', 0, 520],
    ['.device-stage', 'stage', 0, 220],
    ['.phone-showcase', 'stage', 0, 220],

    /* 首页主体 */
    ['.product-gateway > a', 'up', 130, 0],
    ['.values .value', 'up', 130, 0],
    ['.section-copy > *', 'up', 90, 0],
    ['.evidence-card', 'right', 0, 150],
    ['.story-gallery > *', 'zoom', 150, 0],
    ['.story-copy > .eyebrow', 'up', 0, 0],
    ['.story-copy > h2', 'mask', 0, 90],
    ['.story-copy > p', 'up', 0, 200],
    ['.timeline > div', 'up', 130, 150],
    ['.recall-copy > .eyebrow', 'up', 0, 0],
    ['.recall-copy > h2', 'mask', 0, 90],
    ['.recall-copy > p', 'up', 0, 200],
    ['.recall-copy > form', 'up', 0, 300],
    ['.beach', 'left', 0, 120],
    ['.world-copy > .eyebrow', 'up', 0, 0],
    ['.world-copy > h2', 'mask', 0, 90],
    ['.world-copy > p', 'up', 0, 200],
    ['.world-copy > a', 'up', 0, 300],
    ['.world-map', 'zoom', 0, 150],

    /* 硬件页 */
    ['.principle-strip > span', 'up', 150, 0],
    ['.space-grid > *', 'up', 100, 0],
    ['.feature-intro > div > .eyebrow', 'up', 0, 0],
    ['.feature-intro > div > h2', 'mask', 0, 90],
    ['.feature-intro > div > p', 'up', 0, 200],
    ['.system-orb', 'stage', 0, 0],
    ['.system-list > *', 'up', 110, 0],
    ['.hub-card', 'zoom', 0, 140],
    ['.hub-section > div:first-child > *', 'up', 90, 0],

    /* App 页 */
    ['.app-statement > .eyebrow', 'up', 0, 0],
    ['.app-statement > h2', 'mask', 0, 90],
    ['.app-statement > p', 'up', 0, 220],
    ['.phone-frame', 'stage', 0, 120],
    ['.flow-list article', 'up', 120, 0],
    ['.app-flow > div:last-child > .eyebrow', 'up', 0, 0],
    ['.app-flow > div:last-child > h2', 'mask', 0, 90],
    ['.app-flow > div:last-child > p', 'up', 0, 200],
    ['.conversation-section > div > .eyebrow', 'up', 0, 0],
    ['.conversation-section > div > h2', 'mask', 0, 90],
    ['.conversation-section > div > p', 'up', 0, 200],
    ['.cap-grid article', 'up', 110, 0],
    ['.app-capabilities > .eyebrow', 'up', 0, 0],
    ['.app-capabilities > h2', 'mask', 0, 90],
    ['.app-capabilities > p', 'up', 0, 200],

    /* 工作方式 / 隐私 / 加入我们（静态页新增组件） */
    ['.flow-stage > *', 'right', 55, 140],
    ['.zone-stage > *', 'up', 120, 200],
    ['.people-stage', 'stage', 0, 220],
    ['.ledger > article', 'up', 140, 0],
    ['.faq details', 'up', 70, 0],
    ['.creed article', 'up', 130, 0],
    ['.contrast article', 'up', 120, 0],
    ['.sensor-parts', 'up', 0, 120],
    ['.role-group > h3', 'up', 0, 0],
    ['.role-group > p', 'up', 0, 70],
    ['.role', 'up', 80, 0],
    ['.ways a', 'up', 55, 0],
    ['.track-head > b', 'up', 0, 0],
    ['.track-head > div > .eyebrow', 'up', 0, 40],
    ['.track-head > div > h2', 'mask', 0, 110],
    ['.track-head > div > p', 'up', 60, 230],
    ['.chipset', 'up', 90, 0],
    ['.family', 'up', 90, 0],
    ['.track-cta', 'up', 0, 120],
    ['.join-form fieldset', 'up', 110, 0],
    ['.photo-band', 'stage', 0, 0],
    ['.photo-duo figure', 'zoom', 120, 0],
    ['.plain-section > .eyebrow', 'up', 0, 0],
    ['.plain-section > h2', 'mask', 0, 80],
    ['.plain-section > h2 + p', 'up', 0, 190],

    /* 公共尾部 */
    ['.privacy > .eyebrow', 'up', 0, 0],
    ['.privacy > h2', 'mask', 0, 90],
    ['.privacy-grid > article', 'up', 95, 0],
    ['.cross-link > *', 'up', 110, 0],
    ['.final-cta > *', 'up', 95, 0],
    ['footer > *', 'up', 90, 0]
  ];

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      show(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px 90px 0px', threshold: 0 }) : null;

  function show(node) {
    node.classList.add('eo-in');
    var wait = (parseFloat(node.style.getPropertyValue('--eo-t')) || 0) + 1000;
    setTimeout(function () {
      node.removeAttribute('data-reveal');   /* 动画结束后卸掉 will-change / clip-path */
      node.style.willChange = '';
    }, wait);
  }

  function tag(node, type, delay) {
    if (node.hasAttribute('data-reveal') || node.dataset.eoDone) return;
    /* 祖先或后代已认领 → 跳过，防止嵌套叠加 */
    if (node.parentElement && node.parentElement.closest('[data-reveal]')) return;
    if (node.querySelector('[data-reveal]')) return;
    node.dataset.eoDone = '1';
    node.setAttribute('data-reveal', type);
    if (delay) node.style.setProperty('--eo-t', delay + 'ms');
    if (REDUCED || !io) { node.classList.add('eo-in'); node.removeAttribute('data-reveal'); return; }
    io.observe(node);
  }

  function scanReveals() {
    for (var c = 0; c < CFG.length; c++) {
      var sel = CFG[c][0], type = CFG[c][1], step = CFG[c][2], base = CFG[c][3];
      var list = document.querySelectorAll(sel);
      var groups = new Map();
      for (var i = 0; i < list.length; i++) {
        var node = list[i];
        if (node.dataset.eoDone) continue;
        var p = node.parentElement;
        var idx = groups.get(p) || 0;
        groups.set(p, idx + 1);
        tag(node, type, Math.round((base + step * idx) * SPEED));
      }
    }
  }

  /* 世界模型 / 时间轴：需要独立触发的整体动画 */
  var io2 = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add(en.target.classList.contains('timeline') ? 'eo-line' : 'eo-in-net');
      io2.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px 60px 0px', threshold: 0.12 }) : null;

  /* ==========================================================
     3. 氛围层注入（hero / subhero）
     ========================================================== */
  function atmosphere(host) {
    if (REDUCED || host.querySelector(':scope > .eo-atmo')) return;
    var wrap = el('div', 'eo-atmo');
    wrap.appendChild(el('span', 'eo-mesh'));
    wrap.appendChild(el('span', 'eo-grid'));
    wrap.appendChild(el('span', 'eo-beam'));
    for (var i = 0; i < 12; i++) {
      var d = el('span', 'eo-dot');
      d.style.left = (6 + Math.random() * 88).toFixed(1) + '%';
      d.style.top = (10 + Math.random() * 78).toFixed(1) + '%';
      d.style.setProperty('--dx', (Math.random() * 60 - 30).toFixed(0) + 'px');
      d.style.setProperty('--dy', (-20 - Math.random() * 60).toFixed(0) + 'px');
      d.style.setProperty('--dur', (10 + Math.random() * 12).toFixed(1) + 's');
      d.style.setProperty('--del', (Math.random() * 6).toFixed(1) + 's');
      wrap.appendChild(d);
    }
    wrap.appendChild(el('span', 'eo-noise'));
    host.appendChild(wrap);
  }

  /* ==========================================================
     4. 影像舞台 HUD：四角取景框 + 扫描线
     ========================================================== */
  function hud(host) {
    if (REDUCED || host.querySelector(':scope > .eo-hud')) return;
    var h = el('div', 'eo-hud');
    for (var i = 0; i < 4; i++) h.appendChild(document.createElement('b'));
    h.appendChild(document.createElement('u'));
    host.appendChild(h);
  }

  /* ==========================================================
     5. 个人世界模型：中心球 → 五个维度的星座连线
     ========================================================== */
  function constellation(map) {
    if (REDUCED) return;
    var orb = map.querySelector('.orb');
    var nodes = map.querySelectorAll('.world-node');
    if (!orb || !nodes.length) return;

    var old = map.querySelector(':scope > .eo-net');
    if (old) old.remove();
    var oldRings = map.querySelector(':scope > .eo-rings');
    if (oldRings) oldRings.remove();

    var r = map.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var ob = orb.getBoundingClientRect();
    var cx = ob.left - r.left + ob.width / 2;
    var cy = ob.top - r.top + ob.height / 2;
    var rad = ob.width / 2 * 0.9;

    /* 同心虚线环 */
    var rings = el('div', 'eo-rings');
    var base = Math.min(r.width, r.height);
    [[0.52, 46, 'normal'], [0.74, 68, 'reverse'], [0.98, 92, 'normal']].forEach(function (cfg) {
      var i = document.createElement('i');
      i.style.setProperty('--s', (base * cfg[0]).toFixed(0) + 'px');
      i.style.setProperty('--sp', cfg[1] + 's');
      i.style.setProperty('--dir', cfg[2]);
      rings.appendChild(i);
    });
    map.appendChild(rings);

    /* 连线 */
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'eo-net');
    svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    map.appendChild(svg); /* 先入文档，getTotalLength 才可靠 */

    for (var i = 0; i < nodes.length; i++) {
      var nb = nodes[i].getBoundingClientRect();
      var ex = nb.left - r.left + nb.width / 2;
      var ey = nb.top - r.top + nb.height / 2;
      var vx = ex - cx, vy = ey - cy;
      var len = Math.sqrt(vx * vx + vy * vy) || 1;
      var sx = cx + vx / len * rad;
      var sy = cy + vy / len * rad;
      /* 中点向法线方向偏移，得到一条柔和的弧 */
      var mx = (sx + ex) / 2 - vy / len * len * 0.14;
      var my = (sy + ey) / 2 + vx / len * len * 0.14;
      var d = 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) +
        ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) +
        ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);

      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', d);
      path.style.setProperty('--d', (i * 0.07).toFixed(2) + 's');
      svg.appendChild(path);
      var total = path.getTotalLength ? path.getTotalLength() : 600;
      path.style.setProperty('--len', total.toFixed(0));

      var dot = document.createElementNS(SVGNS, 'circle');
      dot.setAttribute('class', 'eo-pulse');
      dot.setAttribute('r', '2.6');
      dot.style.offsetPath = 'path("' + d + '")';
      dot.style.setProperty('--d', (0.5 + i * 0.4).toFixed(2) + 's');
      svg.appendChild(dot);

      nodes[i].style.setProperty('--nd', (i * 0.6).toFixed(2) + 's');
    }
    map.dataset.eoNet = '1';
    if (io2) io2.observe(map); else map.classList.add('eo-in-net');
  }

  /* ==========================================================
     6. 指针交互：卡片光斑 / 磁吸按钮 / 轻微 3D 倾斜
     ========================================================== */
  var SPOT = '.value, .hardware-feature, .evidence-card, .hub-card, .product-gateway > a:last-child, .privacy-grid > article';
  var TILT = '.evidence-card, .hub-card';
  var MAG = '.primary, .nav-cta';

  function bindPointer() {
    each(SPOT + ', .cap-grid article', document, function (node) {
      if (node.dataset.eoSpot) return;
      node.dataset.eoSpot = '1';
      if (node.matches(SPOT)) node.classList.add('eo-spot');
      node.addEventListener('pointermove', function (e) {
        var b = node.getBoundingClientRect();
        node.style.setProperty('--mx', ((e.clientX - b.left) / b.width * 100).toFixed(1) + '%');
        node.style.setProperty('--my', ((e.clientY - b.top) / b.height * 100).toFixed(1) + '%');
      });
    });

    if (!REDUCED) each(TILT, document, function (node) {
      if (node.dataset.eoTilt) return;
      node.dataset.eoTilt = '1';
      node.classList.add('eo-tilt');
      node.addEventListener('pointermove', function (e) {
        var b = node.getBoundingClientRect();
        var px = (e.clientX - b.left) / b.width - 0.5;
        var py = (e.clientY - b.top) / b.height - 0.5;
        node.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg');
        node.style.setProperty('--rx', (-py * 5).toFixed(2) + 'deg');
      });
      node.addEventListener('pointerleave', function () {
        node.style.setProperty('--ry', '0deg');
        node.style.setProperty('--rx', '0deg');
      });
    });

    if (!REDUCED) each(MAG, document, function (node) {
      if (node.dataset.eoMag) return;
      node.dataset.eoMag = '1';
      node.addEventListener('pointermove', function (e) {
        var b = node.getBoundingClientRect();
        node.style.setProperty('--tx', ((e.clientX - b.left - b.width / 2) * 0.16).toFixed(1) + 'px');
        node.style.setProperty('--ty', ((e.clientY - b.top - b.height / 2) * 0.26).toFixed(1) + 'px');
      });
      node.addEventListener('pointerleave', function () {
        node.style.setProperty('--tx', '0px');
        node.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ==========================================================
     7. 滚动：进度条 / 吸顶导航 / 背景视差
     ========================================================== */
  var lastY = 0, ticking = false;
  var parallaxNodes = [];

  function collectParallax() {
    parallaxNodes = [].slice.call(document.querySelectorAll('.hero-orb, .device-stage, .system-orb, .people-stage, .photo-band'));
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.pageYOffset || html.scrollTop;
      var vh = window.innerHeight;
      var max = Math.max(1, html.scrollHeight - vh);

      progress.style.setProperty('--eo-p', Math.min(1, y / max).toFixed(4));
      html.classList.toggle('eo-scrolled', y > 60);
      html.classList.toggle('eo-nav-hide', y > 420 && y - lastY > 6);
      lastY = y;

      if (REDUCED) return;
      for (var i = 0; i < parallaxNodes.length; i++) {
        var n = parallaxNodes[i];
        var b = n.getBoundingClientRect();
        if (b.bottom < -200 || b.top > vh + 200) continue;
        var prog = (b.top + b.height / 2 - vh / 2) / vh;
        n.style.setProperty('--eo-py', (prog * 34).toFixed(1) + 'px');
      }
    });
  }

  /* ==========================================================
     8. 站点导航：接入新增的静态页 + 页面切换淡出

     index / hardware / app 三页的导航由 earthory.js 渲染，无法直接改源码，
     因此在这里把「工作方式 / 隐私与安全」指向新页面，并补上「加入我们」入口。
     ========================================================== */
  var PAGES = /^(index|hardware|app|how|privacy|careers|download)\.html/;
  var onIndex = !/\/(hardware|app)\.html$/.test(location.pathname);

  /* 首页锚点 → 独立页面 */
  var ANCHOR_MAP = { '/#how': 'how.html', '/#privacy': 'privacy.html' };
  var NAV_EXTRA = [['careers.html', '加入我们']];
  var FOOT_EXTRA = [['how.html', '工作方式'], ['privacy.html', '隐私与安全'], ['download.html', '下载'], ['careers.html', '加入我们']];

  function addLink(host, href, text, before) {
    if (host.querySelector('a[href="' + href + '"]')) return;
    var a = document.createElement('a');
    a.setAttribute('href', href);
    a.textContent = text;
    a.setAttribute('data-eo-link', '');
    if (before) host.insertBefore(a, before); else host.appendChild(a);
  }

  function fixLinks() {
    each('a[href^="/#"]', document, function (a) {
      var href = a.getAttribute('href');
      if (ANCHOR_MAP[href]) { a.setAttribute('href', ANCHOR_MAP[href]); return; }
      if (!STATIC) return;
      var hash = href.slice(1);
      a.setAttribute('href', onIndex ? hash : 'index.html' + hash);
    });

    var nav = document.querySelector('.nav nav');
    if (nav) NAV_EXTRA.forEach(function (l) { addLink(nav, l[0], l[1]); });

    /* 首页 / App 页首屏的主按钮改成「下载 App」，点了直接去下载页 */
    each('.hero .hero-actions .primary, .app-hero .hero-actions .primary', document, function (b) {
      if (b.tagName === 'A') return;
      b.setAttribute('data-eo-dl', '');
      b.removeAttribute('data-join');
      if (b.textContent.trim() !== '下载 App') b.textContent = '下载 App';
    });

    /* 顶部按钮：首页 / 硬件页 / App 页的「加入早期体验」改成直接去下载页 */
    each('.nav-cta', document, function (b) {
      if (b.textContent.trim() !== '下载') b.textContent = '下载';
      b.removeAttribute('data-join');
    });

    /* 品牌标识：在「Earthory」文字前补上图标（首页 / 硬件页 / App 页由 earthory.js 渲染） */
    each('.brand', document, function (b) {
      if (b.querySelector('.brand-mark')) return;
      var m = document.createElement('img');
      m.className = 'brand-mark';
      m.src = 'assets/earthory-mark.png';
      m.alt = '';
      b.insertBefore(m, b.firstChild);
    });

    var foot = document.querySelector('footer div');
    if (foot) {
      var mail = foot.querySelector('a[href^="mailto:"]');
      FOOT_EXTRA.forEach(function (l) { addLink(foot, l[0], l[1], mail); });
    }

    /* 当前页在导航里高亮（React 页面的 href 是 /hardware 这类路由，需要先归一） */
    var ROUTE = { '/': 'index.html', '/hardware': 'hardware.html', '/app': 'app.html' };
    var file = location.pathname.split('/').pop() || 'index.html';
    each('.nav nav a', document, function (a) {
      var h = a.getAttribute('href');
      if ((ROUTE[h] || h) === file) a.setAttribute('aria-current', 'page');
    });
  }

  if (STATIC) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || a.target === '_blank') return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return;

      var dest = null;
      if (href === '/') dest = 'index.html';
      else if (href === '/hardware') dest = 'hardware.html';
      else if (href === '/app') dest = 'app.html';
      else if (PAGES.test(href)) dest = href;
      if (!dest) return;

      e.preventDefault();
      e.stopPropagation();
      /* 这里在捕获阶段就掐断了事件，面板自己的关闭逻辑收不到，
         所以显式关一次，别让它盖着淡出动画。 */
      mnavClose();
      html.classList.remove('eo-ready');
      html.classList.add('eo-leaving');
      setTimeout(function () { location.href = dest; }, 170);
    }, true);
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.nav-cta, [data-eo-dl]') : null;
    if (!b || b.tagName === 'A') return;
    e.preventDefault();
    e.stopPropagation();
    location.href = 'download.html';
  }, true);

  /* ==========================================================
     8.5 首页「三种日常」场景板块

     首页由 earthory.js 渲染，改不了源码，所以这一段在运行时插进去；
     React 若重新渲染把它冲掉，下一次 scan 会自动补回来。
     要改文案或换图，直接改下面的 SCENES。
     ========================================================== */
  var SCENE_SETS = {
    /* 首页：它帮你记住什么 */
    index: {
      eyebrow: 'IN EVERYDAY LIFE',
      title: '它记住的，都是这些时刻。',
      note: '不是那些宏大的人生节点，而是每天都在发生、过后又想不起来的具体片刻。',
      items: [
        ['scene-dog', 'assets/scene-dog.jpg', '一位男士蹲下迎接跑向他的狗',
         '它今天吃过了吗',
         '散步、喂食、上一次体检是哪天。每天都在发生的小事，攒成一条完整的记录。'],
        ['scene-meeting', 'assets/scene-meeting.jpg', '四个人围坐在会议桌旁讨论',
         '上周答应过什么',
         '会议里说过的话有据可查，不必再翻聊天记录，也不必凭印象争论。'],
        ['scene-reunion', 'assets/scene-reunion.jpg', '一对伴侣在客厅回看他们相遇那天的记忆',
         '我们是怎么认识的',
         '那天的书店、那场雨，还有你从架上抽走的那本书，都还在原地等着。']
      ]
    },
    /* 硬件页：这颗设备平时待在哪 */
    hardware: {
      eyebrow: 'WHERE IT LIVES',
      title: '一颗设备，放在哪儿都在工作。',
      note: 'Earthory One 不需要你为它腾出位置。它待在你本来就会经过的地方，剩下的事自己完成。',
      items: [
        ['scene-dog', 'assets/scene-dog.jpg', '玄关柜上的 Earthory One 与迎上来的狗',
         '玄关的柜子上',
         '门口这一颗记着谁进出、狗什么时候被喂过、钥匙最后放在哪。'],
        ['scene-meeting', 'assets/scene-meeting.jpg', '会议桌上的 Earthory One',
         '会议室的桌上',
         '一次会开完，谁答应了什么、下一步交给谁，事后都查得到。'],
        ['scene-training', 'assets/scene-training.jpg', '跑道边的 Earthory One 正在回放这段时间的训练',
         '跑道边的地上',
         '一趟训练下来，配速、动作和状态都留着，回家复盘不用靠回忆。']
      ]
    }
  };

  var SCENE_SET = (function () {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (f === '' || f === 'index.html') return SCENE_SETS.index;
    if (f === 'hardware.html') return SCENE_SETS.hardware;
    return null;
  })();

  function scenes() {
    if (!SCENE_SET || document.getElementById('eo-scenes')) return;
    var host = document.querySelector('.privacy') || document.querySelector('.final-cta');
    if (!host || !host.parentNode) return;

    var sec = document.createElement('section');
    sec.id = 'eo-scenes';
    sec.className = 'plain-section';
    sec.innerHTML =
      '<span class="eyebrow">' + SCENE_SET.eyebrow + '</span>' +
      '<h2>' + SCENE_SET.title + '</h2>' +
      '<p>' + SCENE_SET.note + '</p>' +
      '<div class="scene-trio">' +
      SCENE_SET.items.map(function (s) {
        return '<figure class="' + s[0] + '">' +
          '<div class="shot"><img src="' + s[1] + '" alt="' + s[2] + '" loading="lazy"></div>' +
          '<figcaption><b>' + s[3] + '</b><span>' + s[4] + '</span></figcaption>' +
          '</figure>';
      }).join('') +
      '</div>';
    host.parentNode.insertBefore(sec, host);
  }

  /* ==========================================================
     8.6 首页品类定位条

     「互联网索引数字世界 / 大模型连接人类知识 / Earthory 建立记忆层」
     首页由 earthory.js 渲染，同样在运行时插进去，插在首屏之后。
     复用 how.html 已有的 .principle-strip 深色样式，不需要新 CSS。
     改文案直接改下面的 CATEGORY。
     ========================================================== */
  var CATEGORY = [
    '互联网索引数字世界。',
    '大模型连接人类知识。',
    'Earthory 建立个人现实世界的记忆层。'
  ];

  function category() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (f !== '' && f !== 'index.html') return;
    if (document.getElementById('eo-category')) return;
    var hero = document.querySelector('.hero');
    if (!hero || !hero.parentNode) return;

    var sec = document.createElement('section');
    sec.id = 'eo-category';
    sec.className = 'principle-strip';
    sec.innerHTML = CATEGORY.map(function (t) {
      return '<span>' + t + '</span>';
    }).join('');
    hero.parentNode.insertBefore(sec, hero.nextSibling);
  }

  /* ==========================================================
     8.7 Earthory One 部件清单（只在硬件页）

     爆炸图本身是 .system-orb 的背景图，换图在 earthory-pages.css。
     这里补的是图下面那段文字清单——图里的标注是烤进像素的，
     手机上看不清，也搜不到、选不中、读屏软件读不出来。
     底部那句免责声明同理，必须是真文字。

     ┌ 改文案就改 PARTS ┐
     ========================================================== */
  var PARTS =
    '透明光学球壳 · 环形传感器组件 · 360° 多摄像头阵列 · 红外与深度传感模组 · ' +
    '周向毫米波雷达阵列 · 麦克风阵列与柔性天线 · 中央惯性测量单元 · 扇形 AI 计算板 · ' +
    '三片对称弧形电池 · 下半球导热承力骨架 · 统一磁吸接口';

  function exploded() {
    var f = (location.pathname.split('/').pop() || '').toLowerCase();
    if (f !== 'hardware.html' && f !== 'hardware') return;
    if (document.getElementById('eo-parts')) return;

    var orb = document.querySelector('.system-orb');
    if (!orb || !orb.parentNode) return;

    /* 背景图没有 alt，给这块加个无障碍描述 */
    orb.setAttribute('role', 'img');
    orb.setAttribute('aria-label',
      'Earthory One 爆炸图：透明光学球壳、环形传感器组件与下半球导热承力骨架');

    var box = document.createElement('p');
    box.id = 'eo-parts';
    box.className = 'sensor-parts';
    box.innerHTML =
      '<b>TARGET HARDWARE ARCHITECTURE · CONCEPT</b>' + PARTS +
      '<em>目标硬件架构概念 · 最终配置以工程实现为准</em>';
    orb.parentNode.insertBefore(box, orb.nextSibling);
  }

  /* ==========================================================
     8.8 移动端导航

     earthory.css 在 max-width:900px 时把 .nav nav 整个 display:none，
     却没有补任何替代入口——手机上除了 logo 和「下载」，五个页面
     全都进不去，只能滚到页脚找链接。这里补一个汉堡菜单。

     首页 / 硬件页 / App 页的导航由 earthory.js 渲染，所以按钮同样
     在运行时插入；面板挂在 body 上，React 重渲染冲不掉它，
     按钮被冲掉了下一次 scan() 会补回来。

     面板里的链接每次打开时从当前 DOM 现读，所以永远和顶部导航一致。
     ========================================================== */
  var MNAV_BREAK = 900;

  function mnavPanel() {
    var panel = document.getElementById('eo-mnav');
    if (panel) return panel;

    panel = el('div', 'eo-mnav');
    panel.id = 'eo-mnav';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', '站点导航');
    /* 面板 z-index 90 盖住 z-index 10 的 .nav，汉堡按钮在底下点不到，
       手机又没有 Esc 键——不给关闭按钮就只能靠点链接离开这一页。 */
    panel.innerHTML =
      '<div class="eo-mnav-top">' +
        '<div class="eo-mnav-brand"></div>' +
        '<button type="button" class="eo-mnav-x" aria-label="关闭菜单">' +
          '<i></i><i></i>' +
        '</button>' +
      '</div>' +
      '<nav class="eo-mnav-list"></nav>';
    panel.querySelector('.eo-mnav-x').addEventListener('click', function (e) {
      e.preventDefault();
      mnavClose();
    });
    document.body.appendChild(panel);
    return panel;
  }

  function mnavFill(panel) {
    /* 顶部放品牌，让面板看起来是页面的一部分而不是浮层 */
    var top = panel.querySelector('.eo-mnav-brand');
    var brand = document.querySelector('.nav .brand');
    top.innerHTML = brand ? brand.outerHTML : '<span class="brand">Earthory</span>';

    var list = panel.querySelector('.eo-mnav-list');
    var arrow = '<svg class="ic" viewBox="0 0 256 256"><use href="#eo-arrow-right"/></svg>';
    var html = '';

    each('.nav nav a', document, function (a) {
      var cur = a.getAttribute('aria-current') === 'page';
      html += '<a href="' + a.getAttribute('href') + '"' +
        (cur ? ' aria-current="page"' : '') + '>' +
        '<span>' + a.textContent.trim() + '</span>' + (cur ? arrow : '') + '</a>';
    });

    /* 下载按钮在移动端本来就看得见，但放进菜单里更完整 */
    html += '<a class="eo-mnav-cta" href="download.html"><span>下载 App</span>' + arrow + '</a>';
    list.innerHTML = html;

    /* 逐条错开出现，和全站其他进场节奏一致 */
    each('a', list, function (a, i) {
      a.style.transitionDelay = REDUCED ? '0s' : (0.04 + i * 0.035) * SPEED + 's';
    });
  }

  var mnavOpener = null;

  function mnavClose() {
    var panel = document.getElementById('eo-mnav');
    if (!panel || !panel.classList.contains('is-open')) return;
    panel.classList.remove('is-open');
    html.classList.remove('eo-mnav-lock');
    each('.nav-burger', document, function (b) {
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-label', '打开菜单');
    });
    if (mnavOpener && mnavOpener.focus) mnavOpener.focus();
    mnavOpener = null;
  }

  function mnavOpen(btn) {
    var panel = mnavPanel();
    mnavFill(panel);
    panel.classList.add('is-open');
    html.classList.add('eo-mnav-lock');
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-label', '关闭菜单');
    mnavOpener = btn;
    var first = panel.querySelector('a');
    if (first) first.focus();
  }

  function mobileNav() {
    var bar = document.querySelector('.nav');
    if (!bar || bar.querySelector('.nav-burger')) return;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-burger';
    btn.setAttribute('aria-label', '打开菜单');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'eo-mnav');
    btn.innerHTML = '<i></i><i></i><i></i>';
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var panel = document.getElementById('eo-mnav');
      if (panel && panel.classList.contains('is-open')) mnavClose();
      else mnavOpen(btn);
    });
    bar.appendChild(btn);
  }

  /* 点了菜单里的链接就关掉：静态页会真的跳转，
     但同页锚点不会，留着面板挡着就成了 bug。 */
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('#eo-mnav a') : null;
    if (a) mnavClose();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.keyCode === 27) mnavClose();
  });

  /* 转屏或拉宽到桌面尺寸时必须收起，否则面板会盖住整站 */
  window.addEventListener('resize', function () {
    if (window.innerWidth > MNAV_BREAK) mnavClose();
  });

  /* ==========================================================
     9. 扫描 / 重扫（React 重渲染后自愈）
     ========================================================== */
  var scanning = false;
  function scan() {
    if (scanning) return;
    scanning = true;
    try {
      fixLinks();
      scenes();
      category();
      exploded();
      mobileNav();
      each('.hero, .subhero', document, atmosphere);
      each('.hero-orb, .device-stage, .system-orb, .people-stage, .photo-band, .phone-showcase, .phone-frame, .hub-card', document, hud);
      each('.world-map', document, function (m) { if (!m.dataset.eoNet) constellation(m); });
      each('.timeline', document, function (t) {
        if (t.dataset.eoLine) return;
        t.dataset.eoLine = '1';
        if (REDUCED || !io2) t.classList.add('eo-line'); else io2.observe(t);
      });
      scanReveals();
      bindPointer();
      collectParallax();
      onScroll();
    } finally {
      scanning = false;
    }
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () { pending = false; scan(); });
  }

  var root = document.getElementById('root');
  if (root) new MutationObserver(schedule).observe(root, { childList: true, subtree: true });

  window.addEventListener('scroll', onScroll, { passive: true });

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      each('.world-map', document, function (m) { delete m.dataset.eoNet; constellation(m); });
      onScroll();
    }, 220);
  });

  scan();
  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('load', function () { schedule(); onScroll(); });

  /* 兜底：若 IntersectionObserver 异常，3 秒后强制显示全部内容 */
  setTimeout(function () {
    each('[data-reveal]:not(.eo-in)', document, function (n) {
      var b = n.getBoundingClientRect();
      if (b.top < window.innerHeight) show(n);
    });
  }, 3000);
})();
