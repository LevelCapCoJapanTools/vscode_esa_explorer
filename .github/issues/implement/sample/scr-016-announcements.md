---
phase: implement
screen_id: SCR-016 / SCR-017
title: "[IMPLEMENT] SCR-016 お知らせ一覧画面 / SCR-017 お知らせ詳細画面"
labels: "implement"
assignees: ""
---

# [IMPLEMENT] SCR-016 お知らせ一覧画面 / SCR-017 お知らせ詳細画面

## 0. AI Agent 契約（最初に読む）

- あなたは **AIコーディングAgent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- **SSOTはplan**（確定planが最優先）。矛盾があれば **planを正** とする。
- **入力不足/矛盾/実装に必要な情報欠落** がある場合、実装を開始しない。
  - 代わりに `BLOCKER:` として不足点を列挙し、**DESIGNへ差し戻し**（plan修正依頼）を返す。
- **plan外の仕様追加/推測補完は禁止**。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/implement.md`** を使用すること。

## 1. 目的

- ゴール: planどおりにSwift/iOS実装を完了し、CI品質ゲートをすべて通す
- 前提: SwiftUI / Swift Concurrency / Protocol-based DI（AppEnvironment）
- 前提SCR:
  - **SCR-001（ログイン画面）の実装が完了していること**（AuthUser / AppEnvironment 実装済み）
  - **SCR-002（メニュー画面）の実装が完了していること**（`MenuDestination.announcements` case / `navigationPath` 定義済み。現状は `PlaceholderView` で仮置き）
  - **SCR-006（注文履歴画面）の実装が完了していること**（一覧取得画面の `@StateObject` / `@MainActor` / 行選択委譲パターンの参照元）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 確定plan（固定パス / 最優先）

- `.github/copilot/plans/scr-016-announcements.md`（TBD解決済み。BLOCKERとなるTBDは0件）

### 2.2 DESIGN Issue（仕様の背景・補助）

- https://github.com/LevelCapTech/milk-order-ios/issues/7

### 2.3 DESIGN PR（設計差分・合意点）

- https://github.com/LevelCapTech/milk-order-ios/pull/8（マージ済み）

### 2.4 画面モック/画像（UIの形状合わせ用・仕様追加は禁止）

- なし（ワイヤーフレーム未入手。plan 5.1.3 のView部品一覧を正として実装する。入手時はplanのView部品一覧とテスト計画のみ更新対象）

## 3. スコープ / 非ゴール

- 対象: planに記載された変更のみ
- 非ゴール:
  - お知らせの作成・編集・削除機能（管理者側スコープ、SCR-013 通知設定画面）
  - プッシュ通知・メール通知の実装
  - 既読管理機能の動作（`isRead: Bool` フィールドは定義するが、表示・更新ロジックには使わない）
  - `FirestoreAnnouncementRepository` の実装・Firebase/Firestore実接続（Mock実装のみ）
  - Staging/Production Firebase設定の変更

## 4. 変更許容範囲（plan厳守）

- planからの逸脱: **禁止**
- planが不足している場合: **実装しない** → `BLOCKER` で差し戻し
- planに「任意/裁量」と明記された箇所のみ、最小差分で判断してよい（判断理由をPR本文へ1〜3行で記録）

## 5. 成果物マニフェスト（必須 / planから転記）

> この表が埋まっていない場合は実装開始禁止。ここに書かれたものだけを作る（plan §8.1から転記）。

| レイヤ                   | action | path                                                                      | 型名/関数名                                                                                                                                                            | 依存（どこ→どこ）                                                        | tests                         |
| ------------------------ | ------ | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------- |
| Model                    | add    | `MilkOrder/Domain/Announcement/Announcement.swift`                        | `Announcement`（Identifiable, Hashable）, `AnnouncementCategory`（`.orderDeadline` / `.orderConfirmed` / `.system` / `.general`）                                      | —                                                                        | `AnnouncementsViewModelTests` |
| Repository               | add    | `MilkOrder/Domain/Announcement/AnnouncementRepository.swift`              | `AnnouncementRepository`（`func fetchAnnouncements() async throws -> [Announcement]`）, `AnnouncementRepositoryError`（`.network`, `.unknown(Error)`）                 | —                                                                        | —                             |
| Repository（DataSource） | add    | `MilkOrder/Infrastructure/Announcement/MockAnnouncementRepository.swift`  | `MockAnnouncementRepository`（`shouldFail: Bool`、4件以上・全category・重要件名1件以上のダミーデータ）                                                                 | `AnnouncementRepository`                                                 | `AnnouncementsViewModelTests` |
| ViewModel                | add    | `MilkOrder/Features/Announcements/AnnouncementsViewModel.swift`           | `AnnouncementsViewModel`（`@MainActor`。`loadAnnouncements()` / `selectAnnouncement(_:)`、`publishedAt`降順＋`id`降順整列、二重取得防止）                              | `AnnouncementRepository`, `onSelectAnnouncement: (Announcement) -> Void` | `AnnouncementsViewModelTests` |
| View                     | add    | `MilkOrder/Features/Announcements/AnnouncementsView.swift`                | `AnnouncementsView`, `AnnouncementsLoadingView`, `AnnouncementsErrorSection`, `AnnouncementsEmptyStateSection`                                                         | `AnnouncementsViewModel`                                                 | —                             |
| View                     | add    | `MilkOrder/Features/Announcements/AnnouncementRowView.swift`              | `AnnouncementRowView`, `AnnouncementCategoryBadge`, `AnnouncementImportantBadge`                                                                                       | `Announcement`                                                           | —                             |
| View                     | add    | `MilkOrder/Features/Announcements/AnnouncementDetailView.swift`           | `AnnouncementDetailView`（専用ViewModelなし。`let announcement: Announcement` を直接保持）                                                                             | `Announcement`                                                           | —                             |
| Other                    | modify | `MilkOrder/App/MenuDestination.swift`                                     | `case announcementDetail(Announcement)` 追加                                                                                                                           | `Announcement`                                                           | —                             |
| Other                    | modify | `MilkOrder/Features/Menu/MenuView.swift`                                  | `.announcements` destination を `PlaceholderView` から `AnnouncementsView` に差し替え、`.announcementDetail` destination を追加（`NavigationStack`ホストは本ファイル） | `AnnouncementsView`, `AnnouncementDetailView`                            | —                             |
| AppEnvironment           | modify | `MilkOrder/App/AppEnvironment.swift`                                      | `announcementRepository: any AnnouncementRepository` を追加し `.live()` / `.preview()` へ `MockAnnouncementRepository` を注入                                          | `MockAnnouncementRepository`                                             | 既存Preview維持確認           |
| Other                    | modify | `MilkOrder/MilkOrderApp.swift`                                            | `AppEnvironment` 初期化への `MockAnnouncementRepository` 追加（アプリ起動時DI）                                                                                        | `AppEnvironment`                                                         | —                             |
| Test                     | add    | `MilkOrderTests/Features/Announcements/AnnouncementsViewModelTests.swift` | `AnnouncementsViewModelTests`                                                                                                                                          | `AnnouncementsViewModel`                                                 | —                             |

## 6. 受入条件（planから転記 / 不足はBLOCKER）

- FR-01: メニューの「お知らせを見る」押下で `MenuDestination.announcements` が `AnnouncementsView` に接続される
- FR-02: 画面表示時に `.task` で `loadAnnouncements()` が1回実行され、`announcements` が `publishedAt` 降順（同値時は `id` 降順）で整列される
- FR-03: 各一覧行に `title` / `publishedAt` / `category` / `isImportant` が表示される（`AnnouncementRowView`）
- FR-04: `announcements.isEmpty == true` かつ `errorMessage == nil` のとき「お知らせはありません」の空状態が表示される
- FR-05: 一覧行タップで `selectAnnouncement(_:)` → `onSelectAnnouncement` → `MenuDestination.announcementDetail(selectedAnnouncement)` が `navigationPath` に追加される
- FR-06: `AnnouncementDetailView(announcement:)` が `title` / `body` / `publishedAt` / `category` / `isImportant` を表示する
- FR-07: `AnnouncementCategory` ごとにSF Symbolと色を切り替え、カテゴリ名のテキストも併記する
- FR-08: `isImportant == true` のお知らせは一覧行・詳細画面の両方で赤系の「重要」カプセルバッジを表示する
- FR-09: `MockAnnouncementRepository` は4 category（`orderDeadline`/`orderConfirmed`/`system`/`general`）すべてを含み、`isImportant == true` が1件以上ある4件以上の配列を返す
- FR-10: `AnnouncementRepositoryError.network` または `.unknown(Error)` 時に `errorMessage` が非nilになり、ローディング/一覧/空状態より優先表示される
- FR-11: `loadAnnouncements()` 実行中（`isLoading == true`）の再呼び出しはRepository呼び出し回数を増やさない
- FR-12: `Announcement.isRead` はMockで `false` 固定とし、ViewModel/Viewは既読状態を分岐条件に使わない
- FR-13: `AnnouncementsView` / `AnnouncementDetailView` の `#Preview` が `AppEnvironment.preview()` のMockのみで成立する（Firebase初期化なし）
- NFR-01: `AnnouncementsViewModel` は `@MainActor`、Repository呼び出しは `async/await`、Mainスレッドをブロックしない
- NFR-02: ログ/エラー表示にお知らせ本文・ユーザー名等の機微情報を出さない（エラー種別のみ記録）
- NFR-03: 未認証ユーザーは画面に到達できない（`AppEnvironment.currentUser != nil` ガード配下のみ）
- NFR-04: Preview / Demo / Unit Test はFirebaseなしで決定的に実行できる
- NFR-05: `build` / `lint` / `test` / `security` の品質ゲートをすべて実行できる状態に保つ
- `AppEnvironment` への `announcementRepository` 追加によりSCR-001〜006の既存テストに回帰がない

