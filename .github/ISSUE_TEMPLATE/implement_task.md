---
name: "[IMPLEMENT] 実装"
about: esa Explorer（VS Code拡張機能）の実装向けのIssueテンプレートです
title: "[IMPLEMENT] ★ここに機能名★"
labels: "implement"
assignees: ""
---

<!--
置換手順:
1. ★ここに機能名★: 対象機能名に置換する（例: 記事タグによるフィルタ表示）
2. <issue-number>: GitHub Issue番号に置換する（例: 42）
3. <slug>: ファイル名用のkebab-caseに置換する（例: tag-filter）
4. <design-issue-number>: DESIGN IssueのIssue番号に置換する（例: 41）
5. <design-pr-number>: DESIGN PRのPR番号に置換する（例: 43）
6. <owner>/<repo>: リポジトリのオーナー名とリポジトリ名に置換する

プレースホルダー種類: 6種類（★ここに機能名★ / <issue-number> / <slug> / <design-issue-number> / <design-pr-number> / <owner>/<repo>）
-->

# [IMPLEMENT] ★ここに機能名★

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりに実装を完了し、CI品質ゲートをすべて通す
* 前提: TypeScript / VS Code Extension API / コンストラクタ注入によるDI（`extension.ts activate()`起点）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/<issue-number>-<slug>.md`

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/<owner>/<repo>/issues/<design-issue-number>

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/<owner>/<repo>/pull/<design-pr-number>

### 2.4 UIモック/画像（形状合わせ用・仕様追加は禁止）

* <mock-path または「なし」>

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * plan外の機能追加
  * 大規模リファクタリング
  * アーキテクチャ変更（DI起点・レイヤ構成の変更）
  * esa Public API v1の仕様そのものの変更

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> **この表が埋まっていない場合は実装開始禁止**。
> ここに書かれたものだけを作る（planを転記する）。テンプレ側で成果物を決めない。

| 層 | action（add/modify/delete） | path（リポジトリルート相対） | 型名/関数名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| Model/Type | | | | | |
| ApiClient | | | | | |
| Provider/Service | | | | | |
| UI（tree/commands） | | | | | |
| extension.ts（DI配線） | | | | | |
| package.json（contributes） | | | | | |
| Test | | | | | |
| Other | | | | | |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planのAcceptance Criteriaをそのまま列挙（AIが増やさない）。

*
*
*

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE（該当があれば列挙。なければ「なし」）:
  * <例: 既存コマンドIDやコマンド名>
  * <例: `esa:` URIスキームの形式>
* plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / レイヤ境界）

* DI起点は `src/extension.ts` の `activate(context)` のみ
* UI層（tree/commands）は `api/` の具象クライアントを直接importしない
* Provider/Serviceは `api/` の型・エラー型のみに依存し、UI層をimportしない
* esa Public API v1へのHTTP呼び出しは `src/api/` に閉じる
* Extension Hostのイベントループをブロックする同期的重い処理を書かない
* Personal Access Tokenは `context.secrets`（SecretStorage）以外に保存しない

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`

## 10. 実行・品質ゲート（Done直結）

```bash
# 型チェック・Lint・フォーマット確認
npm run check

# ビルド
npm run compile

# テスト
npm test

# 依存脆弱性スキャン
npm audit
```

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: plan / DESIGN Issue / DESIGN PR / docs
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェストの項目がすべて実装済み
* 受入条件がすべて満たされる（テストで担保。planに従う）
* CI品質ゲートがすべて緑（`npm run check` / `npm test` / `npm audit`）
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
