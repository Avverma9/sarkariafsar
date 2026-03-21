import { getAllGovSchemes } from "./lib/govSchemesApi";
import { buildSchemeSlug } from "./lib/schemeSlug";
import { getSectionsWithJobs } from "./lib/siteApi";
import { absoluteUrl } from "./lib/seo";
import { getAllBlogPosts } from "./lib/blogs";
import { getSectionHref, mapSectionsWithJobs } from "./lib/sections";

const SITEMAP_FETCH_TIMEOUT_MS = 15000;
export const dynamic = "force-dynamic";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toValidDate(value, fallback = new Date()) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function createEntry(path, { changeFrequency, priority, lastModified } = {}) {
  return {
    url: absoluteUrl(path),
    changeFrequency,
    priority,
    lastModified: toValidDate(lastModified),
  };
}

function dedupeEntries(entries = []) {
  const seen = new Set();
  const result = [];

  asArray(entries).forEach((entry) => {
    const url = String(entry?.url || "");

    if (!url || seen.has(url)) {
      return;
    }

    seen.add(url);
    result.push(entry);
  });

  return result;
}

function extractSchemes(payload) {
  if (Array.isArray(payload?.schemes)) {
    return payload.schemes;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  return asArray(payload);
}

async function withTimeout(task, timeoutMs = SITEMAP_FETCH_TIMEOUT_MS) {
  let timeoutId;

  try {
    return await Promise.race([
      task,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function getSchemeEntries() {
  try {
    const payload = await withTimeout(getAllGovSchemes());
    const schemes = extractSchemes(payload);

    return schemes
      .map((scheme) => {
        const slug = buildSchemeSlug(scheme);

        if (!slug) {
          return null;
        }

        return createEntry(`/schemes/${slug}`, {
          changeFrequency: "daily",
          priority: 0.7,
          lastModified:
            scheme?.updatedAt || scheme?.schemeLastDate || scheme?.createdAt || new Date(),
        });
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function getPostEntries(sections = []) {
  return asArray(sections).flatMap((section) =>
    asArray(section?.jobs)
      .map((job) => {
        const slug = String(job?.slug || "").trim();

        if (!slug) {
          return null;
        }

        return createEntry(`/post/${slug}`, {
          changeFrequency: "hourly",
          priority: 0.8,
        });
      })
      .filter(Boolean),
  );
}

function getSectionEntries(sections = []) {
  return asArray(sections).map((section) =>
    createEntry(getSectionHref(section), {
      changeFrequency: "hourly",
      priority: 0.9,
      lastModified: section?.updatedAt || section?.createdAt || new Date(),
    }),
  );
}

async function getSitemapSections() {
  try {
    const payload = await withTimeout(
      getSectionsWithJobs({ sectionLimit: 100, jobLimit: 100 }),
    );

    return mapSectionsWithJobs(payload?.sections);
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const blogPosts = await withTimeout(getAllBlogPosts()).catch(() => []);
  const blogEntries = asArray(blogPosts)
    .map((post) => {
      const slug = String(post?.slug || "").trim();

      if (!slug) {
        return null;
      }

      return createEntry(`/blog/${slug}`, {
        changeFrequency: "weekly",
        priority: 0.6,
        lastModified: post?.updatedAt || post?.publishedAt || now,
      });
    })
    .filter(Boolean);

  const staticEntries = [
    createEntry("/", { changeFrequency: "hourly", priority: 1.0, lastModified: now }),
    createEntry("/post", { changeFrequency: "hourly", priority: 0.95, lastModified: now }),
    createEntry("/results", { changeFrequency: "hourly", priority: 0.9, lastModified: now }),
    createEntry("/admit-cards", {
      changeFrequency: "hourly",
      priority: 0.9,
      lastModified: now,
    }),
    createEntry("/schemes", { changeFrequency: "hourly", priority: 0.9, lastModified: now }),
    createEntry("/blog", { changeFrequency: "weekly", priority: 0.75, lastModified: now }),
    createEntry("/about", { changeFrequency: "monthly", priority: 0.5, lastModified: now }),
    createEntry("/contact-us", { changeFrequency: "monthly", priority: 0.5, lastModified: now }),
    createEntry("/privacy-policy", {
      changeFrequency: "monthly",
      priority: 0.4,
      lastModified: now,
    }),
    createEntry("/terms-and-conditions", {
      changeFrequency: "monthly",
      priority: 0.4,
      lastModified: now,
    }),
    createEntry("/cookie-policy", {
      changeFrequency: "monthly",
      priority: 0.4,
      lastModified: now,
    }),
    createEntry("/disclaimer", {
      changeFrequency: "monthly",
      priority: 0.4,
      lastModified: now,
    }),
  ];

  const [schemeEntries, sections] = await Promise.all([
    getSchemeEntries(),
    getSitemapSections(),
  ]);
  const postEntries = getPostEntries(sections);
  const sectionEntries = getSectionEntries(sections);

  return dedupeEntries([
    ...staticEntries,
    ...blogEntries,
    ...schemeEntries,
    ...postEntries,
    ...sectionEntries,
  ]);
}
