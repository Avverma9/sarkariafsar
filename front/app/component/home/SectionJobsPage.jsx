import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutGrid,
  List,
  Search,
  SearchX,
} from "lucide-react";
import { buildCanonicalKey } from "../../lib/postFormatter";

function getSourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function buildListingHref(basePath, { view, q, limit, page }) {
  const query = new URLSearchParams();

  if (view) {
    query.set("view", view);
  }
  if (q) {
    query.set("q", q);
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

function JobCard({ job, index }) {
  const jobTitle = job?.title || "Untitled Job";
  const jobUrl = job?.jobUrl || "";
  const canonicalKey = buildCanonicalKey({ title: jobTitle, jobUrl });
  const detailsHref = `/post/${canonicalKey}`;
  const sourceHost = getSourceHost(jobUrl);

  return (
    <div
      key={`${jobUrl || jobTitle}-${index}`}
      className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <p className="line-clamp-3 min-h-[72px] text-sm leading-6 font-bold text-slate-800">
        {jobTitle}
      </p>

      <div className="mt-2 min-h-[20px]">
        {sourceHost ? (
          <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {sourceHost}
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={detailsHref}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

   
      </div>
    </div>
  );
}

function JobListItem({ job, index }) {
  const jobTitle = job?.title || "Untitled Job";
  const jobUrl = job?.jobUrl || "";
  const canonicalKey = buildCanonicalKey({ title: jobTitle, jobUrl });
  const detailsHref = `/post/${canonicalKey}`;
  const sourceHost = getSourceHost(jobUrl);

  return (
    <div
      key={`${jobUrl || jobTitle}-${index}`}
      className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0">
        <p className="break-words text-sm leading-6 font-bold text-slate-800">{jobTitle}</p>
        {sourceHost ? (
          <p className="mt-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
            {sourceHost}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href={detailsHref}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500"
        >
          View Details
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
       
      </div>
    </div>
  );
}

export default function SectionJobsPage({
  basePath,
  title,
  description,
  section,
  jobs,
  error,
  view,
  query,
  page,
  limit,
  totalPages,
  totalPosts,
}) {
  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 24;
  const safeTotalPages = Number(totalPages) > 0 ? Number(totalPages) : 1;
  const safeTotalPosts = Number(totalPosts) > 0 ? Number(totalPosts) : 0;
  const paginationItems = getPaginationItems(safePage, safeTotalPages);
  const showingStart = safeTotalPosts === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const showingEnd = Math.min(safePage * safeLimit, safeTotalPosts);
  const isGridView = view === "grid";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-bold tracking-wider text-indigo-200 uppercase">
          Section Listing
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
            {description}
          </p>
        ) : null}
        <p className="mt-4 text-xs font-semibold tracking-wide text-slate-300 uppercase">
          {section?.name || "Unknown Section"} • {safeTotalPosts} Jobs
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form action={basePath} method="GET" className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-6">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              name="q"
              defaultValue={query || ""}
              placeholder="Search jobs by title..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pr-3 pl-9 text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:bg-white"
            />
          </div>

          <input type="hidden" name="view" value={isGridView ? "grid" : "list"} />

          <div className="flex items-center gap-2 lg:col-span-3">
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
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 lg:col-span-3"
          >
            Apply
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Showing {showingStart}-{showingEnd} of {safeTotalPosts}
          </div>

          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Link
              href={buildListingHref(basePath, {
                view: "list",
                q: query,
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

      {!error && safeJobs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
          <SearchX className="h-6 w-6 text-slate-400" />
          <p className="text-sm font-semibold text-slate-500">No jobs found for this section.</p>
        </div>
      ) : null}

      {!error && safeJobs.length > 0 ? (
        isGridView ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {safeJobs.map((job, index) => (
              <JobCard key={`${job?.jobUrl || job?.title}-${index}`} job={job} index={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {safeJobs.map((job, index) => (
              <JobListItem key={`${job?.jobUrl || job?.title}-${index}`} job={job} index={index} />
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
