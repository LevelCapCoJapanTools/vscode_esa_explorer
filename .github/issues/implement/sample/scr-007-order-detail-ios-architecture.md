---
phase: design
screen_id: SCR-007
title: "[DESIGN] SCR-007 注文詳細画面 iOS実装アーキテクチャ（注文入力者・参照専用スコープ）"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-007 注文詳細画面 iOS実装アーキテクチャ（注文入力者・参照専用スコープ）

## 背景説明（やさしい言葉で）

> このIssueがなぜ必要なのか、難しい言葉を使わずに説明します。レビューする人がこのIssueだけ読んでも経緯がわかるようにするためのセクションです。

### 何が起きたか

注文詳細画面（SCR-007）は、「注文した人（保育園や施設の担当者）」と「注文を管理する側（卸売業者の担当者）」の両方が使う画面です。最初の設計Issue（#15）では、「管理する側」が将来iPhoneアプリで操作するのか、パソコンの管理画面（Web）で操作するのかがまだ決まっていませんでした。そのため最初の設計では「誰が見られて、誰が編集できるか」というルールだけを先に決め、「iPhoneアプリの中でどういう名前のプログラムの部品を作るか」はあえて書きませんでした。

### なぜそうしたか

例えるなら、「家の中で誰が何をしてよいかというルール（門限やお手伝いの分担）」を先に決めて、「家の建て方（木造か鉄筋か、何階建てか）」は後で決める、というイメージです。建て方（どの機械・どの画面で作るか）が決まっていない部分があったので、まずルールだけを固めました。これは手抜きではなく、最初の設計Issue（#15）が意図的にそうするよう指示していたためです。

### なぜ今、追加の設計が必要なのか

注文詳細画面のうち「注文した人が見る部分」だけは、すでにiPhoneアプリで作ることが決まっています（アプリの中に画面遷移の受け口がすでに用意されています）。実際にiPhoneアプリのプログラムを書くには、「どういう名前のファイル・プログラムの部品を作るか」を決める必要があり、それが今回のIssueの目的です。「管理する側」の部分は建て方がまだ決まっていないため、今回は対象にしません。

### まとめ

* 最初の設計Issue（#15）はルール決めとしては完成しています。何かが欠けていたり、間違っていたりするわけではありません。
* 「iPhoneアプリのプログラムをどう書くか」は、最初から#15の対象外でした（意図的に外していました）。
* 今回のIssueは、その「対象外にしていた部分」のうち、すでにiPhoneアプリで作ると決まっている半分（注文した人が見る部分）だけを設計するものです。

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
* 画面ID: SCR-007
* 画面名: 注文詳細画面（iOS実装アーキテクチャ・注文入力者参照専用スコープ）
* 利用者区分: 注文入力者（`UserRole.orderEntry`）のみ。**運用側（`operator` / `admin`）は対象外**（SCR-008の権限マトリクスが未確定のため、別Issueで設計する）
* 要件参照先: `.github/copilot/10-requirements.md` § 4.1 No.8・No.13、§ 5、`.github/copilot/plans/scr-007-order-detail.md` § 3.1、§ 5

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

| plan ファイル | 主な提供物 | 本Issueでの扱い |
| --- | --- | --- |
| `.github/copilot/plans/scr-004-order-confirmation.md` | `PlacedOrder`（orderId / confirmedAt / deliveryDate / deliveryDestinationID / deliveryDestinationName / items / notes / subtotal / taxAmount / total） | 既存フィールドを再利用し、新規モデル定義はしない |
| `.github/copilot/plans/scr-006-order-history.md` | `OrderHistoryRepository` / `OrderHistoryViewModel` / `OrderHistoryView` のレイヤ構成パターン、`MenuDestination.orderDetail(PlacedOrder)` の既存遷移契約（現状は `PlaceholderView` 固定） | 同形式のレイヤ構成・命名パターンを踏襲する |
| `.github/copilot/plans/scr-007-order-detail.md`（プラットフォーム非依存・確定済み） | 表示項目一覧（§5.1）、利用者区分ごとの表示差分（§5.2）、閲覧ルール（§5.4.1）、FR-01/02/04/07/10、NFR-02/03 | **業務ルール・権限フラグの定義は変更不可**。本Issueはこの上にiOS固有のView/ViewModel/DI経路を追加するアーキテクチャ設計のみを行う |

