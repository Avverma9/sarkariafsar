import axios from "axios";
import * as cheerio from "cheerio";

const clean = (t) => String(t || "").replace(/\s+/g, " ").trim();

const STOP_TITLES = new Set([
  "privacy policy",
  "disclaimer",
  "contact",
  "contact us",
  "sarkari result",
  "sarkari exam",
  "rojgar result",
  "about",
  "about us",
  'home',
  "site map",
  "sitemap",
  "dmca",
  "terms",
  "terms & conditions",
  "terms and conditions",
  "refund",
  "cancellation",
]);

const STOP_URL_PARTS = [
  "privacy",
  "disclaimer",
  'home',
  "contact",
  "about",
  "site-map",
  "sitemap",
  "terms",
  "dmca",
  "refund",
  "cancellation",
];

function normalizeTitle(title) {
  const t = clean(title);
  // long website titles like "Rojgar Result | RojgarResult.Com"
  if (t.length > 35 && (t.includes("|") || t.toLowerCase().includes(".com"))) return "";
  return t;
}

function isStopLink(title, url) {
  const t = (title || "").toLowerCase();
  if (STOP_TITLES.has(t)) return true;

  const u = (url || "").toLowerCase();
  return STOP_URL_PARTS.some((p) => u.includes(p));
}

function canonicalTitle(title) {
  return (title || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace("latest jobs", "latest job")
    .replace("answer keys", "answer key")
    .replace("exam result", "result")
    .replace("latest form", "recruitment");
}

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    timeout: 25000,
    maxRedirects: 5,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return data;
}

/**
 * Scrape sections (menu/categories) from homepage
 */
export async function scrapeSectionsFromSite(siteUrl) {
  const html = await fetchHTML(siteUrl);
  const $ = cheerio.load(html);

  // Most common menu selectors (works on many portals)
  const selectors = [
    "nav a",
    "header a",
    ".menu a",
    ".navbar a",
    ".top-menu a",
    ".main-menu a",
    "#menu a",
    ".header a",
    ".navigation a",
    ".nav a",
  ];

  const baseHost = new URL(siteUrl).hostname.replace("www.", "");
  const map = new Map();

  for (const sel of selectors) {
    $(sel).each((_, a) => {
      let title = normalizeTitle($(a).text());
      let href = $(a).attr("href");

      if (!title || !href) return;
      if (href.startsWith("#") || href.startsWith("javascript:")) return;

      // build absolute URL
      try {
        href = new URL(href, siteUrl).toString();
      } catch {
        return;
      }

      // keep same domain only
      try {
        const host = new URL(href).hostname.replace("www.", "");
        if (host !== baseHost) return;
      } catch {
        return;
      }

      // filter junk
      if (isStopLink(title, href)) return;

      const key = `${canonicalTitle(title)}|${new URL(href).pathname.replace(/\/+$/, "")}`;
      if (!map.has(key)) {
        map.set(key, { title: clean(title), url: href });
      }
    });

    // No hard limit: scan all configured selectors for max coverage.
  }

  // Dedupe "Home" (keep one)
  const list = Array.from(map.values());
  const out = [];
  let homeAdded = false;

  for (const item of list) {
    const t = item.title.toLowerCase();
    if (t === "home") {
      if (homeAdded) continue;
      homeAdded = true;
    }
    out.push(item);
  }

  // Optional: remove Home completely (uncomment if you don't want Home)
  // return out.filter(s => s.title.toLowerCase() !== "home");

  return out;
}
