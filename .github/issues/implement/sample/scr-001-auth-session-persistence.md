---
phase: research
screen_id: SCR-001
title: "[RESEARCH] 認証セッションの永続化方式と再ログインが必要なケースの整理"
labels: "research"
assignees: ""
---

# [RESEARCH] 認証セッションの永続化方式と再ログインが必要なケースの整理

## 0. AI Agent 契約（最初に読む）

* あなたは **AI調査Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **コード変更は禁止**。成果物はドキュメント（`docs/research/` または Issue/PRコメント）に限定する。
* **入力不足/矛盾** がある場合、調査を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* 調査結論は ADR または Requirements への昇格候補を必ず明記する（Designフェーズへの引き渡しが目的）。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/research.md`** を使用すること。

## 1. 調査目的

* **解消したい不確実性**: 発注者は「ログインの煩わしさを軽減すること」を理由にネイティブアプリを選定している。現状の実装（`AppEnvironment.currentUser: AuthUser?`）は完全にインメモリ保持のみで永続化がなく（`scr-001-login.md` §5.5 に「ディスクキャッシュ: 不採用、初期版はセッション管理なし」と明記済み）、アプリプロセスが終了するたびに再ログインが必要になる。一方で `.github/copilot/50-security.md` 12行目は「Firebase Auth トークンは Firebase SDK のセッション管理に委ねる。iOS側でKeychainに手動保存しない」と既に規定しており、かつ `FirebaseAuthRepository`（`.live()`）はまだ実装されていない（`MilkOrderApp.swift` は常に `MockAuthRepository()` を直接生成）。この状態で「再ログインを要求しない」という目標と既存セキュリティ制約・未実装のFirebase Auth統合をどう両立させるかが未確定。
* **この調査がなければ何が決められないか**: セッション永続化の責務をどこに置くか（`AuthRepository` への新規メソッド追加か、`AppEnvironment` 側のロジックか）、Mock実装と将来のFirebase Auth実装（`.live()`）でそれぞれどう振る舞うべきか、再ログインを強制すべき具体的なケースの一覧、が確定できず `[DESIGN]` フェーズで `scr-001-login.md` に要件を追記できない。
* **Designフェーズで必要な結論の形**: 「セッション永続化の実現方式（候補と推奨）」「Mock/Firebase Auth実装それぞれでの振る舞い方針」「再ログインを強制すべきケースの一覧表（markdown表）」をまとめた `docs/research/scr-001-auth-session-persistence.md`。

## 2. 入力（SSOT参照セット）

### 2.1 前提ドキュメント（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/copilot/10-requirements.md`（特に §10 セキュリティ要件）
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`（特に12行目: Firebase Auth トークンの扱い）
* `.github/copilot/plans/scr-001-login.md`（特に §5.5 データ取得ライフサイクル, §6.3 Protocol定義）

### 2.2 関連Issue/ADR

* [ADR-002: バックエンドに Firebase を採用する](.github/copilot/70-adr/ADR-002-firebase-backend.md)
* `docs/research/firebase-ios-integration-setup.md`（Firebase コンソール設定・Secrets調査。Auth有効化手順は記載済みだが、セッション永続化の挙動そのものは対象外）
* 関連Issue（同時に起票・スコープは独立）: [DESIGN] SCR-001 ログイン画面 — TestFlight（Staging）版限定のログイン情報初期入力（暫定処置）

### 2.3 既存実装（調査の出発点・前提情報として埋め込み済み）

* `MilkOrder/App/AppEnvironment.swift`: `currentUser: AuthUser?` は `@Published` のみで永続化なし。`.live()` ファクトリは存在せず `.preview()` のみ
* `MilkOrder/MilkOrderApp.swift`: 起動時に `environment.currentUser` が `nil` かどうかで `LoginView` / `MenuRootView` を切替。Build Configuration（Debug/Staging/Release）に関わらず常に `MockAuthRepository()` 等のMockを直接生成
* `MilkOrder/Domain/Auth/AuthRepository.swift`: `signIn(loginID:password:) async throws -> AuthUser` のみ定義。セッション復元用メソッドは存在しない
* `MilkOrder/Domain/Auth/AuthUser.swift`: `id` / `name` / `role` / `deliveryDestinationID` / `deliveryDestinationName` を持つ値型。トークン・有効期限の概念はない
* `MilkOrder/Infrastructure/Auth/MockAuthRepository.swift`: `signIn` がハードコードされた3パターンの `AuthUser` を返すのみ

## 3. スコープ / 非ゴール

### In Scope

* Firebase Auth SDK が提供するセッション永続化の仕組み（`Auth.auth().currentUser` の自動復元、`addStateDidChangeListener`、IDTokenの自動更新・有効期限、内部的なKeychain利用の扱い）の調査
* iOSのアプリバイナリ更新（App Store/TestFlightアップデート）や、OSによるバックグラウンドプロセス終了後のフォアグラウンド復帰時に、Firebase Auth SDKの永続化がどう振る舞うか（期待される動作の確認）
* `.github/copilot/50-security.md` 12行目の制約（Keychain手動保存禁止）を守りながら、`FirebaseAuthRepository`（`.live()`）未実装の現状で `AuthRepository` プロトコルにどのようなインターフェース（例: `restoreSession()`）を追加するのが妥当かの検討
* 現状のMock実装（`MockAuthRepository`）が暫定的にセッション継続性を持たせる場合の安全な実現方法（パスワード等の秘密情報を一切永続化しない前提での選択肢の整理）。「Mockでは永続化しない」という選択肢も比較対象に含める
* 一般的なモバイルアプリ・セキュリティガイドラインにおいて「再ログインを強制すべきケース」とされる典型例の調査（利用停止、パスワード変更、ロール変更、セッション/トークン有効期限切れ、管理者による強制ログアウト等）と、`.github/copilot/10-requirements.md` §10 の既存セキュリティ要件との対応関係の整理

### Out of Scope

* コード変更（調査フェーズではコード修正を行わない）
* 設計決定そのもの（調査結論を受けて別の `[DESIGN]` Issueで `scr-001-login.md` に要件を追記する）
* 実装（`[IMPLEMENT]` フェーズで実施する）
* `FirebaseAuthRepository`（`.live()`）の実装そのもの（別スコープ。本調査はその際の設計判断に資する情報を整理するのみ）
* TestFlight（Staging）版限定のログイン情報初期入力（別Issueのスコープ）
* 多要素認証（MFA）・パスワードレス認証の調査

## 4. 調査観点

> **この表が埋まっていない場合は調査開始禁止**。

| No. | 調査観点 | 期待する答えの形 | 優先度（高/中/低） |
| --- | --- | --- | --- |
| 1 | Firebase Auth SDK（iOS）はセッション（IDToken/RefreshToken）をどこに・どう永続化し、アプリ再起動時に `Auth.auth().currentUser` がどう復元されるか | 仕組みの説明＋公式ドキュメント根拠＋`50-security.md`の「Keychain手動保存しない」方針との整合性確認 | 高 |
| 2 | アプリのバイナリ更新（App Store/TestFlightアップデート）を跨いで、Firebase Authのセッションが保持されるか（Keychainのアプリ更新時の扱い） | 期待される動作の説明＋公式ドキュメント根拠 | 高 |
| 3 | OSがバックグラウンドプロセスを終了させた後にフォアグラウンドへ復帰した場合の挙動（コールドスタートと同等になるか、Firebase Auth SDKがどう復元するか） | 期待される動作の説明 | 高 |
| 4 | `FirebaseAuthRepository`（`.live()`）が未実装の現状で、`AuthRepository` プロトコルにどのようなセッション復元用インターフェース（例: `restoreSession() async throws -> AuthUser?`）を追加するのが妥当か。Mock実装と将来のFirebase実装の両方で破綻しない設計の選択肢 | 選択肢の比較表（メリット/デメリット）＋推奨案 | 高 |
| 5 | Mock実装（`MockAuthRepository`）で暫定的にセッション継続性を持たせる場合、パスワード等の秘密情報を一切永続化せずに実現する方法はあるか（例: `UserDefaults` に非秘匿な参照情報のみ保持する案）。あるいは「Mockでは永続化しない」が妥当か | 選択肢の比較＋推奨案（採用しない場合はその理由も明記） | 中 |
| 6 | モバイルアプリにおいて「再ログインを強制すべき」とされる典型的なケース（業界一般のセキュリティガイドライン・Firebase公式ドキュメントの推奨事項）にはどのようなものがあるか | ケースの一覧（理由・検知方法を含む） | 高 |
| 7 | 上記6の一般的なケースと、`.github/copilot/10-requirements.md` §10（利用停止、パスワード管理、権限管理の3区分等）の既存セキュリティ要件との対応関係 | 対応表（一般的ケース ↔ 本プロジェクトの既存要件） | 中 |

## 5. 成果物

* 調査結果を `docs/research/scr-001-auth-session-persistence.md` にまとめ、PRを作成する（コード変更なし）
* **結論**には以下を必ず含める:
  * 各調査観点（No.1〜7）への回答
  * 「再ログインを強制すべきケース」のmarkdown表（理由・検知方法の列を含む。Designフェーズでそのまま `scr-001-login.md` に転記できる形にする）
  * ADR昇格候補（`.github/copilot/70-adr/`）または Requirements更新候補（`.github/copilot/10-requirements.md`）の明記
  * Designフェーズへの引き継ぎ事項（特に `AuthRepository` への追加インターフェース案、Mock実装の方針）

## 6. 必読（規約）

* `.github/copilot-instructions.md`
* `.github/copilot/50-security.md`（Secrets/PIIを調査ドキュメントに含めない。特に12行目のKeychain手動保存禁止の方針に違反する結論を出さないこと）

## 7. Done（必須）

* 調査観点4章の全項目（No.1〜7）に回答がある
* 「再ログインを強制すべきケース」の一覧表が成果物に含まれている
* 結論が `[DESIGN]` フェーズへ引き継げる形でまとめられている（特に `AuthRepository` インターフェース案）
* ADR/Requirements昇格候補が明記されている
* コード変更が一切ない
* Secrets/PIIが成果物ドキュメントに含まれていない
* `50-security.md` 12行目の制約に違反する結論を出していない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 調査開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと調査できないか>
