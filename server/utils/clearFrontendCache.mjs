const FRONTEND_CACHE_URL =
  process.env.FRONTEND_CACHE_URL ||
  `${String(process.env.FRONTEND_BASE_URL || "https://sarkariafsar.com").replace(/\/+$/, "")}/api/revalidate`;

const CACHE_SECRET =
  process.env.CACHE_SECRET ||
  process.env.FRONT_API_CACHE_CLEAR_TOKEN ||
  "your_strong_secret_token";

const CACHE_TIMEOUT_MS = Number.parseInt(
  String(process.env.FRONT_API_CACHE_CLEAR_TIMEOUT_MS || "8000"),
  10
);

export const clearFrontendCache = async (tag = "") => {
  try {
    if (!CACHE_SECRET) return;

    const cleanTag = String(tag || "").trim();
    const url = new URL(FRONTEND_CACHE_URL);
    url.searchParams.set("secret", CACHE_SECRET);
    if (cleanTag) {
      url.searchParams.set("tag", cleanTag);
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number.isNaN(CACHE_TIMEOUT_MS) ? 8000 : CACHE_TIMEOUT_MS
    );

    try {
      await fetch(url.toString(), {
        method: "GET",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error("Cache clear failed:", err?.message || String(err));
  }
};

export default {
  clearFrontendCache,
};
