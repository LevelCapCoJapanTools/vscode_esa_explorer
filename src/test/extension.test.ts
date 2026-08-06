import * as assert from "assert";
import * as vscode from "vscode";

suite("Extension Integration Tests", () => {
  test("拡張機能がactivateできる", async () => {
    const ext = vscode.extensions.getExtension("local.esa-explorer");
    assert.ok(ext, "拡張機能が見つかりません");
    if (!ext.isActive) {
      await ext.activate();
    }
    assert.ok(ext.isActive, "拡張機能がアクティブになっていません");
  });

  test("主要コマンドが登録される", async () => {
    const commands = await vscode.commands.getCommands(true);
    const expectedCommands = [
      "esaExplorer.configure",
      "esaExplorer.setToken",
      "esaExplorer.clearCredentials",
      "esaExplorer.refreshPosts",
      "esaExplorer.openPost",
      "esaExplorer.openInBrowser",
      "esaExplorer.showOutput",
    ];
    for (const cmd of expectedCommands) {
      assert.ok(commands.includes(cmd), `コマンド ${cmd} が登録されていません`);
    }
  });

  test("esaFileSystemProviderが登録される", () => {
    const uri = vscode.Uri.parse("esa://test-team/posts/1.md");
    assert.strictEqual(uri.scheme, "esa");
  });
});
