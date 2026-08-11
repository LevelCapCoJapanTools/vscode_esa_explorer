---
name: Mermaid diagram rules
description: Markdown ファイル内の Mermaid 図を書くときの実務ルール
applyTo:
  - "docs/**/*.md"
  - ".github/**/*.md"
---

## Mermaid 図の記述ルール

### 共通禁止事項

- **バッククォート（`` ` ``）をラベル・メッセージ内で使用しない。**
  GitHub の Mermaid レンダラーはバッククォートを特殊なレンダリング記法として解釈し、
  `Parse error … got 'PS'` を引き起こす。インラインコードを示したい場合はプレーンテキストに書き直す。

  ```
  # NG
  User->>View: `.task` で `loadOrderHistory()` PARAM: なし
  A[START: `method()`]

  # OK
  User->>View: .task で loadOrderHistory() PARAM: なし
  A["START: method()"]
  ```

### sequenceDiagram

- メッセージラベルにバッククォートを使わない（共通ルール）。
- メッセージに `:` が複数あっても問題ない（1 つ目のコロンのみが区切り文字）。
- `Note over P1,P2: テキスト` 形式の複数参加者注釈は使える。

### flowchart / flowchart TD

- **ノードラベルは必ずダブルクォートで囲む。** `A["ラベル"]`
  ダブルクォートで囲むと括弧・コロン・日本語・`[]` を安全に書ける。
- ダイヤモンド内の `==` は有効: `C{"isLoading == true?"}`
- エッジラベル `|YES|` `|NO|` は使える。

### classDiagram

- **配列型は `List~T~` を使う。** `EsaPost[]` はパーサーがノード記法と混同する恐れがある。
- **Optional 付きジェネリクスは省略名に置き換える。**
  `Map~string, EsaPost~ | undefined` のような `?`/`|` を含む複雑な型はパースエラーになりやすいため `PostMap` などに単純化する。
- `<<interface>>` `<<enum>>` ステレオタイプは使える（TypeScriptの `interface`/`enum` に対応）。

### CI チェック

現時点で `docs/**/*.md` / `.github/**/*.md` の mermaid ブロックを自動検証する専用CIジョブ（mermaid-lint等）は `.github/workflows/` に存在しない。構文エラーの検出は本ファイルのルールに沿った目視確認と、ローカルでの事前確認に依存する。専用CIを追加する場合は `.github/workflows/ci.yml` にジョブを追記し、本ファイルの記述も合わせて更新すること。

ローカル事前確認:

```bash
npx @mermaid-js/mermaid-cli -i <ファイル> -o /tmp/out.svg
```
