# Implementation Plan — Xcode Staging 環境分離設定

---

## 0. 実装入力コンテキスト

| 項目                             | 記入                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 対象Issue                        | [DESIGN] Xcodeプロジェクトの環境分離設定（Staging Build Configuration / Bundle ID / Scheme） / Closes #9 |
| 対象リポジトリ内パス（実装起点） | `MilkOrder.xcodeproj/`, `Configurations/`, `MilkOrder.xcodeproj/xcshareddata/xcschemes/`                 |

運用補足: 本 plan は Xcode プロジェクト設定変更専用です。SwiftUI 画面・ViewModel・Repository・DataSource の実装変更は対象外です。

### 0.1 変更サマリ一覧

| 区分 | 対象                                                                    | 変更概要                                                                                                                      |
| ---- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 追加 | Staging Build Configuration                                             | Project / App / Tests / UITests の各 configuration list に `Staging` を追加し、既存 `Release` を複製元にする                  |
| 追加 | `Configurations/Staging.xcconfig`                                       | App target の Staging 専用 build settings（Bundle ID / Display Name / Export Compliance key / build number 管理点）を集約する |
| 修正 | `MilkOrder.xcodeproj/project.pbxproj`                                   | App target の Staging 設定を `Staging.xcconfig` に接続し、既存 `Debug` / `Release` 値を維持したまま `Staging` を追加する      |
| 追加 | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder Staging.xcscheme` | `Staging` configuration を使う共有 Scheme を追加する                                                                          |
| 追加 | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder.xcscheme`         | 現在の既定挙動を共有 Scheme 化し、個人 Scheme 依存を解消する                                                                  |

### 0.2 入力制約一覧

| 制約区分 | 制約内容                                                                                                                                                                                                                                | 適用対象                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| 互換性   | 既存 `Debug` / `Release` の `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder`、`DEVELOPMENT_TEAM = CQ2PMS27D7`、`CODE_SIGN_STYLE = Automatic` は変更しない                                                                           | `MilkOrder.xcodeproj/project.pbxproj` |
| 禁止事項 | Production 用 Bundle ID / App Store Connect app / APNs を追加しない                                                                                                                                                                     | 実装全体                              |
| 禁止事項 | CI/CD 自動化、GitHub Actions workflow 追加、Swift コード変更を行わない                                                                                                                                                                  | 実装全体                              |
| その他   | `GENERATE_INFOPLIST_FILE = YES` を維持し、明示的な `Info.plist` ファイル新設へ切り替えない                                                                                                                                              | App target                            |
| その他   | build number は Staging app（`com.levelcap.MilkOrder.stg`）単位で単調増加とし、archive 前に App Store Connect の最大 build number を確認して `Configurations/Staging.xcconfig` の `CURRENT_PROJECT_VERSION` を最大値 + 1 へ手動更新する | `Configurations/Staging.xcconfig`     |
| その他   | テスト bundle は TestFlight 配布対象ではないため、Staging 追加時も既存 bundle ID 命名を維持して最小差分に留める                                                                                                                         | Tests / UITests target                |

### 0.3 関連機能・関連仕様一覧

| 種別         | パス/識別子                                                              | この設計での利用目的                                                                                |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 要件         | `.github/copilot/10-requirements.md`                                     | リポジトリ全体の非機能・セキュリティ前提の確認                                                      |
| 設計方針     | `.github/copilot/20-architecture.md`                                     | Staging / Production 分離方針、xcconfig 管理方針の確認                                              |
| セキュリティ | `.github/copilot/50-security.md`                                         | 環境固有設定を xcconfig で管理し、Secrets を含めない制約の確認                                      |
| 品質ゲート   | `.github/copilot/60-ci-quality-gates.md`                                 | 既存 build / lint / test コマンドと、Staging 追加時の CI 影響確認観点の確認                         |
| ADR          | `.github/copilot/70-adr/ADR-001-environment-separation.md`               | `Debug` / `Release` / `Staging` の役割分離と Staging scheme 方針の確認                              |
| ADR          | `.github/copilot/70-adr/ADR-005-testflight-apple-ownership.md`           | `com.levelcap.MilkOrder.stg`、`MilkOrder Staging`、単調増加 build number の確定事項を実装へ翻訳する |
| 調査         | `docs/research/testflight-distribution-setup.md`                         | Export Compliance と build number 手動運用の設計入力を引き継ぐ                                      |
| 既存実装     | `MilkOrder.xcodeproj/project.pbxproj`                                    | 現在の Build Configuration / Signing / Bundle ID / Info.plist 管理実態の確認                        |
| 既存実装     | `MilkOrder.xcodeproj/` 配下に `.xcscheme` / `.xcconfig` が存在しない現状 | 共有 Scheme 化と xcconfig 新設が必要である根拠                                                      |

