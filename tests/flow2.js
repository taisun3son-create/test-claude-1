const { chromium } = require('playwright');
const R = []; const ck = (n,c,e='') => R.push(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`);
const B = 'http://127.0.0.1:8770/';

(async () => {
  const b = await chromium.launch(require('./launch'));
  const errs = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  p.on('pageerror', e => errs.push(String(e)));
  p.on('console', m => {
    if (m.type() !== 'error') return;
    // 外部フォントは検証環境から取りにいけない。自ドメインの失敗だけを数える
    const at = (m.location() || {}).url || '';
    if (at && !at.startsWith(B)) return;
    errs.push(m.text());
  });
  // 外部フォントは検証用サーバからは取れない。自前のファイルだけを見る
  p.on('requestfailed', r => {
    if (r.url().startsWith(B)) errs.push('取得失敗 ' + r.url() + ' ' + (r.failure() || {}).errorText);
  });

  /* ---- 1. 流れ: 番号が二重に出ていないこと ---- */
  await p.goto(B + 'flow.html', { waitUntil: 'networkidle' });

  const ls = await p.$eval('.flow', el => getComputedStyle(el).listStyleType);
  ck('流れ: ol の既定マーカーを消してある', ls === 'none', ls);

  // 見えている数字を、描画されたテキストとマーカー分の左余白の両方で確かめる
  const marker = await p.$eval('.flow li', el => {
    const r = el.getBoundingClientRect();
    const pr = el.parentNode.getBoundingClientRect();
    return { liLeft: Math.round(r.left), olLeft: Math.round(pr.left) };
  });
  ck('流れ: マーカー用の余白が残っていない',
     marker.liLeft === marker.olLeft, `li ${marker.liLeft}px / ol ${marker.olLeft}px`);

  const nums = await p.$$eval('.flow .step', els => els.map(el => {
    const txt = el.innerText.replace(/\s+/g, '');
    const m = txt.match(/^(\d)/);
    return { first: m ? m[1] : '', badge: el.querySelector('.step__n').textContent.trim() };
  }));
  ck('流れ: 数字は各手順に1つずつ', nums.every((n, i) => n.badge === String(i + 1)),
     nums.map(n => n.badge).join(','));

  // 本文（時期・説明・費用）を除いた見出し部分に、数字が1つだけ出ること。
  // 既定のマーカーが残っていると、ここが「1」ではなく「11」のように増える
  const heads = await p.$$eval('.flow .step', els => els.map(el => {
    const skip = el.querySelectorAll('.step__when, .step__d, .step__cost');
    const hide = [];
    skip.forEach(s => { hide.push([s, s.style.display]); s.style.display = 'none'; });
    const txt = el.innerText.replace(/\s+/g, '');
    hide.forEach(([s, d]) => { s.style.display = d; });
    return (txt.match(/\d/g) || []).join('');
  }));
  ck('流れ: 見出し部分に出る数字は1つずつ',
     heads.join(',') === '1,2,3,4', heads.join(','));

  const badge = await p.$eval('.step__n', el => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, color: s.color };
  });
  ck('流れ: 番号が丸いバッジになっている',
     badge.w === badge.h && badge.w >= 36 && badge.color === 'rgb(255, 255, 255)',
     `${badge.w}×${badge.h} ${badge.bg}`);

  const when = await p.$$eval('.step__when', els => els.map(e => e.textContent.trim()));
  ck('流れ: 各手順に目安の時期がある', when.length === 4 && when.every(t => t.length > 2), when.join(' / '));
  const cost = await p.$$eval('.step__cost', els => els.map(e => e.textContent.trim()));
  ck('流れ: 各手順に費用の目安がある', cost.length === 4, cost.join(' / '));
  ck('流れ: 補足カードがある', await p.$('.prep') !== null);

  /* ---- 2. 声: 見た目 ---- */
  await p.goto(B + 'voice.html', { waitUntil: 'networkidle' });
  ck('声: 引用符の飾りがある', (await p.$$('.voice__mark')).length === 3);
  ck('声: 年代の丸がある', (await p.$$('.voice__av')).length === 3);

  const tag = await p.$$eval('.voice__tag', els => els.map(e => {
    const r = e.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(e).lineHeight);
    return { txt: e.textContent.trim(), lines: Math.round(r.height / line) };
  }));
  ck('声: 内容のタグが1行に収まる', tag.every(t => t.lines === 1),
     tag.map(t => `${t.txt}(${t.lines}行)`).join(' / '));

  // 飾りの引用符が見出しの「文字」に重なっていないこと。
  // 見出しは幅いっぱいのブロックなので、要素の枠ではなく実際の行の位置で見る
  const overlap = await p.$$eval('.voice', els => els.map(el => {
    const q = el.querySelector('.voice__q');
    const rg = document.createRange();
    rg.selectNodeContents(q);
    const lines = [...rg.getClientRects()];
    const m = el.querySelector('.voice__mark').getBoundingClientRect();
    return lines.some(l => !(l.right <= m.left || m.right <= l.left ||
                             l.bottom <= m.top || m.bottom <= l.top));
  }));
  ck('声: 飾りの引用符が見出しに重ならない', overlap.every(o => o === false),
     overlap.map(o => o ? '重なり' : 'なし').join(','));

  const h = await p.$$eval('.voice', els => els.map(e => Math.round(e.getBoundingClientRect().height)));
  ck('声: 3枚のカードの高さがそろう', new Set(h).size === 1, h.join(','));
  ck('声: 掲載についての断りがある', await p.$('.voices__note') !== null);

  /* ---- 3. 料金カードの開閉 ---- */
  await p.goto(B + 'service.html', { waitUntil: 'networkidle' });
  const toggles = await p.$$('.plan__toggle');
  ck('料金: 4プランすべてに開閉ボタンがある', toggles.length === 4, `${toggles.length}個`);

  const hid = await p.$$eval('.plan__more', els => els.map(e => e.hidden));
  ck('料金: 最初は点線から下が閉じている', hid.every(x => x === true), hid.join(','));

  const tapOk = await p.$$eval('.plan__toggle', els =>
    els.every(e => e.getBoundingClientRect().height >= 44));
  ck('料金: ボタンのタップ領域が44px以上', tapOk);

  // 点線（.plan__price の下罫）より下に隠れているか
  const below = await p.$eval('.plan', el => {
    const dash = el.querySelector('.plan__price').getBoundingClientRect().bottom;
    const btn = el.querySelector('.plan__toggle').getBoundingClientRect().top;
    return Math.round(btn - dash);
  });
  ck('料金: ボタンは点線のすぐ下にある', below >= 0 && below < 40, `${below}px`);

  await toggles[0].click();
  const st1 = await p.$eval('#more-trial', e => e.hidden);
  const ex1 = await p.$eval('.plan__toggle', e => e.getAttribute('aria-expanded'));
  const label1 = await p.$eval('.plan__toggle__t', e => e.textContent.trim());
  ck('料金: 押すと開く', st1 === false && ex1 === 'true', `hidden=${st1} expanded=${ex1}`);
  ck('料金: 開くと「とじる」に変わる', label1 === 'とじる', label1);
  const total = await p.$eval('#more-trial', e => e.innerText.replace(/\s+/g, ' ').trim());
  ck('料金: 1回あたりの合計が出てくる', /6,400/.test(total), total.slice(0, 40));

  await toggles[0].click();
  const st2 = await p.$eval('#more-trial', e => e.hidden);
  const label2 = await p.$eval('.plan__toggle__t', e => e.textContent.trim());
  ck('料金: もう一度押すと閉じる', st2 === true && label2 === '料金とできること', `${st2} / ${label2}`);

  // 開閉しても予約ボタンは常に見えている
  const ctaVisible = await p.$$eval('.plan .btn', els => els.every(e => e.offsetParent !== null));
  ck('料金: 予約ボタンは閉じていても見える', ctaVisible);

  /* ---- 4. JSなしでは開いたまま ---- */
  const nojs = await b.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const np = await nojs.newPage();
  await np.goto(B + 'service.html', { waitUntil: 'domcontentloaded' });
  const nojsTxt = await np.$eval('.plans', e => e.innerText);
  ck('料金: JSを切ると中身がそのまま見える', /6,400/.test(nojsTxt) && /8,160/.test(nojsTxt));
  ck('料金: JSを切ると開閉ボタンは出さない', (await np.$$('.plan__toggle')).length === 0);
  await nojs.close();

  /* ---- 5. スマホでの高さ ---- */
  const sp = await b.newPage({ viewport: { width: 390, height: 844 } });
  for (const s of ['service', 'flow', 'voice']) {
    await sp.goto(B + s + '.html', { waitUntil: 'networkidle' });
    const box = await sp.evaluate(() => ({
      h: document.documentElement.scrollHeight,
      x: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    ck(`スマホ: ${s} の長さ ${(box.h / 844).toFixed(1)}画面`, box.h < 6000, `${box.h}px`);
    ck(`スマホ: ${s} は横スクロールなし`, box.x <= 0, `${box.x}px`);
  }
  // スマホでも開閉できる
  await sp.goto(B + 'service.html', { waitUntil: 'networkidle' });
  await sp.click('.plan__toggle');
  ck('スマホ: 料金カードが開く', (await sp.$eval('#more-trial', e => e.hidden)) === false);

  ck('JSエラーなし', errs.length === 0, errs.join(' / '));

  await b.close();
  console.log(R.join('\n'));
  const f = R.filter(x => x.startsWith('FAIL')).length;
  console.log(`\n${R.length - f}/${R.length} passed`);
})();
