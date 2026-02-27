import scrapperService from "./scrapper.services.mjs";
import govJobListModel from "../models/govjoblist.model.mjs";
import govJobDetailModel from "../models/govjobdetail.model.mjs";
import { formatJobHtmlAdvanced } from "../utils/htmlFormatter.mjs";
import { formatJobJsonAdvanced } from "../utils/jsonFormatter.mjs";

const DEFAULT_SIMILARITY_THRESHOLD = 0.8;

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;

  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return fallback;
};

const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const toObject = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const clampSimilarity = (value, fallback = DEFAULT_SIMILARITY_THRESHOLD) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

const toPostCandidatesFromJobList = ({
  jobList = null,
  jobsPerSection = 0,
} = {}) => {
  const posts = Array.isArray(jobList?.postList) ? jobList.postList : [];
  const safeJobsPerSection = toInteger(jobsPerSection, 0);
  const selectedPosts =
    safeJobsPerSection > 0 ? posts.slice(0, safeJobsPerSection) : posts;

  return selectedPosts
    .map((post) => ({
      section: String(jobList?.section || "").trim(),
      sectionName: String(jobList?.sectionName || "").trim(),
      title: String(post?.title || "").trim(),
      jobUrl: String(post?.jobUrl || "").trim(),
      sourceSectionUrl: String(post?.sourceSectionUrl || "").trim(),
    }))
    .filter((item) => item.jobUrl);
};

export const scrapeAndStoreJobDetail = async ({
  jobUrl = "",
  section = "",
  sourceSectionUrl = "",
  title = "",
  requestConfig = {},
  includeElementHtml = true,
  maxCombinationItems = 12,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
} = {}) => {
  const detail = await scrapperService.getJobContentWithAllSelectors({
    jobUrl,
    requestConfig: toObject(requestConfig),
    includeElementHtml: toBoolean(includeElementHtml, true),
    maxCombinationItems: toInteger(maxCombinationItems, 12),
  });

  const formattedHtml = detail?.html ? formatJobHtmlAdvanced(detail.html) : "";
  const jsonData = detail?.html ? formatJobJsonAdvanced(detail.html) : null;

  const saved = await govJobDetailModel.upsertFromScrape({
    jobUrl: detail?.jobUrl || jobUrl,
    formattedHtml,
    jsonData,
    section,
    sourceSectionUrl,
    pageTitle: detail?.pageTitle || "",
    canonicalUrl: detail?.canonicalUrl || "",
    metaDescription: detail?.metaDescription || "",
    similarityThreshold: clampSimilarity(
      similarityThreshold,
      DEFAULT_SIMILARITY_THRESHOLD
    ),
    extra: {
      title,
      scrapedAt: detail?.fetchedAt || new Date().toISOString(),
    },
  });

  return {
    detail,
    formattedHtml,
    jsonData,
    saved,
  };
};

export const syncStoredJobDetails = async ({
  section = "",
  sectionLimit = 0,
  jobsPerSection = 0,
  maxJobsPerRun = 0,
  requestConfig = {},
  includeElementHtml = false,
  maxCombinationItems = 8,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
} = {}) => {
  const requestedSection = String(section || "").trim();
  const safeSectionLimit = toInteger(sectionLimit, 0);
  const safeJobsPerSection = toInteger(jobsPerSection, 0);
  const safeMaxJobsPerRun = toInteger(maxJobsPerRun, 0);
  const safeSimilarityThreshold = clampSimilarity(
    similarityThreshold,
    DEFAULT_SIMILARITY_THRESHOLD
  );

  const jobLists = [];
  if (requestedSection) {
    const single = await govJobListModel.getBySection(requestedSection);
    if (single) jobLists.push(single);
  } else {
    jobLists.push(...(await govJobListModel.list()));
  }

  const selectedJobLists =
    safeSectionLimit > 0 ? jobLists.slice(0, safeSectionLimit) : jobLists;

  const candidates = [];
  const seenJobUrlHashes = new Set();

  for (const jobList of selectedJobLists) {
    const posts = toPostCandidatesFromJobList({
      jobList,
      jobsPerSection: safeJobsPerSection,
    });

    for (const post of posts) {
      let hash = "";
      try {
        hash = govJobDetailModel.createJobUrlHash(post.jobUrl);
      } catch {
        continue;
      }
      if (!hash || seenJobUrlHashes.has(hash)) continue;
      seenJobUrlHashes.add(hash);
      candidates.push(post);
    }
  }

  const selectedCandidates =
    safeMaxJobsPerRun > 0 ? candidates.slice(0, safeMaxJobsPerRun) : candidates;

  let createdCount = 0;
  let updatedCount = 0;
  let patchedCount = 0;
  let changedCount = 0;
  let failedCount = 0;

  for (const item of selectedCandidates) {
    try {
      const result = await scrapeAndStoreJobDetail({
        jobUrl: item.jobUrl,
        section: item.section,
        sourceSectionUrl: item.sourceSectionUrl,
        title: item.title,
        requestConfig: toObject(requestConfig),
        includeElementHtml: toBoolean(includeElementHtml, false),
        maxCombinationItems: toInteger(maxCombinationItems, 8),
        similarityThreshold: safeSimilarityThreshold,
      });

      if (result?.saved?.created) createdCount += 1;
      if (result?.saved?.updated) updatedCount += 1;
      if (result?.saved?.patched) patchedCount += 1;
      if (result?.saved?.changed) changedCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(
        `[job-detail-sync] Failed for ${item.jobUrl}: ${error?.message || error}`
      );
    }
  }

  return {
    requestedSection: requestedSection || null,
    scannedSections: selectedJobLists.length,
    scannedJobs: selectedCandidates.length,
    createdCount,
    updatedCount,
    patchedCount,
    changedCount,
    failedCount,
  };
};

export default {
  scrapeAndStoreJobDetail,
  syncStoredJobDetails,
};
