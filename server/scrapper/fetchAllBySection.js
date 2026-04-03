const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const JobSection = require("../models/postsection");
const { scrapeSections } = require("./fetchSection");
const { scrapePostDetail, formatPostDetail } = require("./singlePostScrape");
const { saveOrPatchJobPost } = require("./saveJobPost");
const { buildFullPayload } = require("../utils/buildFullPayload");
const { enrichPost } = require("../utils/enrichPostAI");
const { downloadOgImage } = require("../utils/downloadOgImage");
const { pickAndInject } = require("../utils/content");
const JobPost = require("../models/post");

const router = express.Router();

const BASE_URL = "https://sarkariresult.com.cm";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

// ─── Dynamic Year Filter ────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 1;

function isSupportedPostYear({ title = "", sourceUrl = "" } = {}) {
  const combined = `${title} ${sourceUrl}`;
  const years = [...combined.matchAll(/\b(20\d{2})\b/g)].map((m) => +m[1]);
  if (!years.length) return true;
  return years.some((y) => y >= MIN_YEAR);
}

function toCanonicalUrl(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateStableSlugFromUrl(url = "", fallback = "") {
  try {
    const pathname = new URL(url).pathname.replace(/^\/+|\/+$/g, "");
    if (pathname) {
      return toCanonicalUrl(pathname);
    }
  } catch {
    // ignore and use fallback
  }

  return toCanonicalUrl(fallback || "post");
}

function absoluteUrl(url = "") {
  if (!url) return "";
  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return url;
  }
}

function buildCandidateNames(jobSection) {
  return [
    jobSection.name,
    jobSection.canonicalUrl,
    ...(Array.isArray(jobSection.aliases) ? jobSection.aliases : []),
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
}

function getAdditionalCandidatesForCanonicalUrl(canonicalUrl = "") {
  const normalized = toCanonicalUrl(canonicalUrl);

  if (normalized === "results") {
    return ["answer key", "answer keys"];
  }

  return [];
}

function scoreSectionMatch(scrapedSection, candidates) {
  const scrapedName = cleanText(scrapedSection.sectionName).toLowerCase();
  const scrapedCanonical = toCanonicalUrl(scrapedSection.sectionName);

  let score = 0;

  for (const candidate of candidates) {
    const normalized = cleanText(candidate).toLowerCase();
    const candidateCanonical = toCanonicalUrl(candidate);

    if (scrapedName === normalized || scrapedCanonical === candidateCanonical) {
      score = Math.max(score, 100);
    } else if (
      scrapedName.includes(normalized) ||
      normalized.includes(scrapedName) ||
      scrapedCanonical.includes(candidateCanonical) ||
      candidateCanonical.includes(scrapedCanonical)
    ) {
      score = Math.max(score, 75);
    }
  }

  return score;
}

async function resolveSectionByCanonicalUrl(canonicalUrl) {
  const normalizedCanonicalUrl = toCanonicalUrl(canonicalUrl);
  const jobSection = await JobSection.findOne({
    canonicalUrl: normalizedCanonicalUrl,
    status: "active",
  });

  if (!jobSection) {
    const error = new Error("Job section not found");
    error.status = 404;
    throw error;
  }

  const scrapedSections = await scrapeSections();
  const candidates = buildCandidateNames(jobSection);

  let bestMatch = null;
  let bestScore = 0;

  for (const section of scrapedSections) {
    const score = scoreSectionMatch(section, candidates);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = section;
    }
  }

  if (!bestMatch) {
    const error = new Error("No matching live section found for this canonicalUrl");
    error.status = 404;
    throw error;
  }

  await JobSection.updateOne(
    { _id: jobSection._id },
    {
      $set: {
        sourceSectionName: bestMatch.sectionName,
        sourceSectionUrl: bestMatch.sectionUrl,
      },
    }
  );

  return {
    jobSection,
    liveSection: bestMatch,
  };
}

