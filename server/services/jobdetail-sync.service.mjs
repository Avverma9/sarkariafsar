import scrapperService from "./scrapper.services.mjs";
import govJobListModel from "../models/govjoblist.model.mjs";
import govJobDetailModel from "../models/govjobdetail.model.mjs";
import { formatJobHtmlAdvanced } from "../utils/htmlFormatter.mjs";
import { formatJobJsonAdvanced } from "../utils/jsonFormatter.mjs";
import { createJobUpdateDiff } from "../utils/jobUpdateDiff.mjs";
import { sendJobUpdateNotification } from "../utils/jobUpdateMailer.mjs";
import { invalidateAppCache } from "../utils/appCache.mjs";
import { extractApplyLastDateMeta } from "../utils/jobApplyDate.mjs";

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

const toDateTimestamp = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return date.getTime();
};

const clampSimilarity = (value, fallback = DEFAULT_SIMILARITY_THRESHOLD) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed < 0) return 0;
  if (parsed > 1) return 1;
  return parsed;
};

const compareCandidates = (left, right) => {
  if (left.priority !== right.priority) {
    return left.priority - right.priority;
  }

  if (left.lastScrapedAtMs !== right.lastScrapedAtMs) {
    return left.lastScrapedAtMs - right.lastScrapedAtMs;
  }

  if (left.postFetchedAtMs !== right.postFetchedAtMs) {
    return right.postFetchedAtMs - left.postFetchedAtMs;
  }

  return String(left.jobUrl || "").localeCompare(String(right.jobUrl || ""));
};

