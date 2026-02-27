import scrapperService from "../services/scrapper.services.mjs";
import jobListSyncService from "../services/joblist-sync.service.mjs";
import jobDetailSyncService from "../services/jobdetail-sync.service.mjs";
import jobSectionsModel from "../models/jobsections.model.mjs";
import siteModel from "../models/site.model.mjs";
import govJobDetailModel from "../models/govjobdetail.model.mjs";
import govJobListModel from "../models/govjoblist.model.mjs";
import govSchemeModel from "../models/govscheme.model.mjs";
import { createHash } from "node:crypto";

const getValue = (req, key, fallback = undefined) => {
  if (req?.body && req.body[key] !== undefined) return req.body[key];
  if (req?.query && req.query[key] !== undefined) return req.query[key];
  return fallback;
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return fallback;
};

const toInteger = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const toIntegerArray = (value, fallback = []) => {
  const values = toArray(value);
  if (values.length === 0) return fallback;

  const output = [];
  for (const item of values) {
    const parsed = Number.parseInt(String(item), 10);
    if (Number.isNaN(parsed)) continue;
    output.push(parsed);
  }

  return output.length > 0 ? output : fallback;
};

const toObject = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
};

const escapeRegExp = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let defaultSectionsSeeded = false;
let defaultSitesSeeded = false;

const ensureDefaultSections = async () => {
  if (defaultSectionsSeeded) return;
  await jobSectionsModel.seedDefaults();
  defaultSectionsSeeded = true;
};

const ensureDefaultSites = async () => {
  if (defaultSitesSeeded) return;
  await siteModel.seedDefaults();
  defaultSitesSeeded = true;
};

const toNormalizedHost = (url = "") => siteModel.getNormalizedHostFromUrl(url);

