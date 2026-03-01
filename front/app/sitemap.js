import { buildCanonicalKey } from "./lib/postFormatter";
import { getAllGovSchemes } from "./lib/govSchemesApi";
import { buildSchemeSlug } from "./lib/schemeSlug";
import { getStoredJobLists } from "./lib/siteApi";
import { absoluteUrl } from "./lib/seo";
import { getBlogSlugs } from "./lib/blogs";

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

async function getSchemeEntries() {
  try {
    const payload = await getAllGovSchemes();
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

async function getPostEntries() {
  try {
    const payload = await getStoredJobLists();
    const jobLists = asArray(payload?.jobLists);
    const allPosts = jobLists.flatMap((list) => asArray(list?.postList));
    const admitCardPosts = jobLists.flatMap((list) => asArray(list?.admitCardPostList));

    const postEntries = allPosts
      .map((post) => {
        const title = String(post?.title || "").trim();
        const jobUrl = String(post?.jobUrl || "").trim();
        const canonicalKey = buildCanonicalKey({ title, jobUrl });

        if (!canonicalKey) {
          return null;
        }

        return createEntry(`/post/${canonicalKey}`, {
          changeFrequency: "hourly",
          priority: 0.8,
          lastModified: post?.fetchedAt || post?.updatedAt || post?.createdAt || new Date(),
        });
      })
      .filter(Boolean);

    const admitCardEntries = admitCardPosts
      .map((post) => {
        const title = String(post?.title || "").trim();
        const jobUrl = String(post?.jobUrl || "").trim();
        const canonicalKey = buildCanonicalKey({ title, jobUrl });

        if (!canonicalKey) {
          return null;
        }

        return createEntry(`/admit-cards/${canonicalKey}`, {
          changeFrequency: "hourly",
          priority: 0.8,
          lastModified: post?.fetchedAt || post?.updatedAt || post?.createdAt || new Date(),
        });
      })
      .filter(Boolean);

    return [...postEntries, ...admitCardEntries];
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();
  const blogEntries = getBlogSlugs().map((slug) =>
    createEntry(`/blog/${slug}`, {
      changeFrequency: "weekly",
      priority: 0.6,
      lastModified: now,
    }),
  );

  const staticEntries = [
    createEntry("/", { changeFrequency: "hourly", priority: 1.0, lastModified: now }),
    createEntry("/jobs", { changeFrequency: "hourly", priority: 0.95, lastModified: now }),
    createEntry("/jobs/new-jobs", {
      changeFrequency: "hourly",
      priority: 0.9,
      lastModified: now,
    }),
    createEntry("/jobs/admissions", {
      changeFrequency: "daily",
      priority: 0.8,
      lastModified: now,
    }),
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

  const [schemeEntries, postEntries] = await Promise.all([
    getSchemeEntries(),
    getPostEntries(),
  ]);

  return dedupeEntries([...staticEntries, ...blogEntries, ...schemeEntries, ...postEntries]);
}
