import type { Section, Site } from './types'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function nl2br(s: string): string {
  return esc(s).replace(/\n/g, '<br>')
}

function telHref(phone: string): string {
  return 'tel:' + phone.replace(/[^\d+]/g, '')
}

// ナビゲーション用に各セクションへ id と表示ラベルを割り当てる
function sectionId(index: number): string {
  return `sec-${index}`
}

function navLabel(section: Section): string | null {
  switch (section.type) {
    case 'hero':
      return null // ヒーローは「ホーム」として別途リンク
    case 'about':
    case 'services':
    case 'products':
    case 'news':
    case 'contact':
      return section.heading
  }
}

function renderSection(section: Section, index: number): string {
  const id = sectionId(index)
  switch (section.type) {
    case 'hero': {
      const styled = section.imageUrl
        ? `style="background-image: linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.45)), url('${esc(section.imageUrl)}');"`
        : ''
      const cls = section.imageUrl ? 'hero has-image' : 'hero'
      return `
  <header id="top" class="${cls}" ${styled}>
    <div class="hero-inner">
      <h1>${esc(section.title)}</h1>
      <p>${esc(section.subtitle)}</p>
    </div>
    <a class="hero-scroll" href="#${sectionId(index + 1)}" aria-label="下にスクロール">⌄</a>
  </header>`
    }
    case 'about':
      return `
  <section id="${id}" class="section section-about">
    <div class="section-head">
      <h2>${esc(section.heading)}</h2>
    </div>
    <p class="about-body">${nl2br(section.body)}</p>
  </section>`
    case 'services': {
      const cards = section.items
        .map(
          (item) => `
      <div class="card">
        ${item.imageUrl ? `<img class="card-img" src="${esc(item.imageUrl)}" alt="${esc(item.title)}" loading="lazy">` : ''}
        <div class="card-body">
          <h3>${esc(item.title)}</h3>
          <p>${nl2br(item.description)}</p>
        </div>
      </div>`,
        )
        .join('')
      return `
  <section id="${id}" class="section">
    <div class="section-head">
      <h2>${esc(section.heading)}</h2>
    </div>
    <div class="cards">${cards}
    </div>
  </section>`
    }
    case 'products': {
      const cards = section.items
        .map(
          (item) => `
      <div class="product-card">
        ${item.imageUrl ? `<img src="${esc(item.imageUrl)}" alt="${esc(item.name)}" loading="lazy">` : '<div class="product-noimage">No Image</div>'}
        <div class="product-body">
          <h3>${esc(item.name)}</h3>
          <p>${nl2br(item.description)}</p>
          <p class="price">${esc(item.price)}</p>
        </div>
      </div>`,
        )
        .join('')
      return `
  <section id="${id}" class="section section-products">
    <div class="section-head">
      <h2>${esc(section.heading)}</h2>
    </div>
    <div class="products">${cards}
    </div>
  </section>`
    }
    case 'news': {
      const rows = section.items
        .map(
          (item) => `
      <li><time>${esc(item.date)}</time><span>${esc(item.title)}</span></li>`,
        )
        .join('')
      return `
  <section id="${id}" class="section">
    <div class="section-head">
      <h2>${esc(section.heading)}</h2>
    </div>
    <ul class="news-list">${rows}
    </ul>
  </section>`
    }
    case 'contact': {
      const map =
        section.showMap && section.address
          ? `
    <div class="map-wrap">
      <iframe src="https://www.google.com/maps?q=${encodeURIComponent(section.address)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>`
          : ''
      return `
  <section id="${id}" class="section section-contact">
    <div class="section-head">
      <h2>${esc(section.heading)}</h2>
    </div>
    <table class="contact-table">
      <tr><th>住所</th><td>${esc(section.address)}</td></tr>
      <tr><th>電話</th><td><a href="${telHref(section.phone)}">${esc(section.phone)}</a></td></tr>
      <tr><th>メール</th><td>${esc(section.email)}</td></tr>
      <tr><th>営業時間</th><td>${esc(section.hours)}</td></tr>
    </table>${map}
  </section>`
    }
  }
}

