import Header from "../components/header";
import Footer from "../components/footer";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read SarkariAfsar's privacy policy to understand how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    title: "Privacy Policy — SarkariAfsar",
    description:
      "Read SarkariAfsar's privacy policy to understand how we collect, use, and protect your data.",
    url: "/privacy-policy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy — SarkariAfsar",
    description: "How SarkariAfsar collects, uses, and protects your data.",
  },
};

const LAST_UPDATED = "March 26, 2026";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]} />
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800">1. Introduction</h2>
            <p>
              SarkariAfsar (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates{' '}
              <strong>SarkariAfsar.com</strong>. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you visit our website. Please read this policy carefully.
              By using the site you agree to the practices described herein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">2. Information We Collect</h2>
            <h3 className="font-semibold text-slate-700 mt-4 mb-2">2.1 Information you provide voluntarily</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Name and email address when you submit our contact form.</li>
              <li>Any additional information you choose to include in your message.</li>
            </ul>
            <h3 className="font-semibold text-slate-700 mt-4 mb-2">2.2 Automatically collected information</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Log data: IP address, browser type, referring URL, pages visited, time and date.</li>
              <li>Device information: screen resolution, operating system, hardware model.</li>
              <li>Cookies and similar tracking technologies (see Section 6).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>To respond to contact form inquiries.</li>
              <li>To analyse and improve website performance and content.</li>
              <li>To show relevant advertising via Google AdSense.</li>
              <li>To detect, prevent, and address technical issues or abuse.</li>
              <li>To comply with applicable laws and legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">4. Sharing of Information</h2>
            <p className="text-sm">
              We do <strong>not sell</strong> your personal information. We may share data only with:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li><strong>Service providers</strong> who help us operate the website (hosting, analytics) under confidentiality agreements.</li>
              <li><strong>Advertising partners</strong> such as Google AdSense, which may use cookies to show personalised ads.</li>
              <li><strong>Law enforcement</strong> when required by applicable law or to protect our rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">5. Data Retention</h2>
            <p className="text-sm">
              Support emails and correction requests may be retained for up to 12 months. Server logs are retained for 90 days.
              You may request deletion of your data by writing to{' '}
              <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">support@sarkariafsar.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">6. Cookies</h2>
            <p className="text-sm">
              We use cookies and similar technologies to enhance your experience. Cookies used include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li><strong>Essential cookies:</strong> Required for the site to function (e.g., session management).</li>
              <li><strong>Analytics cookies:</strong> Google Analytics — anonymous traffic statistics.</li>
              <li><strong>Advertising cookies:</strong> Google AdSense — used to serve relevant ads.</li>
            </ul>
            <p className="text-sm mt-2">
              You can manage cookie preferences via our <Link href="/cookie-policy" className="text-violet-700 underline">Cookie Policy</Link> page or through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">7. Third-Party Links</h2>
            <p className="text-sm">
              Our website may contain links to official government portals and third-party sites. We are
              not responsible for the privacy practices of those sites and encourage you to read their
              privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">8. Children&apos;s Privacy</h2>
            <p className="text-sm">
              This site is not directed to children under 13. We do not knowingly collect personal
              information from children. If you believe a child has submitted personal data, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">9. Your Rights</h2>
            <p className="text-sm">Under applicable Indian privacy law (IT Act 2000 and DPDP Act 2023), you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate personal data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Withdraw consent for processing where consent was the legal basis.</li>
            </ul>
            <p className="text-sm mt-2">
              To exercise these rights, email us at{' '}
              <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">support@sarkariafsar.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">10. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top of
              this page reflects the most recent revision. Continued use of the site after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">11. Contact</h2>
            <p className="text-sm">
              For privacy-related queries write to{' '}
              <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">support@sarkariafsar.com</a>
              {' '}or use our <Link href="/contact" className="text-violet-700 underline">Contact form</Link>.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
