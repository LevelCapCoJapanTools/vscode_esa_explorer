---
phase: implement
screen_id: SCR-001
title: "[IMPLEMENT] SCR-001 ログイン画面 — TestFlight（Staging）版限定のログイン情報初期入力（暫定処置）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-001 ログイン画面 — TestFlight（Staging）版限定のログイン情報初期入力（暫定処置）

## 0. AI Agent 契約（最初に読む）

- あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
- **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
- **plan外の仕様追加/推測補完は禁止**。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

- ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
- 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）。本機能は既存のDI経路・`AuthRepository` 契約を変更せず、`LoginViewModel.init` とビルド設定（`Configurations/Staging.xcconfig`）のみを変更する

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/scr-001-login.md`（特に FR-09（§3.1）, NFR-04（§3.2）, §5.1.1 No.5, §5.2 トレードオフ, §8.1 No.10〜11, §8.2 手順4〜5, §8.3 禁止事項-6〜8, §9.1）

### 2.2 DESIGN Issue（仕様の背景・補助）

- https://github.com/LevelCapTech/milk-order-ios/issues/29

### 2.3 DESIGN PR（設計差分・合意点）

- https://github.com/LevelCapTech/milk-order-ios/pull/37

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし

## 3. スコープ / 非ゴール

- 対象: `Configurations/Staging.xcconfig` への `STAGING` コンパイル条件追加、`LoginViewModel.init` でのStaging限定初期入力、関連ユニットテストの追加のみ
- 非ゴール:
  - Staging判定にランタイムの `Bundle.main.bundleIdentifier` 比較を使う方式（planでは案A〈コンパイル時`STAGING`条件〉が採用済みであり、案Bは不採用）
  - 初期入力された値での自動サインイン実行（ログインボタン押下による既存 `signIn()` フローは変更しない）
  - `FirebaseAuthRepository`（`.live()`）の実装そのもの
  - セッション永続化（関連Issue #28のスコープ。本Issueとは独立）
  - 本暫定処置の撤去・削除作業そのもの（撤去条件はplan §10に記録済みだが、削除トリガーの判断は発注者調整・認証実装着手時に行うため、本Issueのスコープ外）

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所はない。本Issueはplanの§8.1/§8.2に記載された変更のみを実施する

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（`scr-001-login.md` §8.1 No.10〜11, §8.2 手順4〜5 から転記）。

| レイヤ             | action（add/modify/delete） | path（リポジトリルート相対）                              | 型名/関数名                                                                                                                                | 依存（どこ→どこ）                                   | tests（追加/更新）                                                                                      |
| ------------------ | --------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Other（Build設定） | modify                      | `Configurations/Staging.xcconfig`                         | `SWIFT_ACTIVE_COMPILATION_CONDITIONS = $(inherited) STAGING` を追加し、`Staging` configurationのみ `STAGING` コンパイル条件を持たせる      | なし（ビルド設定のみ）                              | なし（ビルド設定自体はXCTest対象外。「MilkOrder Staging」スキームでのbuild/test実行で間接的に確認する） |
| ViewModel          | modify                      | `MilkOrder/Features/Login/LoginViewModel.swift`           | `LoginViewModel.init(environment:)` に `#if STAGING` ブロックを追加し、`loginID = "demo@example.com"` / `password = "demo1234"` を設定する | `Configurations/Staging.xcconfig` の `STAGING` 条件 | `LoginViewModelTests`（更新）                                                                           |
| Test               | modify                      | `MilkOrderTests/Features/Login/LoginViewModelTests.swift` | FR-09・NFR-04・初期入力後の編集可能性に関する回帰テストケースを追加する（plan §9.1 該当行）                                                | `LoginViewModel`                                    | —                                                                                                       |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planの FR-09・NFR-04・該当テストケースをそのまま列挙。

