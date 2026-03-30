/**
 * Thin-content checker + auto noIndex logic.
 *
 * countWords(text)        — returns word count from HTML/text
 * shouldNoIndex(doc)      — returns true if doc is thin content (< MIN_WORD_COUNT)
 * applyNoIndexFlag(doc)   — mutates doc.noIndex & doc.wordCount, returns doc
 */

const sanitizeHtml = require("sanitize-html");

const MIN_WORD_COUNT = 300; // pages below this → noindex

/**
 * Strips HTML tags and counts words.
 */
const countWords = (text = "") => {
  const plain = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return 0;
  return plain.split(/\s+/).length;
};

/**
 * Collects all textual content from a job-post or blog document and returns total word count.
 */
const getDocWordCount = (doc) => {
  if (!doc) return 0;

  const parts = [
    doc.title,
    doc.jobtitle,
    doc.excerpt,
    doc.intro,
    doc.aboutScheme,
    doc.process,
    doc.disclaimer,
    doc.examPreparationStrategy,
    doc.syllabusBreakdown,
    doc.physicalTestDetails,
    doc.selectionProcess,
  ].filter(Boolean);

  // Blog sections
  if (Array.isArray(doc.sections)) {
    for (const sec of doc.sections) {
      if (sec.heading) parts.push(sec.heading);
      if (Array.isArray(sec.paragraphs)) parts.push(...sec.paragraphs);
      if (Array.isArray(sec.bullets)) parts.push(...sec.bullets);
    }
  }

  // Scraped HTML content
  if (doc.scrapedContent?.contentHtml) {
    parts.push(doc.scrapedContent.contentHtml);
  }

  return countWords(parts.join(" "));
};

const shouldNoIndex = (doc) => getDocWordCount(doc) < MIN_WORD_COUNT;

/**
 * Sets wordCount & noIndex on the document (plain object).
 */
const applyNoIndexFlag = (doc) => {
  if (!doc) return doc;
  const wc = getDocWordCount(doc);
  doc.wordCount = wc;
  doc.noIndex = wc < MIN_WORD_COUNT;
  return doc;
};

module.exports = { countWords, getDocWordCount, shouldNoIndex, applyNoIndexFlag, MIN_WORD_COUNT };