async function resolveSectionsByCanonicalUrl(canonicalUrl) {
  const primaryResolution = await resolveSectionByCanonicalUrl(canonicalUrl);
  const normalizedCanonicalUrl = toCanonicalUrl(canonicalUrl);
  const scrapedSections = await scrapeSections();
  const extraCandidates = getAdditionalCandidatesForCanonicalUrl(normalizedCanonicalUrl);

  const liveSections = [primaryResolution.liveSection];

  if (extraCandidates.length) {
    for (const scrapedSection of scrapedSections) {
      const sectionName = cleanText(scrapedSection.sectionName).toLowerCase();
      const sectionCanonical = toCanonicalUrl(scrapedSection.sectionName);
      const isExtraMatch = extraCandidates.some((candidate) => {
        const normalizedCandidate = cleanText(candidate).toLowerCase();
        const canonicalCandidate = toCanonicalUrl(candidate);

        return (
          sectionName === normalizedCandidate ||
          sectionCanonical === canonicalCandidate ||
          sectionName.includes(normalizedCandidate) ||
          normalizedCandidate.includes(sectionName)
        );
      });

      if (!isExtraMatch) continue;

      const alreadyIncluded = liveSections.some(
        (section) => absoluteUrl(section.sectionUrl) === absoluteUrl(scrapedSection.sectionUrl)
      );

      if (!alreadyIncluded) {
        liveSections.push(scrapedSection);
      }
    }
  }

  return {
    jobSection: primaryResolution.jobSection,
    liveSections,
  };
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: 30000,
    maxRedirects: 5,
  });

  return response.data;
}

function isValidPostPath(pathname = "") {
  const normalized = pathname.replace(/^\/+|\/+$/g, "");
  if (!normalized) return false;

  const blockedPaths = new Set([
    "",
    "latest-jobs",
    "result",
    "admit-card",
    "answer-key",
    "admission",
    "syllabus",
    "contact",
    "privacy-policy",
    "disclaimer",
    "latest-posts",
  ]);

  return !blockedPaths.has(normalized);
}

function isValidPostTitle(title = "") {
  const text = cleanText(title);
  if (!text || text.length < 12) return false;

  const blockedPatterns = [
    "let’s update",
    "lets update",
    "sarkari result",
    "परीक्षा",
    "home",
    "contact us",
    "privacy policy",
    "disclaimer",
    "latest job",
    "admit card",
    "result",
    "answer key",
    "syllabus",
  ];

  return !blockedPatterns.includes(text.toLowerCase());
}

// ─── Section Keyword Variants ─────────────────────────────────
const SECTION_KEYWORDS = {
  importantDates: [
    "important dates", "exam dates", "key dates", "schedule",
    "important date", "exam schedule",
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
  let found = null;
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    if (keywords.some((kw) => text.includes(kw))) {
      found = $(el);
      return false;
    }
  });
  return found;
}

function deduplicateListItems(items) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = item.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── Smart Vacancy Table Detection ───────────────────────────
function extractVacancyTable($) {
  const results = [];
  $("table").each((_, table) => {
    const allText = $(table).text().toLowerCase();
    const isVacancy =
      allText.includes("ur") || allText.includes("obc") ||
      allText.includes("vacancy") || allText.includes("post name") ||
      allText.includes("no. of post") || allText.includes("total post");
    const isPhysical =
      allText.includes("height") || allText.includes("chest") ||
      allText.includes("weight") || allText.includes("race");
    if (!isVacancy || isPhysical) return;
    const rows = $(table).find("tr");
    if (rows.length < 2) return;
    const headers = $(rows[0]).find("td, th")
      .map((_, td) => $(td).text().trim()).get()
      .filter(Boolean);
    if (headers.length < 2) return;
    rows.each((i, row) => {
      if (i === 0) return;
      const cols = $(row).find("td");
      if (!cols.length) return;
      const entry = {};
      headers.forEach((h, idx) => {
        const val = $(cols[idx]).text().trim();
        if (val) entry[h] = val;
      });
      if (Object.keys(entry).length >= 2) results.push(entry);
    });
  });
  return results;
}

