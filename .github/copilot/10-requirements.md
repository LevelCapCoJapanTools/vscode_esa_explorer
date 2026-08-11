# 10 Requirements — 要件とスコープ

> 出典: `README.md` / `docs/architecture.md` / `docs/development.md` / `docs/roadmap.md` / `package.json`

## 1. 拡張機能概要

| 項目       | 内容                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------- |
| 拡張機能名 | esa Explorer（`package.json` の `name`: `esa-explorer`）                                            |
| 対象業務   | esa.io を利用するチームのメンバーが、VS Code から離れずに記事を一覧・閲覧・編集できるようにする     |
| 開発目的   | ブラウザでの esa.io 参照・編集に依存した記事更新フローを、エディタ内で完結させる                    |
| 配布形態   | `.vsix` パッケージ（`npm run package:vsix` = `vsce package`）。VS Code Marketplace 等への公開は未定 |
| 版数       | v0.1.0（`package.json` の `version` が正）。第2版以降の機能は `docs/roadmap.md` を参照              |

## 2. 想定利用者・権限

| 権限区分 | 主な利用者                                | 主な操作                                   |
| -------- | ----------------------------------------- | ------------------------------------------ |
| 利用者   | esa.io チームメンバー（VS Code ユーザー） | 記事の一覧・閲覧・編集・保存・ブラウザ表示 |

- 権限区分は単一（拡張機能自体はesa.io側の権限・ロールを判定しない。アクセス制御はesa.io側のPersonal Access Tokenのスコープに委ねる）。
- 利用端末: Visual Studio Code（`^1.105.0`）が動作するデスクトップ環境。

## 3. 業務フロー

1. 利用者がアクティビティバーの esa アイコンを開く。
2. 「接続設定を開始」（`esaExplorer.configure`）でチーム名（`https://TEAM.esa.io` の `TEAM` 部分）と Personal Access Token v2（`read`/`write` スコープ）を入力する。
3. 接続確認（esa.io APIへの疎通確認）後、Tree View に記事一覧がカテゴリ階層で表示される。
4. 記事をクリックすると `esa://<team>/posts/<number>.md` を Markdown として開く（`EsaFileSystemProvider.readFile`）。
5. 編集して保存すると、`original_revision` を付けて esa.io へ反映する（3-way merge対応、`EsaFileSystemProvider.writeFile`）。
6. 記事を右クリックして「esa.ioで開く」を選ぶとブラウザで確認できる。
7. Tree View 右上の更新ボタン（`esaExplorer.refreshPosts`）で記事一覧を再取得できる。

## 4. 機能要件

### 4.1 実装済み機能（v0.1.0）

| No  | 機能名           | 内容                                                | コマンドID                         |
| --- | ---------------- | --------------------------------------------------- | ---------------------------------- |
| 1   | 接続設定         | チーム名・Personal Access Token v2 の入力と接続確認 | `esaExplorer.configure`            |
| 2   | トークン再設定   | Personal Access Tokenのみを再設定                   | `esaExplorer.setToken`             |
| 3   | 認証情報削除     | SecretStorageに保存済みの認証情報を削除             | `esaExplorer.clearCredentials`     |
| 4   | 記事一覧表示     | カテゴリ階層のTree View表示                         | `esaExplorer.refreshPosts`（更新） |
| 5   | 記事の閲覧・編集 | `esa:` 仮想ファイルシステム経由でMarkdownとして開く | `esaExplorer.openPost`             |
| 6   | 保存時の反映     | `original_revision` を用いた3-way mergeで記事を更新 | -（保存操作）                      |
| 7   | ブラウザで開く   | 記事をesa.io上で開く                                | `esaExplorer.openInBrowser`        |
| 8   | ログ出力         | OutputChannelへの構造化ログ表示                     | `esaExplorer.showOutput`           |

### 4.2 将来追加候補（`docs/roadmap.md` 準拠、未確定）

