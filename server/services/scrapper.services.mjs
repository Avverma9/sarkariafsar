import axios from "axios";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const BLOCKED_PROTOCOL_PREFIXES = ["javascript:", "mailto:", "tel:", "data:", "#"];

const toCleanText = (value = "") => String(value).replace(/\s+/g, " ").trim();

const escapeCssIdentifier = (value = "") =>
  String(value)
    .replace(/\u0000/g, "\uFFFD")
    .replace(/^(-?\d)/, "\\3$1 ")
    .replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1")
    .replace(/\\/g, "\\\\");

const escapeCssAttributeValue = (value = "") =>
  String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

const isHttpUrl = (value = "") => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeHostname = (hostname = "") =>
  String(hostname || "")
    .trim()
    .toLowerCase()
    .replace(/^www\./, "");

const isLocalHostname = (hostname = "") => {
  const normalized = normalizeHostname(hostname);
  if (normalized === "localhost" || normalized === "::1") return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(normalized);
};

const isSameSiteDomain = (sourceUrl, targetUrl) => {
  try {
    const source = new URL(sourceUrl);
    const target = new URL(targetUrl);
    const sourceHost = normalizeHostname(source.hostname);
    const targetHost = normalizeHostname(target.hostname);

    if (!sourceHost || !targetHost) return false;
    if (sourceHost !== targetHost) return false;

    // Local/dev environments should keep port strict for safety.
    if (isLocalHostname(sourceHost) || isLocalHostname(targetHost)) {
      return source.port === target.port;
    }

    return true;
  } catch {
    return false;
  }
};

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;

  const lowered = trimmed.toLowerCase();
  if (BLOCKED_PROTOCOL_PREFIXES.some((prefix) => lowered.startsWith(prefix))) {
    return null;
  }

  try {
    const absolute = new URL(trimmed, baseUrl).toString();
    return isHttpUrl(absolute) ? absolute : null;
  } catch {
    return null;
  }
};

const toDedupeKey = (url) => {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
};

const createRegex = (value) => {
  if (!value) return null;
  if (value instanceof RegExp) return value;
  return new RegExp(String(value), "i");
};

const createRegexList = (values = []) =>
  values
    .map((value) => {
      try {
        return createRegex(value);
      } catch {
        return null;
      }
    })
    .filter(Boolean);

const toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toUniqueArray = (values = []) => {
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const clean = String(value || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
  }

  return output;
};

const hashValue = (value = "") =>
  createHash("sha256").update(String(value || "")).digest("hex");

const normalizePathForHash = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\/+/g, "/")
    .replace(/\/+$/g, "");

  return normalized || "/";
};

