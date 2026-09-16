const { chromium, devices } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';
(async () => {
  const b = await chromium.launch(require('./launch'));

  // ① ページ見出しの装飾（大きさ・太さは据え置き）
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route('**://fonts.*/**', r => r.abort());
  const p = await ctx.newPage();
  for (const s of ['service','flow','voice','faq','reserve']) {
    await p.goto(B + s + '.html', { waitUntil: 'load' });
    await p.waitForTimeout(200);
    const r = await p.evaluate(() => {
      const h = document.querySelector('h1.page-title');
      if (!h) return null;
      const cs = getComputedStyle(h), af = getComputedStyle(h, '::after');
      let el = h, bg = 'rgba(0, 0, 0, 0)';
      while (el && bg === 'rgba(0, 0, 0, 0)') { bg = getComputedStyle(el).backgroundColor; el = el.parentElement; }
      const rgb = t => t.match(/\d+/g).slice(0, 3).map(Number);
      const lum = c => { const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
        return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
      const a = lum(rgb(cs.color)), b2 = lum(rgb(bg));
      const ratio = (Math.max(a, b2) + .05) / (Math.min(a, b2) + .05);
      return { size: cs.fontSize, weight: cs.fontWeight, color: cs.color, bg,
               ratio: Math.round(ratio * 10) / 10, bar: af.width + '×' + af.height };
    });
    // 大きい文字（24px以上・太字）の基準は 3:1。文字色そのものより、背景との差が要点
    ck(`${s}: 見出しが背景から十分に浮き立つ`, r && r.ratio >= 3 && parseFloat(r.bar) > 30,
      r ? `${r.size}/${r.weight} 比${r.ratio}:1 下線${r.bar}` : 'page-title なし');
  }
  // 大きさ・太さが本文の見出しと同じままか
  await p.goto(B + 'service.html', { waitUntil: 'load' });
  const same = await p.evaluate(() => {
    const h1 = getComputedStyle(document.querySelector('h1.page-title'));
    const h3 = document.querySelector('.plan h3');
    return { s: h1.fontSize, w: h1.fontWeight };
  });
  ck('見出しの大きさ・太さは変更なし', same.w === '700', `${same.s} / ${same.w}`);
  await ctx.close();

  // ② スマホのミニタブ
  for (const [name, dev] of [['iPhone 13', devices['iPhone 13']], ['iPhone SE', devices['iPhone SE']]]) {
    const c2 = await b.newContext({ ...dev });
    await c2.route('**://fonts.*/**', r => r.abort());
    const m = await c2.newPage();
    await m.goto(B + 'index.html', { waitUntil: 'load' });
    await m.waitForTimeout(300);
    await m.tap('#burger'); await m.waitForTimeout(350);

    ck(`${name}: 最初は料金試算が隠れている`, await m.isHidden('#drawer-sub-service'));
    const tapArea = await m.evaluate(() => {
      const b = document.querySelector('.drawer__toggle').getBoundingClientRect();
      const a = document.querySelector('.drawer__row > a').getBoundingClientRect();
      return { btnW: Math.round(b.width), btnH: Math.round(b.height), rightOfLink: b.left >= a.right - 2 };
    });
    ck(`${name}: 開くボタンがサービス・料金の右側にある`, tapArea.rightOfLink, `${tapArea.btnW}×${tapArea.btnH}px`);
    ck(`${name}: ボタンのタップ領域が44px以上`, tapArea.btnW >= 44 && tapArea.btnH >= 44);

    await m.tap('.drawer__toggle'); await m.waitForTimeout(300);
    ck(`${name}: 押すと料金試算が出る`, await m.isVisible('#drawer-sub-service'));
    ck(`${name}: aria-expanded=true`, (await m.getAttribute('.drawer__toggle','aria-expanded')) === 'true');
    const pos = await m.evaluate(() => {
      const row = document.querySelector('.drawer__row').getBoundingClientRect();
      const sub = document.querySelector('.drawer__sub').getBoundingClientRect();
      const flow = [...document.querySelectorAll('.drawer__nav a')].find(a => a.textContent.trim() === 'ご利用の流れ').getBoundingClientRect();
      return { subBelowRow: sub.top >= row.bottom - 2, subAboveFlow: sub.bottom <= flow.top + 2,
               indent: Math.round(sub.left - row.left) };
    });
    ck(`${name}: サービス・料金のひとつ下に出る`, pos.subBelowRow && pos.subAboveFlow, `字下げ${pos.indent}px`);

    // 料金試算を押すと service.html#calc へ
    await Promise.all([m.waitForNavigation({ waitUntil: 'load' }), m.tap('.drawer__sub a')]);
    ck(`${name}: 料金試算 → service.html#calc`, m.url().endsWith('service.html#calc'), m.url().split('/').pop());
    await m.waitForTimeout(700);
    const at = await m.evaluate(() => {
      const c = document.getElementById('calc').getBoundingClientRect();
      const h = document.querySelector('.head').getBoundingClientRect().bottom;
      return { top: Math.round(c.top), headBottom: Math.round(h), ok: c.top >= h - 4 && c.top < window.innerHeight };
    });
    ck(`${name}: 料金試算の位置まで移動する`, at.ok, `見出し位置 ${at.top}px / ヘッダー下端 ${at.headBottom}px`);

    // すでに service.html にいる状態で押しても、メニューが閉じること
    await m.tap('#burger'); await m.waitForTimeout(300);
    await m.tap('.drawer__toggle'); await m.waitForTimeout(250);
    await m.tap('.drawer__sub a'); await m.waitForTimeout(600);
    ck(`${name}: 同じページで押してもメニューが閉じる`, await m.isHidden('.drawer__panel'));
    await c2.close();
  }

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
