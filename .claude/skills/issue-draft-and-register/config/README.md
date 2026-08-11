# config/

このディレクトリには、`issue-draft-and-register` スキルが「どのGitHub Projectに登録済みIssueを追加するか」を判断するための、**このリポジトリ固有の設定**を置く。

## なぜこのディレクトリが必要か

このスキル自体（`SKILL.md`）は組織やプロジェクトをまたいで使い回せる汎用的な作りにしているが、「Issueをどのプロジェクトボードに追加するか」だけは、スキルを使うリポジトリごとに異なる。この値をスキル本体（`SKILL.md`）に直接書いてしまうと、他のリポジトリへこのスキルフォルダをコピー（インポート）したときに、コピー元の組織のプロジェクトへ誤って登録してしまう事故につながる。そのため、この値だけを本体から切り離し、このリポジトリだけのローカル設定として保持する。

## `project.json`

実際の設定ファイル。**`.gitignore`により追跡対象外**なので、リポジトリをコミット・pushしても含まれず、このスキルフォルダを他のリポジトリへコピーしたときにも一緒には渡らない。

存在しない場合、スキルはGitHub Projectへの追加が必要になったタイミングで人間に登録先を尋ね、回答をもとにこのファイルを自動生成する。フォーマットは `project.json.example` を参照。

```json
{
  "enabled": true,
  "owner": "your-org-or-user",
  "projectNumber": 1,
  "projectName": "Human-readable project name (for logging only, not used programmatically)"
}
```

- `enabled`: `false` の場合、GitHub Projectへの追加そのものをスキップする（Projectを使わない運用の場合）。
- `owner`: GitHub Project（Projects v2）のowner。Organizationまたはユーザー名。
- `projectNumber`: `https://github.com/orgs/<owner>/projects/<projectNumber>` のプロジェクト番号。
- `projectName`: 人間が読むための名前（ログ・報告に使うだけで、API呼び出しには使わない）。

## このリポジトリを別プロジェクトへコピーする場合

`project.json` はコミットされないため、コピー先のリポジトリで初めてこのスキルがGitHub Project登録を行うタイミングで、あらためて人間に登録先を尋ね、そのリポジトリ用の `project.json` を新規作成する。手動で先に作っておいても構わない。
