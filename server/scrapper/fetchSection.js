const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const router = express.Router();

const BASE_URL = "https://sarkariresult.com.cm";
const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

function cleanText(value = "") {
  return value.replace(/\s+/g, " ").replace(/\u00a0/g, " ").trim();
}

function absoluteUrl(url = "") {
  if (!url) return "";
  try {
    return new URL(url, BASE_URL).toString();
  } catch {
    return url;
  }
}

function isValidSectionTitle(title = "") {
  const text = cleanText(title);
  if (!text) return false;

  const invalidPatterns = [
    "sarkariresult tools",
    "find latest sarkari job",
  ];

  return !invalidPatterns.some((pattern) => text.toLowerCase().includes(pattern));
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: DEFAULT_HEADERS,
    timeout: 30000,
    maxRedirects: 5,
  });

  return response.data;
}

async function scrapeSections() {
  const html = await fetchHtml(BASE_URL);
  const $ = cheerio.load(html);

  const sections = [];

  $(".gb-inside-container").each((_, block) => {
    const blockNode = $(block);
    const sectionName = cleanText(
      blockNode.children("p, h2, h3, h4").first().text()
    );

    if (!isValidSectionTitle(sectionName)) {
      return;
    }

    const sectionUrl = absoluteUrl(
      blockNode
        .find(".wp-block-button a, a.wp-block-button__link")
        .first()
        .attr("href")
    );

    if (!sectionUrl) {
      return;
    }

    sections.push({
      sectionName,
      sectionUrl,
    });
  });

  return sections;
}

router.get("/sarkariresult/sections", async (req, res, next) => {
  try {
    const sections = await scrapeSections();

    return res.status(200).json({
      success: true,
      message: "Sections scraped successfully",
      data: sections,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = {
  router,
  scrapeSections,
};
