---
phase: implement
screen_id: SCR-006
title: "[IMPLEMENT] 注文履歴画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-006 注文履歴画面

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: 注文履歴画面（SCR-006）を plan に従い Swift/iOS で完全実装し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-006-order-history.md`

### 2.2 DESIGN Issue

* 注文履歴画面の DESIGN Issue（該当する場合）

### 2.3 DESIGN PR

* 注文履歴画面の DESIGN PR（該当する場合）

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* 未入手（plan 5.1.3 参照。ワイヤーフレーム入手時は形状のみ更新。DI/Protocol契約は変更しない）

## 3. スコープ / 非ゴール

### スコープ
* `OrderHistoryView` の SwiftUI 実装（履歴一覧・空状態・エラー状態・ローディング状態）
* `OrderHistoryViewModel` の状態管理・履歴取得・整列・エラーハンドリング
* `OrderHistoryRepository` Protocol と `OrderHistoryRepositoryError` の定義
* `MockOrderHistoryRepository` の実装（3件以上のダミー履歴・2年制約）
* `AppEnvironment` への `orderHistoryRepository` DI 追加
* `MenuDestination.orderDetail(PlacedOrder)` case 追加と `.navigationDestination` 更新
* `OrderHistoryViewModelTests` の追加（正常/例外/境界/回帰テストケース）

### 非ゴール
* SCR-007 注文詳細画面の本実装（PlaceholderView のまま）
* 検索・絞り込み UI / `dateRange` 入力フォーム
* 注文履歴の修正・削除機能
* Firestore への実接続・Staging/Production 環境設定

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* plan の 5.1.3 「SwiftUI View 部品一覧」は候補例のため、View 分割の具体的な粒度（OrderHistoryListSection, OrderHistoryRowView など）はコード品質と可読性の範囲で最小調整を許容。判断理由は PR 本文に 1〜3 行で記録。

## 5. 成果物マニフェスト（必須 / planから転記）

| レイヤ | action | path | 型名/関数名 | 依存 | tests |
|-------|--------|------|-----------|------|-------|
| Protocol | add | `MilkOrder/Domain/Order/OrderHistoryRepository.swift` | `OrderHistoryRepository` (Protocol), `OrderHistoryRepositoryError` | なし | —— |
| DataSource | add | `MilkOrder/Infrastructure/Order/MockOrderHistoryRepository.swift` | `MockOrderHistoryRepository` | `OrderHistoryRepository` | OrderHistoryViewModelTests で利用 |
| ViewModel | add | `MilkOrder/Features/OrderHistory/OrderHistoryViewModel.swift` | `OrderHistoryViewModel` (@MainActor) | `OrderHistoryRepository` Protocol | OrderHistoryViewModelTests |
| View | add | `MilkOrder/Features/OrderHistory/OrderHistoryView.swift` | `OrderHistoryView` + Section/Component Views | `OrderHistoryViewModel` | Manual preview/simulator confirmation |
| Other | modify | `MilkOrder/App/AppEnvironment.swift` | `orderHistoryRepository` DI 追加 | — | 既存テスト互換性確認 |
| Other | modify | `MilkOrder/App/MenuDestination.swift` | `.orderDetail(PlacedOrder)` case 追加 | — | 既存テスト互換性確認 |
| Other | modify | `MilkOrder/Features/Menu/MenuView.swift` | `.orderHistory` destination を `OrderHistoryView` に差し替え、`.orderDetail` → `PlaceholderView` 追加 | — | 既存テスト互換性確認 |
| Test | add | `MilkOrderTests/Features/OrderHistory/OrderHistoryViewModelTests.swift` | `OrderHistoryViewModelTests` (XCTest) | — | plan 9.1 テストケース準拠 |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

### Acceptance Criteria（plan 1章「完了条件」より転記）

* ① `AppEnvironment -> OrderHistoryViewModel -> OrderHistoryView` の DI 経路で実装される
* ② `fetchOrderHistory(deliveryDestinationID:dateRange:)` が `deliveryDestinationID` と `nil` の `dateRange` で呼ばれる
* ③ 一覧は `confirmedAt` 降順で表示される
* ④ 0件時は「注文履歴はありません」を表示する
* ⑤ 取得失敗時は `errorMessage` を表示する
* ⑥ 行タップで `.orderDetail(PlacedOrder)` に遷移し `PlaceholderView` を表示する
* ⑦ `#Preview` が Firebase なしで動作する
* ⑧ build/lint/test/security の品質ゲート計画が満たされる

### Functional Requirements（plan 3.1 より転記）

* FR-01: 画面表示時に注文入力者の `deliveryDestinationID` を用いて注文履歴を取得する
* FR-02: 注文履歴一覧は `confirmedAt` 降順で表示する
* FR-03: 各リスト行に配達日・注文番号・総額を 1 行で表示する
* FR-04: 注文履歴が 0 件の場合は空状態ビューを表示する
* FR-05: 履歴取得失敗時はエラーメッセージを表示する
* FR-06: `isLoading == true` 中の再ロード呼び出しは無視し二重取得しない
* FR-07: 注文入力者は自分の配達先分のみ閲覧対象とする
* FR-08: 履歴行タップで SCR-007 へ遷移するため `.orderDetail(PlacedOrder)` を使用する
* FR-09: 注文完了画面からの既存導線 `navigationPath = [.orderHistory]` を壊さない
* FR-10: `#Preview` / Demo は Firebase 初期化なしで表示できる

