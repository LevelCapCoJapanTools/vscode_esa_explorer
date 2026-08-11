---
phase: implement
screen_id: なし（全画面共通機能）
title: "[IMPLEMENT] アプリ全体のタイポグラフィスケール導入（AppTypography基盤＋既存View移行）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] アプリ全体のタイポグラフィスケール導入（AppTypography基盤＋既存View移行）

## 0. AI Agent 契約（最初に読む）

* あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
* **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
* **plan外の仕様追加/推測補完は禁止**。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

* ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
* 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）。本機能は新規DIを導入せず、Viewが静的タイポグラフィ基盤（`AppTypography`）を参照するのみ

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/typography-scale.md`

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/LevelCapTech/milk-order-ios/issues/25

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/LevelCapTech/milk-order-ios/pull/31

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* なし

## 3. スコープ / 非ゴール

* 対象: `typography-scale.md` に記載された変更のみ（`AppTypography` 基盤の新設、対象13Viewのテキスト用途フォント移行、関連XCTestの追加）
* 非ゴール:
  * アプリ内「標準/大/特大」フォントサイズ切替UIの追加（OSのDynamic Type設定への追従のみ対応する）
  * 既存配色の変更（コントラスト不足が判明した場合は本Issueでは対応せず、対象箇所を記録して別DESIGN Issueとして報告する）
  * ViewModel / Repository / DataSource / Model の責務変更、`AppEnvironment` のDI経路変更
  * 既存各画面plan（`scr-001-login.md` 等10本）の本文更新（`typography-scale.md` を横断SSOTとし、個別plan更新は行わない）
  * 装飾用SF Symbol・アイコンの寸法変更（文字用途のフォントのみが対象）

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所（例: Accessibility大サイズでのレイアウト崩れ解消手段の選択）のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（`typography-scale.md` §8.1 から転記）。

| レイヤ | action（add/modify/delete） | path（リポジトリルート相対） | 型名/関数名 | 依存（どこ→どこ） | tests（追加/更新） |
| --- | --- | --- | --- | --- | --- |
| Other（DesignSystem） | add | `MilkOrder/DesignSystem/AppTypography.swift` | `AppTypographyToken`（enum）, `AppTypographySpec`（struct）, `AppTypography`（`spec(for:)` / `scaledFont(for:)` / `scaledLineSpacing(for:)`）, `View.appTypography(_:)` | SwiftUI / UIKit 標準APIのみ（`UIFontMetrics`） | `AppTypographyTests`（新規） |
| View | modify | `MilkOrder/Features/Login/LoginView.swift` | `LoginView`（画面タイトル・説明文・入力欄補助・ボタン文字） | `AppTypography` | 既存テスト回帰確認＋Preview/Simulator手動確認 |
| View | modify | `MilkOrder/Features/Menu/MenuView.swift` | `MenuView`（見出し・補足・各ボタン文字） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderInput/OrderInputView.swift` | `OrderInputView`（見出し・補足・締切表示・ボタン文字） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderInput/ProductRowView.swift` | `ProductRowView`（商品名・価格・税率バッジ・数量操作・注文ボタン） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderConfirmation/OrderConfirmationView.swift` | `OrderConfirmationView`（確認文言・補足・主要ボタン） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderComplete/OrderCompleteView.swift` | `OrderCompleteView`（完了見出し・本文・ボタン） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderHistory/OrderHistoryView.swift` | `OrderHistoryView`（一覧見出し・補足・空状態文言） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderDetail/OrderDetailView.swift` | `OrderDetailView`（カード見出し・本文・補足。装飾アイコン48サイズは個別確認のみで変更しない） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/OrderCorrection/OrderCorrectionSelectionView.swift` | `OrderCorrectionSelectionView`（見出し・補足・ボタン文字） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/Announcements/AnnouncementsView.swift` | `AnnouncementsView`（一覧見出し・本文・補足） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/Announcements/AnnouncementDetailView.swift` | `AnnouncementDetailView`（詳細見出し・本文・補足） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/Announcements/AnnouncementRowView.swift` | `AnnouncementRowView`（行見出し・メタ情報・本文抜粋） | `AppTypography` | 同上 |
| View | modify | `MilkOrder/Features/Shared/PlaceholderView.swift` | `PlaceholderView`（空状態見出し・本文） | `AppTypography` | 同上 |
| Test | add | `MilkOrderTests/DesignSystem/AppTypographyTests.swift` | `AppTypographyTests`（基準サイズ・行高・Dynamic Typeスケーリング・重要CTA weightの検証） | `AppTypography` | — |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planの3.1機能要件・3.2非機能要件をそのまま列挙。

* FR-01: 本文・補足文字・見出し・重要見出し・ボタンラベル・フォームラベル・プレースホルダ・危険/重要CTAを表すセマンティックトークンが `AppTypography.swift` に1箇所定義されている
* FR-02: 本文18px相当・補足文字/プレースホルダ16px相当・見出し22px相当・重要見出し24px相当・ボタンラベル/フォームラベル18px相当・危険/重要CTA 19〜20px太字相当で定義され、XCTestで検証できる
* FR-03: 本文系は行間1.6、補足系は1.5を基準とし、スケール後フォントと行高差分から`lineSpacing`を算出する（XCTestで検証）
* FR-04: `UIFontMetrics`ベースでOSの文字サイズ変更（Dynamic Type）に追従する（Accessibility大サイズでフォントが基準値より拡大される）
* FR-05: 既存の `.body`, `.caption`, `.caption2`, `.footnote`, `.subheadline`, `.headline`, `.title2`, `.title3`, `.largeTitle` とボタン既定ラベル文字を新トークンへ置換し、`rg -n "\.font\(" MilkOrder/Features -g "**/*View.swift"` の残件が装飾用SF Symbolを除いて0件になる
* FR-06: `#Preview` 内のテキスト表示も本番と同じトークンを通す（`AppEnvironment.preview()` のままフォントが反映される）
* FR-07: 重要なお知らせ・締切表示・危険系CTAなど重要情報は通常4.5:1以上に加えて7:1推奨の確認対象として分類されている
* FR-08: 関連Issue #26 / #27 が参照できるトークン名（`appSupporting`, `appButtonLabel`, `appDangerCTA` 等）が固定され、実装後に共通利用できる
* FR-09: 各画面plan（`scr-001-login.md` 等）の本文更新は行わず、`typography-scale.md` のみを横断タイポグラフィSSOTとして扱う（実装PRで既存画面planに追記しない）
* NFR-01: 既存ViewModel / Repository / DataSource / Model に依存やAPI変更を持ち込まない（`AppEnvironment.swift` やRepository Protocol群に変更が不要）
* NFR-02: `#Preview` はFirebase未接続を維持する（`AppEnvironment.preview()` のみ利用し `.live()` を呼ばない）
* NFR-03: Accessibility大サイズでレイアウト崩れが起きた場合、フォント値を基準未満に戻さずView側調整で解消する
* NFR-04: 配色変更は本Issueのスコープ外とし、コントラスト不足は別Issue化で管理する（本PRで色値を変更しない）
* NFR-05: build / lint / test / security の品質ゲートを実施し、実行結果をPRに残す

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * `AppEnvironment`, ViewModel, Repository Protocol の署名（Typography導入を理由に変更しない）
  * 既存の画面遷移ロジック・`NavigationStack` / `navigationDestination` の構成
  * 既存各画面plan（`scr-001-login.md` 等）の本文（更新不要。`typography-scale.md` を横断SSOTとする）
  * `appSupporting` / `appButtonLabel` / `appDangerCTA` 等のトークン名（後続Issue #26 / #27 が参照する前提で固定済み）
