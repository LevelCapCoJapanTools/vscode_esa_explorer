---
phase: design
screen_id: SCR-003
title: "[DESIGN] SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-003 注文入力画面 — 締切カウントダウンを秒単位リアルタイム表示に変更

## 0. AI Agent 契約（最初に読む）

- あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
- このIssueの目的は **`scr-003-order-input.md` に締切カウントダウン表示（`DeadlineCountdownLabel`）の要件を正式に追記すること**。
- **成果物は `scr-003-order-input.md` の更新 1 ファイルのみ**（他ファイルへの変更・追加は禁止）。
- 実装済みコードと本文中の前提情報を照合し、**実態と一致した仕様**を追記すること。推測補完は禁止。
- このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

- ゴール: `scr-003-order-input.md` に、締切カウントダウン表示が「残り時間1日未満の場合は秒まで表示し、1秒ごとにリアルタイム更新する」という要件を追記する。
- 背景: 現行の `DeadlineCountdownLabel`（`MilkOrder/Features/OrderInput/OrderInputView.swift`）は60秒間隔で更新され、「時間」「分」までしか表示しない。このコンポーネントはこれまで `scr-003-order-input.md` に一度も文書化されておらず、本Issueで初めて正式な要件として記載する。
- 統合後の `scr-003-order-input.md` は、以降の実装Agent / コードレビューの一次参照先となる。

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 必須（このIssueでの作業入力）

| 入力                                                                                         | 用途                         |
| -------------------------------------------------------------------------------------------- | ---------------------------- |
| `.github/copilot/plans/scr-003-order-input.md`                                               | 更新対象の現行仕様書         |
| `MilkOrder/Features/OrderInput/OrderInputView.swift`（56〜94行目, `DeadlineCountdownLabel`） | 実装済みコード（実態確認用） |

### 2.2 SSOT（参照）

- `.github/copilot/00-index.md`
- `.github/copilot/80-templates/implementation-plan.md`（plan フォーマット確認用）

### 2.3 前提情報（本Issue内に埋め込み済み・追加調査不要）

現行実装（`OrderInputView.swift` 57〜94行目）:

```swift
struct DeadlineCountdownLabel: View {
    @State private var countdownText: String = ""
    private let timer = Timer.publish(every: 60, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "clock.badge.exclamationmark")
                .foregroundStyle(.orange)
                .accessibilityHidden(true)
            Text(countdownText)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .onAppear { updateCountdown() }
        .onReceive(timer) { _ in updateCountdown() }
    }

    private func updateCountdown() {
        let now = Date()
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: now)
        components.hour = 15
        components.minute = 0
        components.second = 0
        guard var deadline = calendar.date(from: components) else { return }
        if deadline <= now {
            deadline = calendar.date(byAdding: .day, value: 1, to: deadline) ?? deadline
        }
        let totalMinutes = Int(deadline.timeIntervalSince(now)) / 60
        let hours = totalMinutes / 60
        let minutes = totalMinutes % 60
        if hours > 0 {
            countdownText = "締切（15:00）まであと\(hours)時間\(minutes)分"
        } else {
            countdownText = "締切（15:00）まであと\(minutes)分"
        }
    }
}
```

- 締切時刻の算出ロジック（本日または翌日の15:00を締切とする）は `scr-003-order-input.md` §0.2「注文締切チェックは『配達日が今日より未来』で仮実装（SCR-013マスタ確定後に15:00判定に置き換え）」に記載された仮実装の一部であり、**本Issueはこの算出ロジック自体を変更しない**。変更対象は「表示の粒度」と「更新間隔」のみ。
- この仮実装の性質上、`deadline` は常に「今日または翌日の15:00」であり、残り時間は常に24時間未満になる。将来 SCR-013 マスタ確定後に締切ロジックが変更され、残り時間が24時間以上になるケースが生じても表示が破綻しないよう、24時間以上/未満の分岐を設計に含めること。

