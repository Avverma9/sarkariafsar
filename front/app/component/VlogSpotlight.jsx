import React from "react";

const processItems = [
  {
    title: "1. Source capture",
    points: [
      "Every update starts from an official notice or department website link.",
      "Core fields are extracted first: title, post name, dates, eligibility, fee, and official links.",
      "Unclear values are marked for manual verification before publishing.",
    ],
  },
  {
    title: "2. Structured formatting",
    points: [
      "Raw notice text is converted into sections users can scan quickly.",
      "Important dates, fee table, eligibility, and selection process are split clearly.",
      "Conflicting values are highlighted and corrected in follow-up updates.",
    ],
  },
  {
    title: "3. Verification and correction",
    points: [
      "Official links are re-checked after publication to avoid broken apply/notice URLs.",
      "User correction reports are reviewed and patched with timestamped updates.",
      "Critical corrections are prioritized over cosmetic content changes.",
    ],
  },
  {
    title: "4. Quality gates before indexing",
    points: [
      "Pages without enough verified detail are treated as low value and excluded from search indexing.",
      "Only posts that pass quality thresholds are allowed in sitemap.",
      "This keeps thin/placeholder pages out of organic search and ad inventory.",
    ],
  },
];

export default function VlogSpotlight() {
  return (
    <section className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
          JobsAddah reliability framework
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          This is the internal publishing workflow used to reduce misinformation
          and improve user trust on recruitment pages.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {processItems.map((item) => (
          <article
            key={item.title}
            className="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <h3 className="text-sm font-bold text-slate-900 mb-2">{item.title}</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
              {item.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700 leading-relaxed">
        If you find a wrong date, broken link, or eligibility mismatch, report
        it from the Contact page with the post URL and screenshot. Corrections
        are reviewed in priority order.
      </div>
    </section>
  );
}
