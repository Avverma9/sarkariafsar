import React from 'react';
import Link from "next/link";
import {
  ArrowUpRight,
  BadgeIndianRupee,
  CalendarDays,
  CircleDot,
  Download,
  ExternalLink,
  Timer,
  Users,
  AlertCircle,
  FileText,
  Link as LinkIcon
} from "lucide-react";

// --- REUSABLE INFO CARD COMPONENT ---
function InfoCard({ icon: Icon, title, rows }) {
  if (!rows || rows.length === 0) return null;
  
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col h-full">
      <div className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
        <div className="rounded-lg bg-slate-100 p-2 text-indigo-600">
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-xs font-bold tracking-wide text-slate-600 uppercase">{title}</h4>
      </div>
      <div className="space-y-2 text-sm flex-grow">
        {rows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 py-1">
            <span className="font-medium text-slate-500">{row.label}</span>
            <span className="text-left sm:text-right font-bold text-slate-800 break-words">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- LINK BUTTON COMPONENT ---
function LinkButton({ href, icon: Icon, text, type = "primary" }) {
  if (!href || href === "#") return null;
  
  const baseClasses = "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition w-full sm:w-auto justify-center";
  const types = {
    primary: "bg-white text-slate-900 hover:bg-slate-100",
    secondary: "border border-white/30 bg-white/10 text-white hover:bg-white/20",
    outline: "border border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100"
  };

  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${baseClasses} ${types[type]}`}>
      {text} <Icon className="h-4 w-4" />
    </a>
  );
}

// --- MAIN POST DETAILS COMPONENT ---
export default function PostDetails({ post, jobUrl, canonicalKey }) {
  // Use the highly structured data from our Ultimate Formatter
  const safePost = post || {};
  const header = safePost.header || {};
  const stats = safePost.quickStats || {};
  const details = safePost.details || {};
  const tables = safePost.tables || {};
  const links = safePost.links || {};

  // Extract Categories
  const datesData = details.dates || {};
  const feeData = details.fees || {};
  const ageData = details.ageLimit || {};
  const selectionSteps = Array.isArray(details.selectionSteps)
    ? details.selectionSteps
    : [];
  
  // Combine all vacancy and eligibility tables for rendering
  const allVacancyTables = [...(tables.vacancyTables || []), ...(tables.eligibilityTables || [])];
  
  // Flatten links for Quick Links Section
  const primaryLinks = [
    ...(links.apply || []),
    ...(links.admitCard || []),
    ...(links.result || []),
    ...(links.answerKey || []),
    ...(links.notification || []),
    ...(links.official || [])
  ].slice(0, 8); // Top 8 most important links

  const fullDetailsHref =
    canonicalKey
      ? `/post/${canonicalKey}/full-content`
      : "";

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 bg-slate-50/50 min-h-screen">
      {/* 1. HERO SECTION */}
      <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-6 text-white shadow-xl sm:p-8 relative overflow-hidden">
        {/* Abstract Background Design */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"></div>

        <div className="relative z-10">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            {header.badge || "Active Recruitment"}
          </div>
          
          <h1 className="text-3xl leading-tight font-black tracking-tight sm:text-5xl">
            {header.headingMain || "Sarkari Update"}
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-emerald-300 to-sky-300 bg-clip-text text-transparent drop-shadow-sm">
              {header.headingAccent || "Recruitment"}
            </span>
          </h1>
          
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
            {header.shortInfo || "Detailed post information, eligibility criteria, and application links are available below."}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton 
              href={links.apply?.[0]?.url} 
              icon={ArrowUpRight} 
              text="Apply Online Now" 
              type="primary" 
            />
            {fullDetailsHref ? (
              <Link
                href={fullDetailsHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-300 bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-500 sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                View Full Details
              </Link>
            ) : null}
            <LinkButton 
              href={links.notification?.[0]?.url} 
              icon={Download} 
              text="Download Notification" 
              type="secondary" 
            />
            <LinkButton 
              href={links.official?.[0]?.url} 
              icon={ExternalLink} 
              text="Official Website" 
              type="secondary" 
            />
          </div>
        </div>
      </div>

      {/* 2. STATS & QUICK INFO GRID */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        
        {/* Dates Box */}
        <InfoCard
          icon={CalendarDays}
          title="Important Dates"
          rows={[
            { label: "Application Starts", value: stats.startDate },
            { label: "Last Date to Apply", value: stats.endDate },
            { label: "Exam Date", value: stats.examDate },
            { label: "Admit Card", value: stats.admitCardDate }
          ].filter(r => r.value && r.value !== "Not specified")}
        />

        {/* Fees Box */}
        <InfoCard
          icon={BadgeIndianRupee}
          title="Application Fee"
          rows={
            feeData.categories?.length > 0 
              ? feeData.categories.slice(0, 4).map(c => ({ label: c.category, value: c.amount }))
              : [{ label: "General Fee", value: stats.generalFee }]
          }
        />

        {/* Age Limit Box */}
        <InfoCard
          icon={Timer}
          title="Age Limit Details"
          rows={[
            { label: "Minimum Age", value: stats.minAge },
            { label: "Maximum Age", value: stats.maxAge },
            { label: "Age Calculated As On", value: ageData.ageAsOn }
          ].filter(r => r.value && r.value !== "N/A")}
        />

        {/* Highlighted Vacancy Box */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl group-hover:bg-white/20 transition-all"></div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-indigo-200" />
            <p className="text-xs font-semibold tracking-wide text-indigo-100 uppercase">
              Total Vacancies
            </p>
          </div>
          <p className="text-4xl font-black tracking-tight drop-shadow-md">
            {stats.totalVacancies || "Check Notice"}
          </p>
          <p className="mt-1 text-sm font-medium text-indigo-200">Posts Available</p>
        </div>
      </div>

      {/* 3. DETAILED MAIN SECTION */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        
        {/* LEFT COLUMN: Tables & Details */}
        <div className="min-w-0 space-y-6">
          
          {/* Vacancy & Eligibility Tables Map */}
          {allVacancyTables.map((table, tIndex) => {
            const rows = Array.isArray(table.rows) ? table.rows : [];
            const headers = Array.isArray(table.headers) ? table.headers : [];
            if (rows.length === 0) return null;

            return (
              <div key={`table-${tIndex}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 overflow-hidden">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    <FileText className="h-3 w-3" />
                  </span>
                  <h2 className="text-xl font-black text-slate-900 capitalize">
                    {headers[0] || "Vacancy & Eligibility Details"}
                  </h2>
                </div>

                <div className="max-w-full overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        {headers.map((h, i) => (
                          <th
                            key={`th-${i}`}
                            className="border-b border-slate-200 px-4 py-3 font-bold break-words whitespace-normal"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rows.map((row, rIndex) => (
                        <tr key={`row-${rIndex}`} className="hover:bg-slate-50/50 transition-colors">
                          {headers.map((h, i) => {
                            const val = row[h] || row[Object.keys(row)[i]] || "-";
                            return (
                              <td
                                key={`td-${rIndex}-${i}`}
                                className="min-w-[120px] px-4 py-3 break-words whitespace-normal"
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Fallback if no tables parsed perfectly */}
          {allVacancyTables.length === 0 && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-800 flex items-center gap-3">
              <AlertCircle className="h-6 w-6" />
              <p className="font-medium text-sm">Detailed vacancy data not clearly structured. Please refer to the official notification PDF.</p>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Selection Process & Links */}
        <div className="min-w-0 space-y-6">
          
          {/* Selection Process (Extracted from tables) */}
          {selectionSteps.length > 0 && (
            <div className="rounded-3xl bg-slate-900 p-5 text-white shadow-xl sm:p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
              <h3 className="text-xl font-black mb-5">Selection Process</h3>
              <div className="space-y-3 relative z-10">
                {selectionSteps.map((step, index) => (
                  <div key={`step-${index}`} className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white shadow-sm">
                      {index + 1}
                    </span>
                    <p className="min-w-0 break-words text-sm leading-relaxed font-semibold text-slate-200">
                      {step}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comprehensive Quick Links */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 sticky top-6">
            <div className="mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-indigo-500" />
              <h3 className="text-xl font-black text-slate-900">Important Links</h3>
            </div>
            
            <div className="mt-4 flex flex-col gap-2.5">
              {primaryLinks.map((link, index) => {
                if (!link?.url) return null;
                // Determine icon and color based on link type
                const lbl = String(link.label).toLowerCase();
                let highlightClass = "text-slate-700 hover:bg-slate-50 border-slate-200";
                
                if (lbl.includes("apply") || lbl.includes("registration")) highlightClass = "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 font-bold";
                else if (lbl.includes("admit card") || lbl.includes("result") || lbl.includes("score")) highlightClass = "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 font-bold";

                return (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`group flex min-w-0 items-center justify-between rounded-xl border px-3.5 py-3 text-sm font-semibold transition ${highlightClass}`}
                  >
                    <span className="min-w-0 break-words pr-2">{link.label}</span>
                    <ExternalLink className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
              
              {primaryLinks.length === 0 && (
                <p className="text-sm text-slate-500 italic text-center py-4">Links will be updated soon.</p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
