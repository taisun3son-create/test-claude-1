// 動きの検査：ドロワー・今日の受付・地図ボタン・受付カレンダー・予約フォーム・JSなし
const { chromium, devices } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, q.url.split('?')[0].split('#')[0]); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Type': T[path.extname(f)] || '' }); fs.createReadStream(f).pipe(r); }).listen(0);
let fails = 0; const ok = (c, m) => { console.log(c ? 'ok ' : 'NG ', m); if (!c) fails++; };
// n日後で、指定の曜日（0=日）の日付
const nextDay = (wd) => { const d = new Date(Date.now() + 9 * 3600e3); d.setUTCDate(d.getUTCDate() + 1); while (d.getUTCDay() !== wd) d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
(async () => {
  const U = `http://localhost:${srv.address().port}/`;
  const b = await chromium.launch();
  const sp = await (await b.newContext({ ...devices['iPhone 13'], timezoneId: 'Asia/Tokyo' })).newPage();
  await sp.goto(U + 'index.html');
  await sp.click('.menu-btn'); ok(await sp.isVisible('#drawer'), 'ドロワーが開く');
  await sp.keyboard.press('Escape'); await sp.waitForSelector('#drawer', { state: 'hidden', timeout: 1500 }).catch(() => {}); ok(!(await sp.isVisible('#drawer')), 'Escapeで閉じる');
  ok(await sp.isVisible('.sp-bar'), 'スマホ下の予約ボタンが出る');
  const st = await sp.getAttribute('[data-today]', 'data-state'); ok(st === 'open' || st === 'closed', '今日の受付: ' + await sp.textContent('.today-label'));
  await sp.click('[data-map-load]'); ok(await sp.locator('.guide-map iframe').count() === 1, '地図ボタンでGoogleマップに切りかわる');

  const pc = await (await b.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Tokyo' })).newPage();
  await pc.goto(U + 'reserve.html');
  ok(await pc.locator('.cal').count() === 2, 'カレンダーが2か月出る');
  ok(await pc.locator('.cal .is-closed').count() >= 6, 'カレンダーに水曜と臨時休が出る');
  await pc.click('button[type=submit]'); ok(await pc.isVisible('.form-summary'), 'フォーム：空で送るとまとめのエラー');
  await pc.check('input[value=first]', { force: true });
  await pc.fill('#f-name', '辻堂 花子'); await pc.fill('#f-tel', '090-1234-5678');
  await pc.fill('#f-date1', nextDay(3)); await pc.click('button[type=submit]');
  ok((await pc.textContent('#e-date1')).includes('定休日'), 'フォーム：水曜はえらべない');
  await pc.fill('#f-date1', nextDay(6)); await pc.dispatchEvent('#f-date1', 'change');
  const opts = await pc.$$eval('#f-time1 option', o => o.map(x => x.value));
  ok(opts.includes('9:00') && !opts.includes('19:00'), 'フォーム：土曜は 9:00〜16:00 の時間だけ出る');
  await pc.selectOption('#f-time1', '10:00');
  ok((await pc.textContent('[data-c=w1]')).includes('10:00'), 'フォーム：送る前の確認に日時が出る');
  await pc.check('input[name=agree]'); await pc.click('button[type=submit]');
  await pc.waitForSelector('.form-done:not([hidden])', { timeout: 3000 }).catch(() => {});
  ok(await pc.isVisible('.form-done'), 'フォーム：正しく入れると受付の表示');
  await pc.goto(U + 'reserve.html?menu=sango'); ok(await pc.isChecked('input[value=sango]'), 'フォーム：?menu=sango で産後ケアがえらばれる');

  const nojs = await (await b.newContext({ javaScriptEnabled: false })).newPage();
  await nojs.goto(U + 'index.html'); ok(await nojs.isVisible('.point'), 'JSなし：ふわっと出る部分も見える');
  await b.close(); srv.close(); process.exit(fails ? 1 : 0);
})();
