import path from "node:path";
import { readdir } from "node:fs/promises";
import { baseUrl } from "./lib/baseUrl";
import { SITE_BASE_URL } from "./lib/site-config";
import { blogPosts } from "./lib/blog-posts";

export const revalidate = 3600;

const siteUrl = SITE_BASE_URL.toString().replace(/\/$/, "");
const appDir = path.join(process.cwd(), "app");
const pageFilePattern = /^page\.(js|jsx|ts|tsx)$/;
const EXCLUDED_STATIC_ROUTES = new Set([
  "/post",
  "/search",
  "/terms-and-condition",
]);
const ROUTE_PRIORITY = new Map([
  ["/", { changeFrequency: "hourly", priority: 1 }],
  ["/latest-jobs", { changeFrequency: "hourly", priority: 0.95 }],
  ["/results", { changeFrequency: "hourly", priority: 0.9 }],
  ["/admit-card", { changeFrequency: "hourly", priority: 0.9 }],
  ["/answer-key", { changeFrequency: "hourly", priority: 0.9 }],
  ["/blog", { changeFrequency: "daily", priority: 0.85 }],
  ["/guides", { changeFrequency: "weekly", priority: 0.8 }],
]);

function isNonDynamicSegment(segment) {
  return (
    segment &&
    !segment.startsWith("[") &&
    !segment.startsWith("(") &&
    !segment.startsWith("@")
  );
}

function toValidDate(value, fallbackDate) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallbackDate : date;
}

async function collectStaticRoutes(relativeDir = "") {
  const absoluteDir = path.join(appDir, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (entry.name === "api" || entry.name.startsWith("_")) continue;
      const nestedRoutes = await collectStaticRoutes(path.join(relativeDir, entry.name));
      routes.push(...nestedRoutes);
      continue;
    }

    if (!entry.isFile() || !pageFilePattern.test(entry.name)) continue;

    const routeSegments = relativeDir
      .split(path.sep)
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (routeSegments.some((segment) => !isNonDynamicSegment(segment))) continue;

    const routePath = routeSegments.length === 0 ? "/" : `/${routeSegments.join("/")}`;
    routes.push(routePath);
  }

  return routes;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) return null;
  return response.json().catch(() => null);
}

function parseMegaTitles(payload) {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  return Array.from(
    new Set(
      data
        .map((item) => String(item?.title || "").trim())
        .filter(Boolean),
    ),
  );
}

async function fetchSectionTitles() {
  try {
    const payload = await fetchJson(`${baseUrl}/site/mega-sections`);
    return parseMegaTitles(payload);
  } catch {
    return [];
  }
}

async function fetchPostPage(megaTitle, page, limit) {
  const params = new URLSearchParams({
    megaTitle: String(megaTitle || "").trim(),
    page: String(page),
    limit: String(limit),
  });
  return fetchJson(`${baseUrl}/site/post-list-by-section-url?${params.toString()}`);
}

async function fetchAllPostEntries(now) {
  const sectionTitles = await fetchSectionTitles();
  if (sectionTitles.length === 0) return [];

  const postByCanonical = new Map();
  const perPageLimit = 200;

  for (const megaTitle of sectionTitles) {
    const firstPage = await fetchPostPage(megaTitle, 1, perPageLimit).catch(() => null);
    if (!firstPage) continue;

    const totalPages = Math.max(1, Number(firstPage?.pagination?.pages || 1));
    const allRows = Array.isArray(firstPage?.data) ? [...firstPage.data] : [];

    for (let page = 2; page <= totalPages; page += 1) {
      const pagePayload = await fetchPostPage(megaTitle, page, perPageLimit).catch(() => null);
      if (!pagePayload) continue;
      const rows = Array.isArray(pagePayload?.data) ? pagePayload.data : [];
      allRows.push(...rows);
    }

    for (const row of allRows) {
      const canonicalKey = String(row?.canonicalKey || row?.canonical || "").trim();
      if (!canonicalKey || postByCanonical.has(canonicalKey)) continue;

      postByCanonical.set(canonicalKey, {
        url: `${siteUrl}/post/${encodeURIComponent(canonicalKey)}`,
        lastModified: toValidDate(row?.postDate || row?.updatedAt, now),
        changeFrequency: "daily",
        priority: 0.7,
      });
    }
  }

  return Array.from(postByCanonical.values());
}

export default async function sitemap() {
  const now = new Date();

  const staticRoutes = await collectStaticRoutes().catch(() => ["/"]);
  const staticEntries = Array.from(new Set(staticRoutes))
    .filter((route) => !EXCLUDED_STATIC_ROUTES.has(route))
    .map((route) => {
      const routeMeta = ROUTE_PRIORITY.get(route) || {};
      return {
        url: `${siteUrl}${route === "/" ? "" : route}`,
        lastModified: now,
        changeFrequency: routeMeta.changeFrequency || "weekly",
        priority: Number(routeMeta.priority || 0.8),
      };
    });

  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const postEntries = await fetchAllPostEntries(now);

  const uniqueByUrl = new Map();
  for (const entry of [...staticEntries, ...blogEntries, ...postEntries]) {
    uniqueByUrl.set(entry.url, entry);
  }

  return Array.from(uniqueByUrl.values());
}
