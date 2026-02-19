import { baseUrl } from "@/app/lib/baseUrl";
import { NextResponse } from "next/server";

const SECTION_TO_MEGA_TITLE = {
  "latest job": "Latest Gov Jobs",
  "latest jobs": "Latest Gov Jobs",
  "admit card": "Admit Cards",
  "admit cards": "Admit Cards",
  result: "Recent Results",
  results: "Recent Results",
  admission: "Admission Form",
  admissions: "Admission Form",
  "answer key": "Answer Keys",
  "answer keys": "Answer Keys",
  "previous year paper": "Previous Year Paper",
  "previous year papers": "Previous Year Paper",
};

function toText(value) {
  return String(value || "").trim();
}

function resolveMegaTitle(sectionTitle) {
  const key = toText(sectionTitle).toLowerCase();
  return SECTION_TO_MEGA_TITLE[key] || toText(sectionTitle);
}

function toSlug(value) {
  return toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSectionsPayload(payload) {
  const data = Array.isArray(payload?.data) ? payload.data : [];
  if (data.length === 0) return [];

  const hasDirectTitle = data.some((item) => toText(item?.title));
  if (hasDirectTitle) {
    return data.map((item) => ({
      ...item,
      title: toText(item?.title),
      slug: toText(item?.slug) || toSlug(item?.title),
      megaTitle: toText(item?.megaTitle) || toText(item?.title),
    }));
  }

  const normalized = [];
  for (const site of data) {
    const sections = Array.isArray(site?.sections) ? site.sections : [];
    for (const section of sections) {
      const sectionTitle = toText(section?.title);
      if (!sectionTitle) continue;
      const megaTitle = resolveMegaTitle(sectionTitle);
      normalized.push({
        title: megaTitle,
        megaTitle,
        slug: toSlug(megaTitle),
        sectionTitle,
        sectionUrl: toText(section?.url),
        siteName: toText(site?.name),
        siteUrl: toText(site?.url),
      });
    }
  }
  return normalized;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  return { response, payload };
}

export async function GET() {
  const primaryUrl = `${baseUrl}/site/mega-sections`;
  const fallbackUrl = `${baseUrl}/sections/get-sections`;

  try {
    const primary = await fetchJson(primaryUrl);
    const primarySections = normalizeSectionsPayload(primary.payload);
    if (primary.payload && primarySections.length > 0) {
      return NextResponse.json(
        {
          ...primary.payload,
          count: primarySections.length,
          data: primarySections,
        },
        { status: primary.response.status },
      );
    }

    const fallback = await fetchJson(fallbackUrl);
    const fallbackSections = normalizeSectionsPayload(fallback.payload);
    if (fallback.payload && fallbackSections.length > 0) {
      return NextResponse.json(
        {
          ...fallback.payload,
          count: fallbackSections.length,
          data: fallbackSections,
        },
        { status: fallback.response.status },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid response from upstream service",
      },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to upstream service",
      },
      { status: 502 },
    );
  }
}
