const FRONTEND_CACHE_URL =
  process.env.FRONTEND_CACHE_URL ||
  `${String(process.env.FRONTEND_BASE_URL || "https://sarkariafsar.com").replace(/\/+$/, "")}/revalidate`;

const CACHE_SECRET =
  process.env.API_CACHE_CLEAR_TOKEN ||
  process.env.FRONT_API_CACHE_CLEAR_TOKEN ||
  process.env.CACHE_SECRET ||
  "";

const CACHE_TIMEOUT_MS = Number.parseInt(
  String(process.env.FRONT_API_CACHE_CLEAR_TIMEOUT_MS || "8000"),
  10
);

const sleep = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

export const revalidateFrontend = async (tag = null) => {
  if (!CACHE_SECRET) {
    throw new Error("API_CACHE_CLEAR_TOKEN is missing");
  }

  const cleanTag = String(tag || "").trim();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number.isNaN(CACHE_TIMEOUT_MS) ? 8000 : CACHE_TIMEOUT_MS
  );

  try {
    const response = await fetch(FRONTEND_CACHE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CACHE_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cleanTag ? { tag: cleanTag } : {}),
      signal: controller.signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Revalidate failed: ${response.status} ${text}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

export const clearFrontendCache = async (tag = "") => {
  const cleanTag = String(tag || "").trim();

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await revalidateFrontend(cleanTag || null);
    } catch (err) {
      const reason = err?.message || String(err);
      console.error(
        `[cache-revalidate] attempt=${attempt} tag=${cleanTag || "ALL"} failed: ${reason}`
      );
      if (attempt < 2) {
        await sleep(300);
        continue;
      }
      return null;
    }
  }
};

export default {
  revalidateFrontend,
  clearFrontendCache,
};
