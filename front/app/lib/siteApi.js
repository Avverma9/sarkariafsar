import baseUrl from "./baseUrl";
import { buildNextCacheConfig, CACHE_TAGS, HIGH_CACHE_TTL_SECONDS } from "./cacheConfig";

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
  const { next, tags = [], revalidate = HIGH_CACHE_TTL_SECONDS, ...restOptions } = options;
  const nextCacheConfig = buildNextCacheConfig({
    next,
    revalidate,
    tags: [CACHE_TAGS.SITE_API, ...tags],
  });

  const response = await fetch(`${SITE_API_BASE_URL}${path}`, {
    method: "GET",
    cache: "force-cache",
    headers: {
      "Content-Type": "application/json",
    },
    ...restOptions,
    next: nextCacheConfig,
  });

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
    tags: [CACHE_TAGS.JOB_LISTS],
  });
}

export async function getJobSections() {
  return requestJson("/job-sections", {
    tags: [CACHE_TAGS.JOB_SECTIONS],
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
      tags: [CACHE_TAGS.SECTION_JOBS, CACHE_TAGS.JOB_SECTIONS],
    },
  );
}

export async function getJobByUrl(jobUrl = "") {
  return requestJson(`/fetch/job-by-url${buildQueryString({ jobUrl })}`, {
    tags: [CACHE_TAGS.POST_DETAILS, CACHE_TAGS.JOB_LISTS],
  });
}

export async function searchJobsAndSchemes(keyword = "") {
  return requestJson(`/find-by-title-job-and-scheme${buildQueryString({ keyword })}`, {
    tags: [CACHE_TAGS.JOB_LISTS, CACHE_TAGS.POST_DETAILS],
  });
}
