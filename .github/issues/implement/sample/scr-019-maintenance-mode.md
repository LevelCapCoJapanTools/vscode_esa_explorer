---
phase: design
screen_id: SCR-019（新規）
title: "[DESIGN] システムメンテナンス画面（SCR-019）"
labels: "design"
assignees: ""
---

# [DESIGN] システムメンテナンス画面（SCR-019）

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
- 画面ID: **SCR-019**（新規画面。`.github/copilot/10-requirements.md` § 5 画面一覧には未掲載。本Issueの記載を要件の正とする。一覧への追記自体は本Issueのスコープ外であり、別途行う）
- 要件参照先: 本Issue本文（下記の機能要件）
- 機能概要:
  - システムメンテナンス（計画メンテナンスまたは緊急メンテナンス）中、**全利用者区分（注文入力者・運用側担当者・管理者）** に対して通常のアプリ機能を提供せず、メンテナンス中であることを伝える専用画面のみを表示する
  - 表示タイミング:
    - **未ログイン時**: アプリ起動直後にメンテナンス判定を行い、メンテナンス中であればログイン画面を表示せず本画面を表示する
    - **ログイン後（利用中）**: メンテナンス状態をリアルタイムに監視し、利用中にメンテナンスが開始された場合は即座に本画面へ遷移し、それ以上の操作（注文入力・確定・運用側操作等）をブロックする
  - 画面表示内容:
    - メンテナンス中である旨の固定メッセージ（Firestore側で任意のメッセージ文面に上書き可能とする）
    - メンテナンス終了予定時刻（設定されていれば表示。未設定の場合は「終了時刻は未定です」等の代替文言を表示する）
    - 再確認ボタン（手動でメンテナンス状態を再取得し、終了していれば通常画面へ復帰する）
    - ログアウト等、通常画面へ遷移しうる操作は表示しない
  - メンテナンス状態の取得元: Firestoreに新設するメンテナンス状態ドキュメント（例: `system/maintenanceStatus`、1ドキュメント想定）。フィールド構成案: `isEnabled: Bool` / `message: String?` / `endAt: Timestamp?` / `updatedAt: Timestamp`。最終的なコレクション名・フィールド名・型はplanで確定すること
  - 管理者によるメンテナンスON/OFF切替UI（書き込み側）は本Issueのスコープ外（別Issueで検討。当面はFirebaseコンソールでの直接編集、将来的に管理メニュー（SCR-014）または `admin/` React管理画面からの操作を想定）

  ### 設計判断が必要な論点（plan内で明確化すること）
  - **論点A: 状態取得方式** — Firestoreのリアルタイムリスナー（snapshot listener）で常時監視するか、起動時/手動再確認時のみ単発取得するかを確定する。推奨: リアルタイムリスナー（利用中に保守が始まっても即座に遮断できるため）。ただし採用案と理由をplanに明記すること
  - **論点B: 管理者バイパスの有無** — 動作確認等のため、管理者ロールのみメンテナンス中でも通常画面へアクセスできる「バイパス」を許容するか。許容しない場合は管理者も同じ制約を受ける。最終採用案と理由をplanに明記すること
  - **論点C: 未認証状態でのFirestore読み取り** — 未ログイン利用者にも本画面を表示するには、ログイン前にメンテナンス状態ドキュメントを読み取れる必要がある。`.github/copilot/50-security.md`の「Firestore Security Rulesでコレクション単位のアクセス制御を行う」という原則と整合させつつ、当該ドキュメントのみ未認証でも読み取り専用アクセスを許可するSecurity Rules設計方針をplanに明記すること（書き込みは常に拒否）
  - **論点D: 起動時の判定順序** — `MilkOrderApp.swift` の既存起動分岐（`currentUser` 判定によるログイン画面/メニュー画面の分岐）に対し、メンテナンス判定をどの順序で評価するかを確定する。メンテナンス判定は他のあらゆる起動時判定（ログイン状態判定等）より先に評価し、メンテナンス中であれば他の判定をスキップして本画面を表示することをplanに明記すること
  - **論点E: ログイン後にメンテナンスが開始した場合の未保存データの扱い** — 注文入力中など編集中データがある状態でメンテナンスへ遷移する場合の挙動（破棄して警告表示する／ローカルに保持し再開可能にする）を確定する。MVPでは「破棄し、遷移前に警告を表示しない簡易仕様（即時遷移）」を推奨するが、採用案と理由をplanに明記すること

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
- `.github/copilot/80-templates/implementation-plan.md`（planテンプレート、特に「11. 新規画面追加テンプレ」）

### 2.2 前フェーズ成果物（あれば）

- RESEARCH Issue: なし
- 関連ADR: なし
- 参考（既存の起動分岐ロジック。変更対象になる既存コードとして必ず確認すること）:
  - `MilkOrder/MilkOrderApp.swift`（`WindowGroup` 内で `environment.currentUser` の有無により `LoginView` / `MenuRootView` を分岐している。本機能はこの分岐よりも手前でメンテナンス判定を行う想定）
  - `MilkOrder/App/AppEnvironment.swift`（DI起点。新規Repositoryを追加する場合はここに登録する）

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

