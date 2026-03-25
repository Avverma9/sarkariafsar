const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const JobSection = require("../models/postsection");
const { scrapeSections } = require("./fetchSection");
const { saveOrPatchJobPost } = require("./saveJobPost");

const router = express.Router();

const BASE_URL = "https://sarkariresult.com.cm";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const SKIP_SECTION_TITLES = new Set([
  "Latest Posts",
  "Related Posts",
  "Important Question",
]);

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

function isNoiseText(value = "") {
  const text = cleanText(value).toLowerCase();
  if (!text) return true;

  const noisePatterns = [
    "join our whatsapp channel",
    "join our telegram channel",
    "follow now",
    "sarkariresult.com.cm",
    "you may also check",
    "click here",
    "link activate soon",
    "link activate on",
    "download sarkariresult app",
    "whatsapp channel",
    "telegram channel",
    "latest posts",
    "related posts",
    "adsbygoogle",
    "disclaimer:",
    ".social-buttons",
    ".social-button",
  ];

  return noisePatterns.some((pattern) => text.includes(pattern));
}

function isUsefulContentLink(link = {}) {
  const label = cleanText(link.label).toLowerCase();
  const url = absoluteUrl(link.url || "");

  if (!url) return false;
  if (/whatsapp\.com|t\.me|telegram|facebook|instagram|youtube/i.test(url)) {
    return false;
  }
  if (/\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)) {
    return false;
  }

  const usefulPatterns = [
    "apply",
    "download",
    "admit card",
    "official website",
    "official site",
    "notification",
    "result",
    "answer key",
    "syllabus",
    "click here",
    "login",
    "registration",
    "exam city",
    "correction",
    "notice",
    "schedule",
    "merit list",
    "shortlist",
    "city",
    "selection list",
  ];

  if (usefulPatterns.some((pattern) => label.includes(pattern))) {
    return true;
  }

  if (
    label === "click here" &&
    (/\.pdf($|\?)/i.test(url) ||
      /nta|nic\.in|gov\.in|railway|rrb|upsc|ssc|bpsc|bank|exam/i.test(url))
  ) {
    return true;
  }

  return false;
}

