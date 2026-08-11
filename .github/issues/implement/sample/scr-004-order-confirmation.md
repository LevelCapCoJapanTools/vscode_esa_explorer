---
phase: implement
screen_id: SCR-004
title: "[IMPLEMENT] SCR-004 注文確認画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-004 注文確認画面

## 0. AI Agent 契約（最初に読む）

- あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
- **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
- **plan外の仕様追加/推測補完は禁止**。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

- ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
- 前提: SwiftUI / Swift Concurrency（async/await）/ Protocol-based DI（AppEnvironment）
- 前提SCR:
  - **SCR-001（ログイン画面）の実装が完了していること**（AuthUser / AppEnvironment 実装済み）
  - **SCR-002（メニュー画面）の実装が完了していること**（MenuDestination / NavigationStack 定義済み）
  - **SCR-003（注文入力画面）の実装が完了していること**（OrderDraft / Product / OrderItem / TaxCategory 定義済み）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/scr-004-order-confirmation.md`

> **前提plan**: `scr-001-login.md`（AuthUser / AppEnvironment）、`scr-002-menu.md`（MenuDestination / NavigationStack）、`scr-003-order-input.md`（OrderDraft / Product / OrderItem / TaxCategory）

### 2.2 DESIGN Issue（仕様の背景・補助）

- なし（planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

- なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし

## 3. スコープ / 非ゴール

- 対象: planに記載された変更のみ
- 非ゴール:
  - 注文完了画面（SCR-005）の本実装（PlaceholderView で代替）
  - 確定後のメール/アプリ内通知（SCR-013 通知設定マスタ実装時）
  - 注文内容の特定フィールドへの部分戻り遷移（初期版は SCR-003 先頭へ一律戻る）
  - べき等制御（サーバー側）の実装（API 設計フェーズ）
  - Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（planから転記）

| レイヤ         | action | path                                                                              | 型名/関数名                                                                                                       | 依存（どこ→どこ）                                                                      | tests                             |
| -------------- | ------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------- |
| Model          | add    | `MilkOrder/Domain/Order/PlacedOrder.swift`                                        | `PlacedOrder`                                                                                                     | なし                                                                                   | —                                 |
| Protocol       | add    | `MilkOrder/Domain/Order/OrderRepository.swift`                                    | `OrderRepository`, `OrderRepositoryError`                                                                         | なし                                                                                   | —                                 |
| DataSource     | add    | `MilkOrder/Infrastructure/Order/MockOrderRepository.swift`                        | `MockOrderRepository`（`shouldFail` フラグ付き）                                                                  | `OrderRepository` Protocol                                                             | —                                 |
| Model          | modify | `MilkOrder/Domain/Order/Product.swift`                                            | `Product: Hashable`, `TaxCategory: Hashable` 準拠追加                                                             | なし                                                                                   | SCR-003 テスト回帰確認            |
| Model          | modify | `MilkOrder/Domain/Order/OrderItem.swift`                                          | `OrderItem: Hashable` 準拠追加                                                                                    | なし                                                                                   | SCR-003 テスト回帰確認            |
| Model          | modify | `MilkOrder/Domain/Order/OrderDraft.swift`                                         | `OrderDraft: Hashable` 準拠追加                                                                                   | なし                                                                                   | SCR-003 テスト回帰確認            |
| Other          | modify | `MilkOrder/Features/Menu/MenuDestination.swift`                                   | `.orderConfirmation(OrderDraft)` / `.orderComplete(PlacedOrder)` case 追加                                        | `OrderDraft: Hashable`, `PlacedOrder: Hashable`                                        | —                                 |
| AppEnvironment | modify | `MilkOrder/App/AppEnvironment.swift`                                              | `orderRepository: any OrderRepository` を追加                                                                     | `OrderRepository` Protocol                                                             | SCR-001〜003 テスト回帰確認       |
| ViewModel      | add    | `MilkOrder/Features/OrderConfirmation/OrderConfirmationViewModel.swift`           | `OrderConfirmationViewModel`                                                                                      | `OrderRepository` Protocol, `onConfirmed: (PlacedOrder) -> Void`, `onEdit: () -> Void` | `OrderConfirmationViewModelTests` |
| View           | add    | `MilkOrder/Features/OrderConfirmation/OrderConfirmationView.swift`                | `OrderConfirmationView`, `DeliveryInfoSection`, `OrderItemsSection`, `OrderItemRowView`, `ConfirmButtonsSection`  | `OrderConfirmationViewModel`                                                           | —                                 |
| Other          | modify | `MilkOrder/MilkOrderApp.swift`                                                    | `.orderConfirmation` / `.orderComplete` の `.navigationDestination` 接続、`onConfirmed` / `onEdit` クロージャ実装 | —                                                                                      | —                                 |
| Test           | add    | `MilkOrderTests/Features/OrderConfirmation/OrderConfirmationViewModelTests.swift` | `OrderConfirmationViewModelTests`                                                                                 | `OrderConfirmationViewModel`, `MockOrderRepository`                                    | —                                 |

## 6. 受入条件（planから転記）

- `OrderConfirmationView` が iPhone 17 シミュレーターで表示される
- `OrderDraft.deliveryDate` が `yyyy/MM/dd` フォーマットで「配達日：YYYY/MM/dd」表示される（FR-01）
- `OrderDraft.deliveryDestinationName` が「配達先：〇〇保育園」形式で表示される（FR-02）
- `OrderDraft.items` の各 `OrderItem.product.name` / `quantity` / `subtotal` が「商品名 × 数量 ¥小計」形式で表示される（FR-03）
- `OrderDraft.taxAmount` が「消費税 ¥xxx」形式で表示される（FR-04）
- `OrderDraft.total` が「総額 ¥xxx」形式で表示される（FR-05）
- 「注文を確定する」押下で `MockOrderRepository.placeOrderCalled == true` になる（FR-06）
- `isLoading == true` の間 `ProgressView` 表示、ボタンが `.disabled(true)` になる（FR-07）
- 確定成功後に `onConfirmed(PlacedOrder)` クロージャが 1 回呼ばれる（FR-08）
- 「修正する」押下で `onEdit()` クロージャが 1 回呼ばれる（FR-09）
- `OrderRepositoryError.network` の場合 `errorMessage == "注文の確定に失敗しました。再度お試しください。"` が表示される（FR-10）
- 「注文を確定する」「修正する」ボタンが `.frame(maxWidth: .infinity)` `.padding(.vertical, 12)` 以上のサイズを確保している（NFR-01）
- 金額が `formattedPrice(Int) -> String` で「¥1,234」形式で表示される（NFR-02）
- 「注文を確定する」がプライマリスタイル（濃い背景色）、「修正する」がセカンダリスタイル（薄い背景色）で区別されている（NFR-03）
- `isLoading == true` 中に `confirmOrder()` を再呼び出しても `placeOrder()` が 1 回しか呼ばれない（二重送信防止）
- `items.isEmpty` の `OrderDraft` で `confirmOrder()` を呼ぶと `errorMessage` が非 nil、`onConfirmed` が呼ばれない（防御的処理）
- `isLoading == true` 中に `editOrder()` を呼んでも `onEdit` が呼ばれない（確定中は修正不可）
- `OrderConfirmationViewModel` クラスに `@MainActor` が付与されている
- `Product` / `TaxCategory` / `OrderItem` / `OrderDraft` に `Hashable` 準拠が追加され SCR-003 既存テストが PASS
- `AppEnvironment` への `orderRepository` 追加で SCR-001〜003 既存テストが回帰せず PASS
- 配達先名・商品明細・金額がコード・ログ・テストデータに含まれていない
- `swiftlint lint --strict` が 0 violations
- `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE:
  - `AuthRepository` / `ProductRepository` Protocol の定義
  - `MenuDestination` の既存 case（`orderInput`, `orderHistory`, `orderCorrection`, `announcements`, `adminMenu`）の定義
  - SCR-001〜003 で確立した DI 経路・ViewModel インターフェース
