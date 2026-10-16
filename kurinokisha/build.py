#!/usr/bin/env python3
"""栗の木舎（架空のポートフォリオ）のページを書き出す。

ヘッダー・フッター・<head>・電話番号・営業時間はここ1か所にまとめてある。
本文は src/page-*.html。生成された *.html を直接編集しても次のビルドで消える。
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# ---- ここを書き換えればサイト全体が変わる ----------------------------------
SITE = "https://taisun3son-create.github.io/test-claude-1/kurinokisha"  # 末尾に / は付けない
SHOP = "栗の木舎"
SHOP_KANA = "くりのきしゃ"
SHOP_EN = "Kurinoki-sha"
CATCH = "栗の町の蔵で、自家焙煎の珈琲と栗の焼き菓子を。"
# 架空の店なので、実在の相手につながらない番号にしてある（026-000 は未割当）
TEL_DISP = "026-000-0000"
TEL_HREF = "tel:0260000000"
HOURS_DISP = "10:00〜17:00（L.O. 16:30）"
CLOSED_DISP = "火曜・水曜"
AREA_DISP = "長野県上高井郡小布施町"
ACCESS_DISP = "長野電鉄 小布施駅から徒歩8分"
FICTION_NOTE = "架空のお店のサイトです（制作見本）。住所は町まで、電話番号は実在しない番号にしています。"
INDEXABLE = False  # 架空の店が検索に出ないよう、全ページ noindex
# -------------------------------------------------------------------------

NAV = [
    ("about.html", "お店について", "About"),
    ("menu.html", "メニュー", "Menu"),
    ("news.html", "お知らせ", "News"),
    ("index.html#access", "営業時間・アクセス", "Access"),
]

PAGES = {
    "index.html": dict(src="page-index.html", title=f"{SHOP}｜小布施の古民家喫茶・自家焙煎珈琲と栗の焼き菓子",
                       desc=f"長野県小布施町、築90年の蔵を直した喫茶「{SHOP}」。自家焙煎の珈琲と、地元の栗を使った焼き菓子のお店です。{ACCESS_DISP}。", body="home"),
    "about.html": dict(src="page-about.html", title=f"お店について｜{SHOP}",
                       desc=f"{SHOP}の店主のこと、蔵の歴史、珈琲と焼き菓子へのこだわり。", body="sub"),
    "menu.html": dict(src="page-menu.html", title=f"メニュー｜{SHOP}",
                      desc=f"{SHOP}のメニュー。自家焙煎の珈琲、栗の焼き菓子、季節のもの、珈琲豆とギフト。すべて税込です。", body="sub"),
    "news.html": dict(src="page-news.html", title=f"お知らせ｜{SHOP}",
                      desc=f"{SHOP}からのお知らせ。季節のメニュー、臨時のお休み、イベントのご案内。", body="sub"),
    "reserve.html": dict(src="page-reserve.html", title=f"ご予約・お問い合わせ｜{SHOP}",
                         desc=f"{SHOP}の席のご予約、焼き菓子のお取り置き、ギフトのご注文はこちらから。", body="sub"),
    "en.html": dict(src="page-en.html", title=f"{SHOP_EN} | Old storehouse café in Obuse, Nagano",
                    desc="A small café in a 90-year-old storehouse in Obuse, Nagano. House-roasted coffee and chestnut sweets.", body="sub", lang="en"),
    "privacy.html": dict(src="page-privacy.html", title=f"プライバシーポリシー｜{SHOP}",
                         desc=f"{SHOP}の個人情報の取り扱いについて。", body="sub"),
}

ICON_DIR = ROOT / "assets" / "icons"


def icon(name, cls="ic"):
    """Lucide のSVGを、線の太さ1.5（本文のゴシックに合わせる）で埋め込む。"""
    svg = (ICON_DIR / f"{name}.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S).strip()
    svg = re.sub(r'class="[^"]*"', f'class="{cls}" aria-hidden="true" focusable="false"', svg, count=1)
    svg = svg.replace('stroke-width="2"', 'stroke-width="1.5"')
    svg = re.sub(r'\s*(width|height)="24"', "", svg)
    return re.sub(r"\s+", " ", svg)


LOGO = (
    '<svg class="logo-mark" viewBox="0 0 40 40" aria-hidden="true" focusable="false">'
    '<path d="M20 5c-1 2.6-4.8 6-8.6 9.4C7.9 17.5 6 20.6 6 24.2 6 31 12.3 35 20 35s14-4 14-10.8c0-3.6-1.9-6.7-5.4-9.8C24.8 11 21 7.6 20 5Z" fill="currentColor"/>'
    '<path d="M7.2 27.2c3.6 1.6 8 2.4 12.8 2.4s9.2-.8 12.8-2.4" fill="none" stroke="var(--kinari)" stroke-width="1.4" stroke-linecap="round"/>'
    '<path d="M20 5c.3-1.4 1.2-2.4 2.6-2.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
    "</svg>"
)


def nav_html(cur, cls):
    items = []
    for href, ja, en in NAV:
        here = ' aria-current="page"' if href == cur else ""
        items.append(f'<li><a href="{href}"{here}><span class="en">{en}</span>{ja}</a></li>')
    return f'<ul class="{cls}">' + "".join(items) + "</ul>"


def head(name, p):
    lang = p.get("lang", "ja")
    url = f"{SITE}/" + ("" if name == "index.html" else name)
    robots = "" if INDEXABLE else '<meta name="robots" content="noindex,nofollow">'
    ld = ""
    if name == "index.html":
        ld = json.dumps({
            "@context": "https://schema.org", "@type": "CafeOrCoffeeShop",
            "name": SHOP, "alternateName": SHOP_EN, "url": f"{SITE}/",
            "image": f"{SITE}/assets/og.jpg", "servesCuisine": ["コーヒー", "焼き菓子"],
            "address": {"@type": "PostalAddress", "addressRegion": "長野県", "addressLocality": "上高井郡小布施町", "addressCountry": "JP"},
            "openingHoursSpecification": [{"@type": "OpeningHoursSpecification",
                                           "dayOfWeek": ["Monday", "Thursday", "Friday", "Saturday", "Sunday"],
                                           "opens": "10:00", "closes": "17:00"}],
        }, ensure_ascii=False)
        ld = f'<script type="application/ld+json">{ld}</script>'
    return f"""<!doctype html>