## 7. ガードレール（禁止事項 / 変更してはいけないもの）

- DO NOT CHANGE:
  - `MenuDestination` の既存case・既存画面導線（新規case追加のみ）
  - SCR-001〜006で確立したDI経路・ViewModelインターフェース
- 禁止事項:
  - `AnnouncementsView` / `AnnouncementDetailView` からDataSource具象（Mock/Firebase）を直接importしない
  - backgroundスレッドから `announcements` / `isLoading` / `errorMessage` を更新しない
  - お知らせ本文・ユーザー名・配達先名をコード・ログ・テストに機密情報として出力しない
  - `AnnouncementDetailViewModel` や `AnnouncementService` など、planにない中間レイヤを追加しない（`AnnouncementDetailView` は専用ViewModelを持たない）
  - `isRead` を更新したり、既読バッジ・件数表示を追加しない（Out-of-Scope）
  - `AnnouncementCategory` にUI依存型（`Color`, `Image` 等）を持ち込まない（View層のprivate helperでマッピングする）
  - destination接続を `MilkOrderApp.swift` ではなく現行の `NavigationStack` ホスト `MenuView.swift` に追加する（plan 5.1.1 No.10の読み替え）
  - plan外の仕様追加禁止（推測補完を含む）

## 8. アーキテクチャ制約（DI / Protocol / AppEnvironment）

