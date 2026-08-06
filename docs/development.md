# 開発ガイド

## 前提

- Node.js（`.nvmrc` 参照。推奨: 20）
- npm
- Visual Studio Code（`^1.105.0`）

## セットアップ

```bash
npm install
```

## よく使うスクリプト

| コマンド               | 説明                            |
| ---------------------- | ------------------------------- |
| `npm run compile`      | TypeScriptを`out/`へビルド      |
| `npm run watch`        | ウォッチビルド                  |
| `npm run typecheck`    | 型チェックのみ                  |
| `npm run lint`         | ESLint                          |
| `npm run format`       | Prettierで整形                  |
| `npm run format:check` | 整形チェック                    |
| `npm run check`        | typecheck + lint + format:check |
| `npm test`             | ビルド後に拡張機能テストを実行  |
| `npm run verify`       | check + test                    |

## デバッグ

VS Code で「Run Extension」構成を起動すると、拡張機能開発ホストが立ち上がります。テストは「Extension Tests」構成で実行できます。

## テスト

テストは `@vscode/test-cli`（`.vscode-test.mjs`）で `out/test/**/*.test.js` を実行します。Linux環境では `xvfb-run -a npm test` を使用してください。
