import * as vscode from "vscode";
import { EsaApiClient } from "./api/EsaApiClient.js";
import { CredentialService } from "./authentication/CredentialService.js";
import { PostCache } from "./cache/PostCache.js";
import { ExtensionLogger } from "./logging/ExtensionLogger.js";
import { EsaPostTreeProvider } from "./tree/EsaPostTreeProvider.js";
import { EsaFileSystemProvider } from "./filesystem/EsaFileSystemProvider.js";
import { registerConfigureCommand } from "./commands/configureCommand.js";
import { registerRefreshPostsCommand } from "./commands/refreshPostsCommand.js";
import { registerOpenPostCommand } from "./commands/openPostCommand.js";
import { registerOpenInBrowserCommand } from "./commands/openInBrowserCommand.js";
import { CONTEXT_IS_CONFIGURED, ESA_URI_SCHEME, TREE_VIEW_ID } from "./constants.js";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const logger = new ExtensionLogger();
  context.subscriptions.push(logger);
  logger.info("esa Explorer 拡張機能を起動しました。");

  const apiClient = new EsaApiClient();
  const credentialService = new CredentialService(context.secrets, apiClient, logger);
  const cache = new PostCache();

  const treeProvider = new EsaPostTreeProvider(apiClient, credentialService, logger);
  context.subscriptions.push(treeProvider);

  const fsProvider = new EsaFileSystemProvider(
    cache,
    apiClient,
    credentialService,
    logger,
    () => treeProvider,
  );
  context.subscriptions.push(fsProvider);

  // Register FileSystemProvider
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(ESA_URI_SCHEME, fsProvider, {
      isCaseSensitive: true,
      isReadonly: false,
    }),
  );

  // Register Tree View
  const treeView = vscode.window.createTreeView(TREE_VIEW_ID, {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Register commands
  registerConfigureCommand(context, credentialService, treeProvider);
  registerRefreshPostsCommand(context, treeProvider);
  registerOpenPostCommand(context, apiClient, cache, credentialService, logger);
  registerOpenInBrowserCommand(context);

  // Additional commands
  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.setToken", async () => {
      const tokenInput = await vscode.window.showInputBox({
        prompt: "esa Personal Access Token v2を入力してください",
        password: true,
        ignoreFocusOut: true,
      });
      if (tokenInput !== undefined) {
        await credentialService.setToken(tokenInput.trim());
        vscode.window.showInformationMessage("Personal Access Tokenを設定しました。");
      }
    }),
    vscode.commands.registerCommand("esaExplorer.clearCredentials", async () => {
      await credentialService.clearCredentials();
      await vscode.commands.executeCommand("setContext", CONTEXT_IS_CONFIGURED, false);
      treeProvider.refresh().catch(() => {});
    }),
    vscode.commands.registerCommand("esaExplorer.showOutput", () => {
      logger.show();
    }),
  );

  // Set initial context
  const configured = await credentialService.isConfigured();
  await vscode.commands.executeCommand("setContext", CONTEXT_IS_CONFIGURED, configured);

  // Initial load if configured
  if (configured) {
    treeProvider.refresh().catch(() => {});
  }
}

export function deactivate(): void {
  // Subscriptions are disposed automatically by VS Code
}
