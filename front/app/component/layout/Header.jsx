import { ArrowRight, Landmark, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import SearchResultsPanel from "../search/SearchResultsPanel";

export default function Header({
  scrolled,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  showSearch = false,
  searchQuery = "",
  setSearchQuery = () => {},
  searchResults = [],
  searchLoading = false,
  searchError = "",
  showSearchResults = false,
}) {
  const menuItems = [
    { label: "Jobs", href: "/post" },
    { label: "Results", href: "/results" },
    { label: "Admit Cards", href: "/admit-cards" },
    { label: "Schemes", href: "/schemes" },
  ];
  const visibleResults = Array.isArray(searchResults) ? searchResults.slice(0, 6) : [];

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 ${
        scrolled ? "py-3 shadow-sm" : "py-3.5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Sarkari Afsar home">
            <div className="rounded-2xl bg-slate-900 p-2 text-white shadow-sm transition-transform duration-300">
              <Landmark className="h-6 w-6 text-white sm:h-8 sm:w-8" />
            </div>
            <div>
              <span className="text-xl leading-none font-black tracking-tight text-slate-900 sm:text-2xl">
                Sarkari
                <span className="text-indigo-600">Afsar</span>
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-2 xl:flex"
          >
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-bold tracking-wide text-slate-700 transition-colors hover:bg-white hover:text-indigo-600"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div
              className={`relative overflow-visible transition-all duration-300 ${
                showSearch
                  ? "max-w-[26rem] translate-y-0 opacity-100"
                  : "pointer-events-none max-w-0 translate-y-[-6px] opacity-0"
              }`}
            >
              <div className="flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
                <Search className="h-4 w-4 text-indigo-500" />
                <label htmlFor="header-site-search" className="sr-only">
                  Search government jobs, blogs and schemes
                </label>
                <input
                  id="header-site-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search jobs, blogs and schemes..."
                  aria-label="Search government jobs, blogs and schemes"
                  className="ml-3 w-[18rem] bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                />
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </div>

              {showSearch && showSearchResults ? (
                <SearchResultsPanel
                  className="absolute top-full right-0 mt-2 w-[26rem] shadow-xl"
                  searchResults={visibleResults}
                  searchLoading={searchLoading}
                  searchError={searchError}
                  limit={6}
                />
              ) : null}
            </div>
          </div>

          <button
            className="rounded-xl p-2 text-slate-800 transition-colors hover:bg-slate-100 md:hidden"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-primary-navigation"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          id="mobile-primary-navigation"
          className="animate-in slide-in-from-top-2 absolute top-full left-0 w-full border-t border-slate-100 bg-white shadow-2xl md:hidden"
        >
          <div className="space-y-4 px-6 py-6">
            {showSearch ? (
              <div className="space-y-3">
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
                  <Search className="h-4 w-4 text-indigo-500" />
                  <label htmlFor="mobile-site-search" className="sr-only">
                    Search government jobs, blogs and schemes
                  </label>
                  <input
                    id="mobile-site-search"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search jobs, blogs and schemes..."
                    aria-label="Search government jobs, blogs and schemes"
                    className="ml-3 w-full bg-transparent text-sm font-semibold text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>

                {showSearchResults ? (
                  <SearchResultsPanel
                    searchResults={visibleResults}
                    searchLoading={searchLoading}
                    searchError={searchError}
                    limit={6}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 pt-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-xl bg-slate-50 p-3 text-center font-bold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
