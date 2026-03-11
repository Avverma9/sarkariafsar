import { clearFrontendCache } from "./clearFrontendCache.mjs";
import {
  clearAllApiCache,
  clearApiCacheByPrefix,
  getApiCacheStats,
} from "./apiCache.mjs";
import { sendSystemEventNotification } from "./jobUpdateMailer.mjs";

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

const DEFAULT_FRONTEND_PATHS = [
  "/",
  "/jobs",
  "/post",
  "/results",
  "/admit-cards",
  "/schemes",
];

const FRONTEND_REVALIDATE_TARGETS = {
  all: {
    tags: ["job-lists", "job-details", "job-sections", "sites", "gov-schemes"],
    paths: DEFAULT_FRONTEND_PATHS,
  },
  api: {
    tags: ["job-lists", "job-details", "job-sections", "sites", "gov-schemes"],
    paths: DEFAULT_FRONTEND_PATHS,
  },
  site: {
    tags: ["job-lists", "job-details", "job-sections", "sites"],
    paths: ["/", "/jobs", "/post", "/results", "/admit-cards"],
  },
  "gov-schemes": {
    tags: ["gov-schemes"],
    paths: ["/", "/schemes"],
  },
  "job-lists": {
    tags: ["job-lists"],
    paths: ["/", "/jobs", "/post", "/results", "/admit-cards"],
  },
  "job-details": {
    tags: ["job-details"],
    paths: ["/", "/jobs", "/post", "/results", "/admit-cards"],
  },
  "job-sections": {
    tags: ["job-sections"],
    paths: ["/", "/jobs", "/results", "/admit-cards", "/schemes"],
  },
  sites: {
    tags: ["sites"],
    paths: ["/"],
  },
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toUniqueStringArray = (values = []) => {
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const cleanValue = String(value || "").trim();
    if (!cleanValue) continue;

    const dedupeKey = cleanValue.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    output.push(cleanValue);
  }

  return output;
};

const normalizeTarget = (value = "all") => {
  const cleanValue = String(value || "all").trim().toLowerCase();
  return API_CACHE_TARGET_PREFIXES[cleanValue] ? cleanValue : "all";
};

const getFrontendRevalidateRequest = ({
  target = "all",
  tag = "",
  tags = [],
  path = "",
  paths = [],
} = {}) => {
  const defaults = FRONTEND_REVALIDATE_TARGETS[target] || FRONTEND_REVALIDATE_TARGETS.all;
  const explicitTags = toUniqueStringArray([
    ...toArray(tag),
    ...toArray(tags),
  ]);
  const explicitPaths = toUniqueStringArray([
    ...toArray(path),
    ...toArray(paths),
  ]);

  return {
    tags: explicitTags.length > 0 ? explicitTags : [...defaults.tags],
    paths: explicitPaths.length > 0 ? explicitPaths : [...defaults.paths],
  };
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
  tags = [],
  path = "",
  paths = [],
  clearFrontend = true,
  notify = false,
  notificationSource = "",
} = {}) => {
  const normalizedTarget = normalizeTarget(target);
  const apiDeleted = clearApiCacheForTarget(normalizedTarget);
  const frontendRequest = getFrontendRevalidateRequest({
    target: normalizedTarget,
    tag,
    tags,
    path,
    paths,
  });
  const frontendResult = clearFrontend
    ? await clearFrontendCache(frontendRequest)
    : null;

  const result = {
    target: normalizedTarget,
    tag: frontendRequest.tags[0] || null,
    tags: frontendRequest.tags,
    paths: frontendRequest.paths,
    apiDeleted,
    frontendResult,
    stats: getApiCacheStats(),
  };

  if (notify) {
    try {
      await sendSystemEventNotification({
        title: "Cache Cleared",
        eventType: "cache_clear",
        summary: `target=${normalizedTarget} frontend=${frontendResult ? "ok" : "failed_or_skipped"} apiDeleted=${apiDeleted}`,
        details: {
          source: String(notificationSource || "").trim() || "manual",
          ...result,
        },
      });
    } catch (error) {
      console.error(
        `[cache-clear-mailer] Failed: ${error?.message || error}`
      );
    }
  }

  return result;
};

export const invalidateAppCache = async (target = "all", options = {}) =>
  clearAppCacheStorage({
    target,
    tag: options?.tag || "",
    tags: options?.tags || [],
    path: options?.path || "",
    paths: options?.paths || [],
    clearFrontend: options?.clearFrontend !== false,
  });

export default {
  clearAppCacheStorage,
  invalidateAppCache,
};
