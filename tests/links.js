const { chromium } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';

async function clickAndGo(p, url, selector, nth = 0) {
  await p.goto(url, { waitUntil: 'domcontentloaded' });
  const el = (await p.$$(selector))[nth];
  const label = (await el.textContent()).trim().replace(/\s+/g, ' ').slice(0, 24);
  await Promise.all([p.waitForNavigation({ waitUntil: 'domcontentloaded' }), el.click()]);
  const last = p.url().split('/').pop();
  // ?plan=... のような引き継ぎは飛び先の判定から外す
  return { label, dest: last.split('?')[0], query: last.includes('?') ? last.split('?')[1] : '' };
}

(async () => {
  const b = await chromium.launch(require('./launch'));
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });

  let r = await clickAndGo(p, B + 'index.html', '.hero__cta a:not([href^="tel:"])');
  ck(`トップ「${r.label}」`, r.dest === 'reserve.html', r.dest);

  const n = (await (await p.goto(B + 'service.html')) && await p.$$eval('.plan .btn', a => a.length));
  for (let i = 0; i < n; i++) {
    r = await clickAndGo(p, B + 'service.html', '.plan .btn', i);
    ck(`料金「${r.label}」`, r.dest === 'reserve.html', r.dest);
    ck(`料金「${r.label}」がプランと時間を持っていく`,
       /(^|&)plan=[^&]+/.test(r.query) && /(^|&)hours=[^&]+/.test(r.query), r.query);
  }
  r = await clickAndGo(p, B + 'service.html', '.calc__out .btn');
  ck(`試算「${r.label}」`, r.dest === 'reserve.html', r.dest);
  ck(`試算「${r.label}」がプランと時間を持っていく`,
     /(^|&)plan=[^&]+/.test(r.query) && /(^|&)hours=[^&]+/.test(r.query), r.query);

  r = await clickAndGo(p, B + 'faq.html', '.faq__more a');
  ck(`FAQ「${r.label}」`, r.dest === 'reserve.html', r.dest);

  r = await clickAndGo(p, B + 'reserve.html', '.check a');
  ck(`同意欄「${r.label}」`, r.dest === 'privacy.html', r.dest);

  // 全ページの全リンクを総当たり
  const pages = ['index','service','flow','voice','faq','reserve','thanks','privacy','tokushoho'];
  const dead = [];
  for (const s of pages) {
    await p.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    const hrefs = await p.$$eval('a[href]', a => [...new Set(a.map(x => x.getAttribute('href')))]);
    for (const h of hrefs) {
      if (/^(https?:|mailto:|tel:|data:)/.test(h)) continue;
      const [path, frag] = h.split('#');
      if (path) {
        const res = await p.request.get(B + path);
        if (!res.ok()) dead.push(`${s}.html → ${h} (${res.status()})`);
      }
      if (!path && frag) {
        const found = await p.evaluate(f => !!document.getElementById(f), frag);
        if (!found) dead.push(`${s}.html → #${frag}`);
      }
    }
  }
  ck('全9ページの全リンクが有効', dead.length === 0, dead.join(' / '));

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