const normalizeTextForHash = (value = "") =>
  toCleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const normalizeJobUrlForHash = (url = "") => {
  try {
    const parsed = new URL(url);
    const host = normalizeHostname(parsed.hostname);
    const path = normalizePathForHash(parsed.pathname);
    const params = [...parsed.searchParams.entries()]
      .filter(([key]) => {
        const normalizedKey = String(key || "").toLowerCase();
        if (!normalizedKey) return false;
        if (normalizedKey.startsWith("utm_")) return false;
        if (["fbclid", "gclid", "ref", "source", "from"].includes(normalizedKey)) return false;
        return true;
      })
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${String(key).toLowerCase()}=${String(value || "").trim().toLowerCase()}`);

    return `${host}${path}${params.length > 0 ? `?${params.join("&")}` : ""}`;
  } catch {
    return String(url || "").trim().toLowerCase();
  }
};

const buildJobHashes = ({ jobUrl = "", title = "", lastSegment = "" } = {}) => {
  const normalizedUrl = normalizeJobUrlForHash(jobUrl);
  const normalizedTitle = normalizeTextForHash(title);
  const normalizedSlug = normalizeTextForHash(String(lastSegment || "").replace(/[-_]+/g, " "));

  let normalizedPath = "";
  try {
    normalizedPath = normalizePathForHash(new URL(jobUrl).pathname);
  } catch {
    normalizedPath = normalizePathForHash(lastSegment);
  }

  return [
    hashValue(`url:${normalizedUrl}`),
    hashValue(`path:${normalizedPath}`),
    hashValue(`title_path:${normalizedTitle}|${normalizedPath}`),
    hashValue(`title_slug:${normalizedTitle}|${normalizedSlug}`),
  ];
};

const buildCombinations = (items = [], maxCombinationItems = 12) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  const safeItems = items.filter(Boolean);
  if (safeItems.length === 0) return [];

  if (safeItems.length > maxCombinationItems) {
    return safeItems.map((item) => [item]);
  }

  const combinations = [];
  const total = 1 << safeItems.length;

  for (let mask = 1; mask < total; mask += 1) {
    const current = [];

    for (let index = 0; index < safeItems.length; index += 1) {
      if (mask & (1 << index)) {
        current.push(safeItems[index]);
      }
    }

    combinations.push(current);
  }

  return combinations;
};

const getNthOfType = (element) => {
  const parent = element?.parent;
  if (!parent || !Array.isArray(parent.children)) return 1;

  const tag = String(element.tagName || "").toLowerCase();
  let currentIndex = 0;

  for (const child of parent.children) {
    if (child?.type === "tag" && String(child.tagName || "").toLowerCase() === tag) {
      currentIndex += 1;
      if (child === element) return currentIndex;
    }
  }

  return 1;
};

const buildAbsoluteSelectorPath = (element) => {
  const segments = [];
  let current = element;

  while (current && current.type === "tag") {
    const tag = String(current.tagName || "").toLowerCase();
    const nth = getNthOfType(current);
    segments.unshift(`${tag}:nth-of-type(${nth})`);
    current = current.parent;
  }

  return segments.join(" > ");
};

const buildReadableSelectorPath = (element) => {
  const segments = [];
  let current = element;

  while (current && current.type === "tag") {
    const tag = String(current.tagName || "").toLowerCase();
    const attribs = current.attribs || {};
    const id = attribs.id ? `#${escapeCssIdentifier(attribs.id)}` : "";
    const classes = String(attribs.class || "")
      .split(/\s+/)
      .map((className) => className.trim())
      .filter(Boolean)
      .map((className) => `.${escapeCssIdentifier(className)}`)
      .join("");
    const nth = getNthOfType(current);
    const segment = `${tag}${id || classes || `:nth-of-type(${nth})`}`;
    segments.unshift(segment);
    current = current.parent;
  }

  return segments.join(" > ");
};

const buildXPath = (element) => {
  const segments = [];
  let current = element;

  while (current && current.type === "tag") {
    const tag = String(current.tagName || "").toLowerCase();
    const index = getNthOfType(current);
    segments.unshift(`${tag}[${index}]`);
    current = current.parent;
  }

  return `/${segments.join("/")}`;
};

