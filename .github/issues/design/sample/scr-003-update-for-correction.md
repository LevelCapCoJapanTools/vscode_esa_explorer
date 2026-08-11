---
phase: design
screen_id: SCR-003
title: "[DESIGN] SCR-003 注文入力画面 — 訂正モード対応を仕様書に統合"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-003 注文入力画面 — 訂正モード対応を仕様書に統合

> **実施タイミング**: 注文訂正フロー（`order-correction-flow.md`）の実装完了・CI 通過後に着手すること。
> 実装前に着手すると現行仕様と齟齬が生じる。

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は **`scr-003-order-input.md` を「新規注文 / 訂正モード両対応」の統一仕様書に更新すること**。
* **成果物は `scr-003-order-input.md` の更新 1 ファイルのみ**（他ファイルへの変更・追加は禁止）。
* 実装されたコードと差分仕様書（`scr-003-correction-delta.md`）を照合し、**実態と一致した仕様書** を作ること。推測補完は禁止。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `scr-003-order-input.md` を新規注文フロー（SCR-003）と訂正モードの両方をカバーする統一仕様書に更新する
* 統合する差分: `.github/copilot/plans/scr-003-correction-delta.md` の内容
* 統合後の `scr-003-order-input.md` は、以降の **実装 Agent / コードレビューの一次参照先** となる

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 必須（このIssueでの作業入力）

| 入力 | 用途 |
| --- | --- |
| `.github/copilot/plans/scr-003-order-input.md` | 更新対象の現行仕様書 |
| `.github/copilot/plans/scr-003-correction-delta.md` | 統合する差分仕様書 |
| `.github/copilot/plans/order-correction-flow.md` | 訂正フロー確定 plan（実装後に確定している想定） |
| `MilkOrder/Features/OrderInput/OrderInputViewModel.swift` | 実装済みコード（実態確認用） |
| `MilkOrder/Domain/Order/OrderDraft.swift` | 実装済みコード（sourceOrderId 追加確認用） |
| `MilkOrder/Domain/Order/OrderInputMode.swift` | 実装済みコード（enum 確認用） |

### 2.2 SSOT（参照）

* `.github/copilot/00-index.md`
* `.github/copilot/80-templates/implementation-plan.md`（仕様書フォーマット確認用）

### 2.3 前提条件（このIssue着手前に確認すること）

```
チェックリスト:
[ ] order-correction-flow.md の実装 PR がマージ済み
[ ] xcodebuild test がすべて PASS
[ ] swiftlint lint --strict が 0 violations
[ ] OrderInputMode enum が実装されている
[ ] OrderDraft.sourceOrderId が実装されている
[ ] OrderInputViewModel に mode パラメータが実装されている
```

> 上記がひとつでも未完了の場合は BLOCKER として差し戻すこと。

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-003-order-input.md` を更新する（**1ファイルのみ**）
* `scr-003-correction-delta.md` の削除は **このIssueのスコープ外**（後続の housekeeping タスクで対応）

### 非ゴール

* コード実装・修正
* 他の plan ファイルの変更
* `scr-004-order-confirmation.md`・`scr-005-order-complete.md` の更新（別イシューで対応）

## 4. 更新すべき箇所の一覧

| 章 | 更新内容 |
| --- | --- |
| **0. 実装入力コンテキスト** | タイトルを「SCR-003 注文入力画面（新規注文 / 訂正モード）」に変更。前提 plan に `order-correction-flow.md` を追加 |
| **0.1 変更サマリ** | `OrderInputMode` 追加、`OrderDraft.sourceOrderId` 追加、`OrderInputViewModel.mode` 追加、`MenuDestination.orderCorrectionInput` 追加の行を追記 |
| **1. 機能ゴール** | 「訂正モードでは既存 PlacedOrder の内容を初期値として起動し、修正後に再確定できる」を追記 |
| **3.1 機能要件** | 以下を追記（FR-12〜FR-17 として連番付与）: 訂正モード初期値設定（FR-12）、navigationTitle 切り替え（FR-13）、sourceOrderId 付き OrderDraft 生成（FR-14）、訂正モード validation（FR-15）、新規モード sourceOrderId == nil（FR-16）、.orderCorrectionInput destination 接続（FR-17） |
| **5.0 DI 経路** | `.orderCorrectionInput(PlacedOrder)` → `OrderInputView(mode: .correction)` の経路を追記 |
| **5.1.1 設計判断** | `OrderInputMode` 採用理由・`OrderDraft.sourceOrderId` の後方互換設計を追記 |
| **5.1.3 View 部品一覧** | `navigationTitle` の動的切り替えを追記 |
| **6.2 型/モデル/スキーマ** | `OrderInputMode`（追加）・`OrderDraft.sourceOrderId`（変更）の行を追記 |
| **6.3.2 クラス図** | `OrderInputMode` enum・`OrderDraft.sourceOrderId` を図に反映 |
| **6.3.3 プロパティ詳細定義** | `OrderDraft.sourceOrderId: String?` の行を追加 |
| **8.1 変更予定ファイル一覧** | `OrderInputMode.swift`（追加）・既存ファイルへの変更内容を追記 |
| **9.1 テストケース** | `scr-003-correction-delta.md § 5` の追加テストケース 7 件を追記 |
| **10. オープン課題** | 解決済み TBD を更新。新たに判明した TBD があれば追記 |

## 5. 品質チェック（更新後の自己検証）

更新後の `scr-003-order-input.md` が以下を満たすことを確認すること：

| チェック項目 | 合格条件 |
| --- | --- |
| 実装コードとの整合 | `OrderInputViewModel` の実装済み init シグネチャと仕様書の定義が一致している |
| 後方互換の記述 | `mode` のデフォルト値 `.newOrder` が明記されており、既存の新規注文フローへの影響なしと記載されている |
| テストケースの連番 | 既存の FR-01〜FR-11 と連番が重複しておらず、FR-12 以降で追番されている |
| TBD 残存ゼロ | 実装で確定した事項が「TBD」のまま残っていない |
| SSOT 矛盾なし | `order-correction-flow.md` の確定内容と `scr-003-order-input.md` の記述に矛盾がない |

## 6. Done

* `scr-003-order-input.md` が「新規注文 / 訂正モード両対応」の統一仕様書として更新されている
* `scr-003-correction-delta.md` に記載された差分がすべて本仕様書に吸収されている
* `scr-003-correction-delta.md` の内容で仕様書と齟齬がある箇所がない（実装事実に基づき修正済み）
* 他のファイルに変更がない
* planの全章（0〜10）が記載されており、TBD が 0 件

## 7. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと統合できないか>
