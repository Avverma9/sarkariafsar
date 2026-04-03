require("dotenv").config();
const mongoose = require("mongoose");
const JobPost = require("../models/post");
const { pickAndInject, calcCompletenessScore, TEMPLATE_VERSION } = require("../utils/content");

mongoose
  .connect(process.env.SCRAPPER_MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const posts = await JobPost.find({
      $or: [
        { "humanContent.blocks": { $size: 0 } },
        { "humanContent.templateVersion": { $lt: TEMPLATE_VERSION } },
        { "humanContent.templateVersion": { $exists: false } }
      ]
    }).lean();
    console.log(`Posts to backfill (templateVersion < ${TEMPLATE_VERSION} or missing):`, posts.length);

    let ok = 0, skip = 0, fail = 0;
    for (const post of posts) {
      try {
        const hc = pickAndInject(post, 4);
        if (!hc || !hc.blocks.length) {
          skip++;
          continue;
        }
        const score = calcCompletenessScore({ ...post, humanContent: hc });
        await JobPost.findByIdAndUpdate(post._id, { $set: { humanContent: hc, completenessScore: score } });
        ok++;
        if (ok <= 5) {
          console.log(`[OK] ${post.slug} — ${hc.blocks.length} blocks, ${hc.wordCount} words`);
          hc.blocks.forEach((b) => console.log(`     [${b.blockId}] ${b.type}`));
        }
      } catch (e) {
        fail++;
        if (fail <= 3) console.error(`[FAIL] ${post.slug}: ${e.message.slice(0, 100)}`);
      }
    }
    console.log(`\nDone. ok=${ok}  skip=${skip}  fail=${fail}`);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
