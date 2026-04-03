/**
 * contentInjector.js — Template-based content generation
 *
 * Picks weighted blocks from a template, injects post variables,
 * returns unique human-written content per post.
 */

// ── Date formatter (Hindi locale) ─────────────────────────────
function formatDate(isoDate) {
  if (!isoDate) return "जल्द ही";
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return "जल्द ही";
  return d.toLocaleDateString("hi-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Build variable values from post ───────────────────────────
function buildVariables(post) {
  const selProcess = Array.isArray(post.selectionProcess)
    ? post.selectionProcess.join(" → ")
    : post.selectionProcess || "लिखित परीक्षा → दस्तावेज़ सत्यापन";

  return {
    "{{title}}": post.title || "",
    "{{shortTitle}}": post.shortTitle || post.title || "",
    "{{conductingAuthority}}": post.conductingAuthority || "",
    "{{conductingAuthorityFull}}":
      post.conductingAuthorityFull || post.conductingAuthority || "",
    "{{officialWebsite}}": post.officialWebsite || "official website",
    "{{totalVacancies}}": String(post.totalVacancies || ""),
    "{{salary}}": post.salary || "government pay scale",
    "{{ageLimitMin}}": String(post.ageLimit?.min ?? ""),
    "{{ageLimitMax}}": String(post.ageLimit?.max ?? ""),
    "{{applicationFeeGeneral}}": String(post.applicationFee?.general ?? ""),
    "{{examDate}}": formatDate(post.dates?.examDate || post.examDate),
    "{{admitCardDate}}": formatDate(post.dates?.admitCard),
    "{{applyLastDate}}": formatDate(
      post.dates?.applyEnd || post.dates?.regLastDate || post.applyLastDate
    ),
    "{{selectionProcess}}": selProcess,
    "{{state}}": post.state || "",
    "{{location}}": post.location || "India",
  };
}

// ── Inject variables into one block ───────────────────────────
function injectBlock(block, variables) {
  let content = block.content;
  for (const [placeholder, value] of Object.entries(variables)) {
    content = content.replaceAll(placeholder, value);
  }
  return { blockId: block.blockId, type: block.type, content };
}

// ── Simple hash for deterministic selection ───────────────────
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ── Deterministic weighted block pick ─────────────────────────
function seededPickBlocks(blocks, count, seed) {
  const sorted = [...blocks].sort((a, b) => {
    const scoreA = (hashCode(a.blockId + seed) % 100) * (a.weight || 1);
    const scoreB = (hashCode(b.blockId + seed) % 100) * (b.weight || 1);
    return scoreB - scoreA;
  });
  return sorted.slice(0, count);
}

// ── Random weighted block pick ────────────────────────────────
function pickWeightedBlocks(blocks, count) {
  const pool = blocks.flatMap((block) => Array(block.weight || 1).fill(block));
  const picked = [];
  const usedIds = new Set();

  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    const block = pool[idx];
    if (!usedIds.has(block.blockId)) {
      picked.push(block);
      usedIds.add(block.blockId);
    }
    pool.splice(
      0,
      pool.length,
      ...pool.filter((b) => b.blockId !== block.blockId)
    );
  }

  return picked;
}

// ── MAIN: Generate content for a post ─────────────────────────
function generateHumanContent(post, templateBlocks, options = {}) {
  const { blockCount = 4, deterministicSeed = null } = options;

  const variables = buildVariables(post);

  const selectedBlocks = deterministicSeed
    ? seededPickBlocks(templateBlocks, blockCount, hashCode(deterministicSeed))
    : pickWeightedBlocks(templateBlocks, blockCount);

  const injectedBlocks = selectedBlocks.map((block) =>
    injectBlock(block, variables)
  );

  return {
    blocks: injectedBlocks,
    wordCount: injectedBlocks.reduce(
      (sum, b) => sum + b.content.split(/\s+/).length,
      0
    ),
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateHumanContent, buildVariables, formatDate };
