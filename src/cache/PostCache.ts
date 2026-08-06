import type { EsaPost } from "../api/types.js";

export interface CachedPost {
  post: EsaPost;
  originalBodyMd: string;
  originalRevisionNumber: number;
  originalUpdatedByScreenName: string;
  fetchedAt: Date;
}

function cacheKey(teamName: string, postNumber: number): string {
  return `${teamName}:${postNumber}`;
}

export class PostCache {
  private readonly cache = new Map<string, CachedPost>();

  set(teamName: string, post: EsaPost): void {
    const key = cacheKey(teamName, post.number);
    this.cache.set(key, {
      post,
      originalBodyMd: post.body_md,
      originalRevisionNumber: post.revision_number,
      originalUpdatedByScreenName: post.updated_by.screen_name,
      fetchedAt: new Date(),
    });
  }

  get(teamName: string, postNumber: number): CachedPost | undefined {
    return this.cache.get(cacheKey(teamName, postNumber));
  }

  delete(teamName: string, postNumber: number): void {
    this.cache.delete(cacheKey(teamName, postNumber));
  }

  clear(): void {
    this.cache.clear();
  }
}
