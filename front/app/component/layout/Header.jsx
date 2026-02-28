import { Landmark, MapPin, Menu, X } from "lucide-react";
import Link from "next/link";
import LanguageTranslator from "./LanguageTranslator";

export default function Header({
  scrolled,
  selectedState,
  setSelectedState,
  statesList,
  statesLoading = false,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) {
  const menuItems = [
    { label: "Jobs", href: "/jobs" },
    { label: "Results", href: "/results" },
    { label: "Admit Cards", href: "/admit-cards" },
    { label: "Yojanyein", href: "/schemes" },
  ];

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-500 ${
        scrolled
          ? "bg-white/80 py-3 shadow-sm backdrop-blur-xl"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div
              className={`rounded-2xl p-2 transition-colors duration-500 ${
                scrolled ? "bg-indigo-600" : "bg-white/10 backdrop-blur-md"
              }`}
            >
              <Landmark className="h-6 w-6 text-white sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1
                className={`text-xl leading-none font-black tracking-tight sm:text-2xl ${
                  scrolled ? "text-slate-900" : "text-white"
                }`}
              >
                Sarkari
                <span className={scrolled ? "text-indigo-600" : "text-indigo-300"}>
                  Afsar
                </span>
              </h1>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 shadow-sm backdrop-blur-md md:flex">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-sm font-bold tracking-wide transition-colors ${
                  scrolled
                    ? "text-slate-700 hover:text-indigo-600"
                    : "text-white hover:text-indigo-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-2 backdrop-blur-md">
              <MapPin className={`h-4 w-4 ${scrolled ? "text-indigo-600" : "text-white"}`} />
              {statesLoading ? (
                <div className="skeleton-shimmer h-4 w-24 rounded-md" />
              ) : (
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className={`cursor-pointer bg-transparent text-sm font-bold outline-none ${
                    scrolled ? "text-slate-800" : "text-white"
                  } [&>option]:text-slate-800`}
                >
                  {statesList.map((state) => (
                    <option key={state} value={state}>
                      {state === "Sabhi" ? "All India" : state}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <LanguageTranslator scrolled={scrolled} />
          </div>

          <button
            className={`rounded-xl p-2 transition-colors md:hidden ${
              scrolled
                ? "text-slate-800 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
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
        <div className="animate-in slide-in-from-top-2 absolute top-full left-0 w-full border-t border-slate-100 bg-white shadow-2xl md:hidden">
          <div className="space-y-4 px-6 py-6">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <MapPin className="h-5 w-5 text-indigo-600" />
              {statesLoading ? (
                <div className="skeleton-shimmer h-5 w-32 rounded-md" />
              ) : (
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-transparent text-lg font-bold text-slate-800 outline-none"
                >
                  {statesList.map((state) => (
                    <option key={state} value={state}>
                      {state === "Sabhi" ? "All India" : state}
                    </option>
                  ))}
                </select>
              )}
            </div>

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

            <LanguageTranslator mobile />
          </div>
        </div>
      )}
    </header>
  );
}
