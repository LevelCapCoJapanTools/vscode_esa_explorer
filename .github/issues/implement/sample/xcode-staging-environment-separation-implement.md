---
phase: implement
screen_id: "なし（機能: Xcode環境分離設定）"
title: "[IMPLEMENT] Xcodeプロジェクトの環境分離設定（Staging Build Configuration / Bundle ID / Scheme）"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] Xcodeプロジェクトの環境分離設定（Staging Build Configuration / Bundle ID / Scheme）

## 0. AI Agent 契約（最初に読む）

- あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
- **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
- **plan外の仕様追加/推測補完は禁止**。
- 本Issueの対象は **SwiftUI画面/機能ではなくXcodeプロジェクト設定変更**（Build Configuration / xcconfig / Scheme）。View/ViewModel/Repository/DataSource/AppEnvironmentのコード実装は本Issueに一切関与しない。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/plans/xcode-staging-environment-separation.md` のとおりにXcodeプロジェクト設定変更を完了し、CI品質ゲート（既存分）と回帰確認をすべて通す
- 前提: Xcodeプロジェクト設定変更のみ。Swift/SwiftUIコード変更は伴わない

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/xcode-staging-environment-separation.md`

### 2.2 DESIGN Issue（仕様の背景・補助）

- https://github.com/LevelCapTech/milk-order-ios/issues/9

### 2.3 DESIGN PR（設計差分・合意点）

- https://github.com/LevelCapTech/milk-order-ios/pull/21

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし（Xcodeプロジェクト設定のため対象外）

## 3. スコープ / 非ゴール

- 対象: planに記載された変更のみ（`project.pbxproj`へのStaging Configuration追加、`Configurations/Staging.xcconfig`新設、共有Scheme2件の追加）
- 非ゴール:
  - plan外の機能追加
  - 大規模リファクタリング
  - アーキテクチャ変更（AppEnvironment/DIの変更）
  - Production用Bundle ID・App Store Connect app・APNsの作成（ADR-005により保留）
  - CI/CD自動化（GitHub Actions workflow追加）
  - SwiftUI画面・ViewModel・Repository・DataSourceの実装

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）
- plan §10「オープン課題」記載の「既存CI品質ゲートへStaging buildを追加するか」は本Issueの実装対象外（plan上も「実装後の運用判断」と明記されており、後続Issueで扱う）

## 5. 成果物マニフェスト（必須 / planから転記）

> **この表が埋まっていない場合は実装開始禁止**。
> ここに書かれたものだけを作る（planを転記する）。テンプレ側で成果物を決めない。

| レイヤ | action（add/modify/delete） | path（リポジトリルート相対）                                            | 型名/関数名                                                                                                                                                            | 依存（どこ→どこ）                            | tests（追加/更新）                                                 |
| ------ | --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| Other  | modify                      | `MilkOrder.xcodeproj/project.pbxproj`                                   | Project/App/Tests/UITests の `XCConfigurationList` に `Staging` を追加し、App targetの`Staging`を`Configurations/Staging.xcconfig`へ接続                               | App targetのStaging設定 → `Staging.xcconfig` | `xcodebuild -list` で確認                                          |
| Other  | add                         | `Configurations/Staging.xcconfig`                                       | `PRODUCT_BUNDLE_IDENTIFIER` / `STAGING_DISPLAY_NAME` / `INFOPLIST_KEY_CFBundleDisplayName` / `INFOPLIST_KEY_ITSAppUsesNonExemptEncryption` / `CURRENT_PROJECT_VERSION` | App target `Staging` configuration が参照    | `xcodebuild -showBuildSettings -scheme "MilkOrder Staging"` で確認 |
| Other  | add                         | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder.xcscheme`         | 既存`MilkOrder` Schemeの共有化（Run/Test/Analyze=Debug、Profile/Archive=Release）                                                                                      | 既存`Debug`/`Release` configuration          | `xcodebuild build -scheme MilkOrder ...`（回帰）                   |
| Other  | add                         | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder Staging.xcscheme` | `MilkOrder Staging` Scheme（Run/Test/Profile/Analyze/Archive=Staging）                                                                                                 | `Staging` configuration                      | `xcodebuild build`/`archive -scheme "MilkOrder Staging" ...`       |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

> planのAcceptance Criteria（1章「完了条件」およびFR-01〜FR-07, NFR-01〜NFR-03）をそのまま列挙。

