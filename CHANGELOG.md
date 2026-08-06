# 変更履歴

このプロジェクトの主な変更点を記録します。フォーマットは [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に準拠し、[Semantic Versioning](https://semver.org/lang/ja/) に従います。

## [0.1.0] - 2026-08-06

### 追加

- チーム名と Personal Access Token v2 による esa.io への接続設定
- 記事一覧をカテゴリ階層で表示する Tree View
- `esa:` 仮想ファイルシステムによる記事の閲覧・編集・保存
- 保存時の `original_revision` を用いた 3-way merge 対応
- 記事を esa.io（ブラウザ）で開くコマンド
- 出力チャンネルへのロギング
