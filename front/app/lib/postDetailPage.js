import baseUrl from "./baseUrl";
import { buildCanonicalKey, formatPostDetail } from "./postFormatter";

export function getFirstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractAbsoluteUrl(value) {
  const match = String(value || "").match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : "";
}

function normalizeJobUrl(rawValue) {
  if (!rawValue) {
    return "";
  }

  const firstPass = safeDecodeURIComponent(String(rawValue).trim());
  const secondPass = safeDecodeURIComponent(firstPass);
  const extracted = extractAbsoluteUrl(secondPass) || extractAbsoluteUrl(firstPass);
  const candidate = extracted || secondPass;

  try {
    const parsed = new URL(candidate);
    return `${parsed.origin}${parsed.pathname}${parsed.search}`;
  } catch {
    return "";
  }
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function stripHashSuffix(value) {
  return String(value || "").replace(/-[a-z0-9]{4,8}$/i, "");
}

function isSlugMatch(slug, job) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return false;
  }

  const canonical = normalizeSlug(
    buildCanonicalKey({ title: job?.title, jobUrl: job?.jobUrl }),
  );

  if (!canonical) {
    return false;
  }

  if (normalizedSlug === canonical) {
    return true;
  }

  if (normalizedSlug === stripHashSuffix(canonical)) {
    return true;
  }

  const titleSlug = slugify(job?.title);
  return Boolean(titleSlug && normalizedSlug === titleSlug);
}

function buildJobUrlCandidates(value) {
  const normalized = normalizeJobUrl(value);

  if (!normalized) {
    return [];
  }

  const candidates = new Set([normalized]);

  try {
    const parsed = new URL(normalized);
    const withoutSearch = `${parsed.origin}${parsed.pathname}`;
    candidates.add(withoutSearch);

    if (withoutSearch.endsWith("/")) {
      candidates.add(withoutSearch.slice(0, -1));
    } else {
      candidates.add(`${withoutSearch}/`);
    }
  } catch {
    // No-op, normalized URL was already added.
  }

  return Array.from(candidates).filter(Boolean);
}

export function getJobUrlFromSearchParams(searchParams) {
  const rawJobUrl = getFirstValue(searchParams?.jobUrl);
  return normalizeJobUrl(rawJobUrl);
}

async function fetchStoredJobLists() {
  const response = await fetch(`${baseUrl}/fetch-stored-joblist`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stored job lists (${response.status})`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.jobLists) ? payload.jobLists : [];
}

async function resolveJobUrlBySlug(slug) {
  if (!slug) {
    return "";
  }

  const jobLists = await fetchStoredJobLists();

  for (const jobList of jobLists) {
    const postList = Array.isArray(jobList?.postList) ? jobList.postList : [];

    for (const job of postList) {
      const normalizedUrl = normalizeJobUrl(job?.jobUrl);

      if (!normalizedUrl) {
        continue;
      }

      if (isSlugMatch(slug, { title: job?.title, jobUrl: normalizedUrl })) {
        return normalizedUrl;
      }
    }
  }

  return "";
}

export async function fetchJobDetailByUrl(jobUrl) {
  const candidates = buildJobUrlCandidates(jobUrl);
  let lastError = null;

  for (const candidate of candidates) {
    const query = new URLSearchParams({ jobUrl: candidate });
    const response = await fetch(`${baseUrl}/fetch/job-by-url?${query.toString()}`, {
      method: "GET",
      cache: "no-store",
    });

    if (response.ok) {
      return response.json();
    }

    lastError = new Error(`Failed to fetch post details (${response.status})`);

    if (response.status !== 404) {
      throw lastError;
    }
  }

  throw lastError || new Error("Failed to fetch post details");
}

export async function loadPostDetailPageData({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = normalizeSlug(getFirstValue(resolvedParams?.slug));
  const rawJobUrl = getFirstValue(resolvedSearchParams?.jobUrl);
  const hasJobUrlParam = Boolean(rawJobUrl);
  let jobUrl = normalizeJobUrl(rawJobUrl);

  let detailPayload = null;
  let fetchError = "";

  if (!jobUrl && slug) {
    try {
      jobUrl = await resolveJobUrlBySlug(slug);
    } catch (error) {
      fetchError = error?.message || "Unable to resolve job URL from slug";
    }
  }

  if (jobUrl) {
    try {
      detailPayload = await fetchJobDetailByUrl(jobUrl);
    } catch (error) {
      fetchError = error?.message || "Unable to fetch post detail";
    }
  }

  const jobDetail = detailPayload?.job || null;
  const post = jobDetail?.jsonData ? formatPostDetail(jobDetail) : null;
  const title = post?.header?.title || jobDetail?.title || "";
  const canonicalKey = buildCanonicalKey({ title, jobUrl }) || slug || "post-detail";
  const formattedHtml =
    typeof jobDetail?.formattedHtml === "string" ? jobDetail.formattedHtml : "";

  return {
    slug,
    jobUrl,
    fetchError,
    detailPayload,
    jobDetail,
    post,
    canonicalKey,
    formattedHtml,
    hasJobUrlParam,
  };
}
