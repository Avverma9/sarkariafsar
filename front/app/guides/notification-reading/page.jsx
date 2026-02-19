import Link from "next/link";
import { buildMetadata } from "../../lib/seo";

export const metadata = buildMetadata({
  title: "How to Read Job Notification Properly",
  description:
    "Step-by-step method to read official job notifications and verify eligibility, age, fee, dates, and required documents.",
  path: "/guides/notification-reading",
  type: "Article",
  keywords: ["job notification guide", "eligibility check", "application checklist"],
});

const checklist = [
  "Read the official notification PDF first, then any summary page.",
  "Mark start date, last date, fee date, correction window, and exam date separately.",
  "Verify eligibility line-by-line (education, stream, age, category, experience).",
  "Check documents needed for form fill and document verification.",
  "Open official links in a new tab and confirm the same post title there.",
];

const commonMistakes = [
  "Reading only social media captions and skipping the official PDF.",
  "Using old category certificate format for a new recruitment cycle.",
  "Ignoring `as on date` in age calculation.",
  "Assuming all posts under one notification have same eligibility.",
  "Submitting payment but missing final submit confirmation page.",
];

const mustCheckSections = [
  {
    title: "1. Post Name and Advertisement Number",
    body: "Always match post name and advertisement number exactly. Similar names across different years cause confusion. Save the PDF where advertisement number is visible.",
  },
  {
    title: "2. Important Dates",
    body: "Track at least five dates: apply start, apply end, fee end, correction window, and exam/admit card date. Keep reminders 7 days and 2 days before the last date.",
  },
  {
    title: "3. Eligibility and Age",
    body: "Read each eligibility line with care. Many notifications have post-wise qualifications. Age is valid only on the cutoff date written in the notice, not on today's date.",
  },
  {
    title: "4. Fee and Payment Mode",
    body: "Verify fee by category and payment mode. After payment, download receipt. If payment fails, check bank statement and portal transaction status before paying again.",
  },
  {
    title: "5. Selection Process",
    body: "Check complete stages: written, skill test, PET/PST, interview, document verification, and medical test. Your preparation plan should follow these stages.",
  },
  {
    title: "6. Documents Required",
    body: "Prepare identity proof, educational certificates, category certificate, domicile, and photos in advance. Keep both PDF and image versions in a single folder.",
  },
];

export default function NotificationReading() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">
            How to Read a Government Job Notification
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            Most application mistakes happen before exam preparation starts.
            This guide gives you a repeatable method so you can read any job
            notice in 15-20 minutes and avoid costly errors.
          </p>
        </header>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Quick 5-Minute Pre-Check
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          {mustCheckSections.map((section) => (
            <article
              key={section.title}
              className="bg-white border border-slate-200 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {section.title}
              </h2>
              <p className="text-sm text-slate-700 leading-relaxed">
                {section.body}
              </p>
            </article>
          ))}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Common Notification Reading Mistakes
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
            {commonMistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Final Submission Checklist
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed mb-3">
            Before clicking final submit, verify personal details, category,
            documents, and payment status once more. Download the final form PDF
            and receipt. Keep them in your form-proof folder.
          </p>
          <Link
            href="/guides/interview-tips"
            className="text-sm font-semibold text-blue-700 hover:text-blue-900"
          >
            Next guide: Interview and document verification prep
          </Link>
        </section>
      </div>
    </div>
  );
}
