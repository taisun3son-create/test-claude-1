// 狭いスマホ（320px）〜PCで、はみ出し・小さすぎる文字・押しにくいボタン・薄い文字色を調べる
// 使い方: node tests/a11y.js
const { chromium } = require(process.env.PW || 'playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const pages = ['index', 'about', 'menu', 'news', 'reserve', 'en', 'privacy'];
const srv = http.createServer((q, r) => {
  const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0].split('#')[0]));
  if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
}).listen(0);

(async () => {
  const port = srv.address().port, b = await chromium.launch();
  let bad = 0;
  for (const width of [320, 375, 1440]) {
    const ctx = await b.newContext({ viewport: { width, height: 800 }, isMobile: width < 768, hasTouch: width < 768 });
    for (const name of pages) {
      const p = await ctx.newPage();
      await p.goto(`http://localhost:${port}/${name}.html`, { waitUntil: 'networkidle' }).catch(() => {});
      await p.evaluate(() => document.fonts.ready);
      await p.evaluate(() => document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-in')));
      const r = await p.evaluate(() => {
        const out = [];
        const vis = e => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.width > 0 && b.height > 0 && !e.closest('[hidden],[aria-hidden=true],.skip,.sr-only,.hp'); };
        // 1. 横にはみ出していないか
        const W = document.documentElement.clientWidth;
        if (document.documentElement.scrollWidth > W + 1) out.push(`横にはみ出し ${document.documentElement.scrollWidth - W}px`);
        document.querySelectorAll('main *, header *, footer *').forEach(e => {
          if (!vis(e) || e.closest('.gallery-track')) return;
          const b = e.getBoundingClientRect();
          if (b.right > W + 1 && getComputedStyle(e).position !== 'fixed') out.push(`はみ出し: <${e.tagName.toLowerCase()} class="${e.className.baseVal ?? e.className}"> 右端 ${Math.round(b.right)}px`);
        });
        // 2. 文字は13px以上か（文字を直接持つ要素だけ）
        document.querySelectorAll('body *').forEach(e => {
          if (!vis(e) || e.closest('svg')) return;
          const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
          if (!own) return;
          const fs = parseFloat(getComputedStyle(e).fontSize);
          if (fs < 13) out.push(`小さい文字 ${fs}px: 「${e.textContent.trim().slice(0, 20)}」`);
        });
        // 3. ボタン・メニューは44px以上の高さがあるか（文章の中のリンクは除く）
        document.querySelectorAll('button, .btn, .gnav a, .drawer a, .sp-bar a, .tab, .chip, input[type=radio] + *, .to-top').forEach(e => {
          if (!vis(e)) return;
          const b = e.getBoundingClientRect();
          if (b.height < 44 - 0.5 || b.width < 44 - 0.5) out.push(`押しにくい ${Math.round(b.width)}×${Math.round(b.height)}: 「${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 16)}」`);
        });
        // 4. 文字と背景のコントラストが4.5:1以上か（背景が写真の上の文字は除く）
        const lum = c => { const m = c.match(/[\d.]+/g).map(Number); const [r, g, b] = m.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return { L: 0.2126 * r + 0.7152 * g + 0.0722 * b, a: m[3] ?? 1 }; };
        const bgOf = e => { for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.backgroundImage !== 'none' && x.tagName !== 'HTML') return null; const c = s.backgroundColor; if (lum(c).a > 0.9) return c; } return 'rgb(255,255,255)'; };
        document.querySelectorAll('body *').forEach(e => {
          if (!vis(e) || e.closest('svg,.hero,picture')) return;
          if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
          const bg = bgOf(e); if (!bg) return;
          const a = lum(getComputedStyle(e).color).L, c = lum(bg).L;
          const ratio = (Math.max(a, c) + 0.05) / (Math.min(a, c) + 0.05);
          const fs = parseFloat(getComputedStyle(e).fontSize), big = fs >= 24 || (fs >= 18.66 && +getComputedStyle(e).fontWeight >= 700);
          if (ratio < (big ? 3 : 4.5)) out.push(`薄い文字 ${ratio.toFixed(2)}:1「${e.textContent.trim().slice(0, 16)}」`);
        });
        return [...new Set(out)];
      });
      if (r.length) { bad += r.length; console.log(`NG ${width}px ${name}:\n  ` + r.slice(0, 15).join('\n  ') + (r.length > 15 ? `\n  …ほか${r.length - 15}件` : '')); }
      else console.log(`ok ${width}px ${name}`);
      await p.close();
    }
    await ctx.close();
  }
  await b.close(); srv.close();
  process.exit(bad ? 1 : 0);
})();
