import { buildCanonicalKey } from "./postFormatter";

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildPostDetailsHref({ title = "", jobUrl = "", slug = "" } = {}) {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug) {
    return `/post/${normalizedSlug}`;
  }

  const canonicalKey = buildCanonicalKey({ title, jobUrl }) || "post-detail";
  return `/post/${canonicalKey}`;
}
