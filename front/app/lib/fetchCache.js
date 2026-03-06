const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

export const APP_FETCH_REVALIDATE_SECONDS = toPositiveInteger(
  process.env.NEXT_PUBLIC_APP_CACHE_REVALIDATE_SECONDS,
  300
);

export const CACHE_TAGS = Object.freeze({
  jobLists: "job-lists",
  jobDetails: "job-details",
  jobSections: "job-sections",
  sites: "sites",
  govSchemes: "gov-schemes",
  jobSearch: "job-search",
  siteSections: "site-sections",
  sectionJobs: "section-jobs",
});

const toUniqueTags = (tags = []) => {
  const output = [];
  const seen = new Set();

  for (const tag of tags || []) {
    const cleanTag = String(tag || "").trim();
    if (!cleanTag || seen.has(cleanTag)) continue;
    seen.add(cleanTag);
    output.push(cleanTag);
  }

  return output;
};

export const buildScopedCacheTag = (prefix = "", value = "") => {
  const cleanPrefix = String(prefix || "").trim();
  const cleanValue = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);

  if (!cleanPrefix || !cleanValue) return "";
  return `${cleanPrefix}:${cleanValue}`;
};

export const buildCachedFetchOptions = (
  {
    tags = [],
    revalidate = APP_FETCH_REVALIDATE_SECONDS,
    headers = {},
    cache = "force-cache",
  } = {},
  overrides = {}
) => ({
  method: "GET",
  cache,
  next: {
    revalidate: toPositiveInteger(revalidate, APP_FETCH_REVALIDATE_SECONDS),
    tags: toUniqueTags(tags),
  },
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
  ...overrides,
});

export const buildBrowserCachedFetchOptions = (
  {
    headers = {},
    cache = "force-cache",
  } = {},
  overrides = {}
) => ({
  method: "GET",
  cache,
  headers: {
    "Content-Type": "application/json",
    ...headers,
  },
  ...overrides,
});

export default {
  APP_FETCH_REVALIDATE_SECONDS,
  CACHE_TAGS,
  buildScopedCacheTag,
  buildCachedFetchOptions,
  buildBrowserCachedFetchOptions,
};
