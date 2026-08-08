# esa Explorer

esa.io の記事を Visual Studio Code 上で一覧・閲覧・編集するための拡張機能です。

## 特徴

- **記事一覧のカテゴリ表示**: esa.io の記事をカテゴリ階層のツリーで表示します。
- **Markdownで閲覧・編集**: 記事を VS Code のエディタで開き、Markdown として編集できます。
- **保存でそのまま反映**: 保存すると esa.io の記事が更新されます（`original_revision` による 3-way merge に対応）。
- **ブラウザで開く**: 記事を esa.io 上で開けます。
- **安全な認証**: Personal Access Token は VS Code の SecretStorage に安全に保存されます。

## 必要要件

- Visual Studio Code `^1.105.0`
- esa.io のチームと Personal Access Token v2（`read:post` / `write:post` スコープ）

## セットアップ

1. アクティビティバーの esa アイコンを開きます。
2. 「接続設定を開始」をクリック、またはコマンドパレットで **esa Explorer: 接続設定** を実行します。
3. チーム名（`https://TEAM.esa.io` の `TEAM` 部分）を入力します。
4. Personal Access Token v2 を入力します。
5. 接続が確認されると記事一覧が表示されます。

## 使い方

- ツリーの記事をクリックすると Markdown で開きます。
- 編集して保存（`Cmd+S`）すると esa.io に反映されます。
- 記事を右クリックして **esa.ioで開く** を選ぶとブラウザで開きます。
- ツリー右上の更新ボタンで再取得できます。

## コマンド

| コマンド                                    | 説明                           |
| ------------------------------------------- | ------------------------------ |
| `esa Explorer: 接続設定`                    | チーム名とトークンを設定します |
| `esa Explorer: Personal Access Tokenを設定` | トークンのみ再設定します       |
| `esa Explorer: 認証情報を削除`              | 保存済みの認証情報を削除します |
| `esa Explorer: 更新`                        | 記事一覧を再取得します         |
| `esa Explorer: Markdownで開く`              | 選択した記事を開きます         |
| `esa Explorer: esa.ioで開く`                | 記事をブラウザで開きます       |
| `esa Explorer: 出力を表示`                  | ログ出力チャンネルを表示します |

## 設定

| 設定キー               | 説明                                                 |
| ---------------------- | ---------------------------------------------------- |
| `esaExplorer.teamName` | 接続する esa.io チーム名（URL ではなくチーム名部分） |

## セキュリティ

Personal Access Token は VS Code の SecretStorage にのみ保存され、ログやエラーメッセージには出力されません。

## 開発

開発手順は [docs/development.md](docs/development.md) を参照してください。アーキテクチャは [docs/architecture.md](docs/architecture.md) にまとめています。

## ライセンス

[MIT](LICENSE)
