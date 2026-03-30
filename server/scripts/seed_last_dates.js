/**
 * One-time script: parses applyLastDate from contentHtml for all posts where it is null.
 * Run: node server/scripts/seed_last_dates.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const JobPost = require("../models/post");
const { parseLastDateFromHtml } = require("../utils/parseLastDate");

const MONGO_URI = process.env.SCRAPPER_MONGO_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("SCRAPPER_MONGO_URI not set in environment.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const total = await JobPost.countDocuments({ applyLastDate: null });
  console.log(`Posts with missing applyLastDate: ${total}`);

  let updated = 0, skipped = 0, batch = 0;
  const BATCH_SIZE = 200;

  let cursor = JobPost.find({ applyLastDate: null })
    .select("_id scrapedContent")
    .cursor();

  const promises = [];

  for await (const doc of cursor) {
    const html = doc?.scrapedContent?.contentHtml || "";
    const parsed = parseLastDateFromHtml(html);

    if (parsed) {
      promises.push(
        JobPost.updateOne({ _id: doc._id }, { $set: { applyLastDate: parsed } })
      );
      updated++;
    } else {
      skipped++;
    }

    if (promises.length >= BATCH_SIZE) {
      await Promise.all(promises.splice(0, BATCH_SIZE));
      batch++;
      console.log(`Batch ${batch} done — updated so far: ${updated}, skipped: ${skipped}`);
    }
  }

  if (promises.length) {
    await Promise.all(promises);
    console.log(`Final batch done — updated: ${updated}, skipped: ${skipped}`);
  }

  console.log(`\nDone. Total updated: ${updated} | Could not parse: ${skipped}`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
