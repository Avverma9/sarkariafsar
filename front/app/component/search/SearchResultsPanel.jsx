import {
  ArrowRight,
  Briefcase,
  FileText,
  Landmark,
  Search,
} from "lucide-react";
import Link from "next/link";
import {
  formatSearchResultDate,
  getGlobalSearchResultHref,
  getGlobalSearchResultLabel,
  normalizeGlobalSearchType,
} from "../../lib/searchResults";

const badgeClasses = {
  job: "border-indigo-200 bg-indigo-50 text-indigo-700",
  blog: "border-amber-200 bg-amber-50 text-amber-700",
  scheme: "border-emerald-200 bg-emerald-50 text-emerald-700",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

function getItemIcon(type) {
  switch (normalizeGlobalSearchType(type)) {
    case "job":
      return Briefcase;
    case "blog":
      return FileText;
    case "scheme":
      return Landmark;
    default:
      return Search;
  }
}

function buildMetaParts(result = {}) {
  const type = normalizeGlobalSearchType(result?.type);
  const dateText = formatSearchResultDate(result?.date || result?.applyLastDate);

  if (type === "job") {
    return [result?.sectionName, dateText].filter(Boolean);
  }

  if (type === "blog") {
    return [result?.category, dateText].filter(Boolean);
  }

  if (type === "scheme") {
    return [result?.state, dateText].filter(Boolean);
  }

  return [dateText].filter(Boolean);
}

export default function SearchResultsPanel({
  searchResults = [],
  searchLoading = false,
  searchError = "",
  limit = 8,
  className = "",
}) {
  const visibleResults = Array.isArray(searchResults)
    ? searchResults.slice(0, limit)
    : [];

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur ${className}`.trim()}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-xs font-black tracking-wide text-slate-500 uppercase">
          Search Results
        </p>
        {!searchLoading && !searchError ? (
          <p className="text-[11px] font-bold text-slate-400">
            {visibleResults.length} item{visibleResults.length === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div className="max-h-72 overflow-y-auto p-2">
        {searchLoading ? (
          <div className="flex items-center gap-2 rounded-xl px-3 py-4 text-sm font-semibold text-slate-500">
            <Search className="h-4 w-4 animate-pulse text-indigo-500" />
            Searching jobs, blogs and schemes...
          </div>
        ) : searchError ? (
          <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
            {searchError}
          </div>
        ) : visibleResults.length > 0 ? (
          visibleResults.map((item, index) => {
            const type = normalizeGlobalSearchType(item?.type);
            const title = String(item?.title || "Untitled");
            const key = `${type}-${item?.id || item?.slug || title}-${index}`;
            const href = getGlobalSearchResultHref(item);
            const Icon = getItemIcon(type);
            const badgeClass = badgeClasses[type] || badgeClasses.unknown;
            const badgeLabel = getGlobalSearchResultLabel(type);
            const metaParts = buildMetaParts(item);
            const content = (
              <>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold text-slate-800">{title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wide ${badgeClass}`}
                    >
                      {badgeLabel}
                    </span>
                    {metaParts.length > 0 ? (
                      <span className="truncate text-[11px] font-semibold text-slate-400">
                        {metaParts.join(" • ")}
                      </span>
                    ) : null}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </>
            );

            if (href) {
              return (
                <Link
                  key={key}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  {content}
                </Link>
              );
            }

            return (
              <div
                key={key}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-500"
              >
                {content}
              </div>
            );
          })
        ) : (
          <div className="flex items-center gap-2 rounded-xl px-3 py-4 text-sm font-semibold text-slate-500">
            <Search className="h-4 w-4 text-slate-300" />
            No result found
          </div>
        )}
      </div>
    </div>
  );
}
