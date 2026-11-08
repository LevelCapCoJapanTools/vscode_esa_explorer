import * as assert from "assert";
import * as vscode from "vscode";
import {
  getDocumentReplaceRange,
  withDraftSaveLock,
} from "../../filesystem/EsaDraftFileSystemProvider.js";

suite("EsaDraftFileSystemProvider", () => {
  test("ドキュメント全体を置換対象の範囲として扱える", async () => {
    const doc = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: "first\nsecond",
    });

    const range = getDocumentReplaceRange(doc);
    assert.deepStrictEqual(range.start, new vscode.Position(0, 0));
    assert.deepStrictEqual(range.end, new vscode.Position(doc.lineCount, 0));
  });

  test("同一Draft URIの保存処理は直列化される", async () => {
    const execution: number[] = [];

    await Promise.all([
      withDraftSaveLock("draft://team/test.md", async () => {
        execution.push(1);
        await new Promise((resolve) => setTimeout(resolve, 10));
        execution.push(2);
      }),
      withDraftSaveLock("draft://team/test.md", async () => {
        execution.push(3);
        await new Promise((resolve) => setTimeout(resolve, 10));
        execution.push(4);
      }),
    ]);

    assert.deepStrictEqual(execution, [1, 2, 3, 4]);
  });
});
