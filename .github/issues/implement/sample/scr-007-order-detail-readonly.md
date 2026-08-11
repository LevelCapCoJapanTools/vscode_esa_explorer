---
phase: implement
screen_id: SCR-007
title: "[IMPLEMENT] SCR-007 注文詳細画面（注文入力者・参照専用スコープ）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-007 注文詳細画面（注文入力者・参照専用スコープ）

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
- 前提SCR:
  - **SCR-001（ログイン画面）の実装が完了していること**（`AuthUser` / `UserRole` 定義済み）
  - **SCR-004（注文確認画面）の実装が完了していること**（`PlacedOrder` 定義済み）
  - **SCR-006（購入履歴画面）の実装が完了していること**（`MenuDestination.orderDetail(PlacedOrder)` 既存契約、現状は `PlaceholderView` への遷移）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/scr-007-order-detail-ios-architecture.md`

> **前提plan**: `scr-004-order-confirmation.md`（`PlacedOrder` 定義済み）、`scr-006-order-history.md`（`OrderHistoryView` / `OrderHistoryViewModel` のレイヤパターン、`MenuDestination.orderDetail(PlacedOrder)` 既存契約）、`scr-007-order-detail.md`（プラットフォーム非依存の業務ルール・表示項目・FR-01/02/04/07/10）

### 2.2 DESIGN Issue（仕様の背景・補助）

- https://github.com/LevelCapTech/milk-order-ios/issues/17

### 2.3 DESIGN PR（設計差分・合意点）

- https://github.com/LevelCapTech/milk-order-ios/pull/18

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし

## 3. スコープ / 非ゴール

- 対象: planに記載された変更のみ
- 非ゴール:
  - 運用側（`operator` / `admin`）の編集・削除導線のiOS実装（SCR-008の権限マトリクス確定後に別Issueで設計・実装する）
  - `orderId` ベースの再取得Repository追加
  - `AppEnvironment` への新規Repository注入
  - Firebase/Firestore の実際の接続
  - Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

| レイヤ                   | action（add/modify/delete） | path（リポジトリルート相対）                                          | 型名/関数名                                                                                                                                                                                                                                           | 依存（どこ→どこ）                             | tests（追加/更新）                |
| ------------------------ | --------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------- |
| ViewModel                | add                         | `MilkOrder/Features/OrderDetail/OrderDetailViewModel.swift`           | `OrderDetailViewModel`（`accessState` / `showsEditAction` / `showsDeleteAction` / `formattedPrice(_:)` / `evaluateAccess()`）                                                                                                                         | `PlacedOrder`, `UserRole` → `OrderDetailView` | 追加: `OrderDetailViewModelTests` |
| View                     | add                         | `MilkOrder/Features/OrderDetail/OrderDetailView.swift`                | `OrderDetailView`, `OrderDetailBasicInfoSection`, `OrderDetailDeliveryInfoSection`, `OrderDetailItemsSection`, `OrderDetailNotesSection`, `OrderDetailAmountSection`, `OrderDetailAccessDeniedSection`, `OrderDetailDateText`, `OrderDetailPriceText` | `OrderDetailViewModel`                        | —                                 |
| Other                    | modify                      | `MilkOrder/Features/Menu/MenuView.swift`                              | `.orderDetail` case を `OrderDetailView(viewModel:)` に差し替え、`viewModel.user` から閲覧者情報（`viewerRole` / `viewerDeliveryDestinationID`）を注入                                                                                                | `MenuViewModel.user` → `OrderDetailViewModel` | SCR-001〜006既存テストの回帰確認  |
| Test                     | add                         | `MilkOrderTests/Features/OrderDetail/OrderDetailViewModelTests.swift` | `OrderDetailViewModelTests`                                                                                                                                                                                                                           | `OrderDetailViewModel`                        | —                                 |
| Model                    | なし                        | —                                                                     | `PlacedOrder` の変更なし（plan § 4.0 で Out-of-Scope）                                                                                                                                                                                                | —                                             | —                                 |
| Protocol                 | なし                        | —                                                                     | 新規Protocol追加なし（plan § 4.0 で Out-of-Scope）                                                                                                                                                                                                    | —                                             | —                                 |
| Repository（DataSource） | なし                        | —                                                                     | 新規Repository/DataSource追加なし（plan § 4.0 で Out-of-Scope）                                                                                                                                                                                       | —                                             | —                                 |
| AppEnvironment           | なし                        | —                                                                     | 変更なし（plan § 4.0 で Out-of-Scope）                                                                                                                                                                                                                | —                                             | —                                 |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

- `OrderDetailViewModel` に `PlacedOrder` を渡すと、各表示用値が入力内容と一致し、`OrderDetailView` が基本情報・配達情報・明細・備考・金額の各セクションを表示する（FR-01）
- `viewerRole == .orderEntry` かつ `viewerDeliveryDestinationID == order.deliveryDestinationID` の場合は `accessState == .content`、不一致時は `accessState == .denied` になる（FR-02）
- `MenuView.swift` で `.orderDetail(let order)` が `OrderDetailView(viewModel:)` を返し、`OrderHistoryViewModel` や `MenuDestination` の契約を変更しない（FR-03）
- `OrderDetailViewModel` が `showsEditAction == false` と `showsDeleteAction == false` を固定で返し、View に編集・削除ボタンが存在しない（FR-04）
- `OrderDetailView` が `OrderDetailBasicInfoSection` / `OrderDetailDeliveryInfoSection` / `OrderDetailItemsSection` / `OrderDetailNotesSection` / `OrderDetailAmountSection` / `OrderDetailAccessDeniedSection` を用いて構成される（FR-05）
- `viewerRole == .orderEntry` かつ `viewerDeliveryDestinationID == nil` の場合、`OrderDetailView` は本文セクションを描画せずアクセス拒否ビューのみ表示する（FR-06）
- `OrderDetailView` の Preview が `AppEnvironment.preview()` とローカルの `PlacedOrder` フィクスチャだけで成立し、Repository注入を必要としない（FR-07）
- `OrderDetailViewModel` が `@MainActor` で宣言され、View からは同期初期化のみで利用できる（NFR-01）
- アクセス拒否文言は汎用文言のみとし、`deliveryDestinationName` / `orderId` / `items` / `notes` / `subtotal` / `taxAmount` / `total` を含めない（NFR-02）
- `OrderDetailViewModelTests` は `PlacedOrder` フィクスチャのみで成立し、Preview は `AppEnvironment.preview()` を使う（NFR-03）
- `swiftlint lint --strict` が 0 violations
- `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE:
  - `PlacedOrder` のプロパティ追加・削除・意味変更
  - `MenuDestination.orderDetail(PlacedOrder)` を `orderId` 専用契約へ変更すること
