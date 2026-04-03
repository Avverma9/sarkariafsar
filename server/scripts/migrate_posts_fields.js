/**
 * Migration: Re-derive all new fields from existing scrapedContent.contentHtml.
 *
 * Updates per post:
 *   scrapedContent.contentJson  — re-derived via convertHtmlToJson (Gemini key normalization)
 *   metaDescription             — auto-generated (160-char cap)
 *   canonicalUrl                — https://sarkariafsar.com/jobs/<slug>
 *   noIndex                     — from applyNoIndexFlag (wordCount < 400)
 *   wordCount                   — word count of contentHtml
 *   publishedAt                 — set to createdAt if not already set
 *   examDate                    — parsed from contentJson.importantDates.examDate
 *   schemaType                  — "JobPosting" if not set
 *   language                    — "hi" if not set
 *   authorName                  — default editorial team if empty
 *
 * Usage:
 *   node server/scripts/migrate_posts_fields.js          # skip already-migrated posts
 *   node server/scripts/migrate_posts_fields.js --force  # re-process ALL posts
 *   node server/scripts/migrate_posts_fields.js --limit=50  # process only first N posts
 *
 * Safe to re-run — always idempotent.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const JobPost = require("../models/post");
const { convertHtmlToJson, parseToIsoDate } = require("../scrapper/singlePostScrape");
const { applyNoIndexFlag } = require("../utils/thinContentCheck");
const { autoMetaDescription, calculateWordCount } = require("../scrapper/saveJobPost");

const MONGO_URI = process.env.SCRAPPER_MONGO_URI || process.env.MONGO_URI;
const OWN_DOMAIN = (process.env.OWN_DOMAIN || "https://sarkariafsar.com").replace(/\/$/, "");
const CONCURRENCY = 4;   // parallel convertHtmlToJson calls (Gemini rate limit safe)
const BATCH_SIZE  = 50;  // MongoDB bulk write batch size

const ARGS      = process.argv.slice(2);
const FORCE     = ARGS.includes("--force");
const LIMIT_ARG = ARGS.find(a => a.startsWith("--limit="));
const LIMIT     = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 0;

if (!MONGO_URI) {
  console.error("[migrate] SCRAPPER_MONGO_URI not set. Aborting.");
  process.exit(1);
}

function cleanText(v = "") {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function safeIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function deriveFields(doc) {
  const html  = doc?.scrapedContent?.contentHtml || "";
  const title = cleanText(doc.title);
  const slug  = cleanText(doc.slug);

  // 1. contentJson
  let contentJson = {};
  try {
    contentJson = (html ? await convertHtmlToJson(html) : {}) || {};
  } catch (e) {
    console.warn(`  [warn] convertHtmlToJson failed for ${slug}: ${e.message}`);
  }

  // Merge static meta keys that saveOrPatchJobPost always adds
  contentJson = {
    slug,
    sourceUrl: cleanText(doc.sourceUrl),
    sectionName: cleanText(doc.sectionName),
    sectionCanonicalUrl: cleanText(doc.sectionCanonicalUrl),
    ...contentJson,
  };

  // 2. metaDescription
  const existingMeta = cleanText(doc.metaDescription);
  const metaDescription = autoMetaDescription(existingMeta, title, html);

  // 3. canonicalUrl (only set if not already a valid https:// URL)
  const existingCanonical = cleanText(doc.canonicalUrl);
  const canonicalUrl = existingCanonical.startsWith("https://")
    ? existingCanonical
    : `${OWN_DOMAIN}/jobs/${slug}`;

  // 4. noIndex + wordCount
  const flagged = applyNoIndexFlag({
    scrapedContent: { contentHtml: html },
    wordCount: calculateWordCount(html),
  });
  const wordCount = flagged.wordCount;
  const noIndex   = flagged.noIndex;

  // 5. publishedAt — preserve existing; fall back to createdAt
  const publishedAt = safeIsoDate(doc.publishedAt) || safeIsoDate(doc.createdAt) || new Date();

  // 6. examDate
  const rawExamDate = contentJson?.importantDates?.examDate || "";
  const examDate = safeIsoDate(parseToIsoDate ? parseToIsoDate(rawExamDate) : rawExamDate);

  // 7. Default static fields (only set if currently empty)
  const schemaType  = cleanText(doc.schemaType)  || "JobPosting";
  const language    = cleanText(doc.language)    || "hi";
  const authorName  = cleanText(doc.authorName)  || "Sarkari Afsar Editorial Team";

  return {
    "scrapedContent.contentJson": contentJson,
    metaDescription,
    canonicalUrl,
    wordCount,
    noIndex,
    publishedAt,
    ...(examDate ? { examDate } : {}),
    schemaType,
    language,
    authorName,
  };
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("[migrate] Connected to MongoDB");

  // Build filter
  const filter = FORCE
    ? {}
    : {
        $or: [
          { "scrapedContent.contentJson": { $in: [null, {}, undefined] } },
          { canonicalUrl: { $not: /^https:\/\// } },
          { publishedAt: null },
          { noIndex: null },
        ],
      };

  const total = await JobPost.countDocuments(filter);
  console.log(`[migrate] Posts to process: ${total}${LIMIT ? ` (limited to ${LIMIT})` : ""}${FORCE ? " (--force)" : ""}`);
  if (!total) { console.log("[migrate] Nothing to do. Exiting."); await mongoose.disconnect(); return; }

  let processed = 0, succeeded = 0, failed = 0;
  const bulkOps = [];

  const query = JobPost.find(filter)
    .select("_id slug title sourceUrl sectionName sectionCanonicalUrl metaDescription canonicalUrl scrapedContent wordCount noIndex publishedAt examDate schemaType language authorName createdAt")
    .lean()
    .cursor();

  const inFlight = [];

  const flush = async (force = false) => {
    if (bulkOps.length >= BATCH_SIZE || (force && bulkOps.length)) {
      const batch = bulkOps.splice(0, BATCH_SIZE);
      await JobPost.bulkWrite(batch, { ordered: false });
      console.log(`  [bulk] wrote ${batch.length} docs — total success: ${succeeded}, failed: ${failed}`);
    }
  };

  const processOne = async (doc) => {
    try {
      const fields = await deriveFields(doc);
      bulkOps.push({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: fields },
        },
      });
      succeeded++;
    } catch (e) {
      console.error(`  [error] ${doc.slug}: ${e.message}`);
      failed++;
    } finally {
      processed++;
      if (processed % 10 === 0) {
        process.stdout.write(`\r  Progress: ${processed}/${LIMIT || total} (ok:${succeeded} err:${failed})`);
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

  // Drain remaining
  if (inFlight.length) await Promise.all(inFlight);
  await flush(true);

  console.log(`\n\n[migrate] ✅ Done.`);
  console.log(`  Total processed : ${processed}`);
  console.log(`  Succeeded       : ${succeeded}`);
  console.log(`  Failed          : ${failed}`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("[migrate] Fatal error:", err);
  process.exit(1);
});
