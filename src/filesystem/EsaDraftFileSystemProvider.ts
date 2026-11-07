import * as vscode from "vscode";
import { EsaApiError } from "../api/EsaApiError.js";
import type { EsaApiClient } from "../api/EsaApiClient.js";
import type { CredentialService } from "../authentication/CredentialService.js";
import type { PostCache } from "../cache/PostCache.js";
import type { ExtensionLogger } from "../logging/ExtensionLogger.js";
import type { EsaDraftManager } from "../draft/EsaDraftManager.js";
import type { EsaPostTreeProvider } from "../tree/EsaPostTreeProvider.js";
import { buildEsaUri } from "./EsaUri.js";
import { parseDraftUri } from "./EsaDraftUri.js";

export class EsaDraftFileSystemProvider
  implements vscode.FileSystemProvider, vscode.Disposable
{
  private readonly draftBodies = new Map<string, Uint8Array>();
  private readonly _onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
  readonly onDidChangeFile = this._onDidChangeFile.event;

  constructor(
    private readonly cache: PostCache,
    private readonly apiClient: EsaApiClient,
    private readonly credentialService: CredentialService,
    private readonly logger: ExtensionLogger,
    private readonly draftManager: EsaDraftManager,
    private readonly getTreeProvider: () => EsaPostTreeProvider | undefined,
  ) {}

  watch(
    _uri: vscode.Uri,
    _options: { readonly recursive: boolean; readonly excludes: readonly string[] },
  ): vscode.Disposable {
    return { dispose: () => undefined };
  }

  stat(uri: vscode.Uri): vscode.FileStat {
    const { teamName, id } = parseDraftUri(uri);
    const body = this.draftBodies.get(uri.toString()) ?? Buffer.from("", "utf8");
    const now = Date.now();
    return {
      type: vscode.FileType.File,
      ctime: now,
      mtime: now,
      size: Buffer.byteLength(body, "utf8"),
      ...(teamName && { teamName }),
      ...(id && { id }),
    } as vscode.FileStat;
  }

  readDirectory(): [string, vscode.FileType][] {
    return [];
  }

  createDirectory(): void {
    throw vscode.FileSystemError.NoPermissions("Draftディレクトリの作成はサポートされていません。");
  }

  async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    const body = this.draftBodies.get(uri.toString());
    return body ?? Buffer.from("", "utf8");
  }

  async writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    _options: { readonly create: boolean; readonly overwrite: boolean },
  ): Promise<void> {
    const { teamName, id } = parseDraftUri(uri);
    const key = uri.toString();
    const bodyMd = Buffer.from(content).toString("utf8");
    const existingDraft = this.draftManager.get(uri) ?? this.draftManager.register(uri, { id });

    this.draftBodies.set(key, Buffer.from(content));
    const token = await this.credentialService.getToken();
    if (!token) {
      throw vscode.FileSystemError.NoPermissions("esa.ioの認証情報が設定されていません。");
    }

    if (existingDraft.promotedPostNumber !== undefined) {
      this.logger.info(`Draft昇格済みの再保存を処理: ${uri.toString()}`);
      const postNumber = existingDraft.promotedPostNumber;
      const remoteUri = buildEsaUri(teamName, postNumber);
      const cached = this.cache.get(teamName, postNumber);
      if (cached) {
        try {
          const remoteDoc = await vscode.workspace.openTextDocument(remoteUri);
          await vscode.window.showTextDocument(remoteDoc, { preview: false, preserveFocus: false });
          const current = remoteDoc.getText();
          if (current !== cached.post.body_md) {
            const edit = new vscode.WorkspaceEdit();
            edit.replace(remoteUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)), bodyMd);
            await vscode.workspace.applyEdit(edit);
          }
        } catch (err: unknown) {
          this.logger.error("昇格済みDraftの再保存で切替に失敗", err);
          throw new vscode.FileSystemError("昇格済み記事への再切替に失敗しました。");
        }
      }
      return;
    }

    let category = existingDraft.initialCategory;
    if (!category) {
      try {
        const user = await this.apiClient.getAuthenticatedUser(token);
        category = `Users/${user.screen_name}`;
      } catch (err: unknown) {
        this.logger.error("Draft昇格用カテゴリ解決に失敗", err);
        const message = err instanceof EsaApiError ? err.message : "ユーザー情報の取得に失敗しました。";
        vscode.window.showErrorMessage(message);
        throw new vscode.FileSystemError(message);
      }
    }

    this.logger.info(`Draft昇格開始: ${uri.toString()}`);
    try {
      const post = await this.apiClient.createPost(
        teamName,
        {
          name: "Untitled",
          bodyMd,
          category,
          wip: true,
          message: "Created from VS Code",
        },
        token,
      );
      this.cache.set(teamName, post);
      existingDraft.promotedPostNumber = post.number;
      existingDraft.promotedRevisionNumber = post.revision_number;
      existingDraft.promotedBodyDigest = post.body_md;

      const remoteUri = buildEsaUri(teamName, post.number);
      const doc = await vscode.workspace.openTextDocument(remoteUri);
      await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: false });
      const remoteText = doc.getText();
      if (remoteText !== bodyMd) {
        const edit = new vscode.WorkspaceEdit();
        edit.replace(remoteUri, new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 0)), bodyMd);
        await vscode.workspace.applyEdit(edit);
      }
      await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      this.draftManager.delete(uri);
      this._onDidChangeFile.fire([{ type: vscode.FileChangeType.Changed, uri }]);
      this.getTreeProvider()?.refresh().catch((e: unknown) => {
        this.logger.error("Tree View更新エラー", e);
      });
    } catch (err: unknown) {
      this.logger.error("Draft昇格失敗", err);
      const message = err instanceof EsaApiError ? err.message : "記事の昇格に失敗しました。";
      vscode.window.showErrorMessage(message);
      throw new vscode.FileSystemError(message);
    }
  }

  delete(uri: vscode.Uri, _options: { readonly recursive: boolean }): void {
    this.draftBodies.delete(uri.toString());
    this.draftManager.delete(uri);
  }

  rename(_oldUri: vscode.Uri, _newUri: vscode.Uri, _options: { readonly overwrite: boolean }): void {
    throw vscode.FileSystemError.NoPermissions("Draftの名前変更はサポートされていません。");
  }

  dispose(): void {
    this._onDidChangeFile.dispose();
  }
}
