#!/usr/bin/env python3
"""_photos/ の元写真を、切り抜き・色味そろえ・縮小して assets/img/ に書き出す。

元写真はすべて ぱくたそ（https://www.pakutaso.com/）の L サイズ。出どころは licenses/photos.md。
_photos/ は Git に入れていない（重いため）。作り直すときは photos.md のページから取り直す。
"""
from pathlib import Path

from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_photos"
OUT = ROOT / "assets" / "img"
WIDTHS = (640, 1200, 1600)

# 名前: (元ファイル, 横:縦, 切り抜く中心の位置 x, y（0〜1）[, 寄る割合])
PHOTOS = {
    "hero": ("nerusan0614_1_TP_V.jpg", (16, 9), (0.42, 0.62), 0.86),  # 花瓶を中央より少し右に（文字は左）
    "hero-sp": ("nerusan0614_1_TP_V.jpg", (4, 5), (0.4, 0.6)),
    "kura": ("haro20211031-A7305044_TP_V.jpg", (4, 3), (0.45, 0.6)),
    "cup": ("ogasutaFJ04_TP_V.jpg", (3, 4), (0.32, 0.5)),
    "roast": ("kissaten-_92A6908-8905_TP_V.jpg", (4, 5), (0.5, 0.5)),
    "sweets": ("_TS44393_TP_V.jpg", (1, 1), (0.6, 0.5)),
    "room": ("031ameman54_TP_V.jpg", (4, 5), (0.5, 0.45)),
    "g1": ("kissaten-_92A4275-8891_TP_V.jpg", (4, 5), (0.5, 0.5)),
    "g2": ("ogasuta458A7898_TP_V.jpg", (4, 5), (0.55, 0.5)),
    "g3": ("ogasutaFJ03_TP_V.jpg", (4, 5), (0.5, 0.5)),
    "g4": ("kissaten-_92A4531-8894_TP_V.jpg", (4, 5), (0.5, 0.6)),
    "g5": ("penfan_KP_1615_TP_V.jpg", (4, 5), (0.45, 0.5)),
    "g6": ("009fujiko1122_TP_V.jpg", (4, 5), (0.55, 0.45)),
    "about-hands": ("kissaten-_92A4531-8894_TP_V.jpg", (4, 5), (0.5, 0.62)),
    "about-garden": ("haro20211031-A7304898_TP_V.jpg", (3, 2), (0.5, 0.5)),
    "about-drip": ("kissaten-_92A4143-8889_TP_V.jpg", (4, 5), (0.45, 0.6)),
    "menu-coffee": ("ellycollection046_TP_V.jpg", (4, 3), (0.5, 0.42)),
    "menu-sweets": ("_TS44395_TP_V.jpg", (4, 3), (0.55, 0.5)),
    "menu-chestnut": ("009fujiko1122_TP_V.jpg", (4, 3), (0.5, 0.5)),
    "menu-beans": ("ogasutaFJ03_TP_V.jpg", (4, 3), (0.5, 0.5)),
    # 下層ページの頭の写真（横長 5:2。スマホでは真ん中を 3:2 ほどで見せる）
    "ph-about": ("haro20211031-A7305044_TP_V.jpg", (5, 2), (0.42, 0.62)),
    "ph-menu": ("kissaten-_92A6908-8905_TP_V.jpg", (5, 2), (0.5, 0.45)),
    "ph-news": ("009fujiko1122_TP_V.jpg", (5, 2), (0.55, 0.45)),
    "ph-reserve": ("031ameman54_TP_V.jpg", (5, 2), (0.5, 0.42)),
    "ph-en": ("nerusan0614_1_TP_V.jpg", (5, 2), (0.42, 0.66)),
}


def crop(im, ratio, focus, zoom=1.0):
    w, h = im.size
    if zoom < 1:  # 両端のストーブなどを外すため、中心へ寄る
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


def warm(im):
    """色味をそろえる：少しだけ彩度を落として、赤みを足す（写真ごとのバラつきを減らす）。"""
    im = ImageEnhance.Color(im).enhance(0.9)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.03 + 2)))
    b = b.point(lambda v: int(v * 0.96))
    return Image.merge("RGB", (r, g, b))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, ratio, focus, *zoom) in PHOTOS.items():
        if not (SRC / src).exists():  # 元写真が手元にないものは、今ある書き出しをそのまま使う
            print("とばしました（元写真がない）:", name)
            continue
        im = warm(crop(Image.open(SRC / src).convert("RGB"), ratio, focus, *zoom))
        widths = [w for w in WIDTHS if w < im.width] + [min(im.width, WIDTHS[-1])]
        for w in sorted(set(widths)):
            h = round(im.height * w / im.width)
            small = im.resize((w, h), Image.LANCZOS)
            small.save(OUT / f"{name}-{w}.jpg", quality=80, optimize=True, progressive=True)
            small.save(OUT / f"{name}-{w}.webp", quality=76, method=6)
    # SNS用（1200×630）
    og = warm(crop(Image.open(SRC / PHOTOS["hero"][0]).convert("RGB"), (40, 21), (0.5, 0.6), 0.86)).resize((1200, 630), Image.LANCZOS)
    og.save(ROOT / "assets" / "og.jpg", quality=82, optimize=True)
    print("書き出しました:", len(PHOTOS), "枚")


if __name__ == "__main__":
    main()
