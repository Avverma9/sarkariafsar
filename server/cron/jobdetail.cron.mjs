import cron from "node-cron";
import jobDetailSyncService from "../services/jobdetail-sync.service.mjs";

const DEFAULT_CRON_SCHEDULE = "* * * * *";
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

export const runJobDetailSyncJob = async () => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const summary = await jobDetailSyncService.syncStoredJobDetails({
      sectionLimit: toInteger(process.env.JOBDETAIL_SYNC_SECTION_LIMIT, 0),
      jobsPerSection: toInteger(process.env.JOBDETAIL_SYNC_JOBS_PER_SECTION, 0),
      maxJobsPerRun: toInteger(process.env.JOBDETAIL_SYNC_MAX_JOBS_PER_RUN, 0),
      minRecheckMinutes: toInteger(
        process.env.JOBDETAIL_SYNC_MIN_RECHECK_MINUTES,
        30
      ),
      includeElementHtml: toBoolean(
        process.env.JOBDETAIL_SYNC_INCLUDE_ELEMENT_HTML,
        false
      ),
      maxCombinationItems: toInteger(
        process.env.JOBDETAIL_SYNC_MAX_COMBINATION_ITEMS,
        8
      ),
      similarityThreshold: Number(
        process.env.JOBDETAIL_SYNC_SIMILARITY_THRESHOLD || 0.8
      ),
    });

    const durationMs = Date.now() - startedAt;
    console.log(
      `[cron] Job detail sync completed in ${durationMs}ms | sections=${summary.scannedSections} eligible=${summary.eligibleCandidates} jobs=${summary.scannedJobs} missing=${summary.missingDetailCount} list_due=${summary.listRefreshDueCount} recheck_due=${summary.periodicRecheckDueCount} created=${summary.createdCount} updated=${summary.updatedCount} patched=${summary.patchedCount} failed=${summary.failedCount}`
    );

    return {
      skipped: false,
      durationMs,
      jobDetailSync: summary,
    };
  } finally {
    cronRunning = false;
  }
};

export const startJobDetailSyncCron = () => {
  if (cronTask) return cronTask;

  const legacyModeEnabled = toBoolean(
    process.env.JOBDETAIL_SYNC_ENABLED_WITH_JOBLIST_CRON,
    false
  );
  if (legacyModeEnabled) {
    console.log(
      "[cron] Dedicated job detail cron disabled because JOBDETAIL_SYNC_ENABLED_WITH_JOBLIST_CRON=true"
    );
    return null;
  }

  const enabled = toBoolean(process.env.ENABLE_JOBDETAIL_SYNC_CRON, true);
  if (!enabled) {
    console.log(
      "[cron] Job detail sync cron disabled via ENABLE_JOBDETAIL_SYNC_CRON=false"
    );
    return null;
  }

  const schedule =
    process.env.JOBDETAIL_SYNC_CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;
  const timezone =
    process.env.JOBDETAIL_SYNC_CRON_TIMEZONE || DEFAULT_CRON_TIMEZONE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid JOBDETAIL_SYNC_CRON_SCHEDULE: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runJobDetailSyncJob().catch((error) => {
        console.error(
          `[cron] Job detail sync run failed: ${error?.message || error}`
        );
      });
    },
    { timezone }
  );

  console.log(
    `[cron] Job detail sync cron started (${schedule}, timezone=${timezone})`
  );

  const runOnStart = toBoolean(
    process.env.JOBDETAIL_SYNC_CRON_RUN_ON_START,
    true
  );
  if (runOnStart) {
    setTimeout(() => {
      runJobDetailSyncJob().catch((error) => {
        console.error(
          `[cron] Job detail sync initial run failed: ${error?.message || error}`
        );
      });
    }, 4000);
  }

  return cronTask;
};

export const stopJobDetailSyncCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

export default {
  runJobDetailSyncJob,
  startJobDetailSyncCron,
  stopJobDetailSyncCron,
};
