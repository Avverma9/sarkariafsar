import "./utils/loadEnv.mjs";
import cron from "node-cron";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import connectDatabase, { disconnectDatabase, mongoose } from "./db/config.mjs";
import { runJobAiMonitoring } from "./ai/ai.js";
import { summarizeOfficialSyncResults, syncAllOfficialSources } from "./utils/official-source-sync.mjs";

const toBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
};

const toInteger = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const DEFAULT_JOB_PIPELINE_ENABLED = toBoolean(process.env.JOB_PIPELINE_ENABLED, true);
const DEFAULT_JOB_PIPELINE_SCHEDULE =
  process.env.JOB_PIPELINE_SCHEDULE || process.env.JOB_AI_MONITOR_SCHEDULE || "0 */10 * * *";
const DEFAULT_JOB_PIPELINE_TIMEZONE =
  process.env.JOB_PIPELINE_TIMEZONE || process.env.JOB_AI_MONITOR_TIMEZONE || "Asia/Kolkata";
const DEFAULT_JOB_PIPELINE_RUN_ON_START = toBoolean(
  process.env.JOB_PIPELINE_RUN_ON_START,
  toBoolean(process.env.JOB_AI_MONITOR_RUN_ON_START, true)
);
const DEFAULT_SOURCE_SYNC_ENABLED = toBoolean(process.env.JOB_SOURCE_SYNC_ENABLED, true);
const DEFAULT_SOURCE_SYNC_LIMIT = Math.max(0, toInteger(process.env.JOB_SOURCE_SYNC_LIMIT, 0));
const DEFAULT_SOURCE_SYNC_MAX_CANDIDATES = Math.max(
  1,
  toInteger(process.env.JOB_SOURCE_SYNC_MAX_CANDIDATES, 40)
);
const DEFAULT_AI_STEP_ENABLED = toBoolean(process.env.JOB_PIPELINE_AI_ENABLED, true);
const DEFAULT_AI_MONITOR_LIMIT = Math.max(0, toInteger(process.env.JOB_AI_MONITOR_LIMIT, 0));
const DEFAULT_AI_MONITOR_CONCURRENCY = Math.max(
  1,
  toInteger(process.env.JOB_AI_MONITOR_CONCURRENCY, 2)
);

let pipelineCronTask = null;
let pipelineRunning = false;

export const runAutomatedJobPipeline = async ({
  sourceSyncEnabled = DEFAULT_SOURCE_SYNC_ENABLED,
  sourceLimit = DEFAULT_SOURCE_SYNC_LIMIT,
  sourceMaxCandidates = DEFAULT_SOURCE_SYNC_MAX_CANDIDATES,
  aiEnabled = DEFAULT_AI_STEP_ENABLED,
  aiForce = false,
  aiLimit = DEFAULT_AI_MONITOR_LIMIT,
  aiConcurrency = DEFAULT_AI_MONITOR_CONCURRENCY,
  sourceDryRun = false,
} = {}) => {
  const startedAt = Date.now();
  const sourceResults = sourceSyncEnabled
    ? await syncAllOfficialSources({
        limit: sourceLimit,
        maxCandidatesPerSource: sourceMaxCandidates,
        dryRun: sourceDryRun,
      })
    : [];
  const sourceSummary = summarizeOfficialSyncResults(sourceResults);
  const aiSummary = aiEnabled && !sourceDryRun
    ? await runJobAiMonitoring({
        force: aiForce,
        limit: aiLimit,
        concurrency: aiConcurrency,
      })
    : {
        processed: 0,
        updated: 0,
        noChange: 0,
        needsReview: 0,
        skipped: 0,
        mailed: 0,
        errors: 0,
        reason: sourceDryRun ? "source_dry_run" : "ai_disabled",
      };

  return {
    durationMs: Date.now() - startedAt,
    sourceSync: {
      enabled: sourceSyncEnabled,
      dryRun: sourceDryRun,
      summary: sourceSummary,
      results: sourceResults,
    },
    aiMonitoring: {
      enabled: aiEnabled,
      ...aiSummary,
    },
  };
};

export const runStandaloneAutomatedJobPipeline = async (options = {}) => {
  if (pipelineRunning) {
    return { skipped: true, reason: "already_running" };
  }

  pipelineRunning = true;
  try {
    return await runAutomatedJobPipeline(options);
  } finally {
    pipelineRunning = false;
  }
};

