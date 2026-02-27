import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileText,
  GraduationCap,
  Search,
} from "lucide-react";
import { buildCanonicalKey } from "../../lib/postFormatter";

function getStyleByType(type) {
  if (type === "admission") {
    return {
      icon: GraduationCap,
      text: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
    };
  }

  if (type === "admitcards") {
    return {
      icon: FileText,
      text: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    };
  }

  if (type === "results") {
    return {
      icon: CheckCircle2,
      text: "text-rose-700",
      bg: "bg-rose-50",
      border: "border-rose-200",
    };
  }

  return {
    icon: Briefcase,
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  };
}

function getSectionListingHref(type) {
  if (type === "results") {
    return "/jobs/results";
  }

  if (type === "admitcards") {
    return "/jobs/admit-cards";
  }

  if (type === "admission") {
    return "/jobs/admissions";
  }

  return "/jobs/new-jobs";
}

function JobRow({ item }) {
  const canonical = buildCanonicalKey({ title: item?.title, jobUrl: item?.jobUrl });

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
      <Link
        href={`/post/${canonical}`}
        className="group inline-flex w-full items-start gap-2 text-left"
      >
        <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm leading-5 font-extrabold text-slate-800 transition-colors group-hover:text-indigo-600">
            {item?.title || "Untitled Job"}
          </p>
          <p className="mt-0.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
            LIVE UPDATE
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function JobsTablesPage({ cards, limit, error }) {
  const safeCards = Array.isArray(cards) ? cards : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-7 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-7 text-white shadow-xl sm:px-8">
        <p className="text-xs font-black tracking-wider text-indigo-200 uppercase">
          Jobs Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Latest Updates</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
          Govt jobs, results, admit cards aur admission updates ek jagah.
        </p>
        <p className="mt-4 text-xs font-semibold tracking-wide text-slate-300 uppercase">
          Initial limit per table: {limit}
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {error}
        </div>
      ) : null}

      {!error && safeCards.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm font-bold text-slate-500">No section data available.</p>
        </div>
      ) : null}

      {!error && safeCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {safeCards.map((card) => {
            const style = getStyleByType(card?.type);
            const Icon = style.icon;
            const hasMore = Number(card?.totalPosts || 0) > Number(card?.shownCount || 0);
            const sourceSectionUrl = card?.items?.[0]?.sourceSectionUrl || "";
            const listingHref = getSectionListingHref(card?.type);

            return (
              <section
                key={card?.id}
                className="flex min-h-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_-24px_rgba(15,23,42,0.6)]"
              >
                <header className={`flex items-center gap-2 border-b px-4 py-3 ${style.bg} ${style.border}`}>
                  <span className="rounded-lg bg-white p-1.5 shadow-sm">
                    <Icon className={`h-4 w-4 ${style.text}`} />
                  </span>
                  <h2 className={`text-[1.45rem] leading-none font-black ${style.text}`}>
                    {card?.name || "Section"}
                  </h2>
                </header>

                <div className="flex-grow space-y-1 overflow-y-auto bg-slate-50/70 p-2.5">
                  {Array.isArray(card?.items) && card.items.length > 0 ? (
                    card.items.map((item) => <JobRow key={`${card.id}-${item.id}`} item={item} />)
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
                      <p className="text-sm font-semibold text-slate-400">No updates found</p>
                    </div>
                  )}
                </div>

                <footer className="flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-2.5">
                  <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">
                    Showing {card?.shownCount || 0} / {card?.totalPosts || 0}
                  </p>

                  <div className="flex items-center gap-2">
                    <Link
                      href={listingHref}
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                    >
                      View All
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>

                
                  </div>
                </footer>
              </section>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
