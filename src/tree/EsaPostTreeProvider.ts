import * as vscode from "vscode";
import type { EsaPost } from "../api/types.js";
import type { EsaApiClient } from "../api/EsaApiClient.js";
import type { CredentialService } from "../authentication/CredentialService.js";
import type { ExtensionLogger } from "../logging/ExtensionLogger.js";
import { buildCategoryTree, type CategoryNode } from "./CategoryTree.js";
import { CategoryTreeItem, PostTreeItem } from "./EsaTreeItem.js";
import { EsaApiError } from "../api/EsaApiError.js";
import { getTeamName } from "../configuration.js";

type TreeItem = CategoryTreeItem | PostTreeItem;

export class EsaPostTreeProvider implements vscode.TreeDataProvider<TreeItem>, vscode.Disposable {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<
    TreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rootItems: TreeItem[] = [];
  private isLoading = false;
  private pendingRefresh = false;
  private refreshPromise: Promise<void> | null = null;

  constructor(
    private readonly apiClient: EsaApiClient,
    private readonly credentialService: CredentialService,
    private readonly logger: ExtensionLogger,
    private readonly onRefreshComplete?: () => void,
  ) {}

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): (CategoryTreeItem | PostTreeItem)[] {
    if (!element) {
      return this.rootItems;
    }
    if (element instanceof CategoryTreeItem) {
      return element.children;
    }
    return [];
  }

  refresh(): Promise<void> {
    if (this.isLoading) {
      this.pendingRefresh = true;
      return this.refreshPromise ?? Promise.resolve();
    }
    this.refreshPromise = this.doRefresh();
    return this.refreshPromise;
  }

  private async doRefresh(): Promise<void> {
    this.isLoading = true;
    this.pendingRefresh = false;

    try {
      const configured = await this.credentialService.isConfigured();
      if (!configured) {
        this.rootItems = [];
        this._onDidChangeTreeData.fire();
        return;
      }

      const teamName = getTeamName();
      const token = await this.credentialService.getToken();
      if (!token || !teamName) {
        this.rootItems = [];
        this._onDidChangeTreeData.fire();
        return;
      }

      this.logger.info(`記事一覧取得開始: チーム ${teamName}`);
      const posts: EsaPost[] = await this.apiClient.listAllPosts(teamName, token);
      this.logger.info(`記事一覧取得完了: ${posts.length}件`);

      const nodes = buildCategoryTree(posts);
      this.rootItems = nodes.map(
        (node) => new CategoryTreeItem(node.label, this.buildChildren(node)),
      );

      this._onDidChangeTreeData.fire();
      this.onRefreshComplete?.();
    } catch (err: unknown) {
      this.logger.error("記事一覧取得エラー", err);
      const message =
        err instanceof EsaApiError ? err.message : "esa.ioからの記事取得に失敗しました。";
      vscode.window.showErrorMessage(message);
      this._onDidChangeTreeData.fire();
    } finally {
      this.isLoading = false;
      if (this.pendingRefresh) {
        this.refreshPromise = this.doRefresh();
      } else {
        this.refreshPromise = null;
      }
    }
  }

  private buildChildren(node: CategoryNode): (CategoryTreeItem | PostTreeItem)[] {
    const children: (CategoryTreeItem | PostTreeItem)[] = [];
    for (const child of node.children) {
      children.push(new CategoryTreeItem(child.label, this.buildChildren(child)));
    }
    for (const post of node.posts) {
      children.push(new PostTreeItem(post));
    }
    return children;
  }

  dispose(): void {
    this._onDidChangeTreeData.dispose();
  }
}
