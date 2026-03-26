"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSchemes,
  fetchSchemeStateNames,
  fetchSchemesByState,
} from "../../store/slices/schemesSlice";
import Header from "../components/header";
import Footer from "../components/footer";
import Breadcrumb from "../components/Breadcrumb";

function SchemeCard({ scheme }) {
  return (
    <article className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
          {scheme.schemetype || "Scheme"}
        </span>
        {scheme.state && (
          <span className="text-xs text-slate-500">{scheme.state}</span>
        )}
      </div>

      <h2 className="text-base font-semibold text-slate-900 leading-snug">
        <Link
          href={`/schemes/${scheme.slug}`}
          className="hover:text-indigo-600 hover:underline underline-offset-4"
        >
          {scheme.schemeTitle}
        </Link>
      </h2>

      <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
        {scheme.aboutScheme}
      </p>

      <div className="mt-auto flex items-center justify-between">
        <Link
          href={`/schemes/${scheme.slug}`}
          className="text-sm font-semibold text-indigo-600 hover:underline"
        >
          View Details →
        </Link>
        {scheme.applyLink && (
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-green-700 hover:underline"
          >
            Apply Now ↗
          </a>
        )}
      </div>
    </article>
  );
}

function ShimmerCard() {
  return (
    <div className="animate-pulse bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="h-3 bg-slate-200 rounded w-1/4" />
      <div className="h-5 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-100 rounded w-full" />
      <div className="h-4 bg-slate-100 rounded w-5/6" />
    </div>
  );
}

export default function SchemesPage() {
  const dispatch = useDispatch();
  const { items, stateNames, schemesByState, loading } = useSelector(
    (s) => s.schemes
  );
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    dispatch(fetchSchemeStateNames());
    dispatch(fetchSchemes({ page: 1, limit: 24 }));
  }, [dispatch]);

  const handleStateSelect = (state) => {
    setSelectedState(state);
    if (state) {
      dispatch(fetchSchemesByState({ state, page: 1, limit: 24 }));
    } else {
      dispatch(fetchSchemes({ page: 1, limit: 24 }));
    }
  };

  const displaySchemes = selectedState
    ? Array.isArray(schemesByState)
      ? schemesByState
      : []
    : Array.isArray(items)
    ? items
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-600 to-teal-700 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl">
            <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Govt Schemes" }]} />
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-3">
              Central &amp; State Schemes
            </span>
            <h1 className="text-4xl font-extrabold text-white leading-tight mb-3">
              Sarkari Yojana Explorer
            </h1>
            <p className="text-emerald-100 text-base leading-relaxed">
              Browse welfare schemes, subsidies, and government programmes from across India — filter by state.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/jobpost" className="inline-block px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-full transition-colors">
                💼 Jobs & Updates
              </Link>
              <Link href="/blog" className="inline-block px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-full transition-colors">
                📖 Blog & Guides
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Page heading */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900">Browse Schemes</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Browse government schemes from Central and State governments
          </p>
        </div>

        {/* State filter */}
        <div className="mb-6 flex flex-wrap gap-2 items-center">
          <button
            onClick={() => handleStateSelect("")}
            className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
              selectedState === ""
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
            }`}
          >
            All States
          </button>
          {Array.isArray(stateNames) &&
            stateNames.map((name) => (
              <button
                key={name}
                onClick={() => handleStateSelect(name)}
                className={`px-3 py-1.5 text-sm rounded-full border font-medium transition-colors ${
                  selectedState === name
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-300 hover:border-indigo-400"
                }`}
              >
                {name}
              </button>
            ))}
        </div>

        {/* Scheme grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(9)
              .fill(0)
              .map((_, i) => (
                <ShimmerCard key={i} />
              ))}
          </div>
        ) : displaySchemes.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-20">
            No schemes found{selectedState ? ` for "${selectedState}"` : ""}.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displaySchemes.map((scheme) => (
              <SchemeCard key={scheme._id || scheme.slug} scheme={scheme} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
