import { SITE_BASE_URL } from "./lib/site-config";
import { blogPosts } from "./lib/blog-posts";

const siteUrl = SITE_BASE_URL.toString().replace(/\/$/, "");

const staticRoutes = [
  "",
  "/latest-jobs",
  "/admit-card",
  "/results",
  "/answer-key",
  "/mock-test",
  "/blog",
  "/guides",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

export default function sitemap() {
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

  return [...staticEntries, ...blogEntries];
}
