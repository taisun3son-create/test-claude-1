const { chromium, devices } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';
(async () => {
  const b = await chromium.launch(require('./launch'));

  // ① 上矢印ボタン
  for (const [name, opt] of [['PC', { viewport: { width: 1280, height: 900 } }],
                             ['スマホ', { ...devices['iPhone 13'] }]]) {
    const ctx = await b.newContext(opt);
    await ctx.route('**://fonts.*/**', r => r.abort());
    const p = await ctx.newPage();
    for (const s of ['service', 'faq', 'reserve']) {
      await p.goto(B + s + '.html', { waitUntil: 'load' });
      await p.waitForTimeout(300);
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await p.waitForTimeout(500);
      await p.click('#totop');
      await p.waitForTimeout(1800);
      const y = await p.evaluate(() => Math.round(window.scrollY));
      ck(`${name}: ${s}.html の上矢印で先頭へ`, y === 0, y + 'px');
    }
    await ctx.close();
  }

  // ② ドロワーの6項目（ツールバーが88px出ていても届くか）
  for (const size of ['m','l']) {
    for (const [name, dev] of [['iPhone 13', devices['iPhone 13']], ['iPhone SE', devices['iPhone SE']]]) {
      const ctx = await b.newContext({ ...dev });
      await ctx.route('**://fonts.*/**', r => r.abort());
      const p = await ctx.newPage();
      await p.addInitScript(s => { try { localStorage.setItem('hidamari-fontsize', s); } catch(e){} }, size);
      await p.goto(B + 'index.html', { waitUntil: 'load' });
      await p.waitForTimeout(300);
      await p.tap('#burger'); await p.waitForTimeout(400);
      const hidden = await p.evaluate(() => [...document.querySelectorAll('.drawer__nav a')]
        .filter(a => a.getBoundingClientRect().bottom > window.innerHeight - 88)
        .map(a => a.textContent.trim()));
      ck(`ドロワー6項目が届く（${name}/文字${size === 'm' ? '標準' : '大'}）`, hidden.length === 0, hidden.join('・'));
      await ctx.close();
    }
  }

  // ③ 電話番号
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://fonts.*/**', r => r.abort());
  const p = await ctx.newPage();
  const pages = ['index','service','flow','voice','faq','reserve','thanks','privacy','tokushoho'];
  let noTel = [], badFmt = [];
  for (const s of pages) {
    await p.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    const r = await p.evaluate(() => {
      const links = [...document.querySelectorAll('a[href^="tel:"]')];
      return { n: links.length, hrefs: [...new Set(links.map(a => a.getAttribute('href')))],
               txt: document.body.innerText.includes('電話番号を記入') };
    });
    if (r.n === 0) noTel.push(s);
    if (r.hrefs.some(h => h !== 'tel:0561000000')) badFmt.push(s + ':' + r.hrefs.join(','));
    if (r.txt) badFmt.push(s + ': 「電話番号を記入」が残っている');
  }
  ck('全ページに電話リンクがある', noTel.length === 0, noTel.join(','));
  ck('電話番号の表記が統一されている', badFmt.length === 0, badFmt.join(' / '));
  await ctx.close();

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
