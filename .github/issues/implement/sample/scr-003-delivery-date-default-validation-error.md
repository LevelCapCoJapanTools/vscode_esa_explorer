---
phase: blind
screen_id: SCR-003
title: "[BLIND] 注文入力画面: 配達日が初期入力済みでも「配達日を選択してください」エラーになる不具合修正"
labels: "blind"
assignees: ""
---

# [BLIND] 注文入力画面: 配達日が初期入力済みでも「配達日を選択してください」エラーになる不具合修正

## 0. AI Agent 契約（最初に読む）

- あなたは **AI作業Agent**。本Issue本文のみを入力として作業し、SSOT等の外部仕様は参照しない（[BLIND] モディファイア）。
- 変更は **最小差分** とし、本文に書かれていないスコープ拡張は禁止する。
- 成果物は **本文完結**：作業に必要な前提情報はすべてこのIssue本文に埋め込む。
- 要件不足や矛盾がある場合は作業を開始せず、`BLOCKER:` として不足点を列挙する。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/blind.md`** を使用すること。

## 1. 目的

- ゴール: 注文入力画面（新規注文）で配達日を一度も操作しなくても「確認へ進む」が配達日バリデーションエラーにならないようにする。
- 背景: 配達日選択 `DatePicker` は未選択時に当日を表示する見た目になっているが、ユーザーが実際にピッカーを操作しない限り `OrderInputViewModel.deliveryDate` は `nil` のままであり、バリデーションが見た目と矛盾したエラーを返す。
- この作業で解決したいこと: 「配達日は当日を初期値とする」という仕様（これ自体は変更しない・良い仕様として維持する）を、表示上の見た目だけでなく `ViewModel` の状態にも正しく反映させ、バリデーションエラーが誤発生しないようにする。

## 2. 対象 / スコープ

### In Scope（触ってよい範囲）

- `MilkOrder/Features/OrderInput/OrderInputViewModel.swift`
  - `deliveryDate` プロパティの初期値、および/または新規注文モード時に配達日の初期値を設定する処理（`onAppear()` / `applyInitialValuesIfNeeded()` 周辺）。
- `MilkOrder/Features/OrderInput/OrderInputView.swift` の `DeliveryDateSection`（104〜119行目付近）
  - 上記ViewModel側の修正と整合させるために必要な範囲（例: `deliveryDate == nil` 時のキャプション表示ロジックの調整）に限り、必要であれば触ってよい。
- 対応する既存ユニットテスト（`MilkOrderTests/` 配下、`OrderInputViewModel` に関するテストファイル）への新規/修正テスト追加。

### Out of Scope（触ってはいけない範囲・非目標）

- `OrderConfirmation` / `OrderCorrection` など他画面のロジック変更。
- 配達日の選択可能範囲（締切・休配日など）に関するロジックの変更。今回の不具合と無関係。
- バリデーションメッセージの文言変更（「配達日を選択してください」「配達日は本日以降を選択してください」の文言は変更しない）。
- UIデザイン（レイアウト・配色等）の変更。

## 3. 参照禁止範囲 / 変更可否

- 参照を禁止する情報源: SSOT全体（`.github/copilot/**`）、本文に記載していない既存実装からの挙動推測。
- 本文に埋め込んだ前提情報（この作業に必要な事実）:
  - `MilkOrder/Features/OrderInput/OrderInputViewModel.swift` 11〜15行目: `@Published var deliveryDate: Date?` であり、デフォルト値は `nil`。
  - 同ファイル 132〜138行目 `validateAndProceed()`:
    ```swift
    guard let deliveryDate else {
        errorMessage = "配達日を選択してください"
        return nil
    }
    ```
    `deliveryDate` が `nil` の場合に上記エラーを返して処理を中断する。
  - 同ファイル 192〜199行目 `applyInitialValuesIfNeeded()`:
    ```swift
    private func applyInitialValuesIfNeeded() {
        guard case .correction(let original) = mode else { return }
        deliveryDate = original.deliveryDate
        ...
    }
    ```
    訂正モード（`.correction`）の場合のみ `deliveryDate` を元注文の値で初期化しており、新規注文モード（`.newOrder`）では `deliveryDate` の初期化処理が一切ない。
  - `MilkOrder/Features/OrderInput/OrderInputView.swift` 96〜122行目 `DeliveryDateSection`:
    ```swift
    struct DeliveryDateSection: View {
        @Binding var deliveryDate: Date?

        var body: some View {
            Section("配達日") {
                DeadlineCountdownLabel()

                DatePicker(
                    "配達日を選択",
                    selection: Binding<Date>(
                        get: { deliveryDate ?? Date() },
                        set: { deliveryDate = $0 }
                    ),
                    in: Date()...,
                    displayedComponents: .date
                )
                .datePickerStyle(.compact)

                if deliveryDate == nil {
                    Text("配達日を選択してください")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
    }
    ```
    `DatePicker` の `get` クロージャが `deliveryDate ?? Date()` を返すため、画面上は常に「当日」が表示される（＝当日が初期値であるように見える）。しかし、ユーザーが実際にピッカーを操作して `set` を発火させない限り、束縛されている `deliveryDate`（実体は `OrderInputViewModel.deliveryDate`）自体は更新されず `nil` のままになる。これが今回報告された不具合の直接原因である：見た目は当日が選択済みに見えるのに、実際の状態は未選択のため `validateAndProceed()` のガードに引っかかり「配達日を選択してください」が表示される。
  - 新規注文時の `OrderInputViewModel` 初期化経路: `onAppear()`（86〜104行目）が商品取得後に `applyInitialValuesIfNeeded()` を呼ぶが、前述の通りこの関数は訂正モードのみ `deliveryDate` を設定する。
- 変更してよい範囲: 上記「In Scope」に記載のファイル。
- 変更してはいけない範囲: 上記「Out of Scope」に記載の範囲、およびその他全てのファイル。

## 4. 関連Issue / PR / ドキュメント（参考情報・参照義務なし）

- なし（ユーザーからの不具合報告を元に起票）。

## 5. 作業内容

| No. | 作業項目                                                                                                                                                                                                                                                          | 期待する結果                                                                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `OrderInputViewModel` で、新規注文モード（`.newOrder`）の場合も `deliveryDate` の初期値が当日（`Date()` または同等の値）になるようにする。訂正モード（`.correction`）の既存挙動（元注文の配達日を初期値にする）は変更しない。                                     | 新規注文で画面表示直後、`deliveryDate` プロパティ自体（Bindingの`get`フォールバックではなく実体）が当日の日付を保持している。                                  |
| 2   | `validateAndProceed()` を、ユーザーが配達日ピッカーを一度も操作しなかった場合でも当日が選択された状態として正しく通過させる（既存の「本日以降チェック」エラーメッセージ・ロジックはそのまま維持する）。                                                           | 新規注文画面を開いた直後に商品を選択し「確認へ進む」を押すと、配達日関連のエラーが出ずに次画面へ進む。                                                         |
| 3   | `DeliveryDateSection`（`OrderInputView.swift`）の `if deliveryDate == nil { Text("配達日を選択してください") }` キャプションについて、上記修正後は新規注文時に常に `deliveryDate` が非nilになるため、不要であれば削除またはそのままで矛盾が出ないことを確認する。 | キャプション表示と実際のバリデーション結果が矛盾しない（「配達日を選択してください」という見た目のヒントが出ているのに実際は選択済み、という状態を作らない）。 |
| 4   | `OrderInputViewModel` に対するユニットテストで、新規注文モードを `onAppear()` 実行後すぐに `validateAndProceed()` を呼んでも配達日エラーにならないことを確認するテストを追加する。                                                                                | 当該テストが追加され、修正前のコードでは失敗し修正後のコードでは成功することを確認できる。                                                                     |

## 6. 受入条件

- 新規注文モードで画面表示後、配達日ピッカーを一度も操作せずに商品を1件以上選択し「確認へ進む」を押した場合、「配達日を選択してください」エラーが発生しない。
- 訂正モード（`.correction`）の既存挙動（元注文の配達日が初期値になる）に回帰がない。
- 配達日に過去日を明示的に選択した場合の「配達日は本日以降を選択してください」エラーは従来通り発生する（このバリデーション自体は変更しない）。
- 既存のビルド・テストが通過する（`xcodebuild build -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'` および `xcodebuild test -scheme MilkOrder -destination 'platform=iOS Simulator,name=iPhone 17'`）。
- `swiftlint lint --strict` が通過する。

## 7. 確認事項

- 実行する確認: 上記ビルド・テストコマンド、および追加したユニットテストの実行。
- 影響範囲: 注文入力画面（SCR-003）の新規注文フローのみ。訂正フロー・他画面には影響しない想定。
- セキュリティ / Secrets 観点の注意点: 該当なし（UIロジック・バリデーションのみの修正）。

## 8. 備考

- 「配達日が当日初期値になっている」という見た目の仕様自体は良い仕様であり、変更・撤回しない。今回はその見た目と実際の内部状態（`ViewModel.deliveryDate`）が一致していないことが不具合の本質である。

## 9. Done

- 目的に記載したゴールを満たしている
- In Scope の作業が完了している
- 受入条件をすべて満たしている
- プレースホルダーが残っていない

## 10. BLOCKER（入力不足時の返却フォーマット）

- BLOCKER: なし
