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

## 公開前のチェック

- [ ] `build.py` の `SITE` を実際のURLに変更して `python3 build.py` を実行
      （canonical・OGP・sitemap.xml に反映されます）
- [ ] 電話番号と住所を記入
- [ ] `src/page-reserve.html` の `data-endpoint` にフォーム送信先を設定
- [ ] プライバシーポリシー・特定商取引法の表記の中身を確認
- [ ] ポートフォリオとして公開する場合は「架空案件」である旨を明記
