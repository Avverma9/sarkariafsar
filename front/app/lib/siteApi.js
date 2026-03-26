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

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function extractCollection(payload) {
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.sections)) {
    return payload.sections;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function extractPagination(payload) {
  return payload?.pagination && typeof payload.pagination === "object"
    ? payload.pagination
    : {};
}

export async function getStoredJobLists({ section } = {}) {
  const payload = await requestJson("/postsection/", {
    revalidate: SECTIONS_REVALIDATE_SECONDS,
    tags: ["jobs-sections", "jobs-stored-lists"],
  });

  const sections = extractCollection(payload);
  const normalizedSection = String(section || "").trim().toLowerCase();

  if (!normalizedSection) {
    return payload;
  }

  const filteredSections = sections.filter((item) => {
    const aliases = [
      item?.canonicalUrl,
      item?.name,
      item?.sourceSectionName,
      ...(Array.isArray(item?.aliases) ? item.aliases : []),
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    return aliases.some((value) => value.includes(normalizedSection));
  });

  return {
    ...payload,
    sections: filteredSections,
    data: filteredSections,
    total: filteredSections.length,
  };
}

export async function getSectionsWithJobs({
  section = "",
  sectionLimit = 20,
  jobPage = 1,
  jobLimit = 10,
  jobSearch = "",
} = {}) {
  const sectionsPayload = await requestJson("/postsection/", {
    revalidate: SECTIONS_REVALIDATE_SECONDS,
    tags: ["jobs-sections"],
  });
  const allSections = extractCollection(sectionsPayload);
  const normalizedSectionQuery = String(section || "").trim().toLowerCase();
  const normalizedJobSearch = String(jobSearch || "").trim().toLowerCase();

  const matchedSections = allSections.filter((item) => {
    if (!normalizedSectionQuery) {
      return true;
    }

    const aliases = [
      item?.canonicalUrl,
      item?.name,
      item?.sourceSectionName,
      ...(Array.isArray(item?.aliases) ? item.aliases : []),
    ]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean);

    return aliases.some((value) => value.includes(normalizedSectionQuery));
  });

  const limitedSections = matchedSections.slice(0, Math.max(1, Number(sectionLimit) || 20));
  const sectionsWithJobs = await Promise.all(
    limitedSections.map(async (item) => {
      const canonicalUrl = String(item?.canonicalUrl || "").trim();

      if (!canonicalUrl) {
        return {
          ...item,
          jobs: [],
          jobsPage: 1,
          jobsLimit: Number(jobLimit) || 10,
          jobsTotal: 0,
          jobsTotalPages: 1,
        };
      }

      try {
        const jobsPayload = await requestJson(
          `/post/section-list/${encodeURIComponent(canonicalUrl)}${buildQueryString({
            page: jobPage,
            limit: jobLimit,
          })}`,
          {
            revalidate: SECTIONS_REVALIDATE_SECONDS,
            tags: ["jobs-sections", `jobs-section-${canonicalUrl}`],
          },
        );
        const jobs = extractCollection(jobsPayload).filter((job) => {
          if (!normalizedJobSearch) {
            return true;
          }

          return String(job?.title || "")
            .trim()
            .toLowerCase()
            .includes(normalizedJobSearch);
        });
        const pagination = extractPagination(jobsPayload);

        return {
          ...item,
          sectionCanonicalUrl: canonicalUrl,
          sectionName: item?.name || item?.sectionName || "",
          jobs,
          jobsPage: Number(pagination?.page) || Number(jobPage) || 1,
          jobsLimit: Number(pagination?.limit) || Number(jobLimit) || jobs.length,
          jobsTotal: Number(pagination?.total) || jobs.length,
          jobsTotalPages: Number(pagination?.totalPages) || 1,
        };
      } catch {
        return {
          ...item,
          sectionCanonicalUrl: canonicalUrl,
          sectionName: item?.name || item?.sectionName || "",
          jobs: [],
          jobsPage: Number(jobPage) || 1,
          jobsLimit: Number(jobLimit) || 10,
          jobsTotal: 0,
          jobsTotalPages: 1,
        };
      }
    }),
  );

  return {
    success: true,
    message: sectionsPayload?.message || "Job sections fetched successfully",
    sections: sectionsWithJobs,
    data: sectionsWithJobs,
    pagination: extractPagination(sectionsPayload),
    total: asArray(sectionsWithJobs).length,
  };
}

export async function getJobByUrl(jobUrl = "") {
  const normalizedJobUrl = String(jobUrl || "").trim();

  if (!normalizedJobUrl) {
    return null;
  }

  const payload = await requestJson("/post/", {
    revalidate: JOB_DETAIL_REVALIDATE_SECONDS,
    tags: ["job-detail"],
  });
  const jobs = extractCollection(payload);

  return (
    jobs.find((job) => {
      const candidates = [
        job?.jobUrl,
        job?.url,
        job?.applyLink,
        job?.officialWebsite,
      ]
        .map((value) => String(value || "").trim())
        .filter(Boolean);

      return candidates.includes(normalizedJobUrl);
    }) || null
  );
}

export async function getJobBySlug(slug = "") {
  const cleanSlug = String(slug || "").trim();

  return requestJson(`/post/slug/${encodeURIComponent(cleanSlug)}`, {
    revalidate: JOB_DETAIL_REVALIDATE_SECONDS,
    tags: ["job-detail"],
  });
}

export async function getJobReminders({ days = 7, signal } = {}) {
  const payload = await requestJson("/post/get-deadline-jobs", {
    revalidate: REMINDERS_REVALIDATE_SECONDS,
    tags: ["job-reminders"],
    signal,
  });

  const now = new Date();
  const maxDays = Math.max(1, Number(days) || 7);
  const jobs = extractCollection(payload).filter((job) => {
    const rawDate = job?.applyLastDate || job?.lastDate || job?.deadline;

    if (!rawDate) {
      return false;
    }

    const deadline = new Date(rawDate);

    if (Number.isNaN(deadline.getTime())) {
      return false;
    }

    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays >= 0 && diffDays <= maxDays;
  });

  return {
    ...payload,
    jobs,
    data: jobs,
    total: jobs.length,
  };
}

export async function searchGlobalContent({ q = "", limit = 50, signal } = {}) {
  const payload = await requestJson(
    `/search/search-with-title${buildQueryString({ title: q, limit })}`,
    {
      signal,
    },
  );
  const results = extractCollection(payload).map((item) => ({
    ...item,
    type: item?.type === "post" ? "job" : item?.type,
  }));

  return {
    ...payload,
    results,
    data: results,
  };
}
