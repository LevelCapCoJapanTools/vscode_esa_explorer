---
phase: design
screen_id: 注文訂正フロー（SCR-ID未割当）
title: "[DESIGN] 注文を訂正するフロー（MenuDestination.orderCorrection 本実装）"
labels: "design"
assignees: ""
---

# [DESIGN] 注文を訂正するフロー（MenuDestination.orderCorrection 本実装）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
* 機能: 注文入力者が「注文を訂正する」メニューから過去の確定済み注文を選択・修正・再確定できるフロー
* 画面ID: **未割当**（本Issueで設計Agentが画面構成を提案・確定すること。詳細は §6.2 参照）
* 要件参照先: `.github/copilot/10-requirements.md` § 4.1（No.7 注文確認・確定、No.15 入力チェック）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/40-testing-strategy.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前フェーズ成果物（前提plan）

以下 6 plan が確定済み。本フローはこれらを前提とする。

| plan ファイル | 主な提供物 |
| --- | --- |
| `.github/copilot/plans/scr-001-login.md` | AuthUser（id / name / role / deliveryDestinationID）、AppEnvironment、AuthRepository |
| `.github/copilot/plans/scr-002-menu.md` | MenuDestination（`orderCorrection` case 含む）、MenuViewModel.navigationPath |
| `.github/copilot/plans/scr-003-order-input.md` | OrderDraft、Product、OrderItem、ProductRepository、OrderInputViewModel の設計パターン |
| `.github/copilot/plans/scr-004-order-confirmation.md` | OrderRepository、PlacedOrder（Hashable 準拠済み）、OrderRepositoryError、OrderConfirmationViewModel の設計パターン |
| `.github/copilot/plans/scr-005-order-complete.md` | OrderCompleteViewModel の設計パターン、`navigationPath = [.orderHistory]` リセット遷移 |
| `.github/copilot/plans/scr-003-correction-delta.md` | **SCR-003 への差分仕様（確定済み）**: `OrderInputMode` enum、`OrderDraft.sourceOrderId`、`OrderInputViewModel.mode` パラメータ、`MenuDestination.orderCorrectionInput(PlacedOrder)` の定義。これらは本 plan では **再設計しない**。 |

> **SCR-006 について**: 訂正フローは SCR-006（購入履歴画面）の設計完了を待たずに設計できる。
> 訂正注文選択画面（SCR-CO-01）は SCR-006 とは独立した `OrderCorrectionRepository` を使用する（§6.4 参照）。
> SCR-006 の plan ファイルが存在しない場合でも **BLOCKER としない**。

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

* なし（ワイヤーフレーム未入手。`10-requirements.md` の機能要件と既存画面の設計パターンを基に設計する）

> **補足**: ワイヤーフレームが後から入手された場合は、planのView部品一覧（5.1.3）と受入確認手順（1章）のみを更新し、アーキテクチャ・DI・Protocol 定義は変更しないこと。

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/order-correction-flow.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装
* Firebase/Firestore の実際の接続・設定変更
* お知らせ画面の設計（別フロー）
* 運用側の注文編集機能（SCR-008 スコープ）
* 一括訂正・複数注文の同時訂正

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ | 配置先（想定） | 責務 | 禁止依存 |
| --- | --- | --- | --- |
| View（SwiftUI） | `MilkOrder/Features/OrderCorrection/` | 表示のみ | Repository/DataSource を直接 import しない |
| ViewModel | `MilkOrder/Features/OrderCorrection/` | 状態管理・UIロジック | DataSource具象を直接 import しない |
| Repository（Protocol） | `MilkOrder/Domain/Order/` | データアクセス抽象（SCR-CO-01 用に独立した `OrderCorrectionRepository` を新設。`OrderRepository` の再利用可否は検討すること） | 具象実装を含めない |
| DataSource（Mock） | `MilkOrder/Infrastructure/Order/` | Mock | View/ViewModel を import しない |
| Model/Entity | `MilkOrder/Domain/Order/` | PlacedOrder / OrderDraft（既存。変更は最小限） | 他レイヤに依存しない |

> **設計Agentへの指示**: SCR-CO-01 の一覧取得には独立した `OrderCorrectionRepository` を新設すること（`OrderHistoryRepository` は使わない）。`OrderRepository`（訂正確定への再利用可否）は引き続き検討し、新規 Protocol の追加は本当に必要な場合のみとすること。

