"use client";

import {
  BriefcaseBusiness,
  Circle,
  ClipboardCheck,
  FileCheck2,
  House,
  Menu,
  Search,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { buildPublicApiUrl, fetchJsonWithFallback } from "@/app/lib/clientApi";

const FALLBACK_UPDATES = [
  "RRB Group D 2026 Notification Out",
  "SSC CGL 2025 Final Result Declared",
  "UP Police Constable Admit Card Released",
  "Bihar STET 2026 Online Form Started",
];

function getSearchItems(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

export default function Header({ initialTickerUpdates = [] }) {
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const trimmedSearchQuery = searchQuery.trim();
  const shouldShowSuggestions = showSuggestions && trimmedSearchQuery.length >= 3;

  const tickerUpdates = useMemo(() => {
    // Keep server HTML and first client render identical to avoid hydration mismatch.
    if (!isHydrated) return FALLBACK_UPDATES;

    return Array.isArray(initialTickerUpdates) && initialTickerUpdates.length > 0
      ? initialTickerUpdates
      : FALLBACK_UPDATES;
  }, [initialTickerUpdates, isHydrated]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!searchContainerRef.current?.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (trimmedSearchQuery.length < 3) {
      setSearchResults([]);
      setSearchError("");
      setSearchLoading(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError("");

      try {
        const params = new URLSearchParams({
          title: trimmedSearchQuery,
          page: "1",
          limit: "8",
        });
        const localEndpoint = `/api/find-by-title?${params.toString()}`;
        const fallbackEndpoint = buildPublicApiUrl(`/site/find-by-title?${params.toString()}`);
        const { response, payload } = await fetchJsonWithFallback({
          localUrl: localEndpoint,
          fallbackUrl: fallbackEndpoint,
          init: {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
            signal: controller.signal,
          },
        });
        if (isCancelled) return;

        if (!response.ok) {
          setSearchResults([]);
          setSearchError(payload?.message || "Search unavailable right now.");
          return;
        }

        setSearchResults(getSearchItems(payload));
      } catch (error) {
        if (isCancelled || error?.name === "AbortError") return;
        setSearchResults([]);
        setSearchError("Search unavailable right now.");
      } finally {
        if (!isCancelled) setSearchLoading(false);
      }
    }, 1000);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedSearchQuery]);

  const handleSearchSubmit = (event) => {
    if (!trimmedSearchQuery) {
      event.preventDefault();
      return;
    }
    setShowSuggestions(false);
  };

  return (
    <>
      <nav className="glass-header sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-auto flex-col items-center justify-between gap-2 py-2 md:h-16 md:flex-row md:gap-0 md:py-0">
            <div className="flex min-w-max items-center">
              <Link
                href="/"
                aria-label="Go to home page"
                className="inline-flex items-center gap-3"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-lg font-extrabold text-white shadow-md shadow-indigo-200">
                  SA
                </span>
                <span className="leading-tight">
                  <span className="block text-xl font-extrabold tracking-tight text-slate-900">
                    Sarkari<span className="text-indigo-600">Afsar</span>
                  </span>
                  <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Place for govt jobs and works
                  </span>
                </span>
              </Link>
            </div>

            <div ref={searchContainerRef} className="relative order-3 mx-4 w-full max-w-md md:order-2">
              <form action="/search" method="GET" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  name="q"
                  minLength={3}
                  placeholder="Search for jobs, results, syllabus..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full rounded-full border border-slate-300 bg-slate-50 py-2 pr-4 pl-10 text-sm text-slate-700 placeholder:text-slate-500 placeholder:opacity-100 shadow-inner transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-500"
                  strokeWidth={2.4}
                />
                <button type="submit" className="sr-only">
                  Search
                </button>
              </form>

              {shouldShowSuggestions && (
                <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {searchLoading && (
                    <p className="px-4 py-3 text-xs text-slate-500">Searching...</p>
                  )}

                  {!searchLoading && searchError && (
                    <p className="px-4 py-3 text-xs text-red-600">{searchError}</p>
                  )}

                  {!searchLoading && !searchError && searchResults.length === 0 && (
                    <p className="px-4 py-3 text-xs text-slate-500">No matching posts found.</p>
                  )}

                  {!searchLoading && !searchError && searchResults.length > 0 && (
                    <ul className="max-h-80 overflow-y-auto">
                      {searchResults.map((item, index) => {
                        const canonicalKey = String(item?.canonicalKey || "").trim();
                        const itemTitle = String(item?.title || "Untitled Post").trim();
                        const subText = String(
                          item?.jobType || item?.megaTitle || item?.megaSlug || "",
                        ).trim();
                        const key = String(item?.postId || item?.id || `${canonicalKey}-${index}`);

                        const row = (
                          <div className="border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 last:border-b-0">
                            <p className="line-clamp-2 text-xs font-medium text-slate-800">{itemTitle}</p>
                            {subText ? (
                              <p className="mt-0.5 text-[11px] text-slate-500">{subText}</p>
                            ) : null}
                          </div>
                        );

                        if (!canonicalKey) {
                          return (
                            <li key={key}>
                              {row}
                            </li>
                          );
                        }

                        return (
                          <li key={key}>
                            <Link
                              href={`/post/${encodeURIComponent(canonicalKey)}`}
                              onClick={() => setShowSuggestions(false)}
                            >
                              {row}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className="border-t border-slate-100 px-4 py-2">
                    <Link
                      href={`/search?q=${encodeURIComponent(trimmedSearchQuery)}`}
                      className="text-xs font-semibold text-indigo-600 transition hover:text-indigo-700 hover:underline"
                      onClick={() => setShowSuggestions(false)}
                    >
                      View all results for &quot;{trimmedSearchQuery}&quot;
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="order-2 hidden min-w-max items-center space-x-6 md:order-3 md:flex">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                <House aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                <span>Home</span>
              </Link>
              <Link
                href="/latest-jobs"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                <BriefcaseBusiness aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                <span>Latest Jobs</span>
              </Link>
              <Link
                href="/mock-test"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                <ClipboardCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                <span>Mock Test</span>
              </Link>
              <Link
                href="/results"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                <FileCheck2 aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                <span>Results</span>
              </Link>
            </div>

            <button
              type="button"
              aria-label="Open menu"
              className="absolute top-5 right-4 text-xl text-slate-600 md:hidden"
            >
              <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative overflow-hidden bg-slate-900 py-2 text-sm text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center">
          <span className="z-10 ml-4 mr-4 shrink-0 rounded bg-red-600 px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase">
            Updates
          </span>
          <div className="news-ticker-container w-full overflow-hidden">
            <div className="news-ticker inline-flex whitespace-nowrap">
              {[...tickerUpdates, ...tickerUpdates].map((item, index) => (
                <span key={`${item}-${index}`} className="mx-4 inline-flex items-center">
                  {index % tickerUpdates.length === 0 ? (
                    <Zap aria-hidden="true" className="mr-1 h-3.5 w-3.5 text-yellow-400" strokeWidth={2.5} />
                  ) : (
                    <Circle
                      aria-hidden="true"
                      className="mr-1 h-2.5 w-2.5 text-green-400"
                      style={{ fill: "currentColor" }}
                      strokeWidth={0}
                    />
                  )}
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
