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

  test("esaFileSystemProviderが登録される", async () => {
    // Verify the FileSystemProvider is registered by attempting to stat an esa: URI.
    // If no provider were registered, VS Code would throw "no filesystem provider" error.
    const uri = vscode.Uri.parse("esa://test-team/posts/1.md");
    try {
      await vscode.workspace.fs.stat(uri);
      // stat may succeed (if somehow cached) or throw FileNotFound — both mean the provider is registered
    } catch (err: unknown) {
      // FileNotFound / NoPermissions means the provider handled the request — it IS registered
      // Only fail if we get a "no filesystem provider" error
      const msg = err instanceof Error ? err.message : String(err);
      assert.ok(
        !msg.includes("no filesystem provider"),
        `FileSystemProvider が登録されていません: ${msg}`,
      );
    }
  });
});
