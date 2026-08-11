---
name: issue-draft-and-register
description: このリポジトリで RESEARCH / DESIGN / IMPLEMENT / BLIND のGitHub Issueを `.github/ISSUE_TEMPLATE/` の対応テンプレートに沿って直接組み立て、ローカルにファイルを残さずGitHub MCP経由でただちに登録し、このリポジトリ用に設定されたGitHub Project（`config/project.json`。未設定なら人間に登録先を聞いて作成する）に追加するスキル。登録前のチャット承認は不要で、人間はGitHub上で登録結果を確認する。登録後に人間から修正を指摘された場合は、登録済みのGitHub Issueを直接編集する。「[DESIGN]イシューを起票して」「タグフィルタ機能のRESEARCHイシューを作りたい」「BLINDで軽作業のIssueを作りたい」「さっき登録したIssueのここを直して」など、このリポジトリでIssue起票・登録済みIssueの修正に言及されたら必ず使う。単に「Issue作って」と言われた場合もこのリポジトリでは必ずこのスキルを使う（gh issue createを直接叩いたり、テンプレートを無視して自由形式のIssueを作ったりしない）。組織やプロジェクトが変わる別リポジトリへこのスキルフォルダをコピーしても、`config/project.json`はGit追跡対象外のため引き継がれず、そのリポジトリでの初回実行時に改めて登録先を尋ねる。
---

# Issue Draft and Register

## これは何のためのスキルか

このスキルは、テンプレートに沿ったGitHub Issueをその場で組み立て、ファイルとして残さずにそのまま登録するためのものである。人間はチャット上で事前承認するのではなく、登録後にGitHub上で内容を確認する。修正が必要なら、そのままチャットで指摘してもらい、登録済みのGitHub Issueを直接編集して反映する — 下書きファイルを作り直して再登録する、という二度手間を避けるためである。

このスキル自体は組織やプロジェクトをまたいで使い回せるように作っている。Issueの内容や体裁はこのリポジトリの `.github/ISSUE_TEMPLATE/` と `.github/labels.yml` から読み取るため自然にリポジトリごとに変わるが、「登録したIssueをどのGitHub Projectに追加するか」だけはスキル本体に書けない値（他のリポジトリにコピーしたときにコピー元の組織へ誤登録する事故につながる）なので、`config/project.json`（Git追跡対象外）という、リポジトリごとのローカル設定に切り出している。詳細は `config/README.md` を参照。

## 全体の流れ

1. フェーズ（RESEARCH/DESIGN/IMPLEMENT/BLIND）と対象を特定する
2. 対応テンプレートを読み、Issueのタイトル・本文をその場で組み立てる（ファイルには保存しない）
3. チャット上の承認を待たず、そのままGitHub MCPでIssueを登録する
4. `config/project.json` の設定に従ってGitHub Projectに追加する（設定が無ければ人間に登録先を尋ねて作成する）

登録後、人間がGitHub上で内容を確認して修正をチャットで指摘してきた場合は、登録済みのGitHub Issueを直接編集する（詳細はステップ5）。

複数フェーズ・複数機能の依頼を一度に受けた場合は、1〜4を件数分繰り返す。フェーズを跨いだ内容を1件のIssueに混在させない。

## ステップ1: フェーズとテンプレートの特定

このリポジトリのフェーズ対応表は `.github/issues/Readme.md` の「対応するイシューテンプレート」セクションに書かれている。これはSSOT（単一情報源）なので、このSKILL.md側に表をコピーして持たない。実行のたびに `.github/issues/Readme.md` を読んで、フェーズ名・テンプレートファイル・ラベルの対応を確認すること。表が将来更新されてもスキルを直す必要がないようにするための意図的な選択。

ユーザーの依頼からフェーズが一つに決まらない場合（例:「Issue作って」だけで内容が調査なのか設計なのか分からない）は、推測で進めずに確認する。判断材料:

- コード変更を伴わない不確実性解消 → RESEARCH
- 画面/機能のplan確定 → DESIGN
- 確定済みplanに基づく実装 → IMPLEMENT
- 上記に当てはまらず、SSOT参照を避けて本文完結で進めたい軽作業 → BLIND

## ステップ2: Issue本文の組み立て

1. 対応する `.github/ISSUE_TEMPLATE/*.md` を読む。
2. `.github/issues/<phase>/sample/` 内の既存例を2〜3件眺めて、ボリューム感や記述粒度を合わせる（参考例であり、内容をそのまま流用しない）。新しい機能の場合は `.github/copilot/10-requirements.md` の機能一覧と重複がないか確認する。
3. テンプレート本文の★や`<...>`のプレースホルダーをすべて実際の内容に置き換え、Issueの`title`と`body`を組み立てる。依頼文だけでは埋められない項目があっても、すぐに`BLOCKER:`へ逃げない。たとえば「READMEの誤字を直したい」のように対象が曖昧でも、実際に`grep`やファイル読み込みでリポジトリ内を軽く調べれば具体的な箇所が見つかることが多い。実際に調べてもなお情報が無いと判断できた場合に限って、その旨を`BLOCKER:`としてまとめ、登録前に人間に確認する。
4. ここで組み立てるのはチャット上のテキストであり、`.github/issues/`配下にファイルとして保存しない。登録先はステップ3で作るGitHub Issueそのものであり、それとは別に「ローカルの下書きファイル」というもう一つの正を作らない。

1件のIssueには1フェーズのみを書く（DESIGNとIMPLEMENTを混在させない）。複数フェーズが必要なら、フェーズごとに別々のIssueとして組み立てる。

