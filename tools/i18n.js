/* ============================================================
   生成英文版的 React 包

   earthory.js 是压缩过的产物，没有源码，6000 多字中文烤在里面。
   但字符串字面量还是普通的带引号字符串——把它们按翻译表换掉，
   就能得到一个内容全英文、行为完全一致的包。

   为什么不在运行时替换 DOM 文本：
   那样爬虫拿到的静态 HTML 还是中文（预渲染时倒是能替，但线上
   首屏会闪一下中文再变英文），而且文本节点被 React 重新渲染后
   还要再替一次，越补越乱。在构建时改包，一次到位。

   earthory.js 本身一个字节都不动，中文页面继续用它。
   英文页面加载生成出来的 earthory.en.js。

   命令：node tools/i18n.js
   翻译表：tools/i18n/zh.json（跑 tools/i18n-extract.js 生成骨架）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
/* 压缩包和文案层各生成一份英文版；原文件一个字节都不动 */
const FILES = [
  ['earthory.js', 'earthory.en.js'],
  ['earthory-content.js', 'earthory-content.en.js'],
  ['earthory-motion.js', 'earthory-motion.en.js'],
  ['earthory-pages.js', 'earthory-pages.en.js'],
];
const TABLE = path.join(__dirname, 'i18n', 'zh.json');

const CJK = /[一-龥　-〿＀-￯]/;
const dict = JSON.parse(fs.readFileSync(TABLE, 'utf8'));
const missing = new Set();
let bad = 0;

FILES.forEach(([from, to]) => {
  const src = fs.readFileSync(path.join(REPO, from), 'utf8');
  let replaced = 0;

  /* 逐个字符串字面量重写。整段（含引号）一起换掉，
     用 JSON.stringify 重新生成合法的 JS 字面量——
     英文里有撇号和引号，手工拼引号迟早出事。 */
  const out = src.replace(/(["'])((?:(?!\1)[^\\\r\n]|\\.)*)\1/g, (whole, q, body) => {
    if (!body || !CJK.test(body)) return whole;
    const en = dict[body];
    if (en === undefined || en === '') { missing.add(body); return whole; }
    replaced++;
    return JSON.stringify(en);
  });

  fs.writeFileSync(path.join(REPO, to), out, 'utf8');

  /* 生成完立刻自检：还剩多少中文、语法是否还合法。
     注释里的中文不算——那是给维护者看的说明，不会渲染出去，
     翻译它没有意义。只统计代码里真正会显示的部分。 */
  const stripComments = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
  /* 有意保留中文的条目（翻译表里写成「翻成它自己」）也不算残留。
     语言切换按钮就是这种：英文页上那个按钮必须写「中文」，
     写成 "Chinese" 反而看不懂。 */
  const identity = Object.keys(dict).filter((k) => dict[k] === k);
  let checked = stripComments(out);
  identity.forEach((k) => { checked = checked.split(k).join(''); });

  const leftover = (checked.match(/[一-龥]/g) || []).length;
  const before = (stripComments(src).match(/[一-龥]/g) || []).length;

  console.log('  ' + to.padEnd(26)
    + '替换 ' + String(replaced).padStart(3) + ' 处   '
    + '剩余汉字 ' + String(leftover).padStart(4) + ' / ' + String(before).padEnd(5)
    + (before ? '(' + (100 - leftover / before * 100).toFixed(1) + '% 英文化)' : ''));

  /* 语法必须还是合法的，否则英文站直接白屏 */
  try {
    new (require('vm').Script)(out, { filename: to });
  } catch (e) {
    console.log('     ✗ 语法有问题：' + e.message);
    bad++;
  }

  if (leftover > 0) {
    const re = /[一-龥]+/g;
    let m, shown = 0;
    while ((m = re.exec(out)) && shown < 5) {
      console.log('     残留：…' + out.slice(Math.max(0, m.index - 30),
        m.index + m[0].length + 15).replace(/\n/g, ' ') + '…');
      shown++;
    }
    bad++;
  }
});

console.log('');
if (missing.size) {
  console.log('  ⚠ 翻译表里没有的字符串 ' + missing.size + ' 条：');
  [...missing].slice(0, 20).forEach((s) => console.log('     ' + s));
  console.log('     跑 node tools/i18n-extract.js 补进翻译表');
  bad++;
}
console.log(bad ? '  有 ' + bad + ' 处问题' : '  ✓ 全部通过');
process.exitCode = bad ? 1 : 0;
