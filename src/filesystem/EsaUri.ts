import * as vscode from "vscode";
import { ESA_URI_SCHEME } from "../constants.js";

export interface ParsedEsaUri {
  teamName: string;
  postNumber: number;
}

export function buildEsaUri(teamName: string, postNumber: number): vscode.Uri {
  return vscode.Uri.from({
    scheme: ESA_URI_SCHEME,
    authority: teamName,
    path: `/posts/${postNumber}.md`,
  });
}

export function parseEsaUri(uri: vscode.Uri): ParsedEsaUri {
  if (uri.scheme !== ESA_URI_SCHEME) {
    throw new Error(`不正なURIスキームです: ${uri.scheme}（"esa"が必要です）`);
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

  const match = /^\/posts\/(\d+)\.md$/.exec(uri.path);
  if (!match || !match[1]) {
    throw new Error(`不正なURIパスです: ${uri.path}（"/posts/<記事番号>.md"形式が必要です）`);
  }

  const postNumber = parseInt(match[1], 10);
  if (!Number.isSafeInteger(postNumber) || postNumber <= 0) {
    throw new Error(`不正な記事番号です: ${match[1]}`);
  }

  return { teamName: uri.authority, postNumber };
}