function sanitizeText(value = "") {
  const cleaned = cleanText(value)
    .replace(/sarkariresult\.com\.cm/gi, "")
    .replace(/join our whatsapp channel/gi, "")
    .replace(/join our telegram channel/gi, "")
    .replace(/follow now/gi, "")
    .replace(/you may also check\s*:?/gi, "")
    .replace(/\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);?/gi, "")
    .replace(/\.social-buttons\s*\{[^}]*\}/gi, "")
    .replace(/\.social-button\s*\{[^}]*\}/gi, "")
    .replace(/\.whatsapp\s*\{[^}]*\}/gi, "")
    .replace(/\.telegram\s*\{[^}]*\}/gi, "")
    .replace(/\.icon\s*\{[^}]*\}/gi, "")
    .replace(/disclaimer\s*:\s*information regarding[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
}

function absoluteUrl(url = "") {
  if (!url) return "";
  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return url;
  }
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

function buildCandidateNames(jobSection) {
  return [
    jobSection.name,
    jobSection.canonicalUrl,
    ...(Array.isArray(jobSection.aliases) ? jobSection.aliases : []),
  ]
    .map((item) => cleanText(item))
    .filter(Boolean);
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

async function resolveSectionForPostUrl(postUrl) {
  const scrapedSections = await scrapeSections();
  let matchedScrapedSection = null;

  for (const section of scrapedSections) {
    if (postUrl.startsWith(section.sectionUrl)) {
      matchedScrapedSection = section;
      break;
    }
  }

  if (!matchedScrapedSection) {
    const normalizedUrl = absoluteUrl(postUrl);
    const urlPath = new URL(normalizedUrl).pathname.replace(/^\/+|\/+$/g, "");

    for (const section of scrapedSections) {
      const sectionPath = new URL(section.sectionUrl).pathname.replace(/^\/+|\/+$/g, "");
      if (urlPath && sectionPath && urlPath.includes(sectionPath)) {
        matchedScrapedSection = section;
        break;
      }
    }
  }

  if (!matchedScrapedSection) {
    return {
      sectionName: "",
      sectionCanonicalUrl: "",
      sourceSectionName: "",
      sourceSectionUrl: "",
    };
  }

  const activeSections = await JobSection.find({ status: "active" });
  let bestMatch = null;
  let bestScore = 0;

  for (const jobSection of activeSections) {
    const score = scoreSectionMatch(matchedScrapedSection, buildCandidateNames(jobSection));
    if (score > bestScore) {
      bestScore = score;
      bestMatch = jobSection;
    }
  }

  if (!bestMatch) {
    return {
      sectionName: matchedScrapedSection.sectionName,
      sectionCanonicalUrl: "",
      sourceSectionName: matchedScrapedSection.sectionName,
      sourceSectionUrl: matchedScrapedSection.sectionUrl,
    };
  }

  await JobSection.updateOne(
    { _id: bestMatch._id },
    {
      $set: {
        sourceSectionName: matchedScrapedSection.sectionName,
        sourceSectionUrl: matchedScrapedSection.sectionUrl,
      },
    }
  );

  return {
    sectionName: bestMatch.name,
    sectionCanonicalUrl: bestMatch.canonicalUrl,
    sourceSectionName: matchedScrapedSection.sectionName,
    sourceSectionUrl: matchedScrapedSection.sectionUrl,
  };
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function uniqueBy(items, getKey) {
  const seen = new Set();
  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function preferDescriptiveLinks(links = []) {
  return [...links].sort((left, right) => {
    const leftGeneric = ["click here", "some useful important links"].includes(
      cleanText(left.label).toLowerCase()
    );
    const rightGeneric = ["click here", "some useful important links"].includes(
      cleanText(right.label).toLowerCase()
    );

    if (leftGeneric === rightGeneric) return 0;
    return leftGeneric ? 1 : -1;
  });
}

function normalizeListItems(list = []) {
  const normalized = [];

  list.forEach((item) => {
    if (typeof item === "string") {
      normalized.push(cleanText(item));
      return;
    }

    if (item && typeof item === "object") {
      normalized.push({
        text: cleanText(item.text),
        items: uniqueBy(
          (item.items || []).map((child) => cleanText(child)).filter(Boolean),
          (child) => child
        ),
      });
    }
  });

  const uniqueItems = uniqueBy(
    normalized.filter(Boolean),
    (item) =>
      typeof item === "string"
        ? `text:${item}`
        : `group:${item.text}|${(item.items || []).join("|")}`
  );

  const groupedChildren = new Set(
    uniqueItems
      .filter((item) => item && typeof item === "object")
      .flatMap((item) => item.items || [])
  );

  return uniqueItems.filter((item) => {
    if (typeof item !== "string") return true;
    return !groupedChildren.has(item);
  });
}

function normalizeTables(tables = []) {
  return tables
    .map((table) => {
      const headings = (table.headings || []).map((heading) => cleanText(heading)).filter(Boolean);
      const rows = (table.rows || [])
        .map((row) => {
          if (Array.isArray(row)) {
            return row.map((cell) => cleanText(cell)).filter(Boolean);
          }

          if (row && typeof row === "object") {
            return Object.fromEntries(
              Object.entries(row)
                .map(([key, value]) => [cleanText(key), cleanText(value)])
                .filter(([key, value]) => key || value)
            );
          }

          return row;
        })
        .filter((row) => {
          if (Array.isArray(row)) {
            const rowText = row.join(" ");
            return (
              row.length &&
              !isNoiseText(rowText) &&
              !/important question/i.test(rowText)
            );
          }

          const rowText = Object.values(row || {}).join(" ");
          return (
            Object.keys(row || {}).length &&
            !isNoiseText(rowText) &&
            !/important question/i.test(rowText)
          );
        });

      return { headings, rows };
    })
    .filter((table) => table.headings.length || table.rows.length);
}

function renderListHtml(list = []) {
  if (!list.length) return "";

  const itemsHtml = list
    .map((item) => {
      if (typeof item === "string") {
        return `<li>${escapeHtml(item)}</li>`;
      }

      const nested = (item.items || [])
        .map((child) => `<li>${escapeHtml(child)}</li>`)
        .join("");

      return `<li>${escapeHtml(item.text)}${nested ? `<ul>${nested}</ul>` : ""}</li>`;
    })
    .join("");

  return `<ul>${itemsHtml}</ul>`;
}

function renderTableHtml(table) {
  const hasObjectRows = table.rows.some(
    (row) => row && !Array.isArray(row) && typeof row === "object"
  );

  if (hasObjectRows) {
    const headings = table.headings.length
      ? table.headings
      : Object.keys(table.rows.find((row) => row && typeof row === "object") || {});

    const headHtml = headings.length
      ? `<thead><tr>${headings
          .map((heading) => `<th>${escapeHtml(heading)}</th>`)
          .join("")}</tr></thead>`
      : "";

    const bodyHtml = table.rows
      .map((row) => {
        const cells = headings.map((heading) => `<td>${escapeHtml(row[heading] || "")}</td>`).join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    return `<table>${headHtml}<tbody>${bodyHtml}</tbody></table>`;
  }

  const rowsHtml = table.rows
    .map(
      (row) =>
        `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`
    )
    .join("");

  return `<table>${rowsHtml}</table>`;
}

function renderLinksHtml(links = []) {
  if (!links.length) return "";

  const rowsHtml = links
    .map(
      (link) =>
        `<tr><td>${escapeHtml(link.label || "Important Link")}</td><td><a href="${escapeHtml(
          link.url
        )}" target="_blank" rel="noopener noreferrer">Click Here</a></td></tr>`
    )
    .join("");

  return `<table><tbody>${rowsHtml}</tbody></table>`;
}

function buildSectionContentHtml(section) {
  const textHtml = section.text ? `<p>${escapeHtml(section.text)}</p>` : "";
  const listHtml = renderListHtml(section.list || []);
  const tablesHtml = (section.tables || []).map(renderTableHtml).join("");
  const linksHtml = renderLinksHtml(section.links || []);

  return [textHtml, listHtml, tablesHtml, linksHtml].filter(Boolean).join("");
}

function formatPostDetail(detail) {
  const normalizedSections = detail.sections
    .map((section) => ({
      title: cleanText(section.title),
      text:
        cleanText(section.title).toLowerCase().includes("important links")
          ? ""
          : isNoiseText(section.text)
          ? ""
          : sanitizeText(section.text),
      list: normalizeListItems(section.list).filter((item) => {
        if (cleanText(section.title).toLowerCase().includes("important links")) {
          return false;
        }
        if (typeof item === "string") return !isNoiseText(item);
        return !isNoiseText(item.text);
      }),
      tables: normalizeTables(section.tables),
      links: uniqueBy(
        preferDescriptiveLinks(
          (section.links || [])
            .map((link) => ({
              rawLabel: cleanText(link.label),
              url: absoluteUrl(link.url),
            }))
            .filter((link) => {
              if (!isUsefulContentLink({ label: link.rawLabel, url: link.url })) return false;
              if (
                /sarkariresult\.com\.cm/i.test(link.url) &&
                !/wp-content\/uploads/i.test(link.url) &&
                cleanText(section.title).toLowerCase().includes("important links")
              ) {
                return false;
              }
              return (
                !isNoiseText(link.rawLabel) ||
                cleanText(section.title).toLowerCase().includes("important links")
              );
            })
            .map((link) => ({
              label:
                cleanText(link.rawLabel).toLowerCase() === "click here" &&
                cleanText(section.title)
                  ? cleanText(section.title)
                  : cleanText(link.rawLabel),
              url: link.url,
            }))
        ),
        (link) => link.url
      ),
    }))
    .filter((section) => {
      if (!section.title || isNoiseText(section.title) || section.title.toLowerCase() === "click here") {
        return false;
      }

      return Boolean(
        section.text ||
        section.list.length ||
        section.tables.length ||
        section.links.length
      );
    });

  const sectionsHtml = normalizedSections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.title)}</h2>${buildSectionContentHtml(section)}`
    )
    .join("");

  return `<div class='job-post-content'><h1>${escapeHtml(detail.title || "Job Post")}</h1>${sectionsHtml}</div>`;
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: 30000,
    maxRedirects: 5,
  });

  return response.data;
}

function extractPostMeta($) {
  const canonicalUrl =
    $('link[rel="canonical"]').attr("href") ||
    $('meta[property="og:url"]').attr("content") ||
    "";

  return {
    title: cleanText($("h1").first().text()),
    canonicalUrl: absoluteUrl(canonicalUrl),
    postDate: cleanText(
      $('meta[property="article:published_time"]').attr("content") ||
        $('meta[property="article:modified_time"]').attr("content") ||
        $(".inside-article").find("time").first().text() ||
        $("h1").first().nextAll("p").first().text()
    ),
    featuredImage:
      $('meta[property="og:image"]').attr("content") ||
      $(".inside-article img, article img").first().attr("src") ||
      "",
    description:
      $('meta[name="description"]').attr("content") ||
      $('meta[property="og:description"]').attr("content") ||
      "",
  };
}

function extractListData($, root) {
  const entries = [];

  const listItems = root.is("ul, ol")
    ? root.children("li")
    : root.find("> ul > li, > ol > li");

  listItems.each((_, li) => {
    const liNode = $(li);
    const nested = [];

    liNode.find("> ul > li, > ol > li").each((__, childLi) => {
      const childText = cleanText($(childLi).text());
      if (childText) nested.push(childText);
    });

    const text = cleanText(
      liNode
        .clone()
        .find("ul, ol")
        .remove()
        .end()
        .text()
    );

    if (text) {
      entries.push(nested.length ? { text, items: nested } : text);
    }
  });

  return entries;
}

function extractTabularData($, table) {
  const rows = [];
  const headings = [];

  table.find("tr").each((rowIndex, tr) => {
    const cells = $(tr)
      .find("th, td")
      .map((_, cell) => cleanText($(cell).text()))
      .get()
      .filter(Boolean);

    if (!cells.length) return;

    if (rowIndex === 0 && $(tr).find("th").length) {
      headings.push(...cells);
      return;
    }

    if (headings.length && cells.length === headings.length) {
      const rowObject = {};
      headings.forEach((heading, index) => {
        rowObject[heading] = cells[index] || "";
      });
      rows.push(rowObject);
      return;
    }

    rows.push(cells);
  });

  return {
    headings,
    rows,
  };
}

function extractLinksFromTableRows($, table) {
  const links = [];

  table.find("tr").each((_, tr) => {
    const cells = $(tr).find("th, td");
    if (cells.length < 2) return;

    const label = cleanText($(cells[0]).text());
    if (!label) return;

    $(cells[cells.length - 1])
      .find("a[href]")
      .each((__, anchor) => {
        const url = absoluteUrl($(anchor).attr("href"));
        if (!url) return;

        links.push({ label, url });
      });
  });

  return links;
}

function extractContentSections($) {
  const sections = [];
  const article = $("article").first();
  const contentRoot = article.find(".entry-content").first().length
    ? article.find(".entry-content").first()
    : article.length
    ? article
    : $("body");

  contentRoot.find("h2, h3, h4, h5, h6").each((_, heading) => {
    const headingNode = $(heading);
    const title = cleanText(headingNode.text());
    if (!title) return;

    const normalizedTitle = title.toLowerCase();
    if ([...SKIP_SECTION_TITLES].some((skip) => normalizedTitle.includes(skip.toLowerCase()))) {
      return;
    }

    const section = {
      title,
      text: "",
      html: "",
      list: [],
      tables: [],
      links: [],
    };

    const parts = [];
    let cursor = headingNode.next();

    while (cursor.length) {
      if (/^h[2-6]$/i.test(cursor[0].tagName)) break;

      const html = $.html(cursor);
      if (html) parts.push(html);

      if (cursor.is("a[href]")) {
        const label = cleanText(cursor.text()) || cleanText(cursor.attr("title"));
        const url = absoluteUrl(cursor.attr("href"));
        if (url) {
          section.links.push({ label, url });
        }
      }

      cursor.find("a[href]").each((__, anchor) => {
        const label = cleanText($(anchor).text()) || cleanText($(anchor).attr("title"));
        const url = absoluteUrl($(anchor).attr("href"));
        if (url) {
          section.links.push({ label, url });
        }
      });

      if (cursor.is("ul, ol")) {
        section.list.push(...extractListData($, cursor));
      }

      if (cursor.find("ul, ol").length) {
        cursor.find("ul, ol").each((__, listNode) => {
          section.list.push(...extractListData($, $(listNode)));
        });
      }

      if (cursor.is("table")) {
        section.tables.push(extractTabularData($, cursor));
        section.links.push(...extractLinksFromTableRows($, cursor));
      }

      if (cursor.find("table").length) {
        cursor.find("table").each((__, tableNode) => {
          const tableWrapper = $(tableNode);
          section.tables.push(extractTabularData($, tableWrapper));
          section.links.push(...extractLinksFromTableRows($, tableWrapper));
        });
      }

      cursor = cursor.next();
    }

    section.html = parts.join("\n");
    section.text = cleanText(cheerio.load(`<div>${section.html}</div>`).text());
    section.links = section.links.filter(
      (link, index, array) =>
        link.url &&
        array.findIndex(
          (candidate) => candidate.url === link.url && candidate.label === link.label
        ) === index
    );

    if (section.text || section.list.length || section.tables.length || section.links.length) {
      sections.push(section);
    }
  });

  return sections;
}

async function scrapePostDetail(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  return {
    sourceUrl: absoluteUrl(url),
    ...extractPostMeta($),
    rawHtml: $("article").first().html() || $(".inside-article").first().html() || "",
    sections: extractContentSections($),
  };
}

router.get("/sarkariresult/post-detail", async (req, res, next) => {
  try {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: "Query param 'url' is required",
      });
    }

    const detail = await scrapePostDetail(targetUrl);
    if (!isSupportedPostYear({ title: detail.title, sourceUrl: detail.sourceUrl })) {
      return res.status(400).json({
        success: false,
        message: "Only 2025 and 2026 posts are supported for scraping",
      });
    }
    const formatted = formatPostDetail(detail);
    const resolvedSection = await resolveSectionForPostUrl(detail.sourceUrl);
    const { action, similarity, savedPost } = await saveOrPatchJobPost({
      title: detail.title,
      slug: generateStableSlugFromUrl(detail.sourceUrl, detail.title),
      sourceUrl: detail.sourceUrl,
      sectionName: resolvedSection.sectionName,
      sectionCanonicalUrl: resolvedSection.sectionCanonicalUrl,
      sourceSectionName: resolvedSection.sourceSectionName,
      sourceSectionUrl: resolvedSection.sourceSectionUrl,
      formattedHtml: formatted,
    });

    return res.status(200).json({
      success: true,
      message: "Post detail scraped successfully",
      data: {
        slug: savedPost.slug,
        sectionName: resolvedSection.sectionName,
        sourceUrl: detail.sourceUrl,
        sectionCanonicalUrl: resolvedSection.sectionCanonicalUrl,
        formattedHtml: formatted,
        updatedAt: savedPost.updatedAt,
        saveAction: action,
        similarity,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  router,
  formatPostDetail,
  resolveSectionForPostUrl,
  scrapePostDetail,
};
