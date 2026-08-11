import * as vscode from "vscode";
import type { PostTreeItem } from "../tree/EsaTreeItem.js";
import type { EsaApiClient } from "../api/EsaApiClient.js";
import type { PostCache } from "../cache/PostCache.js";
import type { CredentialService } from "../authentication/CredentialService.js";
import type { ExtensionLogger } from "../logging/ExtensionLogger.js";
import { buildEsaUri } from "../filesystem/EsaUri.js";
import { getTeamName } from "../configuration.js";
import { EsaApiError } from "../api/EsaApiError.js";

export function registerOpenPostCommand(
  context: vscode.ExtensionContext,
  apiClient: EsaApiClient,
  cache: PostCache,
  credentialService: CredentialService,
  logger: ExtensionLogger,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.openPost", async (item: PostTreeItem) => {
      const token = await credentialService.getToken();
      if (!token) {
        vscode.window.showErrorMessage(
          "esa.ioの接続設定が完了していません。「esa Explorer: 接続設定」を実行してください。",
        );
        return;
      }

      const teamName = getTeamName();
      if (!teamName) {
        vscode.window.showErrorMessage(
          "esa.ioの接続設定が完了していません。「esa Explorer: 接続設定」を実行してください。",
        );
        return;
      }

      try {
        logger.info(`記事詳細取得: #${item.post.number}`);
        const post = await apiClient.getPost(teamName, item.post.number, token);
        cache.set(teamName, post);

        const uri = buildEsaUri(teamName, post.number);
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.languages.setTextDocumentLanguage(doc, "markdown");
        await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: false });
      } catch (err: unknown) {
        logger.error("記事オープンエラー", err);
        const message =
          err instanceof EsaApiError ? err.message : "記事を開く際にエラーが発生しました。";
        vscode.window.showErrorMessage(message);
      }
    }),
  );
}