* 禁止事項-1: ViewからDataSource具象やFirebase SDKを直接importしない
* 禁止事項-2: 背景スレッドからSwiftUI UIを更新しない
* 禁止事項-3: Secrets / PII をコード・ログ・テスト・スクリーンショットに含めない
* 禁止事項-4: 本文やボタン文字へ `Font.system(size:)` を直接書き戻さない（装飾用SF Symbolの寸法指定は対象外）
* 禁止事項-5: コントラスト不足を理由に本Issueで配色変更まで広げない（対象箇所を記録し別DESIGN Issue化する）
* 禁止事項-6: `AppEnvironment`, ViewModel, Repository Protocolの署名をTypography導入のために変更しない
* plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）。本機能のために変更しない
* `@MainActor` を ViewModel クラスに付与する既存方針を維持する（Typography適用はSwiftUI View描画時にMainActor上で行う）
* View は ViewModel のみに依存し、Repository/DataSource を直接 import しない
* ViewModel は Repository Protocol のみに依存し、具象型を直接 import しない
* Firebase SDK を import するのは Infrastructure 層（DataSource）のみ。`AppTypography`（DesignSystem層）はSwiftUI/UIKit標準APIのみに依存し、Repository/DataSource/Firebaseに依存しない
* `#Preview` では Firebase を初期化しない（`.preview()` factory を使用）
* background スレッドから UI を更新しない

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/plans/typography-scale.md`（特に §5.1.1 既存スタイル→新トークン1:1マッピング、§8 実装指示）

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

補足: `swift package audit` はリポジトリ直下に `Package.swift` が存在しない場合、コマンド実行結果を記録した上で `git diff --name-only` により依存定義変更がないことを確認し、依存変更がなければ「N/A（依存追加・更新なし）」として扱ってよい（`typography-scale.md` §9.1 補足を参照）。

**手動確認手順**（`typography-scale.md` §9.1 より）:

1. `#Preview` で `LoginView`, `MenuView`, `OrderInputView`, `OrderConfirmationView`, `OrderHistoryView`, `OrderCorrectionSelectionView`, `AnnouncementsView`, `OrderDetailView` を開く
2. Simulator で Dynamic Type を標準サイズとアクセシビリティ大サイズに切り替える
3. 画面タイトル・本文・補足文字・ボタンラベル・重要情報を目視確認し、重なり・切れ・読みにくさがないことを確認する
4. `.foregroundStyle(.secondary/.tertiary)` 使用箇所と背景色の組み合わせをXcode Accessibility Inspectorまたは等価のコントラスト計算手段で確認する
5. 不足があれば配色変更は行わず、対象箇所を記録して別DESIGN Issueとして報告する（本Issueでは対応しない）

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

* 参照したSSOT: `.github/copilot/plans/typography-scale.md`, Issue #25, PR #31
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト（5章）の全項目が実装済み
* 受入条件（6章, FR-01〜FR-09 / NFR-01〜NFR-05）がすべて満たされる
* `rg -n "\.font\(" MilkOrder/Features -g "**/*View.swift"` の残件が装飾用SF Symbolを除いて0件
* Accessibility大サイズで主要画面（手動確認手順記載の8画面）にクリッピング/重なりがない
* 重要情報のコントラスト確認結果が記録されており、不足があれば別DESIGN Issue化の記録がある（本PRで配色変更はしない）
* `#Preview` が Firebase なしで動作する（`AppEnvironment.preview()` のみ使用）
* 既存各画面plan（`scr-001-login.md` 等）に変更がない
* `appSupporting` / `appButtonLabel` / `appDangerCTA` 等のトークン名が固定され、Issue #26 / #27 から参照可能な状態になっている
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / test / swift package audit または N/A判定）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
