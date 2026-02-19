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

const FALLBACK_UPDATES = [
  "RRB Group D 2026 Notification Out",
  "SSC CGL 2025 Final Result Declared",
  "UP Police Constable Admit Card Released",
  "Bihar STET 2026 Online Form Started",
];

export default function Header({ initialTickerUpdates = [] }) {
  const tickerUpdates =
    Array.isArray(initialTickerUpdates) && initialTickerUpdates.length > 0
      ? initialTickerUpdates
      : FALLBACK_UPDATES;

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
              <form action="/search" method="GET">
                <input
                  type="text"
                  name="q"
                  minLength={3}
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
