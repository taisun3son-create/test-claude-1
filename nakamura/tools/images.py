#!/usr/bin/env python3
"""_photos/ の元写真から、サイトで使う WebP を書き出す（位置情報などのメタデータは消える）。

元写真は Git に入れない。写真の出どころは licenses/photos.md。
"""
from pathlib import Path
from PIL import Image, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_photos"
OUT = ROOT / "assets" / "img"

# 名前: (元ファイル, 切り抜き(左,上,右,下) か None, 書き出す横幅)
JOBS = {
    # 施術服の胸にある実在の院名を切り落とすため、上を44px削る
    "table": ("table.jpg", (0, 44, 1600, 1236), [640, 1100, 1600]),
    # こちらも胸の院名を切り落とす
    "neck": ("neck.jpg", (0, 260, 1600, 1469), [640, 1200]),
    "back": ("back.jpg", None, [640, 1200]),
    "shoulder": ("shoulder.jpg", None, [640, 1200]),
}


def tone(im):
    """写真の色味をそろえる：色を少しおさえ、コントラストをやわらげ、ほんの少しあたたかく。"""
    im = ImageEnhance.Color(im).enhance(0.88)
    im = ImageEnhance.Contrast(im).enhance(0.94)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.015 + 2)))
    b = b.point(lambda v: int(v * 0.975))
    return Image.merge("RGB", (r, g, b))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (src, box, widths) in JOBS.items():
        im = Image.open(SRC / src).convert("RGB")
        if box:
            im = im.crop(box)
        im = tone(im)
        for w in widths:
            h = round(im.height * w / im.width)
            im.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", "WEBP", quality=78, method=6)
        print(name, im.size)
    og = Image.open(SRC / "table.jpg").convert("RGB").crop((0, 44, 1600, 884)).resize((1200, 630), Image.LANCZOS)
    og.save(ROOT / "assets" / "og.jpg", "JPEG", quality=82)


if __name__ == "__main__":
    main()
