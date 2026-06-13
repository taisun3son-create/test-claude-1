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

function renderSection(section: Section): string {
  switch (section.type) {
    case 'hero': {
      const bg = section.imageUrl
        ? `background-image: linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url('${esc(section.imageUrl)}'); background-size: cover; background-position: center; color: #fff;`
        : ''
      return `
  <header class="hero" style="${bg}">
    <h1>${esc(section.title)}</h1>
    <p>${esc(section.subtitle)}</p>
  </header>`
    }
    case 'about':
      return `
  <section class="section">
    <h2>${esc(section.heading)}</h2>
    <p class="about-body">${nl2br(section.body)}</p>
  </section>`
    case 'services': {
      const cards = section.items
        .map(
          (item) => `
      <div class="card">
        ${item.imageUrl ? `<img class="card-img" src="${esc(item.imageUrl)}" alt="${esc(item.title)}" loading="lazy">` : ''}
        <h3>${esc(item.title)}</h3>
        <p>${nl2br(item.description)}</p>
      </div>`,
        )
        .join('')
      return `
  <section class="section">
    <h2>${esc(section.heading)}</h2>
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
  <section class="section">
    <h2>${esc(section.heading)}</h2>
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
  <section class="section">
    <h2>${esc(section.heading)}</h2>
    <ul class="news-list">${rows}
    </ul>
  </section>`
    }
    case 'contact': {
      const map = section.showMap && section.address
        ? `
    <div class="map-wrap">
      <iframe src="https://www.google.com/maps?q=${encodeURIComponent(section.address)}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
    </div>`
        : ''
      return `
  <section class="section">
    <h2>${esc(section.heading)}</h2>
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

export function renderSiteHtml(site: Site): string {
  const { theme } = site
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
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html { font-size: ${baseFont}px; }
  body {
    font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.8;
    font-size: 1rem;
  }
  .hero {
    background: var(--primary);
    color: #fff;
    text-align: center;
    padding: 96px 24px;
  }
  .hero h1 { font-size: 2.4rem; letter-spacing: .08em; margin-bottom: 16px; }
  .hero p { font-size: 1.1rem; opacity: .92; }
  .section {
    max-width: 880px;
    margin: 0 auto;
    padding: 64px 24px;
  }
  .section h2 {
    font-size: 1.6rem;
    color: var(--primary);
    text-align: center;
    margin-bottom: 32px;
    position: relative;
    padding-bottom: 14px;
  }
  .section h2::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: 0;
    transform: translateX(-50%);
    width: 48px;
    height: 3px;
    background: var(--accent);
    border-radius: 2px;
  }
  .about-body { text-align: center; max-width: 640px; margin: 0 auto; }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
  }
  .card {
    background: #fff;
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 10px;
    padding: 24px;
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
  }
  .card h3 { color: var(--primary); margin-bottom: 10px; font-size: 1.1rem; }
  .card-img {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 14px;
    display: block;
  }
  .products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 24px;
  }
  .product-card {
    background: #fff;
    border: 1px solid rgba(0,0,0,.08);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
    display: flex;
    flex-direction: column;
  }
  .product-card img, .product-noimage {
    width: 100%;
    height: 170px;
    object-fit: cover;
    display: block;
  }
  .product-noimage {
    background: rgba(0,0,0,.06);
    color: rgba(0,0,0,.35);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .85rem;
  }
  .product-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
  .product-body h3 { color: var(--primary); font-size: 1.05rem; }
  .product-body p { font-size: .9rem; }
  .product-body .price {
    margin-top: auto;
    color: var(--accent);
    font-weight: 700;
    font-size: 1.1rem;
    text-align: right;
  }
  .news-list { list-style: none; max-width: 640px; margin: 0 auto; }
  .news-list li {
    display: flex;
    gap: 20px;
    padding: 14px 6px;
    border-bottom: 1px solid rgba(0,0,0,.1);
  }
  .news-list time { color: var(--accent); font-weight: 600; white-space: nowrap; }
  .contact-table { width: 100%; max-width: 560px; margin: 0 auto; border-collapse: collapse; }
  .contact-table th, .contact-table td {
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0,0,0,.1);
  }
  .contact-table th { color: var(--primary); white-space: nowrap; width: 7em; }
  .contact-table a { color: inherit; }
  .map-wrap { max-width: 720px; margin: 28px auto 0; }
  .map-wrap iframe {
    width: 100%;
    height: 320px;
    border: 0;
    border-radius: 10px;
  }
  .call-button {
    position: fixed;
    right: 16px;
    bottom: 16px;
    background: var(--accent);
    color: #fff;
    text-decoration: none;
    font-weight: 700;
    padding: 14px 22px;
    border-radius: 999px;
    box-shadow: 0 4px 14px rgba(0,0,0,.25);
    z-index: 100;
  }
  footer {
    background: var(--primary);
    color: #fff;
    text-align: center;
    padding: 20px;
    font-size: .85rem;
    margin-top: 40px;
  }
</style>
</head>
<body>
${body}
  <footer>&copy; ${new Date().getFullYear()} ${esc(site.name)}</footer>${callButton}
</body>
</html>
`
}
