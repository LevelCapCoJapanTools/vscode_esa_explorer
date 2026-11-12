# 開発ガイド

## 前提

- Node.js（`.nvmrc` 参照。開発・CI 共通）
- npm
- Visual Studio Code（`^1.105.0`）

開発ツールの推移依存が Node.js 22 以上を要求するため、開発環境も CI と同じ `.nvmrc` のバージョンを使用してください。

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
| `npm run security`     | 開発依存を含む npm audit        |
| `npm run verify`       | check + test + security         |

## デバッグ

VS Code で「Run Extension」構成を起動すると、拡張機能開発ホストが立ち上がります。テストは「Extension Tests」構成で実行できます。

## macOSのVS Codeで起動する手順

1. macOSでリポジトリのルートディレクトリをVS Codeで開きます。
2. ターミナルで `npm install` を実行し、依存関係をインストールします。
3. `Cmd+Shift+D` で「実行とデバッグ」を開きます。
4. 起動構成で「Run Extension」を選択します。
5. `F5` を押すと、拡張機能開発ホストのVS Codeウィンドウが起動します。
6. Activity Barの「esa」ビューを開き、必要に応じて「接続設定」からチーム名とPersonal Access Tokenを設定します。

## 拡張機能アイコン

Marketplace と拡張機能一覧には、`package.json` の `icon` で指定した [256×256 PNG](../media/esa-explorer-icon.png) を使用します。編集元は [SVG](../media/esa-explorer-icon.svg) で、[esa公式のトリ原画](../media/esa-tori-coloredbg.png)を参照します。SVG を変更した場合は、原画の形と色を保ち、同じサイズの PNG を出力して両方を更新してください。`@resvg/resvg-js` 2.6.2 で再出力する場合は、読み込んだ SVG 内の原画参照を PNG のデータ URL に解決してからレンダラーへ渡します。

素材の出典・ライセンスと公開前の許諾確認については、[サードパーティー素材のクレジット](../THIRD_PARTY_NOTICES.md)を参照してください。

Activity Bar はテーマ色に追従する既存の [単色 SVG](../media/esa-explorer.svg) を使用します。PNG は `.vscodeignore` の media 収録対象に含まれるため、次回公開する VSIX に同梱されます。

## テスト

テストは `@vscode/test-cli`（`.vscode-test.mjs`）で `out/test/**/*.test.js` を実行します。Linux環境では `xvfb-run -a npm test` を使用してください。

VS Code のテスト対象は `package.json` の `engines.vscode` に記載した最低対応版です。別バージョンの確認には `npm test -- --code-version <version>` を使用します。品質ゲートの合否基準は [60-ci-quality-gates.md](../.github/copilot/60-ci-quality-gates.md) を参照してください。

## 検証結果

### 2026-11-08（Marketplace 初回公開）

- Publisher: `YoshioNishiyama`（表示名: Yoshio Nishiyama）。
- ライセンス: Apache-2.0。既存 LICENSE 本文に manifest・README の表記を統一しました。
- `.vscodeignore` により、配布対象を実行用 JavaScript・media・package.json・README・CHANGELOG・LICENSE に限定します。開発用設定・テスト・ソースマップは含めません。

| 検証                   | 結果                                                                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run verify`       | macOS arm64 / Node.js 22.23.4 / VS Code 1.105.0 で成功。typecheck・lint・format:check、テスト56件、security がすべて通過。脆弱性0件。      |
| `npm run package:vsix` | 成功。29ファイル・40,296 bytes。実行用 JavaScript 22ファイルとアセット・掲載用ファイルを確認。開発用設定・テスト・ソースマップの収録なし。 |

作成した VSIX の SHA-256: `f93b822b8d07c9d1f8e572c6d334f84d4f7e7f3a8c43a0f66e9bed7aecac1d72`。

ユーザーがこの VSIX をアップロードし、Marketplace の検証完了を確認しました。管理画面で `0.1.0`・`Public` と表示され、[esa Explorer の公開ページ](https://marketplace.visualstudio.com/items?itemName=YoshioNishiyama.esa-explorer)で表示名・Publisher・Install ボタン・Apache-2.0 表記を確認済みです。

公開前に `.nvmrc` の Node.js 22 で `npm run verify` と `npm run package:vsix` を実行し、VSIX 内の ID・版数・ライセンス・収録内容を確認してください。初回は [Publisher 管理画面](https://marketplace.visualstudio.com/manage/publishers/YoshioNishiyama) の **New extension → Visual Studio Code** から `dist/esa-explorer.vsix` をアップロードします。検証完了後、公開ページでインストール可能であることを確認します。

既存の `local.esa-explorer` と公開版は拡張 ID が異なるため、公開版で接続設定が必要になる場合があります。

### 2026-11-07（macOS arm64 / Node.js 22.23.4）

| コマンド               | 結果                                                                                                                        |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `npm run verify`       | 成功。typecheck・lint・format:check、VS Code 1.105.0 上の既存テスト 39 件、security がすべて通過。npm audit は脆弱性 0 件。 |
| `npm run package:vsix` | 成功。`dist/esa-explorer.vsix` を生成。                                                                                     |

共通入口・Claude import・パス別ルールのメタ情報・CI ジョブ・テスト版数の整合も確認しました。GitHub 上の CI 実行とブランチ保護設定は、このローカル検証には含みません。

### 2026-08-07

2026-08-07に以下を実行しました。

| コマンド               | 結果                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `npm run check`        | 成功。typecheck、ESLint、Prettierのフォーマットチェックがすべて通過しました。                                        |
| `xvfb-run -a npm test` | 失敗。`npm run compile` は成功しましたが、`vscode-test` が `update.code.visualstudio.com` の名前解決に失敗しました。 |
