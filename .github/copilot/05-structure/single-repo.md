# 05 Structure — 単一リポジトリ運用ルール

## リポジトリ構成

```
vscode_esa_explorer/          # repo root
  src/                        # 拡張機能ソース（TypeScript）
    api/                        esa Public API v1 クライアント
    authentication/             SecretStorageによる接続設定・認証
    cache/                      記事本文・リビジョンのメモリキャッシュ
    filesystem/                 esa: 仮想ファイルシステム（FileSystemProvider）
    tree/                       記事一覧のTree View（TreeDataProvider）
    commands/                   コマンドハンドラ登録
    logging/                    OutputChannelラッパー
    test/                       ユニット/統合テスト
  out/                         コンパイル成果物（配布物、.gitignore対象）
  docs/                        設計資料（architecture.md / development.md / roadmap.md）
  media/                       アイコン等の静的アセット
  .github/
    copilot/                   SSOT
    instructions/              パス別実務ルール
```

## 構成の特徴

- 単一の npm パッケージ（`package.json`）で完結する。Lerna / Nx / Turborepo 等のモノレポ管理ツールは使用しない。
- 拡張機能本体（`src/`）のみを持ち、サーバーサイド・管理画面・共有パッケージの分割は現状ない。
- ビルド成果物は `out/` にコンパイルされ、`vsce package`（`npm run package:vsix`）で `.vsix` へパッケージングする。
- 外部依存先は esa.io Public API v1 のみ。バックエンド／インフラ定義（Firebase 等）は持たない。

## CI 運用

- `npm run check`（typecheck / lint / format:check）と `npm test`（`xvfb-run -a npm test`）を単一ワークフロー（`.github/workflows/ci.yml`）で実行する。
- パッケージが単一のため、ターゲット別トリガーやターゲットごとの独立 CI は現状不要。

## ポリレポへの切り替え

将来、共有ライブラリやサーバーサイド機能を別リポジトリへ切り出す場合は `05-structure/polyrepo.md` を参照し、
`00-index.md` のリンクを `05-structure/polyrepo.md` に差し替える。
