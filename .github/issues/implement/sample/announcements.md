---
phase: design
screen_id: SCR-016 / SCR-017
title: "[DESIGN] SCR-016 お知らせ一覧画面 / SCR-017 お知らせ詳細画面"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-016 お知らせ一覧画面 / SCR-017 お知らせ詳細画面

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
- **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
- **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
- 機能: 注文入力者（および全ロール）が「お知らせを見る」メニューから運用側の配信したお知らせを一覧・詳細閲覧できる
- 画面ID:
  - **SCR-016** — お知らせ一覧画面（`AnnouncementsView`）
  - **SCR-017** — お知らせ詳細画面（`AnnouncementDetailView`）
- 要件参照先: `.github/copilot/10-requirements.md` § 4.1 No.14（通知）、§ 5 画面一覧

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

### 2.2 前フェーズ成果物（前提plan）

| plan ファイル                            | 主な提供物                                                                              |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `.github/copilot/plans/scr-001-login.md` | AuthUser（role 含む）、AppEnvironment                                                   |
| `.github/copilot/plans/scr-002-menu.md`  | `MenuDestination.announcements` case、NavigationStack（`menuViewModel.navigationPath`） |

- 関連ADR: なし

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

- なし（ワイヤーフレーム未入手。`10-requirements.md` の機能要件を基に設計する）

