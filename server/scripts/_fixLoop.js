const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../scrapper/fetchAllBySection.js');
let c = fs.readFileSync(filePath, 'utf8');

// ── Step 1: Remove everything after module.exports (dangling code) ─────────
const exportsEnd = c.indexOf('\nmodule.exports = {');
const realEnd = c.indexOf('\n};', exportsEnd) + 3; // include the closing };
c = c.slice(0, realEnd);

// ── Step 2: Replace old loop inside scrapePostsBySectionCanonicalUrl ───────
const loopStartMarker = '\n  const posts = [];\n\n  console.log("[DEBUG] Total postLinks';
const loopEndMarker   = '\n  return {\n    sectionName: jobSection.name,';

const loopStart = c.indexOf(loopStartMarker);
const loopEnd   = c.indexOf(loopEndMarker);

if (loopStart === -1 || loopEnd === -1) {
  console.error('Could not find loop markers. loopStart=', loopStart, 'loopEnd=', loopEnd);
  process.exit(1);
}

const newLoop = `
  const posts = [];

  console.log("[DEBUG] Total postLinks to process:", postLinks.length);
  if (postLinks.length === 0) {
    console.log("[DEBUG] No postLinks found — section HTML may have no matching anchors or year filter removed all");
  }

  const scraped = await scrapeWithRateLimit(postLinks, 1500);

  for (const item of scraped) {
    if (item.error) {
      console.error("[DEBUG] Scrape error for:", item.sourceUrl, item.error);
      posts.push({
        slug: generateStableSlugFromUrl(item.sourceUrl, item.title),
        title: item.title,
        sourceUrl: item.sourceUrl,
        sectionName: jobSection.name,
        sectionCanonicalUrl: jobSection.canonicalUrl,
        sourceSectionName: item.sourceSectionName,
        sourceSectionUrl: item.sourceSectionUrl,
        formattedHtml: "",
        scrapeError: item.error,
      });
      continue;
    }

    const detail = item.detail;
    const postTitle = detail.title || item.title;

    if (!isSupportedPostYear({ title: postTitle, sourceUrl: item.sourceUrl })) {
      console.log("[DEBUG] SKIPPED (year filter):", item.sourceUrl);
      continue;
    }

    const formattedHtml = formatPostDetail(detail);
    const meaningfulData = convertToMeaningfulJSON(formattedHtml);
    console.log("Meaningful JSON:", JSON.stringify(meaningfulData, null, 2));

    // const { action, similarity, savedPost } = await saveOrPatchJobPost({
    //   title: postTitle,
    //   slug: generateStableSlugFromUrl(item.sourceUrl, postTitle),
    //   sourceUrl: item.sourceUrl,
    //   sectionName: jobSection.name,
    //   sectionCanonicalUrl: jobSection.canonicalUrl,
    //   sourceSectionName: item.sourceSectionName,
    //   sourceSectionUrl: item.sourceSectionUrl,
    //   formattedHtml,
    // });

    posts.push({
      slug: generateStableSlugFromUrl(item.sourceUrl, postTitle),
      title: postTitle,
      sourceUrl: item.sourceUrl,
      sectionName: jobSection.name,
      sectionCanonicalUrl: jobSection.canonicalUrl,
      sourceSectionName: item.sourceSectionName,
      sourceSectionUrl: item.sourceSectionUrl,
      formattedHtml,
      meaningfulData,
      completenessScore: meaningfulData.completenessScore,
      updatedAt: new Date().toISOString(),
      saveAction: "debug",
      similarity: 0,
    });
  }
`;

c = c.slice(0, loopStart) + newLoop + c.slice(loopEnd);

fs.writeFileSync(filePath, c, 'utf8');
console.log('Loop replaced. File saved.');
