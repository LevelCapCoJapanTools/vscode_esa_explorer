---
name: TypeScript implementation rules
description: src 配下のTypeScriptコードに適用する実務ルール
applyTo:
  - "src/**/*.ts"
---

- TypeScript は `tsconfig.json` の `module: Node16`（ESM）に従う。相対importには `.js` 拡張子を付ける（例: `import { EsaApiClient } from "../api/EsaApiClient.js"`）。
- 型のみのimportは `import type` を使用する。`any` は使用しない。外部入力（APIレスポンス等）は `unknown` で受けて型ガード関数（`isEsaPost` 等）で絞り込む。
- Secrets/トークン/PII をコード・ログ・テストデータに含めない。
- 非同期処理は `async/await` を使用し、コールバックベースを避ける。エラーは例外として送出し、無視しない。APIエラーは `EsaApiError`（status/code/レート制限情報を含む構造化エラー）で表現する。
- UI層（`tree/`, `commands/`）は表示・操作受付のみの責務を持ち、esa.io APIへのHTTP呼び出しの詳細を持たない。データアクセスは `api/EsaApiClient` に、状態管理は各Provider（`EsaPostTreeProvider` 等）に委ねる。
- 副作用（ネットワーク/SecretStorage/ファイルI/O）はコンストラクタ引数または関数境界で受け渡し、テスト時に差し替えられる構造にする（例: `EsaApiClient` の `FetchFn` 型引数）。カテゴリツリー構築（`buildCategoryTree`）のようにvscode APIに依存しないロジックは純粋関数として切り出す。
- Extension Hostのイベントループをブロックする同期的な重い処理を書かない。UI更新は `TreeDataProvider` の `onDidChangeTreeData` イベントで通知する。
- パッケージ追加は最小限にし、npmで追加して `package.json` に反映する。
- 新規 `.ts` ファイルを `src/` 配下に追加する場合、`tsconfig.json` の `include` に既に含まれていればビルド設定の追加変更は不要。追加後は `npm run compile` でビルドが通ることを確認する。
- 依存の組み立て（DI）は `src/extension.ts` の `activate(context)` に集約する。新しいクラスは `activate()` 内で生成し、コンストラクタ引数で依存先へ渡す。グローバルなシングルトンやモジュールレベルの可変状態は作らない。
- Personal Access Tokenは `context.secrets`（VS Code SecretStorage）にのみ保存する（`authentication/CredentialService.ts`）。設定ファイル・`globalState`・ログには書き込まない。
- esa.io チーム名等の設定値は `vscode.workspace.getConfiguration` 経由（`configuration.ts`）で取得し、コード内にハードコードしない。
- 変更時は必ずテストを追加/更新し、最低限以下を実行する:
  `npm run typecheck`
  `npm run lint`
  `npm test`
