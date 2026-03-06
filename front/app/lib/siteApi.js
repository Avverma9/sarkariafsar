import baseUrl from "./baseUrl";
import {
  APP_FETCH_REVALIDATE_SECONDS,
  CACHE_TAGS,
  buildBrowserCachedFetchOptions,
  buildCachedFetchOptions,
  buildScopedCacheTag,
} from "./fetchCache";

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
    tags = [],
    revalidate = APP_FETCH_REVALIDATE_SECONDS,
    ...restOptions
  } = options;
  const fetchOptions =
    typeof window === "undefined"
      ? buildCachedFetchOptions(
          {
            tags,
            revalidate,
          },
          restOptions
        )
      : buildBrowserCachedFetchOptions({}, restOptions);

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
    tags: [
      CACHE_TAGS.jobLists,
      buildScopedCacheTag(CACHE_TAGS.jobLists, section),
    ],
  });
}

export async function getJobSections() {
  return requestJson("/job-sections", {
    tags: [CACHE_TAGS.jobSections],
  });
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
    {
      tags: [CACHE_TAGS.sectionJobs],
      revalidate: 180,
    },
  );
}

export async function getJobByUrl(jobUrl = "") {
  return requestJson(`/fetch/job-by-url${buildQueryString({ jobUrl })}`, {
    tags: [
      CACHE_TAGS.jobDetails,
      buildScopedCacheTag(CACHE_TAGS.jobDetails, jobUrl),
    ],
  });
}

export async function searchJobsAndSchemes(keyword = "") {
  return requestJson(`/find-by-title-job-and-scheme${buildQueryString({ keyword })}`, {
    tags: [CACHE_TAGS.jobSearch, CACHE_TAGS.jobDetails, CACHE_TAGS.govSchemes],
    revalidate: 180,
  });
}
