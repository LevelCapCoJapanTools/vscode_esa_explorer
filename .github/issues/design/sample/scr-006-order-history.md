---
phase: design
screen_id: SCR-006
title: "[DESIGN] SCR-006 注文履歴画面"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-006 注文履歴画面

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
- 画面ID: SCR-006
- 画面名: 注文履歴画面（購入履歴画面）
- 利用者区分: 注文入力者（`UserRole.orderEntry`）
- 要件参照先: `.github/copilot/10-requirements.md` § 4.1 No.13、§ 5

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

### 2.2 前フェーズ成果物（前提plan）

以下 5 plan が確定済み。SCR-006 plan はこれらを前提とする。

| plan ファイル                                         | 主な提供物                                                                                                                                                                     |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.github/copilot/plans/scr-001-login.md`              | AuthUser（id / name / role / deliveryDestinationID / deliveryDestinationName）、AppEnvironment、AuthRepository                                                                 |
| `.github/copilot/plans/scr-002-menu.md`               | MenuDestination、NavigationStack（`menuViewModel.navigationPath`）                                                                                                             |
| `.github/copilot/plans/scr-003-order-input.md`        | Product、TaxCategory、OrderItem、OrderDraft、ProductRepository                                                                                                                 |
| `.github/copilot/plans/scr-004-order-confirmation.md` | PlacedOrder（orderId / confirmedAt / deliveryDate / deliveryDestinationName / items / total）、OrderRepository、Hashable 準拠済みモデル群、`MenuDestination.orderHistory` case |
| `.github/copilot/plans/scr-005-order-complete.md`     | OrderCompleteViewModel、`navigationPath = [.orderHistory]` でのリセット遷移                                                                                                    |

- 関連ADR: なし

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

- なし（ワイヤーフレーム未入手。`10-requirements.md` の機能要件と画面遷移定義を基に設計する）

> **補足**: ワイヤーフレームが後から入手された場合は、planのView部品一覧（5.1.3）と受入確認手順（1章）のみを更新し、アーキテクチャ・DI・Protocol 定義は変更しないこと。

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/scr-006-order-history.md` を新規作成する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- コード実装
- Firebase/Firestore の実際の接続・設定変更
- Staging/Production 環境の設定変更
- 注文詳細画面（SCR-007）の設計（後続スコープ）
- 検索・絞り込み機能（初期版は全履歴リスト表示のみ）
- 注文内容の修正・削除機能（SCR-008 運用側スコープ）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ                 | 配置先                             | 責務                          | 禁止依存                                   |
| ---------------------- | ---------------------------------- | ----------------------------- | ------------------------------------------ |
| View（SwiftUI）        | `MilkOrder/Features/OrderHistory/` | 表示のみ                      | Repository/DataSource を直接 import しない |
| ViewModel              | `MilkOrder/Features/OrderHistory/` | 状態管理・UIロジック          | DataSource具象を直接 import しない         |
| Repository（Protocol） | `MilkOrder/Domain/Order/`          | データアクセス抽象            | 具象実装を含めない                         |
| DataSource（Mock）     | `MilkOrder/Infrastructure/Order/`  | Mock履歴データ                | View/ViewModel を import しない            |
| Model/Entity           | `MilkOrder/Domain/Order/`          | PlacedOrder（既存。変更不可） | 他レイヤに依存しない                       |

### 4.2 DI方針

- DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
  - `orderHistoryRepository: any OrderHistoryRepository` を `AppEnvironment` に追加
- View/ViewModelはProtocolに依存し、具象型を直接importしない
- `#Preview` / Demo 環境では `MockOrderHistoryRepository` を使用

### 4.3 Firebase命名規則

| サービス  | Protocol名               | 具象実装名（将来）                | 配置先（将来）                    |
| --------- | ------------------------ | --------------------------------- | --------------------------------- |
| Firestore | `OrderHistoryRepository` | `FirestoreOrderHistoryRepository` | `MilkOrder/Infrastructure/Order/` |

> 初期版は `MockOrderHistoryRepository` で代替。Firestore 実装は API 設計フェーズで追加。

### 4.4 非同期処理

- `async/await` を使用。コールバックベースは禁止
- `@MainActor` を `OrderHistoryViewModel` に付与
- 履歴取得はbackgroundで実行し、Mainスレッドをブロックしない

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. View/ViewModel/Repository/DataSource の責務分離がplanに明記されている
3. Protocol定義・DI経路（`AppEnvironment → OrderHistoryViewModel → OrderHistoryView`）がplanに明記されている
4. テスト計画（XCTest）がplanに明記されている
5. CI品質ゲートの実行計画がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 画面の役割（要件から）

