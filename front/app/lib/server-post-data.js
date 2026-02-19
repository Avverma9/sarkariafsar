import "server-only";

import { baseUrl } from "./baseUrl";
import { normalizePostDetails } from "./post-details";

function parseNumber(value, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function parseBoolFlag(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true";
}

export function parsePostListQuery(searchParams = {}, megaTitle = "") {
  const page = parseNumber(searchParams?.page, 1);
  const limit = Math.min(100, parseNumber(searchParams?.limit, 20));
  const q = String(searchParams?.q || "").trim();
  const sort = String(searchParams?.sort || "newest").trim() || "newest";
  const ai = parseBoolFlag(searchParams?.ai);

  return {
    megaTitle: String(megaTitle || "").trim(),
    page,
    limit,
    q,
    sort,
    ai,
  };
}

export function buildPostListParams(query) {
  const params = new URLSearchParams({
    megaTitle: String(query?.megaTitle || "").trim(),
    page: String(query?.page || 1),
    limit: String(query?.limit || 20),
  });

  if (String(query?.q || "").trim()) params.set("q", String(query.q).trim());
  if (String(query?.sort || "").trim()) params.set("sort", String(query.sort).trim());
  if (query?.ai) params.set("ai", "1");
  return params;
}

function extractPostListState(payload, fallbackQuery) {
  const data = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload?.result)
      ? payload.result
      : [];

  const pagination =
    payload?.pagination ||
    (payload?.total !== undefined
      ? {
          page: payload?.page,
          limit: payload?.limit,
          total: payload?.total,
          totalPages: payload?.totalPages,
        }
      : {});

  return {
    success: true,
    posts: data,
    page: Number(pagination?.page || fallbackQuery?.page || 1),
    limit: Number(pagination?.limit || fallbackQuery?.limit || 20),
    total: Number(pagination?.total || 0),
    q: String(fallbackQuery?.q || ""),
    sort: String(fallbackQuery?.sort || "newest"),
    ai: Boolean(fallbackQuery?.ai),
  };
}

export async function fetchPostListInitialState(searchParams = {}, megaTitle = "") {
  const parsedQuery = parsePostListQuery(searchParams, megaTitle);
  if (!parsedQuery.megaTitle) {
    return {
      success: false,
      posts: [],
      page: 1,
      limit: 20,
      total: 0,
      q: "",
      sort: "newest",
      ai: false,
      errorMessage: "megaTitle is required",
    };
  }

  try {
    const params = buildPostListParams(parsedQuery);
    const response = await fetch(`${baseUrl}/site/post-list-by-section-url?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      return {
        success: false,
        posts: [],
        page: parsedQuery.page,
        limit: parsedQuery.limit,
        total: 0,
        q: parsedQuery.q,
        sort: parsedQuery.sort,
        ai: parsedQuery.ai,
        errorMessage: payload?.message || "Unable to load post list",
      };
    }

    return extractPostListState(payload, parsedQuery);
  } catch {
    return {
      success: false,
      posts: [],
      page: parsedQuery.page,
      limit: parsedQuery.limit,
      total: 0,
      q: parsedQuery.q,
      sort: parsedQuery.sort,
      ai: parsedQuery.ai,
      errorMessage: "Unable to load post list",
    };
  }
}

export async function fetchPostDetailsInitialState(canonicalKey = "") {
  const key = String(canonicalKey || "").trim();
  if (!key) {
    return {
      details: null,
      errorMessage: "canonicalKey is required",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/post/scrape`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ canonicalKey: key }),
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      return {
        details: null,
        errorMessage: payload?.message || "Unable to load post details",
      };
    }

    return {
      details: normalizePostDetails(payload),
      errorMessage: "",
    };
  } catch {
    return {
      details: null,
      errorMessage: "Unable to load post details",
    };
  }
}
