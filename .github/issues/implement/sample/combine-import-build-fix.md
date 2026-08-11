---
phase: implement
screen_id: 機能
title: "[IMPLEMENT] ビルド修正: ObservableObjectのCombine import漏れ"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] ビルド修正: ObservableObjectのCombine import漏れ

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: Xcodeビルド失敗（`ObservableObject`準拠クラスでのコンパイルエラー）を解消し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）
* 背景: `develop/order-history-and-notification` ブランチで以下のビルドエラーが報告された。

```
MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionViewModel.swift
  Static subscript 'subscript(_enclosingInstance:wrapped:storage:)' is not available due to missing import of defining module 'Combine'
  :7:13 Type 'OrderCorrectionSelectionViewModel' does not conform to protocol 'ObservableObject'
  :11/13/15/17/19:6 Initializer 'init(wrappedValue:)' is not available due to missing import of defining module 'Combine'

MilkOrder/Infrastructure/Deadline/MockDeadlineCheckRepository.swift
  Static subscript 'subscript(_enclosingInstance:wrapped:storage:)' is not available due to missing import of defining module 'Combine'

MilkOrder/Infrastructure/Order/MockOrderCorrectionRepository.swift
  Static subscript 'subscript(_enclosingInstance:wrapped:storage:)' is not available due to missing import of defining module 'Combine'
```

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* なし。本バグは原因・修正方針ともに調査済みで自明なため、別途DESIGN planは作成せず、本Issue本文（特に本節および5節）を一次情報源として実装する。

#### 原因調査結果（確定事項）

* [`OrderCorrectionSelectionViewModel.swift`](../../../MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionViewModel.swift) は `ObservableObject` に準拠し `@Published` を5箇所（`orders` / `isLoading` / `errorMessage` / `isAccessDenied` / `isOrderingHalted`）で使用しているが、ファイル先頭の import が `import Foundation` のみで `import Combine` が無い。`@Published` プロパティラッパーおよび `ObservableObject` プロトコルは Combine フレームワークのシンボルであり、import が無いため上記コンパイルエラーが発生している。
* `MockDeadlineCheckRepository.swift` / `MockOrderCorrectionRepository.swift` 自体は `@Published` も `ObservableObject` も使用していない。これらのファイルに出ているエラーは、Xcodeのバッチコンパイルで `OrderCorrectionSelectionViewModel.swift` と同一バッチに含まれることによる連鎖的な誤診断であり、**これら2ファイル自体には修正不要**。`OrderCorrectionSelectionViewModel.swift` に `import Combine` を追加すれば解消される想定。
* 同一の欠陥パターン（`import Foundation` のみで `ObservableObject` / `@Published` を使用）が [`MilkOrder/Features/OrderHistory/OrderHistoryViewModel.swift`](../../../MilkOrder/Features/OrderHistory/OrderHistoryViewModel.swift) にも存在する（`orders` / `isLoading` / `errorMessage` を `@Published` で宣言）。今回報告されたビルドログには含まれていないが、根本原因が同一であり、ビルド対象に含まれた際に同様の失敗を引き起こすため、本Issueのスコープに含める。
* 他の `ObservableObject` 実装（`AppEnvironment.swift` / `OrderConfirmationViewModel.swift` / `OrderInputViewModel.swift` / `LoginViewModel.swift` / `MenuViewModel.swift` / `OrderCompleteViewModel.swift`）はすべて `import Combine` を明示しており、今回の2ファイルのみが欠落している。

### 2.2 DESIGN Issue（仕様の背景・補助）

* なし（ビルド修正のためDESIGNフェーズを経ていない。原因・修正方針は本Issue内で確定済み）

### 2.3 DESIGN PR（設計差分・合意点）

* なし

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: 以下2ファイルへの `import Combine` 追加のみ
  * `MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionViewModel.swift`
  * `MilkOrder/Features/OrderHistory/OrderHistoryViewModel.swift`
* 非ゴール:
  * ViewModelのロジック変更・プロパティ追加
  * `MockDeadlineCheckRepository.swift` / `MockOrderCorrectionRepository.swift` の変更（連鎖的な誤診断であり原因ファイルではないため）
  * 他のViewModel/型のimport整理・大規模リファクタリング
  * アーキテクチャ変更（AppEnvironment/DIの変更）
  * Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

* 変更してよいのは3節記載の2ファイルへの `import Combine` 追加のみ
* それ以外のファイル・行の変更は禁止
* `import` の並び順（`import Combine` を `import Foundation` の前後どちらに置くか）は既存コード内でも揺れがある（任意/裁量）ため、各ファイル内で読みやすい順序であればどちらでもよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / 調査結果から転記）

| レイヤ | action（add/modify/delete） | path（リポジトリルート相対） | 型名/関数名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| ViewModel | modify | `MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionViewModel.swift` | `OrderCorrectionSelectionViewModel` | import文のみ（依存関係変更なし） | なし（既存ビルド・テストの成功確認のみ） |
| ViewModel | modify | `MilkOrder/Features/OrderHistory/OrderHistoryViewModel.swift` | `OrderHistoryViewModel` | import文のみ（依存関係変更なし） | なし（既存ビルド・テストの成功確認のみ） |

## 6. 受入条件（調査結果から転記 / 不足はBLOCKER）

* `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` がエラーなく成功する
* `git diff` の差分が上記2ファイルへの `import Combine` 追加のみであること
* `swiftlint lint --strict` が通る
* `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が変更前と同じ結果（既存テストにリグレッションがない）

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `OrderCorrectionSelectionViewModel` / `OrderHistoryViewModel` のロジック・プロパティ定義
  * `MockDeadlineCheckRepository.swift` / `MockOrderCorrectionRepository.swift`（修正対象ではない）
  * 既存のProtocolのメソッドシグネチャ
* plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）
* `@MainActor` を ViewModel クラスに付与し、UI更新の安全性を保証する
* View は ViewModel のみに依存し、Repository/DataSource を直接 import しない
* ViewModel は Repository Protocol のみに依存し、具象型を直接 import しない
* Firebase SDK を import するのは Infrastructure 層（DataSource）のみ
* `#Preview` では Firebase を初期化しない（`.preview()` factory を使用）
* background スレッドから UI を更新しない

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

* 参照したSSOT: 本Issue本文（2.1節の原因調査結果）
* 実装判断（裁量がある場合のみ）: import文の並び順（既存コード内に複数パターンが存在するため、各ファイルの可読性を優先して選択）
* 受入条件の担保証跡: `xcodebuild build` / `xcodebuild test` / `swiftlint lint --strict` の実行結果

## 12. Done（必須）

* 成果物マニフェストの項目がすべて実装済み
* 受入条件がすべて満たされる
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / test / swift package audit）
* `#Preview` が Firebase なしで動作する
* ドキュメント更新は最小差分（本Issueに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
