---
phase: research
screen_id: SCR-001
title: "[RESEARCH] 2回目以降ログインへのPasskey（WebAuthn）認証導入に必要な対応の調査"
labels: "research"
assignees: ""
---

# [RESEARCH] 2回目以降ログインへのPasskey（WebAuthn）認証導入に必要な対応の調査

## 0. AI Agent 契約（最初に読む）

* あなたは **AI調査Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **コード変更は禁止**。成果物はドキュメント（`docs/research/` または Issue/PRコメント）に限定する。
* **入力不足/矛盾** がある場合、調査を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* 調査結論は ADR または Requirements への昇格候補を必ず明記する（Designフェーズへの引き渡しが目的）。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/research.md`** を使用すること。

## 1. 調査目的

* **解消したい不確実性**: 現状のログイン（`AuthRepository.signIn(loginID:password:)`、`scr-001-login.md`）はID・パスワード入力のみであり、`FirebaseAuthRepository`（`.live()`）は未実装（`MockAuthRepository` のみ）。発注者要望「2回目以降のログインではPasskey（WebAuthn）を使って認証できるようにしたい」を実現するために、(a) Firebase Auth（または Identity Platform）側でPasskey/WebAuthnをネイティブにサポートしているか、追加の有効化・契約・サーバー実装（Relying Partyとしてのchallenge生成・署名検証）が必要か、(b) それらサーバー/Firebase側対応なしに、iOS端末のみ（Apple標準API・Associated Domains等）で同等の体験が成立するか、が未確定。
* **この調査がなければ何が決められないか**: `[DESIGN]` フェーズで `scr-001-login.md` にPasskey対応の要件を追記できない。具体的には、(1) Firebase/サーバー側の追加実装・設定の要否とその範囲、(2) iOS側で必要なApple Developer設定（Associated Domains, apple-app-site-association）の要否、(3) 既存ADR-002（Firebaseバックエンド採用、custom claims、asia-northeast1リージョン等）との整合性、(4) 関連Issue #28（認証セッション永続化）との役割分担、が確定しない。
* **Designフェーズで必要な結論の形**: 「Passkey導入に必要な対応一覧（サーバー/Firebase側 vs iOS端末のみ、の区分付き）」「実現可能な構成案（複数ある場合は比較表＋推奨案）」「既存実装（AuthRepository, FirebaseAuthRepository未実装の現状, Issue #28）への影響」をまとめた `docs/research/scr-001-passkey-second-login.md`。

## 2. 入力（SSOT参照セット）

### 2.1 前提ドキュメント（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/copilot/10-requirements.md`（特に §10 セキュリティ要件）
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`（特に「Firebase Auth トークンは Firebase SDK のセッション管理に委ねる。iOS側でKeychainに手動保存しない」の方針）
* `.github/copilot/plans/scr-001-login.md`（特に §5.5 データ取得ライフサイクル, §6.3 Protocol定義, §10 オープン課題）

### 2.2 関連Issue/ADR

* [ADR-002: バックエンドに Firebase を採用する](.github/copilot/70-adr/ADR-002-firebase-backend.md)（Firebase Auth = `AuthRepository` / `FirebaseAuthRepository`、custom claims、asia-northeast1 固定）
* Issue #28（[RESEARCH] 認証セッションの永続化方式と再ログインが必要なケースの整理）— 本調査と同じくSCR-001ログインの認証強化を扱うが、スコープは「セッション永続化（再ログイン回避）」であり「パスワードレス認証（Passkey含む）」は明示的にOut of Scopeとして除外済み。本調査はその除外領域を引き継ぐ位置づけ
* `docs/research/firebase-ios-integration-setup.md`（Firebaseコンソール設定・Secrets調査。Auth有効化手順は記載済みだがPasskey/WebAuthn固有の設定は対象外）

### 2.3 既存実装（調査の出発点・前提情報として埋め込み済み）

* `MilkOrder/Domain/Auth/AuthRepository.swift`: `signIn(loginID:password:) async throws -> AuthUser` のみ定義。Passkey登録・認証用のメソッドは存在しない
* `MilkOrder/Infrastructure/Auth/MockAuthRepository.swift`: ハードコードされた3パターンのID/パスワードのみに応答するMock。Firebase実装（`.live()`）は未着手
* `MilkOrder/MilkOrderApp.swift`: 起動時に `MockAuthRepository()` を直接生成（Build Configurationに関わらず）
* ADR-002 確定事項 #1: 「Firebase Auth を認証・セッション管理に採用。iOS 実装は `FirebaseAuthRepository`」と確定済みのため、Passkeyを導入する場合もこの方針との整合が前提となる

## 3. スコープ / 非ゴール

### In Scope

* Firebase Auth（無印）および Identity Platform（GCIPアップグレード版）におけるPasskey/WebAuthnのネイティブサポート状況（対応の有無、対応している場合の有効化方法、無印FirebaseAuthとの機能差・課金体系の違い）
* Passkey（WebAuthn）の登録（Attestation）・認証（Assertion）フローにおいて、challenge生成・署名検証等のRelying Party（RP）責務を誰が担うか（Firebase/Identity Platformが完全に肩代わりするか、Cloud Functions等の自前バックエンド実装が追加で必要か）の整理
* iOS側で必須となるApple標準API（`ASAuthorizationPlatformPublicKeyCredentialProvider` 等）・Apple Developer側設定（Associated Domains entitlement、`apple-app-site-association`（`webcredentials`）を配信するドメインの要否）の整理。配信ドメインとして既存のFirebase Hosting（React管理画面配信用、ADR-002記載）を転用できるか、専用ドメインが必要かの確認
* 「サーバー/Firebase側の追加設定・実装が一切不要で、iOS端末のみで完結する構成」が技術的に成立するかどうかの検証。成立する場合、その構成は真のWebAuthn Passkeyと言えるか（フィッシング耐性・iCloudキーチェーン同期等のPasskey本来の特性を満たすか）、それとも代替手段（例: Face ID/Touch IDで保護したローカルKeychain資格情報の利用）に留まるかの区別
* 「初回ログイン（ID/パスワード）→ Passkey登録 → 2回目以降はPasskeyのみで認証」という想定フローにおいて、登録時・認証時それぞれでiOSアプリとFirebase/サーバー間でやり取りが必要な情報（challenge、credential ID、公開鍵等）の概要整理
* 本調査の結論とIssue #28（セッション永続化）のスコープ・優先順位の関係整理（重複・矛盾がないことの確認、Designフェーズでの統合方針の提示）
* ADR-002の確定事項（custom claims、asia-northeast1リージョン、`FirebaseAuthRepository`命名規則）とPasskey導入が整合するか、新たなFirebaseプロダクト有効化が既存方針に影響を与えないかの確認

### Out of Scope

* コード変更（調査フェーズではコード修正を行わない）
* 設計決定そのもの（調査結論を受けて別の `[DESIGN]` Issueで `scr-001-login.md` に要件を追記する）
* 実装（`[IMPLEMENT]` フェーズで実施する）
* Issue #28が扱う「セッション永続化そのものの実現方式」の再調査（関連性の整理のみ行い、重複調査はしない）
* Android／React管理画面でのPasskey対応の詳細設計（将来の参考情報として触れる程度に留め、詳細検証はしない）
* 多要素認証（MFA）一般の調査（Passkeyに関連する範囲のみ扱う）

## 4. 調査観点

> **この表が埋まっていない場合は調査開始禁止**。

| No. | 調査観点 | 期待する答えの形 | 優先度（高/中/低） |
| --- | --- | --- | --- |
| 1 | Firebase Auth（無印）はPasskey/WebAuthnをネイティブの認証方法として提供しているか。提供していない、または別プロダクト（Identity Platform）への切り替え・追加有効化が必要な場合、その有効化方法・課金体系の違い | 対応状況の説明＋公式ドキュメント根拠＋必要な有効化手順（コンソール操作の有無） | 高 |
| 2 | Passkey（WebAuthn）の登録（Attestation）・認証（Assertion）フローにおいて、challenge生成・署名検証等のRP（Relying Party）責務をFirebase/Identity Platformが完全に肩代わりするか、Cloud Functions等の自前バックエンド実装が追加で必要か | 責務マッピング表＋必要なバックエンドコンポーネントの有無の結論 | 高 |
| 3 | iOS側でPasskeyを利用するために必須となるApple側設定（Associated Domains entitlement、`apple-app-site-association`（`webcredentials`）を配信するドメイン、Team ID）の要否と、配信ドメインとして既存のFirebase Hosting（React管理画面用）を転用できるか、別ドメインが必要か | 必要設定一覧＋ドメイン要否の結論 | 高 |
| 4 | サーバー/Firebase側の追加設定・実装が一切不要で、iOS端末のみで「2回目以降ログイン時に生体認証のみで完了する」体験を実現する代替手段は存在するか（例: Face ID/Touch IDで保護したローカルKeychain資格情報の利用）。その場合、真のWebAuthn Passkey（フィッシング耐性・iCloudキーチェーン同期等）との機能差は何か | 代替方式の比較表（実現可否・機能差・セキュリティレベル）＋推奨可否の結論 | 高 |
| 5 | 「初回ログイン（ID/パスワード）→ Passkey登録 → 2回目以降はPasskeyのみ」という想定フローにおいて、登録時・認証時それぞれでiOSアプリ・Firebase/サーバー間でやり取りが必要な情報（challenge、credential ID、公開鍵等）の概要とAPI呼び出しの有無 | シーケンス概要（テキストまたは簡易図）＋必要なAPI呼び出し一覧 | 中 |
| 6 | 本調査（Passkey導入）とIssue #28（認証セッション永続化）のスコープ・結論の関係整理。両者が組み合わさる場合の優先順位や、Designフェーズで両Issueの結論をどう統合すべきか | 関係整理の文章＋重複・矛盾がないことの確認＋統合方針の提案 | 中 |
| 7 | Passkey導入がADR-002の確定事項（Firebase Auth custom claims、asia-northeast1リージョン固定、`FirebaseAuthRepository`命名規則）と整合するか。Identity Platformへのアップグレードが必要な場合、既存のFirebaseプロジェクト構成（Staging/Production別プロジェクト）への影響有無 | 整合性確認結果＋影響有無の結論 | 中 |
| 8 | Android／React管理画面など将来的な他クライアントでPasskeyを使う場合、iOS固有の対応（Associated Domains等）がどの程度再利用可能かの参考情報（詳細設計は対象外） | 参考情報としての注意点（簡潔な記述で可） | 低 |

## 5. 成果物

* 調査結果を `docs/research/scr-001-passkey-second-login.md` にまとめ、PRを作成する（コード変更なし）
* **結論**には以下を必ず含める:
  * 各調査観点（No.1〜8）への回答
  * 「サーバー/Firebase側の追加設定・実装が必要か、iOS端末のみで成立可能か」についての明確な結論（条件付きの場合はその条件を明記）
  * iOS端末のみで実現可能な代替案がある場合、その機能制約・真のPasskeyとの違いの明記
  * ADR昇格候補（`.github/copilot/70-adr/`）または Requirements更新候補（`.github/copilot/10-requirements.md`）の明記
  * Designフェーズへの引き継ぎ事項（特にIssue #28との統合方針、`AuthRepository` への追加インターフェース案の方向性）

## 6. 必読（規約）

* `.github/copilot-instructions.md`
* `.github/copilot/50-security.md`（Secrets/PIIを調査ドキュメントに含めない。「Firebase Auth トークンは Firebase SDK のセッション管理に委ねる。iOS側でKeychainに手動保存しない」の方針に違反する結論を出さないこと）

## 7. Done（必須）

* 調査観点4章の全項目（No.1〜8）に回答がある
* 「サーバー/Firebase側設定 vs iOS端末のみ」の区分が明確な結論として成果物に含まれている
* 結論が `[DESIGN]` フェーズへ引き継げる形でまとめられている（特にIssue #28との関係整理）
* ADR/Requirements昇格候補が明記されている
* コード変更が一切ない
* Secrets/PIIが成果物ドキュメントに含まれていない
* `50-security.md` の既存方針（Keychain手動保存禁止）に違反する結論を出していない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 調査開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと調査できないか>
