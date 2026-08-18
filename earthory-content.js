/* ============================================================
   Earthory Content Layer — 首页 / App 页的证据卡文案

   index.html 与 app.html 的证据卡由已压缩的 earthory.js 渲染，
   而且两处用的是同一个组件，所以原本三个页面显示的是同一条记忆。
   这里在运行时按页面替换文案，让每个页面展示不同类型的提问。

   ┌ 改文案就改下面的 CARDS ┐
   q      问题
   a      答案
   trace  三块轨迹卡片 [时间, 地点, 标签]，第一块会高亮为「最近一次」
   facts  底部四项：时间 / 地点 / 相关的人 / 置信度（顺序固定）
   quote  引述

   how.html 的证据卡用的是照片版，文案直接写在那个 HTML 里。
   ============================================================ */
(function () {
  'use strict';

  var CARDS = {
    'index.html': {
      id: 'keys',
      q: '我的钥匙最后一次出现在哪里？',
      a: '昨天 19:24，你把钥匙放在了玄关的鞋柜上。',
      trace: [
        ['19:24', '家 · 玄关鞋柜', '最近一次'],
        ['18:50', '地下车库', '开车回家'],
        ['09:12', '公司 · 工位', '放进背包']
      ],
      facts: ['19:24', '家·玄关', '你', '高置信度'],
      quote: '“进门时你正在打电话，随手放下之后就没有再动过。”'
    },
    'app.html': {
      id: 'dog',
      q: '狗狗今天喂过了吗？',
      a: '喂过了。今天 08:12，妈妈在厨房喂的。',
      trace: [
        ['今天 08:12', '厨房 · 食盆', '已完成'],
        ['昨天 19:40', '厨房 · 食盆', '晚餐'],
        ['昨天 08:05', '厨房 · 食盆', '早餐']
      ],
      facts: ['08:12', '家·厨房', '妈妈', '高置信度'],
      quote: '“食盆在 08:19 被清空，之后一直没有再添过。”'
    }
  };

  /* 双开路径都要认得：本地文件是 index.html / app.html，
     服务器上走 pushState 时则是 / 与 /app */
  var ROUTE = { '': 'index.html', 'hardware': 'hardware.html', 'app': 'app.html' };
  var file = (location.pathname.split('/').pop() || '').toLowerCase();
  var CARD = CARDS[ROUTE[file] || file];
  if (!CARD) return;

  /* 只替换元素末尾的文字，保留前面的图标节点 */
  function setTail(node, text) {
    if (!node) return;
    var last = node.lastChild;
    if (last && last.nodeType === 3) last.nodeValue = text;
    else node.appendChild(document.createTextNode(text));
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function apply() {
    var card = document.querySelector('.evidence-card');
    if (!card || card.dataset.eoCard === CARD.id) return;

    setTail(card.querySelector('.query'), CARD.q);

    var h3 = card.querySelector('h3');
    if (h3) h3.textContent = CARD.a;

    var thumbs = card.querySelector('.evidence-thumbs');
    if (thumbs) {
      thumbs.className = 'evidence-thumbs is-trace';
      thumbs.innerHTML = CARD.trace.map(function (t, i) {
        return '<div class="trace' + (i === 0 ? ' now' : '') + '">' +
          '<b>' + esc(t[0]) + '</b>' +
          '<span>' + esc(t[1]) + '</span>' +
          '<i>' + esc(t[2]) + '</i></div>';
      }).join('');
    }

    var spans = card.querySelectorAll('.facts span');
    for (var i = 0; i < spans.length && i < CARD.facts.length; i++) {
      setTail(spans[i], CARD.facts[i]);
    }

    var quote = card.querySelector('blockquote');
    if (quote) quote.textContent = CARD.quote;

    card.dataset.eoCard = CARD.id;
  }

  /* React 只在虚拟节点的值变化时才写 DOM，这些文案是常量，
     所以覆盖一次就会一直保留；这里的 observer 只为等它首次渲染完成。 */
  apply();
  var root = document.getElementById('root');
  if (root) new MutationObserver(apply).observe(root, { childList: true, subtree: true });
})();
