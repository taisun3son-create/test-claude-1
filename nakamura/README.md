# なかむら整体院（架空の整体院・ポートフォリオ）

豊中市・岡町駅の近くの、ふつうの整体院の見本サイト。院・人・電話番号・声はすべて架空。全ページ noindex。

## 直し方
- 本文：`src/page-*.html`。電話番号・受付時間などは `build.py` の上のほう
- 見た目：`assets/style.css`（最初の `:root` が色・文字・余白の決まり表）
- 写真：`_photos/` に元写真を置いて `python3 tools/images.py`
- 書き出し：`python3 build.py`
- 確認：`node tests/shots.js`（撮影・はみ出し）、`node tests/func.js`（予約フォームとメニュー）

## 納品のときにすること
- 予約フォームの送り先（Formspree など）を `assets/main.js` の「この内容で送る」につなぐ
- 祝日の一覧（`assets/main.js` の HOLIDAYS）を足す
- `build.py` の INDEXABLE を True にし、住所・地図・写真を本物にする
