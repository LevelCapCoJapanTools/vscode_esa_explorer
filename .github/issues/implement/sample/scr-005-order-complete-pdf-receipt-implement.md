---
phase: implement
screen_id: SCR-005
title: "[IMPLEMENT] SCR-005 注文完了画面 PDF控え生成（UIGraphicsPDFRenderer）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-005 注文完了画面 PDF控え生成（UIGraphicsPDFRenderer）

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
  * **SCR-004（注文確認画面）の実装が完了していること**（`PlacedOrder` / `OrderItem` 定義済み）
  * **SCR-005（注文完了画面）の初期実装が完了していること**（`OrderCompleteViewModel` / `OrderCompleteView` / `requestPDF()` プレースホルダーが存在すること）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-005-order-complete-pdf-receipt.md`

> **前提plan**: `scr-005-order-complete.md`（`requestPDF()` / `showPDFUnavailableAlert` プレースホルダーの置換元、`OrderCompleteViewModel` の既存契約）、`scr-004-order-confirmation.md`（`PlacedOrder` / `OrderItem` 定義）

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/LevelCapTech/milk-order-ios/issues/45

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/LevelCapTech/milk-order-ios/pull/48

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * サーバーサイドでのPDF生成（Cloud Run/Firebase Functions等）・Firebase Storageへの保存・配信
  * SCR-010（出力画面）側の集計表PDF・CSV・Excel出力
  * PDFの自動メール送信（SCR-013 通知設定マスタ実装時のスコープ）
  * AirPrint等の専用印刷UI（OSの共有シート経由の印刷は対象内）
  * 注文番号の本番採番ルール変更
  * `PlacedOrder` モデルの拡張・変更
  * ロゴ画像表示（`Assets.xcassets` にロゴ未整備のためOpen Issue。会社名は固定文字列 `MilkOrder` のみ実装する）

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所（帳票の余白・フォントサイズ・列幅・行間。plan 5.1.1 No.8）のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（`scr-005-order-complete-pdf-receipt.md` §8.1 から転記）。

| レイヤ | action（add/modify/delete） | path（リポジトリルート相対） | 型名/関数名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| Protocol | add | `MilkOrder/Domain/Order/OrderReceiptRepository.swift` | `OrderReceiptRepository`（`func generateReceiptPDF(for order: PlacedOrder) async throws -> URL`）, `OrderReceiptRepositoryError`（`renderFailed` / `fileWriteFailed` / `unknown`） | ViewModel → Repository（Protocol） | — |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Order/LocalOrderReceiptRepository.swift` | `LocalOrderReceiptRepository: OrderReceiptRepository`（一時ファイルURL確定・既存同名ファイル削除・エラー変換） | Repository → `OrderReceiptPDFDataSource`（Protocol） | `LocalOrderReceiptRepositoryTests` |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Order/UIGraphicsOrderReceiptPDFDataSource.swift` | `OrderReceiptPDFDataSource`（Protocol）, `UIGraphicsOrderReceiptPDFDataSource`（`func renderReceiptPDF(order: PlacedOrder, fileURL: URL) async throws -> URL`。`UIGraphicsPDFRenderer` による描画・改ページ・書き出し） | DataSource → `UIGraphicsPDFRenderer` / `FileManager`（Apple標準のみ） | `LocalOrderReceiptRepositoryTests` 経由で検証 |
| AppEnvironment | modify | `MilkOrder/App/AppEnvironment.swift` | `orderReceiptRepository: any OrderReceiptRepository` を追加し、`.live()` / `.preview()` の両方に `LocalOrderReceiptRepository` を注入 | AppEnvironment → OrderCompleteViewModel | — |
| ViewModel | modify | `MilkOrder/Features/OrderComplete/OrderCompleteViewModel.swift` | `OrderReceiptShareState`（`idle` / `generating` / `ready(URL)` / `failed(String)`）を追加。`requestPDF()` を非同期処理へ置換、`dismissShareSheet()` を追加。`showPDFUnavailableAlert` は削除 | ViewModel → `OrderReceiptRepository`（Protocol） | `OrderCompleteViewModelTests` |
| View | modify | `MilkOrder/Features/OrderComplete/OrderCompleteView.swift` | 「準備中」アラートを共有シート起動・生成中 `ProgressView`・失敗 `Alert` へ置換 | View → OrderCompleteViewModel | — |
| View | add | `MilkOrder/Features/OrderComplete/OrderReceiptShareSheet.swift` | `OrderReceiptShareSheet`（`UIActivityViewController` を SwiftUI から起動するラッパー） | View内部 | — |
| Test | add | `MilkOrderTests/Mocks/MockOrderReceiptRepository.swift` | `MockOrderReceiptRepository: OrderReceiptRepository`（成功/失敗/遅延を制御可能） | Test → Protocol | — |
| Test | modify | `MilkOrderTests/Features/OrderComplete/OrderCompleteViewModelTests.swift` | FR-06関連テストをMock注入の本実装向けへ更新 | — | 更新 |
| Test | add | `MilkOrderTests/Infrastructure/Order/LocalOrderReceiptRepositoryTests.swift` | PDFヘッダ（`%PDF`）・ページ数・本文テキスト・I/O失敗・多数商品（複数ページ）の各テスト | — | 追加 |

補足: `MilkOrder.xcodeproj/project.pbxproj` は `PBXFileSystemSynchronizedRootGroup` を使用しているため、通常は新規 `.swift` 追加のための手動編集を不要とする。ただしビルドでの自動認識を必ず確認すること（plan 8.1 補足）。

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planの FR-01〜FR-09 / NFR-01〜NFR-05（§3.1, §3.2）をそのまま列挙。

* FR-01: 「PDF控え」ボタン押下で `OrderCompleteViewModel.requestPDF()` が `OrderReceiptRepository.generateReceiptPDF(for:)` を1回だけ呼ぶ
* FR-02: 生成成功時にViewModelの状態が `.ready(url)` になり、Viewが共有シートを表示する
* FR-03: 生成PDFのテキスト抽出/パースで注文番号・確定日時・配達日・配達先名・明細・備考・小計・税額・総額・会社名が確認できる
* FR-04: 生成失敗時にViewModelの状態が `.failed(message)` となり、Viewが再試行可能なエラーアラートを表示する
* FR-05: 生成中（`.generating`）に `requestPDF()` を連続呼び出ししても、Repository呼び出し回数・共有シート表示回数は1回のまま
* FR-06: `showPDFUnavailableAlert` と「PDF出力機能は準備中です。」への依存が削除されている
* FR-07: PDFがA4縦レイアウトで、ヘッダー・注文情報・商品明細・合計金額が罫線で視覚的に区切られている
* FR-08: 商品明細が表形式（商品名左揃え・数量中央揃え・単価/金額右揃え）の固定列幅で描画される
* FR-09: 明細が複数ページにまたがる場合は自動改ページし、各ページで表ヘッダが再描画される（複数ページとしてパースできる）
* NFR-01: PDF描画・ファイル書き出しはbackgroundで実行され、完了結果のみ `@MainActor` で状態反映される
* NFR-02: PDFは `FileManager.default.temporaryDirectory` 配下の専用サブディレクトリに保存され、同一注文IDの既存ファイルは削除して上書きされる（永続領域に保存しない）
* NFR-03: `AppEnvironment.preview()` で `orderReceiptRepository` が注入され、`#Preview` がFirebaseなしで動作する
* NFR-04: 実装PRで `xcodebuild build` / `swiftlint lint --strict` / `xcodebuild test` / `swift package audit`（またはN/A判定手順）が実行される
* NFR-05: 日本語が文字化けせず、見出しは `HiraginoSans-W6`、本文・明細は `HiraginoSans-W3` で固定描画され、`UIFont.systemFont` / Dynamic Typeに依存しない。日付は `yyyy/MM/dd` 系、金額は `¥` + 3桁区切りで表示される
* 生成されたPDFの先頭バイトが `%PDF` で始まり、PDFKit等で1ページ以上としてパースできる
* `AppEnvironment` への `orderReceiptRepository` 追加により、SCR-001〜SCR-006の既存テストが回帰せずPASSする
* 配達先名・備考・金額・一時ファイルURLがログに出力されない
* `swiftlint lint --strict` が 0 violations
* `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が PASS

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `PlacedOrder` の型定義・プロパティ（参照のみ、変更禁止）
  * `MenuDestination.orderComplete(PlacedOrder)` の case 定義
  * SCR-001〜004 で確立したDI経路・ViewModelインターフェース（`OrderCompleteViewModel.init` への `orderReceiptRepository` パラメータ追加以外の変更は不可）
* 禁止事項（plan §8.3を転記）:
  * View / ViewModel で `UIGraphicsPDFRenderer` を直接呼ばない
  * PDFファイルを Documents 等の永続領域へ保存しない
  * `requestPDF()` 実行中（`.generating`）に再度 Repository を呼ばない
  * 共有シート表示のために `ShareLink` 用の二段階UIへ変更しない（既存ボタン押下UXを維持する）
  * Preview で `AppEnvironment.live()` を使わない
  * 配達先名・備考・金額・ファイルURLをログ出力しない
  * iOS標準外フォントや外部フォントアセットを前提にしない
  * `UIFont.systemFont(...)` や Dynamic Type をPDF帳票の描画に使用しない。`UIFont(name: "HiraginoSans-W6", ...)`（見出し）/ `UIFont(name: "HiraginoSans-W3", ...)`（本文）を固定使用する
  * plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI経路: `AppEnvironment -> OrderCompleteViewModel（orderReceiptRepository: any OrderReceiptRepository）-> OrderCompleteView`
  * **既存の「AppEnvironment経由のRepository注入は不要」という旧決定（`scr-005-order-complete.md` 5.0.1）は本Issueで更新され、`orderReceiptRepository` の注入が必須になる**
* `@MainActor` を `OrderCompleteViewModel` クラスに維持する。PDF描画・ファイル書き出しは Repository / DataSource 側で async 実行し、完了結果のみ MainActor へ反映する
* `OrderCompleteView` は `OrderCompleteViewModel` のみに依存する。Repository / DataSource を直接importしない
* `LocalOrderReceiptRepository` / `UIGraphicsOrderReceiptPDFDataSource` は `MilkOrder/Infrastructure/Order/` に閉じ込める
* Firebase SDK を import しない（本機能はローカル生成のみ）

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/plans/scr-005-order-complete-pdf-receipt.md`（特に §0.2 入力制約一覧、§5.1.1.1 帳票レイアウト固定事項、§8.3 実装禁止事項）

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

補足: リポジトリ直下に `Package.swift` が存在しない現状では、`swift package audit` の実行結果と `git diff --name-only` による依存定義未変更を記録し、「N/A（依存追加・更新なし）」として扱ってよい（plan 9.2）。

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: `.github/copilot/plans/scr-005-order-complete-pdf-receipt.md`, Issue #45, PR #48
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト（5章）の全10ファイルが実装済み（追加7件・修正3件）
* 6章の受入条件がすべて満たされる（XCTestで担保。PDF内容確認を含む）
* SCR-001〜SCR-006の既存テストが回帰せずPASSする
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / test / swift package audit またはN/A判定）
* `#Preview` が Firebase なしで動作する
* `PlacedOrder` の型定義に変更がない
* 配達先名・備考・金額・一時ファイルURLがコード・ログ・テストデータに含まれていない
* PDFが一時ディレクトリのみに保存され、永続領域（Documents等）に保存されていない
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
