---
phase: implement
screen_id: SCR-002
title: "[IMPLEMENT] SCR-002 メニュー画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-002 メニュー画面

## 0. AI Agent 契約（最初に読む）

- あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
- **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
- **plan外の仕様追加/推測補完は禁止**。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

- ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
- 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）
- 前提SCR: **SCR-001（ログイン画面）の実装が完了していること**（AppEnvironment / AuthUser / UserRole が実装済みであること）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/scr-002-menu.md`

> **前提plan**: `.github/copilot/plans/scr-001-login.md`（AppEnvironment / AuthUser / UserRole が実装済みであること）

### 2.2 DESIGN Issue（仕様の背景・補助）

- なし（planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

- なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし

## 3. スコープ / 非ゴール

- 対象: planに記載された変更のみ
- 非ゴール:
  - SCR-003（注文入力）/ SCR-006（注文履歴）/ SCR-014（管理メニュー）の本実装
  - お知らせ（Announcement）の動的取得
  - 注文締切時刻の動的設定
  - ディープリンク対応
  - Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（planから転記）

| レイヤ     | action | path                                                     | 型名/関数名                                                                 | 依存（どこ→どこ）                                   | tests                  |
| ---------- | ------ | -------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------- |
| Model      | modify | `MilkOrder/Domain/Auth/AuthUser.swift`                   | `AuthUser`（`deliveryDestinationName: String?` 追加）                       | なし                                                | SCR-001 テスト回帰確認 |
| DataSource | modify | `MilkOrder/Infrastructure/Auth/MockAuthRepository.swift` | `MockAuthRepository`（demo ユーザーに `deliveryDestinationName` をセット）  | `AuthRepository` Protocol                           | —                      |
| Other      | add    | `MilkOrder/App/MenuDestination.swift`                    | `MenuDestination`（Hashable enum）                                          | なし                                                | —                      |
| ViewModel  | add    | `MilkOrder/Features/Menu/MenuViewModel.swift`            | `MenuViewModel`                                                             | `AuthUser`, `onLogout: () -> Void`                  | `MenuViewModelTests`   |
| View       | add    | `MilkOrder/Features/Menu/MenuView.swift`                 | `MenuView`, `MenuHeaderSection`, `MenuButtonsSection`, `OrderDeadlineLabel` | `MenuViewModel`                                     | —                      |
| View       | add    | `MilkOrder/Features/Menu/MenuItemButton.swift`           | `MenuItemButton`                                                            | なし                                                | —                      |
| View       | add    | `MilkOrder/Features/Shared/PlaceholderView.swift`        | `PlaceholderView`                                                           | なし                                                | —                      |
| Other      | modify | `MilkOrder/MilkOrderApp.swift`                           | —                                                                           | `AppEnvironment`（NavigationStack + MenuView 追加） | —                      |
| Test       | add    | `MilkOrderTests/Features/Menu/MenuViewModelTests.swift`  | `MenuViewModelTests`                                                        | `MenuViewModel`                                     | —                      |

## 6. 受入条件（planから転記）

- `MenuView` が iPhone 17 シミュレーターで表示される
- `demo@example.com` でログイン時、`MenuViewModel.clientDisplayName` が `"○○保育園 様"` になる（FR-01, FR-02）
- `user.role == .orderEntry` のとき `showsOrderEntryButtons` が `true`、`showsAdminMenu` が `false`（FR-03, FR-05）
- `user.role == .operator` または `.admin` のとき `showsAdminMenu` が `true`、`showsOrderEntryButtons` が `false`（FR-04）
- ログアウトボタン押下で `AppEnvironment.currentUser` が `nil` になり LoginView に戻る（FR-06）
- `navigate(to:)` 呼び出しで `navigationPath` にターゲットが追加される（FR-07）
- `navigate(to: .orderCorrection)` で `navigationPath == [.orderCorrection]`（FR-08）
- `navigate(to: .announcements)` で `navigationPath == [.announcements]`（FR-09）
- `MenuViewModel.orderDeadlineText` が `"注文締切：毎日 15:00"` を返す（FR-10）
- `MenuItemButton` の `.frame(maxWidth: .infinity, minHeight: 56)` が設定されている（NFR-01）
- `MenuViewModel` クラスに `@MainActor` が付与されている
- ユーザー名・`deliveryDestinationName` がログに出力されていない（NFR-03）
- `AuthUser` の `deliveryDestinationName` を省略してデフォルト `nil` となり SCR-001 既存テストが PASS（回帰）
- `swiftlint lint --strict` が 0 violations（入力制約）
- `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE:
  - `AuthRepository` Protocol の定義（追加変更禁止）
  - SCR-001 で確立した `AppEnvironment` の `AuthRepository` DI 経路
- 禁止事項:
  - `MenuView` から `AppEnvironment` を直接参照しない（`MenuViewModel` 経由のみ）
  - background スレッドから `@Published` を更新しない
  - ユーザー名・`deliveryDestinationName` を `print` / `Logger` に出力しない
  - plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- DI経路: `MilkOrderApp（AppEnvironment）→ MenuViewModel（user: AuthUser, onLogout: () -> Void）→ MenuView`
- `@MainActor` を `MenuViewModel` クラスに付与し、`logout()` / `navigate(to:)` を MainActor 上で実行
- `MenuView` は `MenuViewModel` のみに依存し、`AppEnvironment` を直接 import しない
- SCR-002 では Repository を追加しない（データ取得なし）
- NavigationStack は `[MenuDestination]` 型付き配列で管理する（型消去の `NavigationPath` は不使用）
- Firebase SDK を import しない（本Issueは Mock のみ）
- `AuthUser.deliveryDestinationName` は Optional 追加のため後方互換を維持すること

## 9. 必読（規約/ゲート）

- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/50-security.md`
- `.github/copilot/60-ci-quality-gates.md`

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

- 参照したSSOT: `.github/copilot/plans/scr-002-menu.md`
- 実装判断（裁量がある場合のみ）: 1〜3行
- 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

- 成果物マニフェスト5章の全9ファイルが実装済み（修正3件・追加6件）
- 6章の受入条件がすべて満たされる（XCTestで担保）
- SCR-001 の既存テストが回帰せず PASS
- CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test）
- ユーザー名・`deliveryDestinationName` がコード・ログ・テストデータに含まれていない
- ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
