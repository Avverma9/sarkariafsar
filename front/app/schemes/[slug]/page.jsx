"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchSchemeBySlug } from "../../../store/slices/schemesSlice";
import Header from "../../components/header";
import Footer from "../../components/footer";
import Breadcrumb from "../../components/Breadcrumb";
import EditorialSummary from "../../components/EditorialSummary";
import OfficialSourceBox from "../../components/OfficialSourceBox";

export default function SchemeDetailPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentScheme, loading, error } = useSelector((s) => s.schemes);

  useEffect(() => {
    if (slug) dispatch(fetchSchemeBySlug(slug));
  }, [dispatch, slug]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10 animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-100 rounded w-full" />
          <div className="h-4 bg-slate-100 rounded w-5/6" />
          <div className="h-40 bg-slate-100 rounded" />
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <p className="text-red-500 mb-4">Failed to load: {error}</p>
          <Link href="/schemes" className="text-indigo-600 hover:underline">← Back to Schemes</Link>
        </main>
        <Footer />
      </>
    );
  }

  if (!currentScheme) return null;

  const _raw = currentScheme.data ?? currentScheme;
  const scheme = Array.isArray(_raw) ? _raw[0] : _raw;
  if (!scheme) return null;

  const schemeText = [
    scheme.schemeTitle,
    scheme.aboutScheme,
    scheme.process,
    ...(Array.isArray(scheme.requiredDocs) ? scheme.requiredDocs : []),
    scheme.schemetype,
    scheme.state,
    scheme.city,
  ]
    .filter(Boolean)
    .join("\n");

  const schemeDateHighlights = [
    scheme.schemeStartDate
      ? `Start Date: ${new Date(scheme.schemeStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
      : null,
    scheme.schemeLastDate
      ? `Last Date: ${new Date(scheme.schemeLastDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`
      : null,
  ].filter(Boolean);

  const schemeEligibilityHighlights = [
    scheme.aboutScheme,
    ...(Array.isArray(scheme.requiredDocs) ? scheme.requiredDocs : []),
  ]
    .filter((item) => item && /(eligibility|required|document|beneficiary|applicant|income|age|category|qualification|must)/i.test(item))
    .slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <Breadcrumb
          theme="light"
          items={[
            { label: "Home", href: "/" },
            { label: "Schemes", href: "/schemes" },
            { label: scheme.schemeTitle || slug },
          ]}
        />

        <div className="bg-white border border-slate-200 rounded-lg p-6 md:p-8">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {scheme.schemetype && (
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                {scheme.schemetype}
              </span>
            )}
            {scheme.state && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {scheme.state}
              </span>
            )}
            {scheme.city && scheme.city !== "All" && (
              <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                {scheme.city}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 leading-snug">
            {scheme.schemeTitle}
          </h1>

          {/* About */}
          {scheme.aboutScheme && (
            <p className="text-slate-600 text-base leading-relaxed mb-6 pb-6 border-b border-slate-100">
              {scheme.aboutScheme}
            </p>
          )}

          {/* Meta grid */}
          {(() => {
            const fields = [
              { label: "Start Date", value: scheme.schemeStartDate ? new Date(scheme.schemeStartDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null },
              { label: "Last Date", value: scheme.schemeLastDate ? new Date(scheme.schemeLastDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null },
              { label: "State", value: scheme.state },
              { label: "City", value: scheme.city && scheme.city !== "All" ? scheme.city : null },
            ].filter((f) => f.value);
            if (!fields.length) return null;
            return (
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {fields.map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded px-4 py-3">
                    <dt className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-1">{label}</dt>
                    <dd className="text-sm text-slate-800 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            );
          })()}

          <EditorialSummary
            title={scheme.schemeTitle || slug}
            sectionLabel={scheme.schemetype || "Government scheme"}
            authorName="SarkariAfsar Editorial"
            published={scheme.schemeStartDate}
            lastUpdated={scheme.updatedAt || scheme.lastModified || scheme.schemeLastDate}
            rawText={schemeText}
            facts={[
              ...(scheme.state ? [{ label: "State", value: scheme.state }] : []),
              ...(scheme.city && scheme.city !== "All" ? [{ label: "City", value: scheme.city }] : []),
            ]}
            dateHighlights={schemeDateHighlights}
            eligibilityHighlights={schemeEligibilityHighlights}
            mode="scheme"
          />

          <OfficialSourceBox
            title="Official Scheme Source"
            description="Use the official scheme portal before applying or uploading documents. Check that the scheme window, beneficiary rules, and required proofs still match the current government notice."
            links={scheme.applyLink ? [{ label: "Open official apply portal", href: scheme.applyLink }] : []}
            facts={[
              { label: "Scheme Type", value: scheme.schemetype || "Government scheme" },
              { label: "State", value: scheme.state },
              { label: "Start", value: scheme.schemeStartDate, formatAsDate: true },
              { label: "Last Date", value: scheme.schemeLastDate, formatAsDate: true },
              { label: "Updated", value: scheme.updatedAt || scheme.lastModified, formatAsDate: true },
            ]}
            mode="scheme"
          />

          {/* Required Documents */}
          {Array.isArray(scheme.requiredDocs) && scheme.requiredDocs.length > 0 && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                Required Documents
              </h2>
              <ul className="space-y-2">
                {scheme.requiredDocs.map((doc, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Application Process */}
          {scheme.process && (
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">
                How to Apply
              </h2>
              <div className="space-y-2">
                {scheme.process.split("\n").filter(Boolean).map((step, i) => (
                  <p key={i} className="text-sm text-slate-600 leading-relaxed">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Apply button */}
          {scheme.applyLink && (
            <div className="mt-2">
              <a
                href={scheme.applyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-full hover:bg-indigo-700 transition-colors"
              >
                Apply Now ↗
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