// ─── Competitor Link Filter ──────────────────────────────────
const BLOCKED_DOMAINS = [
  "sarkariresult.com.cm", "sarkariresult.com", "sarkarinaukri.com",
];

function isOfficialLink(url) {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return !BLOCKED_DOMAINS.some((d) => hostname.includes(d));
  } catch (_) { return false; }
}

// Anchor texts that are considered generic / meaningless as a label
const GENERIC_ANCHOR = /^(click\s*here|here|download|link|view|open|check|see|pdf|apply|visit|click|get|official|notice\s*\d*)$/i;

// Clean pipe-wrapped text like "||English||" -> "English"
function cleanAnchorText(text) {
  return text.replace(/^\|+/, '').replace(/\|+$/, '').replace(/\s+/g, ' ').trim();
}

function extractImportantLinks($) {
  const links = [];
  const seen = new Set();

  // Track how many links exist per row label so we can add sub-labels
  $("table a[href]").each((_, a) => {
    const href = $(a).attr("href") || "";
    if (!href || href.includes("javascript") || href.startsWith("#")) return;
    if (!isOfficialLink(href)) return;
    if (seen.has(href)) return;
    seen.add(href);

    const rowLabel = $(a).closest("tr").find("td").first().text().trim();
    const rawAnchorText = cleanAnchorText($(a).text().trim());
    // Use anchor text as a sub-label suffix when it's informative
    const anchorIsUseful = rawAnchorText.length > 2 && !GENERIC_ANCHOR.test(rawAnchorText);

    let label;
    if (!rowLabel) {
      // No row label — use anchor text directly
      label = rawAnchorText || "Link";
    } else if (anchorIsUseful && rawAnchorText.toLowerCase() !== rowLabel.toLowerCase()) {
      // Anchor text adds context — combine: "Download Result — English"
      label = `${rowLabel} — ${rawAnchorText}`;
    } else {
      label = rowLabel;
    }

    let type = "general";
    const ll = label.toLowerCase();
    if (ll.includes("apply"))              type = "apply";
    else if (ll.includes("admit"))         type = "admit-card";
    else if (ll.includes("result"))        type = "result";
    else if (ll.includes("answer"))        type = "answer-key";
    else if (ll.includes("official"))      type = "official";
    else if (ll.includes("notification") || ll.includes("notice")) type = "notification";
    links.push({ label, url: href, type });
  });
  return links;
}

// ─── Rate Limiter ────────────────────────────────────────────
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeWithRateLimit(postLinks, delayMs = 1500) {
  const results = [];
  for (let i = 0; i < postLinks.length; i++) {
    if (i > 0) await sleep(delayMs);
    try {
      const detail = await scrapePostDetail(postLinks[i].sourceUrl);
      results.push({ ...postLinks[i], detail, error: null });
    } catch (err) {
      results.push({ ...postLinks[i], detail: null, error: err.message });
    }
  }
  return results;
}

