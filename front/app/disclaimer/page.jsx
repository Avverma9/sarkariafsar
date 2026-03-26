import Header from "../components/header";
import Footer from "../components/footer";
import Link from "next/link";
import Breadcrumb from "../components/Breadcrumb";

export const metadata = {
  title: "Disclaimer",
  description:
    "Read SarkariAfsar's disclaimer regarding the accuracy, completeness, and use of information published on this website.",
  alternates: { canonical: "/disclaimer" },
  openGraph: {
    title: "Disclaimer — SarkariAfsar",
    description:
      "SarkariAfsar's disclaimer regarding the accuracy, completeness, and use of information published on this website.",
    url: "/disclaimer",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Disclaimer — SarkariAfsar",
    description:
      "Disclaimer regarding accuracy and use of information on SarkariAfsar.",
  },
};

const LAST_UPDATED = "March 26, 2026";

export default function DisclaimerPage() {
  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-12 px-6 pt-28">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb theme="dark" items={[{ label: "Home", href: "/" }, { label: "Disclaimer" }]} />
          <h1 className="text-3xl font-bold mb-2">Disclaimer</h1>
          <p className="text-slate-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-bold text-slate-800">1. General Information Only</h2>
            <p className="text-sm">
              The information published on <strong>SarkariAfsar</strong> (&quot;the Site&quot;) is intended
              for general informational purposes only. All content — including job notifications, admit cards,
              results, answer keys, admit cards, and scheme details — is sourced from publicly available
              government portals and official notifications.
            </p>
            <p className="text-sm mt-2">
              Nothing on this Site constitutes legal, financial, career, or professional advice. You should
              always verify any information directly on the respective official government website before
              taking any action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">2. No Official Affiliation</h2>
            <p className="text-sm">
              SarkariAfsar is an independent informational website and is <strong>not affiliated with,
              endorsed by, or in any way officially connected</strong> to any government body, ministry,
              department, public sector undertaking, or recruitment board in India or elsewhere.
            </p>
            <p className="text-sm mt-2">
              All trademarks, logos, and official seals mentioned or displayed belong to their respective
              owners and are used solely for identification and reference purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">3. Accuracy of Information</h2>
            <p className="text-sm">
              While we make every effort to ensure that the information on this Site is accurate and
              up-to-date, we make <strong>no warranties or representations</strong> of any kind — express or
              implied — about the completeness, accuracy, reliability, suitability, or availability of the
              information, products, services, or related graphics.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Government notifications and exam schedules are subject to change without prior notice.</li>
              <li>Dates, vacancies, eligibility criteria, and fee structures published here may differ from the latest official notifications.</li>
              <li>Always cross-check details on the official recruitment portal or gazette notification.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">4. External Links</h2>
            <p className="text-sm">
              This Site may contain links to external websites operated by third parties, including official
              government portals, exam bodies, and other resources. These links are provided for your
              convenience only. We have no control over the content of those sites and accept no
              responsibility for them or for any loss or damage that may arise from your use of them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">5. Limitation of Liability</h2>
            <p className="text-sm">
              To the fullest extent permitted by law, SarkariAfsar, its owners, editors, and contributors
              shall not be liable for any direct, indirect, incidental, consequential, or punitive damages
              arising out of:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>Reliance on any information published on this Site.</li>
              <li>Any errors, omissions, or inaccuracies in the content.</li>
              <li>Temporary unavailability of the Site due to technical issues.</li>
              <li>Decisions made — including applications submitted — based solely on information from this Site.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">6. Advertising</h2>
            <p className="text-sm">
              SarkariAfsar displays advertisements served by third-party ad networks including Google
              AdSense. We do not endorse the products or services advertised. Advertisers are solely
              responsible for their content. If you encounter any misleading or inappropriate advertisement,
              please report it to us at{" "}
              <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">
                support@sarkariafsar.com
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">7. User Responsibility</h2>
            <p className="text-sm">
              It is your sole responsibility to verify eligibility criteria, application procedures, fees,
              and deadlines from official sources before submitting any application or making any payment.
              SarkariAfsar shall not be held responsible for missed deadlines, incorrect applications, or
              financial losses resulting from reliance on information published on this Site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">8. Changes to This Disclaimer</h2>
            <p className="text-sm">
              We reserve the right to modify this Disclaimer at any time. Changes will be effective
              immediately upon posting to this page with an updated &quot;Last updated&quot; date. Continued
              use of the Site after any changes constitutes your acceptance of the revised Disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800">9. Contact Us</h2>
            <p className="text-sm">
              If you have any questions about this Disclaimer, please contact us:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
              <li>
                Email:{" "}
                <a href="mailto:support@sarkariafsar.com" className="text-violet-700 underline">
                  support@sarkariafsar.com
                </a>
              </li>
              <li>
                Contact Page:{" "}
                <Link href="/contact" className="text-violet-700 underline">
                  sarkariafsar.com/contact
                </Link>
              </li>
            </ul>
          </section>

        </div>
      </main>

      <Footer />
    </>
  );
}
