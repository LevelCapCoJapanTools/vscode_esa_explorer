---
phase: research
screen_id: 機能
title: "[RESEARCH] TestFlight配布手順の確立（証明書・App Store Connect・ビルドアップロード・テスター招待）"
labels: "research"
assignees: ""
---

# [RESEARCH] TestFlight配布手順の確立（証明書・App Store Connect・ビルドアップロード・テスター招待）

## 0. AI Agent 契約（最初に読む）

- あなたは **AI調査Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **コード変更は禁止**。成果物はドキュメント（`docs/research/` または Issue/PRコメント）に限定する。
- **入力不足/矛盾** がある場合、調査を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- 調査結論は ADR または Requirements への昇格候補を必ず明記する（Designフェーズへの引き渡しが目的）。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/research.md`** を使用すること。

## 1. 調査目的

- **解消したい不確実性**: Apple Developer Program との契約は完了済みだが、TestFlight でアプリを配布するために Apple Developer Portal / App Store Connect 側で何を設定し、どの手順でビルドをアップロードし、どうテスターを招待すればよいかが確定していない。配布を急ぐ必要があるため、抜け漏れのない最短手順を確定させたい。
- **この調査がなければ何が決められないか**: 証明書・プロビジョニングプロファイルの作成方針、App Store Connect 上のアプリ登録手順、ビルドのアーカイブ＆アップロード手順（手動 / CI 自動化）、テスター招待フロー、Beta App Review の要否とリードタイムが確定せず、TestFlight 配布に着手できない。
- **Designフェーズで必要な結論の形**: 実行者がそのまま画面操作・コマンド実行できる「TestFlight配布手順書」（`docs/research/testflight-distribution-setup.md`）。手順は時系列（証明書発行 → App登録 → アーカイブ → アップロード → テスター招待 → 審査）で並び、各ステップの所要時間・前提条件・詰まりやすい点を明記する。

## 2. 入力（SSOT参照セット）

### 2.1 前提ドキュメント（必須）

- `.github/copilot/00-index.md`
- `.github/copilot-instructions.md`
- `.github/copilot/10-requirements.md`
- `.github/copilot/20-architecture.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/50-security.md`

### 2.2 関連Issue/ADR

- [ADR-001: 環境分離（Demo / Staging / Production）](.github/copilot/70-adr/ADR-001-environment-separation.md) — 「Demo 配布用スキームの Xcode 設定手順」「CI/CD パイプラインの具体的な設定手順」は本ADRのスコープ外と明記されており、本調査で扱う
- [docs/research/firebase-ios-integration-setup.md](docs/research/firebase-ios-integration-setup.md) — Team ID（`CQ2PMS27D7`）は確認済み。Staging / Production の App Store ID は「未確認」のまま残っている
- 現状のXcodeプロジェクト設定（確認済みの既存値、調査の前提として使用可）:
  - `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder`（`MilkOrder.xcodeproj/project.pbxproj`）
  - `DEVELOPMENT_TEAM = CQ2PMS27D7`
  - `CODE_SIGN_STYLE = Automatic`
  - Apple Developer Program 契約: 完了済み（本Issue起票時点でユーザーより確認済み）
  - `.xcconfig` ファイル・GitHub Actions 上のビルド/配布ワークフローは現時点で未整備（`.github/workflows/` に存在しない）

## 3. スコープ / 非ゴール

### In Scope

- Apple Developer Portal での証明書（Distribution Certificate 等）・App ID（Bundle ID `com.levelcap.MilkOrder` の明示登録要否を含む）・プロビジョニングプロファイルの作成手順、および `CODE_SIGN_STYLE = Automatic` の現設定でどこまで自動化されるか
- App Store Connect 上の新規アプリ登録手順（必須入力項目: SKU、プライバシー情報、輸出コンプライアンス等）
- ビルドのアーカイブ＆アップロード手順（Xcode Organizer 経由の手動手順を主軸に、`xcodebuild archive` + `xcrun altool`/`notarytool` 等 CLI 経由の手順と、GitHub Actions での自動化可否・必要な Secrets の概要）
- TestFlight テスター招待フロー（内部テスター・外部テスターそれぞれの上限・グループ作成・招待方法の違い）
- Beta App Review の要否（内部 / 外部それぞれ）とリードタイムの目安
- Export Compliance（暗号化使用に関する申告）への回答方針と、`Info.plist` 事前設定による質問省略の可否
- TestFlight 再アップロード時のビルド番号（`CFBundleVersion`）運用ルール
- 上記を踏まえた「配布を急ぐ場合」の最短リードタイム見積もり

### Out of Scope

- コード変更（調査フェーズではコード修正を行わない）
- 設計決定（調査結論を受けて `[DESIGN]` フェーズで実施する）
- 実装（CI/CDワークフローの実装、xcconfig・署名自動化の実装は `[IMPLEMENT]` フェーズで実施する）
- 正式な App Store 公開審査（App Review）の手順（本Issueは TestFlight 配布が目的であり、本番公開審査は対象外）
- Android／その他プラットフォームの配布手順

## 4. 調査観点

> **この表が埋まっていない場合は調査開始禁止**。

| No. | 調査観点                                                                                                                                                                                                                                                                                        | 期待する答えの形                                               | 優先度（高/中/低） |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------ |
| 1   | Apple Developer Portal での Distribution Certificate・App ID（`com.levelcap.MilkOrder`）・Provisioning Profile の作成手順。`CODE_SIGN_STYLE = Automatic` のままで Xcode が自動処理する範囲と、手動操作が必要な範囲の境界                                                                        | コンソール操作手順＋Xcode操作手順のチェックリスト              | 高                 |
| 2   | App Store Connect で新規アプリを登録する手順と必須入力項目（Bundle ID紐付け、SKU、プライバシー情報「データ収集」の回答、輸出コンプライアンス事前申告の可否）                                                                                                                                    | 入力項目一覧（項目名・必須/任意・想定される回答方針）          | 高                 |
| 3   | ビルドのアーカイブ＆アップロード手順。(a) Xcode Organizer から手動アップロードする最短手順、(b) `xcodebuild archive` + `xcrun altool`/`notarytool` 等CLI経由でアップロードする手順、(c) GitHub Actions 上でこれを自動化する場合に必要な Secrets（証明書・プロファイルのbase64化等）の種類と概要 | 手順比較表（手順内容・所要時間・前提条件）＋CI自動化の可否判定 | 高                 |
| 4   | TestFlight テスター招待フロー。内部テスター（App Store Connect ユーザー、上限）と外部テスター（メール／公開リンク、グループ作成、上限1万人等）の違いと招待手順                                                                                                                                  | 内部/外部の比較表＋招待操作手順                                | 高                 |
| 5   | Beta App Review の要否。内部テスター配布時は審査不要か、外部テスター配布時の審査要否、初回ビルドと差分ビルドでリードタイムがどう変わるか                                                                                                                                                        | 要否表（内部/外部 × 初回/差分）＋リードタイム目安              | 高                 |
| 6   | Export Compliance（暗号化使用）の申告。毎ビルドアップロード時に聞かれる質問の内容と、`Info.plist` に `ITSAppUsesNonExemptEncryption` を事前設定した場合に質問が省略されるか                                                                                                                     | 申告フロー説明＋Info.plist設定例                               | 中                 |
| 7   | TestFlight 再アップロード時の `CFBundleVersion`（ビルド番号）運用ルール（同一 `CFBundleShortVersionString` 内でのビルド番号重複不可への対処方針）                                                                                                                                               | 運用ルール（手動採番／自動採番のどちらが妥当か）の提案         | 中                 |
| 8   | 上記すべてを踏まえた「最短で配布を完了させる」ための実行順序とトータルリードタイム見積もり（特に初回 Beta App Review 待ち時間がボトルネックになるか）                                                                                                                                           | タイムライン形式の見積もり＋ボトルネックの明記                 | 高                 |

## 5. 成果物

- 調査結果を `docs/research/testflight-distribution-setup.md` にまとめ、PRを作成する（コード変更なし）
- 成果物はそのまま実行者が画面操作・コマンド実行できる「手順書」形式とする（時系列の章立て、各ステップに前提条件・所要時間・詰まりやすい点を明記）
- **結論**には以下を必ず含める:
  - 各調査観点（No.1〜8）への回答
  - ADR昇格候補（`.github/copilot/70-adr/`）または Requirements更新候補（`.github/copilot/10-requirements.md`）の明記
    - 候補: ADR-001 の補足（Demo/TestFlight 配布スキームの設定方針）、または新規 ADR（配布・署名・CI Secrets 管理方針）
  - Designフェーズへの引き継ぎ事項（特に CI 自動化するか手動運用に留めるかの判断材料、ビルド番号運用方針の確定）

## 6. 必読（規約）

- `.github/copilot-instructions.md`
- `.github/copilot/50-security.md`（Secrets/PIIを調査ドキュメントに含めない。証明書の秘密鍵・プロビジョニングプロファイルの実体・App Store Connect API Key等の値は成果物に記載しない）

## 7. Done（必須）

- 調査観点4章の全項目（No.1〜8）に回答がある
- 結論が `[DESIGN]` フェーズへ引き継げる形でまとめられている
- ADR/Requirements昇格候補が明記されている
- コード変更が一切ない
- Secrets/PIIが成果物ドキュメントに含まれていない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 調査開始前に不足がある場合のみ使用。

- なし（Apple Developer Program 契約済み、Bundle ID / Team ID とも確認済みのため、調査開始に必要な入力は揃っている）

---

## 補足（調査Agent向け背景情報）

- 配布を急ぐ背景があるため、調査観点の優先度「高」（No.1〜5, 8）を先に固め、「中」（No.6, 7）は最短経路の補足情報として後追いでまとめてよい。
- 本調査はあくまで**手順の確定**が目的であり、CI/CD自動化の実装そのものは行わない。手動手順で初回配布を完了させる経路と、将来CI化する場合の差分の両方を明記すること。
- Staging / Production を別 Firebase プロジェクト・別 iOS app registration として分離する方針（ADR-001、firebase-ios-integration-setup.md）を踏まえ、TestFlight配布対象がどの環境のビルドになるか（Staging想定）を明記すること。
