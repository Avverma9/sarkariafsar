import { cache } from "react";
import { buildCanonicalKey, formatPostDetail } from "./postFormatter";
import {
  buildFormattedJobHtml,
  formatRichJobDetail,
} from "./jobDetailFormatter";
import { getJobBySlug, getJobByUrl } from "./siteApi";

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

function buildPostFromJobDetail(jobDetail) {
  if (!jobDetail) {
    return null;
  }

  return formatRichJobDetail(jobDetail) || formatPostDetail(jobDetail);
}

function buildFormattedHtml(jobDetail) {
  if (!jobDetail) {
    return "";
  }

  if (typeof jobDetail?.formattedHtml === "string" && jobDetail.formattedHtml.trim()) {
    return jobDetail.formattedHtml;
  }

  return buildFormattedJobHtml(jobDetail);
}

async function fetchJobDetailBySlug(slug) {
  const cleanSlug = normalizeSlug(slug);

  if (!cleanSlug) {
    throw new Error("Slug is required");
  }

  return getJobBySlug(cleanSlug);
}

async function fetchJobDetailByUrl(jobUrl) {
  const cleanJobUrl = normalizeJobUrl(jobUrl);

  if (!cleanJobUrl) {
    throw new Error("Job URL is invalid");
  }

  return getJobByUrl(cleanJobUrl);
}

async function loadPostDetailPageDataInternal({
  params,
  searchParams,
  includeFormattedHtml = true,
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const slug = normalizeSlug(getFirstValue(resolvedParams?.slug));
  const rawJobUrl = getFirstValue(resolvedSearchParams?.jobUrl);
  const hasJobUrlParam = Boolean(rawJobUrl);
  const normalizedJobUrl = normalizeJobUrl(rawJobUrl);

  let detailPayload = null;
  let fetchError = "";

  if (slug) {
    try {
      detailPayload = await fetchJobDetailBySlug(slug);
    } catch (error) {
      fetchError = error?.message || "Unable to fetch post detail";
    }
  }

  if (!detailPayload && normalizedJobUrl) {
    try {
      detailPayload = await fetchJobDetailByUrl(normalizedJobUrl);
      fetchError = "";
    } catch (error) {
      fetchError = error?.message || "Unable to fetch post detail";
    }
  }

  const jobDetail = detailPayload?.job || null;
  const post = buildPostFromJobDetail(jobDetail);
  const title = post?.header?.title || jobDetail?.title || jobDetail?.jobtitle || "";
  const canonicalKey =
    normalizeSlug(jobDetail?.slug) ||
    slug ||
    buildCanonicalKey({ title, jobUrl: normalizedJobUrl }) ||
    "post-detail";
  const formattedHtml = includeFormattedHtml ? buildFormattedHtml(jobDetail) : "";
  const jobUrl = normalizedJobUrl || String(jobDetail?.slug || slug || "").trim();

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

export async function loadPostDetailPageData(options) {
  return loadPostDetailPageDataInternal(options);
}

export const loadCachedPostDetailPageData = cache(
  async (slug, rawJobUrl = "", includeFormattedHtml = true) =>
    loadPostDetailPageDataInternal({
      params: { slug },
      searchParams: rawJobUrl ? { jobUrl: rawJobUrl } : {},
      includeFormattedHtml,
    }),
);