### 4.2 DI方針

* DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
* 新規 Repository が必要な場合は `AppEnvironment` に追加
* View/ViewModelはProtocolに依存し、具象型を直接importしない

### 4.3 非同期処理

* `async/await` を使用。コールバックベースは禁止
* `@MainActor` を各 ViewModel に付与
* データ取得はbackgroundで実行し、Mainスレッドをブロックしない

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. **画面構成の決定**: 何画面が必要か、各画面のSCR-IDをplanで提案・確定している（§6.2 の論点に回答する形で記載）
3. View/ViewModel/Repository の責務分離がplanに明記されている
4. DI経路（`AppEnvironment → ViewModel → View`）がplanに明記されている
5. テスト計画（XCTest）がplanに明記されている
6. CI品質ゲートの実行計画がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 機能の背景

| 情報源 | 内容 |
| --- | --- |
| SCR-002 FR-08 | 「注文を訂正する」ボタン押下で `MenuDestination.orderCorrection` へ遷移 |
| SCR-002 実装制約 | 現在 `PlaceholderView` で仮置き。本Issueで本実装の設計を行う |
| 要件 § 4.1 No.7 | 「注文確認・確定」: 確定前に再計算・締切チェックを行う（訂正時も同様） |
| 要件 § 4.1 No.15 | 入力チェック: 配達日（締切超過不可）、数量（1以上）、備考50文字以内 |
| 要件 § 9 | データ保全: 論理削除（復元可能）— 訂正時の元注文の扱いに関係する |

### 6.2 画面構成の論点（設計Agentが判断・提案すること）

> **重要**: 本フローには要件書上 SCR-ID が割り当てられていない。設計Agentはplanの中で画面構成を提案し、各画面に論理 ID（例：SCR-CO-01）を付与すること。その後の実装Issueでこの ID を使用する。
>
> **確定済みの設計決定（再設計禁止）**: `scr-003-correction-delta.md` で以下が確定している。
> - `OrderInputMode` enum（`.newOrder` / `.correction(PlacedOrder)`）を使って `OrderInputView` を訂正モードで再利用する
> - `OrderDraft.sourceOrderId: String?` で訂正元注文 ID を伝播させる
> - `MenuDestination.orderCorrectionInput(PlacedOrder)` → `OrderInputView(mode: .correction)` の接続

| 論点 | 設計の選択肢と判断ポイント |
| --- | --- |
| **画面数** | **選択肢A**: SCR-CO-01（訂正注文選択）+ 訂正入力（SCR-003 再利用）+ 訂正確認（SCR-004 再利用）+ 完了（SCR-005 再利用）。**選択肢B**: SCR-006 の注文履歴画面から訂正起動（SCR-CO-01 を省略）。どちらを選ぶかとその理由をplanに明記すること |
| **訂正対象の絞り込み** | 「訂正可能な注文」の条件を定義すること: `PlacedOrder.deliveryDate >= Date()` の注文のみ選択可能。締切超過の注文はグレーアウトまたは非表示 |
| **元注文の扱い** | 訂正確定時、元の `PlacedOrder` を「訂正済み」状態にするか削除するか。要件 § 9「論理削除」に従い、元注文は論理削除（`status: .corrected`）し、新注文を作成するか、上書きするかを設計すること |
| **`OrderRepository` の拡張** | `OrderDraft.sourceOrderId != nil` の場合に `placeOrder` をそのまま再利用するか、`correctOrder(original:correction:)` メソッドを追加するかを決定すること |
| **訂正完了後の遷移** | 訂正完了後はどこへ戻るか: SCR-006（履歴）、SCR-002（メニュー）、または訂正完了専用画面。planに明記すること |

### 6.3 セキュリティ・権限制約（planに必ず反映すること）

| 制約 | 内容 |
| --- | --- |
| 権限 | `AuthUser.role == .orderEntry` のユーザーのみ利用可能。`UserRole.operator` / `.admin` はこのフローを使用しない |
| 自分の注文のみ | `AuthUser.deliveryDestinationID` に紐づく注文のみ取得・表示・訂正可能 |
| 締切チェック | 配達日当日の締切時刻（初期版は「今日以降」で仮実装）を超えた注文は訂正不可 |
| PII非出力 | 配達先名・注文明細・金額をログに出力しない（`50-security.md`） |

### 6.4 既存モデルとの整合性（planに必ず確認すること）

