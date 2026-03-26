import path from "node:path";
import { pathToFileURL } from "node:url";

const ROOT_DIR = process.cwd();
const BLOG_DATA_PATH = path.join(ROOT_DIR, "app/lib/blogData.js");
const blogDataModule = await import(pathToFileURL(BLOG_DATA_PATH).href);
const BLOG_POSTS = Array.isArray(blogDataModule.BLOG_POSTS) ? blogDataModule.BLOG_POSTS : [];

const NOISE_PATTERNS = [
  /Explore further with our detailed analysis and insights\./i,
  /Hamara prayas hai ki aapko sahi aur satik jankari mile\./i,
  /Hum har pehlu ko cover karte hain\./i,
];

const REQUIRED_POST_FIELDS = ["slug", "title", "excerpt", "intro", "category", "tags", "sections"];

const errors = [];
const seenSlugs = new Set();

function addError(message) {
  errors.push(message);
}

function hasNoise(value) {
  const text = String(value || "");
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

BLOG_POSTS.forEach((post, postIndex) => {
  const label = `post #${postIndex + 1}`;
  const slug = String(post?.slug || "").trim();

  REQUIRED_POST_FIELDS.forEach((field) => {
    const value = post?.[field];
    const isMissing =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isMissing) {
      addError(`${label}: missing required field "${field}"`);
    }
  });

  if (!slug) {
    addError(`${label}: empty slug`);
  } else {
    if (seenSlugs.has(slug)) {
      addError(`${label}: duplicate slug "${slug}"`);
    }

    seenSlugs.add(slug);
  }

  if (hasNoise(post?.title)) {
    addError(`${slug || label}: title contains repeated filler content`);
  }

  if (hasNoise(post?.excerpt)) {
    addError(`${slug || label}: excerpt contains repeated filler content`);
  }

  if (hasNoise(post?.intro)) {
    addError(`${slug || label}: intro contains repeated filler content`);
  }

  if (Array.isArray(post?.sections)) {
    post.sections.forEach((section, sectionIndex) => {
      const heading = String(section?.heading || "").trim();
      const sectionLabel = `${slug || label} section #${sectionIndex + 1}`;

      if (!heading) {
        addError(`${sectionLabel}: missing heading`);
      }

      if (heading.length > 140) {
        addError(`${sectionLabel}: heading too long (${heading.length} chars)`);
      }

      if (hasNoise(heading)) {
        addError(`${sectionLabel}: heading contains repeated filler content`);
      }

      const paragraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : [];
      const bullets = Array.isArray(section?.bullets) ? section.bullets : [];

      if (paragraphs.length === 0 && bullets.length === 0) {
        addError(`${sectionLabel}: needs paragraphs or bullets`);
      }

      paragraphs.forEach((paragraph, paragraphIndex) => {
        if (hasNoise(paragraph)) {
          addError(`${sectionLabel} paragraph #${paragraphIndex + 1}: contains repeated filler content`);
        }
      });

      bullets.forEach((bullet, bulletIndex) => {
        if (hasNoise(bullet)) {
          addError(`${sectionLabel} bullet #${bulletIndex + 1}: contains repeated filler content`);
        }
      });
    });
  }
});

if (errors.length > 0) {
  console.error("Blog data validation failed:\n");
  errors.forEach((error) => {
    console.error(`- ${error}`);
  });
  process.exit(1);
}

