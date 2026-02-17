import crypto from "crypto";
import * as cheerio from "cheerio";

function sha256(str) {
  return crypto.createHash("sha256").update(String(str || ""), "utf8").digest("hex");
}

const NOISY_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "ins.adsbygoogle",
  ".adsbygoogle",
  ".social-buttons",
  ".whatsapp",
  ".telegram",
  "[class*='ads']",
  "[id*='ads']",
  "[class*='cookie']",
  "[id*='cookie']",
];

export function normalizeHtmlForHash(contentHtml) {
  const $ = cheerio.load(contentHtml || "");

  $(NOISY_SELECTORS.join(",")).remove();

  $("*").each((_, el) => {
    const attrs = el.attribs || {};
    for (const key of Object.keys(attrs)) {
      if (
        key.startsWith("data-") ||
        key === "style" ||
        key === "onclick" ||
        key === "onload" ||
        key === "onerror" ||
        key === "aria-label" ||
        key === "target" ||
        key === "rel" ||
        key === "nonce" ||
        key === "integrity" ||
        key === "crossorigin"
      ) {
        $(el).removeAttr(key);
      }
    }
  });

  const cleaned = $.root().html() || "";
  return cleaned.replace(/\s+/g, " ").trim();
}

function normalizeTextForHash(contentHtml) {
  const $ = cheerio.load(contentHtml || "");
  $("script, style, noscript, iframe").remove();
  const text = ($("body").text() || $.root().text() || "").replace(/\s+/g, " ").trim();
  return text;
}

export function buildContentHashes({ contentHtml } = {}) {
  const normalizedHtml = normalizeHtmlForHash(contentHtml || "");
  const normalizedText = normalizeTextForHash(contentHtml || "");

  return {
    htmlStableHash: sha256(normalizedHtml),
    textHash: sha256(normalizedText),
  };
}

