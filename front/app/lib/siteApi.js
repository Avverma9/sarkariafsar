import baseUrl from "./baseUrl";

function normalizeApiBaseUrl(value) {
  const candidate = String(value || "").trim();

  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/+$/g, "");
  }

  return "";
}

const SITE_API_BASE_URL =
  normalizeApiBaseUrl(process.env.NEXT_PUBLIC_SITE_API_BASE_URL) ||
  normalizeApiBaseUrl(process.env.SITE_API_BASE_URL) ||
  baseUrl;

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

async function requestJson(path, options = {}) {
  const response = await fetch(`${SITE_API_BASE_URL}${path}`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

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

export async function getStoredJobLists({ section } = {}) {
  return requestJson(`/fetch-stored-joblist${buildQueryString({ section })}`);
}

export async function getJobSections() {
  return requestJson("/job-sections");
}

export async function getSectionJobsByUrls({
  sectionUrls = [],
  limit = 100,
  page = 1,
} = {}) {
  const normalizedUrls = Array.isArray(sectionUrls)
    ? sectionUrls.filter(Boolean)
    : [];

  return requestJson(
    `/scrape/section-jobs${buildQueryString({
      sectionUrls: normalizedUrls.join(","),
      limit,
      page,
    })}`,
  );
}
