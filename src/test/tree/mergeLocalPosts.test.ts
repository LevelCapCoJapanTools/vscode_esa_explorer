import * as assert from "assert";
import type { EsaPost } from "../../api/types.js";
import { mergeLocalPosts } from "../../tree/EsaPostTreeProvider.js";

function makePost(number: number): EsaPost {
  const user = { myself: true, name: "Test", screen_name: "test", icon: "" };
  return {
    number,
    name: `post${number}`,
    full_name: `post${number}`,
    wip: true,
    body_md: "",
    created_at: "2024-01-01T00:00:00+09:00",
    updated_at: "2024-01-01T00:00:00+09:00",
    url: `https://example.esa.io/posts/${number}`,
    tags: [],
    category: null,
    revision_number: 1,
    created_by: user,
    updated_by: user,
  };
}

suite("mergeLocalPosts", () => {
  test("API一覧に未反映の記事を補完する", () => {
    const local = new Map([[2, { post: makePost(2), expiresAt: 1000 }]]);
    const merged = mergeLocalPosts([makePost(1)], local, 0);
    assert.deepStrictEqual(
      merged.map((p) => p.number),
      [1, 2],
    );
    assert.strictEqual(local.size, 1);
  });

  test("API一覧に含まれた記事は補完せず保持も解除する", () => {
    const local = new Map([[2, { post: makePost(2), expiresAt: 1000 }]]);
    const merged = mergeLocalPosts([makePost(1), makePost(2)], local, 0);
    assert.strictEqual(merged.length, 2);
    assert.strictEqual(local.size, 0);
  });

  test("期限切れの記事は補完せず破棄する", () => {
    const local = new Map([[2, { post: makePost(2), expiresAt: 1000 }]]);
    const merged = mergeLocalPosts([makePost(1)], local, 1000);
    assert.strictEqual(merged.length, 1);
    assert.strictEqual(local.size, 0);
  });
});
