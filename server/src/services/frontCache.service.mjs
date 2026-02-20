import logger from "../utils/logger.mjs";

const DEFAULT_TIMEOUT_MS = Math.max(
  1000,
  Number(process.env.FRONT_API_CACHE_CLEAR_TIMEOUT_MS || 8000),
);

function normalizeBaseUrl(value) {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\/+$/, "");
}

function resolveCacheClearUrl() {
  const explicit = normalizeBaseUrl(process.env.FRONT_API_CACHE_CLEAR_URL);
  if (explicit) return explicit;

  const frontBase = normalizeBaseUrl(
    process.env.FRONTEND_BASE_URL ||
      process.env.FRONT_BASE_URL ||
      process.env.FRONT_URL,
  );
  if (!frontBase) return "";
  return `${frontBase}/api/cache/clear`;
}

function resolveToken() {
  return String(
    process.env.FRONT_API_CACHE_CLEAR_TOKEN || process.env.API_CACHE_CLEAR_TOKEN || "",
  ).trim();
}

async function parseJsonSafe(response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { _rawText: text };
  }
}

export async function clearFrontApiCache({ namespace = "", reason = "" } = {}) {
  const enabled = String(process.env.FRONT_API_CACHE_CLEAR_ENABLED || "true")
    .trim()
    .toLowerCase();
  if (enabled === "false" || enabled === "0") {
    return {
      success: false,
      skipped: true,
      reason: "front-cache-clear-disabled",
    };
  }

  const url = resolveCacheClearUrl();
  if (!url) {
    return {
      success: false,
      skipped: true,
      reason: "front-cache-url-not-configured",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const token = resolveToken();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(namespace ? { namespace } : {}),
      signal: controller.signal,
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      const rawText = String(payload?._rawText || "").trim();
      const looksLikeMissingEndpoint =
        response.status === 404 &&
        /cannot\s+post\s+\/api\/cache\/clear/i.test(rawText);

      if (looksLikeMissingEndpoint) {
        return {
          success: false,
          skipped: true,
          reason: "front-cache-endpoint-not-found",
          status: response.status,
          message: "front cache clear endpoint not reachable on configured URL",
        };
      }

      return {
        success: false,
        skipped: false,
        status: response.status,
        message: payload?.message || "front-cache-clear-failed",
        payload,
      };
    }

    return {
      success: true,
      skipped: false,
      status: response.status,
      message: payload?.message || "front-cache-cleared",
      payload,
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      status: 0,
      message: error?.name === "AbortError" ? "front-cache-clear-timeout" : "front-cache-clear-request-failed",
      error: String(error?.message || error),
    };
  } finally {
    clearTimeout(timer);
    if (reason) {
      logger.info(`Front cache clear requested. reason=${reason}`);
    }
  }
}

export async function clearFrontApiCacheBestEffort(options = {}) {
  const result = await clearFrontApiCache(options);
  if (result.success || result.skipped) return result;

  logger.warn(
    `Front cache clear failed. status=${result.status || 0}, message=${result.message || "unknown"}`,
  );
  return result;
}
