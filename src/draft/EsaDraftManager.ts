import * as vscode from "vscode";
import { parseDraftUri } from "../filesystem/EsaDraftUri.js";

export interface EsaDraft {
  id: string;
  initialCategory: string | undefined;
  promotedPostNumber: number | undefined;
  promotedRevisionNumber: number | undefined;
  promotedBodyDigest: string | undefined;
}

export class EsaDraftManager {
  private readonly drafts = new Map<string, EsaDraft>();

  register(uri: vscode.Uri, draft: Partial<EsaDraft> = {}): EsaDraft {
    const key = uri.toString();
    const parsed = parseDraftUri(uri);
    const existing = this.drafts.get(key);
    const next: EsaDraft = {
      id: existing?.id ?? parsed.id,
      initialCategory: existing?.initialCategory ?? draft.initialCategory,
      promotedPostNumber: existing?.promotedPostNumber ?? draft.promotedPostNumber,
      promotedRevisionNumber: existing?.promotedRevisionNumber ?? draft.promotedRevisionNumber,
      promotedBodyDigest: existing?.promotedBodyDigest ?? draft.promotedBodyDigest,
    };
    this.drafts.set(key, next);
    return next;
  }

  get(uri: vscode.Uri): EsaDraft | undefined {
    return this.drafts.get(uri.toString());
  }

  delete(uri: vscode.Uri): void {
    this.drafts.delete(uri.toString());
  }
}
