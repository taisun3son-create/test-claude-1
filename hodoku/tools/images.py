#!/usr/bin/env python3
"""_photos/ の元写真を、切り抜き・色味そろえ・縮小して assets/img/ に書き出す。

元写真はすべて ぱくたそ（https://www.pakutaso.com/）。出どころは licenses/photos.md。
_photos/ は Git に入れていない（重いため）。作り直すときは photos.md のページから取り直す。
"""
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_photos"
OUT = ROOT / "assets" / "img"
WIDTHS = (640, 1000, 1400)

# 名前: (元ファイル, 横:縦, 切り抜く中心の位置 x, y（0〜1）[, 寄る割合])
PHOTOS = {
    # 最初の画面＝院の部屋（ぱくたその AI素材。人は写っていない部屋だけ）。
    # 主役（ベッドと壁の光）は左寄り → 文字は右の空いた壁に置く。右端の暖房器は切り落とす
    "hero": ("AIT854d335_TP_V.jpg", (3, 2), (0.44, 0.5)),
    "hero-sp": ("AIT854d335_TP_V.jpg", (4, 3), (0.3, 0.55)),
    # 帰り道の海（江ノ島の海岸から富士山。辻堂の浜と同じ黒い砂）
    "fuji": ("N811_enoshimakaranofuji_TP_V.jpg", (4, 5), (0.5, 0.6)),
    "fuji-sp": ("N811_enoshimakaranofuji_TP_V.jpg", (4, 3), (0.5, 0.6)),
    "press": ("takao313DSC_07452065_TP_V.jpg", (4, 3), (0.55, 0.5)),
    "sleep": ("yukasan10I9A9351_TP_V.jpg", (4, 3), (0.55, 0.55)),
    "director": ("takao313DSC_07022061_TP_V.jpg", (4, 5), (0.42, 0.45)),
    "neck": ("yoga010A7984_TP_V.jpg", (4, 3), (0.42, 0.45)),
    "shoulder": ("miyuPAUI2454_TP_V.jpg", (4, 3), (0.62, 0.5)),
    "stretch": ("yoga010A7746_TP_V.jpg", (4, 3), (0.6, 0.55)),
    "sea": ("C789_enoshimanohuyunoumi_TP_V.jpg", (16, 9), (0.5, 0.6)),
    # 下層ページの頭（横長 21:9）
    "ph-first": ("takao313DSC_07442064_TP_V.jpg", (21, 9), (0.55, 0.5)),
    "ph-symptoms": ("yoga010A7984_TP_V.jpg", (21, 9), (0.45, 0.3)),
    "ph-menu": ("takao313DSC_07452065_TP_V.jpg", (21, 9), (0.55, 0.5)),
    "ph-reserve": ("yukasan10I9A9351_TP_V.jpg", (21, 9), (0.55, 0.55)),
    "ph-en": ("C789_enoshimanohuyunoumi_TP_V.jpg", (21, 9), (0.5, 0.62)),
}


def crop(im, ratio, focus, zoom=1.0):
    w, h = im.size
    if zoom < 1:
        nw0, nh0 = int(w * zoom), int(h * zoom)
        x0, y0 = int(focus[0] * w - nw0 / 2), int(focus[1] * h - nh0 / 2)
        x0, y0 = min(max(x0, 0), w - nw0), min(max(y0, 0), h - nh0)
        im = im.crop((x0, y0, x0 + nw0, y0 + nh0)); w, h = im.size
    rw, rh = ratio
    if w / h > rw / rh:  # 横が長すぎる → 横を切る
        nw, nh = int(h * rw / rh), h
    else:
        nw, nh = w, int(w * rh / rw)
    cx, cy = focus
    x = min(max(int(cx * w - nw / 2), 0), w - nw)
    y = min(max(int(cy * h - nh / 2), 0), h - nh)
    return im.crop((x, y, x + nw, y + nh))


# 白い部屋の写真は青白いので、サイトの生成り色になじむよう、ほかより強くあたためる
WARM = {"hero", "hero-sp"}


def tone(im, warm=False):
    """色味をそろえる：彩度を少し落とし、ほんの少しだけあたたかく（撮影日のちがう写真をなじませる）。"""
    im = ImageEnhance.Color(im).enhance(0.88)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.02 + 1)))
    b = b.point(lambda v: int(v * 0.97))
    if warm:
        r = r.point(lambda v: min(255, int(v * 1.03 + 2)))
        g = g.point(lambda v: min(255, int(v * 1.0 + 1)))
        b = b.point(lambda v: int(v * 0.93))
    return Image.merge("RGB", (r, g, b))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, ratio, focus, *zoom) in PHOTOS.items():
        if not (SRC / src).exists():  # 元写真が手元にないものは、今ある書き出しをそのまま使う
            print("とばしました（元写真がない）:", name)
            continue
        im = tone(crop(Image.open(SRC / src).convert("RGB"), ratio, focus, *zoom), name in WARM)
        widths = [w for w in WIDTHS if w < im.width] + [min(im.width, WIDTHS[-1])]
        for w in sorted(set(widths)):
            h = round(im.height * w / im.width)
            small = im.resize((w, h), Image.LANCZOS)
            small.save(OUT / f"{name}-{w}.jpg", quality=80, optimize=True, progressive=True)
            small.save(OUT / f"{name}-{w}.webp", quality=76, method=6)
    # SNS用（1200×630）
    src = SRC / PHOTOS["hero"][0]
    if src.exists():
        og = tone(crop(Image.open(src).convert("RGB"), (40, 21), (0.45, 0.55)), True).resize((1200, 630), Image.LANCZOS)
        og.save(ROOT / "assets" / "og.jpg", quality=82, optimize=True)
    print("書き出しました:", len(PHOTOS), "枚")


if __name__ == "__main__":
    main()