const collectSelectorsForElement = (element, options = {}) => {
  const { maxCombinationItems = 12 } = options;
  const selectorSet = new Set();
  const tag = String(element.tagName || "").toLowerCase();
  const attributes = element.attribs || {};

  const addSelector = (selector) => {
    if (!selector || typeof selector !== "string") return;
    const cleaned = selector.trim();
    if (!cleaned) return;
    selectorSet.add(cleaned);
  };

  addSelector(tag);

  const id = toCleanText(attributes.id || "");
  if (id) {
    const escapedId = escapeCssIdentifier(id);
    addSelector(`#${escapedId}`);
    addSelector(`${tag}#${escapedId}`);
    addSelector(`[id]`);
    addSelector(`[id="${escapeCssAttributeValue(id)}"]`);
    addSelector(`${tag}[id="${escapeCssAttributeValue(id)}"]`);
  }

  const classes = String(attributes.class || "")
    .split(/\s+/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (classes.length > 0) {
    const escapedClasses = classes.map(escapeCssIdentifier);
    const classCombinations = buildCombinations(escapedClasses, maxCombinationItems);

    for (const combination of classCombinations) {
      const classSelector = `.${combination.join(".")}`;
      addSelector(classSelector);
      addSelector(`${tag}${classSelector}`);
    }

    addSelector("[class]");
    addSelector(`[class="${escapeCssAttributeValue(classes.join(" "))}"]`);
    addSelector(`${tag}[class="${escapeCssAttributeValue(classes.join(" "))}"]`);
  }

  const attributeEntries = Object.entries(attributes);
  if (attributeEntries.length > 0) {
    const presenceSelectors = [];
    const exactSelectors = [];

    for (const [name, rawValue] of attributeEntries) {
      const escapedName = escapeCssIdentifier(name);
      const exactValue = escapeCssAttributeValue(rawValue ?? "");
      presenceSelectors.push(`[${escapedName}]`);
      exactSelectors.push(`[${escapedName}="${exactValue}"]`);
      addSelector(`[${escapedName}]`);
      addSelector(`${tag}[${escapedName}]`);
      addSelector(`[${escapedName}="${exactValue}"]`);
      addSelector(`${tag}[${escapedName}="${exactValue}"]`);
    }

    for (const combination of buildCombinations(presenceSelectors, maxCombinationItems)) {
      const joined = combination.join("");
      addSelector(joined);
      addSelector(`${tag}${joined}`);
    }

    for (const combination of buildCombinations(exactSelectors, maxCombinationItems)) {
      const joined = combination.join("");
      addSelector(joined);
      addSelector(`${tag}${joined}`);
    }
  }

  const nth = getNthOfType(element);
  addSelector(`${tag}:nth-of-type(${nth})`);
  addSelector(buildAbsoluteSelectorPath(element));
  addSelector(buildReadableSelectorPath(element));

  return {
    selectors: Array.from(selectorSet),
    selectorPathAbsolute: buildAbsoluteSelectorPath(element),
    selectorPathReadable: buildReadableSelectorPath(element),
    xpath: buildXPath(element),
  };
};

const fetchHtml = async (url, requestConfig = {}) => {
  const response = await axios.get(url, {
    timeout: 30000,
    headers: DEFAULT_HEADERS,
    responseType: "text",
    transformResponse: [(data) => data],
    ...requestConfig,
  });

  return typeof response.data === "string" ? response.data : String(response.data || "");
};

const inferLabelFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (!lastSegment) return null;

    return decodeURIComponent(lastSegment)
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return null;
  }
};

const DEFAULT_UTILITY_SECTION_PATTERNS = [
  /\babout(\s+us)?\b/i,
  /\bcontact(\s+us)?\b/i,
  /\bprivacy(\s+policy)?\b/i,
  /\bdisclaimer\b/i,
  /\bterms(\s+and\s+conditions?)?\b/i,
  /\bcookie(s)?\b/i,
  /\bsitemap\b/i,
  /\bdmca\b/i,
];

