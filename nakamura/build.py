#!/usr/bin/env python3
"""なかむら整体院（架空のポートフォリオ）のページを書き出す。

<head>・ヘッダー・フッター・電話番号・受付時間は、このファイル1か所にまとめてある。
本文は src/page-*.html に書く。書き出された *.html を直接直しても、次のビルドで消える。

本文の中では次の書き方が使える:
  {{TEL}} {{TEL_HREF}} {{SHOP}} などの大文字の名前 … 下の SITE_INFO の値
  {{icon:phone}} … assets/icons/phone.svg を埋め込む
"""
import datetime
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# ---- ここを書き換えればサイト全体が変わる -----------------------------------
SITE_URL = "https://taisun3son-create.github.io/test-claude-1/nakamura"  # 末尾に / は付けない
SITE_INFO = {
    "SHOP": "なかむら整体院",
    "SHOP_EN": "Nakamura Seitai",
    "DIRECTOR": "中村 圭",
    "STAFF": "森 さやか",
    # 架空の院なので、つながらない番号にしてある
    "TEL": "06-0000-0000",
    "TEL_HREF": "tel:0600000000",
    "AREA": "大阪府豊中市 岡町",
    "ACCESS": "阪急宝塚線 岡町駅から歩いて3分",
    "PARKING": "院の前に2台",
    "HOURS_WEEK": "9:00–20:00",
    "HOURS_SAT": "9:00–17:00",
    "LAST_WEEK": "19:00",
    "LAST_SAT": "16:00",
    "CLOSED": "日曜・祝日",
    "PRICE_FIRST": "5,500",
    "PRICE_REGULAR": "4,400",
}
FICTION_NOTE = "このサイトは制作見本です。院・人・電話番号・お客様の声は架空のものです。"
INDEXABLE = False  # 架空の院が検索に出ないよう、全ページ noindex
# -------------------------------------------------------------------------

NAV = [
    ("first.html", "はじめての方へ"),
    ("menu.html", "施術と料金"),
    ("staff.html", "院長とスタッフ"),
    ("reserve.html", "予約・アクセス"),
]

S = SITE_INFO["SHOP"]
PAGES = {
    "index.html": ("page-index.html", f"{S}｜豊中市 岡町駅3分の整体院・肩こり・腰痛",
                   f"豊中市、阪急 岡町駅から歩いて3分の{S}。肩こり・腰痛・頭痛・産後の骨盤に。施術の前に、からだの状態と通う回数の目安をお話しします。"),
    "first.html": ("page-first.html", f"はじめての方へ｜{S}",
                   f"{S}にはじめて来られる方へ。当日の流れ、服装と持ちもの、よくある質問。"),
    "menu.html": ("page-menu.html", f"施術と料金｜{S}",
                  f"{S}の施術と料金。はじめて60分{SITE_INFO['PRICE_FIRST']}円、2回目から40分{SITE_INFO['PRICE_REGULAR']}円。すべて税込。"),
    "staff.html": ("page-staff.html", f"院長とスタッフ｜{S}",
                   f"{S}の院長 {SITE_INFO['DIRECTOR']}と、スタッフ {SITE_INFO['STAFF']}の紹介。"),
    "reserve.html": ("page-reserve.html", f"予約・アクセス｜{S}",
                     f"{S}のご予約と行き方。WEBの予約フォーム、お電話から。{SITE_INFO['ACCESS']}。"),
    "en.html": ("page-en.html", "Nakamura Seitai | Bodywork clinic near Okamachi Station, Toyonaka",
                "A small bodywork clinic, 3 minutes from Okamachi Station (Hankyu Takarazuka Line). Treatment for neck, shoulder and back pain.", "en"),
    "privacy.html": ("page-privacy.html", f"プライバシーポリシー｜{S}", f"{S}の個人情報の取り扱いについて。"),
    "404.html": ("page-404.html", f"ページが見つかりません｜{S}", "お探しのページは見つかりませんでした。"),
}


def icon(name):
    """Lucide のアイコンを、線の太さ1.75（本文の Noto Sans JP に合わせる）で埋め込む。"""
    svg = (ROOT / "assets" / "icons" / f"{name}.svg").read_text(encoding="utf-8")
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.S)
    svg = re.sub(r'class="[^"]*"', 'class="ic" aria-hidden="true" focusable="false"', svg, count=1)
    svg = svg.replace('stroke-width="2"', 'stroke-width="1.75"')
    svg = re.sub(r'\s*(width|height)="24"', "", svg)
    return re.sub(r"\s+", " ", svg).replace("> <", "><").strip()


# ロゴ：背骨のゆるいS字を1本の線で
LOGO_MARK = ('<svg class="logo-mark" viewBox="0 0 16 30" aria-hidden="true" focusable="false">'
             '<path d="M8 2.5C2 8.5 14 12 8 16S2 23.5 8 27.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
             '<circle cx="8" cy="2.5" r="1.9" fill="currentColor"/></svg>')


