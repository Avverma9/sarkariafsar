// Usage: MONGODB_URI="mongodb+srv://..." node scripts/fix-scheme-slugs.js
// This script sets a `slug` field for documents in the `schemes` collection
// where it's missing or empty. It uses same slug rules as the frontend.

const { MongoClient, ObjectId } = require("mongodb");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function getIdSuffix(value) {
  const normalized = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (!normalized) return "";
  return normalized.slice(-8);
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSchemeSlug(doc) {
  const titleSlug = slugify(doc.schemeTitle || doc.title || doc.schemeName || "scheme");
  const idSuffix = getIdSuffix(doc.id || doc._id || (doc._id && String(doc._id)));
  if (!idSuffix) return titleSlug || "scheme";
  return `${titleSlug}-${idSuffix}`;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || undefined;

  if (!uri) {
    console.error("ERROR: set MONGODB_URI environment variable before running.");
    process.exit(1);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const admin = client.db(dbName);
    const db = dbName ? client.db(dbName) : admin; // allow direct connection string with default DB

    // adjust collection name if your backend stores schemes in a different collection
    const collectionName = process.env.SCHEMES_COLLECTION || "schemes";
    const col = db.collection(collectionName);

    const cursor = col.find({ $or: [ { slug: { $exists: false } }, { slug: null }, { slug: "" } ] });

    const total = await cursor.count();

    if (total === 0) {
      return;
    }

    let updated = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const idVal = doc.id || doc._id || (doc._id && String(doc._id));
      const candidate = buildSchemeSlug(doc);
      const normalized = normalizeSlug(candidate) || (idVal ? `scheme-${getIdSuffix(idVal)}` : "scheme");

      // ensure uniqueness: if slug already exists on another doc, append short id
      let finalSlug = normalized;
      const exists = await col.findOne({ slug: finalSlug });
      if (exists) {
        const suffix = getIdSuffix(idVal);
        finalSlug = `${normalized}-${suffix}`;
      }

      await col.updateOne({ _id: doc._id }, { $set: { slug: finalSlug } });
      updated += 1;
    }

  } catch (err) {
    console.error("Error:", err);
    process.exitCode = 2;
  } finally {
    await client.close();
  }
}

main();
