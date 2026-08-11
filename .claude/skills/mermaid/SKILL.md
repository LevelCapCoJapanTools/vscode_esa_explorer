---
name: mermaid
description: >
  Mermaid 図（sequenceDiagram / flowchart / classDiagram）を書く・修正する・レビューする
  タスクで使用する。Markdown ファイルに mermaid ブロックを追加・編集するとき、
  Mermaid の構文エラーが報告されたとき、既存ダイアグラムをリファクタリングするときに
  必ずこのスキルを参照すること。"mermaid" "diagram" "図" "シーケンス図" "フロー図"
  "クラス図" "Unable to render" "Parse error" といったキーワードが出た場合も即座に適用する。
---

# Mermaid 図作成・修正ガイド

GitHub の Mermaid レンダラーは標準の Mermaid と比較して一部構文を厳格に解釈する。
過去にこのプロジェクトで発生した構文エラーのパターンを元にルールを整理している。

## 共通ルール（全図種）

**バッククォートを絶対に使わない**
Mermaid はバッククォート（`` ` ``）を特殊なレンダリング記法として解釈するため、
ノードラベル・メッセージラベル・エッジラベルを問わず使用禁止。
インラインコードを表現したい場合はプレーンテキストに書き直す。

```
# NG
A[START: `refreshPosts()`]
User->>View: `.refresh()` で `refreshPosts()` PARAM: なし

# OK
A["START: refreshPosts()"]
User->>View: .refresh() で refreshPosts() PARAM: なし
```

現状 `.github/workflows/` に mermaid専用の構文検証CI（mermaid-lint等）は無い。構文検証はローカルでmermaid-cli（mmdc）を実行して行う（後述）。

---

## sequenceDiagram

### ルール

| ルール | 説明 |
|---|---|
| メッセージラベルにバッククォート禁止 | `A->>B: \`method()\`` → `A->>B: method()` |
| 複数コロンは問題なし | `A->>B: PARAM: foo, bar` の 2 つ目以降のコロンはそのまま文字として扱われる |
| `Note over P1,P2:` は使える | カンマ区切りの複数参加者に対する注釈 |

### テンプレート

```mermaid
sequenceDiagram
  actor User
  participant Tree as EsaPostTreeProvider
  participant ApiClient as EsaApiClient
  participant EsaAPI as esa.io API

  User->>Tree: 更新ボタン押下 PARAM: なし
  Tree->>ApiClient: refresh() で listAllPosts() PARAM: なし
  ApiClient->>EsaAPI: GET /v1/teams/:team/posts PARAM: page, per_page
  EsaAPI-->>ApiClient: RETURN: EsaPost array
  ApiClient-->>Tree: RETURN: posts, error = null
  Tree-->>User: 表示更新 RETURN: カテゴリ階層のTree View
```

---

## flowchart / flowchart TD

### ルール

| ルール | 説明 |
|---|---|
| ラベルは必ずダブルクォートで囲む | `A["ラベル"]` — 括弧・コロン・日本語を安全に扱える |
| バッククォート禁止 | ダブルクォート内でも `` ` `` は不可 |
| ダイヤモンド条件内の `==` は使える | `C{"isLoading == true?"}` は有効 |
| エッジラベル `\|YES\|` `\|NO\|` は使える | 条件分岐の可読性を高める |
| `()` `[]` `:` はダブルクォート内で使える | 関数名・型・TypeScript 構文をそのまま書ける |

### テンプレート

```mermaid
flowchart TD
  A["START METHOD: refresh()"] --> B["INPUT: なし"]
  B --> C{"認証情報が設定済み?"}
  C -->|NO| D["RETURN: 記事一覧を空表示"]
  C -->|YES| E["PROCESS: listAllPosts() でAPI呼び出し"]
  E --> F{"取得成功?"}
  F -->|YES| G["RETURN: buildCategoryTree(posts) でTree更新"]
  F -->|NO| H["RETURN ERROR: エラーメッセージを表示しログへ記録"]
```

---

## classDiagram

### ルール

| ルール | 説明 |
|---|---|
| 配列型は `List~T~` を使う | `EsaPost[]` はパーサーがノード記法と誤解する恐れがある |
| Optional 付きジェネリックは単純化 | `Map~string, EsaPost~ \| undefined` のような `?`/`\|` を含む複雑な型はパースエラーになりやすい → `PostMap` など省略名で代替 |
| `async` は戻り値として解釈される | メソッド名の後に `async` を書くと誤解を招くため省略して OK（`+refresh()` のように書き、`Promise<T>` はコメントで補足する） |
| `<<interface>>` `<<enum>>` は使える | ステレオタイプは正常動作（TypeScriptの `interface`/`enum` に対応） |

### テンプレート

```mermaid
classDiagram
  direction TB
  class EsaPostTreeProvider {
    +refresh() Promise~void~
    +getChildren(element) Promise~List~EsaTreeItem~~
  }
  class EsaApiClient {
    <<interface>>
    +listAllPosts(teamName: string) Promise~List~EsaPost~~
    +updatePost(teamName: string, number: number, input: UpdatePostInput) Promise~EsaPost~
  }
  class EsaApiError {
    +status: number
    +code: string
    +message: string
  }
  EsaPostTreeProvider --> EsaApiClient
  EsaApiClient ..> EsaApiError
```

---

## 修正チェックリスト

図の修正・レビュー時は次の順で確認する：

1. バッククォート（`` ` ``）が図内に 1 つもないことを確認
2. flowchart のノードラベルがすべてダブルクォートで囲まれていることを確認
3. classDiagram で `~T~?` や `[T]` の戻り値型を使っていないことを確認
4. sequenceDiagram で `:` を含むメッセージが正常に1つ目のコロンで区切られることを確認
5. 修正後は `git diff` でバッククォートが残っていないことを grep で確認：
   ```bash
   grep -n '`' <ファイル名> | grep -A2 -B2 '```mermaid'
   ```

---

## CI との連携

現時点で `docs/**/*.md` と `.github/**/*.md` 内の mermaid ブロックを自動検証する専用CIジョブ（mermaid-lint等）は `.github/workflows/` に存在しない。構文検証は本スキルのルールに沿った目視確認と、ローカルでのmermaid-cli実行に依存する。

ローカルで事前確認する場合は：
```bash
npx @mermaid-js/mermaid-cli -i <ファイル> -o /tmp/out.svg
```
