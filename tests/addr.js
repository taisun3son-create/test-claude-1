const { chromium } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';
const PAGES = ['index','service','flow','voice','faq','reserve','thanks','privacy','tokushoho'];

(async () => {
  const b = await chromium.launch(require('./launch'));
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });

  /* ---- 1. 公開URL ---- */
  const SITE = 'https://taisun3son-create.github.io/test-claude-1';
  const bad = [];
  for (const s of PAGES) {
    await p.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    const m = await p.evaluate(() => ({
      canon: (document.querySelector('link[rel=canonical]') || {}).href || '',
      ogurl: (document.querySelector('meta[property="og:url"]') || {}).content || '',
      ogimg: (document.querySelector('meta[property="og:image"]') || {}).content || ''
    }));
    for (const [k, v] of Object.entries(m)) {
      if (!v.startsWith(SITE + '/')) bad.push(`${s}:${k}=${v || '(なし)'}`);
    }
  }
  ck('URL: 全9ページの canonical / og:url / og:image が公開URL', bad.length === 0, bad.join(' '));
  ck('URL: example.com がどこにも残っていない',
     bad.length === 0 && !(await p.content()).includes('example.com'));

  const sm = await (await p.request.get(B + 'sitemap.xml')).text();
  const rb = await (await p.request.get(B + 'robots.txt')).text();
  // thanks.html は noindex なので sitemap には載せない。残り8ページ
  const locs = (sm.match(/<loc>([^<]*)<\/loc>/g) || []).map(x => x.replace(/<\/?loc>/g, ''));
  ck('URL: sitemap.xml が公開URL',
     locs.length === 8 && locs.every(u => u.startsWith(SITE + '/')), `${locs.length}件`);
  ck('URL: sitemap に noindex のページを載せていない',
     !locs.some(u => u.endsWith('thanks.html')));
  ck('URL: robots.txt の Sitemap 行が公開URL', rb.includes(SITE + '/sitemap.xml'));
  ck('URL: 末尾が二重スラッシュになっていない', !sm.includes('//index.html') && !sm.includes(SITE + '//'));

  /* ---- 2. 住所 ---- */
  const leftovers = [];
  for (const s of PAGES) {
    await p.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    const t = await p.evaluate(() => document.body.innerText);
    if (/記入してください/.test(t)) leftovers.push(s);
  }
  ck('住所: 「記入してください」が残っていない', leftovers.length === 0, leftovers.join(','));

  await p.goto(B + 'index.html', { waitUntil: 'networkidle' });
  const addr = await p.$eval('.foot address', e => e.innerText.replace(/\s+/g, ' ').trim());
  ck('住所: フッターに市までと断り書きがある',
     /愛知県瀬戸市/.test(addr) && /架空/.test(addr) && /0561-00-0000/.test(addr), addr);

  const small = await p.$eval('.foot address small', e => parseFloat(getComputedStyle(e).fontSize));
  const copy = await p.$eval('.foot__copy', e => parseFloat(getComputedStyle(e).fontSize));
  ck('住所: 断り書きが13px以上', small >= 13, `${small}px`);
  ck('住所: フッター最下段も13px以上', copy >= 13, `${copy}px`);

  await p.goto(B + 'tokushoho.html', { waitUntil: 'domcontentloaded' });
  const tk = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  ck('住所: 特商法に代表者・所在地・メールの行がある',
     /代表者/.test(tk) && /所在地/.test(tk) && /メールアドレス/.test(tk));
  ck('住所: 特商法も架空だと明記', /架空/.test(tk));

  // でっち上げた番地・氏名・メールが入っていないこと
  const fake = [];
  for (const s of PAGES) {
    await p.goto(B + s + '.html', { waitUntil: 'domcontentloaded' });
    const t = await p.evaluate(() => document.body.innerText);
    // 「瀬戸市○○町1-2-3」のような番地表記
    if (/[0-9０-９]+[-−ー－][0-9０-９]+[-−ー－][0-9０-９]+/.test(t.replace(/0561-00-0000/g, ''))) fake.push(s + ':番地らしき表記');
    // 本物のメールアドレス
    if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(t)) fake.push(s + ':メールアドレス');
  }
  ck('住所: それらしい番地やメールアドレスを作っていない', fake.length === 0, fake.join(' '));

  /* ---- 3. 構造化データ ---- */
  await p.goto(B + 'index.html', { waitUntil: 'domcontentloaded' });
  const ld = await p.evaluate(() => {
    const s = [...document.querySelectorAll('script[type="application/ld+json"]')];
    const all = s.flatMap(x => { const d = JSON.parse(x.textContent); return d['@graph'] || [d]; });
    return all.find(n => n['@type'] === 'LocalBusiness') || null;
  });
  ck('構造化データ: LocalBusiness がある', ld !== null);
  ck('構造化データ: 住所は県と市まで（嘘の番地を入れていない）',
     ld && ld.address && ld.address.addressLocality === '瀬戸市' &&
     !ld.address.streetAddress && !ld.address.postalCode,
     ld ? JSON.stringify(ld.address) : '');
  ck('構造化データ: url が公開URL', ld && ld.url === SITE + '/', ld && ld.url);
  ck('構造化データ: image が公開URLの絶対パス', ld && ld.image === SITE + '/assets/og.jpg', ld && ld.image);

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
