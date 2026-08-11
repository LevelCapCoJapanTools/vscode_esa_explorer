---
phase: implement
screen_id: 注文訂正フロー（SCR-CO-01〜04）
title: "[IMPLEMENT] 注文訂正フロー（MenuDestination.orderCorrection 本実装）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] 注文訂正フロー（MenuDestination.orderCorrection 本実装）

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
* 前提SCR:
  * **SCR-001（ログイン画面）の実装が完了していること**（AuthUser / AppEnvironment 実装済み）
  * **SCR-002（メニュー画面）の実装が完了していること**（MenuDestination.orderCorrection / navigationPath 定義済み）
  * **SCR-003（注文入力画面）の実装が完了していること**（OrderDraft / Product / OrderItem / OrderInputViewModel 定義済み）
  * **SCR-004（注文確認画面）の実装が完了していること**（PlacedOrder / OrderRepository / OrderConfirmationViewModel 定義済み）
  * **SCR-005（注文完了画面）の実装が完了していること**（OrderCompleteViewModel / `navigationPath = [.orderHistory]` リセット遷移 定義済み）
* **未実装の前提差分あり**: `scr-003-correction-delta.md` に確定済みの `OrderInputMode` / `OrderDraft.sourceOrderId` / `MenuDestination.orderCorrectionInput(PlacedOrder)` は、本Issue着手時点でコード未反映（`OrderInputMode.swift` 不存在・`OrderDraft.sourceOrderId` 不存在・`MenuDestination` に `orderCorrectionInput` case 不存在を確認済み）。本Issueの実装手順1（§8.2 手順1）に従い、本Issue内でこの差分を先に適用してから訂正フロー本体を実装すること。

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/order-correction-flow.md`（本体plan。TBD解決済み）

> **前提plan（適用必須）**: `.github/copilot/plans/scr-003-correction-delta.md`（`OrderInputMode` / `OrderDraft.sourceOrderId` / `MenuDestination.orderCorrectionInput` の差分仕様。§3 の差分詳細を本Issueの実装手順1でそのまま適用する）

### 2.2 DESIGN Issue（仕様の背景・補助）

* なし（GitHub Issue未登録。`.github/issues/design/order-correction-flow.md` に下書きが残存するが、planはコミット `edda6c2` / `198cb09` / `a59f686` で直接確定済みのため、planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

* なし（上記コミットがmain上で確定済み。PR番号なし）

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: `order-correction-flow.md` および前提差分 `scr-003-correction-delta.md` に記載された変更のみ
* 非ゴール:
  * SCR-006 購入履歴画面の一覧/詳細UI実装（既に別Issueで実装済みのため変更不要）
  * 運用側（`.operator` / `.admin`）の注文編集機能（SCR-008スコープ）
  * 一括訂正・複数注文の同時訂正
  * Firebase/Firestore の実際の接続・設定変更（Mock実装のみ）
  * `scr-003-order-input.md` への差分統合（別Issue `scr-003-update-for-correction.md` のスコープ。本Issue完了後に着手すること）

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る。

| レイヤ | action | path | 型名/関数名 | 依存（どこ→どこ） | tests |
| --- | --- | --- | --- | --- | --- |
| Model | add | `MilkOrder/Domain/Order/OrderInputMode.swift` | `OrderInputMode`（`.newOrder` / `.correction(PlacedOrder)`） | `PlacedOrder` | `OrderInputViewModelTests` |
| Model | modify | `MilkOrder/Domain/Order/OrderDraft.swift` | `OrderDraft.sourceOrderId: String?` 追加 | — | `OrderInputViewModelTests` |
| Model | modify | `MilkOrder/Domain/Order/PlacedOrder.swift` | `sourceOrderId: String?` / `correctionStatus: OrderCorrectionStatus` 追加、`OrderCorrectionStatus` enum 追加 | — | 既存フィクスチャ更新 |
| Repository | add | `MilkOrder/Domain/Order/OrderCorrectionRepository.swift` | `OrderCorrectionRepository`（`fetchCorrectableOrders(deliveryDestinationID:)`）、`OrderCorrectionRepositoryError` | — | — |
| Repository | modify | `MilkOrder/Domain/Order/OrderRepository.swift` | `correctOrder(_:)` 追加、`OrderRepositoryError` に `.unauthorized` / `.deadlineExceeded` / `.alreadyCorrected` / `.notFound` 追加 | — | — |
| Repository | add | `MilkOrder/Domain/Deadline/DeadlineCheckRepository.swift` | `DeadlineCheckRepository`（`fetchDeadlineSettings()`）、`DeadlineSettings` / `DeadlineOverride` / `DeadlineCheckRepositoryError` | — | — |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Order/MockOrderCorrectionRepository.swift` | `MockOrderCorrectionRepository` | `OrderCorrectionRepository` | `OrderCorrectionSelectionViewModelTests` |
| Repository（DataSource） | modify | `MilkOrder/Infrastructure/Order/MockOrderRepository.swift` | `correctOrder(_:)` 実装（元注文を `.corrected` 更新＋新注文作成） | `OrderRepository` | `OrderConfirmationViewModelTests` |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Deadline/MockDeadlineCheckRepository.swift` | `MockDeadlineCheckRepository`（デフォルト: 前日13:00, `isOrderingHalted: false`, `overrides: []`） | `DeadlineCheckRepository` | — |
| ViewModel | add | `MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionViewModel.swift` | `OrderCorrectionSelectionViewModel`（権限ガード・一覧取得・締切前フィルタ・`selectOrder(_:)`） | `OrderCorrectionRepository`, `AuthUser` | `OrderCorrectionSelectionViewModelTests` |
| ViewModel | modify | `MilkOrder/Features/OrderInput/OrderInputViewModel.swift` | `mode: OrderInputMode = .newOrder` 追加、訂正初期値設定ロジック、`isEditingMode` / `navigationTitle` 算出プロパティ追加 | `OrderInputMode` | `OrderInputViewModelTests` |
| ViewModel | modify | `MilkOrder/Features/OrderConfirmation/OrderConfirmationViewModel.swift` | `draft.sourceOrderId != nil` で `correctOrder(_:)` を呼ぶ分岐、エラーメッセージ切替 | `OrderRepository` | `OrderConfirmationViewModelTests` |
| ViewModel | modify | `MilkOrder/Features/OrderComplete/OrderCompleteViewModel.swift` | `placedOrder.sourceOrderId != nil` で訂正向け文言を返す | — | `OrderCompleteViewModelTests` |
| View | add | `MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionView.swift` | `OrderCorrectionSelectionView`, `CorrectableOrdersSection`, `CorrectableOrderRowView`, `OrderCorrectionEmptyStateView`, `CorrectionStatusBadge` | `OrderCorrectionSelectionViewModel` | — |
| View | modify | `MilkOrder/Features/OrderInput/OrderInputView.swift` | `.navigationTitle(viewModel.navigationTitle)` に変更（固定文字列から差し替え） | `OrderInputViewModel` | — |
| View | modify | `MilkOrder/Features/OrderConfirmation/OrderConfirmationView.swift` | 訂正モード時のタイトル/ボタン文言切替 | `OrderConfirmationViewModel` | — |
| View | modify | `MilkOrder/Features/OrderComplete/OrderCompleteView.swift` | 訂正完了メッセージ/ボタン文言切替 | `OrderCompleteViewModel` | — |
| Other | modify | `MilkOrder/App/MenuDestination.swift` | `case orderCorrectionInput(PlacedOrder)` 追加 | `PlacedOrder` | — |
| Other | modify | `MilkOrder/Features/Menu/MenuView.swift` | `.orderCorrection` を `PlaceholderView` から `OrderCorrectionSelectionView` に置換し、選択時に `.orderCorrectionInput(selectedOrder)` へ遷移、`.orderCorrectionInput` destination で `OrderInputView(mode: .correction(...))` を接続 | `OrderCorrectionSelectionView`, `OrderInputView` | — |
| AppEnvironment | modify | `MilkOrder/App/AppEnvironment.swift` | `orderCorrectionRepository: any OrderCorrectionRepository`、`deadlineCheckRepository: any DeadlineCheckRepository` を追加し `.live()` / `.preview()` へ注入 | `MockOrderCorrectionRepository`, `MockDeadlineCheckRepository` | 既存Preview維持確認 |
| Test | add | `MilkOrderTests/Features/OrderCorrection/OrderCorrectionSelectionViewModelTests.swift` | `OrderCorrectionSelectionViewModelTests` | `OrderCorrectionSelectionViewModel` | — |
| Test | modify | `MilkOrderTests/Features/OrderInput/OrderInputViewModelTests.swift` | 訂正モード初期値・`sourceOrderId` 生成・`navigationTitle` 切替テスト追加 | `OrderInputViewModel` | — |
| Test | modify | `MilkOrderTests/Features/OrderConfirmation/OrderConfirmationViewModelTests.swift` | 訂正確定成功/失敗/修正戻りテスト追加 | `OrderConfirmationViewModel` | — |
| Test | modify | `MilkOrderTests/Features/OrderComplete/OrderCompleteViewModelTests.swift` | 訂正完了時の文言/履歴遷移テスト追加 | `OrderCompleteViewModel` | — |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

* FR-01: `MenuDestination.orderCorrection` は SCR-CO-01「訂正注文選択画面」に遷移する（`PlaceholderView` ではなく `OrderCorrectionSelectionView` が表示される）
* FR-02: SCR-CO-01 は `AuthUser.role == .orderEntry` かつ `deliveryDestinationID` を持つユーザーのみ利用できる（`.operator` / `.admin` または `deliveryDestinationID == nil` はガード状態を表示し一覧取得を実行しない）
* FR-03: SCR-CO-01 は自分の配達先に属する「締切前（配達日前日13:00、または `DeadlineCheckRepository` 取得済み締切時刻優先）・`correctionStatus == .active`」の注文のみ表示する
* FR-04: 注文選択時は `MenuDestination.orderCorrectionInput(PlacedOrder)` へ遷移し、SCR-CO-02 は `OrderInputView(mode: .correction(selectedOrder))` を再利用して元注文の配達日・備考・数量を初期値にする
* FR-05: SCR-CO-03 は `OrderConfirmationView` を再利用し、`draft.sourceOrderId != nil` の場合に確定ボタン押下で `OrderRepository.correctOrder(_:)` を呼ぶ（`placeOrder(_:)` は呼ばない）
* FR-06: `correctOrder(_:)` は元注文を `correctionStatus = .corrected` に更新し、別IDの新規注文を作成して返す（新注文の `sourceOrderId == 元注文ID`）
* FR-07: SCR-CO-04 は `OrderCompleteView` を再利用し、`placedOrder.sourceOrderId != nil` のとき訂正向け文言に切り替え、「履歴を見る」で `navigationPath = [.orderHistory]`（リセット、append禁止）
* FR-08: 締切超過・権限不正・元注文未検出・既訂正の注文は訂正できない（選択不可またはエラー表示、`correctOrder(_:)` を実行しない）
* FR-09: 訂正確定失敗時は `errorMessage` を表示し同一画面で再試行できる（`isLoading` を `false` に戻す）
* FR-10: アプリがフォアグラウンドになった時点で `DeadlineCheckRepository.fetchDeadlineSettings()` を非同期・非ブロッキングで呼び出し、結果を以降の訂正可否判定に反映する。失敗時はデフォルト締切（前日13:00）を使用する
* NFR-01: DI経路は `AppEnvironment -> ViewModel -> View` に固定し、View/ViewModelはProtocol経由でのみRepositoryにアクセスする
* NFR-02: 一覧取得・訂正確定は `async/await` で実行し、UI更新は `@MainActor` で保護する
* NFR-03: ログに配達先名・注文明細・金額を含めない
* NFR-04: `build` / `lint` / `test` / `security` の品質ゲートをすべて実行できる状態に保つ（追加依存導入なし）
* `OrderInputMode` / `OrderDraft.sourceOrderId` / `MenuDestination.orderCorrectionInput` 追加により、新規注文フロー（SCR-003〜005）の既存挙動・既存テストに回帰がない（`mode` デフォルト値 `.newOrder`、ボタン文言は変更しない）

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `OrderRepository.placeOrder(_:)` のシグネチャ・削除・改名（新規注文フローへの破壊的変更は禁止）
  * `PlacedOrder`, `OrderDraft`, `MenuDestination` の既存型名（必要なプロパティのみ追加）
  * SCR-001〜005 で確立したDI経路・ViewModelインターフェース
* 禁止事項:
  * SCR-CO-01の一覧取得をSCR-006の `OrderHistoryRepository` /画面に依存させない（独立した `OrderCorrectionRepository` を使う）
  * 元注文を物理削除・上書き更新しない（必ず `correctionStatus = .corrected` と新注文作成を分離する）
  * `placeOrder(_:)` に訂正ロジックを暗黙分岐で埋め込まない（`correctOrder(_:)` を明示的に追加する）
  * `.operator` / `.admin` や他配達先の注文を取得・訂正可能にしない
  * View からRepository/DataSource具象を直接importしない
  * backgroundスレッドから `@Published` を更新しない
  * 配達先名・注文明細・金額・ユーザー名・メールアドレス・生の注文IDをログに出力しない
  * `OrderInputView` の「確認へ進む」ボタン文言を訂正モードでも変更しない（`scr-003-correction-delta.md` §3.4）
  * plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）。新規Repository（`OrderCorrectionRepository`, `DeadlineCheckRepository`）はここに追加する
* `@MainActor` を `OrderCorrectionSelectionViewModel` / `OrderInputViewModel` / `OrderConfirmationViewModel` / `OrderCompleteViewModel` に付与し、UI更新の安全性を保証する
* View は ViewModel のみに依存し、Repository/DataSourceを直接importしない
* ViewModelはRepository Protocol（`any OrderCorrectionRepository`, `any OrderRepository`, `any DeadlineCheckRepository`）のみに依存し、具象型（Mock）を直接importしない
* Firebase SDKをimportしない（本Issoeの範囲はMock実装のみ）
* `#Preview` ではFirebaseを初期化しない（`.preview()` factoryを使用）
* 画面遷移は `MenuView` が `navigationPath` を操作し、各ViewModelは選択/確定/戻るのコールバックのみを返す（ViewModelをSwiftUIナビゲーション型へ依存させない）

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/plans/order-correction-flow.md`（特に §5.7 シーケンス図、§5.8 処理フロー図、§8.2 実装手順）
* `.github/copilot/plans/scr-003-correction-delta.md`（§3 差分詳細を実装手順1で適用）

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

* 参照したSSOT: `.github/copilot/plans/order-correction-flow.md`, `.github/copilot/plans/scr-003-correction-delta.md`
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト（5章）の全項目が実装済み
* 6章の受入条件がすべて満たされる（XCTestで担保）
* SCR-001〜005の既存テストが回帰せず PASS
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test / swift package audit）
* 配達先名・注文明細・金額・ユーザー名・メールアドレスがコード・ログ・テストデータに含まれていない
* `OrderCorrectionSelectionViewModel` / `OrderInputViewModel` / `OrderConfirmationViewModel` / `OrderCompleteViewModel` に `@MainActor` が付与されている
* 元注文が物理削除・上書きされず、`correctionStatus = .corrected` + 新規注文作成として実装されている
* `OrderInputMode` のデフォルト値 `.newOrder` により新規注文フローに既存挙動の変更がない
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
