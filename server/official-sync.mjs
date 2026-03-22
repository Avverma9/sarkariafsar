import "./utils/loadEnv.mjs";
import connectDatabase, { disconnectDatabase } from "./db/config.mjs";
import { officialLinks } from "./utils/officialLinks.mjs";
import {
  summarizeOfficialSyncResults,
  syncAllOfficialSources,
} from "./utils/official-source-sync.mjs";

const readIntegerFlag = (flagName, fallback = 0) => {
  const index = process.argv.findIndex((arg) => arg === flagName);
  if (index < 0 || !process.argv[index + 1]) return fallback;

  const parsed = Number.parseInt(String(process.argv[index + 1]), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const readBooleanFlag = (...flagNames) =>
  flagNames.some((flagName) => process.argv.includes(flagName));

const summarizeActions = (results = []) =>
  results.map((result) => ({
    action: result.action,
    dryRun: Boolean(result.dryRun),
    title: result.job?.title || result.job?.jobtitle || null,
    postType: result.job?.postType || null,
    sectionName: result.job?.sectionName || null,
    sectionCanonicalUrl: result.job?.sectionCanonicalUrl || null,
    sourceUrl: result.job?.sourceUrl || null,
    applyLastDate: result.job?.applyLastDate || null,
    advertisement_number:
      result.job?.advertisement_number || result.job?.advertisementNumber || null,
  }));

const buildCompactOutput = (results = []) => ({
  summary: summarizeOfficialSyncResults(results),
  results: results.map((entry) => ({
    sourceUrl: entry.sourceUrl,
    profile: entry.profile || null,
    candidateCount: entry.candidateCount || 0,
    dryRun: Boolean(entry.dryRun),
    error: entry.error || null,
    actions: summarizeActions(entry.results || []),
  })),
});

const runSingleStage = async ({
  sources,
  maxCandidatesPerSource,
  dryRun,
}) => syncAllOfficialSources({ sources, maxCandidatesPerSource, dryRun });

const main = async () => {
  const limit = Math.max(0, readIntegerFlag("--limit", 0));
  const start = Math.max(0, readIntegerFlag("--start", 0));
  const stageSize = Math.max(0, readIntegerFlag("--stage-size", 0));
  const maxCandidatesPerSource = Math.max(1, readIntegerFlag("--max-candidates", 10));
  const dryRun = readBooleanFlag("--dry-run");
  const summaryOnly = readBooleanFlag("--summary-only");

  const slicedSources = (() => {
    const fromStart = officialLinks.slice(start);
    return limit > 0 ? fromStart.slice(0, limit) : fromStart;
  })();

  await connectDatabase();

  try {
    if (stageSize > 0) {
      const stages = [];

      for (let offset = 0; offset < slicedSources.length; offset += stageSize) {
        const batchSources = slicedSources.slice(offset, offset + stageSize);
        const results = await runSingleStage({
          sources: batchSources,
          maxCandidatesPerSource,
          dryRun,
        });

        stages.push({
          stageNumber: stages.length + 1,
          sourceStartIndex: start + offset,
          sourceEndIndex: start + offset + batchSources.length - 1,
          summary: summarizeOfficialSyncResults(results),
          results: summaryOnly ? undefined : buildCompactOutput(results).results,
        });
      }
      const overallSummary = stages.reduce(
        (accumulator, stage) => {
          for (const [key, value] of Object.entries(stage.summary || {})) {
            accumulator[key] = (accumulator[key] || 0) + Number(value || 0);
          }
          return accumulator;
        },
        {}
      );

      console.log(
        JSON.stringify(
          {
            dryRun,
            start,
            limit,
            stageSize,
            maxCandidatesPerSource,
            stages,
            overallSummary,
          },
          null,
          2
        )
      );
      return;
    }

    const results = await runSingleStage({
      sources: slicedSources,
      maxCandidatesPerSource,
      dryRun,
    });

    console.log(
      JSON.stringify(
        summaryOnly ? { summary: summarizeOfficialSyncResults(results) } : buildCompactOutput(results),
        null,
        2
      )
    );
  } finally {
    await disconnectDatabase();
  }
};

main().catch((error) => {
  console.error(`[official-sync] ${error?.message || error}`);
  process.exit(1);
});
