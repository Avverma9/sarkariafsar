const JobPost = require("../models/post");

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripHtml(value = "") {
  return String(value || "").replace(/<[^>]*>/g, " ");
}

function normalizeUrl(value = "") {
  try {
    const url = new URL(String(value || "").trim());
    url.protocol = "https:";
    url.hash = "";
    url.search = "";
    return url.toString().replace(/\/$/, "/");
  } catch {
    return cleanText(value);
  }
}

function toCanonicalUrl(value = "") {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function generateSnapshot(html = "") {
  return cleanText(stripHtml(html)).toLowerCase();
}

function generateTitleSignature(title = "") {
  return cleanText(title).toLowerCase();
}

function tokenizeSnapshot(snapshot = "") {
  return Array.from(
    new Set(
      snapshot
        .split(/[^a-z0-9]+/i)
        .map((token) => token.trim())
        .filter((token) => token.length > 2)
    )
  );
}

function calculateSimilarity(left = "", right = "") {
  const leftTokens = tokenizeSnapshot(left);
  const rightTokens = tokenizeSnapshot(right);

  if (!leftTokens.length || !rightTokens.length) {
    return 0;
  }

  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  let intersection = 0;

  for (const token of leftSet) {
    if (rightSet.has(token)) intersection += 1;
  }

  return (2 * intersection) / (leftSet.size + rightSet.size);
}

function buildDedupeKey({ sectionCanonicalUrl = "", slug = "" }) {
  return `${sectionCanonicalUrl || "unsectioned"}:${slug || "post"}`;
}

async function saveOrPatchJobPost({
  title = "",
  slug = "",
  sourceUrl = "",
  sectionName = "",
  sectionCanonicalUrl = "",
  sourceSectionName = "",
  sourceSectionUrl = "",
  formattedHtml = "",
  similarityThreshold = 0.8,
}) {
  const normalizedSlug = toCanonicalUrl(slug || sourceUrl);
  const dedupeKey = buildDedupeKey({
    sectionCanonicalUrl,
    slug: normalizedSlug,
  });
  const htmlSnapshot = generateSnapshot(formattedHtml);
  const titleSignature = generateTitleSignature(title);

  const payload = {
    title: cleanText(title),
    slug: normalizedSlug,
    dedupeKey,
    sourceUrl: normalizeUrl(sourceUrl),
    sectionName: cleanText(sectionName),
    sectionCanonicalUrl: cleanText(sectionCanonicalUrl),
    category: "Government Exam",
    status: "active",
    isActive: true,
    htmlSnapshot,
    titleSignature,
    lastPatchedAt: new Date(),
    scrapedMeta: {
      sourceSiteName: "Sarkari Result",
      sourceSectionName: cleanText(sourceSectionName || sectionName),
      sourceSectionUrl: cleanText(sourceSectionUrl),
    },
    scrapedContent: {
      contentHtml: formattedHtml,
      contentJson: {
        slug: normalizedSlug,
        sourceUrl: cleanText(sourceUrl),
        sectionName: cleanText(sectionName),
        sectionCanonicalUrl: cleanText(sectionCanonicalUrl),
      },
      extractedAt: new Date(),
    },
  };

  let existingDoc = await JobPost.findOne({
    $or: [
      { sourceUrl: payload.sourceUrl },
      { slug: payload.slug },
      { dedupeKey: payload.dedupeKey },
    ],
  });

  let action = "created";
  let similarity = 1;

  if (!existingDoc) {
    const candidateFilter = sectionCanonicalUrl
      ? { sectionCanonicalUrl: payload.sectionCanonicalUrl }
      : {};

    const candidates = await JobPost.find(candidateFilter)
      .sort({ updatedAt: -1 })
      .limit(100);

    let bestCandidate = null;
    let bestSimilarity = 0;

    for (const candidate of candidates) {
      const candidateSnapshot =
        cleanText(candidate.htmlSnapshot) ||
        generateSnapshot(candidate?.scrapedContent?.contentHtml || "");
      const candidateTitleSignature =
        cleanText(candidate.titleSignature) ||
        generateTitleSignature(candidate.title);
      if (candidateTitleSignature !== titleSignature) {
        continue;
      }
      const snapshotScore = calculateSimilarity(htmlSnapshot, candidateSnapshot);
      const score = snapshotScore;

      if (score > bestSimilarity) {
        bestSimilarity = score;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate && bestSimilarity >= similarityThreshold) {
      existingDoc = bestCandidate;
      similarity = bestSimilarity;
      action = "patched";
    }
  } else {
    action = "updated";
  }

  if (existingDoc) {
    Object.assign(existingDoc, {
      ...payload,
      createdAt: existingDoc.createdAt,
    });
    await existingDoc.save();

    return {
      action,
      similarity,
      savedPost: existingDoc,
    };
  }

  const createdDoc = await JobPost.create(payload);

  return {
    action,
    similarity,
    savedPost: createdDoc,
  };
}

module.exports = {
  calculateSimilarity,
  generateSnapshot,
  normalizeUrl,
  saveOrPatchJobPost,
};
