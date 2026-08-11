import * as vscode from "vscode";
import type { EsaPost } from "../api/types.js";
import { UNCATEGORIZED_LABEL } from "../constants.js";

export class CategoryTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly children: (CategoryTreeItem | PostTreeItem)[],
  ) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.contextValue = "esaCategory";
  }
}

export class PostTreeItem extends vscode.TreeItem {
  constructor(public readonly post: EsaPost) {
    super(post.name, vscode.TreeItemCollapsibleState.None);
    this.description = `#${post.number}`;
    this.contextValue = "esaPost";
    this.iconPath = post.wip ? new vscode.ThemeIcon("edit") : new vscode.ThemeIcon("file-text");

    const categoryDisplay = post.category || UNCATEGORIZED_LABEL;
    const wipStatus = post.wip ? "WIP" : "公開中";
    const updatedAt = new Date(post.updated_at).toLocaleString("ja-JP");
    this.tooltip = new vscode.MarkdownString(
      `**#${post.number}** ${post.name}\n\n` +
        `- カテゴリ: ${categoryDisplay}\n` +
        `- 状態: ${wipStatus}\n` +
        `- 最終更新: ${updatedAt}\n` +
        `- 更新者: ${post.updated_by.screen_name}`,
    );

    this.command = {
      command: "esaExplorer.openPost",
      title: "記事を開く",
      arguments: [this],
    };
  }
}
