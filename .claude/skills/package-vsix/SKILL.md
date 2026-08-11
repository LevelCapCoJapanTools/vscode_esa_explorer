---
name: package-vsix
description: esa Explorer（VS Code拡張機能）のリリース用 .vsix パッケージを再現可能な手順で作成するスキル（事前検証→バージョン更新→CHANGELOG更新→vsce packageの実行）。「VSIXパッケージを作って」「リリース用パッケージを作りたい」「バージョンを上げてパッケージングして」「esa-explorer.vsixを作成して」など、このリポジトリで配布用パッケージの作成に言及されたら必ず使う。VS Code Marketplaceへの実際のpublish（`vsce publish`）は、Marketplace発行者アカウントの設定や取り消しにくい公開操作を伴うため人間が判断して行う必要があり、このスキルは `.vsix` ファイルが手元に出来上がるところで止まる。
---

# Package VSIX

## これは何のためのスキルか

esa Explorer は `npm run package:vsix`（内部で `vsce package --out dist/esa-explorer.vsix` を実行）により `.vsix` パッケージを作成できる。この手順自体はローカル・可逆な操作だが、バージョン番号の更新や `CHANGELOG.md` の更新を忘れたままパッケージ化すると、配布物とリポジトリの記録がずれてしまう。このスキルは「事前検証 → バージョン更新 → CHANGELOG更新 → パッケージング」を毎回同じ順序で行い、`.vsix` ファイルが手元にできた状態で人間に引き継ぐことを目的とする。

VS Code Marketplace等への実際の公開（`vsce publish` や Marketplace管理画面からのアップロード）はこのスキルの範囲外とする。理由は、`package.json` の `publisher` が現状 `"local"`（Marketplace発行者IDではない）であり、公開用の発行者アカウント・Personal Access Tokenがこのリポジトリに設定されていないため、公開可否とその方法（Marketplace/Open VSX/社内配布のいずれか）は人間が判断する必要があるからである。

## 全体の流れ

1. 事前確認: `package.json` の現在のバージョンと `CHANGELOG.md` の記録状況を確認する
2. バージョン更新方針を人間に確認する（semverのどこを上げるか）
3. `package.json` の `version` を更新する
4. `CHANGELOG.md` に新バージョンのエントリを追記する
5. 品質ゲートを実行する（`npm run verify`）
6. パッケージングを実行する（`npm run package:vsix`）
7. 結果を報告し、公開作業（人間が行う）への引き継ぎ事項を伝えて終了する

途中で失敗したら、そこで止めて人間に判断を委ねる。失敗を自己判断で回避しない。

## ステップ1: 事前確認

```bash
grep '"version"' package.json
head -20 CHANGELOG.md
```

`package.json` の `version` と `CHANGELOG.md` の最新エントリの版数が一致しているか確認する。一致していない場合（例: 前回のパッケージング後にCHANGELOG更新を忘れている等）は、その旨を人間に報告してから次に進む。

## ステップ2: バージョン更新方針の確認

このスキルはバージョン番号を自己判断で決めない。今回の変更内容（機能追加/バグ修正/破壊的変更）を要約し、[Semantic Versioning](https://semver.org/lang/ja/) のどこを上げるか（patch/minor/major）を人間に確認する。人間から明示的な指示（「パッケージだけ作って、バージョンは上げない」等）がある場合はそれに従う。

## ステップ3: package.json のバージョン更新

人間の指示に従って `package.json` の `"version"` フィールドを更新する。`npm version` コマンドはgit tagを自動作成するため、タグ作成の要否も人間に確認してから使うかどうかを判断する（tagを作りたくない場合は `package.json` を直接編集する）。

## ステップ4: CHANGELOG.md の更新

`CHANGELOG.md` は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) 形式に従っている。既存エントリの体裁（`## [x.y.z] - YYYY-MM-DD` の見出しと `### 追加`/`### 変更`/`### 修正` 等の分類）に合わせて新エントリを追記する。日付は環境から取得できる場合は実行時点の日付を使い、不明な場合は人間に確認する。

## ステップ5: 品質ゲートの実行

```bash
npm run verify
```

`npm run verify`（`typecheck` + `lint` + `format:check` + `test`）が失敗した場合はパッケージングに進まない。失敗内容を人間に報告し、修正方針を確認する。

## ステップ6: パッケージングの実行

```bash
npm run package:vsix
```

これは内部で `vsce package --out dist/esa-explorer.vsix` を実行する（`vscode:prepublish` 経由で `npm run compile` も自動実行される）。成功すると `dist/esa-explorer.vsix` が生成される。

失敗した場合、`vsce` はパッケージ内容の不備（`README.md`/`LICENSE`欠如、`.vscodeignore`の設定、`icon`未設定など）をエラーメッセージで示すことが多い。その内容をそのまま人間に伝える。原因を推測して `package.json` の `publisher` や `contributes` を自己判断で書き換えない。

## ステップ7: 完了報告とハンドオフ

パッケージングが成功したら、それ以上は進めずに以下を人間へ伝えて終了する。

- 生成された `.vsix` のパス（`dist/esa-explorer.vsix`）とバージョン番号
- ローカルインストールして動作確認する場合のコマンド: `code --install-extension dist/esa-explorer.vsix`
- Marketplace/Open VSX 等への公開は、発行者アカウントの設定（`package.json` の `publisher` を実際のMarketplace発行者IDに変更する必要がある）を含めて人間が判断・実行すること

公開操作（`vsce publish` や Marketplace管理画面からのアップロード）自体は代行しない。取り消しにくい外部公開操作であり、発行者アカウントの権限を持つ人間が明示的に実行するものである。

## 注意点まとめ

- バージョン番号（semverのどこを上げるか）は自己判断せず、毎回人間に確認する。
- 事前確認→バージョン更新→CHANGELOG更新→品質ゲート→パッケージングの順序を守り、途中の失敗で先に進まない。
- `vsce package` 失敗時に `package.json` の `publisher`/`contributes` 等を自己判断で変更しない。
- パッケージング成功後、Marketplace等への実際の公開は必ず人間が行う。このスキルは `.vsix` の生成で終わる。
