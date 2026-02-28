import { buildCanonicalKey } from "./postFormatter";

export function buildPostDetailsHref({ title = "", jobUrl = "" } = {}) {
  const canonicalKey = buildCanonicalKey({ title, jobUrl }) || "post-detail";
  const normalizedJobUrl = String(jobUrl || "").trim();

  if (!normalizedJobUrl) {
    return `/post/${canonicalKey}`;
  }

  const query = new URLSearchParams({ jobUrl: normalizedJobUrl });
  return `/post/${canonicalKey}?${query.toString()}`;
}
