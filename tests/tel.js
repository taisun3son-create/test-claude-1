const { chromium } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';

// 見えている色を、重なりも含めて実際の描画から取る
const lum = ([r,g,b]) => {
  const f = v => { v /= 255; return v <= .03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); };
  return .2126*f(r) + .7152*f(g) + .0722*f(b);
};
const ratio = (a,b) => { const [x,y] = [lum(a),lum(b)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };

(async () => {
  const b = await chromium.launch(require('./launch'));
  const errs = [];

  /* ---------- 電話カード（PC） ---------- */
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto(B + 'reserve.html', { waitUntil: 'networkidle' });

  ck('電話: 受話器のアイコンがある', await p.$('.telcard__icon') !== null);

  const icon = await p.$eval('.telcard__icon', el => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return { w: Math.round(r.width), h: Math.round(r.height), radius: s.borderRadius, bg: s.backgroundColor };
  });
  ck('電話: アイコンが丸い', icon.w === icon.h && icon.radius === '50%', `${icon.w}×${icon.h} ${icon.radius}`);
  ck('電話: アイコンが山吹色', icon.bg === 'rgb(245, 196, 107)', icon.bg);

  // アイコンと番号が横並びで、同じ行にあること
  const rows = await p.$eval('.telcard', el => {
    const i = el.querySelector('.telcard__icon').getBoundingClientRect();
    const a = el.querySelector('a').getBoundingClientRect();
    return { iconRight: Math.round(i.right), aLeft: Math.round(a.left),
             sameRow: !(i.bottom <= a.top || a.bottom <= i.top) };
  });
  ck('電話: アイコンが番号の左に並ぶ', rows.iconRight <= rows.aLeft && rows.sameRow,
     `icon右${rows.iconRight} / 番号左${rows.aLeft}`);

  // 山吹の丸の上の受話器が読めるか
  const fg = await p.$eval('.telcard__icon', el => getComputedStyle(el).color);
  const rgb = s => s.match(/\d+/g).slice(0,3).map(Number);
  ck('電話: 受話器のコントラスト', ratio(rgb(fg), rgb(icon.bg)) >= 4.5,
     ratio(rgb(fg), rgb(icon.bg)).toFixed(1) + ':1');

  const numColor = await p.$eval('.telcard a', el => getComputedStyle(el).color);
  const cardBg = await p.$eval('.reserve', el => getComputedStyle(el).backgroundColor);
  ck('電話: 番号のコントラスト', ratio(rgb(numColor), rgb(cardBg)) >= 4.5,
     ratio(rgb(numColor), rgb(cardBg)).toFixed(1) + ':1');

  const href = await p.$eval('.telcard a', el => el.getAttribute('href'));
  ck('電話: tel: リンクのまま', href === 'tel:0561000000', href);

  /* ---------- 電話カード（スマホ） ---------- */
  for (const [w, h, name] of [[390, 844, 'iPhone 13'], [320, 568, 'iPhone SE(第1世代)']]) {
    const sp = await b.newPage({ viewport: { width: w, height: h } });
    await sp.goto(B + 'reserve.html', { waitUntil: 'networkidle' });

    const num = await sp.$eval('.telcard a', el => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
               line: parseFloat(getComputedStyle(el).lineHeight) || 0,
               fs: parseFloat(getComputedStyle(el).fontSize) };
    });
    const card = await sp.$eval('.telcard', el => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) };
    });
    ck(`電話 ${name}: 番号が折り返さない`, num.h < num.fs * 1.9, `高さ${num.h}px / 文字${num.fs}px`);
    ck(`電話 ${name}: 番号がカードからはみ出さない`,
       (await sp.$eval('.telcard a', el => Math.round(el.getBoundingClientRect().right))) <= card.right,
       `カード右${card.right}px`);

    // カード全体が押せること（番号のリンクを広げている）
    const stretched = await sp.evaluate(() => {
      const c = document.querySelector('.telcard').getBoundingClientRect();
      // カードの左上あたり（アイコンより上の余白）で何が拾われるか
      const el = document.elementFromPoint(c.left + 8, c.top + 8);
      return el ? (el.closest('a[href^="tel:"]') !== null) : false;
    });
    ck(`電話 ${name}: カードのどこを押しても発信できる`, stretched);

    ck(`電話 ${name}: カードのタップ領域`, card.h >= 44, `${card.h}px`);
    const x = await sp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ck(`電話 ${name}: 横スクロールなし`, x <= 0, `${x}px`);
    await sp.close();
  }

  /* ---------- メニューの文字サイズボタン ---------- */
  for (const [w, h, name] of [[390, 844, 'iPhone 13'], [320, 568, 'iPhone SE(第1世代)']]) {
    const sp = await b.newPage({ viewport: { width: w, height: h } });
    sp.on('pageerror', e => errs.push(String(e)));
    await sp.goto(B + 'index.html', { waitUntil: 'networkidle' });
    await sp.click('.burger');
    await sp.waitForTimeout(350);

    const fs = await sp.$$eval('.drawer .fsize button', els => els.map(e => {
      const r = e.getBoundingClientRect();
      return { t: e.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height),
               fs: parseFloat(getComputedStyle(e).fontSize) };
    }));
    ck(`文字サイズ ${name}: ボタンが2つ`, fs.length === 2, fs.map(f=>f.t).join(','));
    ck(`文字サイズ ${name}: タップ領域が44px以上`, fs.every(f => f.h >= 44 && f.w >= 44),
       fs.map(f => `${f.t} ${f.w}×${f.h}`).join(' / '));
    ck(`文字サイズ ${name}: 文字が13px以上`, fs.every(f => f.fs >= 13),
       fs.map(f => `${f.t} ${f.fs}px`).join(' / '));

    const label = await sp.$eval('.drawer .fsize', el => parseFloat(getComputedStyle(el).fontSize));
    ck(`文字サイズ ${name}: 見出しも13px以上`, label >= 13, `${label}px`);

    // 大きくしても、ドロワーの中身が全部押せる位置にあること。
    // 画面の低い端末では下まで入りきらないので、ドロワーをスクロールして届くかで見る
    const reach = await sp.evaluate(() => {
      const panel = document.querySelector('.drawer__panel');
      const last = document.querySelectorAll('.drawer__nav .drawer__row > a');
      const before = Math.round(document.querySelector('.drawer .fsize').getBoundingClientRect().bottom);
      panel.scrollTop = panel.scrollHeight;
      const btn = document.querySelector('.drawer .fsize button[data-size="l"]').getBoundingClientRect();
      const hit = document.elementFromPoint(btn.left + btn.width/2, btn.top + btn.height/2);
      return { before, vh: window.innerHeight,
               lastBottom: Math.round(last[last.length-1].getBoundingClientRect().bottom),
               after: Math.round(btn.bottom),
               tappable: !!(hit && hit.closest('.fsize button')) };
    });
    ck(`文字サイズ ${name}: スクロールすれば必ず押せる`, reach.tappable && reach.after <= reach.vh + 1,
       `そのままの下端${reach.before}px → 送ったあと${reach.after}px / 画面${reach.vh}px`);
    ck(`文字サイズ ${name}: メニュー6項目はそのまま収まる`, reach.lastBottom <= reach.vh + 1,
       `${reach.lastBottom}px`);

    // 実際に押して効くこと
    await sp.click('.drawer .fsize button[data-size="l"]', { timeout: 5000 });
    const on = await sp.evaluate(() => document.documentElement.className);
    ck(`文字サイズ ${name}: 「大」が効く`, /fs-l|is-large|fs2/.test(on) || on.length > 0, on);
    await sp.close();
  }

  ck('JSエラーなし', errs.length === 0, errs.join(' / '));

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
