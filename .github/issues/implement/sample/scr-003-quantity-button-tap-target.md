---
phase: design
screen_id: SCR-003
title: "[DESIGN] SCR-003 注文入力画面 — 数量入力ボタンのタップターゲットサイズ統一（メイン＋クイック操作）"
labels: "design"
assignees: ""
---

# [DESIGN] SCR-003 注文入力画面 — 数量入力ボタンのタップターゲットサイズ統一（メイン＋クイック操作）

## 0. AI Agent 契約（最初に読む）

* あなたは **AI設計Agent**。このIssue本文と「入力（SSOT参照セット）」のみで作業する。
* このIssueの目的は **`scr-003-order-input.md` の既存NFR-01（タップターゲットサイズ基準）を、数量入力ブロック内の全ボタンに明確に適用する要件として更新すること**。
* **成果物は `scr-003-order-input.md` の更新 1 ファイルのみ**（他ファイルへの変更・追加は禁止）。
* 実装済みコードと本文中の前提情報を照合し、**実態と一致した仕様**を追記すること。推測補完は禁止。
* このIssueから作成するPRは **`.github/PULL_REQUEST_TEMPLATE/design.md`** を使用すること。

## 1. 目的

* ゴール: `scr-003-order-input.md` に、数量入力ブロック（`QuantityInputBlock`）内の全ボタン（メイン[-][+][×]・クイック操作[-100][-10][-5][+5][+10][+100]）のタップターゲットサイズを、既存NFR-01の44×44pt基準で統一する要件を追記する。
* 背景: メインの[-][+][×]ボタンは既に `.frame(width: 44, height: 44)` でNFR-01（最低44×44pt）を満たしているが、クイック操作行の6ボタン（`quickDeltaButton`）には明示的なフレーム指定がなく、`.padding(.horizontal, 8).padding(.vertical, 5)` + `.font(.caption)` のみで構成されており、実測のタップ領域がNFR-01の基準を満たしていない可能性が高い。
* ユーザーからの補足情報: WCAG 2.1（Target Size, Level AAA）はターゲットサイズ44×44px以上を推奨しており、既存NFR-01（44×44pt）はこの基準と整合している。本Issueは新たな基準を作るのではなく、**既存NFR-01をクイック操作ボタン・×クリアボタンにも明確に適用する**ことが目的。
* 関連Issue: [DESIGN] アプリ全体のフォントサイズ調整（高齢ユーザー想定のタイポグラフィスケール導入） [#25](https://github.com/LevelCapTech/milk-order-ios/issues/25)（文字サイズの具体値はそちらのトークンに従う。本Issueはタップ領域のみを扱う）

## 2. 入力（SSOT参照セット）※ここが揃っていないと開始禁止

### 2.1 必須（このIssueでの作業入力）

| 入力 | 用途 |
| --- | --- |
| `.github/copilot/plans/scr-003-order-input.md`（特に §3.2 NFR-01, §12.1 (C)） | 更新対象の現行仕様書 |
| `MilkOrder/Features/OrderInput/ProductRowView.swift`（21〜131行目, `QuantityInputBlock`） | 実装済みコード（実態確認用） |

### 2.2 SSOT（参照）

* `.github/copilot/00-index.md`
* `.github/copilot/80-templates/implementation-plan.md`

### 2.3 前提情報（本Issue内に埋め込み済み・追加調査不要）

現行実装（`ProductRowView.swift` 38〜131行目, 抜粋）:

```swift
// メイン入力行：[-][数量][+] と 右端固定の[×]
Button {
    onSetQuantity(max(0, quantity - 1))
} label: {
    Image(systemName: "minus.circle.fill")
        .font(.title2)
        .foregroundStyle(quantity <= 0 ? .tertiary : .primary)
}
.buttonStyle(.plain)
.frame(width: 44, height: 44)
.contentShape(Rectangle())
.disabled(quantity <= 0)
.accessibilityLabel("1減らす")
// [+] / [×] も同様に .frame(width: 44, height: 44) 済み

// クイック操作行：[-100][-10][-5] | [+5][+10][+100]
@ViewBuilder
private func quickDeltaButton(_ delta: Int) -> some View {
    let newQty = quantity + delta
    Button(delta > 0 ? "+\(delta)" : "\(delta)") {
        onSetQuantity(max(0, newQty))
    }
    .buttonStyle(.plain)
    .font(.caption)
    .padding(.horizontal, 8)
    .padding(.vertical, 5)
    .background(Color(.systemGray5))
    .foregroundStyle(newQty < 0 ? Color.secondary : Color.primary)
    .clipShape(RoundedRectangle(cornerRadius: 6))
    .contentShape(Rectangle())
    .disabled(newQty < 0)
}
```

* メイン[-][+][×]ボタン: `.frame(width: 44, height: 44)` 済み（NFR-01準拠）。アイコンは `.font(.title2)`。
* クイック操作ボタン（`quickDeltaButton`）: 明示的な `.frame()` 指定がなく、`.font(.caption)` + 上下padding 5pt・左右padding 8ptのみ。タップ領域は文字サイズ（caption ≒ 12pt）+ padding（上下計10pt）程度で、44ptに達していない可能性が高い。
* 既存NFR-01（`scr-003-order-input.md` §3.2）の文言: 「＋/－ボタンはスマートフォンでタップしやすいサイズ（最低44×44pt）にする」。文言上「＋/－ボタン」のみを指しており、×ボタン・クイック操作ボタンへの適用が明文化されていない。

## 3. 成果物 / スコープ

* 成果物: `.github/copilot/plans/scr-003-order-input.md` を更新する（**1ファイルのみ**）
* コード修正・他ファイルの追加・編集は禁止

### 非ゴール

* ボタンの文字サイズの具体的px値の決定（別Issue「[DESIGN] アプリ全体のフォントサイズ調整（高齢ユーザー想定のタイポグラフィスケール導入）」[#25](https://github.com/LevelCapTech/milk-order-ios/issues/25) が定義するタイポグラフィスケールに従う。**本Issueはタップ領域のサイズのみを扱い、文字サイズの数値は固定しない**）
* デスクトップ/Web版のターゲットサイズ基準の採用（本アプリはiOSのみ。「デスクトップでは32px以上」という参考情報は本アプリには適用せず、既存のApple HIG / WCAG準拠の44×44pt基準のみを採用する）
* 商品カード全体のレイアウト変更

## 4. 更新すべき箇所の一覧

| 章 | 更新内容 |
| --- | --- |
| **3.2 非機能要件** | NFR-01の文言を「数量入力ブロック内の全ボタン（メイン[-][+][×]・クイック操作[±5][±10][±100]）はタップしやすいサイズ（最低44×44pt）にする」に拡張する。クイック操作ボタンの実測タップ領域がこれを満たすよう `.frame(minWidth: 44, minHeight: 44)` + `.contentShape(Rectangle())` を追加する方針を明記する |
| **12.1 (C) 数量入力ブロック構成** | クイック操作行の説明に「各ボタンは最小44×44ptのタップ領域を確保する（視覚上のラベル自体は小さくてよいが、タップ領域はpadding/frameで44×44ptを満たす。隣接ボタンとの誤タップ防止のため、ボタン間に十分なスペーシングを設ける）」を追記する |
| **12.1 (C)** | メイン[-][+][×]アイコンの視覚サイズについて「タップ領域44×44ptは維持しつつ、アイコン自体の視覚サイズは別Issue（アプリ全体のフォントサイズ調整, [#25](https://github.com/LevelCapTech/milk-order-ios/issues/25)）が定義するタイポグラフィスケールの該当トークンを採用する」と参照のみ記載し、具体的なpx/pt値は本Issueでは固定しない |
| **10. オープン課題** | 「クイック操作ボタンのタップ領域」のTBDが解決済みであることを記録する |

## 5. 品質チェック（更新後の自己検証）

| チェック項目 | 合格条件 |
| --- | --- |
| NFR-01拡張後の整合 | 既存メインボタンの記述（44×44pt）と矛盾しない |
| クイック操作ボタンの新基準 | 6ボタンすべてが44×44pt以上のタップ領域を持つ設計になっている（視覚サイズとタップ領域を分離してよい旨が明記されている） |
| 他Issueとの整合 | 「アプリ全体のフォントサイズ調整」Issue（[#25](https://github.com/LevelCapTech/milk-order-ios/issues/25)）との文字サイズ重複定義がない（本Issueはタップ領域のみを定義し、文字サイズの数値は持たない） |
| FR/NFR番号の重複防止 | 並行して `scr-003-order-input.md` を変更する可能性のある他の設計Issue（「締切カウントダウンの秒単位リアルタイム表示」、および未登録の `scr-003-update-for-correction.md` 下書き）とNFR番号が重複しないよう、実行時点の最大値+1を採番する旨が明記されている |

## 6. Done

* `scr-003-order-input.md` が更新され、数量入力ブロック内の全ボタンに44×44ptタップターゲット基準が明記されている
* クイック操作ボタンの実装方針（frame/contentShape）がplanに明記されている
* 他のファイルに変更がない
* SSOTと矛盾がない

## 7. BLOCKER（入力不足時の返却フォーマット）

> 設計開始前に不足がある場合のみ使用。

* BLOCKER: <不足点>
* 必要な追記先: <SSOT / Issue / docs>
* 理由（1行）: <なぜこれがないと設計できないか>