const toPostCandidatesFromJobList = ({
  jobList = null,
  jobsPerSection = 0,
} = {}) => {
  const posts = Array.isArray(jobList?.postList)
    ? [...jobList.postList].sort(
        (left, right) =>
          toDateTimestamp(right?.fetchedAt) - toDateTimestamp(left?.fetchedAt)
      )
    : [];
  const safeJobsPerSection = toInteger(jobsPerSection, 0);
  const selectedPosts =
    safeJobsPerSection > 0 ? posts.slice(0, safeJobsPerSection) : posts;

  return selectedPosts
    .map((post) => ({
      section: String(jobList?.section || "").trim(),
      sectionName: String(jobList?.sectionName || "").trim(),
      title: String(post?.title || "").trim(),
      jobUrl: String(post?.jobUrl || "").trim(),
      jobUrlHash: String(post?.jobUrlHash || "").trim(),
      sourceSectionUrl: String(post?.sourceSectionUrl || "").trim(),
      fetchedAt: post?.fetchedAt || null,
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

  let changeSummary = null;
  let notification = { sent: false, reason: "not_applicable" };

  if (saved?.updated && saved?.changed && saved?.previousDetail && saved?.detail) {
    changeSummary = createJobUpdateDiff({
      previousDetail: saved.previousDetail,
      currentDetail: saved.detail,
    });

    if (changeSummary.changeCount > 0) {
      try {
        notification = await sendJobUpdateNotification({
          jobTitle: saved.detail.title || title,
          jobUrl: saved.detail.jobUrl || jobUrl,
          matchedBy: saved?.detail?.dedupeMeta?.matchedBy || "",
          changedFields: changeSummary.changedFields,
          changes: changeSummary.changes,
          omittedChangeCount: changeSummary.omittedChangeCount,
        });
      } catch (error) {
        notification = {
          sent: false,
          reason: "mailer_failed",
          error: error?.message || String(error),
        };
        console.error(
          `[job-update-mailer] Failed for ${saved.detail.jobUrl}: ${
            error?.message || error
          }`
        );
      }
    } else {
      notification = { sent: false, reason: "no_structured_diff" };
    }
  }

  return {
    detail,
    formattedHtml,
    jsonData,
    saved: {
      ...saved,
      changeSummary,
      notification,
    },
  };
};

export const syncStoredJobDetails = async ({
  section = "",
  sectionLimit = 0,
  jobsPerSection = 0,
  maxJobsPerRun = 0,
  minRecheckMinutes = 30,
  requestConfig = {},
  includeElementHtml = false,
  maxCombinationItems = 8,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD,
} = {}) => {
  const requestedSection = String(section || "").trim();
  const safeSectionLimit = toInteger(sectionLimit, 0);
  const safeJobsPerSection = toInteger(jobsPerSection, 0);
  const safeMaxJobsPerRun = toInteger(maxJobsPerRun, 0);
  const safeMinRecheckMinutes = toInteger(minRecheckMinutes, 30);
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

  const sectionKeys = new Set(
    selectedJobLists
      .map((jobList) => String(jobList?.section || "").trim())
      .filter(Boolean)
  );
  const listCandidateMap = new Map();

  for (const jobList of selectedJobLists) {
    const posts = toPostCandidatesFromJobList({
      jobList,
      jobsPerSection: safeJobsPerSection,
    });

    for (const post of posts) {
      let hash = String(post?.jobUrlHash || "").trim();
      try {
        hash = hash || govJobDetailModel.createJobUrlHash(post.jobUrl);
      } catch {
        continue;
      }

      if (!hash) continue;

      const postFetchedAtMs = toDateTimestamp(post?.fetchedAt);
      const existing = listCandidateMap.get(hash);
      if (!existing || postFetchedAtMs > existing.postFetchedAtMs) {
        listCandidateMap.set(hash, {
          ...post,
          jobUrlHash: hash,
          postFetchedAtMs,
        });
      }
    }
  }

  const listCandidateHashes = [...listCandidateMap.keys()];
  const existingDetailDocs =
    listCandidateHashes.length > 0
      ? await govJobDetailModel.model
          .find({ jobUrlHash: { $in: listCandidateHashes } })
          .select({
            title: 1,
            jobUrl: 1,
            jobUrlHash: 1,
            section: 1,
            sourceSectionUrl: 1,
            lastScrapedAt: 1,
          })
          .lean()
      : [];

  const existingDetailMap = new Map(
    existingDetailDocs.map((doc) => [String(doc?.jobUrlHash || "").trim(), doc])
  );

  const candidates = [];
  let missingDetailCount = 0;
  let listRefreshDueCount = 0;

  for (const candidate of listCandidateMap.values()) {
    const existing = existingDetailMap.get(candidate.jobUrlHash);
    const lastScrapedAtMs = toDateTimestamp(existing?.lastScrapedAt);

    if (!existing) {
      missingDetailCount += 1;
      candidates.push({
        ...candidate,
        priority: 0,
        reason: "missing_detail",
        lastScrapedAtMs: 0,
      });
      continue;
    }

    if (candidate.postFetchedAtMs > lastScrapedAtMs) {
      listRefreshDueCount += 1;
      candidates.push({
        ...candidate,
        title: candidate.title || String(existing?.title || "").trim(),
        section: candidate.section || String(existing?.section || "").trim(),
        sourceSectionUrl:
          candidate.sourceSectionUrl ||
          String(existing?.sourceSectionUrl || "").trim(),
        priority: 1,
        reason: "list_refreshed_since_detail",
        lastScrapedAtMs,
      });
    }
  }

  let periodicRecheckDueCount = 0;
  if (safeMinRecheckMinutes > 0) {
    const staleThresholdDate = new Date(
      Date.now() - safeMinRecheckMinutes * 60 * 1000
    );
    const staleQuery = {
      lastScrapedAt: { $lte: staleThresholdDate },
    };

    if (requestedSection) {
      staleQuery.section = requestedSection;
    } else if (sectionKeys.size > 0) {
      staleQuery.section = { $in: [...sectionKeys] };
    }

    const staleCandidateDocs = await govJobDetailModel.model
      .find(staleQuery)
      .select({
        title: 1,
        jobUrl: 1,
        jobUrlHash: 1,
        section: 1,
        sourceSectionUrl: 1,
        lastScrapedAt: 1,
      })
      .sort({ lastScrapedAt: 1, updatedAt: 1 })
      .limit(safeMaxJobsPerRun > 0 ? Math.max(safeMaxJobsPerRun * 4, 100) : 250)
      .lean();

    for (const doc of staleCandidateDocs) {
      const jobUrlHash = String(doc?.jobUrlHash || "").trim();
      if (!jobUrlHash || listCandidateMap.has(jobUrlHash)) continue;

      periodicRecheckDueCount += 1;
      candidates.push({
        title: String(doc?.title || "").trim(),
        jobUrl: String(doc?.jobUrl || "").trim(),
        jobUrlHash,
        section: String(doc?.section || "").trim(),
        sectionName: "",
        sourceSectionUrl: String(doc?.sourceSectionUrl || "").trim(),
        fetchedAt: null,
        postFetchedAtMs: 0,
        priority: 2,
        reason: "scheduled_recheck",
        lastScrapedAtMs: toDateTimestamp(doc?.lastScrapedAt),
      });
    }
  }

  candidates.sort(compareCandidates);
  const selectedCandidates =
    safeMaxJobsPerRun > 0 ? candidates.slice(0, safeMaxJobsPerRun) : candidates;

  let createdCount = 0;
  let updatedCount = 0;
  let patchedCount = 0;
  let changedCount = 0;
  let failedCount = 0;
  const applyLastDateUpdates = [];

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

      const applyLastDateMeta = extractApplyLastDateMeta({
        jsonData: result?.jsonData,
      });
      if (applyLastDateMeta.applyLastDate) {
        applyLastDateUpdates.push({
          jobUrl: result?.saved?.detail?.jobUrl || item.jobUrl,
          jobUrlHash: result?.saved?.detail?.jobUrlHash || item.jobUrlHash,
          applyLastDate: applyLastDateMeta.applyLastDate,
        });
      }
    } catch (error) {
      failedCount += 1;
      console.error(
        `[job-detail-sync] Failed for ${item.jobUrl}: ${error?.message || error}`
      );
    }
  }

  let applyLastDateUpdateSummary = {
    matchedSections: 0,
    updatedSections: 0,
    updatedPosts: 0,
  };

  if (applyLastDateUpdates.length > 0) {
    applyLastDateUpdateSummary = await govJobListModel.syncApplyLastDates({
      updates: applyLastDateUpdates,
    });
  }

  if (
    createdCount > 0 ||
    updatedCount > 0 ||
    patchedCount > 0 ||
    changedCount > 0 ||
    applyLastDateUpdateSummary.updatedPosts > 0
  ) {
    void invalidateAppCache("job-details");
    void invalidateAppCache("job-lists");
  }

  return {
    requestedSection: requestedSection || null,
    scannedSections: selectedJobLists.length,
    eligibleCandidates: candidates.length,
    scannedJobs: selectedCandidates.length,
    missingDetailCount,
    listRefreshDueCount,
    periodicRecheckDueCount,
    createdCount,
    updatedCount,
    patchedCount,
    changedCount,
    applyLastDateUpdatedPosts: applyLastDateUpdateSummary.updatedPosts,
    failedCount,
  };
};

export default {
  scrapeAndStoreJobDetail,
  syncStoredJobDetails,
};