<html lang="{lang}" class="no-js">
<head>
<meta charset="utf-8">
<script>document.documentElement.className = "js";</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{p['title']}</title>
<meta name="description" content="{p['desc']}">
{robots}
<link rel="canonical" href="{url}">
<meta property="og:type" content="{'website' if name == 'index.html' else 'article'}">
<meta property="og:title" content="{p['title']}">
<meta property="og:description" content="{p['desc']}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.jpg">
<meta property="og:locale" content="{'en_US' if lang == 'en' else 'ja_JP'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#F3EEE4">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Shippori+Mincho+B1:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="assets/style.css">
<script src="assets/main.js" defer></script>
{ld}
</head>"""


def header(cur, lang):
    reserve_label = "Reserve" if lang == "en" else "席のご予約"
    return f"""<a class="skip" href="#main">本文へ移動</a>
<header class="site-header">
  <div class="hd-inner">
    <a class="logo" href="index.html" aria-label="{SHOP} トップへ">{LOGO}<span class="logo-txt"><span class="logo-ja">{SHOP}</span><span class="logo-en">{SHOP_EN} &mdash; coffee &amp; sweets</span></span></a>
    <nav class="gnav" aria-label="メインメニュー">{nav_html(cur, 'gnav-list')}</nav>
    <div class="hd-actions">
      <a class="lang" href="{'index.html' if lang == 'en' else 'en.html'}" lang="{'ja' if lang == 'en' else 'en'}">{'日本語' if lang == 'en' else 'English'}</a>
      <a class="btn btn-accent btn-sm" href="reserve.html">{icon('calendar-days')}<span>{reserve_label}</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer">{icon('menu')}<span>メニュー</span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" hidden>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="メニュー">
    <button class="drawer-close" type="button">{icon('x')}<span>閉じる</span></button>
    <nav aria-label="メニュー（スマホ）">{nav_html(cur, 'drawer-list')}</nav>
    <a class="btn btn-accent btn-block" href="reserve.html">{icon('calendar-days')}<span>席のご予約・お取り置き</span></a>
    <a class="drawer-tel" href="{TEL_HREF}">{icon('phone')}<span><small>お電話でのご予約</small><b>{TEL_DISP}</b><small>{HOURS_DISP}／定休 {CLOSED_DISP}</small></span></a>
    <a class="lang drawer-lang" href="en.html" lang="en">English page</a>
  </div>
