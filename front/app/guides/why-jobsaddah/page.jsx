import VlogSpotlight from "@/app/component/VlogSpotlight";

export const metadata = {
  title: "Why SarkariAfsar Is Reliable | SarkariAfsar Guides",
  description:
    "Understand SarkariAfsar editorial workflow: source checks, correction policy, and indexing quality gates.",
};

const commitments = [
  "No page is treated final without official source links.",
  "Incorrect values are corrected with highest priority after verification.",
  "Low-detail pages are marked noindex until meaningful data is added.",
  "Sitemap includes only indexable pages that pass quality checks.",
];

export default function WhyJobsAddahGuide() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Why SarkariAfsar reliability matters
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            Recruitment mistakes usually happen when candidates rely on partial
            summaries. This guide explains how SarkariAfsar structures data,
            verifies sources, and reduces low-value pages.
          </p>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Core commitments
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            {commitments.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <VlogSpotlight />
      </div>
    </div>
  );
}
