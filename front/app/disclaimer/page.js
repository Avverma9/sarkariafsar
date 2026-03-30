import Link from 'next/link'

export const metadata = {
  title: 'Disclaimer - Sarkari Afsar',
  description: 'Disclaimer for SarkariAfsar.com - Important notices about content accuracy and usage.',
}

export default function DisclaimerPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Disclaimer</span>
          </nav>
          <h1 className="text-3xl font-bold">Disclaimer</h1>
          <p className="text-blue-200 mt-2">Last updated: June 2025</p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6 text-gray-600 text-sm leading-relaxed">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl">
            <p className="text-amber-800 font-medium">⚠️ Important Notice: Sarkari Afsar is an independent information portal and is NOT affiliated with any government department, ministry, or agency of the Government of India or any State Government.</p>
          </div>
          {[
            {
              title: '1. General Disclaimer',
              content: 'The information provided on SarkariAfsar.com is for general informational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or suitability of the information. Any reliance you place on such information is strictly at your own risk.'
            },
            {
              title: '2. Government Job Information',
              content: 'All government job notifications, results, admit cards, and related information provided on this website are sourced from official government websites and reliable third-party sources. Candidates are strongly advised to verify all information from the official government websites before taking any action, including applying for positions.'
            },
            {
              title: '3. AI-Generated Content',
              content: 'Some content on this website is generated or assisted by Artificial Intelligence (Google Gemini AI). While we review AI-generated content for accuracy, it may occasionally contain errors or outdated information. Please always verify AI-generated summaries and FAQs from official sources.'
            },
            {
              title: '4. Affiliate & Advertisement Disclaimer',
              content: 'This website may display advertisements through Google AdSense and may contain affiliate links. We may receive compensation from these advertisements and affiliate partnerships. This does not influence our editorial content or recommendations.'
            },
            {
              title: '5. External Links',
              content: 'Our website contains links to external government websites and third-party sites. These links are provided for your convenience. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.'
            },
            {
              title: '6. No Legal Advice',
              content: 'Nothing on this website constitutes legal, financial, or professional advice. For specific guidance regarding government schemes, job applications, or legal matters, please consult qualified professionals or the relevant government departments.'
            },
            {
              title: '7. Limitation of Liability',
              content: 'SarkariAfsar.com shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of or inability to use this website or its content.'
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
