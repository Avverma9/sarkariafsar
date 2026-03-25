const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const JobSection = require("../models/postsection");
const { scrapeSections } = require("./fetchSection");
const { scrapePostDetail, formatPostDetail } = require("./singlePostScrape");
const { saveOrPatchJobPost } = require("./saveJobPost");

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

function extractSupportedYear(value = "") {
  const match = String(value || "").match(/\b(2025|2026)\b/);
  return match ? Number(match[1]) : null;
}

function hasUnsupportedHistoricalYear(value = "") {
  return /\b2024\b/.test(String(value || ""));
}

function isSupportedPostYear({ title = "", sourceUrl = "" } = {}) {
  const combined = `${title} ${sourceUrl}`;
  if (hasUnsupportedHistoricalYear(combined)) return false;
  return extractSupportedYear(combined) !== null;
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

function extractPostLinksFromSectionPage(html, currentSectionUrl) {
  const $ = cheerio.load(html);
  const currentPath = new URL(currentSectionUrl).pathname.replace(/^\/+|\/+$/g, "");
  const posts = [];

  $(".entry-content a[href], .inside-article a[href], main a[href]").each((_, anchor) => {
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

  for (const postLink of postLinks) {
    try {
      const detail = await scrapePostDetail(postLink.sourceUrl);
      if (!isSupportedPostYear({ title: detail.title || postLink.title, sourceUrl: postLink.sourceUrl })) {
        continue;
      }
      const formattedHtml = formatPostDetail(detail);
      const { action, similarity, savedPost } = await saveOrPatchJobPost({
        title: detail.title || postLink.title,
        slug: generateStableSlugFromUrl(postLink.sourceUrl, detail.title || postLink.title),
        sourceUrl: postLink.sourceUrl,
        sectionName: jobSection.name,
        sectionCanonicalUrl: jobSection.canonicalUrl,
        sourceSectionName: postLink.sourceSectionName,
        sourceSectionUrl: postLink.sourceSectionUrl,
        formattedHtml,
      });

      posts.push({
        slug: savedPost.slug,
        title: savedPost.title || detail.title || postLink.title,
        sourceUrl: postLink.sourceUrl,
        sectionName: jobSection.name,
        sectionCanonicalUrl: jobSection.canonicalUrl,
        sourceSectionName: postLink.sourceSectionName,
        sourceSectionUrl: postLink.sourceSectionUrl,
        formattedHtml,
        updatedAt: savedPost.updatedAt,
        saveAction: action,
        similarity,
      });
    } catch (error) {
      posts.push({
        slug: generateStableSlugFromUrl(postLink.sourceUrl, postLink.title),
        title: postLink.title,
        sourceUrl: postLink.sourceUrl,
        sectionName: jobSection.name,
        sectionCanonicalUrl: jobSection.canonicalUrl,
        sourceSectionName: postLink.sourceSectionName,
        sourceSectionUrl: postLink.sourceSectionUrl,
        formattedHtml: "",
        scrapeError: error.message,
      });
    }
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
};
