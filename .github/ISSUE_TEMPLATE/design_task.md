---
name: "[DESIGN] 機能設計"
about: esa Explorer（VS Code拡張機能）の機能設計向けのIssueテンプレートです
title: "[DESIGN] ★ここに機能名★"
labels: "design"
assignees: ""
---

<!--
置換手順:
1. ★ここに機能名★: 対象機能名に置換する（例: 記事タグによるフィルタ表示）
2. <issue-number>: GitHub Issue番号に置換する（例: 42）
3. <slug>: ファイル名用のkebab-caseに置換する（例: tag-filter）
4. <FeatureName>: TypeScript型名のPascalCaseに置換する（例: TagFilter）

プレースホルダー種類: 4種類（★ここに機能名★ / <issue-number> / <slug> / <FeatureName>）
-->

# [DESIGN] ★ここに機能名★

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
- 要件参照先: `.github/copilot/10-requirements.md`

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

- `.github/copilot/00-index.md`
- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/copilot/10-requirements.md`
- `.github/copilot/20-architecture.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/40-testing-strategy.md`
- `.github/copilot/50-security.md`
- `.github/copilot/60-ci-quality-gates.md`
- `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前フェーズ成果物（あれば）

- RESEARCH Issue: <リンクまたは「なし」>
- 関連ADR: <リンクまたは「なし」>

### 2.3 UIモック/仕様書（形状合わせ用・仕様追加は禁止）

- <モックパスまたはリンク。なければ「なし」>

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/<issue-number>-<slug>.md` を新規作成する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- コード実装
- esa.io API仕様そのものの変更（外部仕様のため対象外）
- VS Code Marketplace等への公開作業

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ              | 配置先                                                | 責務                          | 禁止依存                                       |
| ------------------- | ----------------------------------------------------- | ----------------------------- | ---------------------------------------------- |
| UI（tree/commands） | `src/tree/`, `src/commands/`                          | ユーザー操作の受付・表示      | `api/` の具象クライアントを直接importしない    |
| Provider/Service    | `src/tree/`, `src/filesystem/`, `src/authentication/` | 状態管理・VS Code API連携     | UI層から呼ばれる公開メソッドのみを外部に見せる |
| ApiClient           | `src/api/`                                            | esa Public API v1とのHTTP通信 | UI/Provider層をimportしない                    |
| Model/Type          | `src/api/types.ts`                                    | データ構造（TypeScript型）    | 他レイヤに依存しない                           |

### 4.2 依存の組み立て（DI）方針

- DI起点は `src/extension.ts` の `activate(context)` のみ
  - `EsaApiClient` / `CredentialService` / `PostCache` 等を `activate()` 内で生成し、コンストラクタ引数として注入する
- UI層はProvider/Serviceの公開メソッドに依存し、`api/` の具象クライアントを直接importしない

### 4.3 esa Public API v1連携時の規約

| 項目     | 内容                                                               |
| -------- | ------------------------------------------------------------------ |
| 認証     | Personal Access Token v2（SecretStorage経由、`CredentialService`） |
| エラー型 | `EsaApiError`（status/code/レート制限情報を含む構造化エラー）      |
| 型検証   | レスポンスは型ガード関数（`isEsaPost`等）で`unknown`から絞り込む   |

### 4.4 非同期処理

- `async/await` を使用し、コールバックベースを避ける
- Extension Hostのイベントループをブロックする同期的重い処理を書かない
- Tree View再描画は `onDidChangeTreeData` イベントで通知する

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. UI/Provider・Service/ApiClientの責務分離がplanに明記されている
3. DI経路（`extension.ts activate() -> Provider/コマンド`）がplanに明記されている
4. テスト計画（`@vscode/test-cli` / Mocha）がplanに明記されている
5. CI品質ゲート（typecheck / lint / format:check / test）の実行計画がplanに明記されている

## 6. 品質ゲート（planに必ず記載する項目）

- `typecheck`: `npm run typecheck`
- `lint`: `npm run lint`
- `format`: `npm run format:check`
- `test`: `npm test`（`xvfb-run -a npm test`）
- `security`: `npm audit`
- planにDI経路が `extension.ts activate() -> Provider/コマンド` で固定されていること
- planにレイヤ境界（UI/Provider・Service/ApiClient）がテスト可能な受入条件で固定されていること
- planにPersonal Access TokenがSecretStorage以外に保存されないことの受入条件があること

## 7. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

- 対象: どのProvider/Service/ApiClient/純粋関数をテストするか（一覧）
- 方式: `@vscode/test-cli`（Mocha `suite`/`test`）で守るか、vscode API不要の純粋関数テストか
- ケース: 正常系/例外系/境界値（最低ライン）
- モック方針: 外部I/O（`fetch`・SecretStorage）の差し替え方法、共通ヘルパの配置先（`src/test/`）
- 実行コマンド: `npm test`（CI環境では `xvfb-run -a npm test`）

## 8. Done

- `.github/copilot/plans/<issue-number>-<slug>.md` が新規作成されている
- 他のファイルに変更がない
- planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
- TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
- SSOTと矛盾がない

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
