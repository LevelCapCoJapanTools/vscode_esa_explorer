---
phase: implement
screen_id: SCR-003
title: "[IMPLEMENT] SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency。本機能はDI経路・ViewModel・Repositoryに変更を加えず、`OrderInputView.swift` 内の `DeadlineCountdownLabel`（View）のみを変更する

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-003-order-input.md`（特に FR-12（§3.1）, §12.5 DeadlineCountdownLabel, §10 オープン課題）

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/LevelCapTech/milk-order-ios/issues/27

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/LevelCapTech/milk-order-ios/pull/36

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: `MilkOrder/Features/OrderInput/OrderInputView.swift` の `DeadlineCountdownLabel` の表示粒度・更新間隔の変更のみ
* 非ゴール:
  * 締切時刻の算出ロジック変更（「現在時刻が15:00:00未満なら当日15:00、15:00:00以上なら翌日15:00」という既存仮実装はそのまま維持する。SCR-013マスタ確定後の別スコープ）
  * `DeadlineCheckRepository`（注文訂正フロー用の締切API）との統合
  * 締切超過後の画面遷移・エラー表示の変更
  * 24時間以上ケースにおける再描画最適化の具体実装（plan上は実装Agentの裁量とされている範囲のみ対応する）

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所（24時間以上ケースでの内部再計算頻度と表示更新頻度を分離する実装手法）のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（`scr-003-order-input.md` §12.5 から転記）。

| レイヤ | action（add/modify/delete） | path（リポジトリルート相対） | 型名/関数名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| View | modify | `MilkOrder/Features/OrderInput/OrderInputView.swift` | `DeadlineCountdownLabel`（`Timer.publish(every: 60...)` を `Timer.publish(every: 1...)` へ変更し、`updateCountdown()` の表示フォーマットを24時間境界で分岐させる） | 既存実装内のみ（DI/ViewModel/Repositoryへの依存追加なし） | 手動確認（plan §12.5「実装時の確認観点」に従う。既存ユニットテストはなく、planも新規XCTest追加を要求していない） |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planの FR-12（§3.1）と §12.5 の確認観点をそのまま列挙。

* FR-12: 締切カウントダウン表示は、残り時間が24時間以上のときは時間/分、24時間未満のときは時間/分/秒で表示し、24時間未満の間は1秒ごとに自動更新する
  * 残り時間がちょうど24時間のときは「締切（15:00）まであとX時間Y分」と表示され、秒が出ないこと
  * 残り時間が23時間59分59秒のときは「締切（15:00）まであとX時間Y分Z秒」と表示され、1秒ごとに更新されること
* §12.5 実装時の確認観点（手動確認）:
  * システム時刻を当日15:00:00に設定したときに、残り24時間ちょうどとして時間/分表示になること
  * システム時刻を当日15:00:01に設定したときに、残り23時間59分59秒として時間/分/秒表示になり1秒ごとに減少すること
  * 秒表示中に1分以上表示し続けても、スクロールや数量入力操作が重くならないこと
  * 24時間以上のケースでは、分境界以外で表示文字列が不要に変化しないこと

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * 締切時刻の算出ロジック（`updateCountdown()` 内の「当日/翌日15:00」判定部分）
  * `OrderInputViewModel` / `AppEnvironment` / Repository Protocol の署名
  * `DeliveryDateSection` 内の他要素（`DatePicker` 等）の構成
* plan外の仕様追加禁止（推測補完を含む）。24時間以上ケースの将来的な扱い（SCR-013後）は本Issueのスコープ外

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）。本機能のために変更しない
* `@MainActor` 等の既存のUI更新安全性方針を維持する
* View は ViewModel のみに依存し、Repository/DataSource を直接 import しない（本Issueでは新規依存自体を追加しない）
* `#Preview` では Firebase を初期化しない（既存の `.preview()` factory のまま）
* background スレッドから UI を更新しない（`Timer.publish` は `on: .main` を維持する）

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/plans/scr-003-order-input.md`（特に §12.5）

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

補足: `swift package audit` はリポジトリ直下に `Package.swift` が存在しない場合、コマンド実行結果を記録した上で依存変更がないことを確認し、「N/A（依存追加・更新なし）」として扱ってよい。

**手動確認手順**（`scr-003-order-input.md` §12.5 より、Simulatorのシステム時刻を変更して確認する）:

1. Simulatorのシステム時刻を当日15:00:00に設定し、注文入力画面で「締切（15:00）まであとX時間Y分」（秒なし）と表示されることを確認する
2. システム時刻を当日15:00:01に設定し、「締切（15:00）まであと23時間59分59秒」と表示され、1秒ごとに減少することを確認する
3. 秒表示中（24時間未満）に1分以上画面を表示したまま商品の数量を操作し、スクロール・タップ操作が重くならないことを確認する
4. 24時間以上のケースで、分境界以外で表示文字列が変化しないことを確認する

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: `.github/copilot/plans/scr-003-order-input.md`, Issue #27, PR #36
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: 手動確認結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト（5章）の項目が実装済み
* 受入条件（6章, FR-12と§12.5確認観点）がすべて満たされる
* 締切算出ロジック（当日/翌日15:00判定）に変更がない
* `OrderInputViewModel` / `AppEnvironment` / Repository Protocolに変更がない
* `#Preview` が Firebase なしで動作する
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / test / swift package audit または N/A判定）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
