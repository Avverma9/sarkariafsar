import { ArrowRight, Briefcase, Landmark, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import SearchResultsPanel from "../search/SearchResultsPanel";

export default function HeroSection({
  searchQuery,
  setSearchQuery,
  searchResults = [],
  showSearchResults = false,
  searchLoading = false,
  searchError = "",
  onSearchVisibilityChange,
}) {
  const visibleResults = Array.isArray(searchResults) ? searchResults.slice(0, 8) : [];
  const searchShellRef = useRef(null);

  useEffect(() => {
    if (!searchShellRef.current || typeof onSearchVisibilityChange !== "function") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        onSearchVisibilityChange(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(searchShellRef.current);
    return () => observer.disconnect();
  }, [onSearchVisibilityChange]);

  return (
    // Force flex-row on mobile, mb-24 to give space for the overlapping search bar
    <section className="relative flex flex-row w-full overflow-visible bg-slate-900 mb-20 md:mb-16 mt-14 md:mt-0">
      <h1 className="sr-only">
        Sarkari Afsar: latest sarkari jobs, results, admit cards and government schemes
      </h1>

      {/* LEFT SECTION (Yojana) - w-1/2 always */}
      <div className="group relative flex w-1/2 flex-col items-center justify-start overflow-hidden pt-10 pb-16 px-2 md:py-20 md:px-8">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-emerald-900/90 to-slate-900/95 transition-all duration-700 group-hover:from-emerald-800/85" />
        <Image
          src="https://images.unsplash.com/photo-1593113515822-7729f2736186?auto=format&fit=crop&q=80"
          alt="Government Schemes Background"
          fill
          priority
          quality={60}
          sizes="50vw"
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="relative z-20 text-center transition-transform duration-500 group-hover:-translate-y-1 flex flex-col items-center">
          <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[8px] sm:text-[11px] md:text-xs font-bold text-emerald-300 backdrop-blur-md uppercase tracking-wider">
            <Landmark className="h-2.5 w-2.5 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">Bharat Sarkar</span>
          </span>

          <h2 className="mb-2 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            Sarkari <br />
            <span className="text-emerald-400">Yojana</span>
          </h2>

          <p className="mx-auto max-w-[140px] sm:max-w-[200px] md:max-w-sm text-[9px] sm:text-xs md:text-base font-medium text-emerald-50/80 drop-shadow-md leading-snug hidden sm:block">
            Kendra aur Rajya Sarkar ki sabhi kalyankari yojanao ki sateek jankari.
          </p>

          <div className="mt-3 md:mt-6">
            <Link
              href="/schemes"
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/40 bg-emerald-500/20 px-3 py-1.5 md:px-5 md:py-2 text-[9px] sm:text-xs md:text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/30 whitespace-nowrap"
            >
              Yojana Dekhe <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION (Naukri) - w-1/2 always */}
      <div className="group relative flex w-1/2 flex-col items-center justify-start overflow-hidden pt-10 pb-16 px-2 md:py-20 md:px-8">
        <div className="absolute inset-0 z-10 bg-gradient-to-bl from-indigo-900/90 to-slate-900/95 transition-all duration-700 group-hover:from-indigo-800/85" />
        <Image
          src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80"
          alt="Government Jobs Background"
          fill
          priority
          quality={60}
          sizes="50vw"
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="relative z-20 text-center transition-transform duration-500 group-hover:-translate-y-1 flex flex-col items-center">
          <span className="mb-3 inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2 py-0.5 text-[8px] sm:text-[11px] md:text-xs font-bold text-indigo-300 backdrop-blur-md uppercase tracking-wider">
            <Briefcase className="h-2.5 w-2.5 md:h-4 md:w-4" />
            <span className="whitespace-nowrap">Latest Updates</span>
          </span>

          <h2 className="mb-2 text-2xl sm:text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            Sarkari <br />
            <span className="text-indigo-400">Naukri</span>
          </h2>

          <p className="mx-auto max-w-[140px] sm:max-w-[200px] md:max-w-sm text-[9px] sm:text-xs md:text-base font-medium text-indigo-50/80 drop-shadow-md leading-snug hidden sm:block">
            Latest jobs, results aur admit cards ke updates sabse pehle.
          </p>

          <div className="mt-3 md:mt-6">
            <Link
              href="/post"
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-300/40 bg-indigo-500/20 px-3 py-1.5 md:px-5 md:py-2 text-[9px] sm:text-xs md:text-sm font-bold text-indigo-100 transition hover:bg-indigo-500/30 whitespace-nowrap"
            >
              Govt Job Apply <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* SVG DECORATIONS (Desktop only) */}
      <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-30 hidden w-20 -translate-x-1/2 items-center justify-center md:flex">
        <svg viewBox="0 0 100 1000" className="absolute h-[110%] w-full overflow-visible text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]">
          <path d="M 50 0 L 20 350 L 70 350 L 30 700 L 80 700 L 40 1100" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 50 0 L 20 350 L 70 350 L 30 700 L 80 700 L 40 1100" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* SEARCH OVERLAY (Compact Mobile Fix) */}
      <div
        ref={searchShellRef}
        className="absolute bottom-0 left-1/2 z-40 flex w-[95%] md:w-full max-w-4xl -translate-x-1/2 translate-y-1/2 flex-col items-center px-1 md:px-6"
      >
        <div
          role="search"
          aria-label="Search jobs, blogs and schemes"
          className="flex w-full flex-row gap-1 rounded-xl md:rounded-full border border-slate-200 bg-white p-1 md:p-2 shadow-xl items-center"
        >
          <div className="flex flex-grow items-center px-2 py-1.5 md:px-3 md:py-2">
            <Search className="mr-2 h-4 w-4 md:h-5 md:w-5 text-indigo-500 shrink-0" />
            <input
              id="site-search"
              type="text"
              placeholder="Search Ex: SSC CGL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search government jobs, blogs and schemes"
              className="w-full bg-transparent text-sm md:text-lg font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-medium placeholder:text-sm"
            />
          </div>

          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-lg md:rounded-full bg-slate-900 px-4 py-2.5 md:px-6 md:py-3 text-xs md:text-base font-black text-yellow-400 transition-all hover:bg-slate-800 shrink-0"
          >
            <span className="hidden sm:block">Khojein</span>
            <span className="block sm:hidden">Search</span>
            <ArrowRight className="h-3 w-3 md:h-5 md:w-5" />
          </button>
        </div>

        {showSearchResults && (
          <div className="mt-2 w-full max-h-[250px] md:max-h-[350px] overflow-y-auto rounded-xl bg-white shadow-xl">
             <SearchResultsPanel
                searchResults={visibleResults}
                searchLoading={searchLoading}
                searchError={searchError}
                limit={8}
             />
          </div>
        )}
      </div>
    </section>
  );
}