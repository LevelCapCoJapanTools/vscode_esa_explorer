# パス別の実務ルール

共通入口は [00-index.md](../copilot/00-index.md) です。ここには `*.instructions.md` という名前でルールを配置します。

- `applyTo` は glob を表す文字列とし、複数パターンはカンマで区切ります。
- Codex・Claude Code は、対象パスに一致するルールを共通入口の参照順に従って明示的に読みます。
- コミットメッセージのルールはファイルパスではなく操作に対するルールのため、共通規範からの参照に従って読みます。

根拠: [GitHub Copilot のリポジトリカスタム指示](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/add-custom-instructions/add-repository-instructions)。