</div>"""


def footer():
    return f"""<footer class="site-footer">
  <div class="ft-inner">
    <div class="ft-shop">
      <a class="logo logo-ft" href="index.html">{LOGO}<span class="logo-txt"><span class="logo-ja">{SHOP}</span><span class="logo-en">{SHOP_EN}</span></span></a>
      <p>{AREA_DISP}<br>{ACCESS_DISP}</p>
      <p>営業 {HOURS_DISP}<br>定休 {CLOSED_DISP}（祝日は営業）</p>
      <p class="ft-tel"><a href="{TEL_HREF}">{icon('phone')}{TEL_DISP}</a></p>
    </div>
    <nav class="ft-nav" aria-label="フッターメニュー">
      <ul>
        <li><a href="index.html">トップ</a></li>
        <li><a href="about.html">お店について</a></li>
        <li><a href="menu.html">メニュー</a></li>
        <li><a href="news.html">お知らせ</a></li>
        <li><a href="reserve.html">ご予約・お問い合わせ</a></li>
        <li><a href="privacy.html">プライバシーポリシー</a></li>
        <li><a href="en.html" lang="en">English</a></li>
      </ul>
    </nav>
    <div class="ft-cta">
      <p class="ft-cta-lead">週末は混みあいます。<br>お席のご予約はお気軽に。</p>
      <a class="btn btn-light" href="reserve.html">{icon('calendar-days')}<span>席のご予約・お取り置き</span></a>
    </div>
  </div>
  <p class="ft-note">{FICTION_NOTE}</p>
  <p class="ft-copy"><small>&copy; 2026 {SHOP}（制作見本）</small></p>
</footer>
<div class="sp-bar" aria-label="ご予約">
  <a class="sp-bar-tel" href="{TEL_HREF}">{icon('phone')}<span>電話する</span></a>
  <a class="sp-bar-rsv" href="reserve.html">{icon('calendar-days')}<span>席を予約する</span></a>
