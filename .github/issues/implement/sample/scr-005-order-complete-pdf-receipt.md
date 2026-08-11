---
phase: design
screen_id: SCR-005
title: "[DESIGN] SCR-005 注文完了画面 PDF控え生成（UIGraphicsPDFRenderer）"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-005 注文完了画面 PDF控え生成（UIGraphicsPDFRenderer）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は「設計内容を実装AgentへSSOT（plan）として漏れなく引き継ぐこと」であり、実装そのものは行わない。
* **成果物はplanドキュメント1ファイルのみ**（コード変更・他ファイル追加・編集は禁止）。
* **入力不足/矛盾/設計に必要な情報欠落** がある場合、設計を開始しない。
  * 代わりに `BLOCKER:` として不足点を列挙し、**差し戻し**を返す。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントを作成し、実装Agentへ漏れなく引き継ぐ
* 画面ID: SCR-005
* 画面名: 注文完了画面（既存実装の機能拡張）
* 利用者区分: 注文入力者（`UserRole.orderEntry`）
* 要件参照先: `.github/copilot/10-requirements.md` § 4.1 No.12、§ 7

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
* `.github/copilot/80-templates/implementation-plan.md`（planテンプレート）

### 2.2 前フェーズ成果物（前提plan・既存実装）

| 参照元 | 主な提供物 | 本Issueでの扱い |
| --- | --- | --- |
| `.github/copilot/plans/scr-004-order-confirmation.md` | `PlacedOrder`（orderId / confirmedAt / deliveryDate / deliveryDestinationName / items / notes / subtotal / taxAmount / total） | PDF控えの記載項目の入力データとして参照。再定義しない |
| `.github/copilot/plans/scr-005-order-complete.md` | `OrderCompleteViewModel.requestPDF()` / `showPDFUnavailableAlert`（PDF未実装アラートのプレースホルダー実装）、FR-06、SEQ-03、FLOW-02、TBD「PDF出力機能の実装方式（解決ゲート: SCR-010出力画面設計フェーズ）」 | **本Issueはこのプレースホルダーを置き換える本実装の設計**。SCR-010の設計完了を待たず、SCR-005（注文者個人の単票PDF控え）に限定して先行確定する。10.1のTBDのうち「PDF実装方式」を本Issueの結論で更新すること |
| `MilkOrder/Features/OrderComplete/OrderCompleteViewModel.swift`（既存実装） | `requestPDF()` が `showPDFUnavailableAlert = true` を設定するのみの現状コード | 本Issueのplanで置き換え対象として明記する（新規ファイルではなく既存ファイルの変更） |
| `.github/issues/design/scr-010-output.md`（未登録の設計下書き） | 出力画面（SCR-010、運用側・プラットフォーム未確定）向けのCSV/Excel/PDF出力の全体設計。PDF出力対象を「注文控え」と「集計表」の2種類に分けて定義する方針 | 本Issueは「注文控え」のうち**注文者本人がSCR-005で即時取得する個人向けPDF**のiOS実装に限定する。SCR-010が定義する運用側の「集計表PDF」や複数注文の出力とは責務を分離し、競合しないことをplanで明記する |
| `.github/copilot/70-adr/ADR-002-firebase-backend.md` | Firebase Storage = ファイル出力（CSV/PDF/Excel）の保存・配信、`OutputRepository` / `FirebaseOutputRepository` という将来の命名規則が確定事項として記載されている | 本Issueはサーバーサイド化前のクライアント単独生成を扱うが、将来 `OutputRepository` 系統への移行・統合がしやすい抽象境界（Protocol分離）をplanで設計すること |

### 2.3 画面モック/仕様書（UIの形状合わせ用・仕様追加は禁止）