---

## 1. 実装対象機能と機能ゴール

| 項目                          | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 根拠                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 実装対象詳細                  | Xcode プロジェクトの Staging 環境分離設定（Build Configuration / xcconfig / shared Scheme / generated Info.plist build settings）                                                                                                                                                                                                                                                                                                                       | Issue #9 §1, §6.1                   |
| 機能ゴール                    | 共有 `MilkOrder Staging` Scheme を選ぶだけで、`com.levelcap.MilkOrder.stg` / `MilkOrder Staging` を使う Staging build と archive を実行できる                                                                                                                                                                                                                                                                                                           | ADR-005, Issue #9 §5                |
| 非ゴール                      | Production 用 Apple 資産作成、CI/CD 自動化、SwiftUI 画面実装、App Store Connect / Apple Developer Portal の実操作                                                                                                                                                                                                                                                                                                                                       | Issue #9 §3, §6.2                   |
| 完了条件                      | ① `Debug` / `Release` / `Staging` の3構成が project / app / test / ui test へ追加される ② App target の Staging が `com.levelcap.MilkOrder.stg` と `MilkOrder Staging` を生成する ③ `MilkOrder` と `MilkOrder Staging` の2つの共有 Scheme が `xcshareddata/xcschemes/` に存在する ④ `ITSAppUsesNonExemptEncryption` が generated Info.plist 向け build setting で注入される ⑤ Staging build / archive と既存 MilkOrder build の検証手順が再現可能である | Issue #9 §5, §7                     |
| 受入確認手順（1行で再現可能） | `xcodebuild -list -project MilkOrder.xcodeproj` で `Staging` と `MilkOrder Staging` を確認し、`xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'`、`xcodebuild archive -scheme "MilkOrder Staging" -destination 'generic/platform=iOS' -archivePath build/MilkOrder-Staging.xcarchive`、`xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` を順に実行する        | Issue #9 §7, 60-ci-quality-gates.md |

---

## 2. 前提・制約（SSOT）

| 種別                                            | 内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                | 根拠（ファイル/ADR/Issue）                                                                                |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 参照したSSOT                                    | `.github/copilot/00-index.md` → `.github/copilot-instructions.md` → `.github/copilot/10-requirements.md` → `.github/copilot/20-architecture.md` → `.github/copilot/50-security.md` → `.github/copilot/60-ci-quality-gates.md` → `.github/copilot/80-templates/implementation-plan.md`                                                                                                                                                                               | `.github/copilot/00-index.md`                                                                             |
| アーキテクチャ前提（View/ViewModel/Repository） | 本件は Xcode プロジェクト設定変更のため、View / ViewModel / Repository / DataSource の責務分担には影響しない                                                                                                                                                                                                                                                                                                                                                        | Issue #9 §0, §1                                                                                           |
| iOS バージョン要件                              | 既存 project は `IPHONEOS_DEPLOYMENT_TARGET = 26.4`、検証端末は `iPhone 17` を前提にする                                                                                                                                                                                                                                                                                                                                                                            | `MilkOrder.xcodeproj/project.pbxproj`, `60-ci-quality-gates.md`                                           |
| 技術制約（互換性/期限/運用/セキュリティ）       | `CODE_SIGN_STYLE = Automatic` は Staging にも引き継ぐ。`DEVELOPMENT_TEAM` はStaging専用のApple Developer Portal Team（`499VJ7YVGA`）を使う（本plan策定時点では既存pbxprojの値`CQ2PMS27D7`の引き継ぎを想定していたが、実際にはBundle ID `com.levelcap.MilkOrder.stg` がTeam `499VJ7YVGA`側に登録されており、`CQ2PMS27D7`では登録不可だったため訂正。ADR-005はTeam ID番号自体を確定事項にしていない）。環境固有の非 secret 値のみ xcconfig に置き、Secrets は置かない | `Configurations/Staging.xcconfig`, `docs/ops/testflight-staging-release.md` §2, `50-security.md`          |
| セキュリティ前提                                | Export Compliance は、HTTPS/TLS 通信と Keychain など OS 標準の安全な保存機構のみを使用し、独自暗号実装を含まない前提で整理する。この前提に基づき Staging の `INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO` を設定する                                                                                                                                                                                                                                           | PR #21 review comment（issuecomment-4787502448）, `docs/research/testflight-distribution-setup.md` §1, §5 |

