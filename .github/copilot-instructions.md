# esa Explorer 開発ガイド（Copilot向け）

このリポジトリは esa.io の記事を Visual Studio Code 上で一覧・閲覧・編集する拡張機能です。

## 技術スタック

- 言語: TypeScript（`module: Node16`、ESM形式の`.js`拡張子付きimport）
- パッケージマネージャー: npm
- テスト: `@vscode/test-cli` + Mocha（`suite`/`test`）
- Lint: ESLint（`eslint.config.mjs`）
- フォーマット: Prettier

## コーディング規約

- 型のみのimportは`import type`を使用する。
- 相対importは必ず`.js`拡張子を付ける（`module: Node16`のため）。
- `any`は使用しない（`@typescript-eslint/no-explicit-any`が`error`）。
- ユーザー向けメッセージは日本語で記述する。
- Personal Access Tokenは`SecretStorage`にのみ保存し、ログやエラーメッセージに出力しない。

## アーキテクチャ

- `EsaApiClient`: esa APIへのアクセス。トークンは引数で受け取る（内部保持しない）。
- `CredentialService`: 認証情報の入出力UIとSecretStorageの管理。
- `PostCache`: 記事のメモリキャッシュ。
- `EsaFileSystemProvider`: `esa:`スキームの仮想ファイルシステム。保存時にAPIへPATCH。
- `EsaPostTreeProvider` / `CategoryTree`: カテゴリ階層のTree View構築。

## 検証

変更後は `npm run check`（typecheck + lint + format:check）と `npm test` を実行してください。