## ステップ3: GitHub Issueへの登録

組み立てた内容を、チャット上の承認を待たずにそのまま登録する。人間による確認はこのあとGitHub上で行われる運用のため、登録前に「これでいいですか」と確認する必要はない。

- 使うツールは `mcp__MCP_DOCKER__issue_write`（`method: "create"`）。同じMCPゲートウェイ内に名前が似た `mcp__MCP_DOCKER__create_issue` があるが、これはGitLab向け（`project_id`を取る）なので絶対に使わない。
- `owner`/`repo`は作業中リポジトリの`origin`リモートから取る（`git remote get-url origin`）。`upstream`リモート（フォーク元）には登録しない。
- パラメータ対応:
  - `title` / `body` ← ステップ2で組み立てた内容
  - `labels` ← `.github/labels.yml`がラベルの唯一のSSOT。実行のたびにこのファイルを読み、定義されているラベルの中からIssueの内容に合致するものを選んで配列で渡す。フェーズ名をそのままラベルとして渡さない — `.github/labels.yml`に同名のラベルが存在する保証がないため
  - `assignees` ← 依頼の中で指定されていれば渡す
- 登録後にIssue番号とURLを人間に伝える。

## ステップ4: GitHub Projectへの追加

Issueが登録できたら、続けてこのリポジトリの設定に従ってGitHub Projectに追加する。登録先（owner・プロジェクト番号）はスキル本体（このSKILL.md）に書かない。スキルフォルダを他の組織・プロジェクトへコピーしたときに、コピー元の登録先へ誤って登録する事故を防ぐためである。

1. `config/project.json` を読む（無い場合の扱いは後述）。
   - `enabled: false` が設定されている場合、GitHub Projectへの追加はスキップする（このリポジトリではProjectを使わない、という意思決定として扱う）。
   - `enabled` が `true` または未設定の場合、`owner` と `projectNumber` を使う。
2. **`config/project.json` が存在しない場合**、値を推測したり、以前の会話で聞いた別プロジェクトの値を流用したりしない。人間に次のように尋ねる：「このリポジトリで登録したIssueを追加するGitHub Projectを教えてください（Organization/ユーザー名とプロジェクト番号、またはプロジェクトのURL。Projectを使わない場合はその旨）」。回答をもとに `config/project.json` を新規作成する（フォーマットは `config/README.md` と `config/project.json.example` を参照）。以降はこのファイルを読むだけでよく、毎回聞き直さない。
3. `owner`・`projectNumber`を使って追加する。

   ```bash
   gh project item-add <projectNumber> --owner <owner> --url <作成したIssueのURL>
   ```

4. `gh project item-add`は`project`スコープ（書き込み）を要求する。`gh auth status`のtoken scopesに`project`が無く`read:project`のみの場合は権限エラーで失敗する。この場合、自己判断でスコープを昇格させようとしない（`gh auth refresh`はブラウザでの再認可を伴う人間の操作のため代行できない）。人間に「`gh auth refresh -s project`を実行してください」と伝えたうえで、実行後に同じコマンドを再試行する。
5. Project追加が失敗しても、Issue自体は既に登録済みであり登録そのものは成功として扱う。Issue番号・URLに加えて、Project追加の成否（失敗時は上記の権限エラーの可能性も含めて）を人間に伝える。

## ステップ5: 登録後に指摘を受けたときの直接編集

人間はチャット上ではなくGitHub上でIssueの内容を確認する運用のため、修正が必要な場合はあとからチャットで指摘が来る。このとき、新しいIssueを作り直すのではなく、登録済みのGitHub Issueそのものを編集する。ローカルに下書きファイルは存在しないため、正はGitHub Issueに一本化されている。

1. 対象のGitHub Issueを特定する。指摘にIssue番号やURLが含まれていればそれを使う。含まれていなければ、直近のやり取りで登録したIssue、または`mcp__MCP_DOCKER__search_issues`等での検索から特定し、それでも不明なら人間に確認する。
2. `mcp__MCP_DOCKER__issue_write`（`method: "update"`）で該当Issueの本文・タイトル・ラベルを直接書き換える。新しいIssueを作り直したり、別のIssueを追加登録したりしない。
3. 何を編集したかを簡潔に人間へ伝える。

## 注意点まとめ

- `.github/issues/Readme.md`がフェーズ対応表のSSOT。表の内容はこのファイルに書き写さず、毎回読みにいく。
- `.github/labels.yml`がGitHub登録時に設定するラベルのSSOT。固定のラベル名を使わず、毎回このファイルから選ぶ。
- Issue本文はチャット上で組み立てるだけで、`.github/issues/`配下にファイルとして保存しない。承認待ちもしない。
- 登録先は常に`origin`リモートのリポジトリ。
- `issue_write`と`create_issue`を取り違えない（前者がGitHub、後者はGitLab）。
- GitHub Projectの登録先（owner・プロジェクト番号）はこのスキル本体に書かず、`config/project.json`（Git追跡対象外）から読む。無ければ人間に尋ねて作成する — これは異常系ではなく、このリポジトリで初めて使うときの通常の流れである。
- Issue登録後は`config/project.json`の設定（`enabled: false`でなければ）に従って`gh project item-add`でGitHub Projectに追加する。`project`スコープ不足で失敗した場合は自己判断で回避せず、人間に`gh auth refresh -s project`を依頼する。
- 登録後に人間から修正を指摘されたら、登録済みのGitHub Issueを`issue_write`（update）で直接編集する。
