import { buildCanonicalKey } from "./postFormatter";

export function buildPostDetailsHref({ title = "", jobUrl = "" } = {}) {
  const canonicalKey = buildCanonicalKey({ title, jobUrl }) || "post-detail";
  return `/post/${canonicalKey}`;
}
