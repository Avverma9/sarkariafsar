require('dotenv').config();
const mongoose = require('mongoose');
const GovScheme = require('../models/schemes');

const mongoUri =
  process.env.SCRAPPER_MONGO_URI ||
  'mongodb+srv://Avverma:Avverma95766@avverma.2g4orpk.mongodb.net/the-portal?retryWrites=true&w=majority';

const slugify = (text) => {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

async function ensureUniqueSlug(base, id) {
  let slug = base;
  let counter = 0;

  while (true) {
    const exists = await GovScheme.findOne({ slug, _id: { $ne: id } }).lean();
    if (!exists) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

async function run() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  try {
    const cursor = GovScheme.find().cursor();
    let updated = 0;
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      const title = doc.schemeTitle || doc.title || '';
      if (!title) continue;

      const baseSlug = slugify(title);
      if (!baseSlug) continue;

      const finalSlug = await ensureUniqueSlug(baseSlug, doc._id);

      // Only update if slug missing or different
      if (!doc.slug || doc.slug !== finalSlug) {
        await GovScheme.findByIdAndUpdate(doc._id, { $set: { slug: finalSlug } }, { runValidators: true });
        updated += 1;
        console.log(`Updated ${doc._id} -> ${finalSlug}`);
      }
    }

    console.log(`Done. Documents updated: ${updated}`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

run();
