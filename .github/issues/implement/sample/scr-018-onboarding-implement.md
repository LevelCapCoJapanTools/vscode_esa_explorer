---
phase: implement
screen_id: SCR-018
title: "[IMPLEMENT] SCR-018 オンボーディング画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-018 オンボーディング画面

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
* 前提条件:
  * 既存の `AppEnvironment` DI初期化（SCR-001 ログイン画面で確立済み）に `onboardingRepository` を追加する形で接続すること
  * `MilkOrder/MilkOrderApp.swift` の既存起動分岐（`currentUser` 判定による `LoginView` / `MenuRootView` 切替）を維持したまま、その手前にオンボーディング表示判定を追加すること

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

* `.github/copilot/plans/scr-018-onboarding.md`（TBD解決済み。BLOCKERとなるTBDは0件）

### 2.2 DESIGN Issue（仕様の背景・補助）

* https://github.com/LevelCapTech/milk-order-ios/issues/38

### 2.3 DESIGN PR（設計差分・合意点）

* https://github.com/LevelCapTech/milk-order-ios/pull/44（マージ済み）

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

* `.github/copilot/image/onboardingImage_1page.png`
* `.github/copilot/image/onboardingImage_2page.png`
* `.github/copilot/image/onboardingImage_3page.png`
* `.github/copilot/image/onboardingImage_4page.png`
* `.github/copilot/image/onboardingImage_5page.png`
* 補足: 5ページ目の「さあ、はじめましょう」ボタンは画像に描かれていない。plan 0.2/8.1記載のとおり、既存のプライマリボタン（`.buttonStyle(.borderedProminent)` 系）の見た目に合わせて新規に実装する

## 3. スコープ / 非ゴール

* 対象: planに記載された変更のみ
* 非ゴール:
  * plan外の機能追加
  * 大規模リファクタリング
  * アーキテクチャ変更（AppEnvironment/DIの変更。plan記載の `onboardingRepository` 追加を除く）
  * Staging/Production Firebase設定の変更
  * オンボーディング内容の動的配信・A/Bテスト（Remote Config等）
  * Push通知の許可ダイアログ表示
  * ログイン後（SCR-001以降）の既存画面遷移ロジックの変更
  * `.github/copilot/10-requirements.md` 画面一覧へのSCR-018追記

## 4. 変更許容範囲（plan厳守）

* planからの逸脱: **禁止**
* planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
* planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（plan §8.1から転記）。

