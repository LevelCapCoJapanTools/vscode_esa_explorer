import { API_BASE_URL, API_PER_PAGE, API_TIMEOUT_MS } from "../constants.js";
import { EsaApiError } from "./EsaApiError.js";
import type { EsaPost, EsaPostsResponse, UpdatePostInput } from "./types.js";

export type FetchFn = typeof fetch;

interface RateLimitInfo {
  rateLimitLimit?: number;
  rateLimitRemaining?: number;
  rateLimitResetAt?: Date;
  retryAfterSeconds?: number;
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo {
  const limit = headers.get("x-ratelimit-limit");
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  const retryAfter = headers.get("retry-after");

  const info: RateLimitInfo = {};
  if (limit !== null) {
    info.rateLimitLimit = parseInt(limit, 10);
  }
  if (remaining !== null) {
    info.rateLimitRemaining = parseInt(remaining, 10);
  }
  if (reset !== null) {
    info.rateLimitResetAt = new Date(parseInt(reset, 10) * 1000);
  }
  if (retryAfter !== null) {
    info.retryAfterSeconds = parseInt(retryAfter, 10);
  }
  return info;
}

function isEsaPost(value: unknown): value is EsaPost {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["number"] === "number" &&
    typeof v["name"] === "string" &&
    typeof v["body_md"] === "string" &&
    typeof v["revision_number"] === "number" &&
    typeof v["updated_by"] === "object" &&
    v["updated_by"] !== null &&
    typeof (v["updated_by"] as Record<string, unknown>)["screen_name"] === "string"
  );
}

function isEsaPostsResponse(value: unknown): value is EsaPostsResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v["posts"]) &&
    (v["next_page"] === null || typeof v["next_page"] === "number") &&
    (v["prev_page"] === null || typeof v["prev_page"] === "number")
  );
}

interface ErrorOptions extends RateLimitInfo {
  status: number;
  responseMessage?: string;
}

async function handleErrorResponse(response: Response): Promise<never> {
  const rateLimitInfo = parseRateLimitHeaders(response.headers);

  let responseMessage: string | undefined;
  try {
    const body = (await response.json()) as Record<string, unknown>;
    if (typeof body["message"] === "string") {
      responseMessage = body["message"];
    } else if (typeof body["error"] === "string") {
      responseMessage = body["error"];
    }
  } catch {
    // Non-JSON response
  }

  const status = response.status;
  const options: ErrorOptions = { status, ...rateLimitInfo };
  if (responseMessage !== undefined) {
    options.responseMessage = responseMessage;
  }

  switch (status) {
    case 400:
      throw new EsaApiError(
        `esa APIへのリクエスト内容が正しくありません。${responseMessage ? `\n${responseMessage}` : ""}`,
        options,
      );
    case 401:
      throw new EsaApiError(
        "esa.ioの認証に失敗しました。Personal Access Tokenのスコープと有効性を確認してください。",
        options,
      );
    case 403:
      throw new EsaApiError(
        "esa.ioチームへのアクセスが許可されていません。チームのAPIアクセスポリシーとOwnerの承認状態を確認してください。",
        options,
      );
    case 404:
      throw new EsaApiError("指定されたesa.ioの記事またはチームが見つかりません。", options);
    case 429: {
      const retryMsg =
        rateLimitInfo.retryAfterSeconds !== undefined
          ? `\n${rateLimitInfo.retryAfterSeconds}秒後に再実行できます。`
          : "";
      throw new EsaApiError(
        `esa APIの利用制限を超えました。時間を置いてからTree Viewの更新（再読み込み）を行ってください。${retryMsg}`,
        options,
      );
    }
    default:
      throw new EsaApiError(`esa APIからエラーが返されました (HTTP ${status})。`, options);
  }
}

export class EsaApiClient {
  private readonly fetchFn: FetchFn;
  private readonly timeoutMs: number;

  constructor(fetchFn: FetchFn = fetch, timeoutMs: number = API_TIMEOUT_MS) {
    this.fetchFn = fetchFn;
    this.timeoutMs = timeoutMs;
  }

  private async request<T>(
    token: string,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    let response: Response;
    try {
      const init: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };
      if (body !== undefined) {
        init.body = JSON.stringify(body);
      }
      response = await this.fetchFn(`${API_BASE_URL}${path}`, init);
    } catch (err: unknown) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === "AbortError") {
        throw new EsaApiError("esa APIへの接続がタイムアウトしました。", { code: "TIMEOUT" });
      }
      throw new EsaApiError("esa APIへ接続できませんでした。ネットワーク接続を確認してください。", {
        code: "NETWORK_ERROR",
      });
    }
    clearTimeout(timer);

    if (!response.ok) {
      await handleErrorResponse(response);
    }

    return response.json() as Promise<T>;
  }

  async listAllPosts(teamName: string, token: string): Promise<EsaPost[]> {
    const posts: EsaPost[] = [];
    let page = 1;

    for (;;) {
      const path = `/teams/${encodeURIComponent(teamName)}/posts?page=${page}&per_page=${API_PER_PAGE}&sort=updated&order=desc`;
      const data = await this.request<unknown>(token, "GET", path);

      if (!isEsaPostsResponse(data)) {
        throw new EsaApiError("esa APIからの記事一覧レスポンスの形式が不正です。");
      }

      for (const post of data.posts) {
        if (!isEsaPost(post)) {
          throw new EsaApiError("esa APIからの記事データの形式が不正です。");
        }
        posts.push(post);
      }

      if (data.next_page === null) break;
      page = data.next_page;
    }

    return posts;
  }

  async getPost(teamName: string, postNumber: number, token: string): Promise<EsaPost> {
    const path = `/teams/${encodeURIComponent(teamName)}/posts/${postNumber}`;
    const data = await this.request<unknown>(token, "GET", path);

    if (!isEsaPost(data)) {
      throw new EsaApiError("esa APIからの記事レスポンスの形式が不正です。");
    }
    return data;
  }

  async updatePost(
    teamName: string,
    postNumber: number,
    input: UpdatePostInput,
    token: string,
  ): Promise<EsaPost> {
    const path = `/teams/${encodeURIComponent(teamName)}/posts/${postNumber}`;
    const requestBody = {
      post: {
        body_md: input.bodyMd,
        message: input.message,
        original_revision: {
          body_md: input.originalRevision.body_md,
          number: input.originalRevision.number,
          user: input.originalRevision.user,
        },
      },
    };
    const data = await this.request<unknown>(token, "PATCH", path, requestBody);

    if (!isEsaPost(data)) {
      throw new EsaApiError("esa APIからの更新レスポンスの形式が不正です。");
    }
    return data;
  }

  async checkConnection(teamName: string, token: string): Promise<void> {
    const path = `/teams/${encodeURIComponent(teamName)}/posts?page=1&per_page=1`;
    await this.request<unknown>(token, "GET", path);
  }
}
