import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Privacy Policy | Sarkari Afsar',
  description: 'Comprehensive Privacy Policy for SarkariAfsar.com outlining how we collect, safeguard, and utilize your personal and non-personal data.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
  openGraph: {
    title: 'Privacy Policy — Sarkari Afsar',
    description: 'How Sarkari Afsar collects, safeguards, and utilizes your personal and non-personal data.',
    url: `${SITE_URL}/privacy-policy`,
    siteName: 'Sarkari Afsar',
    images: [{ url: `${SITE_URL}/api/og?title=Privacy+Policy&type=legal`, width: 1200, height: 630, alt: 'Privacy Policy — Sarkari Afsar' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Privacy Policy — Sarkari Afsar', description: 'How Sarkari Afsar collects, safeguards, and utilizes your personal and non-personal data.', site: '@sarkariafsar' },
}

export default function PrivacyPolicyPage() {
  const policySections = [
    {
      title: '1. Introduction & General Overview',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <>
          <p>
            Welcome to Sarkari Afsar (accessible from https://sarkariafsar.com). At Sarkari Afsar, the privacy of our visitors is of extreme importance to us. This comprehensive Privacy Policy document outlines the types of personal and non-personal information that is received, collected, and recorded by Sarkari Afsar, and how we strictly utilize it to enhance your experience.
          </p>
          <p className="mt-3">
            By accessing and using our website, you hereby consent to our Privacy Policy and agree to its terms. This policy applies solely to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Sarkari Afsar. This policy is not applicable to any information collected offline or via channels other than this website.
          </p>
        </>
      )
    },
    {
      title: '2. Information We Collect',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      content: (
        <>
          <p>
            We collect several different types of information for various purposes to provide and improve our service to you. The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li><strong>Personal Information:</strong> If you contact us directly via email or contact forms, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
            <li><strong>Log Files:</strong> Sarkari Afsar follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.</li>
            <li><strong>Device Information:</strong> We may collect data about the device you are using to access our portal, including hardware models, operating systems, and mobile network information.</li>
          </ul>
        </>
      )
    },
    {
      title: '3. How We Use Your Information',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      content: (
        <>
          <p>We use the information we collect in various ways, including to:</p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li>Provide, operate, and maintain our website seamlessly.</li>
            <li>Improve, personalize, and expand our website layout and content delivery.</li>
            <li>Understand and analyze how you use our website to create better features for job aspirants.</li>
            <li>Develop new products, services, features, and functionality based on user demand.</li>
            <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website.</li>
            <li>Find and prevent fraudulent activities, spam, and technical bugs.</li>
          </ul>
        </>
      )
    },
    {
      title: '4. Cookies and Web Beacons',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      content: (
        <>
          <p>
            Like any other professional website, Sarkari Afsar uses 'cookies'. These cookies are used to store information including visitors' preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users' experience by customizing our web page content based on visitors' browser type and/or other information.
          </p>
          <p className="mt-3">
            You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
          </p>
        </>
      )
    },
    {
      title: '5. Google Analytics & AdSense',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />,
      content: (
        <>
          <p>
            We use third-party vendors, including Google, to analyze traffic and serve ads based on a user's prior visits to our website or other websites.
          </p>
          <ul className="list-disc pl-5 mt-3 space-y-2">
            <li><strong>Google Analytics:</strong> This tool helps us understand how our audience interacts with our site. It collects information anonymously and reports website trends without identifying individual visitors.</li>
            <li><strong>Google DoubleClick DART Cookie:</strong> Google is one of a third-party vendor on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to www.sarkariafsar.com and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy.</li>
          </ul>
        </>
      )
    },
    {
      title: '6. Data Security Measures',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      content: (
        <>
          <p>
            We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it. Our website is encrypted using SSL (Secure Socket Layer) technology to ensure that all data passed between the web server and browsers remains private and integral.
          </p>
          <p className="mt-3">
            However, please remember that no method of transmission over the internet, or method of electronic storage is 100% secure and reliable, and we cannot guarantee its absolute security. In the event of a data breach, we are committed to notifying users promptly in accordance with applicable laws.
          </p>
        </>
      )
    },
    {
      title: '7. Third-Party Privacy Policies & External Links',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />,
      content: (
        <>
          <p>
            Sarkari Afsar's primary function is to provide information regarding government jobs and welfare schemes. Consequently, our site contains numerous external links pointing strictly to official government portals, recruitment boards, and application forms. 
          </p>
          <p className="mt-3">
            Sarkari Afsar's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers or government portals for more detailed information. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
          </p>
        </>
      )
    },
    {
      title: '8. Children\'s Information',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      content: (
        <>
          <p>
            Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.
          </p>
          <p className="mt-3">
            Sarkari Afsar does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.
          </p>
        </>
      )
    },
    {
      title: '9. Changes to This Privacy Policy',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      content: (
        <>
          <p>
            We may update our Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Thus, we advise you to review this page periodically for any changes. We will notify you of any changes by posting the new Privacy Policy on this page.
          </p>
          <p className="mt-3">
            These changes are effective immediately, after they are posted on this page. Your continued use of the website following the posting of changes to this policy will be deemed your acceptance of those changes.
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
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link> &rsaquo; <span className="text-white">Privacy Policy</span>
          </nav>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white drop-shadow-lg">
            Privacy Policy
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-light max-w-3xl mt-4 leading-relaxed border-l-4 border-[#f59e0b] pl-4">
            Effective Date: March 2026 <br />
            We respect your privacy and are committed to protecting your personal data while providing you with the fastest updates on government employment.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-12 space-y-12">
            
            {policySections.map((section, index) => (
              <div key={index} className="group">
                <h2 className="text-2xl font-bold text-[#1e3a5f] mb-4 flex items-center gap-3 border-b border-gray-100 pb-3 group-hover:border-blue-200 transition-colors">
                  <span className="bg-blue-50 p-2 rounded-xl text-[#f59e0b] group-hover:bg-[#f59e0b] group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {section.icon}
                    </svg>
                  </span>
                  {section.title}
                </h2>
                <div className="text-gray-600 leading-relaxed text-base text-justify pl-2 md:pl-14">
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
                10. Contacting Us Regarding Your Privacy
              </h2>
              <div className="relative z-10 space-y-4 text-blue-50 leading-relaxed text-justify mb-8">
                <p>
                  If you have any questions, concerns, or requests regarding this Privacy Policy, or if you wish to exercise any of your data protection rights, please do not hesitate to contact our dedicated support team. We take your privacy concerns seriously and will respond comprehensively.
                </p>
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Email</p>
                    <a href="mailto:support@sarkariafsar.com" className="font-bold text-lg hover:text-[#f59e0b] transition-colors">support@sarkariafsar.com</a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Phone</p>
                    <a href="tel:+919153630507" className="font-bold text-lg hover:text-[#f59e0b] transition-colors">+91 91536 30507</a>
                  </div>
                </div>

                <div className="flex items-start gap-4 md:col-span-2 pt-2 border-t border-white/10">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider font-semibold mb-1">Mailing Address</p>
                    <p className="font-medium text-base leading-snug">
                      Sarkari Afsar Headquarters<br />
                      Bakhtiyarpur Purani Bazar, Pin Code: 803212<br />
                      Patna, Bihar, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}