import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  MapPin,
} from "lucide-react";

export default function SchemeDetailPage({ scheme }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-14 sm:px-6 lg:px-8">
      <div className="mb-5">
        <Link
          href="/schemes"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back To Schemes
        </Link>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <p className="text-xs font-black tracking-wider text-emerald-200 uppercase">
          Government Scheme
        </p>
        <h1 className="mt-2 text-3xl leading-tight font-black tracking-tight sm:text-4xl">
          {scheme?.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-slate-100 uppercase">
            {scheme?.category}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-slate-100 uppercase">
            <MapPin className="h-3.5 w-3.5" />
            {scheme?.state}
          </span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-slate-100 uppercase">
            City: {scheme?.city}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            Scheme Start Date
          </p>
          <p className="text-base font-black text-slate-900">
            {scheme?.schemeStartDate || "N/A"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-1 inline-flex items-center gap-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            Scheme Last Date
          </p>
          <p className="text-base font-black text-slate-900">
            {scheme?.schemeLastDate || "N/A"}
          </p>
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-black text-slate-900">
          <Info className="h-5 w-5 text-indigo-600" />
          Scheme Overview
        </h2>
        <p className="text-base leading-7 font-medium text-slate-700">{scheme?.about}</p>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-black text-slate-900">
          <ListChecks className="h-5 w-5 text-emerald-600" />
          Apply Karne Ka Tarika
        </h2>
        <ul className="space-y-2">
          {scheme?.process?.map((step, index) => (
            <li
              key={`${index + 1}-${step}`}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                {index + 1}
              </span>
              <span className="text-sm leading-6 font-medium text-slate-700">{step}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-black text-slate-900">
          <FileText className="h-5 w-5 text-amber-600" />
          Required Documents
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {scheme?.documents?.map((doc) => (
            <li
              key={doc}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
            >
              {doc}
            </li>
          ))}
        </ul>
      </section>

      {scheme?.applyLink ? (
        <div className="mt-5 flex">
          <a
            href={scheme.applyLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-indigo-500"
          >
            Official Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      ) : null}
    </div>
  );
}
