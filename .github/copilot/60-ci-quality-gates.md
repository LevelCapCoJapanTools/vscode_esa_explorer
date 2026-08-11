# 60 CI Quality Gates — 必須ジョブと基準

## 必須ジョブ（`.github/workflows/ci.yml`）

- **check**: `npm run check`（`typecheck` + `lint` + `format:check`）
- **test**: `npm run compile` の後 `xvfb-run -a npm test`（`@vscode/test-cli` によるExtension Tests。Linux/CIにはディスプレイがないため `xvfb-run` を使用）

## ローカルでの実行

- PR作成前に `npm run verify`（`check` + `test`）を実行する。
- VSIXパッケージングの動作確認は `npm run package:vsix`（`vsce package --out dist/esa-explorer.vsix`）。

## 運用ルール

- すべての必須ジョブをブランチ保護の required status checks に設定し、失敗時はマージ不可。
- CI ログに Secrets/PII を出さない。`.github/workflows/ci.yml` は `permissions: contents: read` を基本とし、必要な権限のみ明示する。
- `actions/setup-node` の `cache: npm` と `node-version-file: .nvmrc` でNodeバージョンとキャッシュを固定し、再現性を損なわない範囲で高速化する。
- 品質ゲートで検出した問題は plan / PR に反映し、再現手順と修正内容を残す。
