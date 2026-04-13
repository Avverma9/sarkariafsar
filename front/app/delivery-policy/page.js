import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Delivery Policy — Sarkari Afsar',
  description: 'Delivery Policy for Sarkari Afsar digital products. All purchases are delivered digitally with instant access after successful payment.',
  alternates: { canonical: `${SITE_URL}/delivery-policy` },
  openGraph: {
    title: 'Delivery Policy — Sarkari Afsar',
    url: `${SITE_URL}/delivery-policy`,
    siteName: 'Sarkari Afsar',
    locale: 'en_IN',
    type: 'website',
  },
}

export default function DeliveryPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <nav className="text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">›</span>
            <span>Delivery Policy</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Delivery Policy</h1>
          <p className="text-blue-200 text-sm">Last updated: April 2026 — All Sarkari Afsar products are digital</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4 items-start">
          <span className="text-3xl">⚡</span>
          <div>
            <p className="font-bold text-green-800 text-lg">100% Digital Delivery — Instant Access</p>
            <p className="text-green-700 text-sm mt-1">Sarkari Afsar sells only digital products. There is no physical shipping involved. Access is granted immediately after successful payment.</p>
          </div>
        </div>

        <Section title="1. Nature of Products">
          <p>All products sold on Sarkari Afsar are <strong>digital/electronic in nature</strong>. This includes:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Online Mock Tests</li>
            <li>PDF eBooks and Study Material</li>
            <li>Practice Question Banks</li>
            <li>Previous Year Question Papers</li>
            <li>Digital Study Guides</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">We do not sell or ship any physical products. No courier, logistics, or physical delivery is involved.</p>
        </Section>

        <Section title="2. Delivery Method & Timeline">
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="font-semibold text-gray-800">Payment Confirmation</p>
                <p className="text-sm text-gray-500">After successful payment, you receive a confirmation email within a few minutes at your registered email address.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">2</span>
              <div>
                <p className="font-semibold text-gray-800">Instant Access in Dashboard</p>
                <p className="text-sm text-gray-500">The purchased product is immediately unlocked in your Account Dashboard → My Purchases. No waiting required.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <span className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="font-semibold text-gray-800">Download / Start</p>
                <p className="text-sm text-gray-500">For eBooks: a download link is available in your dashboard. For Mock Tests: start directly from the dashboard.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="3. Email Confirmation">
          <p>Upon purchase, a confirmation email is sent to your registered email address containing:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Order / Transaction ID</li>
            <li>Product name and description</li>
            <li>Access instructions</li>
            <li>Link to your dashboard</li>
          </ul>
          <p className="mt-3 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">If you do not receive a confirmation email within 15 minutes, check your spam/junk folder. If still not received, contact us at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a>.</p>
        </Section>

        <Section title="4. Access Duration">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>One-time products</strong> (single mock tests, individual eBooks): Lifetime access unless stated otherwise on the product page.</li>
            <li><strong>Subscription plans</strong>: Access valid for the subscription period. Renew before expiry to retain continuous access.</li>
            <li>Access may be revoked without refund if Terms and Conditions are violated (e.g., account sharing).</li>
          </ul>
        </Section>

        <Section title="5. Technical Requirements">
          <p>To access our digital products, you need:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>A stable internet connection</li>
            <li>A modern web browser (Chrome, Firefox, Safari, Edge — latest versions)</li>
            <li>A PDF reader (for eBooks) — available free on all devices</li>
            <li>JavaScript enabled in your browser</li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">Sarkari Afsar is not responsible for delivery issues caused by your device, browser compatibility, or internet connection problems.</p>
        </Section>

        <Section title="6. Delivery Issues — What To Do">
          <p>If you face any of the following issues, contact us immediately:</p>
          <ul className="list-disc pl-5 mt-3 space-y-1">
            <li>Payment deducted but product not visible in dashboard</li>
            <li>Email confirmation not received after 30 minutes</li>
            <li>Download link broken or not working</li>
            <li>Mock test not loading despite payment</li>
          </ul>
          <p className="mt-3">Email: <a href="mailto:support@sarkariafsar.com" className="text-blue-600 underline">support@sarkariafsar.com</a> with your Transaction ID and registered email. We will resolve within <strong>24 business hours</strong>.</p>
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
