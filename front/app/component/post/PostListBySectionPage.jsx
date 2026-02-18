"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Filter,
} from "lucide-react";

function formatPostDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

// small debounce hook
function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function PostListBySectionPage({
  heading = "Posts",
  description = "",
  megaTitle = "",
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [posts, setPosts] = useState([]);

  // pagination + search state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0); // optional; backend might not send
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 350);

  const [sort, setSort] = useState("newest"); // newest | oldest
  const [onlyWithAi, setOnlyWithAi] = useState(false);

  const controllerRef = useRef(null);

  const totalPages = useMemo(() => {
    if (total && limit) return Math.max(1, Math.ceil(total / limit));
    // fallback when backend doesn't return total
    // we can’t know total pages; keep UI usable with "Next" disabled when fewer items than limit
    return 0;
  }, [total, limit]);

  const canPrev = page > 1;
  const canNext = useMemo(() => {
    if (totalPages) return page < totalPages;
    // fallback heuristic
    return posts.length === limit;
  }, [totalPages, page, posts.length, limit]);

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("megaTitle", megaTitle);
    params.set("page", String(page));
    params.set("limit", String(limit));
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (sort) params.set("sort", sort);
    if (onlyWithAi) params.set("ai", "1");
    return `/api/postlist-by-section?${params.toString()}`;
  };

  const reload = async () => {
    if (!megaTitle) return;

    // cancel previous request
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(buildUrl(), {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const payload = await response.json().catch(() => null);

      // expected shapes:
      // { success:true, data:[...], pagination:{page,limit,total,totalPages} }
      // OR { success:true, data:[...], total, page, limit }
      if (!response.ok || !payload?.success || !Array.isArray(payload?.data)) {
        throw new Error(payload?.message || "Unable to load post list");
      }

      setPosts(payload.data || []);

      const p =
        payload?.pagination ||
        (payload?.total !== undefined
          ? {
              page: payload?.page,
              limit: payload?.limit,
              total: payload?.total,
              totalPages: payload?.totalPages,
            }
          : null);

      if (p?.total !== undefined) setTotal(Number(p.total) || 0);
      else setTotal(0);
    } catch (error) {
      if (error.name !== "AbortError") {
        setErrorMessage(error.message || "Unable to load post list");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // reset page when megaTitle/search/filter changes
  useEffect(() => {
    setPage(1);
  }, [megaTitle, debouncedQuery, sort, onlyWithAi, limit]);

  useEffect(() => {
    if (!megaTitle) {
      setIsLoading(false);
      setErrorMessage("megaTitle is required");
      return;
    }
    reload();

    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [megaTitle, page, limit, debouncedQuery, sort, onlyWithAi]);

  const headerSubtitle = useMemo(() => {
    const bits = [];
    if (megaTitle) bits.push(megaTitle);
    if (debouncedQuery.trim()) bits.push(`Search: "${debouncedQuery.trim()}"`);
    if (onlyWithAi) bits.push("AI-ready only");
    return bits.join(" • ");
  }, [megaTitle, debouncedQuery, onlyWithAi]);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-5 text-white">
            <h1 className="text-2xl font-bold">{heading}</h1>
            <p className="mt-1 text-sm text-indigo-100">
              {description || "Browse jobs, open details, and track updates."}
            </p>
          </div>

          {/* Controls */}
          <div className="px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts by title…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
                      aria-label="Clear search"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => reload()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  title="Refresh"
                >
                  <RefreshCcw className={cx("h-4 w-4", isLoading && "animate-spin")} />
                  Refresh
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    aria-label="Sort"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-sm font-semibold text-slate-700">
                    Page size
                  </span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value) || 20)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    aria-label="Page size"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setOnlyWithAi((v) => !v)}
                  className={cx(
                    "rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition",
                    onlyWithAi
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                  title="Show only posts which have AI formatted data"
                >
                  AI-ready
                </button>
              </div>
            </div>

            {headerSubtitle ? (
              <p className="mt-3 text-xs text-slate-500">{headerSubtitle}</p>
            ) : null}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={`post-loading-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="skeleton-shimmer mb-2 h-4 w-11/12 rounded-md" />
                <div className="skeleton-shimmer h-3 w-1/3 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* Empty */}
        {!isLoading && !errorMessage && posts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No posts found for this section.
          </div>
        )}

        {/* List */}
        {!isLoading && !errorMessage && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3">
              {posts.map((post, index) => {
                const canonicalKey = String(post?.canonicalKey || "").trim();
                const title = String(post?.title || "Untitled Post").trim();
                const posted = formatPostDate(post?.postDate || post?.createdAt);
                const source = String(post?.sourceSiteName || post?.source || "").trim();
                const aiReady = Boolean(post?.aiScraped || post?.aiData);
                const key = `${canonicalKey || title}-${index}`;

                const Card = (
                  <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-sm font-semibold text-slate-900">
                          {title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                            {posted ? `Posted: ${posted}` : "Date NA"}
                          </span>

                          {source ? (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5">
                              {source}
                            </span>
                          ) : null}

                          <span
                            className={cx(
                              "rounded-full px-2 py-0.5 font-semibold",
                              aiReady
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-50 text-slate-600",
                            )}
                          >
                            {aiReady ? "AI ready" : "Raw"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition group-hover:border-indigo-200 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                );

                if (!canonicalKey) return <div key={key}>{Card}</div>;

                return (
                  <Link
                    key={key}
                    href={`/post/${encodeURIComponent(canonicalKey)}`}
                    className="block"
                  >
                    {Card}
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Page:</span>{" "}
                {page}
                {totalPages ? ` / ${totalPages}` : ""}
                {total ? (
                  <>
                    {" "}
                    • <span className="font-semibold text-slate-800">Total:</span>{" "}
                    {total}
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev || isLoading}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    !canPrev || isLoading
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  <button
                    type="button"
                    onClick={() => setPage(1)}
                    disabled={page === 1 || isLoading}
                    className={cx(
                      "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                      page === 1 || isLoading
                        ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                  >
                    First
                  </button>

                  {totalPages ? (
                    <button
                      type="button"
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages || isLoading}
                      className={cx(
                        "rounded-xl border px-3 py-2 text-sm font-semibold transition",
                        page === totalPages || isLoading
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                      )}
                    >
                      Last
                    </button>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!canNext || isLoading}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition",
                    !canNext || isLoading
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer note */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Tip: Use search to quickly find a job, then open details to enable notification.
        </div>
      </main>
    </div>
  );
}
