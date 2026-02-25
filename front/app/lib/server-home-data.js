import "server-only";

import { cache } from "react";
import { baseUrl } from "./baseUrl";
import { normalizeSectionsData } from "./sections";

const DEFAULT_DAYS = 5;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const TICKER_SECTION_LIMIT = 6;
const TICKER_ITEMS_LIMIT = 8;

const FALLBACK_UPDATES = [
  "RRB Group D 2026 Notification Out",
  "SSC CGL 2025 Final Result Declared",
  "UP Police Constable Admit Card Released",
  "Bihar STET 2026 Online Form Started",
];

function parsePositiveInt(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function parseDeadlineRequestBody(input = {}) {
  return {
    days: parsePositiveInt(input.days, DEFAULT_DAYS),
    page: parsePositiveInt(input.page, DEFAULT_PAGE),
    limit: Math.min(MAX_LIMIT, parsePositiveInt(input.limit, DEFAULT_LIMIT)),
  };
}

function getPayloadData(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json().catch(() => null);
  } catch {
    return null;
  }
}

async function fetchPostListByMegaTitle(megaTitle, page = 1, limit = 100) {
  const title = String(megaTitle || "").trim();
  if (!title) return [];

  const params = new URLSearchParams({
    megaTitle: title,
    page: String(page),
    limit: String(limit),
  });
  const payload = await fetchJson(`${baseUrl}/site/post-list-by-section-url?${params.toString()}`);
  return getPayloadData(payload);
}

const fetchSections = cache(async function fetchSectionsCached() {
  const primaryPayload = await fetchJson(`${baseUrl}/site/mega-sections`);
  const primarySections = normalizeSectionsData(primaryPayload?.data);
  if (primarySections.length > 0) return primarySections;

  const fallbackPayload = await fetchJson(`${baseUrl}/sections/get-sections`);
  return normalizeSectionsData(fallbackPayload?.data);
});

export const getTickerUpdates = cache(async function getTickerUpdatesCached() {
  const sections = await fetchSections();
  if (sections.length === 0) return FALLBACK_UPDATES;

  const selectedSections = sections
    .map((section) => ({
      label: String(section?.title || "").trim(),
      megaTitle: String(section?.megaTitle || section?.title || "").trim(),
    }))
    .filter((section) => section.label && section.megaTitle)
    .slice(0, TICKER_SECTION_LIMIT);

  if (selectedSections.length === 0) return FALLBACK_UPDATES;

  const postsPerSection = await Promise.all(
    selectedSections.map(async (sectionInfo) => {
      const rows = await fetchPostListByMegaTitle(sectionInfo.megaTitle, 1, 2);
      return rows
        .map((post) => {
          const title = String(post?.title || "").trim();
          if (!title) return "";
          return `${title} (${sectionInfo.label})`;
        })
        .filter(Boolean);
    }),
  );

  const merged = postsPerSection.flat();
  const deduped = Array.from(new Set(merged)).slice(0, TICKER_ITEMS_LIMIT);
  return deduped.length > 0 ? deduped : FALLBACK_UPDATES;
});

async function fetchDeadlineItems(body = {}) {
  const normalizedBody = parseDeadlineRequestBody(body);
  const params = new URLSearchParams({
    days: String(normalizedBody.days),
    page: String(normalizedBody.page),
    limit: String(normalizedBody.limit),
  });
  const payload = await fetchJson(`${baseUrl}/site/deadline-jobs?${params.toString()}`);
  return getPayloadData(payload);
}

async function fetchTrendingItems() {
  const params = new URLSearchParams({
    page: "1",
    limit: "20",
    megaSlug: "latest-gov-jobs",
  });
  const payload = await fetchJson(`${baseUrl}/site/trending-jobs?${params.toString()}`);
  const rows = getPayloadData(payload);
  if (rows.length > 0) return rows;

  const fallback = await fetchPostListByMegaTitle("Latest Gov Jobs", 1, 20);
  return Array.isArray(fallback) ? fallback : [];
}

async function fetchSectionPostsByMegaTitle(sections, limit = 100) {
  const entries = await Promise.all(
    sections.map(async (section) => {
      const megaTitle = String(section?.megaTitle || section?.title || "").trim();
      if (!megaTitle) return ["", []];
      const rows = await fetchPostListByMegaTitle(megaTitle, 1, limit);
      return [megaTitle, rows];
    }),
  );

  return Object.fromEntries(entries.filter(([key]) => key));
}

export async function getHomePageData() {
  const [sections, trendingItems, deadlineItems] = await Promise.all([
    fetchSections(),
    fetchTrendingItems(),
    fetchDeadlineItems({ days: 5, page: 1, limit: 50 }),
  ]);

  const postsByMegaTitle = await fetchSectionPostsByMegaTitle(sections, 100);

  return {
    sections,
    trendingItems,
    deadlineItems,
    postsByMegaTitle,
  };
}
