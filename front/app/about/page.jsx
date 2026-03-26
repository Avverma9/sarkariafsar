import Header from "../components/header";
import Footer from "../components/footer";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "About Us",
  description:
    "Learn about SarkariAfsar — India's trusted platform for government jobs, welfare schemes, admit cards, and results.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us — SarkariAfsar",
    description:
      "Learn about SarkariAfsar — India's trusted platform for government jobs, welfare schemes, admit cards, and results.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Us — SarkariAfsar",
    description:
      "India's trusted platform for government jobs, welfare schemes, admit cards, and results.",
  },
};

export default function AboutPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-700 to-indigo-800 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center">
            <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">About SarkariAfsar</h1>
          <p className="text-violet-200 text-lg">
            Your trusted companion for government job updates, welfare schemes and career guidance across India.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">

        {/* Mission */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Mission</h2>
          <p className="text-slate-600 leading-relaxed">
            SarkariAfsar was built with a single goal — to bridge the information gap between government
            job seekers and the opportunities available to them. India has millions of aspirants who miss
            deadlines, fail to discover schemes, or find outdated information on scattered sources. We
            exist to fix that.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            We aggregate, verify, and present the latest notifications from SSC, UPSC, Railways, Banking,
            State PSCs, and Central Government departments in one clean, fast, and mobile-friendly platform.
          </p>
        </section>

        {/* What we offer */}
        <section>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">What We Offer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { title: "Government Jobs", icon: "💼", desc: "Latest job notifications from central and state governments updated daily." },
              { title: "Welfare Schemes", icon: "🏛️", desc: "Central and state government scheme details, eligibility, and how to apply." },
              { title: "News & Blogs", icon: "📰", desc: "Expert analysis, exam preparation tips, and career guidance articles." },
              { title: "Admit Cards", icon: "🪪", desc: "Timely admit card alerts so you never miss an exam." },
              { title: "Results", icon: "📋", desc: "Result notifications with direct links to official portals." },
              { title: "Answer Keys", icon: "✅", desc: "Official and unofficial answer keys for competitive exams." },
            ].map((item) => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-slate-800 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-violet-50 border border-violet-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Our Values</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex gap-3"><span className="text-violet-600 font-bold">→</span> <span><strong>Accuracy first:</strong> We only publish verified information sourced from official government portals.</span></li>
            <li className="flex gap-3"><span className="text-violet-600 font-bold">→</span> <span><strong>Speed matters:</strong> Updates go live within minutes of official announcement.</span></li>
            <li className="flex gap-3"><span className="text-violet-600 font-bold">→</span> <span><strong>Free forever:</strong> All information on this platform is and will remain free to access.</span></li>
            <li className="flex gap-3"><span className="text-violet-600 font-bold">→</span> <span><strong>Privacy respected:</strong> We do not sell user data to third parties.</span></li>
          </ul>
        </section>

        {/* CTA */}
        <section className="text-center py-8">
          <h2 className="text-xl font-bold text-slate-800 mb-3">Ready to explore opportunities?</h2>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/jobpost" className="bg-violet-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-violet-800 transition">Browse Jobs</Link>
            <Link href="/schemes" className="border border-violet-700 text-violet-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-violet-50 transition">View Schemes</Link>
            <Link href="/contact" className="text-slate-600 px-6 py-2.5 rounded-lg font-semibold hover:text-slate-900 transition underline">Contact Us</Link>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
