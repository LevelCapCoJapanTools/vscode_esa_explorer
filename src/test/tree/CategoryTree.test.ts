import * as assert from "assert";
import { buildCategoryTree } from "../../tree/CategoryTree.js";
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

suite("CategoryTree", () => {
  test("空配列を渡すと空配列を返す", () => {
    const result = buildCategoryTree([]);
    assert.deepStrictEqual(result, []);
  });

  test("categoryがnullの場合は未分類へ", () => {
    const posts = [makePost({ number: 1, name: "記事A", category: null })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]!.label, "未分類");
    assert.strictEqual(result[0]!.posts.length, 1);
  });

  test("categoryが空文字の場合は未分類へ", () => {
    const posts = [makePost({ number: 1, name: "記事A", category: "" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "未分類");
  });

  test("単一カテゴリ", () => {
    const posts = [makePost({ number: 1, name: "記事A", category: "開発" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0]!.label, "開発");
    assert.strictEqual(result[0]!.posts.length, 1);
  });

  test("多階層カテゴリ", () => {
    const posts = [makePost({ number: 1, name: "API設計", category: "開発/バックエンド/API" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "開発");
    assert.strictEqual(result[0]!.children[0]!.label, "バックエンド");
    assert.strictEqual(result[0]!.children[0]!.children[0]!.label, "API");
    assert.strictEqual(result[0]!.children[0]!.children[0]!.posts[0]!.name, "API設計");
  });

  test("同一カテゴリの複数記事", () => {
    const posts = [
      makePost({ number: 1, name: "記事A", category: "開発" }),
      makePost({ number: 2, name: "記事B", category: "開発" }),
    ];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.posts.length, 2);
  });

  test("同名記事は記事番号で区別できる", () => {
    const posts = [
      makePost({ number: 1, name: "同名記事", category: "開発" }),
      makePost({ number: 2, name: "同名記事", category: "開発" }),
    ];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.posts.length, 2);
    assert.notStrictEqual(result[0]!.posts[0]!.number, result[0]!.posts[1]!.number);
  });

  test("日本語カテゴリ", () => {
    const posts = [makePost({ number: 1, name: "記事A", category: "議事録/2024年" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "議事録");
    assert.strictEqual(result[0]!.children[0]!.label, "2024年");
  });

  test("カテゴリと記事の安定ソート", () => {
    const posts = [
      makePost({ number: 1, name: "B記事", category: "Z" }),
      makePost({ number: 2, name: "A記事", category: "A" }),
    ];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "A");
    assert.strictEqual(result[1]!.label, "Z");
  });

  test("先頭スラッシュの正規化", () => {
    const posts = [makePost({ number: 1, name: "記事", category: "/開発/API" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "開発");
  });

  test("末尾スラッシュの正規化", () => {
    const posts = [makePost({ number: 1, name: "記事", category: "開発/API/" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "開発");
    assert.strictEqual(result[0]!.children[0]!.label, "API");
  });

  test("連続するスラッシュの正規化", () => {
    const posts = [makePost({ number: 1, name: "記事", category: "開発//API" })];
    const result = buildCategoryTree(posts);
    assert.strictEqual(result[0]!.label, "開発");
    assert.strictEqual(result[0]!.children[0]!.label, "API");
  });
});
