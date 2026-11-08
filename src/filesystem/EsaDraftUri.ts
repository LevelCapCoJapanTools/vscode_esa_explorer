import * as vscode from "vscode";
import { ESA_DRAFT_URI_SCHEME } from "../constants.js";

export interface ParsedEsaDraftUri {
  teamName: string;
  id: string;
}

export function buildDraftUri(teamName: string, id: string): vscode.Uri {
  return vscode.Uri.from({
    scheme: ESA_DRAFT_URI_SCHEME,
    authority: teamName,
    path: `/${id}.md`,
  });
}

export function parseDraftUri(uri: vscode.Uri): ParsedEsaDraftUri {
  if (uri.scheme !== ESA_DRAFT_URI_SCHEME) {
    throw new Error(`不正なURIスキームです: ${uri.scheme}（"esa-draft"が必要です）`);
  }
  if (!uri.authority) {
    throw new Error("URIにチーム名（authority）が含まれていません。");
  }
  if (uri.query) {
    throw new Error(`URIに想定外のqueryが含まれています: ${uri.query}`);
  }
  if (uri.fragment) {
    throw new Error(`URIに想定外のfragmentが含まれています: ${uri.fragment}`);
  }

  const match = /^\/([^/]+)\.md$/.exec(uri.path);
  if (!match || !match[1]) {
    throw new Error(`不正なURIパスです: ${uri.path}（"/{uuid}.md"形式が必要です）`);
  }

  const id = match[1];
  if (!/^[A-Za-z0-9-]+$/.test(id)) {
    throw new Error(`不正なDraft IDです: ${id}`);
  }

  return { teamName: uri.authority, id };
}
