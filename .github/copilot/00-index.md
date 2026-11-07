# 00 Index — Codex / Claude Code / GitHub Copilot 共通の入口（SSOT）

このファイルは Codex・Claude Code・GitHub Copilot 共通の **設計・実装・運用ルールの入口** です。全タスク共通の規範は `.github/copilot-instructions.md`、パス別の実務ルールは `.github/instructions/**/*.instructions.md`、技術仕様の詳細は本ディレクトリに集約します。エージェントの振る舞い・出力言語・レビュー方針は [AGENTS.md](../../AGENTS.md) を正とします。

## エージェント別の入口

| エージェント   | 入口ファイル                                          | 共通 SSOT の読み方                                               |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Codex          | [AGENTS.md](../../AGENTS.md)                          | 本ファイルを開き、下記の参照順に従う                             |
| Claude Code    | [CLAUDE.md](../../CLAUDE.md)                          | import で本ファイルと `AGENTS.md` を読み込み、下記の参照順に従う |
| GitHub Copilot | [copilot-instructions.md](../copilot-instructions.md) | 本ファイルと `AGENTS.md` を開き、下記の参照順に従う              |

入口ファイルに別の参照順や技術仕様のコピーを作らない。Codex・Claude Code は `.github/instructions/` の自動適用を前提とせず、変更対象パスが `applyTo` に一致するファイルを明示的に読む。GitHub Copilot でも、利用機能や設定によって自動読み込みの対応範囲が異なるため、必要なファイルを確認する。

読み込み方式の根拠: [OpenAI Docs](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Claude Code Docs](https://code.claude.com/docs/en/memory#import-additional-files)、[GitHub Docs](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)。

## 参照順（優先度順）

※ 構成定義レイヤはリポジトリ全体の前提となるため最初に参照してください。番号は通常の昇順で付与しています。

1. [構成定義レイヤ](05-structure/single-repo.md) — 単一リポジトリ運用ルール
2. [copilot-instructions.md](../copilot-instructions.md) — 規範層（短く強いルール）
3. [.github/instructions/**/*.instructions.md](../instructions) — パス別の実務ルール（`applyTo` は適用対象のパスを示す）
4. [10-requirements.md](10-requirements.md) — 要件とスコープ/受入条件
5. [20-architecture.md](20-architecture.md) — 設計方針・責務分担
6. [30-coding-standards.md](30-coding-standards.md) — コーディング規約
7. [40-testing-strategy.md](40-testing-strategy.md) — テスト戦略
8. [50-security.md](50-security.md) — セキュリティ要求
9. [60-ci-quality-gates.md](60-ci-quality-gates.md) — CI 品質ゲート
10. [70-adr/](70-adr/) — 重要判断の履歴
11. [80-templates/](80-templates/) — plan / PR / review のテンプレート
12. [plans/](plans/) — フェーズ別の実装/設計計画（例: 33-implementation-plan.md）
13. [90-research/](90-research/) — RESEARCH フェーズの成果物。DESIGN、IMPLEMENT フェーズのインプット資料でもあります。

## 優先順位と矛盾時の扱い

- 上記はリポジトリ内の技術仕様・実装ルールの優先順位。出力言語・レビュー形式などの振る舞いは `AGENTS.md` に従う。
- 確定 plan は IMPLEMENT の一次入力であり、上位の SSOT を上書きしない。矛盾や不足があれば実装を開始せず、DESIGN に差し戻して plan と関連仕様を整合させる。
- テンプレートは記述形式を定義する。テンプレート内の例・制約が技術仕様と矛盾した場合は、上位の SSOT に合わせて訂正する。
- `sample/` 配下は参考例、`.github/scaffold/` 配下は他構成への導入用資料であり、本リポジトリの確定仕様として扱わない。

## 使い方

- PR作成時は、`80-templates/pr-checklist.md`の品質ゲートを通過させること。
- PR種別に応じて対応するテンプレートを必ず使用する：
  - DESIGN PR → [.github/PULL_REQUEST_TEMPLATE/design.md](../PULL_REQUEST_TEMPLATE/design.md)
  - IMPLEMENT PR → [.github/PULL_REQUEST_TEMPLATE/implement.md](../PULL_REQUEST_TEMPLATE/implement.md)
  - RESEARCH PR → [.github/PULL_REQUEST_TEMPLATE/research.md](../PULL_REQUEST_TEMPLATE/research.md)
  - BLIND PR → [.github/PULL_REQUEST_TEMPLATE/blind.md](../PULL_REQUEST_TEMPLATE/blind.md)
- テンプレートの役割を混在させないこと：
  - PRテンプレート（`.github/PULL_REQUEST_TEMPLATE/*.md`）は人間レビュー用の説明フォーマットとして使う。
  - `80-templates/implementation-plan.md` は設計Agentから製造Agentへの引き渡し仕様として使う。
  - IMPLEMENT Issue の製造時は、確定した plan Markdown を一次入力（主入力）として実装する。
- DI 起点・依存境界はテンプレートではなく [20-architecture.md](20-architecture.md) を正とする。
- **設計フェーズ (Phase A)**: `80-templates/implementation-plan.md` に沿って plan を作成し、`10-60` の仕様を満たすこと。
- **実装フェーズ (Phase B)**: 確定 plan の範囲内で実装し、`60-ci-quality-gates.md` の品質ゲートを通過させること。
- 仕様変更・追記は本ディレクトリに集約し、重複や分散を避ける。
