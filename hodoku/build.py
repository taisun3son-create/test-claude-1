#!/usr/bin/env python3
"""整体院 ほどく（架空のポートフォリオ）のページを書き出す。

ヘッダー・フッター・<head>・電話番号・受付時間はここ1か所にまとめてある。
本文は src/page-*.html。生成された *.html を直接編集しても次のビルドで消える。
"""
import datetime
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# ---- ここを書き換えればサイト全体が変わる ----------------------------------
SITE = "https://taisun3son-create.github.io/test-claude-1/hodoku"  # 末尾に / は付けない
SHOP = "整体院 ほどく"
SHOP_SHORT = "ほどく"
SHOP_EN = "Hodoku Bodywork"
DIRECTOR = "宮下 さき"
DIRECTOR_EN = "Saki Miyashita"
# 架空の院なので、実在の相手につながらない番号にしてある（0466-00 は未割当）
TEL_DISP = "0466-00-0000"
TEL_HREF = "tel:0466000000"
HOURS_WEEK = "10:00〜20:00"
HOURS_WEEKEND = "9:00〜17:00"
LAST_WEEK = "19:00"
LAST_WEEKEND = "16:00"
CLOSED_DISP = "水曜"
AREA_DISP = "神奈川県藤沢市辻堂"
AREA_SHORT = "辻堂"  # ページの題名に入れる地域名
ACCESS_DISP = "JR辻堂駅 南口から徒歩6分"
PARKING_DISP = "院の前に2台"
FICTION_NOTE = "架空の整体院のサイトです（制作見本）。住所は町まで、電話番号は実在しない番号にしています。お客様の声・数字も見本です。"
INDEXABLE = False  # 架空の院が検索に出ないよう、全ページ noindex
CLOSED_WEEKDAY = 2  # 水曜（月曜=0）。予約カレンダーとフォームが使う
# -------------------------------------------------------------------------

NAV = [
    ("first.html", "はじめての方へ", "First visit"),
    ("symptoms.html", "お悩み別", "Symptoms"),
    ("menu.html", "料金", "Price"),
    ("index.html#access", "受付時間・アクセス", "Access"),
]

PAGES = {
    "index.html": dict(src="page-index.html", title=f"{SHOP}｜辻堂の整体院・肩こり腰痛・完全予約制",
                       desc=f"藤沢市辻堂、ひとりで営む完全予約制の整体院「{SHOP}」。肩こり・腰痛・頭痛・産後の骨盤まわりに。{ACCESS_DISP}、駐車場あり。", body="home"),
    "first.html": dict(src="page-first.html", title=f"はじめての方へ｜{SHOP}（{AREA_SHORT}の整体院）",
                       desc=f"{SHOP}の施術の考え方、当日の流れ、服装や持ちもの、院長のこと。はじめての方が不安なく来られるようにまとめました。", body="sub"),
    "symptoms.html": dict(src="page-symptoms.html", title=f"お悩み別のご案内｜{SHOP}（{AREA_SHORT}の整体院）",
                          desc=f"肩こり・首の痛み、腰痛、頭痛・目の疲れ、産後の骨盤まわり、姿勢。{SHOP}でのみかたと施術、ご自宅でできるケア。", body="sub"),
    "menu.html": dict(src="page-menu.html", title=f"料金・メニュー｜{SHOP}（{AREA_SHORT}の整体院）",
                      desc=f"{SHOP}の料金。初回、整体60分、30分、産後ケア、回数券。すべて税込です。", body="sub"),
    "reserve.html": dict(src="page-reserve.html", title=f"ご予約｜{SHOP}（{AREA_SHORT}の整体院）",
                         desc=f"{SHOP}のご予約。WEBの予約フォーム、お電話、LINEから。空いている日は受付カレンダーでご確認ください。", body="sub"),
    "en.html": dict(src="page-en.html", title=f"{SHOP_EN} | Bodywork clinic in Tsujido, Fujisawa",
                    desc="A one-therapist bodywork clinic in Tsujido, Fujisawa. Gentle treatment for neck, shoulder and back pain. English spoken.", body="sub", lang="en"),
    "privacy.html": dict(src="page-privacy.html", title=f"プライバシーポリシー｜{SHOP}（{AREA_SHORT}の整体院）",
                         desc=f"{SHOP}の個人情報の取り扱いについて。", body="sub"),
    "404.html": dict(src="page-404.html", title=f"ページが見つかりません｜{SHOP}",
                     desc=f"お探しのページは見つかりませんでした。{SHOP}のトップページからお探しください。", body="sub", noindex=True),
}

ICON_DIR = ROOT / "assets" / "icons"


