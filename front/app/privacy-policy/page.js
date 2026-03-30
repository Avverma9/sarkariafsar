import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy - Sarkari Afsar',
  description: 'Privacy Policy for SarkariAfsar.com - How we collect, use and protect your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Privacy Policy</span>
          </nav>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-blue-200 mt-2">Last updated: June 2025</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
          {[
            {
              title: '1. Information We Collect',
              content: 'We collect information you provide directly to us, such as your name and email when you use our contact form. We also collect usage data through cookies and analytics to improve our services.'
            },
            {
              title: '2. How We Use Your Information',
              content: 'We use the collected information to provide and improve our services, send you relevant updates about government jobs and schemes (with your consent), and respond to your inquiries.'
            },
            {
              title: '3. Google Analytics',
              content: 'We use Google Analytics to understand how visitors interact with our website. Google Analytics collects data anonymously and reports website trends without identifying individual visitors.'
            },
            {
              title: '4. Google AdSense',
              content: 'We use Google AdSense to display advertisements on our website. Google AdSense uses cookies to serve ads based on your prior visits to our website or other websites. Google\'s use of advertising cookies enables it and its partners to serve ads based on your visits. You may opt out of personalized advertising by visiting Google\'s Ads Settings.'
            },
            {
              title: '5. Cookies',
              content: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser. Third-party services (Google Analytics, Google AdSense) may also place cookies on your device.'
            },
            {
              title: '6. Data Security',
              content: 'We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.'
            },
            {
              title: '7. Third-Party Links',
              content: 'Our website contains links to official government websites and third-party sites. We are not responsible for the privacy practices of these external sites. We recommend reviewing their privacy policies.'
            },
            {
              title: '8. Children\'s Privacy',
              content: 'Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13.'
            },
            {
              title: '9. Changes to This Policy',
              content: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page with an updated date.'
            },
            {
              title: '10. Contact Us',
              content: 'If you have any questions about this Privacy Policy, please contact us at contact@sarkariafsar.com.'
            },
          ].map(section => (
            <div key={section.title}>
              <h2 className="text-base font-bold text-[#1e3a5f] mb-2">{section.title}</h2>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
