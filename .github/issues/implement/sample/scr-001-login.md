---
phase: implement
screen_id: SCR-001
title: "[IMPLEMENT] SCR-001 ログイン画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-001 ログイン画面

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-001-login.md`

### 2.2 DESIGN Issue（仕様の背景・補助）

* なし（planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

* なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * メニュー画面・注文画面の実装
  * 実際のバックエンドAPI接続（`AuthRepositoryImpl`）
  * パスワード再設定フロー
  * セッション永続化（ログイン状態の保持）
  * Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（planから転記）

| レイヤ | action | path | 型名/関数名 | 依存（どこ→どこ） | tests |
| --- | --- | --- | --- | --- | --- |
| Model | add | `MilkOrder/Domain/Auth/AuthUser.swift` | `AuthUser`, `UserRole` | なし | — |
| Model | add | `MilkOrder/Domain/Auth/AuthError.swift` | `AuthError` | なし | — |
| Protocol | add | `MilkOrder/Domain/Auth/AuthRepository.swift` | `AuthRepository` | なし | — |
| DataSource | add | `MilkOrder/Infrastructure/Auth/MockAuthRepository.swift` | `MockAuthRepository` | `AuthRepository` Protocol | — |
| AppEnvironment | add | `MilkOrder/App/AppEnvironment.swift` | `AppEnvironment` | `AuthRepository` Protocol | — |
| ViewModel | add | `MilkOrder/Features/Login/LoginViewModel.swift` | `LoginViewModel` | `AppEnvironment`, `AuthRepository` Protocol | `LoginViewModelTests` |
| View | add | `MilkOrder/Features/Login/LoginView.swift` | `LoginView`, `LoginFormSection`, `LoginButton`, `ErrorMessageText` | `LoginViewModel` | — |
| Other | modify | `MilkOrder/MilkOrderApp.swift` | — | `AppEnvironment`（@StateObject） | — |
| Other | delete | `MilkOrder/ContentView.swift` | — | — | ファイルが存在しないこと |
| Test | add | `MilkOrderTests/Features/Login/LoginViewModelTests.swift` | `LoginViewModelTests` | `LoginViewModel`, `MockAuthRepository` | — |

## 6. 受入条件（planから転記）

* `LoginView` が iPhone 17 シミュレーターで表示される
* ログインID未入力でログインボタン押下時、`errorMessage` が「ログインIDを入力してください」になる（FR-02）
* パスワード未入力でログインボタン押下時、`errorMessage` が「パスワードを入力してください」になる（FR-03）
* `demo@example.com` / `demo1234` でログインすると `AppEnvironment.currentUser` が更新されプレースホルダーへ遷移する（FR-01, FR-08）
* `AuthError.invalidCredentials` で「IDまたはパスワードが違います」が表示される（FR-04）
* `AuthError.accountDisabled` で「このアカウントは利用停止中です」が表示される（FR-05）
* `AuthError.network` で「通信エラーが発生しました。再度お試しください。」が表示される（FR-06）
* `isLoading` が `true` の間、ログインボタンが `.disabled(true)` になる（FR-07）
* パスワードフィールドは `SecureField` を使用してマスキングされている（NFR-01）
* `LoginViewModel` クラスに `@MainActor` が付与されている（NFR-03）
* `swiftlint lint --strict` が 0 violations（入力制約）
* `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * なし（新規追加のみ。`MilkOrderApp.swift` の修正はplanどおりの最小変更に限定）
* plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()` は後続スコープ。初期版は直接初期化）
* `@MainActor` を `LoginViewModel` クラスに付与し、`@Published` への書き込みを MainActor 上で行う
* `LoginView` は `LoginViewModel` のみに依存し、`MockAuthRepository` を直接 import しない
* `LoginViewModel` は `AuthRepository`（Protocol）のみに依存し、`MockAuthRepository` 具象を直接 import しない
* Firebase SDK を import しない（本Issueは Mock のみ）
* `loginID` / `password` の実値をログ・テストデータに含めない

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`

## 10. 実行・品質ゲート（Done直結）

```bash
# ビルド
xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# Lint
swiftlint lint --strict

# テスト
xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# 依存脆弱性スキャン
swift package audit
```

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: `.github/copilot/plans/scr-001-login.md`
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト5章の全10ファイルが実装済み（削除1件を含む）
* 6章の受入条件がすべて満たされる（XCTestで担保）
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test）
* `loginID` / `password` の実値がコード・ログ・テストデータに含まれていない
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
