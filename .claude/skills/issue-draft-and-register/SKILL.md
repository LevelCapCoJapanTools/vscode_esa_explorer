---
name: issue-draft-and-register
description: このリポジトリで RESEARCH / DESIGN / IMPLEMENT / BLIND の作業依頼を `.github/ISSUE_TEMPLATE/` の対応テンプレートに沿って直接組み立て、ローカルにファイルを残さず、実リポジトリのIssueも作らずに、このリポジトリ用に設定されたGitHub Project（`config/project.json`。未設定なら人間に登録先を聞いて作成する）へDraft issue（プロジェクト内だけの下書き項目）として直接登録するスキル。登録前のチャット承認は不要で、人間はGitHub Project上で登録結果を確認する。登録後に人間から修正を指摘された場合は、登録済みのDraft issueを直接編集する。「[DESIGN]イシューを起票して」「タグフィルタ機能のRESEARCHイシューを作りたい」「BLINDで軽作業のIssueを作りたい」「さっき登録したIssueのここを直して」など、このリポジトリでIssue起票・登録済みIssueの修正に言及されたら必ず使う。単に「Issue作って」と言われた場合もこのリポジトリでは必ずこのスキルを使う（gh issue createで実Issueを作ったり、テンプレートを無視して自由形式のIssueを作ったりしない）。組織やプロジェクトが変わる別リポジトリへこのスキルフォルダをコピーしても、`config/project.json`はGit追跡対象外のため引き継がれず、そのリポジトリでの初回実行時に改めて登録先を尋ねる。
---

# Issue Draft and Register

## これは何のためのスキルか

このスキルは、テンプレートに沿った作業内容をその場で組み立て、GitHub ProjectのDraft issue（プロジェクト内だけに存在し、どのリポジトリのIssueにも紐付かない下書き項目）として直接登録するためのものである。実リポジトリのIssueは作らない。人間はチャット上で事前承認するのではなく、登録後にGitHub Project上で内容を確認する。修正が必要なら、そのままチャットで指摘してもらい、登録済みのDraft issueを直接編集して反映する。

Draft issueを使う理由は、リポジトリのIssueトラッカーを、まだ精査していない下書き段階のタスクで汚さないためである。Draft issueにはラベルやassigneesを設定できない（GitHub Projects v2そのものの制約）ため、フェーズの区別はタイトルの`[DESIGN]`等のプレフィックスと本文の記載で表す。実際に着手する段階になったら、人間がGitHub Project上でDraft issueを選び「Convert to issue」を実行して、初めてリポジトリの実Issueになる。この変換はこのスキルの範囲外であり、人間が判断して行う。

このスキル自体は組織やプロジェクトをまたいで使い回せるように作っている。作業内容の体裁はこのリポジトリの `.github/ISSUE_TEMPLATE/` から読み取るため自然にリポジトリごとに変わるが、「どのGitHub Projectに登録するか」だけはスキル本体に書けない値（他のリポジトリにコピーしたときにコピー元の組織へ誤登録する事故につながる）なので、`config/project.json`（Git追跡対象外）という、リポジトリごとのローカル設定に切り出している。詳細は `config/README.md` を参照。

## 全体の流れ

1. フェーズ（RESEARCH/DESIGN/IMPLEMENT/BLIND）と対象を特定する
2. 対応テンプレートを読み、タイトル・本文をその場で組み立てる（ファイルには保存しない）
3. チャット上の承認を待たず、そのままGitHub ProjectにDraft issueとして登録する（実リポジトリのIssueは作らない）

登録後、人間がGitHub Project上で内容を確認して修正をチャットで指摘してきた場合は、登録済みのDraft issueを直接編集する（詳細はステップ4）。

複数フェーズ・複数機能の依頼を一度に受けた場合は、1〜3を件数分繰り返す。フェーズを跨いだ内容を1件のDraft issueに混在させない。

## ステップ1: フェーズとテンプレートの特定

