import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Refund Policy — Sarkari Afsar',
  description: 'Refund Policy for Sarkari Afsar digital products including mock tests and study material. Learn when and how to request a refund.',
  alternates: { canonical: `${SITE_URL}/refund-policy` },
  openGraph: {
    title: 'Refund Policy — Sarkari Afsar',
    url: `${SITE_URL}/refund-policy`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">›</span>
            <span>Refund Policy</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Refund Policy</h1>
          <p className="text-blue-200 text-sm">Last updated: April 2026 — Applies to all paid digital products on Sarkari Afsar</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        <Section title="1. General Policy">
          <p>We want you to be fully satisfied with your purchase on Sarkari Afsar. Because our products are digital in nature and access is granted immediately upon payment, our refund eligibility is limited as described below.</p>
          <p className="mt-2">Please read this policy carefully before making a purchase. By completing a transaction, you acknowledge and agree to these terms.</p>
        </Section>

        <Section title="2. Eligible Refund Cases">
          <p>A refund will be issued in the following situations:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li><strong>Product Not Accessible:</strong> You were charged but the purchased product was never unlocked or made available in your account, and the issue persists after 24 hours.</li>
            <li><strong>Technical Defect:</strong> The product is broken, corrupted, or completely non-functional and cannot be replaced with a working version.</li>
            <li><strong>Duplicate Payment:</strong> You were charged more than once for the same product due to a payment gateway error.</li>
            <li><strong>Wrong Product Delivered:</strong> You received a product different from what was described at the time of purchase.</li>
          </ul>
        </Section>

        <Section title="3. Non-Refundable Cases">
          <p>Refunds will <strong>NOT</strong> be issued in the following situations:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>Product has been accessed, downloaded, or exam has been started</li>
            <li>You changed your mind after purchase</li>
            <li>You found the content elsewhere at a lower price</li>
            <li>Slow internet or device issues on your end prevented access</li>
            <li>You purchased the wrong product by mistake (non-technical error)</li>
            <li>Refund request raised after 7 days of purchase date</li>
          </ul>
        </Section>

        <Section title="4. Refund Request Process">
          <p>To request a refund, email us at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a> within <strong>7 days of purchase</strong> with the following details:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Your registered email address</li>
            <li>Order / Transaction ID (found in your email receipt or dashboard)</li>
            <li>Product name</li>
            <li>Reason for refund request with screenshot (if applicable)</li>
          </ul>
          <p className="mt-3 text-sm bg-blue-50 border border-blue-200 rounded-lg p-3">Our team will review your request and respond within <strong>2–3 business days</strong>.</p>
        </Section>

        <Section title="5. Refund Processing Time">
          <p>Once a refund is approved:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>The amount will be refunded to the <strong>original payment method</strong> (credit/debit card, UPI, net banking, etc.)</li>
            <li>Processing time: <strong>5–7 business days</strong> after approval</li>
            <li>Bank processing may take an additional 2–5 business days</li>
            <li>For UPI/wallet payments, refund may reflect sooner</li>
          </ul>
          <p className="mt-3">If the refund is not received within 10 business days of approval, please contact your bank before reaching out to us again.</p>
        </Section>

        <Section title="6. Partial Refunds">
          <p>Partial refunds may be considered at our sole discretion in cases where:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Only a portion of a bundle was defective</li>
            <li>A subscription was cancelled mid-cycle (case-by-case basis)</li>
          </ul>
        </Section>

        <Section title="7. Contact Us">
          <div className="bg-[#1e3a5f] text-white rounded-2xl p-6 space-y-2">
            <p className="font-semibold text-lg">Sarkari Afsar Support Team</p>
            <p>Email: <a href="mailto:support@sarkariafsar.com" className="text-[#f59e0b] underline">support@sarkariafsar.com</a></p>
            <p>Phone: <a href="tel:+919153630507" className="text-[#f59e0b]">+91 91536 30507</a></p>
            <p className="text-blue-200 text-sm mt-2">Bakhtiyarpur Purani Bazar, Patna, Bihar — 803212</p>
            <p className="text-blue-300 text-xs mt-1">Support hours: Monday–Saturday, 10 AM – 6 PM IST</p>
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
