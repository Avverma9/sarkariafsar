import Link from "next/link";
import { buildMetadata } from "../lib/seo";

export const metadata = buildMetadata({
  title: "Guides and Exam Strategy",
  description:
    "Actionable guides for notifications, interview preparation, salary understanding, and form accuracy.",
  path: "/guides",
  type: "CollectionPage",
  keywords: ["exam strategy guide", "notification reading guide", "sarkari preparation guides"],
});

const guideCards = [
  {
    title: "Interview Tips for Govt Jobs",
    desc: "Structured prep for panel questions, communication style, and document verification.",
    href: "/guides/interview-tips",
    focus: "Interview + DV",
  },
  {
    title: "Salary and Pay Scale Basics",
    desc: "Understand pay levels, DA/HRA, gross vs in-hand, and practical salary comparison.",
    href: "/guides/salary-info",
    focus: "Salary clarity",
  },
  {
    title: "How to Read a Notification",
    desc: "Step-by-step framework to verify eligibility, dates, fee, and official links correctly.",
    href: "/guides/notification-reading",
    focus: "Form accuracy",
  },
  {
    title: "Why SarkariAfsar Reliability Guide",
    desc: "Editorial process, source-verification policy, and correction workflow used on job pages.",
    href: "/guides/why-jobsaddah",
    focus: "Trust and policy",
  },
];

const principles = [
  "Official PDF first: every critical field should map to a source notice.",
  "Post-wise clarity: eligibility and dates must not be mixed across posts.",
  "Correction-first workflow: user-reported errors get prioritized quickly.",
  "Actionable formatting: guides should help users complete real tasks, not only read theory.",
];

export default function GuidesIndex() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">
            Guides for Serious Aspirants
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
            These guides are written for practical execution: filling forms
            correctly, preparing interviews, and avoiding common mistakes that
            cost attempts. Use them as a weekly checklist, not one-time reading.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guideCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-xs uppercase tracking-wider text-blue-700 font-bold mb-2">
                {card.focus}
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{card.desc}</p>
              <div className="mt-4 text-sm font-semibold text-blue-700">
                Read guide
              </div>
            </Link>
          ))}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Editorial quality principles
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            {principles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
