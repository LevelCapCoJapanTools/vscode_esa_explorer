# 50 Security — セキュリティ方針

- Secrets/PII をコード・ログ・ドキュメントに出さない。ダミー値やマスキングを使用する。
- 入力値・設定値・外部レスポンス（esa.io API）は必ず検証し、想定外は例外として明示的に失敗させる（型ガード関数で真偽判定してから使用する）。
- ログは構造化し、エラー原因を追える粒度で `logging/ExtensionLogger.ts`（OutputChannelラッパー）経由で記録するが、Personal Access Token等の機密情報は含めない。
- 依存追加時は `npm audit` 等で脆弱性を確認し、不要な権限・スコープを避ける。
- CI でも Secrets を最小権限で扱い、書き込み権限が不要な場合は `permissions: contents: read` を基本とする（`.github/workflows/ci.yml` 参照）。
- Personal Access Token（esa.io Personal Access Token v2）は VS Code の `SecretStorage`（`context.secrets`）にのみ保存し、`globalState`・設定ファイル・ログに書き込まない（`authentication/CredentialService.ts`）。
- `Authorization` ヘッダーは API 呼び出し直前にのみ組み立てる。トークンをモジュールスコープの変数やグローバル状態に長期保持しない。
- esa.io チーム名は `esaExplorer.teamName` 設定（ワークスペース単位）で管理し、Personal Access Tokenとは別の経路（SecretStorage）で扱う。
- `untrustedWorkspaces` / `virtualWorkspaces` に対応し、信頼されていないワークスペースや仮想ワークスペースでも安全に動作する（ローカルの任意コード実行やファイルシステムへの無条件書き込みを行わない）。
- `EsaFileSystemProvider` は esa.io API を介した読み書きのみを行い、ローカルファイルシステムへの直接アクセスは行わない。
