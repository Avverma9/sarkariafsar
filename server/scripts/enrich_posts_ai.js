/**
 * AI Enrichment: fills empty DB fields using Gemini.
 *
 * Fields filled: jobtitle, conductingAuthority, conducting_authority,
 *   advertisementNumber, advertisement_number, location, totalVacancies,
 *   ageLimit, applicationFee, selectionProcess, salary, physicalTestDetails,
 *   syllabusBreakdown, examPreparationStrategy, tags, disclaimer
 *
 * Usage:
 *   node server/scripts/enrich_posts_ai.js             # skip already-filled posts
 *   node server/scripts/enrich_posts_ai.js --force     # re-enrich all posts
 *   node server/scripts/enrich_posts_ai.js --limit=20  # process first N posts
 *   node server/scripts/enrich_posts_ai.js --slug=up-police-si-2025  # single post
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const JobPost = require("../models/post");
const { enrichPost } = require("../utils/enrichPostAI");

const MONGO_URI = process.env.SCRAPPER_MONGO_URI || process.env.MONGO_URI;
const CONCURRENCY = 3;   // parallel Gemini calls (safe for rate limits with 10 keys)
const BATCH_SIZE  = 30;  // MongoDB bulkWrite batch size

const ARGS      = process.argv.slice(2);
const FORCE     = ARGS.includes("--force");
const LIMIT_ARG = ARGS.find(a => a.startsWith("--limit="));
const SLUG_ARG  = ARGS.find(a => a.startsWith("--slug="));
const LIMIT     = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 0;
const SLUG      = SLUG_ARG  ? SLUG_ARG.split("=")[1] : null;

if (!MONGO_URI) {
  console.error("[enrich] SCRAPPER_MONGO_URI not set. Aborting.");
  process.exit(1);
}

// Fields that count as "empty" — used to build the filter
const EMPTY_FIELDS = [
  "jobtitle", "conductingAuthority", "location",
  "totalVacancies", "ageLimit", "applicationFee", "selectionProcess", "tags",
];

function buildFilter() {
  if (SLUG) return { slug: SLUG };
  if (FORCE) return {};
  return {
    $or: [
      ...EMPTY_FIELDS.map(f => ({
        [f]: { $in: [null, "", []] }
      })),
    ],
  };
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("[enrich] Connected to MongoDB");

  const filter = buildFilter();
  const total  = await JobPost.countDocuments(filter);
  console.log(`[enrich] Posts to enrich: ${total}${LIMIT ? ` (limited to ${LIMIT})` : ""}${FORCE ? " (--force)" : ""}${SLUG ? ` slug=${SLUG}` : ""}`);
  if (!total) { console.log("[enrich] Nothing to do. Exiting."); await mongoose.disconnect(); return; }

  let processed = 0, enriched = 0, skipped = 0, failed = 0;
  const bulkOps = [];

  const query = JobPost.find(filter)
    .select(
      "_id slug title scrapedContent jobtitle conductingAuthority conducting_authority " +
      "advertisementNumber advertisement_number location totalVacancies ageLimit applicationFee " +
      "selectionProcess salary physicalTestDetails syllabusBreakdown examPreparationStrategy tags disclaimer"
    )
    .lean()
    .cursor();

  const inFlight = [];

  const flush = async (force = false) => {
    if (bulkOps.length >= BATCH_SIZE || (force && bulkOps.length)) {
      const batch = bulkOps.splice(0, BATCH_SIZE);
      await JobPost.bulkWrite(batch, { ordered: false });
      console.log(`  [bulk] wrote ${batch.length} docs — enriched: ${enriched}, skipped: ${skipped}, failed: ${failed}`);
    }
  };

  const processOne = async (doc) => {
    try {
      const updates = await enrichPost(doc);
      if (Object.keys(updates).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update:  { $set: updates },
          },
        });
        enriched++;
        if (process.env.DEBUG_ENRICH) {
          console.log(`  ✓ ${doc.slug}: set [${Object.keys(updates).join(", ")}]`);
        }
      } else {
        skipped++;
      }
    } catch (e) {
      console.error(`  [error] ${doc.slug}: ${e.message}`);
      failed++;
    } finally {
      processed++;
      if (processed % 5 === 0 || processed === total) {
        process.stdout.write(
          `\r  Progress: ${processed}/${LIMIT || total} | enriched:${enriched} skipped:${skipped} failed:${failed}`
        );
      }
    }
    await flush();
  };

  for await (const doc of query) {
    if (LIMIT && processed >= LIMIT) break;

    inFlight.push(processOne(doc));
    if (inFlight.length >= CONCURRENCY) {
      await Promise.all(inFlight.splice(0, CONCURRENCY));
    }
  }

  if (inFlight.length) await Promise.all(inFlight);
  await flush(true);

  console.log(`\n\n[enrich] ✅ Done.`);
  console.log(`  Total processed : ${processed}`);
  console.log(`  Fields enriched : ${enriched} posts updated`);
  console.log(`  Already filled  : ${skipped} posts skipped`);
  console.log(`  Failed          : ${failed}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[enrich] Fatal:", err);
  process.exit(1);
});