* なし。`10-requirements.md` § 7「PDF | 注文控え・印刷 | 会社名・ロゴ・注文内容・金額」を基に設計する
* 会社名・ロゴの具体的な値（ロゴ画像アセット）は `MilkOrder/Assets.xcassets` に未整備。§6.2で論点化する

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-005-order-complete-pdf-receipt.md` を新規作成する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* コード実装
* サーバーサイドでのPDF生成（Cloud Run/Firebase Functions等）・Firebase Storageへの保存・配信（将来フェーズ。本Issueではクライアント単独生成のみを扱う）
* SCR-010（出力画面）側の集計表PDF・CSV・Excel出力の設計
* PDFの自動メール送信（SCR-013 通知設定マスタ実装時のスコープ）
* AirPrint等の専用印刷導線（OSの共有シート経由での印刷は許容範囲としてplanで触れてよいが、専用UIの設計は対象外）
* 注文番号の本番採番ルール（API設計フェーズのスコープ。既存TBD）

## 4. アーキテクチャ前提（SSOT固定）

### 4.1 レイヤ構造と依存方向

| レイヤ | 配置先 | 責務 | 禁止依存 |
| --- | --- | --- | --- |
| View（SwiftUI） | `MilkOrder/Features/OrderComplete/` | 表示・共有シート起動のみ | Repository/DataSource を直接 import しない。`UIGraphicsPDFRenderer` を直接呼ばない |
| ViewModel | `MilkOrder/Features/OrderComplete/` | 状態管理・PDF生成リクエストの制御 | DataSource具象（`UIGraphicsPDFRenderer` 等）を直接 import しない |
| Repository（Protocol） | `MilkOrder/Domain/Order/` | PDF生成という副作用（ファイルI/O）の抽象化 | 具象実装（UIGraphicsPDFRenderer呼び出し）を含めない |
| DataSource | `MilkOrder/Infrastructure/Order/` | `UIGraphicsPDFRenderer` を用いたPDF描画・一時ファイル書き出しの具象実装 | View/ViewModel を import しない |
| Model/Entity | `MilkOrder/Domain/Order/` | `PlacedOrder`（既存。変更不可） | 他レイヤに依存しない |

### 4.2 DI方針

* DI起点は `AppEnvironment`（`MilkOrder/App/AppEnvironment.swift`）のみ
  * 新規 Protocol（§6.3）を `AppEnvironment` に追加する
  * **既存の `scr-005-order-complete.md` 5.0.1「AppEnvironment経由のRepository注入は不要」という決定を本Issueで更新する**（PDF生成という副作用が追加されるため）。planでこの変更点を明記すること
* View/ViewModelはProtocolに依存し、具象型を直接importしない
* `#Preview` / Demo 環境でも実際にローカルでPDFを生成して構わない（Firebase等の外部接続を伴わないため、Mockに差し替える必要性自体を論点として確認する。§6.2参照）

### 4.3 Firebase命名規則（将来の移行整合性チェック用）

| サービス | Protocol名 | 具象実装名（将来） | 配置先（将来） |
| --- | --- | --- | --- |
| （参考）Firebase Storage | `OutputRepository` | `FirebaseOutputRepository` | `MilkOrder/Infrastructure/Output/` |

> 本Issueでは上表の具象実装は作らない。本Issueで新設するProtocol（§6.3）が将来 `OutputRepository` 系統と統合可能か、独立を維持するかをplanで明確化すること。

### 4.4 非同期処理

* `async/await` を使用し、コールバックベースを避ける
* `@MainActor` を `OrderCompleteViewModel` に付与（既存どおり）。PDF生成・ファイル書き出しはバックグラウンドで実行し、完了結果のみ `@MainActor` で状態反映する
* PDF生成失敗時のエラー状態を `@Published` で保持し、Viewにアラート等で伝える

## 5. ゴール（このIssueで達成）