| 要件ID                           | 内容                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------- |
| `10-requirements.md` § 4.1 No.13 | 過去2年分の注文履歴を検索・確認。注文者は自分の配達先分のみ閲覧可                                 |
| § 9 データ保全                   | 注文履歴2年保存                                                                                   |
| 画面遷移                         | `SCR-002（メニュー）→ SCR-006` / `SCR-005（注文完了）→ SCR-006` / `SCR-006 → SCR-007（注文詳細）` |

### 6.2 設計時に判断が必要な論点（plan 内で明確化すること）

| 論点                   | 設計Agentへの指示                                                                                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 配達先フィルタ         | `AuthUser.role == .orderEntry` の場合、`AuthUser.deliveryDestinationID` を使って「自分の配達先分のみ」取得する。管理者・運用側は SCR-008 を使用（SCR-006 対象外） |
| 初期版の検索・絞り込み | 初期版は絞り込みなし（全履歴リスト降順表示）。将来拡張のための `dateRange` パラメータをRepository Protocol に定義し、初期版は `nil`（全期間）で動作させる         |
| リスト行の表示項目     | 配達日・注文番号・総額を1行に表示。商品詳細は SCR-007 へのタップで確認                                                                                            |
| SCR-007 遷移方法       | `MenuDestination` に `.orderDetail(PlacedOrder)` case を追加し、NavigationStack で遷移。SCR-007 設計は Out-of-Scope。初期版は PlaceholderView                     |
| 2年分の期間制限        | MockOrderHistoryRepository は現在日から遡った過去2年のダミーデータを返す。実際の期間フィルタはFirestoreクエリで行う（将来実装）                                   |
| 空状態（履歴なし）     | 注文履歴が0件の場合は「注文履歴はありません」空状態ビューを表示する                                                                                               |
| `PlacedOrder` モデル   | SCR-004 で定義済み。変更禁止。SCR-006 plan では参照のみ                                                                                                           |

### 6.3 Repository Protocol シグネチャ（設計Agentへの指示）

```swift
// planに以下を固定すること
protocol OrderHistoryRepository {
    func fetchOrderHistory(
        deliveryDestinationID: String,
        dateRange: ClosedRange<Date>?
    ) async throws -> [PlacedOrder]
}
```

> `dateRange` は初期版では `nil` を渡す（全期間）。将来の絞り込み機能追加時に使用。

### 6.4 MenuDestination の拡張（planに明記すること）

- `MenuDestination` に `.orderDetail(PlacedOrder)` case を追加する（PlacedOrder は Hashable 準拠済み）
- `MilkOrderApp.swift` の `.navigationDestination` に `.orderDetail` → PlaceholderView を追加（SCR-007 本実装は後続スコープ）

## 7. 品質ゲート（planに必ず記載する項目）

- `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `lint`: `swiftlint lint --strict`
- `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `security`: `swift package audit`
- planにDI経路が `AppEnvironment → OrderHistoryViewModel → OrderHistoryView` で固定されていること
- planにProtocol/具象の境界がテスト可能な受入条件で固定されていること
- planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

- 対象: `OrderHistoryViewModel`（Unit テスト）
- 方式: Unit（XCTest）
- ケース:
  - 正常: 履歴取得成功 → `orders` に結果が反映される
  - 正常: 空履歴 → `orders.isEmpty == true`、空状態ビューが表示される
  - 例外: 履歴取得失敗（ネットワーク） → `errorMessage` が表示される
  - 例外: `isLoading == true` 中に再ロード呼び出し → 二重取得されない
  - 境界: 2件以上の履歴が降順（confirmedAt）で並んでいる
  - 回帰: `AppEnvironment` への `orderHistoryRepository` 追加で SCR-001〜005 テストが PASS
- モック方針: `MockOrderHistoryRepository`（`shouldFail: Bool` フラグ付き）を `MilkOrderTests/Mocks/` または `MilkOrder/Infrastructure/Order/` に配置
- 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. Done

- `.github/copilot/plans/scr-006-order-history.md` が新規作成されている
- 他のファイルに変更がない
- planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
- TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
- SSOTと矛盾がない
- SCR-007 遷移先が PlaceholderView として明記されている（Out-of-Scope）
- `MockOrderHistoryRepository` に3件以上のダミー履歴データが含まれている

## 10. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
