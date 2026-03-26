import Header from "../components/header";
import Footer from "../components/footer";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "Terms of Service",
  description:
    "Read SarkariAfsar's terms of service governing the use of our website and content.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service — SarkariAfsar",
    description:
      "Read SarkariAfsar's terms of service governing the use of our website and content.",
    url: "/terms",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — SarkariAfsar",
    description: "Terms governing the use of SarkariAfsar website.",
  },
};

const LAST_UPDATED = "March 26, 2026";

export default function TermsPage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Terms of Service" }]} />
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800">1. Acceptance of Terms</h2>
            <p className="text-sm">
              By accessing or using SarkariAfsar (&quot;the Site&quot;), you agree to be bound by these Terms of
              Service and our <Link href="/privacy-policy" className="text-violet-700 underline">Privacy Policy</Link>.
              If you do not agree to these terms, please discontinue use of the Site immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">2. Nature of Information</h2>
            <p className="text-sm">
              SarkariAfsar aggregates publicly available government notifications and informational content
              for general awareness. While we strive for accuracy:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Content is provided for informational purposes only and does not constitute legal or career advice.</li>
              <li>Always verify information on the respective official government portal before taking any action.</li>
              <li>We are not responsible for decisions made purely on the basis of information found on this Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">3. Intellectual Property</h2>
            <p className="text-sm">
              All original content on SarkariAfsar — including text, graphics, logos, UI designs, and
              editorial compilations — is the intellectual property of SarkariAfsar and is protected
              under Indian copyright law. Government notifications reproduced here remain the property
              of the respective government bodies.
            </p>
            <p className="text-sm mt-2">
              You may not reproduce, redistribute, or commercially exploit content from this Site without
              prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">4. User Conduct</h2>
            <p className="text-sm">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Use the Site for any unlawful purpose or in violation of any regulations.</li>
              <li>Attempt to gain unauthorised access to any portion of the Site or its related systems.</li>
              <li>Transmit any malicious code, viruses, or disruptive data.</li>
              <li>Scrape or systematically extract data without written permission.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">5. Third-Party Links & Services</h2>
            <p className="text-sm">
              The Site may link to external government portals and third-party websites. These links are
              provided for convenience only. SarkariAfsar has no control over, and assumes no
              responsibility for, the content or practices of any third-party sites.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">6. Advertising</h2>
            <p className="text-sm">
              We display advertisements through Google AdSense and may display other third-party ads.
              Advertisers are responsible for the accuracy of their advertisements. We are not liable
              for any interactions between users and advertisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">7. Disclaimer of Warranties</h2>
            <p className="text-sm">
              THE SITE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
              SarkariAfsar DOES NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE
              FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">8. Limitation of Liability</h2>
            <p className="text-sm">
              To the maximum extent permitted by law, SarkariAfsar shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the Site
              or reliance on the information presented therein.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">9. Governing Law</h2>
            <p className="text-sm">
              These Terms are governed by the laws of India. Any disputes arising shall be subject to the
              exclusive jurisdiction of the courts located in Noida, Uttar Pradesh, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">10. Changes to Terms</h2>
            <p className="text-sm">
              We reserve the right to modify these Terms at any time. The &quot;Last updated&quot; date reflects
              the most recent revision. Continued use of the Site after changes constitutes your acceptance
              of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">11. Contact</h2>
            <p className="text-sm">
              Questions about these Terms? Write to{' '}
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
