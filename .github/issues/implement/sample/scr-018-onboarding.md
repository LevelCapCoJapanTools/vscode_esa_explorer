---
phase: design
screen_id: SCR-018（新規）
title: "[DESIGN] オンボーディング画面（初回起動時説明、SCR-018）"
labels: "design"
assignees: ""
---

# [DESIGN] オンボーディング画面（初回起動時説明、SCR-018）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
* 画面ID: **SCR-018**（新規画面。`.github/copilot/10-requirements.md` § 5 画面一覧には未掲載。本Issueの記載と添付モック画像を要件の正とする。一覧への追記自体は本Issueのスコープ外であり、別途行う）
* 要件参照先: 本Issue本文（下記の機能要件）および `.github/copilot/image/onboardingImage_1page.png`〜`onboardingImage_5page.png`（添付モック画像）
* 機能概要:
  * アプリ初期起動時に表示する、全5ページ構成の説明オンボーディング画面を新規作成する
  * ページ間は**横スライド（スワイプ）**で遷移する（モック画像下部に5点のページインジケーターが確認できる）
  * 各ページの内容は添付モック画像のとおり（下表）

    | ページ | 画像ファイル | 見出し | 概要 |
    | --- | --- | --- | --- |
    | 1 | `onboardingImage_1page.png` | 牛乳注文を、もっとカンタンに。 | アプリ全体の価値訴求。「注文はカンタン」「履歴でらくらく管理」「大切なお知らせ」の3ポイントをアイコンで紹介 |
    | 2 | `onboardingImage_2page.png` | 注文はスマホでカンタン操作 | 商品選択→数量入力→まとめて増減、の操作フローを画面スクリーンショット付きで紹介 |
    | 3 | `onboardingImage_3page.png` | 注文履歴でらくらく管理 | 過去の注文一覧・再注文・訂正が簡単に行えることを紹介 |
    | 4 | `onboardingImage_4page.png` | 大切なお知らせをすぐにお届け | 締切リマインド・配達情報の変更・注文確認・重要なお知らせのプッシュ通知を紹介 |
    | 5 | `onboardingImage_5page.png` | さあ、はじめましょう！ | まとめページ。**「さあ、はじめましょう」ボタン**を新規に配置し、押下でオンボーディングを完了させる |

  * 5ページ目の「さあ、はじめましょう」ボタン押下でオンボーディングを完了とし、既存の起動フロー（`MilkOrderApp.swift` の `currentUser` 判定によるログイン画面/メニュー画面分岐）へ進む
  * **表示制御**: 初回起動時のみ表示する。2回目以降の起動では表示しない。ただし「アプリ大規模更新時」は再度表示する
    * 再表示判定方法の提案（設計判断の出発点。最終手法は §5.2 トレードオフで確定すること）:
      * 案A: 表示済みBool値のみをローカル永続化し、大規模更新時の再表示はリリース作業者が明示的にフラグをリセットする運用で対応する（実装は単純だが運用負荷あり）
      * 案B: `CFBundleShortVersionString` のメジャーバージョン部分（例: `"2.0.0"` の `"2"`）を永続化し、起動時に現在のメジャーバージョンと比較、異なれば再表示する（運用負荷なしで自動判定できる）
      * 本Issueでは**案B**を推奨するが、比較表と最終採用案はplanの5.2に明記すること

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/instructions/**/*.instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/40-testing-strategy.md`
* `.github/copilot/50-security.md`
* `.github/copilot/60-ci-quality-gates.md`
* `.github/copilot/80-templates/implementation-plan.md`（planテンプレート、特に「11. 新規画面追加テンプレ」）

### 2.2 前フェーズ成果物（あれば）

* RESEARCH Issue: なし
* 関連ADR: なし
* 参考（既存の起動分岐ロジック。変更対象になる既存コードとして必ず確認すること）:
  * `MilkOrder/MilkOrderApp.swift`（`WindowGroup` 内で `environment.currentUser` の有無により `LoginView` / `MenuRootView` を分岐している。本機能はこの分岐の手前にOnboarding表示判定を追加する想定）
  * `MilkOrder/App/AppEnvironment.swift`（DI起点。永続化Repositoryを追加する場合はここに登録する）

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

* `.github/copilot/image/onboardingImage_1page.png`
* `.github/copilot/image/onboardingImage_2page.png`
* `.github/copilot/image/onboardingImage_3page.png`
* `.github/copilot/image/onboardingImage_4page.png`
* `.github/copilot/image/onboardingImage_5page.png`
* 補足: 5ページ目の画像には「さあ、はじめましょう」ボタンは描かれていない（見出しテキストのみ）。ボタン自体は本Issueの要件に基づき新規にUIへ追加する（モックにない要素のため、配置・スタイルは既存画面のプライマリボタンの見た目に合わせて設計すること）

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-018-onboarding.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装
* Firebase/外部APIの実際の接続・設定変更
* Staging/Production 環境の設定変更
* `.github/copilot/10-requirements.md` § 5 画面一覧へのSCR-018追記（別作業とする）
* オンボーディング内容の動的配信（Remote Config等によるA/Bテストや文言切替）
* ログイン後（SCR-001以降）の既存画面遷移ロジックの変更（Onboarding完了後に既存ロジックへそのまま接続するのみ）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ | 配置先 | 責務 | 禁止依存 |
| --- | --- | --- | --- |
| View（SwiftUI） | `MilkOrder/Views/` | 表示のみ | Repository/DataSource を直接 import しない |
| ViewModel | `MilkOrder/ViewModels/` | 状態管理・UIロジック | DataSource具象を直接 import しない |
| Repository（Protocol） | `MilkOrder/Repositories/` | データアクセス抽象 | 具象実装を含めない |
| DataSource | `MilkOrder/Infrastructure/` | Firebase/外部API具象実装 | View/ViewModel を import しない |
| Model/Entity | `MilkOrder/Models/` | データ構造（struct/enum） | 他レイヤに依存しない |

### 4.2 DI方針

* DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
  * `.live()` factory: Firebase実装を注入（Staging/Production共通、plistで切り替え）
  * `.preview()` factory: Mock実装のみを注入（`#Preview` / Demo専用）