> **補足**: ワイヤーフレームが後から入手された場合は、planのView部品一覧（5.1.3）と受入確認手順のみを更新し、アーキテクチャ・DI・Protocol 定義は変更しないこと。

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/scr-016-announcements.md` を新規作成する（**1ファイルのみ**、SCR-016 / SCR-017 両画面を1ファイルで設計する）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- コード実装
- お知らせの作成・編集・削除機能（管理者側スコープ、SCR-013 通知設定画面）
- プッシュ通知・メール通知の実装（要件 § 4.1 No.14 の「アプリ内通知」部分のみを対象とする）
- 既読管理機能（初期版は Out-of-Scope。フィールドは定義するが動作させない）
- Firebase/Firestore の実際の接続・設定変更

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ                 | 配置先                                   | 責務                                                | 禁止依存                                   |
| ---------------------- | ---------------------------------------- | --------------------------------------------------- | ------------------------------------------ |
| View（SwiftUI）        | `MilkOrder/Features/Announcements/`      | 表示のみ                                            | Repository/DataSource を直接 import しない |
| ViewModel              | `MilkOrder/Features/Announcements/`      | 状態管理・UIロジック                                | DataSource具象を直接 import しない         |
| Repository（Protocol） | `MilkOrder/Domain/Announcement/`         | データアクセス抽象                                  | 具象実装を含めない                         |
| DataSource（Mock）     | `MilkOrder/Infrastructure/Announcement/` | Mockお知らせデータ                                  | View/ViewModel を import しない            |
| Model/Entity           | `MilkOrder/Domain/Announcement/`         | `Announcement` struct / `AnnouncementCategory` enum | 他レイヤに依存しない                       |

### 4.2 DI方針

- DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
  - `announcementRepository: any AnnouncementRepository` を `AppEnvironment` に追加
- View/ViewModelはProtocolに依存し、具象型を直接importしない
- SCR-017（詳細画面）は Repository 不要。`AnnouncementsViewModel` から `Announcement` を受け取り表示するのみ

### 4.3 Firebase命名規則

| サービス  | Protocol名               | 具象実装名（将来）                | 配置先（将来）                           |
| --------- | ------------------------ | --------------------------------- | ---------------------------------------- |
| Firestore | `AnnouncementRepository` | `FirestoreAnnouncementRepository` | `MilkOrder/Infrastructure/Announcement/` |

> 初期版は `MockAnnouncementRepository` で代替。

### 4.4 非同期処理

- `async/await` を使用。コールバックベースは禁止
- `@MainActor` を `AnnouncementsViewModel` に付与（SCR-017 は Repository 不要のため ViewModel 不要でも可）
- お知らせ取得はbackgroundで実行し、Mainスレッドをブロックしない

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. SCR-016（一覧）と SCR-017（詳細）の責務が明確に分離されている
3. `Announcement` モデルの全プロパティと `AnnouncementCategory` enum がplanに定義されている
4. `AnnouncementRepository` Protocol のシグネチャがplanに固定されている
5. DI経路（`AppEnvironment → AnnouncementsViewModel → AnnouncementsView → AnnouncementDetailView`）がplanに明記されている
6. `MenuDestination.announcementDetail(Announcement)` の追加がplanに明記されている
7. テスト計画（XCTest）がplanに明記されている
8. CI品質ゲートの実行計画がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 機能の背景

| 情報源              | 内容                                                                             |
| ------------------- | -------------------------------------------------------------------------------- |
| SCR-002 FR-09       | 「お知らせを見る」ボタン押下で `MenuDestination.announcements` へ遷移            |
| SCR-002 実装制約    | 現在 `PlaceholderView` で仮置き。本Issueで本実装の設計を行う                     |
| 要件 § 4.1 No.14    | 通知：注文期限・未対応リマインド・注文確定を**アプリ内通知**で送信。優先度：中   |
| 要件 § 2 利用者区分 | お知らせ閲覧は全ロール対象。お知らせ**配信**は運用側・管理者（SCR-013 スコープ） |

### 6.2 確定済みの設計方針（再設計禁止）

| 項目                         | 確定内容                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **画面構成**                 | 2画面構成。SCR-016（一覧）→ SCR-017（詳細）の NavigationStack push 遷移                                                       |
| **詳細遷移方式**             | `MenuDestination.announcementDetail(Announcement)` を追加し NavigationStack で遷移する（Sheet は使用しない）                  |
| **`Announcement: Hashable`** | `MenuDestination.announcementDetail(Announcement)` の associated value に使用するため `Announcement` は `Hashable` 準拠が必要 |
| **既読管理**                 | 初期版は Out-of-Scope。`isRead: Bool` フィールドを `Announcement` に定義するが機能させない                                    |
| **対象ユーザー**             | 全ロール（`orderEntry` / `operator` / `admin`）が閲覧可能                                                                     |
| **表示順**                   | `publishedAt` 降順（最新が先頭）                                                                                              |
| **空状態**                   | お知らせが0件の場合は「お知らせはありません」の空状態ビューを表示する                                                         |

### 6.3 設計時に判断が必要な論点（plan 内で明確化すること）

| 論点                                      | 設計Agentへの指示                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SCR-017 の ViewModel**                  | 詳細画面は Repository 不要のため専用 ViewModel を作らず `AnnouncementsViewModel` から `selected: Announcement` を受け取るか、`AnnouncementDetailView` が `let announcement: Announcement` を直接保持するかを決定すること |
| **お知らせ種別の表示**                    | `AnnouncementCategory`（orderDeadline / orderConfirmed / system / general）に応じてアイコンや色で視覚的に区別するかどうかを決定すること                                                                                  |
| **重要フラグの表示**                      | `isImportant: Bool` が true の場合の強調表示方法（バッジ / 色 / アイコン）を決定すること                                                                                                                                 |
| **`MockAnnouncementRepository` のデータ** | 少なくとも `AnnouncementCategory` の種類分（4件以上）のダミーデータを用意し、`isImportant: true` の件が1件以上含まれるようにすること                                                                                     |

### 6.4 モデル・Protocol 定義（planで確定すること）

```swift
// Announcement モデル（Identifiable + Hashable 必須）
struct Announcement: Identifiable, Hashable {
    let id: String
    let title: String
    let body: String
    let publishedAt: Date
    let category: AnnouncementCategory
    let isImportant: Bool
    var isRead: Bool   // 将来の既読管理用。初期版は常に false
}

enum AnnouncementCategory: String, CaseIterable {
    case orderDeadline    // 注文期限
    case orderConfirmed   // 注文確定
    case system           // システムお知らせ
    case general          // 一般お知らせ
}

// Repository Protocol
protocol AnnouncementRepository {
    func fetchAnnouncements() async throws -> [Announcement]
}

