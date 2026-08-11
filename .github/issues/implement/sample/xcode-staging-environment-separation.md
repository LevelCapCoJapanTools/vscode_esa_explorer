---
phase: design
screen_id: "なし（機能: Xcode環境分離設定）"
title: "[DESIGN] Xcodeプロジェクトの環境分離設定（Staging Build Configuration / Bundle ID / Scheme）"
labels: "design"
assignees: ""
---

# [DESIGN] Xcodeプロジェクトの環境分離設定（Staging Build Configuration / Bundle ID / Scheme）

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「ADR-005で確定済みの判断を、実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集・ADR新設は禁止）。
- 本Issueの対象は **SwiftUI画面/機能ではなくXcodeプロジェクト設定変更**（Build Configuration / xcconfig / Scheme）。View/ViewModel/Repository/DataSourceのアーキテクチャ設計は本Issueの対象外であり、`implementation-plan.md`テンプレートのうちアーキテクチャ関連章（5章のDI経路・シーケンス図・Protocol契約、6章のドメインモデル等）は「対象外（Xcodeプロジェクト設定変更のため、View/ViewModel/Repository層への影響なし）」と明記して省略してよい。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- **ADR-005の確定事項は変更不可**。本Issueはこれを実装可能な形に翻訳するだけであり、再検討・再提案は行わない（変更したい場合は新ADRが必要。ADR-005「決定事項の変更制約」参照）。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、ADR-005の決定事項をXcodeプロジェクトの具体的な変更計画（Build Configuration追加・xcconfig追加・Scheme追加・Scheme共有化）として実装Agentへ引き継ぐ
- 対象: 画面ではなく「機能: Xcode環境分離設定（Staging）」
- 要件参照先: `ADR-005-testflight-apple-ownership.md`、`ADR-001-environment-separation.md`、Issue #3、`docs/research/testflight-distribution-setup.md`

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

- `.github/copilot/00-index.md`
- `.github/copilot-instructions.md`
- `.github/copilot/10-requirements.md`
- `.github/copilot/20-architecture.md`
- `.github/copilot/50-security.md`
- `.github/copilot/80-templates/implementation-plan.md`（planテンプレート。本Issueではアーキテクチャ関連章は対象外として省略可）

### 2.2 前提ADR・前フェーズ成果物

