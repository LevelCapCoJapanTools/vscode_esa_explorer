import { randomUUID } from "node:crypto";
import * as vscode from "vscode";
import { getTeamName } from "../configuration.js";
import type { EsaDraftManager } from "../draft/EsaDraftManager.js";
import { buildDraftUri } from "../filesystem/EsaDraftUri.js";

function getInitialCategoryFromItem(item: unknown): string | undefined {
  if (typeof item !== "object" || item === null) return undefined;
  const candidate = item as { label?: unknown };
  if (typeof candidate.label !== "string") return undefined;
  return candidate.label.trim() || undefined;
}

export function registerCreateDraftCommand(
  context: vscode.ExtensionContext,
  draftManager: EsaDraftManager,
): void {
  const openDraft = async (initialCategory?: string): Promise<void> => {
    const teamName = getTeamName();
    if (!teamName) {
      vscode.window.showErrorMessage(
        "esa.ioの接続設定が完了していません。\"esa Explorer: 接続設定\"を実行してください。",
      );
      return;
    }

    const id = randomUUID();
    const uri = buildDraftUri(teamName, id);
    draftManager.register(uri, {
      id,
      initialCategory: initialCategory ?? undefined,
      promotedPostNumber: undefined,
      promotedRevisionNumber: undefined,
      promotedBodyDigest: undefined,
    });

    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.languages.setTextDocumentLanguage(doc, "markdown");
    await vscode.window.showTextDocument(doc, { preview: false, preserveFocus: false });
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("esaExplorer.createDraft", async (item?: unknown) => {
      await openDraft(getInitialCategoryFromItem(item));
    }),
    vscode.commands.registerCommand("esaExplorer.createDraftHere", async (item?: unknown) => {
      await openDraft(getInitialCategoryFromItem(item));
    }),
  );
}