def icon(name, cls="ic"):
    """Tabler Icons のSVGを、線の太さ1.6（本文のUDゴシックに合わせる）で埋め込む。"""
    svg = (ICON_DIR / f"{name}.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S).strip()
    svg = re.sub(r'class="[^"]*"', f'class="{cls}" aria-hidden="true" focusable="false"', svg, count=1)
    svg = svg.replace('stroke-width="2"', 'stroke-width="1.6"')
    svg = svg.replace('<path stroke="none" d="M0 0h24v24H0z" fill="none"/>', "")
    svg = re.sub(r'\s*(width|height)="24"', "", svg)
    return re.sub(r"\s+", " ", svg)


# ロゴ：からまった糸が、右へ行くほどほどけて1本の線になる
LOGO = (
    '<svg class="logo-mark" viewBox="0 0 64 28" aria-hidden="true" focusable="false">'
    '<path d="M3 17c4-9 13-11 15-5s-7 10-8 4 9-12 16-8 3 10-2 9 1-9 9-8c5 .7 7 4 12 4s9-2 16-2" '
    'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
    "</svg>"
)


def nav_html(cur, cls):
    items = []
    for href, ja, en in NAV:
        here = ' aria-current="page"' if href == cur else ""
        items.append(f'<li><a href="{href}"{here}>{ja}</a></li>')
    return f'<ul class="{cls}">' + "".join(items) + "</ul>"


def head(name, p):
    lang = p.get("lang", "ja")
    url = f"{SITE}/" + ("" if name == "index.html" else name)
    robots = "" if INDEXABLE and not p.get("noindex") else '<meta name="robots" content="noindex,nofollow">'
    ld = ""
    if name == "index.html":
        days_week = ["Monday", "Tuesday", "Thursday", "Friday"]
        ld = json.dumps({
            "@context": "https://schema.org", "@type": "HealthAndBeautyBusiness",
            "name": SHOP, "alternateName": SHOP_EN, "url": f"{SITE}/",
            "image": f"{SITE}/assets/og.jpg", "telephone": TEL_HREF[4:],
            "address": {"@type": "PostalAddress", "addressRegion": "神奈川県", "addressLocality": "藤沢市辻堂", "addressCountry": "JP"},
            "openingHoursSpecification": [
                {"@type": "OpeningHoursSpecification", "dayOfWeek": days_week, "opens": "10:00", "closes": "20:00"},
                {"@type": "OpeningHoursSpecification", "dayOfWeek": ["Saturday", "Sunday"], "opens": "09:00", "closes": "17:00"},
            ],
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
<meta name="theme-color" content="#F6F2EC">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Klee+One:wght@400;600&family=Outfit:wght@300;400;500&family=Zen+Maru+Gothic:wght@500;700&display=swap" media="print" onload="this.media='all'">
<link rel="stylesheet" href="assets/style.css">
<script src="assets/main.js" defer></script>
{ld}
</head>"""


def header(cur, lang):
    en = lang == "en"
    return f"""<a class="skip" href="#main">{'Skip to content' if en else '本文へ移動'}</a>
<header class="site-header">
  <div class="hd-inner">
    <a class="logo" href="index.html" aria-label="{SHOP} トップへ">{LOGO}<span class="logo-txt"><span class="logo-ja"><small>整体院</small>{SHOP_SHORT}</span><span class="logo-en">{SHOP_EN}</span></span></a>
    <nav class="gnav" aria-label="メインメニュー">{nav_html(cur, 'gnav-list')}</nav>
    <div class="hd-actions">
      <a class="hd-tel" href="{TEL_HREF}">{icon('phone')}<span><b>{TEL_DISP}</b><small>{'Closed Wed' if en else f'定休 {CLOSED_DISP}・完全予約制'}</small></span></a>
      <a class="lang" href="{'index.html' if en else 'en.html'}" lang="{'ja' if en else 'en'}">{'日本語' if en else 'English'}</a>
      <a class="btn btn-accent btn-sm" href="reserve.html">{icon('calendar-event')}<span>{'Book' if en else '予約する'}</span></a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="drawer">{icon('menu')}<span>{'Menu' if en else 'メニュー'}</span></button>
    </div>
  </div>
</header>
<div class="drawer" id="drawer" hidden>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="メニュー">
    <button class="drawer-close" type="button">{icon('x')}<span>閉じる</span></button>
    <nav aria-label="メニュー（スマホ）">{nav_html(cur, 'drawer-list')}</nav>
    <a class="btn btn-accent btn-block" href="reserve.html">{icon('calendar-event')}<span>空いている日を見て予約する</span></a>
    <a class="drawer-tel" href="{TEL_HREF}">{icon('phone')}<span><small>お電話でのご予約</small><b>{TEL_DISP}</b><small>受付 {HOURS_WEEK}（土日祝 {HOURS_WEEKEND}）／定休 {CLOSED_DISP}</small></span></a>
    <a class="lang drawer-lang" href="en.html" lang="en">English page</a>
  </div>
</div>"""


def footer(lang):
    en = lang == "en"
    return f"""<section class="ft-cta" aria-labelledby="ft-cta-h">
  <div class="ft-cta-inner">
    <h2 id="ft-cta-h">{'Take a slow breath, and come as you are.' if en else 'がまんする前に、<br class="sp">一度ご相談ください。'}</h2>
    <p>{'Comfortable clothes are provided. Online booking is open 24 hours.' if en else '着替えは院にあります。WEB予約は24時間受け付けています。'}</p>
    <div class="ft-cta-btns">
      <a class="btn btn-accent" href="reserve.html">{icon('calendar-event')}<span>{'Book online' if en else '空いている日を見て予約する'}</span></a>
      <a class="btn btn-line-ink" href="{TEL_HREF}">{icon('phone')}<span>{TEL_DISP}</span></a>
    </div>
  </div>
</section>
<footer class="site-footer">
  <div class="ft-inner">
    <div class="ft-shop">
      <a class="logo logo-ft" href="index.html">{LOGO}<span class="logo-txt"><span class="logo-ja"><small>整体院</small>{SHOP_SHORT}</span><span class="logo-en">{SHOP_EN}</span></span></a>
      <p>{AREA_DISP}<br>{ACCESS_DISP}／駐車場 {PARKING_DISP}</p>
      <p>受付 月・火・木・金 {HOURS_WEEK}（最終受付 {LAST_WEEK}）<br>土・日・祝 {HOURS_WEEKEND}（最終受付 {LAST_WEEKEND}）<br>定休 {CLOSED_DISP}</p>
      <p class="ft-tel"><a href="{TEL_HREF}">{icon('phone')}{TEL_DISP}</a></p>
    </div>
    <nav class="ft-nav" aria-label="フッターメニュー">
      <ul class="ft-cols">
        <li><a href="index.html">トップ</a>
          <ul><li><a href="index.html#worry">こんなお悩みに</a></li><li><a href="index.html#voice">お客様の声</a></li><li><a href="index.html#access">受付時間・アクセス</a></li><li><a href="index.html#faq">よくあるご質問</a></li></ul></li>
        <li><a href="first.html">はじめての方へ</a>
          <ul><li><a href="first.html#policy">施術の考え方</a></li><li><a href="first.html#flow">当日の流れ</a></li><li><a href="first.html#prepare">服装と持ちもの</a></li><li><a href="first.html#director">院長のこと</a></li></ul></li>
        <li><a href="symptoms.html">お悩み別</a>
          <ul><li><a href="symptoms.html#katakori">肩こり・首</a></li><li><a href="symptoms.html#yotsu">腰痛</a></li><li><a href="symptoms.html#zutsu">頭痛・目の疲れ</a></li><li><a href="symptoms.html#sango">産後の骨盤まわり</a></li><li><a href="symptoms.html#shisei">姿勢・猫背</a></li></ul></li>
        <li class="ft-flat">
          <ul><li><a href="menu.html">料金・メニュー</a></li><li><a href="reserve.html">ご予約</a></li><li><a href="privacy.html">プライバシーポリシー</a></li><li><a href="en.html" lang="en">English</a></li></ul></li>
      </ul>
    </nav>
  </div>
  <p class="ft-note">{FICTION_NOTE}</p>
  <p class="ft-copy"><small>&copy; 2026 {SHOP}（制作見本）</small></p>
</footer>
<div class="sp-bar" aria-label="ご予約">
  <a class="sp-bar-tel" href="{TEL_HREF}">{icon('phone')}<span>{'Call' if en else '電話する'}</span></a>
  <a class="sp-bar-rsv" href="reserve.html">{icon('calendar-event')}<span>{'Book online' if en else '空きを見て予約'}</span></a>
</div>
<a class="to-top" href="#top" aria-label="ページの先頭へ">{icon('arrow-up')}</a>"""


IMG_DIR = ROOT / "assets" / "img"


def picture(name, alt, opts=""):
    """{{img:名前|説明|eager sp}} を <picture>（WebP＋JPEG、幅3段階）にする。

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
    if "sp" in opts_l:  # スマホ用に別の切り抜きを用意した写真（名前-sp）
        spw = sorted(int(f.stem.rsplit("-", 1)[1]) for f in IMG_DIR.glob(f"{name}-sp-[0-9]*.jpg"))
        sp = (f'<source media="(max-width: 767px)" type="image/webp" srcset="' + ", ".join(f"assets/img/{name}-sp-{x}.webp {x}w" for x in spw) + '" sizes="100vw">'
              f'<source media="(max-width: 767px)" srcset="' + ", ".join(f"assets/img/{name}-sp-{x}.jpg {x}w" for x in spw) + '" sizes="100vw">')
    return (f'<picture>{sp}<source type="image/webp" srcset="{webp}" sizes="{sizes}">'
            f'<img src="assets/img/{name}-{widths[min(1, len(widths) - 1)]}.jpg" srcset="{jpg}" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="{alt}" {load}></picture>')


NEWS_CATS = {"info": "お知らせ", "closed": "お休み", "menu": "メニュー"}
WEEK = "月火水木金土日"


def news(count):
    """news.json から お知らせ を書き出す。開いて読める形。{{news:3}} は新しい順に3件。"""
    items = json.loads((ROOT / "news.json").read_text(encoding="utf-8"))
    items.sort(key=lambda x: x["date"], reverse=True)
    items = items[: int(count)]
    rows = []
    for i, n in enumerate(items):
        if n["cat"] not in NEWS_CATS:
            sys.exit(f"news.json の cat が不明です: {n['cat']}（{', '.join(NEWS_CATS)} のどれか）")
        d = datetime.date.fromisoformat(n["date"])
        date = f'<time datetime="{n["date"]}">{d.year}.{d.month:02d}.{d.day:02d}<span>（{WEEK[d.weekday()]}）</span></time>'
        tag = f'<span class="tag tag-{n["cat"]}">{NEWS_CATS[n["cat"]]}</span>'
        rows.append(f'<li class="news-item"><details{" open" if i == 0 else ""}>'
                    f'<summary><span class="news-meta">{date}{tag}</span><span class="news-title">{n["title"]}</span>'
                    f'<span class="news-toggle" aria-hidden="true">{icon("plus")}</span></summary>'
                    f'<div class="news-body"><p>{n["body"]}</p></div></details></li>')
    if not rows:  # 0件でもまっ白にしない
        return '<p class="news-none">いまお知らせはありません。受付日は、下の受付カレンダーをご覧ください。</p>'
    return '<ul class="news-list">' + "".join(rows) + "</ul>"


def closed_days():
    """臨時のお休み（news.json の cat=closed に days を書く）を、カレンダー用の日付の一覧にする。"""
    items = json.loads((ROOT / "news.json").read_text(encoding="utf-8"))
    days = sorted({d for n in items for d in n.get("days", [])})
    return ",".join(days)


def render(text):
    """本文中の {{icon:name}}・{{img:...}}・{{news:3}}・{{TEL_DISP}} などを置きかえる。"""
    text = re.sub(r"\{\{news:(\d+)\}\}", lambda m: news(m.group(1)), text)
    text = re.sub(r"\{\{icon:([a-z-]+)\}\}", lambda m: icon(m.group(1)), text)
    text = re.sub(r"\{\{img:([a-z0-9-]+)\|([^|}]*)\|?([^}]*)\}\}", lambda m: picture(*m.groups()), text)
    text = text.replace("{{CLOSED_DAYS}}", closed_days())
    text = text.replace("{{LOGO}}", LOGO)
    for k in ("SHOP", "SHOP_SHORT", "SHOP_EN", "DIRECTOR", "DIRECTOR_EN", "TEL_DISP", "TEL_HREF", "HOURS_WEEK", "HOURS_WEEKEND",
              "LAST_WEEK", "LAST_WEEKEND", "CLOSED_DISP", "AREA_DISP", "ACCESS_DISP", "PARKING_DISP", "FICTION_NOTE"):
        text = text.replace("{{" + k + "}}", globals()[k])
    text = text.replace("{{CLOSED_WEEKDAY}}", str(CLOSED_WEEKDAY))
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
        out[name] = (head(name, p) + f'\n<body class="page-{p["body"]}" id="top" data-closed="{closed_days()}">\n' + header(name, lang)
                     + f'\n<main id="main">\n{body}\n</main>\n' + footer(lang) + "\n</body>\n</html>\n")
    check_links(out)
    for name, html in out.items():
        (ROOT / name).write_text(html, encoding="utf-8")
    # 検索エンジン向けのページ一覧。公開の日に INDEXABLE = True にすると robots.txt から案内される。
    # 制作中も巡回は止めない（止めると各ページの noindex が読まれない）
    urls = "".join(f"  <url><loc>{SITE}/{'' if n == 'index.html' else n}</loc></url>\n" for n, p in PAGES.items() if not p.get("noindex"))
    (ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n'
                                      f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n', encoding="utf-8")
    (ROOT / "robots.txt").write_text("User-agent: *\nAllow: /\n" + (f"Sitemap: {SITE}/sitemap.xml\n" if INDEXABLE else ""), encoding="utf-8")
    print(f"{len(out)}ページを書き出しました")


if __name__ == "__main__":
    main()
