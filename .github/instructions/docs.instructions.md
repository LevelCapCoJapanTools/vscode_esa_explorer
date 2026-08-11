---
name: Documentation rules
description: Markdown ドキュメントに適用する実務ルール
applyTo:
  - "docs/**/*.md"
  - "README.md"
  - ".github/copilot/**/*.md"
---
- 見出しは階層を崩さずに使用し、一覧・手順は箇条書きで簡潔にまとめる。
- 相対リンクを優先し、`00-index.md` から辿れるようにする。重複した記述は SSOT に統合する。
- Mermaid を使う場合は ```mermaid フェンスを用い、フローの入口・分岐・終了を明示する。詳細な記法ルールは `.github/instructions/mermaid.instructions.md` を参照し、**バッククォートをラベル内で使わない**・**flowchart ラベルはダブルクォートで囲む** の 2 点を特に守ること。専用CI（mermaid-lint等）は現状未設定のため、`.github/instructions/mermaid.instructions.md` の手順でローカル確認すること。
- Secrets/PII を記載しない。サンプル値はダミーを用いる。
- テンプレートは `80-templates` を参照し、改変時は互換性を考慮して最小限の差分にとどめる。
- ADR（`.github/copilot/70-adr/*.md`）の作成・更新は `.github/copilot/70-adr/ADR-template.md` を唯一のテンプレートとして使用する。各セクションのルール（根拠レベル・決定粒度・確定度の定義など）に従うこと。
- ADR 新規作成は「AI が質問 → 人間が回答 → AI が記述」のフローを厳守する。未確認項目を推論で補完してはならない。
- `Accepted` の ADR に「または」「必要に応じて」などの未確定表現を残さない。
- ADR 本文にスクリプト全文・テスト assertion・実行コマンド全文を置かない。実装詳細は実装 Issue / PR へ委譲する。
