// 予約フォームとメニューの動きを確かめる
const { chromium } = require('playwright');
const path = require('path');
const ok = (c, m) => console.log((c ? 'OK ' : 'NG ') + m);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, '..', 'reserve.html'));
  ok(await p.isHidden('#rsv-confirm') && await p.isHidden('#rsv-done'), '確認と完了は最初は隠れている');
  await p.click('button[type=submit]');
  ok(await p.isVisible('#e-name') && await p.isVisible('#e-d1') && await p.isVisible('#e-agree'), '空で送るとエラーが出る');
  ok(await p.evaluate(() => document.activeElement.id) === 'f-name', '最初のエラーの欄へ移る');
  await p.fill('#f-name', '山田 花子'); await p.fill('#f-kana', 'やまだ はなこ'); await p.fill('#f-tel', '090-1234-5678');
  // 次の日曜を選ぶとエラー
  const d = new Date(); d.setDate(d.getDate() + 1); while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
  const f = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  await p.fill('#f-d1', f(d)); await p.dispatchEvent('#f-d1', 'change');
  ok((await p.textContent('#e-d1')).includes('日曜'), '日曜は選べない');
  const sat = new Date(d); sat.setDate(d.getDate() + 6);
  await p.fill('#f-d1', f(sat)); await p.dispatchEvent('#f-d1', 'change');
  const opts = await p.$$eval('#f-t1 option', os => os.map(o => o.value).filter(Boolean));
  ok(opts[opts.length - 1] === '16:00', '土曜は16時までの枠');
  await p.check('input[name=staff][value=森]');
  const wed = new Date(d); wed.setDate(d.getDate() + 3);
  await p.fill('#f-d1', f(wed)); await p.dispatchEvent('#f-d1', 'change');
  ok((await p.textContent('#e-d1')).includes('森の出勤日'), '森の休みの日は選べない');
  await p.fill('#f-d1', f(sat)); await p.dispatchEvent('#f-d1', 'change');
  await p.selectOption('#f-t1', '10:00');
  await p.check('#f-agree');
  await p.click('button[type=submit]');
  ok(await p.isVisible('#rsv-confirm') && (await p.textContent('#confirm-list')).includes('山田 花子'), '確認画面に内容が出る');
  await p.click('#rsv-send');
  ok(await p.isVisible('#rsv-done'), '送ると完了の知らせ');
  // メニュー
  await p.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await p.click('.menu-btn'); await p.waitForTimeout(400);
  ok(await p.getAttribute('.menu-btn', 'aria-expanded') === 'true' && await p.isVisible('#gnav a[href="first.html"]'), 'メニューが開く');
  await p.keyboard.press('Escape');
  ok(await p.getAttribute('.menu-btn', 'aria-expanded') === 'false', 'Escで閉じる');
  ok(errs.length === 0, 'JSエラーなし ' + errs.join(' '));
  await b.close();
})();
