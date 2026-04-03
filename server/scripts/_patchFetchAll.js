const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../scrapper/fetchAllBySection.js');
let c = fs.readFileSync(filePath, 'utf8');

// ═══════════════════════════════════════════════════════════════════════════
// FIX 1: Replace hardcoded year filter with dynamic one
// ═══════════════════════════════════════════════════════════════════════════
const oldYearStart = c.indexOf('function extractSupportedYear');
const oldYearEnd = c.indexOf('\nfunction toCanonicalUrl');

if (oldYearStart === -1 || oldYearEnd === -1) {
  console.error('Could not find year filter markers'); process.exit(1);
}

const newYearFilter = `// ─── Dynamic Year Filter ────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 1;

function isSupportedPostYear({ title = "", sourceUrl = "" } = {}) {
  const combined = \`\${title} \${sourceUrl}\`;
  const years = [...combined.matchAll(/\\b(20\\d{2})\\b/g)].map((m) => +m[1]);
  if (!years.length) return true;
  return years.some((y) => y >= MIN_YEAR);
}

`;

c = c.slice(0, oldYearStart) + newYearFilter + c.slice(oldYearEnd);

// ═══════════════════════════════════════════════════════════════════════════
// FIX 2-8: Replace convertToMeaningfulJSON with all helpers
// ═══════════════════════════════════════════════════════════════════════════
const convFuncStart = c.indexOf('function convertToMeaningfulJSON(html) {');
const convFuncEnd = c.indexOf('\nfunction extractPostLinksFromSectionPage');

if (convFuncStart === -1 || convFuncEnd === -1) {
  console.error('Could not find convertToMeaningfulJSON markers'); process.exit(1);
}

