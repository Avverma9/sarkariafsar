import Link from "next/link";

const videos = [
  {
    title: "How we verify recruitment notifications before publishing",
    href: "/guides/notification-reading",
    tag: "Verification",
  },
  {
    title: "Interview and document-check checklist for aspirants",
    href: "/guides/interview-tips",
    tag: "Interview",
  },
  {
    title: "Salary and pay-scale decoding made simple",
    href: "/guides/salary-info",
    tag: "Salary",
  },
];

export default function VlogSpotlight() {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Learning Spotlight</h2>
      <p className="text-sm text-slate-700 leading-relaxed mb-4">
        Prefer short explainers? Start with these practical guides that reduce mistakes
        in forms, interview preparation, and salary understanding.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition"
          >
            <div className="text-xs uppercase tracking-wide text-blue-700 font-bold mb-2">
              {item.tag}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 leading-relaxed">{item.title}</h3>
            <div className="mt-3 text-xs font-semibold text-blue-700">Read now</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
