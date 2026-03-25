import { cache } from "react";
import { formatPostDetail } from "./postFormatter";
import { formatRichJobDetail } from "./jobDetailFormatter";
import { assessPostContentQuality } from "./contentQuality";
import { getJobBySlug } from "./siteApi";

export function getFirstValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
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

async function fetchJobDetailBySlug(slug) {
  const cleanSlug = normalizeSlug(slug);

  if (!cleanSlug) {
    throw new Error("Slug is required");
  }

  return getJobBySlug(cleanSlug);
}

async function loadPostDetailPageDataInternal({
  params,
  includeFormattedHtml = true,
}) {
  const resolvedParams = await params;
  const slug = normalizeSlug(getFirstValue(resolvedParams?.slug));

  let detailPayload = null;
  let fetchError = "";

  if (slug) {
    try {
      detailPayload = await fetchJobDetailBySlug(slug);
    } catch (error) {
      fetchError = error?.message || "Unable to fetch post detail";
    }
  }

  const jobDetail = detailPayload?.data || detailPayload?.job || null;
  const post = buildPostFromJobDetail(jobDetail);
  const quality = assessPostContentQuality({ jobDetail, post });
  const title = post?.header?.title || jobDetail?.title || jobDetail?.jobtitle || "";
  const canonicalKey = normalizeSlug(jobDetail?.slug) || slug || "post-detail";
  const formattedHtml = includeFormattedHtml
    ? String(
        jobDetail?.scrapedContent?.contentHtml ||
          jobDetail?.formattedHtml ||
          "",
      ).trim()
    : "";

  return {
    slug,
    fetchError,
    detailPayload,
    jobDetail,
    post,
    quality,
    canonicalKey,
    formattedHtml,
  };
}

export async function loadPostDetailPageData(options) {
  return loadPostDetailPageDataInternal(options);
}

export const loadCachedPostDetailPageData = cache(
  async (slug, includeFormattedHtml = true) =>
    loadPostDetailPageDataInternal({
      params: { slug },
      includeFormattedHtml,
    }),
);
