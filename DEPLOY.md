# 公開のしかた

## GitHub Pages（いま設定したもの）

リポジトリの Settings → Pages で、Branch に
`claude/housekeeping-service-webpage-avt6qy` / `(root)` を選ぶだけです。

公開URL: https://taisun3son-create.github.io/test-claude-1/

- 変更をこのブランチに push するたび、1〜3分で自動的に反映されます
- `.nojekyll` は、GitHub Pages が余計な変換をしないようにするための空ファイルです

### GitHub Pages の制限

- **`_headers` は効きません。** あれは Netlify / Cloudflare Pages 用の書式で、
  GitHub Pages はレスポンスヘッダを設定できません。
  CSP などのセキュリティヘッダが必要なら、下の Netlify / Cloudflare Pages を使ってください。
- HTTPS は自動で有効になります（Enforce HTTPS にチェックが入っていればOK）。

## Netlify / Cloudflare Pages（本番向け）

こちらなら `_headers` がそのまま効き、独自ドメインも無料で使えます。

1. netlify.com（または Cloudflare Pages）に登録
2. 「Add new site」→「Deploy manually」
3. 解凍したフォルダをドラッグ＆ドロップ

ビルド設定は不要です（HTMLがそのまま置いてあるため）。
GitHub連携にすれば、push するたび自動で公開されます。

## 1. サイトのURL（`SITE`）

`build.py` の上のほうにある1行です。**設定済み**です。

```python
SITE = "https://taisun3son-create.github.io/test-claude-1"
```

ここを書き換えて `python3 build.py` を実行し直すと、次の3か所が一度に直ります。
手で9ページ分書き直さなくていいように、1か所にまとめてあります。

| 使われる場所 | 何のため |
|---|---|
| `<link rel="canonical">` | 同じページが複数のURLで見えるとき、「こちらが正式」と検索エンジンに伝える |
| `<meta property="og:url">` / `og:image` | LINEやSNSに貼ったときのリンクカード。**絶対URLでないと画像が出ません** |
| `sitemap.xml` / `robots.txt` | 検索エンジンにページ一覧を知らせる |

- **末尾に `/` は付けません。** コード側で `SITE + "/" + ファイル名` と組み立てるためです
- `https://` から書きます。`http://` や、`taisun3son-create.github.io/...` だけでは動きません
- 独自ドメイン（`https://hidamari-seto.jp` など）を取ったら、ここを書き換えて
  ビルドし直すだけです

## 2. 住所・郵便番号

**架空の会社なので、実在の住所は書かないでください。** 適当に書いた住所が
他人の家や店だと、その人に迷惑がかかります。電話番号を実在しない `0561-00-0000`
にしてあるのと同じ理由です。

書き換える場所は3つです。

| 場所 | 何を直すか |
|---|---|
| `build.py`（フッター内） | `〒000-0000（記入してください）` と `愛知県瀬戸市（住所を記入してください）` |
| `build.py` の `BUSINESS` | 構造化データの `address`。いまは「愛知県／瀬戸市」まで（番地なし）で、嘘にはなっていません |
| `src/page-tokushoho.html` | 特定商取引法の表記の「代表者」「所在地」「メールアドレス」 |

直したら `python3 build.py` を実行します。

**ポートフォリオとして出すなら**、`〒000-0000（架空のサイトです）` のように
架空だと分かる書き方が無難です。実在の住所を避けつつ、書き忘れにも見えません。

**実案件なら**、依頼主から住所・郵便番号・代表者名・メールアドレスをもらって入れます。
自宅で開業している場合は住所を出したくないことも多いので、そのときは特商法の表記に
「請求があったら遅滞なく開示します」と書く方法があります（消費者庁が認めている書き方です）。

## 3. フォームの送信先（`data-endpoint`）

### なぜ必要か

このサイトは**HTMLファイルが置いてあるだけ**で、プログラムが動いていません。
だから、フォームに入力してもらっても**受け取る相手がいません**。
受け取って自分にメールしてくれる外部サービスを1つ挟みます。

いまは `data-endpoint=""` が空なので、送信ボタンを押すと完了画面が出るだけで、
**どこにも届いていません**。動きの確認用です。

### Formspree で設定する（無料・月50件まで）

1. https://formspree.io/ で登録（メールアドレスとパスワードだけ）
2. 「New Form」を押し、名前を付けて（例: 陽だまり家事サポート）作成
3. `https://formspree.io/f/xxxxxxxx` という**送信先URL**が表示されるのでコピー
4. `src/page-reserve.html` を開き、この行を探す

   ```html
   <form id="resform" novalidate data-endpoint="">
   ```

5. 空の `""` の中に貼る

   ```html
   <form id="resform" novalidate data-endpoint="https://formspree.io/f/xxxxxxxx">
   ```

6. `python3 build.py` を実行して、push する
7. 公開されたページのフォームに自分で入力して送ってみる
8. **初回だけ Formspree から確認メールが届く**ので、リンクを押して承認する
   （承認するまで届きません。ここでつまずく人が多いです）

これで、送信 → 登録したメールアドレスに内容が届く → 画面は `thanks.html` に移動、
という流れになります。通信に失敗したときはエラーを出してボタンを押せる状態に戻します。

### 他の選択肢

| サービス | 無料枠 | 備考 |
|---|---|---|
| Formspree | 月50件 | いちばん手軽。日本語も問題なし |
| Basin | 月100件 | 同じ使い方 |
| Netlify Forms | 月100件 | Netlifyで公開する場合だけ。`<form netlify>` を足す書き方に変わります |

どれも `data-endpoint` にURLを入れるところは同じです。

### 実案件で使うときの注意

- **お客様の個人情報が、その会社のサーバを通ります。** プライバシーポリシーに
  「外部サービスを利用しています」と書く必要があります
- 無料枠を超えると止まります。件数が増えそうなら有料プラン（月10ドル前後）を見込んでおきます
- `_headers` の CSP に `form-action 'self' https://formspree.io;` と書いてあります。
  Formspree**以外**を使うときは、ここのドメインも合わせて直してください
  （GitHub Pages では `_headers` 自体が効かないので、Netlify などに移したときの話です）

## 公開前のチェック

- [x] `build.py` の `SITE` を実際のURLに変更して `python3 build.py` を実行
- [ ] 住所・郵便番号・代表者名・メールアドレスを記入（実在の住所は書かない）
- [ ] `src/page-reserve.html` の `data-endpoint` にフォーム送信先を設定し、
      確認メールを承認して、実際に1通届くところまで試す
- [ ] プライバシーポリシー・特定商取引法の表記の中身を確認
- [ ] ポートフォリオとして公開する場合は「架空案件」である旨を明記