このリポジトリのフェーズ対応表は `.github/issues/Readme.md` の「対応するイシューテンプレート」セクションに書かれている。これはSSOT（単一情報源）なので、このSKILL.md側に表をコピーして持たない。実行のたびに `.github/issues/Readme.md` を読んで、フェーズ名とテンプレートファイルの対応を確認すること（Draft issueにはラベルを設定できないため、`.github/labels.yml`との対応は使わない）。表が将来更新されてもスキルを直す必要がないようにするための意図的な選択。

ユーザーの依頼からフェーズが一つに決まらない場合（例:「Issue作って」だけで内容が調査なのか設計なのか分からない）は、推測で進めずに確認する。判断材料:

- コード変更を伴わない不確実性解消 → RESEARCH
- 画面/機能のplan確定 → DESIGN
- 確定済みplanに基づく実装 → IMPLEMENT
- 上記に当てはまらず、SSOT参照を避けて本文完結で進めたい軽作業 → BLIND

## ステップ2: 本文の組み立て

1. 対応する `.github/ISSUE_TEMPLATE/*.md` を読む。
2. `.github/issues/<phase>/sample/` 内の既存例を2〜3件眺めて、ボリューム感や記述粒度を合わせる（参考例であり、内容をそのまま流用しない）。新しい機能の場合は `.github/copilot/10-requirements.md` の機能一覧と重複がないか確認する。
3. テンプレート本文の★や`<...>`のプレースホルダーをすべて実際の内容に置き換え、タイトルと本文を組み立てる。タイトルの`[DESIGN]`等のフェーズプレフィックスは必ず残す — ラベルを使わない分、フェーズの識別はこのプレフィックスと本文が頼りになる。依頼文だけでは埋められない項目があっても、すぐに`BLOCKER:`へ逃げない。たとえば「READMEの誤字を直したい」のように対象が曖昧でも、実際に`grep`やファイル読み込みでリポジトリ内を軽く調べれば具体的な箇所が見つかることが多い。実際に調べてもなお情報が無いと判断できた場合に限って、その旨を`BLOCKER:`としてまとめ、登録前に人間に確認する。
4. ここで組み立てるのはチャット上のテキストであり、`.github/issues/`配下にファイルとして保存しない。登録先はステップ3で作るDraft issueそのものであり、それとは別に「ローカルの下書きファイル」というもう一つの正を作らない。

1件のDraft issueには1フェーズのみを書く（DESIGNとIMPLEMENTを混在させない）。複数フェーズが必要なら、フェーズごとに別々のDraft issueとして組み立てる。

## ステップ3: GitHub ProjectへのDraft issue登録

組み立てた内容を、チャット上の承認を待たずにそのまま登録する。人間による確認はこのあとGitHub Project上で行われる運用のため、登録前に「これでいいですか」と確認する必要はない。

1. `config/project.json` を読む（無い場合の扱いは後述）。`owner`（Organization/ユーザー名）と`projectNumber`を使う。
2. 次のコマンドでDraft issueとして登録する。実リポジトリのIssueは作らないため、`mcp__MCP_DOCKER__issue_write`や`gh issue create`は使わない。

   ```bash
   gh project item-create <projectNumber> --owner <owner> --title "<タイトル>" --body "<本文>" --format json
   ```

   `gh project item-create`には`gh issue create`にある`--body-file`が無く、本文は`--body`の文字列引数でしか渡せない。テンプレート由来の長い複数行本文をそのまま引数に埋め込むとクォート崩れの原因になりやすいため、一時ファイルに書き出してから`--body "$(cat <<'EOF' ... EOF)"`のようにコマンド置換で渡す、または本文をヒアドキュメントで変数に入れてから渡すとよい。

   このコマンドが返す`id`（`PVTI_...`形式のプロジェクト項目ID）は、あとでこのDraft issueの本文を編集する際にはそのまま使えない（`gh project item-edit`はDraft issue自体のID、`DI_...`形式を要求する）。無理に控えておく必要はなく、あとで編集が必要になったらステップ4の手順でタイトルから探し直せばよい。
