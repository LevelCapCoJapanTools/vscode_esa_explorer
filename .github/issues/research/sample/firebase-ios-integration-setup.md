# [RESEARCH] Firebase iOS 連携に必要なコンソール設定・シークレット一覧

## 0. AI Agent 契約（最初に読む）

* あなたは **AI調査Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* **コード変更は禁止**。成果物はドキュメント（`docs/research/` または Issue/PRコメント）に限定する。
* **入力不足/矛盾** がある場合、調査を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* 調査結論は ADR または Requirements への昇格候補を必ず明記する（Designフェーズへの引き渡しが目的）。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/research.md`** を使用すること。

## 1. 調査目的

* **解消したい不確実性**: iOS アプリを Firebase プロジェクト（`milk-order-app-d7de1`）に接続するために、Firebase コンソール上で何を設定・取得する必要があるか、また CI/CD（GitHub Actions）に登録すべきシークレットの種類と取得手順が確定していない。
* **この調査がなければ何が決められないか**: Firebase SDK の初期化実装（`FirebaseApp.configure()`）・CI パイプラインでの plist 自動注入・Firestore/Auth/Storage の有効化・Security Rules のスケルトン作成が着手できない。
* **Designフェーズで必要な結論の形**: 「Firebase コンソール操作チェックリスト」と「GitHub Secrets 登録一覧（キー名・取得元・形式）」をドキュメント化した `docs/research/firebase-ios-integration-setup.md`。

## 2. 入力（SSOT参照セット）

### 2.1 前提ドキュメント（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/30-coding-standards.md`
* `.github/copilot/50-security.md`

### 2.2 関連Issue/ADR

* [ADR-002: バックエンドに Firebase を採用する](.github/copilot/70-adr/ADR-002-firebase-backend.md)
* [ADR-001: 環境分離](.github/copilot/70-adr/ADR-001-environment-separation.md)
* Firebase プロジェクト: `milk-order-app-d7de1`（Staging 兼初期検証用として作成済み）

## 3. スコープ / 非ゴール

### In Scope

* Firebase コンソールで有効化・設定が必要なサービス（Auth / Firestore / Storage）の操作手順
* iOS アプリ向け `GoogleService-Info.plist` の取得手順
* CI（GitHub Actions）に登録すべきシークレットのキー名・取得元・推奨フォーマット（base64 等）
* ADR-002 が定める Staging / Production の別プロジェクト運用に必要なコンソール操作の差分
* Firebase Emulator Suite のローカル開発利用の可否と設定概要
* Firestore / Storage Security Rules スケルトンの初期設定手順

### Out of Scope

* コード変更（調査フェーズではコード修正を行わない）
* 設計決定（調査結論を受けて `[DESIGN]` フェーズで実施する）
* 実装（`[IMPLEMENT]` フェーズで実施する）
* React 管理画面（`admin/`）側の Firebase 設定（別途調査）
* Firebase Hosting・Cloud Functions の設定（MVP スコープ外）

## 4. 調査観点

> **この表が埋まっていない場合は調査開始禁止**。

| No. | 調査観点 | 期待する答えの形 | 優先度 |
| --- | --- | --- | --- |
| 1 | `GoogleService-Info.plist` の取得手順と含まれる値の意味（API Key, Google App ID, GCM Sender ID, Bundle ID, Storage Bucket 等） | コンソール操作手順（スクリーンショット参照番号 or 手順テキスト）＋各フィールドの役割説明 | 高 |
| 2 | iOS アプリを Firebase に登録する際に必要な情報（Bundle ID, App Store ID, Team ID）の確定手順 | 必要情報のリストと確認場所（Xcode / Apple Developer） | 高 |
| 3 | CI（GitHub Actions）に登録すべきシークレット一覧（キー名・取得元・フォーマット）と plist 自動生成スクリプトの設計 | GitHub Secrets のキー名定義テーブル（値は含めない）＋ CI ステップの概要 | 高 |
| 4 | Firebase Auth で Email/Password 認証を有効化するコンソール操作手順と、追加で検討すべき認証方式 | 操作手順＋推奨設定（パスワードポリシー等）のサマリ | 高 |
| 5 | Firestore データベース作成時の初期設定（リージョン選択・セキュリティモード）と推奨リージョンの根拠 | 推奨設定値と選定根拠（レイテンシ・法令等） | 高 |
| 6 | Firebase Storage バケット作成手順と初期 Security Rules のスケルトン（未認証アクセス禁止） | 操作手順＋ rules スケルトン（サンプル） | 中 |
| 7 | Firestore Security Rules の初期スケルトン（iOS と React admin の両クライアントに対応する最低限のルール） | rules スケルトン（サンプル）＋設計上の注意点 | 中 |
| 8 | Firebase Emulator Suite（Auth / Firestore / Storage）のローカル利用手順と iOS シミュレーター接続の可否 | セットアップ手順概要＋制約事項 | 中 |
| 9 | Staging / Production を別プロジェクトとして運用する際のコンソール操作の差分と注意点（ADR-002 前提） | 差分チェックリスト | 低 |

## 5. 成果物

* 調査結果を `docs/research/firebase-ios-integration-setup.md` にまとめ、PRを作成する（コード変更なし）
* **結論**には以下を必ず含める:
  * 各調査観点への回答
  * ADR昇格候補（`.github/copilot/70-adr/`）または Requirements更新候補（`.github/copilot/10-requirements.md`）の明記
    * 候補: ADR-002 の補足（リージョン選定・Emulator 方針）、または新規 ADR（CI Secret 管理方針）
  * Designフェーズへの引き継ぎ事項（特に Secret キー名の確定・Firestore ルール設計）

## 6. 必読（規約）

* `.github/copilot-instructions.md`
* `.github/copilot/50-security.md`（**Secrets/PIIを調査ドキュメントに含めない**。具体的な API Key・plist の値・サービスアカウント JSON は成果物に記載しない）

## 7. Done（必須）

* 調査観点4章の全項目（No.1〜9）に回答がある
* 結論が `[DESIGN]` フェーズへ引き継げる形でまとめられている
* ADR/Requirements昇格候補が明記されている
* コード変更が一切ない
* Secrets/PIIが成果物ドキュメントに含まれていない

## 8. BLOCKER（入力不足時の返却フォーマット）

> 調査開始前に不足がある場合のみ使用。

* BLOCKER: iOS アプリの Bundle ID が未確定の場合、GoogleService-Info.plist の登録（観点No.2）が完了しない
  * 必要な追記先: `.github/copilot/10-requirements.md` または Xcode プロジェクト設定
  * 理由（1行）: Bundle ID は Firebase コンソールへの iOS アプリ登録時に必須入力であるため

---

## 補足（調査Agent向け背景情報）

ADR-002 により以下は**設計確定済み**のため、これらの再検討は本調査のスコープ外：

| 確定事項 | 内容 |
|---------|------|
| バックエンド選定 | Firebase（Auth + Firestore + Storage） |
| 環境分離 | Staging / Production を別 Firebase プロジェクトで管理 |
| plist 管理 | リポジトリにコミットしない。CI で Secret から生成 |
| SPM パッケージ | `firebase/firebase-ios-sdk`（FirebaseAuth, FirebaseFirestore, FirebaseStorage） |
| iOS 命名規則 | `FirebaseAuthRepository`, `Firestore{Domain}Repository`, `FirebaseOutputRepository` |

本調査の主眼は「**何をコンソールで操作し、何をどの形式で GitHub Secrets に登録するか**」の手順・定義の確立。
