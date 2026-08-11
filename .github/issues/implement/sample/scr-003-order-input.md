---
phase: implement
screen_id: SCR-003
title: "[IMPLEMENT] SCR-003 注文入力画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-003 注文入力画面

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency（async/await）/ Protocol-based DI（AppEnvironment）
* 前提SCR:
  * **SCR-001（ログイン画面）の実装が完了していること**（AuthUser / AppEnvironment 実装済み）
  * **SCR-002（メニュー画面）の実装が完了していること**（`MenuDestination.orderInput` 定義済み）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-003-order-input.md`

> **前提plan**: `scr-001-login.md`（AuthUser / AppEnvironment 実装済み）、`scr-002-menu.md`（MenuDestination.orderInput 定義済み）

### 2.2 DESIGN Issue（仕様の背景・補助）

* なし（planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

* なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * 注文確認画面（SCR-004）の本実装
  * 商品カテゴリ別グループ表示（初期版は単一リスト）
  * 配達先別商品フィルタリング（マスタ設計未定）
  * 過去購入商品の上位表示
  * 注文締切時刻の動的判定（15:00チェック。SCR-013 マスタ確定後に対応）
  * Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（planから転記）

| レイヤ | action | path | 型名/関数名 | 依存（どこ→どこ） | tests |
| --- | --- | --- | --- | --- | --- |
| Model | add | `MilkOrder/Domain/Order/Product.swift` | `Product`, `TaxCategory` | なし | — |
| Model | add | `MilkOrder/Domain/Order/OrderItem.swift` | `OrderItem` | `Product`, `TaxCategory` | — |
| Model | add | `MilkOrder/Domain/Order/OrderDraft.swift` | `OrderDraft` | `OrderItem` | — |
| Protocol | add | `MilkOrder/Domain/Order/ProductRepository.swift` | `ProductRepository`, `ProductRepositoryError` | なし | — |
| DataSource | add | `MilkOrder/Infrastructure/Order/MockProductRepository.swift` | `MockProductRepository`（3商品） | `ProductRepository` Protocol | — |
| AppEnvironment | modify | `MilkOrder/App/AppEnvironment.swift` | — | `productRepository: any ProductRepository` を追加 | SCR-001/002 テスト回帰確認 |
| ViewModel | add | `MilkOrder/Features/OrderInput/OrderInputViewModel.swift` | `OrderInputViewModel` | `ProductRepository` Protocol, `onProceed: (OrderDraft) -> Void` | `OrderInputViewModelTests` |
| View | add | `MilkOrder/Features/OrderInput/ProductRowView.swift` | `ProductRowView`, `QuantityStepperView` | `OrderInputViewModel` | — |
| View | add | `MilkOrder/Features/OrderInput/OrderInputView.swift` | `OrderInputView`, `DeliveryDateSection`, `ProductListSection`, `NotesSection`, `OrderTotalSection` | `OrderInputViewModel` | — |
| Other | modify | `MilkOrder/MilkOrderApp.swift` | — | `.navigationDestination` に `.orderInput` → `OrderInputView` を接続 | — |
| Test | add | `MilkOrderTests/Features/OrderInput/OrderInputViewModelTests.swift` | `OrderInputViewModelTests` | `OrderInputViewModel`, `MockProductRepository` | — |

## 6. 受入条件（planから転記）

* `OrderInputView` が iPhone 17 シミュレーターで表示される
* 画面表示時（`onAppear`）後 `products` が非空、`isAvailable == true` の商品のみ表示される（FR-01）
* `DatePicker` で `deliveryDate` が更新され、今日以降のみ選択可能（`in: Date()...`）（FR-02, FR-03）
* `incrementQuantity(for:)` / `decrementQuantity(for:)` で quantity が増減する（FR-04）
* `decrementQuantity` で quantity > 0 のときのみ減算し、0未満にならない（FR-05）
* `totalAmount` computed property が `quantities` 変更のたびに自動再計算される（FR-06）
* `ProductRowView` に単価を read-only で表示し、注文者が変更できる入力フィールドがない（FR-07）
* `notes.count <= 50` バリデーションで 51 文字目は入力不可（切り詰め）（FR-08）
* `validateAndProceed()` で `deliveryDate == nil` のとき `errorMessage` = 「配達日を選択してください」（FR-09）
* 全 quantity == 0 のとき `errorMessage` = 「商品を1件以上選択してください」（FR-10）
* バリデーション通過後 `validateAndProceed()` が `OrderDraft` を返し `onProceed(OrderDraft)` クロージャを呼ぶ（FR-11）
* `MenuItemButton` の `.frame(width: 44, height: 44)` が QuantityStepperView の＋/－ボタンに設定されている（NFR-01）
* `isLoading == true` の間 ProgressView を表示し、取得後に商品リストを表示する（NFR-02）
* 単価・数量・合計金額を `¥1,234` 形式で表示する `formattedPrice` ヘルパーが実装されている（NFR-03）
* 商品取得失敗時に `errorMessage` = 「商品情報の取得に失敗しました。再度お試しください。」が表示される
* `isLoading == true` の間「確認へ進む」ボタンが `.disabled(true)` になる
* `OrderInputViewModel` クラスに `@MainActor` が付与されている
* `AppEnvironment` への `productRepository` 追加で SCR-001/002 既存テストが回帰せず PASS
* `swiftlint lint --strict` が 0 violations
* `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `AuthRepository` Protocol の定義
  * SCR-001/002 で確立した DI 経路・ViewModel インターフェース
  * `MenuDestination` enum の既存 case（`orderInput` は修正不要）
* 禁止事項:
  * `OrderInputView` から `MockProductRepository` を直接 import しない（`ProductRepository` Protocol 経由のみ）
  * background スレッドから `@Published` を更新しない
  * 単価を注文者が手入力できる UI にしない（FR-07）
  * 消費税計算ロジックを View に置かない（ViewModel の private メソッドに集約）
  * 配達先名・ユーザー名を `print` / `Logger` に出力しない
  * `AppEnvironment` への `productRepository` 追加で既存コードを破壊的変更しない（既存フィールドへの影響なし）
  * plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI経路: `AppEnvironment → OrderInputViewModel（productRepository, onProceed）→ OrderInputView`
* `@MainActor` を `OrderInputViewModel` クラスに付与。`onAppear()` は `Task {}` で呼び出し、`@Published` 更新は MainActor 上で実行
* `OrderInputView` と `OrderInputViewModel` は `ProductRepository`（Protocol）のみに依存。`MockProductRepository` は `Infrastructure/Order/` に限定
* バリデーション後の遷移は `onProceed: (OrderDraft) -> Void` クロージャで行う（ViewModel は NavigationStack に依存しない）
* 消費税端数処理は切り捨て（初期仮実装）。実装を `taxAmount(for:quantity:)` private メソッドに集約し差し替えを容易にすること
* 注文締切判定は「今日以降」で仮実装（`in: Date()...`）。15:00 動的チェックは SCR-013 確定後に対応
* Firebase SDK を import しない（本Issueは Mock のみ）

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

* 参照したSSOT: `.github/copilot/plans/scr-003-order-input.md`
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト5章の全11ファイルが実装済み（追加9件・修正2件）
* 6章の受入条件がすべて満たされる（XCTestで担保）
* SCR-001/002 の既存テストが回帰せず PASS（AppEnvironment 変更の影響確認）
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test）
* 配達先名・ユーザー名がコード・ログ・テストデータに含まれていない
* 単価を注文者が手入力できる UI が実装されていない
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
