import { SITE_BASE_URL } from "./lib/site-config";
import { blogPosts } from "./lib/blog-posts";

const siteUrl = SITE_BASE_URL.toString().replace(/\/$/, "");
const upstreamBaseUrl = String(process.env.BASE_URL || "")
  .trim()
  .replace(/^['"]|['"]$/g, "")
  .replace(/\/+$/, "");

const staticRoutes = [
  "",
  "/latest-jobs",
  "/admit-card",
  "/results",
  "/answer-key",
  "/mock-test",
  "/post",
  "/blog",
  "/guides",
  "/guides/interview-tips",
  "/guides/salary-info",
  "/guides/notification-reading",
  "/guides/why-jobsaddah",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

function normalizeKey(value) {
  return String(value || "").trim();
}

async function fetchSectionTitles() {
  if (!upstreamBaseUrl) return [];

  try {
    const response = await fetch(`${upstreamBaseUrl}/site/section-list`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return [];

    const payload = await response.json().catch(() => null);
    const sections = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    return sections
      .map((item) => normalizeKey(item?.title || item?.megaTitle || item?.name))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchCanonicalKeysForSection(megaTitle) {
  if (!upstreamBaseUrl || !megaTitle) return [];

  try {
    const params = new URLSearchParams({
      megaTitle,
      page: "1",
      limit: "200",
    });

    const response = await fetch(
      `${upstreamBaseUrl}/site/post-list-by-section-url?${params.toString()}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) return [];

    const payload = await response.json().catch(() => null);
    const posts = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : [];

    return posts
      .map((item) => normalizeKey(item?.canonicalKey || item?.canonical))
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchAllCanonicalKeys() {
  const sectionTitles = await fetchSectionTitles();
  if (!sectionTitles.length) return [];

  const nestedKeys = await Promise.all(sectionTitles.map(fetchCanonicalKeysForSection));
  return Array.from(new Set(nestedKeys.flat().filter(Boolean)));
}

export default async function sitemap() {
  const now = new Date();

  const staticEntries = staticRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "hourly" : "daily",
    priority: route === "" ? 1 : 0.8,
  }));

  const blogEntries = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const canonicalKeys = await fetchAllCanonicalKeys();
  const postEntries = canonicalKeys.map((key) => ({
    url: `${siteUrl}/post/${encodeURIComponent(key)}`,
    lastModified: now,
    changeFrequency: "hourly",
    priority: 0.9,
  }));

  return [...staticEntries, ...blogEntries, ...postEntries];
}
