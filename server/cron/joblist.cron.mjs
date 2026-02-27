import cron from "node-cron";
import jobListSyncService from "../services/joblist-sync.service.mjs";
import jobDetailSyncService from "../services/jobdetail-sync.service.mjs";

const DEFAULT_CRON_SCHEDULE = "*/10 * * * *";
const DEFAULT_CRON_TIMEZONE = "Asia/Kolkata";

let cronTask = null;
let cronRunning = false;

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

export const runJobListSyncJob = async () => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const jobListSummary = await jobListSyncService.syncStoredJobLists({
      limit: toInteger(process.env.JOBLIST_SYNC_LIMIT_PER_SECTION, 0),
      strictJobOnly: toBoolean(process.env.JOBLIST_SYNC_STRICT_JOB_ONLY, true),
      skipOldOnlineForms: toBoolean(process.env.JOBLIST_SYNC_SKIP_OLD_ONLINE_FORMS, true),
      skipOnlineFormYears:
        process.env.JOBLIST_SYNC_SKIP_ONLINE_FORM_YEARS || "2024,2025",
      maxCombinationItems: toInteger(
        process.env.JOBLIST_SYNC_MAX_COMBINATION_ITEMS,
        12
      ),
    });

    const detailSyncEnabled = toBoolean(
      process.env.JOBDETAIL_SYNC_ENABLED_WITH_JOBLIST_CRON,
      true
    );
    let jobDetailSummary = null;
    if (detailSyncEnabled) {
      jobDetailSummary = await jobDetailSyncService.syncStoredJobDetails({
        sectionLimit: toInteger(process.env.JOBDETAIL_SYNC_SECTION_LIMIT, 0),
        jobsPerSection: toInteger(process.env.JOBDETAIL_SYNC_JOBS_PER_SECTION, 0),
        maxJobsPerRun: toInteger(process.env.JOBDETAIL_SYNC_MAX_JOBS_PER_RUN, 0),
        includeElementHtml: toBoolean(process.env.JOBDETAIL_SYNC_INCLUDE_ELEMENT_HTML, false),
        maxCombinationItems: toInteger(
          process.env.JOBDETAIL_SYNC_MAX_COMBINATION_ITEMS,
          8
        ),
        similarityThreshold: Number(
          process.env.JOBDETAIL_SYNC_SIMILARITY_THRESHOLD || 0.8
        ),
      });
    }

    const durationMs = Date.now() - startedAt;
    console.log(
      `[cron] Job list sync completed in ${durationMs}ms | joblist: sections=${jobListSummary.totalSections} synced=${jobListSummary.syncedSections} skipped=${jobListSummary.skippedSections} jobs=${jobListSummary.totalJobsFetched} | jobdetail: scanned=${Number(jobDetailSummary?.scannedJobs || 0)} created=${Number(jobDetailSummary?.createdCount || 0)} updated=${Number(jobDetailSummary?.updatedCount || 0)} patched=${Number(jobDetailSummary?.patchedCount || 0)} failed=${Number(jobDetailSummary?.failedCount || 0)}`
    );

    return {
      skipped: false,
      durationMs,
      jobListSync: jobListSummary,
      jobDetailSync: jobDetailSummary,
    };
  } finally {
    cronRunning = false;
  }
};

export const startJobListSyncCron = () => {
  if (cronTask) return cronTask;

  const enabled = toBoolean(process.env.ENABLE_JOBLIST_SYNC_CRON, true);
  if (!enabled) {
    console.log("[cron] Job list sync cron disabled via ENABLE_JOBLIST_SYNC_CRON=false");
    return null;
  }

  const schedule = process.env.JOBLIST_SYNC_CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;
  const timezone = process.env.JOBLIST_SYNC_CRON_TIMEZONE || DEFAULT_CRON_TIMEZONE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid JOBLIST_SYNC_CRON_SCHEDULE: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runJobListSyncJob().catch((error) => {
        console.error(`[cron] Job list sync run failed: ${error?.message || error}`);
      });
    },
    { timezone }
  );

  console.log(`[cron] Job list sync cron started (${schedule}, timezone=${timezone})`);

  const runOnStart = toBoolean(process.env.JOBLIST_SYNC_CRON_RUN_ON_START, true);
  if (runOnStart) {
    setTimeout(() => {
      runJobListSyncJob().catch((error) => {
        console.error(`[cron] Job list sync initial run failed: ${error?.message || error}`);
      });
    }, 2000);
  }

  return cronTask;
};

export const stopJobListSyncCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

export default {
  runJobListSyncJob,
  startJobListSyncCron,
  stopJobListSyncCron,
};
