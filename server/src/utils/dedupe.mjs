import crypto from "crypto";

const clean = (t) => String(t || "").toLowerCase().replace(/\s+/g, " ").trim();

const STOP_WORDS = new Set([
  "apply", "online", "form", "notification", "recruitment", "vacancy",
  "new", "latest", "download", "check", "link", "post", "posts",
  "admit", "card", "result", "answer", "key",
  "2020","2021","2022","2023","2024","2025","2026","2027","2028","2029","2030"
]);

function normalizeTitle(title) {
  let t = clean(title);

  // remove years
  t = t.replace(/\b20\d{2}\b/g, "");

  // normalize symbols
  t = t.replace(/[\[\]\(\)\{\}]/g, " ");
  t = t.replace(/[^a-z0-9\/\s]/g, " "); // keep advt like 01/2026
  t = t.replace(/\s+/g, " ").trim();

  return t;
}

// Extract strong identifiers like Advt No, CEN, etc.
function extractIdentifiers(title) {
  const t = clean(title);

  const ids = [];

  // Advt / Notification patterns
  const advt = t.match(/\b(advt|advertisement|notification|noti)\s*(no|number)?\s*[:\-]?\s*([a-z0-9\/\-]+)\b/i);
  if (advt?.[3]) ids.push(`advt:${advt[3]}`);

  // CEN / Employment Notice patterns (RRB etc.)
  const cen = t.match(/\bcen\s*[:\-]?\s*([0-9\/\-]+)\b/i);
  if (cen?.[1]) ids.push(`cen:${cen[1]}`);

  // Common code like 01/2026
  const code = t.match(/\b\d{1,2}\/20\d{2}\b/);
  if (code?.[0]) ids.push(`code:${code[0]}`);

  // Big org keywords
  const orgs = ["ssc", "upsc", "rrb", "ibps", "railway", "bpsc", "upsssc", "csir", "isro", "aiims"];
  for (const o of orgs) {
    if (t.includes(o)) ids.push(`org:${o}`);
  }

  return ids;
}

function tokenKey(title) {
  const t = normalizeTitle(title);
  const tokens = t
    .split(" ")
    .map((w) => w.trim())
    .filter(Boolean)
    .filter((w) => !STOP_WORDS.has(w))
    .map((w) => w.replace(/\/+/g, "/")); // keep 01/2026 stable

  // remove very short noise tokens
  const filtered = tokens.filter((w) => w.length >= 3);

  // sort for stable key
  filtered.sort();

  return filtered.join("|");
}

function slugifyForCanonical(input) {
  return String(input || "")
    .toLowerCase()
    .replace(/\/+/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortHash(input) {
  return crypto.createHash("sha1").update(String(input || "")).digest("hex").slice(0, 8);
}

/**
 * Returns:
 *  - canonicalKey: strong stable key for unique index
 *  - altKeys: extra keys for duplicate detection
 */
export function buildDedupeKeys(title, url = "") {
  const canonical = tokenKey(title);

  const ids = extractIdentifiers(title);
  const urlKey = url ? clean(url).replace(/\/+$/, "") : "";

  const sortedIds = ids.sort();
  // prefer id-based if present (strongest)
  const strongest = sortedIds.length ? `${sortedIds.join("|")}|${canonical}` : canonical;

  // URL-param friendly canonical key (readable slug + short hash for uniqueness)
  const slugSource = `${sortedIds.join(" ")} ${canonical.replace(/\|/g, " ")}`.trim();
  const slug = slugifyForCanonical(slugSource || normalizeTitle(title));
  const canonicalKey = slug ? `${slug}-${shortHash(strongest || slug)}` : shortHash(strongest || urlKey || title);

  return {
    canonicalKey,
    altKeys: {
      urlKey,
      tokenKey: canonical,
      idKey: sortedIds.join("|"),
    },
  };
}
