import cron from "node-cron";
import scrapperService from "../services/scrapper.services.mjs";
import jobSectionsModel from "../models/jobsections.model.mjs";
import siteModel from "../models/site.model.mjs";
import govJobDetailModel from "../models/govjobdetail.model.mjs";
import { formatJobHtmlAdvanced } from "../utils/htmlFormatter.mjs";
import { formatJobJsonAdvanced } from "../utils/jsonFormatter.mjs";

const DEFAULT_CRON_SCHEDULE = "*/30 * * * *";
const DEFAULT_CRON_TIMEZONE = "Asia/Kolkata";
const DEFAULT_SECTION_LIMIT = 8;
const DEFAULT_JOBS_PER_SECTION = 8;
const DEFAULT_MAX_JOBS_PER_RUN = 40;

let cronTask = null;
let cronRunning = false;
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
  const parsed = Number.parseInt(String(value || ""), 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

const ensureDefaults = async () => {
  if (defaultsSeeded) return;
  await jobSectionsModel.seedDefaults();
  await siteModel.seedDefaults();
  defaultsSeeded = true;
};

const collectActiveSectionConfigs = async () => {
  await ensureDefaults();

  const activeSites = await siteModel.getActiveSites();
  const activeHosts = new Set(
    (activeSites || [])
      .map((site) => site.normalizedHost || siteModel.getNormalizedHostFromUrl(site.siteUrl))
      .filter(Boolean)
  );

  const sections = await jobSectionsModel.list();
  const output = [];
  const seen = new Set();

  for (const section of sections || []) {
    for (const sectionUrl of section?.urls || []) {
      const normalizedHost = siteModel.getNormalizedHostFromUrl(sectionUrl);
      if (!activeHosts.has(normalizedHost)) continue;

      const dedupeKey = String(sectionUrl || "").trim().toLowerCase();
      if (!dedupeKey || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      output.push({
        section: section?.name || section?.key || "",
        sectionUrl,
      });
    }
  }

  return output;
};

export const runGovSchemeScrapeJob = async () => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const sectionLimit = toInteger(process.env.SCRAPE_CRON_SECTION_LIMIT, DEFAULT_SECTION_LIMIT);
    const jobsPerSection = toInteger(
      process.env.SCRAPE_CRON_JOBS_PER_SECTION,
      DEFAULT_JOBS_PER_SECTION
    );
    const maxJobsPerRun = toInteger(process.env.SCRAPE_CRON_MAX_JOBS_PER_RUN, DEFAULT_MAX_JOBS_PER_RUN);

    const activeSectionConfigs = await collectActiveSectionConfigs();
    const selectedSections =
      sectionLimit > 0 ? activeSectionConfigs.slice(0, sectionLimit) : activeSectionConfigs;

    const jobsMap = new Map();
    for (const config of selectedSections) {
      const sectionJobs = await scrapperService.getSectionJobList({
        section: config.section,
        sectionUrls: [config.sectionUrl],
        strictJobOnly: true,
        skipOldOnlineForms: true,
        skipOnlineFormYears: [2024, 2025],
        limit: jobsPerSection,
        maxCombinationItems: 12,
      });

      for (const job of sectionJobs?.jobs || []) {
        const jobUrl = String(job?.jobUrl || "").trim();
        if (!jobUrl || jobsMap.has(jobUrl)) continue;

        jobsMap.set(jobUrl, {
          section: job?.section || config.section || "",
          sourceSectionUrl: job?.sourceSectionUrl || config.sectionUrl || "",
          title: job?.title || "",
          jobUrl,
        });
      }
    }

    const jobItems = Array.from(jobsMap.values());
    const selectedJobs = maxJobsPerRun > 0 ? jobItems.slice(0, maxJobsPerRun) : jobItems;

    let createdCount = 0;
    let updatedCount = 0;
    let changedCount = 0;
    let failedCount = 0;

    for (const job of selectedJobs) {
      try {
        const detail = await scrapperService.getJobContentWithAllSelectors({
          jobUrl: job.jobUrl,
          includeElementHtml: false,
          maxCombinationItems: 8,
        });

        const formattedHtml = detail?.html ? formatJobHtmlAdvanced(detail.html) : "";
        const jsonData = detail?.html ? formatJobJsonAdvanced(detail.html) : null;

        const saved = await govJobDetailModel.upsertFromScrape({
          jobUrl: detail?.jobUrl || job.jobUrl,
          formattedHtml,
          jsonData,
          section: job.section,
          sourceSectionUrl: job.sourceSectionUrl,
          pageTitle: detail?.pageTitle || "",
          canonicalUrl: detail?.canonicalUrl || "",
          metaDescription: detail?.metaDescription || "",
          extra: {
            title: job.title || "",
            scrapedAt: detail?.fetchedAt || new Date().toISOString(),
          },
        });

        if (saved?.created) createdCount += 1;
        if (saved?.updated) updatedCount += 1;
        if (saved?.changed) changedCount += 1;
      } catch (error) {
        failedCount += 1;
        console.error(
          `[cron] Failed to scrape job detail (${job.jobUrl}): ${error?.message || error}`
        );
      }
    }

    const durationMs = Date.now() - startedAt;
    const summary = {
      skipped: false,
      durationMs,
      scannedSections: selectedSections.length,
      scannedJobs: selectedJobs.length,
      createdCount,
      updatedCount,
      changedCount,
      failedCount,
    };

    console.log(
      `[cron] GovScheme scrape completed in ${durationMs}ms | sections=${summary.scannedSections} jobs=${summary.scannedJobs} created=${createdCount} updated=${updatedCount} changed=${changedCount} failed=${failedCount}`
    );

    return summary;
  } finally {
    cronRunning = false;
  }
};

export const startGovSchemeScrapeCron = () => {
  if (cronTask) return cronTask;

  const enabled = toBoolean(process.env.ENABLE_SCRAPE_CRON, true);
  if (!enabled) {
    console.log("[cron] GovScheme scrape cron disabled via ENABLE_SCRAPE_CRON=false");
    return null;
  }

  const schedule = process.env.SCRAPE_CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;
  const timezone = process.env.SCRAPE_CRON_TIMEZONE || DEFAULT_CRON_TIMEZONE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid SCRAPE_CRON_SCHEDULE: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runGovSchemeScrapeJob().catch((error) => {
        console.error(`[cron] GovScheme scrape run failed: ${error?.message || error}`);
      });
    },
    { timezone }
  );

  console.log(`[cron] GovScheme scrape cron started (${schedule}, timezone=${timezone})`);

  const runOnStart = toBoolean(process.env.SCRAPE_CRON_RUN_ON_START, true);
  if (runOnStart) {
    setTimeout(() => {
      runGovSchemeScrapeJob().catch((error) => {
        console.error(`[cron] GovScheme initial run failed: ${error?.message || error}`);
      });
    }, 2000);
  }

  return cronTask;
};

export const stopGovSchemeScrapeCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

export default {
  runGovSchemeScrapeJob,
  startGovSchemeScrapeCron,
  stopGovSchemeScrapeCron,
};
