import * as assert from "assert";
import { EsaApiClient } from "../../api/EsaApiClient.js";
import { EsaApiError } from "../../api/EsaApiError.js";
import type { EsaPost } from "../../api/types.js";

const FAKE_TOKEN = "test-token-not-real";
const TEAM = "test-team";

function makePost(num: number): EsaPost {
  return {
    number: num,
    name: `Post ${num}`,
    full_name: `Post ${num}`,
    wip: false,
    body_md: "body",
    created_at: "2024-01-01T00:00:00+09:00",
    updated_at: "2024-01-01T00:00:00+09:00",
    url: `https://example.esa.io/posts/${num}`,
    tags: [],
    category: null,
    revision_number: 1,
    created_by: { myself: true, name: "Test", screen_name: "test", icon: "" },
    updated_by: { myself: true, name: "Test", screen_name: "test", icon: "" },
  };
}

function makeMockFetch(
  responses: Array<{ status: number; body: unknown; headers?: Record<string, string> }>,
): typeof fetch {
  let callIndex = 0;
  const fn = async (): Promise<Response> => {
    const resp = responses[callIndex++] ?? { status: 500, body: { error: "No more responses" } };
    const bodyStr = JSON.stringify(resp.body);
    const headers = new Headers(resp.headers ?? { "content-type": "application/json" });
    return new Response(bodyStr, { status: resp.status, headers });
  };
  return fn as unknown as typeof fetch;
}

