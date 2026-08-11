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

## macOSのVS Codeで起動する手順

1. macOSでリポジトリのルートディレクトリをVS Codeで開きます。
2. ターミナルで `npm install` を実行し、依存関係をインストールします。
3. `Cmd+Shift+D` で「実行とデバッグ」を開きます。
4. 起動構成で「Run Extension」を選択します。
5. `F5` を押すと、拡張機能開発ホストのVS Codeウィンドウが起動します。
6. Activity Barの「esa」ビューを開き、必要に応じて「接続設定」からチーム名とPersonal Access Tokenを設定します。

## テスト

テストは `@vscode/test-cli`（`.vscode-test.mjs`）で `out/test/**/*.test.js` を実行します。Linux環境では `xvfb-run -a npm test` を使用してください。

## 検証結果

2026-08-07に以下を実行しました。

| コマンド               | 結果                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run check`        | 成功。typecheck、ESLint、Prettierのフォーマットチェックがすべて通過しました。                                        |
| `xvfb-run -a npm test` | 失敗。`npm run compile` は成功しましたが、`vscode-test` が `update.code.visualstudio.com` の名前解決に失敗しました。 |
