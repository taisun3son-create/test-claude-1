const { chromium, devices } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';
(async () => {
  const b = await chromium.launch(require('./launch'));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ja-JP' });
  await ctx.route('**://fonts.*/**', r => r.abort());
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));

  // 1回あたりの時間の欄
  await p.goto(B + 'reserve.html', { waitUntil: 'load' });
  await p.waitForTimeout(300);
  const hours = await p.evaluate(() => {
    const el = document.getElementById('f-hours');
    if (!el) return null;
    return { label: document.querySelector('label[for=f-hours]').textContent.replace(/\s+/g,''),
             opts: [...el.options].map(o => o.text), name: el.name, sel: el.value };
  });
  ck('「1回あたりのご利用時間」の欄がある', !!hours && hours.opts.length === 5, hours ? hours.opts.join('/') : 'なし');
  ck('送信内容に hours が含まれる', hours && hours.name === 'hours');

  // 各プランのボタンから引き継ぐ
  const cases = [
    ['おためしを予約する', 'おためし（2時間 6,400円・交通費込み）', '2時間（最短）'],
    ['このプランで予約する', '定期プラン（週1回）', '2時間（最短）'],
    ['日程を相談する', '単発でのご利用', '2時間（最短）'],
  ];
  for (const [label, wantPlan, wantHours] of cases) {
    await p.goto(B + 'service.html', { waitUntil: 'load' });
    const el = (await p.$$(`.plan .btn`)).find(async () => true);
    const link = await p.locator(`.plan .btn`, { hasText: label }).first();
    await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), link.click()]);
    await p.waitForTimeout(300);
    const got = await p.evaluate(() => ({
      plan: document.getElementById('f-plan').selectedOptions[0].text,
      hours: document.getElementById('f-hours').selectedOptions[0].text,
      note: document.getElementById('prefill').hidden ? null : document.getElementById('prefill').textContent.trim(),
    }));
    ck(`「${label}」→ プランと時間を引き継ぐ`, got.plan === wantPlan && got.hours === wantHours,
      `${got.plan} / ${got.hours}`);
    if (label === 'おためしを予約する') ck('引き継いだ旨のお知らせが出る', !!got.note, got.note ? got.note.slice(0, 40) + '…' : 'なし');
  }

  // 試算の結果を引き継ぐ
  for (const [plan, h, wantPlan, wantHours] of [['biweek','4','定期プラン（隔週）','4時間'], ['spot','5','単発でのご利用','5時間']]) {
    await p.goto(B + 'service.html', { waitUntil: 'load' });
    await p.selectOption('#c-plan', plan);
    await p.selectOption('#c-hours', h);
    await p.waitForTimeout(150);
    const href = await p.getAttribute('#calc-cta', 'href');
    await Promise.all([p.waitForNavigation({ waitUntil: 'load' }), p.click('#calc-cta')]);
    await p.waitForTimeout(300);
    const got = await p.evaluate(() => ({
      plan: document.getElementById('f-plan').selectedOptions[0].text,
      hours: document.getElementById('f-hours').selectedOptions[0].text }));
    ck(`試算(${plan}/${h}時間)→ 引き継ぐ`, got.plan === wantPlan && got.hours === wantHours, `${href} → ${got.plan}/${got.hours}`);
  }

  // 引き継ぎなしで開いたときは何も出ない
  await p.goto(B + 'reserve.html', { waitUntil: 'load' });
  await p.waitForTimeout(250);
  ck('直接開いたときはお知らせを出さない', await p.isHidden('#prefill'));

  // 送信内容に hours が乗ること
  await p.goto(B + 'reserve.html?plan=spot&hours=4', { waitUntil: 'load' });
  await p.waitForTimeout(250);
  const fd = await p.evaluate(() => {
    const f = new FormData(document.getElementById('resform'));
    return { plan: f.get('plan'), hours: f.get('hours') };
  });
  ck('送信データにプランと時間が入る', fd.plan === '単発でのご利用' && fd.hours === '4時間', JSON.stringify(fd));

  ck('JSエラーなし', errs.length === 0, errs.slice(0,2).join(' | '));
  await ctx.close();
  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
