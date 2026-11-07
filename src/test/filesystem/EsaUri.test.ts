import * as assert from "assert";
import * as vscode from "vscode";
import { buildDraftUri, parseDraftUri } from "../../filesystem/EsaDraftUri.js";
import { buildEsaUri, parseEsaUri } from "../../filesystem/EsaUri.js";

suite("EsaUri", () => {
  test("Draft URIを生成して解析できる", () => {
    const draftId = "550e8400-e29b-41d4-a716-446655440000";
    const uri = buildDraftUri("my-team", draftId);
    assert.strictEqual(uri.scheme, "esa-draft");
    assert.strictEqual(uri.authority, "my-team");
    assert.strictEqual(uri.path, `/${draftId}.md`);
    const parsed = parseDraftUri(uri);
    assert.strictEqual(parsed.teamName, "my-team");
    assert.strictEqual(parsed.id, draftId);
  });

  test("正常なURI生成", () => {
    const uri = buildEsaUri("my-team", 123);
    assert.strictEqual(uri.scheme, "esa");
    assert.strictEqual(uri.authority, "my-team");
    assert.strictEqual(uri.path, "/posts/123.md");
  });

  test("正常なURI解析", () => {
    const uri = buildEsaUri("my-team", 456);
    const parsed = parseEsaUri(uri);
    assert.strictEqual(parsed.teamName, "my-team");
    assert.strictEqual(parsed.postNumber, 456);
  });

  test("チーム名のエンコード", () => {
    const uri = buildEsaUri("my-team", 1);
    assert.strictEqual(uri.authority, "my-team");
  });

  test("正の整数の記事番号", () => {
    const uri = buildEsaUri("team", 1);
    const parsed = parseEsaUri(uri);
    assert.strictEqual(parsed.postNumber, 1);
  });

  test("不正なスキーム", () => {
    const uri = vscode.Uri.from({ scheme: "file", authority: "team", path: "/posts/1.md" });
    assert.throws(() => parseEsaUri(uri), /スキーム/);
  });

  test("空のauthority", () => {
    const uri = vscode.Uri.from({ scheme: "esa", authority: "", path: "/posts/1.md" });
    assert.throws(() => parseEsaUri(uri), /authority/);
  });

  test("不正なパス", () => {
    const uri = vscode.Uri.from({ scheme: "esa", authority: "team", path: "/invalid/1.md" });
    assert.throws(() => parseEsaUri(uri), /パス/);
  });

  test("0は不正", () => {
    const uri = vscode.Uri.from({ scheme: "esa", authority: "team", path: "/posts/0.md" });
    assert.throws(() => parseEsaUri(uri), /記事番号/);
  });

  test("Draft URIにqueryは不正", () => {
    const uri = vscode.Uri.parse("esa-draft://team/abc123.md?foo=bar");
    assert.throws(() => parseDraftUri(uri), /query/);
  });

  test("Draft URIにfragmentは不正", () => {
    const uri = vscode.Uri.parse("esa-draft://team/abc123.md#section");
    assert.throws(() => parseDraftUri(uri), /fragment/);
  });

  test("query付きURIは不正", () => {
    const uri = vscode.Uri.parse("esa://team/posts/1.md?foo=bar");
    assert.throws(() => parseEsaUri(uri), /query/);
  });

  test("fragment付きURIは不正", () => {
    const uri = vscode.Uri.parse("esa://team/posts/1.md#section");
    assert.throws(() => parseEsaUri(uri), /fragment/);
  });
});
