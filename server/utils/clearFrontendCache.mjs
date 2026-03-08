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

const normalizeRevalidatePayload = (input = {}) => {
  if (typeof input === "string" || Array.isArray(input)) {
    return {
      tags: toUniqueStringArray(toArray(input)),
      paths: [],
    };
  }

  const source = input && typeof input === "object" ? input : {};
  const tags = toUniqueStringArray([
    ...toArray(source.tag),
    ...toArray(source.tags),
  ]);
  const paths = toUniqueStringArray([
    ...toArray(source.path),
    ...toArray(source.paths),
  ]);

  return { tags, paths };
};

export const revalidateFrontend = async (input = {}) => {
  if (!CACHE_SECRET) {
    throw new Error("API_CACHE_CLEAR_TOKEN is missing");
  }

  const payload = normalizeRevalidatePayload(input);
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
      body: JSON.stringify({
        ...(payload.tags.length > 0 ? { tags: payload.tags } : {}),
        ...(payload.paths.length > 0 ? { paths: payload.paths } : {}),
      }),
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

export const clearFrontendCache = async (input = {}) => {
  const payload = normalizeRevalidatePayload(input);
  const payloadLabel = JSON.stringify(payload);

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await revalidateFrontend(payload);
    } catch (err) {
      const reason = err?.message || String(err);
      console.error(
        `[cache-revalidate] attempt=${attempt} payload=${payloadLabel} failed: ${reason}`
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
