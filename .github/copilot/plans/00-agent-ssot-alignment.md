# エージェント共通の SSOT 入口と品質ゲートの整合

## 0. 実装入力コンテキスト

- 対象Issue: なし（ユーザーからの直接依頼）。
- 依頼: Codex・Claude Code・GitHub Copilot が同じ SSOT を入口に作業できるようにし、指摘済みの不整合を修正する。
- 実装起点: `AGENTS.md`、`CLAUDE.md`、`.github/copilot-instructions.md`、`.github/copilot/00-index.md`。
- 関連仕様: `20-architecture.md`、`30-coding-standards.md`、`40-testing-strategy.md`、`50-security.md`、`60-ci-quality-gates.md`。
- 制約: 拡張機能の仕様・TypeScript 実装・モジュール形式を変更しない。ADR は新規作成しない。

## 1. 実装対象機能と機能ゴール

3 エージェントの入口から同じ参照順と技術仕様を辿れるようにする。テンプレートが上位仕様を上書きする指示を解消し、文書と実際の CI コマンドを一致させる。

完了条件は、下記の受入条件と品質ゲートによって判定する。

## 2. 前提・制約（SSOT）

- 技術仕様の優先順位は `00-index.md`、振る舞い・日本語出力・レビュー方針は `AGENTS.md` に従う。
- `activate()` で組み立てた `EsaApiClient` を Provider やコマンドへ注入する既存構造を維持する。
- `module: Node16` と、`package.json` に `type` がない現設定では CommonJS と判定される。
- security は既存の Issue/PR テンプレートが指定する `npm audit` を使用する。
- ユーザーの修正依頼を本変更の承認根拠とする。Blocking な未確定事項はない。

## 3. 要件定義（実装受入条件）

| ID     | 要件       | 受入条件                                                                                   |
| ------ | ---------- | ------------------------------------------------------------------------------------------ |
| FR-01  | 共通入口   | 3 エージェントの入口が `00-index.md` と `AGENTS.md` へ到達し、別の参照順を持たない         |
| FR-02  | 優先順位   | plan は実装の一次入力であり、上位 SSOT と矛盾した場合は設計へ差し戻すと明記される          |
| FR-03  | 依存境界   | 注入した API クライアントの利用と、UI/Provider 内での直接生成・HTTP 実装の禁止が区別される |
| FR-04  | security   | CI に `npm audit` のジョブがあり、ローカルの `verify` からも同じ検証を実行できる           |
| FR-05  | 文書の整合 | CommonJS の説明、調査成果物の保存先・命名規則、関連テンプレートが一致する                  |
| NFR-01 | 互換性     | `src/`、VS Code コマンド、設定、API 契約に差分がない                                       |
| NFR-02 | 品質       | typecheck・lint・format・既存テスト・security の結果を記録する                             |

## 4. スコープ境界

- In-Scope: エージェントの入口・参照規則と関連する設計/実装/調査テンプレート。
- In-Scope: CI の security ジョブ、対応 npm スクリプト、開発手順、指摘済みファイルの整形。
- In-Scope: `.vscode-test.mjs` の実行版を `package.json` の最低対応版から取得する。最新 macOS 版と旧テストツールの実行ファイル名の不一致を避け、既存の対応バージョンを検証する。版数は重複定義せず `engines.vscode` を参照する。
- In-Scope: VSIX で README の相対リンクを解決できるよう、Git remote で確認したリポジトリ URL を `package.json` の `repository` に記載する。
- In-Scope: `package:vsix` が新しい checkout でも実行できるよう、出力先 `dist/` を生成する。配布対象ファイルの見直しは対象外。
- Out-of-Scope: 拡張機能の機能変更、アーキテクチャの再設計、Marketplace 公開、GitHub の保護設定の変更。
- 外部依存: 新しい直接依存は追加しない。依存更新と `glob`、`minimatch`、`serialize-javascript` の脆弱な範囲に限定した overrides は PR #5 で反映済みの定義を維持する。開発・CI は `.nvmrc` の Node 22 に従い、呼び出し API と lint・テスト・VSIX パッケージングの互換性を検証する。
- Secrets: 新たな Secrets は不要。

## 5. アーキテクチャ設計

### 5.0 依存の組み立てと責務

- Codex: `AGENTS.md` から共通入口へ進む。
- Claude Code: `CLAUDE.md` の import で共通入口と振る舞い規範を読み込む。
- GitHub Copilot: `.github/copilot-instructions.md` から同じ入口と振る舞い規範へ進む。
- 共通入口に参照順・優先順位・エージェント別の読み込み方法を集約する。パス別ルールは Codex/Claude Code でも対象パスに応じて明示的に読む。

### 5.1 境界とトレードオフ

- 既存の `.github/copilot/` のパスを維持し、エージェントごとの仕様コピーを増やさない。
- クライアントの注入・利用を許容する既存設計にテンプレートを合わせ、不要な Service 層の新設を避ける。
- 調査成果物は入口から辿れる `.github/copilot/90-research/` に揃える。Issue コメントのみで完結する既存運用も維持する。
- `sample/` と scaffold は実運用の確定仕様ではなく参考資料と明示する。

### 5.2 検証とエラー処理

security は開発依存を含む `npm audit` が終了コード 0 のとき成功とする。脆弱性検出や照会失敗を成功として扱わない。

### 5.3 図の適用範囲

本変更は文書と CI 構成が対象で、TypeScript のメソッド・型・非同期処理を変更しないため、メソッドフロー図・シーケンス図・クラス図の新設は対象外。既存の開発フロー図のエージェント名のみ共通化する。

## 6. 契約仕様

- 公開 API・型・コマンドの契約変更はない。
- 追加する npm スクリプト `security` は `npm audit` を実行する。
- `verify` は `check`、`test`、`security` を順に実行する。
- CI の必須ジョブ名は `check`、`test`、`security` とする。
- Extension Tests の版数は `engines.vscode` の `^x.y.z` から `x.y.z` を取得する。手動の版数変更は既存 CLI の `--code-version` を利用する。

## 7. データ・外部連携

API や永続データの変更はない。security 検証は npm レジストリへの照会を必要とする。Extension Tests は VS Code の取得を必要とする場合がある。

## 8. 実装手順

1. 入口ファイルと `00-index.md` の共通参照・優先順位を揃える。
2. 設計本文・Issue/plan テンプレートの依存境界、調査保存先、モジュール説明を訂正する。
3. `package.json` と CI に security 検証を接続し、品質文書・開発ガイドへ反映する。
4. security で検出した開発依存を更新し、通常更新で修正できない推移依存に限定した overrides を設定する。
5. 対象ファイルを整形し、差分・参照先・品質ゲートと VSIX パッケージングを検証する。

`src/` の変更、plan と上位 SSOT の矛盾を無視した実装、照会失敗の無視は禁止する。

## 9. テスト実装計画

- 既存の `npm run verify` を実行する。Linux ではテストを `xvfb-run` 上で実行する。
- 入口・Markdown リンク・Claude import・パス別ルールのメタ情報を検査する。
- TypeScript コンパイラのモジュール判定を実設定から確認する。
- 動作の変更がないため、実装をなぞる新しいユニットテストは追加しない。

## 10. オープン課題

- GitHub 側の required status checks はリポジトリ管理者の設定であり、この差分には含めない。
- ネットワークや実行環境の制約で品質ゲートを完了できない場合、成功と記載せず未検証の内容と理由を報告する。