| 参照元                                                                                                            | 内容                                                                                                                                           | 本Issueでの扱い                                    |
| ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| [ADR-005-testflight-apple-ownership.md](.github/copilot/70-adr/ADR-005-testflight-apple-ownership.md)             | **Accepted**。Staging用Apple資産の命名（Bundle ID/Display Name/SKU）、Production保留方針、build number単調増加ルールを確定                     | **確定事項としてそのまま使う。変更・再検討は禁止** |
| [ADR-004-testflight-internal-distribution.md](.github/copilot/70-adr/ADR-004-testflight-internal-distribution.md) | ADR-005にsupersededされた履歴ADR                                                                                                               | 参照のみ（現行判断はADR-005が正）                  |
| [ADR-001-environment-separation.md](.github/copilot/70-adr/ADR-001-environment-separation.md)                     | Demo/Staging/Productionの環境分離方針。「Demo配布用スキームのXcode設定手順」「CI/CDパイプラインの具体的な設定手順」はADR-001のスコープ外と明記 | 本Issueがその具体化を担う                          |
| [Issue #3: TestFlight配布手順の確立](https://github.com/LevelCapTech/milk-order-ios/issues/3)                     | RESEARCH Issue                                                                                                                                 | 前フェーズ成果物                                   |
| [docs/research/testflight-distribution-setup.md](docs/research/testflight-distribution-setup.md)                  | RESEARCH調査結果。5章「Designフェーズへの引き継ぎ事項」が本Issueの直接の入力                                                                   | 本Issueの論点（6章）の出典                         |

### 2.3 現在のXcodeプロジェクトの実態（調査済み事実。そのまま設計入力として使ってよい）

| 項目                        | 現状                                                                                                             | 根拠                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Build Configuration         | `Debug` / `Release` の2つのみ。`Staging` という名前のConfigurationは存在しない                                   | `MilkOrder.xcodeproj/project.pbxproj` |
| `PRODUCT_BUNDLE_IDENTIFIER` | 全ターゲット（App/Tests/UITests/+1）で `com.levelcap.MilkOrder` 系（`.stg`サフィックスなし）。Debug/Release共通  | `project.pbxproj:413,445` 等          |
| `DEVELOPMENT_TEAM`          | `CQ2PMS27D7`（全ターゲット共通）                                                                                 | `project.pbxproj:307,371,400,432`     |
| `CODE_SIGN_STYLE`           | `Automatic`                                                                                                      | `project.pbxproj:398,430`             |
| `GENERATE_INFOPLIST_FILE`   | `YES`（明示的な`Info.plist`ファイルはない）                                                                      | `project.pbxproj`                     |
| `.xcconfig` ファイル        | 存在しない                                                                                                       | リポジトリ確認                        |
| `.xcscheme` ファイル        | リポジトリ内に見つからない（`xcuserdata`配下の個人Schemeで運用されている可能性が高く、共有Scheme化されていない） | リポジトリ確認                        |

### 2.4 画面モック/仕様書

- なし（Xcodeプロジェクト設定のため対象外）

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/xcode-staging-environment-separation.md` を新規作成する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- Production用Bundle ID・App Store Connect appの作成（ADR-005により現時点で保留）
- CI/CD自動化（GitHub Actions workflow追加）の実装（ADR-005のスコープ外）
- 画面/機能のSwiftコード実装（View/ViewModel/Repository/DataSourceは本Issueに一切関与しない）
- App Store Connect・Apple Developer Portal上の実際の操作（人間が別途実施）

## 4. 確定済みADR（変更不可の前提）

> ADR-005の確定事項。本Issueはこれを変更する場所ではない。

| 環境       | Apple管理主体                                        | Bundle ID                    | Display Name        | SKU                 | 配布の標準経路         |
| ---------- | ---------------------------------------------------- | ---------------------------- | ------------------- | ------------------- | ---------------------- |
| Staging    | LevelCap                                             | `com.levelcap.MilkOrder.stg` | `MilkOrder Staging` | `milkorder-ios-stg` | TestFlight内部テスター |
| Production | 未決定（発注元企業の契約状況・運用主体確定後に決定） | 未作成                       | 未作成              | 未作成              | 本Issueのスコープ外    |

- Staging / Production は Bundle ID・App Store Connect app・APNs を共有しない
- `com.levelcap.MilkOrder` をProduction用として先行作成することは却下済み（ADR-005「検討した代替案」）。既存の`com.levelcap.MilkOrder`（Debug/Release）は現状維持し、Production確定済み資産として扱わない
- build number（`CFBundleVersion`）は配布対象appごとに全履歴で単調増加とし、過去の値へ戻さない
- CI/CD自動化はADR-005のスコープ外（手動運用が前提）

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている（アーキテクチャ関連章は対象外と明記）
2. Build Configuration構成（`Debug` / `Release` / `Staging`）と既存`Release`の扱い（変更しない）がplanに明記されている
3. `Staging.xcconfig`（または同等のbuild settings）の配置場所と設定内容（`PRODUCT_BUNDLE_IDENTIFIER` / 表示名等）がplanに確定している
4. `MilkOrder Staging` Schemeの追加方法と、既存Schemeを含めた共有Scheme化（`xcshareddata/xcschemes/`への移行）の方針がplanに明記されている
5. `ITSAppUsesNonExemptEncryption` の設定方法（`INFOPLIST_KEY_...` build setting追加 or 明示Info.plist化）がplanに確定している
6. build number運用ルール（ADR-005）を反映した実装手順がplanに明記されている
7. 変更後の検証方法（各Configurationでのビルド確認手順）がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 必須で決めること（planで結論を明記）

| 論点                             | 設計Agentへの指示                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build Configuration構成          | `Debug` / `Release` / `Staging` の3構成とし、既存`Debug`/`Release`の設定値（`com.levelcap.MilkOrder`等）は変更しないことをplanで明記する                                                                                                                                                                                                       |
| `Staging.xcconfig`の内容         | `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg` を含む設定値を確定し、配置パスを具体的に決める                                                                                                                                                                                                                                        |
| 表示名（Display Name）の反映方法 | ADR-005の`Display Name = MilkOrder Staging`をXcode上のどの設定（`PRODUCT_NAME` / `INFOPLIST_KEY_CFBundleDisplayName`等）で反映するかを、`GENERATE_INFOPLIST_FILE = YES`環境であることを踏まえて確定する                                                                                                                                        |
| Scheme追加                       | `MilkOrder Staging` Schemeを追加し、Run/Archiveアクションが`Staging` Configurationを使うように設定する手順を確定する                                                                                                                                                                                                                           |
| Scheme共有化                     | 既存Schemeが`xcuserdata`配下の個人Schemeのみで運用されている前提を確認し、`MilkOrder`・`MilkOrder Staging`の両Schemeを`xcshareddata/xcschemes/`へ共有化してリポジトリにコミットする方針を確定する                                                                                                                                              |
| `ITSAppUsesNonExemptEncryption`  | `GENERATE_INFOPLIST_FILE = YES`環境での設定方法（`INFOPLIST_KEY_ITSAppUsesNonExemptEncryption`追加 or 明示Info.plist化への切り替え）のトレードオフを整理し、結論を確定する。値そのもの（YES/NO）の業務判断は法務/運用責任者確認が前提のため、設定の「仕組み」を確定することが本Issueのゴールであり、値の最終確定はオープン課題として残してよい |
| build number運用                 | 現状`CURRENT_PROJECT_VERSION = 1`。ADR-005の単調増加ルールをどう実装手順（手動インクリメント運用）に落とすかを確定する                                                                                                                                                                                                                         |
| 既存設定への影響確認             | `Debug`/`Release` Configurationの既存動作（既存テスト・既存CI）に影響がないことを確認する手順をplanに明記する                                                                                                                                                                                                                                  |

### 6.2 非ゴール（明記）

- Production用Bundle ID・App Store Connect appの作成
- CI/CD自動化（GitHub Actions workflow追加）の実装
- 画面/機能のSwiftコード実装
- `ITSAppUsesNonExemptEncryption`の値（YES/NO）そのものの最終業務判断（法務/運用責任者確認待ち）

## 7. 検証方法（テスト設計の代替）

planには必ず次を明記する:

- 対象: 追加した`Staging` Build Configuration / Scheme
- 確認手順:
  - `Staging` Configurationでのビルドが成功すること（具体的なコマンドはplanで確定する。例: `xcodebuild build -scheme "MilkOrder Staging" -destination 'platform=iOS Simulator,name=iPhone 17'`）
  - 既存の `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`（Debug/Release）が引き続き成功すること（回帰確認）
  - `Staging` Schemeでのアーカイブ（`xcodebuild archive`）が実行可能であること（実際のApple側アップロードは本Issueのスコープ外）
- CI影響確認: `.github/copilot/60-ci-quality-gates.md` の既存品質ゲートに`Staging` Configurationを追加する必要があるかをplanのオープン課題に記載する

## 8. Done

- `.github/copilot/plans/xcode-staging-environment-separation.md` が新規作成されている
- 他のファイルに変更がない
- 6.1の論点すべてに結論が明記されている（TBDは`TBD（理由/決定条件/期限）`形式で許容するが、BLOCKERとなるTBDは0件）
- ADR-005と矛盾しない（Production用資産作成を含まない）
- プレースホルダーが残っていない

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
