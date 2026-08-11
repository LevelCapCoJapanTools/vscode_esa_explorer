# esa Explorer

esa.io の記事を Visual Studio Code 上で一覧・閲覧・編集する VS Code 拡張機能。TypeScript + VS Code Extension API で構築。

## SSOT 参照順

仕様・実装ルールの単一情報源（SSOT）は `.github/copilot/00-index.md` を起点とする。

1. [`.github/copilot/00-index.md`](.github/copilot/00-index.md) — 参照順と使い方
2. [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — 規範層（全タスク共通）
3. [`.github/instructions/**/*.instructions.md`](.github/instructions/) — 補助的な実務ルール
4. `.github/copilot/10-requirements.md` 〜 `60-ci-quality-gates.md` — 要件・設計・品質

## プロジェクト構成

```
src/                  # 拡張機能ソース（TypeScript）
  api/                  esa Public API v1 クライアント
  authentication/       SecretStorageによる接続設定・認証
  cache/                記事本文・リビジョンのメモリキャッシュ
  filesystem/           esa: 仮想ファイルシステム（FileSystemProvider）
  tree/                 記事一覧のTree View（TreeDataProvider）
  commands/             コマンドハンドラ登録
  logging/              OutputChannelラッパー
  test/                 ユニット/統合テスト（@vscode/test-cli）
out/                  # コンパイル成果物（配布物、.gitignore対象）
docs/                 # 設計資料（architecture.md / development.md / roadmap.md）
.github/copilot/      # SSOT ドキュメント
```

## 開発フロー

`[RESEARCH]` → `[DESIGN]`（implementation-plan.md 作成・確定）→ `[IMPLEMENT]`（plan 通り実装）→ CI 通過 → マージ

## よく使うコマンド

```bash
# セットアップ
npm install

# ビルド
npm run compile
npm run watch

# 型チェック・Lint・フォーマット
npm run typecheck
npm run lint
npm run format
npm run check       # typecheck + lint + format:check

# テスト
npm test             # compile後にvscode-testを実行
npm run verify       # check + test

# VSIXパッケージング
npm run package:vsix
```
