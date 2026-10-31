// 全ページをPCとスマホで撮る（tests/out/ に保存）。横にはみ出していないかも確かめる
const { chromium } = require('playwright');
const path = require('path');
const pages = ['index', 'first', 'menu', 'staff', 'reserve', 'en', 'privacy', '404'];
(async () => {
  const b = await chromium.launch();
  const out = path.join(__dirname, 'out');
  require('fs').mkdirSync(out, { recursive: true });
  for (const [w, h, n] of [[1440, 900, 'pc'], [390, 844, 'sp']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    for (const pg of pages) {
      await p.goto('file://' + path.join(__dirname, '..', pg + '.html'));
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
      await p.waitForTimeout(800);
      const sw = await p.evaluate(() => document.documentElement.scrollWidth);
      if (sw > w) console.log('はみ出し', n, pg, sw);
      await p.screenshot({ path: `${out}/${pg}-${n}-fv.jpg`, type: 'jpeg', quality: 70 });
      await p.screenshot({ path: `${out}/${pg}-${n}-full.jpg`, type: 'jpeg', quality: 50, fullPage: true });
    }
    if (errs.length) console.log('JSエラー', errs);
  }
  await b.close();
  console.log('撮影おわり');
})();