3. Draft issueにはラベル・assigneesを設定できない（`gh project item-create`にもそのためのオプションは無い）。フェーズは手順2で組み立てたタイトルのプレフィックスと本文で表現済みなので、それ以上の対応は不要。
4. **`config/project.json` が存在しない場合**、値を推測したり、以前の会話で聞いた別プロジェクトの値を流用したりしない。人間に次のように尋ねる：「このリポジトリの作業をどのGitHub Projectに登録しますか？（Organization/ユーザー名とプロジェクト番号、またはプロジェクトのURL）」。回答をもとに `config/project.json` を新規作成する（フォーマットは `config/README.md` と `config/project.json.example` を参照）。以降はこのファイルを読むだけでよく、毎回聞き直さない。
5. `gh project item-create`は`project`スコープ（書き込み）を要求する。`gh auth status`のtoken scopesに`project`が無い場合は権限エラーで失敗する。この場合、自己判断でスコープを昇格させようとしない（`gh auth refresh`はブラウザでの再認可を伴う人間の操作のため代行できない）。人間に「`gh auth refresh -s project`を実行してください」と伝えたうえで、実行後に同じコマンドを再試行する。
6. 登録後、GitHub ProjectのURL（`https://github.com/orgs/<owner>/projects/<projectNumber>`）と、登録したDraft issueのタイトルを人間に伝える。

## ステップ4: 登録後に指摘を受けたときの直接編集

人間はチャット上ではなくGitHub Project上で内容を確認する運用のため、修正が必要な場合はあとからチャットで指摘が来る。このとき、新しいDraft issueを作り直すのではなく、登録済みのDraft issueそのものを編集する。ローカルに下書きファイルは存在せず実リポジトリのIssueも存在しないため、正はGitHub Project上のDraft issueに一本化されている。

1. 対象のDraft issueを特定する。`gh project item-list <projectNumber> --owner <owner> --format json` を実行し、出力の各要素のうち`content.type`が`"DraftIssue"`のものからタイトルで該当する項目を探す。**編集に使うIDは`content.id`（`DI_...`形式）であり、項目自体の`id`（`PVTI_...`形式。`item-list`の実Issueの行や`item-create`が返すもの）ではない** — 取り違えると`gh project item-edit`が「ID must be the ID of the draft issue content which is prefixed with \`DI_\`」で失敗する。タイトルだけでは候補が複数ある、または見つからない場合は、推測で進めず人間に確認する。
2. `gh project item-edit --id <DI_で始まるID> --title "<新タイトル>" --body "<新本文>"` で直接書き換える（Draft issueの編集には`--project-id`は不要）。タイトル・本文いずれかのみ変える場合も、変えない方の値を含めて渡す（省略すると空にならないか事前に挙動を確認してから実行する）。新しいDraft issueを作り直したり、別の項目を追加登録したりしない。
3. 何を編集したかを簡潔に人間へ伝える。

## 注意点まとめ

- `.github/issues/Readme.md`がフェーズ対応表のSSOT。表の内容はこのファイルに書き写さず、毎回読みにいく。
- 本文はチャット上で組み立てるだけで、`.github/issues/`配下にファイルとして保存しない。承認待ちもしない。
- 実リポジトリのIssueは作らない。`mcp__MCP_DOCKER__issue_write`・`gh issue create`は使わない — 使うのは`gh project item-create`（登録）と`gh project item-edit`（修正）のみ。
- Draft issueにはラベル・assigneesを設定できない。フェーズの区別はタイトルのプレフィックス（`[DESIGN]`等）と本文で表現する。
- GitHub Projectの登録先（owner・プロジェクト番号）はこのスキル本体に書かず、`config/project.json`（Git追跡対象外）から読む。無ければ人間に尋ねて作成する — これは異常系ではなく、このリポジトリで初めて使うときの通常の流れである。
- `gh project item-create`・`gh project item-edit`は`project`スコープを要求する。不足で失敗した場合は自己判断で回避せず、人間に`gh auth refresh -s project`を依頼する。
- 登録後に人間から修正を指摘されたら、登録済みのDraft issueを`gh project item-edit`で直接編集する。実Issue化（「Convert to issue」）は人間がGitHub Project上のGUIで判断して行うものであり、代行しない。
