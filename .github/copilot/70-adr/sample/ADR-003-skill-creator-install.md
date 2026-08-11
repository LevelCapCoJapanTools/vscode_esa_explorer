# ADR-003: skill-creator スキルの導入
- Status: Accepted
- Date: 2026-05-31

## Context

- 本プロジェクトでは Claude Code / GitHub Copilot / Codex / Gemini CLI などの AI エージェントを開発補助に活用している。
- カスタムスキル（エージェントへの指示テンプレート）を体系的に作成・評価・改善するためのフレームワークが必要になった。
- `gh skill` CLI を使ったスキル管理機構が Anthropic より公開されており、プロジェクトスコープでのインストールが可能。

## Decision

`anthropics/skills` リポジトリの `skill-creator` スキル（ref: `da20c925`）をプロジェクトスコープにインストールする。

```bash
gh skill install anthropics/skills skill-creator
```

インストール先:
- `.agents/skills/skill-creator/` — GitHub Copilot / Codex / Gemini CLI 向け
- `.claude/skills/skill-creator/` — Claude Code 向け

対象エージェント: GitHub Copilot, Claude Code, Codex, Gemini CLI

## 使い方（中学生でもわかる解説）

### スキルは「レシピ本」のようなもの

インストールしただけでは何も起きません。

スキルは **ライブラリ（道具箱）** です。「ADR を書いて」のような仕事を AI エージェントに頼んだとき、エージェントが必要に応じて参照します。最初は**明示的に呼び出す**のが一番わかりやすい方法です。

---

### 基本の呼び出し方

GitHub Copilot Chat や Claude Code のチャット欄にこう入力します。

```text
skill-creator を使って ADR作成スキルを作ってください。
```

または

```text
skill-creator スキルを使って Design Issue作成スキルを設計してください。
```

すると `skill-creator` の手順に従い、エージェントが **1問1答のインタビュー** を始めます。

1. 「このスキルの目的は何ですか？」
2. 「どんなときに発動させたいですか？（発火条件）」
3. 「どんな形で出力してほしいですか？（出力形式）」
4. テストケースを自動生成
5. `SKILL.md` を自動生成

---

### 最初の練習：ADR作成スキルを作る

このプロジェクトで最初に試すのにちょうど良い例題です。Copilot Agent や Claude Code にこう投げてください。

```text
skill-creator スキルを使って ADR作成支援スキルを作成してください。

要件:
- ADR は意思決定の記録であり、機能仕様書ではない
- 人間との1問1答で確定した内容のみ記録する
- 中学三年生でも理解できる課題説明を含める
- AI が勝手に ADR を増やさない
```

すると skill-creator が次のようなインタビューを返します。

```text
ADR作成スキルを作るために確認させてください。
1. 発火条件は？（例: 「ADR を書いて」と言われたとき）
2. テンプレートは .github/copilot/70-adr/ADR-template.md を使いますか？
3. 出力先のファイルパスのルールは？
...
```

答えながら進めると、専用スキルファイルが生成されます。

---

### skill-creator は「スキル工場」

`skill-creator` の本当の価値は、繰り返し使えることです。

```
skill-creator → ADR作成スキル       → .claude/skills/adr-writer/
skill-creator → Design Issue作成スキル → .claude/skills/design-issue-writer/
skill-creator → PR レビュースキル    → .claude/skills/pr-reviewer/
```

このように **専用スキルを量産する親スキル** として機能します。一度スキルを作れば、次からは短い指示だけで同じ品質の仕事をエージェントに依頼できるようになります。

---

## Consequences

- 正の影響:
  - `/skill-creator` コマンドで新規スキルの作成・既存スキルの改善・評価（eval）が可能になる。
  - スキルのベンチマークや説明文最適化もスクリプト（`scripts/` 以下）で自動化できる。
  - 複数エージェントへの一括適用により、エージェント間でスキル定義を統一できる。
- 負の影響 / トレードオフ:
  - サードパーティスキルのため、プロンプトインジェクションのリスクがゼロではない（`gh skill preview` でレビュー済み）。
  - `.agents/` および `.claude/skills/` 以下のファイルがリポジトリに追加されるため、サイズが若干増加する。
- ロールバック方針: 不要になった場合は `.agents/skills/skill-creator/` と `.claude/skills/skill-creator/` を削除する。

## Alternatives Considered

- **手動でスキルを記述**: スキルの評価・改善フローが属人的になるため不採用。
- **スキルを導入しない**: エージェントへの指示が散在しやすく、再利用性が低下するため不採用。

## References

- インストールコマンド: `gh skill install anthropics/skills skill-creator`
- スキルプレビュー: `gh skill preview anthropics/skills skill-creator@da20c92503b2e8ff1cf28ca81a0df4673debdbf7`
- インストール日時: 2026-05-31
- インストール担当: Yoshio Nishiyama
