import Link from "next/link";
import {
  Search,
  ChevronLeft,
  ChevronRight,
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

function buildSearchParams(baseState, overrides = {}) {
  const next = {
    page: Number(baseState.page || 1),
    limit: Number(baseState.limit || 20),
    q: String(baseState.q || "").trim(),
    sort: String(baseState.sort || "newest"),
    ai: Boolean(baseState.ai),
    ...overrides,
  };

  const params = new URLSearchParams();
  if (next.page > 1) params.set("page", String(next.page));
  params.set("limit", String(next.limit || 20));
  if (next.q) params.set("q", next.q);
  if (next.sort) params.set("sort", next.sort);
  if (next.ai) params.set("ai", "1");
  return params.toString();
}

export default function PostListBySectionPage({
  heading = "Posts",
  description = "",
  megaTitle = "",
  initialState = null,
}) {
  const safeState = initialState && typeof initialState === "object" ? initialState : {};

  const posts = Array.isArray(safeState.posts) ? safeState.posts : [];
  const errorMessage = String(safeState.errorMessage || "");
  const page = Number(safeState.page || 1);
  const limit = Number(safeState.limit || 20);
  const total = Number(safeState.total || 0);
  const query = String(safeState.q || "");
  const sort = String(safeState.sort || "newest");
  const onlyWithAi = Boolean(safeState.ai);

  const totalPages = total && limit ? Math.max(1, Math.ceil(total / limit)) : 0;
  const canPrev = page > 1;
  const canNext = totalPages ? page < totalPages : posts.length === limit;

  const pageState = { page, limit, q: query, sort, ai: onlyWithAi };
  const prevHref = `?${buildSearchParams(pageState, { page: Math.max(1, page - 1) })}`;
  const nextHref = `?${buildSearchParams(pageState, { page: page + 1 })}`;
  const firstHref = `?${buildSearchParams(pageState, { page: 1 })}`;
  const lastHref = totalPages
    ? `?${buildSearchParams(pageState, { page: totalPages })}`
    : null;

  const headerSubtitle = [
    megaTitle,
    query ? `Search: "${query}"` : "",
    onlyWithAi ? "AI-ready only" : "",
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-5 text-white">
            <h1 className="text-2xl font-bold">{heading}</h1>
            <p className="mt-1 text-sm text-indigo-100">
              {description || "Browse jobs, open details, and track updates."}
            </p>
          </div>

          <form method="GET" className="px-5 py-4">
            <input type="hidden" name="page" value="1" />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="relative w-full max-w-xl">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search posts by title..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  title="Apply filters"
                >
                  Apply
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    name="sort"
                    defaultValue={sort}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    aria-label="Sort"
                  >
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                  </select>
                </div>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <span className="text-sm font-semibold text-slate-700">Page size</span>
                  <select
                    name="limit"
                    defaultValue={String(limit)}
                    className="bg-transparent text-sm font-semibold text-slate-700 outline-none"
                    aria-label="Page size"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>

                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  <input
                    type="checkbox"
                    name="ai"
                    value="1"
                    defaultChecked={onlyWithAi}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  AI-ready
                </label>
              </div>
            </div>

            {headerSubtitle ? (
              <p className="mt-3 text-xs text-slate-500">{headerSubtitle}</p>
            ) : null}
          </form>
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {!errorMessage && posts.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No posts found for this section.
          </div>
        )}

        {!errorMessage && posts.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-3">
              {posts.map((post, index) => {
                const canonicalKey = String(post?.canonicalKey || "").trim();
                const title = String(post?.title || "Untitled Post").trim();
                const posted = formatPostDate(post?.postDate || post?.createdAt);
                const source = String(post?.sourceSiteName || post?.source || "").trim();
                const aiReady = Boolean(post?.aiScraped || post?.aiData);
                const key = `${canonicalKey || title}-${index}`;

                const card = (
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
                            className={`rounded-full px-2 py-0.5 font-semibold ${
                              aiReady
                                ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border border-slate-200 bg-slate-50 text-slate-600"
                            }`}
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

                if (!canonicalKey) return <div key={key}>{card}</div>;
                return (
                  <Link
                    key={key}
                    href={`/post/${encodeURIComponent(canonicalKey)}`}
                    className="block"
                  >
                    {card}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Page:</span> {page}
                {totalPages ? ` / ${totalPages}` : ""}
                {total ? (
                  <>
                    {" "}
                    | <span className="font-semibold text-slate-800">Total:</span> {total}
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {canPrev ? (
                  <Link
                    href={prevHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </span>
                )}

                {canPrev ? (
                  <Link
                    href={firstHref}
                    className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                  >
                    First
                  </Link>
                ) : null}

                {lastHref && canNext ? (
                  <Link
                    href={lastHref}
                    className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
                  >
                    Last
                  </Link>
                ) : null}

                {canNext ? (
                  <Link
                    href={nextHref}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mt-6 text-center text-xs text-slate-500">
          Tip: Use search to quickly find a job, then open details to enable notification.
        </div>
      </main>
    </div>
  );
}