### Non-Functional Requirements（plan 3.2 より転記）

* NFR-01: 履歴取得は Main スレッドをブロックしない
* NFR-02: ログ/エラー表示に注文番号・配達先名・商品明細・総額などの機微情報を出さない
* NFR-03: Preview / Demo / Unit Test は Firebase なしで決定的に実行できる
* NFR-04: 品質ゲートとして `build` / `lint` / `test` / `security` の実行計画を plan に固定する

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

### DO NOT CHANGE（plan 8.3 「実装禁止事項」より転記）

* **禁止事項-1**: `PlacedOrder` の型・プロパティを変更しない（SCR-004 確定モデルのため）
* **禁止事項-2**: View / ViewModel から `MockOrderHistoryRepository` や Firebase SDK を直接 import しない（レイヤ境界厳守）
* **禁止事項-3**: `loadOrderHistory()` 内で `dateRange` に 2 年範囲を組み立てない。初期版は必ず `nil` を渡す
* **禁止事項-4**: `.orderDetail(PlacedOrder)` の遷移先を SCR-007 本実装にしない。`PlaceholderView` のままにする
* **禁止事項-5**: `deliveryDestinationID` / 注文番号 / 総額 / 商品明細をログ・テスト失敗メッセージに埋め込まない（セキュリティ）
* **禁止事項-6**: SCR-001〜005 既存テストを壊さない（`AppEnvironment` 追加時の互換性確保）

### plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）
* `@MainActor` を `OrderHistoryViewModel` クラスに付与し、UI更新の安全性を保証する
* View は `OrderHistoryViewModel` のみに依存し、Repository/DataSource を直接 import しない
* ViewModel は `OrderHistoryRepository` Protocol のみに依存し、`MockOrderHistoryRepository` / `FirestoreOrderHistoryRepository` を直接 import しない
* Firebase SDK を import するのは Infrastructure 層（DataSource）のみ
* `#Preview` では Firebase を初期化しない（`AppEnvironment.preview()` factory を使用）
* background スレッドから UI を更新しない（async/await で Repository 呼び出し、`@MainActor` で状態更新）

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md` (Swift 記法・命名・@MainActor)
* `.github/copilot/50-security.md` (PII/機密情報の非出力)
* `.github/copilot/60-ci-quality-gates.md` (build/lint/test/security コマンド)

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

* 参照したSSOT: `.github/copilot/plans/scr-006-order-history.md` (primary), `.github/copilot/10-requirements.md`, `.github/copilot/20-architecture.md`, `.github/copilot/30-coding-standards.md`, `.github/copilot/40-testing-strategy.md`, `.github/copilot/50-security.md`, `.github/copilot/60-ci-quality-gates.md`
* 実装判断（裁量がある場合のみ）: plan 5.1.3 の View 分割候補はガイドラインであり、実装時にコード品質と保守性で最小調整を許容（例: 不要な細分割コンポーネント除去、共通セクション統合）。判断理由は PR に 1〜3 行で明記。
* 受入条件の担保証跡: `OrderHistoryViewModelTests` で FR / NFR の全ケース網羅（plan 9.1 参照）、品質ゲート 4 つを順序通り実行。

## 12. Done（必須）

* ✅ 成果物マニフェスト（5章）の項目がすべて実装済み
* ✅ 受入条件（6章 AC / FR / NFR）がすべて満たされる（XCTestで担保。plan に従う）
* ✅ CI品質ゲート（10章）がすべて緑：`build` / `swiftlint lint --strict` / `test` / `swift package audit`
* ✅ `#Preview` が Firebase なしで動作する（AppEnvironment.preview()）
* ✅ ドキュメント更新は最小差分（plan に従う。新規 docs ファイル追加なし）
* ✅ SCR-001〜005 既存テスト PASS（AppEnvironment 追加による互換性確保）

## 13. 追加情報（オプション）

### 実装手順（plan 8.2 参照）

1. Repository 契約と Error 型を追加し、`AppEnvironment` に DI を通す
2. Mock DataSource を追加し、3件以上の過去2年ダミーデータと配達先フィルタを実装
3. ViewModel を実装し、取得・整列・空状態・エラー状態・二重取得防止を実装
4. View とメニュー遷移を実装し、`.orderHistory` / `.orderDetail` を接続
5. Unit テストを追加し、SCR-001〜005 回帰を含めて確認
6. 品質ゲートを実行

### エッジケース/例外処理（plan 5.1.2 参照）

* 配達先ID 空欠落時：Repository 呼ばず、「配達先情報を確認できません。再度ログインしてください。」を表示
* 履歴0件時：エラーでなく、「注文履歴はありません」を表示
* loadOrderHistory() 実行中の再呼び出し：`guard !isLoading else { return }` で無視
* ネットワーク失敗：汎用エラー文言を表示、詳細例外は UI に出さない
* 権限なし：「閲覧権限を確認できません。再度ログインしてください。」を表示
* `confirmedAt` 同一データ：二次キー `orderId` 降順で決定的順序を保証
* 2年超過データ：Mock から除外（UI側で特別表示なし）
