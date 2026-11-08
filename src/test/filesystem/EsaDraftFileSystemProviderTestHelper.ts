import * as vscode from "vscode";
import type { DraftEditorUiAdapter } from "../../filesystem/EsaDraftFileSystemProvider.js";

export interface MockTabSpec {
  uri: vscode.Uri;
  isDirty?: boolean;
}

type CloseBehavior = "success" | "returnFalse" | "throw";

export class MockDraftEditorUiAdapter implements DraftEditorUiAdapter {
  private readonly saveListeners = new Set<(document: vscode.TextDocument) => void>();
  private readonly openDocuments = new Map<string, vscode.TextDocument>();
  private tabGroups: vscode.TabGroup[] = [];

  closeBehavior: CloseBehavior = "success";
  readonly closedTabs: vscode.Tab[] = [];
  readonly shownDocuments: vscode.TextDocument[] = [];
  readonly errorMessages: string[] = [];

  constructor(documents: Array<{ uri: vscode.Uri; text?: string }> = []) {
    for (const document of documents) {
      this.openDocuments.set(
        document.uri.toString(),
        createTextDocumentStub(document.uri, document.text),
      );
    }
  }

  setTabSpecs(specs: MockTabSpec[]): void {
    const tabs = specs.map((spec) =>
      createTabStub({
        uri: spec.uri,
        isDirty: spec.isDirty ?? false,
      }),
    );
    this.tabGroups = [
      {
        tabs,
      } as unknown as vscode.TabGroup,
    ];
  }

  getOpenDocument(uri: vscode.Uri): vscode.TextDocument {
    const document = this.openDocuments.get(uri.toString());
    if (!document) {
      const created = createTextDocumentStub(uri, "");
      this.openDocuments.set(uri.toString(), created);
      return created;
    }
    return document;
  }

  emitSave(uri: vscode.Uri): void {
    const document = this.getOpenDocument(uri);
    for (const listener of this.saveListeners) {
      listener(document);
    }
  }

  async openTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {
    return this.getOpenDocument(uri);
  }

  async showTextDocument(
    document: vscode.TextDocument,
    _options?: vscode.TextDocumentShowOptions,
  ): Promise<vscode.TextEditor> {
    this.shownDocuments.push(document);
    return {} as vscode.TextEditor;
  }

  async applyEdit(_edit: vscode.WorkspaceEdit): Promise<boolean> {
    return true;
  }

  onDidSaveTextDocument(listener: (document: vscode.TextDocument) => void): vscode.Disposable {
    this.saveListeners.add(listener);
    return {
      dispose: () => {
        this.saveListeners.delete(listener);
      },
    };
  }

  getAllTabGroups(): readonly vscode.TabGroup[] {
    return this.tabGroups;
  }

  async closeTab(tab: vscode.Tab): Promise<boolean> {
    this.closedTabs.push(tab);
    if (this.closeBehavior === "throw") {
      throw new Error("close failure");
    }
    if (this.closeBehavior === "returnFalse") {
      return false;
    }
    this.tabGroups = this.tabGroups.map((group) => ({
      ...group,
      tabs: group.tabs.filter((candidate) => candidate !== tab),
    })) as vscode.TabGroup[];
    return true;
  }

  async showErrorMessage(message: string): Promise<string | undefined> {
    this.errorMessages.push(message);
    return undefined;
  }
}

function createTextDocumentStub(uri: vscode.Uri, text = ""): vscode.TextDocument {
  return {
    uri,
    getText: () => text,
    lineCount: text.split("\n").length,
  } as unknown as vscode.TextDocument;
}

function createTabStub(spec: { uri: vscode.Uri; isDirty: boolean }): vscode.Tab {
  return {
    input: { uri: spec.uri } as unknown as vscode.TabInputText,
    isDirty: spec.isDirty,
  } as vscode.Tab;
}
