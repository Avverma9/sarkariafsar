require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const GovScheme = require('../models/schemes');

const mongoUri =
  process.env.SCRAPPER_MONGO_URI ||
  'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

function normalizeString(value) {
  if (typeof value !== 'string') return value;
  return value.trim();
}

function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDateOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeScheme(input = {}) {
  return {
    schemeTitle: normalizeString(input.schemeTitle) || '',
    schemetype: normalizeString(input.schemetype) || '',
    requiredDocs: normalizeStringArray(input.requiredDocs),
    process: normalizeString(input.process) || '',
    state: normalizeString(input.state) || '',
    city: normalizeString(input.city) || '',
    schemeStartDate: parseDateOrNull(input.schemeStartDate),
    schemeLastDate: parseDateOrNull(input.schemeLastDate),
    applyLink: normalizeString(input.applyLink) || '',
    aboutScheme: normalizeString(input.aboutScheme) || '',
    officialSourceUrl: normalizeString(input.officialSourceUrl) || '',
    slug: normalizeString(input.slug) || '',
    authorName: normalizeString(input.authorName) || '',
    authorProfileUrl: normalizeString(input.authorProfileUrl) || '',
    authorBio: normalizeString(input.authorBio) || '',
    wordCount: Number.isFinite(Number(input.wordCount)) ? Number(input.wordCount) : 0,
    noIndex: Boolean(input.noIndex),
  };
}

async function run() {
  const filePath = path.resolve(__dirname, '..', 'bihar_scheme.md');
  const raw = fs.readFileSync(filePath, 'utf-8').trim();

  if (!raw) {
    throw new Error('bihar_scheme.md is empty');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Invalid JSON in bihar_scheme.md: ${error.message}`);
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('bihar_scheme.md must contain a non-empty JSON array');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  try {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of parsed) {
      const doc = sanitizeScheme(item);

      if (!doc.schemeTitle) {
        skipped += 1;
        continue;
      }

      const filter = doc.slug
        ? { slug: doc.slug }
        : { schemeTitle: doc.schemeTitle, state: doc.state || '' };

      const existing = await GovScheme.findOne(filter).select('_id').lean();

      await GovScheme.updateOne(
        filter,
        {
          $set: doc,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      if (existing) updated += 1;
      else inserted += 1;
    }

    console.log('Seeding completed');
    console.log({ total: parsed.length, inserted, updated, skipped });
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

run().catch((error) => {
  console.error('Bihar scheme seed failed:', error.message);
  process.exit(1);
});
