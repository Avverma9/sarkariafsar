import scrapperService from "./scrapper.services.mjs";
import jobSectionsModel from "../models/jobsections.model.mjs";
import siteModel from "../models/site.model.mjs";
import govJobListModel from "../models/govjoblist.model.mjs";

const DEFAULT_OLD_ONLINE_FORM_YEARS = [2024, 2025];

let defaultsSeeded = false;

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
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const toIntegerArray = (value, fallback = []) => {
  if (Array.isArray(value)) {
    const output = value
      .map((item) => Number.parseInt(String(item), 10))
      .filter((item) => !Number.isNaN(item));

    return output.length > 0 ? output : fallback;
  }

  if (typeof value === "string") {
    const output = value
      .split(",")
      .map((item) => Number.parseInt(String(item).trim(), 10))
      .filter((item) => !Number.isNaN(item));

    return output.length > 0 ? output : fallback;
  }

  return fallback;
};

const toObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
};

const toUniqueUrls = (urls = []) => {
  const output = [];
  const seen = new Set();

  for (const value of urls || []) {
    const clean = String(value || "").trim();
    if (!clean) continue;

    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }

  return output;
};

const ensureDefaults = async () => {
  if (defaultsSeeded) return;
  await jobSectionsModel.seedDefaults();
  await siteModel.seedDefaults();
  defaultsSeeded = true;
};

const getActiveHosts = async () => {
  const activeSites = await siteModel.getActiveSites();
  return new Set(
    (activeSites || [])
      .map((site) => site.normalizedHost || siteModel.getNormalizedHostFromUrl(site.siteUrl))
      .filter(Boolean)
  );
};

const resolveSectionTargets = async ({ section = "" } = {}) => {
  await ensureDefaults();

  const activeHosts = await getActiveHosts();
  const requestedSection = String(section || "").trim();
  const sectionDocs = [];

  if (requestedSection) {
    const found = await jobSectionsModel.findBySection(requestedSection);
    if (!found) {
      throw new Error(`Section not found: ${requestedSection}`);
    }

    sectionDocs.push(found);
  } else {
    sectionDocs.push(...(await jobSectionsModel.list()));
  }

  return sectionDocs.map((item) => ({
    key: item.key,
    name: item.name,
    urls: toUniqueUrls(item.urls || []).filter((url) =>
      activeHosts.has(siteModel.getNormalizedHostFromUrl(url))
    ),
  }));
};

export const syncStoredJobLists = async ({
  section = "",
  limit = 0,
  strictJobOnly = true,
  skipOldOnlineForms = true,
  skipOnlineFormYears = DEFAULT_OLD_ONLINE_FORM_YEARS,
  requestConfig = {},
  maxCombinationItems = 12,
} = {}) => {
  const resolvedTargets = await resolveSectionTargets({ section });
  const results = [];
  let syncedSections = 0;
  let skippedSections = 0;
  let totalJobsFetched = 0;
  let totalPostsStored = 0;

  for (const target of resolvedTargets) {
    if (!target.urls || target.urls.length === 0) {
      skippedSections += 1;
      results.push({
        section: target.key,
        sectionName: target.name,
        urls: [],
        jobsFetched: 0,
        totalPosts: 0,
        created: false,
        skipped: true,
        reason: "no_active_section_urls",
      });
      continue;
    }

    const data = await scrapperService.getSectionJobList({
      section: target.key,
      sectionUrls: target.urls,
      strictJobOnly: toBoolean(strictJobOnly, true),
      skipOldOnlineForms: toBoolean(skipOldOnlineForms, true),
      skipOnlineFormYears: toIntegerArray(
        skipOnlineFormYears,
        DEFAULT_OLD_ONLINE_FORM_YEARS
      ),
      limit: toInteger(limit, 0),
      requestConfig: toObject(requestConfig),
      maxCombinationItems: toInteger(maxCombinationItems, 12),
    });

    const postList = (data?.jobs || [])
      .map((item) => ({
        title: item?.title || "",
        jobUrl: item?.jobUrl || "",
        sourceSectionUrl: item?.sourceSectionUrl || target.urls[0] || "",
        fetchedAt: data?.fetchedAt || new Date().toISOString(),
      }))
      .filter((item) => item.jobUrl);

    const stored = await govJobListModel.upsertSection({
      section: target.key,
      sectionName: target.name,
      sectionUrls: target.urls,
      postList,
      extra: {
        sectionInput: target.name,
      },
    });

    const totalPosts = Number(stored?.sectionData?.totalPosts || 0);
    syncedSections += 1;
    totalJobsFetched += postList.length;
    totalPostsStored += totalPosts;

    results.push({
      section: stored?.sectionData?.section || target.key,
      sectionName: stored?.sectionData?.sectionName || target.name,
      urls: [...target.urls],
      jobsFetched: postList.length,
      totalPosts,
      created: Boolean(stored?.created),
      skipped: false,
    });
  }

  return {
    totalSections: resolvedTargets.length,
    syncedSections,
    skippedSections,
    totalJobsFetched,
    totalPostsStored,
    results,
  };
};

export default {
  syncStoredJobLists,
};
