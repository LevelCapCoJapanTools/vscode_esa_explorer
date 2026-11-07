# 実装plan: 記事の新規作成（ローカルDraft → 初回保存で昇格）

> 本plan は `.github/copilot/80-templates/implementation-plan.md` に準拠する。
> 設計判断の根拠は [ADR-006 ローカルDraftと昇格モデル](../70-adr/ADR-006-local-draft-promotion.md) を参照する。

---

## 0. メタ情報

### 0.1 変更サマリ

| 対象                                           | 変更タイプ | 影響レベル | 互換性 | 概要                                                         |
| ---------------------------------------------- | ---------- | ---------- | ------ | ------------------------------------------------------------ |
| `src/constants.ts`                             | 変更       | S          | 非破壊 | `ESA_DRAFT_URI_SCHEME = "esa-draft"` を追加                  |
| `src/api/types.ts`                             | 変更       | S          | 非破壊 | `CreatePostInput` / `EsaAuthenticatedUser` 型を追加          |
| `src/api/EsaApiClient.ts`                      | 変更       | M          | 非破壊 | `createPost` / `getAuthenticatedUser` を追加                 |
| `src/filesystem/EsaDraftUri.ts`                | 追加       | S          | 非破壊 | `esa-draft:` URI の生成・解析                                |
| `src/filesystem/EsaDraftFileSystemProvider.ts` | 追加       | L          | 非破壊 | 書き込み可能な Draft 用 FileSystemProvider（初回保存で昇格） |
| `src/draft/EsaDraftManager.ts`                 | 追加       | M          | 非破壊 | Draft の識別・初期カテゴリ・作成済み記事の確認情報を管理     |
| `src/commands/createDraftCommand.ts`           | 追加       | M          | 非破壊 | New Post / New Post Here のコマンドハンドラ                  |
| `src/extension.ts`                             | 変更       | M          | 非破壊 | Draft Provider・コマンド登録、DI 配線                        |
| `package.json`                                 | 変更       | S          | 非破壊 | `contributes.commands` / `menus` / `activationEvents` 追記   |
| `src/test/**`                                  | 追加       | M          | 非破壊 | 単体・統合テスト追加                                         |

**方針の核心**: esa.io 本体の挙動に合わせ、New Post は即時にサーバへ記事を作らない。まずローカルの一時 Draft（`esa-draft:` スキーム）としてエディタを開き、**最初の保存（`Ctrl/Cmd+S`）でリモート記事へ昇格（`POST /teams/:team/posts`）** する。既存の `EsaFileSystemProvider.writeFile` による `create` 拒否（`:96-98`）は**変更しない**。

### 0.2 関連ドキュメント

