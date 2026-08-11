---
phase: design
screen_id: "なし（機能: Push通知配信基盤）"
title: "[DESIGN] Push通知配信基盤（Firebase標準 or 外部クラウド）"
labels: "design"
assignees: ""
---

# [DESIGN] Push通知配信基盤（Firebase標準 or 外部クラウド）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集・ADR新設は禁止）。本Issueの成果物はADRではなく通常のplanである。
* 本Issueの中心課題は「Push通知配信を **Firebase標準機能**（FCM + Cloud Functions トリガー）で実現するか、**外部クラウドサービス**（AWS SNS・OneSignal等）で実現するか」の比較検討と選定である。**この比較検討と結論をplanに必ず含めること**。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、Push通知配信基盤の選定理由と業務ロジックを実装Agentへ引き継ぐ
* 対象: SCR-013（通知設定画面）が制御する通知のうち、Pushチャネルでの配信（iOS / 将来のAndroidクライアント双方を想定）
* 要件参照先: `.github/copilot/10-requirements.md` § 4.1 No.14、§ 11 No.7

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 SSOT（必須）

* `.github/copilot/00-index.md`
* `.github/copilot-instructions.md`
* `.github/copilot/10-requirements.md`
* `.github/copilot/20-architecture.md`
* `.github/copilot/50-security.md`
* `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前提ADR・前フェーズ成果物

| 参照元 | 内容 | 本Issueでの扱い |
| --- | --- | --- |
| [ADR-002-firebase-backend.md](.github/copilot/70-adr/ADR-002-firebase-backend.md) | **確定事項 #7「Push通知（APNs/FCM）をStaging/Productionで完全分離する」が既にAccepted状態で記載されている**。つまりADR-002はPush送信の中継にFCM/APNsを使う前提を既に含んでいる | 本Issueでこの前提を踏襲するか、再検討して外部クラウドに変更するかを明確に判断すること。**変更する場合はADR-002の「決定事項の変更制約」に基づき新ADRが必要になる**旨をplanのオープン課題に明記すること |
| `.github/issues/design/scr-013-notification-settings.md` | 通知設定マスタの業務ルール（設計中） | 通知設定が定義する送信トリガーの受け口として、本Issueの設計が参照される |

### 2.3 画面モック/仕様書

* なし

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/notification-push-delivery.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装
* 実際のAPNs証明書・FCMプロジェクト設定・外部サービス契約
* SCR-013（通知設定画面）自体の業務ルール設計（別Issueのスコープ）
* メール送信基盤の設計（`notification-email-delivery.md`のスコープ）

## 4. 比較検討すべき選択肢（必須）

planには以下の比較表を含め、結論（採用案と理由）を明記すること。**iOSは送信先がAPNs必須である点（Appleの制約）を踏まえ、「FCM/外部サービスのどちらを使ってもAPNsへの中継は必須」という前提を比較に反映すること。**

| 観点 | Firebase標準（FCM + Cloud Functions） | 外部クラウド（AWS SNS / OneSignal 等） |
| --- | --- | --- |
| ADR-002との整合性 | 確定事項#7を踏襲（変更不要） | ADR-002の確定事項#7と矛盾するため新ADRが必要 |
| iOS（APNs）対応 | FCM経由でAPNsに中継。Firebase iOS SDK（ADR-002で採用済み）と統合が容易 | 別途APNs証明書管理・SDK統合が必要 |
| 将来のAndroid対応 | FCMはAndroidネイティブの標準的な選択肢であり追加コストが小さい | Android対応時も別途SDK統合が必要 |
| Staging/Production分離 | ADR-002の方針（Firebaseプロジェクト単位）に自然に乗る | 別途、環境ごとの認証情報管理が必要 |
| 予算（§1 予算目安: 100万円以内） | 追加コストなし（Firebase利用範囲内） | 別途利用料が発生する可能性 |

> 比較表の各セルは設計Agentが調査・記入すること。記入できない観点は `TBD（理由/決定条件/期限）` 形式で明記する。

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. §4の比較表が記入され、採用案と理由がplanの決定事項として明記されている
3. ADR-002確定事項#7を踏襲するか変更するかの判断が明記されている。変更する場合はADR更新が必要な旨がオープン課題に明記されている
4. Push通知のトリガー条件（SCR-013通知設定からの呼び出し方法）がplanに明記されている
5. iOS/Android双方のクライアントを想定したトークン管理方針（デバイストークンの登録・更新・失効）がplanに明記されている
6. テスト計画がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 機能の背景

| 情報源 | 内容 |
| --- | --- |
| `10-requirements.md` § 4.1 No.14 | 注文期限・未対応リマインド・注文確定を初期版はメールまたはアプリ内通知で送信 |
| ADR-002 確定事項#7 | Push通知（APNs/FCM）をStaging/Production で完全分離する |
| ADR-002 確定事項#7注記 | APNsはBundle ID単位で紐づくため、環境共通利用ではtoken混在による誤送信リスクが生じる |

### 6.2 設計時に判断が必要な論点（plan内で明確化すること）

| 論点 | 設計Agentへの指示 |
| --- | --- |
| デバイストークンの管理 | iOS（将来Android）の各クライアントが取得したデバイストークンをどこに保存し、失効時にどう更新するかを明確化すること |
| 送信失敗時のリトライ方針 | トークン失効・一時エラーに対するリトライ・再登録要求のフローを明確化すること |
| アプリ内通知（お知らせ）との関係 | Push通知が届かない場合（通知許可がOFF等）のフォールバックとして、SCR-016/017のお知らせ一覧で同内容を確認できる設計にするかを明確化すること |
| 一斉送信時の負荷 | 300人以上への一斉送信が発生するケースでのFCM/APNs側のレート制限対応をplanに明記すること |

## 7. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: Push通知送信トリガー・デバイストークン管理ロジック
* ケース:
  * 正常: 通知設定で有効化された通知種別 → 対象デバイスにPush通知が送信される
  * 正常: デバイストークン失効 → 再登録フローが機能する
  * 例外: 送信失敗（無効トークン） → エラーが記録され、当該トークンが無効化される
  * 例外: 通知設定が無効化された通知種別 → 送信されない
* モック方針: テスト時は実際の送信を行わず、送信リクエストの発行内容を検証する方式とする

## 8. Done

* `.github/copilot/plans/notification-push-delivery.md` が新規作成されている
* 他のファイルに変更がない
* §4の比較表が完成し、採用案が明記されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
* 採用案がADR-002確定事項#7と矛盾する場合、ADR更新の必要性がオープン課題に明記されている

## 9. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
