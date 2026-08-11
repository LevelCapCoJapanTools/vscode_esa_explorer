---
name: "(このテンプレートは使用しない)"
about: フェーズ別テンプレートを選択してください。このテンプレートは直接使用しないでください。
---

<!-- このテンプレートは使用しないでください。以下のフェーズ別テンプレートを使用してください。 -->

# ⚠️ フェーズ別テンプレートを使用してください

このテンプレートは使用しません。イシューのフェーズに応じて以下を選択してください。

| イシューフェーズ               | PRテンプレート                               |
| ------------------------------ | -------------------------------------------- |
| `[RESEARCH]` 調査              | `.github/PULL_REQUEST_TEMPLATE/research.md`  |
| `[DESIGN]` 設計                | `.github/PULL_REQUEST_TEMPLATE/design.md`    |
| `[IMPLEMENT]` 実装             | `.github/PULL_REQUEST_TEMPLATE/implement.md` |
| `[BLIND]` 参照禁止条件下の変更 | `.github/PULL_REQUEST_TEMPLATE/blind.md`     |

## Copilot へ

`copilot-instructions.md` の指示に従い、イシュータイトルのフェーズプレフィックス（`[IMPLEMENT]` 等）を読み取り、対応するテンプレートファイルの内容でPR本文を作成すること。このファイルの内容をPR本文に使用しないこと。
