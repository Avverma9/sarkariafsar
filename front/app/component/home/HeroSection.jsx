import { ArrowRight, Briefcase, Landmark, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { buildCanonicalKey } from "../../lib/postFormatter";
import { buildSchemeSlug } from "../../lib/schemeSlug";

function normalizeSearchType(value) {
  return String(value || "").trim().toLowerCase();
}

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  searchResults = [],
  showSearchResults = false,
  searchLoading = false,
  searchError = "",
}) {
  const visibleResults = Array.isArray(searchResults) ? searchResults.slice(0, 8) : [];

  return (
    <section className="relative flex min-h-[85vh] w-full flex-col overflow-visible bg-slate-900 pt-20 md:flex-row md:pt-0">
      <div className="group relative flex min-h-[40vh] w-full flex-col items-center justify-center overflow-hidden p-8 md:min-h-full md:w-1/2">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-emerald-900/90 to-slate-900/95 transition-all duration-700 group-hover:from-emerald-800/80" />
        <Image
          src="https://images.unsplash.com/photo-1593113515822-7729f2736186?auto=format&fit=crop&q=80"
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-50"
        />
        <div className="relative z-20 mt-12 text-center transition-transform duration-500 group-hover:-translate-y-2 md:mt-0">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-4 py-1.5 text-sm font-bold text-emerald-300 backdrop-blur-md">
            <Landmark className="h-4 w-4" />
            Bharat Sarkar
          </span>

          <h2 className="mb-4 text-5xl font-black tracking-tight text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
            Sarkari <br className="hidden md:block" />
            <span className="text-emerald-400">Yojana</span>
          </h2>

          <p className="mx-auto max-w-sm text-base font-medium text-emerald-50 opacity-90 drop-shadow-md md:text-xl">
            Kendra aur Rajya Sarkar ki sabhi kalyankari yojanao ki sateek
            jankari.
          </p>

          <div className="mt-6">
            <Link
              href="/schemes"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-6 py-3 text-sm font-extrabold text-emerald-100 transition hover:border-emerald-200/70 hover:bg-emerald-500/30 md:text-base"
            >
              Sarkari Yojna Dekhe <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="group relative flex min-h-[40vh] w-full flex-col items-center justify-center overflow-hidden p-8 md:min-h-full md:w-1/2">
        <div className="absolute inset-0 z-10 bg-gradient-to-bl from-indigo-900/90 to-slate-900/95 transition-all duration-700 group-hover:from-indigo-800/80" />
        <Image
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80"
          alt=""
          fill
          sizes="(min-width: 768px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover opacity-40 transition-all duration-700 group-hover:scale-105 group-hover:opacity-50"
        />
        <div className="relative z-20 mb-16 text-center transition-transform duration-500 group-hover:-translate-y-2 md:mb-0">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-4 py-1.5 text-sm font-bold text-indigo-300 backdrop-blur-md">
            <Briefcase className="h-4 w-4" />
            Latest Updates
          </span>

          <h2 className="mb-4 text-5xl font-black tracking-tight text-white drop-shadow-2xl md:text-6xl lg:text-7xl">
            Sarkari <br className="hidden md:block" />
            <span className="text-indigo-400">Naukri</span>
          </h2>

          <p className="mx-auto max-w-sm text-base font-medium text-indigo-50 opacity-90 drop-shadow-md md:text-xl">
            Latest jobs, results aur admit cards ke updates sabse pehle.
          </p>

          <div className="mt-6">
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 rounded-full border border-indigo-300/40 bg-indigo-500/20 px-6 py-3 text-sm font-extrabold text-indigo-100 transition hover:border-indigo-200/70 hover:bg-indigo-500/30 md:text-base"
            >
              Govt Job Apply <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-30 hidden w-32 -translate-x-1/2 items-center justify-center md:flex">
        <svg
          viewBox="0 0 100 1000"
          className="absolute h-[110%] w-full overflow-visible text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,1)]"
        >
          <path
            d="M 50 0 L 20 350 L 70 350 L 30 700 L 80 700 L 40 1100"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 50 0 L 20 350 L 70 350 L 30 700 L 80 700 L 40 1100"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="pointer-events-none absolute top-1/2 left-0 right-0 z-30 flex h-32 -translate-y-1/2 items-center justify-center md:hidden">
        <svg
          viewBox="0 0 1000 100"
          className="absolute h-full w-[110%] overflow-visible text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,1)]"
        >
          <path
            d="M 0 50 L 350 20 L 350 70 L 700 30 L 700 80 L 1100 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 0 50 L 350 20 L 350 70 L 700 30 L 700 80 L 1100 40"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div className="absolute bottom-0 left-1/2 z-40 flex w-full max-w-4xl -translate-x-1/2 translate-y-1/2 flex-col items-center px-4 md:px-8">
        <div className="flex w-full flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] md:flex-row md:rounded-full md:p-3">
          <div className="flex flex-grow items-center px-4 py-3 md:py-2">
            <Search className="mr-4 h-7 w-7 text-indigo-500" />
            <input
              type="text"
              placeholder="Ex: SSC CGL, PM Kisan, UP Police..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-lg font-bold text-slate-800 outline-none placeholder:text-slate-400 md:text-xl"
            />
          </div>

          <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-900 px-8 py-4 text-lg font-black text-yellow-400 shadow-md transition-all hover:bg-slate-800 hover:shadow-xl md:w-auto md:rounded-full md:py-4">
            Khojein <ArrowRight className="h-6 w-6" />
          </button>
        </div>

        {showSearchResults ? (
          <div className="mt-3 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-[0_20px_45px_-25px_rgba(15,23,42,0.45)] backdrop-blur">
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
                  Searching jobs and schemes...
                </div>
              ) : searchError ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700">
                  {searchError}
                </div>
              ) : visibleResults.length > 0 ? (
                visibleResults.map((item, index) => {
                  const type = normalizeSearchType(item?.type);
                  const title = String(item?.title || "Untitled");
                  const key = `${type}-${title}-${index}`;
                  const isJob = type === "job";
                  const isScheme = type === "scheme";
                  const jobHref = item?.jobUrl
                    ? `/post/${buildCanonicalKey({ title, jobUrl: item.jobUrl })}`
                    : "";
                  const schemeHref = isScheme ? `/yojana/${buildSchemeSlug(item)}` : "";
                  const Icon = isScheme ? Landmark : Briefcase;
                  const badgeClass = isScheme
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-indigo-200 bg-indigo-50 text-indigo-700";
                  const badgeLabel = isScheme ? "SCHEME" : "JOB";
                  const itemClass =
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50";

                  const content = (
                    <>
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold text-slate-800">{title}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black tracking-wide ${badgeClass}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300" />
                    </>
                  );

                  if (isJob && jobHref) {
                    return (
                      <Link key={key} href={jobHref} className={itemClass}>
                        {content}
                      </Link>
                    );
                  }

                  if (isScheme && schemeHref) {
                    return (
                      <Link key={key} href={schemeHref} className={itemClass}>
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={key} className={itemClass}>
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
        ) : null}

        <div className="mt-5 flex w-full flex-wrap justify-center gap-3 px-4">
          {["SSC CGL", "PM Kisan", "Bihar Police", "Ayushman Bharat"].map(
            (tag) => (
              <span
                key={tag}
                onClick={() => setSearchQuery(tag)}
                className="cursor-pointer rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-bold text-slate-700 shadow-md transition-all hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
