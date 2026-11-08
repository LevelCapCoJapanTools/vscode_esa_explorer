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

const draftSaveLocks = new Map<string, Promise<void>>();

export function withDraftSaveLock(key: string, fn: () => Promise<void>): Promise<void> {
  const existing = draftSaveLocks.get(key);
  const next = (existing ?? Promise.resolve())
    .then(() => fn())
    .finally(() => {
      if (draftSaveLocks.get(key) === next) {
        draftSaveLocks.delete(key);
      }
    });
  draftSaveLocks.set(key, next);
  return next;
}

export function getDocumentReplaceRange(document: vscode.TextDocument): vscode.Range {
  return new vscode.Range(new vscode.Position(0, 0), new vscode.Position(document.lineCount, 0));
}

export interface DraftEditorUiAdapter {
  openTextDocument(uri: vscode.Uri): Thenable<vscode.TextDocument>;
  showTextDocument(
    document: vscode.TextDocument,
    options?: vscode.TextDocumentShowOptions,
  ): Thenable<vscode.TextEditor>;
  applyEdit(edit: vscode.WorkspaceEdit): Thenable<boolean>;
  onDidSaveTextDocument(listener: (document: vscode.TextDocument) => void): vscode.Disposable;
  getAllTabGroups(): readonly vscode.TabGroup[];
  closeTab(tab: vscode.Tab): Thenable<boolean>;
  showErrorMessage(message: string): Thenable<string | undefined>;
}

function createDraftEditorUiAdapter(): DraftEditorUiAdapter {
  return {
    openTextDocument: (uri) => vscode.workspace.openTextDocument(uri),
    showTextDocument: (document, options) => vscode.window.showTextDocument(document, options),
    applyEdit: (edit) => vscode.workspace.applyEdit(edit),
    onDidSaveTextDocument: (listener) => vscode.workspace.onDidSaveTextDocument(listener),
    getAllTabGroups: () => vscode.window.tabGroups.all,
    closeTab: (tab) => vscode.window.tabGroups.close(tab),
    showErrorMessage: (message) => vscode.window.showErrorMessage(message),
  };
}

function getTabInputUri(input: unknown): vscode.Uri | undefined {
  if (input instanceof vscode.TabInputText) {
    return input.uri;
  }
  if (typeof input !== "object" || input === null || !("uri" in input)) {
    return undefined;
  }
  const uri = (input as { uri: unknown }).uri;
  return uri instanceof vscode.Uri ? uri : undefined;
}

