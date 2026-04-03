/**
 * Seed content templates into MongoDB.
 * Run: node scripts/seed_templates.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const ContentTemplate = require("../models/contentTemplate");
const templates = require("./templateSeedData");

(async () => {
  await mongoose.connect(process.env.SCRAPPER_MONGO_URI);
  console.log("Connected to MongoDB");

  let created = 0, updated = 0;

  for (const tpl of templates) {
    const existing = await ContentTemplate.findOne({ templateId: tpl.templateId });
    if (existing) {
      await ContentTemplate.updateOne(
        { templateId: tpl.templateId },
        { $set: { blocks: tpl.blocks, version: tpl.version, active: tpl.active } }
      );
      updated++;
      console.log(`  Updated: ${tpl.templateId} (${tpl.blocks.length} blocks)`);
    } else {
      await ContentTemplate.create(tpl);
      created++;
      console.log(`  Created: ${tpl.templateId} (${tpl.blocks.length} blocks)`);
    }
  }

  console.log(`\nDone — ${created} created, ${updated} updated`);
  mongoose.disconnect();
})();