const newBlock = `// ─── Section Keyword Variants ─────────────────────────────────
const SECTION_KEYWORDS = {
  importantDates: [
    "important dates", "exam dates", "key dates", "schedule",
    "important date", "exam schedule", "short details",
  ],
  applicationFee: ["application fee", "exam fee", "fee details", "fee payment"],
  ageLimit: ["age limit", "age criteria", "age relaxation"],
  vacancy: [
    "vacancy", "vacancies", "post details", "category wise",
    "recruitment details", "no. of post",
  ],
  selection: ["selection process", "mode of selection", "selection criteria"],
  eligibility: ["eligibility", "qualification", "educational qualification"],
};

function findSectionByKeywords($, keywords) {
  var found = null;
  $("h1, h2, h3").each(function (_, el) {
    var text = $(el).text().toLowerCase().trim();
    if (keywords.some(function (kw) { return text.includes(kw); })) {
      found = $(el);
      return false;
    }
  });
  return found;
}

function deduplicateListItems(items) {
  var seen = new Set();
  return (items || []).filter(function (item) {
    var key = item.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Smart Vacancy Table Detection ───────────────────────────
function extractVacancyTable($) {
  var results = [];
  $("table").each(function (_, table) {
    var allText = $(table).text().toLowerCase();
    var isVacancy =
      allText.includes("ur") || allText.includes("obc") ||
      allText.includes("vacancy") || allText.includes("post name") ||
      allText.includes("no. of post") || allText.includes("total post");
    var isPhysical =
      allText.includes("height") || allText.includes("chest") ||
      allText.includes("weight") || allText.includes("race");
    if (!isVacancy || isPhysical) return;
    var rows = $(table).find("tr");
    if (rows.length < 2) return;
    var headers = $(rows[0]).find("td, th")
      .map(function (_, td) { return $(td).text().trim(); }).get()
      .filter(Boolean);
    if (headers.length < 2) return;
    rows.each(function (i, row) {
      if (i === 0) return;
      var cols = $(row).find("td");
      if (!cols.length) return;
      var entry = {};
      headers.forEach(function (h, idx) {
        var val = $(cols[idx]).text().trim();
        if (val) entry[h] = val;
      });
      if (Object.keys(entry).length >= 2) results.push(entry);
    });
  });
  return results;
}

// ─── Competitor Link Filter ──────────────────────────────────
var BLOCKED_DOMAINS = [
  "sarkariresult.com.cm", "sarkariresult.com", "sarkarinaukri.com",
];

function isOfficialLink(url) {
  try {
    var hostname = new URL(url).hostname.replace("www.", "");
    return !BLOCKED_DOMAINS.some(function (d) { return hostname.includes(d); });
  } catch (_) { return false; }
}

function extractImportantLinks($) {
  var links = [];
  var seen = new Set();
  $("table a[href]").each(function (_, a) {
    var href = $(a).attr("href") || "";
    if (!href || href.includes("javascript") || href.startsWith("#")) return;
    if (!isOfficialLink(href)) return;
    if (seen.has(href)) return;
    seen.add(href);
    var label = $(a).closest("tr").find("td").first().text().trim()
      || $(a).text().trim() || "Link";
    var type = "general";
    var ll = label.toLowerCase();
    if (ll.includes("apply"))              type = "apply";
    else if (ll.includes("admit"))         type = "admit-card";
    else if (ll.includes("result"))        type = "result";
    else if (ll.includes("answer"))        type = "answer-key";
    else if (ll.includes("official"))      type = "official";
    else if (ll.includes("notification") || ll.includes("notice")) type = "notification";
    links.push({ label: label, url: href, type: type });
  });
  return links;
}

// ─── Rate Limiter ────────────────────────────────────────────
function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

async function scrapeWithRateLimit(postLinks, delayMs) {
  var delay = delayMs !== undefined ? delayMs : 1500;
  var results = [];
  for (var i = 0; i < postLinks.length; i++) {
    if (i > 0) await sleep(delay);
    try {
      var detail = await scrapePostDetail(postLinks[i].sourceUrl);
      results.push(Object.assign({}, postLinks[i], { detail: detail, error: null }));
    } catch (err) {
      results.push(Object.assign({}, postLinks[i], { detail: null, error: err.message }));
    }
  }
  return results;
}

// ─── Completeness Score ──────────────────────────────────────
function calcCompletenessScore(data) {
  var d = data || {};
  var checks = [
    !!d.title,
    !!d.slug,
    !!d.metaDescription,
    !!d.conductingAuthority,
    !!d.totalVacancies,
    Object.keys(d.importantDates || {}).length > 0,
    Object.keys(d.applicationFee || {}).length > 0,
    (d.vacancyDetails || []).length > 0,
    (d.faq || []).length > 0,
    (d.importantLinks || []).length > 0,
  ];
  return checks.filter(Boolean).length * 10;
}

// ─── Auto-generate FAQ ──────────────────────────────────────
function autoGenerateFaq(data) {
  var d = data || {};
  var t = d.shortTitle || d.title || "";
  var faq = [];
  if (d.importantDates && d.importantDates["Exam Date"]) {
    faq.push({ q: t + " exam date kya hai?", a: t + " exam " + d.importantDates["Exam Date"] + " ko scheduled hai." });
  }
  if (d.totalVacancies) {
    faq.push({ q: t + " mein total vacancies kitni hain?", a: "Total " + d.totalVacancies + " vacancies hain." });
  }
  if (d.applicationFee && d.applicationFee["For All Category Candidates"]) {
    faq.push({ q: t + " application fee kitni hai?", a: "Application fee " + d.applicationFee["For All Category Candidates"] + " hai." });
  }
  return faq;
}

// ─── Main Parser ─────────────────────────────────────────────
function convertToMeaningfulJSON(html) {
  var $ = cheerio.load(html);

  function getLiUnderH2(keywords) {
    var kwList = Array.isArray(keywords) ? keywords : [keywords];
    var h2 = findSectionByKeywords($, kwList);
    if (!h2 || !h2.length) return [];
    var items = [];
    h2.nextUntil("h2, h3", "ul").find("li").each(function (_, li) {
      items.push($(li).text().trim());
    });
    return deduplicateListItems(items);
  }

  var result = {
    postTitle: $("h1").first().text().trim(),
    totalPost: "",
    importantDates: {},
    applicationFee: {},
    ageLimit: { min: "", max: "", byCategory: [] },
    vacancyDetails: [],
    physicalDetails: [],
    selectionProcess: [],
    importantLinks: [],
    faq: [],
    completenessScore: 0,
  };

  // 1. Total Post
  var totalPostH2 = $("h2").filter(function (_, el) {
    return $(el).text().toLowerCase().includes("total post");
  }).first();
  if (totalPostH2.length) result.totalPost = totalPostH2.next("p").text().trim();

  // 2. Important Dates
  getLiUnderH2(SECTION_KEYWORDS.importantDates).forEach(function (text) {
    var colon = text.indexOf(":");
    if (colon !== -1) {
      var key = text.slice(0, colon).trim();
      var val = text.slice(colon + 1).trim();
      if (key) result.importantDates[key] = val;
    }
  });

  // 3. Application Fee
  getLiUnderH2(SECTION_KEYWORDS.applicationFee).forEach(function (text) {
    var colon = text.indexOf(":");
    if (colon !== -1) {
      var key = text.slice(0, colon).trim();
      var val = text.slice(colon + 1).trim();
      if (key) result.applicationFee[key] = val;
    } else if (text) {
      result.applicationFee[text] = "";
    }
  });

  // 4. Age Limit
  getLiUnderH2(SECTION_KEYWORDS.ageLimit).forEach(function (text) {
    var minMatch = text.match(/Minimum Age\\s*:\\s*(\\d+)/i);
    var maxMatch = text.match(/Maximum Age\\s*:\\s*(\\d+)/i);
    if (minMatch) result.ageLimit.min = minMatch[1] + " Years";
    if (maxMatch && !result.ageLimit.max) result.ageLimit.max = maxMatch[1] + " Years";
    result.ageLimit.byCategory.push(text);
  });

  // 5. Vacancy Table
  result.vacancyDetails = extractVacancyTable($);

  // 6. Physical Details Table
  $("table").each(function (_, table) {
    var allText = $(table).text().toLowerCase();
    if (allText.includes("height") || allText.includes("chest")) {
      var rowsData = [];
      $(table).find("tr").each(function (_, row) {
        var cells = $(row).find("td").map(function (_, td) { return $(td).text().trim(); }).get().filter(Boolean);
        if (cells.length) rowsData.push(cells);
      });
      if (rowsData.length > 1) result.physicalDetails = rowsData;
    }
  });

  // 7. Selection Process
  $("ul li").each(function (_, li) {
    var text = $(li).text().trim();
    if (/written exam/i.test(text) || /physical standards/i.test(text) || /document verif/i.test(text) || /medical exam/i.test(text)) {
      if (!result.selectionProcess.includes(text)) result.selectionProcess.push(text);
    }
  });

  // 8. Important Links
  result.importantLinks = extractImportantLinks($);

  // 9. FAQ
  result.faq = autoGenerateFaq({
    title: result.postTitle,
    shortTitle: result.postTitle.split(" ").slice(0, 5).join(" "),
    importantDates: result.importantDates,
    totalVacancies: result.totalPost,
    applicationFee: result.applicationFee,
  });

  // 10. Completeness
  result.completenessScore = calcCompletenessScore({
    title: result.postTitle,
    importantDates: result.importantDates,
    applicationFee: result.applicationFee,
    vacancyDetails: result.vacancyDetails,
    importantLinks: result.importantLinks,
    faq: result.faq,
  });

  return result;
}
`;