* View/ViewModelはProtocolに依存し、具象型を直接importしない
* オンボーディング表示済みフラグの永続化（UserDefaults等）も、他Repositoryと同様にProtocol越しにアクセスする（View/ViewModelからUserDefaultsへ直接アクセスしない）。Protocol名・配置先・Mock実装の方針はplanで確定すること

### 4.3 Firebase命名規則

| サービス | Protocol名 | 具象実装名 | 配置先 |
| --- | --- | --- | --- |
| Firebase Auth | `AuthRepository` | `FirebaseAuthRepository` | `MilkOrder/Infrastructure/Auth/` |
| Firestore | `{Domain}Repository` | `Firestore{Domain}Repository` | `MilkOrder/Infrastructure/{Domain}/` |
| Firebase Storage | `OutputRepository` | `FirebaseOutputRepository` | `MilkOrder/Infrastructure/Output/` |

* 本機能はFirebase接続を必要としない（ローカル永続化のみ）。上記命名規則は他Repositoryとの一貫性確認用の参考情報であり、本機能のRepositoryには適用しない（Firebase命名規則の対象外であることをplanに明記すること）

### 4.4 環境分離

| 環境 | Build Configuration | データソース |
| --- | --- | --- |
| Demo（`#Preview`） | Debug | MockRepository（Firebase未接続） |
| Staging | Staging | `Firestore{Domain}Repository` 等 |
| Production | Release | `Firestore{Domain}Repository` 等 |

* オンボーディング表示済みフラグはローカル永続化のため、Staging/Productionでも同じ具象実装（例: UserDefaultsベース）を使用してよい。Mock実装は `#Preview` / Unit Test専用とすること

### 4.5 非同期処理

* `async/await` を使用し、コールバックベースを避ける
* `@MainActor` を ViewModel に付与し、UI更新の安全性を保証する
* ネットワーク/DB処理はbackgroundで実行し、MainスレッドをBlockしない（本機能はローカル永続化のみのため同期的なI/Oでも許容されるか、async/awaitで統一するかをplanで判断すること）

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. View/ViewModel/Repository/DataSource の責務分離がplanに明記されている
3. Protocol定義・DI経路（`AppEnvironment → ViewModel → View`）がplanに明記されている
4. テスト計画（XCTest / XCUITest）がplanに明記されている
5. CI品質ゲート（build / swiftlint --strict / test / swift package audit）の実行計画がplanに明記されている
6. オンボーディング表示済みフラグの永続化方式と、「アプリ大規模更新時」に再表示するための判定ロジック（§1のA/B比較を含む）がplanに具体的に確定している
7. `MilkOrderApp.swift` の既存起動分岐（`currentUser` 判定によるLoginView/MenuRootView切替）にOnboarding表示判定をどう組み込むかがplanに明記されている

## 6. 品質ゲート（planに必ず記載する項目）

* `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `lint`: `swiftlint lint --strict`
* `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `security`: `swift package audit`
* planにDI経路が `AppEnvironment → ViewModel → View` で固定されていること
* planにProtocol/具象の境界がテスト可能な受入条件で固定されていること
* planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 7. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: どのViewModel/Repository/DataSourceをテストするか（一覧）
* 方式: Unit（XCTest） / UIテスト（XCUITest）のどれで守るか
  * UIテストでは「全5ページのスワイプ」「5ページ目のボタン押下で完了する」「2回目起動時に表示されない」「メジャーアップデート相当の状態で再表示される」を最低限カバーすること
* ケース: 正常系/例外系/境界値（最低ライン）
* モック方針: Protocol + Mock実装の配置先（`MilkOrderTests/Mocks/`）、共通ヘルパ
* 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 8. Done

* `.github/copilot/plans/scr-018-onboarding.md` が新規作成されている
* 他のファイルに変更がない
* planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
* SSOTと矛盾がない

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
