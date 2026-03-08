import NodeCache from "node-cache";

const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const toNonNegativeInteger = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const DEFAULT_API_CACHE_TTL_SECONDS = toPositiveInteger(
  process.env.API_RESPONSE_CACHE_TTL_SECONDS,
  300
);
const DEFAULT_API_CACHE_BROWSER_MAX_AGE_SECONDS = toNonNegativeInteger(
  process.env.API_RESPONSE_BROWSER_MAX_AGE_SECONDS,
  0
);

const apiResponseCache = new NodeCache({
  stdTTL: DEFAULT_API_CACHE_TTL_SECONDS,
  checkperiod: Math.max(30, Math.floor(DEFAULT_API_CACHE_TTL_SECONDS / 2)),
  useClones: false,
  deleteOnExpire: true,
});

const toCacheTtlSeconds = (value = DEFAULT_API_CACHE_TTL_SECONDS) =>
  toPositiveInteger(value, DEFAULT_API_CACHE_TTL_SECONDS);

const toBrowserMaxAgeSeconds = (value = DEFAULT_API_CACHE_BROWSER_MAX_AGE_SECONDS) =>
  toNonNegativeInteger(value, DEFAULT_API_CACHE_BROWSER_MAX_AGE_SECONDS);

export const buildApiCacheKey = ({ namespace = "api", req = null } = {}) => {
  const method = String(req?.method || "GET").toUpperCase();
  const path = String(req?.originalUrl || req?.url || "").trim();
  return `${String(namespace || "api").trim()}|${method}|${path}`;
};

export const setApiCacheHeaders = (res, ttlSeconds = DEFAULT_API_CACHE_TTL_SECONDS, state = "MISS") => {
  const safeTtlSeconds = toCacheTtlSeconds(ttlSeconds);
  const browserMaxAgeSeconds = Math.min(
    safeTtlSeconds,
    toBrowserMaxAgeSeconds(DEFAULT_API_CACHE_BROWSER_MAX_AGE_SECONDS)
  );
  const staleWhileRevalidateSeconds = Math.max(
    30,
    Math.floor(safeTtlSeconds / 2)
  );

  res.setHeader(
    "Cache-Control",
    `public, max-age=${browserMaxAgeSeconds}, s-maxage=${safeTtlSeconds}, stale-while-revalidate=${staleWhileRevalidateSeconds}`
  );
  res.setHeader("X-Cache", state);
};

export const getApiCacheEntry = (key = "") => {
  const cleanKey = String(key || "").trim();
  if (!cleanKey) return null;
  return apiResponseCache.get(cleanKey) || null;
};

export const setApiCacheEntry = (key = "", value = null, ttlSeconds = DEFAULT_API_CACHE_TTL_SECONDS) => {
  const cleanKey = String(key || "").trim();
  if (!cleanKey) return false;
  return apiResponseCache.set(cleanKey, value, toCacheTtlSeconds(ttlSeconds));
};

export const clearApiCacheByPrefix = (prefix = "") => {
  const cleanPrefix = String(prefix || "").trim();
  const keys = apiResponseCache.keys();
  const matchedKeys = cleanPrefix
    ? keys.filter((key) => key.startsWith(cleanPrefix))
    : keys;

  if (matchedKeys.length === 0) {
    return 0;
  }

  apiResponseCache.del(matchedKeys);
  return matchedKeys.length;
};

export const clearAllApiCache = () => {
  const totalKeys = apiResponseCache.keys().length;
  apiResponseCache.flushAll();
  return totalKeys;
};

export const getApiCacheStats = () => {
  const stats = apiResponseCache.getStats();
  return {
    ...stats,
    keys: apiResponseCache.keys().length,
    defaultTtlSeconds: DEFAULT_API_CACHE_TTL_SECONDS,
  };
};

export const createApiCacheMiddleware = ({
  namespace = "api",
  ttlSeconds = DEFAULT_API_CACHE_TTL_SECONDS,
} = {}) => {
  const safeNamespace = String(namespace || "api").trim();
  const safeTtlSeconds = toCacheTtlSeconds(ttlSeconds);

  return (req, res, next) => {
    if (String(req?.method || "").toUpperCase() !== "GET") {
      return next();
    }

    if (
      String(req?.query?.cache || "").trim().toLowerCase() === "bypass" ||
      String(req?.headers?.["x-cache-bypass"] || "").trim() === "1"
    ) {
      setApiCacheHeaders(res, safeTtlSeconds, "BYPASS");
      return next();
    }

    const key = buildApiCacheKey({ namespace: safeNamespace, req });
    const cachedEntry = getApiCacheEntry(key);

    if (cachedEntry) {
      setApiCacheHeaders(
        res,
        cachedEntry.ttlSeconds || safeTtlSeconds,
        "HIT"
      );
      return res
        .status(Number(cachedEntry.statusCode || 200))
        .json(cachedEntry.payload);
    }

    const originalJson = res.json.bind(res);
    res.json = (payload) => {
      const statusCode = Number(res.statusCode || 200);

      if (statusCode >= 200 && statusCode < 300) {
        setApiCacheEntry(
          key,
          {
            payload,
            statusCode,
            ttlSeconds: safeTtlSeconds,
            cachedAt: new Date().toISOString(),
          },
          safeTtlSeconds
        );
        setApiCacheHeaders(res, safeTtlSeconds, "MISS");
      }

      return originalJson(payload);
    };

    return next();
  };
};

export default {
  buildApiCacheKey,
  setApiCacheHeaders,
  getApiCacheEntry,
  setApiCacheEntry,
  clearApiCacheByPrefix,
  clearAllApiCache,
  getApiCacheStats,
  createApiCacheMiddleware,
};