c = c.slice(0, convFuncStart) + newBlock + c.slice(convFuncEnd);

// ═══════════════════════════════════════════════════════════════════════════
// FIX 3: Wider link selectors
// ═══════════════════════════════════════════════════════════════════════════
c = c.replace(
  '$(".entry-content a[href], .inside-article a[href], main a[href]")',
  '$(".entry-content a[href], .inside-article a[href], main a[href], article a[href], .post-content a[href], .page-content a[href]")'
);

// ═══════════════════════════════════════════════════════════════════════════
// FIX 7: Replace old scrape loop with rate-limited one
// ═══════════════════════════════════════════════════════════════════════════
const oldLoopStart = c.indexOf('  const posts = [];\n');
const oldLoopEnd = c.indexOf('\n  return {\n    sectionName: jobSection.name,');

if (oldLoopStart === -1 || oldLoopEnd === -1) {
  console.error('Could not find scrape loop markers. start=', oldLoopStart, 'end=', oldLoopEnd);
  process.exit(1);
}

const newLoop = `  const posts = [];
  console.log("[DEBUG] Total postLinks to process:", postLinks.length);

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

c = c.slice(0, oldLoopStart) + newLoop + c.slice(oldLoopEnd);

fs.writeFileSync(filePath, c, 'utf8');
console.log('All 8 critical fixes applied successfully.');
