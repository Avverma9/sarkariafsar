"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchemes } from "../../../store/slices/schemesSlice";

const ShimmerRow = () => (
  <div className="animate-pulse py-6 border-b border-slate-200 flex flex-col md:flex-row gap-4">
    <div className="flex-1 px-2 md:px-4">
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-100 rounded w-full mb-2"></div>
      <div className="h-4 bg-slate-100 rounded w-5/6 mb-3"></div>
      <div className="flex gap-4">
        <div className="h-3 bg-slate-100 rounded w-20"></div>
        <div className="h-3 bg-slate-100 rounded w-24"></div>
      </div>
    </div>
    <div className="px-2 md:px-4 shrink-0">
      <div className="h-4 bg-slate-200 rounded w-20"></div>
    </div>
  </div>
);

export default function HomeSchemesSection() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector((state) => state.schemes);

  useEffect(() => {
    dispatch(fetchSchemes({ page: 1, limit: 15 }));
  }, [dispatch]);

  return (
     <section className="mb-12 w-full max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b-2 border-slate-800">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sarkari Schemes
        </h2>
        <Link 
          href="/schemes" 
          className="text-sm font-semibold text-blue-700 hover:text-blue-900 hover:underline underline-offset-4"
        >
          Sabhi Dekhein &rarr;
        </Link>
      </div>

      <div className="flex flex-col">
        {loading ? (
          Array(5).fill(0).map((_, i) => <ShimmerRow key={i} />)
        ) : items.length > 0 ? (
          items.map((scheme, index) => (
            <article 
              key={scheme._id || index} 
              className="py-6 border-b border-slate-200 flex flex-col md:flex-row md:items-start gap-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 px-2 md:px-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                  <Link 
                    href={`/schemes/${scheme.slug}`}
                    className="hover:text-blue-700 hover:underline decoration-blue-300 underline-offset-4"
                  >
                    {scheme.schemeTitle}
                  </Link>
                </h3>
                <p className="text-base text-slate-600 mb-3 leading-relaxed max-w-3xl">
                  {scheme.aboutScheme}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    {scheme.schemetype}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                    {scheme.state || "Central"}
                  </span>
                </div>
              </div>

              <div className="px-2 md:px-4 mt-2 md:mt-0 pt-2 md:pt-0 shrink-0">
                {scheme.applyLink ? (
                  <a
                    href={scheme.applyLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-blue-700 font-medium hover:text-blue-900 hover:underline underline-offset-4"
                  >
                    Apply Now &rarr;
                  </a>
                ) : (
                  <Link
                    href={`/schemes/${scheme.slug}`}
                    className="inline-block text-slate-600 font-medium hover:text-slate-900 hover:underline underline-offset-4"
                  >
                    View Details &rarr;
                  </Link>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="py-12 text-center text-slate-500 text-lg">
            Koi scheme nahi mili.
          </div>
        )}
      </div>
    </section>
  );
}