- ① `Debug` / `Release` / `Staging` の3構成がProject/App/Tests/UITestsへ追加される（FR-01）
- ② App targetのStagingが`PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg`を使う（FR-02）
- ③ App targetのStagingが表示名`MilkOrder Staging`をgenerated Info.plistへ反映する（FR-03）
- ④ `MilkOrder Staging`共有SchemeのRun/Test/Profile/Analyze/Archiveが`Staging` configurationを使う（FR-04）
- ⑤ 既存`MilkOrder` Schemeを共有化し、現状の既定挙動（Run/Test/Analyze=Debug、Archive/Profile=Release）を維持する（FR-05）
- ⑥ `ITSAppUsesNonExemptEncryption`をgenerated Info.plist向けbuild settingで`NO`に設定し、`GENERATE_INFOPLIST_FILE = YES`を維持する（FR-06）
- ⑦ build numberはStaging app単位の手動単調増加運用とし、archive前にApp Store Connectの最大値+1へ更新する手順を整備する（FR-07）
- ⑧ 既存`Debug`/`Release`のbundle ID/signing/build動作を壊さない（NFR-01）
- ⑨ 実装差分はXcode設定ファイルに限定し、Swiftソース・テストコードを変更しない（NFR-02）
- ⑩ xcconfig・shared SchemeにSecrets（Team ID以外の認証情報・APIキー・証明書・profile実体）を含めない（NFR-03）
- ⑪ 受入確認手順（plan §1）がすべて成功する: `xcodebuild -list -project MilkOrder.xcodeproj`、`xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'`、`xcodebuild archive -scheme "MilkOrder Staging" -destination 'generic/platform=iOS' -archivePath build/MilkOrder-Staging.xcarchive`、`xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE（plan §8.3より転記）:
  - 既存`Debug`/`Release`の`PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder`を`com.levelcap.MilkOrder.stg`へ置き換えない
  - `GENERATE_INFOPLIST_FILE = YES`をやめて明示`Info.plist`ファイル新設へ切り替えない
  - Production用Bundle ID/Scheme/Apple資産作成を同じPRに含めない（ADR-005）
  - xcconfig/scheme XMLにSecrets、証明書、profile実体、App Store Connect API keyを含めない（`50-security.md`）
  - `ITSAppUsesNonExemptEncryption = TBD`やbuild numberの未確定値をコミットしない
- plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- **対象外**: 本IssueはXcodeプロジェクト設定変更のみであり、View/ViewModel/Repository/DataSource/AppEnvironmentのコード実装は一切関与しない（plan §5, §6参照）

## 9. 必読（規約/ゲート）

- `.github/copilot-instructions.md`
- `.github/copilot/50-security.md`（xcconfig/SchemeにSecretsを含めない）
- `.github/copilot/60-ci-quality-gates.md`

## 10. 実行・品質ゲート（Done直結）

```bash
# Configuration / Scheme一覧確認
xcodebuild -list -project MilkOrder.xcodeproj

# Staging build
xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'

# Staging archive
xcodebuild archive -scheme "MilkOrder Staging" -destination 'generic/platform=iOS' -archivePath build/MilkOrder-Staging.xcarchive

# Staging build settings確認（Export Compliance / Bundle ID）
xcodebuild -showBuildSettings -scheme "MilkOrder Staging"

# 既存MilkOrder build（回帰確認）
xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# Lint
swiftlint lint --strict

# 既存テスト（回帰確認）
xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'

# 依存脆弱性スキャン
swift package audit
```

## 11. 作業ログ（AI Agentが残す最小記録）

> 人間向けではなく、**監査と再現**のための最小ログ。

- 参照したSSOT: `.github/copilot/plans/xcode-staging-environment-separation.md`（primary）、DESIGN Issue #9、DESIGN PR #21、`ADR-005-testflight-apple-ownership.md`、`ADR-001-environment-separation.md`
- 実装判断（裁量がある場合のみ）: plan §8.2の手順に従う。裁量が発生した場合はPRに1〜3行で記録する
- 受入条件の担保証跡: 10章の各コマンド実行結果（成功/失敗）をPRに記録する

## 12. Done（必須）

- 成果物マニフェスト（5章）の項目がすべて実装済み
- 受入条件（6章）がすべて満たされる
- 既存CI品質ゲートがすべて緑（`swiftlint lint --strict` / 既存`test` / `swift package audit`）
- Staging build / archive / build settings確認がすべて成功する（10章コマンド）
- 既存`MilkOrder` build / testが引き続き成功する（回帰確認）
- ドキュメント更新は最小差分（planに従う。新規docsファイル追加なし）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / DESIGN Issue / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
