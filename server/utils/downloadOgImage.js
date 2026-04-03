/**
 * downloadOgImage.js — Download og:image from source URL and save to /uploads/og/
 *
 * Saved path: /uploads/og/{slug}.{ext}
 * Public URL:  {BASE_URL}/uploads/og/{slug}.{ext}
 *
 * - Skips if file already exists (idempotent)
 * - Falls back gracefully on any error (never blocks the scrape pipeline)
 */

const fs   = require("fs");
const path = require("path");
const axios = require("axios");

const UPLOADS_DIR = path.join(__dirname, "..", "uploads", "og");
const SITE_URL    = process.env.SITE_URL || "https://sarkariafsar.com";
const TIMEOUT_MS  = 15000;

const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
};

/** Ensure /uploads/og/ directory exists */
function ensureDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/** Returns the file extension from a URL or Content-Type header */
function resolveExt(imageUrl = "", contentType = "") {
  // Try URL extension first
  try {
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath).toLowerCase().replace(".", "");
    if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return ext;
  } catch {}

  // Fall back to Content-Type
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("webp"))  return "webp";
  if (ct.includes("png"))   return "png";
  if (ct.includes("gif"))   return "gif";
  if (ct.includes("svg"))   return "svg";
  return "jpg"; // safe default
}

/**
 * Download og:image for a post.
 *
 * @param {string} imageUrl  - The og:image URL scraped from the source page
 * @param {string} slug      - Post slug (used as filename)
 * @returns {Promise<string|null>} - Public URL of saved image, or null on failure
 */
async function downloadOgImage(imageUrl, slug) {
  if (!imageUrl || !slug) return null;

  ensureDir();

  // Check if any version already saved (any extension)
  const existingFiles = fs.readdirSync(UPLOADS_DIR);
  const existing = existingFiles.find((f) => f.startsWith(slug + "."));
  if (existing) {
    const publicUrl = `${SITE_URL}/og/${existing}`;
    console.log(`[OG-IMG] Already exists: ${existing}`);
    return publicUrl;
  }

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: TIMEOUT_MS,
      headers: DEFAULT_HEADERS,
      maxContentLength: 5 * 1024 * 1024, // 5 MB max
    });

    const contentType = response.headers["content-type"] || "";
    const ext = resolveExt(imageUrl, contentType);
    const filename = `${slug}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    fs.writeFileSync(filePath, Buffer.from(response.data));

    const publicUrl = `${SITE_URL}/og/${filename}`;
    const kb = Math.round(response.data.byteLength / 1024);
    console.log(`[OG-IMG] Saved: ${filename} (${kb} KB) → ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.warn(`[OG-IMG] Failed for ${slug}: ${err.message?.slice(0, 80)}`);
    return null;
  }
}

module.exports = { downloadOgImage };
