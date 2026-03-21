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
  const {
    headers = {},
    ...restOptions
  } = options;
  const fetchOptions = {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...restOptions,
  };

  const response = await fetch(`${SITE_API_BASE_URL}${path}`, fetchOptions);

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload?.message || errorMessage;
    } catch {
      // Keep generic fallback when body is not JSON.
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getStoredJobLists({ section } = {}) {
  return requestJson(`/fetch-stored-joblist${buildQueryString({ section })}`);
}

export async function getSectionsWithJobs({
  status = "active",
  search = "",
  section = "",
  activeJobsOnly = "all",
  sectionLimit = 20,
  jobPage = 1,
  jobLimit = 10,
  jobSearch = "",
} = {}) {
  return requestJson(
    `/section/get-all-sections-with-jobs${buildQueryString({
      status,
      search,
      section,
      activeJobsOnly,
      sectionLimit,
      jobPage,
      jobLimit,
      jobSearch,
    })}`,
  );
}

export async function getJobByUrl(jobUrl = "") {
  return requestJson(`/fetch/job-by-url${buildQueryString({ jobUrl })}`);
}

export async function getJobBySlug(slug = "") {
  const cleanSlug = String(slug || "").trim();

  return requestJson(`/jobs/get-post-details/${encodeURIComponent(cleanSlug)}`);
}

export async function getJobReminders({ days = 7, signal } = {}) {
  return requestJson(`/jobs/reminder${buildQueryString({ days })}`, {
    signal,
  });
}

export async function searchGlobalContent({ q = "", limit = 50, signal } = {}) {
  return requestJson(`/jobs/search${buildQueryString({ q, limit })}`, {
    signal,
  });
}