suite("EsaApiClient", () => {
  test("AuthorizationヘッダーにBearerトークンが含まれる", async () => {
    let capturedHeaders: Headers | undefined;
    const mockFetch = async (_url: string, options: RequestInit): Promise<Response> => {
      capturedHeaders = new Headers(options.headers as Record<string, string>);
      return new Response(JSON.stringify(makePost(1)), { status: 200 });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await client.getPost(TEAM, 1, FAKE_TOKEN);
    assert.strictEqual(capturedHeaders?.get("authorization"), `Bearer ${FAKE_TOKEN}`);
  });

  test("GETリクエストにContent-Typeを付与しない", async () => {
    let capturedHeaders: Headers | undefined;
    const mockFetch = async (_url: string, options: RequestInit): Promise<Response> => {
      capturedHeaders = new Headers(options.headers as Record<string, string>);
      return new Response(JSON.stringify(makePost(1)), { status: 200 });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await client.getPost(TEAM, 1, FAKE_TOKEN);
    assert.strictEqual(capturedHeaders?.get("content-type"), null);
  });

  test("PATCHリクエストにJSONボディが含まれる", async () => {
    let capturedBody: unknown;
    const mockFetch = async (_url: string, options: RequestInit): Promise<Response> => {
      capturedBody = JSON.parse(options.body as string);
      return new Response(JSON.stringify(makePost(1)), { status: 200 });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await client.updatePost(
      TEAM,
      1,
      {
        bodyMd: "new body",
        message: "Updated from VS Code",
        originalRevision: { body_md: "old body", number: 1, user: "test" },
      },
      FAKE_TOKEN,
    );
    assert.ok(typeof capturedBody === "object" && capturedBody !== null);
    const body = capturedBody as Record<string, unknown>;
    assert.ok("post" in body);
  });

  test("ページネーション: next_pageがnullになるまで取得", async () => {
    const page1 = {
      posts: [makePost(1)],
      prev_page: null,
      next_page: 2,
      total_count: 2,
      page: 1,
      per_page: 100,
      max_per_page: 100,
    };
    const page2 = {
      posts: [makePost(2)],
      prev_page: 1,
      next_page: null,
      total_count: 2,
      page: 2,
      per_page: 100,
      max_per_page: 100,
    };
    const mockFetch = makeMockFetch([
      { status: 200, body: page1 },
      { status: 200, body: page2 },
    ]);
    const client = new EsaApiClient(mockFetch);
    const posts = await client.listAllPosts(TEAM, FAKE_TOKEN);
    assert.strictEqual(posts.length, 2);
  });

  test("HTTP 401でEsaApiErrorをthrow", async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: { error: "Unauthorized" } }]);
    const client = new EsaApiClient(mockFetch);
    await assert.rejects(
      () => client.getPost(TEAM, 1, FAKE_TOKEN),
      (err: unknown) => {
        assert.ok(err instanceof EsaApiError);
        assert.strictEqual(err.status, 401);
        return true;
      },
    );
  });

  test("HTTP 403", async () => {
    const mockFetch = makeMockFetch([{ status: 403, body: {} }]);
    const client = new EsaApiClient(mockFetch);
    await assert.rejects(() => client.getPost(TEAM, 1, FAKE_TOKEN), EsaApiError);
  });

  test("HTTP 404", async () => {
    const mockFetch = makeMockFetch([{ status: 404, body: {} }]);
    const client = new EsaApiClient(mockFetch);
    await assert.rejects(() => client.getPost(TEAM, 1, FAKE_TOKEN), EsaApiError);
  });

  test("HTTP 429: retryAfterSecondsが設定される", async () => {
    const mockFetch = makeMockFetch([
      {
        status: 429,
        body: {},
        headers: { "retry-after": "60", "content-type": "application/json" },
      },
    ]);
    const client = new EsaApiClient(mockFetch);
    await assert.rejects(
      () => client.getPost(TEAM, 1, FAKE_TOKEN),
      (err: unknown) => {
        assert.ok(err instanceof EsaApiError);
        assert.strictEqual(err.status, 429);
        assert.strictEqual(err.retryAfterSeconds, 60);
        return true;
      },
    );
  });

  test("HTTP 500", async () => {
    const mockFetch = makeMockFetch([{ status: 500, body: {} }]);
    const client = new EsaApiClient(mockFetch);
    await assert.rejects(() => client.getPost(TEAM, 1, FAKE_TOKEN), EsaApiError);
  });

  test("エラーメッセージにトークンが含まれない", async () => {
    const mockFetch = makeMockFetch([{ status: 401, body: {} }]);
    const client = new EsaApiClient(mockFetch);
    try {
      await client.getPost(TEAM, 1, FAKE_TOKEN);
      assert.fail("Should throw");
    } catch (err: unknown) {
      assert.ok(err instanceof EsaApiError);
      assert.ok(!err.message.includes(FAKE_TOKEN));
    }
  });

  test("original_revisionがPATCHボディに含まれる", async () => {
    let capturedBody: unknown;
    const mockFetch = async (_url: string, options: RequestInit): Promise<Response> => {
      capturedBody = JSON.parse(options.body as string);
      return new Response(JSON.stringify(makePost(1)), { status: 200 });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await client.updatePost(
      TEAM,
      1,
      {
        bodyMd: "new",
        message: "msg",
        originalRevision: { body_md: "old", number: 5, user: "alice" },
      },
      FAKE_TOKEN,
    );
    const body = capturedBody as { post: { original_revision: { number: number } } };
    assert.strictEqual(body.post.original_revision.number, 5);
  });

  test("タイムアウト時にEsaApiError(TIMEOUT)", async () => {
    const mockFetch = async (_url: string, options: RequestInit): Promise<Response> => {
      const signal = options.signal as AbortSignal;
      return new Promise((_resolve, reject) => {
        if (signal.aborted) {
          reject(Object.assign(new Error("AbortError"), { name: "AbortError" }));
        } else {
          signal.addEventListener("abort", () => {
            reject(Object.assign(new Error("AbortError"), { name: "AbortError" }));
          });
        }
      });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch, 50);
    await assert.rejects(
      () => client.getPost(TEAM, 1, FAKE_TOKEN),
      (err: unknown) => {
        assert.ok(err instanceof EsaApiError);
        assert.strictEqual(err.code, "TIMEOUT");
        return true;
      },
    );
  });

  test("ネットワーク例外", async () => {
    const mockFetch = async (): Promise<Response> => {
      throw new TypeError("Failed to fetch");
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await assert.rejects(
      () => client.getPost(TEAM, 1, FAKE_TOKEN),
      (err: unknown) => {
        assert.ok(err instanceof EsaApiError);
        assert.strictEqual(err.code, "NETWORK_ERROR");
        return true;
      },
    );
  });

  test("不正なJSONレスポンス構造", async () => {
    const mockFetch = async (): Promise<Response> => {
      return new Response(JSON.stringify({ invalid: true }), { status: 200 });
    };
    const client = new EsaApiClient(mockFetch as unknown as typeof fetch);
    await assert.rejects(() => client.getPost(TEAM, 1, FAKE_TOKEN), EsaApiError);
  });
});
