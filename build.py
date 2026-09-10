#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
6ページ分のHTMLを書き出す。

ヘッダー・フッター・<head> をこのファイル1か所で持ち、各ページの本文は
src/page-*.html から読み込む。ページを増やしても共通部分を1回直せば済む。

    python3 build.py

出力（リポジトリ直下）:
    index.html service.html flow.html voice.html faq.html reserve.html thanks.html
"""
import json
import os
import re

FONTS = ("https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@700"
         "&amp;family=Zen+Kaku+Gothic+New:wght@500;700&amp;display=swap")
SITE = "https://example.com"          # 納品時に実ドメインへ差し替える
NAME = "陽だまり家事サポート"
# 架空の番号。0561 は瀬戸市の市外局番、局番 00 は未割当なので実在の相手にはつながらない
TEL_DISP = "0561-00-0000"
TEL_HREF = "tel:0561000000"
BRAND = "ひだまり"

# ---------------------------------------------------------------- ページ定義
PAGES = [
    dict(
        slug="index", file="index.html", nav=None,
        title=f"{NAME}｜シニア世帯のための家事代行（愛知県瀬戸市）",
        desc="愛知県瀬戸市を中心にお伺いする、シニア世帯のための家事代行サービス。掃除・洗濯・買い物代行など。週に一度、いつも同じ担当が伺います。初回2時間6,400円でお試しいただけます。",
        crumb=None,
        next=[("サービス内容と料金を見る", "service.html", "main"),
              ("ご予約・ご相談", "reserve.html", "ghost")],
    ),
    dict(
        slug="service", file="service.html", nav="サービス・料金",
        title=f"サービス内容と料金｜{NAME}（愛知県瀬戸市）",
        desc="掃除・洗濯・買い物代行などの内容と、税込の料金をご案内します。ご利用は1回2時間から。時間あたりの料金に交通費900円を加えた金額が、1回のお支払い額です。",
        crumb="サービス・料金",
        next=[("ご利用の流れを見る", "flow.html", "ghost"),
              ("この内容で相談する", "reserve.html", "main")],
    ),
    dict(
        slug="flow", file="flow.html", nav="ご利用の流れ",
        title=f"ご利用の流れ｜{NAME}（愛知県瀬戸市）",
        desc="ご相談から初回訪問まで最短5日。お電話・Webでのご相談、ご自宅での打ち合わせ、ご契約、サービス開始までの4段階をご説明します。ご家族の代理でのお申し込みも承ります。",
        crumb="ご利用の流れ",
        next=[("よくある質問を見る", "faq.html", "ghost"),
              ("ご予約・ご相談", "reserve.html", "main")],
    ),
    dict(
        slug="voice", file="voice.html", nav="お客様の声",
        title=f"お客様の声｜{NAME}（愛知県瀬戸市）",
        desc="瀬戸市・尾張旭市でご利用いただいている方からお寄せいただいた声をご紹介します。離れて暮らすご家族からのご相談も承っています。",
        crumb="お客様の声",
        next=[("サービス内容と料金を見る", "service.html", "ghost"),
              ("ご予約・ご相談", "reserve.html", "main")],
    ),
    dict(
        slug="faq", file="faq.html", nav="よくある質問",
        title=f"よくある質問｜{NAME}（愛知県瀬戸市）",
        desc="留守中の作業、担当者の固定、介護保険との関係、契約期間、支払い方法など、よくいただくご質問にお答えします。",
        crumb="よくある質問",
        next=[("料金を見る", "service.html", "ghost"),
              ("ご予約・ご相談", "reserve.html", "main")],
    ),
    dict(
        slug="reserve", file="reserve.html", nav="ご予約",
        title=f"ご予約・ご相談｜{NAME}（愛知県瀬戸市）",
        desc="ご相談・お見積り・訪問での打ち合わせは無料です。1営業日以内に担当者からご連絡します。ご家族の代理でのお申し込みも承ります。",
        crumb="ご予約・ご相談",
        next=[],
    ),
]

# ナビには出さない補助ページ（送信完了・法務）
UTILITY = [
    dict(slug="thanks", file="thanks.html", nav=None, crumb="お申し込みありがとうございます",
         title=f"お申し込みを受け付けました｜{NAME}",
         desc="お申し込みを受け付けました。1営業日以内に担当者からお電話でご連絡します。",
         noindex=True, next=[("ホームへ戻る", "index.html", "ghost")]),
    dict(slug="privacy", file="privacy.html", nav=None, crumb="プライバシーポリシー",
         title=f"プライバシーポリシー｜{NAME}",
         desc="当社がお預かりする個人情報の取得項目、利用目的、第三者提供、保管期間、開示請求の方法についてご説明します。",
         next=[("ご予約・ご相談", "reserve.html", "ghost")]),
    dict(slug="tokushoho", file="tokushoho.html", nav=None, crumb="特定商取引法に基づく表記",
         title=f"特定商取引法に基づく表記｜{NAME}",
         desc="役務の対価、支払方法、提供時期、キャンセル・解約の条件など、特定商取引法に基づく表示です。",
         next=[("サービス内容と料金", "service.html", "ghost")]),
]
PAGES += UTILITY
NAV = [p for p in PAGES if p["nav"]]

# ---------------------------------------------------------------- 構造化データ
BUSINESS = {
    "@type": "LocalBusiness",
    "@id": f"{SITE}/#business",
    "name": f"{NAME}株式会社",
    "alternateName": BRAND,
    "description": "愛知県瀬戸市を中心とした、シニア世帯のための家事代行サービス。掃除・洗濯・買い物代行などを、少人数の体制でお伺いします。",
    "url": f"{SITE}/",
    "telephone": "+81-561-00-0000",
    "image": f"{SITE}/assets/og.jpg",
    "foundingDate": "2026",
    "priceRange": "￥￥",
    "address": {"@type": "PostalAddress", "addressRegion": "愛知県",
                "addressLocality": "瀬戸市", "addressCountry": "JP"},
    "openingHoursSpecification": [{
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "09:00", "closes": "18:00"}],
    "areaServed": [{"@type": "City", "name": n} for n in ("瀬戸市", "尾張旭市", "長久手市", "春日井市")],
    "makesOffer": [
        {"@type": "Offer", "name": "おためし（初回限定）", "price": "5500", "priceCurrency": "JPY",
         "description": "初回限定・2時間のお試しプラン。2時間5,500円に交通費900円を加えた6,400円です。継続契約は不要です。"},
        {"@type": "Offer", "name": "定期プラン（週1回）", "price": "2750", "priceCurrency": "JPY",
         "description": "1時間あたりの料金。ご利用は2時間からで、別途1回900円の交通費がかかります。曜日・時間・担当を固定してお伺いします。"},
        {"@type": "Offer", "name": "定期プラン（隔週）", "price": "3080", "priceCurrency": "JPY",
         "description": "1時間あたりの料金。ご利用は2時間からで、別途1回900円の交通費がかかります。"},
        {"@type": "Offer", "name": "単発でのご利用", "price": "3630", "priceCurrency": "JPY",
         "description": "1時間あたりの料金。ご利用は2時間からで、別途1回900円の交通費がかかります。大掃除・衣替え・来客前などに。"},
    ],
}


def faq_schema(html):
    """faq.html の <details> から FAQPage を組み立てる。本文と食い違わないよう自動生成する。"""
    qa = re.findall(r"<summary>(.*?)</summary>\s*<p class=\"faq__a\">(.*?)</p>", html, re.S)
    strip = lambda t: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", t)).strip()
    return {"@type": "FAQPage", "@id": f"{SITE}/faq.html#faq",
            "mainEntity": [{"@type": "Question", "name": strip(q),
                            "acceptedAnswer": {"@type": "Answer", "text": strip(a)}} for q, a in qa]}


def breadcrumb(page):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "ホーム", "item": f"{SITE}/"},
        {"@type": "ListItem", "position": 2, "name": page["crumb"], "item": f"{SITE}/{page['file']}"}]}


# ---------------------------------------------------------------- 部品
def head(page, graph):
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph},
                    ensure_ascii=False, indent=2)
    # 送信完了ページは検索結果に出す意味がないので除外する
    robots = '\n<meta name="robots" content="noindex, follow">' if page.get("noindex") else ""
    return f'''<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{page["title"]}</title>
<meta name="description" content="{page["desc"]}">
<link rel="canonical" href="{SITE}/{page["file"]}">{robots}
<meta name="theme-color" content="#14464F">
<meta name="format-detection" content="telephone=yes">

<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta property="og:site_name" content="{NAME}">
<meta property="og:title" content="{page["title"]}">
<meta property="og:description" content="{page["desc"]}">
<meta property="og:url" content="{SITE}/{page["file"]}">
<meta property="og:image" content="{SITE}/assets/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="台所に立つご夫婦と、そばで手伝う担当者">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%2314464F'/%3E%3Ccircle cx='42' cy='22' r='11' fill='%23E2A02F'/%3E%3Cpath d='M12 46h40M12 34h40M24 12v40M38 12v40' stroke='%23ffffff' stroke-opacity='.55' stroke-width='2.5'/%3E%3C/svg%3E">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="assets/style.css">
<!-- Webフォントは描画を止めないように後から読み込む。届くまでは明朝/ゴシックの代替で表示される -->
<link rel="preload" as="style" href="{FONTS}" onload="this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{FONTS}"></noscript>

<script type="application/ld+json">
{ld}
</script>'''


def header(page):
    def link(p):
        cur = ' aria-current="page"' if p["slug"] == page["slug"] else ""
        cls = ' class="nav__cta"' if p["slug"] == "reserve" else ""
        return f'      <a href="{p["file"]}"{cls}{cur}>{p["nav"]}</a>'
    nav = "\n".join(link(p) for p in NAV)
    return f'''<header class="head">
  <div class="wrap head__in">
    <a class="logo" href="index.html">
      <span class="logo__mark" aria-hidden="true"></span>
      <span class="logo__txt">{NAME}
        <span class="logo__sub">HIDAMARI SETO</span>
      </span>
    </a>

    <div class="fsize">
      <span id="fsLabel">文字サイズ</span>
      <button type="button" class="js-fs" data-size="m" aria-pressed="true" aria-describedby="fsLabel">標準</button>
      <button type="button" class="js-fs" data-size="l" aria-pressed="false" aria-describedby="fsLabel">大</button>
    </div>

    <div class="headtel">
      <a class="headtel__num" href="{TEL_HREF}">☎ {TEL_DISP}</a>
      <span class="headtel__note">9:00〜18:00／土日祝も受付</span>
    </div>

    <button class="burger" type="button" id="burger" aria-expanded="false" aria-controls="drawer">
      <span class="burger__bars" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="burger__label">メニュー</span>
    </button>
  </div>

  <div class="head__navbar">
    <nav class="nav wrap" id="nav" aria-label="メインメニュー">
{nav}
    </nav>
  </div>
</header>'''


# ドロワーの中の小項目。右側のボタンを押すと1つ下に出る
DRAWER_SUB = {
    "service": [("料金試算", "service.html#calc")],
}


def drawer(page):
    def link(p):
        cur = ' aria-current="page"' if p["slug"] == page["slug"] else ""
        sub = DRAWER_SUB.get(p["slug"])
        if not sub:
            return f'      <a href="{p["file"]}"{cur}>{p["nav"]}</a>'
        sid = f'drawer-sub-{p["slug"]}'
        items = "\n".join(f'        <a href="{href}">{label}</a>' for label, href in sub)
        return (f'      <div class="drawer__row">\n'
                f'        <a href="{p["file"]}"{cur}>{p["nav"]}</a>\n'
                f'        <button class="drawer__toggle" type="button" aria-expanded="false" '
                f'aria-controls="{sid}"><span class="vh">{p["nav"]}の中の項目を開く</span></button>\n'
                f'      </div>\n'
                f'      <div class="drawer__sub" id="{sid}" hidden>\n{items}\n      </div>')

    home_cur = ' aria-current="page"' if page["slug"] == "index" else ""
    nav = "\n".join([f'      <a href="index.html"{home_cur}>ホーム</a>'] + [link(p) for p in NAV])
    return f'''<div class="drawer" id="drawer" data-open="false">
  <button class="drawer__scrim" type="button" tabindex="-1" aria-hidden="true"></button>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="メニュー">
    <div class="drawer__head">
      <span class="drawer__title">メニュー</span>
      <button class="drawer__close" type="button" id="drawerClose">閉じる ✕</button>
    </div>

    <nav class="drawer__nav" aria-label="メインメニュー（モバイル）">
{nav}
    </nav>

    <a class="drawer__tel" href="{TEL_HREF}">
      <span>お電話でのご相談</span>
      <b>{TEL_DISP}</b>
      <small>受付 9:00〜18:00／土日祝も受付</small>
    </a>

    <div class="fsize">
      <span id="fsLabel2">文字サイズ</span>
      <button type="button" class="js-fs" data-size="m" aria-pressed="true" aria-describedby="fsLabel2">標準</button>
      <button type="button" class="js-fs" data-size="l" aria-pressed="false" aria-describedby="fsLabel2">大</button>
    </div>
  </div>
</div>'''


def crumb(page):
    if not page.get("crumb"):
        return ""
    return f'''  <nav class="crumb" aria-label="現在位置">
    <ol class="wrap">
      <li><a href="index.html">ホーム</a></li>
      <li aria-current="page">{page["crumb"]}</li>
    </ol>
  </nav>
'''


def nextstep(page):
    if not page.get("next"):
        return ""
    btns = "\n".join(
        f'        <a class="btn btn--{k}" href="{href}">{label}</a>' for label, href, k in page["next"])
    return f'''
  <section class="nextstep" aria-label="次にご覧いただくページ">
    <div class="wrap">
      <div class="nextstep__in">
{btns}
      </div>
    </div>
  </section>
'''


def footer():
    links = "\n".join(f'          <li><a href="{p["file"]}">{p["nav"]}</a></li>' for p in NAV)
    return f'''<footer class="foot">
  <div class="wrap">
    <div class="foot__grid">
      <div>
        <h2 class="foot__h">{NAME}株式会社</h2>
        <address style="font-style:normal">
          〒000-0000（記入してください）<br>
          愛知県瀬戸市（住所を記入してください）<br>
          電話 <a href="{TEL_HREF}">{TEL_DISP}</a>／9:00〜18:00
        </address>
      </div>
      <nav aria-label="フッターメニュー">
        <h2 class="foot__h">メニュー</h2>
        <ul>
          <li><a href="index.html">ホーム</a></li>
{links}
        </ul>
      </nav>
      <div>
        <h2 class="foot__h">対応エリア</h2>
        <p>愛知県瀬戸市を中心に、尾張旭市・長久手市・春日井市の一部<br>※ 上記以外の地域もご相談ください</p>
      </div>
    </div>
    <p class="foot__copy">
      <span>© 2026 {NAME}株式会社</span>
      <a href="privacy.html">プライバシーポリシー</a>
      <a href="tokushoho.html">特定商取引法に基づく表記</a>
    </p>
  </div>
</footer>

<div class="mbar">
  <a class="btn btn--tel" href="{TEL_HREF}">☎ 電話する</a>
  <a class="btn btn--main" href="reserve.html">Web予約</a>
</div>

<button class="totop" type="button" id="totop" aria-label="ページの先頭へ戻る">
  <span aria-hidden="true">↑</span>
</button>

<script src="assets/main.js" defer></script>'''


# ---------------------------------------------------------------- 書き出し
def promote_h1(body, page):
    """サブページでは、そのページの主題が h1 になるように格上げする。"""
    if page["slug"] == "index":
        return body
    body = re.sub(r'<h2 class="h2"((?: id="[\w-]+")?)>',
                  r'<h1 class="h2 page-title"\1>', body, count=1)
    return re.sub(r"</h2>", "</h1>", body, count=1)


def check_links(files):
    """リンク切れを検出する。

    1ページを複数ページに分けたとき、ページ内リンク（#reserve など）が
    そのまま残るとどこにも飛ばなくなる。実際にそれで壊れたので、
    ビルドのたびに機械的に確かめる。
    """
    problems = []
    for f in files:
        html = open(f, encoding="utf-8").read()
        ids = set(re.findall(r'\sid="([^"]+)"', html))
        for href in re.findall(r'href="([^"]+)"', html):
            if href.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
                continue
            path, _, frag = href.partition("#")
            if path and not os.path.exists(path):
                problems.append(f"{f}: {href} → {path} が存在しない")
            elif not path and frag and frag not in ids:
                problems.append(f"{f}: {href} → このページに #{frag} がない")
    if problems:
        print("\n★ リンク切れが見つかりました:")
        for p_ in problems:
            print("   " + p_)
        raise SystemExit(1)
    print("  リンク切れなし")


def build():
    written = []
    for page in PAGES:
        body = open(f"src/page-{page['slug']}.html", encoding="utf-8").read()
        body = promote_h1(body, page)

        graph = [BUSINESS] if page["slug"] == "index" else [breadcrumb(page)]
        if page["slug"] == "faq":
            graph.append(faq_schema(body))
        if page["slug"] == "reserve":
            graph.append(BUSINESS)

        html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
{head(page, graph)}
</head>
<body>

<a class="skip" href="#main">本文へ移動する</a>

{header(page)}

{drawer(page)}

<main id="main">
{crumb(page)}
{body}
{nextstep(page)}</main>

{footer()}
</body>
</html>
'''
        open(page["file"], "w", encoding="utf-8").write(html)
        written.append((page["file"], os.path.getsize(page["file"])))

    # sitemap.xml
    urls = "\n".join(
        f'  <url><loc>{SITE}/{p["file"]}</loc><changefreq>monthly</changefreq>'
        f'<priority>{"1.0" if p["slug"] == "index" else "0.8"}</priority></url>'
        for p in PAGES if not p.get("noindex"))
    open("sitemap.xml", "w", encoding="utf-8").write(
        f'<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n')

    open("robots.txt", "w", encoding="utf-8").write(
        f"User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n")

    check_links([f for f, _ in written])

    for f, size in written:
        print(f"  {f:<16} {size/1024:6.1f} KB")
    print(f"  {'sitemap.xml':<16} {os.path.getsize('sitemap.xml')/1024:6.1f} KB")
    print(f"  {'robots.txt':<16} {os.path.getsize('robots.txt')/1024:6.1f} KB")


if __name__ == "__main__":
    build()