function renderNav(site: Site): string {
  const links = site.sections
    .map((section, index) => {
      const label = navLabel(section)
      if (!label) return ''
      return `<a href="#${sectionId(index)}">${esc(label)}</a>`
    })
    .filter(Boolean)
    .join('\n      ')
  return `
  <nav class="site-nav">
    <a class="nav-brand" href="#top">${esc(site.name)}</a>
    <div class="nav-links">
      <a href="#top">ホーム</a>
      ${links}
    </div>
  </nav>`
}

export function renderSiteHtml(site: Site): string {
  const { theme } = site
  const serif = theme.fontStyle === 'serif'
  const bodyFont = serif
    ? '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "Hiragino Mincho Pro", "MS PMincho", serif'
    : '"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "YuGothic", Meiryo, sans-serif'

  const nav = renderNav(site)
  const body = site.sections.map(renderSection).join('\n')
  const contact = site.sections.find((s) => s.type === 'contact')
  const phone = contact && contact.type === 'contact' ? contact.phone : ''
  const callButton =
    site.showCallButton && phone
      ? `
  <a class="call-button" href="${telHref(phone)}">📞 今すぐ電話する</a>`
      : ''
  const baseFont = Math.round(16 * site.fontScale)

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(site.name)}</title>
<style>
  :root {
    --primary: ${theme.primary};
    --accent: ${theme.accent};
    --bg: ${theme.background};
    --text: ${theme.text};
    --nav-h: 64px;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html {
    font-size: ${baseFont}px;
    scroll-behavior: smooth;
    scroll-padding-top: var(--nav-h);
  }
  body {
    font-family: ${bodyFont};
    background: var(--bg);
    color: var(--text);
    line-height: 2;
    font-size: 1rem;
    -webkit-font-smoothing: antialiased;
  }
  img { max-width: 100%; }

  /* ---- ナビゲーション ---- */
  .site-nav {
    position: sticky;
    top: 0;
    z-index: 50;
    height: var(--nav-h);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 0 clamp(20px, 5vw, 56px);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }
  .nav-brand {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--primary);
    text-decoration: none;
    white-space: nowrap;
  }
  .nav-links {
    display: flex;
    align-items: center;
    gap: clamp(14px, 2.4vw, 32px);
    overflow-x: auto;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .nav-links::-webkit-scrollbar { display: none; }
  .nav-links a {
    color: var(--text);
    text-decoration: none;
    font-size: 0.9rem;
    letter-spacing: 0.04em;
    white-space: nowrap;
    padding: 6px 0;
    border-bottom: 2px solid transparent;
    transition: border-color 0.2s, opacity 0.2s;
  }
  .nav-links a:hover {
    border-color: var(--accent);
    opacity: 0.85;
  }

  /* ---- ヒーロー ---- */
  .hero {
    position: relative;
    min-height: 78vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px;
    background: linear-gradient(140deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #000));
    color: #fff;
  }
  .hero.has-image {
    background-size: cover;
    background-position: center;
  }
  .hero-inner { max-width: 880px; }
  .hero h1 {
    font-size: clamp(2rem, 6vw, 3.6rem);
    font-weight: 600;
    letter-spacing: 0.12em;
    line-height: 1.4;
    margin-bottom: 24px;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.25);
  }
  .hero p {
    font-size: clamp(1rem, 2.4vw, 1.3rem);
    letter-spacing: 0.08em;
    opacity: 0.95;
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.2);
  }
  .hero-scroll {
    position: absolute;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    color: #fff;
    font-size: 2rem;
    line-height: 1;
    text-decoration: none;
    opacity: 0.8;
    animation: bob 2s ease-in-out infinite;
  }
  @keyframes bob {
    0%, 100% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, 8px); }
  }

  /* ---- セクション共通 ---- */
  .section {
    max-width: 1080px;
    margin: 0 auto;
    padding: clamp(64px, 11vw, 140px) clamp(24px, 6vw, 48px);
  }
  .section-head {
    text-align: center;
    margin-bottom: clamp(40px, 6vw, 72px);
  }
  .section-head h2 {
    font-size: clamp(1.5rem, 3.4vw, 2.1rem);
    font-weight: 600;
    color: var(--primary);
    letter-spacing: 0.1em;
  }
  .section-head h2::after {
    content: "";
    display: block;
    width: 44px;
    height: 2px;
    background: var(--accent);
    margin: 20px auto 0;
  }
  .about-body {
    text-align: center;
    max-width: 720px;
    margin: 0 auto;
    font-size: 1.02rem;
    color: color-mix(in srgb, var(--text) 88%, transparent);
  }

  /* ---- カード（サービス・特徴） ---- */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(20px, 3vw, 36px);
  }
  .card {
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
  .card-img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    display: block;
  }
  .card-body { padding: 28px 26px; }
  .card-body h3 {
    color: var(--primary);
    margin-bottom: 12px;
    font-size: 1.15rem;
    letter-spacing: 0.04em;
  }
  .card-body p {
    font-size: 0.95rem;
    color: color-mix(in srgb, var(--text) 85%, transparent);
  }

  /* ---- 商品・メニュー ---- */
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(20px, 3vw, 36px);
  }
  .product-card {
    background: #fff;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    transition: transform 0.25s, box-shadow 0.25s;
  }
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1);
  }
  .product-card img, .product-noimage {
    width: 100%;
    height: 210px;
    object-fit: cover;
    display: block;
  }
  .product-noimage {
    background: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
  }
  .product-body {
    padding: 24px 24px 26px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  .product-body h3 {
    color: var(--primary);
    font-size: 1.1rem;
    letter-spacing: 0.03em;
  }
  .product-body p { font-size: 0.92rem; }
  .product-body .price {
    margin-top: auto;
    color: var(--accent);
    font-weight: 700;
    font-size: 1.2rem;
    text-align: right;
  }

  /* ---- お知らせ ---- */
  .news-list {
    list-style: none;
    max-width: 720px;
    margin: 0 auto;
  }
  .news-list li {
    display: flex;
    gap: 28px;
    padding: 22px 4px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  }
  .news-list li:first-child { border-top: 1px solid rgba(0, 0, 0, 0.08); }
  .news-list time {
    color: var(--accent);
    font-weight: 600;
    white-space: nowrap;
    letter-spacing: 0.05em;
  }

  /* ---- 連絡先 ---- */
  .section-contact { background: color-mix(in srgb, var(--primary) 5%, transparent); }
  .contact-table {
    width: 100%;
    max-width: 600px;
    margin: 0 auto;
    border-collapse: collapse;
  }
  .contact-table th, .contact-table td {
    text-align: left;
    padding: 18px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
  .contact-table th {
    color: var(--primary);
    white-space: nowrap;
    width: 8em;
    letter-spacing: 0.06em;
  }
  .contact-table a { color: inherit; }
  .map-wrap { max-width: 760px; margin: 40px auto 0; }
  .map-wrap iframe {
    width: 100%;
    height: 360px;
    border: 0;
    border-radius: 4px;
  }

  /* ---- 電話ボタン・フッター ---- */
  .call-button {
    position: fixed;
    right: 20px;
    bottom: 20px;
    background: var(--accent);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    letter-spacing: 0.04em;
    padding: 15px 24px;
    border-radius: 999px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
    z-index: 60;
  }
  footer {
    background: var(--primary);
    color: #fff;
    text-align: center;
    padding: 40px 24px;
    font-size: 0.85rem;
    letter-spacing: 0.08em;
  }

  @media (max-width: 640px) {
    body { line-height: 1.9; }
    .nav-brand { font-size: 1rem; }
    .hero { min-height: 70vh; }
    .news-list li { gap: 16px; flex-direction: column; }
    .contact-table th { width: 6em; }
  }
</style>
</head>
<body>
${nav}
${body}
  <footer>&copy; ${new Date().getFullYear()} ${esc(site.name)}</footer>${callButton}
</body>
</html>
`
}