---

## 3. 要件定義（実装受入条件）

### 3.1 機能要件

| ID    | 要件                                                                                                                    | 受入条件（テスト可能な形）                                                                                                                                                               |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR-01 | Project / App / Tests / UITests の configuration list に `Staging` を追加する                                           | `xcodebuild -list -project MilkOrder.xcodeproj` に `Build Configurations: Debug, Release, Staging` が表示される                                                                          |
| FR-02 | App target の Staging は `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg` を使う                                | `xcodebuild -showBuildSettings -scheme "MilkOrder Staging"` で App target の `PRODUCT_BUNDLE_IDENTIFIER` が `com.levelcap.MilkOrder.stg` になる                                          |
| FR-03 | App target の Staging は表示名 `MilkOrder Staging` を generated Info.plist に反映する                                   | `xcodebuild -showBuildSettings -scheme "MilkOrder Staging"` で `INFOPLIST_KEY_CFBundleDisplayName = MilkOrder Staging` を確認できる                                                      |
| FR-04 | `MilkOrder Staging` 共有 Scheme を追加し、Run / Test / Profile / Analyze / Archive が `Staging` configuration を使う    | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder Staging.xcscheme` の各 action が `buildConfiguration = "Staging"` を持つ                                                           |
| FR-05 | 既存 `MilkOrder` Scheme を共有化し、現在の既定挙動（Run/Test/Analyze = Debug、Archive/Profile = Release）を維持する     | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder.xcscheme` が追加され、既存ローカル運用に依存しなくなる                                                                             |
| FR-06 | `ITSAppUsesNonExemptEncryption` は明示 Info.plist 化ではなく generated Info.plist 向け build setting で `NO` を注入する | `xcodebuild -showBuildSettings -scheme "MilkOrder Staging"` で App target の `INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO` を確認でき、`GENERATE_INFOPLIST_FILE = YES` は維持される |
| FR-07 | build number は Staging app 単位の手動単調増加運用にする                                                                | `Configurations/Staging.xcconfig` の `CURRENT_PROJECT_VERSION` を archive 前に App Store Connect の最大値 + 1 へ更新する手順が実装手順と検証手順に明記される                             |

### 3.2 非機能要件

| ID     | 要件                                                                          | 受入条件（テスト可能な形）                                                                                   |
| ------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| NFR-01 | 既存 `Debug` / `Release` の bundle ID / signing / build 動作を壊さない        | `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` が引き続き成功する |
| NFR-02 | 実装差分は Xcode 設定ファイルに限定し、Swift ソース・テストコードは変更しない | 変更予定ファイル一覧に Swift ファイルが含まれない                                                            |
| NFR-03 | xcconfig と shared Scheme に Secrets を含めない                               | 追加ファイルに Team ID 以外の認証情報、API key、証明書、profile 実体が存在しない                             |

---

## 4. スコープ境界

### 4.0 スコープ境界の定義（機能単位）

| 区分（In-Scope/Out-of-Scope） | 対象機能/責務                                                 | 判定理由                                                                          |
| ----------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| In-Scope                      | `Staging` Build Configuration の追加                          | Issue #9 の中心論点                                                               |
| In-Scope                      | App target Staging 向け `Staging.xcconfig` の新設             | `PRODUCT_BUNDLE_IDENTIFIER` / Display Name / Export Compliance key の集約先が必要 |
| In-Scope                      | shared Scheme（`MilkOrder`, `MilkOrder Staging`）の追加       | 現状が個人 Scheme 運用であり、リポジトリ共有が必要                                |
| In-Scope                      | generated Info.plist 向け build setting 追加                  | `ITSAppUsesNonExemptEncryption` を設定するため                                    |
| In-Scope                      | Staging archive と既存 build の検証手順整備                   | 実装後の回帰確認に必須                                                            |
| Out-of-Scope                  | SwiftUI 画面 / ViewModel / Repository / DataSource の実装変更 | Xcode プロジェクト設定変更のみが対象                                              |
| Out-of-Scope                  | Production 用 Bundle ID / App Store Connect app / APNs の作成 | ADR-005 により保留                                                                |
| Out-of-Scope                  | GitHub Actions workflow 追加・CI/CD 自動化                    | Issue #9 の非ゴール                                                               |
| Out-of-Scope                  | Apple Developer Portal / App Store Connect 上の人手操作       | 実装 PR ではなく運用作業                                                          |
| Out-of-Scope                  | App Privacy の棚卸し                                          | 調査結果の後続運用課題であり、本設定変更には含めない                              |

