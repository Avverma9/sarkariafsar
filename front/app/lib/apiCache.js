import { NextResponse } from "next/server";

const GLOBAL_API_CACHE_KEY = "__front_api_cache_v1__";
const DEFAULT_TTL_MS = 60 * 1000;

function getGlobalCacheStore() {
  if (!globalThis[GLOBAL_API_CACHE_KEY]) {
    globalThis[GLOBAL_API_CACHE_KEY] = new Map();
  }
  return globalThis[GLOBAL_API_CACHE_KEY];
}

function nowMs() {
  return Date.now();
}

function normalizeTtlMs(value, fallback = DEFAULT_TTL_MS) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.floor(n);
}

function stableSerialize(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value).sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableSerialize(v)}`).join(",")}}`;
  }
  return JSON.stringify(String(value));
}

function buildStoreKey(namespace, key) {
  return `${String(namespace || "default")}:${String(key || "")}`;
}

function getCacheEntry(namespace, key) {
  const store = getGlobalCacheStore();
  const storeKey = buildStoreKey(namespace, key);
  const entry = store.get(storeKey);
  if (!entry) return null;

  if (entry.expiresAt <= nowMs()) {
    store.delete(storeKey);
    return null;
  }

  return entry;
}

function setCacheEntry(namespace, key, payload, status, ttlMs) {
  const store = getGlobalCacheStore();
  const storeKey = buildStoreKey(namespace, key);
  const ttl = normalizeTtlMs(ttlMs, DEFAULT_TTL_MS);
  const createdAt = nowMs();

  store.set(storeKey, {
    payload,
    status: Number(status || 200),
    createdAt,
    expiresAt: createdAt + ttl,
  });
}

function shouldCacheResponse(payload, status, cacheable) {
  if (cacheable === true) return true;
  if (cacheable === false) return false;
  const code = Number(status || 500);
  return code >= 200 && code < 300 && payload !== null && payload !== undefined;
}

export function createCacheKey(parts) {
  if (typeof parts === "string") return parts;
  return stableSerialize(parts);
}

export async function withApiJsonCache({
  namespace = "default",
  keyParts = "",
  ttlMs = DEFAULT_TTL_MS,
  loader,
}) {
  const key = createCacheKey(keyParts);
  const hit = getCacheEntry(namespace, key);
  if (hit) {
    return NextResponse.json(hit.payload, {
      status: hit.status,
      headers: {
        "x-api-cache": "HIT",
      },
    });
  }

  const result = await loader();
  const status = Number(result?.status || 200);
  const payload = result?.payload ?? null;
  const cacheable = result?.cacheable;

  if (shouldCacheResponse(payload, status, cacheable)) {
    setCacheEntry(namespace, key, payload, status, ttlMs);
  }

  return NextResponse.json(payload, {
    status,
    headers: {
      "x-api-cache": "MISS",
    },
  });
}

export function clearApiCache({ namespace = "" } = {}) {
  const store = getGlobalCacheStore();
  const ns = String(namespace || "").trim();

  if (!ns) {
    const cleared = store.size;
    store.clear();
    return cleared;
  }

  let cleared = 0;
  const prefix = `${ns}:`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
      cleared += 1;
    }
  }
  return cleared;
}

export function getApiCacheStats() {
  const store = getGlobalCacheStore();
  const current = nowMs();
  let active = 0;

  for (const entry of store.values()) {
    if (entry.expiresAt > current) active += 1;
  }

  return {
    total: store.size,
    active,
  };
}

