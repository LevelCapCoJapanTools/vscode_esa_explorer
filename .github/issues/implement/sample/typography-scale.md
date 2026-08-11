---
phase: design
screen_id: なし（全画面共通機能）
title: "[DESIGN] アプリ全体のフォントサイズ調整（高齢ユーザー想定のタイポグラフィスケール導入）"
labels: "design"
assignees: ""
---

# [DESIGN] アプリ全体のフォントサイズ調整（高齢ユーザー想定のタイポグラフィスケール導入）

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメント（`typography-scale.md`）を作成し、実装Agentへ漏れなく引き継ぐ。
- 機能: アプリ全体で使用するフォントサイズ（本文・見出し・ボタンラベル・補足文字等）を、想定利用者層に配慮した値へ統一的に引き上げる。
- 画面ID: なし（全画面共通のタイポグラフィ基盤を新設する横断的機能設計）。
- 要件参照先: なし（既存SSOT `.github/copilot/10-requirements.md` 等にフォントサイズの規定は存在しない。§2.4 のユーザー提供リサーチを根拠情報として用いる）。

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

- `.github/copilot/00-index.md`
- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/copilot/10-requirements.md`
- `.github/copilot/20-architecture.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/40-testing-strategy.md`
- `.github/copilot/50-security.md`
- `.github/copilot/60-ci-quality-gates.md`
- `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前フェーズ成果物（あれば）

- RESEARCH Issue: なし
- 関連ADR: なし
- 関連する既存plan（フォントを使用している全画面。本Issueでの値導入後、各画面plan側の更新が必要かどうかも §6.2 で判断すること）:

| plan ファイル                                                                                | 対応画面                        |
| -------------------------------------------------------------------------------------------- | ------------------------------- |
| `.github/copilot/plans/scr-001-login.md`                                                     | SCR-001 ログイン画面            |
| `.github/copilot/plans/scr-002-menu.md`                                                      | SCR-002 メニュー画面            |
| `.github/copilot/plans/scr-003-order-input.md`                                               | SCR-003 注文入力画面            |
| `.github/copilot/plans/scr-003-correction-delta.md`                                          | SCR-003 訂正モード差分          |
| `.github/copilot/plans/scr-004-order-confirmation.md`                                        | SCR-004 注文確認画面            |
| `.github/copilot/plans/scr-005-order-complete.md`                                            | SCR-005 注文完了画面            |
| `.github/copilot/plans/scr-006-order-history.md`                                             | SCR-006 購入履歴画面            |
| `.github/copilot/plans/scr-007-order-detail.md` / `scr-007-order-detail-ios-architecture.md` | SCR-007 注文詳細画面            |
| `.github/copilot/plans/scr-016-announcements.md`                                             | SCR-016 お知らせ画面            |
| `.github/copilot/plans/order-correction-flow.md`                                             | 注文訂正フロー（SCR-CO-01〜04） |

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

- なし

### 2.4 参考リサーチ（仕様追加は禁止・根拠情報としてのみ参照可）

ユーザーから提供された調査資料の要点（出典: ユーザー提供のリサーチレポート。原資料は提供時点で文字エンコードが破損しており本文の逐語引用はできないため、数値・表構造として判読できた部分のみを転記する。設計Agentはこれを統計的事実ではなく「設計判断の根拠として扱ってよい推定値」として扱うこと）:

- 想定利用者（幼稚園・保育園の園長等の管理職）について、当該職層が高年齢層に偏る傾向があること、老視（プレスビオピア）は40歳前後から自覚が増え50歳代でほぼ進行が止まるという医学的知見があることを根拠に、**40代後半〜60代を中心とした老視対応が必要な層**と想定する。
- WCAG / JIS X 8341-3 のコントラスト基準: 通常テキストは **4.5:1以上**、大きな文字（18pt以上の通常文字、または14pt以上の太字。CSS換算で概ね24px以上の通常文字／18.5px以上の太字）は **3:1以上**。
- 老視層のスマートフォン可読性に関する研究では **8〜12pt（概ね10.7〜16px）** が読みやすさの目安とされ、本文を **16px未満にしない** ことが望ましいとされる。
- リサーチが示す推奨プロファイル（標準モード）: **本文18px・見出し22px・重要見出し24px・ボタンラベル18px・行間1.6・コントラスト通常4.5:1以上/重要情報7:1推奨**。
- リサーチが示す用途別推奨値:

| 用途                           | 推奨値                                                               |
| ------------------------------ | -------------------------------------------------------------------- |
| 本文                           | 18px / line-height 1.6                                               |
| 補足文字（日付・注記・脚注）   | 16px / line-height 1.5（16px未満は避ける）                           |
| 見出し                         | 22px                                                                 |
| 重要見出し（緊急通知・締切等） | 24px                                                                 |
| ボタンラベル                   | 18px                                                                 |
| 危険/重要CTA                   | 19〜20px 太字相当                                                    |
| フォームラベル                 | 18px                                                                 |
| プレースホルダ文字             | 16px以上                                                             |
| コントラスト                   | 通常4.5:1以上、重要情報は7:1推奨                                     |
| 文字拡大対応                   | OSの文字サイズ変更（Dynamic Type）に追従し、固定pxのみの実装を避ける |