### 4.2 実装時の影響範囲・互換性リスク

| 影響対象        | 結論（影響あり/なし/未確定） | 影響内容                                                                                     |
| --------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| UI/画面         | 影響なし                     | SwiftUI 画面や表示ロジックは変更しない                                                       |
| API/外部通信    | 影響なし                     | ネットワーク層や Firebase 接続コードは変更しない                                             |
| データモデル    | 影響なし                     | Swift 型や永続化スキーマの変更はない                                                         |
| 外部依存（SPM） | 影響なし                     | 新規依存追加は行わない                                                                       |
| CI/運用         | 影響あり                     | 共有 Scheme が増え、Staging build / archive を CI 品質ゲートへ追加するか後続判断が必要になる |

### 4.3 外部依存・Secrets の扱い

| 項目                       | 内容                                                             | リスク/対応                                                                |
| -------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 外部依存の追加/更新（SPM） | なし                                                             | 依存脆弱性の新規流入なし                                                   |
| Secrets 利用有無           | なし                                                             | xcconfig に bundle ID・表示名・build number のみを置き、秘密情報を置かない |
| ログ/設定への機密混入対策  | Team ID 以外の認証情報・証明書実体・profile 実体をコミットしない | `50-security.md` と Issue #9 非ゴールに従う                                |

### 4.4 4章の自己検証（必須）

| チェック項目                   | 合格条件                                                             | 判定          |
| ------------------------------ | -------------------------------------------------------------------- | ------------- |
| Design PR 差分を書いていないか | plan ファイル追加そのものではなく、将来の実装差分のみを書いている    | OK            |
| 実装責務を書いているか         | In-Scope に実装責務が2件以上ある                                     | OK（5件）     |
| 実装影響を書いているか         | 4.2 で `影響あり/未確定` が1件以上あり、影響内容が具体記述されている | OK（CI/運用） |

---

## 5. アーキテクチャ設計

本 Issue は Xcode プロジェクト設定変更のみを対象とするため、View / ViewModel / Repository / DataSource の依存注入経路、シーケンス図、Protocol 契約は対象外です。`20-architecture.md` の環境分離方針と ADR-001 / ADR-005 の確定事項を、`project.pbxproj` / `xcconfig` / `xcscheme` へ落とし込むことだけを扱います。

---

## 6. 契約仕様（Protocol Contract）

本 Issue は画面 I/F や Protocol 追加を伴わないため対象外です。変更対象は Xcode プロジェクト設定ファイルのみであり、Swift の API / Protocol / DTO / classDiagram は発生しません。

---

## 7. データ設計（必要な場合のみ）

本 Issue は CoreData / UserDefaults / Firestore スキーマ変更を伴わないため対象外です。build number は Xcode build setting の運用値であり、アプリ内データモデル変更ではありません。

---

## 8. 実装指示（製造 Agent 向け）

### 8.1 変更予定ファイル一覧（必須）

