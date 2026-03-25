// Ye words wale links noise hain — filter kar denge
const NOISE_KEYWORDS = [
  "home", "about", "contact", "privacy", "disclaimer",
  "advertise", "sitemap", "facebook", "twitter", "instagram",
  "youtube", "telegram", "whatsapp", "view all", "view more",
  "click here", "read more", "more jobs", "more results",
  "subscribe", "follow", "share", "login", "register",
  "menu", "search", "category", "tag", "page", "next", "prev"
];

const NOISE_URL_PATTERNS = [
  /\/(tag|author|page|category)\/$/,
  /#$/,
  /javascript:/,
  /mailto:/,
  /^https?:\/\/(facebook|twitter|instagram|youtube|t\.me|wa\.me)/
];

/**
 * Text clean karo — extra whitespace, symbols hata do
 */
function cleanText(text = "") {
  return text
    .replace(/\s+/g, " ")         // multiple spaces → single
    .replace(/[\n\r\t]/g, " ")    // newlines → space
    .replace(/[^\x20-\x7E\u0900-\u097F]/g, "") // keep ASCII + Devanagari
    .trim();
}

/**
 * Link noise hai ya nahi check karo
 */
function isNoise(text = "", href = "") {
  const lowerText = text.toLowerCase().trim();
  const lowerHref = href.toLowerCase();

  // Bahut choti text (navigation items etc.)
  if (lowerText.length < 8) return true;

  // Noise keyword match
  if (NOISE_KEYWORDS.some(k => lowerText.includes(k))) return true;

  // Noise URL pattern match
  if (NOISE_URL_PATTERNS.some(p => p.test(lowerHref))) return true;

  // Sirf numbers ya special chars wala text
  if (/^[\d\s\-|\/]+$/.test(lowerText)) return true;

  return false;
}

/**
 * Duplicate items deduplicate karo (URL basis pe)
 */
function deduplicate(items) {
  const seen = new Set();
  return items.filter(item => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

module.exports = { cleanText, isNoise, deduplicate };
