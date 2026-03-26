/**
 * Thin sessionStorage cache shared by all Redux slices.
 * - Works client-side only (typeof window guard keeps SSR safe).
 * - TTL: 30 minutes. After that the entry is treated as a miss and removed.
 */

const TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCache(key) {
  try {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      sessionStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function setCache(key, data) {
  try {
    if (typeof window === "undefined") return;
    sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Quota exceeded or private browsing — silently ignore.
  }
}

export function clearCache(key) {
  try {
    if (typeof window === "undefined") return;
    if (key) {
      sessionStorage.removeItem(key);
    } else {
      // Clear all sarkari_* entries
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith("sarkari_"))
        .forEach((k) => sessionStorage.removeItem(k));
    }
  } catch { /* noop */ }
}

/**
 * fetch() wrapper that aborts after `timeoutMs` milliseconds.
 * Throws on timeout (AbortError) — callers should catch and rejectWithValue.
 */
export async function fetchWithTimeout(url, timeoutMs = 30000, init = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
