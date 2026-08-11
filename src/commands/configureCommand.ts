import * as vscode from "vscode";
import type { CredentialService } from "../authentication/CredentialService.js";
import type { EsaPostTreeProvider } from "../tree/EsaPostTreeProvider.js";
import { CONTEXT_IS_CONFIGURED } from "../constants.js";

export function registerConfigureCommand(
  context: vscode.ExtensionContext,
  credentialService: CredentialService,
  treeProvider: EsaPostTreeProvider,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.configure", async () => {
      const success = await credentialService.configure();
      if (success) {
        await vscode.commands.executeCommand("setContext", CONTEXT_IS_CONFIGURED, true);
        await treeProvider.refresh();
      }
    }),
  );
}