1. `.github/copilot/80-templates/implementation-plan.md` に準拠したplanドキュメントが作成されている
2. `UIGraphicsPDFRenderer` を用いたPDF生成ロジックの配置（View/ViewModel/Repository/DataSource の責務分離）がplanに明記されている
3. Protocol定義・DI経路（`AppEnvironment → OrderCompleteViewModel → OrderCompleteView`）がplanに明記されている
4. 将来サーバーサイドPDF発行へ移行する際の置き換えポイント（Protocol境界・戻り値の形）がplanに明記されている
5. PDF出力後のユーザー提示方法（共有シート等）がplanに明記されている
6. テスト計画（XCTest。PDFバイト列の妥当性検証含む）がplanに明記されている
7. CI品質ゲートの実行計画がplanに明記されている

## 6. 設計スコープと設計上の論点

### 6.1 画面の役割（要件から）

| 要件ID | 内容 |
| --- | --- |
| `10-requirements.md` § 4.1 No.12 | PDF・印刷出力。注文控え・集計表をPDF形式で出力（会社名・ロゴ含む） |
| `10-requirements.md` § 7 | PDF出力要件: 用途「注文控え・印刷」、主な項目「会社名・ロゴ・注文内容・金額」、優先度「中」 |
| `scr-005-order-complete.md` FR-06（既存） | 「PDF控え」ボタン押下時の挙動。現状はアラート表示のみ。本Issueで本実装に置き換える |

### 6.2 設計時に判断が必要な論点（plan内で明確化すること）

| 論点 | 設計Agentへの指示 |
| --- | --- |
| Protocol/具象の命名 | `30-coding-standards.md` の「副作用はProtocolで抽象化する」方針と、既存の `{Domain}Repository` 命名規則（`DeadlineCheckRepository` 等、データアクセスに限らず副作用全般に `Repository` を用いている既存例）を踏襲するか、`Generator`等の新層を導入するかをplanで決定し、根拠を明記すること。§6.3に出発点となるシグネチャ例を示す |
| 戻り値の型 | 生成結果を `URL`（一時ファイルパス）と `Data` のどちらで返すかを決定すること。将来サーバー実装がダウンロードURLを返す可能性を考慮し、移行コストが小さい方を採用しその理由を明記する |
| 一時ファイルの保存場所とライフサイクル | `FileManager.default.temporaryDirectory` 配下に保存し、生成都度上書き（同一ファイル名）か、注文IDごとに別ファイルとして残すかを明確化すること。`50-security.md`（PII/Secretsの非出力）に倣い、注文内容（配達先名・金額）を含むPDFを端末に無期限に残さない方針を明記すること |
| ユーザーへの提示方法 | SwiftUI標準の `ShareLink`（iOS 16+、本プロジェクトはiOS 18+前提）を第一候補として検討し、`UIActivityViewController` をラップする方式と比較した上でplanで確定すること |
| 会社名・ロゴの扱い | `Assets.xcassets` にロゴ画像が未整備のため、初期版は固定文字列（例: アプリ名）のみで「会社名」要件を満たし、ロゴ画像表示はOut-of-Scope（Open Issue）とすることをplanで明記する。BLOCKER化はしない |
| PDFのレイアウト構成要素 | `PlacedOrder` のどのフィールドを記載するか（注文番号・確定日時・配達日・配達先名・明細＝商品名/数量/単価/金額・小計/税額/総額・備考）を一覧化し、A4縦1ページ想定で項目数が多い場合の折り返し方針を明確化すること |
| `#Preview`/Demoでの扱い | ローカル生成のみで外部接続がないため、`.preview()` でも本番と同じ具象実装を使ってよいか、それでもテスト容易性のためにMockを別途用意するかを決定すること |
| 既存UIテキストの置き換え | `showPDFUnavailableAlert` と「PDF出力機能は準備中です。」アラート文言、FR-06、SEQ-03、FLOW-02（`scr-005-order-complete.md`）を本実装に合わせてどう置き換えるかをplanに明記すること |
| PDF生成失敗時のUI | ディスク容量不足等で生成に失敗した場合のエラー表示文言・再試行可否を明確化すること |

### 6.3 Repository Protocol シグネチャ（設計Agentへの出発点）

