import * as vscode from "vscode";
import type { PostTreeItem } from "../tree/EsaTreeItem.js";

export function registerOpenInBrowserCommand(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.openInBrowser", async (item: PostTreeItem) => {
      try {
        await vscode.env.openExternal(vscode.Uri.parse(item.post.url));
      } catch {
        vscode.window.showErrorMessage("ブラウザでのURLオープンに失敗しました。");
      }
    }),
  );
}