- 禁止事項:
  - `OrderConfirmationView` から `MockOrderRepository` を直接 import しない（`OrderRepository` Protocol 経由のみ）
  - background スレッドから `@Published` を更新しない
  - `isLoading == true` 中に `confirmOrder()` を再実行しない（二重送信防止）
  - 配達先名・商品名・金額を `print` / `Logger` に出力しない
  - `OrderRepositoryError.unknown(Error)` の stacktrace を UI に渡さない
  - `draft` プロパティを `@Published` にしない（`let draft: OrderDraft` として init で受け取るのみ）
  - plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- DI経路: `AppEnvironment → OrderConfirmationViewModel（orderRepository, orderDraft, onConfirmed, onEdit）→ OrderConfirmationView`
- `@MainActor` を `OrderConfirmationViewModel` クラスに付与。`confirmOrder()` は View 側 `Task {}` で呼び出し、`@Published` 更新は MainActor 上で実行
- `OrderConfirmationView` と `OrderConfirmationViewModel` は `OrderRepository`（Protocol）のみに依存。`MockOrderRepository` は `Infrastructure/Order/` に限定
- 遷移制御はクロージャ方式: `onConfirmed(PlacedOrder)` / `onEdit()` を MilkOrderApp に委譲（ViewModel は NavigationStack に依存しない）
- `MenuDestination.orderConfirmation(OrderDraft)` の associated value に `OrderDraft` を渡すため `OrderDraft: Hashable` 準拠が必須
- `PlacedOrder` も `MenuDestination.orderComplete(PlacedOrder)` の associated value のため `Hashable` 準拠が必須
- `formattedPrice(Int) -> String` ヘルパーは SCR-003 と同一形式（初期版はコピー。共通化は後続スコープ）
- Firebase SDK を import しない（本Issueは Mock のみ）

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

- 参照したSSOT: `.github/copilot/plans/scr-004-order-confirmation.md`
- 実装判断（裁量がある場合のみ）: 1〜3行
- 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

- 成果物マニフェスト5章の全12ファイルが実装済み（追加4件・修正8件）
- 6章の受入条件がすべて満たされる（XCTestで担保）
- SCR-001〜003 の既存テストが回帰せず PASS（Hashable 準拠追加・AppEnvironment 変更の影響確認）
- CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test）
- 配達先名・商品明細・金額がコード・ログ・テストデータに含まれていない
- 二重送信防止が `isLoading` ガードで実装されている
- `draft` が `let` で保持されており `@Published` になっていない
- ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
