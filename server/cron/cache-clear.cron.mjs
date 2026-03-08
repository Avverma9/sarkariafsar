import cron from "node-cron";
import { clearAppCacheStorage } from "../utils/appCache.mjs";

const DEFAULT_CRON_SCHEDULE = "*/30 * * * *";
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

export const runAppCacheClearJob = async () => {
  if (cronRunning) {
    return { skipped: true, reason: "already_running" };
  }

  cronRunning = true;
  const startedAt = Date.now();

  try {
    const summary = await clearAppCacheStorage({
      target: "all",
      clearFrontend: true,
    });
    const durationMs = Date.now() - startedAt;
    const frontendCleared = Boolean(summary?.frontendResult);

    console.log(
      `[cron] App cache clear completed in ${durationMs}ms | apiDeleted=${Number(summary?.apiDeleted || 0)} frontend=${frontendCleared ? "ok" : "failed_or_skipped"}`
    );

    return {
      skipped: false,
      durationMs,
      frontendCleared,
      summary,
    };
  } finally {
    cronRunning = false;
  }
};

export const startAppCacheClearCron = () => {
  if (cronTask) return cronTask;

  const enabled = toBoolean(process.env.ENABLE_APP_CACHE_CLEAR_CRON, true);
  if (!enabled) {
    console.log(
      "[cron] App cache clear cron disabled via ENABLE_APP_CACHE_CLEAR_CRON=false"
    );
    return null;
  }

  const schedule =
    process.env.APP_CACHE_CLEAR_CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;
  const timezone =
    process.env.APP_CACHE_CLEAR_CRON_TIMEZONE || DEFAULT_CRON_TIMEZONE;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid APP_CACHE_CLEAR_CRON_SCHEDULE: ${schedule}`);
  }

  cronTask = cron.schedule(
    schedule,
    () => {
      runAppCacheClearJob().catch((error) => {
        console.error(
          `[cron] App cache clear run failed: ${error?.message || error}`
        );
      });
    },
    { timezone }
  );

  console.log(
    `[cron] App cache clear cron started (${schedule}, timezone=${timezone})`
  );

  const runOnStart = toBoolean(
    process.env.APP_CACHE_CLEAR_CRON_RUN_ON_START,
    false
  );
  if (runOnStart) {
    setTimeout(() => {
      runAppCacheClearJob().catch((error) => {
        console.error(
          `[cron] App cache clear initial run failed: ${error?.message || error}`
        );
      });
    }, 1000);
  }

  return cronTask;
};

export const stopAppCacheClearCron = () => {
  if (!cronTask) return;
  cronTask.stop();
  cronTask = null;
};

export default {
  runAppCacheClearJob,
  startAppCacheClearCron,
  stopAppCacheClearCron,
};
