import Header from "../components/header";
import Footer from "../components/footer";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "Cookie Policy",
  description:
    "Learn how SarkariAfsar uses cookies and how you can manage your cookie preferences.",
  alternates: { canonical: "/cookie-policy" },
  openGraph: {
    title: "Cookie Policy — SarkariAfsar",
    description:
      "Learn how SarkariAfsar uses cookies and how you can manage your cookie preferences.",
    url: "/cookie-policy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy — SarkariAfsar",
    description: "How SarkariAfsar uses cookies and similar technologies.",
  },
};

const LAST_UPDATED = "March 26, 2026";

export default function CookiePolicyPage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Cookie Policy" }]} />
          <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800">What Are Cookies?</h2>
            <p className="text-sm">
              Cookies are small text files placed on your device when you visit a website. They help the
              website remember your preferences, improve your experience, and assist with analytics and
              advertising.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">Cookies We Use</h2>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse border border-slate-300">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Category</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Name / Provider</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Purpose</th>
                    <th className="border border-slate-300 px-4 py-2 text-left font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { cat: "Essential", name: "cookie_consent (1st party)", purpose: "Stores your cookie consent choice", duration: "1 year" },
                    { cat: "Analytics", name: "_ga, _gid (Google Analytics)", purpose: "Anonymous traffic statistics", duration: "2 years / 24 hours" },
                    { cat: "Advertising", name: "IDE, DSID (Google AdSense)", purpose: "Serve personalised ads and measure performance", duration: "Up to 13 months" },
                    { cat: "Advertising", name: "__gads (Google AdSense)", purpose: "Frequency capping and ad delivery", duration: "2 years" },
                    { cat: "Session", name: "sarkari_post_* (1st party)", purpose: "SessionStorage cache for visited post pages (not a cookie — browser memory)", duration: "Session / 30 min TTL" },
                  ].map((row) => (
                    <tr key={row.name}>
                      <td className="border border-slate-300 px-4 py-2">{row.cat}</td>
                      <td className="border border-slate-300 px-4 py-2 font-mono text-xs">{row.name}</td>
                      <td className="border border-slate-300 px-4 py-2">{row.purpose}</td>
                      <td className="border border-slate-300 px-4 py-2">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">How to Manage Cookies</h2>
            <p className="text-sm">You can control and/or delete cookies in several ways:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li><strong>Browser settings:</strong> Most browsers allow you to block or delete cookies through their settings menu (usually under Privacy or Security).</li>
              <li><strong>Google Ads preferences:</strong> Opt out of personalised advertising at <a href="https://adssettings.google.com" className="text-violet-700 underline" target="_blank" rel="noopener noreferrer">adssettings.google.com</a>.</li>
              <li><strong>Google Analytics opt-out:</strong> Install the <a href="https://tools.google.com/dlpage/gaoptout" className="text-violet-700 underline" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>.</li>
              <li><strong>Network Advertising Initiative:</strong> <a href="https://optout.networkadvertising.org/" className="text-violet-700 underline" target="_blank" rel="noopener noreferrer">optout.networkadvertising.org</a>.</li>
            </ul>
            <p className="text-sm mt-2 text-slate-500">
              Note: Disabling essential cookies may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">Third-Party Cookies</h2>
            <p className="text-sm">
              We use Google AdSense to show advertisements. Google may set cookies on your device to
              serve personalised ads based on your browsing history. We have no direct control over
              these cookies. For more information, see{' '}
              <a href="https://policies.google.com/privacy" className="text-violet-700 underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">Changes to This Policy</h2>
            <p className="text-sm">
              We may update this Cookie Policy periodically. The &quot;Last updated&quot; date at the top records
              the latest revision.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">Contact</h2>
            <p className="text-sm">
              Questions? Write to{' '}
              <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">support@sarkariafsar.com</a>
              {' '}or see our full <Link href="/privacy-policy" className="text-violet-700 underline">Privacy Policy</Link>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
