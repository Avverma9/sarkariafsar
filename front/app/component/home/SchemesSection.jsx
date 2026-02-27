import {
  ArrowRight,
  GraduationCap,
  HeartPulse,
  Landmark,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { buildSchemeSlug } from "../../lib/schemeSlug";
import SchemesSectionSkeleton from "../skeletons/SchemesSectionSkeleton";

const schemeIcons = {
  Landmark,
  GraduationCap,
  HeartPulse,
  ShieldCheck,
  Users,
};

export default function SchemesSection({
  filteredSchemes,
  loading = false,
  hasLoaded = false,
  error = "",
}) {
  const safeSchemes = Array.isArray(filteredSchemes) ? filteredSchemes : [];

  if (loading || !hasLoaded) {
    return <SchemesSectionSkeleton />;
  }

  return (
    <div id="yojana-section">
      <div className="mb-8 flex items-center justify-between px-2">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            <Landmark className="h-8 w-8 rounded-lg bg-emerald-100 p-1.5 text-emerald-600" />
            Pramukh Yojanyein
          </h2>
          <p className="mt-1 font-medium text-slate-500">
            Sarkar ki sabse labhkari yojanayein
          </p>
        </div>

        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-800 md:px-5 md:py-2.5 md:text-base"
        >
          Sabhi Dekhein <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {error ? (
          <div className="col-span-full rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center shadow-sm">
            <h3 className="mb-2 text-xl font-black text-rose-700">Schemes load nahi ho payi</h3>
            <p className="font-medium text-rose-600">{error}</p>
          </div>
        ) : safeSchemes.length > 0 ? (
          safeSchemes.map((scheme) => {
            const Icon = schemeIcons[scheme.icon] || Landmark;
            const schemeSlug = buildSchemeSlug(scheme);

            return (
              <Link
                key={scheme.id}
                href={`/yojana/${schemeSlug}`}
                className="group flex cursor-pointer flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl"
              >
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 shadow-inner transition-transform duration-300 group-hover:rotate-3 group-hover:scale-110">
                    <Icon className={`h-8 w-8 ${scheme.iconColor}`} />
                  </div>

                  <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-[10px] font-black tracking-widest text-slate-500 uppercase">
                    {scheme.state}
                  </span>
                </div>

                <div className="mb-4 flex-grow">
                  <span className="mb-2 block text-xs font-bold tracking-wider text-indigo-500 uppercase">
                    {scheme.category}
                  </span>
                  <h3 className="mb-2 text-xl leading-tight font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                    {scheme.title}
                  </h3>
                  <p className="line-clamp-2 text-sm leading-relaxed font-medium text-slate-500">
                    {scheme.shortDesc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm font-bold text-slate-400">
                    Puri Jankari Padhein
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 transition-colors group-hover:bg-indigo-600">
                    <ArrowRight className="h-5 w-5 text-slate-400 transition-colors group-hover:text-white" />
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
              <Search className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="mb-2 text-2xl font-black text-slate-900">
              Koi Yojana Nahi Mili
            </h3>
            <p className="font-medium text-slate-500">
              Kripya search box mein dusra shabd dalein.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
