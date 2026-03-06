import { clearFrontendCache } from "./clearFrontendCache.mjs";
import {
  clearAllApiCache,
  clearApiCacheByPrefix,
  getApiCacheStats,
} from "./apiCache.mjs";

const API_CACHE_TARGET_PREFIXES = {
  all: [""],
  api: [""],
  site: ["site:"],
  "gov-schemes": ["gov-schemes:", "site:job-search|"],
  "job-lists": ["site:stored-joblist|"],
  "job-details": [
    "site:job-by-title|",
    "site:job-search|",
    "site:job-by-url|",
    "site:all-job-details|",
  ],
  "job-sections": ["site:job-sections|", "site:job-section-urls|"],
  sites: ["site:sites|", "site:scrape-site-sections|"],
};

const normalizeTarget = (value = "all") => {
  const cleanValue = String(value || "all").trim().toLowerCase();
  return API_CACHE_TARGET_PREFIXES[cleanValue] ? cleanValue : "all";
};

const getFrontendTagForTarget = (target = "all", tag = "") => {
  const cleanTag = String(tag || "").trim();
  if (cleanTag) return cleanTag;

  if (["job-lists", "job-details", "job-sections", "sites", "gov-schemes"].includes(target)) {
    return target;
  }

  return "";
};

const clearApiCacheForTarget = (target = "all") => {
  if (target === "all" || target === "api") {
    return clearAllApiCache();
  }

  const prefixes = API_CACHE_TARGET_PREFIXES[target] || API_CACHE_TARGET_PREFIXES.all;
  return prefixes.reduce((totalDeleted, prefix) => totalDeleted + clearApiCacheByPrefix(prefix), 0);
};

export const clearAppCacheStorage = async ({
  target = "all",
  tag = "",
  clearFrontend = true,
} = {}) => {
  const normalizedTarget = normalizeTarget(target);
  const apiDeleted = clearApiCacheForTarget(normalizedTarget);
  const frontendTag = getFrontendTagForTarget(normalizedTarget, tag);
  const frontendResult = clearFrontend
    ? await clearFrontendCache(frontendTag)
    : null;

  return {
    target: normalizedTarget,
    tag: frontendTag || null,
    apiDeleted,
    frontendResult,
    stats: getApiCacheStats(),
  };
};

export const invalidateAppCache = async (target = "all", options = {}) =>
  clearAppCacheStorage({
    target,
    tag: options?.tag || "",
    clearFrontend: options?.clearFrontend !== false,
  });

export default {
  clearAppCacheStorage,
  invalidateAppCache,
};
