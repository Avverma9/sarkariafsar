import baseUrl from "./baseUrl";

function normalizeAbsoluteUrl(value) {
  const candidate = String(value || "").trim();

  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/+$/g, "");
  }

  return "";
}

function resolveGovSchemesBaseUrl() {
  const fromEnv = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_GOV_SCHEMES_API_BASE_URL);

  if (fromEnv) {
    return fromEnv;
  }

  const siteBase = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_API_BASE_URL) ||
    normalizeAbsoluteUrl(baseUrl);

  if (siteBase) {
    try {
      const parsed = new URL(siteBase);
      return `${parsed.origin}/api/gov-schemes`;
    } catch {
      // Fallback handled below.
    }
  }

  const fallbackBase = normalizeAbsoluteUrl(baseUrl);

  if (fallbackBase) {
    try {
      const parsed = new URL(fallbackBase);
      return `${parsed.origin}/api/gov-schemes`;
    } catch {
      // Keep final fallback below.
    }
  }

  return "/api/gov-schemes";
}

const GOV_SCHEMES_API_BASE_URL = resolveGovSchemesBaseUrl();

function buildQueryString(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    query.set(key, String(value));
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function requestJson(path, params) {
  const response = await fetch(
    `${GOV_SCHEMES_API_BASE_URL}${path}${buildQueryString(params)}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload?.message || errorMessage;
    } catch {
      // Keep generic fallback when body is not JSON.
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export async function getAllGovSchemes() {
  return requestJson("/getAllSchemes");
}

export async function getGovSchemeStateNameOnly() {
  return requestJson("/getSchemeStateNameOnly");
}

export async function getGovSchemeByState(state) {
  return requestJson("/getSchemeByState", { state });
}