const DEFAULT_JOB_SKIP_PATTERNS = [
  /\bhome\b/i,
  /\bsarkari\s*result\b/i,
  /\blet['’]?\s*s?\s*update\b/i,
  /\blatest\s*job\b/i,
  /\badmit\s*card\b/i,
  /\bresult(s)?\b/i,
  /\badmission(s)?\b/i,
  /\banswer\s*key(s)?\b/i,
  /\bcontact(\s+us)?\b/i,
  /\bprivacy(\s+policy)?\b/i,
  /\bdisclaimer\b/i,
  /\babout(\s+us)?\b/i,
];

const DEFAULT_OLD_ONLINE_FORM_YEARS = [2024, 2025];

const DEFAULT_GENERIC_JOB_PATHS = new Set([
  "home",
  "latest-posts",
  "latest-jobs",
  "admit-card",
  "result",
  "results",
  "admission",
  "answer-key",
  "contact",
  "privacy-policy",
  "disclaimer",
  "about-us",
]);

const getSectionAnchorCandidates = ($, options = {}) => {
  const { navigationOnly = true } = options;

  if (!navigationOnly) {
    return $("a[href]").toArray();
  }

  // Prefer top-level navigation links first to avoid picking article/post links.
  const prioritizedSelectors = [
    'nav .main-nav > ul > li > a[href]',
    'nav .menu > li > a[href]',
    'header nav .main-nav > ul > li > a[href]',
    'header nav .menu > li > a[href]',
    'nav > ul > li > a[href]',
    '.main-navigation a[href]',
    '#site-navigation a[href]',
    'header a[href]',
    'nav a[href]',
  ];

  for (const selector of prioritizedSelectors) {
    const matches = $(selector).toArray();
    if (matches.length > 0) return matches;
  }

  return $("a[href]").toArray();
};

const getJobAnchorCandidates = ($) => {
  const prioritizedSelectors = [
    "main .latest-posts-last-date li > a[href]",
    "main article ul li > a[href]",
    "main article ol li > a[href]",
    "main article h1 a[href], main article h2 a[href], main article h3 a[href], main article h4 a[href]",
    "main h1 a[href], main h2 a[href], main h3 a[href], main h4 a[href]",
    "main a[href]",
    "article a[href]",
  ];

  for (const selector of prioritizedSelectors) {
    const matches = $(selector).toArray();
    if (matches.length > 0) return matches;
  }

  return $("a[href]").toArray();
};

const normalizeYears = (years = []) => {
  const values = toUniqueArray(toStringArray(years));
  const output = [];

  for (const value of values) {
    const year = Number.parseInt(String(value), 10);
    if (Number.isNaN(year)) continue;
    if (year < 1900 || year > 2999) continue;
    output.push(year);
  }

  return output;
};

const shouldSkipOldOnlineForm = ({ title = "", lastSegment = "", years = [] } = {}) => {
  const text = `${title} ${String(lastSegment || "").replace(/[-_]+/g, " ")}`.toLowerCase();
  if (!/\bonline\s*form\b/i.test(text)) return false;
  return years.some((year) => new RegExp(`\\b${year}\\b`, "i").test(text));
};

export const getSiteSections = async ({
  siteUrl,
  siteName = "",
  sectionLinkPattern = null,
  skipSectionPatterns = [],
  internalOnly = true,
  navigationOnly = true,
  excludeHomePath = true,
  excludeUtilityPages = true,
  utilitySectionPatterns = [],
  limit = 0,
  requestConfig = {},
  maxCombinationItems = 12,
} = {}) => {
  if (!siteUrl) {
    throw new Error("siteUrl is required");
  }

  const normalizedSiteUrl = toAbsoluteUrl(siteUrl, siteUrl);
  if (!normalizedSiteUrl) {
    throw new Error("Invalid siteUrl");
  }

  const includePattern = createRegex(sectionLinkPattern);
  const excludePatterns = createRegexList(skipSectionPatterns);
  const utilityPatterns = [
    ...DEFAULT_UTILITY_SECTION_PATTERNS,
    ...createRegexList(utilitySectionPatterns),
  ];
  const html = await fetchHtml(normalizedSiteUrl, requestConfig);
  const $ = cheerio.load(html);

  const basePath = new URL(normalizedSiteUrl).pathname.replace(/\/+$/, "") || "/";
  const sections = [];
  const seen = new Set();

  const anchors = getSectionAnchorCandidates($, { navigationOnly });

  for (const element of anchors) {
    if (limit > 0 && sections.length >= limit) break;

    const $element = $(element);
    const href = $element.attr("href");
    const sectionUrl = toAbsoluteUrl(href, normalizedSiteUrl);
    if (!sectionUrl) continue;

    const parsedSectionUrl = new URL(sectionUrl);
    const sectionPath = parsedSectionUrl.pathname.replace(/\/+$/, "") || "/";

    if (internalOnly && !isSameSiteDomain(normalizedSiteUrl, sectionUrl)) continue;
    if (excludeHomePath && sectionPath === basePath) continue;

    const dedupeKey = toDedupeKey(sectionUrl);
    if (seen.has(dedupeKey)) continue;

    const textLabel = toCleanText($element.text());
    const ariaLabel = toCleanText($element.attr("aria-label"));
    const titleLabel = toCleanText($element.attr("title"));
    const section = textLabel || ariaLabel || titleLabel || inferLabelFromUrl(sectionUrl);
    const textToMatch = `${section || ""} ${sectionUrl}`.trim();

    if (!section) continue;
    if (includePattern && !includePattern.test(textToMatch)) continue;
    if (excludePatterns.some((pattern) => pattern.test(textToMatch))) continue;
    if (excludeUtilityPages && utilityPatterns.some((pattern) => pattern.test(textToMatch)))
      continue;

    seen.add(dedupeKey);

    const selectorMeta = collectSelectorsForElement(element, { maxCombinationItems });

    sections.push({
      siteName: siteName || null,
      section: section || null,
      href: href || null,
      sectionUrl,
      text: section || null,
      attributes: { ...(element.attribs || {}) },
      selectorPathAbsolute: selectorMeta.selectorPathAbsolute,
      selectorPathReadable: selectorMeta.selectorPathReadable,
      xpath: selectorMeta.xpath,
      selectors: selectorMeta.selectors,
    });
  }

  return {
    siteName: siteName || null,
    siteUrl: normalizedSiteUrl,
    pageTitle: toCleanText($("title").first().text()) || null,
    totalSections: sections.length,
    sections,
    fetchedAt: new Date().toISOString(),
  };
};

export const getSectionJobList = async ({
  section = "",
  sectionUrl,
  sectionUrls = [],
  siteName = "",
  jobLinkPattern = null,
  skipLinkPatterns = [],
  strictJobOnly = true,
  skipOldOnlineForms = true,
  skipOnlineFormYears = DEFAULT_OLD_ONLINE_FORM_YEARS,
  limit = 0,
  requestConfig = {},
  maxCombinationItems = 12,
} = {}) => {
  const rawSectionUrls = toUniqueArray([
    ...toStringArray(sectionUrls),
    ...toStringArray(sectionUrl),
  ]);

  if (rawSectionUrls.length === 0) {
    throw new Error("sectionUrl or sectionUrls is required");
  }

  const normalizedSectionUrls = rawSectionUrls
    .map((url) => toAbsoluteUrl(url, url))
    .filter(Boolean);

  if (normalizedSectionUrls.length === 0) {
    throw new Error("Invalid sectionUrl or sectionUrls");
  }

  const includePattern = createRegex(jobLinkPattern);
  const excludePatterns = [
    ...DEFAULT_JOB_SKIP_PATTERNS,
    ...createRegexList(skipLinkPatterns),
  ];
  const yearsToSkip = normalizeYears(skipOnlineFormYears);
  const jobs = [];
  const seen = new Set();
  const seenHashes = new Set();
  let duplicatesRemoved = 0;

  for (const currentSectionUrl of normalizedSectionUrls) {
    if (limit > 0 && jobs.length >= limit) break;

    const html = await fetchHtml(currentSectionUrl, requestConfig);
    const $ = cheerio.load(html);
    const baseSectionPath = new URL(currentSectionUrl).pathname.replace(/\/+$/, "") || "/";
    const anchors = getJobAnchorCandidates($);

    for (const element of anchors) {
      if (limit > 0 && jobs.length >= limit) break;

      const $element = $(element);
      const href = $element.attr("href");
      const jobUrl = toAbsoluteUrl(href, currentSectionUrl);
      if (!jobUrl) continue;

      const parsedJobUrl = new URL(jobUrl);
      const path = parsedJobUrl.pathname.replace(/\/+$/, "") || "/";
      const lastSegment = path.split("/").filter(Boolean).pop() || "";
      const genericPath = lastSegment.toLowerCase();
      const isSameAsSectionPath = path === baseSectionPath;

      const title = toCleanText($element.text());
      const textToMatch = `${title} ${jobUrl}`.trim();
      const excludeTarget = `${title} ${lastSegment.replace(/[-_]+/g, " ")}`.trim();

      if (!title) continue;
      if (includePattern && !includePattern.test(textToMatch)) continue;
      if (excludePatterns.some((pattern) => pattern.test(excludeTarget))) continue;
      if (skipOldOnlineForms && shouldSkipOldOnlineForm({ title, lastSegment, years: yearsToSkip }))
        continue;

      if (strictJobOnly) {
        const words = title.split(/\s+/).filter(Boolean);
        const hasNumber = /\d/.test(title) || /\d/.test(lastSegment);
        const isLikelyShortGeneric = words.length < 3 && !hasNumber;
        if (isSameAsSectionPath) continue;
        if (DEFAULT_GENERIC_JOB_PATHS.has(genericPath)) continue;
        if (isLikelyShortGeneric) continue;
      }

      const dedupeKey = toDedupeKey(jobUrl);
      const hashes = buildJobHashes({ jobUrl, title, lastSegment });
      const isHashDuplicate = hashes.some((hash) => seenHashes.has(hash));
      const isUrlDuplicate = seen.has(dedupeKey);
      if (isHashDuplicate || isUrlDuplicate) {
        duplicatesRemoved += 1;
        continue;
      }

      seen.add(dedupeKey);
      hashes.forEach((hash) => seenHashes.add(hash));

      const selectorMeta = collectSelectorsForElement(element, { maxCombinationItems });

      jobs.push({
        section: section || null,
        siteName: siteName || null,
        title: title || null,
        href: href || null,
        sourceSectionUrl: currentSectionUrl,
        jobUrl,
        text: title || null,
        attributes: { ...(element.attribs || {}) },
        selectorPathAbsolute: selectorMeta.selectorPathAbsolute,
        selectorPathReadable: selectorMeta.selectorPathReadable,
        xpath: selectorMeta.xpath,
        selectors: selectorMeta.selectors,
        dedupeHash: hashValue(`${normalizeTextForHash(title)}|${normalizeJobUrlForHash(jobUrl)}`),
      });
    }
  }

  return {
    siteName: siteName || null,
    section: section || null,
    sectionUrl: normalizedSectionUrls[0],
    sectionUrls: normalizedSectionUrls,
    totalJobs: jobs.length,
    duplicatesRemoved,
    jobs,
    fetchedAt: new Date().toISOString(),
  };
};

export const getJobContentWithAllSelectors = async ({
  jobUrl,
  requestConfig = {},
  includeElementHtml = true,
  maxCombinationItems = 12,
} = {}) => {
  if (!jobUrl) {
    throw new Error("jobUrl is required");
  }

  const normalizedJobUrl = toAbsoluteUrl(jobUrl, jobUrl);
  if (!normalizedJobUrl) {
    throw new Error("Invalid jobUrl");
  }

  const html = await fetchHtml(normalizedJobUrl, requestConfig);
  const $ = cheerio.load(html, { decodeEntities: false });

  const elements = [];
  const selectorCatalogSet = new Set();

  $("*").each((index, element) => {
    const $element = $(element);
    const selectorMeta = collectSelectorsForElement(element, { maxCombinationItems });

    selectorMeta.selectors.forEach((selector) => selectorCatalogSet.add(selector));

    const tag = String(element.tagName || "").toLowerCase();
    const text = toCleanText($element.text());
    const ownText = toCleanText($element.clone().children().remove().end().text());

    const payload = {
      index: index + 1,
      tag,
      attributes: { ...(element.attribs || {}) },
      text,
      ownText,
      selectorPathAbsolute: selectorMeta.selectorPathAbsolute,
      selectorPathReadable: selectorMeta.selectorPathReadable,
      xpath: selectorMeta.xpath,
      selectors: selectorMeta.selectors,
      innerHtml: $element.html() || "",
    };

    if (includeElementHtml) {
      payload.outerHtml = $.html(element) || "";
    }

    elements.push(payload);
  });

  const canonicalHref = $('link[rel="canonical"]').attr("href");
  const canonicalUrl = toAbsoluteUrl(canonicalHref, normalizedJobUrl);
  const pageTitle = toCleanText($("title").first().text());
  const metaDescription = toCleanText($('meta[name="description"]').attr("content"));

  return {
    jobUrl: normalizedJobUrl,
    fetchedAt: new Date().toISOString(),
    pageTitle: pageTitle || null,
    canonicalUrl: canonicalUrl || null,
    metaDescription: metaDescription || null,
    html,
    textContent: toCleanText($.root().text()),
    totalElements: elements.length,
    totalSelectors: selectorCatalogSet.size,
    selectorCatalog: Array.from(selectorCatalogSet),
    elements,
  };
};

export const scrapperService = {
  getSiteSections,
  getSectionJobList,
  getJobContentWithAllSelectors,
  scrapeSiteSections: getSiteSections,
  scrapeSectionJobs: getSectionJobList,
  scrapeJobDetails: getJobContentWithAllSelectors,
};

export default scrapperService;
