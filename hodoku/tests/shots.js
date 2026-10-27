// 画面の撮影と、かんたんな検査（横にはみ出していないか・JSのエラー・画像の読み込み）
// 使い方: node tests/shots.js [ページ名...]   → tests/shots/ に保存
const { chromium, devices } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json' };
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index', 'first', 'symptoms', 'menu', 'reserve', 'en', 'privacy', '404'];
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]).replace(/\/$/, '/index.html'));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);
(async () => {
  const port = srv.address().port, out = path.join(__dirname, 'shots');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  let problems = 0;
  for (const [label, opt] of [['pc', { viewport: { width: 1440, height: 900 } }], ['sp', devices['iPhone 13']]]) {
    const ctx = await b.newContext({ ...opt, timezoneId: 'Asia/Tokyo', locale: 'ja-JP' });
    for (const name of pages) {
      const p = await ctx.newPage(), errs = [];
      p.on('pageerror', e => errs.push(e.message));
      p.on('console', m => { if (m.type() === 'error' && !/maps|google/.test(m.text())) errs.push(m.text()); });
      await p.goto(`http://localhost:${port}/${name}.html`, { waitUntil: 'networkidle' }).catch(() => {});
      await p.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach(i => { i.loading = 'eager'; }));
      await p.evaluate(() => document.querySelectorAll('iframe[loading=lazy]').forEach(f => { f.loading = 'eager'; f.src = f.src; }));
      await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
      await p.evaluate(() => document.fonts.ready);
      // ふわっと出る要素を全部出してから撮る
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')); });
      await p.waitForTimeout(2500);
      const info = await p.evaluate(() => ({
        over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src),
        h: document.body.scrollHeight, vh: innerHeight,
      }));
      if (info.over > 0 || info.broken.length || errs.length) { problems++; console.log('NG', label, name, JSON.stringify({ over: info.over, broken: info.broken, errs })); }
      else console.log('ok', label, name, `${(info.h / info.vh).toFixed(1)}画面`);
      await p.screenshot({ path: path.join(out, `${name}-${label}-fv.jpg`), quality: 80, type: 'jpeg' });
      await p.screenshot({ path: path.join(out, `${name}-${label}-full.jpg`), quality: 70, type: 'jpeg', fullPage: true });
      await p.close();
    }
    await ctx.close();
  }
  await b.close(); srv.close();
  process.exit(problems ? 1 : 0);
})();
