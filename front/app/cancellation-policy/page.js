import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Cancellation Policy — Sarkari Afsar',
  description: 'Cancellation Policy for Sarkari Afsar digital products including mock tests and study material.',
  alternates: { canonical: `${SITE_URL}/cancellation-policy` },
  openGraph: {
    title: 'Cancellation Policy — Sarkari Afsar',
    url: `${SITE_URL}/cancellation-policy`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function CancellationPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">›</span>
            <span>Cancellation Policy</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Cancellation Policy</h1>
          <p className="text-blue-200 text-sm">Last updated: April 2026 — Applies to all digital products on Sarkari Afsar</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        <Section title="1. Overview">
          <p>Sarkari Afsar provides digital products such as Mock Tests, Practice Question Banks, eBooks, and Study Material through our platform at sarkariafsar.com. By purchasing any product, you agree to this Cancellation Policy.</p>
        </Section>

        <Section title="2. No Cancellation After Access">
          <p>Since our products are <strong>digital and delivered instantly</strong>, cancellation is <strong>not possible once access has been granted</strong>. This includes:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Mock Tests — once unlocked or started</li>
            <li>eBooks / PDF Study Material — once download link is accessed</li>
            <li>Question Banks — once accessible from your dashboard</li>
            <li>Any other digital content delivered electronically</li>
          </ul>
          <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">This is consistent with Consumer Protection (E-Commerce) Rules, 2020 for digital goods where delivery has been completed.</p>
        </Section>

        <Section title="3. Cancellation Before Access — 24-Hour Window">
          <p>If payment was processed but you have <strong>NOT yet accessed the product</strong>, you may request cancellation within <strong>24 hours</strong> of purchase by emailing <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a> with:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Registered email address</li>
            <li>Order / Transaction ID</li>
            <li>Reason for cancellation</li>
          </ul>
          <p className="mt-3">We will respond within 2 business days. If eligible, the refund will be processed to the original payment method within 5–7 business days.</p>
        </Section>

        <Section title="4. Subscription Cancellation">
          <p>For recurring subscription plans:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Cancel anytime from your Account Dashboard → Subscriptions</li>
            <li>Cancellation takes effect at the <strong>end of the current billing period</strong></li>
            <li>No partial refunds for unused subscription time</li>
            <li>Access continues until the period ends</li>
          </ul>
        </Section>

        <Section title="5. Payment Failure / Duplicate Charges">
          <p>If you were charged twice for the same order, or if access was not granted after a successful payment, contact us immediately at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a>. We will investigate and resolve within 3 business days. Verified duplicate charges will be fully refunded.</p>
        </Section>

        <Section title="6. Contact Us">
          <div className="bg-[#1e3a5f] text-white rounded-2xl p-6 space-y-2">
            <p className="font-semibold text-lg">Sarkari Afsar Support Team</p>
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