const buildStoredSectionMeta = ({ requestedSection = "", sectionUrls = [] } = {}) => {
  const cleanSection = String(requestedSection || "").trim();
  if (cleanSection) {
    return {
      section: cleanSection,
      sectionName: cleanSection,
    };
  }

  const firstSectionUrl = String(sectionUrls?.[0] || "").trim();
  if (firstSectionUrl) {
    try {
      const parsed = new URL(firstSectionUrl);
      const slug = parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop();
      const sectionName = slug
        ? slug
            .split(/[-_]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : parsed.hostname;

      return {
        section: slug || parsed.hostname,
        sectionName: sectionName || parsed.hostname,
      };
    } catch {
      // ignore
    }
  }

  const joined = (sectionUrls || []).map((item) => String(item || "").trim()).filter(Boolean).sort().join("|");
  const groupHash = createHash("sha1").update(joined || "section-group").digest("hex").slice(0, 12);
  return {
    section: `section_group_${groupHash}`,
    sectionName: "Section Group",
  };
};

export const scrapeSiteSectionsController = async (req, res, next) => {
  try {
    const data = await scrapperService.getSiteSections({
      siteUrl: getValue(req, "siteUrl"),
      siteName: getValue(req, "siteName", ""),
      sectionLinkPattern: getValue(req, "sectionLinkPattern", null),
      skipSectionPatterns: toArray(getValue(req, "skipSectionPatterns", [])),
      internalOnly: toBoolean(getValue(req, "internalOnly"), true),
      navigationOnly: toBoolean(getValue(req, "navigationOnly"), true),
      excludeHomePath: toBoolean(getValue(req, "excludeHomePath"), true),
      excludeUtilityPages: toBoolean(getValue(req, "excludeUtilityPages"), true),
      utilitySectionPatterns: toArray(getValue(req, "utilitySectionPatterns", [])),
      limit: toInteger(getValue(req, "limit"), 0),
      requestConfig: toObject(getValue(req, "requestConfig", {})),
      maxCombinationItems: toInteger(getValue(req, "maxCombinationItems"), 12),
    });

    const sections = (data?.sections || []).map((item) => ({
      name: item?.section || "",
      url: item?.sectionUrl || "",
    }));

    return res.status(200).json({ sections });
  } catch (error) {
    return next(error);
  }
};

export const scrapeSectionJobsController = async (req, res, next) => {
  try {
    await ensureDefaultSections();
    await ensureDefaultSites();

    const requestedSection = getValue(req, "section", "");
    const activeSites = await siteModel.getActiveSites();
    const activeHosts = new Set(
      activeSites
        .map((site) => site.normalizedHost || toNormalizedHost(site.siteUrl))
        .filter(Boolean)
    );

    let resolvedSectionUrls = [
      ...toArray(getValue(req, "sectionUrls", [])),
      ...toArray(getValue(req, "sectionUrl", "")),
    ].filter((url) => activeHosts.has(toNormalizedHost(url)));

    if (resolvedSectionUrls.length === 0) {
      if (!requestedSection) {
        return res.status(200).json({ jobs: [] });
      }

      const sectionConfig = await jobSectionsModel.findBySection(requestedSection);
      if (!sectionConfig) {
        throw new Error(`Section not found: ${requestedSection}`);
      }

      resolvedSectionUrls = (sectionConfig.urls || []).filter((url) =>
        activeHosts.has(toNormalizedHost(url))
      );
    }

    if (resolvedSectionUrls.length === 0) {
      return res.status(200).json({ jobs: [] });
    }

    const data = await scrapperService.getSectionJobList({
      section: requestedSection,
      sectionUrls: resolvedSectionUrls,
      siteName: getValue(req, "siteName", ""),
      jobLinkPattern: getValue(req, "jobLinkPattern", null),
      skipLinkPatterns: toArray(getValue(req, "skipLinkPatterns", [])),
      strictJobOnly: toBoolean(getValue(req, "strictJobOnly"), true),
      skipOldOnlineForms: toBoolean(getValue(req, "skipOldOnlineForms"), true),
      skipOnlineFormYears: toIntegerArray(getValue(req, "skipOnlineFormYears", []), [
        2024,
        2025,
      ]),
      limit: toInteger(getValue(req, "limit"), 0),
      requestConfig: toObject(getValue(req, "requestConfig", {})),
      maxCombinationItems: toInteger(getValue(req, "maxCombinationItems"), 12),
    });

    const storeMeta = buildStoredSectionMeta({
      requestedSection,
      sectionUrls: resolvedSectionUrls,
    });

    const postList = (data?.jobs || [])
      .map((item) => ({
        title: item?.title || "",
        jobUrl: item?.jobUrl || "",
        sourceSectionUrl: item?.sourceSectionUrl || resolvedSectionUrls[0] || "",
        fetchedAt: data?.fetchedAt || new Date().toISOString(),
      }))
      .filter((item) => item.jobUrl);

    const stored = await govJobListModel.upsertSection({
      section: storeMeta.section,
      sectionName: storeMeta.sectionName,
      sectionUrls: resolvedSectionUrls,
      postList,
      extra: {
        sectionInput: requestedSection || "",
      },
    });

    const jobs = (data?.jobs || []).map((item) => ({
      title: item?.title || "",
      jobUrl: item?.jobUrl || "",
    }));

    return res.status(200).json({
      jobs,
      db: {
        id: stored?.sectionData?.id || null,
        created: Boolean(stored?.created),
        totalPosts: Number(stored?.sectionData?.totalPosts || 0),
        section: stored?.sectionData?.section || storeMeta.section,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const syncJobListController = async (req, res, next) => {
  try {
    const syncDetails = toBoolean(getValue(req, "syncDetails"), true);
    const jobListSummary = await jobListSyncService.syncStoredJobLists({
      section: getValue(req, "section", ""),
      limit: toInteger(getValue(req, "limit"), 0),
      strictJobOnly: toBoolean(getValue(req, "strictJobOnly"), true),
      skipOldOnlineForms: toBoolean(getValue(req, "skipOldOnlineForms"), true),
      skipOnlineFormYears: toIntegerArray(getValue(req, "skipOnlineFormYears", []), [
        2024,
        2025,
      ]),
      requestConfig: toObject(getValue(req, "requestConfig", {})),
      maxCombinationItems: toInteger(getValue(req, "maxCombinationItems"), 12),
    });

    let jobDetailSummary = null;
    if (syncDetails) {
      jobDetailSummary = await jobDetailSyncService.syncStoredJobDetails({
        section: getValue(req, "section", ""),
        sectionLimit: toInteger(getValue(req, "sectionLimit"), 0),
        jobsPerSection: toInteger(getValue(req, "jobsPerSection"), 0),
        maxJobsPerRun: toInteger(getValue(req, "maxJobsPerRun"), 0),
        requestConfig: toObject(getValue(req, "requestConfig", {})),
        includeElementHtml: toBoolean(getValue(req, "includeElementHtml"), false),
        maxCombinationItems: toInteger(getValue(req, "maxCombinationItems"), 8),
        similarityThreshold: Number(getValue(req, "similarityThreshold", 0.8)),
      });
    }

    return res.status(200).json({
      message: "Job list sync completed",
      syncDetails,
      jobListSync: jobListSummary,
      jobDetailSync: jobDetailSummary,
    });
  } catch (error) {
    return next(error);
  }
};



export const scrapeJobDetailController = async (req, res, next) => {
  try {
    const result = await jobDetailSyncService.scrapeAndStoreJobDetail({
      jobUrl: getValue(req, "jobUrl"),
      section: getValue(req, "section", ""),
      sourceSectionUrl: getValue(req, "sectionUrl", ""),
      title: getValue(req, "title", ""),
      requestConfig: toObject(getValue(req, "requestConfig", {})),
      includeElementHtml: toBoolean(getValue(req, "includeElementHtml"), true),
      maxCombinationItems: toInteger(getValue(req, "maxCombinationItems"), 12),
      similarityThreshold: Number(getValue(req, "similarityThreshold", 0.8)),
    });

    const formattedHtml = result?.formattedHtml || "";
    const jsonData = result?.jsonData || null;
    const saved = result?.saved || null;

    return res.status(200).json({ 
      success: true,
      formattedHtml,
      jsonData,
      db: {
        id: saved?.detail?.id || null,
        created: Boolean(saved?.created),
        updated: Boolean(saved?.updated),
        changed: Boolean(saved?.changed),
        patched: Boolean(saved?.patched),
        similarityScore: Number(saved?.similarityScore || 0),
        matchedBy: saved?.detail?.dedupeMeta?.matchedBy || "",
        contentHash: saved?.detail?.contentHash || null,
      },
    });

  } catch (error) {
    return next(error);
  }
};

export const fetchJobByTitleController = async (req, res, next) => {
  try {
    const title = String(getValue(req, "title", "")).trim();
    if (!title) {
      throw new Error("title is required");
    }

    const jobs = await govJobDetailModel.findByTitle({
      title,
    });

    return res.status(200).json({
      title,
      total: jobs.length,
      job: jobs[0] || null,
      jobs,
    });
  } catch (error) {
    return next(error);
  }
};

export const findByTitleJobAndSchemeController = async (req, res, next) => {
  try {
    const keyword = String(
      getValue(req, "keyword", getValue(req, "title", getValue(req, "query", "")))
    ).trim();

    if (!keyword) {
      throw new Error("keyword is required");
    }

    const escaped = escapeRegExp(keyword);
    const regexText = escaped.replace(/\s+/g, "\\s+");
    const regex = new RegExp(regexText, "i");

    const [jobDocs, schemeDocs] = await Promise.all([
      govJobDetailModel.model
        .find({
          $or: [{ title: regex }, { pageTitle: regex }, { "jsonData.title": regex }],
        })
        .sort({ lastScrapedAt: -1, updatedAt: -1 })
        .lean(),
      govSchemeModel.model
        .find({
          schemeTitle: regex,
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const jobs = jobDocs.map((doc) => ({
      title: String(doc?.title || doc?.jsonData?.title || doc?.pageTitle || "").trim(),
      type: "job",
      jobUrl: String(doc?.jobUrl || "").trim(),
    }));

    const schemes = schemeDocs.map((doc) => ({
      title: String(doc?.schemeTitle || "").trim(),
      type: "scheme",
    }));

    const results = [...jobs, ...schemes];

    return res.status(200).json({
      keyword,
      total: results.length,
      results,
    });
  } catch (error) {
    return next(error);
  }
};

export const fetchJobByUrlController = async (req, res, next) => {
  try {
    const jobUrl = String(getValue(req, "jobUrl", "")).trim();
    if (!jobUrl) {
      throw new Error("jobUrl is required");
    }

    const job = await govJobDetailModel.findByJobUrl({ jobUrl });
    if (!job) {
      return res.status(404).json({
        message: "Job detail not found",
        job: null,
      });
    }

    return res.status(200).json({ job });
  } catch (error) {
    return next(error);
  }
};

export const getAllJobDetailsController = async (req, res, next) => {
  try {
    const jobs = await govJobDetailModel.getAll();

    return res.status(200).json({
      total: jobs.length,
      jobs: jobs.map((job) => job.jsonData),
    });
  } catch (error) {
    return next(error);
  }
};

export const fetchStoredJobListController = async (req, res, next) => {
  try {
    const section = String(getValue(req, "section", "")).trim();

    if (section) {
      const jobList = await govJobListModel.getBySection(section);
      if (!jobList) {
        return res.status(404).json({
          message: "Stored job list not found",
          section,
          jobList: null,
        });
      }

      return res.status(200).json({
        section,
        total: Number(jobList?.totalPosts || 0),
        jobList,
      });
    }

    const jobLists = await govJobListModel.list();

    return res.status(200).json({
      total: jobLists.length,
      jobLists,
    });
  } catch (error) {
    return next(error);
  }
};

export const listJobSectionsController = async (req, res, next) => {
  try {
    await ensureDefaultSections();
    const sections = await jobSectionsModel.list();
    return res.status(200).json({ sections });
  } catch (error) {
    return next(error);
  }
};

export const upsertJobSectionController = async (req, res, next) => {
  try {
    await ensureDefaultSections();

    const result = await jobSectionsModel.upsert({
      name: getValue(req, "name", ""),
      key: getValue(req, "key", ""),
      aliases: toArray(getValue(req, "aliases", [])),
      urls: toArray(getValue(req, "urls", [])),
      isManual: toBoolean(getValue(req, "isManual"), true),
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? "Section created" : "Section updated",
      section: result.section,
    });
  } catch (error) {
    return next(error);
  }
};

export const getJobSectionUrlsController = async (req, res, next) => {
  try {
    await ensureDefaultSections();

    const sectionInput = req?.params?.section || getValue(req, "section", "");
    if (!sectionInput) {
      throw new Error("section is required");
    }

    const section = await jobSectionsModel.findBySection(sectionInput);
    if (!section) {
      return res.status(404).json({ message: "Section not found", urls: [] });
    }

    return res.status(200).json({
      key: section.key,
      name: section.name,
      urls: section.urls,
    });
  } catch (error) {
    return next(error);
  }
};

export const siteAddController = async (req, res, next) => {
  try {
    await ensureDefaultSites();

    const result = await siteModel.upsert({
      siteName: getValue(req, "siteName", ""),
      siteUrl: getValue(req, "siteUrl", ""),
      status: getValue(req, "status", "inactive"),
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.created ? "Site created" : "Site updated",
      site: result.site,
    });
  } catch (error) {
    return next(error);
  }
};

export const siteGetController = async (req, res, next) => {
  try {
    await ensureDefaultSites();
    const sites = await siteModel.list({
      status: getValue(req, "status", ""),
    });
    return res.status(200).json({ sites });
  } catch (error) {
    return next(error);
  }
};

export default {
  scrapeSiteSectionsController,
  scrapeSectionJobsController,
  syncJobListController,
  scrapeJobDetailController,
  fetchStoredJobListController,
  fetchJobByTitleController,
  findByTitleJobAndSchemeController,
  fetchJobByUrlController,
  getAllJobDetailsController,
  listJobSectionsController,
  upsertJobSectionController,
  getJobSectionUrlsController,
  siteAddController,
  siteGetController,
};
