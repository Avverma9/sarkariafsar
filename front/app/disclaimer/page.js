import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Disclaimer | Sarkari Afsar - Important Legal Information',
  description: 'Read the official disclaimer for SarkariAfsar.com. Understand our policies regarding content accuracy, non-affiliation with government bodies, and limitation of liability.',
  alternates: { canonical: `${SITE_URL}/disclaimer` },
}

export default function DisclaimerPage() {
  const disclaimerSections = [
    {
      title: '1. General Information & Purpose',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <>
          <p>
            The information, resources, and data provided on <strong>SarkariAfsar.com</strong> ("we," "us," or "our") are intended for general informational, educational, and quick-reference purposes only. Our primary objective is to centralize, simplify, and disseminate public information regarding government employment opportunities, examination results, admit cards, and welfare schemes across India.
          </p>
          <p className="mt-3">
            While we dedicate substantial resources and human oversight to ensure that the information published is accurate, timely, and reliable, we make no explicit or implicit representations, warranties, or guarantees of any kind regarding the completeness, accuracy, reliability, validity, suitability, or availability of the information, products, services, or related graphics contained on the website for any purpose. Any reliance you place on such information is strictly and entirely at your own risk.
          </p>
        </>
      )
    },
    {
      title: '2. Strict Non-Affiliation Declaration',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />,
      content: (
        <>
          <p>
            It is imperative to understand that <strong>Sarkari Afsar is a privately owned and operated independent digital platform</strong>. We are strictly NOT affiliated, associated, authorized, endorsed by, or in any way officially connected with the Government of India, any State Governments, Union Territories, or any of their specific ministries, departments, recruitment boards (such as UPSC, SSC, RRB, IBPS), or administrative agencies.
          </p>
          <p className="mt-3">
            The use of words like "Sarkari", "Government", "Official", or the names of specific government bodies, departments, and examinations on our platform is solely for the purpose of identification and reference for the candidates. The official websites for government organizations remain the sole ultimate authority for all recruitment processes.
          </p>
        </>
      )
    },
    {
      title: '3. Government Job Data & Application Processes',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <>
          <p>
            All employment notifications, examination dates, syllabus outlines, cut-off marks, and result announcements provided on our website are meticulously sourced from public domain records, official employment newspapers, and respective government portals. However, recruitment boards frequently modify, postpone, or cancel vacancies, exam dates, and eligibility criteria without prior general notice.
          </p>
          <p className="mt-3">
            We strongly, unequivocally advise all candidates to cross-verify every critical detail—especially application deadlines, fee structures, age limits, and educational requirements—by directly reading the official PDF notifications released by the respective recruitment authorities. Sarkari Afsar shall not be held responsible for any missed deadlines, rejected applications, or financial losses incurred due to typographical errors, delayed updates, or misinterpretations of the data on our site.
          </p>
        </>
      )
    },
    {
      title: '4. AI-Generated Summaries & Content',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
      content: (
        <>
          <p>
            To enhance user experience and save time for aspirants, Sarkari Afsar employs advanced Artificial Intelligence (including Google Gemini AI) to scan extensive, complex official notification PDFs and instantly generate simplified summaries, bullet points, and Frequently Asked Questions (FAQs).
          </p>
          <p className="mt-3">
            While our editorial team periodically reviews AI-generated outputs, AI technologies are inherently susceptible to occasional inaccuracies, context misinterpretations, or "hallucinations." The AI might omit a specific regional reservation clause or misstate a highly technical physical requirement. Therefore, the AI-assisted content on our platform must be treated as an initial reading guide and not as legally binding or definitive administrative text. Always refer back to the original source document.
          </p>
        </>
      )
    },
    {
      title: '5. External Links and Third-Party Portals',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      content: (
        <>
          <p>
            Through this website, you are able to link to other websites which are not under the control of Sarkari Afsar. We provide these links solely for your convenience—for instance, direct links to apply online, download admit cards, or view official merit lists. We have no control over the nature, content, security, availability, and uptime of those external sites.
          </p>
          <p className="mt-3">
            The inclusion of any external links does not necessarily imply a recommendation or endorse the views expressed within them. Furthermore, we are not responsible if an official government server crashes, experiences high latency, or changes its URL structure resulting in broken links on our end.
          </p>
        </>
      )
    },
    {
      title: '6. No Legal, Financial, or Professional Advice',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />,
      content: (
        <>
          <p>
            The content pertaining to government welfare schemes (Yojanas), subsidies, taxation, and legal recruitment policies provided on Sarkari Afsar does not constitute, and is not intended to be a substitute for, formal legal, financial, or professional administrative advice. 
          </p>
          <p className="mt-3">
            Eligibility for government schemes and job reservations (such as OBC, SC, ST, EWS quotas) is subject to complex statutory regulations and individual circumstances. You should not act or refrain from acting on the basis of any content included on this site without seeking appropriate professional advice or contacting the concerned regional government authority directly.
          </p>
        </>
      )
    },
    {
      title: '7. Advertisements and Monetization',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />,
      content: (
        <>
          <p>
            To keep our services free for all aspirants, Sarkari Afsar monetizes the platform through third-party advertising networks, such as Google AdSense. These networks automatically deliver advertisements based on user cookies, geographic locations, and browsing behaviors.
          </p>
          <p className="mt-3">
            The appearance of third-party advertisements on our website does not constitute an endorsement, guarantee, warranty, or recommendation by Sarkari Afsar of the products, services, or educational institutions advertised. We are not responsible for false claims, misleading promotional offers, or the quality of services provided by these independent advertisers.
          </p>
        </>
      )
    },
    {
      title: '8. Limitation of Liability and Indemnification',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      content: (
        <>
          <p>
            In no event will Sarkari Afsar, its founders, employees, partners, or affiliates be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.
          </p>
          <p className="mt-3">
            By using our platform, you agree to indemnify, defend, and hold harmless Sarkari Afsar from and against any and all claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) that such parties may incur as a result of or arising from your use of the site or your violation of these terms.
          </p>
        </>
      )
    }
  ]

  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-blue-200 selection:text-[#1e3a5f]">
      
      <div className="relative bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white py-24 px-4 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <nav className="text-sm font-medium text-blue-200 mb-6 tracking-wide uppercase">
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link> &rsaquo; <span className="text-white">Disclaimer</span>
          </nav>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white drop-shadow-lg">
            Disclaimer
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-light max-w-3xl mt-4 leading-relaxed border-l-4 border-[#f59e0b] pl-4">
            Effective Date: March 2026 <br />
            Please read this document carefully before relying on the information provided on our portal. Your use of this website constitutes acceptance of this disclaimer.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        
        <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 rounded-3xl shadow-lg border border-red-100 p-8 md:p-10 mb-12 relative overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute -right-10 -top-10 text-red-500/10">
            <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-red-900 mb-3">Crucial Notice of Non-Affiliation</h2>
              <p className="text-red-800/90 text-lg leading-relaxed text-justify">
                <strong>Sarkari Afsar is NOT a Government Website.</strong> We are a fully independent educational news portal. We do not have any ties with the Government of India or any State Government. We do not claim to be a government body, nor do we represent any government entity. All logos, trademarks, and organization names mentioned on our website are the property of their respective official owners and are used here exclusively for informational dissemination.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            {disclaimerSections.map((section, index) => (
              <div key={index} className="group">
                <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-3 border-b border-gray-100 pb-3 group-hover:border-blue-200 transition-colors">
                  <span className="bg-blue-50 p-2 rounded-xl text-[#f59e0b] group-hover:bg-[#f59e0b] group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {section.icon}
                    </svg>
                  </span>
                  {section.title}
                </h2>
                <div className="text-gray-700 leading-relaxed text-base text-justify pl-2 md:pl-14">
                  {section.content}
                </div>
              </div>
            ))}

            <div className="mt-12 bg-gradient-to-br from-[#1e3a5f] to-[#152844] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 relative z-10">
                <span className="bg-white/10 p-2 rounded-xl text-[#f59e0b]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </span>
                9. Reporting Errors and Contacting Us
              </h2>
              <div className="relative z-10 space-y-4 text-blue-50 leading-relaxed text-justify mb-8">
                <p>
                  We are deeply committed to rectifying any factual inaccuracies, outdated information, or broken links swiftly. If you encounter any erroneous data regarding a job post, admit card, or scheme on Sarkari Afsar, we request you to bring it to our immediate attention.
                </p>
                <p>
                  We reserve the right to make additions, deletions, or modifications to the contents on the website at any time without prior notice. If you require further clarification regarding our disclaimer policies, please reach out to us.
                </p>
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Official Support Email</p>
                    <a href="mailto:support@sarkariafsar.com" className="font-bold text-lg hover:text-[#f59e0b] transition-colors">support@sarkariafsar.com</a>
                  </div>
                </div>
                
                <Link href="/contact" className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 whitespace-nowrap">
                  Contact Support Team
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}