# Frontend: Gov Schemes API client fix

The following file contains the corrected frontend API client for gov schemes. Replace your existing client with this code or copy into your frontend project.

```javascript
import baseUrl from "./baseUrl";
import { buildJsonFetchOptions } from "./fetchConfig";

const SCHEMES_REVALIDATE_SECONDS = 3600;
const SCHEME_STATES_REVALIDATE_SECONDS = 86400;

function normalizeAbsoluteUrl(value) {
  const candidate = String(value || "").trim();
  if (!candidate) return "";
  if (/^https?:\/\//i.test(candidate)) return candidate.replace(/\/+$/g, "");
  return "";
}

function resolveGovSchemesBaseUrl() {
  const fromEnv = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_GOV_SCHEMES_API_BASE_URL);
  if (fromEnv) return fromEnv;

  const siteBase = normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_API_BASE_URL) || normalizeAbsoluteUrl(baseUrl);
  if (siteBase) {
    try {
      const parsed = new URL(siteBase);
      // backend routes are mounted under /api and the schemes router is mounted at /schemes
      return `${parsed.origin}/api/schemes`;
    } catch {
      // fall through
    }
  }

  const fallbackBase = normalizeAbsoluteUrl(baseUrl);
  if (fallbackBase) {
    try {
      const parsed = new URL(fallbackBase);
      return `${parsed.origin}/api/schemes`;
    } catch {
      // fall through
    }
  }

  // relative fallback (works when running from same origin)
  return "/api/schemes";
}

const GOV_SCHEMES_API_BASE_URL = resolveGovSchemesBaseUrl();

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function requestJson(path, params, options = {}) {
  const fetchOptions = buildJsonFetchOptions({
    method: "GET",
    ...options,
  });

  const response = await fetch(
    `${GOV_SCHEMES_API_BASE_URL}${path}${buildQueryString(params)}`,
    fetchOptions,
  );

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload?.message || errorMessage;
    } catch {
      // keep fallback
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getGovSchemesList({
  title = "",
  state = "",
  city = "",
  page = 1,
  limit = 20,
} = {}) {
  // backend expects `search` for text search (not `title`)
  const params = {
    search: title || undefined,
    state: state || undefined,
    city: city || undefined,
    page,
    limit,
  };
  return requestJson("/", params, {
    revalidate: SCHEMES_REVALIDATE_SECONDS,
    tags: ["gov-schemes-list"],
  });
}

export async function getAllGovSchemes() {
  // call the same list endpoint without filters
  return requestJson("/", { limit: 1000 }, {
    revalidate: SCHEMES_REVALIDATE_SECONDS,
    tags: ["gov-schemes-list", "gov-schemes-all"],
  });
}

export async function getGovSchemeStateNameOnly() {
  // NOTE: backend doesn't expose this route in the current server;
  // keep as-is if you have a dedicated endpoint, otherwise remove or implement it.
  return requestJson("/getSchemeStateNameOnly", undefined, {
    revalidate: SCHEME_STATES_REVALIDATE_SECONDS,
    tags: ["gov-scheme-states"],
  });
}

export async function getGovSchemeByState(state) {
  return requestJson("/getSchemeByState", { state }, {
    revalidate: SCHEMES_REVALIDATE_SECONDS,
    tags: ["gov-schemes-list", "gov-schemes-by-state"],
  });
}

export async function getGovSchemeById(id) {
  if (!id) throw new Error("Missing id");
  return requestJson(`/id/${encodeURIComponent(String(id))}`, undefined, {
    revalidate: SCHEMES_REVALIDATE_SECONDS,
    tags: ["gov-schemes-detail"],
  });
}

export async function getGovSchemeBySlug(slug) {
  if (!slug) throw new Error("Missing slug");
  // Backend endpoint exposes scheme by slug at /slug/:slug
  return requestJson(`/slug/${encodeURIComponent(String(slug))}`, undefined, {
    revalidate: SCHEMES_REVALIDATE_SECONDS,
    tags: ["gov-schemes-detail"],
  });
}
```
