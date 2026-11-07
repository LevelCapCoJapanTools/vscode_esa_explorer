# コントリビューションガイド

esa Explorer への貢献をありがとうございます。

開発ルールは [共通入口](.github/copilot/00-index.md) を参照してください。Codex・Claude Code・GitHub Copilot も同じ入口を使用します。

## 開発の流れ

1. リポジトリをフォークし、ブランチを作成します。
2. `npm install` で依存関係をインストールします。
3. 変更を加えます。ユーザー向けメッセージは日本語で記述してください。
4. `npm run verify`（check + test + security）がすべて通ることを確認します。
5. プルリクエストを作成します。

## コーディング規約

- TypeScript は `module: Node16`（現設定では CommonJS）で、相対importには `.js` 拡張子を付けます。
- 型のみのimportは `import type` を使用します。
- `any` は使用しません。
- Personal Access Token などの機密情報はログやエラーメッセージに出力しません。

## コミット

- コミットメッセージは変更内容が分かるように記述してください。

## Issue

- バグ報告・機能要望は Issue テンプレートに沿って作成してください。