| レイヤ | action | path | 型名/関数名 | 依存（どこ→どこ） | tests |
| --- | --- | --- | --- | --- | --- |
| Model | add | `MilkOrder/Domain/Onboarding/OnboardingPage.swift` | `OnboardingPage`, `OnboardingPoint`, `OnboardingPageID` | — | `OnboardingViewModelTests` |
| Model | add | `MilkOrder/Domain/Onboarding/OnboardingPresentationState.swift` | `OnboardingPresentationState`, `OnboardingLaunchState` | — | `OnboardingViewModelTests` |
| Protocol | add | `MilkOrder/Domain/Onboarding/OnboardingRepository.swift` | `OnboardingRepository`（Protocol。`fetchPresentationState()`, `markCompleted()`） | — | `UserDefaultsOnboardingRepositoryTests` |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Onboarding/UserDefaultsOnboardingRepository.swift` | `UserDefaultsOnboardingRepository`, `OnboardingVersionProviding`（Protocol）, `BundleOnboardingVersionProvider` | `OnboardingRepository` → `UserDefaults` / `Bundle.main` | `UserDefaultsOnboardingRepositoryTests` |
| Repository（DataSource） | add | `MilkOrder/Infrastructure/Onboarding/MockOnboardingRepository.swift` | `MockOnboardingRepository` | `OnboardingRepository` | `OnboardingViewModelTests` |
| ViewModel | add | `MilkOrder/Features/Onboarding/OnboardingViewModel.swift` | `OnboardingViewModel`（`@MainActor`。`loadPresentationState()` / `completeOnboarding()` / `setCurrentPageIndex(_:)`） | `any OnboardingRepository` | `OnboardingViewModelTests` |
| View | add | `MilkOrder/Features/Onboarding/OnboardingView.swift` | `OnboardingView`, `OnboardingPageContentView`, `OnboardingHighlightsSection`, `OnboardingIllustrationView`, `OnboardingPrimaryActionButton` | `OnboardingViewModel` | `OnboardingFlowUITests` |
| Other | add | `MilkOrder/Assets.xcassets/Onboarding/`（新規作成） | `onboardingImage_1page`〜`onboardingImage_5page` Asset登録 | — | `OnboardingFlowUITests`（表示確認） |
| AppEnvironment | modify | `MilkOrder/App/AppEnvironment.swift` | `onboardingRepository: any OnboardingRepository` を追加し `.preview()` へ `MockOnboardingRepository` を注入 | `UserDefaultsOnboardingRepository`, `MockOnboardingRepository` | 既存Preview/Test維持確認 |
| Other | modify | `MilkOrder/MilkOrderApp.swift` | `OnboardingViewModel` 初期化、launch environment（`ONBOARDING_TEST_SUITE` / `ONBOARDING_TEST_VERSION`）反映、root分岐（`.checking` / `.showOnboarding` / `.readyForApp`）更新 | `OnboardingViewModel`, `AppEnvironment` | `OnboardingFlowUITests` |
| Test | add | `MilkOrderTests/Infrastructure/Onboarding/UserDefaultsOnboardingRepositoryTests.swift` | `UserDefaultsOnboardingRepositoryTests` | `UserDefaultsOnboardingRepository` | — |
| Test | add | `MilkOrderTests/Features/Onboarding/OnboardingViewModelTests.swift` | `OnboardingViewModelTests` | `OnboardingViewModel` | — |
| Test | add | `MilkOrderUITests/Onboarding/OnboardingFlowUITests.swift` | `OnboardingFlowUITests` | `OnboardingView`, `MilkOrderApp` launch environment | — |
| Test | modify | `MilkOrderTests/Features/Login/LoginViewModelTests.swift` | `AppEnvironment` 初期化引数追加への追従 | `AppEnvironment` | 既存テスト回帰確認 |
| Test | modify | `MilkOrderTests/Features/OrderInput/OrderInputViewModelTests.swift` | `AppEnvironment` 初期化引数追加への追従 | `AppEnvironment` | 既存テスト回帰確認 |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planのAcceptance Criteria（§3.1 機能要件 / §3.2 非機能要件）をそのまま列挙。

* FR-01: 初回起動時にオンボーディングを表示する（永続化値が未保存の状態で起動すると `MilkOrderApp` が `OnboardingView` を表示する）
* FR-02: オンボーディングは5ページ固定で表示する（`OnboardingViewModel.pages.count == 5`、各ページのタイトル・画像アセット名がIssue #38の5ページ定義と一致する）
* FR-03: 1〜5ページは横スワイプで移動でき、下部に5点のページインジケーターを表示する（`TabView` + `PageTabViewStyle(indexDisplayMode: .always)`）
* FR-04: 1ページ目に「注文はカンタン」「履歴でらくらく管理」「大切なお知らせ」の3ポイントを表示する
* FR-05: 2〜4ページは各モック画像と要約説明を表示する
* FR-06: 5ページ目のみに「さあ、はじめましょう」ボタンを表示する（`currentPageIndex == 4` のときだけCTAが描画される）
* FR-07: 5ページ目のCTA押下でオンボーディング完了を保存する（`completeOnboarding()` 呼び出しで現在メジャーバージョンを `UserDefaults` に保存する）
* FR-08: オンボーディング完了後は既存の `currentUser` 判定による `LoginView` / `MenuRootView` 分岐へ接続する
* FR-09: 同一メジャーバージョンの2回目以降の起動ではオンボーディングを表示しない
* FR-10: メジャーバージョンが変わった起動ではオンボーディングを再表示する
* FR-11: 起動直後の判定中にログイン画面が一瞬表示されないようにする（`.checking` 状態の中間表示）
* FR-12: `#Preview` / Demo はFirebaseなしでオンボーディングを表示できる（`AppEnvironment.preview()` に `MockOnboardingRepository` を注入）
* FR-13: UIテストで初回起動 / 再起動 / メジャー更新を再現できる（launch environment `ONBOARDING_TEST_SUITE` / `ONBOARDING_TEST_VERSION`）
* NFR-01: View / ViewModelは `UserDefaults` と `Bundle.main` を直接参照しない
* NFR-02: UI更新は `@MainActor` で保護する
* NFR-03: ログや永続化にSecrets / PIIを含めない（保存値はメジャーバージョン文字列のみ）
* NFR-04: CTAは既存画面と同系統のプライマリボタン見た目にする（`.appTypography(.appButtonLabel)` + `.buttonStyle(.borderedProminent)`）
* NFR-05: 品質ゲートとしてbuild / lint / test / securityの実行計画を持つ

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

