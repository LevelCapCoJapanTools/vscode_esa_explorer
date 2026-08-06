import * as vscode from "vscode";
import type { EsaPostTreeProvider } from "../tree/EsaPostTreeProvider.js";

export function registerRefreshPostsCommand(
  context: vscode.ExtensionContext,
  treeProvider: EsaPostTreeProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.refreshPosts", () => {
      treeProvider.refresh().catch(() => {});
    }),
  );
}