// ─── Completeness Score ──────────────────────────────────────
function calcCompletenessScore(data) {
  const d = data || {};
  const checks = [
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
  const d = data || {};
  const t = d.shortTitle || d.title || "";
  const faq = [];
  if (d.importantDates && d.importantDates["Exam Date"]) {
    faq.push({ q: `${t} exam date kya hai?`, a: `${t} exam ${d.importantDates["Exam Date"]} ko scheduled hai.` });
  }
  if (d.totalVacancies) {
    faq.push({ q: `${t} mein total vacancies kitni hain?`, a: `Total ${d.totalVacancies} vacancies hain.` });
  }
  if (d.applicationFee && d.applicationFee["For All Category Candidates"]) {
    faq.push({ q: `${t} application fee kitni hai?`, a: `Application fee ${d.applicationFee["For All Category Candidates"]} hai.` });
  }
  return faq;
}

// ─── Main Parser ─────────────────────────────────────────────
function convertToMeaningfulJSON(html) {
  const $ = cheerio.load(html);

  function getLiUnderH2(keywords) {
    const kwList = Array.isArray(keywords) ? keywords : [keywords];
    const h2 = findSectionByKeywords($, kwList);
    if (!h2 || !h2.length) return [];
    const items = [];
    h2.nextUntil("h2, h3", "ul").find("li").each((_, li) => {
      items.push($(li).text().trim());
    });
    return deduplicateListItems(items);
  }

  const result = {
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
  const totalPostH2 = $("h2").filter((_, el) =>
    $(el).text().toLowerCase().includes("total post")
  ).first();
  if (totalPostH2.length) result.totalPost = totalPostH2.next("p").text().trim();

  // 2. Important Dates
  getLiUnderH2(SECTION_KEYWORDS.importantDates).forEach((text) => {
    const colon = text.indexOf(":");
    if (colon !== -1) {
      const key = text.slice(0, colon).trim();
      const val = text.slice(colon + 1).trim();
      if (key) result.importantDates[key] = val;
    }
  });

  // 3. Application Fee
  getLiUnderH2(SECTION_KEYWORDS.applicationFee).forEach((text) => {
    const colon = text.indexOf(":");
    if (colon !== -1) {
      const key = text.slice(0, colon).trim();
      const val = text.slice(colon + 1).trim();
      if (key) result.applicationFee[key] = val;
    } else if (text) {
      result.applicationFee[text] = "";
    }
  });

  // 4. Age Limit
  getLiUnderH2(SECTION_KEYWORDS.ageLimit).forEach((text) => {
    const minMatch = text.match(/Minimum Age\s*:\s*(\d+)/i);
    const maxMatch = text.match(/Maximum Age\s*:\s*(\d+)/i);
    if (minMatch) result.ageLimit.min = minMatch[1] + " Years";
    if (maxMatch && !result.ageLimit.max) result.ageLimit.max = maxMatch[1] + " Years";
    result.ageLimit.byCategory.push(text);
  });

  // 5. Vacancy Table (smart detection)
  result.vacancyDetails = extractVacancyTable($);

  // 6. Physical Details Table
  $("table").each((_, table) => {
    const allText = $(table).text().toLowerCase();
    if (allText.includes("height") || allText.includes("chest")) {
      const rowsData = [];
      $(table).find("tr").each((_, row) => {
        const cells = $(row).find("td").map((_, td) => $(td).text().trim()).get().filter(Boolean);
        if (cells.length) rowsData.push(cells);
      });
      if (rowsData.length > 1) result.physicalDetails = rowsData;
    }
  });

  // 7. Selection Process
  $("ul li").each((_, li) => {
    const text = $(li).text().trim();
    if (/written exam/i.test(text) || /physical standards/i.test(text) || /document verif/i.test(text) || /medical exam/i.test(text)) {
      if (!result.selectionProcess.includes(text)) result.selectionProcess.push(text);
    }
  });

  // 8. Important Links (filtered)
  result.importantLinks = extractImportantLinks($);

  // 9. FAQ (auto-generated)
  result.faq = autoGenerateFaq({
    title: result.postTitle,
    shortTitle: result.postTitle.split(" ").slice(0, 5).join(" "),
    importantDates: result.importantDates,
    totalVacancies: result.totalPost,
    applicationFee: result.applicationFee,
  });

  // 10. Completeness Score
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

function extractPostLinksFromSectionPage(html, currentSectionUrl) {
  const $ = cheerio.load(html);
  const currentPath = new URL(currentSectionUrl).pathname.replace(/^\/+|\/+$/g, "");
  const posts = [];

  $(".entry-content a[href], .inside-article a[href], main a[href], article a[href], .post-content a[href], .page-content a[href]").each((_, anchor) => {
    const href = absoluteUrl($(anchor).attr("href"));
    const title = cleanText($(anchor).text());

    if (!href || !title) return;

    let parsedUrl;
    try {
      parsedUrl = new URL(href);
    } catch {
      return;
    }

    if (parsedUrl.hostname !== "sarkariresult.com.cm") return;
    if (parsedUrl.search || parsedUrl.hash) return;

    const pathname = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    if (!isValidPostPath(pathname) || pathname === currentPath) return;

    if (!isValidPostTitle(title)) {
      return;
    }

    if (!isSupportedPostYear({ title, sourceUrl: parsedUrl.toString() })) {
      return;
    }

    posts.push({
      title,
      sourceUrl: parsedUrl.toString(),
    });
  });

  return posts.filter(
    (post, index, array) =>
      array.findIndex((candidate) => candidate.sourceUrl === post.sourceUrl) === index
  );
}

async function scrapePostsBySectionCanonicalUrl(canonicalUrl, options = {}) {
  const limit = Math.max(Number.parseInt(options.limit || "0", 10) || 0, 0);
  const { jobSection, liveSections } = await resolveSectionsByCanonicalUrl(canonicalUrl);
  const extractedPostLinks = [];

  for (const liveSection of liveSections) {
    const html = await fetchHtml(liveSection.sectionUrl);
    const links = extractPostLinksFromSectionPage(html, liveSection.sectionUrl).map((post) => ({
      ...post,
      sourceSectionName: liveSection.sectionName,
      sourceSectionUrl: liveSection.sectionUrl,
    }));
    extractedPostLinks.push(...links);
  }

  const dedupedPostLinks = extractedPostLinks.filter(
    (post, index, array) =>
      array.findIndex((candidate) => candidate.sourceUrl === post.sourceUrl) === index
  );
  const postLinks = limit > 0 ? dedupedPostLinks.slice(0, limit) : dedupedPostLinks;

  const posts = [];
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

    const postSlug = generateStableSlugFromUrl(item.sourceUrl, postTitle);

    // Step 1: Save/patch (dedup logic untouched)
    const { action, similarity, savedPost } = await saveOrPatchJobPost({
      title: postTitle,
      slug: postSlug,
      sourceUrl: item.sourceUrl,
      sectionName: jobSection.name,
      sectionCanonicalUrl: jobSection.canonicalUrl,
      sourceSectionName: item.sourceSectionName,
      sourceSectionUrl: item.sourceSectionUrl,
      formattedHtml,
    });

    // Step 2: Post-save enrich with structured data (separate $set — zero dedup risk)
    let enrichedFields = null;
    try {
      enrichedFields = buildFullPayload(meaningfulData, {
        title: postTitle,
        slug: postSlug,
        sourceUrl: item.sourceUrl,
        sectionName: jobSection.name,
        sectionCanonicalUrl: jobSection.canonicalUrl,
        formattedHtml,
      });
      await JobPost.findByIdAndUpdate(savedPost._id, { $set: enrichedFields });
      console.log(`[ENRICH] ${action} + enriched: ${postSlug} (score: ${enrichedFields.completenessScore})`);

      // Step 3: Gemini AI enrich (FAQ, SEO keywords, examStrategy)
      try {
        const freshDoc = await JobPost.findById(savedPost._id).lean();
        if (freshDoc) {
          const aiUpdates = await enrichPost(freshDoc);
          if (Object.keys(aiUpdates).length) {
            await JobPost.findByIdAndUpdate(savedPost._id, { $set: aiUpdates });
            console.log(`[AI-ENRICH] ${postSlug}: ${Object.keys(aiUpdates).join(", ")}`);
          }
        }
      } catch (aiErr) {
        console.error(`[AI-ENRICH] Failed for ${postSlug}:`, aiErr.message);
      }

      // Step 4: OG image download → /uploads/og/{slug}.{ext}
      try {
        const rawOgImage = detail?.featuredImage || "";
        if (rawOgImage) {
          const savedImageUrl = await downloadOgImage(rawOgImage, postSlug);
          if (savedImageUrl) {
            await JobPost.findByIdAndUpdate(savedPost._id, {
              $set: {
                "seo.ogImage": savedImageUrl,
                thumbnail: savedImageUrl,
              },
            });
            console.log(`[OG-IMG] Linked to post: ${postSlug}`);
          }
        } else {
          console.log(`[OG-IMG] No image found for: ${postSlug}`);
        }
      } catch (imgErr) {
        console.error(`[OG-IMG] Error for ${postSlug}:`, imgErr.message);
      }

      // Step 5: humanContent — pick blocks from content.js & save
      try {
        const freshDoc = await JobPost.findById(savedPost._id).lean();
        const humanContent = pickAndInject(freshDoc, 4);
        if (humanContent) {
          const { calcCompletenessScore: calcScore } = require("../utils/content");
          const newScore = calcScore({ ...freshDoc, humanContent });
          await JobPost.findByIdAndUpdate(savedPost._id, { $set: { humanContent, completenessScore: newScore } });
          console.log(`[HUMAN-CONTENT] ${postSlug}: ${humanContent.wordCount} words, ${humanContent.blocks.length} blocks, score=${newScore}`);
        }
      } catch (hcErr) {
        console.error(`[HUMAN-CONTENT] Error for ${postSlug}:`, hcErr.message);
      }
    } catch (enrichErr) {
      console.error(`[ENRICH] Failed for ${postSlug}:`, enrichErr.message);
    }

    posts.push({
      slug: postSlug,
      title: postTitle,
      sourceUrl: item.sourceUrl,
      sectionName: jobSection.name,
      sectionCanonicalUrl: jobSection.canonicalUrl,
      sourceSectionName: item.sourceSectionName,
      sourceSectionUrl: item.sourceSectionUrl,
      saveAction: action,
      similarity,
      updatedAt: new Date().toISOString(),
      // Enriched structured data
      shortTitle: enrichedFields?.shortTitle || null,
      summary: enrichedFields?.summary || null,
      pageType: enrichedFields?.pageType || null,
      schemaType: enrichedFields?.schemaType || null,
      conductingAuthority: enrichedFields?.conductingAuthority || null,
      conductingAuthorityFull: enrichedFields?.conductingAuthorityFull || null,
      state: enrichedFields?.state || null,
      location: enrichedFields?.location || null,
      officialWebsite: enrichedFields?.officialWebsite || null,
      dates: enrichedFields?.dates || null,
      totalVacancies: enrichedFields?.totalVacancies || null,
      ageLimit: enrichedFields?.ageLimit || null,
      applicationFee: enrichedFields?.applicationFee || null,
      selectionProcess: enrichedFields?.selectionProcess || null,
      seo: enrichedFields?.seo || null,
      tags: enrichedFields?.tags || null,
      structured: enrichedFields?.structured || null,
      wordCount: enrichedFields?.wordCount || 0,
      readingTimeMin: enrichedFields?.readingTimeMin || 0,
      completenessScore: enrichedFields?.completenessScore || meaningfulData.completenessScore || 0,
    });
  }

  return {
    sectionName: jobSection.name,
    sectionCanonicalUrl: jobSection.canonicalUrl,
    sourceSectionName: liveSections.map((section) => section.sectionName).join(", "),
    sourceSectionUrl: liveSections.map((section) => section.sectionUrl),
    totalPosts: posts.length,
    posts,
  };
}

router.get("/sarkariresult/section-posts/:canonicalUrl", async (req, res, next) => {
  try {
    const { canonicalUrl } = req.params;
    const data = await scrapePostsBySectionCanonicalUrl(canonicalUrl, {
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      message: "Section posts scraped successfully",
      data,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  router,
  resolveSectionByCanonicalUrl,
  resolveSectionsByCanonicalUrl,
  scrapePostsBySectionCanonicalUrl,
  convertToMeaningfulJSON,
};