export class EsaDraftFileSystemProvider implements vscode.FileSystemProvider, vscode.Disposable {
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
    private readonly ui: DraftEditorUiAdapter = createDraftEditorUiAdapter(),
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
    return withDraftSaveLock(key, async () => {
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
            const remoteDoc = await this.ui.openTextDocument(remoteUri);
            await this.ui.showTextDocument(remoteDoc, {
              preview: false,
              preserveFocus: true,
            });
            const current = remoteDoc.getText();
            if (current !== bodyMd) {
              const edit = new vscode.WorkspaceEdit();
              edit.replace(remoteUri, getDocumentReplaceRange(remoteDoc), bodyMd);
              await this.ui.applyEdit(edit);
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
          const message =
            err instanceof EsaApiError ? err.message : "ユーザー情報の取得に失敗しました。";
          void this.ui.showErrorMessage(message);
          throw new vscode.FileSystemError(message);
        }
      }

      this.logger.info(`Draft昇格開始: ${uri.toString()}`);
      const saveSubscription = this.subscribeDraftSave(uri);
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
        this.logger.info(
          `Draft昇格: createPost成功 #${post.number} category=${post.category ?? "(なし)"} wip=${post.wip}`,
        );
        this.cache.set(teamName, post);
        existingDraft.promotedPostNumber = post.number;
        existingDraft.promotedRevisionNumber = post.revision_number;
        existingDraft.promotedBodyDigest = post.body_md;
        this.refreshTree();

        const remoteUri = buildEsaUri(teamName, post.number);
        const doc = await this.ui.openTextDocument(remoteUri);
        await this.ui.showTextDocument(doc, { preview: false, preserveFocus: true });
        const remoteText = doc.getText();
        if (remoteText !== bodyMd) {
          const edit = new vscode.WorkspaceEdit();
          edit.replace(remoteUri, getDocumentReplaceRange(doc), bodyMd);
          await this.ui.applyEdit(edit);
        }
      } catch (err: unknown) {
        saveSubscription.dispose();
        this.logger.error("Draft昇格失敗", err);
        const message = err instanceof EsaApiError ? err.message : "記事の昇格に失敗しました。";
        void this.ui.showErrorMessage(message);
        throw new vscode.FileSystemError(message);
      }
    });
  }

  private subscribeDraftSave(draftUri: vscode.Uri): vscode.Disposable {
    let disposable: vscode.Disposable;
    disposable = this.ui.onDidSaveTextDocument((savedDocument) => {
      if (savedDocument.uri.toString() !== draftUri.toString()) {
        return;
      }
      disposable.dispose();
      void this.handleSavedDraft(draftUri).catch((err: unknown) => {
        this.logger.error("Draft保存完了処理に失敗", err);
      });
    });
    return disposable;
  }

  private async handleSavedDraft(draftUri: vscode.Uri): Promise<void> {
    const closeResult = await this.closeDraftTab(draftUri);
    if (closeResult === "dirty" || closeResult === "failed") {
      return;
    }
    this.draftManager.delete(draftUri);
    this._onDidChangeFile.fire([{ type: vscode.FileChangeType.Changed, uri: draftUri }]);
  }

  private refreshTree(): void {
    const treeProvider = this.getTreeProvider();
    if (!treeProvider) {
      this.logger.warn("Tree View更新要求: TreeProviderが未取得のためスキップ");
      return;
    }
    this.logger.info("Tree View更新要求: Draft昇格後");
    treeProvider
      .refresh()
      .then(() => {
        this.logger.info("Tree View更新要求: 完了");
      })
      .catch((e: unknown) => {
        this.logger.error("Tree View更新エラー", e);
      });
  }

  private async closeDraftTab(
    draftUri: vscode.Uri,
  ): Promise<"closed" | "dirty" | "failed" | "not_found"> {
    const found = this.findDraftTab(draftUri);
    if (!found) {
      this.logger.info(`Draftタブ未検出のため閉鎖をスキップ: ${draftUri.toString()}`);
      return "not_found";
    }
    if (found.isDirty) {
      this.logger.info(`Draftタブがdirtyのため閉鎖をスキップ: ${draftUri.toString()}`);
      return "dirty";
    }
    try {
      const closed = await this.ui.closeTab(found);
      if (!closed) {
        void this.ui.showErrorMessage("下書きタブを閉じられませんでした。");
        return "failed";
      }
      return "closed";
    } catch (err: unknown) {
      this.logger.error("Draftタブの閉鎖に失敗", err);
      void this.ui.showErrorMessage("下書きタブを閉じられませんでした。");
      return "failed";
    }
  }

  private findDraftTab(draftUri: vscode.Uri): vscode.Tab | undefined {
    for (const group of this.ui.getAllTabGroups()) {
      for (const tab of group.tabs) {
        const tabUri = getTabInputUri(tab.input);
        if (tabUri?.toString() === draftUri.toString()) {
          return tab;
        }
      }
    }
    return undefined;
  }

  delete(uri: vscode.Uri, _options: { readonly recursive: boolean }): void {
    this.draftBodies.delete(uri.toString());
    this.draftManager.delete(uri);
  }

  rename(
    _oldUri: vscode.Uri,
    _newUri: vscode.Uri,
    _options: { readonly overwrite: boolean },
  ): void {
    throw vscode.FileSystemError.NoPermissions("Draftの名前変更はサポートされていません。");
  }

  dispose(): void {
    this._onDidChangeFile.dispose();
  }
}