- 禁止事項:
  - `OrderDetailView` / `OrderDetailViewModel` から Repository / DataSource / Firebase SDK を直接 import しない
  - 参照専用スコープで編集・削除ボタンを追加しない
  - 配達先名・注文番号・備考・金額・明細をアクセス拒否文言やログへ出力しない
  - plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- DI経路: `AppEnvironment -> MenuViewModel.user -> OrderDetailViewModel -> OrderDetailView`
- 本スコープでは新規Repository/Protocol/DataSourceを導入しない
- `@MainActor` を `OrderDetailViewModel` クラスに付与し、閲覧可否と表示用値の確定をMainActor上で行う（同期初期化、非同期取得は追加しない）
- `OrderDetailView` は `OrderDetailViewModel` のみに依存する
- Firebase SDK を import しない
- `#Preview` では `AppEnvironment.preview()` を使用する

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

- 参照したSSOT: `.github/copilot/plans/scr-007-order-detail-ios-architecture.md`
- 実装判断（裁量がある場合のみ）: 1〜3行
- 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

- 成果物マニフェスト5章の対象ファイルが実装済み（追加3件・修正1件）
- 6章の受入条件がすべて満たされる（XCTestで担保。planに従う）
- SCR-001〜006の既存テストが回帰せずPASSする
- CI品質ゲートがすべて緑（build / swiftlint lint --strict / test / swift package audit）
- `#Preview` が Firebase なしで動作する
- 配達先名・注文番号・備考・金額・明細がアクセス拒否文言・ログ・テストデータに含まれていない
- 参照専用スコープのため編集・削除導線が存在しない
- ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / DESIGN Issue / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