- リサーチは「標準/大/特大」の3段階プロファイル（60代中心・屋外利用・疲労時等に応じて拡大する案）も提案しているが、本Issueでは **「標準」プロファイルのみを新基準として採用** し、3段階切替UIはスコープ外とする（§3 非ゴール参照）。
- 年齢層の全国統計値（平均年齢・年代別割合・女性比率の確定値）は公開統計から直接抽出できておらず、リサーチ内でも未確定（推定値）と明記されている。本Issueの設計判断はこの推定値を妥当な前提として採用するが、確定統計ではないことを明記すること。

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/typography-scale.md` を新規作成する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- コード実装そのもの（本Issueはplan作成のみ。実装は別のIMPLEMENT Issueで行う）
- アプリ内でユーザーが「標準/大/特大」を切り替えるUI機能の実装（リサーチが示す3段階プロファイルのうち「標準」のみを新基準として採用する。OSのDynamic Type設定による拡大表示への追従は対象に含めるが、アプリ内切替UIの実装は対象外）
- 既存の配色そのものの変更（コントラスト比の確認はゴールに含めるが、配色変更が必要と判明した場合は別Issue化する）
- 関連Issue「SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更」「SCR-003 注文入力画面 — 数量入力ボタンのタップターゲットサイズ統一」が定義する個別コンポーネントの挙動変更（本Issueはフォントサイズの値とその提供方法のみを定義し、両Issueはここで定義する値を参照する）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 配置・影響範囲

本機能は **View層のみが参照する静的なフォント定義** であり、ViewModel / Repository / DataSource / Model への影響はない。既存のレイヤ構造・DI経路（`AppEnvironment` 等）に変更を加えないこと。

| レイヤ               | 配置先（想定）                                                    | 責務                                               | 禁止依存                                                               |
| -------------------- | ----------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| DesignSystem（新設） | `MilkOrder/DesignSystem/`（ディレクトリ新設の是非は §6.2 で判断） | フォントサイズ・行間等のセマンティックトークン定義 | View以外のレイヤから参照されない（ViewModel/Repository等は依存しない） |
| View（SwiftUI）      | `MilkOrder/Features/**/*View.swift`                               | 上記トークンを `.font(...)` 等で参照する           | Repository/DataSource を直接 import しない（既存方針を変更しない）     |

### 4.2 DI方針

- 本機能はDIを必要としない（静的な定数/Font extensionとして提供する想定）。DI起点 `AppEnvironment` への変更は不要。

### 4.3 Dynamic Type 対応方針

- 固定pxのみの `.font(.system(size: 18))` ではなく、`UIFontMetrics` のスケーリングまたは `@ScaledMetric` 等、OSの文字サイズ設定（Dynamic Type）に追従できる実装方式をplanで決定すること。

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている。
2. フォントサイズの新基準（本文18px・見出し22px・重要見出し24px・ボタンラベル18px・補足文字16px、各々の行間を含む）がplanに明記されている。
3. 新基準を一元管理する手段（例: `Font` extension によるセマンティックトークン定義）がplanで設計されている。
4. OSのDynamic Type（文字サイズ変更設定）に追従する実装方針がplanに明記されている。
5. 対象画面一覧（§6.2 参照）と、各画面で変更が必要な `.font(...)` 箇所の洗い出し方法・移行方針がplanに記載されている（網羅リストの作成自体は本Issueの成果物に含めなくてよい）。
6. 既存の各画面planとの関係（本Issueが定義する値を画面plan側が参照する必要があるか、トークン経由で実装側のみが対応すれば画面plan更新が不要か）がplanで明確化されている。
7. コントラスト比（4.5:1 / 重要情報7:1）の確認方法・対象範囲がplanに明記されている。
8. テスト計画（XCTest、必要であればDynamic Type表示確認の手動確認手順）がplanに明記されている。
9. CI品質ゲートの実行計画がplanに明記されている。

## 6. 設計スコープと設計上の論点

### 6.1 機能の背景

| 情報源        | 内容                                                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| ユーザー要望  | 想定利用者層（幼稚園・保育園の園長等）の可読性向上のため、アプリ全体のフォントサイズを引き上げたい                                                |
| 根拠          | §2.4 参考リサーチ                                                                                                                                 |
| 既存の関連NFR | `scr-003-order-input.md` NFR-01（タップターゲット44×44pt）はタップ領域の基準であり、フォントサイズとは独立した基準として扱う。本Issueは矛盾しない |

### 6.2 設計上の論点（設計Agentが判断・決定すること）

| 論点                                     | 検討事項                                                                                                                                                                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 実装方式                                 | semantic font token（例: `Font` extension で `.appBody` / `.appHeading` / `.appButtonLabel` 等を定義）を新設し、各Viewの `.font(.body)` 等のSwiftUI標準セマンティックフォント指定を置き換える方式が候補。固定pxのみではなく `UIFontMetrics` 等でDynamic Typeに追従できる実装を採用すること                          |
| 配置先                                   | `MilkOrder/DesignSystem/Typography.swift`（新規ディレクトリ `DesignSystem/` を作成してよいか、既存ディレクトリ構造（`Features/` 配下にViewModel/Viewが並ぶ構成）との整合を確認し、plan内で配置理由を明記すること）                                                                                                  |
| 既存セマンティックフォントとのマッピング | 現状コードは `.font(.body)`, `.font(.caption)`, `.font(.caption2)`, `.font(.subheadline)`, `.font(.headline)`, `.font(.title2)`, `.font(.title3)` 等のSwiftUI標準スタイルを使用している。これらと新トークンの対応表（1:1マッピング）をplanに含めること                                                              |
| 対象範囲                                 | `MilkOrder/Features/**/*View.swift` 全体が対象（下表「対象画面一覧」参照）。`#Preview` 内の使用も含む                                                                                                                                                                                                               |
| 移行の網羅性確認方法                     | `grep -rn "\.font(" MilkOrder/Features` 等で置換対象を洗い出す手順をplanに明記すること（本Issueでは網羅リストの作成までは不要）                                                                                                                                                                                     |
| コントラスト確認                         | `.foregroundStyle(.secondary)` / `.tertiary` 使用箇所が4.5:1（重要情報は7:1）を満たすか確認する方法（目視確認 + 既存配色のコントラスト計算）をplanに明記すること                                                                                                                                                    |
| 既存固定値との関係                       | `scr-003-order-input.md` NFR-01（44×44ptタップ領域）には影響しない。タップ領域とフォントサイズは独立した基準として扱う                                                                                                                                                                                              |
| 関連Issueとの関係                        | 「SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更」「SCR-003 注文入力画面 — 数量入力ボタンのタップターゲットサイズ統一」は本Issueが定義するトークン（例: 補足文字16px相当, ボタンラベル18px相当）を利用する想定。本Issueのplanで定義したトークン名を明記し、後続Issueから参照可能にすること |
| 各画面planの更新要否                     | 本Issueの成果物（`typography-scale.md`）のみで実装可能とするか、各画面plan（上記10ファイル）にも個別の参照追記が必要かを判断し、plan内に方針を明記すること                                                                                                                                                          |

