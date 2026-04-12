/**
 * seedOgToR2.js — One-time migration script
 *
 * Uploads every file in uploads/og/ to Cloudflare R2 under the og/ folder,
 * then updates seo.ogImage (and thumbnail) on the matching JobPost in MongoDB.
 *
 * Run: node scripts/seedOgToR2.js
 * Options:
 *   --dry-run   Print what would happen without uploading or updating DB
 *   --concurrency=N  Parallel uploads (default: 5)
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs       = require('fs');
const path     = require('path');
const mongoose = require('mongoose');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

const JobPost    = require('../models/post');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'og');

// ── CLI args ──────────────────────────────────────────────────────────────
const DRY_RUN     = process.argv.includes('--dry-run');
const CONCURRENCY = parseInt((process.argv.find(a => a.startsWith('--concurrency=')) || '').replace('--concurrency=', '') || '5', 10);

// ── MIME map ──────────────────────────────────────────────────────────────
const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png',  webp: 'image/webp',
  gif: 'image/gif',  svg: 'image/svg+xml',
};

// ── R2 client ─────────────────────────────────────────────────────────────
const r2 = new S3Client({
  region:   'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;

function r2PublicBase() {
  const d = process.env.R2_PUBLIC_DOMAIN;
  if (d && d.trim()) return d.trim().replace(/\/$/, '');
  return `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev`;
}

async function existsInR2(key) {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch { return false; }
}

// ── Process one file ──────────────────────────────────────────────────────
async function processFile(filename, stats) {
  const filePath = path.join(UPLOADS_DIR, filename);
  const ext      = path.extname(filename).toLowerCase().replace('.', '');
  const slug     = path.basename(filename, path.extname(filename));
  const key      = `og/${filename}`;
  const mime     = MIME[ext] || 'image/jpeg';
  const publicUrl = `${r2PublicBase()}/${key}`;

  if (DRY_RUN) {
    console.log(`[DRY] Would upload: ${key} → ${publicUrl}`);
    stats.dryRun++;
    return;
  }

  // ── Upload to R2 ────────────────────────────────────────────────────────
  const alreadyUploaded = await existsInR2(key);
  if (alreadyUploaded) {
    console.log(`[SKIP] Already in R2: ${key}`);
    stats.skippedR2++;
  } else {
    const buffer = fs.readFileSync(filePath);
    await r2.send(new PutObjectCommand({
      Bucket:       BUCKET,
      Key:          key,
      Body:         buffer,
      ContentType:  mime,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const kb = Math.round(buffer.length / 1024);
    console.log(`[R2] Uploaded: ${key} (${kb} KB)`);
    stats.uploaded++;
  }

  // ── Update DB ────────────────────────────────────────────────────────────
  const result = await JobPost.updateOne(
    { slug },
    { $set: { 'seo.ogImage': publicUrl, thumbnail: publicUrl } }
  );

  if (result.matchedCount === 0) {
    console.warn(`[DB ] No post found for slug: ${slug}`);
    stats.noMatch++;
  } else if (result.modifiedCount > 0) {
    console.log(`[DB ] Updated seo.ogImage for: ${slug}`);
    stats.dbUpdated++;
  } else {
    console.log(`[DB ] Already had correct URL: ${slug}`);
    stats.dbSame++;
  }
}

// ── Concurrency runner ────────────────────────────────────────────────────
async function runWithConcurrency(tasks, limit) {
  const results = [];
  let i = 0;
  async function next() {
    if (i >= tasks.length) return;
    const task = tasks[i++];
    await task();
    await next();
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, next);
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log(' seedOgToR2 — Migrate uploads/og/ → Cloudflare R2');
  if (DRY_RUN) console.log(' MODE: DRY RUN (no changes will be made)');
  console.log('═══════════════════════════════════════════════════\n');

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error('uploads/og/ directory not found!');
    process.exit(1);
  }

  await mongoose.connect(process.env.SCRAPPER_MONGO_URI);
  console.log('✓ MongoDB connected\n');

  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => !f.startsWith('.') && fs.statSync(path.join(UPLOADS_DIR, f)).isFile());

  console.log(`Found ${files.length} files in uploads/og/\n`);

  const stats = { uploaded: 0, skippedR2: 0, dbUpdated: 0, dbSame: 0, noMatch: 0, dryRun: 0, errors: 0 };

  const tasks = files.map(filename => async () => {
    try {
      await processFile(filename, stats);
    } catch (err) {
      console.error(`[ERR] ${filename}: ${err.message}`);
      stats.errors++;
    }
  });

  await runWithConcurrency(tasks, CONCURRENCY);

  console.log('\n═══════════════════════════════════════════════════');
  console.log(' SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  if (DRY_RUN) {
    console.log(` Would process : ${stats.dryRun}`);
  } else {
    console.log(` R2 uploaded   : ${stats.uploaded}`);
    console.log(` R2 skipped    : ${stats.skippedR2}`);
    console.log(` DB updated    : ${stats.dbUpdated}`);
    console.log(` DB unchanged  : ${stats.dbSame}`);
    console.log(` No DB match   : ${stats.noMatch}`);
    console.log(` Errors        : ${stats.errors}`);
  }
  console.log('═══════════════════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
