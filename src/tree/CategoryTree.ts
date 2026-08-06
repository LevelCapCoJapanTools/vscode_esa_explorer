import type { EsaPost } from "../api/types.js";
import { UNCATEGORIZED_LABEL } from "../constants.js";

export interface CategoryNode {
  label: string;
  children: CategoryNode[];
  posts: EsaPost[];
}

function normalizeCategory(category: string | null | undefined): string[] {
  if (!category) return [];
  return category.split("/").filter((part) => part.length > 0);
}

function ensureChildNode(parent: CategoryNode, label: string): CategoryNode {
  const existing = parent.children.find((c) => c.label === label);
  if (existing) return existing;
  const node: CategoryNode = { label, children: [], posts: [] };
  parent.children.push(node);
  return node;
}

const collator = new Intl.Collator("ja", { sensitivity: "base" });

function sortNode(node: CategoryNode): void {
  node.children.sort((a, b) => collator.compare(a.label, b.label));
  node.posts.sort((a, b) => {
    const n = collator.compare(a.name, b.name);
    return n !== 0 ? n : a.number - b.number;
  });
  for (const child of node.children) {
    sortNode(child);
  }
}

export function buildCategoryTree(posts: EsaPost[]): CategoryNode[] {
  const root: CategoryNode = { label: "__root__", children: [], posts: [] };
  const uncategorized: CategoryNode = { label: UNCATEGORIZED_LABEL, children: [], posts: [] };

  for (const post of posts) {
    const parts = normalizeCategory(post.category);
    if (parts.length === 0) {
      uncategorized.posts.push(post);
      continue;
    }

    let current = root;
    for (const part of parts) {
      current = ensureChildNode(current, part);
    }
    current.posts.push(post);
  }

  sortNode(root);
  uncategorized.posts.sort((a, b) => {
    const n = collator.compare(a.name, b.name);
    return n !== 0 ? n : a.number - b.number;
  });

  const result = root.children;
  if (uncategorized.posts.length > 0) {
    result.push(uncategorized);
  }
  return result;
}
