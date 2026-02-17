import axios from "axios";
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();

function safeAbsUrl(href, base) {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function pickMainContent($) {
  // Best-effort content selectors (covers WP + custom sites)
  const selectors = [
    "article",
    ".entry-content",
    ".post-content",
    ".content",
    "#content",
    "main",
    "body",
  ];

  for (const sel of selectors) {
    const el = $(sel).first();
    if (el && el.length) {
      const textLen = clean(el.text()).length;
      if (textLen > 250) return el; // ensure real content
    }
  }
  return $("body");
}

function extractTables($, rootEl) {
  const tables = [];
  rootEl.find("table").each((i, table) => {
    const rows = [];
    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = [];
        $(tr)
          .find("th, td")
          .each((__, td) => cells.push(clean($(td).text())));
        if (cells.length) rows.push(cells);
      });

    if (rows.length) tables.push({ index: i, rows });
  });
  return tables;
}

function extractLinks($, rootEl, pageUrl) {
  const links = [];
  rootEl.find("a").each((_, a) => {
    const text = clean($(a).text());
    const href = $(a).attr("href");
    const abs = href ? safeAbsUrl(href, pageUrl) : null;
    if (!abs) return;

    // skip junk
    if (abs.startsWith("javascript:") || abs.includes("#")) return;

    links.push({ text, url: abs });
  });

  // de-dupe by url
  const map = new Map();
  for (const l of links) {
    const key = l.url.replace(/\/+$/, "");
    if (!map.has(key)) map.set(key, l);
  }
  return Array.from(map.values());
}

function classifyLinks(links) {
  const applyLinks = [];
  const importantLinks = [];

  for (const l of links) {
    const t = (l.text || "").toLowerCase();
    const u = (l.url || "").toLowerCase();

    // Apply / Registration / Form
    if (
      t.includes("apply") ||
      t.includes("registration") ||
      t.includes("online form") ||
      t.includes("fill form") ||
      u.includes("apply") ||
      u.includes("registration") ||
      u.includes("online")
    ) {
      applyLinks.push(l);
      continue;
    }

    // Notification / PDF / Download / Official
    if (
      t.includes("notification") ||
      t.includes("download") ||
      t.includes("official") ||
      t.includes("pdf") ||
      u.endsWith(".pdf")
    ) {
      importantLinks.push(l);
      continue;
    }
  }

  return {
    applyLinks: applyLinks.slice(0, 20),
    importantLinks: importantLinks.slice(0, 30),
  };
}

function extractDatesFromText(text) {
  const t = (text || "").toLowerCase();

  // Very generic date signals (works across portals)
  const patterns = [
    { key: "lastDate", re: /(last\s*date|last\s*date\s*to\s*apply|closing\s*date)[^a-z0-9]{0,20}([0-9]{1,2}[^0-9a-z]{1,3}[0-9]{1,2}[^0-9a-z]{1,3}[0-9]{2,4})/i },
    { key: "examDate", re: /(exam\s*date)[^a-z0-9]{0,20}([0-9]{1,2}[^0-9a-z]{1,3}[0-9]{1,2}[^0-9a-z]{1,3}[0-9]{2,4})/i },
    { key: "resultDate", re: /(result\s*date)[^a-z0-9]{0,20}([0-9]{1,2}[^0-9a-z]{1,3}[0-9]{1,2}[^0-9a-z]{1,3}[0-9]{2,4})/i },
  ];

  const out = {};
  for (const p of patterns) {
    const m = t.match(p.re);
    if (m?.[2]) out[p.key] = m[2];
  }
  return out;
}

async function fetchHtml(url) {
  const { data } = await axios.get(url, {
    timeout: 30000,
    maxRedirects: 5,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return data;
}

/**
 * Main scraper
 */
export async function scrapePostDetails(postUrl) {
  const html = await fetchHtml(postUrl);
  const $ = cheerio.load(html);

  // Title
  const title =
    clean($("meta[property='og:title']").attr("content")) ||
    clean($("title").text()) ||
    clean($("h1").first().text());

  // Description
  const metaDesc =
    clean($("meta[property='og:description']").attr("content")) ||
    clean($("meta[name='description']").attr("content"));

  const root = pickMainContent($);

  // Remove noisy elements
  root.find("script, style, noscript, iframe").remove();

  const contentText = clean(root.text());
  const contentHtml = root.html() || "";

  const allLinks = extractLinks($, root, postUrl);
  const { applyLinks, importantLinks } = classifyLinks(allLinks);

  const tables = extractTables($, root);

  const dates = extractDatesFromText(contentText);

  // Meta
  const meta = {
    ogTitle: clean($("meta[property='og:title']").attr("content")),
    ogImage: clean($("meta[property='og:image']").attr("content")),
    ogDesc: clean($("meta[property='og:description']").attr("content")),
    canonical: clean($("link[rel='canonical']").attr("href")),
  };

  return {
    title,
    metaDesc,
    sourceUrl: postUrl,
    siteHost: new URL(postUrl).hostname,
    contentText,
    contentHtml,
    applyLinks,
    importantLinks,
    tables,
    dates,
    meta,
  };
}
