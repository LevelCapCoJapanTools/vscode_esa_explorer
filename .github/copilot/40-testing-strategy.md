# 40 Testing Strategy — テスト戦略

- `@vscode/test-cli`（`.vscode-test.mjs`）を前提とし、ファイル名は `*.test.ts`、テストは Mocha の `suite`/`test` で記述する。
- Extension Tests は `package.json` の `engines.vscode`（`^x.y.z`）から取得した最低対応版で実行する。`.vscode-test.mjs` で同じ値を参照し、テスト側に版数を重複定義しない。別バージョンで確認する場合は `npm test -- --code-version <version>` を使用する。
- テストは `src/test/` 配下に、対象ソースと対応するディレクトリ構造で配置する（例: `src/tree/CategoryTree.ts` → `src/test/tree/CategoryTree.test.ts`）。
- vscode API に依存しない純粋関数（`buildCategoryTree` 等）は、Extension Development Host不要のユニットテストとして書く。
- vscode API に依存する統合テスト（コマンド登録、FileSystemProvider登録など）は Extension Development Host 上で実行し、`vscode.extensions.getExtension` や `vscode.commands.getCommands` で検証する（`src/test/extension.test.ts` 参照）。
- 重要なバグ修正には必ず回帰テストを追加する。正常系・例外系・境界値を分けて書く。
- 外部依存（esa.io API・SecretStorage・時刻・ファイルI/O）はモック/スタブ（例: `FetchFn` の差し替え）で隔離し、テストは決定性を保つ。
- テストデータは最小限かつ共有ヘルパー（例: `makePost`）で再利用可能に保ち、Secrets/PII を埋め込まない。
- 実行コマンド: `npm test`（内部で `npm run compile` 後に `vscode-test` を実行）。Linuxやヘッドレス CI 環境では `xvfb-run -a npm test` を使用する（`.github/workflows/ci.yml` 参照）。
- 型チェック・Lint・フォーマットはテストと独立したゲートとして `npm run check` で実行する。`npm run verify`（`check` + `test` + `security`）で依存脆弱性の検証も含めて実行する。合否基準は `60-ci-quality-gates.md` に従う。
