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
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_UPDATES = [
  "RRB Group D 2026 Notification Out",
  "SSC CGL 2025 Final Result Declared",
  "UP Police Constable Admit Card Released",
  "Bihar STET 2026 Online Form Started",
];
const TICKER_SECTION_LIMIT = 6;
const TICKER_ITEMS_LIMIT = 8;

const MIN_CHARS = 3;
const DEBOUNCE_MS = 450;
const postDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatPostDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return postDateFormatter.format(date);
}

export default function Header() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [tickerUpdates, setTickerUpdates] = useState(FALLBACK_UPDATES);
  const controllerRef = useRef(null);

  const runSearch = useCallback(async (title) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const params = new URLSearchParams({ title, limit: "10" });
      const response = await fetch(`/api/find-by-title?${params.toString()}`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Search failed");
      }

      setResults(Array.isArray(payload.data) ? payload.data : []);
    } catch (error) {
      if (error.name === "AbortError") return;
      setResults([]);
      setErrorMessage(error.message || "Unable to search right now");
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery;

    if (!trimmed) {
      controllerRef.current?.abort();
      setResults([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    if (trimmed.length < MIN_CHARS) {
      controllerRef.current?.abort();
      setResults([]);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    runSearch(trimmed);
  }, [debouncedQuery, runSearch]);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadTickerUpdates = async () => {
      try {
        const sectionsResponse = await fetch("/api/section-list", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        const sectionsPayload = await sectionsResponse.json().catch(() => null);
        const sections = Array.isArray(sectionsPayload?.data) ? sectionsPayload.data : [];

        if (!sectionsResponse.ok || sections.length === 0) {
          if (isMounted) setTickerUpdates(FALLBACK_UPDATES);
          return;
        }

        const selectedSections = sections
          .map((section) => String(section?.title || "").trim())
          .filter(Boolean)
          .slice(0, TICKER_SECTION_LIMIT);

        const postsPerSection = await Promise.all(
          selectedSections.map(async (megaTitle) => {
            try {
              const params = new URLSearchParams({
                megaTitle,
                page: "1",
                limit: "2",
              });
              const response = await fetch(`/api/postlist-by-section?${params.toString()}`, {
                method: "GET",
                cache: "no-store",
                signal: controller.signal,
              });
              const payload = await response.json().catch(() => null);
              const data = Array.isArray(payload?.data) ? payload.data : [];

              if (!response.ok || data.length === 0) return [];

              return data
                .map((post) => {
                  const title = String(post?.title || "").trim();
                  if (!title) return "";
                  return `${title} (${megaTitle})`;
                })
                .filter(Boolean);
            } catch {
              return [];
            }
          }),
        );

        const merged = postsPerSection.flat();
        const deduped = Array.from(new Set(merged)).slice(0, TICKER_ITEMS_LIMIT);

        if (isMounted) {
          setTickerUpdates(deduped.length > 0 ? deduped : FALLBACK_UPDATES);
        }
      } catch {
        if (isMounted) setTickerUpdates(FALLBACK_UPDATES);
      }
    };

    void loadTickerUpdates();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) return;

    if (trimmed.length < MIN_CHARS) {
      setErrorMessage("Type at least 3 characters to search");
      setResults([]);
      return;
    }

    runSearch(trimmed);
  };

  const showSearchPanel = query.trim().length > 0;
  const hasMinimumChars = query.trim().length >= MIN_CHARS;

  return (
    <>
      <nav className="glass-header sticky top-0 z-50 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative flex h-auto flex-col items-center justify-between gap-2 py-2 md:h-16 md:flex-row md:gap-0 md:py-0">
            <div className="flex min-w-max items-center">
              <Link href="/" aria-label="Go to home page">
                <Image
                  src="/app-logo.png"
                  alt="SarkariAfsar logo"
                  width={140}
                  height={115}
                  className="h-[115px] w-[140px] object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="relative order-3 mx-4 w-full max-w-md md:order-2">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search for jobs, results, syllabus..."
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

              {showSearchPanel && (
                <div className="absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {!hasMinimumChars && (
                    <p className="px-3 py-2 text-xs text-slate-500">
                      Type at least 3 characters to search
                    </p>
                  )}

                  {isLoading && <p className="px-3 py-2 text-sm text-slate-600">Searching...</p>}

                  {!isLoading && errorMessage && (
                    <p className="px-3 py-2 text-sm text-red-600">{errorMessage}</p>
                  )}

                  {!isLoading && !errorMessage && hasMinimumChars && results.length === 0 && (
                    <p className="px-3 py-2 text-sm text-slate-600">No matching posts found.</p>
                  )}

                  {!isLoading && results.length > 0 && (
                    <ul className="max-h-72 overflow-y-auto py-1">
                      {results.map((item, index) => {
                        const key = item.postId || `${item.title}-${index}`;
                        const canonicalKey = String(item.canonicalKey || "").trim();
                        const postedOn = formatPostDate(item.postDate);

                        return (
                          <li key={key}>
                            {canonicalKey ? (
                              <Link
                                href={`/post/${encodeURIComponent(canonicalKey)}`}
                                className="block px-3 py-2 transition hover:bg-slate-100"
                              >
                                <p className="line-clamp-1 text-sm font-medium text-slate-800">{item.title}</p>
                                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                  {item.jobType || item.megaTitle || item.megaSlug || "General"}
                                  {postedOn ? ` | Posted: ${postedOn}` : ""}
                                  {item.applicationLastDate ? ` | Last Date: ${item.applicationLastDate}` : ""}
                                </p>
                              </Link>
                            ) : (
                              <div className="px-3 py-2">
                                <p className="line-clamp-1 text-sm font-medium text-slate-800">{item.title}</p>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
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
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-indigo-600"
              >
                <ClipboardCheck aria-hidden="true" className="h-4 w-4" strokeWidth={2.2} />
                <span>Mock Test</span>
              </a>
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
