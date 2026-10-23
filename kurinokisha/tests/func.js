// 動きの検査：ドロワー・メニューのタブ・お知らせの絞り込み・予約フォーム・地図ボタン
const { chromium, devices } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].split('#')[0]); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(0);
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok ' : 'NG ', m); if (!c) fails++; };
(async () => {
  const U = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const sp = await (await b.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Tokyo' })).newPage();
  await sp.goto(U + 'index.html');
  await sp.click('.menu-btn'); ok(await sp.isVisible('#drawer'), 'ドロワーが開く');
  await sp.keyboard.press('Escape'); await sp.waitForSelector('#drawer', { state: 'hidden', timeout: 1500 }).catch(() => {}); ok(!(await sp.isVisible('#drawer')), 'Escapeで閉じる（右へ戻る動きのあと）');
  ok(await sp.isVisible('.sp-bar'), 'スマホ下の予約ボタンが出る');
  const st = await sp.getAttribute('[data-today]', 'data-state'); ok(st === 'open' || st === 'closed', '今日の営業表示: ' + await sp.textContent('.today-label'));
  await sp.click('[data-map-load]'); ok(await sp.locator('.guide-map iframe').count() === 1, '地図ボタンでGoogleマップに切りかわる');

  const pc = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pc.goto(U + 'menu.html');
  ok(await pc.isVisible('#coffee') && !(await pc.isVisible('#sweets')), 'メニュー：最初は珈琲だけ');
  await pc.click('#t-season'); ok(await pc.isVisible('#season') && !(await pc.isVisible('#coffee')), 'メニュー：タブで切りかわる');
  await pc.goto(U + 'menu.html#beans'); await pc.reload(); ok(await pc.isVisible('#beans'), 'メニュー：#beans で直接開く');
  await pc.goto(U + 'news.html');
  await pc.click('[data-filter="closed"]'); ok(await pc.locator('.news-full .news-item:visible').count() === 1, 'お知らせ：お休みだけに絞れる');
  await pc.click('[data-filter="all"]'); ok(await pc.locator('.news-full .news-item:visible').count() === 5, 'お知らせ：すべてに戻る');

  await pc.goto(U + 'reserve.html');
  await pc.click('button[type=submit]'); ok(await pc.isVisible('.form-summary'), 'フォーム：空で送るとまとめのエラー');
  await pc.fill('#f-name', '山田 花子'); await pc.fill('#f-tel', '090-1234-5678');
  // 次の火曜日（定休日）を入れるとエラー
  const tue = await pc.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + ((9 - d.getDay()) % 7 || 7)); return d.toISOString().slice(0, 10); });
  await pc.fill('#f-date', tue); await pc.click('button[type=submit]');
  ok((await pc.textContent('#f-date ~ .err')).includes('定休日'), 'フォーム：定休日はえらべない');
  const thu = await pc.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + ((11 - d.getDay()) % 7 || 7)); return d.toISOString().slice(0, 10); });
  await pc.fill('#f-date', thu); await pc.selectOption('#f-time', '14:00'); await pc.selectOption('#f-people', '2名');
  await pc.check('input[name=agree]'); await pc.click('button[type=submit]');
  await pc.waitForSelector('.form-done:not([hidden])', { timeout: 3000 }).catch(() => {});
  ok(await pc.isVisible('.form-done'), 'フォーム：正しく入れると完了表示');
  await pc.goto(U + 'reserve.html?kind=gift');
  ok(await pc.isVisible('#f-goods') && !(await pc.isVisible('#f-people')), 'フォーム：贈りものを選ぶと注文内容の欄に切りかわる');

  const nojs = await (await b.newContext({ javaScriptEnabled: false })).newPage();
  await nojs.goto(U + 'menu.html'); ok(await nojs.isVisible('#beans') && await nojs.isVisible('#coffee'), 'JSなし：メニューは全部見える');
  await nojs.goto(U + 'index.html'); ok(await nojs.isVisible('.kd'), 'JSなし：ふわっと出る部分も見える');
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
})();
