import * as vscode from "vscode";
import { parseEsaUri, buildEsaUri } from "./EsaUri.js";
import type { PostCache } from "../cache/PostCache.js";
import type { EsaApiClient } from "../api/EsaApiClient.js";
import type { EsaPost } from "../api/types.js";
import type { CredentialService } from "../authentication/CredentialService.js";
import type { EsaPostTreeProvider } from "../tree/EsaPostTreeProvider.js";
import type { ExtensionLogger } from "../logging/ExtensionLogger.js";
import { EsaApiError } from "../api/EsaApiError.js";

// Per-URI save serialization
const saveLocks = new Map<string, Promise<void>>();

async function withSaveLock(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = saveLocks.get(key);
  const next = (existing ?? Promise.resolve())
    .then(() => fn())
    .finally(() => {
      if (saveLocks.get(key) === next) {
        saveLocks.delete(key);
      }
    });
  saveLocks.set(key, next);
  return next;
}

export class EsaFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
  private readonly _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  constructor(
    private readonly cache: PostCache,
    private readonly apiClient: EsaApiClient,
    private readonly credentialService: CredentialService,
    private readonly logger: ExtensionLogger,
    private readonly getTreeProvider: () => EsaPostTreeProvider | undefined,
  ) {}

  watch(
    _uri: vscode.Uri,
    _options: { readonly recursive: boolean; readonly excludes: readonly string[] },
  ): vscode.Disposable {
    return {
      dispose: () => {
        // No file watching for virtual esa documents.
      },
    };
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    const { teamName, postNumber } = parseEsaUri(uri);
    const cached = this.cache.get(teamName, postNumber);
    const now = Date.now();
    const ctime = cached ? new Date(cached.post.created_at).getTime() : now;
    const mtime = cached ? cached.fetchedAt.getTime() : now;
    const size = cached ? Buffer.byteLength(cached.post.body_md, "utf8") : 0;
    return {
      type: vscode.FileType.File,
      ctime,
      mtime,
      size,
    };
  }

  readDirectory(_uri: vscode.Uri): [string, vscode.FileType][] {
    return [];
  }

  createDirectory(_uri: vscode.Uri): void {
    throw vscode.FileSystemError.NoPermissions("記事ディレクトリの作成はサポートされていません。");
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const { teamName, postNumber } = parseEsaUri(uri);
    const cached = this.cache.get(teamName, postNumber);
    if (cached) {
      return Buffer.from(cached.post.body_md, "utf8");
    }

    // Try to fetch from API
    const token = await this.credentialService.getToken();
    if (!token) {
      throw vscode.FileSystemError.NoPermissions("esa.ioの認証情報が設定されていません。");
    }
    this.logger.info(`記事詳細取得: #${postNumber}`);
    const post = await this.apiClient.getPost(teamName, postNumber, token);
    this.cache.set(teamName, post);
    return Buffer.from(post.body_md, "utf8");
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { readonly create: boolean; readonly overwrite: boolean },
  ): Promise<void> {
    if (options.create) {
      throw vscode.FileSystemError.NoPermissions("記事の新規作成はサポートされていません。");
    }
    const { teamName: checkTeam, postNumber: checkPost } = parseEsaUri(uri);
    if (!options.overwrite && this.cache.get(checkTeam, checkPost)) {
      throw vscode.FileSystemError.FileExists(uri);
    }

    const uriKey = uri.toString();
    return withSaveLock(uriKey, async () => {
      const { teamName, postNumber } = parseEsaUri(uri);
      const cached = this.cache.get(teamName, postNumber);
      if (!cached) {
        throw vscode.FileSystemError.FileNotFound(uri);
      }

      const token = await this.credentialService.getToken();
      if (!token) {
        throw vscode.FileSystemError.NoPermissions("esa.ioの認証情報が設定されていません。");
      }

      const bodyMd = Buffer.from(content).toString("utf8");
      this.logger.info(`保存開始: #${postNumber}`);

      let updatedPost: EsaPost;
      try {
        updatedPost = await this.apiClient.updatePost(
          teamName,
          postNumber,
          {
            bodyMd,
            message: "Updated from VS Code",
            originalRevision: {
              body_md: cached.originalBodyMd,
              number: cached.originalRevisionNumber,
              user: cached.originalUpdatedByScreenName,
            },
          },
          token,
        );
      } catch (err: unknown) {
        this.logger.error(`保存失敗: #${postNumber}`, err);
        const message = err instanceof EsaApiError ? err.message : "esa.ioへの保存に失敗しました。";
        throw new vscode.FileSystemError(message);
      }

      this.logger.info(`保存完了: #${postNumber}`);

      if (updatedPost.overlapped) {
        vscode.window.showWarningMessage(
          "esa.io上で同じ記事が更新されていたため、3-way mergeが実行されました。競合箇所を確認してください。",
        );
      }

      this.cache.set(teamName, updatedPost);

      // If server returned different body, notify file changed
      if (updatedPost.body_md !== bodyMd) {
        const changedUri = buildEsaUri(teamName, postNumber);
        this._onDidChangeFile.fire([{ type: vscode.FileChangeType.Changed, uri: changedUri }]);
      }

      // Refresh tree view
      this.getTreeProvider()
        ?.refresh()
        .catch((e: unknown) => {
          this.logger.error("Tree View更新エラー", e);
        });
    });
  }

  delete(_uri: vscode.Uri, _options: { readonly recursive: boolean }): void {
    throw vscode.FileSystemError.NoPermissions("記事の削除はサポートされていません。");
  }

  rename(
    _oldUri: vscode.Uri,
    _newUri: vscode.Uri,
    _options: { readonly overwrite: boolean },
  ): void {
    throw vscode.FileSystemError.NoPermissions("記事名の変更はサポートされていません。");
  }

  dispose(): void {
    this._onDidChangeFile.dispose();
  }
}
