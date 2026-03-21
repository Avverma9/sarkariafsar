import baseUrl from "./baseUrl";
import { buildJsonFetchOptions } from "./fetchConfig";

const SECTIONS_REVALIDATE_SECONDS = 300;
const JOB_DETAIL_REVALIDATE_SECONDS = 300;
const REMINDERS_REVALIDATE_SECONDS = 300;

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
  const fetchOptions = buildJsonFetchOptions({
    method: "GET",
    ...options,
  });

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
  return requestJson(`/fetch-stored-joblist${buildQueryString({ section })}`, {
    revalidate: SECTIONS_REVALIDATE_SECONDS,
    tags: ["jobs-sections", "jobs-stored-lists"],
  });
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
    {
      revalidate: SECTIONS_REVALIDATE_SECONDS,
      tags: ["jobs-sections"],
    },
  );
}

export async function getJobByUrl(jobUrl = "") {
  return requestJson(`/fetch/job-by-url${buildQueryString({ jobUrl })}`, {
    revalidate: JOB_DETAIL_REVALIDATE_SECONDS,
    tags: ["job-detail"],
  });
}

export async function getJobBySlug(slug = "") {
  const cleanSlug = String(slug || "").trim();

  return requestJson(`/jobs/get-post-details/${encodeURIComponent(cleanSlug)}`, {
    revalidate: JOB_DETAIL_REVALIDATE_SECONDS,
    tags: ["job-detail"],
  });
}

export async function getJobReminders({ days = 7, signal } = {}) {
  return requestJson(`/jobs/reminder${buildQueryString({ days })}`, {
    revalidate: REMINDERS_REVALIDATE_SECONDS,
    tags: ["job-reminders"],
    signal,
  });
}

export async function searchGlobalContent({ q = "", limit = 50, signal } = {}) {
  return requestJson(`/jobs/search${buildQueryString({ q, limit })}`, {
    signal,
  });
}
