import * as assert from "assert";
import * as vscode from "vscode";
import {
  EsaDraftFileSystemProvider,
  getDocumentReplaceRange,
  withDraftSaveLock,
} from "../../filesystem/EsaDraftFileSystemProvider.js";
import { buildDraftUri } from "../../filesystem/EsaDraftUri.js";
import { buildEsaUri } from "../../filesystem/EsaUri.js";
import { PostCache } from "../../cache/PostCache.js";
import { EsaDraftManager } from "../../draft/EsaDraftManager.js";
import { MockDraftEditorUiAdapter } from "./EsaDraftFileSystemProviderTestHelper.js";
import type { EsaPost } from "../../api/types.js";
import type { EsaApiClient } from "../../api/EsaApiClient.js";
import type { CredentialService } from "../../authentication/CredentialService.js";
import type { ExtensionLogger } from "../../logging/ExtensionLogger.js";
import type { EsaPostTreeProvider } from "../../tree/EsaPostTreeProvider.js";

const TEAM = "test-team";
const DRAFT_URI = buildDraftUri(TEAM, "draft-id");
const CONTENT = Buffer.from("draft body", "utf8");
const WRITE_OPTIONS = { create: true, overwrite: true };

function createPost(number: number): EsaPost {
  return {
    number,
    name: "Created",
    full_name: "Created",
    wip: true,
    body_md: CONTENT.toString("utf8"),
    created_at: "2024-01-01T00:00:00+09:00",
    updated_at: "2024-01-01T00:00:00+09:00",
    url: `https://example.esa.io/posts/${number}`,
    tags: [],
    category: "Users/test",
    revision_number: 1,
    created_by: { myself: true, name: "Test", screen_name: "test", icon: "" },
    updated_by: { myself: true, name: "Test", screen_name: "test", icon: "" },
  };
}

interface ProviderFixture {
  provider: EsaDraftFileSystemProvider;
  ui: MockDraftEditorUiAdapter;
  draftManager: EsaDraftManager;
  refreshCalls: number;
  registeredPosts: number[];
}

function createFixture(options?: {
  createPostError?: Error;
  remotePostNumber?: number;
}): ProviderFixture {
  const cache = new PostCache();
  const draftManager = new EsaDraftManager();
  draftManager.register(DRAFT_URI, { id: "draft-id" });
  const post = createPost(options?.remotePostNumber ?? 100);
  const remoteUri = buildEsaUri(TEAM, post.number);
  const ui = new MockDraftEditorUiAdapter([
    { uri: DRAFT_URI, text: CONTENT.toString("utf8") },
    { uri: remoteUri, text: CONTENT.toString("utf8") },
  ]);
  const apiClient = {
    getAuthenticatedUser: async () => ({ screen_name: "test" }),
    createPost: async () => {
      if (options?.createPostError) {
        throw options.createPostError;
      }
      return post;
    },
  };
  const credentialService = {
    getToken: async () => "token",
  };
  const logger = {
    info: () => undefined,
    error: () => undefined,
  };
  let refreshCalls = 0;
  const registeredPosts: number[] = [];
  const treeProvider = {
    refresh: async () => {
      refreshCalls += 1;
    },
    registerCreatedPost: (post: { number: number }) => {
      registeredPosts.push(post.number);
    },
  };
  const provider = new EsaDraftFileSystemProvider(
    cache,
    apiClient as unknown as EsaApiClient,
    credentialService as unknown as CredentialService,
    logger as unknown as ExtensionLogger,
    draftManager,
    () => treeProvider as unknown as EsaPostTreeProvider,
    ui,
  );

  return {
    provider,
    ui,
    draftManager,
    registeredPosts,
    get refreshCalls() {
      return refreshCalls;
    },
  };
}

