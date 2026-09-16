const { chromium, devices } = require('playwright');
const results = [];
const check = (n, c, e = '') => results.push(`${c ? 'PASS' : 'FAIL'}  ${n}${e ? '  — ' + e : ''}`);
const BASE = 'http://127.0.0.1:8770/';
const PAGES = ['index', 'service', 'flow', 'voice', 'faq', 'reserve', 'thanks', 'privacy', 'tokushoho'];
const NAV = ['service.html', 'flow.html', 'voice.html', 'faq.html', 'reserve.html'];

(async () => {
  const b = await chromium.launch(require('./launch'));
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ja-JP' });
  await ctx.route('**://fonts.*/**', r => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('response', r => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });

  for (const slug of PAGES) {
    await page.goto(BASE + slug + '.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(120);
    const r = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1');
      const cur = document.querySelector('.nav a[aria-current="page"]');
      return {
        title: document.title,
        h1n: h1.length,
        h1: h1[0] ? h1[0].textContent.trim().slice(0, 22) : null,
        header: !!document.querySelector('header.head'),
        sticky: document.querySelector('header.head') ? getComputedStyle(document.querySelector('header.head')).position : null,
        navCount: document.querySelectorAll('.nav a').length,
        current: cur ? cur.textContent.trim() : null,
        ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { return JSON.parse(s.textContent)['@graph'].map(g => g['@type']); } catch (e) { return ['壊れたJSON']; } }).flat(),
        desc: (document.querySelector('meta[name=description]') || {}).content ? true : false,
        canon: !!document.querySelector('link[rel=canonical]'),
        ogimg: !!document.querySelector('meta[property="og:image"]'),
      };
    });
    check(`${slug}: ヘッダーが常に表示（sticky）`, r.header && r.sticky === 'sticky', r.sticky);
    check(`${slug}: ナビ5項目`, r.navCount === 5, `${r.navCount}項目`);
    check(`${slug}: h1が1つ`, r.h1n === 1, `${r.h1n}個「${r.h1}」`);
    check(`${slug}: title/description/canonical/og:image`, r.desc && r.canon && r.ogimg);
    check(`${slug}: 構造化データ`, r.ld.length > 0 && !r.ld.includes('壊れたJSON'), r.ld.join(','));
    if (slug !== 'index' && NAV.includes(slug + '.html')) {
      check(`${slug}: ナビで現在地が示される`, !!r.current, String(r.current));
    }
  }

  // ナビが実際に遷移するか
  await page.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded' });
  for (const href of NAV) {
    await page.click(`.nav a[href="${href}"]`);
    await page.waitForLoadState('domcontentloaded');
    check(`ナビ→${href} に遷移`, page.url().endsWith(href), page.url().split('/').pop());
    await page.goBack({ waitUntil: 'domcontentloaded' });
  }

  // お困りごとがナビから消えていること／トップには残っていること
  await page.goto(BASE + 'index.html', { waitUntil: 'domcontentloaded' });
  const navTxt = await page.$$eval('.nav a', a => a.map(x => x.textContent.trim()));
  check('ナビから「お困りごと」が消えている', !navTxt.some(t => t.includes('お困り')), navTxt.join('/'));
  const topSections = await page.$$eval('main section', s => s.map(x => x.className.split(' ')[0]));
  check('トップは 表紙→ヒーロー→安心→お困りごと', topSections.slice(0, 4).join(',') === 'cover,hero,trust,section', topSections.join(','));
  check('トップに「お困りごと」本文がある', (await page.locator('#worry').count()) === 1);

  // 表紙の写真が img で配信されているか
  const img = await page.evaluate(() => {
    const i = document.querySelector('.cover__photo');
    return { tag: i.tagName, srcset: !!i.srcset, sizes: i.sizes, fp: i.getAttribute('fetchpriority'),
             sources: document.querySelectorAll('.cover picture source').length,
             loaded: i.complete && i.naturalWidth > 0, w: i.naturalWidth };
  });
  check('表紙写真が <img> + srcset', img.tag === 'IMG' && img.srcset, `${img.tag} sources=${img.sources}`);
  check('表紙写真が実際に読み込めている', img.loaded, `${img.w}px`);
  check('fetchpriority=high', img.fp === 'high', String(img.fp));

  // 演出・折りたたみが残っていないこと
  const leftovers = await page.evaluate(() => ({
    rv: document.querySelectorAll('.rv').length, more: document.querySelectorAll('.more').length }));
  check('スクロール演出を削除済み', leftovers.rv === 0, `${leftovers.rv}個`);
  check('折りたたみを削除済み', leftovers.more === 0, `${leftovers.more}個`);

  // フォームの二重送信対策とハニーポット
  await page.goto(BASE + 'reserve.html', { waitUntil: 'domcontentloaded' });
  const form = await page.evaluate(() => ({
    pot: !!document.getElementById('f-company'),
    potHidden: (() => { const w = document.querySelector('#f-company') && document.querySelector('#f-company').closest('.vh');
      return !!w && w.getBoundingClientRect().width < 3 && getComputedStyle(w).clip !== 'auto'; })(),
    senderr: !!document.getElementById('formsenderr'),
    endpoint: document.getElementById('resform').getAttribute('data-endpoint'),
  }));
  check('ハニーポット欄がある（画面には出ない）', form.pot && form.potHidden);
  check('送信失敗時のエラー表示がある', form.senderr);
  check('送信先は data-endpoint で差し替え可能', form.endpoint === '');

  check('コンソール/HTTPエラーなし', errs.length === 0, errs.slice(0, 3).join(' | '));

  await b.close();
  console.log(results.join('\n'));
  const f = results.filter(r => r.startsWith('FAIL')).length;
  console.log(`\n${results.length - f}/${results.length} passed`);
  process.exit(f ? 1 : 0);
})();
