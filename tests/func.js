const { chromium, devices } = require('playwright');
const R = []; const ck = (n, c, e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';
const settle = p => p.evaluate(() => new Promise(r => { let l=-1,s=0;
  (function t(){ if(window.scrollY===l){if(++s>3)return r();} else {s=0;l=window.scrollY;} requestAnimationFrame(t); })(); }));

(async () => {
  const b = await chromium.launch(require('./launch'));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ja-JP' });
  await ctx.route('**://fonts.*/**', r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));

  // 文字サイズ（2段階＋ページをまたいで保持）
  await p.goto(B + 'index.html', { waitUntil: 'domcontentloaded' });
  ck('文字サイズは2段階', (await p.$$('.head .js-fs')).length === 2);
  await p.click('.head .js-fs[data-size="l"]');
  ck('「大」でクラスが付く', (await p.evaluate(() => document.documentElement.className)).includes('fs-l'));
  await p.goto(B + 'service.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(150);
  ck('別ページでも文字サイズを維持', (await p.evaluate(() => document.documentElement.className)).includes('fs-l'));
  await p.click('.head .js-fs[data-size="m"]');

  // 料金試算
  for (const [plan, hours, once] of [['week','2',6400], ['biweek','4',13220], ['spot','5',19050]]) {
    await p.selectOption('#c-plan', plan); await p.selectOption('#c-hours', hours);
    ck(`試算 ${plan}/${hours}h`, (await p.textContent('#c-once')) === once.toLocaleString('ja-JP'), await p.textContent('#c-once'));
  }

  // 料金の整合（単価×2＋交通費＝合計）
  const plans = await p.$$eval('.plan', els => els.map(e => ({
    rate: +e.querySelector('.plan__price b').textContent.replace(/,/g,''),
    total: +(e.querySelector('.plan__total > b').textContent.match(/([\d,]+)円/)[1].replace(/,/g,'')) })));
  ck('4プランとも 単価×2＋900＝合計', plans.length === 4 && plans.every(x => x.rate*2+900 === x.total),
    plans.map(x => `${x.rate}→${x.total}`).join(' '));

  // フォーム検証
  await p.goto(B + 'reserve.html', { waitUntil: 'domcontentloaded' });
  await p.click('#reserve button[type="submit"]'); await settle(p);
  ck('未入力でエラーサマリ', await p.isVisible('#formerr'));
  ck('エラー4件', (await p.$$eval('#formerr-list li', l => l.length)) === 4);
  ck('aria-invalid が付く', (await p.getAttribute('#f-name','aria-invalid')) === 'true');
  await p.fill('#f-name','山田 花子'); await p.fill('#f-tel','123');
  await p.selectOption('#f-area','瀬戸市'); await p.check('#f-agree');
  await p.click('#reserve button[type="submit"]'); await settle(p);
  ck('桁数不足の電話を弾く', (await p.textContent('#f-tel-err')).includes('10〜11桁'));
  await p.fill('#f-tel','0561-11-2233');
  await p.click('#reserve button[type="submit"]'); await settle(p);
  ck('正しい入力で完了表示（送信先未設定時）', await p.isVisible('#done'));

  // 印刷用スタイル
  await p.emulateMedia({ media: 'print' });
  const pr = await p.evaluate(() => ({ head: getComputedStyle(document.querySelector('.head')).display,
    mbar: getComputedStyle(document.querySelector('.mbar')).display }));
  ck('印刷時はヘッダーと固定バーを隠す', pr.head === 'none' && pr.mbar === 'none');
  await p.emulateMedia({ media: 'screen' });
  await ctx.close();

  // スマホ：ドロワー
  const m = await b.newContext({ ...devices['iPhone 13'] });
  await m.route('**://fonts.*/**', r => r.abort());
  const mp = await m.newPage();
  mp.on('pageerror', e => errs.push('mobile: ' + e.message));
  await mp.goto(B + 'faq.html', { waitUntil: 'domcontentloaded' });
  await mp.waitForTimeout(200);
  ck('スマホ: ハンバーガーが見える', await mp.isVisible('#burger'));
  await mp.tap('#burger'); await mp.waitForTimeout(250);
  ck('スマホ: ドロワーが開く', await mp.isVisible('.drawer__panel'));
  ck('スマホ: ドロワーに現在地表示', (await mp.getAttribute('.drawer__nav a[href="faq.html"]','aria-current')) === 'page');
  await mp.click('.drawer__nav a[href="service.html"]');
  await mp.waitForLoadState('domcontentloaded');
  ck('スマホ: ドロワーから遷移できる', mp.url().endsWith('service.html'));
  const ov = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  ck('スマホ: 横スクロールなし', ov <= 0, `${ov}px`);
  // 各ページの長さ
  for (const s of ['index','service','flow','voice','faq','reserve']) {
    await mp.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    await mp.waitForTimeout(200);
    const h = await mp.evaluate(() => [document.documentElement.scrollHeight, window.innerHeight]);
    ck(`スマホ: ${s} の長さ ${(h[0]/h[1]).toFixed(1)}画面`, h[0]/h[1] < 12, `${h[0]}px`);
  }

  ck('JSエラーなし', errs.length === 0, errs.slice(0,2).join(' | '));
  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${R.length-f}/${R.length} passed`);
})();