async function flushAsyncTasks(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function tabUri(tab: vscode.Tab): string | undefined {
  const input = tab.input as { uri?: vscode.Uri };
  return input.uri?.toString();
}

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

  test("保存完了イベント後にDraftタブのみを閉じる", async () => {
    const fixture = createFixture();
    const remoteUri = buildEsaUri(TEAM, 100);
    fixture.ui.setTabSpecs([{ uri: DRAFT_URI }, { uri: remoteUri }]);

    await fixture.provider.writeFile(DRAFT_URI, CONTENT, WRITE_OPTIONS);
    assert.strictEqual(fixture.ui.closedTabs.length, 0);

    fixture.ui.emitSave(DRAFT_URI);
    await flushAsyncTasks();

    assert.strictEqual(fixture.ui.closedTabs.length, 1);
    assert.strictEqual(tabUri(fixture.ui.closedTabs[0]!), DRAFT_URI.toString());
    const remainingTabs = fixture.ui.getAllTabGroups()[0]?.tabs ?? [];
    assert.ok(remainingTabs.some((tab) => tabUri(tab) === remoteUri.toString()));
    assert.strictEqual(fixture.draftManager.get(DRAFT_URI), undefined);
    assert.strictEqual(fixture.refreshCalls, 1);
    assert.strictEqual(fixture.registeredPosts.length, 1);
  });

  test("createPost失敗時はDraftを保持して閉じない", async () => {
    const fixture = createFixture({ createPostError: new Error("create failed") });
    fixture.ui.setTabSpecs([{ uri: DRAFT_URI }]);

    await assert.rejects(() => fixture.provider.writeFile(DRAFT_URI, CONTENT, WRITE_OPTIONS));
    fixture.ui.emitSave(DRAFT_URI);
    await flushAsyncTasks();

    assert.strictEqual(fixture.ui.closedTabs.length, 0);
    assert.ok(fixture.draftManager.get(DRAFT_URI));
    assert.strictEqual(fixture.ui.errorMessages.length, 1);
    assert.strictEqual(fixture.refreshCalls, 0);
  });

  test("tabGroups.closeがfalseのときはDraftを保持して通知する", async () => {
    const fixture = createFixture();
    fixture.ui.closeBehavior = "returnFalse";
    fixture.ui.setTabSpecs([{ uri: DRAFT_URI }]);

    await fixture.provider.writeFile(DRAFT_URI, CONTENT, WRITE_OPTIONS);
    fixture.ui.emitSave(DRAFT_URI);
    await flushAsyncTasks();

    assert.strictEqual(fixture.ui.closedTabs.length, 1);
    assert.ok(fixture.draftManager.get(DRAFT_URI));
    assert.deepStrictEqual(fixture.ui.errorMessages, ["下書きタブを閉じられませんでした。"]);
  });

  test("Draftタブがdirtyのときは閉じない", async () => {
    const fixture = createFixture();
    fixture.ui.setTabSpecs([{ uri: DRAFT_URI, isDirty: true }]);

    await fixture.provider.writeFile(DRAFT_URI, CONTENT, WRITE_OPTIONS);
    fixture.ui.emitSave(DRAFT_URI);
    await flushAsyncTasks();

    assert.strictEqual(fixture.ui.closedTabs.length, 0);
    assert.ok(fixture.draftManager.get(DRAFT_URI));
    assert.strictEqual(fixture.refreshCalls, 1);
  });

  test("Draftタブ未検出時は通知せずにDraft状態を破棄する", async () => {
    const fixture = createFixture();
    const remoteUri = buildEsaUri(TEAM, 100);
    fixture.ui.setTabSpecs([{ uri: remoteUri }]);

    await fixture.provider.writeFile(DRAFT_URI, CONTENT, WRITE_OPTIONS);
    fixture.ui.emitSave(DRAFT_URI);
    await flushAsyncTasks();

    assert.strictEqual(fixture.ui.closedTabs.length, 0);
    assert.strictEqual(fixture.ui.errorMessages.length, 0);
    assert.strictEqual(fixture.draftManager.get(DRAFT_URI), undefined);
  });
});
