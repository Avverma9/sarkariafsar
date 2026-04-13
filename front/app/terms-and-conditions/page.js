import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Terms and Conditions — Sarkari Afsar',
  description: 'Terms and Conditions governing the use of Sarkari Afsar platform, digital products, and services.',
  alternates: { canonical: `${SITE_URL}/terms-and-conditions` },
  openGraph: {
    title: 'Terms and Conditions — Sarkari Afsar',
    url: `${SITE_URL}/terms-and-conditions`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">›</span>
            <span>Terms and Conditions</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Terms and Conditions</h1>
          <p className="text-blue-200 text-sm">Last updated: April 2026 — Please read carefully before using our platform</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using the Sarkari Afsar website (sarkariafsar.com) or purchasing any digital product, you agree to be bound by these Terms and Conditions, our Privacy Policy, Refund Policy, and Cancellation Policy.</p>
          <p className="mt-2">If you do not agree to these terms, please do not use our platform or purchase any product.</p>
        </Section>

        <Section title="2. Services Provided">
          <p>Sarkari Afsar provides:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Free government job notifications, news, and updates</li>
            <li>Paid digital products: Mock Tests, eBooks, Question Banks, Study Material</li>
            <li>Government scheme (Yojana) information</li>
            <li>Blog articles and guides for exam preparation</li>
          </ul>
          <p className="mt-3">We reserve the right to modify, suspend, or discontinue any service at any time without prior notice.</p>
        </Section>

        <Section title="3. User Accounts">
          <p>To purchase digital products or access premium features, you must create an account. You agree to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Provide accurate and complete information during registration</li>
            <li>Keep your login credentials confidential</li>
            <li>Not share your account with any other person</li>
            <li>Notify us immediately of any unauthorized access at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a></li>
          </ul>
          <p className="mt-3">We reserve the right to terminate accounts found sharing access or violating these terms.</p>
        </Section>

        <Section title="4. Paid Digital Products — License">
          <p>When you purchase a digital product (Mock Test, eBook, etc.), you are granted a <strong>limited, non-exclusive, non-transferable, personal license</strong> to access the content for your own study purposes only.</p>
          <p className="mt-3">You may <strong>NOT</strong>:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Share, distribute, resell, or sublicense the purchased content</li>
            <li>Copy, reproduce, or create derivative works from the content</li>
            <li>Share login credentials or purchased access with others</li>
            <li>Use automated tools to download or scrape content</li>
            <li>Use the content for commercial purposes</li>
          </ul>
          <p className="mt-3 text-sm bg-red-50 border border-red-200 rounded-lg p-3">Violation of these terms may result in immediate account termination and legal action under the Copyright Act, 1957 and Information Technology Act, 2000.</p>
        </Section>

        <Section title="5. Intellectual Property Rights">
          <p>All content on Sarkari Afsar — including but not limited to text, questions, images, logos, UI design, and code — is the intellectual property of Sarkari Afsar or its licensors and is protected by applicable copyright laws.</p>
          <p className="mt-2">You may not reproduce, republish, or use any content without our explicit written permission.</p>
        </Section>

        <Section title="6. Payment Terms">
          <ul className="list-disc pl-5 space-y-2">
            <li>All prices are listed in Indian Rupees (INR) and include applicable taxes.</li>
            <li>Payments are processed through secure third-party payment gateways (Razorpay, etc.).</li>
            <li>We do not store your payment card information.</li>
            <li>A transaction confirmation will be sent to your registered email.</li>
            <li>All sales are final unless covered under our Refund Policy.</li>
          </ul>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>Sarkari Afsar is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not warrant that:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>The platform will be error-free or uninterrupted</li>
            <li>Mock test questions will appear in any actual government exam</li>
            <li>Information on government jobs/schemes is always up-to-date</li>
          </ul>
          <p className="mt-3">We are an independent information portal and are not affiliated with any government department or examination authority.</p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>To the maximum extent permitted by law, Sarkari Afsar shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform or purchase of digital products, including but not limited to loss of exam scores, data, or revenue.</p>
          <p className="mt-2">Our total liability in any case shall not exceed the amount paid by you for the relevant product.</p>
        </Section>

        <Section title="9. Governing Law & Jurisdiction">
          <p>These Terms shall be governed by the laws of India. Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of courts in <strong>Patna, Bihar, India</strong>.</p>
        </Section>

        <Section title="10. Changes to Terms">
          <p>We may update these Terms from time to time. Continued use of the platform after changes constitutes acceptance of the revised Terms. The &quot;Last updated&quot; date at the top of this page indicates when changes were last made.</p>
        </Section>

        <Section title="11. Contact Us">
          <div className="bg-[#1e3a5f] text-white rounded-2xl p-6 space-y-2">
            <p className="font-semibold text-lg">Sarkari Afsar — Legal Team</p>
            <p>Email: <a href="mailto:support@sarkariafsar.com" className="text-[#f59e0b] underline">support@sarkariafsar.com</a></p>
            <p>Phone: <a href="tel:+919153630507" className="text-[#f59e0b]">+91 91536 30507</a></p>
            <p className="text-blue-200 text-sm mt-2">Bakhtiyarpur Purani Bazar, Patna, Bihar — 803212</p>
          </div>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-[#1e3a5f] mb-4 pb-3 border-b border-gray-100">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </div>
  )
}