| 機能名                   | 内容                                 |
| ------------------------ | ------------------------------------ |
| 記事の新規作成・削除     | Tree Viewからの記事CRUD              |
| WIP/公開状態の切り替え   | `wip` フラグの切り替えUI             |
| タグによるフィルタ・検索 | Tree ViewまたはQuickPickでの絞り込み |
| 記事のプレビュー統合     | Markdownプレビューとの連携           |
| 複数チームの切り替え     | 複数esa.ioチームへの同時接続         |
| コメントの表示           | 記事コメントの閲覧                   |

## 5. 設定・コマンド一覧

### 5.1 設定項目（`contributes.configuration`）

| 設定キー               | 説明                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| `esaExplorer.teamName` | 接続するesa.ioチーム名（`https://TEAM.esa.io` の `TEAM` 部分。URL全体ではない） |

### 5.2 コマンド一覧（`contributes.commands`）

| コマンドID                     | タイトル                    |
| ------------------------------ | --------------------------- |
| `esaExplorer.configure`        | 接続設定                    |
| `esaExplorer.setToken`         | Personal Access Tokenを設定 |
| `esaExplorer.clearCredentials` | 認証情報を削除              |
| `esaExplorer.refreshPosts`     | 更新                        |
| `esaExplorer.openPost`         | Markdownで開く              |
| `esaExplorer.openInBrowser`    | esa.ioで開く                |
| `esaExplorer.showOutput`       | 出力を表示                  |

## 6. 外部連携仕様

| 項目             | 内容                                                                     |
| ---------------- | ------------------------------------------------------------------------ |
| 外部API          | esa Public API v1（`https://api.esa.io/v1`）                             |
| 認証方式         | Personal Access Token v2（`read`/`write` スコープ、Bearer認証）          |
| ページネーション | `EsaApiClient.listAllPosts` が全ページを走査して結合する                 |
| 楽観的排他制御   | 記事更新時に `original_revision` を送信し、競合時は3-way mergeで解決する |

## 7. 非機能要件

| 区分               | 要件                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| 対応VS Code        | `^1.105.0`                                                                                      |
| Workspace Trust    | `untrustedWorkspaces.supported: true`（制限モードでも安全に動作する）                           |
| Virtual Workspaces | `virtualWorkspaces.supported: true`                                                             |
| 起動               | `onView` / `onFileSystem` / `onCommand` によるオンデマンドactivation                            |
| セキュリティ       | Personal Access TokenはSecretStorageにのみ保存し、ログ・エラーメッセージに出力しない            |
| 保守性             | チーム設定・認証情報の変更は運用側（利用者）がGUI操作のみで完結できる（拡張機能の再ビルド不要） |

## 8. セキュリティ要件

詳細は [50-security.md](50-security.md) を参照。要点のみ以下に示す。

| 項目             | 要件                                                                                                              |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| 認証情報の保存先 | VS Code SecretStorage（`context.secrets`）のみ                                                                    |
| 通信             | esa.io API へのHTTPS通信のみ                                                                                      |
| ログ             | Personal Access Tokenをログ・エラーメッセージに含めない                                                           |
| 個人情報         | esa.io記事の作成者名・アイコン等は表示のみに使用し、拡張機能側で永続化しない（`PostCache`はメモリキャッシュのみ） |

## 9. 未確定事項（今後判断が必要）

| No  | 確認項目                                      | 備考                                                          |
| --- | --------------------------------------------- | ------------------------------------------------------------- |
| 1   | VS Code Marketplace / Open VSX への公開要否   | 現状は `.vsix` のローカル配布のみ（`docs/roadmap.md` 未記載） |
| 2   | 複数チーム対応時の設定・SecretStorageキー設計 | `esaExplorer.teamName` は現状単一チーム前提                   |
| 3   | タグ検索・フィルタのUI                        | QuickPick / Tree Viewフィルタ等、方式未確定                   |
