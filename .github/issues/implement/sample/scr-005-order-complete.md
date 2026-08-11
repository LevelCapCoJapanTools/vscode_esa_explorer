---
phase: implement
screen_id: SCR-005
title: "[IMPLEMENT] SCR-005 注文完了画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-005 注文完了画面

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
  * **SCR-002（メニュー画面）の実装が完了していること**（MenuDestination / NavigationStack 定義済み）
  * **SCR-003（注文入力画面）の実装が完了していること**（OrderDraft / Product / OrderItem 定義済み）
  * **SCR-004（注文確認画面）の実装が完了していること**（PlacedOrder / OrderRepository / `MenuDestination.orderComplete` 定義済み）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-005-order-complete.md`

> **前提plan**: `scr-004-order-confirmation.md`（PlacedOrder / OrderRepository / `MenuDestination.orderComplete` 定義済み）

### 2.2 DESIGN Issue（仕様の背景・補助）

* なし（planを一次入力として実装する）

### 2.3 DESIGN PR（設計差分・合意点）

* なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * PDF出力機能の本実装（SCR-010 出力画面スコープ）
  * 注文控えメール送信（SCR-013 通知設定マスタ実装時）
  * 注文詳細画面（SCR-007）への遷移
  * 注文完了後のメニューへのリセット導線（初期版は「履歴を見る」のみ）
  * Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（planから転記）

| レイヤ | action | path | 型名/関数名 | 依存（どこ→どこ） | tests |
| --- | --- | --- | --- | --- | --- |
| ViewModel | add | `MilkOrder/Features/OrderComplete/OrderCompleteViewModel.swift` | `OrderCompleteViewModel`（viewHistory / requestPDF / formattedOrderNumber / formattedTotal） | `PlacedOrder`, `onViewHistory: () -> Void` | `OrderCompleteViewModelTests` |
| View | add | `MilkOrder/Features/OrderComplete/OrderCompleteView.swift` | `OrderCompleteView`, `SuccessMessageSection`, `OrderSummarySection`, `ActionButtonsSection` | `OrderCompleteViewModel` | — |
| Other | modify | `MilkOrder/MilkOrderApp.swift` | `.orderComplete` destination を PlaceholderView → `OrderCompleteView` に差し替え。`onViewHistory` で `navigationPath = [.orderHistory]` を実装 | — | — |
| DataSource | modify | `MilkOrder/Infrastructure/Order/MockOrderRepository.swift` | `placeOrder()` の `orderId` 採番を `"ORD-YYYYMMDD-0001"` 形式に変更 | — | SCR-004 テスト回帰確認 |
| Test | add | `MilkOrderTests/Features/OrderComplete/OrderCompleteViewModelTests.swift` | `OrderCompleteViewModelTests` | `OrderCompleteViewModel` | — |

## 6. 受入条件（planから転記）

* `OrderCompleteView` が iPhone 17 シミュレーターで表示される
* 「注文を受け付けました」メッセージが緑背景カードで表示される（FR-01）
* `PlacedOrder.orderId` が「注文番号」ラベルと共に画面に表示される（例：ORD-20260503-0001）（FR-02）
* `PlacedOrder.total` が「総額：¥xxx」形式（`¥` 付きカンマ区切り）で表示される（FR-03）
* `.navigationBarBackButtonHidden(true)` が付与されており SCR-004 に戻れない（FR-04）
* 「履歴を見る」押下で `viewHistory()` が呼ばれ `onViewHistory` クロージャが 1 回実行される（FR-05）
* 「PDF控え」押下で `showPDFUnavailableAlert == true` になり「PDF出力機能は準備中です。」アラートが表示される（FR-06）
* 「履歴を見る」ボタンがプライマリスタイル（濃い紺色）、「PDF控え」がセカンダリスタイル（やや薄い青色）で区別されている（NFR-01）
* 両ボタンに `.frame(maxWidth: .infinity)` `.padding(.vertical, 12)` 以上のサイズが設定されている（NFR-02）
* `formattedTotal` が SCR-003/004 と同一の `¥` 付きカンマ区切り整数フォーマットで表示される（NFR-03）
* `MockOrderRepository.placeOrder()` が返す `orderId` が `"ORD-"` で始まる形式になっている
* `MockOrderRepository` の `orderId` 形式変更により SCR-004 既存テストが回帰せず PASS（UUID exact match をしていた場合は合わせて修正）
* `OrderCompleteViewModel` クラスに `@MainActor` が付与されている
* 注文番号・総額・配達先名がコード・ログ・テストデータに含まれていない
* `swiftlint lint --strict` が 0 violations
* `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `PlacedOrder` の型定義（`orderId: String` は不変。Mock の生成値のみ変更）
  * `MenuDestination.orderComplete(PlacedOrder)` の case 定義
  * SCR-001〜004 で確立した DI 経路・ViewModel インターフェース
* 禁止事項:
  * `OrderCompleteView` に `.navigationBarBackButtonHidden(true)` を付け忘れない（FR-04 / 二重確定防止）
  * 「履歴を見る」で `navigationPath.append(.orderHistory)` しない。必ず `navigationPath = [.orderHistory]` にリセットする（注文フロー全体の除去）
  * 注文番号・総額・配達先名を `print` / `Logger` に出力しない
  * background スレッドから `@Published` を更新しない
  * `placedOrder` を `@Published` にしない（`let placedOrder: PlacedOrder` として init で受け取るのみ）
  * `onViewHistory` クロージャを `internal` にしない（`private let` で保持）
  * plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI経路: `MilkOrderApp → OrderCompleteViewModel（placedOrder: PlacedOrder, onViewHistory: () -> Void）→ OrderCompleteView`
  * **AppEnvironment 経由の Repository 注入は不要**（SCR-005 は Repository を使用しない）
* `@MainActor` を `OrderCompleteViewModel` クラスに付与。現在は非同期処理なし（将来の PDF 生成 async 追加に備える）
* `OrderCompleteView` は `OrderCompleteViewModel` のみに依存する
* 「履歴を見る」の遷移は `navigationPath = [.orderHistory]` によるリセット（append 禁止）。これにより注文フロー（orderInput → orderConfirmation → orderComplete）が全て除去される
* `formattedPrice(Int) -> String` は SCR-003/004 と同一ロジック（初期版はコピー。共通化は後続スコープ）
* Firebase SDK を import しない

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

* 参照したSSOT: `.github/copilot/plans/scr-005-order-complete.md`
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト5章の全5ファイルが実装済み（追加3件・修正2件）
* 6章の受入条件がすべて満たされる（XCTestで担保）
* SCR-004 の既存テストが回帰せず PASS（MockOrderRepository の orderId 形式変更の影響確認）
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test）
* 注文番号・総額・配達先名がコード・ログ・テストデータに含まれていない
* `.navigationBarBackButtonHidden(true)` が `OrderCompleteView` に付与されている
* 「履歴を見る」で `navigationPath` が `[.orderHistory]` にリセットされる（append でない）
* `placedOrder` が `let` で保持されており `@Published` になっていない
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
