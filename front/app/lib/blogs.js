import baseUrl from "./baseUrl";

const CATEGORY_SEO_KEYWORDS = {
  guides: [
    "guide",
    "explained",
    "how to",
    "kaise karein",
    "samjhein",
    "jankari",
  ],
  applications: [
    "application form",
    "online form",
    "apply online",
    "aavedan",
    "form bharne ka tarika",
    "registration",
  ],
  "exam prep": [
    "exam preparation",
    "exam tips",
    "pariksha taiyari",
    "exam strategy",
    "candidate guide",
  ],
  schemes: [
    "government scheme",
    "yojana",
    "sarkari yojana",
    "eligibility",
    "benefits",
    "apply kaise karein",
  ],
};

const GLOBAL_BLOG_SEO_KEYWORDS = [
  "sarkari afsar blog",
  "sarkari update",
  "latest sarkari update",
  "government jobs guide",
  "sarkari naukri guide",
  "hindi blog",
  "english blog",
  "hindi and english guide",
];

const TEXT_TOKEN_REPLACEMENTS = [
  [/govt/g, "government"],
  [/naukri/g, "job"],
  [/yojana/g, "scheme"],
  [/admit card/g, "hall ticket"],
  [/result/g, "exam result"],
  [/cut-?off/g, "cutoff"],
];

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeAbsoluteUrl(value) {
  const candidate = String(value || "").trim();

  if (!candidate) {
    return "";
  }

  if (/^https?:\/\//i.test(candidate)) {
    return candidate.replace(/\/+$/g, "");
  }

  return "";
}

const BLOGS_API_BASE_URL =
  normalizeAbsoluteUrl(process.env.NEXT_PUBLIC_SITE_API_BASE_URL) ||
  normalizeAbsoluteUrl(process.env.SITE_API_BASE_URL) ||
  normalizeAbsoluteUrl(baseUrl);

function buildBlogsApiUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${String(path || "")}`;
  const routePrefix = /\/blog$/i.test(BLOGS_API_BASE_URL) ? "" : "/blog";

  return `${BLOGS_API_BASE_URL}${routePrefix}${normalizedPath}`;
}

function safelyDecodeUriComponent(value) {
  try {
    return decodeURIComponent(String(value || ""));
  } catch {
    return String(value || "");
  }
}

function slugifyValue(value) {
  return normalizeSlug(safelyDecodeUriComponent(value))
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function getPostLookupKeys(post) {
  const aliasList = Array.isArray(post.aliases) ? post.aliases : [];
  const values = [post.slug, post.title, ...aliasList];
  const keys = new Set();

  values.forEach((value) => {
    const normalizedValue = normalizeSlug(value);
    const slugifiedValue = slugifyValue(value);

    if (normalizedValue) {
      keys.add(normalizedValue);
    }

    if (slugifiedValue) {
      keys.add(slugifiedValue);
      keys.add(slugifiedValue.replace(/-/g, ""));
    }
  });

  return keys;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];

  values.forEach((value) => {
    const text = String(value || "").trim();
    const key = text.toLowerCase();

    if (!text || seen.has(key)) {
      return;
    }

    seen.add(key);
    result.push(text);
  });

  return result;
}

function extractTextTokens(value) {
  const normalizedValue = normalizeSlug(value)
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalizedValue) {
    return [];
  }

  const phrases = [normalizedValue];

  TEXT_TOKEN_REPLACEMENTS.forEach(([pattern, replacement]) => {
    if (pattern.test(normalizedValue)) {
      phrases.push(normalizedValue.replace(pattern, replacement));
    }
  });

  return uniqueStrings(
    phrases.flatMap((phrase) => {
      const tokens = phrase.split(/\s+/).filter((token) => token.length > 2);
      const twoWordPhrases = [];

      for (let index = 0; index < tokens.length - 1; index += 1) {
        twoWordPhrases.push(`${tokens[index]} ${tokens[index + 1]}`);
      }

      return [phrase, ...tokens, ...twoWordPhrases];
    }),
  );
}

function buildSeoTags(post) {
  return uniqueStrings([
    ...GLOBAL_BLOG_SEO_KEYWORDS,
    ...(CATEGORY_SEO_KEYWORDS[normalizeSlug(post.category)] || []),
    ...asArray(post.tags),
    ...extractTextTokens(post.title),
    ...extractTextTokens(post.excerpt),
    ...extractTextTokens(post.intro).slice(0, 12),
  ]).slice(0, 40);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function enrichBlogPost(post) {
  if (!post || post.seoTags) {
    return post;
  }

  return {
    ...post,
    seoTags: buildSeoTags(post),
  };
}

function extractBlogCollection(payload) {
  if (Array.isArray(payload?.blogs)) {
    return payload.blogs;
  }

  if (Array.isArray(payload?.data?.blogs)) {
    return payload.data.blogs;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function extractSingleBlog(payload) {
  if (payload?.blog && typeof payload.blog === "object") {
    return payload.blog;
  }

  if (payload?.data?.blog && typeof payload.data.blog === "object") {
    return payload.data.blog;
  }

  if (payload?.data && !Array.isArray(payload.data) && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload && !Array.isArray(payload) && typeof payload === "object") {
    return payload;
  }

  return null;
}

async function requestBlogs(path) {
  const response = await fetch(buildBlogsApiUrl(path), {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;

    try {
      const errorPayload = await response.json();
      errorMessage = errorPayload?.message || errorMessage;
    } catch {
      // Keep the generic message when the body is not valid JSON.
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function getAllBlogPosts() {
  const payload = await requestBlogs("/get-all-blogs");
  return extractBlogCollection(payload).map(enrichBlogPost);
}

export async function getBlogPostBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);

  if (!normalizedSlug) {
    return null;
  }

  try {
    const payload = await requestBlogs(`/get-all-blogs/${encodeURIComponent(normalizedSlug)}`);
    const directPost = enrichBlogPost(extractSingleBlog(payload));

    if (directPost?.slug) {
      return directPost;
    }
  } catch (error) {
    if (error?.status && error.status !== 404) {
      throw error;
    }
  }

  const slugifiedValue = slugifyValue(slug);
  const compactSlug = slugifiedValue.replace(/-/g, "");
  const posts = await getAllBlogPosts();
  const matchedPost =
    posts.find((post) => {
      const lookupKeys = getPostLookupKeys(post);

      return (
        lookupKeys.has(normalizedSlug) ||
        lookupKeys.has(slugifiedValue) ||
        lookupKeys.has(compactSlug)
      );
    }) || null;

  return matchedPost ? enrichBlogPost(matchedPost) : null;
}

export async function getBlogSlugs() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => post.slug).filter(Boolean);
}
