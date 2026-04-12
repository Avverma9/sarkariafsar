/**
 * downloadOgImage.js — Download og:image from source URL and upload to Cloudflare R2
 *
 * R2 key:     og/{slug}.{ext}   (deterministic — idempotent via HeadObject check)
 * Public URL: {R2_PUBLIC_BASE}/og/{slug}.{ext}
 *
 * - Skips upload if the same key already exists in R2
 * - Falls back gracefully on any error (never blocks the scrape pipeline)
 */

const path  = require("path");
const axios = require("axios");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const TIMEOUT_MS = 15000;
const DEFAULT_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
};

// ── R2 client ──────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region:   "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME;

function r2PublicBase() {
  const custom = process.env.R2_PUBLIC_DOMAIN;
  if (custom && custom.trim()) return custom.trim().replace(/\/$/, "");
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
}

/** Returns the file extension from a URL or Content-Type header */
function resolveExt(imageUrl = "", contentType = "") {
  try {
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath).toLowerCase().replace(".", "");
    if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return ext;
  } catch {}
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("webp")) return "webp";
  if (ct.includes("png"))  return "png";
  if (ct.includes("gif"))  return "gif";
  if (ct.includes("svg"))  return "svg";
  return "jpg";
}

/** Check if key already exists in R2 (idempotency guard) */
async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Download og:image for a post and upload to R2.
 *
 * @param {string} imageUrl  - The og:image URL scraped from the source page
 * @param {string} slug      - Post slug (used as R2 key basename)
 * @returns {Promise<string|null>} - R2 public URL of the image, or null on failure
 */
async function downloadOgImage(imageUrl, slug) {
  if (!imageUrl || !slug) return null;

  try {
    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: TIMEOUT_MS,
      headers: DEFAULT_HEADERS,
      maxContentLength: 5 * 1024 * 1024,
    });

    const contentType = response.headers["content-type"] || "";
    const ext      = resolveExt(imageUrl, contentType);
    const filename = `${slug}.${ext}`;
    const key      = `og/${filename}`;

    // Skip if already uploaded
    if (await existsInR2(key)) {
      const publicUrl = `${r2PublicBase()}/${key}`;
      console.log(`[OG-IMG] Already in R2: ${key}`);
      return publicUrl;
    }

    const buffer = Buffer.from(response.data);
    await r2.send(new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  contentType || "image/jpeg",
      CacheControl: "public, max-age=31536000, immutable",
    }));

    const publicUrl = `${r2PublicBase()}/${key}`;
    const kb = Math.round(buffer.length / 1024);
    console.log(`[OG-IMG] Uploaded to R2: ${key} (${kb} KB) → ${publicUrl}`);
    return publicUrl;

  } catch (err) {
    console.warn(`[OG-IMG] Failed for ${slug}: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

module.exports = { downloadOgImage };