- FR-09: Staging（TestFlight配布）ビルドではログイン画面初回表示時に `loginID` / `password` へ一般ユーザー（注文入力者ロール）の既存デモ認証情報を初期入力する。`LoginViewModel.init` が `STAGING` 条件で一般ユーザーの既存デモ認証情報（`MockAuthRepository` に定義済みの値）を設定し、画面表示直後に両フィールドへ値が表示される。ユーザーは既存の `TextField` / `SecureField` を通じて編集・削除でき、`signIn()` は自動実行されない
- NFR-04: Release/Productionビルドでは Staging向け初期入力が混入せず、`loginID` / `password` は空文字のまま維持される。`LoginViewModel` のRelease/Productionビルドでは `loginID == ""` かつ `password == ""` のまま初期化され、既存の空欄バリデーション・エラー表示・サインインフローが変わらない
- テストケース（plan §9.1）:
  - 正常: `STAGING` コンパイル条件でViewModelを生成すると `loginID == "demo@example.com"` かつ `password == "demo1234"`
  - 回帰: `STAGING` なしでViewModelを生成すると `loginID == ""` かつ `password == ""`
  - 回帰: Staging初期化後に `loginID` / `password` を別値または空文字へ変更した場合、変更後の値が保持され、既存の `signIn()` は編集後の入力値で実行される

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE:
  - `AuthRepository` / `AppEnvironment` / 既存Repository Protocolの署名
  - 既存の `signIn()` フロー・バリデーション・エラー表示ロジック
  - `LoginView` の `TextField` / `SecureField` のbinding構成（既存の編集可能性を変更しない）
- 禁止事項-6: Staging判定に `Bundle.main.bundleIdentifier == "com.levelcap.MilkOrder.stg"` のruntime比較を採用しない（コンパイル時`STAGING`条件のみを使用する）
- 禁止事項-7: Release/Productionビルドへデモ認証情報の初期入力を混入させない
- 禁止事項-8: 初期入力を理由にログインボタン押下前の自動サインインを追加しない
- plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）。本機能のために変更しない
- `@MainActor` を `LoginViewModel` に付与する既存方針を維持する
- View は ViewModel のみに依存し、Repository/DataSource を直接 import しない
- ViewModel は Repository Protocol のみに依存し、具象型を直接 import しない
- `#Preview` では Firebase を初期化しない（既存の `.preview()` factory のまま）
- background スレッドから UI を更新しない

## 9. 必読（規約/ゲート）

- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/50-security.md`
- `.github/copilot/60-ci-quality-gates.md`
- `.github/copilot/plans/scr-001-login.md`（特に §5.2, §8.1〜8.3, §9.1）

## 10. 実行・品質ゲート（Done直結）

```bash
# ビルド（Release/Production相当）
xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# Lint
swiftlint lint --strict

# テスト（Release/Production相当: STAGING条件なし）
xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# テスト（Staging: STAGING条件あり。FR-09の初期入力を確認するため必須）
xcodebuild test -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'

# 依存脆弱性スキャン
swift package audit
```

補足: `MilkOrder Staging` 共有スキームは `xcode-staging-environment-separation.md`（FR-04）で確定済みで、Run/Test/Profile/Analyze/Archiveすべてが `Staging` configurationを使う。`STAGING` コンパイル条件はこのスキーム経由でのみ有効になるため、FR-09（Staging初期入力）とNFR-04（Release/Production非影響）の両方を検証するには上記2種のテスト実行が両方必要。`swift package audit` はリポジトリ直下に `Package.swift` が存在しない場合、コマンド実行結果を記録した上で依存変更がないことを確認し、「N/A（依存追加・更新なし）」として扱ってよい。

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

- 参照したSSOT: `.github/copilot/plans/scr-001-login.md`, Issue #29, PR #37
- 実装判断（裁量がある場合のみ）: 1〜3行
- 受入条件の担保証跡: テスト名/コマンド結果（`MilkOrder` / `MilkOrder Staging` 両スキームの実行結果）

## 12. Done（必須）

- 成果物マニフェスト（5章）の全項目が実装済み
- 受入条件（6章, FR-09 / NFR-04 / 該当テストケース）がすべて満たされる
- `xcodebuild test -scheme MilkOrder` でRelease/Production相当の空欄維持が確認できる
- `xcodebuild test -scheme "MilkOrder Staging"` でStaging限定の初期入力が確認できる
- `AuthRepository` / `AppEnvironment` / Repository Protocolに変更がない
- 既存の `signIn()` フロー・バリデーション・エラー表示に回帰がない
- `#Preview` が Firebase なしで動作する
- CI品質ゲートがすべて緑（build / swiftlint lint --strict / test×2スキーム / swift package audit または N/A判定）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / DESIGN Issue / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