// エラー型
enum AnnouncementRepositoryError: Error {
    case network
    case unknown(Error)
}
```

### 6.5 `MenuDestination` への追加（planに必ず明記すること）

```swift
// 追加（Announcement: Hashable 準拠が前提）
case announcementDetail(Announcement)
```

`MilkOrderApp.swift` の `.navigationDestination` に `.announcementDetail` → `AnnouncementDetailView` を接続すること。

### 6.6 画面別 View 構成（planで確定すること）

| 画面    | View名                   | 主責務                                                                     |
| ------- | ------------------------ | -------------------------------------------------------------------------- |
| SCR-016 | `AnnouncementsView`      | お知らせ一覧（List）、空状態、ローディング表示、SCR-017 へのナビゲーション |
| SCR-016 | `AnnouncementRowView`    | 一覧の1行（タイトル・日付・カテゴリ・重要フラグ）                          |
| SCR-017 | `AnnouncementDetailView` | タイトル・本文・投稿日時・カテゴリ・重要フラグの詳細表示                   |

### 6.7 セキュリティ制約（planに必ず反映すること）

| 制約         | 内容                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------- |
| PII非出力    | お知らせ本文・ユーザー名をログに出力しない（`50-security.md`）                                                   |
| 権限         | 閲覧はすべての認証済みユーザーに許可。未認証ユーザーはアクセス不可（`AppEnvironment.currentUser != nil` が前提） |
| お知らせ配信 | お知らせの作成・編集・削除は本Issueのスコープ外（SCR-013 スコープ）                                              |

## 7. 品質ゲート（planに必ず記載する項目）

- `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `lint`: `swiftlint lint --strict`
- `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
- `security`: `swift package audit`
- planにDI経路が `AppEnvironment → AnnouncementsViewModel → AnnouncementsView → AnnouncementDetailView` で固定されていること
- planに `Announcement: Hashable` 準拠が明記されていること
- planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

- 対象: `AnnouncementsViewModel`（Unit テスト）
- 方式: Unit（XCTest）
- ケース:
  - 正常: お知らせ取得成功 → `announcements` が `publishedAt` 降順で並んでいる
  - 正常: 空状態 → `announcements.isEmpty == true`、空状態表示条件
  - 正常: `isImportant == true` の件が存在する → 件数が正しい
  - 正常: `AnnouncementCategory` の全種別が取得される → 4種別が含まれる
  - 例外: お知らせ取得失敗（`AnnouncementRepositoryError.network`）→ `errorMessage` が表示される
  - 境界: `isLoading == true` 中に再ロード → 二重取得されない
  - 回帰: `AppEnvironment` への `announcementRepository` 追加で SCR-001〜006 テストが PASS
- モック方針: `MockAnnouncementRepository`（`shouldFail: Bool` フラグ付き、4件以上・全 category 含む）を `MilkOrder/Infrastructure/Announcement/` に配置
- 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. 変更予定ファイル一覧（planに記載する内容の参考）

| No. | パス                                                                      | 区分       | 変更タイプ                                                        |
| --- | ------------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------- |
| 1   | `MilkOrder/Domain/Announcement/Announcement.swift`                        | Model      | 追加                                                              |
| 2   | `MilkOrder/Domain/Announcement/AnnouncementRepository.swift`              | Repository | 追加                                                              |
| 3   | `MilkOrder/Infrastructure/Announcement/MockAnnouncementRepository.swift`  | DataSource | 追加                                                              |
| 4   | `MilkOrder/App/AppEnvironment.swift`                                      | Other      | 変更（`announcementRepository` 追加）                             |
| 5   | `MilkOrder/Features/Announcements/AnnouncementsViewModel.swift`           | ViewModel  | 追加                                                              |
| 6   | `MilkOrder/Features/Announcements/AnnouncementsView.swift`                | View       | 追加（SCR-016）                                                   |
| 7   | `MilkOrder/Features/Announcements/AnnouncementRowView.swift`              | View       | 追加                                                              |
| 8   | `MilkOrder/Features/Announcements/AnnouncementDetailView.swift`           | View       | 追加（SCR-017）                                                   |
| 9   | `MilkOrder/App/MenuDestination.swift`（または定義箇所）                   | Other      | 変更（`announcementDetail(Announcement)` 追加）                   |
| 10  | `MilkOrder/MilkOrderApp.swift`                                            | Other      | 変更（`.announcements` / `.announcementDetail` destination 接続） |
| 11  | `MilkOrderTests/Features/Announcements/AnnouncementsViewModelTests.swift` | Test       | 追加                                                              |

## 10. Done

- `.github/copilot/plans/scr-016-announcements.md` が新規作成されている
- 他のファイルに変更がない
- SCR-016 と SCR-017 の責務が明確に分離されている
- §6.3 の全論点（SCR-017 の ViewModel 設計・カテゴリ表示・重要フラグ表示・Mockデータ）がplanに回答されている
- `Announcement` モデルの全プロパティがplanに定義されている（`isRead: Bool` の初期版での扱いを含む）
- `MenuDestination.announcementDetail(Announcement)` の追加がplanに明記されている
- planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
- TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件

## 11. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