| 確認項目 | 内容 |
| --- | --- |
| **`OrderCorrectionRepository`（新規 Protocol）** | SCR-CO-01 の訂正対象一覧取得には SCR-006 の `OrderHistoryRepository` を再利用せず、**独立した `OrderCorrectionRepository`** を定義する。シグネチャ例: `func fetchCorrectableOrders(deliveryDestinationID: String) async throws -> [PlacedOrder]`。これにより SCR-006 の設計完了を待たずに本フローを設計・実装できる |
| `PlacedOrder` の拡張要否 | 「訂正済み」状態を表す `status` フィールドが必要か。必要な場合は `PlacedOrder` に `CorrectionStatus` enum を追加するか、別モデルを作成するかを決定すること |
| `OrderDraft` の再利用 | `scr-003-correction-delta.md` で `sourceOrderId: String?` 追加は確定済み。本 plan では変更不要 |
| `OrderRepository` の拡張 | `OrderRepository.placeOrder` を訂正時に再利用できるか、または `correctOrder(original: PlacedOrder, correction: OrderDraft)` メソッドを追加する必要があるかを決定すること |

## 7. 品質ゲート（planに必ず記載する項目）

* `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `lint`: `swiftlint lint --strict`
* `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `security`: `swift package audit`
* planにDI経路が `AppEnvironment → ViewModel → View` で固定されていること
* planにProtocol/具象の境界がテスト可能な受入条件で固定されていること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: 訂正フローの各 ViewModel（Unit テスト）
* 方式: Unit（XCTest）
* ケース:
  * 正常: 訂正可能な注文一覧の取得成功 → リストに表示される
  * 正常: 訂正確定成功 → `onCorrectionConfirmed(PlacedOrder)` が呼ばれる
  * 正常: 訂正キャンセル（修正する）→ 前の画面に戻る
  * 例外: 締切超過の注文を選択しようとする → 選択不可（ボタン disabled / 非表示）
  * 例外: 訂正確定時のネットワークエラー → `errorMessage` 表示
  * 例外: 権限なし（`role != .orderEntry`）で訂正フローに入ろうとする → ガード
  * 境界: 配達日が今日の場合 → 訂正可能（初期版の仮実装）
  * 回帰: SCR-001〜006 の既存テストが PASS（Repository 拡張時）
* モック方針: 既存の `MockOrderRepository` に訂正用メソッドを追加、または新規 Mock を `MilkOrder/Infrastructure/Order/` に配置
* 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. Done

* `.github/copilot/plans/order-correction-flow.md` が新規作成されている
* 他のファイルに変更がない
* §6.2 の全論点（画面数・元注文の扱い・既存画面再利用可否・MenuDestination 拡張方針・完了後遷移）がplanに回答されている
* 画面ごとに論理 ID（例：SCR-CO-01 〜 SCR-CO-04）が割り当てられている
* planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
* SSOTと矛盾がない
* 権限チェック（`role == .orderEntry`）と配達先フィルタ（`deliveryDestinationID`）がplanに明記されている

## 10. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>

---

## 補足: 設計Agentへの推奨アプローチ

以下は設計の参考として示す。アーキテクチャ的に優れた代替案があればそちらを採用し、planに理由を記載すること。

```
推奨フロー案（4画面構成）:

MenuDestination.orderCorrection
  └→ [SCR-CO-01] 訂正注文選択画面（OrderCorrectionSelectView）
       ↓ 注文を選択（PlacedOrder）
  └→ [SCR-CO-02] 訂正入力画面（SCR-003 の OrderInputView を編集モードで再利用 or 専用 View）
       ↓ 「確認へ進む」(CorrectedOrderDraft)
  └→ [SCR-CO-03] 訂正確認画面（SCR-004 の OrderConfirmationView を再利用 or 専用 View）
       ↓ 「訂正を確定する」
  └→ [SCR-CO-04] 訂正完了画面（SCR-005 の OrderCompleteView を再利用 or 専用 View）
       ↓ 「履歴を見る」→ SCR-006

MenuDestination の新 case 案:
  .orderCorrectionSelect
  .orderCorrectionInput(PlacedOrder)       // 訂正元注文
  .orderCorrectionConfirmation(OrderDraft, PlacedOrder)  // 新内容 + 元注文ID
  .orderCorrectionComplete(PlacedOrder)    // 訂正後の新注文
```
