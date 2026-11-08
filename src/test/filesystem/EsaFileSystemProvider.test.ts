import * as assert from "assert";
import * as vscode from "vscode";
import type { EsaApiClient } from "../../api/EsaApiClient.js";
import type { CredentialService } from "../../authentication/CredentialService.js";
import { PostCache } from "../../cache/PostCache.js";
import {
  EsaFileSystemProvider,
  shouldRejectCreateOption,
} from "../../filesystem/EsaFileSystemProvider.js";
import { buildEsaUri } from "../../filesystem/EsaUri.js";
import type { ExtensionLogger } from "../../logging/ExtensionLogger.js";
import type { EsaPostTreeProvider } from "../../tree/EsaPostTreeProvider.js";
import type { EsaPost } from "../../api/types.js";

function makePost(overrides: Partial<EsaPost> & { number: number; name: string }): EsaPost {
  return {
    number: overrides.number,
    name: overrides.name,
    full_name: overrides.full_name ?? overrides.name,
    wip: overrides.wip ?? false,
    body_md: overrides.body_md ?? "",
    created_at: overrides.created_at ?? "2024-01-01T00:00:00+09:00",
    updated_at: overrides.updated_at ?? "2024-01-01T00:00:00+09:00",
    url: overrides.url ?? `https://example.esa.io/posts/${overrides.number}`,
    tags: overrides.tags ?? [],
    category: overrides.category ?? null,
    revision_number: overrides.revision_number ?? 1,
    created_by: overrides.created_by ?? {
      myself: true,
      name: "Test",
      screen_name: "test",
      icon: "",
    },
    updated_by: overrides.updated_by ?? {
      myself: true,
      name: "Test",
      screen_name: "test",
      icon: "",
    },
  };
}

suite("EsaFileSystemProvider", () => {
  test("既存記事キャッシュがある場合はcreate=trueでも新規作成エラーにしない", async () => {
    const cache = new PostCache();
    const uri = buildEsaUri("team", 50);
    const post = makePost({
      number: 50,
      name: "既存記事",
      body_md: "before",
      revision_number: 3,
    });
    cache.set("team", post);

    let updateCalled = false;
    const apiClient = {
      updatePost: async () => {
        updateCalled = true;
        return makePost({
          ...post,
          body_md: "after",
          revision_number: 4,
        });
      },
    } as unknown as EsaApiClient;
    const credentialService = {
      getToken: async () => "token",
    } as unknown as CredentialService;
    const logger = {
      info: () => undefined,
      error: () => undefined,
    } as unknown as ExtensionLogger;
    const treeProvider = {
      refresh: async () => undefined,
    } as unknown as EsaPostTreeProvider;
    const provider = new EsaFileSystemProvider(
      cache,
      apiClient,
      credentialService,
      logger,
      () => treeProvider,
    );

    await provider.writeFile(uri, Buffer.from("after", "utf8"), { create: true, overwrite: true });

    assert.strictEqual(updateCalled, true);
  });

  test("未キャッシュ記事にcreate=trueで保存すると新規作成エラーを返す", async () => {
    const cache = new PostCache();
    const uri = buildEsaUri("team", 51);
    const apiClient = {} as EsaApiClient;
    const credentialService = {} as CredentialService;
    const logger = {
      info: () => undefined,
      error: () => undefined,
    } as unknown as ExtensionLogger;
    const provider = new EsaFileSystemProvider(
      cache,
      apiClient,
      credentialService,
      logger,
      () => undefined,
    );

    await assert.rejects(
      () =>
        provider.writeFile(uri, Buffer.from("after", "utf8"), {
          create: true,
          overwrite: true,
        }),
      (err: unknown) =>
        err instanceof vscode.FileSystemError &&
        err.message.includes("記事の新規作成はサポートされていません。"),
    );
  });

  test("create判定はキャッシュ有無で分岐する", () => {
    assert.strictEqual(shouldRejectCreateOption(true, false), true);
    assert.strictEqual(shouldRejectCreateOption(true, true), false);
    assert.strictEqual(shouldRejectCreateOption(false, false), false);
  });
});