- DI起点は `AppEnvironment` のみ（`.live()` / `.preview()`）。`announcementRepository` をここに追加する
- `@MainActor` を `AnnouncementsViewModel` クラスに付与し、UI更新の安全性を保証する
- View は ViewModel または `Announcement` 値のみに依存し、Repository/DataSourceを直接importしない
- `AnnouncementsViewModel` は `any AnnouncementRepository` のみに依存し、`MockAnnouncementRepository` を直接importしない
- `AnnouncementDetailView` は専用ViewModelを持たず `let announcement: Announcement` を直接保持する
- Firebase SDKをimportしない（本Issueの範囲はMock実装のみ）
- `#Preview` ではFirebaseを初期化しない（`AppEnvironment.preview()` factoryを使用）
- 画面遷移は `MenuView` が `navigationPath` を操作し、`AnnouncementsViewModel` は `onSelectAnnouncement` クロージャで遷移を委譲する（ViewModelをSwiftUIナビゲーション型へ依存させない）

## 9. 必読（規約/ゲート）

- `.github/copilot-instructions.md`
- `.github/instructions/**/*.instructions.md`
- `.github/copilot/30-coding-standards.md`
- `.github/copilot/50-security.md`
- `.github/copilot/60-ci-quality-gates.md`
- `.github/copilot/plans/scr-016-announcements.md`（特に §5.7 シーケンス図、§5.8 処理フロー図、§8.2 実装手順）

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

- 参照したSSOT: `.github/copilot/plans/scr-016-announcements.md`, DESIGN Issue #7, DESIGN PR #8
- 実装判断（裁量がある場合のみ）: 1〜3行
- 受入条件の担保証跡: テスト名/コマンド結果（必要なら）

## 12. Done（必須）

- 成果物マニフェスト（5章）の全項目が実装済み
- 6章の受入条件がすべて満たされる（XCTestで担保）
- SCR-001〜006の既存テストが回帰せず PASS
- CI品質ゲートがすべて緑（build / swiftlint lint --strict / xcodebuild test / swift package audit）
- お知らせ本文・ユーザー名・配達先名がコード・ログ・テストデータに含まれていない
- `AnnouncementsViewModel` に `@MainActor` が付与されている
- `AnnouncementDetailView` が専用ViewModelを持たず `Announcement` を直接保持している
- `isRead` の更新ロジック・既読UIが実装されていない（Out-of-Scope維持）
- `#Preview` がFirebaseなしで動作する
- ドキュメント更新は最小差分（planに従う）

## 13. BLOCKER（入力不足時の返却フォーマット）

> 実装開始前に不足があった場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <plan / docs>
- 理由（1行）: <なぜこれが無いと実装できないか>
