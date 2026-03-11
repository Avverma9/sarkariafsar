import { BLOG_POSTS } from "./blogData";

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

export function getAllBlogPosts() {
  return BLOG_POSTS.map(enrichBlogPost);
}

export function getBlogPostBySlug(slug) {
  const normalizedSlug = normalizeSlug(slug);
  const slugifiedValue = slugifyValue(slug);
  const compactSlug = slugifiedValue.replace(/-/g, "");
  const matchedPost =
    BLOG_POSTS.find((post) => {
      const lookupKeys = getPostLookupKeys(post);

      return (
        lookupKeys.has(normalizedSlug) ||
        lookupKeys.has(slugifiedValue) ||
        lookupKeys.has(compactSlug)
      );
    }) || null;

  return matchedPost ? enrichBlogPost(matchedPost) : null;
}

export function getBlogSlugs() {
  return BLOG_POSTS.map((post) => post.slug);
}