| No. | パス                                                                    | 区分（View/ViewModel/Repository/DataSource/Model/Test/Other） | 変更タイプ（追加/変更/削除） | 実装内容（具体）                                                                                                                                                              | 完了条件                                                                            |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | `MilkOrder.xcodeproj/project.pbxproj`                                   | Other                                                         | 変更                         | Project / App / Tests / UITests に `Staging` configuration を追加し、App target の Staging を `Configurations/Staging.xcconfig` へ接続する                                    | `Staging` が全 configuration list に存在し、既存 `Debug` / `Release` 値は維持される |
| 2   | `Configurations/Staging.xcconfig`                                       | Other                                                         | 追加                         | App target Staging 用の `PRODUCT_BUNDLE_IDENTIFIER`、`INFOPLIST_KEY_CFBundleDisplayName`、`INFOPLIST_KEY_ITSAppUsesNonExemptEncryption`、`CURRENT_PROJECT_VERSION` を定義する | App target の Staging build settings が xcconfig 由来で解決される                   |
| 3   | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder.xcscheme`         | Other                                                         | 追加                         | 既存 `MilkOrder` Scheme を共有化し、Run/Test/Analyze = Debug、Profile/Archive = Release を明示する                                                                            | ローカル個人 Scheme なしでも既存 build / archive が再現できる                       |
| 4   | `MilkOrder.xcodeproj/xcshareddata/xcschemes/MilkOrder Staging.xcscheme` | Other                                                         | 追加                         | `Staging` 専用共有 Scheme を追加し、Run/Test/Profile/Analyze/Archive を `Staging` に固定する                                                                                  | `xcodebuild build/archive -scheme "MilkOrder Staging"` が同じ設定で再現できる       |

### 8.2 実装手順（順序付き）

| 手順 | 作業内容                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 対象ファイル/モジュール                                 | 完了条件                                                                                                                            |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `project.pbxproj` に `Staging` configuration を追加する。project / app / tests / ui tests の各 `Release` を複製元にし、App target だけ `baseConfigurationReference = Configurations/Staging.xcconfig` を設定する。Tests / UITests の Staging は既存 `Release` 設定値を維持し、bundle ID も既存命名のままにする                                                                                                                                                                                                                                                                                 | `MilkOrder.xcodeproj/project.pbxproj`                   | `XCBuildConfiguration` / `XCConfigurationList` に `Staging` が追加され、App / Tests / UITests の build が解決可能になる             |
| 2    | `Configurations/Staging.xcconfig` を作成し、少なくとも `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg`、`STAGING_DISPLAY_NAME = MilkOrder Staging`、`INFOPLIST_KEY_CFBundleDisplayName = $(STAGING_DISPLAY_NAME)`、`CURRENT_PROJECT_VERSION = 1`、`INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO` を定義する                                                                                                                                                                                                                                                                       | `Configurations/Staging.xcconfig`                       | Staging の App target build settings が xcconfig だけで解決され、generated Info.plist へ表示名と Export Compliance key が注入される |
| 3    | 共有 Scheme を追加する。`MilkOrder.xcscheme` は既存挙動維持、`MilkOrder Staging.xcscheme` は Build / Run / Test / Profile / Analyze / Archive を `Staging` に固定する。Archive action は `revealArchiveInOrganizer = "YES"` のままにし、Staging archive を Xcode Organizer / CLI の両方で扱えるようにする                                                                                                                                                                                                                                                                                      | `MilkOrder.xcodeproj/xcshareddata/xcschemes/*.xcscheme` | ローカル `xcuserdata` に依存せず、クローン直後の環境で同じ Scheme 名を選択できる                                                    |
| 4    | Staging build number 手順を守って検証する。初回 Staging app record に build が未登録なら `CURRENT_PROJECT_VERSION = 1` のまま、2回目以降は App Store Connect 上の最大 build number を確認して `+1` へ更新してから archive する                                                                                                                                                                                                                                                                                                                                                                 | `Configurations/Staging.xcconfig`, 人手運用手順         | ADR-005 の単調増加ルールに違反しない                                                                                                |
| 5    | 検証コマンドを順に実行する。`xcodebuild -list -project MilkOrder.xcodeproj`、`xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'`、`xcodebuild archive -scheme "MilkOrder Staging" -destination 'generic/platform=iOS' -archivePath build/MilkOrder-Staging.xcarchive`、`xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`。必要に応じて `xcodebuild archive -scheme MilkOrder -destination 'generic/platform=iOS' -archivePath build/MilkOrder.xcarchive` も実行して既存 Release archive を回帰確認する | Xcode project 全体                                      | `Staging` と既存 `MilkOrder` の両経路が成功し、Scheme / Build Configuration / archive 設定の回帰がない                              |

### 8.3 実装禁止事項（ガードレール）

| 項目       | 内容                                                                                                                            | 根拠             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 禁止事項-1 | 既存 `Debug` / `Release` の `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder` を `com.levelcap.MilkOrder.stg` へ置き換えない | Issue #9 §6.1    |
| 禁止事項-2 | `GENERATE_INFOPLIST_FILE = YES` をやめて明示 `Info.plist` ファイル新設へ切り替えない                                            | Issue #9 §6.1    |
| 禁止事項-3 | Production 用 Bundle ID / Scheme / Apple 資産作成を同じ PR に含めない                                                           | ADR-005          |
| 禁止事項-4 | xcconfig / scheme XML に Secrets、証明書、profile 実体、App Store Connect API key を含めない                                    | `50-security.md` |
| 禁止事項-5 | `ITSAppUsesNonExemptEncryption = TBD` や build number の未確定値をコミットしない                                                | Issue #9 §8      |

### 8.4 モジュール/アクセス制御方針

| 項目             | 設定内容                                                                                                        | 検証方法                 |
| ---------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 共有 Scheme 方針 | 実行に必要な Scheme は `xcshareddata/xcschemes/` 配下へコミットし、個人 `xcuserdata` 依存を残さない             | Git 差分確認             |
| 設定値配置方針   | 環境固有の非 secret 値は `Configurations/Staging.xcconfig` に集約し、`project.pbxproj` への直書きを最小限にする | コードレビュー           |
| 互換性方針       | 既存 `MilkOrder` Scheme と `Debug` / `Release` settings は動作を変えず、Staging を追加するだけに留める          | build / archive 回帰確認 |

---

## 9. テスト実装計画

### 9.1 テストケース

Xcode プロジェクト設定変更のため、新規 XCTest 追加は行わず、build / archive / static check を受入確認として扱います。

| 区分（正常/例外/境界/回帰） | パターン名                     | 対象                | シナリオ                                                                                                                                       | 期待結果                                                                    |
| --------------------------- | ------------------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| 正常                        | Staging Configuration 一覧確認 | Project             | `xcodebuild -list -project MilkOrder.xcodeproj` を実行する                                                                                     | `Staging` configuration と `MilkOrder Staging` scheme が表示される          |
| 正常                        | Staging simulator build        | App target / Scheme | `xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'` を実行する                                 | Staging build が成功する                                                    |
| 正常                        | Staging archive                | App target / Scheme | `xcodebuild archive -scheme "MilkOrder Staging" -destination 'generic/platform=iOS' -archivePath build/MilkOrder-Staging.xcarchive` を実行する | Staging archive が成功し、Organizer / CLI で利用可能な archive が生成される |
| 正常                        | Export Compliance 設定値確認   | App target / Scheme | `xcodebuild -showBuildSettings -scheme "MilkOrder Staging"` を実行する                                                                         | `INFOPLIST_KEY_ITSAppUsesNonExemptEncryption = NO` が解決される             |
| 境界                        | 初回 build number              | `Staging.xcconfig`  | App Store Connect に Staging build 履歴がない状態で archive する                                                                               | `CURRENT_PROJECT_VERSION = 1` で開始できる                                  |
| 境界                        | 2回目以降の build number       | `Staging.xcconfig`  | App Store Connect の最大 build number を確認後に archive する                                                                                  | `CURRENT_PROJECT_VERSION` が最大値 + 1 に更新される                         |
| 回帰                        | 既存 MilkOrder build           | 既存 shared Scheme  | `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` を実行する                                           | 既存 build が引き続き成功する                                               |
| 回帰                        | 既存 MilkOrder archive         | 既存 shared Scheme  | `xcodebuild archive -scheme MilkOrder -destination 'generic/platform=iOS' -archivePath build/MilkOrder.xcarchive` を実行する                   | 既存 Release archive が引き続き成功する                                     |

| 網羅チェック               | 判定（Y/N） | 根拠                                                         |
| -------------------------- | ----------- | ------------------------------------------------------------ |
| 正常パターンを網羅している | Y           | Configuration 追加、build、archive、shared Scheme を確認する |
| 例外パターンを網羅している | Y           | Export Compliance 値の未確定コミットを静的に防ぐ             |
| 境界パターンを網羅している | Y           | 初回と2回目以降で build number の扱いを分けて確認する        |
| 回帰パターンを網羅している | Y           | 既存 `MilkOrder` build / archive の存続確認を含める          |

---

## 10. オープン課題 / ADR

| 論点                                            | 現状                                                                                                                         | 決定期限/担当                          | ADR要否（要/不要/TBD） |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------- |
| 既存 CI 品質ゲートへ Staging build を追加するか | `60-ci-quality-gates.md` は現状 `MilkOrder` build/test/lint のみ。Staging build を required check に昇格するかは後続運用判断 | Staging 実装 PR 後 / 人間 + 実装 Agent | 不要                   |

### 10.1 TBD 回収トラッキング（必須）

| TBD論点                                    | 現在の記載箇所（章/項目）                  | 解決ゲート（必須）             | BLOCKER（Yes/No） | RESOLVE_IN（必須） | DEFAULT/ASSUMPTION（任意）                       | ADR記録先（必要時） |
| ------------------------------------------ | ------------------------------------------ | ------------------------------ | ----------------- | ------------------ | ------------------------------------------------ | ------------------- |
| Staging build を CI 必須ジョブへ追加するか | `4.2 実装時の影響範囲`, `10. オープン課題` | GATE: Staging 実装 PR マージ後 | No                | 後続運用改善 Issue | まずはローカル / 手動 build 検証を標準経路とする | 不要                |

---