def fill(text):
    text = re.sub(r"\{\{icon:([a-z0-9-]+)\}\}", lambda m: icon(m.group(1)), text)
    for k, v in SITE_INFO.items():
        text = text.replace("{{" + k + "}}", v)
    text = text.replace("{{LOGO_MARK}}", LOGO_MARK)
    left = re.findall(r"\{\{[^}]+\}\}", text)
    if left:
        raise SystemExit(f"置きかえ忘れ: {left}")
    return text


def header(current, lang):
    if lang == "en":
        nav = '<a href="index.html" lang="ja">日本語</a>'
        return f'''<header class="site-hd">
  <div class="hd-in">
    <a class="logo" href="en.html">{LOGO_MARK}<span>Nakamura Seitai</span></a>
    <nav class="hd-nav" aria-label="Language">{nav}</nav>
  </div>
</header>'''
    links = "".join(
        f'<li><a href="{href}"{" aria-current=\"page\"" if href == current else ""}>{label}</a></li>'
        for href, label in NAV)
    return f'''<header class="site-hd">
  <div class="hd-in">
    <a class="logo" href="index.html">{LOGO_MARK}<span>{{{{SHOP}}}}</span></a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="gnav">{{{{icon:menu}}}}<span>メニュー</span></button>
    <nav class="gnav" id="gnav" aria-label="サイト内のページ">
      <ul>{links}<li><a href="en.html" lang="en">English</a></li></ul>
      <a class="hd-tel" href="{{{{TEL_HREF}}}}"><small>お電話でのご予約</small>{{{{TEL}}}}</a>
      <a class="btn btn-main hd-btn" href="reserve.html#form">WEB予約{{{{icon:arrow-right}}}}</a>
    </nav>
  </div>
</header>'''


def footer(lang):
    year = datetime.date.today().year
    if lang == "en":
        return f'''<footer class="site-ft">
  <div class="ft-in">
    <p class="ft-note">{FICTION_NOTE_EN}</p>
    <p class="ft-copy"><small>&copy; {year} Nakamura Seitai</small></p>
  </div>
</footer>'''
    links = "".join(f'<li><a href="{h}">{l}</a></li>' for h, l in NAV)
    return f'''<footer class="site-ft">
  <div class="ft-in">
    <div class="ft-shop">
      <a class="logo logo-ft" href="index.html">{LOGO_MARK}<span>{{{{SHOP}}}}</span></a>
      <p>{{{{AREA}}}}（{{{{ACCESS}}}}）<br>駐車場 {{{{PARKING}}}}</p>
      <p class="ft-tel"><a href="{{{{TEL_HREF}}}}">{{{{icon:phone}}}}{{{{TEL}}}}</a></p>
      <p>受付 平日 {{{{HOURS_WEEK}}}}／土曜 {{{{HOURS_SAT}}}}<br>休み {{{{CLOSED}}}}</p>
    </div>
    <nav class="ft-nav" aria-label="フッターのリンク">
      <ul><li><a href="index.html">トップ</a></li>{links}<li><a href="en.html" lang="en">English</a></li><li><a href="privacy.html">プライバシーポリシー</a></li></ul>
    </nav>
    <p class="ft-note">{FICTION_NOTE}</p>
    <p class="ft-copy"><small>&copy; {year} {{{{SHOP}}}}</small></p>
  </div>
  <a class="to-top" href="#top">{{{{icon:arrow-up}}}}<span>上へ</span></a>
</footer>
<div class="sp-bar">
  <a href="{{{{TEL_HREF}}}}">{{{{icon:phone}}}}電話する</a>
  <a class="sp-main" href="reserve.html#form">{{{{icon:calendar-check}}}}空きを見て予約</a>
</div>'''


FICTION_NOTE_EN = "This is a sample website. The clinic, people and phone number are fictional."


def page(name, src, title, desc, lang="ja"):
    body = (ROOT / "src" / src).read_text(encoding="utf-8")
    robots = "" if INDEXABLE and name != "404.html" else '\n<meta name="robots" content="noindex, nofollow">'
    url = f"{SITE_URL}/{'' if name == 'index.html' else name}"
    html = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">{robots}
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE_URL}/assets/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#1F5546">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500&family=Noto+Sans+JP:wght@400;500;700&display=swap">
<link rel="stylesheet" href="assets/style.css">
<script src="assets/main.js" defer></script>
</head>
<body class="{'home' if name == 'index.html' else 'sub'}" id="top">
<a class="skip" href="#main">{'Skip to content' if lang == 'en' else '本文へ移動'}</a>
{header(name, lang)}
<main id="main">
{body}
</main>
{footer(lang)}
</body>
</html>
'''
    (ROOT / name).write_text(fill(html), encoding="utf-8")


def main():
    for name, spec in PAGES.items():
        page(name, *spec)
    (ROOT / "robots.txt").write_text("User-agent: *\nDisallow: /\n" if not INDEXABLE else
                                     f"User-agent: *\nAllow: /\nSitemap: {SITE_URL}/sitemap.xml\n", encoding="utf-8")
    print("書き出し:", ", ".join(PAGES))


if __name__ == "__main__":
    main()