export const startAutomatedJobPipelineCron = ({
  schedule = DEFAULT_JOB_PIPELINE_SCHEDULE,
  timezone = DEFAULT_JOB_PIPELINE_TIMEZONE,
  enabled = DEFAULT_JOB_PIPELINE_ENABLED,
  runOnStart = DEFAULT_JOB_PIPELINE_RUN_ON_START,
} = {}) => {
  if (pipelineCronTask) return pipelineCronTask;
  if (!enabled) return null;

  if (!cron.validate(schedule)) {
    throw new Error(`Invalid automated job pipeline cron schedule: ${schedule}`);
  }

  pipelineCronTask = cron.schedule(
    schedule,
    () => {
      runStandaloneAutomatedJobPipeline()
        .then((result) => {
          console.log(
            `[job-pipeline-cron] completed in ${result.durationMs}ms | sourceCreated=${result.sourceSync.summary.created} sourceUpdated=${result.sourceSync.summary.updated} sourceCloned=${result.sourceSync.summary.cloned} aiUpdated=${result.aiMonitoring.updated} aiReview=${result.aiMonitoring.needsReview} mailed=${result.aiMonitoring.mailed}`
          );
        })
        .catch((error) => {
          console.error(`[job-pipeline-cron] ${error?.message || error}`);
        });
    },
    {
      timezone,
    }
  );

  console.log(`[job-pipeline-cron] started (${schedule}, timezone=${timezone})`);

  if (runOnStart) {
    runStandaloneAutomatedJobPipeline()
      .then((result) => {
        console.log(
          `[job-pipeline-cron] initial run completed in ${result.durationMs}ms | sourceCreated=${result.sourceSync.summary.created} sourceUpdated=${result.sourceSync.summary.updated} sourceCloned=${result.sourceSync.summary.cloned} aiUpdated=${result.aiMonitoring.updated} aiReview=${result.aiMonitoring.needsReview} mailed=${result.aiMonitoring.mailed}`
        );
      })
      .catch((error) => {
        console.error(`[job-pipeline-cron] initial run failed: ${error?.message || error}`);
      });
  }

  return pipelineCronTask;
};

export const stopAutomatedJobPipelineCron = () => {
  if (!pipelineCronTask) return;
  pipelineCronTask.stop();
  pipelineCronTask = null;
};

const runCli = async () => {
  const shouldRunCron =
    process.argv.includes("--cron") || process.argv.includes("cron");
  const sourceOnly =
    process.argv.includes("--source-only") || process.argv.includes("source-only");
  const aiOnly = process.argv.includes("--ai-only") || process.argv.includes("ai-only");
  const sourceDryRun =
    process.argv.includes("--dry-run") || process.argv.includes("--source-dry-run");
  const sourceLimitArgIndex = process.argv.findIndex((arg) => arg === "--source-limit");
  const sourceLimit =
    sourceLimitArgIndex >= 0 && process.argv[sourceLimitArgIndex + 1]
      ? Math.max(0, toInteger(process.argv[sourceLimitArgIndex + 1], DEFAULT_SOURCE_SYNC_LIMIT))
      : DEFAULT_SOURCE_SYNC_LIMIT;
  const shouldConnect = mongoose.connection.readyState === 0;

  if (shouldConnect) {
    await connectDatabase();
  }

  try {
    if (shouldRunCron) {
      startAutomatedJobPipelineCron({
        enabled: true,
        runOnStart: true,
      });
      return;
    }

    const result = await runStandaloneAutomatedJobPipeline({
      sourceSyncEnabled: !aiOnly,
      sourceLimit,
      aiEnabled: !sourceOnly && !sourceDryRun,
      aiForce: !sourceOnly,
      sourceDryRun,
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    if (!shouldRunCron && shouldConnect) {
      await disconnectDatabase();
    }
  }
};

const isDirectRun =
  Boolean(process.argv[1]) &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runCli().catch((error) => {
    console.error(`[job-pipeline] ${error?.message || error}`);
    process.exit(1);
  });
}

export default {
  runAutomatedJobPipeline,
  runStandaloneAutomatedJobPipeline,
  startAutomatedJobPipelineCron,
  stopAutomatedJobPipelineCron,
};
