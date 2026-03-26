import { baseUrl } from "../lib/baseUrl";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkariafsar.com";

// Static routes always included
const staticRoutes = [
  { url: "/", priority: 1.0, changeFrequency: "daily" },
  { url: "/jobpost", priority: 0.9, changeFrequency: "daily" },
  { url: "/post", priority: 0.9, changeFrequency: "daily" },
  { url: "/blog", priority: 0.9, changeFrequency: "daily" },
  { url: "/schemes", priority: 0.9, changeFrequency: "daily" },
  { url: "/about", priority: 0.5, changeFrequency: "yearly" },
  { url: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { url: "/disclaimer", priority: 0.3, changeFrequency: "yearly" },
  { url: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { url: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { url: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
];

async function fetchJson(endpoint) {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${baseUrl}${endpoint}`, {
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const items = json?.data ?? json;
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  // Fetch dynamic data in parallel
  const [sectionData, blogs, schemes] = await Promise.all([
    fetchJson("/post/get-posts-with-section"),
    fetchJson("/blog"),
    fetchJson("/schemes"),
  ]);

  // Extract section pages + individual posts from sections
  const allPosts = [];
  const seenSlugs = new Set();
  const sectionEntries = [];

  for (const section of sectionData) {
    // /post/section/<sectionCanonicalUrl>
    if (section?.sectionCanonicalUrl) {
      sectionEntries.push({
        url: `${SITE_URL}/post/section/${encodeURIComponent(section.sectionCanonicalUrl)}`,
        changeFrequency: "daily",
        priority: 0.85,
      });
    }

    if (Array.isArray(section?.posts)) {
      for (const p of section.posts) {
        if (p?.slug && !seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          allPosts.push(p);
        }
      }
    }
    // If the API returns flat posts (fallback)
    if (section?.slug && !section?.posts) {
      if (!seenSlugs.has(section.slug)) {
        seenSlugs.add(section.slug);
        allPosts.push(section);
      }
    }
  }

  const postEntries = allPosts.map((p) => ({
    url: `${SITE_URL}/post/${encodeURIComponent(p.slug)}`,
    lastModified: p.updatedAt || p.createdAt || new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const blogEntries = blogs
    .filter((b) => b?.slug)
    .map((b) => ({
      url: `${SITE_URL}/blog/${encodeURIComponent(b.slug)}`,
      lastModified: b.updatedAt || b.createdAt || new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const schemeEntries = schemes
    .filter((s) => s?.slug)
    .map((s) => ({
      url: `${SITE_URL}/schemes/${encodeURIComponent(s.slug)}`,
      lastModified: s.updatedAt || s.createdAt || new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    }));

  const staticEntries = staticRoutes.map((r) => ({
    url: `${SITE_URL}${r.url}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  return [...staticEntries, ...sectionEntries, ...postEntries, ...blogEntries, ...schemeEntries];
}
