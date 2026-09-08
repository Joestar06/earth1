/* ============================================================
   从 earthory.js 里抽出所有中文字符串字面量

   压缩过的包没有源码，但字符串字面量还是普通的带引号字符串，
   可以安全地定位和替换。这个脚本负责「找出要翻译的东西」，
   tools/i18n.js 负责「按翻译表生成英文版的包」。

   注意也要抽纯标点的串：首页 h1 是
     "记住现实，" + <br> + "找回" + <span>人生</span> + "。"
   拆成四段，最后那个「。」单独一条。漏掉它，英文版就会多一个句号。

   命令：node tools/i18n-extract.js
   输出：tools/i18n/zh.json（已有翻译的条目不会被覆盖）
   ============================================================ */
const fs = require('fs');
const path = require('path');

const REPO = path.resolve(__dirname, '..');
const OUT_DIR = path.join(__dirname, 'i18n');
/* 两个文件都要：压缩包 + 证据卡文案层 */
const SRCS = ['earthory.js', 'earthory-content.js',
  'earthory-motion.js', 'earthory-pages.js'];

/* 汉字、中文标点、全角字符，命中任一就算需要翻译 */
const CJK = /[一-龥　-〿＀-￯]/;

const src = SRCS.map((f) => fs.readFileSync(path.join(REPO, f), 'utf8')).join('\n');

/* 匹配单/双引号字符串字面量。不跨行，允许转义。 */
const found = new Map();
const re = /(["'])((?:(?!\1)[^\\\r\n]|\\.)*)\1/g;
let m;
while ((m = re.exec(src))) {
  const v = m[2];
  if (v && CJK.test(v)) found.set(v, (found.get(v) || 0) + 1);
}

/* 反引号模板串单独查一遍——里面如果有插值就不能简单替换，
   得先报出来人工看。目前是 0 条。 */
const tpl = [];
const reT = /`((?:[^`\\]|\\.)*)`/g;
while ((m = reT.exec(src))) if (CJK.test(m[1])) tpl.push(m[1]);

const keys = [...found.keys()].sort((a, b) => a.length - b.length);
const totalChars = (src.match(/[一-龥]/g) || []).length;
const covered = keys.reduce((n, s) => n + (s.match(/[一-龥]/g) || []).length, 0);

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, 'zh.json');

/* 已有的翻译不覆盖，只补新出现的键 */
let existing = {};
if (fs.existsSync(outFile)) existing = JSON.parse(fs.readFileSync(outFile, 'utf8'));

const table = {};
keys.forEach((k) => { table[k] = existing[k] !== undefined ? existing[k] : ''; });

fs.writeFileSync(outFile, JSON.stringify(table, null, 2) + '\n', 'utf8');

const done = keys.filter((k) => table[k]).length;
console.log('从 earthory.js 抽取中文字符串');
console.log('  不重复字符串   ' + keys.length + ' 条');
console.log('  汉字覆盖率     ' + (covered / totalChars * 100).toFixed(1) + '%  ('
  + covered + '/' + totalChars + ')');
console.log('  模板串         ' + tpl.length + ' 条' + (tpl.length ? '  ⚠ 需人工确认' : ''));
console.log('  已翻译         ' + done + ' / ' + keys.length);
console.log('\n  写入 ' + path.relative(REPO, outFile));
if (done < keys.length) {
  console.log('  还有 ' + (keys.length - done) + ' 条空着，填完跑 node tools/i18n.js');
}