* DO NOT CHANGE:
  * 既存の `currentUser` 判定による `LoginView` / `MenuRootView` 分岐条件そのもの（オンボーディング判定を前段に追加するのみ）
  * 既存のログイン後画面遷移ロジック・認証ロジック（`LoginView` / `MenuRootView` 以降）
* 禁止事項:
  * `OnboardingView` / `OnboardingViewModel` から `UserDefaults`, `Bundle.main`, launch environment を直接参照しない（Repository経由に限定）
  * 5ページ目CTAから `LoginView` / `MenuRootView` へ直接push / sheet / fullScreenCoverしない（root分岐は `MilkOrderApp` の責務）
  * `completedMajorVersion` 以外の認証情報・PIIを `UserDefaults` に保存しない
  * Boolフラグだけで再表示制御を実装しない（plan 5.2で案B＝メジャーバージョン比較を採用済み）
  * Remote Config、Push許可、分析SDKなどplanにない追加要素を持ち込まない
  * plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

* DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）
* `@MainActor` を ViewModel クラスに付与し、UI更新の安全性を保証する
* View は ViewModel のみに依存し、Repository/DataSource を直接 import しない
* ViewModel は Repository Protocol のみに依存し、具象型を直接 import しない
* Firebase SDK を import するのは Infrastructure 層（DataSource）のみ（本機能はFirebase未使用）
* `#Preview` では Firebase を初期化しない（`.preview()` factory を使用）
* background スレッドから UI を更新しない

## 9. 必読（規約/ゲート）

* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/plans/scr-018-onboarding.md`（特に §5.7 シーケンス図、§5.8 処理フロー図、§8.2 実装手順、§9.2 CI品質ゲート実行計画）

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

* 参照したSSOT: `.github/copilot/plans/scr-018-onboarding.md`, DESIGN Issue #38, DESIGN PR #44
* 実装判断（裁量がある場合のみ）: 1〜3行
* 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

* 成果物マニフェスト（5章）の全項目が実装済み
* 6章の受入条件がすべて満たされる（XCTest / XCUITestで担保）
* CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test / swift package audit）
* `OnboardingViewModel` に `@MainActor` が付与されている
* `OnboardingView` / `OnboardingViewModel` が `UserDefaults` / `Bundle.main` を直接参照していない
* 5ページ目以外でCTAボタンが表示されない
* 完了保存後、同一メジャーバージョンの再起動でオンボーディングが表示されない（FR-09）
* メジャーバージョン変更相当の状態でオンボーディングが再表示される（FR-10）
* 既存の `LoginViewModelTests` / `OrderInputViewModelTests` を含む既存テストが回帰せずPASS
* `#Preview` がFirebaseなしで動作する
* ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <plan / DESIGN Issue / docs>
* 理由（1行）: <なぜこれが無いと実装できないか>
