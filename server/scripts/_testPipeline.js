require("dotenv").config();
const mongoose = require("mongoose");
const cheerio = require("cheerio");
const { scrapePostDetail, formatPostDetail } = require("../scrapper/singlePostScrape");
const { saveOrPatchJobPost } = require("../scrapper/saveJobPost");
const { buildFullPayload } = require("../utils/buildFullPayload");
const { enrichPost } = require("../utils/enrichPostAI");
const { downloadOgImage } = require("../utils/downloadOgImage");
const JobPost = require("../models/post");

// Minimal replicate of convertToMeaningfulJSON for test
function convertToMeaningfulJSON(html) {
  const $ = cheerio.load(html);
  const result = {
    postTitle: $("h1").first().text().trim(),
    importantDates: {},
    applicationFee: {},
    ageLimit: { min: "", max: "", byCategory: [] },
    vacancyDetails: [],
    selectionProcess: [],
    importantLinks: [],
    faq: [],
  };

  // Extract tables
  $("table").each((_, table) => {
    const allText = $(table).text().toLowerCase();
    const isVacancy = allText.includes("ur") || allText.includes("obc") || allText.includes("post name") || allText.includes("no. of post");
    const isPhysical = allText.includes("height") || allText.includes("chest");
    if (!isVacancy || isPhysical) return;
    const rows = $(table).find("tr");
    if (rows.length < 2) return;
    const headers = $(rows[0]).find("td, th").map((_, td) => $(td).text().trim()).get().filter(Boolean);
    if (headers.length < 2) return;
    rows.each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find("td");
      const entry = {};
      headers.forEach((h, idx) => {
        const val = $(cols[idx]).text().trim();
        if (val) entry[h] = val;
      });
      if (Object.keys(entry).length >= 2) result.vacancyDetails.push(entry);
    });
  });

  // Important dates & fee from ul/li under matching headings
  $("h2, h3").each((_, el) => {
    const hText = $(el).text().toLowerCase();
    const target = hText.includes("important date") ? result.importantDates
      : hText.includes("application fee") ? result.applicationFee : null;
    if (!target) return;
    $(el).nextUntil("h2, h3", "ul").find("li").each((__, li) => {
      const text = $(li).text().trim();
      const colon = text.indexOf(":");
      if (colon !== -1) {
        target[text.slice(0, colon).trim()] = text.slice(colon + 1).trim();
      }
    });
  });

  return result;
}

(async () => {
  await mongoose.connect(process.env.SCRAPPER_MONGO_URI);

  // Delete existing test post
  await JobPost.deleteMany({ slug: /bihar-vidhan-parishad/ });
  console.log("Cleared old data");

  const url = "https://sarkariresult.com.cm/bihar-vidhan-parishad-pa-deo-ldc-steno-2026/";
  const detail = await scrapePostDetail(url);
  const formattedHtml = formatPostDetail(detail);
  const slug = "bihar-vidhan-parishad-pa-deo-ldc-steno-2026";

  // Step 1: Save
  const { action, savedPost } = await saveOrPatchJobPost({
    title: detail.title, slug, sourceUrl: url,
    sectionName: "Admit Card", sectionCanonicalUrl: "recent-admit-cards",
    sourceSectionName: "Admit Card",
    sourceSectionUrl: "https://sarkariresult.com.cm/recent-admit-cards/",
    formattedHtml,
  });
  console.log("Step 1 - Saved:", action);

  // Step 2: buildFullPayload
  const meaningfulData = convertToMeaningfulJSON(formattedHtml);
  const enrichedFields = buildFullPayload(meaningfulData, {
    title: detail.title, slug, sourceUrl: url,
    sectionName: "Admit Card", sectionCanonicalUrl: "recent-admit-cards",
    formattedHtml,
  });
  await JobPost.findByIdAndUpdate(savedPost._id, { $set: enrichedFields });
  console.log("Step 2 - buildFullPayload done");

  // Step 3: AI enrich
  const freshDoc = await JobPost.findById(savedPost._id).lean();
  const aiUpdates = await enrichPost(freshDoc);
  if (Object.keys(aiUpdates).length) {
    await JobPost.findByIdAndUpdate(savedPost._id, { $set: aiUpdates });
    console.log("Step 3 - AI enrich:", Object.keys(aiUpdates).join(", "));
  }

  // Step 4: OG image
  const rawOg = detail.featuredImage || "";
  if (rawOg) {
    const imgUrl = await downloadOgImage(rawOg, slug);
    if (imgUrl) {
      await JobPost.findByIdAndUpdate(savedPost._id, {
        $set: { "seo.ogImage": imgUrl, thumbnail: imgUrl },
      });
      console.log("Step 4 - OG:", imgUrl);
    }
  }

  // Final verification
  const final = await JobPost.findById(savedPost._id).lean();
  console.log("\n======= FINAL DB VERIFICATION =======");
  console.log("1. thumbnail:", final.thumbnail);
  console.log("2. eligibility:", JSON.stringify(final.eligibility, null, 2));
  console.log("3. vacancyTable:", JSON.stringify(final.structured?.vacancyTable, null, 2));
  console.log("4. faq count:", (final.structured?.faq || []).length);
  console.log("   faq:", JSON.stringify(final.structured?.faq?.map(f => f.q)));
  console.log("5. tags:", JSON.stringify(final.tags));
  console.log("6. keywords:", JSON.stringify(final.seo?.keywords));

  mongoose.disconnect();
})();