| 種別         | パス / URL                                                                                                                 | 参照理由                                         |
| ------------ | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| ADR          | `.github/copilot/70-adr/ADR-006-local-draft-promotion.md`                                                                  | 本planの設計判断の根拠                           |
| 要件         | `.github/copilot/10-requirements.md` §4.2                                                                                  | 記事の新規作成の要件                             |
| アーキ       | `.github/copilot/20-architecture.md`                                                                                       | レイヤ境界（UI / Provider・Service / ApiClient） |
| セキュリティ | `.github/copilot/50-security.md`                                                                                           | Personal Access Token の保管方針                 |
| API 仕様     | esa Public API v1 `POST /v1/teams/:team_name/posts`                                                                        | 記事作成エンドポイント                           |
| API 仕様     | [esa Public API v1（GET /v1/user）](https://docs.esa.io/posts/102)                                                         | 認証ユーザーの `screen_name` 取得                |
| VS Code API  | [workspace.applyEdit / onDidSaveTextDocument](https://code.visualstudio.com/api/references/vscode-api#workspace.applyEdit) | 未保存本文の引継ぎと保存完了後のクローズ         |

### 0.3 ADR 参照

| ADR                               | 状態     | 本planへの反映                                                                  |
| --------------------------------- | -------- | ------------------------------------------------------------------------------- |
| ADR-006 ローカルDraftと昇格モデル | Accepted | Draft-first フロー・`esa-draft:` スキーム・昇格トランザクション順序を全章に反映 |

---

## 1. 目的とゴール

### 1.1 目的

VS Code から esa.io チームへ新規記事を作成できるようにする。ただし esa.io 本体の編集体験（NEW POST 直後は未確定、書き始めてから一時保存で記事化）に合わせ、**新規作成の瞬間にサーバ記事を作らず、初回保存で昇格させる**フローを採用する。

### 1.2 ゴール（Doneの定義）

- [ ] Tree View 右上ボタン（New Post）／カテゴリ右クリック（New Post Here）／コマンドパレットから Draft を開始できる。
- [ ] Draft はローカルの `esa-draft:` ドキュメントとして開き、この時点ではネットワーク通信・記事番号を持たない。
- [ ] Draft の初回保存で `POST /teams/:team/posts`（`name="Untitled"`, `wip=true`, `category`, `body_md`）を実行し、リモート記事 `#N` に昇格する。
- [ ] POST 成功後、リモート記事 `esa:` ドキュメントへ Draft の最新本文を未保存変更として引き継ぐ。本文と版の整合・対象 Draft タブのクローズ成功を確認してから Draft を破棄し、以降の保存は既存の `updatePost`（PATCH）で `#N` を更新する。
- [ ] POST 成功後に `esa:` オープン・本文引継ぎ・Draft クローズのいずれかが失敗した場合は Draft と作成済み記事番号を保持する。再保存時は追加 POST/PATCH を行わず、既存記事への切替を再試行する。
- [ ] 昇格失敗時は Draft を破棄せず本文を保持し、エラーを通知する。
- [ ] lint / typecheck / test / security の CI 品質ゲートが全て緑。

### 1.3 非ゴール

- 記事の削除（別Issue）。
- タイトル変更 UI（Rename Post コマンドは別Issue、本planは扱わない）。
- WIP / 公開（ship）切替 UI（本planは初期値 `wip=true` の決定のみ）。
- 複数チーム同時接続。
- Draft のディスク永続化（VS Code 再起動をまたぐ保持）。

---

## 2. 前提条件

- 単一チーム接続前提（`10-requirements.md` §3）。
- Personal Access Token は `CredentialService`（`SecretStorage`）経由でのみ取得する（`50-security.md`）。
- `EsaApiClient` は `listAllPosts` / `getPost` / `updatePost` / `checkConnection` を持ち、`createPost` / `getAuthenticatedUser` は未実装。
- `EsaFileSystemProvider` は `esa:` スキームを担当し、`writeFile` の `options.create` を拒否する（`:96-98`）。
- Tree View（`esaExplorer.posts`）は `PostTreeProvider` が提供し、`refresh()` は Promise を返す。

---

## 3. 要件

### 3.1 機能要件（FR）

| ID     | 要件                                                                                                                                                                                                                                     | 根拠                |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| FR-01  | New Post 操作で `esa-draft:` ドキュメントを開く。この時点でネットワーク通信を行わない。                                                                                                                                                  | ADR-006 §決定       |
| FR-02  | Draft の初回保存を `EsaDraftFileSystemProvider.writeFile` が検知し、昇格処理を開始する。                                                                                                                                                 | ADR-006 §決定       |
| FR-03  | 昇格は `POST /teams/:team/posts` を `{ post: { name, body_md, category, wip } }` 形式で送信する。                                                                                                                                        | esa API             |
| FR-04  | 昇格時の既定値は `name="Untitled"`、`wip=true`、`category` は入力元に応じて決定する。                                                                                                                                                    | ADR-006 §決定       |
| FR-05  | 昇格トランザクションの順序は POST 成功 → `PostCache` 登録 → 作成済みメタ情報の記録 → `esa:` を開く → 最新本文の引継ぎと版の確認 → 保存完了後の Draft クローズ → Draft 破棄、とする。                                                     | ADR-006 §決定       |
| FR-05b | POST 成功後の切替未完了は PROMOTED_PENDING_OPEN として保持する。再保存は追加 POST/PATCH を行わず、作成済み記事への open と最新本文の未保存変更への引継ぎを再試行する。引継ぎ不能・版変化・クローズ失敗では Draft を破棄しない。          | ADR-006 §確定8      |
| FR-06  | 昇格失敗時は Draft を破棄せず本文を保持し、`showErrorMessage` で通知する。                                                                                                                                                               | ADR-006 §決定       |
| FR-07  | タイトル入力を要求しない。Markdown 本文の先頭行をタイトルとして解釈しない。                                                                                                                                                              | ADR-006 §決定       |
| FR-08  | カテゴリは、右クリック起点なら当該カテゴリ、New Post 起点なら `GET /user` の応答を検証して `Users/{screen_name}` を使う。取得・検証に失敗した場合は POST せず Draft を保持して通知する。明示カテゴリがある場合はユーザー取得を行わない。 | ADR-006 §決定       |
| FR-09  | 昇格応答は `isEsaPost` で検証し、不正応答は `EsaApiError` として扱う。                                                                                                                                                                   | 既存パターン        |
| FR-10  | 未認証（トークン無/失効）時は昇格せず、Draft を保持したままエラーを通知する。                                                                                                                                                            | ADR-006 §決定       |
| FR-11  | 既存 `EsaFileSystemProvider.writeFile` の `create` 拒否（`:96-98`）は変更しない。                                                                                                                                                        | ADR-006 §スコープ外 |

### 3.2 非機能要件（NFR）

| ID     | 要件                                                                                  | 根拠                 |
| ------ | ------------------------------------------------------------------------------------- | -------------------- |
| NFR-01 | トークンをログ・エラーメッセージ・ドキュメントに出力しない。                          | `50-security.md`     |
| NFR-02 | New Post はネットワーク通信を行わず即時にエディタを開く（UI をブロックしない）。      | `20-architecture.md` |
| NFR-03 | UI 層は `api/` の HTTP 実装を直接 import せず、`EsaApiError` と Provider 経由で扱う。 | `20-architecture.md` |

---

## 4. スコープ

### 4.1 In-Scope

- `esa-draft:` スキームと `EsaDraftFileSystemProvider`（書き込み可能）。
- `EsaDraftManager`（Draft メタデータ管理）。
- `createDraftCommand`（New Post / New Post Here）。
- `EsaApiClient.createPost` / `EsaApiClient.getAuthenticatedUser`。
- `package.json` の contributes（commands / menus / activationEvents）。

### 4.2 Out-of-Scope

| 対象                                     | 理由                                |
| ---------------------------------------- | ----------------------------------- |
| 記事の削除                               | 別Issue。                           |
| Rename Post（タイトル変更）              | 別Issue。昇格時は `Untitled` 固定。 |
| WIP / ship 切替 UI                       | 本planは初期値のみ扱う。            |
| `EsaFileSystemProvider` の `create` 対応 | Draft 昇格方式のため FS 層は不変。  |
| Draft のディスク永続化                   | メモリ保持のみ（再起動で破棄）。    |

---

## 5. アーキテクチャ

### 5.1 レイヤ配置

| レイヤ            | 追加/変更                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| UI                | `createDraftCommand`（`showInputBox` を使わない）、`package.json` 導線 |
| Provider・Service | `EsaDraftFileSystemProvider`、`EsaDraftManager`、`EsaDraftUri`         |
| ApiClient         | `EsaApiClient.createPost`、`EsaApiClient.getAuthenticatedUser`         |

### 5.2 URI スキーム

- 既存: `esa://{team}/posts/{N}.md`（リモート記事、`EsaFileSystemProvider`）。
- 追加: `esa-draft://{team}/{uuid}.md`（ローカル Draft、`EsaDraftFileSystemProvider`）。
- Draft は記事番号を持たないため、識別子に UUID を用いる。昇格後は `esa:` へ切り替え、`esa-draft:` は破棄する。URI の同一性は変更できないため、昇格は「別ドキュメントを開いて Draft を閉じる」で表現する。

### 5.3 シーケンス図

#### SEQ-01 正常系（Draft 作成 → 初回保存で昇格）

```mermaid
sequenceDiagram
    actor User as 利用者
    participant Cmd as createDraftCommand
    participant Mgr as EsaDraftManager
    participant DP as EsaDraftFileSystemProvider
    participant Api as EsaApiClient
    participant Cache as PostCache
    participant Tree as PostTreeProvider
    participant VS as VS Code

    User->>Cmd: New Post ［カテゴリ任意］
    Cmd->>Mgr: register ［uuid, initialCategory］
    Cmd->>User: esa-draft: ドキュメントを開く ［通信なし］
    User->>DP: 保存 ［writeFile draftUri, body］
    DP->>DP: 初回保存か判定
    DP->>Api: createPost ［name=Untitled, wip=true, category, body_md］
    Api-->>DP: 201 EsaPost ［#N］
    DP->>Cache: set ［#N］
    DP->>Mgr: 作成済み記事番号と応答の確認情報を記録 ［PROMOTED_PENDING_OPEN］
    DP->>VS: esa: ドキュメント ［#N］を開く
    DP->>VS: 最新本文を未保存変更へ引継ぎ ［本文と版の整合を確認］
    DP-->>VS: writeFile 完了
    VS-->>DP: Draft 保存完了 ［版不変・dirty なし］
    DP->>VS: 対象 Draft タブを閉じる
    VS-->>DP: クローズ成功
    DP->>Mgr: Draft を破棄 ［DONE］
    DP->>Tree: refresh
```

#### SEQ-01b 中間状態系（POST成功・esa: open 失敗 → 再保存）

```mermaid
sequenceDiagram
    actor User as 利用者
    participant DP as EsaDraftFileSystemProvider
    participant Mgr as EsaDraftManager
    participant VS as VS Code

    Note over DP,Mgr: 直前の保存で POST は成功済み ［promotedPostNumber=N］
    User->>DP: 再保存 ［writeFile draftUri, body］
    DP->>Mgr: promotedPostNumber を確認 ［設定済み］
    DP->>DP: 追加 POST/PATCH を呼ばない
    DP->>VS: esa: ドキュメント ［#N］の open を再試行
    VS-->>DP: open 成功
    DP->>DP: 作成応答と Cache・Remote 本文を照合
    alt 比較根拠なし・別の未保存変更・並行編集
        DP->>User: エラー通知 ［Draft を保持］
    else 引継ぎ可能
        DP->>VS: 最新本文を未保存変更へ引継ぎ
        VS-->>DP: 適用結果と本文
        alt 適用失敗・本文不一致・版変化
            DP->>User: エラー通知 ［Draft を保持］
        else 本文と版の整合を確認
            DP-->>VS: writeFile 完了
            VS-->>DP: Draft 保存完了 ［版不変・dirty なし］
            DP->>VS: 対象 Draft タブを閉じる
            VS-->>DP: クローズ結果
            alt クローズ成功
                DP->>Mgr: Draft を破棄 ［DONE］
            else クローズ失敗・キャンセル・追加編集
                DP->>User: 通知 ［Draft を保持］
            end
        end
    end
```

#### SEQ-02 業務エラー系（バリデーション・権限）

```mermaid
sequenceDiagram
    actor User as 利用者
    participant DP as EsaDraftFileSystemProvider
    participant Api as EsaApiClient

    User->>DP: 保存 ［writeFile draftUri, body］
    DP->>Api: createPost ［...］
    Api-->>DP: 4xx EsaApiError
    DP->>DP: Draft 本文を保持 ［破棄しない］
    DP->>User: showErrorMessage ［作成失敗］
```

#### SEQ-03 システムエラー系（ネットワーク断）

```mermaid
sequenceDiagram
    actor User as 利用者
    participant DP as EsaDraftFileSystemProvider
    participant Api as EsaApiClient
    participant Log as OutputChannel

    User->>DP: 保存 ［writeFile draftUri, body］
    DP->>Api: createPost ［...］
    Api-->>DP: 通信例外
    DP->>Log: エラーを構造化ログ出力
    DP->>DP: Draft 本文を保持 ［破棄しない］
    DP->>User: showErrorMessage ［作成失敗］
```

### 5.4 フロー図

#### FLOW-01 EsaApiClient.createPost

```mermaid
flowchart TD
    A["createPost 呼び出し"] --> B["POST /teams/:team/posts を request で送信"]
    B --> C{"応答は 2xx か"}
    C -->|"いいえ"| D["handleErrorResponse で EsaApiError を送出"]
    C -->|"はい"| E{"isEsaPost で検証"}
    E -->|"不正"| D
    E -->|"正常"| F["EsaPost を返す"]
```

#### FLOW-02 EsaDraftFileSystemProvider.writeFile（昇格・3状態）

昇格は `promotedPostNumber` により 3 状態（LOCAL / PROMOTED_PENDING_OPEN / DONE）で分岐する。`POST成功 → esa: open失敗` は独立分岐とし、この状態での再保存は追加 POST/PATCH を行わず、記事番号 `#N` を開いて最新本文を未保存変更として引き継ぐ。本文・版・クローズの確認が完了するまで Draft は保持する。

```mermaid
flowchart TD
    A["writeFile draftUri, body"] --> S{"Draft の状態 ［promotedPostNumber］"}
    S -->|"DONE ［Draft破棄済み・存在しない］"| Z["何もしない"]
    S -->|"PROMOTED_PENDING_OPEN ［#N 設定済み］"| R["本文をメモリに保持"]
    R --> O["esa: ［#N］の open を再試行"]
    O --> P{"open 成功か"}
    P -->|"いいえ"| Y["Draft を PROMOTED_PENDING_OPEN のまま保持し エラー通知"]
    P -->|"はい"| T["作成応答と Cache・Remote 本文を照合"]
    T --> U{"本文引継ぎ可能か"}
    U -->|"いいえ"| Y
    U -->|"はい"| V["最新本文を未保存変更へ引継ぎ"]
    V --> W{"適用成功・本文一致・版整合か"}
    W -->|"いいえ"| Y
    W -->|"はい"| X["writeFile 完了後の保存完了で 対象 Draft タブを閉じる"]
    X --> Q{"クローズ成功・追加編集なしか"}
    Q -->|"いいえ"| Y
    Q -->|"はい"| K["Draft を破棄し Tree を refresh ［DONE］"]
    S -->|"LOCAL ［未設定］"| C["本文をメモリに保持"]
    C --> D["トークンを CredentialService から取得"]
    D --> E{"トークンあり"}
    E -->|"なし"| Y2["Draft を LOCAL のまま保持し エラー通知"]
    E -->|"あり"| F{"initialCategory あり"}
    F -->|"はい"| G["createPost ［name=Untitled, wip=true, category, body_md］"]
    F -->|"未指定"| F2["GET /user の応答から screen_name を検証"]
    F2 --> F3{"取得・検証成功か"}
    F3 -->|"いいえ ［POST しない］"| Y2
    F3 -->|"はい ［Users/screen_name］"| G
    G --> H{"POST 成功か"}
    H -->|"いいえ"| Y2
    H -->|"はい"| I["PostCache 登録と作成応答の確認情報を記録 ［PROMOTED_PENDING_OPEN］"]
    I --> J["esa: ［#N］の open を試行"]
    J --> P
```

#### FLOW-03 createDraftCommand

```mermaid
flowchart TD
    A["New Post / New Post Here"] --> B["uuid 生成"]
    B --> C["EsaDraftManager へ initialCategory と共に登録"]
    C --> D["esa-draft URI を生成"]
    D --> E["openTextDocument ［空本文, markdown］"]
    E --> F["showTextDocument"]
```

### 5.5 クラス図

```mermaid
classDiagram
    class CreatePostInput {
        +string name
        +string bodyMd
        +CategoryOrNull category
        +boolean wip
        +StringList tags
        +string message
    }
    class EsaAuthenticatedUser {
        +number id
        +string screen_name
        +string name
    }
    class EsaDraft {
        +string id
        +string initialCategory
        +number promotedPostNumber
        +number promotedRevisionNumber
        +string promotedBodyDigest
    }
    class EsaDraftManager {
        +register(uri, draft) void
        +get(uri) EsaDraft
        +delete(uri) void
    }
    class EsaDraftFileSystemProvider {
        +readFile(uri) Uint8Array
        +writeFile(uri, content, options) void
        +stat(uri) FileStat
    }
    EsaDraftManager --> EsaDraft
    EsaDraftFileSystemProvider --> EsaDraftManager
    EsaDraftFileSystemProvider --> CreatePostInput
```

> 注: `CategoryOrNull` は `string | null`、`StringList` は `string[]` の別名。Mermaid ラベルの制約を避けるためのエイリアス表記。`CreatePostInput` の `name` は必須、`bodyMd` / `category` / `wip` / `tags` / `message` と、`EsaDraft` の `initialCategory` / `promotedPostNumber` / `promotedRevisionNumber` / `promotedBodyDigest` は optional。POST 成功時の 3 項目（記事番号・リビジョン番号・本文ダイジェスト）は一括記録する。

---

## 6. インターフェース・型

### 6.1 型定義（`src/api/types.ts`）

```typescript
export interface CreatePostInput {
  name: string;
  bodyMd?: string;
  tags?: string[];
  category?: string | null;
  wip?: boolean;
  message?: string;
}

export interface EsaAuthenticatedUser {
  id: number;
  screen_name: string;
  name: string;
}
```

### 6.2 Draft 型（`src/draft/EsaDraftManager.ts`）

```typescript
export interface EsaDraft {
  id: string;
  initialCategory?: string;
  /** POST 成功済みの記事番号。設定済みは PROMOTED_PENDING_OPEN（切替未完了）を表す。 */
  promotedPostNumber?: number;
  /** 作成応答のリビジョン番号。引継ぎ先の基準を確認するために保持する。 */
  promotedRevisionNumber?: number;
  /** 作成応答本文の SHA-256。本文そのものをメタデータに複製しない。 */
  promotedBodyDigest?: string;
}
```

> Draft の本文（SSOT）は `esa-draft:` ドキュメントの内容であり、`EsaDraft` には複製しない。`EsaDraftManager` は識別・初期カテゴリ・作成済み記事の確認情報のみを保持し、本文は `EsaDraftFileSystemProvider` がメモリで保持する。POST 成功時に応答の `number` / `revision_number` / `body_md` の SHA-256 を一括記録する。`promotedPostNumber` は昇格の 3 状態（未設定=LOCAL、設定済み=PROMOTED_PENDING_OPEN、破棄済み=DONE）を判別する。PROMOTED_PENDING_OPEN は open・本文引継ぎ・Draft クローズのいずれかが未完了の状態を含む。確認情報が不足する場合も再 POST はせず、Draft を保持して通知する。

### 6.3 ApiClient シグネチャ（`src/api/EsaApiClient.ts`）

```typescript
createPost(teamName: string, input: CreatePostInput, token: string): Promise<EsaPost>;
getAuthenticatedUser(token: string): Promise<EsaAuthenticatedUser>;
```

- `createPost` は `POST /teams/:team/posts` を `{ post: { name, body_md, category, wip, tags, message } }` で送信し、`isEsaPost` で検証した `EsaPost` を返す。
- `getAuthenticatedUser` は `GET /user` を呼び、応答を `unknown` として受けて `id`・`name`・空でない `screen_name` を型ガードで検証し、`EsaAuthenticatedUser` を返す。不正応答は `EsaApiError` とする。New Post 起点で `Users/{screen_name}` カテゴリを解決するために使い、明示 `initialCategory` がある場合は呼ばない。取得・検証失敗時は POST せず、Draft を保持して通知する。
- 既存 `EsaUser`（`EsaPost.created_by` / `updated_by` 用）は変更せず、認証ユーザー応答とは別の型として扱う。

---

## 7. データ

- 永続化なし。作成結果は `PostCache`（メモリ）へ反映し、Tree を `refresh` する。
- Draft 本文は `EsaDraftFileSystemProvider` のメモリ Map（`uri → Uint8Array`）で保持する。POST 失敗・切替未完了では保持を継続し、最新本文の引継ぎ・版の整合・対象 Draft タブのクローズ確認後（DONE）に破棄する。VS Code 再起動をまたぐ保持は行わない。
- Draft メタは `EsaDraftManager` のメモリで保持し、作成済み記事番号は再 POST の抑止、応答のリビジョン番号と本文ダイジェストは安全な引継ぎ先の確認に使う。ダイジェストを元に本文を生成せず、Draft 本文の SSOT を複製しない。
- `PostCache` はサーバー応答だけで更新する。引き継いだ未送信本文で `originalBodyMd` / `originalRevisionNumber` を上書きしない。以降の PATCH は既存の `original_revision` による競合処理に委ねる。

---

## 8. 実装手順

### 8.1 変更ファイル一覧

| ファイル                                       | 変更内容                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| `src/constants.ts`                             | `ESA_DRAFT_URI_SCHEME = "esa-draft"` を追加       |
| `src/api/types.ts`                             | `CreatePostInput` / `EsaAuthenticatedUser` を追加 |
| `src/api/EsaApiClient.ts`                      | `createPost` / `getAuthenticatedUser` を追加      |
| `src/filesystem/EsaDraftUri.ts`                | `buildDraftUri` / `parseDraftUri` を実装          |
| `src/filesystem/EsaDraftFileSystemProvider.ts` | 書き込み可能 Provider（初回保存で昇格）を実装     |
| `src/draft/EsaDraftManager.ts`                 | Draft メタデータ管理を実装                        |
| `src/commands/createDraftCommand.ts`           | New Post / New Post Here ハンドラを実装           |
| `src/extension.ts`                             | Draft Provider・コマンドを登録、DI を配線         |
| `package.json`                                 | commands / menus / activationEvents を追記        |
| `src/test/**`                                  | 単体・統合テストを追加                            |

### 8.2 手順

1. `constants.ts` に `ESA_DRAFT_URI_SCHEME` を追加。
2. `types.ts` に `CreatePostInput` / `EsaAuthenticatedUser` を追加。
3. `EsaApiClient` に `createPost` / `getAuthenticatedUser` を追加（既存 `request` / `handleErrorResponse` / `isEsaPost` を踏襲）。
4. `EsaDraftUri` を実装（scheme 検証・UUID パス・`.md` 拡張子）。
5. `EsaDraftManager` を実装（register/get/delete）。
6. `EsaDraftFileSystemProvider` を実装（readFile/writeFile/stat/watch/delete、昇格トランザクション、保存完了後の対象 Draft タブのクローズと破棄）。
7. `createDraftCommand` を実装（UUID 生成 → Manager 登録 → Draft を開く）。
8. `extension.ts` で `registerFileSystemProvider("esa-draft", ...)` とコマンド登録、DI 配線。
9. `package.json` に commands（`esaExplorer.createDraft` / `esaExplorer.createDraftHere`）、menus（`view/title`、`view/item/context` when `viewItem == esaCategory`）、`activationEvents`（`onFileSystem:esa-draft`）を追記。
10. テストを追加。

### 8.3 昇格トランザクションの要点

- **Draft の破棄条件**は、POST 成功・`esa:` open 成功・最新本文の引継ぎと版の整合・対象 Draft タブのクローズ成功がすべて確認できたこと。POST 失敗、本文引継ぎ不能、並行編集、open/close 失敗・キャンセル時は Draft を保持して通知する。
- 昇格は「`esa:` を開く → 本文を引き継ぐ → `esa-draft:` を閉じる」。URI 同一性は変更しない。
- 昇格は `EsaDraft.promotedPostNumber` により 3 状態で管理する。
  - **LOCAL**（未設定）: カテゴリを解決して `createPost` を実行する。`initialCategory` がない場合だけ `GET /user` で `screen_name` を取得し、取得・検証失敗時は Draft を保持して通知し、POST しない。
  - **PROMOTED_PENDING_OPEN**（`#N` 設定済み・切替未完了）: 再 `writeFile` では追加 POST/PATCH を行わず、記事番号 `#N` への切替を再試行する。
  - **DONE**（引継ぎ・クローズ成功、Draft 破棄済み）: 以降の保存は `esa:` の `updatePost` に委譲する。

#### 8.3.1 本文の引継ぎと破棄の判定

1. Draft の現在本文と `TextDocument.version` を取得し、引継ぎ用スナップショットとする。メタデータには本文の複製を保持しない。同じ Draft の保存・切替処理は直列化し、完了した版より新しい編集があれば Draft を保持する。
2. `promotedPostNumber` に対応する `esa:` ドキュメントを開く。作成応答のリビジョン番号・本文ダイジェストと `PostCache` の `originalRevisionNumber`・`originalBodyMd` が一致することを確認する。比較根拠がない、キャッシュが別リビジョン、本文が異なる場合は Draft を保持して通知し、引継ぎ先を上書きしない。
3. 引継ぎ先が clean で作成応答と同じ本文である場合だけ、Remote 側の版一致を条件に `WorkspaceEdit` でスナップショットを適用する。Remote が既に同じ本文の未保存状態なら再適用しない。別の未保存変更がある場合は Draft を保持して通知する。
4. `applyEdit` の成功、Remote の本文一致、処理中の Remote/Draft の版の整合を確認する。失敗・並行編集・不一致時は Draft を保持し、Remote の内容を勝手に巻き戻さない。ここでは追加 POST/PATCH を行わず、引き継いだ差分は Remote の未保存変更として残す。
5. Draft の `writeFile` 完了・保存完了イベントの後に、Draft の版が変わっておらず dirty でないことを再確認する。対象 URI のタブだけを閉じ、クローズ成功後に本文・メタデータを破棄する。保存処理内で dirty なタブを強制的に閉じない。クローズ失敗・キャンセル・追加編集時は Draft を保持する。
6. `PostCache` の original revision はサーバー応答のまま保ち、Remote の次回保存は既存の `original_revision` 付き PATCH を使う。未取得のサーバー更新をこの比較だけで検出できるとは扱わない。

---

## 9. テスト戦略

`@vscode/test-cli`（Mocha）。`fetch` と `SecretStorage` を差し替える。

| 分類           | ケース                                                          | 期待                                                                                                                              |
| -------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 正常           | New Post → Draft を開く                                         | ネットワーク未呼び出し、`esa-draft:` ドキュメントが開く                                                                           |
| 正常           | 初回保存で昇格                                                  | `createPost` が `{ post: {...} }` で呼ばれ `#N` に昇格                                                                            |
| 正常           | 昇格順序                                                        | POST 成功後に Cache 登録・作成済み確認情報を記録 → `esa:` open → 最新本文の引継ぎ・版確認 → 保存完了・クローズ成功後に Draft 破棄 |
| 中間状態       | POST成功・`esa:` open失敗                                       | Draft を破棄せず PROMOTED_PENDING_OPEN で保持し、記事番号・作成応答の確認情報を記録                                               |
| 中間状態       | PENDING_OPEN で再編集・再保存                                   | 追加 POST/PATCH は 0 回。新しい本文が Remote の未保存変更へ引き継がれてから Draft を破棄する                                      |
| 中間状態       | 引継ぎ先に別の未保存変更がある                                  | Remote を上書きせず、Draft の本文・作成済み記事番号を保持して通知する                                                             |
| 中間状態       | 作成応答と Cache のリビジョン・本文が不一致、または比較根拠なし | 引継ぎ先を上書きせず Draft を保持する。追加 POST/PATCH は行わない                                                                 |
| 中間状態       | applyEdit 失敗・本文不一致・処理中の並行編集                    | Draft の最新本文を保持し、Remote の内容を勝手に巻き戻さない                                                                       |
| 中間状態       | Draft クローズ失敗・キャンセル                                  | 本文・メタ情報を破棄しない。対象 URI 以外のタブは閉じない                                                                         |
| 正常           | 引継ぎ後の Remote 保存                                          | PostCache の original revision は作成応答のまま。次回保存は既存の original_revision 付き PATCH を使う                             |
| 正常           | カテゴリ解決                                                    | 明示カテゴリ時は GET /user を呼ばず当該カテゴリを使用。未指定時は検証した screen_name から Users/{screen_name} を解決する         |
| 業務エラー     | GET /user 失敗・応答不正                                        | POST せず Draft を保持して通知する                                                                                                |
| 回帰           | 認証ユーザー応答の型追加                                        | EsaAuthenticatedUser の検証を追加し、既存 EsaUser・EsaPost 型と既存 fixture は変更不要                                            |
| 業務エラー     | 4xx 応答                                                        | `EsaApiError` を通知、Draft を破棄しない                                                                                          |
| システムエラー | 通信例外                                                        | ログ出力・エラー通知、Draft を破棄しない                                                                                          |
| 境界           | 未認証で保存                                                    | 昇格せず Draft 保持、エラー通知                                                                                                   |
| 境界           | 空本文で保存                                                    | `body_md=""` で昇格（タイトル入力は不要）                                                                                         |
| 境界           | 昇格後の再保存                                                  | Draft 側 `writeFile` は no-op（以降は `esa:` の `updatePost`）                                                                    |

---

## 10. オープン論点

### 10.1 未確定事項

| 論点                                                | 影響 | 決め方 | 根拠    |
| --------------------------------------------------- | ---- | ------ | ------- |
| なし（設計上のブロッキング論点はADR-006で解消済み） | -    | -      | ADR-006 |

### 10.2 ADR 参照

- 本planの設計判断は [ADR-006 ローカルDraftと昇格モデル](../70-adr/ADR-006-local-draft-promotion.md)（Accepted）に基づく。

---

## 11. 参考: コマンド登録テンプレート

```jsonc
// package.json contributes（追記イメージ）
{
  "commands": [
    {
      "command": "esaExplorer.createDraft",
      "title": "新規記事",
      "category": "esa Explorer",
      "icon": "$(add)",
    },
    {
      "command": "esaExplorer.createDraftHere",
      "title": "このカテゴリに新規記事",
      "category": "esa Explorer",
    },
  ],
  "menus": {
    "view/title": [
      {
        "command": "esaExplorer.createDraft",
        "when": "view == esaExplorer.posts",
        "group": "navigation",
      },
    ],
    "view/item/context": [
      {
        "command": "esaExplorer.createDraftHere",
        "when": "view == esaExplorer.posts && viewItem == esaCategory",
        "group": "inline",
      },
    ],
  },
}
```