- なし。本Issue §1の記載内容と既存画面（`LoginView`等）のビジュアルトーンを基準に設計する

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/scr-019-maintenance-mode.md` を新規作成する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- コード実装
- Firebase/外部APIの実際の接続・設定変更（Firestoreドキュメント作成・Security Rulesの実適用を含む）
- Staging/Production 環境の設定変更
- `.github/copilot/10-requirements.md` § 5 画面一覧へのSCR-019追記（別作業とする）
- メンテナンスON/OFF切替UI（管理者側の操作画面。別Issueで検討）
- メンテナンス開始/終了に伴うプッシュ通知・メール通知の配信（SCR-013通知設定との連携は対象外）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ                 | 配置先                      | 責務                      | 禁止依存                                   |
| ---------------------- | --------------------------- | ------------------------- | ------------------------------------------ |
| View（SwiftUI）        | `MilkOrder/Views/`          | 表示のみ                  | Repository/DataSource を直接 import しない |
| ViewModel              | `MilkOrder/ViewModels/`     | 状態管理・UIロジック      | DataSource具象を直接 import しない         |
| Repository（Protocol） | `MilkOrder/Repositories/`   | データアクセス抽象        | 具象実装を含めない                         |
| DataSource             | `MilkOrder/Infrastructure/` | Firebase/外部API具象実装  | View/ViewModel を import しない            |
| Model/Entity           | `MilkOrder/Models/`         | データ構造（struct/enum） | 他レイヤに依存しない                       |

### 4.2 DI方針

- DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
  - `.live()` factory: Firebase実装を注入（Staging/Production共通、plistで切り替え）
  - `.preview()` factory: Mock実装のみを注入（`#Preview` / Demo専用）
- View/ViewModelはProtocolに依存し、具象型を直接importしない
- メンテナンス状態の取得用Repository（例: `MaintenanceStatusRepository`）も他Repositoryと同様にProtocol越しにアクセスする。Protocol名・配置先・Mock実装の方針はplanで確定すること

### 4.3 Firebase命名規則

| サービス         | Protocol名           | 具象実装名                    | 配置先                               |
| ---------------- | -------------------- | ----------------------------- | ------------------------------------ |
| Firebase Auth    | `AuthRepository`     | `FirebaseAuthRepository`      | `MilkOrder/Infrastructure/Auth/`     |
| Firestore        | `{Domain}Repository` | `Firestore{Domain}Repository` | `MilkOrder/Infrastructure/{Domain}/` |
| Firebase Storage | `OutputRepository`   | `FirebaseOutputRepository`    | `MilkOrder/Infrastructure/Output/`   |

- 本機能はFirestoreの単一ドキュメントを参照するため、命名規則に従えば `MaintenanceStatusRepository` / `FirestoreMaintenanceStatusRepository` / `MilkOrder/Infrastructure/Maintenance/` が基本形となる。最終名称はplanで確定すること

### 4.4 環境分離

| 環境               | Build Configuration | データソース                     |
| ------------------ | ------------------- | -------------------------------- |
| Demo（`#Preview`） | Debug               | MockRepository（Firebase未接続） |
| Staging            | Staging             | `Firestore{Domain}Repository` 等 |
| Production         | Release             | `Firestore{Domain}Repository` 等 |

- メンテナンス状態ドキュメントはStaging/Productionで別管理（プロジェクトが分離されているため、片方だけメンテナンスに入れることも可能）。Mock実装は `#Preview` / Unit Test専用とすること

### 4.5 非同期処理

- `async/await` を使用し、コールバックベースを避ける
- `@MainActor` を ViewModel に付与し、UI更新の安全性を保証する
- Firestoreリスナー（採用した場合）は `AsyncStream` 等でasync/awaitと統合し、MainスレッドをBlockしない構成をplanで明記すること

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. View/ViewModel/Repository/DataSource の責務分離がplanに明記されている
3. Protocol定義・DI経路（`AppEnvironment → ViewModel → View`）がplanに明記されている
4. テスト計画（XCTest / XCUITest）がplanに明記されている
5. CI品質ゲート（build / swiftlint --strict / test / swift package audit）の実行計画がplanに明記されている
6. メンテナンス状態のFirestoreデータ構造（コレクション/ドキュメント名・フィールド定義）がplanに確定している
7. 未ログイン時・ログイン後利用中それぞれについて、メンテナンス検知から本画面への遷移経路（`MilkOrderApp.swift` の既存起動分岐への組み込み方を含む）がplanに明記されている
8. 未認証状態でもメンテナンス状態を読み取れるようにするためのFirestore Security Rules設計方針（`50-security.md` との整合）がplanに明記されている
9. §1の論点A〜Eすべてがplanで回答されている（BLOCKERとして差し戻された場合を除く）

## 6. 品質ゲート（planに必ず記載する項目）

- `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `lint`: `swiftlint lint --strict`
- `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `security`: `swift package audit`
- planにDI経路が `AppEnvironment → ViewModel → View` で固定されていること
- planにProtocol/具象の境界がテスト可能な受入条件で固定されていること
- planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 7. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

- 対象: どのViewModel/Repository/DataSourceをテストするか（一覧）
- 方式: Unit（XCTest） / UIテスト（XCUITest）のどれで守るか
  - UIテストでは「メンテナンス中はログイン画面が表示されず本画面が表示される」「ログイン後利用中にメンテナンスフラグがONになると本画面へ強制遷移する」「再確認ボタン押下でメンテナンス終了後は通常画面へ復帰する」を最低限カバーすること
- ケース: 正常系/例外系/境界値（最低ライン。例: `endAt` 未設定時の表示、Firestore取得失敗時の挙動）
- モック方針: Protocol + Mock実装の配置先（`MilkOrderTests/Mocks/`）、共通ヘルパ
- 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 8. Done

- `.github/copilot/plans/scr-019-maintenance-mode.md` が新規作成されている
- 他のファイルに変更がない
- planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
- TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
- SSOTと矛盾がない

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
