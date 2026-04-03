/**
 * Quick test: load a post by slug, inject human content, print result.
 * Run: node scripts/_testContentInjector.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const JobPost = require("../models/post");
const ContentTemplate = require("../models/contentTemplate");
const { generateHumanContent } = require("../utils/contentInjector");

(async () => {
  await mongoose.connect(process.env.SCRAPPER_MONGO_URI);

  const post = await JobPost.findOne({ slug: /bihar-vidhan-parishad/ }).lean();
  if (!post) {
    console.log("No test post found. Run _testPipeline.js first.");
    return mongoose.disconnect();
  }

  console.log("Post:", post.title);
  console.log("pageType:", post.pageType);
  console.log("language:", post.language);

  const template = await ContentTemplate.findOne({
    pageType: post.pageType,
    language: post.language || "hi",
    active: true,
  });

  if (!template) {
    console.log("No matching template for pageType:", post.pageType);
    return mongoose.disconnect();
  }

  console.log("Template:", template.templateId, `(${template.blocks.length} blocks)\n`);

  const humanContent = generateHumanContent(post, template.blocks, {
    blockCount: 4,
    deterministicSeed: post._id.toString(),
  });

  console.log(`=== GENERATED CONTENT (${humanContent.wordCount} words) ===\n`);

  for (const block of humanContent.blocks) {
    console.log(`--- [${block.type}] ${block.blockId} ---`);
    console.log(block.content);
    console.log();
  }

  // Run again with same seed to verify deterministic
  const second = generateHumanContent(post, template.blocks, {
    blockCount: 4,
    deterministicSeed: post._id.toString(),
  });

  const sameBlocks =
    humanContent.blocks.map((b) => b.blockId).join(",") ===
    second.blocks.map((b) => b.blockId).join(",");
  console.log("Deterministic check (same seed = same blocks):", sameBlocks ? "PASS ✅" : "FAIL ❌");

  mongoose.disconnect();
})();
