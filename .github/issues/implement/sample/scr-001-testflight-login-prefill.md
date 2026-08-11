---
phase: design
screen_id: SCR-001
title: "[DESIGN] SCR-001 ログイン画面 — TestFlight（Staging）版限定のログイン情報初期入力（暫定処置）"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-001 ログイン画面 — TestFlight（Staging）版限定のログイン情報初期入力（暫定処置）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は **`scr-001-login.md` に「TestFlight（Staging）ビルド限定でログインID/パスワードを初期入力する」という暫定要件を追記すること**。
* **成果物は `scr-001-login.md` の更新 1 ファイルのみ**（他ファイルへの変更・追加は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。代わりに `BLOCKER:` として不足点を列挙し、差し戻しを返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `scr-001-login.md` に、TestFlight（Staging）配布ビルドに限り、ログイン画面のログインID/パスワード欄へ一般ユーザー（注文入力者ロール）のデモ認証情報を初期入力する要件を追記する。
* 背景: TestFlightでアプリを確認する発注者・関係者にとって、ログイン画面でIDとパスワードを毎回手入力する煙わしさが体験に悪影響を与えている。これは**暫定的な処置**であり、Production（本番）ビルドには適用しない。
* 関連Issue: [RESEARCH] 認証セッションの永続化方式と再ログインが必要なケースの整理 [#28](https://github.com/LevelCapTech/milk-order-ios/issues/28)（本Issueと同時に起票。スコープは独立）。本Issueが対応する「初回入力の手間」と、関連Issueが対応する「再ログインの手間」は別の問題として扱う。

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 必須（このIssueでの作業入力）

| 入力 | 用途 |
| --- | --- |
| `.github/copilot/plans/scr-001-login.md` | 更新対象の現行仕様書 |
| `MilkOrder/Features/Login/LoginViewModel.swift` | 実装済みコード（`loginID` / `password` の初期値が空文字であることの確認用） |
| `MilkOrder/Infrastructure/Auth/MockAuthRepository.swift`（20〜28行目） | 実装済みコード（一般ユーザー＝注文入力者ロールのデモ認証情報の確認用） |
| `Configurations/Staging.xcconfig` | 実装済み設定（Staging向け `PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg` の確認用） |
| `.github/copilot/plans/xcode-staging-environment-separation.md` | 前提plan（Staging Build Configuration / Bundle ID分離の確定事項。Swiftコード変更は対象外だったことの確認用） |

### 2.2 SSOT（参照）

* `.github/copilot/00-index.md`
* `.github/copilot/50-security.md`
* `.github/copilot/80-templates/implementation-plan.md`

### 2.3 前提情報（本Issue内に埋め込み済み・追加調査不要）

現状の実装（`LoginViewModel.swift` 10〜13行目）:

```swift
@Published var loginID: String = ""
@Published var password: String = ""
```

一般ユーザー（注文入力者ロール）のデモ認証情報（`MockAuthRepository.swift` 20〜28行目, 既存コードに既に平文で存在）:

```swift
case ("demo@example.com", "demo1234"):
    return AuthUser(
        id: "user-001",
        name: "デモユーザー",
        role: .orderEntry,
        deliveryDestinationID: "dest-001",
        deliveryDestinationName: "○○保育園"
    )
```

> 補足: この `demo@example.com` / `demo1234` は既にリポジトリのソースコード上に平文で存在する公開済みのデモ値であり、新たな機密情報の追加にはならない。

Staging（TestFlight配布）ビルドの識別情報（`Configurations/Staging.xcconfig`）:

```
PRODUCT_BUNDLE_IDENTIFIER = com.levelcap.MilkOrder.stg
```

`xcode-staging-environment-separation.md`（確定済みplan）は、Build Configuration `Staging` / Bundle ID分離を実装したが、**「Swiftコード変更を行わない」を明示的な禁止事項としており**、Swiftコードから「現在Stagingビルドである」と判定するためのコンパイル時フラグ（`SWIFT_ACTIVE_COMPILATION_CONDITIONS` 等）はまだ存在しない。本Issueはこの判定方法自体を新たに設計する必要がある（§5 参照）。

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-001-login.md` を更新する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* Production / Release ビルドへの適用（本Issueは Staging（TestFlight配布）ビルド限定の暫定処置であり、それ以外のビルドには一切影響しないこと）
* 自動ログイン（初期入力された値で「ログイン」ボタンを押さずに自動的にサインインを実行すること）。ユーザーの要望は「初期入力」のみであり、ボタン押下による既存の確認フローは変更しない
* `FirebaseAuthRepository`（`.live()`）の実装そのもの
* 関連Issue「認証セッションの永続化方式と再ログインが必要なケースの整理」（[#28](https://github.com/LevelCapTech/milk-order-ios/issues/28)）が扱うセッション永続化（本Issueは初期入力のみを扱う）
* 一般ユーザー以外（運用担当者・管理者ロール）の初期入力対応（ユーザーの要望は「一般ユーザ」に限定されている）

## 4. ゴール（このIssueで達成）

1. `scr-001-login.md` に、Staging（TestFlight配布）ビルド限定でログインID/パスワードを `demo@example.com` / `demo1234`（一般ユーザー＝注文入力者ロール）で初期入力する要件が新規FRとして追記されている（番号は実行時点のFR最大値+1。本Issue起票時点の最大値はFR-08）。
2. Staging/Production判定方法（§5 の論点）の採用案がplanに明記されている。
3. 本要件が「暫定処置」であり、将来除去・見直しが必要であることがplanに明記されている（§6 Done参照）。
4. Production/Releaseビルドに影響しないことの受入条件（テスト可能な形）がplanに明記されている。

## 5. 設計上の論点（設計Agentが判断・決定すること）

| 論点 | 検討事項 |
| --- | --- |
| Staging判定方法 | 案A: `Configurations/Staging.xcconfig` に `SWIFT_ACTIVE_COMPILATION_CONDITIONS = STAGING` を追加し `#if STAGING` で分岐する（コンパイル時に確実だが、Xcodeプロジェクト設定の追加変更が必要）。案B: 実行時に `Bundle.main.bundleIdentifier == "com.levelcap.MilkOrder.stg"` を比較する（xcconfig変更不要）。どちらを採用するか、利点・欠点を比較してplanに明記すること |
| 初期入力の実装箇所 | `LoginViewModel.init` 内でStaging判定時のみ `loginID` / `password` に既定値を設定する方式が候補。`LoginView` 側で分岐するよりViewModelで分岐する方が既存のテスト容易性（Protocol-based DI）と整合することを確認する |
| 編集可能性 | 初期入力後もユーザーが値を編集・削除できること（既存の `TextField` / `SecureField` の動作を変更しない）をplanで明記する |
| 暫定処置の終了条件 | 「いつこの要件を削除すべきか」をplanに明記する（候補: `FirebaseAuthRepository`（`.live()`）が実装され実際のテストユーザーが提供された時点、または発注者から正式な評価用アカウントが提供された時点） |

## 6. 品質チェック（更新後の自己検証）

| チェック項目 | 合格条件 |
| --- | --- |
| Production非影響 | Release/Productionビルドでは `loginID` / `password` が空文字のままであることがテスト可能な受入条件としてplanに明記されている |
| 既存フローへの非影響 | ログインボタン押下による既存の `signIn()` フロー・バリデーション・エラー表示が変更されていないことがplanに明記されている |
| 暫定処置の明記 | 本要件が暫定処置であり、削除条件が明記されている |
| 他Issueとの整合 | 「認証セッションの永続化方式と再ログインが必要なケースの整理」（[#28](https://github.com/LevelCapTech/milk-order-ios/issues/28)）Issueとスコープが重複していない |
| FR/NFR番号の重複防止 | 並行して `scr-001-login.md` を変更する可能性のある他のIssue（「認証セッションの永続化方式と再ログインが必要なケースの整理」[#28](https://github.com/LevelCapTech/milk-order-ios/issues/28)。現状はRESEARCHフェーズのため、これがDESIGN化されて`scr-001-login.md`を変更する前に本Issueを先に実行するか、後で実行時点の最大値+1を採番するかを明記する）とFR/NFR番号が重複しないよう注意する旨が明記されている |

## 7. Done

* `scr-001-login.md` が更新され、TestFlight（Staging）限定のログイン情報初期入力要件が記載されている
* Staging/Production判定方法が決定され、理由が記載されている
* 本要件が暫定処置であることと、その削除条件が明記されている
* Production/Releaseビルドへの非影響がテスト可能な受入条件として記載されている
* 他のファイルに変更がない
* SSOTと矛盾がない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
