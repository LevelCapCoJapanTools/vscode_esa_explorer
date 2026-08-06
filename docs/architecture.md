# アーキテクチャ

esa Explorer は、esa.io の記事を VS Code 上で扱うための拡張機能です。責務ごとにモジュールを分離しています。

## レイヤー構成

```
extension.ts (エントリポイント / DIと登録)
├── api/          esa Public API v1 クライアント
│   ├── EsaApiClient.ts   HTTP呼び出し・ページネーション・型ガード
│   ├── EsaApiError.ts    構造化エラー（status/code/レート制限情報）
│   └── types.ts          APIレスポンスの型定義
├── authentication/
│   └── CredentialService.ts  SecretStorageとチーム名設定、接続確認UI
├── cache/
│   └── PostCache.ts      記事本文とリビジョンのメモリキャッシュ
├── filesystem/
│   ├── EsaUri.ts         esa: URIの生成・解析
│   └── EsaFileSystemProvider.ts  仮想FS（読み込み/保存=API PATCH）
├── tree/
│   ├── CategoryTree.ts   カテゴリ文字列から階層ツリーを構築（純粋関数）
│   ├── EsaTreeItem.ts    TreeItem実装（カテゴリ/記事）
│   └── EsaPostTreeProvider.ts  TreeDataProvider
├── commands/     コマンドハンドラ登録
├── logging/      OutputChannelラッパー
├── configuration.ts  設定アクセス
└── constants.ts  定数
```

## データフロー

1. `configure` コマンドでチーム名とトークンを入力し、`checkConnection` で接続確認後に保存。
2. Tree View 表示時に `EsaApiClient.listAllPosts` で全記事を取得し、`buildCategoryTree` でカテゴリ階層を構築。
3. 記事を開くと `esa://<team>/posts/<number>.md` を `openTextDocument` で開き、`EsaFileSystemProvider.readFile` が本文を返す。
4. 保存時は `EsaFileSystemProvider.writeFile` が `original_revision` 付きで `updatePost` を呼び、3-way merge に対応。

## セキュリティ

- Personal Access Token は `context.secrets`（SecretStorage）にのみ保存。
- トークンはログ・エラーメッセージに含めない。
- `Authorization` ヘッダーは実行時にのみ組み立てる。
