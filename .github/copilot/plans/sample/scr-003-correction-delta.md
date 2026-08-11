# SCR-003 注文入力画面 — 訂正モード対応 更新仕様書（差分）

> **このドキュメントの位置付け**
> `scr-003-order-input.md`（新規注文フロー）に対する **差分仕様書**。
> 訂正フロー（`order-correction-flow.md` plan）の設計 Agent・実装 Agent が参照し、
> 訂正モード対応を実装する際の変更点を定義する。
>
> 実装完了後、このドキュメントの内容を `scr-003-order-input.md` に統合して
> 「新規注文 / 訂正モード両対応」の統一仕様書に昇格させる
> （統合作業は `.github/issues/design/scr-003-update-for-correction.md` のイシューで追跡）。

---

## 1. 変更の目的

`OrderInputView` / `OrderInputViewModel` を **新規注文・訂正の両モード** で動作させる。
訂正モードでは訂正元 `PlacedOrder` の内容を初期値として画面を起動する。

---

## 2. 変更サマリ

| 区分 | 対象                       | 変更概要                                                                      |
| ---- | -------------------------- | ----------------------------------------------------------------------------- |
| 追加 | `OrderInputMode` enum      | 新規注文 / 訂正の動作モード識別子                                             |
| 変更 | `OrderDraft`               | `sourceOrderId: String?` フィールドを追加（後方互換）                         |
| 変更 | `OrderInputViewModel`      | `mode: OrderInputMode` を init に追加。訂正モード時の初期値設定ロジックを追加 |
| 変更 | `OrderInputView`           | `navigationTitle` をモードに応じて切り替え。ボタン文言は変更しない            |
| 変更 | `MenuDestination`          | `.orderCorrectionInput(PlacedOrder)` case を追加                              |
| 変更 | `MilkOrderApp`             | `.orderCorrectionInput` destination に `OrderInputView`（訂正モード）を接続   |
| 変更 | `OrderInputViewModelTests` | 訂正モード初期値・訂正 OrderDraft 生成のテストを追加                          |

---

## 3. 差分詳細

### 3.1 `OrderInputMode` — 新規追加

```swift
// MilkOrder/Domain/Order/OrderInputMode.swift （新規）
enum OrderInputMode {
    case newOrder
    case correction(PlacedOrder)   // associated value: 訂正元注文
}
```

| 判断理由                                                 | 根拠                   |
| -------------------------------------------------------- | ---------------------- |
| `Bool` の `isEditing` より型安全で訂正元注文を保持できる | 5.1.1 責務分離         |
| ViewModel・View・テストすべて同一の型で判定できる        | 30-coding-standards.md |

---

### 3.2 `OrderDraft` — `sourceOrderId: String?` 追加

```swift
// 変更前
struct OrderDraft {
    let deliveryDate: Date
    let deliveryDestinationID: String
    let deliveryDestinationName: String
    let items: [OrderItem]
    let notes: String
    let subtotal: Int
    let taxAmount: Int
    let total: Int
}

// 変更後（追加のみ / 後方互換）
struct OrderDraft {
    // ... 既存フィールド変更なし ...
    let sourceOrderId: String?  // 追加: 新規注文は nil、訂正時は PlacedOrder.orderId
}
```

| 判断理由                                                                               | 根拠                          |
| -------------------------------------------------------------------------------------- | ----------------------------- |
| `Optional` で追加するため新規注文フロー（SCR-003/004/005）に破壊的変更なし             | scr-003 § 0.2 互換性制約      |
| `OrderRepository.correctOrder` / `placeOrder` でこの値を使って訂正か新規かを判定できる | order-correction-flow.md §6.4 |

---

### 3.3 `OrderInputViewModel` — `mode: OrderInputMode` 追加

#### init シグネチャ変更

```swift
// 変更前
init(
    productRepository: any ProductRepository,
    deliveryDestinationID: String,
    deliveryDestinationName: String,
    onProceed: @escaping (OrderDraft) -> Void
)

// 変更後
init(
    productRepository: any ProductRepository,
    deliveryDestinationID: String,
    deliveryDestinationName: String,
    mode: OrderInputMode = .newOrder,   // 追加（デフォルト値でSCR-003後方互換）
    onProceed: @escaping (OrderDraft) -> Void
)
```

#### 訂正モードの初期値設定ロジック（追加）

```
onAppear() で商品リストを取得した後:
  if case .correction(let original) = mode {
      deliveryDate = original.deliveryDate
      notes = original.notes
      original.items.forEach { item in
          quantities[item.product.id] = item.quantity
      }
  }
```

| 判断理由                                                                      | 根拠                                  |
| ----------------------------------------------------------------------------- | ------------------------------------- |
| 商品取得後に初期値をセットしないと quantities の product.id が存在しない      | scr-003 §5.5 データ取得ライフサイクル |
| `deliveryDate` の初期値を訂正元のままセットするが DatePicker で変更可能にする | 要件 §4.1 No.7                        |

#### `validateAndProceed()` — `sourceOrderId` 設定追加

```
// OrderDraft 生成時に sourceOrderId をセット
let sourceId: String? = {
    if case .correction(let original) = mode { return original.orderId }
    return nil
}()
return OrderDraft(
    deliveryDate: deliveryDate!,
    ...,
    sourceOrderId: sourceId   // 追加
)
```

#### computed property — 追加

```swift
var isEditingMode: Bool {
    if case .correction = mode { return true }
    return false
}

var navigationTitle: String {
    isEditingMode ? "注文訂正" : "注文入力"
}
```

---

### 3.4 `OrderInputView` — navigationTitle 切り替え

