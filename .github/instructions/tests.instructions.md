---
name: Tests rules
description: テストコードに適用する実務ルール
applyTo:
  - "src/test/**/*.ts"
---

- `@vscode/test-cli`（`.vscode-test.mjs`）を前提とし、ファイル名は `*.test.ts`、テストはMochaの `suite`/`test` で記述する。
- テストは `src/test/` 配下に、対象ソースと対応するディレクトリ構造で配置する（例: `src/tree/CategoryTree.ts` → `src/test/tree/CategoryTree.test.ts`）。
- 重要なバグ修正には必ず回帰テストを追加する。正常系・例外系・境界値を分けて書く。
- vscode APIに依存しない純粋関数は、Extension Development Host不要のユニットテストとして書く。
- vscode APIに依存する統合テスト（コマンド登録・FileSystemProvider登録など）は `vscode.extensions.getExtension` や `vscode.commands.getCommands` 等で検証する（`src/test/extension.test.ts` 参照）。
- 外部依存（esa.io API・SecretStorage・時刻・ファイルI/O）はモック/スタブ（例: `FetchFn` の差し替え）で隔離し、テストは決定性を保つ。
- テストデータは最小限かつ共有ヘルパー（例: `makePost`）で再利用する。Secrets/PIIを埋め込まない。
- 実行コマンド例: `npm test`。Linux/CI環境では `xvfb-run -a npm test` を使用する。
- 統合テストとユニットテストは同一コマンド（`npm test`）で実行されるため、実行時間が長くなる変更を加える場合は理由をPRに明記する。