```swift
// planで命名・戻り値の型（URL or Data）を最終決定すること。以下は出発点の例。
protocol OrderReceiptRepository {
    func generateReceiptPDF(for order: PlacedOrder) async throws -> URL
}
```

> 具象実装（例: `LocalOrderReceiptRepository`）が内部で `UIGraphicsPDFRenderer` を用いてPDFを描画し、一時ディレクトリへ書き出してURLを返す想定。将来サーバー実装（例: `FirebaseOrderReceiptRepository` または `OutputRepository` への統合）に置き換える際も、ViewModel/View側のコードは変更不要であることをplanの受入条件に含めること。

### 6.4 既存ファイルへの変更点（新規ファイルではない点に注意）

| 対象 | 変更概要 |
| --- | --- |
| `MilkOrder/Features/OrderComplete/OrderCompleteViewModel.swift` | `requestPDF()` を実際のPDF生成呼び出しに置き換え、`showPDFUnavailableAlert` を生成結果の状態（成功/失敗/生成中）に置き換える |
| `MilkOrder/Features/OrderComplete/OrderCompleteView.swift` | アラート表示を共有シート起動（または同等のUI）に置き換える |
| `MilkOrder/App/AppEnvironment.swift` | §6.3で確定したProtocolのプロパティを追加する |
| `MilkOrderTests/Features/OrderComplete/OrderCompleteViewModelTests.swift` | FR-06関連のテストケースを本実装に合わせて更新する |

## 7. 品質ゲート（planに必ず記載する項目）

* `build`: `xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `lint`: `swiftlint lint --strict`
* `test`: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`
* `security`: `swift package audit`
* planにDI経路が `AppEnvironment → OrderCompleteViewModel → OrderCompleteView` で固定されていること
* planにProtocol/具象の境界がテスト可能な受入条件で固定されていること
* planに `#Preview` がFirebaseなしで動作することの受入条件があること

## 8. テスト設計（planに必ず記載する項目）

planには必ず次を明記する:

* 対象: `OrderCompleteViewModel`（Unit）、新設Repository Protocolの具象実装（Unit）
* 方式: Unit（XCTest）
* ケース:
  * 正常: PDF生成成功 → ViewModelの状態が「生成済み」になり、ファイル/データが取得できる
  * 正常: 生成されたPDFが正しいフォーマットである（先頭バイトが `%PDF` で始まる、PDFKit等で1ページとしてパースできる）
  * 正常: PDFに注文番号・総額・明細が記載される（テキスト抽出または描画呼び出しの検証）
  * 例外: PDF生成失敗（ファイルI/Oエラー） → エラー状態がViewModelに反映され、Viewにエラーが表示される
  * 例外: 「PDF控え」ボタン連打 → 二重生成・二重共有シート起動が発生しない
  * 境界: 明細が多い（多数商品）注文でも生成が完了する
  * 回帰: `AppEnvironment` への新規Protocol追加でSCR-001〜SCR-006の既存テストがPASSする
* モック方針: 新設ProtocolのMock実装を `MilkOrderTests/Mocks/` に配置し、`OrderCompleteViewModelTests` ではMockを使って実際の `UIGraphicsPDFRenderer` 呼び出しに依存しないこと。具象実装自体のテストのみ実PDF生成を行う
* 実行コマンド: `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`

## 9. Done

* `.github/copilot/plans/scr-005-order-complete-pdf-receipt.md` が新規作成されている
* 他のファイルに変更がない
* planの「0. 実装入力コンテキスト」〜「10. オープン課題」が全て記載されている
* §6.2の全論点がplanで回答されている（BLOCKERとして差し戻された場合を除く）
* §6.4の既存ファイル変更点（新規ファイルではない点）がplanの変更サマリ一覧に反映されている
* `scr-005-order-complete.md` 10.1のTBD「PDF実装方式」が本Issueの結論で更新（解消）されている
* TBDが `TBD（理由/決定条件/期限）` 形式で記載されており、BLOCKERとなるTBDが0件
* SSOTと矛盾がない

## 10. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