```swift
// 変更前（タイトル固定）
.navigationTitle("注文入力")

// 変更後（ViewModel から取得）
.navigationTitle(viewModel.navigationTitle)
```

| その他の View 変更         | 内容                                                 |
| -------------------------- | ---------------------------------------------------- |
| 「確認へ進む」ボタン文言   | **変更しない**（訂正モードでも「確認へ進む」のまま） |
| 商品リスト・合計セクション | 変更なし（初期値の違いのみ）                         |
| 配達日 DatePicker          | 変更なし（訂正モードでも未来日のみ選択可）           |

---

### 3.5 `MenuDestination` — `.orderCorrectionInput(PlacedOrder)` 追加

```swift
// scr-004 で追加済みの既存 case
case orderInput
case orderHistory
case orderCorrection           // SCR-CO-01 訂正注文選択画面へ
case orderConfirmation(OrderDraft)
case orderComplete(PlacedOrder)
// ...

// 追加
case orderCorrectionInput(PlacedOrder)   // SCR-CO-02 訂正入力画面へ
```

> `PlacedOrder` は scr-004 で `Hashable` 準拠済みのため、associated value として使用可能。

---

### 3.6 `MilkOrderApp` — `.orderCorrectionInput` destination 接続

```swift
// 追加
.navigationDestination(for: MenuDestination.self) { destination in
    switch destination {
    // ... 既存 ...
    case .orderCorrectionInput(let originalOrder):
        if let user = env.currentUser,
           let destinationID = user.deliveryDestinationID,
           let destinationName = user.deliveryDestinationName {
            OrderInputView(
                viewModel: OrderInputViewModel(
                    productRepository: env.productRepository,
                    deliveryDestinationID: destinationID,
                    deliveryDestinationName: destinationName,
                    mode: .correction(originalOrder),   // 訂正モードで初期化
                    onProceed: { draft in
                        env.navigationPath.append(.orderConfirmation(draft))
                    }
                )
            )
        } else {
            PlaceholderView()   // currentUser / 配達先が未設定の場合はガード表示
        }
    }
}
```

> **注**: 訂正フローの確認画面（SCR-CO-03）は既存の `OrderConfirmationView` を
> `sourceOrderId != nil` の `OrderDraft` と共に再利用する（新規専用 View は作らない）。

---

## 4. 後方互換性チェック

| 変更対象                                    | 既存 SCR-003（新規注文フロー）への影響 | 影響なし理由                                                                               |
| ------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `OrderInputMode` 追加                       | なし                                   | 新規 enum、既存コードは参照しない                                                          |
| `OrderDraft.sourceOrderId` 追加             | なし                                   | `Optional`（nil）追加。既存の `OrderDraft` 生成コード要修正（`sourceOrderId: nil` を追記） |
| `OrderInputViewModel.init` 変更             | なし                                   | `mode` はデフォルト値 `.newOrder` のため既存呼び出し元の変更不要                           |
| `OrderInputView.navigationTitle` 変更       | なし                                   | `.newOrder` の場合は「注文入力」のまま                                                     |
| `MenuDestination.orderCorrectionInput` 追加 | なし                                   | 新 case 追加のみ。既存 switch は `default` または網羅済み                                  |

> **要対応**: `OrderDraft` に `sourceOrderId: nil` を追記する箇所一覧（実装時に検索して修正する）:
>
> - `OrderInputViewModel.validateAndProceed()`
> - `MockOrderRepository` テストデータ
> - `OrderInputViewModelTests` の `OrderDraft` 生成コード

---

## 5. 追加テストケース（`OrderInputViewModelTests` 追記分）

| 区分 | テスト名                          | シナリオ                                                 | 期待結果                                                                        |
| ---- | --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 正常 | 訂正モード初期値設定              | `.correction(placedOrder)` で init → `onAppear()`        | `deliveryDate == placedOrder.deliveryDate`, `quantities` が元注文の数量で初期化 |
| 正常 | 訂正モード notes 初期値           | `.correction(placedOrder)` で init → `onAppear()`        | `notes == placedOrder.notes`                                                    |
| 正常 | 訂正 OrderDraft の sourceOrderId  | `.correction(placedOrder)` → `validateAndProceed()`      | `draft.sourceOrderId == placedOrder.orderId`                                    |
| 正常 | 新規注文の sourceOrderId は nil   | `.newOrder` → `validateAndProceed()`                     | `draft.sourceOrderId == nil`                                                    |
| 正常 | navigationTitle 訂正モード        | `.correction(placedOrder)` で init                       | `viewModel.navigationTitle == "注文訂正"`                                       |
| 正常 | navigationTitle 新規注文モード    | `.newOrder` で init                                      | `viewModel.navigationTitle == "注文入力"`                                       |
| 境界 | 訂正元の数量を 0 に変更して再確定 | 訂正モードで全 quantity を 0 にして validateAndProceed() | `errorMessage == "商品を1件以上選択してください"`                               |

---

## 6. 未確定事項（訂正フロー設計時に決定すること）

| 論点                                                                                               | 現状                                                    | 決定先                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------- |
| 訂正確認画面（SCR-CO-03）で元注文との差分を表示するか                                              | 差分表示なし（現状の `OrderConfirmationView` を再利用） | `order-correction-flow.md` plan で決定 |
| `OrderRepository` に `correctOrder(original:correction:)` を追加するか `placeOrder` を再利用するか | 未定                                                    | `order-correction-flow.md` plan で決定 |
| 訂正完了画面のタイトル・文言（「注文を受け付けました」→「訂正を受け付けました」等）                | 未定                                                    | `order-correction-flow.md` plan で決定 |