## 3. 成果物 / スコープ

- 成果物: `.github/copilot/plans/scr-003-order-input.md` を更新する（**1ファイルのみ**）
- コード修正・他ファイルの追加・編集は禁止

### 非ゴール

- 締切時刻の算出ロジック変更（今日/翌日15:00判定はそのまま。SCR-013マスタ確定後の別Issueスコープ）
- `DeadlineCheckRepository`（注文訂正フロー用の締切API。`order-correction-flow.md` で定義）との統合
- 締切超過後の画面遷移・エラー表示の変更

## 4. 更新すべき箇所の一覧

| 章                            | 更新内容                                                                                                                                                                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0.1 変更サマリ一覧**        | `DeadlineCountdownLabel` の行を追加する（これまで未記載のため新規追加）                                                                                                                                                                            |
| **3.1 機能要件**              | 新規FRを追加する。番号は **実行時点のFR最大値+1** を採番すること（本Issue起票時点でのplan最大値はFR-11）。要件文言の例: 「締切までの残り時間が24時間以上の場合は時間/分単位で表示し、24時間未満の場合は時/分/秒単位で表示し1秒ごとに自動更新する」 |
| **12. UI/UX設計詳細（追補）** | `DeadlineCountdownLabel` の表示仕様サブセクションを新設し、タイマー間隔・表示フォーマット分岐を明記する                                                                                                                                            |
| **10. オープン課題**          | 「締切カウントダウンの表示粒度」のTBDが解決済みであることを記録する                                                                                                                                                                                |

plan化すべき具体的な表示フォーマット要件:

- 残り時間 ≥ 24時間: 「締切（15:00）まであとX時間Y分」（秒は表示しない。現状の表示形式を維持）
- 残り時間 < 24時間: 「締切（15:00）まであとX時間Y分Z秒」（1秒ごとに更新）
- `Timer.publish(every: 60...)` を `Timer.publish(every: 1...)` に変更する。残り24時間以上のケースでは内部的に1秒ごと再計算してもよいが、表示更新自体は分単位のままでよい（無駄な再描画を避けるための実装判断は実装Agentの裁量とし、planに「秒表示が不要な間は表示文字列を分単位でのみ更新してよい」旨を明記すること）

## 5. 品質チェック（更新後の自己検証）

| チェック項目             | 合格条件                                                                                                                                                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 実装コードとの整合       | 現行コードの締切算出ロジック（today/tomorrow 15:00）と矛盾しない記載になっている                                                                                                                                                                          |
| 表示フォーマットの境界値 | 残り時間が「ちょうど24時間」「23時間59分59秒」のケースの扱いがplanに明記されている                                                                                                                                                                        |
| パフォーマンス           | 1秒ごとの再描画によるパフォーマンス劣化がないことの確認方法（手動確認手順）がplanに記載されている                                                                                                                                                         |
| 他Issueとの整合          | 並行して `scr-003-order-input.md` を変更する可能性のある他の設計Issue（「数量入力ボタンのタップターゲットサイズ統一」、および未登録の `scr-003-update-for-correction.md` 下書き）とFR番号が重複しないよう、実行時点の最大値+1を採番する旨が明記されている |
| TBD残存ゼロ              | 解決済みTBDがplanに反映されている                                                                                                                                                                                                                         |

## 6. Done

- `scr-003-order-input.md` が更新され、締切カウントダウンの秒単位リアルタイム表示要件が記載されている
- 新規FRが既存FR-01〜FR-11（および本Issue実行時点で存在する他の追加FR）と重複しない連番で追加されている
- 他のファイルに変更がない
- planの該当章すべてに矛盾がない（SSOTと矛盾がない）

## 7. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

- BLOCKER: <不足点>
- 必要な追記先: <SSOT / Issue / docs>
- 理由（1行）: <なぜこれがないと設計できないか>
