import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  SearchX,
} from "lucide-react";

function buildListingHref(basePath, { view, q, state, limit, page }) {
  const query = new URLSearchParams();

  if (view) {
    query.set("view", view);
  }
  if (q) {
    query.set("q", q);
  }
  if (state) {
    query.set("state", state);
  }
  if (limit) {
    query.set("limit", String(limit));
  }
  if (page && Number(page) > 1) {
    query.set("page", String(page));
  }

  const qs = query.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function getPaginationItems(currentPage, totalPages) {
  const items = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  return items;
}

function SchemeListItem({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-indigo-700 uppercase">
          {item?.category || "Scheme"}
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
          {item?.state || "All India"}
        </span>
      </div>

      <h3 className="mt-3 text-lg leading-7 font-black text-slate-900">{item?.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 font-medium text-slate-600">
        {item?.about}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/schemes/${item?.slug}`}
          className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
        >
          View Scheme
        </Link>
      </div>
    </div>
  );
}

function SchemeGridCard({ item }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-indigo-700 uppercase">
          {item?.category || "Scheme"}
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold tracking-wide text-emerald-700 uppercase">
          {item?.state || "All India"}
        </span>
      </div>

      <h3 className="text-xl leading-7 font-black text-slate-900">{item?.title}</h3>
      <p className="mt-2 line-clamp-4 text-sm leading-6 font-medium text-slate-600">
        {item?.about}
      </p>

      <div className="mt-5">
        <Link
          href={`/schemes/${item?.slug}`}
          className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
        >
          View Scheme
        </Link>
      </div>
    </div>
  );
}

export default function SchemesListingPage({
  title,
  description,
  items,
  stateOptions,
  selectedState,
  query,
  view,
  page,
  limit,
  totalItems,
  totalPages,
  error,
}) {
  const basePath = "/schemes";
  const safeItems = Array.isArray(items) ? items : [];
  const safeStateOptions = Array.isArray(stateOptions) ? stateOptions : ["All India"];
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 12;
  const safeTotalPages = Number(totalPages) > 0 ? Number(totalPages) : 1;
  const safeTotalItems = Number(totalItems) > 0 ? Number(totalItems) : 0;
  const isGridView = view === "grid";
  const paginationItems = getPaginationItems(safePage, safeTotalPages);
  const showingStart = safeTotalItems === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const showingEnd = Math.min(safePage * safeLimit, safeTotalItems);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold tracking-wider text-emerald-200 uppercase">
          Sarkari Yojna
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
          {description}
        </p>
        <p className="mt-4 text-xs font-semibold tracking-wide text-slate-200 uppercase">
          {selectedState || "All India"} • {safeTotalItems} Schemes
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form action={basePath} method="GET" className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query || ""}
              placeholder="Search schemes by title..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:bg-white"
            />
          </div>

          <div className="lg:col-span-3">
            <select
              name="state"
              defaultValue={selectedState || "All India"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            >
              {safeStateOptions.map((stateOption) => (
                <option key={stateOption} value={stateOption}>
                  {stateOption}
                </option>
              ))}
            </select>
          </div>

          <input type="hidden" name="view" value={isGridView ? "grid" : "list"} />

          <div className="lg:col-span-2">
            <select
              name="limit"
              defaultValue={String(safeLimit)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
            >
              {[12, 24, 36, 48, 60].map((option) => (
                <option key={option} value={option}>
                  {option} per page
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 lg:col-span-2"
          >
            Apply
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Showing {showingStart}-{showingEnd} of {safeTotalItems}
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Link
              href={buildListingHref(basePath, {
                view: "list",
                q: query,
                state: selectedState,
                limit: safeLimit,
                page: 1,
              })}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                !isGridView
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Link>
            <Link
              href={buildListingHref(basePath, {
                view: "grid",
                q: query,
                state: selectedState,
                limit: safeLimit,
                page: 1,
              })}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                isGridView
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:text-indigo-600"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {!error && safeItems.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
          <SearchX className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-semibold text-slate-500">Koi yojna nahi mili.</p>
        </div>
      ) : null}

      {!error && safeItems.length > 0 ? (
        isGridView ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {safeItems.map((item) => (
              <SchemeGridCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {safeItems.map((item) => (
              <SchemeListItem key={item.id} item={item} />
            ))}
          </div>
        )
      ) : null}

      {!error && safeTotalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={buildListingHref(basePath, {
              view: isGridView ? "grid" : "list",
              q: query,
              state: selectedState,
              limit: safeLimit,
              page: Math.max(1, safePage - 1),
            })}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              safePage <= 1
                ? "pointer-events-none border-slate-200 text-slate-300"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </Link>

          {paginationItems.map((item) => (
            <Link
              key={item}
              href={buildListingHref(basePath, {
                view: isGridView ? "grid" : "list",
                q: query,
                state: selectedState,
                limit: safeLimit,
                page: item,
              })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                item === safePage
                  ? "bg-indigo-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {item}
            </Link>
          ))}

          <Link
            href={buildListingHref(basePath, {
              view: isGridView ? "grid" : "list",
              q: query,
              state: selectedState,
              limit: safeLimit,
              page: Math.min(safeTotalPages, safePage + 1),
            })}
            className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
              safePage >= safeTotalPages
                ? "pointer-events-none border-slate-200 text-slate-300"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
