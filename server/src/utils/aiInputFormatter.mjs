import * as cheerio from "cheerio";

const IMPORTANT_LINK_WORDS = [
  "apply",
  "registration",
  "notification",
  "official",
  "syllabus",
  "pattern",
  "admit",
  "result",
  "answer key",
  "faq",
];

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function compactRows(rows = [], maxRows = 200) {
  const out = [];
  for (const row of rows.slice(0, maxRows)) {
    const cells = row
      .map((cell) => normalizeText(cell))
      .filter(Boolean);
    if (cells.length) out.push(cells.join(" | "));
  }
  return out;
}

export function buildCompactAiInput({
  title = "",
  sourceUrl = "",
  contentHtml = "",
  fallbackText = "",
  maxChars = Number(process.env.AI_INPUT_MAX_CHARS || 60000),
} = {}) {
  const $ = cheerio.load(contentHtml || "");

  // Remove noisy/irrelevant blocks to save tokens.
  $(
    "script,style,noscript,iframe,ins.adsbygoogle,.adsbygoogle,.social-buttons,.whatsapp,.telegram,[class*='ads'],[id*='ads'],[class*='cookie'],[id*='cookie']",
  ).remove();

  const text = normalizeText($.root().text()) || normalizeText(fallbackText);

  const tableRows = [];
  $("table tr").each((_, tr) => {
    const cells = [];
    $(tr)
      .find("th,td")
      .each((__, td) => {
        const val = normalizeText($(td).text());
        if (val) cells.push(val);
      });
    if (cells.length) tableRows.push(cells);
  });

  const importantLinks = [];
  $("a").each((_, a) => {
    const textVal = normalizeText($(a).text());
    const href = normalizeText($(a).attr("href"));
    const hay = `${textVal} ${href}`.toLowerCase();
    if (!href) return;
    if (IMPORTANT_LINK_WORDS.some((w) => hay.includes(w))) {
      importantLinks.push(`${textVal || "(no-text)"} => ${href}`);
    }
  });

  const uniqueLinks = Array.from(new Set(importantLinks)).slice(0, 60);
  const uniqueRows = compactRows(tableRows, 250);

  const payload = [
    `TITLE: ${normalizeText(title)}`,
    `SOURCE_URL: ${normalizeText(sourceUrl)}`,
    "",
    "MAIN_TEXT:",
    text,
    "",
    "TABLE_ROWS:",
    uniqueRows.join("\n"),
    "",
    "IMPORTANT_LINKS:",
    uniqueLinks.join("\n"),
  ]
    .join("\n")
    .trim();

  if (payload.length <= maxChars) return payload;
  return `${payload.slice(0, maxChars)}\n\n[TRUNCATED_FOR_TOKEN_SAVING]`;
}

