# .github/issues/

AI Agent（Claude Code等）がGitHub ProjectのDraft issue（下書き項目）を起票する際に参照するテンプレート対応表と、参考例の置き場です。`issue-draft-and-register`スキル（`.claude/skills/issue-draft-and-register/`）は、ここに書かれた対応表をもとに本文をその場で組み立て、ファイルとして保存せずに直接GitHub ProjectへDraft issueとして登録します。実リポジトリのIssueは作成しません。

## ディレクトリ構造

```
.github/issues/
├── Readme.md           # このファイル（フェーズ対応表のSSOT）
├── research/sample/    # [RESEARCH] の参考例（過去の起票例。ボリューム感の参考用）
├── design/sample/      # [DESIGN] の参考例
└── implement/sample/   # [IMPLEMENT] の参考例
```

`[BLIND]` は現時点で参考例がない。必要になったら `blind/sample/` を作成して追加する。

`sample/` 配下のファイルは実際にIssue/Draft issueとして登録された内容の参考例であり、これ自体が登録されることはない。AIが本文を組み立てる際にボリューム感・記述粒度を合わせる目的でのみ参照する。

## 対応するイシューテンプレート

Draft issueにはラベルを設定できないため、フェーズの区別はタイトルのプレフィックス（`[DESIGN]`等）と本文で表す。

| フェーズ      | テンプレートファイル                       |
| ------------- | ------------------------------------------ |
| `[RESEARCH]`  | `.github/ISSUE_TEMPLATE/research_task.md`  |
| `[DESIGN]`    | `.github/ISSUE_TEMPLATE/design_task.md`    |
| `[IMPLEMENT]` | `.github/ISSUE_TEMPLATE/implement_task.md` |
| `[BLIND]`     | `.github/ISSUE_TEMPLATE/blind_template.md` |

## AIへの依頼方法

Claude Code に対して次のように依頼すると、`issue-draft-and-register`スキルが起票から登録まで行います。

```
タグによるフィルタ表示機能の [DESIGN] イシューを起票してください。
```

## 人間が手動で登録する場合

`.github/ISSUE_TEMPLATE/` のテンプレートを選び、GitHub ProjectのUI上で「+ Add item」からDraft issueとして直接入力するか、`gh` CLI を使います。

```bash
gh project item-create 3 --owner LevelCapCoJapanTools \
  --title "[DESIGN] タグによるフィルタ表示" \
  --body-file <作成したMarkdownファイル>
```

このProjectの登録先（owner・プロジェクト番号）は、`issue-draft-and-register`スキルが自動で行う場合はリポジトリ直書きではなく `.claude/skills/issue-draft-and-register/config/project.json`（Git追跡対象外のローカル設定）から読み込む。詳細は `config/README.md` を参照。

着手する段階になったら、GitHub Project上でDraft issueを選び「Convert to issue」を実行して実リポジトリのIssueにする（ラベル付与もこのタイミングで行う）。

## 運用ルール

- **その場で組み立てて直接Draft issueとして登録する**：`issue-draft-and-register`スキルは、チャット上の事前承認を挟まず、テンプレートに沿って組み立てた内容をそのままGitHub ProjectにDraft issueとして登録する。実リポジトリのIssueは作らない。人間はGitHub Project上で登録結果を確認し、修正が必要な場合はチャットで指摘する。指摘を受けたら新しいDraft issueを作り直さず、登録済みのDraft issueを直接編集して反映する。
- **プレースホルダーの残存禁止**：`★` や `<foo>` が残ったまま登録しない。
- **フェーズを横断しない**：1 Draft issue 1フェーズ。DESIGN と IMPLEMENT を混在させない。
