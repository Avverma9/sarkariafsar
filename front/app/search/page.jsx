import Link from "next/link";
import { baseUrl } from "../lib/baseUrl";
import { buildMetadata } from "../lib/seo";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 10000;
const LIMIT_OPTIONS = [20, 50, 100, 200];

function parseParam(searchParams, key) {
  const raw = searchParams?.[key];
  if (Array.isArray(raw)) return String(raw[0] || "");
  return String(raw || "");
}

function parseSearchQuery(searchParams) {
  return parseParam(searchParams, "q").trim();
}

function parsePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function parseSearchPage(searchParams) {
  return parsePositiveInt(parseParam(searchParams, "page"), 1);
}

function parseSearchLimit(searchParams) {
  return Math.min(MAX_LIMIT, parsePositiveInt(parseParam(searchParams, "limit"), DEFAULT_LIMIT));
}

function buildPageHref(query, page, limit) {
  const params = new URLSearchParams({
    q: query,
    page: String(Math.max(1, page)),
    limit: String(Math.max(1, limit)),
  });
  return `/search?${params.toString()}`;
}

function buildPageWindow(page, totalPages) {
  if (totalPages <= 1) return [1];
  const safePage = Math.max(1, Math.min(page, totalPages));
  const start = Math.max(1, safePage - 2);
  const end = Math.min(totalPages, safePage + 2);

  const pages = [];
  if (start > 1) pages.push(1);
  if (start > 2) pages.push("...");
  for (let current = start; current <= end; current += 1) pages.push(current);
  if (end < totalPages - 1) pages.push("...");
  if (end < totalPages) pages.push(totalPages);
  return pages;
}

async function fetchSearchResults(query, page, limit) {
  if (!query || query.length < 3) {
    return {
      items: [],
      message: "",
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
    };
  }

  const params = new URLSearchParams({
    title: query,
    page: String(page),
    limit: String(limit),
  });

  try {
    const response = await fetch(`${baseUrl}/site/find-by-title?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    const data = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.result)
        ? payload.result
        : [];
    const pagination = payload?.pagination || {};
    const total = Number(pagination?.total ?? payload?.total ?? 0) || 0;
    const resolvedPage = Math.max(1, Number(pagination?.page || page) || page);
    const resolvedLimit = Math.max(1, Number(pagination?.limit || limit) || limit);
    const pagesFromPayload = Number(pagination?.pages || pagination?.totalPages || 0) || 0;
    const totalPages = pagesFromPayload || (total ? Math.max(1, Math.ceil(total / resolvedLimit)) : 0);

    if (!response.ok) {
      return {
        items: [],
        message: payload?.message || "Unable to search right now.",
        page: resolvedPage,
        limit: resolvedLimit,
        total,
        totalPages,
      };
    }

    return {
      items: data,
      message: "",
      page: resolvedPage,
      limit: resolvedLimit,
      total,
      totalPages,
    };
  } catch {
    return {
      items: [],
      message: "Unable to search right now.",
      page: 1,
      limit,
      total: 0,
      totalPages: 0,
    };
  }
}

export async function generateMetadata({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const query = parseSearchQuery(resolvedSearchParams);
  const title = query
    ? `Search: ${query}`
    : "Search Government Jobs and Results";
  const description = query
    ? `Search results for "${query}" across job posts, admit cards, answer keys, and results.`
    : "Search verified job posts, admit cards, answer keys, and results.";

  return buildMetadata({
    title,
    description,
    path: "/search",
    type: "SearchResultsPage",
    noIndex: true,
    keywords: ["search jobs", "search sarkari result", "find government post"],
  });
}

export default async function SearchPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const query = parseSearchQuery(resolvedSearchParams);
  const requestedPage = parseSearchPage(resolvedSearchParams);
  const requestedLimit = parseSearchLimit(resolvedSearchParams);
  const { items, message, page, limit, total, totalPages } = await fetchSearchResults(
    query,
    requestedPage,
    requestedLimit,
  );
  const pageWindow = buildPageWindow(page, totalPages);
  const canPrev = page > 1;
  const canNext = totalPages > 0 && page < totalPages;
  const activeLimitOptions = LIMIT_OPTIONS.includes(limit)
    ? LIMIT_OPTIONS
    : [...LIMIT_OPTIONS, limit].sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-5 text-white">
            <h1 className="text-2xl font-bold">Search Results</h1>
            <p className="mt-1 text-sm text-indigo-100">
              {query ? `Results for "${query}"` : "Search for jobs, results, and updates."}
            </p>
          </div>
        </div>

        {!query && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Enter at least 3 characters in search.
          </div>
        )}

        {query && query.length < 3 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Please enter at least 3 characters.
          </div>
        )}

        {query && query.length >= 3 && message && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {message}
          </div>
        )}

        {query && query.length >= 3 && !message && items.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No matching posts found.
          </div>
        )}

        {query && query.length >= 3 && !message && items.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-700">
                  Showing <span className="font-semibold text-slate-900">{items.length}</span> results
                  {total > 0 ? (
                    <>
                      {" "}
                      out of <span className="font-semibold text-slate-900">{total}</span>
                    </>
                  ) : null}
                  {totalPages > 0 ? (
                    <>
                      {" "}
                      on page <span className="font-semibold text-slate-900">{page}</span> of{" "}
                      <span className="font-semibold text-slate-900">{totalPages}</span>
                    </>
                  ) : null}
                  .
                </p>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Limit
                  </span>
                  {activeLimitOptions.map((option) => (
                    <Link
                      key={`limit-${option}`}
                      href={buildPageHref(query, 1, option)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                        option === limit
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                      }`}
                    >
                      {option}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {items.map((item, index) => {
                const canonicalKey = String(item?.canonicalKey || "").trim();
                const title = String(item?.title || "Untitled Post").trim();
                const key = String(item?.postId || `${canonicalKey}-${index}`);

                const card = (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                    <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">{title}</h2>
                    <p className="mt-2 text-xs text-slate-500">
                      {item?.jobType || item?.megaTitle || item?.megaSlug || "General"}
                    </p>
                  </div>
                );

                if (!canonicalKey) {
                  return <div key={key}>{card}</div>;
                }

                return (
                  <Link key={key} href={`/post/${encodeURIComponent(canonicalKey)}`}>
                    {card}
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {canPrev ? (
                      <Link
                        href={buildPageHref(query, page - 1, limit)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                      >
                        Previous
                      </Link>
                    ) : (
                      <span className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
                        Previous
                      </span>
                    )}

                    {canNext ? (
                      <Link
                        href={buildPageHref(query, page + 1, limit)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
                      >
                        Next
                      </Link>
                    ) : (
                      <span className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
                        Next
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {pageWindow.map((entry, index) => {
                      if (entry === "...") {
                        return (
                          <span
                            key={`dots-${index}`}
                            className="px-1.5 text-xs font-semibold text-slate-500"
                          >
                            ...
                          </span>
                        );
                      }

                      const pageNumber = Number(entry);
                      const isActive = pageNumber === page;
                      return (
                        <Link
                          key={`page-${pageNumber}`}
                          href={buildPageHref(query, pageNumber, limit)}
                          className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition ${
                            isActive
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                              : "border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-700"
                          }`}
                        >
                          {pageNumber}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