* 前提Issue: なし（`.github/issues/design/scr-008-order-list-operator.md` は運用側スコープのため、本Issue（注文入力者・参照専用スコープ）では参照不要）
* 関連ADR: なし

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

* なし。`.github/copilot/plans/scr-007-order-detail.md` § 5.1 の表示項目一覧を正として設計する

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-007-order-detail-ios-architecture.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装
* Firebase/Firestore の実際の接続・設定変更
* Staging/Production 環境の設定変更
* 運用側（`operator` / `admin`）の編集・削除導線のiOS実装（SCR-008の権限マトリクス確定後に別Issueで設計する）
* `.github/copilot/plans/scr-007-order-detail.md` のプラットフォーム非依存内容（業務ルール・権限フラグ仕様・表示項目定義）自体の変更（参照のみ。変更禁止）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ | 配置先 | 責務 | 禁止依存 |
| --- | --- | --- | --- |
| View（SwiftUI） | `MilkOrder/Features/OrderDetail/` | 表示のみ | Repository/DataSource を直接 import しない |
| ViewModel | `MilkOrder/Features/OrderDetail/` | 状態管理・UIロジック（参照専用） | DataSource具象を直接 import しない |
| Repository（Protocol・採用する場合のみ） | `MilkOrder/Domain/Order/` | データアクセス抽象 | 具象実装を含めない |
| Model/Entity | `MilkOrder/Domain/Order/` | `PlacedOrder`（既存。変更不可） | 他レイヤに依存しない |

> Repositoryを新規追加するかどうかは § 6.2 の論点。SCR-006 経路は既存契約で `PlacedOrder` を直接受け渡しするため、参照専用スコープではRepositoryが不要な可能性がある。

### 4.2 DI方針

* DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
* Repositoryを追加する場合のみ `AppEnvironment` への注入経路を定義する
* View/ViewModelはProtocolに依存し、具象型を直接importしない（Repositoryを採用する場合）

### 4.3 Firebase命名規則

* 本スコープ（参照専用・`PlacedOrder` 直接受け渡し）では新規Firestore接続を想定しない
* Repositoryを採用する場合のみ、`OrderHistoryRepository` と同様の命名規則（将来 `Firestore{Domain}Repository`）に揃えることをplanに明記する

### 4.4 非同期処理

* 表示専用（`PlacedOrder` をinitで受け取るのみ）の場合、非同期取得が不要となる可能性がある。その場合でも `@MainActor` 付与の要否をplanで明確化すること
* Repositoryを採用する場合は `async/await` を使用し、コールバックベースを禁止する

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. View/ViewModel（および採用する場合はRepository/DataSource）の責務分離がplanに明記されている。Repositoryを採用しない場合はその判断根拠が明記されている
3. DI経路（Repositoryを採用する場合は `AppEnvironment → OrderDetailViewModel → OrderDetailView`）がplanに明記されている
4. テスト計画（XCTest）がplanに明記されている
5. CI品質ゲートの実行計画がplanに明記されている
6. `.github/copilot/plans/scr-007-order-detail.md` の FR-01・FR-02・FR-04・FR-07・FR-10、NFR-02・NFR-03 が iOS実装の受入条件として具体化されている
7. `MenuDestination.orderDetail` / `MilkOrder/Features/Menu/MenuView.swift` の `.orderDetail` ケースの変更内容（`PlaceholderView` → `OrderDetailView`）がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 画面の役割（要件・前提planから）