</div>
<a class="to-top" href="#top" aria-label="ページの先頭へ">{icon('arrow-right', 'ic ic-up')}</a>"""


IMG_DIR = ROOT / "assets" / "img"


def picture(name, alt, opts=""):
    """{{img:名前|説明|eager}} を <picture>（WebP＋JPEG、幅3段階）にする。

    画像は tools/images.py が assets/img/名前-幅.webp / .jpg に書き出す。
    """
    widths = sorted(int(f.stem.rsplit("-", 1)[1]) for f in IMG_DIR.glob(f"{name}-[0-9]*.jpg"))
    if not widths:
        sys.exit(f"画像がありません: assets/img/{name}-*.jpg（python3 tools/images.py を先に実行）")
    from PIL import Image
    with Image.open(IMG_DIR / f"{name}-{widths[0]}.jpg") as im:
        w, h = im.size
    opts_l = opts.split()
    eager = "eager" in opts_l
    sizes = "100vw" if "full" in opts_l else "(min-width: 1024px) 50vw, 100vw"
    webp = ", ".join(f"assets/img/{name}-{x}.webp {x}w" for x in widths)
    jpg = ", ".join(f"assets/img/{name}-{x}.jpg {x}w" for x in widths)
    load = 'fetchpriority="high"' if eager else 'loading="lazy" decoding="async"'
    sp = ""
    if "sp" in opts.split():  # スマホ用に縦長の切り抜きを別に用意した写真
        spw = sorted(int(f.stem.rsplit("-", 1)[1]) for f in IMG_DIR.glob(f"{name}-sp-[0-9]*.jpg"))
        sp = (f'<source media="(max-width: 767px)" type="image/webp" srcset="' + ", ".join(f"assets/img/{name}-sp-{x}.webp {x}w" for x in spw) + '" sizes="100vw">'
              f'<source media="(max-width: 767px)" srcset="' + ", ".join(f"assets/img/{name}-sp-{x}.jpg {x}w" for x in spw) + '" sizes="100vw">')
    return (f'<picture>{sp}<source type="image/webp" srcset="{webp}" sizes="{sizes}">'
            f'<img src="assets/img/{name}-{widths[min(1, len(widths) - 1)]}.jpg" srcset="{jpg}" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="{alt}" {load}></picture>')


NEWS_CATS = {"info": "お知らせ", "season": "季節のメニュー", "closed": "お休み", "event": "催し"}
WEEK = "月火水木金土日"


def news(count):
    """news.json から お知らせ を書き出す。{{news:3}} は新しい順に3件、{{news:all}} は全件。"""
    import datetime
    items = json.loads((ROOT / "news.json").read_text(encoding="utf-8"))
    items.sort(key=lambda x: x["date"], reverse=True)
    full = count == "all"
    if not full:
        items = items[: int(count)]
    rows = []
    for i, n in enumerate(items):
        if n["cat"] not in NEWS_CATS:
            sys.exit(f"news.json の cat が不明です: {n['cat']}（{', '.join(NEWS_CATS)} のどれか）")
        d = datetime.date.fromisoformat(n["date"])
        date = f'<time datetime="{n["date"]}">{d.year}.{d.month:02d}.{d.day:02d}<span>（{WEEK[d.weekday()]}）</span></time>'
        tag = f'<span class="tag tag-{n["cat"]}">{NEWS_CATS[n["cat"]]}</span>'
        if full:
            rows.append(f'<li class="news-item" data-cat="{n["cat"]}" id="news-{n["date"]}-{i}"><details{" open" if i == 0 else ""}>'
                        f'<summary><span class="news-meta">{date}{tag}</span><span class="news-title">{n["title"]}</span>'
                        f'<span class="news-toggle" aria-hidden="true">{icon("plus")}</span></summary>'
                        f'<div class="news-body"><p>{n["body"]}</p></div></details></li>')
        else:
            rows.append(f'<li class="news-item"><a href="news.html#news-{n["date"]}-{i}"><span class="news-meta">{date}{tag}</span>'
                        f'<span class="news-title">{n["title"]}</span>{icon("arrow-right")}</a></li>')
    return f'<ul class="news-list{" news-full" if full else ""}">' + "".join(rows) + "</ul>"


def render(text):
    """本文中の {{icon:name}}・{{img:...}}・{{news:3}}・{{TEL_DISP}} などを置きかえる。"""
    text = re.sub(r"\{\{news:(all|\d+)\}\}", lambda m: news(m.group(1)), text)
    text = re.sub(r"\{\{icon:([a-z-]+)\}\}", lambda m: icon(m.group(1)), text)
    text = re.sub(r"\{\{img:([a-z0-9-]+)\|([^|}]*)\|?([^}]*)\}\}", lambda m: picture(*m.groups()), text)
    for k in ("SHOP", "SHOP_EN", "TEL_DISP", "TEL_HREF", "HOURS_DISP", "CLOSED_DISP", "AREA_DISP", "ACCESS_DISP", "CATCH", "FICTION_NOTE"):
        text = text.replace("{{" + k + "}}", globals()[k])
    left = re.findall(r"\{\{[^}]*\}\}", text)
    if left:
        sys.exit(f"置きかえられていない記号があります: {left}")
    return text


def check_links(out):
    """飛び先のないリンク（ページ・ページ内の #id・画像）があればビルドを止める。"""
    ids = {n: set(re.findall(r'\sid="([^"]+)"', h)) for n, h in out.items()}
    bad = []
    for n, h in out.items():
        for attr, ref in re.findall(r'\s(href|src|srcset)="([^"]+)"', h):
            for r in ([x.strip().split(" ")[0] for x in ref.split(",")] if attr == "srcset" else [ref]):
                if re.match(r"^(https?:|tel:|mailto:|data:)", r) or r == "#top":
                    continue
                page, _, frag = r.partition("#")
                page = page.split("?")[0]
                target = page or n
                if page and not (ROOT / page).exists() and page not in out:
                    bad.append(f"{n}: {r}（ファイルがない）")
                elif frag and target in ids and frag not in ids[target]:
                    bad.append(f"{n}: {r}（#{frag} がない）")
    if bad:
        sys.exit("リンク切れ:\n  " + "\n  ".join(bad))


def main():
    out = {}
    for name, p in PAGES.items():
        body = render((ROOT / "src" / p["src"]).read_text(encoding="utf-8"))
        lang = p.get("lang", "ja")
        out[name] = (head(name, p) + f'\n<body class="page-{p["body"]}" id="top">\n' + header(name, lang)
                     + f'\n<main id="main">\n{body}\n</main>\n' + footer() + "\n</body>\n</html>\n")
    check_links(out)
    for name, html in out.items():
        (ROOT / name).write_text(html, encoding="utf-8")
    print(f"{len(out)}ページを書き出しました")


if __name__ == "__main__":
    main()
