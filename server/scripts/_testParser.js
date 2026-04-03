const { scrapePostDetail, formatPostDetail } = require('../scrapper/singlePostScrape');
const { convertToMeaningfulJSON } = require('../scrapper/fetchAllBySection');
const { buildFullPayload } = require('../utils/buildFullPayload');

(async function() {
  const url = 'https://sarkariresult.com.cm/bihar-police-csbc-constable-operator-2026/';
  const detail = await scrapePostDetail(url);
  const html = formatPostDetail(detail);
  const meaningfulData = convertToMeaningfulJSON(html);

  console.log("=== Parser Output ===");
  console.log(JSON.stringify(meaningfulData, null, 2));

  const slug = 'bihar-police-csbc-constable-operator-2026';
  const enriched = buildFullPayload(meaningfulData, {
    title: detail.title || meaningfulData.postTitle,
    slug,
    sourceUrl: url,
    sectionName: 'Latest Gov Job',
    sectionCanonicalUrl: 'latest-gov-job',
    formattedHtml: html,
  });

  console.log("\n=== DB Payload ($set) ===");
  console.log(JSON.stringify(enriched, null, 2));
})().catch(function(e) { console.error(e.message); });