### 6.3 対象画面一覧（参考情報）

| 画面 / 機能 | 主なView                                                                               | 画面ID        |
| ----------- | -------------------------------------------------------------------------------------- | ------------- |
| ログイン    | `LoginView.swift`                                                                      | SCR-001       |
| メニュー    | `MenuView.swift`                                                                       | SCR-002       |
| 注文入力    | `OrderInputView.swift`, `ProductRowView.swift`                                         | SCR-003       |
| 注文確認    | `OrderConfirmationView.swift`                                                          | SCR-004       |
| 注文完了    | `OrderCompleteView.swift`                                                              | SCR-005       |
| 注文訂正    | `OrderCorrectionSelectionView.swift`                                                   | SCR-CO-01〜04 |
| 購入履歴    | `OrderHistoryView.swift`                                                               | SCR-006       |
| 注文詳細    | `OrderDetailView.swift`                                                                | SCR-007       |
| お知らせ    | `AnnouncementsView.swift`, `AnnouncementDetailView.swift`, `AnnouncementRowView.swift` | SCR-016       |
| 共通        | `PlaceholderView.swift`                                                                | —             |

### 6.4 関連Issue（参考情報・参照義務なし）

- [DESIGN] SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更 [#27](https://github.com/LevelCapTech/milk-order-ios/issues/27)
- [DESIGN] SCR-003 注文入力画面 — 数量入力ボタンのタップターゲットサイズ統一（メイン＋クイック操作） [#26](https://github.com/LevelCapTech/milk-order-ios/issues/26)（本Issueが定義するボタンラベル/アイコンの文字サイズトークンを参照する）

## 7. 品質ゲート（planに必ず記載する項目）

- `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `lint`: `swiftlint lint --strict`
- `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `security`: `swift package audit`
- 本機能はView層のみの変更であり、DI経路（`AppEnvironment → ViewModel → View`）・Protocol境界に影響がないことをplanに明記すること
- planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

- 対象: 新設するタイポグラフィトークン定義モジュール（フォントサイズ定数が期待値であることの検証）、主要画面の `#Preview` がFirebaseなしで動作すること
- 方式: Unit（XCTest）。Dynamic Type表示確認はUIテストまたは手動確認手順としてplanに明記する（自動UIテスト化はTBDとしてよい）
- ケース: 標準サイズでの表示、OSの文字サイズ拡大設定時に表示崩れ（テキストの重なり・クリッピング）がないことの確認手順
- モック方針: 該当なし（Repositoryを伴わない）
- 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. Done

- `.github/copilot/plans/typography-scale.md` が新規作成されている
- 他のファイルに変更がない
- §6.2 の全論点に設計判断が記載されている
- §6.3 の全画面の移行方針（個別画面plan更新が必要かどうかを含む）が記載されている
- Dynamic Type追従方針が明記されている
- コントラスト確認方法が明記されている
- planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
- TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
- SSOTと矛盾がない

## 10. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