| 参照元 | 内容 |
| --- | --- |
| `scr-007-order-detail.md` § 5.1 | 表示項目一覧（注文番号・確定日時・配達日・配達先名・明細・備考・税抜合計・税額・税込合計） |
| `scr-007-order-detail.md` § 5.4.1 | 閲覧ルール: 注文入力者は `viewerDeliveryDestinationID == order.deliveryDestinationID` を満たす場合のみ閲覧可能 |
| `scr-007-order-detail.md` § 5.2 | 注文入力者は常に参照専用（編集・削除導線なし） |
| `scr-006-order-history.md` | SCR-006→SCR-007遷移は既存契約 `MenuDestination.orderDetail(PlacedOrder)` を維持する |

### 6.2 設計時に判断が必要な論点（plan内で明確化すること）

| 論点 | 設計Agentへの指示 |
| --- | --- |
| Repository要否 | SCR-006経路は `PlacedOrder` を直接受け渡しする既存契約のため、参照専用スコープでは新規Repositoryが不要な可能性がある。「ViewModelがinitで受け取った `PlacedOrder` をそのまま保持・表示する」設計と「将来の運用側経路（`orderId` + 権限情報での再取得）に備えてRepositoryを用意する」設計を比較し、本スコープでどちらを採用するか確定すること。判断できない場合はBLOCKERとする |
| 閲覧スコープ検証の実装場所 | `scr-007-order-detail.md` § 5.4.1 の `viewerDeliveryDestinationID == order.deliveryDestinationID` 検証を、SCR-006側の既存フィルタ済み遷移に委ねてSCR-007側では再検証しないか、SCR-007 ViewModel側でも防御的に再検証するかを確定すること |
| 表示コンポーネント構成 | `scr-007-order-detail.md` § 5.1 の区分（基本情報・配達情報・明細・注文情報・金額）をどのSwiftUI部品単位に分割するか、既存の `OrderHistoryRowView` 等の命名パターンを踏襲して定義すること |
| フェイルセーフ実装（FR-10） | 「権限情報が取得できない場合は詳細情報を表示しない」を、本スコープでは「`PlacedOrder` を受け取れている時点でSCR-006側のフィルタにより閲覧権限ありとみなせる」という理解で良いか確定すること。良くない場合は具体的な検証ロジックを明記すること |
| 将来の運用側拡張への配慮 | 本Issueでは運用側経路（`canEditOrder` / `canDeleteOrder`）を設計しないが、将来追加される際に `OrderDetailViewModel` を拡張しやすい構造にするかどうかの方針を、過剰設計を避けつつ明記すること |

## 7. 品質ゲート（planに必ず記載する項目）

* `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `lint`: `swiftlint lint --strict`
* `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `security`: `swift package audit`
* planにDI経路（Repositoryを採用する場合）が固定されていること
* planにProtocol/具象の境界（採用する場合）がテスト可能な受入条件で固定されていること
* planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: `OrderDetailViewModel`（Unit テスト）
* 方式: Unit（XCTest）
* ケース:
  * 正常: 表示項目が `PlacedOrder` の内容と一致する
  * 正常: 編集・削除導線が表示されない（参照専用であることの確認）
  * 境界/例外: § 6.2 で確定した閲覧スコープ検証方針に従ったケース（防御的検証を採用する場合のみ）
  * 回帰: `MenuDestination` / `MenuView.swift` 変更後もSCR-001〜006の既存テストがPASSする
* モック方針: Repositoryを採用する場合のみMock実装を追加。採用しない場合は `PlacedOrder` のテストフィクスチャで代替する
* 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. Done

* `.github/copilot/plans/scr-007-order-detail-ios-architecture.md` が新規作成されている
* 他のファイルに変更がない
* § 6.2 の全論点がplanで回答されている（BLOCKERとして差し戻された場合を除く）
* `.github/copilot/plans/scr-007-order-detail.md` の業務ルール・権限フラグ定義と矛盾がない
* `MenuDestination.orderDetail` / `MilkOrder/Features/Menu/MenuView.swift` の変更内容が明記されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件

## 10. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
