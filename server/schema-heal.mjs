import "./utils/loadEnv.mjs";
import connectDatabase, { disconnectDatabase } from "./db/config.mjs";
import { healAllJobDocuments } from "./utils/schema-heal.mjs";

const readIntegerFlag = (flagName, fallback = 0) => {
  const index = process.argv.findIndex((arg) => arg === flagName);
  if (index < 0 || !process.argv[index + 1]) return fallback;

  const parsed = Number.parseInt(String(process.argv[index + 1]), 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const hasFlag = (...flags) => flags.some((flag) => process.argv.includes(flag));

const main = async () => {
  const limit = Math.max(0, readIntegerFlag("--limit", 0));
  const concurrency = Math.max(1, readIntegerFlag("--concurrency", 3));
  const dryRun = hasFlag("--dry-run");
  const noAi = hasFlag("--no-ai");
  const includeHealthy = hasFlag("--include-healthy");

  await connectDatabase();

  try {
    const result = await healAllJobDocuments({
      limit,
      concurrency,
      dryRun,
      allowAi: !noAi,
      onlyNeedy: !includeHealthy,
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await disconnectDatabase();
  }
};

main().catch((error) => {
  console.error(`[schema-heal] ${error?.message || error}`);
  process.exit(1);
});
