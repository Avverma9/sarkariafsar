import Link from "next/link";
import { baseUrl } from "../lib/baseUrl";
import { buildMetadata } from "../lib/seo";

function parseSearchQuery(searchParams) {
  const rawQuery = searchParams?.q;
  return String(Array.isArray(rawQuery) ? rawQuery[0] : rawQuery || "").trim();
}

async function fetchSearchResults(query) {
  if (!query || query.length < 3) return { items: [], message: "" };

  const params = new URLSearchParams({
    title: query,
    page: "1",
    limit: "30",
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

    if (!response.ok) {
      return {
        items: [],
        message: payload?.message || "Unable to search right now.",
      };
    }

    return { items: data, message: "" };
  } catch {
    return {
      items: [],
      message: "Unable to search right now.",
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
  const { items, message } = await fetchSearchResults(query);

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
        )}
      </main>
    </div>
  );
}
