# 30 Coding Standards — コーディング規約

- `.github/instructions/**/*.instructions.md` のパス別ルールを優先する。
- 互換性維持をデフォルトとし、破壊的変更は移行策・理由を plan / ADR に記載する。
- TypeScript は `tsconfig.json` の `module: Node16`（ESM）に従う。相対importには `.js` 拡張子を付ける（例: `import { EsaApiClient } from "./api/EsaApiClient.js"`）。型のみのimportは `import type` を使用する。
- `any` は使用しない。外部入力（APIレスポンス等）は `unknown` を受け取り、型ガード関数（`isEsaPost` 等）で絞り込む。
- VS Code拡張の責務分離: `extension.ts` をDIルート/コマンド登録の起点とし、`api/`（HTTPクライアント）・`authentication/`（SecretStorage）・`cache/`・`filesystem/`（FileSystemProvider）・`tree/`（TreeDataProvider）・`commands/`・`logging/` にモジュールを分離する。UI表示に関わるロジック（Tree構築等）は `tree/CategoryTree.ts` のように可能な限り純粋関数として切り出す。
- 非同期処理は `async/await` を使用し、コールバックベースを避ける。エラーは例外として送出し、無視しない。APIエラーは `EsaApiError`（status/code/レート制限情報を含む構造化エラー）で表現する。
- 副作用（ネットワーク/SecretStorage/ファイルI/O）は関数境界・コンストラクタ引数で分離し、テスト時に差し替えられる構造にする（例: `EsaApiClient` の `FetchFn` 型引数）。
- ESLint（`@typescript-eslint`）・Prettierに準拠する。`npm run lint` / `npm run format` で検証・整形する。
- パッケージ追加は最小限とし、npmで追加して `package.json` に反映する。
- Secrets/PII をコード・ログ・ドキュメントに出さない。ダミー値やマスキングを使用する。
- テスト可能な構造（副作用を分離、関数・クラスを小さく）を心掛ける。
- コメント・ドキュメント:
  - TSDoc（`/** */`）は日本語で必ず記述する。exportされる型・関数・クラス・メソッドに付ける。
  - インラインコメント（`//`）は「なぜそうするか」が自明でない箇所にのみ日本語で追加する。過剰な 1 行コメントは避ける。
  - コードが何をするかを説明するコメントは不要。読めばわかる処理には書かない。
- コミットメッセージ:
  - `.github/instructions/commit-messages.instructions.md` を唯一の参照源とし、全コミットで同じ日本語・プレフィックス・3行構造ルールを適用する。
